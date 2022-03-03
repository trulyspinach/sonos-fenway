/*
 * Copyright (c) 2014, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_signature_sign.h: Sonos digital signature format
 *                         creation and serialization
 */

#ifndef SONOS_SIGNATURE_SIGN_H
#define SONOS_SIGNATURE_SIGN_H

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

/* serializes structure, returns length of serialization */
/* pass NULL 'buf' to get serialization length without writing anything */
size_t sonosSignatureSerialize(const SonosSignature *sig,
                               uint8_t *buf, size_t bufLen);

/* returns true on success, false on failure */
typedef int (*SonosRawSignCallback)(SonosSigningKey_t key,
                                    SonosSignatureAlg_t signAlg,
                                    SonosDigestAlg_t digestAlg,
                                    const uint8_t *digest, size_t digestLen,
                                    uint8_t *signature, uint32_t *pSigLen);

/* returns true on success, false on failure */
int sonosSignatureCreate(SonosSignature *sig,
                         SonosHashCallback hash,
                         SonosRawSignCallback rawSign,
                         SonosDigestAlg_t digestAlg,
                         SonosSignatureAlg_t sigAlg,
                         SonosSigningKey_t key,
                         SonosKeyIdentifierScheme_t keyIdScheme,
                         const uint8_t *keyId,
                         uint32_t keyIdLen,
                         const uint8_t *msg, size_t msgLen,
                         SonosContentType_t ct,
                         SonosSrkRevoke_t srkRevoke);

/* returns true on success, false on failure */
int sonosSignatureCreateFromDigest(SonosSignature *sig,
                                   SonosHashCallback hash,
                                   SonosRawSignCallback rawSign,
                                   SonosDigestAlg_t digestAlg,
                                   SonosSignatureAlg_t sigAlg,
                                   SonosSigningKey_t key,
                                   SonosKeyIdentifierScheme_t keyIdScheme,
                                   const uint8_t *keyId,
                                   uint32_t keyIdLen,
                                   const uint8_t *digest, size_t digestLen,
                                   SonosContentType_t ct,
                                   SonosSrkRevoke_t srkRevoke);

#ifdef __cplusplus
}
#endif

#endif
