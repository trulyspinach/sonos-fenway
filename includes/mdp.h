/*
 * Copyright (c) 2003-2016, Sonos, Inc.
 *
 * SPDX-License-Identifier: GPL-2.0
 */

#ifndef UPGRADE_MDP_H
#define UPGRADE_MDP_H

#include "sonos_stdint.h"

#ifdef SONOS_ARCH_ATTR_IS_HARDWARE
#if defined(SONOS_ARCH_MIPS)
#define MDP_DEVICE "/dev/mdp"
#elif defined(SONOS_ARCH_FILLMORE) || defined(SONOS_ARCH_MIPS24K)
#define MDP_DEVICE "/dev/mtd1"
#elif defined(SONOS_ARCH_ARM) || defined(SONOS_ARCH_CONNECTX) || \
      defined(SONOS_ARCH_FENWAY) || defined(SONOS_ARCH_LIMELIGHT) || \
      defined(SONOS_ARCH_PPC) || defined(SONOS_ARCH_SH4)
#define MDP_DEVICE "/dev/mtd/0"
#elif defined(SONOS_ARCH_ENCORE) || defined(SONOS_ARCH_PARAMOUNT) || \
      defined(SONOS_ARCH_ROYALE) || defined(SONOS_ARCH_SOLBASE)
#define MDP_DEVICE "/dev/mdp"
#endif
#else
#define MDP_DEVICE "/dev/mtd/0"
#endif

#define MDP_MAGIC 0xce10e47d
#define MDP_MAGIC2 0xca989b4a
#define MDP_MAGIC2_ENC 0xfa87b921
#define MDP_MAGIC3 0xcba979f0
#define MDP_UNKNOWN 0
#define MDP_RESERVED 0xffffffff
#define MDP_VENDOR_RINCONNETWORKS 0x1
#define MDP_MAX_VENDOR 0x1

#define MDP_MODEL_ZP 0x1
#define MDP_MODEL_HH 0x2
#define MDP_MODEL_PC 0x3
#define MDP_MODEL_MAC 0x4
#define MDP_MODEL_LINK 0x5
#define MDP_MODEL_WOODSTOCK 0x6
#define MDP_MODEL_CASBAH 0x7
#define MDP_MODEL_FENWAY 0x8
#define MDP_MODEL_LIMELIGHT 0x9
#define MDP_MODEL_ICR 0xa
#define MDP_MODEL_ACR 0xb
#define MDP_MODEL_FILLMORE 0xc
#define MDP_MODEL_ENCORE 0xd
#define MDP_MODEL_SOLBASE 0xe

#define MDP_MODEL_TEST_CONTROLLER 0xf
#define MDP_MODEL_WEMBLEY   0x10
#define MDP_MODEL_CONNECTX  0x11
#define MDP_MODEL_RESERVED1 0x13
#define MDP_MODEL_ROYALE    0x14
#define MDP_MODEL_PARAMOUNT 0x16

#define MDP_MAX_MODEL       0x17

#define MDP_SUBMODEL_ES2 0x1
#define MDP_SUBMODEL_TS1 0x2
#define MDP_SUBMODEL_TS2 0x3
#define MDP_SUBMODEL_REDROCKS 0x10
#define MDP_SUBMODEL_WEMBLEY_AVALONPROTO 0x1
#define MDP_SUBMODEL_WEMBLEY_AVALON 0x2
#define MDP_SUBMODEL_WEMBLEY_WEMBLEY 0x3
#define MDP_SUBMODEL_ZPS5 0x4
#define MDP_SUBMODEL_EDEN 0x5
#define MDP_SUBMODEL_FENWAY_ES1 0x1
#define MDP_SUBMODEL_ANVIL 0x2
#define MDP_SUBMODEL_AMOEBA 0x3
#define MDP_SUBMODEL_FENWAY_LP 0x5
#define MDP_SUBMODEL_ANVIL_LP 0x6
#define MDP_SUBMODEL_AMOEBA_LP 0x7
#define MDP_SUBMODEL_ICR 0x0
#define MDP_SUBMODEL_IPADCR 0x1
#define MDP_SUBMODEL_ICRU_6 0x2
#define MDP_SUBMODEL_ICRU_7 0x3
#define MDP_SUBMODEL_ICRU 0x4
#define MDP_SUBMODEL_FILLMORE 0x1
#define MDP_SUBMODEL_ENCORE 0x1
#define MDP_SUBMODEL_SOLBASE_P0 0x1
#define MDP_SUBMODEL_SOLBASE_M0 0x1
#define MDP_SUBMODEL_ROYALE 0x1
#define MDP_SUBMODEL_PARAMOUNT 0x1

#define MDP_REVISION_ANVIL_P1 0x1
#define MDP_REVISION_ANVIL_P2 0x2
#define MDP_REVISION_ANVIL_P3 0x3
#define MDP_REVISION_ANVIL_DVT 0x4
#define MDP_REVISION_ANVIL_128MB 0x5
#define MDP_REVISION_ANVIL_LP 0x6

#define MDP_SUBMODEL_LIMELIGHT_PROTO1 0x1
#define MDP_SUBMODEL_LIMELIGHT_PROTO2 0x2

#define MDP_REVISION_LIMELIGHT_EVT    0x6

#define MDP_REVISION_FENWAY_128MB  0x3

#define MDP_REVISION_SOLBASE_B1 0x1
#define MDP_REVISION_SOLBASE_P0 0x1
#define MDP_REVISION_SOLBASE_M0 0x1
#define MDP_REVISION_SOLBASE_M2 0x2
#define MDP_REVISION_SOLBASE_PRE_PROTO4  0x4
#define MDP_REVISION_SOLBASE_PROTO4      0x5
#define MDP_REVISION_SOLBASE_P4_RETROFIT 0x6
#define MDP_REVISION_SOLBASE_VAL1        0x7
#define MDP_REVISION_SOLBASE_PROTO5      0x8
#define MDP_REVISION_SOLBASE_EVT         0x9
#define MDP_REVISION_SOLBASE_DVT         0xA
#define MDP_REVISION_SOLBASE_PVT         0xB

#define MDP_REVISION_ENCORE_PROTO3       0x3
#define MDP_REVISION_ENCORE_PROTO4       0x4
#define MDP_REVISION_ENCORE_EVT1         0x4
#define MDP_REVISION_ENCORE_EVT2         0x5
#define MDP_REVISION_ENCORE_DVT          0x6
#define MDP_REVISION_ENCORE_PVT          0x7

#define MDP_REVISION_ROYALE_PROTO1       0x1
#define MDP_REVISION_ROYALE_PROTO2       0x2
#define MDP_REVISION_ROYALE_PROTO3       0x3
#define MDP_REVISION_ROYALE_PROTO3_CAPS  0x4
#define MDP_REVISION_ROYALE_EVTDVT       0x5
#define MDP_REVISION_ROYALE_PVT          0x6

#define MDP_REVISION_PARAMOUNT_PROTO1    0x1
#define MDP_REVISION_PARAMOUNT_PROTO2B   0x2
#define MDP_REVISION_PARAMOUNT_EVT       0x3

#define MDP_REVISION_TS1_A 0x1
#define MDP_REVISION_TS1_C 0x2
#define MDP_REVISION_REDROCKS_PROTO 0x1
#define MDP_REVISION_REDROCKS_TS1 0x2
#define MDP_REVISION_REDROCKS_TS2 0x3

#define  MDP_SUBMODEL_FILLMORE_P1     0x1

#define  MDP_REVISION_FILLMORE_BB2    0x1
#define  MDP_REVISION_FILLMORE_P1     0x2

#define MDP_REGION_USCA 0x1
#define MDP_REGION_EU 0x2
#define MDP_REGION_CHINA 0x3
#define MDP_REGION_JAPAN 0x4
#define MDP_MAX_REGION 0x4

#define MDP_DEFAULT_COPYRIGHT "Copyright 2016 Sonos, Inc."

#define MDP_EMPTY_SERIAL {0,0,0,0,0,0,0,0}

struct manufacturing_data_page {
	uint32_t mdp_magic;
	uint32_t mdp_vendor;
	uint32_t mdp_model;
	uint32_t mdp_submodel;
	uint32_t mdp_revision;
	uint8_t mdp_serial[8];
	uint32_t mdp_region;
	uint32_t mdp_reserved;
	char mdp_copyright_statement[64];
	uint32_t mdp_flags;
	uint32_t mdp_hwfeatures;
	uint8_t mdp_ch11spurimmunitylevel;
	uint8_t mdp_reserved2[3];
	uint32_t mdp_version;
	uint32_t mdp2_version;
	uint32_t mdp3_version;
	uint32_t mdp_pages_present;
	uint32_t mdp_authorized_flags;
	uint32_t mdp_unused;
	uint32_t mdp_fusevalue;
	uint32_t mdp_sw_features;
	uint8_t mdp_reserved3[112];
	union {
		uint8_t u_reserved[256];
		struct {
			int32_t mdp_zp_dcofs[4];
		} zp;
		struct {
			uint32_t mdp_hh_lcdbiaspwm;
			uint32_t mdp_hh_callight;
		} hh;
		struct {
			int16_t mdp_wstk_accel_x;
			int16_t mdp_wstk_accel_y;
			int16_t mdp_wstk_accel_z;
			uint16_t mdp_wstk_lightsensor;
		} wstk;
	} u;
};
#define MDP1_BYTES 512

#define MDP_VERSION_AUTH_FLAGS          0x1
#define MDP_VERSION_SW_FEATURES         0x2
#define MDP_CURRENT_VERSION             MDP_VERSION_SW_FEATURES

#define MDP2_VERSION_LEGACY_RSA         0x1
#define MDP2_VERSION_FSN                0x2
#define MDP2_VERSION_UNIT_SIG           0x3
#define MDP2_VERSION_VARIANT            0x4
#define MDP2_CURRENT_VERSION            MDP2_VERSION_VARIANT

#define MDP2_ENC_VERSION_DEV_CERT       0x4
#define MDP2_ENC_VERSION_ENC_VARIANT    0x5
#define MDP2_ENC_CURRENT_VERSION        MDP2_ENC_VERSION_ENC_VARIANT

#define MDP3_VERSION_SECURE_BOOT        0x1
#define MDP3_VERSION_DEV_CERT           0x2
#define MDP3_CURRENT_VERSION            MDP3_VERSION_DEV_CERT

#define MDP2_LEGACY_KEYLEN              836
#define MDP2_LEGACY_FSN_KEYLEN          964

#define MDP_FLAG_KERNEL_PRINTK_ENABLE   0x01
#define MDP_FLAG_CONSOLE_ENABLE         0x02
#define MDP_FLAG_HAS_HWFEATURES         0x04
#define MDP_FLAG_RUN_DIAGS              0x08
#define MDP_FLAG_HAS_VERSION            0x10
#define MDP_FLAG_REVOKE_MFG_KEY         0x20
#define MDP_FLAG_POSTMFG_FIX            0x20

#define MDP_AUTH_FLAG_KERNEL_PRINTK_ENABLE      0x00000001
#define MDP_AUTH_FLAG_CONSOLE_ENABLE            0x00000002
#define MDP_AUTH_FLAG_MFG_KEY_ENABLE            0x00000004
#define MDP_AUTH_FLAG_TELNET_ENABLE             0x00000008
#define MDP_AUTH_FLAG_EXEC_ENABLE               0x00000010
#define MDP_AUTH_FLAG_UBOOT_UNLOCK_ENABLE       0x00000020
#define MDP_AUTH_FLAG_SYSRQ_ENABLE              0x00000040
#define MDP_AUTH_FLAG_INSMOD_CTRL               0x00000080
#define MDP_AUTH_FLAG_BUTTON_DEBUG              0x00000100
#define MDP_AUTH_FLAG_NODEV_CTRL                0x00000200
#define MDP_AUTH_FLAG_MIC_DBG_ENABLE            0x00000400
#define MDP_AUTH_FLAG_BYPASS_ENABLE             0x00000800
#define MDP_AUTH_FLAG_HWV_DEFAULTS              0x00001000
/* Dont add another flag here without updating ALL_FEATURES below */

#define MDP_AUTH_FLAG_ALL_FEATURES              0x00001fff

#define MDP_PAGE1_PRESENT   0x01
#define MDP_PAGE2_PRESENT   0x02
#define MDP_PAGE3_PRESENT   0x04



#define MDP_KERNEL_PRINTK_ENABLE	MDP_FLAG_KERNEL_PRINTK_ENABLE

#define MDP_HWFEATURE_ATH_AR2414_WIFI	0x01
#define MDP_HWFEATURE_STMICRO_NAND	0x02
#define MDP_HWFEATURE_REDROCKS		0x04
#define MDP_HWFEATURE_ATH_AR5416_WIFI   0x08
#define MDP_HWFEATURE_ATH_AR9000_WIFI   0x10
#define MDP_HWFEATURE_LED_SWAP          0x20
#define MDP_HWFEATURE_ALT_ANTENNAS	0x40

struct mdp_key_hdr {
    uint32_t m_magic;
    uint32_t m_len;
    uint32_t m_reserved;
};

#define MDP_KEY_HDR_MAGIC_CAAM_RSAREF_PRIV      0x19283746
#define MDP_KEY_HDR_MAGIC_CAAM_PKCS1_RSA_PRIV   0xF4CCC68D
#define MDP_KEY_HDR_MAGIC_CAAM_AES128_BLACK_KEY 0xF0A2ADE7
#define MDP_KEY_HDR_MAGIC_CAAM_AES128_RED_KEY   0x618C4DE8


struct manufacturing_data_page2 {
	uint32_t mdp2_magic;
	uint32_t mdp2_keylen;
    union {
        uint8_t mdp2_key[4088];
        struct {
            uint8_t old_rsa_private[708];
            uint8_t old_rsa_sig[128];
            uint8_t old_fsn_sig[128];
            uint8_t old_unit_sig[128];
            uint32_t  old_variant;

            uint8_t old_reserved[4088 - (708 + (128 * 3) + 4)];
        } ;
        struct {
            uint8_t prod_rsa_private[1024];
            uint8_t prod_unit_sig[128];
            uint32_t  prod_cert_flags;

            uint8_t dev_rsa_private[1024];
            uint8_t dev_unit_sig[128];
            uint32_t  dev_cert_flags;

            uint8_t prod_rsa_sig[128];
            uint8_t dev_rsa_sig[128];

            uint32_t  variant;

            uint8_t dev_reserved[4088 - ((1024 * 2) + (128 * 4) + (4 * 3))];
        } ;
    } mdp2_sigdata;
};
#define MDP2_BYTES 4096

#define MDP_VARIANT_NONE         0
#define MDP_VARIANT_WHITE        1
#define MDP_VARIANT_BLACK        2
#define MDP_VARIANT_WHITE_GLOSS  3
#define MDP_VARIANT_WHITE_MATTE  4
#define MDP_VARIANT_BLACK_GLOSS  5
#define MDP_VARIANT_BLACK_MATTE  6
#define MDP_VARIANT_BLUE         7

struct manufacturing_data_page3 {
    uint32_t mdp3_magic;
    uint32_t mdp3_version;
    uint8_t mdp3_reserved[376];

    uint8_t mdp3_auth_sig[512];
    uint8_t mdp3_cpuid_sig[512];

    uint8_t mdp3_fskey1[256];
    uint8_t mdp3_fskey2[256];
    uint8_t mdp3_model_private_key[2048];

    uint8_t mdp3_prod_unit_rsa_key[2048];
    uint8_t mdp3_prod_unit_rsa_cert[2048];
    uint8_t mdp3_dev_unit_rsa_key[2048];
    uint8_t mdp3_dev_unit_rsa_cert[2048];

    uint8_t mdp3_reserved2[4096 + 128];
};
#define MDP3_BYTES 16384

struct smdp {
    struct manufacturing_data_page      mdp;
    struct manufacturing_data_page2     mdp2;
    struct manufacturing_data_page3     mdp3;
};

#define MDP_SUBMODEL_IS_FENWAY(submodel) (((submodel) == MDP_SUBMODEL_FENWAY_ES1))
#define MDP_SUBMODEL_IS_ANVIL(submodel) (((submodel) == MDP_SUBMODEL_ANVIL || (submodel) == MDP_SUBMODEL_ANVIL_LP))
#define MDP_SUBMODEL_IS_AMOEBA(submodel) (((submodel) == MDP_SUBMODEL_AMOEBA || (submodel) == MDP_SUBMODEL_AMOEBA_LP))
#define MDP_SUBMODEL_IS_FENWAYLP(submodel) (((submodel) == MDP_SUBMODEL_AMOEBA_LP || (submodel) == MDP_SUBMODEL_ANVIL_LP))

#ifdef __KERNEL__
#if defined(CONFIG_MIPS) && !defined(CONFIG_SONOS_FILLMORE) && !defined(CONFIG_CASBAH)
extern struct mdp {
    struct manufacturing_data_page mdp;
    struct manufacturing_data_page2 mdp2;
} cache_mdp;
#define sys_mdp (cache_mdp.mdp)
#else
extern struct manufacturing_data_page sys_mdp;
extern struct smdp secure_mdp;
#endif
#define WEMBLEY ( ((sys_mdp.mdp_model==MDP_MODEL_WEMBLEY) || (sys_mdp.mdp_model==MDP_MODEL_CONNECTX)) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_WEMBLEY_WEMBLEY))
#define EDEN ( ((sys_mdp.mdp_model==MDP_MODEL_WEMBLEY) || (sys_mdp.mdp_model==MDP_MODEL_CONNECTX)) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_EDEN))
#define ZPS5 ( ((sys_mdp.mdp_model==MDP_MODEL_WEMBLEY) || (sys_mdp.mdp_model==MDP_MODEL_CONNECTX)) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_ZPS5))
#define FENWAY ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_FENWAY_ES1))
#define FENWAY_128MB ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_FENWAY_ES1) && (sys_mdp.mdp_revision>=MDP_REVISION_FENWAY_128MB))
#define ANVIL_SP ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_ANVIL))
#define ANVIL_P1 ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_ANVIL) && (sys_mdp.mdp_revision<=MDP_REVISION_ANVIL_P1))
#define ANVIL_P3 ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_ANVIL) && (sys_mdp.mdp_revision==MDP_REVISION_ANVIL_P3))
#define ANVIL_PROD ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_ANVIL) && (sys_mdp.mdp_revision>=MDP_REVISION_ANVIL_DVT))
#define ANVIL_NOVCXO ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (MDP_SUBMODEL_IS_ANVIL(sys_mdp.mdp_submodel)) && (sys_mdp.mdp_revision>=MDP_REVISION_ANVIL_P3))
#define ANVIL_128MB ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_ANVIL) && (sys_mdp.mdp_revision>=MDP_REVISION_ANVIL_128MB))
#define ANVIL_LP ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_ANVIL_LP))
#define ANVIL (ANVIL_SP || ANVIL_LP)
#define AMOEBA_SP ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_AMOEBA))
#define AMOEBA_P2 ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_AMOEBA) && (sys_mdp.mdp_revision>=2))
#define AMOEBA_128MB ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_AMOEBA) && (sys_mdp.mdp_revision>=7))
#define AMOEBA_LP ( (sys_mdp.mdp_model==MDP_MODEL_FENWAY) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_AMOEBA_LP))
#define AMOEBA (AMOEBA_SP || AMOEBA_LP)
#define LIMELIGHT ( (sys_mdp.mdp_model==MDP_MODEL_LIMELIGHT) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_LIMELIGHT_PROTO1))
#define FILLMORE ( (sys_mdp.mdp_model==MDP_MODEL_FILLMORE) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_FILLMORE_P1))
#define ENCORE ( (sys_mdp.mdp_model==MDP_MODEL_ENCORE) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_ENCORE))
#define SOLBASE ( (sys_mdp.mdp_model==MDP_MODEL_SOLBASE) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_SOLBASE_M0))
#define SOLBASE_P2 ( (sys_mdp.mdp_model==MDP_MODEL_SOLBASE) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_SOLBASE) && (sys_mdp.mdp_revision==MDP_REVISION_SOLBASE_M2))
#define ROYALE ( (sys_mdp.mdp_model==MDP_MODEL_ROYALE) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_ROYALE) )
#define IS_PARAMOUNT ( (sys_mdp.mdp_model==MDP_MODEL_PARAMOUNT) && (sys_mdp.mdp_submodel==MDP_SUBMODEL_PARAMOUNT) )

#endif
#endif
