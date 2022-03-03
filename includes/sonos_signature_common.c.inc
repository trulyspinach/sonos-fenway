/*
 * Copyright (c) 2014, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_signature_common.c.inc: helper functions for Sonos digital signature format
 */

#include "sonos_signature_common.h"

int
sonosSignatureIsValidDigestAlg(SonosDigestAlg_t a)
{
    return a == SONOS_DIGEST_ALG_SHA256;
}

int
sonosSignatureIsValidSignatureAlg(SonosSignatureAlg_t a)
{
    return a == SONOS_SIGNATURE_ALG_RSAPKCS1;
}

int
sonosSignatureIsValidKeyIdentifierScheme(SonosKeyIdentifierScheme_t s)
{
    return s == SS_KI_SCHEME_X509_INLINE ||
           s == SS_KI_SCHEME_X509_SKI ||
           s == SS_KI_SCHEME_SHA1 ||
           s == SS_KI_SCHEME_NAME ||
           s == SS_KI_SCHEME_RSA_INLINE;
}

int
sonosSignatureHashSignedAttributes(const SonosSignature *sig,
                                   SonosHashCallback hash,
                                   SonosDigestAlg_t alg,
                                   uint8_t *digest,
                                   size_t *pDigestLen)
{
    uint8_t serializedAttrs[4 +
                            SS_MAX_NUM_SIGNED_ATTRS*(sizeof(SonosAttribute))];
    uint8_t *buf = serializedAttrs;
    const uint8_t *end = serializedAttrs + sizeof(serializedAttrs);
    uint32_t i32;

    i32 = sig->numSignedAttrs;
    i32 = SONOS_NASN_CPU_TO_BE32(i32);
    SONOS_NASN_MEMCPY(buf, &i32, 4);
    buf += 4;
    for (i32 = 0; i32 < sig->numSignedAttrs; i32++) {
        if (!sonosAttributeSerialize(&sig->signedAttrs[i32], &buf, end)) {
            return 0;
        }
    }

    return hash(alg, serializedAttrs, buf - serializedAttrs, digest, pDigestLen);
}

#ifdef SONOS_ARCH_ATTR_DEBUG_SIGNED_ATTRIBUTES

#include <inttypes.h>
#include "sonos_attr.h"

void
sonosSignaturePrintAttributes(FILE *f, const SonosSignature *sig)
{
    uint32_t i;

    fprintf(f, "%"PRIu32" unsigned attributes:\n", sig->numUnsignedAttrs);
    for (i = 0; i < sig->numUnsignedAttrs; i++) {
        sonosAttributePrint(f, &sig->unsignedAttrs[i]);
    }
    fprintf(f, "%"PRIu32" signed attributes:\n", sig->numSignedAttrs);
    for (i = 0; i < sig->numSignedAttrs; i++) {
        sonosAttributePrint(f, &sig->signedAttrs[i]);
    }
}

#endif
