/*
 * Copyright (c) 2014, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_signature.h: struct definitions for Sonos digital signature format
 */

#ifndef SONOS_SIGNATURE_H
#define SONOS_SIGNATURE_H

#include "sonos_stdint.h"
#include "sonos_crypto_enums.h"
#include "sonos_attr.h"

#define SS_KI_SCHEME_X509_INLINE        0x01
#define SS_KI_SCHEME_X509_SKI           0x02
#define SS_KI_SCHEME_SHA1               0x03
#define SS_KI_SCHEME_NAME               0x04
#define SS_KI_SCHEME_RSA_INLINE         0x05

#define SS_MAX_KEYID_LEN                2047
#define SS_MAX_NUM_UNSIGNED_ATTRS       8
#define SS_MAX_NUM_SIGNED_ATTRS         8
#define SS_MAX_SIG_LEN                  256
typedef struct
{
    uint32_t keyIdLen;
    SonosKeyIdentifierScheme_t keyIdScheme;
    uint8_t keyId[SS_MAX_KEYID_LEN];
    SonosDigestAlg_t digestAlg;
    SonosSignatureAlg_t signatureAlg;
    uint32_t sigLen;
    uint8_t signature[SS_MAX_SIG_LEN];
} SonosSignatureSignerInfo;

#define SS_MAGIC                        0x621da74d
#define SS_VERSION_MAJOR                0x01
#define SS_VERSION_MINOR                0x00
#define SS_MAX_NUM_DIGEST_ALGS          4
#define SS_MAX_NUM_SIGNERS              2
typedef struct
{
    uint32_t magic;
    uint32_t totalLen;
    uint16_t versionMajor;
    uint16_t versionMinor;
    uint32_t numUnsignedAttrs;
    SonosAttribute unsignedAttrs[SS_MAX_NUM_UNSIGNED_ATTRS];
    uint32_t numSignedAttrs;
    SonosAttribute signedAttrs[SS_MAX_NUM_SIGNED_ATTRS];
    uint8_t numSigners;
    SonosSignatureSignerInfo signerInfos[SS_MAX_NUM_SIGNERS];
} SonosSignature;

typedef void *SonosSigningKey_t;

#endif
