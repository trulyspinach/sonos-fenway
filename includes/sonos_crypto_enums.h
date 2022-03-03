/*
 * Copyright (c) 2015, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_crypto_enums.h: shared enum values for Sonos cryptography
 */

#ifndef SONOS_CRYPTO_ENUMS_H
#define SONOS_CRYPTO_ENUMS_H

#include "sonos_stdint.h"

typedef uint8_t SonosDigestAlg_t;
typedef uint32_t SonosSignatureAlg_t;
typedef uint8_t SonosKeyIdentifierScheme_t;
typedef uint32_t SonosKeyEncryptionAlg_t;
typedef uint32_t SonosDataEncryptionAlg_t;

/*
 * Digest Algorithms:
 *
 * 0x01 : SHA-256
 * 0x02 : MD5
 * 0x03 : SHA-1
 */
#define SONOS_DIGEST_ALG_SHA256             0x01
#define SONOS_DIGEST_LEN_SHA256             32
#define SONOS_DIGEST_ALG_MD5                0x02
#define SONOS_DIGEST_LEN_MD5                16
#define SONOS_DIGEST_ALG_SHA1               0x03
#define SONOS_DIGEST_LEN_SHA1               20

#define SONOS_DIGEST_MAX_LEN                SONOS_DIGEST_LEN_SHA256
#define SONOS_DIGEST_ALG_LEN(a) ((a) == SONOS_DIGEST_ALG_SHA256 \
                                    ? SONOS_DIGEST_LEN_SHA256   \
                                    : \
                                 ((a) == SONOS_DIGEST_ALG_MD5   \
                                    ? SONOS_DIGEST_LEN_MD5      \
                                    : \
                                 ((a) == SONOS_DIGEST_ALG_SHA1  \
                                    ? SONOS_DIGEST_LEN_SHA1     \
                                    : 0)))

/*
 * Digital Signature Algorithms:
 *
 * 0x01 : RSA PKCS#1 BlockType 1
 *        (aka RSASSA-PKCS1-v1_5 in RFC 3447)
 */
#define SONOS_SIGNATURE_ALG_RSAPKCS1        0x01

/*
 * Key Encryption (aka asymmetric encryption) Algorithms:
 *
 * 0x01 : RSA OAEP with SHA1, MGF1, empty L value
 *        (aka RSAES-OAEP in RFC 3447 with SHA1, MGF1)
 * 0x02 : RSA PKCS#1 BlockType 2
 *        (aka RSAES-PKCS1-v1_5 in RFC 3447)
 */
#define SONOS_KEYENC_ALG_RSA_OAEP_SHA1      0x01
#define SONOS_KEYENC_ALG_RSA_PKCS1          0x02

/*
 * Data Encryption (aka symmetric encryption) Algorithms:
 *
 * 0x01 : 128-bit AES in CBC mode
 */
#define SONOS_DATAENC_ALG_AES_128_CBC       0x01

/* all lengths are in bytes */
#define SONOS_DATAENC_MAX_KEY_LEN           16
#define SONOS_DATAENC_BLOCK_LEN_AES         16
#define SONOS_DATAENC_MAX_BLOCK_LEN         SONOS_DATAENC_BLOCK_LEN_AES

#endif
