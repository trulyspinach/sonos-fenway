/*
 * Copyright (c) 2014, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_signature_verify.h: Sonos digital signature format
 *                           verification and parsing
 */

#ifndef SONOS_SIGNATURE_VERIFY_H
#define SONOS_SIGNATURE_VERIFY_H

#include "sonos_signature.h"
#include "sonos_signature_common.h"
#include "sonos_attr.h"

#ifdef __cplusplus
extern "C" {
#endif

/*
 * The various *Callback typedefs are for function pointers that must be
 * provided by the caller at runtime in order for this code to work.  We use
 * function pointers rather than explicit linker dependencies to reduce
 * build time code dependencies.
 *
 * This way if some code just wants to parse the structure (without verifying
 * it cryptographically) it doesn't end up with a build time link dependency
 * on some crypto library.
 */

/* returns non-zero (and <= bufLen) parsed size on success, 0 on failure */
size_t sonosSignatureParse(SonosSignature *sig,
                           const uint8_t *buf, size_t bufLen);

/* returns true on success, false on failure */
typedef int (*SonosRawVerifyCallback)(SonosSigningKey_t key,
                                      SonosSignatureAlg_t signAlg,
                                      SonosDigestAlg_t digestAlg,
                                      const uint8_t *digest, size_t digestLen,
                                      const uint8_t *signature, uint32_t sigLen);

/* returns key in question on success, NULL on failure */
typedef SonosSigningKey_t (*SonosKeyLookupCallback)(const void *cbArg,
        SonosKeyIdentifierScheme_t keyIdscheme,
        const uint8_t *keyId,
        uint32_t keyIdLen);

/* called to release a key returned by SonosKeyLookupCallback */
typedef void (*SonosKeyReleaseCallback)(SonosSigningKey_t key);

/* returns true on success, false on failure */
int sonosSignatureVerifyInternal(const SonosSignature *sig,
                         SonosHashCallback hash,
                         SonosRawVerifyCallback rawVerify,
                         SonosKeyLookupCallback keyLookup,
                         const void *keyLookupArg,
                         SonosKeyReleaseCallback keyRelease,
                         const uint8_t *msg, size_t msgLen,
                         SonosContentType_t contentType,
                         int relaxContentTypeSigs);

/* returns true on success, false on failure */
int sonosSignatureVerify(const SonosSignature *sig,
                         SonosHashCallback hash,
                         SonosRawVerifyCallback rawVerify,
                         SonosKeyLookupCallback keyLookup,
                         const void *keyLookupArg,
                         SonosKeyReleaseCallback keyRelease,
                         const uint8_t *msg, size_t msgLen,
                         SonosContentType_t contentType);

/* returns true on success, false on failure */
int sonosSignatureVerifyFromDigestInternal(const SonosSignature *sig,
                                   SonosHashCallback hash,
                                   SonosRawVerifyCallback rawVerify,
                                   SonosKeyLookupCallback keyLookup,
                                   const void *keyLookupArg,
                                   SonosKeyReleaseCallback keyRelease,
                                   SonosDigestAlg_t digestAlg,
                                   const uint8_t *digest, size_t digestLen,
                                   SonosContentType_t contentType,
                                   int relaxContentTypeSigs);

/* returns true on success, false on failure */
int sonosSignatureVerifyFromDigest(const SonosSignature *sig,
                                   SonosHashCallback hash,
                                   SonosRawVerifyCallback rawVerify,
                                   SonosKeyLookupCallback keyLookup,
                                   const void *keyLookupArg,
                                   SonosKeyReleaseCallback keyRelease,
                                   SonosDigestAlg_t digestAlg,
                                   const uint8_t *digest, size_t digestLen,
                                   SonosContentType_t contentType);

/*
 * Returns true with the signed content type attribute if there was one.
 * Returns false otherwise.
 */
int sonosSignatureGetContentType(SonosAttributeContentType *ct,
                                 const SonosSignature *sig);

/*
 * Returns true with the signed message digest attribute if there was one.
 * Returns false otherwise.
 */
int sonosSignatureGetMessageDigest(SonosAttributeMessageDigest *md,
                                   const SonosSignature *sig);

/*
 * Returns true with the signed SRK revoke attribute if there was one.
 * Returns false otherwise.
 */
int sonosSignatureGetSrkRevoke(SonosAttributeSrkRevoke *sr,
                               const SonosSignature *sig);

#ifdef __cplusplus
}
#endif

#endif
