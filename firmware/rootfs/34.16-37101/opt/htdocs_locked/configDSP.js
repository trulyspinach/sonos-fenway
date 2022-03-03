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
                                   {option:"bass1",             valueType:["gain dB"],            defaultValues:["0.0"]},
                                   {option:"treble1",           valueType:["gain dB"],            defaultValues:["0.0"]},
                                   {option:"blank",             valueType:[],                  defaultValues:[]},
                                   {option:"mute",              valueType:[],                  defaultValues:[]},
                                   {option:"loudness",          valueType:["FreqLF","gainLF","FreqHF","gainHF"], defaultValues:["999","0.0", "999", "0.0"]},
                                   {option:"custom",            valueType:["b0","b1","b2","a1","a2"],    defaultValues:["3f800000","bfe66666","3f4f5c29","bfe66666","3f4f5c29"]} );

var modeOptions = [ "Off", "Mute", "Bypass", "Active"];

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

var lastTimeoutId; // remember the last timeoutID so we can cancel it when displaying a new one

function displayMessage (message) {
    messageBox = document.getElementById("message");
    messageBox.innerHTML = message;
    messageBox.style.visibility = 'visible';
    clearTimeout(lastTimeoutId);
    lastTimeoutId = setTimeout("messageBox.style.visibility = 'hidden';", 5000);
}


function createIIRBlockXML(doc, form)
{
    var blockElement = doc.createElement("block");
    var idElement = doc.createElement("id");
    var id = doc.createTextNode(form.id);
    var modeElement = doc.createElement("mode");

    // append nodes to parents
    idElement.appendChild(id);
    blockElement.appendChild(idElement);

    var parametersElement = doc.createElement("parameter");
    var paramElement = doc.createElement("param");

    var value_string = "";
    var input = form[0];

    //the first form element is the mode
    var mode = doc.createTextNode(input.value);

    modeElement.appendChild(mode);
    blockElement.appendChild(modeElement);

    //then we have the parameter values
    input = form[1];
    //value_string += input.value;
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

    for (var i = 1, ii = form.length; i < ii; i++) {

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

function presetIIRBlockToXML(doc, block)
{
    var blockElement = doc.createElement("block");
    var idElement = doc.createElement("id");
    var id = doc.createTextNode(block.id);
    var modeElement = doc.createElement("mode");

    // append nodes to parents
    idElement.appendChild(id);
    blockElement.appendChild(idElement);

    var parametersElement = doc.createElement("parameter");
    var paramElement = doc.createElement("param");

    var value_string = "";
    var params = block.params;
    var param = params[0];

    //the first form element is the mode
    var mode = doc.createTextNode(param.value);

    modeElement.appendChild(mode);
    blockElement.appendChild(modeElement);

    //then we have the parameter values
    param = params[1];
    //value_string += input.value;
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

    for (var i = 1, ii = params.length; i < ii; i++) {

        param = params[i];
        setSectionFilter = param.id.split(".");
        var numParentTags = setSectionFilter.length;
        setString = setSectionFilter[numParentTags - 4];
        sectionString = setSectionFilter[numParentTags - 3];
        filterString = setSectionFilter[numParentTags - 2];
        if (param.id) {
            //console.log("setString: "+ setString);
            //console.log("sectionString: "+ sectionString);
            //console.log("value_string: "+ value_string);

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
                value_string = ""+ param.value;
            }
            else{
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
    var modeElement = doc.createElement("mode");

    // append nodes to parents
    idElement.appendChild(id);
    blockElement.appendChild(idElement);

    var parametersElement = doc.createElement("parameters");

    var input = form[0];

    //the first form element is the mode
    var mode = doc.createTextNode(input.value);
    modeElement.appendChild(mode);
    blockElement.appendChild(modeElement);

    var parentElement = blockElement;

    for (var i = 1, ii = form.length; i < ii; i++) {
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

            var paramElement = doc.createElement("param");
            paramElement.setAttribute("name",elements[j]);
            paramElement.setAttribute("value",input.value);

            parentElement.appendChild(paramElement);
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

//------------------------------------------------------------------------------
function replaceAll(txt, replace, with_this) {
  return txt.replace(new RegExp(replace, 'g'),with_this);
}

function onSubmitValues(e)
{
    // stop the regular form submission
    e.preventDefault();

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

//    console.log ( xmlString );

    //TODO should just use the postToZP function here
    postDataToZP ('putDSP', xmlString, function () {
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

function onFilterTypeDropdownChange(elem)
{
        if (elem !== undefined) {
            if (elem.constructor.toString().indexOf("Event") !== -1) {
                elem = this;
            }
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
            addIIRFilterValueFields(elem.parentNode.parentNode,parentId, values );
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
//

function addFilterTypeDropdown(id, tr, values )
{
    var options = new Array();
    var max_options = gIIRFilterOptions.length;
    for (var j = 0; j < max_options; j++){
        var option=document.createElement("option");
        option.text = gIIRFilterOptions[j].option;
        options[j] = option;
     }
    add_children(tr, dropdown(id,options, values[0]));
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
function addIIRFilterValueFields(tr, id, values)
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
            add_children(tdValue,textfield( id +"."+ filterValues[k-1], values[k]));
            add_children(tr,tdValue);
        }
    }

}
// custom parameter handler for IIR Block
function getIIRParametersTable(blockId, blockType, parameters)
{
    // create the parameter table
    var table = document.createElement('table');
    table.setAttribute("border", 1);
    table.setAttribute("cellpadding", 3);


        var parameterElements = parameters.getElementsByTagName("param");

        var trTitles = document.createElement('tr');
        var tdName = document.createElement('td');
        tdName.innerHTML = "Name";
        var tdType = document.createElement('td');
        tdType.innerHTML = "Type";

        add_children(trTitles, tdName);
        add_children(trTitles, tdType);
        add_children(table, trTitles);

        //create table rows for each param
        for (var i = 0; i < parameterElements.length; i++) {
      var paramType = parameterElements[i].getAttribute("name").split('_')[0];
      if (0) {
//	    if (paramType == "Channel") {
        var tr = document.createElement('tr');
        var child = parameterElements[i];
        var channelcoeffsetName;

        if(child.getAttribute("name") != undefined){
            var tdName = document.createElement('td');
            channelcoeffsetName = child.getAttribute("name");
            tdName.innerHTML = channelcoeffsetName;
            add_children(tr, tdName);
        }

        if(child.getAttribute("value") != undefined){
            var values = child.getAttribute("value");
            if(values[0] != undefined){
                var tdValue = document.createElement('td');
                      add_children(tdValue, textfield(blockId+"."+channelcoeffsetName,child.getAttribute("value")));
                add_children(tr,tdValue);
            }

            add_children(table,tr);
        }
      }
      if (paramType == "filter") {
        var parentId = blockId + "." + parameterElements[i].parentElement.parentElement.nodeName;
        parentId = parentId + "." + parameterElements[i].parentElement.nodeName;
        var tr = document.createElement('tr');
        var child = parameterElements[i];
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
                addFilterTypeDropdown(parentId+"."+filterName+".type",tdValue, values );
                add_children(tr,tdValue);
                addIIRFilterValueFields(tr,parentId+"."+filterName, values );
            }

            add_children(table,tr);
        }
      }
        }

    return table;
}

function getGainParametersTable(blockId, blockType, parameters)
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
            trChan = populateParameter(trChan, blockId, topLevelElement);
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
    for (var i = 0; i < parameters.length; i++) {
        var child = parameters[i];
        table = populateParameter(table,blockId, child);
    }
    return table;
}

function populateParameter(table, blockId, child)
{
    if (child.getAttribute("name") != undefined && child.getAttribute("value") != undefined){
        var tr = document.createElement('tr');
        var tdName = document.createElement('td');
        tdName.innerHTML = child.getAttribute("name");

        var tdValue = document.createElement('td');
        var fieldId = blockId + "." + child.getAttribute("name");

        if( child.getAttribute("readonly") != undefined ){
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
    var modeDD = undefined;
    var parameters = undefined;
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
            //elem.innerHTML += "mode: " + child.textContent + "<br>";
            //elem.innerHTML += "mode: ";
            //add the drop down for the mode
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
            //elem.innerHTML += "<br>";

        }else if (child.tagName == "id"){
            blockId = child.textContent;
            elem.innerHTML += "id: " + child.textContent + "<br>";
        }

        else if (child.tagName == "parameter" && child.childNodes.length > 0){
            if(blockType == "IIRBlock" || blockType == "RampIIRBlock" || blockType == "XFadeIIRBlock"){
                parameters = getIIRParametersTable(blockId, blockType, child);
            }
            else if(blockType == "RampMultiGain" ||
               blockType == "SmoothMultiGain" ||
               blockType == "WeightedSum" ||
               blockType == "MultiGain" ){
                parameters = getGainParametersTable(blockId, blockType, child);
            }
            else
                parameters = getParametersTable(blockId, blockType, child);

        }

    }

    // add block parameters
    if (parameters != undefined){
        //if we have parameters make a checkbox to select polling for this block
        var cb = checkbox("checkbox",0);
        add_children(elem, cb);
        elem.innerHTML += "Poll Bock";
        var paramForm = document.createElement("Form");
        paramForm.id = blockId;
        paramForm.type = blockType;
        paramForm.mode = blockMode;
        add_children(elem, paramForm);
        paramForm.innerHTML = "mode: ";
        add_children(paramForm, modeDD);

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
        add_children(elem, paramForm);
        paramForm.innerHTML = "mode: ";
        add_children(paramForm, modeDD);

        // TODO: I know this screws up formatting but not very badly. Also
        // it fixes a bug where the mode drop down ends up showing "Off"
        // for modules without parameters such as SrcSelection in encore -Aurelio
        //paramForm.innerHTML += "<br />";
        //add a submit values button for each block
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
        gMainData.presets[0] = {presetName: "Preset 1" };
    }


// build the form
    getXMLFromPlayer("getDSP", configDSPHelper);
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
    });
}


// Wrapper method used to submit the given string to the ZP
function postDataToZP (url, string, success_callback) {
    // console.log("postDataToZp("+ url + ", " + string +" )");
    startCurrentlyWorking();
    var http_request = newHTTPRequestObject();
    //
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

    //console.log("postDataToZp: "+string);
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
        var pName = presetDataImport.childNodes[0].childNodes[pIx].getAttribute("name");
        gMainData.presets.push({presetName : pName});
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
        var pName = presetDataImport.childNodes[0].childNodes[pIx].getAttribute("name");
        gMainData.presets.push({presetName : pName});
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
        postDataToZP("putDSP", xmlString, clearAndRegeneratePageFromCurrentState);
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

    gMainData.presets.push({presetName : newName});
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
            gMainData.presets.push({presetName : pName});
        }
        buildTabs();
        sendPresetNumFromThisXML(XMLDoc, gMainData.current_preset_num);
        gXmlDoc = XMLDoc;
    }
}

function onRefreshBtn()
{
  clearAndRegeneratePageFromCurrentState(true);
}

function onSavePreset(){
    savePreset(false);
}

function onSaveToEqDataTxt(){
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
            getXMLFromPlayer("getDSP", savePresetHelper);
        }

        function savePresetHelper(XMLDoc){
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
    postDataToZP('save_eq_presets', xmlString, saveEqDataCallback);
    function saveEqDataCallback(){
        stopCurrentlyWorking();
        displayMessage("eqdata.txt saved successfully")
    }

}


//------------------------------------------------------------------------------

function onSubmitAllToLiveEq () {
    if (this.className != "disabled_form_button") {
        if ( sendEQDataToZP() ) {
            displayMessage("Warning: Changes are being previewed on the ZonePlayer, but aren't yet saved.");
        }
    }
}
//------------------------------------------------------------------------------

function onAbortChanges () {
    if (this.className != "disabled_form_button") {
        if (confirm("This will delete all the unsaved changes you have made.\n\nAre you sure you want to discard these changes?")) {
          sendPresetNumFromThisXML(gXmlDoc, gMainData.current_preset_num);
          showDirtyButtons(false)
        }
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

    //console.log ( xmlString );

    // remove trailing &
    xmlString = xmlString.replace(/&$/, "");

    postDataToZP("putDSP", xmlString, callback);
    // TODO add notification if fails here?
    // console.log("Done sendEQDataToZP()");
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
            // console.log(http_request.readState);
            // console.log(http_request.status);
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
    presetNuame = null;
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
    getXMLFromPlayer("getDSP", function(XMLDoc) {clearAndRegeneratePageFromXML(XMLDoc, showDirty)});
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
            postDataToZP('save_eq_presets', '');
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





