#!/bin/sh

#############################################################################
#
# wifi.sh
#
# Assorted diagnostic functions for used to automate wireless testing
# without a test station.  All of the underlying tools are remaining the same
# for the moment, this just provides wrapper functions for doing common things
# (pulling files, pushing files, kicking off apps, associating, etc).
#
# The general idea in using this for testing is to have the DUT do everything
# it needs to do and then push status to the WiFi master.  This should avoid
# extraneous wireless traffic as the link is only used when the test is
# complete.  Perhaps a little hairy for pertest, but sending a single small
# packet every 10 seconds or so shouldn't matter.
#
# Ultimately there will be a web page served by the WiFi master that can be
# used to get status and kick things off.  AJAX will probably make an
# appearance to provide useful feedback without mucking with the test (DUT
# pushs data every now and then, page polls master for updates and displays
# them to the user).  A little tricky to avoid interactions with the tests, but
# not impossible.
#
# Note that most of the output is in plain text.  It is expected that other
# scripts will process this and convert it to HTML.
#
#############################################################################

#
# Generic variables
#
VERSION="1.01"

#
# Server variables
#
SERVER_WIRED_IP="169.254.2.2"

#
# Master variables
#
MASTER_WIRELESS_IP="169.254.254.254"
MASTER_WIRED_IP="169.254.254.254"

#
# DUT variables
#
DUT_WIRELESS_IP="169.254.1.1"
DUT_WIRED_IP="169.254.1.1"

DUT_MODEL="unknown"
DUT_SUBMODEL="unknown"
DUT_FULL_MODEL="unknown"
DUT_SKU="unknown"

DEFAULT_CHANNEL=2412
DEFAULT_MASTER_MCS=7
DEFAULT_MASTER_ANT=-1
DEFAULT_MASTER_MCS_5GHZ=7

DEFAULT_DUT_MCS=7
DEFAULT_DUT_ANT=3

DUTTX_MCS=3
DUTTX_ANT0=-1
DUTTX_ANT1=-2
DUTTX_ANT2=-4

TXCAL_MCS=-11
TXCAL_ANT=-1

DEFAULT_IF="ath0"
CURRENT_IF=${DEFAULT_IF}

set_if()
{
    ifce="$1";

    case "${ifce}" in
	"ath0")  CURRENT_IF=${ifce};;
	"ath1")  CURRENT_IF=${ifce};;
	*)       CURRENT_IF=${DEFAULT_IF};;
    esac
}

get_if()
{
    echo ${CURRENT_IF} 
}

get_duttx_mcs()
{

    duttxmcs_file="/jffs/duttx_mcs.txt"
    if [ -f ${duttxmcs_file} ] ; then
        cat ${duttxmcs_file}
        return
    fi
    echo $DUTTX_MCS
}

get_master_id()
{

    master_id_file="/jffs/wifiMasterID"
    if [ -f ${master_id_file} ] ; then
        cat ${master_id_file}
        return
    fi
    echo ""
}

get_isolationbox_id()
{

    isolationbox_id_file="/jffs/isolationBoxID"
    if [ -f ${isolationbox_id_file} ] ; then
        cat ${isolationbox_id_file}
        return
    fi
    echo ""
}

get_file_content()
{
    file="$1";

    if [ -f ${file} ] ; then
        cat ${file}
        return
    fi
    echo ""
}

#############################################################################
#
# clean() will remove existing rssi.txt or rssi.html.
#
#############################################################################
clean()
{
 
    /bin/rm /tmp/rssi.* 2>&1
        
}

#############################################################################
#
# check_wireless_if() will detect desinated interface exist or not.
#
#############################################################################
check_wireless_if()
{
 
    if="$1";

    /sbin/ifconfig -a > /tmp/ifconfig.txt
    existedif=`grep ${if} /tmp/ifconfig.txt | head -1 | cut -d ' ' -f 1`
    if [ "${existedif}" = "${if}" ]; then
	echo 1
    else
	echo 0    
    fi
        
}

#############################################################################
#
# run_cmd() will exectue desinated command and return result.
#
#############################################################################
run_cmd()
{
    if [ $1 == "ifconfig" ]; then
        ifconfig $2 $3 $4 $5 > /tmp/ifconfig.txt
        cat /tmp/ifconfig.txt
    elif [ $1 == "ps" ]; then
        ps $2 $3 $4 $5 > /tmp/ps.txt
        cat /tmp/ps.txt
    elif [ $1 == "mdputil" ]; then
        mdputil > /tmp/mdputil.txt
        cat /tmp/mdputil.txt
    else
        result=`$1 $2 $3 $4 $5`
        echo $result
    fi
}

#############################################################################
#
# get_sku()
#
#############################################################################
get_sku()
{
    # Grab the output of mdputil on the DUT
    /bin/mdputil > /tmp/mdp.txt 2>&1
        
    # Parse it to see what we have
    model=`cat /tmp/mdp.txt | grep MODEL | grep -v SUB | cut -c 7-`
    submodel=`cat /tmp/mdp.txt | grep SUBMODEL | cut -c 10-`

    case "${model}:${submodel}" in
	"1:2")  echo "ZP100";;
	"1:3")  echo "ZP100";;
	"1:16") echo "ZP90";;
	"7:0")  echo "DOCK";;
	"8:1")  echo "ZPS3";;
	"8:2")  echo "ZPSW";;
	"16:3") echo "ZP120";;
	"16:4") echo "ZPS5";;
	*)      echo "(model=${model}, submodel=${submodel})";;
    esac
}

get_serial()
{
    serialfile="/jffs/serialnum"
    if [ -f ${serialfile} ] ; then
        cat ${serialfile}
        return
    fi
    echo "NA"
}

#############################################################################
#
# get_arch()
#
#    Return architecture based on the sku.
#
#############################################################################
get_arch()
{
    case `get_sku` in
 	"ZP80")  echo "sh4";;
 	"ZP90")  echo "sh4";;
	"ZP100") echo "sh4";;
	"DOCK") echo "mips24k";;
	"ZPS3") echo "fenway";;
	"ZPSW") echo "Anvil";;
	*) echo "ppc";
    esac	
}

#############################################################################
#
# get_eth_port()
#
#    Return configured ethernet port based on the passed in sku.  No idea
# why it is passed in here, but it is...
#
#############################################################################
get_eth_port()
{
    sku="$1";

    case "${sku}" in
	"ZP80")  echo "eth0";;
	"ZP90")  echo "eth0";;
	"ZP100") echo "eth0";;
	"DOCK")  echo "eth0";;
	"ZPS3")  echo "eth0";;
	"ZPSW")  echo "eth0";;
	"ZPS5")  echo "eth0";;
	*)       echo "eth1";;
    esac
}

#############################################################################
#
# get_chains()
#
#   Return the number of chains supported by the currently installed wifi card.
#
#############################################################################
get_chains()
{
    chaincount=`cat /proc/ath_rincon/status | grep Chains | cut -d ' ' -f 3`
    
    if [ "z${chaincount}z" = "zz" ]; then
	echo "3"
    else
	echo "${chaincount}"
    fi
}

#############################################################################
#
# set_chains()
#
#   Set chains supported by the currently installed wifi card.
#
#############################################################################
set_chains()
{
    wifitype=`get_wifi_type`
    wificonfig=/wifi/${wifitype}/athconfig

    ${wificonfig} setnchains ${CURRENT_IF} $1
	
    echo "OK\n";
}

#############################################################################
#
# set_tx_power()
#
#   Set transmit power on desinated frequency.
#
#############################################################################
set_tx_power()
{

    freq=$1
    gpwrdBm=$2
    npwrdBm=$3
    MCS=$4
    wifitype=`get_wifi_type`
    wificonfig=/wifi/${wifitype}/athconfig

    ## /wifi/N/athconfig settxpower netif 2412|2437|2462|5GHzChan gpwrdBm npwrdBm [MCS]
    ret=`${wificonfig} settxpower ${CURRENT_IF} ${freq} ${gpwrdBm} ${npwrdBm} ${MCS}`

    if [ "${ret}" = "" ]; then
        echo "OK\n";
    fi
}

#############################################################################
#
# get_card()
#
#    Return a unique string for every variant of wifi card that we support.
# The algorithm for this is entertaining, so you'll need to look in the code.
#
#############################################################################
get_card()
{
    cardtype=`cat /proc/ath_rincon/cardtype`
    chains=""
    mfg=""
    
    if [ "z${cardtype}z" = "z5416z" ]; then

	if [ `get_chains` = "2" ]; then

	    chains="_2x2"
	    	    
	    case `cat /tmp/wifi_card_mac_addr | cut -c 0-8` in
		"00:0B:6B") mfg="_wistron";;
		"00:1D:6A") mfg="_alpha";;
		"5C:33:8E") mfg="_alpha";;
		*) ;;
	    esac
	fi
    fi
    
    echo "${cardtype}${chains}${mfg}"
}

#############################################################################
#
# upgrade stuff: TBD
#
#############################################################################
get_upd_path()
{
    arch=$1
    /usr/bin/wget -q -O - "http://${SERVER_WIRED_IP}/wifi/${arch}" | grep upd | tail -1 | cut -d '"' -f 6
}

get_upd_version_from_name()
{
    echo "$1" | cut -d '_' -f 1
}

upgrade_available()
{    
    arch=`get_arch`

    VERSION=`cat /VERSION`
    current=`get_upd_version_from_name ${VERSION}`
    path=`get_upd_path ${arch}`

    # echo "current: ${current}<br>path: ${path}<br>";

    if [ "${path}Z" != "Z" ]; then
	update=`get_upd_version_from_name ${path}`
	if [ "${update}" != "${current}" ]; then
	    echo "${arch}/${path}"
	fi
    fi
}

dut_upgrade_available()
{
    /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/jffs/diags/wifi.sh?upgrade_available" 2>&1
}

upgrade_forked()
{
    upd=`upgrade_available`

    if [ "${upd}Z" != "Z" ]; then

	path="http://${SERVER_WIRED_IP}/wifi/${upd}"
	echo "UPGRADE: path = ${path}"
	
    # Attempt to upgrade
	/bin/touch /var/run/stopanacapa
	/usr/bin/killall anacapad
	/bin/upgrade -f "${path}"
    
    # This is bad, fire up the web interface again
	/bin/rm /var/run/stopanacapa
    fi    
}

upgrade()
{
    /usr/bin/forker /jffs/diags/wifi.sh upgrade_forked
}

dut_upgrade()
{
    /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/jffs/diags/wifi.sh?upgrade" 2>&1
}


#############################################################################
# 
# get_wifi_type()
#
# Sets WIFI_TYPE to the WIFI_TYPE of whatever we're running on.  No web
# trickery here...
#
#############################################################################
get_wifi_type()
{
    tmp=`mdputil | grep ^HWFEATURES | awk '{if (match($0, "ATH_AR5416_WIFI")) print "N"; else print "G";}'`

    WIFI_TYPE=`mdputil | grep ^MODEL | awk '{if (match($0, "16")) print "N"; else print "X";}'`
    if [ "${WIFI_TYPE}" = "X" ] ; then
        WIFI_TYPE=`mdputil | grep ^MODEL | awk '{if (match($0, "8")) print "N"; else print "X";}'`
    fi

    if [ "${WIFI_TYPE}" = "X" ] ; then
        WIFI_TYPE=$tmp
    fi

    echo "${WIFI_TYPE}"
}

#############################################################################
#
# get_is_master()
#
# All sorts of ways to figure this out, I've opted for looking to see if the 
# wireless interface is in INFRA mode.
#
#############################################################################
get_is_master()
{
    if grep -q INFRA /proc/ath_rincon/status; then
	return 0
    fi

    return 1
}

#############################################################################
# 
# get_status() and friends
#
#############################################################################
get_wireless_mac()
{
    if=$1

    /sbin/ifconfig > /tmp/ifconfig.txt
    if [ -z ${if} ]; then
        grep ${CURRENT_IF} /tmp/ifconfig.txt | head -1 | cut -d ' ' -f 11
    else
        grep ${if} /tmp/ifconfig.txt | head -1 | cut -d ' ' -f 11
    fi    
}

get_cal_info()
{
    if [ -f ${1} ] ; then
        cal=`head -1 ${1} | awk '/[0-9.-]+ [0-9.-]+ [0-9.-]+ [0-9-]+/{print $4" ("$1", " $2", "$3")"}'`
        if [ "$cal" ] ; then
            echo "Yes on ${cal}"
            return
        fi
    fi
    echo "No"
}

get_status()
{
    /sbin/ifconfig ${CURRENT_IF} up
    /sbin/ifconfig > /tmp/ifconfig.txt

    # SKU, ports, card types
    sku=`get_sku`
    port=`get_eth_port ${sku}`
    card=`get_card`

    serial=`get_serial`

    # MAC(s)
    wirelessMac=`get_wireless_mac`   
    wiredMac=`grep ${port} /tmp/ifconfig.txt | head -1 | cut -d ' ' -f 11`
    
	wifitype=`get_wifi_type`
    wificonfig=/wifi/${wifitype}/athconfig

    # Dump it

    title="DUT"
    if get_is_master; then
	title="Master"
    fi
    
    binVersion=`cat /VERSION`
    #availableVersion=`upgrade_available`

    echo "<div class='statusTable'>"
    echo "<table border=1 cellpadding=3 cellspacing=1 frame=box>"
    echo "<tr><th colspan='2'>${title}</th></tr>"
    echo "<tr><td>SKU</td><td>${sku}</td></tr>"
    echo "<tr><td>Serial number</td><td>${serial}</td></tr>"
    echo "<tr><td>Card</td><td>${card}</td></tr>"
    echo "<tr><td>Binary version</td><td>${binVersion}</td></tr>"

# if [ "${availableVersion}Z" != "Z" ]; then
#    echo "<tr><td>Available version</td><td>${availableVersion}</td></tr>"
#fi

    echo "<tr><td>Script version</td><td>${VERSION}</td></tr>"
    echo "<tr><td>Wired MAC</td><td>${wiredMac}</td></tr>"
    echo "<tr><td>Wireless MAC</td><td>${wirelessMac}</td></tr>"

    if get_is_master; then
        txcalibration=`get_cal_info /jffs/txcal.dat`
        rxcalibration=`get_cal_info /jffs/rxcal.dat`
        echo "<tr><td>TX Calibrated</td><td>${txcalibration}</td></tr>"
        echo "<tr><td>RX Calibrated</td><td>${rxcalibration}</td></tr>"
    else
        if [ -f /jffs/txcal.dat ] ; then
            txcalibration=`get_cal_info /jffs/txcal.dat`
            echo "<tr><td>TX Calibrated</td><td>${txcalibration}</td></tr>"
        fi
        if [ -f /jffs/rxcal.dat ] ; then
            rxcalibration=`get_cal_info /jffs/rxcal.dat`
            echo "<tr><td>RX Calibrated</td><td>${rxcalibration}</td></tr>"
        fi
        ssid=`${wificonfig} getassoc ${CURRENT_IF} | awk -F, '{print $1}' | cut -c 20-`
        echo "<tr><td>Associated AP</td><td>${ssid}</td></tr>"
    fi

    echo "</table>"
    echo "</div>"
}

#############################################################################
#
# dut_*() functions
#
# Sometimes you can only talk to the master, but you want something from the 
# DUT (e.g. AJAX from a web page running on the master).
#
#############################################################################
dut_get_status()
{
    /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/jffs/diags/wifi.sh?status" 2>&1
}

dut_reboot()
{
    /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/sbin/reboot";
}

#############################################################################
#
# File copies.  We can only pull, so we push by getting the other guy to pull
#
#############################################################################
copy_from_dut()
{
    src=$1
    dst=$2

    /usr/bin/wget -q -O $dst "http://${DUT_WIRED_IP}:1400/diag/SLASH/${src}"
}

copy_to_dut()
{
    src=$1
    dst=$2

    #
    # We could tell the DUT to copy from us directly, but it may not have this script 
    # installed.  Sad, but true.
    #
    /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/bin/rm?${dst}" > /tmp/cmd.txt 2>&1
    /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/usr/bin/wget?http://${MASTER_WIRED_IP}:1400/SLASH${src}&-O&${dst}" >> /tmp/cmd.txt 2>&1
    /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/bin/chmod?777&${dst}" >> /tmp/cmd.txt 2>&1    
}

#############################################################################
#
# upgrades (master and DUT)
#
#    Really hacky at the moment, but eventually needs to have a manifest and
#    a way to detect when the DUT is out of sync.
#
#############################################################################
upgrade_web()
{
    if get_is_master; then
	
        # Grab stuff from server and push it
	for i in `/usr/bin/wget -q -O - "http://${SERVER_WIRED_IP}/wifi" | grep -e alt | grep -v DIR | cut -d '"' -f 6`; do
	    echo -n "MASTER: Grabbing ${i} from server ... "
	    rm /jffs/diags/${i} > /dev/null 2>&1
	    /usr/bin/wget -q -O /jffs/diags/${i} "http://${SERVER_WIRED_IP}/wifi/${i}"
	    echo "done."
	    chmod 777 /jffs/diags/${i} > /dev/null 2>&1
	done    
	
        # Push to the DUT
	push
    fi

    exit 0
}

push()
{
    for i in wifi.sh; do
	echo -n "MASTER: Pushing ${i} to DUT ... "
 	copy_to_dut /jffs/diags/${i} /jffs/diags/${i}
	echo "done."
    done
}

push_file_from_master_to_dut()
{
    if [ -f $1 ] ; then
        echo -n "MASTER: Pushing $1 to DUT ... "
        copy_to_dut $1 $1
    fi
}

#############################################################################
#
# wifi support functions
#
#############################################################################
channel_to_frequency()
{
###	/******* GL. 5GHz *******/
    case "$1" in 
	"1")  echo "2412";;
	"6")  echo "2437";;
	"11") echo "2462";;
	"36") echo "5180";;
	"40") echo "5200";;
	"44") echo "5220";;
	"48") echo "5240";;
	"52") echo "5260";;
	"56") echo "5280";;
	"60") echo "5300";;
	"64") echo "5320";;
	"100") echo "5500";;
	"104") echo "5520";;
	"108") echo "5540";;
	"112") echo "5560";;
	"116") echo "5580";;
	"120") echo "5600";;
	"124") echo "5620";;
	"128") echo "5640";;
	"132") echo "5660";;
	"136") echo "5680";;
	"140") echo "5700";;
	"149") echo "5745";;
	"153") echo "5765";;
	"157") echo "5785";;
	"161") echo "5805";;
	"165") echo "5825";;
	*) echo "DOH";;
    esac
}

wifi_init()
{
    if [ "$1" = "html" ] ; then
        echo "<!--"
    fi

    tx_stop

    ifconfig ${CURRENT_IF} up

    wifitype=`get_wifi_type`
    wificonfig=/wifi/${wifitype}/athconfig

    # Adjust the flux capacitors
    ${wificonfig} psenable        ${CURRENT_IF} 0
    ${wificonfig} csenable        ${CURRENT_IF} 0
    ${wificonfig} phyerrcalenable ${CURRENT_IF} 0
    ${wificonfig} percalenable    ${CURRENT_IF} 0

    ${wificonfig} setchannel ${CURRENT_IF} $DEFAULT_CHANNEL

    ${wificonfig} forcetxrate     ${CURRENT_IF} 1

    if get_is_master; then
#        ${wificonfig} setnchains      ${CURRENT_IF} $DEFAULT_MASTER_ANT
        ${wificonfig} setmcs          ${CURRENT_IF} $DEFAULT_MASTER_MCS
    else
#        ${wificonfig} setnchains      ${CURRENT_IF} $DEFAULT_DUT_ANT
        ${wificonfig} setmcs          ${CURRENT_IF} $DEFAULT_DUT_MCS
    fi

    ${wificonfig} clearrxhistory      ${CURRENT_IF}

    if [ "$1" = "html" ] ; then
        echo "-->"
    fi
}

#############################################################################
#
# Pertest
#
#    Wrapper around the original pertest.  We need to set up both sides, but
#    it's pretty simple.
#
#############################################################################
pertest_start()
{
    # My kingdom for a path...
    if [ -f /jffs/diags/pertest ] ; then
        pertest="/jffs/diags/pertest"
    else 
        pertest="/usr/bin/pertest"
    fi
    
    if get_is_master; then

        channel=$1
        txant=$2
        txpktrate=$3
        txpktsize=$4
        txpktframe=$5

        # echo "c=${channel} txa=${txant} txr=${txpktrate} txs=${txpktsize}"
	
        # Make sure we have LEDs
        if /sbin/lsmod | grep -q audiodev; then
            echo "MASTER: We have audio"
        els--
            echo "MASTER: Loading audiodev (we needs our LEDs!)"
            /sbin/insmod /modules/audiodev.o
        fi

        wifi_init

        # Start DUT
        mac=`get_wireless_mac`
        /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/jffs/diags/wifi.sh?pertest_start&"${mac}"&${channel}"

        if  [ "$1" -gt "11" ] ; then
            wifitype=`get_wifi_type`
            wificonfig=/wifi/${wifitype}/athconfig
            ${wificonfig} setmcs ${CURRENT_IF} $DEFAULT_MASTER_MCS_5GHZ
        fi

	# Start the transmitter back up
        forker ${pertest} --tx --channel ${channel} --txantenna ${txant} --txpktrate ${txpktrate} --txpktsize ${txpktsize} --txpktframe ${txpktframe}

    else

        mac=$1
        channel=$2

        echo "DUT: mac=${mac} channel=${channel}"

        # Adjust the flux capacitors
        wifi_init
	
        forker ${pertest} --rx ${mac} --channel ${channel}
    fi
}

pertest_stop()
{
    killall pertest 2> /dev/null
    
    if get_is_master; then
        /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/jffs/diags/wifi.sh?pertest_stop"
    fi
}

pertest_results()
{
    if get_is_master; then
        /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/jffs/diags/wifi.sh?pertest_results"
    else
        tail -20 /tmp/PERtest.log
    fi    
}

wifitest_version()
{    

    # wifitest-wired is always downloaded to /tmp bu wifi test station.
    if [ -f /tmp/wifitest-wired ] ; then
        wifitest="/tmp/wifitest-wired"
    elif [ -f /jffs/diags/wifitest-wired ] ; then
        wifitest="/jffs/diags/wifitest-wired"
    else 
        wifitest="/usr/bin/wifitest-wired"
    fi
    echo `${wifitest} --version`
}


#############################################################################
#
# dutrx:
#
#   Both sides are automated by the test station, wifitest-wired lives in 
#   /tmp.
#
#   Use these values to do test: 
#     --runtime 1 --pktrate 0 --pktsize 512 \
#
# Only when txcount ==3 it print out rssi.txt. 
#############################################################################
dutrx()
{    
    ifce=$1
    runtime=$2
    pktrate=$3
    pktsize=$4
    limits=$5
    txantenna=$6
    rxantenna=$7

    # KLUDGE: NO LIMITS!!! 
    #if [ "${limits}Z" = "Z" ]; then
        limits="0";
    #fi

    if [ -n $ifce ] ; then
        set_if $ifce
    fi

    if [ -f /jffs/diags/wifitest-wired ] ; then
        wifitest="/jffs/diags/wifitest-wired"
    else
        wifitest="/usr/bin/wifitest-wired"
    fi

    wifitype=`get_wifi_type`
    wificonfig=/wifi/${wifitype}/athconfig

    if get_is_master; then
		
        # Perform generic wifi init
        wifi_init

        ${wificonfig} setnchains ${CURRENT_IF} $txantenna

	/usr/bin/forker ${wifitest} --server --if ${CURRENT_IF}

        # Start the DUT
	/usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/jffs/diags/wifi.sh?dutrx&${CURRENT_IF}&${runtime}&${pktrate}&${pktsize}&${limits}&${txantenna}&${rxantenna}"
		
    else
		
        wifi_init

        # Grab our serial number
        serial=`get_serial`

        model=`get_sku`
        card=`get_card`
        chains=`get_chains`

        ${wificonfig} setnchains ${CURRENT_IF} $rxantenna

        # Back to life
        ${wifitest} --dutrx \
            --runtime ${runtime} --pktrate ${pktrate} --pktsize ${pktsize} \
            --model ${model} \
            --card ${card} \
            --serial ${serial} \
            --txantenna ${txantenna} \
            --rxantenna ${rxantenna} \
            --xml \
            --if ${CURRENT_IF} \
            ${limits} \
            2> /tmp/wifitest.stderr

        cat /tmp/rssi.html
        echo "Wireless Transmit from Master to DUT."
    fi

}



#############################################################################
#
# dutrx_mfg:
#
#   Both sides are automated by the test station, wifitest-wired lives in 
#   /tmp.
#
#   Use these values to do test: 
#     --runtime 1 --pktrate 0 --pktsize 512 \
#    --tx2dot4GHzAntenna -1 ## chain 0 on master for 2.4GHz channles
#    --tx5GHzAntenna -4       ## chain 2 on master for 5GHz channels
#
# Only when txcount ==3 it print out rssi.txt. 
#############################################################################
dutrx_mfg()
{    
    ifce=$1
    txantenna=$2
    rxantenna=$3
    limitfile=$4

    # Image is always downloaded to /tmp
    wifitest="/tmp/wifitest-wired"

    if [ -n $ifce ] ; then
        set_if $ifce
    fi

    #we use these as default
    runtime=1
    pktrate=200
    pktsize=512
    
    if get_is_master; then
		
        # Perform generic wifi init
        wifi_init

        ${wificonfig} setnchains ${CURRENT_IF} $txantenna
        ${wificonfig} psenable   ${CURRENT_IF} 1

        # Fire the server back up
        /usr/bin/forker ${wifitest} --server --if ${CURRENT_IF}

#        /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/tmp/wifi.sh?dutrx_mfg&${CURRENT_IF}&${txantenna}&${rxantenna}&${limitfile}"

        echo "OK";
			
    else

        # Make sure anything that prints below is in a comment
        echo "<!-- ";

        wifi_init

        # Grab our serial number
        serial=`get_serial`
        mac=`get_wireless_mac`
	
        # Close comment
        echo " -->";

        model=`get_sku`
        card=`get_card`
        chains=`get_chains`

        ${wificonfig} setnchains ${CURRENT_IF} $rxantenna

        # Let 'er rip	
        ${wifitest} --dutrx \
            --runtime ${runtime} --pktrate ${pktrate} --pktsize ${pktsize} \
            --txantenna ${txantenna} \
            --rxantenna ${rxantenna} \
            --xml --limits \
            --xmlfile ${limitfile} \
            --model ${model} \
            --card ${card} \
            --serial ${serial} \
            --mac ${mac} \
            --progress ${rxprogress} \
            2> /tmp/wifitest.stderr

        echo "Wireless Transmit from Master to DUT."

    fi
}



#############################################################################
#
# duttx: MRN new for DUT TX testing may need 2 functions? 
#
#   Both sides are automated by the test station, wifitest-wired lives in 
#   /tmp.
#   Use these values to do test: 
#    runtime=1
#    pktrate=0
#    pktsize=256
#
# Only when txcount ==3 it print out rssi.txt. 
#############################################################################
duttx()
{    
    ifce=$1
    runtime=$2
    pktrate=$3
    pktsize=$4
    limits=$5
    txantenna=$6
    rxantenna=$7

    # wifitest-wired is always downloaded to /tmp bu wifi test station.
    if [ -f /tmp/wifitest-wired ] ; then
        wifitest="/tmp/wifitest-wired"
    elif [ -f /jffs/diags/wifitest-wired ] ; then
        wifitest="/jffs/diags/wifitest-wired"
    else 
        wifitest="/usr/bin/wifitest-wired"
    fi

    if [ -n $ifce ] ; then
        set_if $ifce
    fi
 
    wifitype=`get_wifi_type`
    wificonfig=/wifi/${wifitype}/athconfig

    if get_is_master; then
	
        # Perform generic wifi init
        wifi_init

        card=`get_card`

        ${wificonfig} setnchains ${CURRENT_IF} $rxantenna

        # Fire the server back up
        /usr/bin/forker ${wifitest} --serverrx --card ${card} --if ${CURRENT_IF}
        ## start up DUT side 
        /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/jffs/diags/wifi.sh?duttx&${CURRENT_IF}&${runtime}&${pktrate}&${pktsize}&${limits}&${txantenna}&${rxantenna}"

        echo "OK";

    else

        # Make sure anything that prints below is in a comment
        echo "<!-- ";

        wifi_init

        # Grab our serial number
        serial=`get_serial`
        mac=`get_wireless_mac`
	
        # Close comment
        echo " -->";

        model=`get_sku`
        card=`get_card`
        chains=`get_chains`
	mcs=`get_duttx_mcs`

        ${wificonfig} forcetxrate ${CURRENT_IF} 1
        ${wificonfig} setmcs ${CURRENT_IF} ${mcs}
        ${wificonfig} setnchains ${CURRENT_IF} $txantenna

        ${wifitest} --duttx \
            --runtime ${runtime} --pktrate ${pktrate} --pktsize ${pktsize} \
            --model ${model} \
            --card ${card} \
            --txantenna ${txantenna} \
            --rxantenna ${rxantenna} \
            --serial ${serial} \
            --mac ${mac} \
            --if ${CURRENT_IF} \
            --xml \
            --limits \
            2> /tmp/wifitest.stderr

        /usr/bin/wget -q -O - "http://${MASTER_WIRED_IP}:1400/SLASH/tmp/rssi.txt"

        echo "Wireless Transmit from DUT to Master."
    fi
}

#############################################################################
#
# duttx: MRN new for DUT TX testing may need 2 duttx_mfg functions? 
#
#   Both sides are automated by the test station, wifitest-wired lives in 
#   /tmp.
#   Use these values to do test: 
#    runtime=1
#    pktrate=0
#    pktsize=256
#
# Only when txcount ==3 it print out rssi.txt. 
#############################################################################
duttx_mfg()
{    

    ifce=$1
    txantenna=$2
    rxantenna=$3
    limitfile=$4

    #we use these as default
    runtime=1
    pktrate=200
    pktsize=256

    # wifitest-wired is always downloaded to /tmp bu wifi test station.
    if [ -f /tmp/wifitest-wired ] ; then
        wifitest="/tmp/wifitest-wired"
    elif [ -f /jffs/diags/wifitest-wired ] ; then
        wifitest="/jffs/diags/wifitest-wired"
    else 
        wifitest="/usr/bin/wifitest-wired"
    fi

    if [ -n $ifce ] ; then
        set_if $ifce
    fi

    wifitype=`get_wifi_type`
    wificonfig=/wifi/${wifitype}/athconfig
 
    if get_is_master; then
	
        # Perform generic wifi init
        wifi_init

        card=`get_card`

        ${wificonfig} setnchains ${CURRENT_IF} $rxantenna

        # Fire the server back up
        /usr/bin/forker ${wifitest} --serverrx --card ${card} --xmlfile ${limitfile} --if ${CURRENT_IF}
        ## start up DUT side 
#        /usr/bin/wget -q -O - "http://${DUT_WIRED_IP}:1400/diag/cgi-bin/tmp/wifi.sh?duttx_mfg&${CURRENT_IF}&${txantenna}&${rxantenna}&${limitfile}"

        echo "OK";

    else

        # Make sure anything that prints below is in a comment
        echo "<!-- ";

        wifi_init

        # Grab our serial number
        serial=`get_serial`
        mac=`get_wireless_mac`
	
        # Close comment
        echo " -->";

        model=`get_sku`
        card=`get_card`
        chains=`get_chains`
        mcs=`get_duttx_mcs`

        ${wificonfig} forcetxrate ${CURRENT_IF} 1
        ${wificonfig} setmcs ${CURRENT_IF} ${mcs}
        ${wificonfig} setnchains ${CURRENT_IF} $txantenna

        ${wifitest} --duttx \
            --runtime ${runtime} --pktrate ${pktrate} --pktsize ${pktsize} \
            --model ${model} \
            --card ${card} \
            --txantenna ${txantenna} \
            --rxantenna ${rxantenna} \
            --serial ${serial} \
            --mac ${mac} \
            --if ${CURRENT_IF} \
            --xml \
            --limits \
            2> /tmp/wifitest.stderr

        echo "Wireless Transmit from DUT to Master."
    fi
}

#############################################################################
#
# tx_stop:
#
#   Stops ALL transmission by killing the server
#
#############################################################################
tx_stop()
{
    if [ "$1" = "html" ] ; then
        echo "<!--"
    fi

    if [ "$1" = "txblast" ] ; then
        killall athconfig 2> /dev/null
    else
        killall athconfig 2> /dev/null
        killall pertest 2> /dev/null
        killall wifitest-wired 2> /dev/null
    fi
    if [ "$1" = "html" ] ; then
        echo "-->"
    fi
}
#############################################################################
#
# Main entry point
#
#############################################################################

echo "$1" >> /tmp/wifi_cmd.log

case "$1" in

    # Status functions.
    "--version") /bin/echo ${VERSION};;
    "wifitestversion") wifitest_version ;;
    "version") /bin/echo ${VERSION};;
    "status") get_status;;
    
    # DUT Logging (hacky, and going away).
    "log")     log_add "$2";;
    "logc")    log_clear;;
    
    # Master functions
    "reboot") sync; echo "We're going down!"; /sbin/reboot;;
    "push") push;;
    "copyto") copy_to_dut $2 $3;;
    "copyfrom") copy_from_dut $2 $3;;
    "upgrade_web") upgrade_web;;

    # Functions that the master proxies
    "dut_status") dut_get_status;;
    "dut_reboot") dut_reboot;;
    "dut_upgrade") dut_upgrade;;
    "dut_upgrade_available") dut_upgrade_available;;
    
    # Both master and DUT support
    "pertest_start") pertest_start $2 $3 $4 $5 $6;;
    "pertest_stop") pertest_stop;;
    "pertest_results") pertest_results;;

    "dutrx") dutrx $2 $3 $4 $5 $6 $7 $8;;
    "dutrx_mfg") dutrx_mfg $2 $3 $4 $5 $6 $7 $8;;
    "duttx") duttx $2 $3 $4 $5 $6 $7 $8;;
    "duttx_mfg") duttx_mfg $2 $3 $4 $5 $6 $7 $8;;

    "set_chains") set_chains $2;;
    "set_tx_power") set_tx_power $2 $3 $4 $5;;

    "get_serial") get_serial $2 $3 $4 $5;;
    "get_wireless_mac") get_wireless_mac $2;;
    "get_sku") get_sku;;
    "get_card") get_card;;
    "get_master_id") get_master_id;;
    "get_isolationbox_id") get_isolationbox_id;;
    "get_file_content") get_file_content $2;;
    "set_if") set_if $2;;
    "get_if") get_if;;

    "upgrade_available") upgrade_available;;
    "upgrade") upgrade;;
    "upgrade_forked") upgrade_forked;;

    "init") wifi_init $2 ;;
    "clean") clean $2 ;;
    "check_wireless_if") check_wireless_if $2 ;;
    "run_cmd") run_cmd $2 $3 $4 $5 $6 ;;
    "tx_stop") tx_stop $2 ;;

    # Default handler
    *) echo "Unknown command: $1";;

esac


