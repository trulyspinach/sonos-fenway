/*
 * Copyright (c) 2014-2015, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_nasn_parse.h: Sonos NASN (not ASN.1) parsing
 *
 * !!NOTE!! this file is meant to be pulled in with #include after the
 * including project has defined some macros:
 *      SONOS_NASN_BE16_TO_CPU(x)
 *      SONOS_NASN_BE32_TO_CPU(x)
 *      SONOS_NASN_MEMCPY(d, s, n)
 */

/*
 * These GET_* macros assume the existence of various local variables:
 *   buf: the input pointer
 *   end: invalid memory just after the end of 'buf'
 *        (e.g. if 'buf' points at N bytes this is buf + N)
 *
 * They also assume that they can return 0 to indicate an error.
 *
 * Though these conventions are a bit abnormal they greatly reduce
 * the amount of source code in the functions that parse/serialize these
 * structures (they need very little explicit error handling).
 */
#define GET_BUF(b, len)                                             \
    do {                                                            \
        if (buf + (len) > end) {                                    \
            return 0;                                               \
        }                                                           \
        SONOS_NASN_MEMCPY((b), buf, (len));                         \
        buf += (len);                                               \
    } while (0)

#define GET_BUF_PTR(p, len)                                         \
    do {                                                            \
        if (buf + (len) > end) {                                    \
            return 0;                                               \
        }                                                           \
        (p) = (const void *)buf;                                    \
        buf += (len);                                               \
    } while (0)

#define GET_INT(x)                                                  \
    do {                                                            \
        if (buf + sizeof(x) > end) {                                \
            return 0;                                               \
        }                                                           \
        SONOS_NASN_MEMCPY(&(x), buf, sizeof(x));                    \
        buf += sizeof(x);                                           \
        if (sizeof(x) == 4) {                                       \
            (x) = SONOS_NASN_BE32_TO_CPU(x);                        \
        }                                                           \
        else if (sizeof(x) == 2) {                                  \
            (x) = SONOS_NASN_BE16_TO_CPU(x);                        \
        }                                                           \
    } while (0)

#define GET_INT_BOUNDED(x, max)                                     \
    do {                                                            \
        GET_INT(x);                                                 \
        if ((x) > (max)) {                                          \
            return 0;                                               \
        }                                                           \
    } while (0)

#define GET_ENUM(x, valid)                                          \
    do {                                                            \
        GET_INT(x);                                                 \
        if (!valid(x)) {                                            \
            return 0;                                               \
        }                                                           \
    } while (0)
