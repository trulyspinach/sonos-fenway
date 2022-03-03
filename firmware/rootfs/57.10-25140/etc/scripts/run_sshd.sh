#!/bin/sh
# Copyright (c) 2019, Sonos, Inc.  All rights reserved.

mkdir -p /jffs/persist/ssh
mkdir -m 700 -p /jffs/sys/debug/ssh
if [ ! -f /jffs/sys/debug/ssh/authorized_keys ]; then
    touch /jffs/sys/debug/ssh/authorized_keys
fi
if [ ! -f /jffs/persist/ssh/dropbear_ecdsa_host_key ]; then
    /usr/bin/dropbearkey -t ecdsa -s 256 -f /jffs/persist/ssh/dropbear_ecdsa_host_key
fi
/usr/sbin/telnetd &
exec /usr/bin/dropbear -R
