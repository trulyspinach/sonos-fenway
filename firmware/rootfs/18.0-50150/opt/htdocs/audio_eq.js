// TODO
// * fill in correct min/maxes for validation
// * make it force get the eqdata.txt, even when it says 304
//
// BUGS
// *
//
// FUTURE IDEAS
// * make validation happen in real time (see notes in markFormDirty())
//     * better notification of unsaved changes
// * highlight differences between A/B when toggling

// debugging with Firebug: console.log(variable) or console.dir(object)

//==============================================================================
// Generic code. I.e. knows nothing about Sonos.
//==============================================================================

// Instantiates a JSON parser object if one does not already exist.
// from: http://www.JSON.org/json2.js (Public Domain.)
// minified using: http://www.crockford.com/javascript/jsmin.html

if(!this.JSON){JSON={};}
(function(){function f(n){return n<10?'0'+n:n;}
if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z';};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+
partial.join(',\n'+gap)+'\n'+
mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==='string'){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+
mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
return str('',{'':value});};}
if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+
('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse');};}})();

gTextFieldWidth = 6;  // Seems to work for all fields. Wide enough for the term
                      // "undefined" to be completely visible.
                 
//------------------------------------------------------------------------------

function isNumericInRange (val, minLimit, maxLimit) {
    if (parseFloat(val,10)==(val*1)) {
        if ( (val >= minLimit) && (val <= maxLimit) ) {
            return true
        }
    }
    return false;
}

//------------------------------------------------------------------------------

function isArray (obj) {
    return (obj.constructor.toString().indexOf("Array") != -1);
}

//------------------------------------------------------------------------------

function cloneObject (obj) {
    for (i in obj) {
        if (typeof(obj[i]) == 'object') {
            this[i] = new cloneObject(obj[i]);
        }
        else {
            this[i] = obj[i];
        }
    }
}

//------------------------------------------------------------------------------
// Add 1 or more child objects to the given element.

function add_children (parent, children) {
    if (children == undefined) {
        return;
    }
    else if (isArray(children)) {
        for (var i in children) {
            parent.appendChild(children[i]);
        }
    }
    else {
        parent.appendChild(children);
    }
}

//------------------------------------------------------------------------------

var lastTimeoutId; // remember the last timeoutID so we can cancel it when displaying a new one

function displayMessage (message) {
    messageBox = document.getElementById('message');
    messageBox.innerHTML = message;
    messageBox.style.visibility = 'visible';
    clearTimeout(lastTimeoutId);
    lastTimeoutId = setTimeout("messageBox.style.visibility = 'hidden';", 5000);
}

//==============================================================================
// HTML-specific code. I.e. knows nothing about Sonos.
//==============================================================================

function newRequestObject () {
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

function p (id, text, children) {
    var newP = document.createElement('p');
    newP.id = id;
    newP.innerHTML = text;
    if (children != undefined) {
        add_children(newP, children);
    }
    return newP;
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

//------------------------------------------------------------------------------

function textfield (id, value) {
    var newTF = document.createElement('input');
    newTF.type = "text";
    newTF.size = gTextFieldWidth;
    newTF.id = id;
    newTF.name = id;
    newTF.value = value;
    newTF.onkeydown = markFormDirty;
    return newTF;
}

//------------------------------------------------------------------------------

function checkbox (id, value) {
    var newCB = document.createElement('input');
    newCB.type = "checkbox";
    newCB.id = id;
    newCB.name = id;
    newCB.checked = value;
    newCB.onclick = markFormDirty;
    return newCB;
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
    newDD.onchange = markFormDirty;
    return newDD;
}

//------------------------------------------------------------------------------

function createFormButton(id, title, onclick) {
    var button = div(id, title);
    button.className = "form_button";
    button.onclick = onclick;
    gButtons[id] = button; // remember it in case we change the id later
    return button;
}

//------------------------------------------------------------------------------

function typeDropdownChanged () {
    showFieldsForFilterType(this.id);
    markFormDirty(this);
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

//------------------------------------------------------------------------------

function getFormValue (id) {
    var elem = document.getElementById(id);
    if (elem) {
        return elem.value;
    }
    else {
        return undefined;
    }
}

//============================================================================== 
// Global variables
//==============================================================================

// global data object
var gMainData;

// platform (ZPS5, Fenway, Anvil)
var gPlatform;

// Preset Stuff
var gMaxNumPresets = 10;

/*******************************************************************************
 * Note on notation:
 *
 * Names of individual components ("properties") of a struct are rendered in 
 * "CamelCase", i.e. without underscores. When elements of the HTML form
 * are named with more than one component, e.g. the "on" part of the
 * "bassBlend" substructure, the two components are joined with an underscore.
 *
 * The spellings of the fields are kept identical between the JavaScript struct
 * and the HTML form name. This must be done by hand! (See, for example, the
 * five comments labeled "###" below.)
 *
 * Quantities that have units are mostly notated as such, e.g. "overallGainIndB".
 * Frequencies are exempted from this since they are always Hertz. The separator
 * between the name and unit is "In".
 *
 ******************************************************************************/
var gDefaultPresetLL =
{
    presetName: "Limelight",
    overallGainIndB: "10",
};

var gDefaultPresetZPS5 =
{
    presetName: "ZPS5",
    overallGainIndB: "10",

    tweeter1: {
        filters: {
            0: {
                type: "highpass",
                freq: "2242.7",
                Q: "0.97",
                gain: "0",
                phase: "0"
            },
            1: {
                type: "highpass",
                freq: "2242.7",
                Q: "0.97",
                gain: "0",
                phase: "0"
            },
            2: {
                type: "bandpass",
                freq: "5543.5",
                Q: "2.39",
                gain: "-3",
                phase: "0"
            },
            3: {
                type: "bandpass",
                freq: "1034",
                Q: "1.45",
                gain: "-15.7",
                phase: "0"
            }
        },
    },

    tweeter2: {
        filters: {
            0: {
                type: "highpass",
                freq: "2242.7",
                Q: "0.97",
                gain: "0",
                phase: "0"
            },
            1: {
                type: "highpass",
                freq: "2242.7",
                Q: "0.97",
                gain: "0",
                phase: "0"
            },
            2: {
                type: "bandpass",
                freq: "5543.5",
                Q: "2.39",
                gain: "-3",
                phase: "0"
            },
            3: {
                type: "bandpass",
                freq: "1034",
                Q: "1.45",
                gain: "-15.7",
                phase: "0"
            }
        },
    },

    midrange1: {
        filters: {
            0: {
                type: "highpass",
                freq: "250.5",
                Q: "1.5"
            },
            1: {
                type: "lowpass",
                freq: "4124.7",
                Q: "0.581",
            },
            2: {
                type: "highpass",
                freq: "89.5",
                Q: "0.188",
            },
            3: {
                type: "lowpass",
                freq: "1816.6",
                Q: "0.24",
            },
            4: {
                type: "lowpass",
                freq: "1995.8",
                Q: "1.36",
            },
            5: {
                type: "bandpass",
                freq: "550.53",
                Q: "1.26",
                gain: "-1.53"
            },
            6: {
                type: "highpass",
                freq: "41.96",
                Q: "2.62"
            }
        },
    },

    midrange2: {
        filters: {
            0: {
                type: "highpass",
                freq: "250.5",
                Q: "1.5"
            },
            1: {
                type: "lowpass",
                freq: "4124.7",
                Q: "0.581",
            },
            2: {
                type: "highpass",
                freq: "89.5",
                Q: "0.188",
            },
            3: {
                type: "lowpass",
                freq: "1816.6",
                Q: "0.24",
            },
            4: {
                type: "lowpass",
                freq: "1995.8",
                Q: "1.36",
            },
            5: {
                type: "bandpass",
                freq: "550.53",
                Q: "1.26",
                gain: "-1.53"
            },
            6: {
                type: "highpass",
                freq: "41.96",
                Q: "2.62"
            }
        },
    },

    woofer: {
        filters: {
            0: {
                type: "lowpass",
                freq: "176.9",
                Q: "1.0"
            },
            1: {
                type: "lowpass",
                freq: "199.4",
                Q: "0.707",
            },
            2: {
                type: "lowpass",
                freq: "234.16",
                Q: "0.78"
            },
            3: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            }
        },
    },

    wooferDyn: {
        filters: {
            0: {
                type: "highpass",
                freq: "60",
                Q: "0.68",
            }
        },
    },
};

var gDefaultPresetZP120 =
{
    presetName: "ZP120",

    satellite: {
        filters: {
            0: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            1: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
         },
    },

    subw: {
        filters: {
            0: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            1: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
         },
    },
};

var gDefaultPresetFenway =
{
    presetName: "Fenway",
    overallGainIndB: "6.5",
    audiosource: "normal",

     bothMidranges: {
         bassBlend: {
             freq: "200"  // ### Name will be bothMidranges_bassBlend_freq, etc...
         },
         dynamicBass: {
             freq1: "87",
             Q1: "1",
             level1: "0",
             freq2: "80",
             Q2: "2",
             level2: "-10",
             freq3: "70",
             Q3: "2.5",
             level3: "-15",
             freq4: "65",
             Q4: "3.5",
             level4: "-20",
             attackInus: "40",
             releaseInms: "250",
             adjFreq: "300",
             adjQ: "0.707"
        },

        limiter: {
            threshold: "0.7",
            attackInus: "1000",
            releaseInms: "600"
        },
    },

    tweeter: {
        channelGainIndB: "-4",
        polarity: "normal",
        delay: "1",

        filters: {
            0: {
                type: "highpass",
                freq: "7000",
                Q: "0.707",
                gain: "0",
                phase: "0"
            },
            1: {
                type: "highpass",
                freq: "7000",
                Q: "0.707",
                gain: "0",
                phase: "0"
            },
            2: {
                type: "bandpass",
                freq: "8750",
                Q: "2",
                gain: "4",
                phase: "0"
            },
            3: {
                type: "bandpass",
                freq: "5200",
                Q: "2.0",
                gain: "-2.0",
                phase: "0"
            },
            4: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            5: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            6: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            7: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            8: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            9: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            }
        },

        limiter: {
            threshold: "0.56",
            attackInus: "10",
            releaseInms: "5"
        },
    },

    midrange1: {
        filters: {
            0: {
                type: "bandpass",
                freq: "800",
                Q: "0.3",
                gain: "-2"
            },
            1: {
                type: "lfshelf",
                freq: "250",
                Q: "0.707",
                gain: "2.5"
            },
            2: {
                type: "bandpass",
                freq: "5000",
                Q: "1.0",
                gain: "2.0"
            },
            3: {
                type: "bandpass",
                freq: "150",
                Q: "2.5",
                gain: "-2.5"
            },
            4: {
                type: "bandpass",
                freq: "2600",
                Q: "1.4",
                gain: "-6.0"
            },
            5: {
                type: "lowpass",
                freq: "8000",
                Q: "0.707"
            },
            6: {
                type: "lowpass",
                freq: "8000",
                Q: "0.707"
            },
            7: {
                type: "bandpass",
                freq: "12000",
                Q: "2",
                gain: "-5",
                phase: "0"
            },
            8: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            9: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
        },
    },

    midrange2: {
        filters: {
            0: {
                type: "bandpass",
                freq: "800",
                Q: "0.3",
                gain: "-2"
            },
            1: {
                type: "lfshelf",
                freq: "250",
                Q: "0.707",
                gain: "2.5"
            },
            2: {
                type: "bandpass",
                freq: "5000",
                Q: "1.0",
                gain: "2.0"
            },
            3: {
                type: "bandpass",
                freq: "150",
                Q: "2.5",
                gain: "-2.5"
            },
            4: {
                type: "bandpass",
                freq: "2600",
                Q: "1.4",
                gain: "-6.0"
            },
            5: {
                type: "lowpass",
                freq: "8000",
                Q: "0.707"
            },
            6: {
                type: "lowpass",
                freq: "8000",
                Q: "0.707"
            },
            7: {
                type: "bandpass",
                freq: "12000",
                Q: "2",
                gain: "-5",
                phase: "0"
            },
            8: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            9: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
        },
    },
};

var gDefaultPresetAnvil =
{
    presetName: "Anvil",

    subw: {
        channelGainIndB: "0",
        polarity: "normal",
        delay: "0",

        //freqSelLimiter: {
            //on: false,
            //attackInus: "1000",
            //releaseInms: "10",
            //filters: {
                //0: {
                    //type: "bandpass",
                    //freq: "200",
                    //Q: "0.707",
                    //gain: "0.0"
                //},
                //1: {
                    //type: "bandpass",
                    //freq: "200",
                    //Q: "0.707",
                    //gain: "0.0"
                //},
                //2: {
                    //type: "bandpass",
                    //freq: "200",
                    //Q: "0.707",
                    //gain: "0.0"
                //},
                //3: {
                    //type: "bandpass",
                    //freq: "200",
                    //Q: "0.707",
                    //gain: "0.0"
                //},
             //},
        //},

        dynamicBandpass: {
            0: {
                on: true,
                freq: "40",
                Q: "5.000",
                maxLevel: "-12.0",
                attackInus: "1000",
                releaseInms: "6000"
            },
            1: {
                on: true,
                freq: "25",
                Q: "5.000",
                maxLevel: "-20.0",
                attackInus: "1000",
                releaseInms: "6000"
            },
            2: {
                on: false,
                freq: "24",
                Q: "20.000",
                maxLevel: "-8.0",
                attackInus: "1000",
                releaseInms: "600"
            },
            3: {
                on: false,
                freq: "24",
                Q: "20.000",
                maxLevel: "-8.0",
                attackInus: "1000",
                releaseInms: "600"
            },
        },

        portMask: {
            coef: "1.0",
            threshold: "-20.0"
        },

        filters: {
            0: {
                type: "lowpass",
                freq: "150",
                Q: "0.707",
                gain: "0",
                phase: "0"
            },
            1: {
                type: "lowpass",
                freq: "160.0",
                Q: "0.8",
                gain: "0",
                phase: "0"
            },
            2: {
                type: "lowpass",
                freq: "200",
                Q: "0.7",
                gain: "0",
                phase: "0"
            },
            3: {
                type: "highpass",
                freq: "27.6",
                Q: "3.3",
                gain: "0",
                phase: "0"
            },
            4: {
                type: "highpass",
                freq: "23.6",
                Q: "4.0",
                gain: "0",
                phase: "0"
            },
            5: {
                type: "bandpass",
                freq: "40.0",
                Q: "3.0",
                gain: "-3.5",
                phase: "0"
            },
            6: {
                type: "highpass",
                freq: "20.0",
                Q: "0.707",
                gain: "0",
                phase: "0"
            },
            7: {
                type: "highpass",
                freq: "20.0",
                Q: "0.707",
                gain: "0",
                phase: "0"
            },
            8: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            9: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            10: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            },
            11: {
                type: "blank",
                freq: "0",
                Q: "0",
                gain: "0",
                phase: "0"
            }
        },

        limiter: {
            on: "yes",
            threshold: "0.9",
            attackInus: "1000",
            releaseInms: "600"
        },

        softclip: {
            on: "yes",
            threshold: "-3.0",
            ceiling: "-0.5"
        },

        warnings: {
            clipcut: "0.1",
            clipaccel: "1.5",
            clipcutrate: "1.0",
            clipreleaserate: "5.0",
            clipreleasedelay: "1.0",
        },

        excursion: {
            on: true,
            target: "3.0",
            filtergain: "90",
            rmstime: "0.005",
            limiteron: "yes",
            limiterattack: "0.01",
            limiterrelease: "50.0",
            mincutoff: "25.0",
            maxcutoff: "40.0",
            q0: "0.5",
            q1: "1.4",
            cutoffattack: "20.0",
            cutoffrelease: "1000.0",
        },
    },
};

// A-B Toggling Stuff
var ABinfo = [
    { name: "A", preset: -1, bgcolor: "#AE6662", active: true},
    { name: "B", preset: -1, bgcolor: "#6FA0FF", active: false},
];

// Form buttons, so their ids can be changed but we can still get to them
var gButtons = new Array();

//==============================================================================
// Entry-point function. Might as well be up here at top.
//==============================================================================

function onPageLoad () {
    // Require Firefox 3.0 or Safari; i.e. exclude MS Internet Explorer.
    var browser=navigator.appName;
    var version=parseFloat(navigator.appVersion);
    if ( (browser == "Netscape") && (version >= 5) ) {
        document.getElementById("cant_load_warning").style.display = "none";
        getPlatform();
        getPresetDataFromZP();
    }
}

function getPlatform () {
    gPlatform = undefined;

    var url = "status/zp";
    var http_request = newRequestObject();
    http_request.open( "GET", url, false );
    http_request.send();
    if (http_request.status == 200) {
        var xml = http_request.responseXML;
        var hwVer = xml.childNodes[1].childNodes[0].childNodes[6].textContent;
        var hwModel = hwVer.split('.')[1]
        var hwSubmodel = hwVer.split('.')[2];
        var hwRevision = hwVer.split('.')[3];

        if (hwRevision == "102-1")
            gPlatform = "Anvil";   // ZP120 spoofed as Anvil
        else if (hwModel == "16") {
            if (hwSubmodel == "3")
                gPlatform = "ZP120";
            else                   // S5 submodel is 4 but we're not picky
                gPlatform = "ZPS5";
        }
        else if (hwModel == "8") {
            if (hwSubmodel == "1")
                gPlatform = "Fenway";
            else if (hwSubmodel == "2")
                gPlatform = "Anvil";
        }
	else if (hwRevision == "0-0") {
		gPlatform = "Limelight";
	}
    }

    http_request = null;
}

function getPresetDataFromZP () {

    // Throw away the current data
    gMainData = undefined;
   
    var url = "eqdata.txt";
    var http_request = newRequestObject();
    http_request.open( "GET", url, true );
    http_request.setRequestHeader("If-Modified-Since", "1960");
    http_request.onreadystatechange = function () {
        if ( this.readyState == 4 ) {
            if ( this.status == 200 ) {
                // TODO change this to use JSON.parse
                // for some reason it's getting a syntax error
                // gMainData = JSON.parse(this.responseText);
                gMainData = eval("(" + this.responseText + ")");
            }
            
            if ( (gMainData == undefined)
              || (gMainData.presets == undefined)
              || (gMainData.presets.length == 0) ) {
                displayMessage( "Couldn't find any saved presets. Just using default");
                // make a single preset from the default
                gMainData = new Object;
                gMainData.presets = new Array(1);
                if (gPlatform == "ZPS5")
                    gMainData.presets[0] = gDefaultPresetZPS5;
                else if (gPlatform == "Fenway")
                    gMainData.presets[0] = gDefaultPresetFenway;
                else if (gPlatform == "Anvil")
                    gMainData.presets[0] = gDefaultPresetAnvil;
                else if (gPlatform == "ZP120")
                    gMainData.presets[0] = gDefaultPresetZP120;
                else if (gPlatform == "Limelight")
                    gMainData.presets[0] = gDefaultPresetLL;

                gMainData.current_preset_num = 0;
            }
            
            if (gMainData.current_preset_num < 0)
                gMainData.current_preset_num = 0;
            else if (gMainData.current_preset_num >= gMainData.presets.length)
                gMainData.current_preset_num = gMainData.presets.length - 1;
            
            // build the form
            buildTabs();
            makePresetActive(gMainData.current_preset_num, false);
        }

    };
    http_request.send(null);
}

//------------------------------------------------------------------------------

//==============================================================================
// Code that knows about Presets and our specific layout ideas.
//==============================================================================

// Add an item or array of items to the form.

function addToForm (children) {
    add_children(document.getElementById("eqForm"), children);
}

//------------------------------------------------------------------------------

function buildTabs () {
    // Make the proper number of tabs based on the number of presets in the response.
    var form = document.getElementById("eqForm");
    var tabBar = document.getElementById("tabBar");
    
    // remove all old tabs
    while (tabBar.childNodes[0]) {
        tabBar.removeChild(tabBar.childNodes[0]);
    }
    
    // make preset tabs
    for (var i=0; i<gMainData.presets.length; i++) {
        tabBar.appendChild(createTab("preset_" + i, gMainData.presets[i].presetName, i, presetTabWasClicked));
    }
    
    // add tab for copying current preset, unless there already is the max num
    if (gMainData.presets.length < gMaxNumPresets) {
        tabBar.appendChild(createTab("addNewDefaultPreset", "&nbsp; + &nbsp;", -1, addNewDefaultPreset));
    }
}

//------------------------------------------------------------------------------

function addFormInputForChannelGain(driver, channelGainIndB) {
    addToForm(p("", "channel gain (dB): ", textfield(driver + "_channelGainIndB", channelGainIndB)));
}

//------------------------------------------------------------------------------

function addFormInputsForDelay(driver, delay) {

    var delayOpts = new Array;
    delayOpts[0] = new Option("0 (none)", 0);
    delayOpts[1] = new Option("1 sample", 1);
    for (var i=2; i<15; i++) {
        delayOpts[i] = new Option((i) + " samples", i);
    }
    addToForm(p("", "delay: ", dropdown(driver + "_delay", delayOpts, delay)));

}

//------------------------------------------------------------------------------

function addFormInputsForPolarity(driver, polarity) {
    var polarityOpts = new Array;
    polarityOpts[0] = new Option("normal", 0);
    polarityOpts[1] = new Option("inverted", 1);
    addToForm(p("", "polarity: ", dropdown(driver + "_polarity", polarityOpts, polarity)));
}

//------------------------------------------------------------------------------

function addFormInputsForLimiter(driver, limiter) {
// driver = "tweeter" | "bothMidranges" | "midrange1" ... etc.  Should be *identical* to property identifier!
// sectionData is substruct of preset, down to the driver identifier.

    addToForm(h4("Limiter"));
    if (limiter.on != undefined) {
        addToForm(p("", "", [
            span("", "on/off", checkbox(driver + "_limiter_on", limiter.on)),
            span("", "threshold: ", textfield(driver + "_limiter_threshold", limiter.threshold)),
            span("", "attack (\u03BCs): ", textfield(driver + "_limiter_attackInus", limiter.attackInus)),
            span("", "release (ms): ", textfield(driver + "_limiter_releaseInms", limiter.releaseInms)),
        ]));
    } else {
        addToForm(p("", "", [
            span("", "threshold: ", textfield(driver + "_limiter_threshold", limiter.threshold)),
            span("", "attack (\u03BCs): ", textfield(driver + "_limiter_attackInus", limiter.attackInus)),
            span("", "release (ms): ", textfield(driver + "_limiter_releaseInms", limiter.releaseInms)),
        ]));
    }
}

//------------------------------------------------------------------------------

function addFormInputsForSoftclip(driver, softclip) {
// driver = "tweeter" | "bothMidranges" | "midrange1" ... etc.  Should be *identical* to property identifier!
// sectionData is substruct of preset, down to the driver identifier.

    addToForm(h4("Softclip Limiter"));
    addToForm(p("", "", [
        span("", "on/off", checkbox(driver + "_softclip_on", softclip.on)),
        span("", "threshold: ", textfield(driver + "_softclip_threshold", softclip.threshold)),
        span("", "attack (\u03BCs): ", textfield(driver + "_softclip_attackInus", softclip.attackInus)),
        span("", "release (ms): ", textfield(driver + "_softclip_releaseInms", softclip.releaseInms)),
    ]));
}

function addFormInputsForAnvilSoftclip(softclip) {
    addToForm(h4("Soft Clipper"));
    addToForm(p("", "", [
        span("", "on/off", checkbox("softclip_on", softclip.on)),
        span("", "softclip threshold (dB): ",
             textfield("softclip_threshold", softclip.threshold)),
        span("", "ceiling (dB): ",
             textfield("softclip_ceiling", softclip.ceiling))
    ]));
}

function addFormInputsForAnvilWarnings(warnings) {
    addToForm(h4("Amp Clip Response"));
    addToForm(p("", "", [
        span("", "limiter cut (dB): ",
             textfield("clip_cut_amount", warnings.clipcut)),
        span("", "cut acceleration: ",
             textfield("clip_cut_acceleration", warnings.clipaccel)),
        span("", "cut rate (dB/sec): ",
             textfield("clip_cut_rate", warnings.clipcutrate))
    ]));
    addToForm(p("", "", [
        span("", "limiter release rate (db/sec): ",
             textfield("clip_release_rate", warnings.clipreleaserate)),
        span("", "release delay (sec): ",
             textfield("clip_release_delay", warnings.clipreleasedelay)),
    ]));
}

//------------------------------------------------------------------------------
// Returns an array of all the inputs necesary for 1 filter

function createFilterControlInputs(driver, num, filterData) {

    // driver = [ "t" | "m" | etc... ]
    // num = [ "1" | "2" | etc... ]
    // filterData = {"type" : "highpass", "freq" : "2000", "Q"  :"1.0", "gain" : "0"} or similar.
    
    var opts = [
        new Option("highpass", "highpass"),
        new Option("lowpass", "lowpass"),
        new Option("bandpass", "bandpass"),
        new Option("lfshelf",  "lfshelf"),
        new Option("hfshelf",  "hfshelf"),
        new Option("allpass", "allpass"),
        new Option("blank", "blank")
    ];
    
    var typeDropdown = dropdown(driver + "_filters_" + num + "_type", opts, filterData.type);  
    typeDropdown.onchange = typeDropdownChanged;
    
    var type = span("", "type: ", typeDropdown);
    var freq = span("", "freq: ", textfield(driver + "_filters_" + num + "_freq", filterData.freq));
    var Q    = span("", "Q: ", textfield(driver + "_filters_" + num + "_Q", filterData.Q  ));
    var gain = span("", "gain: ", textfield(driver + "_filters_" + num + "_gain", filterData.gain));
    var phase = span("", "phase: ", textfield(driver + "_filters_" + num + "_phase", filterData.phase));
    
    return [type, freq, Q, gain, phase];
}

function createFilterControlInputsBPOnly(driver, num, filterData) {

    // driver = [ "t" | "m" | etc... ]
    // num = [ "1" | "2" | etc... ]
    // filterData = {"type" : "highpass", "freq" : "2000", "Q"  :"1.0", "gain" : "0"} or similar.

    //var freq = span("", "freq: ", textfield(driver + "_freqSelLimiter_filters_" + num + "_freq", filterData.freq));
    //var Q    = span("", "Q: ", textfield(driver + "_freqSelLimiter_filters_" + num + "_Q", filterData.Q  ));
    //var gain = span("", "gain: ", textfield(driver + "_freqSelLimiter_filters_" + num + "_gain", filterData.gain));

    return [freq, Q, gain];
}


//------------------------------------------------------------------------------

function addFormInputsForFilters(driver, filters) {
    addToForm(h4("Filters"));
    for (var i in filters) {
        addToForm(p("", "(" + i + ") ", createFilterControlInputs(driver, i, filters[i])));
    }
}

function addFormInputsForFiltersBPOnly(driver, filters) {
    addToForm(h4("Bandpass Filters"));
    for (var i in filters) {
        addToForm(p("", "(" + i + ") ", createFilterControlInputsBPOnly(driver, i, filters[i])));
    }
}

//------------------------------------------------------------------------------
// Add all the inputs for a driver (i.e. tweeter, midrange, woofer) to the form.

function addFormInputsForDriver(title, driver, sectionData) {

    // title = ["Tweeter" | "Midrange" | etc... ]
    // driver = [ "tweeter" | "midrange1" | etc... ]  Should be *identical* to property identifier!
    // sectionData = {"0" : {"type" : "highpass", "freq" : "2000", "Q"  :"1.0", "gain" : "0"}, "1" : etc... }

    addToForm(h3(title));

    if (sectionData.channelGainIndB != undefined)
        addFormInputForChannelGain(driver, sectionData.channelGainIndB);
    if (sectionData.delay != undefined)
        addFormInputsForDelay(driver, sectionData.delay);
    if (sectionData.polarity != undefined)
        addFormInputsForPolarity(driver, sectionData.polarity);

    addFormInputsForFilters(driver, sectionData.filters);

    if (sectionData.limiter != undefined)
        addFormInputsForLimiter(driver, sectionData.limiter);
    if (sectionData.softclip != undefined)
        if (gPlatform != "Anvil")
            addFormInputsForSoftclip(driver, sectionData.softclip);
        else
            addFormInputsForAnvilSoftclip(sectionData.softclip);
    if (sectionData.warnings != undefined)
        addFormInputsForAnvilWarnings(sectionData.warnings);
    if (sectionData.dynamicBass != undefined)
        addFormInputsForDynamicBass(driver, sectionData.dynamicBass);
    //if (sectionData.freqSelLimiter != undefined)
        //addFormInputsForFreqSelLimiter(driver, sectionData.freqSelLimiter);
    if (sectionData.dynamicBandpass != undefined)
        addFormInputsForDynamicBandpass(driver, sectionData.dynamicBandpass);
    if (sectionData.portMask != undefined)
        addFormInputsForPortMask(sectionData.portMask);
    if (sectionData.excursion != undefined)
        addFormInputsForExcursionControl(sectionData.excursion);
}

function addFormInputsSource(audiosource) {
    var opts = [
        new Option("normal", "normal"),
        new Option("left", "left"),
        new Option("right", "right"),
        new Option("mono",  "mono"),
    ];

    addToForm(h4("source"));
    addToForm(p("", "", [
        span("", "audio source ", dropdown("audiosource", opts, audiosource))
    ]));
}
//------------------------------------------------------------------------------
// ### Here the form element bassBlend_on is named.

function addFormInputsForBassBlend(driver, bassBlend) {
    addToForm(h4("Bass Blend"));
    addToForm(p("", "", [
        span("", "transition (Hz): ", textfield(driver + "_bassBlend_freq", bassBlend.freq))
    ]));
}

//------------------------------------------------------------------------------

function addFormInputsForDynamicBass(driver, dynamicBass) {
    addToForm(h4("Dynamic Bass"));
    
    addToForm(p("", "detect:", [
        span("", "freq: ", textfield(driver + "_dynamicBass_adjFreq", dynamicBass.adjFreq)),
        span("", "Q: ", textfield(driver + "_dynamicBass_adjQ", dynamicBass.adjQ))
    ]));

    addToForm(p("", "(1)", [
        span("", "freq (Hz): ", textfield(driver + "_dynamicBass_freq1", dynamicBass.freq1)),
        span("", "Q: ", textfield(driver + "_dynamicBass_Q1", dynamicBass.Q1)),
        span("", "level: ", textfield(driver + "_dynamicBass_level1", dynamicBass.level1))
    ]));
    
    addToForm(p("", "(2)", [
        span("", "freq (Hz): ", textfield(driver + "_dynamicBass_freq2", dynamicBass.freq2)),
        span("", "Q: ", textfield(driver + "_dynamicBass_Q2", dynamicBass.Q2)),
        span("", "level: ", textfield(driver + "_dynamicBass_level2", dynamicBass.level2))
    ]));
    
    addToForm(p("", "(3)", [
        span("", "freq (Hz): ", textfield(driver + "_dynamicBass_freq3", dynamicBass.freq3)),
        span("", "Q: ", textfield(driver + "_dynamicBass_Q3", dynamicBass.Q3)),
        span("", "level: ", textfield(driver + "_dynamicBass_level3", dynamicBass.level3))
    ]));

    addToForm(p("", "(4)", [
        span("", "freq (Hz): ", textfield(driver + "_dynamicBass_freq4", dynamicBass.freq4)),
        span("", "Q: ", textfield(driver + "_dynamicBass_Q4", dynamicBass.Q4)),
        span("", "level: ", textfield(driver + "_dynamicBass_level4", dynamicBass.level4))
    ]));
    
    addToForm(p("", "", [
        span("", "attack (\u03BCs): ", textfield(driver + "_dynamicBass_attackInus", dynamicBass.attackInus)),
        span("", "release (ms): ", textfield(driver + "_dynamicBass_releaseInms", dynamicBass.releaseInms)),
    ]));

}

//function addFormInputsForFreqSelLimiter(driver, freqSelLimiter) {
    //addToForm(h4("Frequency Selective Limiter"));

    //addToForm(p("", "", [
        //span("", "on/off ", checkbox(driver + "_freqSelLimiter_on", freqSelLimiter.on)),
    //]));

    //addFormInputsForFiltersBPOnly(driver, freqSelLimiter.filters);

    //addToForm(p("", "", [
        //span("", "attack (\u03BCs): ", textfield(driver + "_freqSelLimiter_attackInus", freqSelLimiter.attackInus)),
        //span("", "release (ms): ", textfield(driver + "_freqSelLimiter_releaseInms", freqSelLimiter.releaseInms)),
    //]));
//}

function addFormInputsForDynamicBandpass(driver, dynamicBandpass) {
    addToForm(h4("Dynamic Bandpass"));

    for (var i in dynamicBandpass) {
        addToForm(p("", "(" + i + ") ", [
            span("", " ", checkbox(driver + "_dynBandpass_" + i + "_on", dynamicBandpass[i].on)),
            span("", "freq:", textfield(driver + "_dynBandpass_" + i + "_freq", dynamicBandpass[i].freq)),
            span("", "Q:", textfield(driver + "_dynBandpass_" + i + "_Q", dynamicBandpass[i].Q  )),
            span("", "max level:", textfield(driver + "_dynBandpass_" + i + "_maxLevel", dynamicBandpass[i].maxLevel)),
            span("", "att(\u03BCs):", textfield(driver + "_dynBandpass_" + i + "_attackInus", dynamicBandpass[i].attackInus)),
            span("", "rel(ms):", textfield(driver + "_dynBandpass_" + i + "_releaseInms", dynamicBandpass[i].releaseInms)),
        ]));
    }
}

//------------------------------------------------------------------------------

function addFormInputsForPortMask(portMask) {
    addToForm(h4("Port Noise Masking"));
    addToForm(p("", "", [
        span("", "coef: ",
             textfield("portmask_coef", portMask.coef)),
        span("", "threshold: ",
             textfield("portmask_threshold", portMask.threshold)),
    ]));
}

//------------------------------------------------------------------------------

function addFormInputsForBothMidranges(title, driver, sectionData) {

    addToForm(h3(title));
    
    addFormInputsForBassBlend(driver, sectionData.bassBlend);
    addFormInputsForDynamicBass(driver, sectionData.dynamicBass);
    addFormInputsForLimiter(driver, sectionData.limiter);
}

//------------------------------------------------------------------------------

function addFormInputsForExcursionControl(excursion) {
    addToForm(h4("Excursion Control"));
    addToForm(p("", "", [
        span("", "on/off", checkbox("excursion_on", excursion.on))
    ]));
    addToForm(p("", "", [
        span("", "target excursion (mm): ",
             textfield("excursion_target", excursion.target)),
        span("", "excursion filter gain: ",
             textfield("excursion_filtergain", excursion.filtergain)),
        span("", "RMS time constant (sec)",
             textfield("excursion_rmstime", excursion.rmstime))
    ]));
    addToForm(p("", "", [
        span("", "limiter on/off", checkbox("excursion_limiteron", excursion.limiteron))
    ]));
    addToForm(p("", "", [
        span("", "limiter attack (msec): ",
             textfield("excursion_limiterattack", excursion.limiterattack)),
        span("", "limiter release (msec): ",
             textfield("excursion_limiterrelease", excursion.limiterrelease))
    ]));
    addToForm(p("", "", [
        span("", "minimum cutoff (Hz): ",
             textfield("excursion_mincutoff", excursion.mincutoff)),
        span("", "maximum cutoff (Hz): ",
             textfield("excursion_maxcutoff", excursion.maxcutoff))
    ]));
    addToForm(p("","", [
        span("", "stage 0 q: ",
             textfield("excursion_q_0", excursion.q0)),
        span("", "stage 1 q: ",
             textfield("excursion_q_1", excursion.q1))
    ]));
    addToForm(p("", "", [
        span("", "cutoff attack (msec): ",
             textfield("excursion_cutoffattack", excursion.cutoffattack)),
        span("", "cutoff release (msec): ",
             textfield("excursion_cutoffrelease", excursion.cutoffrelease)),
    ]));
}

//------------------------------------------------------------------------------
// show/hide the gain field based on the filter type

function showFieldsForFilterType(id) {
    // id = "tweeter_filters_2_type" or similar. Id of dropdown selector.
    
    var idPrefix = id.replace(/_type/, "");
    
    var typeElem = document.getElementById(id);
    var gainElem = document.getElementById(idPrefix + "_gain");
    var qElem    = document.getElementById(idPrefix + "_Q"   );
    var freqElem = document.getElementById(idPrefix + "_freq");
    var phaseElem = document.getElementById(idPrefix + "_phase");
    
    switch (typeElem.value) {
        case "highpass" :
        case "lowpass" :
            freqElem.parentNode.style.visibility = "visible";            
            qElem   .parentNode.style.visibility = "visible";
            gainElem.parentNode.style.visibility = "hidden";            
            phaseElem.parentNode.style.visibility = "hidden";
        break;
        
        case "bandpass" :
            freqElem.parentNode.style.visibility = "visible";            
            qElem   .parentNode.style.visibility = "visible";
            gainElem.parentNode.style.visibility = "visible";            
            phaseElem.parentNode.style.visibility = "hidden";
        break;
        
        case "lfshelf" :
        case "hfshelf" :
            freqElem.parentNode.style.visibility = "visible";            
            qElem   .parentNode.style.visibility = "visible";
            gainElem.parentNode.style.visibility = "visible";            
            phaseElem.parentNode.style.visibility = "hidden";
        break;
        
        case "allpass" :
            freqElem.parentNode.style.visibility = "visible";            
            qElem   .parentNode.style.visibility = "hidden";
            gainElem.parentNode.style.visibility = "hidden";            
            phaseElem.parentNode.style.visibility = "visible";
        break;
        
        case "blank" :
            freqElem.parentNode.style.visibility = "hidden";            
            qElem   .parentNode.style.visibility = "hidden";
            gainElem.parentNode.style.visibility = "hidden";            
            phaseElem.parentNode.style.visibility = "hidden";
        break;
        
        default: // Do nothing. But always good to say so explicitly.
    }
}

//------------------------------------------------------------------------------

function buildFormWithDataFromPresetNum(presetNum) {
    var presetData = gMainData.presets[presetNum];
    var form = document.getElementById("eqForm");
    
    // remove all old elements
    while (form.elements[0]) {
        form.removeChild(form.childNodes[0]);
    }
    
    addToForm(div("form_buttons", "", [
        // These buttons are shown when the form is dirty
        div("dirty_buttons", "", [
            createFormButton("save_button", "Save Changes", saveChanges),
            createFormButton("preview_button", "Preview Changes", previewChanges),
            createFormButton("abort_button", "Abort Changes", abortChanges),
        ]),
        // These buttons are always shown
        div("other_buttons", "", [
            createFormButton("copy_button", "Copy this Preset", makeCopyOfCurrentPreset),
            createFormButton("delete_button", "Delete this Preset", deletePreset),
        ]),
    ]));
    showDirtyButtons(false);
    
    // Build the form from the preset data
    addToForm(p("", "Preset name: ", textfield("presetName", presetData.presetName)));
    if (gPlatform == "ZPS5") {
        addToForm(p("", "Overall gain (dB): ", textfield("overallGainIndB", presetData.overallGainIndB)));
        addFormInputsForDriver("Tweeter 1",  "tweeter1", presetData.tweeter1);
        addFormInputsForDriver("Tweeter 2",  "tweeter2", presetData.tweeter2);
        addFormInputsForDriver("Midrange 1",  "midrange1", presetData.midrange1);
        addFormInputsForDriver("Midrange 2",  "midrange2", presetData.midrange2);
        addFormInputsForDriver("Woofer",  "woofer", presetData.woofer);
        addFormInputsForDriver("DynWoofer",  "wooferDyn", presetData.wooferDyn);
    } else if (gPlatform == "ZP120") {
        addFormInputsForDriver("Satellite", "satellite", presetData.satellite);
        addFormInputsForDriver("Subw",  "subw", presetData.subw);
    } else if (gPlatform == "Fenway") {
        addToForm(p("", "Overall gain (dB): ", textfield("overallGainIndB", presetData.overallGainIndB)));
        addFormInputsSource(presetData.audiosource);
        addFormInputsForDriver("Tweeter",  "tweeter", presetData.tweeter);
        addFormInputsForBothMidranges("Both Midranges",  "bothMidranges", presetData.bothMidranges);
        addFormInputsForDriver("Midrange 1",  "midrange1", presetData.midrange1);
        addFormInputsForDriver("Midrange 2",  "midrange2", presetData.midrange2);
    } else if (gPlatform == "Anvil") {
        addFormInputsForDriver("Subw",  "subw", presetData.subw);
    } else if (gPlatform == "Limelight") {
        addToForm(p("", "Overall gain (dB): ", textfield("overallGainIndB", presetData.overallGainIndB)));
    }

    // hide the gain field for high- and low-pass filters
    for (var i in form.elements) {
        var elem = form.elements[i];
        if (elem.id && (elem.id.indexOf("_type") != -1)) {
            showFieldsForFilterType(elem.id);
        }
    }
}

//==============================================================================
// Form validation
//==============================================================================

function validateForm () {
    var valid = true;
    var form = document.getElementById("eqForm");
    
    if (gPlatform == "-ZPS5") {

        for (var i in form.elements) {
            var elem = form.elements[i];
            
            // reset any error markers
            elem.className = "";
            if (elem.parentNode) {
                elem.parentNode.className = "";
            }
            
            // now check for errors
            if (elem.id != undefined) {
                if (elem.id.indexOf("type_") != -1) {
                    if ( (elem.value.indexOf("lowpass") == -1)
                      && (elem.value.indexOf("highpass") == -1)
                      && (elem.value.indexOf("bandpass") == -1)
                      && (elem.value.indexOf("allpass") == -1) ) {
                        elem.parentNode.className = "error";
                        valid = false;
                    }
                }
                // Filter Frequency
                else if (elem.id.indexOf("freq_") != -1) {
                    if (! isNumericInRange(elem.value, 1, 22499)) {
                        elem.className = "error";
                        valid = false;
                    }
                }
                // Filter Qf
                else if (elem.id.indexOf("Q_") != -1) {
                    if (! isNumericInRange(elem.value, 0.01, 15)) {
                        elem.className = "error";
                        valid = false;
                    }
                }
                // Filter Gain
                else if (elem.id.indexOf("gain_") != -1) {
                    if (! isNumericInRange(elem.value, -60, 10)) {
                        elem.className = "error";
                        valid = false;
                    }
                }
                // Allpass Filter
                // Only allow phase adjustment from 20 - 160?
                // The filter works better in this region
                // TODO: add check

                // Overall Gain
                else if (elem.id.indexOf("gaina") != -1) {
                    if (! isNumericInRange(elem.value, -60, 10)) {
                        elem.className = "error";
                        valid = false;
                    }
                }
                // Channel Gain
                else if (elem.id.indexOf("gain") != -1) {
                    if (! isNumericInRange(elem.value, -100, 0)) {
                        elem.className = "error";
                        valid = false;
                    }
                }
                // Channel Delay
                else if (elem.id.indexOf("delay") != -1) {
                    if (! isNumericInRange(elem.value, 1, 15)) {
                        elem.className = "error";
                        valid = false;
                    }
                }
                // Limiter Threshold
                else if (elem.id.indexOf("thresh") != -1) {
                    if (! isNumericInRange(elem.value, 0, 10)) {
                        elem.className = "error";
                        valid = false;
                    }
                }
                // Limiter Attack
                else if (elem.id.indexOf("attack") != -1) {
                    if (! isNumericInRange(elem.value, 1, 100000)) {
                        elem.className = "error";
                        valid = false;
                    }
                }
                // Limiter Release
                else if (elem.id.indexOf("release") != -1) {
                    if (! isNumericInRange(elem.value, 1, 1000)) {
                        elem.className = "error";
                        valid = false;
                    }
                }
            }
        }
    } else if (gPlatform == "Fenway" || gPlatform == "ZP120") {
         for (var i in form.elements) {
                var elem = form.elements[i];
                // reset any error markers
                elem.className = "";
                if (elem.parentNode) {
                    elem.parentNode.className = "";
                }
                
         // Nothing else here yet. 
                
         }
    
    }
    
    return valid;
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

function presetTabWasClicked () {
    // If the save button is enabled, assume there are unsaved changes.
    if (document.getElementById("save_button")) {
        displayMessage("Error:  Unsaved changes. Please save or abort them before changing presets.");
        return;
    }
    
    // Save the preset data (just so that current_preset_num gets updated)
    makePresetActive(this.presetNum, true, "The ZP is now using new EQ settings.");
}

//------------------------------------------------------------------------------
// Update the UI to show the given preset as active, optionally submitting the
// eq data to the ZP.

function makePresetActive (presetNum, submitToZP, custom_success_message) {
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
    
    // Load the UI with the data for that preset
    buildFormWithDataFromPresetNum(gMainData.current_preset_num);
    
    if (submitToZP) {
        sendPresetDataToZP(custom_success_message);
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

function saveChanges () {
    if (this.className != "disabled_form_button") {
        if (! validateForm()) {
            displayMessage("Please fix errors highlighted in red.");
            return;
        }

        var preset = gMainData.presets[gMainData.current_preset_num];
        preset.presetName = document.getElementById("presetName").value;

        if (gPlatform == "ZPS5") {
            var preset = gMainData.presets[gMainData.current_preset_num];

            preset.overallGainIndB = document.getElementById("overallGainIndB").value;
            // Preset values for tweeter1
            for (var filterNum in preset.tweeter1.filters) {
                preset.tweeter1.filters[filterNum].type = document.getElementById("tweeter1_filters_" + filterNum + "_type").value;
                preset.tweeter1.filters[filterNum].freq = document.getElementById("tweeter1_filters_" + filterNum + "_freq").value;
                preset.tweeter1.filters[filterNum].Q = document.getElementById("tweeter1_filters_" + filterNum + "_Q").value;
                preset.tweeter1.filters[filterNum].phase = document.getElementById("tweeter1_filters_" + filterNum + "_phase").value;
                preset.tweeter1.filters[filterNum].gain = document.getElementById("tweeter1_filters_" + filterNum + "_gain").value;
            }

            // Preset values for tweeter2
            for (var filterNum in preset.tweeter2.filters) {
                preset.tweeter2.filters[filterNum].type = document.getElementById("tweeter2_filters_" + filterNum + "_type").value;
                preset.tweeter2.filters[filterNum].freq = document.getElementById("tweeter2_filters_" + filterNum + "_freq").value;
                preset.tweeter2.filters[filterNum].Q = document.getElementById("tweeter2_filters_" + filterNum + "_Q").value;
                preset.tweeter2.filters[filterNum].phase = document.getElementById("tweeter2_filters_" + filterNum + "_phase").value;
                preset.tweeter2.filters[filterNum].gain = document.getElementById("tweeter2_filters_" + filterNum + "_gain").value;
            }

            // Preset values for midrange1
            for (var filterNum in preset.midrange1.filters) {
                preset.midrange1.filters[filterNum].type = document.getElementById("midrange1_filters_" + filterNum + "_type").value;
                preset.midrange1.filters[filterNum].freq = document.getElementById("midrange1_filters_" + filterNum + "_freq").value;
                preset.midrange1.filters[filterNum].Q = document.getElementById("midrange1_filters_" + filterNum + "_Q").value;
                preset.midrange1.filters[filterNum].phase = document.getElementById("midrange1_filters_" + filterNum + "_phase").value;
                preset.midrange1.filters[filterNum].gain = document.getElementById("midrange1_filters_" + filterNum + "_gain").value;
            }

            // Preset values for midrange2
            for (var filterNum in preset.midrange2.filters) {
                preset.midrange2.filters[filterNum].type = document.getElementById("midrange2_filters_" + filterNum + "_type").value;
                preset.midrange2.filters[filterNum].freq = document.getElementById("midrange2_filters_" + filterNum + "_freq").value;
                preset.midrange2.filters[filterNum].Q = document.getElementById("midrange2_filters_" + filterNum + "_Q").value;
                preset.midrange2.filters[filterNum].phase = document.getElementById("midrange2_filters_" + filterNum + "_phase").value;
                preset.midrange2.filters[filterNum].gain = document.getElementById("midrange2_filters_" + filterNum + "_gain").value;
            }

            // Preset values for woofer
            for (var filterNum in preset.woofer.filters) {
                preset.woofer.filters[filterNum].type = document.getElementById("woofer_filters_" + filterNum + "_type").value;
                preset.woofer.filters[filterNum].freq = document.getElementById("woofer_filters_" + filterNum + "_freq").value;
                preset.woofer.filters[filterNum].Q = document.getElementById("woofer_filters_" + filterNum + "_Q").value;
                preset.woofer.filters[filterNum].phase = document.getElementById("woofer_filters_" + filterNum + "_phase").value;
                preset.woofer.filters[filterNum].gain = document.getElementById("woofer_filters_" + filterNum + "_gain").value;
            }

            // Preset values for wooferDyn
            for (var filterNum in preset.wooferDyn.filters) {
                preset.wooferDyn.filters[filterNum].type = document.getElementById("wooferDyn_filters_" + filterNum + "_type").value;
                preset.wooferDyn.filters[filterNum].freq = document.getElementById("wooferDyn_filters_" + filterNum + "_freq").value;
                preset.wooferDyn.filters[filterNum].Q = document.getElementById("wooferDyn_filters_" + filterNum + "_Q").value;
                preset.wooferDyn.filters[filterNum].phase = document.getElementById("wooferDyn_filters_" + filterNum + "_phase").value;
                preset.wooferDyn.filters[filterNum].gain = document.getElementById("wooferDyn_filters_" + filterNum + "_gain").value;
            }

        } else if (gPlatform == "Fenway") {
            var preset = gMainData.presets[gMainData.current_preset_num];

            preset.overallGainIndB = document.getElementById("overallGainIndB").value;
            preset.audiosource = document.getElementById("audiosource").value;
            // Preset values that apply to both midranges.

            preset.bothMidranges.bassBlend.freq = document.getElementById("bothMidranges_bassBlend_freq").value;

            preset.bothMidranges.dynamicBass.adjFreq = document.getElementById("bothMidranges_dynamicBass_adjFreq").value;
            preset.bothMidranges.dynamicBass.adjQ = document.getElementById("bothMidranges_dynamicBass_adjQ").value;
            preset.bothMidranges.dynamicBass.freq1 = document.getElementById("bothMidranges_dynamicBass_freq1").value;
            preset.bothMidranges.dynamicBass.Q1 = document.getElementById("bothMidranges_dynamicBass_Q1").value;
            preset.bothMidranges.dynamicBass.level1 = document.getElementById("bothMidranges_dynamicBass_level1").value;
            preset.bothMidranges.dynamicBass.freq2 = document.getElementById("bothMidranges_dynamicBass_freq2").value;
            preset.bothMidranges.dynamicBass.Q2 = document.getElementById("bothMidranges_dynamicBass_Q2").value;
            preset.bothMidranges.dynamicBass.level2 = document.getElementById("bothMidranges_dynamicBass_level2").value;
            preset.bothMidranges.dynamicBass.freq3 = document.getElementById("bothMidranges_dynamicBass_freq3").value;
            preset.bothMidranges.dynamicBass.Q3 = document.getElementById("bothMidranges_dynamicBass_Q3").value;
            preset.bothMidranges.dynamicBass.level3 = document.getElementById("bothMidranges_dynamicBass_level3").value;
            preset.bothMidranges.dynamicBass.freq4 = document.getElementById("bothMidranges_dynamicBass_freq4").value;
            preset.bothMidranges.dynamicBass.Q4 = document.getElementById("bothMidranges_dynamicBass_Q4").value;
            preset.bothMidranges.dynamicBass.level4 = document.getElementById("bothMidranges_dynamicBass_level4").value;
            preset.bothMidranges.dynamicBass.attackInus = document.getElementById("bothMidranges_dynamicBass_attackInus").value;
            preset.bothMidranges.dynamicBass.releaseInms = document.getElementById("bothMidranges_dynamicBass_releaseInms").value;

            preset.bothMidranges.limiter.threshold = document.getElementById("bothMidranges_limiter_threshold").value;
            preset.bothMidranges.limiter.attackInus = document.getElementById("bothMidranges_limiter_attackInus").value;
            preset.bothMidranges.limiter.releaseInms = document.getElementById("bothMidranges_limiter_releaseInms").value;

            // Preset values for tweeter
            preset.tweeter.channelGainIndB = document.getElementById("tweeter_channelGainIndB").value;
            preset.tweeter.polarity = document.getElementById("tweeter_polarity").value;
            preset.tweeter.delay = document.getElementById("tweeter_delay").value;

            preset.tweeter.limiter.threshold = document.getElementById("tweeter_limiter_threshold").value;
            preset.tweeter.limiter.attackInus = document.getElementById("tweeter_limiter_attackInus").value;
            preset.tweeter.limiter.releaseInms = document.getElementById("tweeter_limiter_releaseInms").value;

            for (var filterNum in preset.tweeter.filters) {
                preset.tweeter.filters[filterNum].type = document.getElementById("tweeter_filters_" + filterNum + "_type").value;
                preset.tweeter.filters[filterNum].freq = document.getElementById("tweeter_filters_" + filterNum + "_freq").value;
                preset.tweeter.filters[filterNum].Q = document.getElementById("tweeter_filters_" + filterNum + "_Q").value;
                preset.tweeter.filters[filterNum].phase = document.getElementById("tweeter_filters_" + filterNum + "_phase").value;
                preset.tweeter.filters[filterNum].gain = document.getElementById("tweeter_filters_" + filterNum + "_gain").value;
            }

            for (var filterNum in preset.midrange1.filters) {
                preset.midrange1.filters[filterNum].type = document.getElementById("midrange1_filters_" + filterNum + "_type").value;
                preset.midrange1.filters[filterNum].freq = document.getElementById("midrange1_filters_" + filterNum + "_freq").value;
                preset.midrange1.filters[filterNum].Q = document.getElementById("midrange1_filters_" + filterNum + "_Q").value;
                preset.midrange1.filters[filterNum].phase = document.getElementById("midrange1_filters_" + filterNum + "_phase").value;
                preset.midrange1.filters[filterNum].gain = document.getElementById("midrange1_filters_" + filterNum + "_gain").value;
            }

            for (var filterNum in preset.midrange2.filters) {
                preset.midrange2.filters[filterNum].type = document.getElementById("midrange2_filters_" + filterNum + "_type").value;
                preset.midrange2.filters[filterNum].freq = document.getElementById("midrange2_filters_" + filterNum + "_freq").value;
                preset.midrange2.filters[filterNum].Q = document.getElementById("midrange2_filters_" + filterNum + "_Q").value;
                preset.midrange2.filters[filterNum].phase = document.getElementById("midrange2_filters_" + filterNum + "_phase").value;
                preset.midrange2.filters[filterNum].gain = document.getElementById("midrange2_filters_" + filterNum + "_gain").value;
            }
        } else if (gPlatform == "Anvil") {
            // Preset values for subwoofer
            preset.subw.channelGainIndB = document.getElementById("subw_channelGainIndB").value;
            preset.subw.polarity = document.getElementById("subw_polarity").value;
            preset.subw.delay = document.getElementById("subw_delay").value;

            //preset.subw.freqSelLimiter.on = document.getElementById("subw_freqSelLimiter_on").checked;
            //preset.subw.freqSelLimiter.attackInus = document.getElementById("subw_freqSelLimiter_attackInus").value;
            //preset.subw.freqSelLimiter.releaseInms = document.getElementById("subw_freqSelLimiter_releaseInms").value;
            //for (var filterNum in preset.subw.freqSelLimiter.filters) {
                //preset.subw.freqSelLimiter.filters[filterNum].freq = document.getElementById("subw_freqSelLimiter_filters_" + filterNum + "_freq").value;
                //preset.subw.freqSelLimiter.filters[filterNum].Q = document.getElementById("subw_freqSelLimiter_filters_" + filterNum + "_Q").value;
                //preset.subw.freqSelLimiter.filters[filterNum].gain = document.getElementById("subw_freqSelLimiter_filters_" + filterNum + "_gain").value;
            //}

            for (var filterNum in preset.subw.filters) {
                preset.subw.filters[filterNum].type = document.getElementById("subw_filters_" + filterNum + "_type").value;
                preset.subw.filters[filterNum].freq = document.getElementById("subw_filters_" + filterNum + "_freq").value;
                preset.subw.filters[filterNum].Q = document.getElementById("subw_filters_" + filterNum + "_Q").value;
                preset.subw.filters[filterNum].phase = document.getElementById("subw_filters_" + filterNum + "_phase").value;
                preset.subw.filters[filterNum].gain = document.getElementById("subw_filters_" + filterNum + "_gain").value;
            }

            // dynamic bandpass filters
            for (var i in preset.subw.dynamicBandpass) {
                preset.subw.dynamicBandpass[i].on = document.getElementById("subw_dynBandpass_" + i + "_on").checked;
                preset.subw.dynamicBandpass[i].freq = document.getElementById("subw_dynBandpass_" + i + "_freq").value;
                preset.subw.dynamicBandpass[i].Q = document.getElementById("subw_dynBandpass_" + i + "_Q").value;
                preset.subw.dynamicBandpass[i].maxLevel = document.getElementById("subw_dynBandpass_" + i + "_maxLevel").value;
                preset.subw.dynamicBandpass[i].attackInus = document.getElementById("subw_dynBandpass_" + i + "_attackInus").value;
                preset.subw.dynamicBandpass[i].releaseInms = document.getElementById("subw_dynBandpass_" + i + "_releaseInms").value;
            }

            preset.subw.portMask.coef = document.getElementById("portmask_coef").value;
            preset.subw.portMask.threshold = document.getElementById("portmask_threshold").value;

            preset.subw.limiter.on = document.getElementById("subw_limiter_on").checked;
            preset.subw.limiter.threshold = document.getElementById("subw_limiter_threshold").value;
            preset.subw.limiter.attackInus = document.getElementById("subw_limiter_attackInus").value;
            preset.subw.limiter.releaseInms = document.getElementById("subw_limiter_releaseInms").value;

            // softclip controls
            preset.subw.softclip.on =
                document.getElementById("softclip_on").checked;
            preset.subw.softclip.threshold =
                document.getElementById("softclip_threshold").value;
            preset.subw.softclip.ceiling =
                document.getElementById("softclip_ceiling").value;

            // warning response controls
            preset.subw.warnings.clipcut =
                document.getElementById("clip_cut_amount").value;
            preset.subw.warnings.clipaccel =
                document.getElementById("clip_cut_acceleration").value;
            preset.subw.warnings.clipcutrate =
                document.getElementById("clip_cut_rate").value;
            preset.subw.warnings.clipreleaserate =
                document.getElementById("clip_release_rate").value;
            preset.subw.warnings.clipreleasedelay =
                document.getElementById("clip_release_delay").value;

            // excursion control controls
            preset.subw.excursion.on =
                document.getElementById("excursion_on").checked;
            preset.subw.excursion.target =
                document.getElementById("excursion_target").value;
            preset.subw.excursion.filtergain =
                document.getElementById("excursion_filtergain").value;
            preset.subw.excursion.rmstime =
                document.getElementById("excursion_rmstime").value;
            preset.subw.excursion.limiteron =
                document.getElementById("excursion_limiteron").checked;
            preset.subw.excursion.limiterattack =
                document.getElementById("excursion_limiterattack").value;
            preset.subw.excursion.limiterrelease =
                document.getElementById("excursion_limiterrelease").value;
            preset.subw.excursion.mincutoff =
                document.getElementById("excursion_mincutoff").value;
            preset.subw.excursion.maxcutoff =
                document.getElementById("excursion_maxcutoff").value;
            preset.subw.excursion.q0 =
                document.getElementById("excursion_q_0").value;
            preset.subw.excursion.q1 =
                document.getElementById("excursion_q_1").value;
            preset.subw.excursion.cutoffattack =
                document.getElementById("excursion_cutoffattack").value;
            preset.subw.excursion.cutoffrelease =
                document.getElementById("excursion_cutoffrelease").value;
        } else if (gPlatform == "ZP120") {
            // Preset values that apply to satellite speakers
            for (var filterNum in preset.satellite.filters) {
                preset.satellite.filters[filterNum].type = document.getElementById("satellite_filters_" + filterNum + "_type").value;
                preset.satellite.filters[filterNum].freq = document.getElementById("satellite_filters_" + filterNum + "_freq").value;
                preset.satellite.filters[filterNum].Q = document.getElementById("satellite_filters_" + filterNum + "_Q").value;
                preset.satellite.filters[filterNum].phase = document.getElementById("satellite_filters_" + filterNum + "_phase").value;
                preset.satellite.filters[filterNum].gain = document.getElementById("satellite_filters_" + filterNum + "_gain").value;
            }

            for (var filterNum in preset.subw.filters) {
                preset.subw.filters[filterNum].type = document.getElementById("subw_filters_" + filterNum + "_type").value;
                preset.subw.filters[filterNum].freq = document.getElementById("subw_filters_" + filterNum + "_freq").value;
                preset.subw.filters[filterNum].Q = document.getElementById("subw_filters_" + filterNum + "_Q").value;
                preset.subw.filters[filterNum].phase = document.getElementById("subw_filters_" + filterNum + "_phase").value;
                preset.subw.filters[filterNum].gain = document.getElementById("subw_filters_" + filterNum + "_gain").value;
            }
        } else if (gPlatform == "Limelight") {
            var preset = gMainData.presets[gMainData.current_preset_num];

            preset.overallGainIndB = document.getElementById("overallGainIndB").value;
        }
        sendPresetDataToZP();
    }
}

//------------------------------------------------------------------------------

function previewChanges () {
    if (this.className != "disabled_form_button") {
        if (submitEQDataToZP()) {
            displayMessage("Warning: Changes are being previewed on the ZonePlayer, but aren't yet saved.");
        }
    }
}

//------------------------------------------------------------------------------

function abortChanges () {
    if (this.className != "disabled_form_button") {
        if (confirm("This will delete all the unsaved changes you have made.\n\nAre you sure you want to discard these changes?")) {
            buildFormWithDataFromPresetNum(gMainData.current_preset_num);
            showDirtyButtons(false);
            
            // send the old saved eq data
            submitEQDataToZP();
        }
    }
}

//------------------------------------------------------------------------------

function makeCopyOfCurrentPreset () {
    // Deep-copy the current preset
    var newPreset = new cloneObject(gMainData.presets[gMainData.current_preset_num]);
    
    // Check all preset names for duplicates.  On the first copy, add " copy"
    // to the name, on subsequent copies, add an incrementing number.
    var duplicateName = true;
    while (duplicateName) {
        var copyNum = newPreset.presetName.match(/copy ?(\d*)$/);
        if (copyNum) {
            if (copyNum[1]) {
                var num = parseInt(copyNum[1]) + 1;
                newPreset.presetName = newPreset.presetName.replace(/ ?\d*$/, " " + num);
            }
            else {
                newPreset.presetName += " 2";
            }
        }
        else {
            newPreset.presetName += " copy";
        }
        
        // check for duplicates
        duplicateName = false;
        for(i in gMainData.presets) {
            var p = gMainData.presets[i];
            if (newPreset.presetName == p.presetName) {
                duplicateName = true;
            }
        }
    }
    
    // Add new preset to the array
    gMainData.presets.push(newPreset);
    
    // Mark form as dirty so it stays dirty in case the save fails.
    markFormDirty();
    
    // Rebuild the tabs so it has one for the new preset
    buildTabs();
    
    // Make the new preset active (and save it immediately).
    makePresetActive(gMainData.presets.length-1, true, "Made new preset: " + newPreset.presetName);
}

//------------------------------------------------------------------------------

function deletePreset () {
    if (gMainData.presets.length == 1) {
        displayMessage("Can't delete last preset.");
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
        
        // Activate that preset, and save changes to ZP
        makePresetActive(goToPreset, true, "Deleted preset: " + presetName);
        gMainData.current_preset_num = gMainData.presets.length - 1;
    }
}

//------------------------------------------------------------------------------

function addNewDefaultPreset () {
    if (gButtons["save_button"].className != "disabled_form_button") {
        displayMessage("Error:  Unsaved changes in the current preset. Please save or abort them first.");
        return;
    }
    
    if (gPlatform == "ZPS5")
        gMainData.presets.push(new cloneObject(gDefaultPresetZPS5));
    else if (gPlatform == "Fenway")
        gMainData.presets.push(new cloneObject(gDefaultPresetFenway));
    else if (gPlatform == "Limelight")
        gMainData.presets.push(new cloneObject(gDefaultPresetLL));
    else if (gPlatform == "Anvil")
        gMainData.presets.push(new cloneObject(gDefaultPresetAnvil));
    else if (gPlatform == "ZP120")
        gMainData.presets.push(new cloneObject(gDefaultPresetZP120));
    
    // make it active and save to ZP
    buildTabs();
    makePresetActive(gMainData.presets.length - 1, true, "Created new default preset.");
}

//==============================================================================
// Communication with ZonePlayer.
//==============================================================================

function paramPairFromCheckboxWithId (id) {
    str ="";
    var elem = document.getElementById(id);
    if (elem && elem.checked) {
        str = id + "=true&";
    } else {
        str = id + "=false&";
    }
    return str;
}

//------------------------------------------------------------------------------

function paramPairFromTextWithId (id) {
    str = "";
    var elem = document.getElementById(id);
    
    if (elem && elem.value != undefined) {
        var value = document.getElementById(id).value;
        if (value != undefined && value != "") {
            str = id + "=" + value + "&";
        }
    }
    return str;
}

//------------------------------------------------------------------------------

// Helper methods to generate the string of EQ data to post to the ZP
function generateParamStrForSection (driver, sectionData) {
    var str = "";
    for (var i in sectionData.filters) {
        str += paramPairFromTextWithId("type_" + driver+i);
        str += paramPairFromTextWithId("freq_" + driver+i);
        str += paramPairFromTextWithId("Q_" + driver+i);
        str += paramPairFromTextWithId("gain_" + driver+i);
    }
    str += paramPairFromTextWithId("gain" + driver);
    str += paramPairFromTextWithId("delay" + driver);
    str += paramPairFromTextWithId("limthresh" + driver);
    str += paramPairFromTextWithId("limattack" + driver);
    str += paramPairFromTextWithId("limrelease" + driver);
    str += paramPairFromTextWithId("softthresh" + driver);
    str += paramPairFromTextWithId("softattack" + driver);
    str += paramPairFromTextWithId("softrelease" + driver);
    str += paramPairFromTextWithId("inverted" + driver);
    return str;
}

//------------------------------------------------------------------------------

// Wrapper method used to submit the given string to the ZP
function postDataToZP (url, string, success_callback) {
    var http_request = newRequestObject();
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
        }
    };
    
    // Passing "true" as the 3rd arg to open() means "async".
    // Note:  Safari doesn't work with async.
    http_request.open("POST", url, true);
    http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // http_request.setRequestHeader("Content-length", string.length);
    // http_request.setRequestHeader("Connection", "close");
    http_request.send(string);
}

//------------------------------------------------------------------------------

// Submit 1 set of EQ params, which the ZP will immediately use
function submitEQDataToZP () {
    if (! validateForm()) {
        displayMessage("Please fix errors highlighted in red.");
        return false;
    }

    var paramStr = "";
    var preset = gMainData.presets[gMainData.current_preset_num];

    if (gPlatform == "ZPS5") {
        paramStr += paramPairFromTextWithId("overallGainIndB");

        for (var filterNum in preset.tweeter1.filters) {
            paramStr += paramPairFromTextWithId("tweeter1_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("tweeter1_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("tweeter1_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("tweeter1_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("tweeter1_filters_" + filterNum + "_gain");
        }
        for (var filterNum in preset.tweeter2.filters) {
            paramStr += paramPairFromTextWithId("tweeter2_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("tweeter2_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("tweeter2_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("tweeter2_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("tweeter2_filters_" + filterNum + "_gain");
        }
        for (var filterNum in preset.midrange1.filters) {
            paramStr += paramPairFromTextWithId("midrange1_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("midrange1_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("midrange1_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("midrange1_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("midrange1_filters_" + filterNum + "_gain");
        }
        for (var filterNum in preset.midrange2.filters) {
            paramStr += paramPairFromTextWithId("midrange2_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("midrange2_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("midrange2_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("midrange2_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("midrange2_filters_" + filterNum + "_gain");
        }
        for (var filterNum in preset.woofer.filters) {
            paramStr += paramPairFromTextWithId("woofer_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("woofer_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("woofer_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("woofer_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("woofer_filters_" + filterNum + "_gain");
        }
        for (var filterNum in preset.wooferDyn.filters) {
            paramStr += paramPairFromTextWithId("wooferDyn_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("wooferDyn_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("wooferDyn_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("wooferDyn_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("wooferDyn_filters_" + filterNum + "_gain");
        }
    } else if (gPlatform == "Fenway") {
        paramStr += paramPairFromTextWithId("overallGainIndB");
        paramStr += paramPairFromTextWithId("audiosource");

        paramStr += paramPairFromTextWithId("bothMidranges_bassBlend_freq");

        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_adjFreq");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_adjQ");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_freq1");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_Q1");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_level1");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_freq2");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_Q2");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_level2");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_freq3");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_Q3");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_level3");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_freq4");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_Q4");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_level4");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_attackInus");
        paramStr += paramPairFromTextWithId("bothMidranges_dynamicBass_releaseInms");

        paramStr += paramPairFromTextWithId("bothMidranges_limiter_threshold");
        paramStr += paramPairFromTextWithId("bothMidranges_limiter_attackInus");
        paramStr += paramPairFromTextWithId("bothMidranges_limiter_releaseInms");

        paramStr += paramPairFromTextWithId("tweeter_channelGainIndB");
        paramStr += paramPairFromTextWithId("tweeter_polarity");
        paramStr += paramPairFromTextWithId("tweeter_delay");

        paramStr += paramPairFromTextWithId("tweeter_limiter_threshold");
        paramStr += paramPairFromTextWithId("tweeter_limiter_attackInus");
        paramStr += paramPairFromTextWithId("tweeter_limiter_releaseInms");

        for (var filterNum in preset.tweeter.filters) {
            paramStr += paramPairFromTextWithId("tweeter_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("tweeter_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("tweeter_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("tweeter_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("tweeter_filters_" + filterNum + "_gain");
        }

        for (var filterNum in preset.tweeter.filters) {
            paramStr += paramPairFromTextWithId("midrange1_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("midrange1_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("midrange1_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("midrange1_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("midrange1_filters_" + filterNum + "_gain");
        }

        for (var filterNum in preset.tweeter.filters) {
            paramStr += paramPairFromTextWithId("midrange2_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("midrange2_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("midrange2_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("midrange2_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("midrange2_filters_" + filterNum + "_gain");
        }
    } else if (gPlatform == "Anvil") {
        paramStr += paramPairFromTextWithId("subw_channelGainIndB");
        paramStr += paramPairFromTextWithId("subw_polarity");
        paramStr += paramPairFromTextWithId("subw_delay");

        //paramStr += paramPairFromCheckboxWithId("subw_freqSelLimiter_on");
        //paramStr += paramPairFromTextWithId("subw_freqSelLimiter_attackInus");
        //paramStr += paramPairFromTextWithId("subw_freqSelLimiter_releaseInms");
        //for (var filterNum in preset.subw.freqSelLimiter.filters) {
            //paramStr += paramPairFromTextWithId("subw_freqSelLimiter_filters_" + filterNum + "_freq");
            //paramStr += paramPairFromTextWithId("subw_freqSelLimiter_filters_" + filterNum + "_Q");
            //paramStr += paramPairFromTextWithId("subw_freqSelLimiter_filters_" + filterNum + "_gain");
        //}

        for (var filterNum in preset.subw.filters) {
            paramStr += paramPairFromTextWithId("subw_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("subw_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("subw_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("subw_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("subw_filters_" + filterNum + "_gain");
        }

        for (var i in preset.subw.dynamicBandpass) {
            paramStr += paramPairFromCheckboxWithId("subw_dynBandpass_" + i + "_on");
            paramStr += paramPairFromTextWithId("subw_dynBandpass_" + i + "_freq");
            paramStr += paramPairFromTextWithId("subw_dynBandpass_" + i + "_Q");
            paramStr += paramPairFromTextWithId("subw_dynBandpass_" + i + "_maxLevel");
            paramStr += paramPairFromTextWithId("subw_dynBandpass_" + i + "_attackInus");
            paramStr += paramPairFromTextWithId("subw_dynBandpass_" + i + "_releaseInms");
        }

        paramStr += paramPairFromTextWithId("portmask_coef");
        paramStr += paramPairFromTextWithId("portmask_threshold");

        paramStr += paramPairFromCheckboxWithId("subw_limiter_on");
        paramStr += paramPairFromTextWithId("subw_limiter_threshold");
        paramStr += paramPairFromTextWithId("subw_limiter_attackInus");
        paramStr += paramPairFromTextWithId("subw_limiter_releaseInms");

        paramStr += paramPairFromCheckboxWithId("softclip_on");
        paramStr += paramPairFromTextWithId("softclip_threshold");
        paramStr += paramPairFromTextWithId("softclip_ceiling");
        paramStr += paramPairFromTextWithId("clip_cut_amount");
        paramStr += paramPairFromTextWithId("clip_cut_acceleration");
        paramStr += paramPairFromTextWithId("clip_cut_rate");
        paramStr += paramPairFromTextWithId("clip_release_rate");
        paramStr += paramPairFromTextWithId("clip_release_delay");

        paramStr += paramPairFromCheckboxWithId("excursion_on");
        paramStr += paramPairFromTextWithId("excursion_target");
        paramStr += paramPairFromTextWithId("excursion_filtergain");
        paramStr += paramPairFromTextWithId("excursion_rmstime");
        paramStr += paramPairFromCheckboxWithId("excursion_limiteron");
        paramStr += paramPairFromTextWithId("excursion_limiterattack");
        paramStr += paramPairFromTextWithId("excursion_limiterrelease");
        paramStr += paramPairFromTextWithId("excursion_mincutoff");
        paramStr += paramPairFromTextWithId("excursion_maxcutoff");
        paramStr += paramPairFromTextWithId("excursion_q_0");
        paramStr += paramPairFromTextWithId("excursion_q_1");
        paramStr += paramPairFromTextWithId("excursion_cutoffattack");
        paramStr += paramPairFromTextWithId("excursion_cutoffrelease");
    } else if (gPlatform == "ZP120") {
        for (var filterNum in preset.satellite.filters) {
            paramStr += paramPairFromTextWithId("satellite_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("satellite_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("satellite_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("satellite_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("satellite_filters_" + filterNum + "_gain");
        }

        for (var filterNum in preset.subw.filters) {
            paramStr += paramPairFromTextWithId("subw_filters_" + filterNum + "_type");
            paramStr += paramPairFromTextWithId("subw_filters_" + filterNum + "_freq");
            paramStr += paramPairFromTextWithId("subw_filters_" + filterNum + "_Q");
            paramStr += paramPairFromTextWithId("subw_filters_" + filterNum + "_phase");
            paramStr += paramPairFromTextWithId("subw_filters_" + filterNum + "_gain");
        }
    } else if (gPlatform == "Limelight") {
        paramStr += paramPairFromTextWithId("overallGainIndB");
    }

    // remove trailing &
    paramStr = paramStr.replace(/&$/, "");

    postDataToZP("audio_eq", paramStr, function () {
        displayMessage("The ZP is now using new EQ settings.");
    });
    // TODO add notification if fails here?

    return true;
}


//------------------------------------------------------------------------------

// Send ALL of the preset data, including the current_preset_num to the ZP
// Note:  just sends gMainData as it is.  The data is manually pulled out of
// the form in saveChanges().

function sendPresetDataToZP (custom_success_message) {

    // Why does this not work???
    var jsonString = "presetData=" + JSON.stringify(gMainData);
    
    // var jsonString = "presetData=ABC";  // A hack!!! This means no saving of presets!
    
    postDataToZP("save_eq_presets", 
                 jsonString, 
                 function () {
                    // if successful
        
                    // Also send the current EQ data
                    if (submitEQDataToZP()) {
                        if (custom_success_message)
                            displayMessage(custom_success_message);
                        else
                            displayMessage("Saved all preset data to the ZP, and updated EQ.");
                    } else {
                        displayMessage("Saved preset data, but error updating EQ data.");
                    }
        
                    // Now update to the latest data from the ZP.
                    // getPresetDataFromZP();
                    buildTabs();
                    makePresetActive(gMainData.current_preset_num, false);
                 }
                );
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
}

//------------------------------------------------------------------------------

function showImportForm () {
    document.getElementById("import_form").style.display = "block";
}

//------------------------------------------------------------------------------

function sendImportForm () {
    try {
        // Make sure the import text is valid JSON
        var presetDataImportText = document.getElementById("import_form_presetData").value;
        var presetDataImport = eval("(" + presetDataImportText + ")");
        
        // And that it has at least a few of the necessary pieces of info
        var presetsImport = presetDataImport.presets;
        var currentPresetImport = presetDataImport.current_preset_num;

        // These trivial lines will throw an exception if the variables
        // have null values.
        presetsImport[0].presetName;
        presetsImport[currentPresetImport].presetName;
        
        // If we get this far, then assume data is good.
        // Sumbit the data async'ly.
        postDataToZP("save_eq_presets", "presetData="+presetDataImportText, function () {
            // if successful, update to the latest data from the ZP.
            getPresetDataFromZP();
        });
    }
    catch (e) {
        displayMessage("Error: Data is not valid. (" + e.message + ")");
    }
    
    // close the import form
    toggleImportExport();
}

