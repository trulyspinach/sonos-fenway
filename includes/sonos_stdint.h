/*
 * Copyright (c) 2014-2015, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * This file is meant to replace stdint.h for all supported userspace
 * architectures in addition to the Linux kernel and uBoot.
 *
 * stdint.h is C99 but may not exist on Windows. We also automatically set some
 * defines here that for some dumb reason are required on C++ to get everything
 * out of the standard header.
 */

#ifndef SONOS_STDINT_H_
#define SONOS_STDINT_H_

#ifdef __KERNEL__
    #ifdef CONFIG_SYS_TEXT_BASE
        /* this is the u-boot build, include its fixed width int header */
        #include <asm/types.h>

        typedef u8 uint8_t;
        typedef u16 uint16_t;
        typedef u32 uint32_t;
        typedef u64 uint64_t;
        typedef s8 int8_t;
        typedef s16 int16_t;
        typedef s32 int32_t;
        typedef s64 int64_t;
    #else
        /* this is the kernel build, include its fixed width int header */
        #include <linux/types.h>
    #endif
#else
    /* TODO fixidn: next line should be ifdef WIN32; not if 0 */
    #if 0

      /*
       * from open source msinttypes project:
       * ISO C9x compliant stdint.h and inttypes.h for Microsoft Visual Studio
       */
      #include "msinttypes/stdint.h"

    #else

      /* use the standard header but with some defines baked in */
      #define __STDC_CONSTANT_MACROS
      #define __STDC_LIMIT_MACROS
      #include <stdint.h>

      /* include limits for SIZE_MAX */
      #ifdef __SONOS_ANDROID__
          #include <limits.h>
      #endif

    #endif
#endif // __KERNEL__

#endif // SONOS_STDINT_H_
