/*
 * Copyright (c) 2014, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_signature_verify.c.inc: Sonos digital signature format
 *                               verification and parsing
 *
 * !!NOTE!! this file is meant to be pulled in with #include after the
 * including project has defined some macros:
 *      SS_MAX_DIGEST_LENGTH
 *      SS_MEMSET(d, c, n)
 */

#include "sonos_signature_common.h"
#include "sonos_signature_verify.h"
#include "sonos_nasn_parse.h"

static int
parseSonosSignatureSignerInfo(SonosSignatureSignerInfo *si,
                              const uint8_t **buf_p,
                              const uint8_t *end)
{
    const uint8_t *buf = *buf_p;

    GET_INT_BOUNDED(si->keyIdLen, SS_MAX_KEYID_LEN);
    GET_ENUM(si->keyIdScheme, sonosSignatureIsValidKeyIdentifierScheme);
    GET_BUF(si->keyId, si->keyIdLen);
    GET_ENUM(si->digestAlg, sonosSignatureIsValidDigestAlg);
    GET_ENUM(si->signatureAlg, sonosSignatureIsValidSignatureAlg);
    GET_INT_BOUNDED(si->sigLen, SS_MAX_SIG_LEN);
    GET_BUF(si->signature, si->sigLen);

    *buf_p = buf;
    return 1;
}

size_t
sonosSignatureParse(SonosSignature *sig, const uint8_t *buf, size_t bufLen)
{
    const uint8_t *start = buf;
    const uint8_t *end = buf + bufLen;
    uint8_t i8;
    uint32_t i32;

    SS_MEMSET(sig, 0, sizeof(*sig));

    GET_INT(sig->magic);
    if (sig->magic != SS_MAGIC) {
        return 0;
    }

    GET_INT_BOUNDED(sig->totalLen, bufLen);

    GET_INT(sig->versionMajor);
    if (sig->versionMajor != SS_VERSION_MAJOR) {
        return 0;
    }
    GET_INT(sig->versionMinor);

    GET_INT_BOUNDED(sig->numUnsignedAttrs, SS_MAX_NUM_UNSIGNED_ATTRS);
    for (i32 = 0; i32 < sig->numUnsignedAttrs; i32++) {
        if (!sonosAttributeParse(&sig->unsignedAttrs[i32], &buf, end)) {
            return 0;
        }
    }

    GET_INT_BOUNDED(sig->numSignedAttrs, SS_MAX_NUM_SIGNED_ATTRS);
    for (i32 = 0; i32 < sig->numSignedAttrs; i32++) {
        if (!sonosAttributeParse(&sig->signedAttrs[i32], &buf, end)) {
            return 0;
        }
    }

    if (sonosHasDuplicateAttribute(sig->numUnsignedAttrs,
                                   sig->unsignedAttrs,
                                   sig->numSignedAttrs,
                                   sig->signedAttrs)) {
        return 0;
    }

    GET_INT_BOUNDED(sig->numSigners, SS_MAX_NUM_SIGNERS);
    if (sig->numSigners == 0) {
        return 0;
    }
    for (i8 = 0; i8 < sig->numSigners; i8++) {
        if (!parseSonosSignatureSignerInfo(&sig->signerInfos[i8],
                                           &buf, end)) {
            return 0;
        }
    }

    if (((size_t)(buf - start)) > sig->totalLen) {
        return 0;
    }

    return sig->totalLen;
}

int
sonosSignatureVerifyInternal(const SonosSignature *sig,
                     SonosHashCallback hash,
                     SonosRawVerifyCallback rawVerify,
                     SonosKeyLookupCallback keyLookup,
                     const void *keyLookupArg,
                     SonosKeyReleaseCallback keyRelease,
                     const uint8_t *msg, size_t msgLen,
                     SonosContentType_t contentType,
                     int relaxContentTypeSigs)
{
    unsigned char digest[SS_MAX_DIGEST_LENGTH];
    size_t digestLen = sizeof digest;
    const SonosSignatureSignerInfo *si = NULL;
    SonosSigningKey_t key = NULL;
    uint8_t i;

    for (i = 0; key == NULL && i < sig->numSigners; i++) {
        si = &sig->signerInfos[i];
        key = keyLookup(keyLookupArg, si->keyIdScheme,
                        si->keyId, si->keyIdLen);
    }

    if (key == NULL) {
        return 0;
    }
    else {
        if (keyRelease) {
            keyRelease(key);
        }
    }

    if (!hash(si->digestAlg, msg, msgLen, digest, &digestLen)) {
        return 0;
    }

    return sonosSignatureVerifyFromDigestInternal(sig, hash, rawVerify,
                                          keyLookup, keyLookupArg, keyRelease,
                                          si->digestAlg, digest, digestLen,
                                          contentType, relaxContentTypeSigs);
}

int
sonosSignatureVerify(const SonosSignature *sig,
                     SonosHashCallback hash,
                     SonosRawVerifyCallback rawVerify,
                     SonosKeyLookupCallback keyLookup,
                     const void *keyLookupArg,
                     SonosKeyReleaseCallback keyRelease,
                     const uint8_t *msg, size_t msgLen,
                     SonosContentType_t contentType)
{
    return sonosSignatureVerifyInternal(sig, hash, rawVerify,
                                        keyLookup, keyLookupArg, keyRelease,
                                        msg, msgLen, contentType,
#ifdef SONOS_ARCH_ATTR_ACCEPT_LEGACY_CONTENT_TYPE_SIGS
                                        1
#else
                                        0
#endif
                                        );
}

int
sonosSignatureVerifyFromDigestInternal(const SonosSignature *sig,
                               SonosHashCallback hash,
                               SonosRawVerifyCallback rawVerify,
                               SonosKeyLookupCallback keyLookup,
                               const void *keyLookupArg,
                               SonosKeyReleaseCallback keyRelease,
                               SonosDigestAlg_t digestAlg,
                               const uint8_t *digest, size_t digestLen,
                               SonosContentType_t contentType,
                               int relaxContentTypeSigs)
{
    uint8_t signedAttrsDigest[SS_MAX_DIGEST_LENGTH];
    const SonosSignatureSignerInfo *si = NULL;
    const uint8_t *digestToCheck = digest;
    SonosSigningKey_t key = NULL;
    int result = 0;
    uint8_t i8;

    for (i8 = 0; key == NULL && i8 < sig->numSigners; i8++) {
        si = &sig->signerInfos[i8];
        key = keyLookup(keyLookupArg, si->keyIdScheme,
                        si->keyId, si->keyIdLen);
    }

    if (key == NULL) {
        goto end;
    }

    if (!sonosSignatureIsValidDigestAlg(digestAlg) ||
        SONOS_DIGEST_ALG_LEN(digestAlg) != digestLen ||
        digestAlg != si->digestAlg) {
        goto end;
    }

    if (sig->numSignedAttrs > 0 ) {
        SonosAttributeMessageDigest md;
        size_t signedAttrsDigestLen = sizeof signedAttrsDigest;

        if (!sonosSignatureGetMessageDigest(&md, sig) ||
            md.alg != digestAlg ||
            memcmp(md.digest, digest, digestLen) != 0) {
            goto end;
        }

        if (!sonosSignatureHashSignedAttributes(sig, hash, digestAlg,
                                                signedAttrsDigest,
                                                &signedAttrsDigestLen) ||
            signedAttrsDigestLen != digestLen) {
            goto end;
        }

        digestToCheck = signedAttrsDigest;
    }

    if (!rawVerify(key, si->digestAlg, si->signatureAlg,
                   digestToCheck, digestLen,
                   si->signature, si->sigLen)) {
        goto end;
    }

    if (contentType != SONOS_CT_INVALID) {
        SonosAttributeContentType ct;

        if (!sonosSignatureGetContentType(&ct, sig) ||
            ct.contentType != contentType) {
            if (!relaxContentTypeSigs || sig->numSignedAttrs > 0)
                goto end;
        }
    }

    result = 1;

end:
    if (key && keyRelease) {
        keyRelease(key);
    }

    return result;
}

int
sonosSignatureVerifyFromDigest(const SonosSignature *sig,
                               SonosHashCallback hash,
                               SonosRawVerifyCallback rawVerify,
                               SonosKeyLookupCallback keyLookup,
                               const void *keyLookupArg,
                               SonosKeyReleaseCallback keyRelease,
                               SonosDigestAlg_t digestAlg,
                               const uint8_t *digest, size_t digestLen,
                               SonosContentType_t contentType)
{
    return sonosSignatureVerifyFromDigestInternal(sig, hash, rawVerify,
                                                  keyLookup, keyLookupArg,
                                                  keyRelease, digestAlg,
                                                  digest, digestLen,
                                                  contentType,
#ifdef SONOS_ARCH_ATTR_ACCEPT_LEGACY_CONTENT_TYPE_SIGS
                                                  1
#else
                                                  0
#endif
                                                  );
}

static int
sonosSignatureGetSignedAttribute(void *attr,
                                 const SonosSignature *sig,
                                 uint32_t attrId,
                                 size_t maxAttrLen)
{
    uint32_t i;

    for (i = 0; i < sig->numSignedAttrs; i++) {
        const SonosAttribute *a = &sig->signedAttrs[i];

        if ((a->attributeId & ~SONOS_ATTR_CRIT_BIT) == attrId &&
            a->attributeValueLen <= maxAttrLen) {
            memcpy(attr, a->attributeValue, a->attributeValueLen);
            return 1;
        }
    }

    return 0;
}

int
sonosSignatureGetContentType(SonosAttributeContentType *ct,
                             const SonosSignature *sig)
{
    return sonosSignatureGetSignedAttribute(ct, sig,
                                            SONOS_ATTR_ID_CONTENT_TYPE,
                                            sizeof(*ct));
}

int
sonosSignatureGetMessageDigest(SonosAttributeMessageDigest *md,
                               const SonosSignature *sig)
{
    return sonosSignatureGetSignedAttribute(md, sig,
                                            SONOS_ATTR_ID_MESSAGE_DIGEST,
                                            sizeof(*md));
}

int
sonosSignatureGetSrkRevoke(SonosAttributeSrkRevoke *sr,
                           const SonosSignature *sig)
{
    return sonosSignatureGetSignedAttribute(sr, sig,
                                            SONOS_ATTR_ID_SRK_REVOKE,
                                            sizeof(*sr));
}

