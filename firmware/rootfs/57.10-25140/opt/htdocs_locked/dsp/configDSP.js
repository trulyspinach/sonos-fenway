//7/6/13 : update to load getDSP on page load
//7/9/13: cleanup dead code

//TODO: set up POLLING
//TODO: validateForm()

//------------------------------------------------------------------------------
// global data object - holds all the preset data locally
var gMainData;
var gMaxNumPresets = 20;
var gTextFieldWidth = 12;
var gXmlDoc;
var gCurrentlyWorking;
var gCurrentlyWorkingMessage = 'Still working... please wait a moment and try again.'
var messageBox;

// A-B Toggling Stuff
var ABinfo = [
    { name: "A", preset: -1, bgcolor: "#AE6662", active: true},
    { name: "B", preset: -1, bgcolor: "#6FA0FF", active: false},
];

// Form buttons, so their ids can be changed but we can still get to them
var gButtons = new Array();


var gIIRFilterOptions = new Array( {option:"highpass2",          valueType:["Freq","Q"],        defaultValues:["999","0.707"] },
                                   {option:"highpass1",      valueType:["Freq"],            defaultValues:["999"]},
                                   {option:"lowpass2",           valueType:["Freq","Q"],        defaultValues:["999","0.707"] },
                                   {option:"lowpass1",      valueType:["Freq"],            defaultValues:["999"]},
                                   {option:"shelving bandpass", valueType:["Freq","Q","gain dB"], defaultValues:["999","0.707", "0.0"]},
                                   {option:"lfshelf",     valueType:["Freq","Q","gain dB"], defaultValues:["999","0.707", "0.0"]},
                                   {option:"hfshelf",    valueType:["Freq","Q","gain dB"], defaultValues:["999","0.707", "0.0"]},
                                   {option:"bandpassQ",   valueType:["Freq","Q"],        defaultValues:["999","0.707", "0.0"]},
                                   {option:"allpass",           valueType:["Freq","Q"],        defaultValues:["999","0.707"]},
                                   {option:"allpass1",           valueType:["Freq"],        defaultValues:["999"]},
                                   {option:"bass1",             valueType:["gain dB"],            defaultValues:["0.0"]},
                                   {option:"treble1",           valueType:["gain dB"],            defaultValues:["0.0"]},
                                   {option:"blank",             valueType:[],                  defaultValues:[]},
                                   {option:"mute",              valueType:[],                  defaultValues:[]},
                                   {option:"loudness",          valueType:["FreqLF","gainLF","FreqHF","gainHF"], defaultValues:["999","0.0", "999", "0.0"]},
                                   {option:"custom",            valueType:["b0","b1","b2","a1","a2"],    defaultValues:["3f800000","bfe66666","3f4f5c29","bfe66666","3f4f5c29"]} );

var modeOptions = [ "Off", "Mute", "Bypass", "Active"];
var debugOptions = ["Off", "On"];

function onPageLoad ()
{
    // Require Firefox 3.0 or Safari; i.e. exclude MS Internet Explorer. WHY?
    var browser=navigator.appName;
    var version=parseFloat(navigator.appVersion);
    if ((browser === "Netscape") && (version >= 5)) {
        document.getElementById("cant_load_warning").style.display = "none";
        configDSP();
    }
    console.log("page loaded");
}
//------------------------------------------------------------------------------

var lastTimeoutId; // remember the last timeoutID so we can cancel it when displaying a new one

function displayMessage (message) {
    messageBox = document.getElementById("message");
    messageBox.innerHTML = message;
    messageBox.style.visibility = 'visible';
    clearTimeout(lastTimeoutId);
    lastTimeoutId = setTimeout("messageBox.style.visibility = 'hidden';", 5000);
}


function createIIRBlockXML(doc, form) {
    var blockElement = doc.createElement("block");
    var idElement = doc.createElement("id");
    var id = doc.createTextNode(form.id);
    var debugElement = doc.createElement("debug");
    var modeElement = doc.createElement("mode");
    // append nodes to parents
    idElement.appendChild(id);
    blockElement.appendChild(idElement);
    var parametersElement = doc.createElement("parameter");
    var paramElement = doc.createElement("param");
    var debugParametersElement = doc.createElement("debugParameters");
    var value_string = "";
    var input = form[0];
    //the first form element is the mode
    var debug = doc.createTextNode(input.value);
    debugElement.appendChild(debug);
    blockElement.appendChild(debugElement);
    input = form[1];
    var mode = doc.createTextNode(input.value);
    modeElement.appendChild(mode);
    blockElement.appendChild(modeElement);
    //Look for Debug Parameters. If they are found, handle them first.
    //Then proceed to the regular flow.
    var form_index = 2
    input = form[form_index];
    while(isDebugParameter(input.name)) {
        var debugParamElement = doc.createElement("debugParam");
        var debugParamName = input.name.split(".").pop();
        debugParamElement.setAttribute("name", debugParamName);
        debugParamElement.setAttribute("value", input.value);
        blockElement.appendChild(debugParamElement);
        form_index++;
        input = form[form_index];
    }
        //then we have the parameter values
        var setSectionFilter = input.name.split(".");
        var numParentTags = setSectionFilter.length;
        var setString = setSectionFilter[numParentTags -4];
        var sectionString = setSectionFilter[numParentTags -3];
        var filterString = setSectionFilter[numParentTags -2];
        var setElement =  doc.createElement(setString);
        var sectionElement = doc.createElement(sectionString);
        var oldSet = setString;
        var oldSection = sectionString;
        var oldFilterName = filterString;
    for (var i = form_index, ii = form.length; i < ii; i++) {
        input = form[i];
        setSectionFilter = input.name.split(".");
        var numParentTags = setSectionFilter.length;
        setString = setSectionFilter[numParentTags - 4];
        sectionString = setSectionFilter[numParentTags - 3];
        filterString = setSectionFilter[numParentTags - 2];
        if (input.name) {
            if( oldSet != setString ){
                paramElement.setAttribute("name", oldFilterName);
                paramElement.setAttribute("value",value_string);
                sectionElement.appendChild(paramElement);
                setElement.appendChild(sectionElement);
                parametersElement.appendChild(setElement);
                setElement =  doc.createElement(setString);
                sectionElement = doc.createElement(sectionString);
                paramElement = doc.createElement("param");
                oldSet = setString;
                oldSection = sectionString;
                oldFilterName = filterString;
                value_string = ""+ input.value;
            }
            else if( oldSection != sectionString ){
                paramElement.setAttribute("name", oldFilterName);
                paramElement.setAttribute("value",value_string);
                sectionElement.appendChild(paramElement);
                setElement.appendChild(sectionElement);
                sectionElement = doc.createElement(sectionString);
                paramElement = doc.createElement("param");
                oldSection = sectionString;
                oldFilterName = filterString;
                value_string = ""+ input.value;
            }
            else{
                if(i == 1){
                    value_string = input.value;
                }
                else{
                    value_string += "," + input.value;
                }
            }
        }
    }
    paramElement.setAttribute("name", oldFilterName);
    paramElement.setAttribute("value",value_string);
    sectionElement.appendChild(paramElement);
    setElement.appendChild(sectionElement);
    parametersElement.appendChild(setElement);
    blockElement.appendChild(parametersElement);

    return blockElement;
}

function presetIIRBlockToXML(doc, block){
    var blockElement = doc.createElement("block");
    var idElement = doc.createElement("id");
    var id = doc.createTextNode(block.id);
    var debugElement = doc.createElement("debug");
    var modeElement = doc.createElement("mode");
    idElement.appendChild(id);
    blockElement.appendChild(idElement);
    var parametersElement = doc.createElement("parameter");
    var paramElement = doc.createElement("param");
    var debugParametersElement = doc.createElement("debugParameters");
    var value_string = "";
    var params = block.params;
    var param = params[0];
    //the first form element is the mode
    var debug = doc.createTextNode(param.value);
    debugElement.appendChild(debug);
    blockElement.appendChild(debugElement);
    param = params[1];
    var mode = doc.createTextNode(param.value);

    modeElement.appendChild(mode);
    blockElement.appendChild(modeElement);

    var param_index = 2
    param = params[param_index];
    //Handle Debug Parameters
    while(isDebugParameter(param.name)) {
        var debugParamElement = doc.createElement("debugParam");
        var debugParamName = param.name.split(".").pop();
        debugParamElement.setAttribute("name", debugParamName);
        debugParamElement.setAttribute("value", param.value);
        blockElement.appendChild(debugParamElement);
        param_index++;
        param = form[param_index];
    }
    //value_string += input.value;
        //then we have the parameter values
        var setSectionFilter = param.id.split(".");
        var numParentTags = setSectionFilter.length;
        var setString = setSectionFilter[numParentTags -4];
        var sectionString = setSectionFilter[numParentTags -3];
        var filterString = setSectionFilter[numParentTags -2];
        var setElement =  doc.createElement(setString);
        var sectionElement = doc.createElement(sectionString);
        var oldSet = setString;
        var oldSection = sectionString;
        var oldFilterName = filterString;

    for (var i = param_index, ii = params.length; i < ii; i++) {
        param = params[i];
        setSectionFilter = param.id.split(".");
        var numParentTags = setSectionFilter.length;
        setString = setSectionFilter[numParentTags - 4];
        sectionString = setSectionFilter[numParentTags - 3];
        filterString = setSectionFilter[numParentTags - 2];
        if (param.id) {
            if( oldSet != setString ){
                paramElement.setAttribute("name", oldFilterName);
                paramElement.setAttribute("value",value_string);
                sectionElement.appendChild(paramElement);
                setElement.appendChild(sectionElement);
                parametersElement.appendChild(setElement);
                setElement =  doc.createElement(setString);
                sectionElement = doc.createElement(sectionString);
                paramElement = doc.createElement("param");
                oldSet = setString;
                oldSection = sectionString;
                oldFilterName = filterString;
                value_string = ""+ param.value;
            } else if( oldSection != sectionString ){
                paramElement.setAttribute("name", oldFilterName);
                paramElement.setAttribute("value",value_string);
                sectionElement.appendChild(paramElement);
                setElement.appendChild(sectionElement);
                sectionElement = doc.createElement(sectionString);
                paramElement = doc.createElement("param");
                oldSection = sectionString;
                oldFilterName = filterString;
                value_string = ""+ param.value;
            } else{
                if(i == 1){
                    value_string = param.value;
                }
                else{
                    value_string += "," + param.value;
                }
            }
        }
    }
    paramElement.setAttribute("name", oldFilterName);
    paramElement.setAttribute("value",value_string);
    sectionElement.appendChild(paramElement);
    setElement.appendChild(sectionElement);
    parametersElement.appendChild(setElement);
    blockElement.appendChild(parametersElement);

    return blockElement;
}

function createBlockXML(doc, form)
{
    var blockElement = doc.createElement("block");
    var idElement = doc.createElement("id");
    var id = doc.createTextNode(form.id);
    var debugElement = doc.createElement("debug");
    var modeElement = doc.createElement("mode");
    // append nodes to parents
    idElement.appendChild(id);
    blockElement.appendChild(idElement);
    var parametersElement = doc.createElement("parameters");
    var debugParametersElement = doc.createElement("debugParameters");
    var input = form[0];
    //the first form element is the debug
    var debug = doc.createTextNode(input.value);
    debugElement.appendChild(debug);
    blockElement.appendChild(debugElement);
    input = form[1];
    var mode = doc.createTextNode(input.value);
    modeElement.appendChild(mode);
    blockElement.appendChild(modeElement);
    var parentElement = blockElement;
    for (var i = 2, ii = form.length; i < ii; i++) {
        input = form[i];
        var elements = new Array();
        parentElement = blockElement;
        if (input.name) {
            elements = input.name.split(".");
            var j;
            for(j=1;j<(elements.length - 1); j++){
                var element = doc.createElement(elements[j]);
                parentElement.appendChild(element);
                parentElement = element;
            }
            if (isDebugParameter(input.name)){
                var paramElement = doc.createElement("debugParam");
                paramElement.setAttribute("name",elements[j]);
                paramElement.setAttribute("value",input.value);
                parentElement.appendChild(paramElement);
            }
            else{
                var paramElement = doc.createElement("param");
                paramElement.setAttribute("name",elements[j]);
                paramElement.setAttribute("value",input.value);
                parentElement.appendChild(paramElement);
            }
        }
    }
    blockElement.appendChild(parametersElement);
    return blockElement;
}

function presetBlockToXML(doc, block)
{
    var blockElement = doc.createElement("block");
    var idElement = doc.createElement("id");
    var id = doc.createTextNode(block.id);
    var modeElement = doc.createElement("mode");
    // append nodes to parents
    idElement.appendChild(id);
    blockElement.appendChild(idElement);
    var parametersElement = doc.createElement("parameters");
    var params = block.params;
    var param = block.params[0];
    //the first form element is the mode
    var mode = doc.createTextNode(param.value);
    modeElement.appendChild(mode);
    blockElement.appendChild(modeElement);
    for (var i = 1, ii = params.length; i < ii; i++) {
        param = params[i];
        var elements = new Array();
        var parentElement = blockElement;
        if (param.id) {
            elements = param.id.split(".");
            var j;
            for(j=1;j<(elements.length - 1); j++){
                var element = doc.createElement(elements[j]);
                parentElement.appendChild(element);
                parentElement = element;
            }
            var paramElement = doc.createElement("param");
            paramElement.setAttribute("name",elements[j]);
            paramElement.setAttribute("value",param.value);
            parentElement.appendChild(paramElement);
        }
    }
    blockElement.appendChild(parametersElement);

    return blockElement;
}

function isDebugParameter(elementName) {
    if (elementName.includes("DebugState")||elementName.includes("DebugGain"))
        return true;
    return false;
}

//------------------------------------------------------------------------------
function replaceAll(txt, replace, with_this) {
  return txt.replace(new RegExp(replace, 'g'),with_this);
}

function onSubmitValues(e)
{
    // stop the regular form submission
    e.preventDefault();
    console.log("submitting values from ".concat(e.target.getAttribute("id")));
    // collect the form data while iterating over the inputs
    var form = this;
    var data = [];
    for (var i = 0, ii = form.length; i < ii; i++) {
        var input = form[i];
        if (input.name) {
            data[input.name] = input.value;
        }
    }
    var doc = document.implementation.createDocument(null, "root", null);
    var block;
    if(form.type == "IIRBlock" || form.type == "RampIIRBlock" || form.type == "XFadeIIRBlock" ){
        block = createIIRBlockXML(doc, this);
    }else
        block = createBlockXML(doc, this);

    doc.documentElement.appendChild(block);
    var xmlDoc = doc;
    var xmlserializer = new XMLSerializer();
    var xmlString;
    xmlString = xmlserializer.serializeToString(xmlDoc);
    // console.log ( xmlString );
    //TODO should just use the postToZP function here
    postDataToZP ('../putDSP', xmlString, function () {
            for (var i = 0, ii = form.length; i < ii; i++) {
                var input = form[i];
                if (input.name) {
                    input.style.backgroundColor = "white";
                }
            }
        } );
}
/*
 *
 * @param {type} parentElment
 * @returns {undefined}
 * TODO figure out if this is needed?  it called but it doesn't do anything
 */
function updateIIRParamRow(parentElement)
{
    //remove any value text fields parentElement
    //then add the new labels and value text fields for this new Filter value type
}
//------------------------------------------------------------------------------
function onTextFieldChange(elem)
{
        if (elem !== undefined) {
            if (elem.constructor.toString().indexOf("Event") !== -1) {
                elem = this;
            }
            elem.style.backgroundColor = "red";
            // also highlight that field
            elem.parentNode.className = "dirty";
        }
        showDirtyButtons(true);
}

function onTextFieldKeyUp(elem)
{
console.log(this.getAttribute("id").concat(" changed to ").concat(this.value));
}

function onFilterTypeDropdownChange(elem)
{
        if (elem !== undefined) {
            if (elem.constructor.toString().indexOf("Event") !== -1) {
                elem = this;
            }
            console.log(this.getAttribute("id").concat(" changed to ").concat(this.value));
            elem.style.backgroundColor = "red";
            // also highlight that field
            elem.parentNode.className = "dirty";
            var td = elem.parentNode;
            while(td.nextSibling != undefined){
                td.nextSibling.parentNode.removeChild(td.nextSibling);
            }

            var values = new Array(elem.value);
            var defaults = findFilterDefaults(elem.value);
            values = values.concat(defaults);
            var parentId = elem.id.replace(".type","");
            addIIRFilterValueFields(elem.parentNode.parentNode,parentId, values, true); 
            // if dropdown can be changed, `configurable` should be true
            //TODO this doesn't do anything
            updateIIRParamRow(elem.parentNode);
        }
        showDirtyButtons(true);
}
//------------------------------------------------------------------------------

function isArray (obj)
{
    return (obj.constructor.toString().indexOf("Array") !== -1);
}
//------------------------------------------------------------------------------

function cloneObject (obj) {
    for (var i in obj) {
        if (typeof(obj[i]) == 'object') {
            this[i] = new cloneObject(obj[i]);
        }
        else {
            this[i] = obj[i];
        }
    }
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

// HTML help fucntions
function newHTTPRequestObject () {
    try { return new XMLHttpRequest();                   } catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP");    } catch (e) {}
    try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch (e) {}
    alert("XMLHttpRequest not supported");
    return null;
}
//------------------------------------------------------------------------------

function createTab (id, title, presetNum, onclick) {
    var newTab = document.createElement("span");
    newTab.id = id;
    newTab.innerHTML = title;
    newTab.presetNum = presetNum;
    newTab.onclick = onclick;
    return newTab;
}
//------------------------------------------------------------------------------

function h3 (name) {
    var newHeader = document.createElement('h3');
    newHeader.innerHTML = name;
    return newHeader;
}
//------------------------------------------------------------------------------

function h4(name) {
    var newHeader = document.createElement('h4');
    newHeader.innerHTML = name;
    return newHeader;
}
//------------------------------------------------------------------------------

function div (id, text, children) {
    var newDiv = document.createElement('div');
    newDiv.id = id;
    newDiv.innerHTML = text;
    add_children(newDiv, children);
    return newDiv;
}
//------------------------------------------------------------------------------

function span (id, text, children) {
    var newSpan = document.createElement('span');
    newSpan.id = id;
    newSpan.innerHTML = text;
    add_children(newSpan, children);
    return newSpan;
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
//------------------------------------------------------------------------------

function textfield (id, value) {
    var newTF = document.createElement('input');
    newTF.size = gTextFieldWidth;
    newTF.id = id;
    newTF.name = id;
    newTF.value = value;
    newTF.onkeydown  = onTextFieldChange;
    newTF.onkeyup = onTextFieldKeyUp;
    return newTF;
}
//------------------------------------------------------------------------------
function checkbox (id, value, onclick="") {
    var newCB = document.createElement('input');
    newCB.type = "checkbox";
    newCB.id = id;
    newCB.name = id;
    newCB.checked = value;
    newCB.onclick = onclick;
    return newCB;
}

function createFormButton(id, title, onclick) {
    var button = div(id, title);
    button.className = "form_button";
    button.onclick = onclick;
    gButtons[id] = button; // remember it in case we change the id later
    return button;
}

function createSubFormSubmitButton(id, title, onclick) {
    var button = document.createElement('input');
    button.type = "submit";
    button.value = title;
    return button;
}
//------------------------------------------------------------------------------

function dropdown (id, options, value) {
    var newDD = document.createElement('select');
    newDD.id = id;
    newDD.name = id;
    // Just assigning the options array directly didn't work.
    for (var i in options) {
        newDD.add(options[i], null);
    }
    newDD.value = value;
    newDD.onchange = onFilterTypeDropdownChange;
    return newDD;
}
//------------------------------------------------------------------------------

function getDefaultDebugDropdown(blockId)
{
    var debugDD = undefined;
    var options = new Array();
    var max_options = debugOptions.length;
    for (var j = 0; j < max_options; j++){
            var option = document.createElement("option");
            option.text = debugOptions[j];
            options[j] = option;
        }
    debugDD = dropdown(blockId + ".debug", options, "Off");
    return debugDD;
}
//------------------------------------------------------------------------------

function addFilterTypeDropdown(id, tr, values, configurable)
{
    var options = new Array();
    var max_options = gIIRFilterOptions.length;
    for (var j = 0; j < max_options; j++){
        var option=document.createElement("option");
        option.text = gIIRFilterOptions[j].option;
        options[j] = option;
     }
    if (configurable) {
        add_children(tr, dropdown(id,options, values[0]));
    } else {
        tr.innerHTML = values[0];
    }

}
function findFilterValues(filterName)
{
    var max_options = gIIRFilterOptions.length;
    var filterValues = undefined;
    for (var j = 0; j < max_options; j++){
        if( gIIRFilterOptions[j].option == filterName ){
            filterValues = gIIRFilterOptions[j].valueType;
            break;
        }
    }
    return filterValues;
}
function findFilterDefaults(filterName)
{
   var max_options = gIIRFilterOptions.length;
    var filterDefaults = undefined;
    for (var j = 0; j < max_options; j++){
        if( gIIRFilterOptions[j].option == filterName ){
            filterDefaults = gIIRFilterOptions[j].defaultValues;
            break;
        }
    }
    return filterDefaults;

}
function addIIRFilterValueFields(tr, id, values, configurable)
{
    var filterValues = new Array();
    filterValues = findFilterValues(values[0]);
    if(filterValues != undefined){
        var num_vals = filterValues.length;
        for(var k=1;k <= num_vals;k++){
            var tdValue = document.createElement('td');
            var tdValueLabel = document.createElement('td');
            tdValueLabel.innerHTML = filterValues[k-1];
            add_children(tr,tdValueLabel);
            if (configurable) {
                add_children(tdValue,textfield( id +"."+ filterValues[k-1], values[k]));
            } else {
                tdValue.innerHTML = values[k];
            }
            add_children(tr,tdValue);
        }
    }
}
// custom parameter handler for IIR Block
function getIIRParametersTable(blockId, blockType, parameters)
{

    var divTables = document.createElement('div');

    var channelMapTable = document.createElement('table');
    channelMapTable.setAttribute("border", 1);
    channelMapTable.setAttribute("cellpadding", 3);
    var trChannelMapTitles = document.createElement('tr');
    var thChannel = document.createElement('td');
    thChannel.innerHTML = "Channel";
    var thChannelName = document.createElement('td');
    thChannelName.innerHTML = "Name";
    var thCoeffSet = document.createElement('td');
    thCoeffSet.innerHTML = "CoeffSet";
    add_children(trChannelMapTitles, thChannel);
    add_children(trChannelMapTitles, thChannelName);
    add_children(trChannelMapTitles, thCoeffSet);
    add_children(channelMapTable, trChannelMapTitles);

        // create the parameter table
    var table = document.createElement('table');
    table.setAttribute("border", 1);
    table.setAttribute("cellpadding", 3);
    var trTitles = document.createElement('tr');
    var tdSet = document.createElement('td');
    tdSet.innerHTML = "CoeffSet";
    var tdFilterDesc = document.createElement('td');
    tdFilterDesc.innerHTML = "Filter Details";
    add_children(trTitles, tdSet);
    add_children(trTitles, tdFilterDesc);
    add_children(table, trTitles);

    for (var i =0 ; i < parameters.childNodes.length; i++) {
        var node = parameters.childNodes[i];

        if (node.nodeName == 'param') {
            var nodeName = node.getAttribute('name');
            if (nodeName.indexOf('chan') == 0) {
                var trParam = document.createElement('tr');
                var tdChannel = document.createElement('td');
                var tdChannelName = document.createElement('td');
                var tdChannelMap = document.createElement('td');

                tdChannel.innerHTML = nodeName;
                tdChannelMap.innerHTML = node.getAttribute('value');
                if (node.hasAttribute('channelname')) {
                    tdChannelName.innerHTML = node.getAttribute('channelname');
                } else {
                    tdChannelName.innerHTML = '';
                }
                add_children(trParam, tdChannel);
                add_children(trParam, tdChannelName);
                add_children(trParam, tdChannelMap);
                add_children(channelMapTable, trParam);
            }

        }

        if (node.nodeName.indexOf('set') == 0) {
            var trSet = document.createElement('tr');
            var tdSetName = document.createElement('td');
            tdSetName.innerHTML = node.nodeName;
            trSet.appendChild(tdSetName);
            for (var j = 0; j <  node.childNodes.length; j++) {
                addFilterSections(trSet, node.childNodes[j], blockId, parameters);
            }
            add_children(table, trSet);
        }
    }
    add_children(divTables, channelMapTable);
    add_children(divTables, table);
    return divTables;
}

function addFilterSections(table, sectionNode, blockId, parameters)
{
        //create table rows for each param
    for (var i = 0; i < sectionNode.childNodes.length; i++) {
        var paramType = sectionNode.childNodes[i].getAttribute("name").split('_')[0];
        if (paramType == "filter") {
            var parentId = blockId + "." + sectionNode.childNodes[i].parentElement.parentElement.nodeName;
            parentId = parentId + "." + sectionNode.childNodes[i].parentElement.nodeName;
            var tr = document.createElement('tr');
            var child = sectionNode.childNodes[i];
            var filterName;
        if(child.getAttribute("name") != undefined){
            var tdName = document.createElement('td');
            filterName = child.getAttribute("name");
            tdName.innerHTML = filterName;
            add_children(tr, tdName);
        }

        if(child.getAttribute("value") != undefined){
            var values = child.getAttribute("value").split(",");
            if(values[0] != undefined){
                var tdValue = document.createElement('td');
                //add the the filter type name dropdown
                var parentBlock = getParentBlock(parameters);
                var configurable = parentBlock.getAttribute("configurable") != "false";
                addFilterTypeDropdown(parentId+"."+filterName+".type",tdValue, values, configurable);
                add_children(tr,tdValue);
                addIIRFilterValueFields(tr,parentId+"."+filterName, values, configurable);
            }
            add_children(table,tr);
        }
      }
    }
}

function getArrayParametersTable(blockId, blockType, parameters)
{
    // parameter table
    var table = document.createElement('table');
    table.setAttribute("border", 1);
    table.setAttribute("cellpadding", 3);
    //TODO: need to check for parent path element
    var topLevelElement = parameters.firstElementChild;
    var numChannels = parameters.childElementCount;
     for ( var k= 0; k < numChannels;k++){
        var trChan = document.createElement('tr');
        var tdChan = document.createElement('td');
        tdChan.innerHTML = topLevelElement.tagName;
        trChan.appendChild(tdChan);
        if (topLevelElement.tagName == 'param') {
            var parentBlock = getParentBlock(topLevelElement);
            var configurable = parentBlock.getAttribute("configurable") != "false";
            trChan = populateParameter(trChan, blockId, topLevelElement, configurable);
        }
        else {
            //TODO: need to check for parent path element
            parameters = topLevelElement.getElementsByTagName("param");
            trChan = populateParameters(trChan, blockId, parameters);
        }
        add_children(table, trChan);
        topLevelElement = topLevelElement.nextElementSibling;
    }
    return table;
}

function getDebugParametersTable(blockId, blockType, debugParameters)
{
    var table = document.createElement('table');
    table.setAttribute("border", 1);
    table.setAttribute("cellpadding", 3);
    var topLevelElement = debugParameters.firstElementChild;
    var numChannels = debugParameters.childElementCount;

    // First loop over the channnels.
    for (var ch=0; ch < numChannels; ch++){
        var trChan = document.createElement('tr');
        var tdChan = document.createElement('td');

        if (topLevelElement.tagName == 'debugParameters') {
            tdChan.innerHTML = topLevelElement.tagName;
            trChan.appendChild(tdChan);
            var parentBlock = getParentBlock(topLevelElement);
            var configurable = parentBlock.getAttribute("configurable") != "false";
            trChan = populateParameter(trChan, blockId, topLevelElement, configurable);
        }
        else if (topLevelElement.tagName == 'debugParam') {
            trChan = populateParameter(trChan, blockId, topLevelElement, false)
        }
        else {
            tdChan.innerHTML = topLevelElement.tagName;
            trChan.appendChild(tdChan);
            parameters = topLevelElement.getElementsByTagName("debugParam");
            trChan = populateParameters(trChan, blockId, parameters);
        }
        add_children(table, trChan);
        topLevelElement = topLevelElement.nextElementSibling;
    }
    return table;
}

function getParametersTable(blockId, blockType, parameters)
{
    // parameter table
    var table = document.createElement('table');
    table.setAttribute("border", 1);
    table.setAttribute("cellpadding", 3);
    //TODO: need to check for parent path element
    parameters = parameters.getElementsByTagName("param");
    table = populateParameters(table, blockId, parameters);
    return table;
}

function populateParameters(table, blockId, parameters)
{
    // default, for non-custom blocks
    var parentBlock = getParentBlock(parameters[0]);
    var configurable = parentBlock.getAttribute("configurable") != "false";
    for (var i = 0; i < parameters.length; i++) {
        var child = parameters[i];
        table = populateParameter(table,blockId, child, configurable);
    }
    return table;
}

function populateParameter(table, blockId, child, configurable)
{
    if (child.getAttribute("name") != undefined && child.getAttribute("value") != undefined){
        var tr = document.createElement('tr');
        var tdName = document.createElement('td');
        tdName.innerHTML = child.getAttribute("name");

        var tdValue = document.createElement('td');
        var fieldId = blockId + "." + child.getAttribute("name");

        var readonly = child.getAttribute("readonly") != undefined;
        if(readonly || !configurable){
            tdValue.innerHTML = child.getAttribute("value");
        } else if(child.getAttribute("vartype") == "VAR_STRING"){
            var string_vals = child.getAttribute("valid").split(",");
            var options = new Array();
            for (var j = 0; j < string_vals.length; j++){
                var option=document.createElement("option");
                option.text = string_vals[j];
                options[j] = option;
            }
            add_children(tdValue, dropdown(fieldId,options,child.getAttribute("value")));
        }
        else{
            add_children(tdValue, textfield(fieldId,child.getAttribute("value")));
        }
        add_children(tr,tdName);
        add_children(tr,tdValue);
        add_children(table, tr);
    }
    return table;
}

function getParentBlock(paramNode)
{
    var parentNode = paramNode.parentNode;
    if (parentNode.tagName == "block") {
        return parentNode;
    } else {
        return getParentBlock(parentNode);
    }
}

function addBlockToPage(block)
{
    // add this block to the page
    var elem = document.createElement('div');
    elem.innerHTML = "block: " + block.getAttribute("name") + "<br>";

    // add subblocks
    var table = document.createElement('table');
    table.setAttribute("border", 5);
    table.setAttribute("cellpadding", 7);
    table.setAttribute("style", "border-color: red; white-space: nowrap;");
    table.setAttribute("width", "700");

    var subBlocks = 0;
    var blockType = undefined;
    var blockId = undefined;
    var blockMode = undefined;
    var debugMode = undefined;
    var modeDD = undefined;
    var debugDD = undefined;
    var parameters = undefined;
    var debugParameters = undefined;
    for (var i = 0; i < block.childNodes.length; i++) {
        var child = block.childNodes[i];
        if (child.tagName == "block") {
            subBlocks++;
            var subElem = addBlockToPage(child);
            add_children(table, table_entry("", subElem));
        } else if (child.tagName == "type") {
            blockType = child.textContent;
            if(blockType == "Array" || blockType == "BassManager"){
                var arrayFlag = 1;
            }
            elem.innerHTML += "type: " + blockType + "<br>";
        } else if (child.tagName == "mode"){
            blockMode = child.textContent;
            if (blockMode != "Active") {
                elem.style.backgroundColor = "gray";
            }
                var options = new Array();
                var max_options = modeOptions.length;
                for (var j = 0; j < max_options; j++){
                    var option=document.createElement("option");
                    option.text = modeOptions[j];
                    options[j] = option;
                 }
//TODO need a field ID for the Mode drop down -
//TODO does the mode dropdown need to be part of the submitted form?
            //add_children( elem, dropdown(blockId + ".mode",options,child.textContent) );
            modeDD = dropdown(blockId + ".mode",options,child.textContent);
        }else if (child.tagName == "id"){
            blockId = child.textContent;
            elem.innerHTML += "id: " + child.textContent + "<br>";
        }
	    else if (child.tagName == "debug"){
	        debugMode = child.textContent;
	        var options = new Array();
	        var max_options = debugOptions.length;
            for (var j = 0; j < max_options; j++){
			    var option = document.createElement("option");
			    option.text = debugOptions[j];
			    options[j] = option;
		    }
	    debugDD = dropdown(blockId + ".debug",options,child.textContent);
	    }
        else if (child.tagName == "parameter" && child.childNodes.length > 0){
            if(blockType == "IIRBlock" || blockType == "RampIIRBlock" || blockType == "XFadeIIRBlock"){
                parameters = getIIRParametersTable(blockId, blockType, child);
            }
            else if(blockType == "RampMultiGain" ||
               blockType == "SmoothMultiGain" ||
               blockType == "WeightedSum" ||
               blockType == "MultiGain" ||
               blockType == "Meter" ){
                parameters = getArrayParametersTable(blockId, blockType, child);
            }
            else
                parameters = getParametersTable(blockId, blockType, child);
        }
        else if (child.tagName == "debugParameters" && child.childNodes.length >0){
            debugParameters = getDebugParametersTable(blockId, blockType, child);
        }
    }
    // add block parameters
    if (parameters != undefined){
        //if we have parameters make a checkbox to select polling for this block
        var cb = checkbox("checkbox",0);
        add_children(elem, cb);
        elem.innerHTML += "Poll Block  ";
        var paramForm = document.createElement("Form");
        var checkbox_state = (isBlockInExportList(block.getAttribute("name"))) ? 1 : 0;
        var export_cb = checkbox("checkbox_export_" + blockId, checkbox_state, exportCheckBoxChecked);
        add_children(elem, export_cb);
        elem.insertAdjacentHTML('beforeend', 'Select For Export');
        paramForm.id = blockId;
        paramForm.type = blockType;
        paramForm.mode = blockMode;
        paramForm.debug = (debugMode === undefined) ? "Off" : debugMode ;
        add_children(elem, paramForm);
        paramForm.innerHTML += "debug: ";
        debugDD = (debugDD === undefined) ? getDefaultDebugDropdown(blockId) : debugDD;
        add_children(paramForm, debugDD);
        paramForm.insertAdjacentHTML('beforeend', '<br>mode:')
        add_children(paramForm, modeDD);
        //Add Debug Parameters
        if(debugMode=="On"){
            add_children(paramForm, debugParameters);
        }
        //then add the parameters block
        add_children(paramForm, parameters);
        //add a submit values button for each block
        var fBtn = createSubFormSubmitButton("submit_values_button","Submit Values",onSubmitValues );
        add_children(paramForm, fBtn);
        paramForm.onsubmit = onSubmitValues;

    }
    // If there no parameters defined, but there is still a mode element,
    // lets include that within the parent element
    else if(blockMode != undefined){
        var paramForm = document.createElement("Form");
        paramForm.id = blockId;
        paramForm.type = blockType;
        paramForm.mode = blockMode;
        paramForm.debug = (debugMode === undefined) ? "Off" : debugMode ;
        add_children(elem, paramForm);
        paramForm.innerHTML = "mode: ";
        add_children(paramForm, modeDD);
        paramForm.innerHTML = "debug: ";
        debugDD = (debugDD === undefined) ? getDefaultDebugDropdown(blockId) : debugDD;
        add_children(paramForm, debugDD);
        paramForm.insertAdjacentHTML('beforeend', '<br>mode:')
        add_children(paramForm, modeDD);
        if(debugMode=="On"){
            add_children(paramForm, debugParameters);
        }
        // TODO: I know this screws up formatting but not very badly. Also
        // it fixes a bug where the mode drop down ends up showing "Off"
        // for modules without parameters such as SrcSelection in encore -Aurelio
        //add a submit values button for each block
        paramForm.insertAdjacentHTML('beforeend', '<br>');
        var fBtn = createSubFormSubmitButton("submit_values_button","Submit Values",onSubmitValues );
        add_children(paramForm, fBtn);
        paramForm.onsubmit = onSubmitValues;
    }
    // add subblock data as children
    if (subBlocks > 0){
        add_children(elem, table);
    }
    return elem;
}

function isBlockInExportList(blockName, currentPreset="")
{
    if (currentPreset == "") {
        currentPreset = gMainData.presets[gMainData.current_preset_num];
    }
    var isPresent = false;
    if (currentPreset.exportBlocks.length == 0) {
        return isPresent;
    }
    for (var i = 0; i < currentPreset.exportBlocks.length; i++) {
        if (currentPreset.exportBlocks[i] == blockName) {
            isPresent = true;
            break;
        }
    }
    return isPresent;
}
//------------------------------------------------------------------------------

function buildTabs () {
    // Make the proper number of tabs based on the number of presets in the response.
    var form = document.getElementById("dynForm");
    var tabBar = document.getElementById("tabBar");
    // remove all old tabs
    while (tabBar.childNodes[0]) {
        tabBar.removeChild(tabBar.childNodes[0]);
    }
    // make preset tabs
    for (var i=0; i<gMainData.presets.length; i++) {
        tabBar.appendChild(createTab("preset_" + i, gMainData.presets[i].presetName, i, onPresetTabSelected));
    }
    // add tab for copying current preset, unless there already is the max num
    if (gMainData.presets.length < gMaxNumPresets) {
        tabBar.appendChild(createTab("addNewDefaultPreset", "&nbsp; + &nbsp;", -1, copyCurrentPreset));
    }
    form = null;
    tabBar = null;
}

function buildForm( presetName ){
    //build all from blocks and elements
        addToForm( p("", "Preset name: ", textfield("presetName", presetName)));
        var root = gXmlDoc.childNodes[0];
        //start at the top level block element, and recurse throught the xml document
        //adding the html to the HTML page
        for(var i = 0; i < root.childNodes.length; i++){
            if(root.childNodes[i].nodeName == "block"){
                addToForm( addBlockToPage(root.childNodes[i]) );
            }
        }
}

function configDSP()
{
    if(gMainData == undefined){
        gMainData = new Object;
        gMainData.presets = new Array(1);
        gMainData.current_preset_num = 0;
        var ex_blocks = new Array(0);
        gMainData.presets[0] = {presetName: "Preset 1", exportBlocks : ex_blocks};
    }
// build the form
    getXMLFromPlayer("../getDSP", configDSPHelper);
    function configDSPHelper(XMLDoc) {
        clearAndRegeneratePageFromXML(XMLDoc, false);
        saveXMLToPresets(XMLDoc, true);
    }
    checkForEQData(); // puts a blank eqdata.txt in jffs if it doesn't exist yet
    var fileInput = document.getElementById("fileInput");
    fileInput.addEventListener("change", function() {
        var file = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = function () {
            sendImport(reader.result);
            fileInput.value = null;
        };
        reader.readAsText(file);
        console.log("loading preset file " + file.name);
    });
}
// Wrapper method used to submit the given string to the ZP
function postDataToZP (url, string, success_callback) {
    startCurrentlyWorking();
    var http_request = newHTTPRequestObject();
// Passing "true" as the 3rd arg to open() means "async".
    // Note:  Safari doesn't work with async.
    http_request.open("POST", url, true);
    //http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http_request.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
    // http_request.setRequestHeader("Content-length", string.length);
    // http_request.setRequestHeader("Connection", "close");
    http_request.onreadystatechange = function () {
        if ( this.readyState == 4 ) {
            if ( this.status == 200 ) {
                // call the callback
                if (success_callback != undefined) {
                    success_callback();
                }
            }
            else {
                displayMessage( "There was a problem posting the form, status=" + this.status );
            }
            stopCurrentlyWorking();
        }
    };
    http_request.send(string);
}
//------------------------------------------------------------------------------

// IMPORT/EXPORT
function toggleImportExport () {
    var title = document.getElementById("import_export_title");
    var body = document.getElementById("import_export_body");
    if (body.style.display == "none") {
        // Show it
        body.style.display = "block";
        title.innerHTML = "Close";
    }
    else {
        // Hide it
        body.style.display = "none";
        title.innerHTML = "Import/Export";
        // also hide the import form, in case it's showing
        document.getElementById("import_form").style.display = "none";
    }
    title = null;
    body = null;
}
//------------------------------------------------------------------------------

function showImportForm () {
    document.getElementById("import_form").style.display = "block";
}
//------------------------------------------------------------------------------

function sendImport (presetDataImportText) {
    try {
        // remove whitespace from Text
        presetDataImportText = presetDataImportText.replace(/>\s*/g, '>');
        presetDataImportText = presetDataImportText.replace(/\s*</g, '<');

        // Make sure the import text is valid XML
        var xmlParser = new DOMParser();
        var presetDataImport = xmlParser.parseFromString(presetDataImportText, 'text/xml');
        if (presetDataImport.getElementsByTagName('parsererror').length > 0){
            displayMessage('Error: Invalid XML');
            return;
        }

        saveXMLToPresets(presetDataImport, true) // overwrite preset file


    } catch (e) {
        displayMessage("Error: (" + e.message + ")");
        return;
    }
    gMainData = new Object;
    gMainData.presets = new Array(0);
    gMainData.current_preset_num = 0;
    var nPresets = presetDataImport.childNodes[0].children.length;
    for (var pIx = 0; pIx < nPresets; pIx++){
        if (pIx == gMaxNumPresets) {
            displayMessage("Warning: exceeded max preset limit. Only the first " + gMaxNumPresets.toString() + " were loaded.");
            break;
        }
        var presetXML = presetDataImport.childNodes[0].childNodes[pIx];
        var ex_blocks = getExportBlocks(presetXML);
        var pName = presetXML.getAttribute("name");
        gMainData.presets.push({presetName : pName, exportBlocks : ex_blocks});
    }
    buildTabs();
    sendPresetNumFromThisXML(gXmlDoc, gMainData.current_preset_num);
    // close the import form
    toggleImportExport();
}

function sendImportForm () {
    try {
        // Make sure the import text is valid XML
        var presetDataImportText = document.getElementById("import_form_presetData").value;
        var xmlParser = new DOMParser();
        var presetDataImport = xmlParser.parseFromString(presetDataImportText, 'text/xml');
        if (presetDataImport.getElementsByTagName('parsererror').length > 0){
            displayMessage('Error: Invalid XML');
            return;
        }
        saveXMLToPresets(presetDataImport, true) // overwrite preset file
    } catch (e) {
        displayMessage("Error: (" + e.message + ")");
        return;
    }
    gMainData = new Object;
    gMainData.presets = new Array(0);
    gMainData.current_preset_num = 0;
    var nPresets = presetDataImport.childNodes[0].children.length;
    for (var pIx = 0; pIx < nPresets; pIx++){
        if (pIx == gMaxNumPresets) {
            displayMessage("Warning: exceeded max preset limit. Only the first " + gMaxNumPresets.toString() + " were loaded.");
            break;
        }
        var ex_blocks = new Array(0);
        var pName = presetDataImport.childNodes[0].childNodes[pIx].getAttribute("name");
        gMainData.presets.push({presetName : pName, exportBlocks : ex_blocks});
    }
    buildTabs();
    sendPresetNumFromThisXML(gXmlDoc, gMainData.current_preset_num);
    // close the import form
    toggleImportExport();
    document.getElementById("import_form_presetData").value = "";
    presetDataImportText = null;
}

function onExport() {
    var xmlserializer = new XMLSerializer();
    var xmlString;
    xmlString = xmlserializer.serializeToString(gXmlDoc);
    download('presets.txt', xmlString);
    console.log("exporting presets");
}

function download(filename, text) {
    var blob = new Blob([text], {type: "text/xml"});
    var url = URL.createObjectURL(blob);
    var element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
//==============================================================================
// Toggle between presets.
//==============================================================================

function toggleAB () {
    // If the save button is enabled, assume there are unsaved changes.
    if (document.getElementById("save_button")) {
        displayMessage("Can't toggle with unsaved changes.  Please save first.");
        return;
    }

    // handle first-time behavior
    if ( (ABinfo[0].preset == -1) && (ABinfo[1].preset == -1) ) {
        // Have both A and B be set to the current preset
        ABinfo[0].preset = gMainData.current_preset_num;
        ABinfo[1].preset = gMainData.current_preset_num;

        // Start the UI out on 'B', so the user can pick another preset for B
        document.getElementById("ab_control").style.background = ABinfo[1].bgcolor;
        document.getElementById("AB_indicator").innerHTML = ABinfo[1].name;
        ABinfo[1].active = true;

        displayMessage("Now select a new preset as 'B'");
    }
    else {
        var to = ABinfo[0].active ? 1 : 0;
        var from = ABinfo[0].active ? 0 : 1;

        // Save currently seleted preset in old AB
        ABinfo[from].preset = gMainData.current_preset_num;
        ABinfo[from].active = false;
        ABinfo[to].active = true;

        // Toggle to new AB preset
        makePresetActive(ABinfo[to].preset, true, "The ZP is now using new EQ settings.");

        // Update the AB control UI.
        document.getElementById("ab_control").style.background = ABinfo[to].bgcolor;
        document.getElementById("AB_indicator").innerHTML = ABinfo[to].name;
    }
}
//------------------------------------------------------------------------------
// Fill the form with the data from the given presetNum.

function onPresetTabSelected () {
    // If the save button is enabled, assume there are unsaved changes.
     if (gButtons.save_button.className != "disabled_form_button") {
        displayMessage("Error:  Unsaved changes. Please save or abort them before changing presets.");
        return;
    }
    if (getCurrentlyWorking()){
        displayMessage(gCurrentlyWorkingMessage);
        return;
    }
    console.log("selected preset number ".concat(this.presetNum).concat(" -- ").concat(gMainData.presets[this.presetNum].presetName));
    gMainData.current_preset_num = this.presetNum;
    sendPresetNumFromThisXML(gXmlDoc, gMainData.current_preset_num);

}
//------------------------------------------------------------------------------
// Update the UI to show the given preset as active, optionally submitting the
// eq data to the ZP.
function makePresetTabActive( presetNum )
{

    gMainData.current_preset_num = presetNum;

    // show the corresponding tab as selected
    for (var i=0 in gMainData.presets) {
        var tab = document.getElementById("preset_" + i);
        if (i == gMainData.current_preset_num) {
            tab.className = "selected";
        }
        else {
            tab.className = "";
        }
    }
    tab = null;

}

function sendPresetNumFromThisXML(XMLDoc, presetNum) {
    var presetXML = XMLDoc.childNodes[0].childNodes[presetNum];
        var presetName = gMainData.presets[presetNum].presetName;
    if (presetXML.getAttribute("name") != presetName){
        displayMessage("Error: Preset tab name does not match expected preset name");
    } else {
        var XMLToSend = presetXML.childNodes[0];
        var xmlserializer = new XMLSerializer();
        var xmlString = xmlserializer.serializeToString(XMLToSend);
        postDataToZP("../putDSP", xmlString, clearAndRegeneratePageFromCurrentState);
        makePresetTabActive(presetNum)
    }

}
//------------------------------------------------------------------------------

function copyCurrentPreset () {
    if (this.className == "disabled_form_button"){
        return
    }
    if (getCurrentlyWorking()){
        displayMessage(gCurrentlyWorkingMessage);
        return;
    }
    if (gButtons["save_button"].className != "disabled_form_button") {
        displayMessage("Error:  Unsaved changes in the current preset. Please save or abort them first.");
        return;
    }
    if (gMainData.presets.length >= gMaxNumPresets){
        displayMessage("Reached maximum allowed presets");
        return;
    }
    console.log("copied preset ".concat(gMainData.presets[gMainData.current_preset_num].presetName));
    startCurrentlyWorking();
    // get copy of preset
    var presetXML = gXmlDoc.childNodes[0].childNodes[gMainData.current_preset_num];
    var presetCopyXML = presetXML.cloneNode(true);
    // determine new preset name
    var strCopyOf = 'Copy of ';
    var copyOfIx = gMainData.presets[gMainData.current_preset_num].presetName.search(strCopyOf);
    if (copyOfIx >= 0){
        var newName = strCopyOf + gMainData.presets[gMainData.current_preset_num].presetName.substring(strCopyOf.length);
    } else {
        var newName = strCopyOf + gMainData.presets[gMainData.current_preset_num].presetName;
    }
    var ex_blocks = new Array(0);
    var exportBlocks = gMainData.presets[gMainData.current_preset_num].exportBlocks;
    if (exportBlocks.length > 0) {
        for (var i = 0; i < exportBlocks.length; i++) {
            ex_blocks.push(exportBlocks[i]);
        }
    }
    gMainData.presets.push({presetName : newName, exportBlocks : ex_blocks});
    gMainData.current_preset_num = gMainData.presets.length - 1;
    clearAndRegeneratePageFromXML(presetCopyXML, false);

    saveXMLToPresets(presetCopyXML, false);
    stopCurrentlyWorking();

}

//------------------------------------------------------------------------------

function onLoadEqDataTxt()
{
    if (getCurrentlyWorking()){
        displayMessage(gCurrentlyWorkingMessage);
        return;
    }
    console.log("loading eqdata.txt from player");
    getXMLFromPlayer("eqdata.txt", onLoadPresetHelper);
    function onLoadPresetHelper(XMLDoc){
        if (!XMLDoc){
            displayMessage("No data to load in eqdata.txt");
            return
        }
        gMainData = new Object();
        gMainData.presets = new Array(0);
        gMainData.current_preset_num = 0;
        var nPresets = XMLDoc.childNodes[0].children.length;
        for (var pIx = 0; pIx < nPresets; pIx++){
            if (pIx == gMaxNumPresets) {
                displayMessage("Warning: exceeded max preset limit. Only the first " + gMaxNumPresets.toString() + " were loaded.");
                break;
            }
            var pName = XMLDoc.childNodes[0].childNodes[pIx].getAttribute("name");
            var ex_blocks = new Array(0);
            gMainData.presets.push({
                presetName : pName,
                exportBlocks : getExportBlocks(XMLDoc.childNodes[0].childNodes[pIx])
            });
        }
        buildTabs();
        sendPresetNumFromThisXML(XMLDoc, gMainData.current_preset_num);
        gXmlDoc = XMLDoc;
    }
}

function getExportBlocks(XMLDoc)
{
    // Returns a list of all the export preset blocks for a given XML document
    var ex_blocks = new Array(0);
    var root = XMLDoc.childNodes[0];
    findExportBlocks(root, ex_blocks);
    return ex_blocks;
}

function findExportBlocks(root, ex_blocks_list)
{   // This function is used to recursively find export preset blocks
    // in an xml file and add it to the blocks list

    for (var i = 0; i < root.childNodes.length; i++) {
        var childNode = root.childNodes[i];
        if (childNode.nodeName == "block") {
            if (childNode.hasAttribute("exported")) {
                ex_blocks_list.push(childNode.getAttribute("name"));
            }
            findExportBlocks(childNode, ex_blocks_list);
        }
    }
}

function onExportSelectedBlocks()
{
    // Called when Export selected blocks button is pressed
    // First creates a copy of the global XML file containing xml data for all presets and then
    // snips away all the nodes that are not required.

    if (!areSelectedBlocksPreset()) {
        displayMessage("Note - No blocks selected for export");
        return;
    }

    var sparseXML = gXmlDoc.implementation.createDocument(null, null, null);
    var newNode = sparseXML.importNode(gXmlDoc.documentElement, true);
    sparseXML.appendChild(newNode);
    var presetsXML = sparseXML.childNodes[0];
    var emptyPresetsIndex = new Array(0);

    for (var i = presetsXML.childNodes.length - 1; i >= 0; i--) {
        if (gMainData.presets[i].exportBlocks.length > 0) {
            var root = presetsXML.childNodes[i].childNodes[0];
            addExportTagsToXML(presetsXML.childNodes[i], i);
            root.setAttribute("sparse", "Yes");
            removeUnusedBlocks(root);
        } else {
            presetsXML.removeChild(presetsXML.childNodes[i]);
        }
    }

    var xmlserializer = new XMLSerializer();
    var xmlString;
    xmlString = xmlserializer.serializeToString(sparseXML);
    // remove trailing
    xmlString = xmlString.replace(/&$/, "");
    download('export_presets.xml', xmlString);
    displayExportedBlocks();
    //console.log("exporting presets");
}

function displayExportedBlocks()
{
    var table = document.getElementById("export_table");
    table.innerHTML = ""
    table.setAttribute("border", 1);
    table.setAttribute("cellpadding", 3);
    var trPresetNames = document.createElement('tr');

    var maxNumExportBlocks = 0;
    // First add the titles
    for (var i = 0; i < gMainData.presets.length; i++) {
        var presetName = gMainData.presets[i].presetName;
        var thPresetName = document.createElement('th');
        thPresetName.innerHTML = presetName;
        add_children(trPresetNames, thPresetName);

        var numExportBlocks = gMainData.presets[i].exportBlocks.length;
        if (numExportBlocks > maxNumExportBlocks) {
            maxNumExportBlocks = numExportBlocks;
        }
    }
    add_children(table, trPresetNames);
    for (var exportBlockId = 0; exportBlockId < maxNumExportBlocks; exportBlockId++) {
        var trBlocks = document.createElement('tr');
        for (var i = 0; i < gMainData.presets.length; i++) {
            var preset = gMainData.presets[i];
            var tdBlock = document.createElement('td');
            tdBlock.setAttribute("border", "solid 2px lightgrey");
            tdBlock.innerHTML = '';
            if (typeof preset.exportBlocks[exportBlockId] != 'undefined') {
                tdBlock.innerHTML = preset.exportBlocks[exportBlockId];
            }
            add_children(trBlocks, tdBlock);
        }
        add_children(table, trBlocks);

    }

    add_children(document.getElementById('export_table_div'),table);
    exportOverlayOn();
}

function removeUnusedBlocks(node)
{   // Removes all the unused blocks under a given node. Unused blocks are blocks that do not have
    // the export preset tags on them.
    if (node.hasAttribute("exported")) {
        console.log("export preset found for " + node.id);
    }
    else {
        removeAllNonEssentialChildNodes(node);
    }

    var i = node.childNodes.length -1;
    while (i >= 0) {
        if (node.childNodes[i].nodeName == "block") {
            removeUnusedBlocks(node.childNodes[i]);
        }
        i--;
    }

    if (node.nodeName == "block" && node.childNodes.length == 1) {
        node.parentNode.removeChild(node);
    }
}

function areSelectedBlocksPreset()
{
    var selectedBlocksPresent = false;

    for (var i = 0; i < gMainData.presets.length; i++) {
        preset = gMainData.presets[i];
        if (preset.exportBlocks.length > 0) {
            selectedBlocksPresent = true;
            break;
        }
    } 

    return selectedBlocksPresent;
}

function removeAllNonEssentialChildNodes(node)
{
    // Removes all child nodes that are not blocks from unused blocks.
    var i = 0;
    while (i < node.childNodes.length) {
        if (node.childNodes[i].nodeName != "block" &&
            node.childNodes[i].nodeName != "id") {
            node.removeChild(node.childNodes[i]);
        } else {
            i++;
        }
    }
}

function onRefreshBtn()
{
  console.log("getDSP");
  clearAndRegeneratePageFromCurrentState(true);
}

function onSavePreset(){
    if (this.className != "disabled_form_button") {
        console.log("saving preset to browser");
        savePreset(false);
    }
}

function onSaveToEqDataTxt(){
    console.log("saving preset to player (and browser)");
    savePreset(true);
}

function savePreset(saveToPlayer){
    // saves preset to browser, and also to player if requested via boolean arg
    if (getCurrentlyWorking()){
        displayMessage(gCurrentlyWorkingMessage);
        return;
    }
    if (this.className != "disabled_form_button") {
        startCurrentlyWorking();
        gMainData.presets[gMainData.current_preset_num].presetName = document.getElementById("presetName").value;
        // send current form settings to ZP
        sendEQDataToZP(sendEQCallback);

        function sendEQCallback(){
            getXMLFromPlayer("../getDSP", savePresetHelper);
        }
        function savePresetHelper(XMLDoc){
            addExportTagsToXML(XMLDoc);
            clearAndRegeneratePageFromXML(XMLDoc, false);
            saveXMLToPresets(XMLDoc, false);
            if (saveToPlayer){
               saveToEqDataTxt();
            }
            stopCurrentlyWorking();
        }
    }
}

function saveToEqDataTxt(){
    startCurrentlyWorking()
    displayMessage("Saving presets to eqdata.txt ...")
    var xmlserializer = new XMLSerializer();
    var xmlString;
    xmlString = xmlserializer.serializeToString(gXmlDoc);
    postDataToZP('../save_eq_presets', xmlString, saveEqDataCallback);
    function saveEqDataCallback(){
        stopCurrentlyWorking();
        displayMessage("eqdata.txt saved successfully")
    }

}

function addExportTagsToXML(XMLDoc, currentPresetIndex=null)
{
    // Adds the export preset tags to a given xml document based on the selected export preset
    // blocks
    startCurrentlyWorking();
    var currentPreset = gMainData.presets[gMainData.current_preset_num];
    if (currentPresetIndex) {
        currentPreset = gMainData.presets[currentPresetIndex];
    }
    var root = XMLDoc.childNodes[0];
    if (currentPreset.exportBlocks.length == 0 ) {
        return;
    }
    for (var i = 0; i < currentPreset.exportBlocks.length; i++) {
        findBlockandAddExportTag(root, currentPreset.exportBlocks[i]);
    }
}

function findBlockandAddExportTag(root, blockName)
{
    for (var i = 0; i < root.childNodes.length; i++) {
        var childNode = root.childNodes[i];
        if (childNode.nodeName == "block") {
            if (childNode.getAttribute("name") == blockName) {
                childNode.setAttribute("exported", "1");
                break;
            }
            findBlockandAddExportTag(childNode, blockName);
        }
    }
}

function exportCheckBoxChecked()
{   // called when the export preset checkbox is toggled
    var blockID = this.id.split("_")[2];
    var splitBlockID = blockID.split(".");
    var blockName = splitBlockID[splitBlockID.length - 1];
    if (this.checked) {
        addExportBlock(blockName);

    } else {
        removeExportBlock(blockName);
    }
}

function addExportBlock(blockName)
{
    var currentPreset = gMainData.presets[gMainData.current_preset_num];

    // Add to the list of blocks for export presets for the current preset
    if (currentPreset.exportBlocks.length > 0) {
        for (var i = 0; i < currentPreset.exportBlocks.length; i++) {
            if (currentPreset.exportBlocks[i] == blockName) {
                // block already in list, no need to add
                return;
            }
        }
    }
    //console.log("added "+ blockName);
    currentPreset.exportBlocks.push(blockName);
}

function removeExportBlock(blockName)
{
    var currentPreset = gMainData.presets[gMainData.current_preset_num];
    // Remove the block from the list of blocks
    if (currentPreset.exportBlocks.length == 0) {
        // No blocks to remove
        return;
    }
    for (var i = 0; i< currentPreset.exportBlocks.length; i++) {
        if (currentPreset.exportBlocks[i] == blockName) {
            // block already in list, lets remove
            console.log("found and removed "+ blockName);
            currentPreset.exportBlocks.splice(i,1);
            return;
        }
    }
        // block never found in list
    console.log("block not found to remove");
}

//------------------------------------------------------------------------------

function onSubmitAllToLiveEq () {
    if (this.className != "disabled_form_button") {
        if ( sendEQDataToZP() ) {
            displayMessage("Warning: Changes are being previewed on the ZonePlayer, but aren't yet saved.");
        }
        console.log("putDSP. Page settings submitted to player.");
    }
}
//------------------------------------------------------------------------------

function onAbortChanges () {
    if (this.className != "disabled_form_button") {
        if (confirm("This will delete all the unsaved changes you have made.\n\nAre you sure you want to discard these changes?")) {
          sendPresetNumFromThisXML(gXmlDoc, gMainData.current_preset_num);
          showDirtyButtons(false)
        }
        console.log("abort. returning to preset ".concat(gMainData.current_preset_num.toString()));
    }
}

function deletePreset()
{
    if (gMainData.presets.length == 1) {
        displayMessage("Can't delete last preset.");
        return;
    }
    if (getCurrentlyWorking()){
        displayMessage(gCurrentlyWorkingMessage);
        return;
    }
    var presetName = gMainData.presets[gMainData.current_preset_num].presetName;
    if (confirm("This will delete the preset: " + presetName+".\n\nAre you sure you want to do this?")) {
        console.log("delete preset number " + gMainData.current_preset_num.toString() + " -- " + presetName);
        // remove the current preset from gMainData
        gMainData.presets.splice(gMainData.current_preset_num, 1);

        // Either stay in the same tab position, or move left if we just deleted the
        // last preset.
        var goToPreset = gMainData.current_preset_num;
        if(goToPreset >= gMainData.presets.length) {
            goToPreset = gMainData.presets.length - 1;
        }
        gXmlDoc = deleteFromPresetFile(gMainData.current_preset_num, gXmlDoc);
        // Activate that preset, and save changes to ZP
        gMainData.current_preset_num = goToPreset;
        buildTabs();
        sendPresetNumFromThisXML(gXmlDoc, goToPreset);
    }
}

//------------------------------------------------------------------------------
function onLiveButtonClick()
{
    buildFormWithDataFromEQ("Live", function(){} );
}
//------------------------------------------------------------------------------
// Submit 1 set of EQ params, which the ZP will immediately use
function sendEQDataToZP(callback) {
    //if (! validateForm()) {
    //    displayMessage("Please fix errors highlighted in red.");
    //    return false;
    //}
    //build complete xml doc from all forms
    // console.log("sendEQDataToZP()");
    var form = document.getElementById("dynForm");
    var forms = form.getElementsByTagName( 'form' );
    var xmlDoc = document.implementation.createDocument(null, "root", null);
    var block;


    for ( var z = 0; z < forms.length; z++ ) {
        if(forms[z].type == "RampIIRBlock" || forms[z].type == "IIRBlock" || forms[z].type == "XFadeIIRBlock"){
             block = createIIRBlockXML(xmlDoc, forms[z]);
         }else{
            block = createBlockXML(xmlDoc, forms[z]);
         }
        xmlDoc.documentElement.appendChild(block);
    }

    var xmlserializer = new XMLSerializer();
    var xmlString;
    xmlString = xmlserializer.serializeToString(xmlDoc);
    // remove trailing
    xmlString = xmlString.replace(/&$/, "");
    postDataToZP("../putDSP", xmlString, callback);
    // TODO add notification if fails here?
    form = null;
    return true;
}

function enableButton (name, enable) {
    var button = gButtons[name];
    if (enable) {
        // revert to standard id and class
        button.id = name;
        button.className = "form_button";
    }
    else {
        // remove the id and give it the disable class
        button.id = "";
        button.className = "disabled_form_button";
    }
}
//------------------------------------------------------------------------------
// These buttons are only enabled when there are unsaved changes to the form.

function showDirtyButtons (show) {
    enableButton("save_button", show);
    enableButton("preview_button", show);
    enableButton("abort_button", show);
}
//------------------------------------------------------------------------------

function markFormDirty (elem) {
    if (elem != undefined) {
        if (elem.constructor.toString().indexOf("Event") != -1) {
            elem = this;
        }

        // also highlight that field
        elem.parentNode.className = "dirty";
    }
    showDirtyButtons(true);
    // IDEA  make this actually compare the existing values to the saved preset
    // mark yellow if local change
    // mark green if on ZP, but not saved to preset
    // mark red if not valid
    // validateForm();
}

function createHTMLFromXML(XMLDoc){
    //start at the top level block element, and recurse throught the xml document
    //adding the html to the HTML page
    var root = XMLDoc.childNodes[0];
    for(var i = 0; i < root.childNodes.length; i++){
        if(root.childNodes[i].nodeName == "block"){
            addToForm(addBlockToPage(root.childNodes[i]));
        }
    }
}

function getXMLFromPlayer(url, callback){
// request player at /url and run a callback on the XML if successful
      var XMLDoc;
    var http_request = new newHTTPRequestObject();
    http_request.open("GET", url, true);
    http_request.overrideMimeType('text/xml'); //needed for eqdata.txt
    http_request.onreadystatechange = handleResponse;
    http_request.send();
    function handleResponse(){
        if (http_request.readyState == 4 && http_request.status == 200){
            XMLDoc = http_request.responseXML;
            callback(XMLDoc);
        } else if (http_request.readyState == 4 && http_request.status != 200){
            displayMessage("Error in " + url + " request: " + http_request.status + " " + http_request.statusText);
        }

    }
}

function clearPage(){
    var form = document.getElementById("dynForm");
    while (form.elements[0]) {
        form.removeChild(form.childNodes[0]);
    }
    form = null;
}

function addOtherButtons(showDirty){
    addToForm(div("form_buttons", "", [
    // These buttons are shown when the form is dirty
    div("ActiveButtons", "", [
        createFormButton("btnLoadPreset", "Load From Player", onLoadEqDataTxt),
        createFormButton("save_eqdata_button", "Save To Player", onSaveToEqDataTxt),
        createFormButton("btnRefresh", "getDSP", onRefreshBtn),
    ]),
    div("dirty_buttons", "", [
        createFormButton("save_button", "Submit All To Browser", onSavePreset),
        createFormButton("preview_button", "putDSP", onSubmitAllToLiveEq),
        createFormButton("abort_button", "Abort Changes", onAbortChanges)
    ]),
    // These buttons are always shown
    div("other_buttons", "", [
        createFormButton("copy_button", "Copy This Preset", copyCurrentPreset),
        createFormButton("delete_button", "Delete This Preset", deletePreset),
        //createFormButton("live_button", "Live", onLiveButtonClick),
    ]),]));
    if (gMainData.presets.length >= gMaxNumPresets) {
        enableButton("copy_button", false);
    }
    showDirtyButtons(showDirty);
}

function addPresetNameBox(presetName){
    var presetNameTextField = textfield("presetName", presetName)
    presetNameTextField.onkeydown = presetNameHelper;
    addToForm( p("", "Preset name: ", presetNameTextField));
    function presetNameHelper(){
        if (event.keyCode == 13){
            return false;
        } else {
            onTextFieldChange();
        }
    }
}

function saveXMLToPresets(XMLData, overwrite){
    var newPresetXML = XMLData.childNodes[0];
    if (gXmlDoc == undefined || overwrite){
        gXmlDoc = createNewPresetFile(newPresetXML);
    } else if (gMainData.current_preset_num < gXmlDoc.childNodes[0].children.length){
        gXmlDoc = replaceInPresetFile(newPresetXML, gXmlDoc);
    } else {
        gXmlDoc = addToPresetFile(newPresetXML, gXmlDoc);
    }
}

function createNewPresetFile(newPresetXML){
    if (newPresetXML.tagName == 'presets') { // already a fully formed preset file (e.g. from delete)
        var presetsXML = newPresetXML.parentNode;
    } else { // create new from a getDSP
        var presetsXML = (new DOMParser()).parseFromString('<presets></presets>', 'text/xml');
        var presetName = document.getElementById("presetName").value;
        var presetsXMLroot = presetsXML.childNodes[0];
        var newPreset = presetsXML.createElement('preset');
        newPreset.setAttribute('name', presetName);
        newPreset.appendChild(newPresetXML);
        presetsXMLroot.appendChild(newPreset);
    }
    presetName = null;
    return presetsXML;
}

function replaceInPresetFile(newPresetXML, presetsXMLFile){
    var presetName = document.getElementById("presetName").value;
    var presetsXMLroot = presetsXMLFile.childNodes[0];
    var newPreset = presetsXMLFile.createElement('preset');
    newPreset.setAttribute('name', presetName);
    newPreset.appendChild(newPresetXML);
    var replaceThisPreset = presetsXMLroot.childNodes[gMainData.current_preset_num];
    presetsXMLroot.replaceChild(newPreset, replaceThisPreset);
    presetName = null;
    return presetsXMLFile;
}

function addToPresetFile(newPresetXML, presetsXMLFile){
    var presetName = document.getElementById("presetName").value;
    var presetsXMLroot = presetsXMLFile.childNodes[0];
    var newPreset = presetsXMLFile.createElement('preset');
    newPreset.setAttribute('name', presetName);
    newPreset.appendChild(newPresetXML);
    presetsXMLroot.appendChild(newPreset);
    presetName = null;
    return presetsXMLFile;
}

function deleteFromPresetFile(presetNumToDelete, presetsXMLFile){
    var presetToDelete = presetsXMLFile.childNodes[0].childNodes[presetNumToDelete];
    presetsXMLFile.childNodes[0].removeChild(presetToDelete);
    return presetsXMLFile;
}


function clearAndRegeneratePageFromCurrentState(showDirty){
    getXMLFromPlayer("../getDSP", function(XMLDoc) {clearAndRegeneratePageFromXML(XMLDoc, showDirty)});
}

function clearAndRegeneratePageFromXML(XMLDoc, showDirty){
    buildTabs();
    clearPage();
    addPresetNameBox(gMainData.presets[gMainData.current_preset_num].presetName);
    createHTMLFromXML(XMLDoc);
    addOtherButtons(showDirty);
    makePresetTabActive(gMainData.current_preset_num);
}

function checkForEQData(){
    var http_request = newHTTPRequestObject();
    http_request.open("GET", "eqdata.txt");
    http_request.onreadystatechange = checkForEQDataHelper;
    http_request.send()
    function checkForEQDataHelper(){
        if (http_request.readyState == 4 && http_request.status == 404){
            postDataToZP('../save_eq_presets', '');
        }
    }
}

function startCurrentlyWorking(){
    gCurrentlyWorking = true;
}

function stopCurrentlyWorking(){
    gCurrentlyWorking = false;
}

function getCurrentlyWorking(){
    return gCurrentlyWorking;
}

function exportOverlayOn()
{
    document.getElementById("export_overlay").style.display = "block";
}

function exportOverlayOff()
{
    document.getElementById("export_overlay").style.display = "none";
}
