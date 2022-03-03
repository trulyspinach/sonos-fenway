/*
 * Copyright (c) 2014, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_signature_common.h: helper functions for Sonos digital signature format
 */

#ifndef SONOS_SIGNATURE_COMMON_H
#define SONOS_SIGNATURE_COMMON_H

#include "sonos_signature.h"

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

/* returns true on success, false on failure */
typedef int (*SonosHashCallback)(SonosDigestAlg_t alg,
                                 const void *buf, size_t bufLen,
                                 uint8_t *digest, size_t *pDigestLen);

int sonosSignatureIsValidDigestAlg(SonosDigestAlg_t a);
int sonosSignatureIsValidSignatureAlg(SonosSignatureAlg_t a);
int sonosSignatureIsValidKeyIdentifierScheme(SonosKeyIdentifierScheme_t s);

/* returns true on success, false on failure */
int sonosSignatureHashSignedAttributes(const SonosSignature *sig,
                                       SonosHashCallback hash,
                                       SonosDigestAlg_t alg,
                                       uint8_t *digest,
                                       size_t *pDigestLen);

#ifdef SONOS_ARCH_ATTR_DEBUG_SIGNED_ATTRIBUTES
void sonosSignaturePrintAttributes(FILE *f, const SonosSignature *sig);
#endif

#ifdef __cplusplus
}
#endif

#endif
