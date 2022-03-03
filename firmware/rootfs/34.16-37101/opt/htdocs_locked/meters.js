//TODO: set up POLLING
//TODO: convert JSON to XML and submit to ZP

gTextFieldWidth = 6;
gMeterWidth = 6;
var gMeterIds;
var gMeterValues;
var gMeterMins;
var gMeterMaxs;
var gStrMeterBlock;

var gFilterTypes = ["highpass",
                    "1st Order HP",
                    "lowpass",
                    "1st Order LP",
                    "Shelfing Bandpass",
                    "Lowpass Shelf",
                    "Highpass Shelf",
                    "Bandpass with Q",
                    "allpass",
                    "ZP120 HP Cross",
                    "ZP120 LP Cross",
                    "Bass1",
                    "Treble1",
                    "blank",
                    "Mute",
                    "loudness",
                    "bandpass",
                    "Custom" ];

function onPageLoad ()
{
    // Require Firefox 3.0 or Safari; i.e. exclude MS Internet Explorer. WHY?
    var browser=navigator.appName;
    var version=parseFloat(navigator.appVersion);
    if ((browser === "Netscape") && (version >= 5)) {
        document.getElementById("cant_load_warning").style.display = "none";
        configDSP();
    }
}

//------------------------------------------------------------------------------

function onDropdownUpdate(elem)
{
    //
    //clear out the old meters
    //get a new meter values
    //add them to this page/form
    //then kick off the polling
    removeMetersFromTable("");
    gStrMeterBlock = this.value;
    getMeters(gStrMeterBlock);
    addToForm(createMeterTable());
    
    var int=self.setInterval( function(){pollForMeterUpdate()}, 500);

    
}
function pollForMeterUpdate()
{
    
    getMeters(gStrMeterBlock);
    for(var i = 0; i < gMeterIds.length; i++){
        var meterElement = document.getElementById(gMeterIds[i]);
        meterElement.value = gMeterValues[i];
        meterElement.min = gMeterMins[i];
        meterElement.max = gMeterMaxs[i];
    }
    
}
//------------------------------------------------------------------------------

function isArray (obj)
{
    return (obj.constructor.toString().indexOf("Array") !== -1);
}

function add_children (parent, children) {
    if (children === undefined) {
        return;
    } else if (isArray(children)) {
        for (var i in children) {
            parent.appendChild(children[i]);
        }
    } else {
        parent.appendChild(children);
    }
}

function addToForm (children)
{
    add_children(document.getElementById("dynForm"), children);
}

function p (id, text, children)
{
    var newP = document.createElement('p');
    newP.id = id;
    newP.innerHTML = text;
    if (children !== undefined)
        add_children(newP, children);
    return newP;
}

function table_entry(text, children)
{
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.innerHTML = text;
    if (children !== undefined)
        add_children(td, children);
    add_children(tr,td);
    return tr;
}

function h6(name)
{
    var newHeader = document.createElement('h6');
    newHeader.innerHTML = name;
    return newHeader;
}

function h4(name)
{
    var newHeader = document.createElement('h4');
    newHeader.innerHTML = name;
    return newHeader;
}

function div (id, text, children) {
    var newDiv = document.createElement('div');
    newDiv.id = id;
    newDiv.innerHTML = text;
    add_children(newDiv, children);
    return newDiv;
}
//------------------------------------------------------------------------------

function textfield (id, value) {
    var newTF = document.createElement('input');
    newTF.size = gTextFieldWidth;
    newTF.id = id;
    newTF.name = id;
    newTF.value = value;
    newTF.onkeydown  = markTextFieldDirty;
    return newTF;
}
//------------------------------------------------------------------------------
function checkbox (id, value) {
    var newCB = document.createElement('input');
    newCB.type = "checkbox";
    newCB.id = id;
    newCB.name = id;
    newCB.checked = value;
//    newCB.onclick = markFormDirty;
    return newCB;
}

function createFormButton(id, title, onclick) {
    var button = div(id, title);
    button.className = "form_button";
    button.onclick = onclick;
    //gButtons[id] = button; // remember it in case we change the id later
    return button;
}
//------------------------------------------------------------------------------

function dropdown (id, options, value) {
    var newDD = document.createElement('select');
    newDD.id = id;
    newDD.name = id;
    // Just assigning the options array directly didn't work.
    for (var i = 0; i< options.length; i++) {
        newDD.add(options[i], null);
    }
    newDD.value = value;
    newDD.onchange = onDropdownUpdate;
    return newDD;
}

function createMeter(id, value, min, max)
{
     var newMeter = document.createElement('meter');
    newMeter.size = gMeterWidth;
    newMeter.id = id;
    newMeter.name = id;
    newMeter.value = value;
    newMeter.min = min;
    newMeter.max = max;
    newMeter.class = "meter";
    //newTF.onkeydown  = markTextFieldDirty;
    return newMeter;
    
}

function addMeterToPage(id, value, min, max)
{
    var meter = createMeter(id, value, min, max);
    var tr = document.createElement('tr');
    var td = document.createElement('td');

    add_children(td,meter);
    add_children(td, document.createTextNode("min: "+ min+" - max: "+max+" - id: "+id));
    add_children(tr, td);
    return tr;
}

function createMeterTable()
{
    var table = document.createElement('table');
    table.setAttribute("border", 1);
    table.setAttribute("cellpadding", 3);
    table.setAttribute("id","meterTable");
    
    for(var meterId = 0; meterId < gMeterIds.length; meterId++){
        add_children(table,addMeterToPage(gMeterIds[meterId],gMeterValues[meterId], gMeterMins[meterId], gMeterMaxs[meterId]));
    }
    
    return table;
}
function removeMetersFromTable(table)
{
    if(gMeterIds != undefined ){
        var tableElement = document.getElementById("meterTable");
        tableElement.innerHTML = '';
        tableElement.parentNode.removeChild(tableElement);
    }
}
function getMeters( meterIdString )
{
    
    var http_request = new XMLHttpRequest();
    
    //http_request.open("GET", "ChProcInputMeter.xml", false);
    //http_request.open("GET", "getDSP?ChProcSysPlaybar.ChProcInputMeter", false);
    http_request.open("GET", "getDSP?"+meterIdString, false);
    
    http_request.send();
    if (http_request.status === 200) {
      var xml = http_request.responseXML;
        //var xmlString = http_request.responseText;
        //alert(xmlString);
        
        var root = xml.childNodes[0];
        var params = root.getElementsByTagName("param");

        gMeterIds = new Array();
        gMeterValues = new Array();
        gMeterMins = new Array();
        gMeterMaxs = new Array();
        
        var meterId = 0;
        for(var i = 0; i < params.length; i++){
            
            //grab only the meter tags, which are named "levdB"
            if(params[i].getAttribute("name") == "levdB"){
                
                gMeterIds[meterId] = "meterId_"+meterId+"_"+params[i].getAttribute("name");
                gMeterValues[meterId] = params[i].getAttribute("value");
                gMeterMins[meterId] = params[i].getAttribute("min");
                gMeterMaxs[meterId] = params[i].getAttribute("max");
                meterId++;
            }
            if(params[i].getAttribute("name") == "levlinear"){
                
                gMeterIds[meterId] = "meterId_"+meterId+"_"+params[i].getAttribute("name");
                gMeterValues[meterId] = params[i].getAttribute("value");
                gMeterMins[meterId] = params[i].getAttribute("min");
                gMeterMaxs[meterId] = params[i].getAttribute("max");
                meterId++;
            }
            if(params[i].getAttribute("name").substr(0,6) == "meter_"){
                
                gMeterIds[meterId] = "meterId_"+meterId+"_"+params[i].getAttribute("name");
                gMeterValues[meterId] = params[i].getAttribute("value");
                gMeterMins[meterId] = params[i].getAttribute("min");
                gMeterMaxs[meterId] = params[i].getAttribute("max");
                meterId++;
            }
            if(params[i].getAttribute("name").substr(0,8) == "channel_" && params[i].getAttribute("name").substr(9,5) == "_gain"){
                
                gMeterIds[meterId] = "meterId_"+meterId+"_"+params[i].getAttribute("name");
                gMeterValues[meterId] = params[i].getAttribute("value");
                gMeterMins[meterId] = params[i].getAttribute("min");
                gMeterMaxs[meterId] = params[i].getAttribute("max");
                meterId++;
            }

        }

    }
    http_request = null;

    return gMeterIds;
    
}
function configDSP()
{
    
    var http_request = new XMLHttpRequest();
    //http_request.open("GET", "getDSP_3.xml", false);
    //http_request.open("GET", "getDSP_playbar.xml", false);
    http_request.open("GET", "getDSP", false);
    
    http_request.send();
    if (http_request.status === 200) {
      var xml = http_request.responseXML;
        //var xmlString = http_request.responseText;
        //alert(xmlString);
        
        var root = xml.childNodes[0];
        var blocks = root.getElementsByTagName("block");
        var ids = new Array();
        
        for (var i=0; i <blocks.length; i++){
            var types = blocks[i].getElementsByTagName("type");
            if(types[0].textContent == "Meter" || 
                    types[0].textContent == "DynHiPass" ||
                    types[0].textContent == "ExcursionLimiter" ||
                    types[0].textContent == "Limiter"){

                var tempIds  = blocks[i].getElementsByTagName("id");
                ids.push( tempIds[0].textContent );
            }
        }

        var options = new Array();
        for (var j = 0; j < ids.length; j++){
            var option=document.createElement("option");
            option.text = ids[j];
            options[j] = option;
         }

        var dd = dropdown("ids",options,ids[0]);
        addToForm(dd);
                
    }
    http_request = null;
}
