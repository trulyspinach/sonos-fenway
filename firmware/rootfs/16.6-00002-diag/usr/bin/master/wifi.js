//
// KLUDGE: Proxies only rewrite URLs in HTML, this isn't HTML.  Pass it
//         in from the page that loaded us.
//
var backendURL = "/diag/cgi-bin/jffs/diags/wifi.sh?";

var txcal_ref = 0;

var testedChannels = 6 ; 

function setBackendURL(url) {
    backendURL = url;
}

//
// Miscellaneous
//

function getAttr(element, name)
{
    // Walk all of the attributes of the element
    for (var attrIdx = 0; attrIdx < element.attributes.length; attrIdx++) {
        
        var attrNode = element.attributes[attrIdx];
        
        // If the name matches, return the value
        if (attrNode.nodeName == name) {
            return attrNode.nodeValue;
        }
    }
    
    return "";
}

function nodelistEnable(nodes, on)
{
    for (var idx = 0; idx < nodes.length; idx++) {
        
        var node = nodes[idx];	
        var name = getAttr(node, 'name');
        
        if (name == "") {
            continue;
        }

        node.disabled = on ? false : true;
    }
}

//
// Logging support.
//
function logCmd(url, callback, arg)
{
    var log = document.getElementById("log");

    log.innerHTML = log.innerHTML + 
        "<div class='logurl'>" + url + "</div>";

    loadHTML(url, callback, arg);
}

function logAdd(text)
{
    var log = document.getElementById("log");

    logProcess(log, text);
}

function logProcess(arg, text)
{
    var log = arg;

    var lines = text.split('\n');
    
    for (var i = 0; i < lines.length; i++) {
        
        log.innerHTML = log.innerHTML + 
            "<div class='logresults'>" +
            lines[i] +
            "</div>";
    }
    
}

function logClear(tag)
{
    var obj = document.getElementById(tag);

    obj.innerHTML = "";
}

//
// Navbar support.
//
var navbarElement = "";

function navbarDisplay(page)
{
    var liCol = navbarElement.getElementsByTagName('li');
    
    // Walk all of the <LI>s in the navbar
    for (var liIdx = 0; liIdx < liCol.length; liIdx++) {
        
        var node = liCol[liIdx];	
        var name = getAttr(node, 'name');
        
        // Protect me from myself...
        if (name == "") {
            continue;
        }
        
        // If the page matches, display it and light up the button
        if (name == page) {
            document.getElementById(name).style.display = "inline";
            node.firstChild.className = "selected";
        } else {
            document.getElementById(name).style.display = "none";
            node.firstChild.className = "deselected";
        }
    }
}

function navbarClick(e)
{
    e = e || (window.event || {});

    var element = e.srcElement || e.target;

    // Element points to the <a>, we want the <li>
    if (element && element.parentNode) {
        navbarDisplay(getAttr(element.parentNode, "name"));
    }
}

var navbarInitial = "";

function navbarInit(navbar, initialPage)
{
    navbarElement = navbar;    
    navbarInitial = initialPage;

    var nodeList = navbar.getElementsByTagName('li');
    
    // All clicks in the <LI>s go to navbarClick
    for (var i = 0; i < nodeList.length; i++) {
        nodeList[i].onclick = navbarClick;
    }
    
    // Enable the initial page, disable the rest
    navbarDisplay(initialPage);
}

function navbarReset()
{
    navbarDisplay(navbarInitial);
}

//
// State machine for updating status.  Attempting to report useful
// information for failures makes it a little ugly, but such is life.
//
// This all gets started by calling it with arg=0, and states fire off new
// events with this as the callback until we're done.
//

var masterVersion = "";

function processStatus(arg, text)
{
    var master = document.getElementById("masterStatus");
    var dut    = document.getElementById("dutStatus");

    // Log it.  Or not...
    // logProcess(log, text);

    switch (arg)
    {
    case 0:
        // Fire off initial event to get master status
        master.innerHTML = "<h3>MASTER: Requesting version<h3>";
        dut.innerHTML    = "";
        logCmd(backendURL + "version", processStatus, 1);
        break;

    case 1:
        // Have master version, get status
        if (-1 != text.indexOf("not found")) {
            master.innerHTML = "<h3>No wifi.sh on master?</h3>";
        } else {
            masterVersion = text.replace(/\n/, '');
            master.innerHTML = "<h3>MASTER: Requesting status<h3>";
            logCmd(backendURL + "status", processStatus, 2);
        }
        break;
        
    case 2:
        // Have master status, push files to DUT
        master.innerHTML = text;
	// Push script
	dut.innerHTML = "<h3>Pushing script</h3>";
	logCmd(backendURL + "push", processStatus, 3);
        break;

    case 3:
        // Pushed script, read DUT status
	dut.innerHTML = "<h3>DUT: Requesting status</h3>";
	logCmd(backendURL + "dut_status", processStatus, 4);
        break;
        
    case 4:
        // Incoming DUT status.  Maybe.
        if (-1 != text.indexOf("connect")) {
            dut.innerHTML = "<h3>DUT: Not present</h3>";
        } else {
	    // Is the slave status the same version as the master?
            if (-1 == text.indexOf(masterVersion)) {
		dut.innerHTML = "<h3>Unable to get status</h3><br><pre>" + 
		    text + 
		    "</pre>";
            } else {
                // Successful slave status, we're done
                dut.innerHTML = text;
            }
        }
        break;
                
    default:
        break;
    }    
}

function updateFields()
{    
    processStatus(0, "");
}

function upgradeWeb()
{
    simpleCmd("upgrade_web");
    processStatus(0, "");
    navbarReset();
}

function upgradeStateMachine(prefix, callback, arg, text)
{
    var cmd = backendURL + prefix;
    var log = document.getElementById("log");
    
    if (arg != 0 && text != "") {
	logProcess(log, text);
    }

    switch (arg)
    {
    case 0:
	// Is there an upgrade available?
	logCmd(cmd + "upgrade_available", callback, 1);
	break;

    case 1:
	if (text != "NONE") {
	    callback(999,"");
	}
	logCmd(cmd + "upgrade&" + text, callback, 999);
	break;

    default:
	break;
    }
}

function upgradeDUTStateMachine(arg, text)
{
    upgradeStateMachine("dut_", upgradeDUTStateMachine, 0, "");
}

function upgradeDUT()
{
    upgradeDUTStateMachine();
}

function upgradeMasterStateMachine(arg, text)
{
    upgradeStateMachine("", upgradeMasterStateMachine, 0, "");
}

function upgradeMaster()
{
    upgradeMasterStateMachine();
}


function simpleCmd(cmd)
{
    var log = document.getElementById("log");
    var url = backendURL + cmd;

    logCmd(url, logProcess, log);
}

//
// Master / DUT reboots
//
// Pretty hacky, but it's all I've got...
//
var rebootInProcess = 0;

function rebootUpdateFields()
{
    rebootInProcess = 0;
    document.getElementById("masterReboot").className = "";
    document.getElementById("dutReboot").className    = "";
    updateFields();
}

function rebootProcessLog(arg, text)
{
    logProcess(arg, text);
    setTimeout("rebootUpdateFields()", 10000);
}

function rebootCmd(cmd)
{
    if (0 == rebootInProcess) {

        rebootInProcess = 1;

        var url    = backendURL + cmd;
        var log    = document.getElementById("log");
        var master = document.getElementById("masterStatus");
        var dut    = document.getElementById("dutStatus");
        
        master.innerHTML = "<h3>Reboot in process...</h3>";
        dut.innerHTML    = "";
        
        document.getElementById("masterReboot").className = "disabled";
        document.getElementById("dutReboot").className    = "disabled";
        logCmd(url, rebootProcessLog, log);       
    }
}

//
// PERTEST
//

function pertestProcessLog(arg, text)
{
    // Just wrap it in a <pre>
    arg.innerHTML = "<pre>" + text + "</pre>";
}

function pertestUpdateLog()
{
    var url = backendURL + "pertest_results";
    var log = document.getElementById("pertestLog");
    
    // KLUDGE: Don't log this, it's too busy...
    loadHTML(url, pertestProcessLog, log);
}

var pertestTimerId = 0;

var pertestRunning = 0;

function pertestClick()
{
    var log = document.getElementById("pertestLog");


    // If the button said "start", start
    if (0 == pertestRunning)
    {
        log.innerHTML = "<h3>Starting...</h3>";
        pertestRunning = 1;
        document.getElementById("pertestStartStop").innerHTML = "Stop";
        
        //
        // Send a command to the master to fire up PERtest with 
        // the proper args.
        //
        simpleCmd("pertest_start&" + 
                  document.getElementById("pertestChannel").value +
                  "&" +
                  document.getElementById("pertestTxAnt").value +
                  "&" + 
                  document.getElementById("pertestPktRate").value +
                  "&" + 
                  document.getElementById("pertestPktSize").value +
                  "&" + 
                  document.getElementById("pertestPktFrame").value);

          
        // Disable the controls to show we're busy
        document.getElementById("pertestChannel").disabled = true;
        document.getElementById("pertestTxAnt").disabled = true;
        document.getElementById("pertestPktRate").disabled = true;
        document.getElementById("pertestPktSize").disabled = true;
        document.getElementById("pertestPktFrame").disabled = true;

        // Update the log every couple of seconds
        pertestTimerId = setInterval("pertestUpdateLog()", "2000");    
    }
    else
    {
        pertestRunning = false;
        document.getElementById("pertestStartStop").innerHTML = "Start";

        // Tell the master to shut 'er down
        simpleCmd("pertest_stop&" + document.getElementById("pertestChannel").value);

        // Enable the controls
        document.getElementById("pertestChannel").disabled = false;
        document.getElementById("pertestTxAnt").disabled = false;
        document.getElementById("pertestPktRate").disabled = false;
        document.getElementById("pertestPktSize").disabled = false;
        document.getElementById("pertestPktFrame").disabled = false;

        // Disable log updates
        clearInterval(pertestTimerId);                
        pertestTimerId = 0;
    }
}

//
// WIFI TEST
//

var dutrxTimerId = 0;
var dutrxCounter = 0;

var duttxTimerId = 0;
var duttxCounter = 0;


function dutrxEnable(on)
{
    var but = document.getElementById("dutrxStartStop_general");

    //
    // Handle the timer and the button
    //
    if (on) {
        
        if (dutrxTimerId) {
            clearInterval(dutrxTimerId);
            dutrxTimerId = 0;
        }
        
        but.className = "";
        
    } else {

        but.className = "disabled";

    }

    //
    // Handle all of the gadgets
    //
    var page  = document.getElementById("dutrxPage_general");
    
    nodelistEnable(page.getElementsByTagName('select'), on);
    nodelistEnable(page.getElementsByTagName('input'), on);
}

function dutrxProcessResults(arg, text)
{
    arg.innerHTML = text;

    dutrxEnable(1);
}

function dutrxCounterFunc()
{
    var results = document.getElementById("dutrxLog");
    var seconds = "seconds";

    //
    // Still alive
    //
    if (dutrxCounter == 1) {
        seconds = "second";
    }
    
    results.innerHTML = 
        "<div style='margin-top: 20px; text-align: center; width: 100%'>" +
        "<h2>DUT Rx Test took " + dutrxCounter + " " + seconds + "<h2></div>";
    
    dutrxCounter++;

}

function dutrx_general_Click()
{   
    var url     = backendURL + "dutrx";
    var results = document.getElementById("dutrxLog");

    //
    // Ignore clicks unless we're enabled
    //
    if ("disabled" != document.getElementById("dutrxStartStop_general").className) {

        //
        // Disable dutrx test gadgets
        //
        dutrxEnable(0);
        
        //
        // Set up a timer
        //
	dutrxCounter = 0;
        dutrxTimerId = setInterval("dutrxCounterFunc()", "1000");
        
        //
        // Fire away
        //        
        var limits = "0";
        
        if (document.getElementById("dutrxLimits_general").checked) {
            limits = "1";
        }
                
        url = url + 
            "&" + document.getElementById("dutrxIF_general").value +
            "&" + document.getElementById("dutrxRuntime_general").value +
            "&" + document.getElementById("dutrxPktRate_general").value + 
            "&" + document.getElementById("dutrxPktSize_general").value + 
            "&" + limits +
            "&" + document.getElementById("dutrxTxAnt_general").value +
            "&" + document.getElementById("dutrxRxAnt_general").value ;
		
        logCmd(url, dutrxProcessResults, results);
    }
}

function duttx_general_Click()
{   
    var url     = backendURL + "duttx";
    var results = document.getElementById("duttxLog");

    //
    // Ignore clicks unless we're enabled
    //
    if ("disabled" != document.getElementById("duttxStartStop_general").className) {

        //
        // Disable wifi test gadgets
        //
        duttxEnable(0);
        
        //
        // Set up a timer
        //
    	duttxCounter = 0;
        duttxTimerId = setInterval("duttxCounterFunc()", "1000");
        
        //
        // Fire away
        //        
        var limits = "0";
        
        if (document.getElementById("duttxLimits_general").checked) {
            limits = "1";
        }
                
        url = url + 
            "&" + document.getElementById("duttxIF_general").value +
            "&" + document.getElementById("duttxRuntime_general").value +
            "&" + document.getElementById("duttxPktRate_general").value + 
            "&" + document.getElementById("duttxPktSize_general").value + 
            "&" + limits +
            "&" + document.getElementById("duttxTxAnt_general").value +
            "&" + document.getElementById("duttxRxAnt_general").value ;
		
        logCmd(url, duttxProcessResults, results);
    }
}


// MRN adding DUT transmit to master test. 
//
// DUT TEST
//

function duttxEnable(on)
{
    var but = document.getElementById("duttxStartStop_general");

    //
    // Handle the timer and the button
    //
    if (on) {
        
        if (duttxTimerId) {
            clearInterval(duttxTimerId);
            duttxTimerId = 0;
        }
        
        but.className = "";
        
    } else {

        but.className = "disabled";

    }

    //
    // Handle all of the gadgets
    //
    var page  = document.getElementById("duttxPage_general");
    
    nodelistEnable(page.getElementsByTagName('select'), on);
    nodelistEnable(page.getElementsByTagName('input'), on);
}

function duttxProcessResults(arg, text)
{
    arg.innerHTML = text;

    duttxEnable(1);
}

function duttxCounterFunc()
{
    var results = document.getElementById("duttxLog");
    var seconds = "seconds";

    //
    // Still alive
    //
    if (duttxCounter == 1) {
        seconds = "second";
    }
    
    results.innerHTML = 
        "<div style='margin-top: 20px; text-align: center; width: 100%'>" +
        "<h2>DUT TX test took " + duttxCounter + " " + seconds + 
        "<h2></div>";
    
    duttxCounter++;

}

function getDateTime()
{
    var currentTime = new Date();
    var month = currentTime.getMonth() + 1;
    var day = currentTime.getDate();
    var year = currentTime.getFullYear();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    var seconds = currentTime.getSeconds();
    var ret = "";

    ret += year ;

    if (month < 10) {
        ret += "0";
    }
    ret += month;

    if (day < 10) {
        ret += "0";
    }
    ret += day + "-";

    if (hours < 10) {
        ret += "0";
    }
    ret += hours;

    if (minutes < 10) {
        ret += "0";
    }
    ret += minutes;

    if (seconds < 10) {
        ret += "0";
    }
    ret += seconds;

    return ret;
}

function updateCalDate() 
{
document.getElementById('date').innerHTML=getDateTime();
}

function txcalStartClick()
{
    var url     = backendURL + "cal_tx_start";
    var results = document.getElementById("wifiCalLog");
    var channel = document.getElementById("channel").value;
            
    url = url +  "&" + channel ;

    logCmd(url, wifitestProcessResults, results);
}

function txcalStopClick()
{
    var url     = backendURL + "tx_stop" +  "&" + "html" ;
    var results = document.getElementById("wifiCalLog");

    logCmd(url, wifitestProcessResults, results);
}

function txcalSaveClick()
{
    var instr = document.getElementById('instrument').value;
    var dt    = getDateTime();
    
    var pwr1  = parseFloat(document.getElementById("tx1pwr").value);
    var pwr6  = parseFloat(document.getElementById("tx6pwr").value);
    var pwr11 = parseFloat(document.getElementById("tx11pwr").value);
    var loss  = parseFloat(document.getElementById("loss").value);

    document.getElementById('date').innerHTML=dt;
    
    if(isNaN(loss))
    	loss = 0 ;
    	
    if(isNaN(pwr1))
    	pwr1 = 0 ;
    	
    if(isNaN(pwr6))
    	pwr6 = 0 ;
    	
    if(isNaN(pwr11))
    	pwr11 = 0 ;
    
    off1  = txcal_ref + loss + pwr1 ;
    off6  = txcal_ref + loss + pwr6 ;
    off11 = txcal_ref + loss + pwr11 ;
    
    // remove invalid url characters
    instr = instr.replace(/\(/g,"@") ;
    instr = instr.replace(/\)/g,"@") ;
    instr = instr.replace(/\</g,"@") ;
    instr = instr.replace(/\>/g,"@") ;
    instr = instr.replace(/\&/g,"@") ;
    instr = instr.replace(/\#/g,"@") ;
    instr = instr.replace(/\:/g,"@") ;
    instr = instr.replace(/\"/g,"@") ;
    instr = instr.replace(/\\/g,"@") ;
    instr = instr.replace(/\//g,"@") ;
    instr = instr.replace(/\?/g,"@") ;
    instr = instr.replace(/\*/g,"@") ;
    instr = instr.replace(/\|/g,"@") ;
    instr = instr.replace(/ /g,"@") ;

    var data = dt + "&" + loss + "&" + txcal_ref + "&"
    	+ pwr1 + "_" + pwr6 + "_" + pwr11 + "&"
    	+ off1 + "_" + off6 + "_" + off11 + "&"
    	+ instr;
    
    var url = backendURL + "cal_tx_save&" + data;

    var results = document.getElementById("wifiCalLog");
    logCmd(url, wifitestProcessResults, results);
}

function calLogShowClick(chkId, controlId)
{
    var chk = document.getElementById(chkId);
    var control = document.getElementById(controlId);
    if (chk.checked) {
	control.style.visibility = "visible";
    } else {
	control.style.visibility = "hidden";
    }
}

function rxcalRunClick()
{
    var url     = backendURL + "cal_rx";
    var results = document.getElementById("rxcalResults");
    var pktRate = "200";
    var pktSize = "1000";

    url = url + 
        "&" + pktRate + 
        "&" + pktSize;

    logCmd(url, wifitestProcessResults, results);
}

function rxcalSaveClick()
{
    var off1 = document.getElementById("RxCalOffset0").innerHTML;
    var off6 = document.getElementById("RxCalOffset1").innerHTML;
    var off11 = document.getElementById("RxCalOffset2").innerHTML;
    var pwr1 = document.getElementById("RxCalRSSI0").innerHTML;
    var pwr6 = document.getElementById("RxCalRSSI1").innerHTML;
    var pwr11 = document.getElementById("RxCalRSSI2").innerHTML;
    var dt = getDateTime();
    var mac = document.getElementById('RxCalMAC').innerHTML;

    var data = off1 + " " + off6 + " " + off11 + " dB ";
    data += pwr1 + " " + pwr6 + " " + pwr11 + " dBm ";
    data += dt + " " + mac;
    var url = backendURL + "cal_rx_save&" + data;

    //var log = document.getElementById("log");
    //log.innerHTML += "<div>" + url + "</div>";

    var results = document.getElementById("wifiCalLog");
    logCmd(url, wifitestProcessResults, results);
}
