/*
 * Copyright (c) 2014, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 */

#ifndef SONOS_DIGEST_DATA_H_
#define SONOS_DIGEST_DATA_H_

#include "sonos_stdint.h"

#if defined(__cplusplus)
extern "C" {
#endif

#define SONOS_DIGEST_MAGIC1     0xe2c1ede1
#define SONOS_DIGEST_MAGIC2     0xabc9dbc4
#define SONOS_DIGEST_LENGTH     32

#define ROOTFS_DIGEST_ALGORITHM        "sha256"

typedef struct  {
	uint32_t    digest_magic[2];
	uint32_t    digest_value_length;
	uint32_t    rootfs_length;
	uint8_t     digest_value[32];
} rootfs_digest_t;

#if defined(__cplusplus)
};
#endif

#endif // SONOS_DIGEST_DATA_H_
