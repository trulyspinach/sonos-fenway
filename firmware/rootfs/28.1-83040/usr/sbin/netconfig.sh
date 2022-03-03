#!/bin/sh

case "$1" in
    sonosnet|station|open|credcheck|deauth)
        MODE="$1"
        ;;
    *)
        echo "Illegal mode!"
        exit 1
        ;;
esac

PARAM1="$2"
PARAM2="$3"

if [ -f /jffs/debug/testpoints.sh ]; then
    . /jffs/debug/testpoints.sh || true
fi

NETSETTINGSFILE=/jffs/netsettings.txt
if [ -f /ramdisk/tmp/netsettings_check.txt ]; then
    if [ "${MODE}" = "station" ] || [ "${MODE}" = "credcheck" ]; then
        NETSETTINGSFILE=/ramdisk/tmp/netsettings_check.txt
    fi
else
    if [ "${MODE}" = "credcheck" ]; then
        echo "credcheck file not found"
        exit 1
    fi
fi

MODEL=`mdputil | /usr/sbin/keyval ^MODEL`
SUBMODEL=`mdputil | /usr/sbin/keyval ^SUBMODEL`
WIFITYPE=`mdputil | /usr/sbin/keyval ^WIFITYPE`

ATHCONFIG=/wifi/athconfig

killall wpa_supplicant
if [ "${MODE}" = "station" ] || [ "${MODE}" = "credcheck" ]; then

    rm -f /var/run/wpa_supplicant.conf
    $ATHCONFIG stasetkeylen ath0 0

    if [ -f /jffs/debug/wpa_supplicant.conf ]; then
        WPACONFIG=/jffs/debug/wpa_supplicant.conf
    else
        WPACONFIG=/var/run/wpa_supplicant.conf
        /wifi/wpaconfig ${NETSETTINGSFILE} ${WPACONFIG}
    fi

    if [ -f /jffs/debug/supplicant ]; then
        WPADEBUG="-dd -t -K"
    else
        WPADEBUG="-t"
    fi

    if [ -f /jffs/debug/wpa_supplicant ]; then
        WPABIN=/jffs/debug/wpa_supplicant
    else
        WPABIN=/wifi/wpa_supplicant
    fi

    KEYHEX=`/usr/sbin/keyval ^NFWPwd ${NETSETTINGSFILE}`
    $ATHCONFIG stasetkeylen ath0 ${#KEYHEX}
fi

if [ "${MODE}" = "credcheck" ]; then

    $ATHCONFIG stasetenable ath0 2
    ${WPABIN} -s -B -D sonos -i ath0 -c ${WPACONFIG} ${WPADEBUG}

    exit 0
fi


touch /var/run/waitforip

if [ -f /tmp/udhcpc.pid ]; then kill `cat /tmp/udhcpc.pid`; fi
if [ -f /tmp/hostapd.pid ]; then kill `cat /tmp/hostapd.pid`; fi

$ATHCONFIG setopenmode ath0 DISABLE
$ATHCONFIG stasetenable ath0 0
$ATHCONFIG stasetenable ath1 0
$ATHCONFIG scanabort ath0
$ATHCONFIG satenable ath0 0

/usr/sbin/brctl delif br0 eth0
/usr/sbin/brctl delif br0 eth1

/sbin/ifconfig ath0 down
/sbin/ifconfig ath1 down

/sbin/ifconfig br0 down
/usr/sbin/brctl delbr br0

if [ "${MODE}" = "deauth" ]; then
    /usr/sbin/setmac -S
    $ATHCONFIG setmode ath0 INFRA
    /sbin/ifconfig ath0 0.0.0.0
    exit 0
fi

AP=""
WEPKEY="disable"
HHID=""
CHANNEL=2412
PRIMARYUUID=""
PRIORITYBR=0
HAVE_NETSETTINGS=0
if [ -f ${NETSETTINGSFILE} ]; then
    HAVE_NETSETTINGS=1
    WEPKEY=`/usr/sbin/keyval ^WEPKey ${NETSETTINGSFILE}`
    HHID=`/usr/sbin/keyval ^HouseholdID ${NETSETTINGSFILE}`
    CHANNEL=`/usr/sbin/keyval ^Channel ${NETSETTINGSFILE}`
    PRIORITYBR=`/usr/sbin/keyval ^PriorityBridge ${NETSETTINGSFILE}`
    PRIMARYUUID=`/usr/sbin/keyval ^PrimaryUUID ${NETSETTINGSFILE}`
fi

if [ "${MODE}" = "open" ]; then

    if [ "${PARAM2}z" != "z" ]; then
        CHANNEL=${PARAM2}
    fi

    if [ -f /jffs/debug/openchannel ]; then
        CHANNEL=`cat /jffs/debug/openchannel`
    fi

    kill `cat /opt/log/anacapa.pid`

    /usr/sbin/setmac -L

    /sbin/ifconfig eth0 0.0.0.0
    /sbin/ifconfig eth1 0.0.0.0

    $ATHCONFIG setmode ath0 INFRA
    $ATHCONFIG setchannel ath0 $CHANNEL
    $ATHCONFIG setopenmode ath0 $PARAM1

    /sbin/ifconfig ath0 10.69.69.1

    /sbin/route add 255.255.255.255 ath0
    /sbin/route add -net 224.0.0.0 netmask 240.0.0.0 ath0
    exit 0

fi

/usr/sbin/brctl addbr br0
/usr/sbin/brctl sethello br0 1.0
/usr/sbin/brctl setfd br0 4.0
/usr/sbin/brctl setmaxage br0 6.0

if [ "${MODE}" = "sonosnet" ]; then

    BRMAC=`/usr/sbin/setmac | /usr/sbin/keyval ^eth0`

    /sbin/ifconfig eth0 0.0.0.0
    /sbin/ifconfig eth1 0.0.0.0

    /usr/sbin/brctl addif br0 eth0
    /usr/sbin/brctl addif br0 eth1

    /usr/sbin/brctl uplink br0 0

else

    BRMAC=`/usr/sbin/setmac -S | /usr/sbin/keyval ^eth0`

    /sbin/ifconfig eth0 0.0.0.0
    /sbin/ifconfig eth1 0.0.0.0

    /usr/sbin/brctl uplink br0 1
fi

if [ "${MODEL}" = "5" ]; then
    /sbin/ifconfig eth0 txqueuelen 100
fi

/usr/sbin/brctl setmac br0 ${BRMAC}


UUIDA=`/sbin/ifconfig eth0 | /usr/sbin/keyval -d: HWaddr`
UUIDP=`/usr/sbin/keyval ^Port /opt/conf/anacapa.conf`
UUID='RINCON_'$UUIDA'0'$UUIDP

$ATHCONFIG setmode ath0 INFRA

$ATHCONFIG setwepkey ath0 $WEPKEY
$ATHCONFIG setssid ath0 $HHID
$ATHCONFIG setchannel ath0 $CHANNEL
$ATHCONFIG ssidinbeaconenable ath0 0
$ATHCONFIG beaconenable ath0 0

if [ "${MODE}" = "station" ]; then

    $ATHCONFIG stasetenable ath0 1

else

    if [ "${MODEL}" = "9" ]; then

        $ATHCONFIG setuuid ath0 $UUID

        $ATHCONFIG setmode ath1 INFRA
        $ATHCONFIG setuuid ath1 $UUID
        $ATHCONFIG acs ath1 1
        $ATHCONFIG acslmenable ath1 1
        $ATHCONFIG setwepkey ath1 $WEPKEY
        $ATHCONFIG setssid ath1 $HHID
    fi

    if [ "${PRIMARYUUID}z" != "z" ]; then
        $ATHCONFIG setprimaryuuid ath0 $PRIMARYUUID
        $ATHCONFIG satenable ath0 1
    fi
fi

if [ "${MODEL}" = "7" ]; then
    /usr/sbin/brctl setbridgeprio br0 40960  # 0xa000
elif [ "$PRIORITYBR" = "1" ]; then
    /usr/sbin/brctl setbridgeprio br0 28672  # 0x7000
else
    /usr/sbin/brctl setbridgeprio br0 38912  # 0x9800
fi

/sbin/ifconfig br0 0.0.0.0

/sbin/ifconfig ath0 0.0.0.0

if [ "${MODE}" = "sonosnet" ]; then
    /sbin/ifconfig ath1 0.0.0.0
fi

if [ "${MODE}" = "station" ]; then
    ${WPABIN} -s -B -D sonos -i ath0 -b br0 -c ${WPACONFIG} ${WPADEBUG}
else
    /wifi/hostapd
fi

if [ "${MODEL}" = "5" ] || [ "${MODEL}" = "12" ]; then
    HOST="SonosZB"
elif [ "${MODEL}" = "7" ]; then
    HOST="SonosDock"
else
    HOST="SonosZP"
fi

/sbin/route add 255.255.255.255 br0
/sbin/route add -net 224.0.0.0 netmask 240.0.0.0 br0

if [ "${MODE}" = "station" ]; then
    DHCP_FLAGS="-z"
fi

if [ -f /jffs/debug/static_ipaddr ]; then
    ifconfig br0 $(cat /jffs/debug/static_ipaddr)
    rm -f /var/run/waitforip
else
    /sbin/udhcpc -f -s /etc/dhcp.script -i br0 -w ath0 -h ${HOST} -d access.bestbuy.com ${DHCP_FLAGS} &
fi

exit 0
