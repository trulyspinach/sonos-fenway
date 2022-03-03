/*
 * Copyright (c) 2014-2015, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_nasn_serialize.h: Sonos NASN (not ASN.1) serialization
 *
 * !!NOTE!! this file is meant to be pulled in with #include after the
 * including project has defined some macros:
 *      SONOS_NASN_CPU_TO_BE16()
 *      SONOS_NASN_CPU_TO_BE32(x)
 *      SONOS_NASN_MEMCPY(d, s, n)
 */

/*
 * These PUT_* macros assume the existence of various local variables:
 *   buf: the output pointer
 *   end: invalid memory just after the end of 'buf'
 *        (e.g. if 'buf' points at N bytes this is buf + N)
 *
 * They also assume that they can return 0 to indicate an error.
 *
 * A NULL 'end' value indicates a dry run:
 *   skip the usual bounds check against 'end'
 *   don't actually write output
 *
 * Though these conventions are a bit abnormal they greatly reduce
 * the amount of source code in the functions that parse/serialize these
 * structures (they need very little explicit error handling).
 */
#define PUT_BUF(b, len)                                             \
    do {                                                            \
        if (end) {                                                  \
            if (buf + (len) > end) {                                \
                return 0;                                           \
            }                                                       \
            SONOS_NASN_MEMCPY(buf, (b), (len));                     \
        }                                                           \
        buf += (len);                                               \
    } while (0)

#define PUT_INT(x)                                                  \
    do {                                                            \
        if (end) {                                                  \
            if (buf + sizeof(x) > end) {                            \
                return 0;                                           \
            }                                                       \
            if (sizeof(x) == 4) {                                   \
                uint32_t tmp = SONOS_NASN_CPU_TO_BE32(x);           \
                SONOS_NASN_MEMCPY(buf, &tmp, sizeof(x));            \
            }                                                       \
            else if (sizeof(x) == 2) {                              \
                uint16_t tmp = SONOS_NASN_CPU_TO_BE16(x);           \
                SONOS_NASN_MEMCPY(buf, &tmp, sizeof(x));            \
            }                                                       \
            else {                                                  \
                *buf = (x);                                         \
            }                                                       \
        }                                                           \
        buf += sizeof(x);                                           \
    } while (0)

#define PUT_INT_BOUNDED(x, max)                                     \
    do {                                                            \
        PUT_INT(x);                                                 \
        if ((x) > (max)) {                                          \
            return 0;                                               \
        }                                                           \
    } while (0)

#define PUT_ENUM(x, valid)                                          \
    do {                                                            \
        PUT_INT(x);                                                 \
        if (!valid(x)) {                                            \
            return 0;                                               \
        }                                                           \
    } while (0)
