/*
 * Copyright (c) 2014, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_attr.c.inc: Sonos attribute common code
 */

#include "sonos_attr.h"

int
sonosIsKnownAttribute(uint32_t id)
{
    /* ignore the criticality bit */
    id &= ~SONOS_ATTR_CRIT_BIT;

    return id == SONOS_ATTR_ID_PADDING ||
           id == SONOS_ATTR_ID_MESSAGE_DIGEST ||
           id == SONOS_ATTR_ID_CONTENT_TYPE ||
           id == SONOS_ATTR_ID_SRK_REVOKE;
}

int
sonosHasDuplicateAttribute(uint32_t numUnsignedAttrs,
                           const SonosAttribute unsignedAttrs[],
                           uint32_t numSignedAttrs,
                           const SonosAttribute signedAttrs[])
{
    uint32_t i, j;
    uint32_t iAttr, jAttr;

    for (i = 0; i < numUnsignedAttrs; i++) {
        iAttr = unsignedAttrs[i].attributeId & ~SONOS_ATTR_CRIT_BIT;

        for (j = i + 1; j < numUnsignedAttrs; j++) {
            jAttr = unsignedAttrs[j].attributeId & ~SONOS_ATTR_CRIT_BIT;
            if (iAttr == jAttr) {
                return 1;
            }
        }
        for (j = 0; j < numSignedAttrs; j++) {
            jAttr = signedAttrs[j].attributeId & ~SONOS_ATTR_CRIT_BIT;
            if (iAttr == jAttr) {
                return 1;
            }
        }
    }

    for (i = 0; i < numSignedAttrs; i++) {
        iAttr = signedAttrs[i].attributeId & ~SONOS_ATTR_CRIT_BIT;

        for (j = i + 1; j < numSignedAttrs; j++) {
            jAttr = signedAttrs[j].attributeId & ~SONOS_ATTR_CRIT_BIT;
            if (iAttr == jAttr) {
                return 1;
            }
        }
    }

    return 0;
}

#ifdef SONOS_ARCH_ATTR_DEBUG_SIGNED_ATTRIBUTES

#include <inttypes.h>
#include <string.h>

static void
sonosAttributeDumpHex(FILE* f, const char* indent,
                      const void* vbuf, size_t bufLen)
{
    size_t i, mod, finalChar;
    const uint8_t *buf = vbuf;

    for (i = 0; i < bufLen; i++) {
        mod = i % 8;
        finalChar = i == bufLen - 1;

        fprintf(f, "%s0x%02x%s%s",
                mod == 0 ? indent : "",
                buf[i],
                finalChar ? "" : ",",
                mod == 7 || finalChar ? "\n" : " ");
    }
}

void
sonosAttributePrint(FILE* f, const SonosAttribute* a)
{
    uint32_t id = a->attributeId & ~SONOS_ATTR_CRIT_BIT;
    uint32_t len = a->attributeValueLen;
    const char* attrName = NULL;
    char attrNameBuf[32];
    const char* attrPrettyValue = NULL;
    char attrPrettyValueBuf[64];

    switch (id) {
    case SONOS_ATTR_ID_PADDING:
        attrName = "padding";
        break;
    case SONOS_ATTR_ID_MESSAGE_DIGEST:
        attrName = "message digest";
        break;
    case SONOS_ATTR_ID_CONTENT_TYPE:
        attrName = "content-type";
        if (len == sizeof(SonosContentType_t)) {
            SonosContentType_t contentType;

            attrPrettyValue = attrPrettyValueBuf;
            memcpy(&contentType, a->attributeValue, sizeof contentType);
            switch (contentType) {
            case SONOS_CT_INVALID:
                snprintf(attrPrettyValueBuf, sizeof attrPrettyValueBuf, "%s",
                         "invalid");
                break;
            case SONOS_CT_UPD:
                snprintf(attrPrettyValueBuf, sizeof attrPrettyValueBuf, "%s",
                         "upd");
                break;
            case SONOS_CT_KERNEL:
                snprintf(attrPrettyValueBuf, sizeof attrPrettyValueBuf, "%s",
                         "kernel");
                break;
            case SONOS_CT_FPGA:
                snprintf(attrPrettyValueBuf, sizeof attrPrettyValueBuf, "%s",
                         "fpga");
                break;
            case SONOS_CT_M4:
                snprintf(attrPrettyValueBuf, sizeof attrPrettyValueBuf, "%s",
                         "m4");
                break;
            default:
                snprintf(attrPrettyValueBuf, sizeof attrPrettyValueBuf,
                         "%s (%"PRIu32")",
                         "unknown", contentType);
                break;
            }
        }
        break;
    case SONOS_ATTR_ID_SRK_REVOKE:
        attrName = "SRK revoke";
        if (len == sizeof(SonosSrkRevoke_t)) {
            SonosSrkRevoke_t srkValue;

            attrPrettyValue = attrPrettyValueBuf;
            memcpy(&srkValue, a->attributeValue, sizeof srkValue);
            snprintf(attrPrettyValueBuf, sizeof attrPrettyValueBuf,
                     "0x%x", (unsigned)srkValue);
        }
        break;
    default:
        attrName = attrNameBuf;
        snprintf(attrNameBuf, sizeof attrNameBuf, "unknown (%"PRIu32")", id);
        break;
    }

    fprintf(f, "%s %s(%"PRIu32" bytes):\n",
            attrName,
            (a->attributeId & SONOS_ATTR_CRIT_BIT) ? "(critical) " : "",
            len);
    if (attrPrettyValue) {
        fprintf(f, "  pretty value: %s\n", attrPrettyValue);
    }
    fprintf(f, "  raw value:\n");
    sonosAttributeDumpHex(f, "    ", a->attributeValue, len);
}

#endif
