/*
 * Copyright (c) 2014-2015, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 *
 * sonos_attr_parse.c.inc: Sonos attribute parsing
 */

#include "sonos_attr.h"
#include "sonos_nasn_parse.h"
#include "sonos_signature_common.h"

/*
 * This function converts any attribute values from serialized byte order
 * to host byte order and also sanity checks them.  Returns true iff
 * the value passed sanity checks.
 *
 * The nature of each sanity check and byte order conversion is attribute
 * specific, but any multi-byte integer fields will be converted.
 */
static int sonosAttributeParseValue(SonosAttribute* a)
{
    /*
     * Do attribute specific length checks and byte swapping.
     */
    switch (a->attributeId & ~SONOS_ATTR_CRIT_BIT) {
    case SONOS_ATTR_ID_PADDING:
        break;

    case SONOS_ATTR_ID_MESSAGE_DIGEST:
    {
        SonosAttributeMessageDigest md;

        if (a->attributeValueLen < sizeof(md.alg)) {
            return 0;
        }
        /* only 1 byte wide so doesn't need byte order conversion */
        SONOS_NASN_MEMCPY(&md.alg, a->attributeValue, sizeof md.alg);

        if (!sonosSignatureIsValidDigestAlg(md.alg) ||
            a->attributeValueLen != sizeof(md.alg) +
                                    SONOS_DIGEST_ALG_LEN(md.alg)) {
            return 0;
        }

        break;
    }

    case SONOS_ATTR_ID_CONTENT_TYPE:
    {
        SonosAttributeContentType ct;

        if (a->attributeValueLen != sizeof ct) {
            return 0;
        }

        SONOS_NASN_MEMCPY(&ct, a->attributeValue, sizeof ct);
        ct.contentType = SONOS_NASN_BE32_TO_CPU(ct.contentType);
        SONOS_NASN_MEMCPY(a->attributeValue, &ct, sizeof ct);

        break;
    }

    case SONOS_ATTR_ID_SRK_REVOKE:
    {
        if (a->attributeValueLen != sizeof(SonosAttributeSrkRevoke)) {
            return 0;
        }

        break;
    }

    default:
        return 0;
    }

    return 1;
}

int sonosAttributeParse(SonosAttribute* a,
                        const uint8_t** buf_p,
                        const uint8_t* end)
{
    const uint8_t* buf = *buf_p;

    GET_INT(a->attributeId);
    if ((a->attributeId & SONOS_ATTR_CRIT_BIT) &&
        !sonosIsKnownAttribute(a->attributeId)) {
        return 0;
    }
    GET_INT_BOUNDED(a->attributeValueLen, SONOS_ATTR_MAX_VALUE_LEN);
    GET_BUF(a->attributeValue, a->attributeValueLen);

    if (!sonosAttributeParseValue(a)) {
        return 0;
    }

    *buf_p = buf;
    return 1;
}

