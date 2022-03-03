/*
 * Copyright (c) 2014-2015, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_attr.h: struct definitions for Sonos attribute
 */

#ifndef SONOS_ATTR_H
#define SONOS_ATTR_H

#ifdef SONOS_ARCH_ATTR_DEBUG_SIGNED_ATTRIBUTES
#include <stdio.h>
#endif
#include "sonos_stdint.h"
#include "sonos_crypto_enums.h"

#ifdef __cplusplus
extern "C" {
#endif

#define SONOS_ATTR_CRIT_BIT             (0x1 << 31)
#define SONOS_ATTR_MAX_VALUE_LEN        256
typedef struct
{
    uint32_t attributeId;
    uint32_t attributeValueLen;
    uint8_t attributeValue[SONOS_ATTR_MAX_VALUE_LEN];
} SonosAttribute;

#define SONOS_ATTR_ID_PADDING           1

#define SONOS_ATTR_ID_MESSAGE_DIGEST    2
typedef struct
{
    SonosDigestAlg_t alg;
    uint8_t digest[SONOS_DIGEST_MAX_LEN];
} SonosAttributeMessageDigest;

#define SONOS_ATTR_ID_CONTENT_TYPE      3
typedef uint32_t SonosContentType_t;
typedef struct
{
    SonosContentType_t contentType;
} SonosAttributeContentType;

#define SONOS_CT_INVALID                0

#define SONOS_CT_UPD                    1
#define SONOS_CT_KERNEL                 2
#define SONOS_CT_FPGA                   3
#define SONOS_CT_M4                     4

#define SONOS_ATTR_ID_SRK_REVOKE        4
typedef uint8_t SonosSrkRevoke_t;
typedef struct
{
    SonosSrkRevoke_t srkRevokeFuse;
} SonosAttributeSrkRevoke;

#define SONOS_SR_NONE                   0
#define SONOS_SR_FUSE_MASK              0x7

int sonosIsKnownAttribute(uint32_t id);

int sonosHasDuplicateAttribute(uint32_t numUnsignedAttrs,
                               const SonosAttribute unsignedAttrs[],
                               uint32_t numSignedAttrs,
                               const SonosAttribute signedAttrs[]);

int sonosAttributeParse(SonosAttribute* a,
                        const uint8_t** buf_p,
                        const uint8_t* end);
int sonosAttributeSerialize(const SonosAttribute* a,
                            uint8_t** buf_p,
                            const uint8_t* end);

#ifdef SONOS_ARCH_ATTR_DEBUG_SIGNED_ATTRIBUTES
void sonosAttributePrint(FILE* f, const SonosAttribute* a);
#endif

#ifdef __cplusplus
}
#endif

#endif
