# Call this script from /jffs/system/Configure to configure a diag-build unit
# for pertest.
#     /etc/diags/pertest-config.sh <IP address>

ipaddr=$1
mode=INFRA
ssid=PERTEST

# Take down ethernet interfaces before adding bridge interface
/sbin/ifconfig eth0 down
/sbin/ifconfig eth1 down

# Set up bridge
/sbin/insmod /wifi/bridge.o
/usr/sbin/brctl addbr br0
/usr/sbin/brctl sethello br0 1.0
/usr/sbin/brctl setfd br0 4.0
/usr/sbin/brctl setmaxage br0 6.0

# Add ethernet interfaces to bridge
/sbin/ifconfig eth0 0.0.0.0
/usr/sbin/brctl addif br0 eth0
/sbin/ifconfig eth1 0.0.0.0
/usr/sbin/brctl addif br0 eth1

# Start up bridge interface
/sbin/ifconfig br0 $ipaddr

# Read the output of mdputil into environment variables.
eval `mdputil`

# Determine whether we're on Wembley
if [ "$MODEL" -eq "16" -a "$SUBMODEL" -eq  "3" ]; then
    # Wembley doesn't have /wifi/N and /wifi/G subdirs since it only supports G.
    wifiType=
else
    # Determine whether we have an 802.11G or 802.11N WiFi card.
    wifiType=`mdputil | grep ^HWFEATURES | awk '{if (match($0, "ATH_AR5416_WIFI")) print "N"; else print "G";}'`
fi

# Configure wireless interface
/wifi/$wifiType/athconfig setmode              ath0 $mode
/wifi/$wifiType/athconfig setssid              ath0 $ssid
/wifi/$wifiType/athconfig setwepkey            ath0 12345678901234567890123456789012
/wifi/$wifiType/athconfig setch11spurimmunitylevel ath0 4

# Bring up wireless interface.  The ifconfig MUST come before setchanel and
# setantswitch to avoid a hang!  The ath0 wireless interface gets its IP
# address from the br0 bridge interface.
/sbin/ifconfig ath0 0.0.0.0

# Configure wireless interface for Channel 1 in antenna diversity mode.
/wifi/$wifiType/athconfig setchannel   ath0 2412
/wifi/$wifiType/athconfig setantswitch ath0 V
