/*
 * Copyright (c) 2014, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_signature_sign.c.inc: Sonos digital signature format
 *                             creation and serialization
 *
 * !!NOTE!! this file is meant to be pulled in with #include after the
 * including project has defined some macros:
 *      SS_MAX_DIGEST_LENGTH
 *      SS_MEMSET(d, c, n)
 *      SS_SIZET_MAX
 *      NULL
 */

#include "sonos_signature_common.h"
#include "sonos_signature_sign.h"
#include "sonos_nasn_serialize.h"
#include "sonos_attr.h"

static int
serializeSonosSignatureSignerInfo(const SonosSignatureSignerInfo *si,
                                  uint8_t **buf_p,
                                  const uint8_t *end)
{
    uint8_t *buf = *buf_p;

    PUT_INT_BOUNDED(si->keyIdLen, SS_MAX_KEYID_LEN);
    PUT_ENUM(si->keyIdScheme, sonosSignatureIsValidKeyIdentifierScheme);
    PUT_BUF(si->keyId, si->keyIdLen);
    PUT_ENUM(si->digestAlg, sonosSignatureIsValidDigestAlg);
    PUT_ENUM(si->signatureAlg, sonosSignatureIsValidSignatureAlg);
    PUT_INT_BOUNDED(si->sigLen, SS_MAX_SIG_LEN);
    PUT_BUF(si->signature, si->sigLen);

    *buf_p = buf;
    return 1;
}

size_t
sonosSignatureSerialize(const SonosSignature *sig,
                        uint8_t *buf, size_t bufLen)
{
    const uint8_t *start = buf;
    const uint8_t *end;
    uint8_t i8;
    uint32_t i32;
    size_t serializedLen = 0;
    int dryRun = buf == NULL;

    if (dryRun) {
        bufLen = SS_SIZET_MAX;
        end = NULL;
    }
    else {
        end = buf + bufLen;
    }

    PUT_INT(sig->magic);
    if (sig->magic != SS_MAGIC) {
        return 0;
    }

    PUT_INT_BOUNDED(sig->totalLen, bufLen);

    PUT_INT(sig->versionMajor);
    if (sig->versionMajor != SS_VERSION_MAJOR) {
        return 0;
    }
    PUT_INT(sig->versionMinor);

    PUT_INT_BOUNDED(sig->numUnsignedAttrs, SS_MAX_NUM_UNSIGNED_ATTRS);
    for (i32 = 0; i32 < sig->numUnsignedAttrs; i32++) {
        if (!sonosAttributeSerialize(&sig->unsignedAttrs[i32], &buf, end)) {
            return 0;
        }
    }

    PUT_INT_BOUNDED(sig->numSignedAttrs, SS_MAX_NUM_SIGNED_ATTRS);
    for (i32 = 0; i32 < sig->numSignedAttrs; i32++) {
        if (!sonosAttributeSerialize(&sig->signedAttrs[i32], &buf, end)) {
            return 0;
        }
    }

    PUT_INT_BOUNDED(sig->numSigners, SS_MAX_NUM_SIGNERS);
    if (sig->numSigners == 0) {
        return 0;
    }
    for (i8 = 0; i8 < sig->numSigners; i8++) {
        if (!serializeSonosSignatureSignerInfo(&sig->signerInfos[i8],
                                               &buf, end)) {
            return 0;
        }
    }

    serializedLen = buf - start;

    /*
     * In a real run check that totalLen field matches the total serialized
     * length.  We skip this check in the dry run as the dry run feature's
     * main purpose is for the caller to figure out what to set that field to
     * (it may not contain a valid value here).
     */
    if (!dryRun && serializedLen != sig->totalLen) {
        return 0;
    }

    return serializedLen;
}

int
sonosSignatureCreate(SonosSignature *sig,
                     SonosHashCallback hash,
                     SonosRawSignCallback rawSign,
                     SonosDigestAlg_t digestAlg,
                     SonosSignatureAlg_t sigAlg,
                     SonosSigningKey_t key,
                     SonosKeyIdentifierScheme_t keyIdScheme,
                     const uint8_t *keyId,
                     uint32_t keyIdLen,
                     const uint8_t *msg, size_t msgLen,
                     SonosContentType_t contentType,
                     SonosSrkRevoke_t srkRevoke)
{
    unsigned char digest[SS_MAX_DIGEST_LENGTH];
    size_t digestLen = sizeof digest;

    if (!hash(digestAlg, msg, msgLen, digest, &digestLen)) {
        return 0;
    }

    return sonosSignatureCreateFromDigest(sig, hash, rawSign, digestAlg, sigAlg,
                                          key, keyIdScheme, keyId, keyIdLen,
                                          digest, digestLen, contentType,
                                          srkRevoke);
}

int
sonosSignatureCreateFromDigest(SonosSignature *sig,
                               SonosHashCallback hash,
                               SonosRawSignCallback rawSign,
                               SonosDigestAlg_t digestAlg,
                               SonosSignatureAlg_t sigAlg,
                               SonosSigningKey_t key,
                               SonosKeyIdentifierScheme_t keyIdScheme,
                               const uint8_t *keyId,
                               uint32_t keyIdLen,
                               const uint8_t *digest, size_t digestLen,
                               SonosContentType_t contentType,
                               SonosSrkRevoke_t srkRevoke)
{
    SonosSignatureSignerInfo *si;
    uint8_t signedAttrsDigest[SS_MAX_DIGEST_LENGTH];
    const uint8_t *digestToSign = digest;

    SS_MEMSET(sig, 0, sizeof(*sig));

    sig->magic = SS_MAGIC;
    /* totalLen has to be filled out at the end */
    sig->versionMajor = SS_VERSION_MAJOR;
    sig->versionMinor = SS_VERSION_MINOR;
    sig->numSigners = 1;
    si = &sig->signerInfos[0];

    if (!sonosSignatureIsValidKeyIdentifierScheme(keyIdScheme) ||
        keyIdLen > SS_MAX_KEYID_LEN) {
        return 0;
    }
    si->keyIdScheme = keyIdScheme;
    si->keyIdLen = keyIdLen;
    SONOS_NASN_MEMCPY(si->keyId, keyId, si->keyIdLen);
    si->digestAlg = digestAlg;
    si->signatureAlg = sigAlg;
    si->sigLen = SS_MAX_SIG_LEN;

    if (!sonosSignatureIsValidDigestAlg(digestAlg) ||
        SONOS_DIGEST_ALG_LEN(digestAlg) != digestLen) {
        return 0;
    }

    /*
     * Use signed attributes if the caller is using one of them
     */
    if (contentType != SONOS_CT_INVALID || srkRevoke != SONOS_SR_NONE) {
        SonosAttribute *sa;
        SonosAttributeMessageDigest md;
        size_t signedAttrsDigestLen = sizeof signedAttrsDigest;

        /* add the message digest attribute */
        sa = &sig->signedAttrs[(sig->numSignedAttrs)++];
        sa->attributeId = SONOS_ATTR_ID_MESSAGE_DIGEST;
        sa->attributeValueLen = sizeof(SonosDigestAlg_t) + digestLen;
        md.alg = digestAlg;
        memcpy(md.digest, digest, digestLen);
        memcpy(sa->attributeValue, &md, sa->attributeValueLen);

        if (contentType != SONOS_CT_INVALID) {
            /* add the content type attribute */
            SonosAttributeContentType ct;

            sa = &sig->signedAttrs[(sig->numSignedAttrs)++];
            sa->attributeId = SONOS_ATTR_ID_CONTENT_TYPE;
            sa->attributeValueLen = sizeof ct;
            ct.contentType = contentType;
            memcpy(sa->attributeValue, &ct, sa->attributeValueLen);
        }

        if (srkRevoke != SONOS_SR_NONE) {
            /* add the SRK revoke attribute */
            SonosAttributeSrkRevoke sr;

            sa = &sig->signedAttrs[(sig->numSignedAttrs)++];
            sa->attributeId = SONOS_ATTR_ID_SRK_REVOKE | SONOS_ATTR_CRIT_BIT;
            sa->attributeValueLen = sizeof sr;
            sr.srkRevokeFuse = srkRevoke;
            memcpy(sa->attributeValue, &sr, sa->attributeValueLen);
        }

        /* compute the digest of the signed attributes */
        if (!sonosSignatureHashSignedAttributes(sig, hash, digestAlg,
                                                signedAttrsDigest,
                                                &signedAttrsDigestLen) ||
            signedAttrsDigestLen != digestLen) {
            return 0;
        }
        digestToSign = signedAttrsDigest;
    }

    if (!rawSign(key, digestAlg, sigAlg, digestToSign, digestLen,
                 si->signature, &si->sigLen)) {
        return 0;
    }

    sig->totalLen = sonosSignatureSerialize(sig, NULL, 0);
    if (sig->totalLen == 0) {
        return 0;
    }

    /*
     * hack: always align total size to 4 for now using a padding attribute
     * if necessary
     */
    {
        uint8_t alignment = 4;
        if (sig->totalLen % alignment != 0) {
            /* adding an attribute adds length right away for id/len fields */
            uint32_t extra = (sig->totalLen +
                              sizeof(sig->unsignedAttrs[0].attributeId) +
                              sizeof(sig->unsignedAttrs[0].attributeValueLen)) %
                             alignment;
            sig->numUnsignedAttrs = 1;
            sig->unsignedAttrs[0].attributeId = SONOS_ATTR_ID_PADDING;
            sig->unsignedAttrs[0].attributeValueLen = alignment - extra;

            /*
             * We don't need to recompute the hash or signature (this attribute
             * is unsigned), but we do need to recompute the length.
             */
            sig->totalLen = 0;
            sig->totalLen = sonosSignatureSerialize(sig, NULL, 0);
            if (sig->totalLen == 0 || sig->totalLen % alignment != 0) {
                return 0;
            }
        }
    }

    return 1;
}
