// CONSTANTS
var logger = typeof(window)!=='undefined' ? window.console : console;
if(typeof(node)=="undefined") var node = false;
var extraClasses = "";
var locPrefix = "";
var ren_G = [67, 62, 57, 53, 48, 43, 41, 40, 38, 36, 35, 33, 31];
var ren_G_abzug = [67, 62, 57, 53, 48, 41, 40, 38, 38, 36, 35, 33, 31];
var ren_A = [69, 64, 59, 55, 50, 45, 43, 42, 40, 38, 37, 35, 33];
var bar_d = [65, 62, 57, 53, 50, 45, 43, 41, 40, 38, 36, 34, 33];
var bar_d_415 = [64, 61, 56, 52, 49, 44, 42, 40, 39, 37, 35, 33, 31];
var ren_guit = [67, 62, 58, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var tunings = [["Renaissance (G)", ren_G],
  ["Renaissance abzug (G)", ren_G_abzug],
  ["Renaissance guitar", ren_guit],
  ["Baroque D minor", bar_d]];
var ticksPerCrotchet = 128;
var rhythmFlags = "ZYTSEQHWBF";
var buttonRhythmFlags = "ZYTSEQHF";
var tsbasics = [[1], [2], [3], [4], [5], [6], [8], [12],
  ["C"], ["C/", "Ç"], ["D", "C", "reverse"], ["D/", "d"],
  ["O", "0"]];
var tabletters = "abcdefghijklmnopqrstuvwxyz";
var allOrnaments;
var colours = ["redReading", "blueReading", "greenReading"]; //==> collation editor?

// Variable declarations 
var nextpage = false;
var prevpage = false;
var rule = false;
var fill = true;
var test = true;//false;
var curx = 0;
var cury = 0;
var leftMargin = 24;
//var topMargin = 20;
//var topMargin = 40;
var topMargin = 60;
var ld = 15; // staff-line-distance;
var lines = 6;
var editable = true;
var mainCourseCount = 6;
var TabCodeDocument = false;
var Extract;
var curBeams = 0;
var curBeamGroup = [];
var curTripletGroup = false;
var curStaves;
var curHistory = false;
var curDur = ticksPerCrotchet;
var curTime = 0;
var curFont;
var curTabType;
var curFontName;
var curApparatus = false; //=>collation editor?
var curTuning = ren_G;
var tempoFactor = 1.0;  // 256 ticks per second
var breaks = "stop"; // options are: TRUE (observe breaks), FALSE (ignore them), "stop" (up
                     // to first break)
var breakTypes = {Piece: "{/}", System: "{^}", Page: "{>}"};
var breakOptions = ["Piece"];

function tabxmlp(comment){
  return /^{<\/?(app|rdg)[^>]*>/i.test(comment[0]);
}

function rulesp(comment){
  // This tells me that it's intended as a rule, but not that it's
  // legal
  return /{<rules>[\s\S]*<\/rules>}/.test(comment[0]);
}

function pagep(code){
  // Did TC devise a numbered variant that breaks this?
	return(/{\>}/.test(code));
}
function systemp(code) {
	return(/{\^}/.test(code));
}

function FlagDur(rhythm) {
  // Return a duration in multiples of crotchets given a flag
  // FIXME: add scaling factor?
	var pos = rhythmFlags.indexOf(rhythm);
	if (pos>7){
		pos--;
	}
	return Math.pow(2, (pos - 5));
}

function letterPitch(fretChar){
	var pos = tabletters.indexOf(fretChar);
	if(pos>20){
		pos -= 2;
	}else if(pos>8){
		pos--;
	}
	return pos;
}
function tabChar(tabLetter){
  if(curTabType == "Italian"){
    return letterPitch(tabLetter);
  } else {
    return tabLetter;
  }
}
function verticalAdjust(){
  // This is the amount by which staff lines are lower than cury
  return ld * 4/3;
}

function advance (){
  return (4 + lines) * ld;
}

function staffHeight() {
  return ld*mainCourseCount;
}
function systemStep(){
  return ld*(mainCourseCount+2);
}

function yOffset(course){
  if(curTabType == "Italian"){
    // return topMargin+(ld*(6-course)) - 9.5; // ??!
    return (ld*(6-course+0.75));
  } else {
    // return topMargin+(ld*course);
    return ld*(course+1.35);
//    return cury+(ld*course);
  }
}
function flagy(){
  // if(curTabType == "Italian"){
    return cury - (ld * 2/5);
  // }
  // return cury;
}

////////////////////////////////
// 
// Drawing utility functions
//

function drawRepeat(svg, x){
  for(var i=0; i<3; i++){
    svgCircle(svg, x+(ld/7), cury+(ld*(i+(17/6))), ld/7, "repeatdot", false);
  }
  curx+=ld*2/5;
}

function drawDashedBarline(svg, x){
  for(var i=0; i<lines; i++){
    svgCircle(svg, x+ld/10, cury+(ld*(5/6*i))+(7/4*ld), ld/10, "barlinedots", false);
  }
}

function drawBarline(svg, x, dashed, dble){
  if(dashed){
    drawDashedBarline(svg, x);
    curx -= ld/5;
  } else {
    svgLine(svg, x, cury+(ld*4/3), x, cury+(ld*4/3)+(ld*(lines-1)), "barlineline", false);
    curx -= ld/2; // why?!
  }
  if(dble) {
    drawBarline(svg, x+(ld/3), dashed, false);
    curx += ld/2;
  }
  else {
    curx += ld/3;
  }
}
/*
}
  curx += ld;
}
*/

function drawTSC(svg, TS, i, j){
  var alone = j==0 && TS.components[i].length==1;
  var el = svgGroup(svg, "tscomponent i"+i+"j"+j, false);
  var symbol = TS.components[i][j];
  var slashed = /\//.test(symbol);
  var compClass = alone ? "lone" : "stacked";
  var ystep = ld * (alone ? 4 : (j ? 5 : 2.75));
  $(el).data("word", TS);
  $(el).data("i", i);
  $(el).data("j", j);
  switch(symbol.charAt(0)){
    case "C":
      svgText(el, curx, cury+ystep, compClass+" tsc", false, false, (slashed ? "Ç" : "C"));
      slashed = false;
      break;
    case "D":
      svgText(el, curx, cury+ystep, compClass+" tsc", false, false, (slashed ? "d" : "D"));
      slashed = false;
      break;
    case "O":
      svgText(el, curx, cury+ystep, compClass+" tsc", false, false, "0");
      break;
    default:
      // Not a symbol sig (most likely a number)
      // FIXME: If it's not a number, then this won't work
      svgText(el, curx+(ld/4), cury+ystep, compClass+" tsc tstext", false, false,
        (/[\/\.]/.test(symbol) ? symbol.substring(0,symbol.search(/[\/\.]/)) : symbol));
  }
  if(slashed){
    // If were here, it has a slash that we don't have a glyph for
    svgLine(el, curx+(el.getBBox().width/2), cury+2*ld,
        curx+(el.getBBox().width/2), cury+6*ld,
        "tsslash", false);    
  }
  if (/\./.test(symbol)){
    svgCircle(el, curx+(el.getBBox().width/2), cury+ystep, ld/6, "tsdot", false);
  }
  return el;
}

function drawTSComponent(svg, symbol, minStep, i, j, TS){
  // FIXME: obsolete if I parse TS properly
  var compClass = minStep===0 ? "lone" : "stacked";
  var ystep = minStep === 0 ? ld * 4 :( minStep ? ld * 5 : ld * 3);// FIXME: ??
  var el = svgGroup(svg, "tscomponent i"+i+"j"+j, false);;
  var skipSlash = false;
  $(el).data("word", TS);
  $(el).data("i", i);
  $(el).data("j", j);
  switch(symbol.charAt(0)){
    case "C":
      if(/\//.test(symbol)) {
        svgText(el, curx, cury + ystep, compClass+" tsc", false, false, "Ç");
        skipSlash = true;
      } else {
        svgText(el, curx, cury + ystep, compClass+" tsc", false, false, "C");
      }
      break;
    case "D":
      // draw at origin first
      // el.setAttributeNS(null, "transform", "scale(-1 1) translate("+(-curx-ld*3)
      //              +", "+(cury+ystep)+")");
      // svgText(el, 0, 0, compClass+" tsd", false, false, "C");
      if(/\//.test(symbol)){
        svgText(el, curx, cury+ystep, compClass+" tsc dslash", false, false, "d");
        skipSlash= true;
      } else {
        svgText(el, curx, cury+ystep, compClass+" tsc tsc-D", false, false, "D");
      }
      // then flip
//      el.setAttributeNS(null, "transform", "scale(-1, 1)");
      // then move into pos (FIXME: won't start centred about origin, so a bit crooked)
      // el.setAttributeNS(null, "transform", "translate("+(curx+el.getBBox().width)
      //                   +", "+(cury+ystep)+")");
      break;
    case "O":
      svgText(el, curx, cury + ystep, compClass+" tsc tso", false, false, "0");
      break;
    default:
      // Not C, D, or O (probably means is a number)
      // Print verbatim, but for multichar symbol need to stop BEFORE any . or /
      var tmpsymbol = symbol;
      if(symbol.search(/[\/\.]/)!=-1) {
        tmpsymbol = symbol.substring(0,symbol.search(/[\/\.]/));
      }
      svgText(el, curx-ld, cury+ystep, compClass+" tsc tstext", 
        false, false, tmpsymbol);
  }  
  // Slashes (FIXME: a bit crude, and lacking +)
  if(!skipSlash){
    if(/\//.test(symbol)){
      // FIXME: fix this
      svgLine(el, curx+(el.getBBox().width/2), cury+2*ld,
        curx+(el.getBBox().width/2), cury+6*ld,
        "tsslash", false);
    } else if(/\./.test(symbol)){
      svgCircle(el, curx+(el.getBBox().width/2), cury+ystep, ld/6, "tsdot", false);
    }
  }
  if(minStep || minStep === 0) {
    curx += Math.max(el.getBBox().width, minStep);
  }
  return el.getBBox().width; // el.width;
}

function drawSlashes(svgEl, n) {
  var starty = cury+systemStep()-(ld*3/4);
  for(var i=0; i<n; i++){
    svgLine(svgEl, curx, starty, curx+ld, starty-(ld/2), "bassslash", false);
    starty += 3;
  }
}

function drawItalianSlashes(svgEl, n) {
  var starty = cury+(ld*4/5);
  for(var i=0; i<n; i++){
    svgLine(svgEl, curx, starty, curx+ld, starty-(ld/2), "bassslash", false);
    starty -= 3;
  }
}

function drawInsertBox(x, y, i, svgEl){
//  var el = svgRoundedRect(svgEl, x-ld/2, y, 1/3*ld, 7*ld, ld/4, ld/4, "missingChord", "I-"+i);
  var el;
  var voff;
  for(var j=0; j<lines+2; j++){
    if(j==lines+1){
      // FIXME: No bass courses please, we can't do 'em yet
      continue;
    }
    voff = j ? ld * (j-1/4) : -ld;
    // thinned this to avoid blocking barlines
    el = svgRoundedRect(svgEl, x-(3/4*ld), y+voff, 8/16*ld, j ? ld : 7/4* ld, ld/4, ld/4, "missingChord", "n"+i+"p"+j);
    $(el).data("follows", i);
    $(el).data("precedes", i+1);
    $(el).data("pos", j);
  }
}

function drawMetricalInsertBoxes(i, word, svgEl){
  var ela = svgRoundedRect(svgEl, curx-ld, cury+3/2*ld, ld*2, ld, 
    ld/4, ld/4, "missingTSC above", false);
  var elb = svgRoundedRect(svgEl, curx-ld, cury+11/2*ld, ld*2, ld,  
    ld/4, ld/4, "missingTSC below", false);
  $(ela).data("word", word);
  $(elb).data("word", word);
  $(ela).data("i", i);
  $(elb).data("i", i);
}
function drawMetricalInsertBox(i, type, word, svgEl){
  var el = svgRoundedRect(svgEl, curx-ld/2, cury+2*ld, ld/2, 4*ld,
    ld/4, ld/4, "missingTSC "+type, false);
  $(el).data("word", word);
  $(el).data("i", i);
}
function History(){
  this.back = [];
  this.forward = [];
  this.undo = function() {
    var operation = this.back.pop();
    if(operation){
      operation.undo();
      this.forward.push(operation);
      refresh();
    }
  };
  this.redo = function() {
    var operation = this.forward.pop();
    if(operation){
      operation.redo();
      this.back.push(operation);
      refresh();
    }
  };
  this.revert = function(){
    while(this.back.length){
      this.undo();
    }
  };
  this.add = function(operation){
    this.back.push(operation);
    this.forward = [];
    refresh();
  };
  this.toJSON = function(){
    return {back: this.back, forward: this.forward};
  };
}

function Modify(index, from, to, textField, objType){
  this.index = index;
  this.to = to + ""; // coerce numbers to strings
  this.source = textField;
  this.from = from + "";
  this.type = objType;
  if(!index && index!=0) alert("aaah!");
  this.source.value = this.source.value.substring(0, index)
      +this.to+this.source.value.substring(index+this.from.length);
  this.undo = function(){
    this.source.value = this.source.value.substring(0, index)
      +this.from+this.source.value.substring(index+this.to.length);
  };
  this.redo = function(){
    this.source.value = this.source.value.substring(0, index)
      +this.to+this.source.value.substring(index+this.from.length);
  };
  this.toJSON = function(){
    return {dtype: "modify", index:this.index, to:this.to, from:this.from, obj:this.type};
  };
}

function compoundModify(changes, textField, type){
  this.changes = changes;
  this.type = type;
  this.source = textField;
  // Make changes from last to first to avoid losing track of positions
  this.changes.sort(function(a,b){return b[0]-a[0];});
  var mod;
//  for(var i=this.changes.length-1; i>=0; i--){
  for(var i=0; i<this.changes.length; i++){
    mod = changes[i];
    this.source.value = this.source.value.substring(0, mod[0])
                          + mod[2] + this.source.value.substring(mod[0]+mod[1].length);
  }
  this.undo = function(){
    var mod;
//     for(var i in this.changes){
     for(var i=this.changes.length-1; i>=0; i--){
      mod = this.changes[i];
      this.source.value = this.source.value.substring(0, mod[0])
                            + mod[1] + this.source.value.substring(mod[0]+mod[2].length);
    }
  };
  this.redo = function(){
    var mod;
//     for(var i=this.changes.length-1; i>=0; i--){
    for(var i in this.changes){
      mod = changes[i];
      this.source.value = this.source.value.substring(0, mod[0])
                            + mod[2]
                            + this.source.value.substring(mod[0]+mod[1].length);
    }
  };
  this.toJSON = function(){
    return {dtype: "compound", changes: this.changes, obj: this.type};
  };
}

function replaceContextFlag(params, to){
  this.params = params;
  this.from = this.params.contextDur;
  this.to = to;
  this.params.contextDur = to;
  this.undo = function(){
    this.params.contextDur = this.from;
  };
  this.redo = function(){
    this.params.contextDur = this.to;
  };
  this.toJSON = function(){
    return {dtype: "cflag", from: this.from, to: this.to};
  };
}

function replaceContextTuning(params, to){
  this.params = params;
  this.from = this.params.contextTuning;
  this.to = to;
  this.params.contextTuning = to;
  this.undo = function(){
    this.params.contextTuning = this.from;
  };
  this.redo = function(){
    this.params.contextTuning = this.to;
  };
  this.toJSON = function(){
    return {dtype: "ctuning", from: this.from, to: this.to};
  };
}

function importHistory(jstring){
  var his = new History();
  try {
    var jobj = JSON.parse(jstring);
    if(jobj){
      his.back = jobj.back.map(importDiff);
      his.forward = jobj.forward.map(importDiff);
    }
  } catch (e){
    // There is a problem here (to do with escaped braces, I think)
  }
  return his;
}

function importDiff(jobj){
  if(jobj){//FIXME: add identity diff
    var par = curParams;
    var textField = document.getElementById('code');
    switch(jobj.dtype){
      case "modify":
        return new Modify(jobj.index, jobj.from, jobj.to, textField, jobj.obj);
      case "compound":
        return new compoundModify(jobj.changes, textField, jobj.obj);
      case "cflag":
        var diff = new replaceContextFlag(par, jobj.to);
        diff.from = jobj.from;
        return jobj;
    }
  }
}
function DOMEl(tag, cname, id){
  var el = document.createElement(tag);
  if(cname) el.className = cname;
  if(id) el.id = id;
  return el;
}
function DOMTextEl(tag, cname, id, content){
  var el = DOMEl(tag, cname, id);
  if (content) {
    if(typeof(content)=="string"){
      el.appendChild(document.createTextNode(content));
    } else {
      el.appendChild(content);
    }
  }
  return el;  
}
function DOMTable(cname, id){
  return DOMEl('table', cname, id);  
}
function DOMRow(cname, id){
  return DOMEl('tr', cname, id);
}
function DOMCell(cname, id, content){
  return DOMTextEl('td', cname, id, content);
}
function DOMDiv(cname, id, content){
  return DOMTextEl('div', cname, id, content);  
}
function DOMSpan(cname, id, content){
  return DOMTextEl('span', cname, id, content);  
}
function DOMTextInput(cname, id, value, label, placeholder){
  var el = DOMEl("input", cname, id);
  if(value) el.value = value;
  if(placeholder) el.placeholder = placeholder;
  el.type = "text";
  el.setAttribute("autocapitalize", "none");
  if(label){
    var el2 = DOMTextEl('label', false, false, label);
    el2.appendChild(el);
    return el2;
  }
  return el;
}
function DOMTextArea(cname, id){
  var el = DOMEl("textarea", cname, id);
  return el;
}
function DOMButton(cname, id, label, callback) {
  var el = DOMEl('button', cname, id);
  el.value = label;
  el.name = label;
  el.innerHTML = label;
  el.onclick = callback;
//  $(el).click = callback;
  return el;
}
function DOMRadio(cname, name, id, value, caption, checked){
  var el = DOMEl('input', cname, id);
  el.name = name;
  el.type = "radio";
  el.value = value;
  el.innerHTML = caption;
  el.checked = checked;
  return el;
}
function DOMAnchor(cname, id, content, href){
  var el = DOMTextEl('a', cname, id, content);
  if(href) el.href = href;
  return el;
}
function DOMPasswordInput(cname, id, value, label, placeholder){
  var el = DOMEl("input", cname, id);
  if(value) el.value = value;
  if(placeholder) el.placeholder = placeholder;
  el.type = "password";
  el.setAttribute("autocapitalize","none");
  if(label){
    var el2 = DOMTextEl('label', false, false, label);
    el2.appendChild(el);
    return el2;
  }
  return el;
}
function DOMSelect(name, cname, id, multiple, options){
  var el = DOMEl('select', cname, id);
  el.name = name;
  el.multiple = multiple;
  for(var i=0; i<options.length; i++){
    el.appendChild(options[i]);
  }
  return el;
}
function DOMOption(value, label, text, selected){
  var el = DOMTextEl('option', false, false, text);
  if(value) el.value = value;
  if(label) el.label = label;
  if(selected) el.selected = true;
  return el;
}
function DOMImage(cname, id, src){
  var img = document.createElement('img');
  if(src) img.src = src;
  if(cname) img.className = cname;
  if(id) img.id = id;
  return img;
}
///////////////////

var tooltip = false;
function Tooltip(info){
  if(!tooltip){
    tooltip = DOMDiv('tooltip', 'tooltip', info);
    document.body.appendChild(tooltip);
  } else {//if(tooltip.innerHTML!=info){
    $(tooltip).empty();
    if(typeof(info) == "string"){
      tooltip.appendChild(document.createTextNode(info));
    } else if (info){
      tooltip.appendChild(info);
    }
  }
  return tooltip;
}
function removeTooltip(){
  if(tooltip){
    $("#tooltip").remove();
    $(".highlight").removeClass("highlight");
    tooltip = false;
  }
}
//////////////////////////////////////////
//
// SVG
//

var SVGNS = "http://www.w3.org/2000/svg";

function svg (w,h){
  var svg=document.createElementNS(SVGNS,"svg");
  if(w) svg.width=w;
  if(h) svg.height=h;
  return svg;
}

function clearSVG(svgEl){
  while(svgEl.firstChild){
    svgEl.removeChild(svgEl.firstChild);
  }
}
function svgCSS(element, css){
  var link = document.createElementNS(SVGNS, "link");
  link.setAttributeNS(null, "href", css);
  link.setAttributeNS(null, "type", "text/css");
  link.setAttributeNS(null, "rel", "stylesheet");
  element.appendChild(link);
  return element;
}
function svgText(svgEl, x, y, cname, id, style, content){
  var el = document.createElementNS(SVGNS, "text");
  if(cname) el.setAttributeNS(null, "class", cname);
  if(id) el.id = id;
  if(x) el.setAttributeNS(null, "x", x);
  if(y) el.setAttributeNS(null, "y", y);
  if(style) el.setAttributeNS(null, "style", style);
  if(content == 0 || content) el.appendChild(document.createTextNode(content));
  if(svgEl) svgEl.appendChild(el);
  return el;
}
function svgSpan(svgEl, cname, id, content){
  var el = document.createElementNS(SVGNS, "tspan");
  if(content) var textNode = document.createTextNode(content);
  if(cname) el.setAttributeNS(null, "class", cname);
  if(id) el.id = id;
  if(content) el.appendChild(textNode);
  if(svgEl)  svgEl.appendChild(el);
  return el;
}
function svgGroup(svgEl, cname, id){
  var el = document.createElementNS(SVGNS, "g");
  if(cname) el.setAttributeNS(null, "class", cname);
  if(id) el.id = id;
  if(svgEl) svgEl.appendChild(el);
  return el;
}
function svgLine(svgEl, x1, y1, x2, y2, cname, id){
  var el = document.createElementNS(SVGNS, "line");
  if(cname) el.setAttributeNS(null, "class", cname);
  if(id) el.setAttributeNS(null, "id", id);
  el.setAttributeNS(null, "x1", x1);
  el.setAttributeNS(null, "y1", y1);
  el.setAttributeNS(null, "x2", x2);
  el.setAttributeNS(null, "y2", y2);
  if(svgEl) svgEl.appendChild(el);
  return el;
}
function svgRect(svgEl, x, y, width, height, cname, id){
  var el = document.createElementNS(SVGNS, "rect");
  if(cname) el.setAttributeNS(null, "class", cname);
  if(id) el.setAttributeNS(null, "id", id);
  if(x) el.setAttributeNS(null, "x", x);
  if(y) el.setAttributeNS(null, "y", y);
  if(width) el.setAttributeNS(null, "width", width);
  if(height) el.setAttributeNS(null, "height", height);
  if(svgEl) svgEl.appendChild(el);
  return el;
}
function svgRoundedRect(svgEl, x, y, width, height, rx, ry,cname, id){
  var el = document.createElementNS(SVGNS, "rect");
  if(cname) el.setAttributeNS(null, "class", cname);
  if(id) el.setAttributeNS(null, "id", id);
  if(x) el.setAttributeNS(null, "x", x);
  if(y) el.setAttributeNS(null, "y", y);
  if(rx) el.setAttributeNS(null, "rx", rx);
  if(ry) el.setAttributeNS(null, "ry", ry);
  if(width) el.setAttributeNS(null, "width", width);
  if(height) el.setAttributeNS(null, "height", height);
  if(svgEl) svgEl.appendChild(el);
  return el;
}
function svgCircle(svgEl, x, y, r, cname, id){
  var el = document.createElementNS(SVGNS, "circle");
  if(cname) el.setAttributeNS(null, "class", cname);
  if(id) el.setAttributeNS(null, "id", id);
  if(x) el.setAttributeNS(null, "cx", x);
  if(y) el.setAttributeNS(null, "cy", y);
  if(r) el.setAttributeNS(null, "r", r);
  if(svgEl) svgEl.appendChild(el);
  return el;
}
function svgPolygon(svgEl, points, cname, id){
  var el = document.createElementNS(SVGNS, "polygon");
  if(cname) el.setAttributeNS(null, "class", cname);
  if(id) el.setAttributeNS(null, "id", id);
  // FIXME: ugly, but is neater code, and spec-compatible
  el.setAttributeNS(null, "points", points.join(" "));
  if(svgEl) svgEl.appendChild(el);
  return el;
}
function svgPath(svgEl, commands, cname, id){
  var el = document.createElementNS(SVGNS, "path");
  if(cname) el.setAttributeNS(null, "class", cname);
  if(id) el.setAttributeNS(null, "id", id);
  el.setAttributeNS(null, "d", commands.join(" "));
  if(svgEl) svgEl.appendChild(el);
  return el;
}
function svgArc(x1, y1, x2, y2, radius) {
  return "M "+x1+" "+y1+" A "+radius+" "+radius+", 0, 1, 0, "+x2+" "+y2;
}
function svgPolyPath(points, close) {
  points = points.reverse();
  var firstPoints = points.pop()+" "+points.pop()+" ";
  var commands = ["M "+firstPoints];
  var start = typeof(close) != undefined && close ? "L "+firstPoints : false;
  while(points.length){
    commands.push("L "+points.pop()+" "+points.pop()+" ");
  }
  if(start) commands.push(start);
  return commands;
}
function svgImage(svgEl, href, x, y, height, width){
  var el = document.createElementNS(SVGNS, "image");
  if(href) el.setAttributeNS("http://www.w3.org/1999/xlink", "href", href);
  if(x) el.setAttributeNS(null, "x", x);
  if(y) el.setAttributeNS(null, "y", y);
  if(height) el.setAttributeNS(null, "height", height);
  if(width) el.setAttributeNS(null, "width", width);
  if(svgEl) svgEl.appendChild(el);
  return el;
}
function firstParse(TC){
  var thing = {};
  var comments = [];
  var words = [];
  var word = false;
  var commentLevel = 0;
  var wordBegan = 0;
  var nextChar;
  for(var i=0; i<TC.length; i++){
    nextChar = TC.charAt(i);
    if(commentLevel==0 || (commentLevel == 1 && nextChar=="}")){
      switch(nextChar){
        case " ":
        case "\n":
        case "\r":
        case "\t":
          if(word){
            words.push([word, wordBegan, i]);
          }
          wordBegan = false;
          word = false;
          break;
        case "{":
          if(word){
            words.push([word, wordBegan, i]);
          }
          wordBegan = i;
          word = nextChar;
          commentLevel++;
          break;
        case "}":
          commentLevel--;
          word += nextChar;
          words.push([word, wordBegan, (i+1)]);
          comments.push(words.length-1);
          word=false;
          wordBegan=false;
          commentLevel=0;
          break;
        default:
          if(!word){
            wordBegan=i;
            word="";
          }
          word += nextChar;
          break;
      }
    } else {
      word += nextChar;
      if(nextChar=="{"){
        commentLevel++;
      } else if (nextChar=="}"){
        commentLevel--;
      }
    }
  }
  if(word){
    words.push([word, wordBegan, TC.lengh]);
  }
  thing.words = words;
  thing.comments = comments;
  return thing;
}

function doubleParse(TC){
  // This is less a parsing process than a two-step tokenisation --
  // tokens are dependent on parenthetical comments, so we need to
  // find those first. Then we can find comments with specific
  // meanings, such as pages and system breaks.
  // firstParse provides a list of tokens and a list of indices
  // pointing to which of those tokens are comments.
  var struct = firstParse(TC); 
  struct.pages = [];
  struct.systems = [];
  var checking;
  for(var i=0; i<struct.comments.length;i++){
    if(pagep(struct.words[struct.comments[i]][0])) {
      struct.pages.push(struct.comments[i]);
    } else if (systemp(struct.words[struct.comments[i]][0])) {
      struct.systems.push(struct.comments[i]);
    }
  }
  return struct;
}

function Tablature(TC, SVG, parameters){
  this.code = TC;
  this.SVG = SVG;
  this.parameters = parameters;
  this.noteEvents = [];
  this.starts = 0;
  this.finishes = TC.length;
  this.rules = [];
  this.TabWords = [];
  this.commentOffsets = [];
  this.pageOffsets = [];
  this.systemOffsets = [];
  this.tokens = [];
	this.syscounts = new Array();
	this.totalsys = 1;
	this.maxwidths = new Array();
	this.maxwidth = 0;
  this.selections = [];
	this.pixHeight = 0;
	this.pixWidth = 0;
  this.finalFlag = false;
  this.colours = [];
  this.removes = [];
  this.duration = false;
  rule = false;
  if(!parameters) console.log("No parameters", TC);
  TabCodeDocument = this;
  // FIXME: Should this really be here?
  curBeamGroup = [];
  // FIXME: belongs this here?
  // svgCSS(this.SVG, "webeditor.css");
  if(this.SVG) svgCSS(this.SVG, "render.css");
  this.removeInvisibles = function(){
    if(this.removes.length){
      var mods = [];
      var start, end, from, to;
      for(var i=0; i<this.removes.length; i++){
        start = this.removes[i].starts;
        end = this.removes[i].starts+2+this.removes[i].TC.length;
        from = this.code.substring(start, end);
        mods.push([start, from, ""]);
      }
      this.parameters.history.add(new compoundModify(mods, document.getElementById('code'), "initialCleanup"));
    }
  };
  this.finishParse = function(){
    // Turn tokens into parsed tabwords
    var TabWord = false;
    for(var i=0; i<this.tokens.length; i++){
      // We treat comments differently, but this code is inefficient
      // in a way that's only a problem if there are lots of comments
      if(this.commentOffsets.indexOf(i) == -1){
		    TabWord = parseTabWord(this.tokens[i][0],this.tokens[i][1],this.tokens[i][2]);
			  if(TabWord){
		      if(this.starts == false) {
				    this.starts = TabWord.starts;
				  }
          if(curTripletGroup && TabWord.tType==="Chord"){
            curTripletGroup.addMember(TabWord);
          }
				  this.finishes = TabWord.finishes;
          if(this.TabWords.length > 0) {
            TabWord.prev = this.TabWords[this.TabWords.length-1];
            if(TabWord.prev.tType=="Chord"){
              TabWord.prev.nextStart = TabWord.starts;
            }
            TabWord.prev.next = TabWord;
          }
				  this.TabWords.push(TabWord);
          if(typeof(TabWord.flag != 'undefined') && TabWord.flag){
            this.finalFlag = TabWord.flag; // Needed for subsequent systems in db
          }
			  }
      } else if (this.pageOffsets.indexOf(i) != -1) {
		    this.TabWords.push(new PageBreak(this.tokens[i]));
		  } else if (this.systemOffsets.indexOf(i) != -1) {
		    this.TabWords.push(new SystemBreak(this.tokens[i]));
		  } else if (rulesp(this.tokens[i])){
        rule = new Ruleset(this.tokens[i], rule);
        if(i===0){
          this.parameters.update(rule);
        }
        this.rules.push(rule);
        this.TabWords.push(rule);
      } else if(tabxmlp(this.tokens[i])){
        if(!curApparatus){
          curApparatus = new Apparatus();
        }
        this.TabWords.push(new StructuredComment(this.tokens[i]));
      } else {
        // Yes, it really is just a plain comment
		    this.TabWords.push(new Comment(this.tokens[i]));
		  }
      if(curApparatus){
        curApparatus.add(this.TabWords[this.TabWords.length-1]);
      }
    }
  };
  this.fixWhitespaceNoninteractive = function(codeObj){
    var loc = this.code.search(/\s+$/);
    if(loc===-1){
      this.code += " ";
      if(codeObj) codeObj.value += " ";
    } else if(loc<this.code.length-1){
      this.code = this.code.substring(0, loc+1);
      if(codeObj) codeObj.value = this.code;
    }
  };
  this.initialParse = function(){
    // First, find tokens and comments
    // 
    // STRUCTURE is an object with tokenised words, and indexes for
	  // comments, systems and pages. All it needs is for the tokens to
	  // be parsed.
    var structure = doubleParse(TC);
    this.pageOffset = structure.pages;
    this.systemOffsets = structure.systems;
    this.commentOffsets = structure.comments;
    this.tokens = structure.words;
    this.systemOffsets.push(this.finishes);
  };
  this.fixWhitespaceNoninteractive(document ? document.getElementById('code') : false);
  this.initialParse();
  this.finishParse();
  this.firstNonComment = function(){
    for(var i=0; i<this.TabWords.length; i++){
      if(this.TabWords[i].fType !=="Ruleset"
         && this.TabWords[i].tType !=="Comment"){
        return this.TabWords[i];
      }
    }
    return false;
  };
  this.drawStaffLines = function (y){
    var vpos = cury + verticalAdjust();
    for(var linei=0; linei<lines; linei++){
      svgLine(curStaves, 0, vpos, fill ? this.SVG.style.width : curx, 
        vpos, "staffline", false);
      vpos+=ld;
    }
  };
  this.makeStaffDiv = function(){
    curStaves=svgGroup(this.SVG, "Staves", false, false);
  };
  this.addPlayButtons = function(){
    var parentEl = this.SVG.parentNode;
    if(!$(parentEl).hasClass("hasControls")) return;
    $(parentEl).find(".playback.control").remove();
    var playDiv = DOMDiv("playback control start", false, false);
    parentEl.appendChild(playDiv);
    $(playDiv).click(playOrStop);
    $(playDiv).data("doc", this);
    $(parentEl).mouseenter(function(){
                             $(this).find(".control").fadeIn();
                           });
    $(parentEl).mouseleave(function(){
                             $(this).find(".control").fadeOut();
                           });
  };
  this.getDuration = function(){
    if(this.duration) return this.duration;
    // FIXME: estimate only of duration
    var time = 0;
    var dur = 0;
    var curDur = FlagDur(this.parameters.contextDur)*ticksPerCrotchet;
    for(var i=0; i<this.TabWords.length; i++){
      dur = 0;
      if(this.TabWords[i].tType=="Chord") {
          dur = this.TabWords[i].duration();
          time += dur;
          this.duration = Math.max(time, this.duration);
      }
    }
    return this.duration;
  };
  this.draw = function(){
    if(!this.SVG) return;
    TabCodeDocument = this;
    $(this.SVG).empty();
    var offset = $(this.SVG).offset();
    var firstChord = true;
    cury = topMargin;
    curx = leftMargin;
    curTabType = this.parameters.tabType;
    curFontName = this.parameters.fontName;
    curTuning = this.parameters.contextTuning;
    curDur = FlagDur(this.parameters.contextDur)*ticksPerCrotchet;
    extraClasses = "";
    var time = 0;
    var dur;
    this.leftishHack = this.SVG.getBoundingClientRect().left;
    this.makeStaffDiv();
    if(editable) drawInsertBox(curx, cury, -1, this.SVG);
    if (!this.SVG.style.width) this.SVG.style.width = "10px";
    this.addPlayButtons();
    $(this.SVG).data("doc", this);
    for(var i=0; i<this.TabWords.length; i++){
      dur = 0;
      switch(this.TabWords[i].tType){
        case "SystemBreak":
        case "PageBreak":
          if(breaks == "stop"){
            this.drawStaffLines();
            return;
          } else if(breaks && !parseInt(breaks, 10)){
            this.drawStaffLines();
            cury += advance();
            curx = leftMargin;
            this.makeStaffDiv(this.SVG);
            this.SVG.height.baseVal.newValueSpecifiedUnits(5,cury+advance());
          }
          break;
        case "StructuredComment":
          this.TabWords[i].draw();
        case "Comment":
          // Do nothing (this may make sense--do we want footnotes?)
          // FIXME: Hackhackhack -- this should be parsed as a separate class
          if(this.TabWords[i].comment == "{/}"){
            curx += ld;
            var breakg = svgGroup(this.SVG, "pieceBreak", false);
            $(breakg).data("word", this.TabWords[i]);
            drawBarline(breakg, curx, true, true);
            curx += 2*ld;
          }
          continue;
          break;
        case "Ruleset":
          // Hackhackhack
          if(this.TabWords[i].fontFamily()) curFontName = this.TabWords[i].fontFamily();
          break;
        case "Chord":
          if(firstChord && editable){
            firstChord = false;
            if(!(this.TabWords[i].flag || this.TabWords[i].lbeams)){
              // First chord has no explicit rhythm, so the context
              // chord is significant
              this.parameters.drawContextDur(this.SVG);
            }
          }
          this.TabWords[i].startTime = time;
          for(var seli=0; seli<this.selections.length; seli++){
            if(this.selections[seli].appliesToTime(time)){
              this.TabWords[i].selections.push(this.selections[seli]);
              this.selections[seli].chords.push(this.TabWords[i]);
            }
          }
          dur = this.TabWords[i].duration();
        default:
          this.TabWords[i].draw();
          if(this.TabWords[i].tripletGroup && this.TabWords[i].tripletGroup.lastp(this.TabWords[i])){
            this.TabWords[i].tripletGroup.draw();
          }
          time += dur;
          this.duration = Math.max(time, this.duration);
      }
      if(editable) drawInsertBox(curx, cury, i, this.SVG);
      if(breaks && parseInt(breaks, 10) && curx>=breaks && i<(this.TabWords.length-1)){
        this.drawStaffLines();
        cury += advance();
        curx = leftMargin;
        this.makeStaffDiv(this.SVG);
        this.SVG.height.baseVal.newValueSpecifiedUnits(5,cury+advance());        
      }
      if(curx > this.SVG.getBBox().width) this.SVG.style.width = Math.ceil(curx+leftMargin+ld)+"px";
    }
    if(curx > this.SVG.getBBox().width) this.SVG.style.width = Math.ceil(curx+leftMargin+ld)+"px";
    if(fill){
      var l = $(".staffline");
      for(var k=0; k<l.length; k++){
        l[k].setAttributeNS(null, "x2", this.SVG.style.width);
      }
    }
    var of = fill;
    fill = false;
    this.drawStaffLines();
    fill = of;
    var words = TabCodeDocument.TabWords;
  };
  this.play = function(){
    if(!this.noteEvents.length) this.makeMidi();
    var track = new MidiTrack({events: this.noteEvents});
    var song = MidiWriter({tracks: [track]});
    song.save_small();
  };
	this.makeMidi = function() {
		this.noteEvents = new Array();
		curDur = this.parameters.defaultDur() * ticksPerCrotchet;
    var duration;
		for(var i=0; i<this.TabWords.length; i++){
			if(typeof(this.TabWords[i].duration) != "undefined") {
				duration = this.TabWords[i].duration();
				if(!duration) duration = 1;
				duration /= tempoFactor; //FIXME: Never do this in MIDI (GSHARP used to do this too :-/)
				this.loadChord(this.TabWords[i].pitches(), duration);
			}
		}
	};
  this.durationRatios = function(){
    this.rhythmRatios = new Array();
    curDur = this.parameters.devaultDur();
    var duration, nextDuration;
    for(var i=0; i<this.TabWords[i]; i++){
      if(typeof(this.TabWords[i].duration) != "undefined"){
        nextDuration = this.TabWords[i].duration();
        if(!nextDuration) nextDuration = 1;
        this.rhythmRatios.push(nextDuration / duration);
        duration = nextDuration;
      }
    }
    return this.rhythmRatios;
  };
  this.loadChord = function (pitches, duration) {
    if(pitches.length){
      // It's a chord
      // First add all note no events (without duration)
	    for (var i=0; i<pitches.length; i++) {
		    this.noteEvents.push(MidiEvent.noteOn(pitches[i]));
		  }
      // Then note offs...
	    // It's not at all clear to me why duration needs to be divided by
	    // the number of notes in the chord - maybe a bug in jsmidi.js? -
	    // but it seems to work ...
		  for (i=0; i<pitches.length; i++) {
		    this.noteEvents.push(MidiEvent.noteOff(pitches[i], i==0 ? duration : 0));
		  }
    } else {
      // It's a rest;
	    var note = new Object();
		  note.pitch = 0;
		  note.volume = 0;
		  this.noteEvents.push(MidiEvent.noteOn(note));
		  this.noteEvents.push(MidiEvent.noteOff(note, duration));      
    }
  };
}

// function extendExtras(note, newChar){
//   // Adds fingerings, ornaments and other additional symbols to notes
//     note.TC += newChar;
//   var curchar;
// 	var extras = new Array();
// 	for(var i=0; i<note.TC.length; i++) {
// 		curchar = note.TC.charAt(i);
// 		if(curchar=="("){
// 			// This is a longhand ornament or fingering
// 			var code = "";
// 			while(curchar!=")") {
// 				i++;
// 				if(i >= note.TC.length) break;
// 				curchar = note.TC.charAt(i);
// 				code+=curchar;
// 			}
// 			var newExtra = ParseFullExtra(code);
// 			if(newExtra) {
// 				note.extras.push(newExtra);
// 			}
// 		} else if (curchar == ".") {
// 			// Fingering dots are a special case, because multiple
// 			// symbols make one piece of information (e.g. a3...)
// 			var count = 0;
// 			while(curchar=="."){
// 				count++;
// 				i++;
// 				if(i >= note.TC.length) break;
// 				curchar = note.TC.charAt(i);
// 			}
// 			note.extras.push(new dotFingering(count,7));
// 			// We've overshot now
// 			i--;
// 		} else {
// 			var newExtra = ShorthandExtra(curchar);
// 			if(newExtra)
// 				note.extras.push(newExtra);
// 		}
// 	}
// }

function parseTabWord(TC, start, finish){
  if(TC.length>0) {
    var firstchar = TC.charAt(0);
		if(firstchar.match(/[a-z]/)||firstchar=="X"||firstchar=="-"||firstchar=="."){
			// Chord without rhythm flag
			return FlaglessChord(TC, start, finish, curBeams);
		} else if (rhythmFlags.indexOf(firstchar)>-1){
			// Chord with flag
      curBeams = 0;
			return FlaggedChord(TC, start, finish, curBeams);
		} else if (firstchar=="[" || firstchar=="]") {
      if(TC.charAt(1)==="3"){
        // Editorial triplet
        return TripletChord(TC, start, finish);
      }
			// Explicitly-beamed chord
			return BeamedChord(TC, start, finish);
		} else if (firstchar === "M") {
			// Timesig
			return new Meter(TC, start, finish);
		} else if (firstchar === "3") {
			// Triplet. FIXME: ignore.
			return TripletChord(TC, start, finish);
		} else if (firstchar===":" || firstchar === "|") {
			return new Barline(TC, start, finish);
		} else {
			return false;
		}
	} else
		return false;
}

function BassChord(TC, flag, dotted, mainCourses, start, finish, lbeams, rbeams, rFinish, bstart){
  // We have almost all we need to build a Chord -- just parse the
  // bass courses
  var bassCourses = [false, false, false, false, false, false, false, false];
  var fret = false;
  var prev = false;
  for(var i=0; i<TC.length; i++){
    var nextchar = TC.charAt(i);
    if(/[a-z]/.test(nextchar)){
      // FIXME: I *think* that this is based on a count of slashes, but I
      // haven't checked
      if(prev || prev===0) {
        bassCourses[i-prev-1] = new bassNote(fret, TC.substring(prev, i), i-prev-1, bstart+i, false);
      }
      fret = nextchar;
      prev = i;
    } else if (/[1-9]/.test(nextchar)){
      //FIXME: CHECK -- this is old code, and seems wrong to me.
      //bassCourses[0] = new bassNote(nextchar, 0);
      bassCourses[nextchar] = new bassNote('a', TC.substring(prev, i), Number(nextchar), bstart+i, nextchar);
      break;
    }
  }
  if(fret) bassCourses[i-prev-1] = new bassNote(fret, TC.substring(prev, i), i-prev-1, false);
  return new Chord(flag, dotted, mainCourses, bassCourses, start, finish, lbeams, rbeams, rFinish);
}

function MainChord(TC, flag, dotted, start, finish, lbeams, rbeams, localStart, rFinish) {
  // We've got any rhythmic info we need, so now we parse
  // mainCourses.
	var mainCourses = [false, false, false, false, false, false];
	var curNote = false;
	var extras = "";
	var curchar;
	for(var maini=0; maini<TC.length; maini++) {
		curchar = TC.charAt(maini);
		if(maini!=TC.length - 1 && 
       ((tabletters.indexOf(curchar)>=0 && !isNaN(TC.charAt(maini+1)))
        ||
        (curchar == "-" && !isNaN(TC.charAt(maini+1))))) {
			// This is a fret/course pair
			var course = Number(TC.charAt(maini+1)) -1;
			curNote = new TabNote(curchar, "", maini+localStart, course);
      if(mainCourses[course]){
        // This means there's more than one fret symbol on the same course
        TabCodeDocument.removes.push(mainCourses[course]);
      }
			mainCourses[course] = curNote;
			maini++;
		} else if(TC.charAt(maini)=="X") {
			return BassChord(TC.substr(maini+1), flag, dotted, mainCourses, start, finish, lbeams, rbeams, rFinish, maini+1);
			break;
		} else if(curNote) {
      // Ornaments, fingerings, lines, etc.
      var ex = curNote.extras.length;
      curNote.extendExtras(curchar);
			// and to save us from parenthetical brokenness
			if(curchar=="(") {
				while(curchar!=")") {
          if(curNote.extras.length > ex) curNote.extras.pop();
					maini++;
					if(maini==TC.length) break;
					curchar = TC.charAt(maini);
					curNote.extendExtras(curchar);
				}
			}
		}
	}
	return new Chord(flag, dotted, mainCourses, [], start, finish, lbeams, rbeams, rFinish);
}

function makeTriplet(TC){
  curTripletGroup = new Triplet();
  if(TC.charAt(0)==="[") {
    curTripletGroup.editorial = true;
    TC = TC.substring(1);
  }
  var num = /^[0-9]+/.exec(TC);
  if(num){
    curTripletGroup.numerator = Number(num[0]);
    TC = TC.substring(num[0].length);
  }
  if(TC.charAt(0)==="]") TC = TC.substring(1);
  if(TC.charAt(0)==="("){
    TC = TC.substring(1);
    var den = /^[0-9]+/.exec(TC);
    if(den){
      curTripletGroup.denominator = Number(den[0]);
      TC = TC.substring(den[0].length);
    }
    if(rhythmFlags.indexOf(TC.charAt(0))>-1){
      curTripletGroup.unit = TC.charAt(0);
      TC = TC.substring(1);
    }
    if(TC.charAt(0)===")") TC = TC.substring(1);
  }
  return TC;
}

function TripletChord(TC, start, finish){
  TC = makeTriplet(TC);
  if(TC.length===0) return false;
  var firstchar = TC.charAt(0);
  if(firstchar.match(/[a-z]/)||firstchar=="X"||firstchar=="-"||firstchar=="."){
    return FlaglessChord(TC, start, finish, curBeams);
  } else if(firstchar==="[" || firstchar==="]"){
    return BeamedChord(TC, start, finish);
  } else if (rhythmFlags.indexOf(firstchar)>-1){
    return FlaggedChord(TC, start, finish, 0);
  }
  return false;
}

function FlaggedChord(TC, start, finish, lbeams){
  // If there are beams still open, then there is a mistake. Options are:
  //   * close them
  //   * allow them to go `through' the flag
  // Since this can only happen when there's an error, I'll do what's easiest.
	var flag = TC.charAt(0);
	if(TC.charAt(1)==="."){
		return MainChord(TC.substr(2), flag, true, start, finish, lbeams, lbeams, start+2, start+2);
	} else {
		return MainChord(TC.substr(1), flag, false, start, finish, lbeams, lbeams, start+1, start+1);
	}  
}

function FlaglessChord(TC, start, finish, lbeams){
  if(TC.charAt(0)=="."){
    return MainChord(TC.substr(1), false, true, start, finish, lbeams, lbeams, start, start);
  } else {
    return MainChord(TC, false, false, start, finish, lbeams, lbeams, start, start);
  }
}


function BeamedChord(TC, start, finish){
  // lbeams must match previous note, but rbeams must be altered for
  // how many new beams start and old ones end. Partial beams are
  // assumed, I think, not to exist in tablature.
  var beaminfo = /^[\[\]]*/.exec(TC)[0];
  var opens = (beaminfo.split("[").length -1);
  var closes = (beaminfo.split("]").length - 1);
  var partial = opens > 0 && closes > 0;
  var lpartial = partial && beaminfo.indexOf("[") < beaminfo.indexOf("]");
  var lbeams = lpartial ? curBeams + opens : curBeams;
  if(partial){
    var rbeams = lpartial ? lbeams - closes : curBeams + opens;
  } else {
    var rbeams = curBeams + opens - closes;
  }
  // FIXME: hacky guess
  //var beamends = start+opens+closes;
  var beamends = start+beaminfo.length;
  curBeams += opens - closes;
  var dotPos = TC.indexOf(".");
//  if(dotPos!=-1 && dotPos<TC.search(/[a-z]/)) {
  if(dotPos!=-1 && dotPos<=(beaminfo.length+1)){
    // rhythmic dot
    return MainChord(TC, false, true, start, finish, lbeams, rbeams, start, beamends+1);
  } else {
    return MainChord(TC, false, false, start, finish, lbeams, rbeams, start, beamends);
  }
}

// function Parameters(imageURL, tabcode, contextDur, contextTuning, tabType, fontName){
//   this.imageURL = imageURL;
//   this.tabcode = tabcode;
//   this.contextDur = contextDur;
//   this.contextTuning = contextTuning;
//   this.tabType = tabType;
//   this.fontName = fontName;
//   this.defaultDur = function(){return FlagDur(contextDur);};
//   this.font = function(){
//     if(this.fontName == "Varietie"){
//       return fonts[0];
//     } else {
//       return fonts[1];      
//     }
//   };
// 	this.fretFont = function() {
// 		if(this.tabType == "Italian") {
// 			// Normal numbers rather than a special font
// 			return fonts[2]; //FIXME: This is a non-free font
// 		} else {
// 			return this.font();
// 		}
// 	};
//     this.flagFont = function () {
// 		if(this.tabType == "French") {
// 			return this.font();
// 		} else {			// Flags are always drawn as varietie for Italian tabs
// 			return fonts[0];
// 		}
// 	};
// }
function prevxpos(word){
  if(word.prev){
    if(typeof(word.prev.xpos)=="undefined" && word.prev.prev){
      return prevxpos(word.prev);
    } else {
      return word.prev.xpos;
    }
  } else return false;
}

// First parse classes (i.e. comment-ey things)
function SystemBreak(code) {
	this.tType = "SystemBreak";
	this.comment = code[0];
	this.starts = code[1];
	this.finishes = code[2];
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
}
function PageBreak(code) {
	this.tType = "PageBreak";
	this.comment = code[0];
	this.starts = code[1];
	this.finishes = code[2];
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
}
function Comment(code) {
	this.tType = "Comment";
	this.comment = code[0];
	this.starts = code[1];
	this.finishes = code[2];
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
}
function Apparatus(){
  // multi-word structure
  this.tType = "Apparatus";
  this.content = [];
  this.starts = false;
  this.finishes = false;
  this.startpos = false;
  this.startx = false;
  this.endx = false;
  this.endpos = false;
  this.readings = [];
  this.openRDG = false;
  this.edited = function(){
    return this.readings.some(function(e, i, a){
      return e.attributes.some(function(ee, ii, aa){
        return ee[0].toLowerCase()==="type" && ee[1].toLowerCase()==="edited";
      });
    });
  };
  this.current = function(){
    for(var i=0; i<this.readings.length; i++){
      if(this.readings[i].preferred) return i;
    }
    return false;
  };
  this.currentReading = function(){
    for(var i=0; i<this.readings.length; i++){
      if(this.readings[i].preferred) return this.readings[i];
    }
    return false;
  };
  this.draw = function(SVG){
    var curNo = this.current();
    var count = this.readings.length;
    this.endx = curx;
    var width = this.endx-this.startx;
    var tabwidth = Math.max((width - ld/2) / (this.edited() ? count+1 : count+2), ld/2);
    var pos = this.startx+ld/4;
    var tab;
    for(var i=0; i<count; i++){
      if(editable){
        tab = svgRoundedRect(SVG, pos, cury-(2*ld), (i===curNo ? 2*tabwidth : tabwidth)-(3/2), ld, ld/8, ld/8, 
                             "switchTab "+this.readings[i].colour());
        tab.setAttributeNS(null, "title", 
                           "Click to view the version by "+this.readings[i].responsibility());
        $(tab).data("apparatus", this);
        $(tab).data("readingNo", i);
      }
      if(editable){
        $(tab).click(function(e){
          app = $(this).data("apparatus");
          ri =  $(this).data("readingNo");
          app.switchReading(ri);
        });
      }
      pos+=(i===curNo ? 2*tabwidth : tabwidth);
    }
    if(!this.edited()){
      if(editable){
        tab = svgRoundedRect(SVG, pos, cury-(2*ld), tabwidth, ld, ld/8, ld/8, 
                             "switchTab editTab "+this.currentReading().colour());
        tab.setAttributeNS(null, "title", "Click to edit the current version");
      }
      $(tab).data("apparatus", this);
      $(tab).data("readingNo", curNo);
      if(editable){
        $(tab).click(function(e){
          app = $(this).data("apparatus");
          ri =  $(this).data("readingNo");
          app.addEditedReading(ri);
        });
      }
    }
    if(editable){
      var box = svgRoundedRect(SVG, this.startx, cury-ld, this.endx-this.startx, ld*9,
                            ld/4, ld/4,  "reading "+this.currentReading().colour()+(this.currentReading().readOnly() ? "":" clear"), false);
      $(box).data("apparatus", this);
      $(box).data("readingNo", this.current());
    }
  };
  this.switchReading = function(n){
    TabCodeDocument.parameters.history.add(
      new Modify(this.starts, TabCodeDocument.code.substring(this.starts, this.finishes),
                 this.chooseReading(n), document.getElementById('code'), "Apparatus"));
  };
  this.addEditedReading = function(n){
    TabCodeDocument.parameters.history.add(
      new Modify(this.starts, TabCodeDocument.code.substring(this.starts, this.finishes),
                 this.editReading(n), document.getElementById('code'), "Apparatus"));
  };
  this.chooseReading = function(n){
    var out = "{<app>";
    for(var i=0; i<this.readings.length; i++){
      out+=this.readings[i].toString(i===n);
    }
    out+="</app>}";
    return out;
  };
  this.editReading = function(n){
    var out = "{<app>";
    for(var i=0; i<this.readings.length; i++){
      out+=this.readings[i].toString(false);
    }
    out+=this.readings[n].copy(true, [["type", "edited"], ["resp","editor"], 
                                      ["origResp", this.readings[n].responsibility()]]);
    out+="</app>}";
    return out;
  };
  this.add = function(word, offset){
    if(!offset) offset = 0;
    if(word.tType==="StructuredComment"){
      var appOpens = /<app[^>]*>/i.exec(word.comment);
      var appCloses = /<\/app>/i.exec(word.comment);
      if(this.content.length===0 && appOpens) this.starts = word.starts;
      if(appCloses) {
        this.finishes = word.finishes;
        curApparatus = false;
      }
      if(!this.openRDG){
        if(word.comment.indexOf("<rdg", offset)>-1 || word.comment.indexOf("<RDG", offset)>-1){
          this.openRDG = new Reading();
          this.readings.push(this.openRDG);
        } else {
          return;
        }
      } 
      this.openRDG.add(word, offset);
      if(this.openRDG.finishes && this.openRDG.finishes>offset
         && this.openRDG.finishes<word.comment.length-1){
        var f = this.openRDG.finishes;
        this.openRDG = false;
        this.add(word, f);
      }
    } else if(this.openRDG){
      this.openRDG.add(word);
    }
    word.apparatus = this;
    if(this.content.indexOf(word)===-1) this.content.push(word);
  };
}
function Reading(){
  this.tType = "ApparatusReading";
  this.preferred = false;
  this.type = false;
  this.contentString = false;
  this.openTag = false;
  this.closeTag = false;
  this.content = [];
  this.starts = false;
  this.startWord = false;
  this.finishes = false;
  this.endWord = false;
  this.attributes = [];
  this.readOnly = function(){
    for(var i=0; i<this.attributes.length; i++){
      if(this.attributes[i][0].toLowerCase()==="type"){
        return this.attributes[i][1].toLowerCase()==="correction";
      }
    }
    return false;
  };
  this.responsibility = function(){
    for(var i=0; i<this.attributes.length; i++){
      if(this.attributes[i][0].toLowerCase()==="resp"){
        return this.attributes[i][1].toLowerCase();
      }
    }
    return false;
  };
  this.colour = function(){
    var resp = this.responsibility();
    if(!resp) return "grey";
    for(var i=0; i<TabCodeDocument.colours.length; i++){
      if(TabCodeDocument.colours[i][0]===resp) return TabCodeDocument.colours[i][1];
    }
    TabCodeDocument.colours.push([resp, colours[TabCodeDocument.colours.length]]);
    return TabCodeDocument.colours[TabCodeDocument.colours.length-1][1];
  };
  this.contentToString = function(){
    var source = TabCodeDocument.code;
    var out = "";
    for(var i=0; i<this.content.length; i++){
      if((i===0 || i===this.content.length-1) && this.preferred) {
        // if PREFERRED, then there is no content in the comment
        continue; 
      }
      start = i===0
        ? (this.starts + this.openTag.length+this.content[i].starts) 
        : this.content[i].starts;
      finish = i===this.content.length-1 ? this.finishes+this.content[i].starts -6
        : this.content[i].finishes;
      out+=" "+source.substring(start, finish);
    }
    return out.substring(1);
  };
  this.toString = function(preferred){
    var out = this.openTag;
    var start, end;
    if(preferred) out += "}";
    out += this.contentToString();
    out+=" "+(preferred ? "{" : "")+"</rdg>";
    return out;
  };
  this.copy = function(preferred, newAttributes){
    var out = "<rdg";
    for(var i=0; i<newAttributes.length; i++){
      out+=' '+newAttributes[i][0]+"='"+newAttributes[i][1]+"'";
    }
    out +=">";
    if(preferred) out += "}";
    out +=this.contentToString();
    out+=" "+(preferred ? "{" : "")+"</rdg>";
    return out;
  };
  this.add = function(item, start){
    this.content.push(item);
    if(item.tType==="StructuredComment"){
      start = start ? start : 0; 
      var text= item.comment.substring(start);
      var openTagRE = /<rdg[^>]*>/gi;
      var attributesRE = /\s([\S]*)\=[\'\"]([^'"]*)[\'\"]/gi;
      var closeTagRE = /<\/rdg>/gi;
      var ct = closeTagRE.exec(text);
      var ot = openTagRE.exec(text);
      var match;
      if(!this.openTag){
        if(!ot) return;
        // Don't grap attributes from the next open tag
        if(ct) text = text.substring(0,ct.index);
        this.openTag = ot[0];
        this.starts = ot.index+start;
        while((match=attributesRE.exec(text)) !== null) {
          this.attributes.push([match[1], match.length>2 ? match[2] : true, 
                                match.index+start, 
                                attributesRE.lastIndex+start]);
        }
      }
      if(ct){
        this.finishes = ct.index+6+start;
        this.endWord = item;
      }
      if(this.content.length>1){ this.preferred=true;}
    } else {
      this.preferred=true;
      item.reading = this;
    }
  };
}
function StructuredComment(code) {
	this.tType = "StructuredComment";
	this.comment = code[0];
	this.starts = code[1];
	this.finishes = code[2];
  this.mapping = false;
  this.members = [];
  this.readonly = false;
  this.preferred = false;
  this.apparatus = false;
  this.reading=false;
  this.readings = [];
  this.open = false;
  this.draw = function(){
    if(!(this.apparatus && this.apparatus.content
       && this.apparatus.content.length)){
      return;
    } else if (this===this.apparatus.content[0]){
      this.apparatus.startx = curx;
      this.apparatus.starty = cury;
      curx+=ld/2;
    } else {
      // assume this is the end, which in current circumstances it
      // will be. I'm also assuming single system
      this.apparatus.draw(TabCodeDocument.SVG);
      // var el = svgRoundedRect(TabCodeDocument.SVG, this.apparatus.startx, cury-ld, 
      //                         curx-this.apparatus.startx, ld*9, ld/4, ld/4, "reading", false);
      // $(el).data("apparatus", this.apparatus);
      curx += ld/2;
    }
  };
}
function Triplet(){
  this.numerator = 3;
  this.denominator = 2;
  this.unit = false;
  this.code = false;
  this.members = [];
  this.editorial = false;
  this.mapping = false;
  this.addMember = function(member){
    this.members.push(member);
    member.tripletGroup = this;
    if(this.full()){
      curTripletGroup = false;
    }
  };
  this.lastp = function(member){
    return member===this.members[this.members.length-1];
  };
  this.full = function(){
    // FIXME: broken or, at least, simplistic
    return this.members.length===this.numerator;
  };
  this.draw = function(){
    var x = this.members[1].xpos;
    var y = this.members[1].ypos+ld;
    var obj;
    if(this.members[1].flag || this.members[1].beamed){
      y -= 2.5*ld;
    } 
    obj = svgText(TabCodeDocument.SVG, x, y, "triplet", false, false, this.editorial ? "[3]": "3");
    $(obj).data("group", this);
    return obj;
  };
}

function Chord(flag, dotted, mainCourses, bassCourses, start, finish, lbeams, rbeams, rFinish){
  this.tType = "Chord";
  this.flag = flag;
  this.rule = rule;
  this.dotted = dotted;
  this.starts = start;
  this.finishes = finish;
  this.nextStart = false;
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
  this.rhythmFinishes = rFinish;
  this.startTime = false;
  this.selections = new Array();
  this.mainCourses = mainCourses;
  this.bassCourses = bassCourses;
  this.tripletGroup = false;
  this.lbeams = lbeams;
  this.rbeams = rbeams;
  this.beamGroup = false;
  if(lbeams || rbeams){
    curBeamGroup.push(this);
    this.beamGroup = curBeamGroup;
    if(!rbeams) {
      // Ends the group
      curBeamGroup = [];
    }
  }
  this.beamed = Math.max(this.lbeams, this.rbeams);
  this.tuning = false;
  this.DOMObj = false;
  this.xpos = false;
  this.rpos = 0;
  this.ypos = false;
  this.dur = false;
  this.prev = false;
  this.next = false;
  for(var i=0; i<this.mainCourses.length; i++){
    if(this.mainCourses[i]){
      this.mainCourses[i].chord = this;
    }
  }
  for(i=0; i<this.bassCourses.length; i++){
    if(this.bassCourses[i]){
      this.bassCourses[i].chord = this;
    }
  }
  this.drawBeams = function(){
    var group = svgGroup(this.DOMObj, "beamelement"+(this.selections.length ? " selected" : ""),
                         false);
    var x = this.xpos+(ld/3);
    var y = this.ypos-(ld*6/5);
    // var y = this.ypos-(ld*4/5);
    var beamGap = ld/3.5;
    var lgroup=svgGroup(group, "leftbeams", false);
    var rgroup=svgGroup(group, "rightbeams", false);
    // Vertical stem first
    svgLine(group, x, y, x, this.ypos+(ld*2/5), "beamstem", false);
    // Then beams: left, then right
    for(var i=0; i<lbeams; i++){
      if(this.prev){
        var xp = prevxpos(this);
        if(xp){
          svgLine(lgroup, xp+(ld/3)+(ld*3/5)+1/2, y, x+1/2, y, "lbeamelement", false);
        } else {
          svgLine(lgroup, x-(ld*3/5)-1/2, y, x+1/2, y, "lbeamelement", false);
        }
      } else {
        svgLine(lgroup, x-(ld*3/5)-1/2, y, x+1/2, y, "lbeamelement", false);
      }
      y += beamGap;
    }
    y = this.ypos-(ld*6/5);
    // y = this.ypos-(ld*4/5);
    for(i=0; i<rbeams; i++){
      svgLine(rgroup, Math.max(x+(ld*3/5)+1/2, this.rpos) , y, x-1/2, y, "rbeamelement", false);
      y += beamGap;
    }
    $(group).data("word", this);
  };
  this.drawFlag = function(){
    var obj = svgText(this.DOMObj, (ld/4)+this.xpos, flagy(), 
      "rhythm flag "+(/[FB]/.test(this.flag) ? "Varietie" : curFontName)
      +(!this.editable || (this.reading && this.reading.readOnly()) ? " readonly" : " editable")
      +(this.selections.length ? " selected" : ""), 
      false, false, this.flag);
    $(obj).data("word", this);
    // if(obj.getBBox().width && !this.rpos || (obj.getBBox().width + this.xpos) > this.rpos)
    //   this.rpos = (obj.getBBox().width + this.xpos);
    if(obj.getBoundingClientRect().width && !this.rpos || ((ld/4)+obj.getBoundingClientRect().width + this.xpos) > this.rpos)
      this.rpos = (obj.getBoundingClientRect().width + this.xpos);
  };
  this.drawRhythm = function(){
    if(this.flag){
      this.drawFlag();
    } else if(this.beamed) {
      this.drawBeams();
    } else if(editable && (!this.reading || !this.reading.readOnly())){
      // No flag -- draw insert box
      var el = svgRoundedRect(this.DOMObj, curx-ld/4, cury+verticalAdjust()-(2*ld),
                             ld, 7/4*ld, ld/4, ld/4,
                             "missingFlag", false);
      $(el).data("word", this);
    }
    if(this.dotted){
      // var doty = this.ypos-(ld/4) + 
      var doty = this.ypos+
        (this.flag ? Math.max(0, 4-rhythmFlags.indexOf(this.flag)) * ld/6 :
         (this.beamed ? Math.max(0, 2-this.rbeams) * ld/6 : 0));
      svgText(this.DOMObj, this.xpos+(ld*5/15), doty, "rhythmdot", false, false, ".");
    }
  };
  this.drawMainCourses = function(){
    for(var i=0; i<this.mainCourses.length; i++){
      if(this.mainCourses[i]){
        var extraClasses = [];
        for(var j=0; j<this.selections.length; j++){
          if(this.selections[j].appliesToNote(this.mainCourses[i], this)){
            extraClasses.push("select-"+j);
          }
        }
        this.mainCourses[i].draw(this.DOMObj, " "+extraClasses.join(" "));
        if(isNaN(this.mainCourses[i].rpos)) {
//          alert([this.mainCourses[i].fret, this.mainCourses[i].course]);
        } else {
          this.rpos = Math.max(this.rpos, this.mainCourses[i].rpos);
        }
      } else if(editable && (!this.reading || !this.reading.readOnly())){
        var courseadj = curTabType == "Italian" ? 5-i : i;
        var el = svgRoundedRect(this.DOMObj, 
          curx-(ld/4), cury+ld*courseadj+verticalAdjust() - ld/2,
          ld, ld, ld/4, ld/4, "missingFret", false);
        $(el).data("word", this);
        $(el).data("course", i+1);
      }
    }
  };
  this.drawBassCourses = function(){
    for(var i=0; i<bassCourses.length; i++){
      if(this.bassCourses[i]){
        var extraClasses = [];
        for(var j=0; j<this.selections.length; j++){
          if(this.selections[j].appliesToNote(this.bassCourses[i], this)){
            extraClasses.push("select-"+j);
          }
        }
        this.bassCourses[i].draw(this.DOMObj, extraClasses);
      }
    }
  };
  this.insertionPoint = function(course){
    for(var i=Math.max(0, course-1); i< this.mainCourses.length; i++){
      if(this.mainCourses[i]){
        return this.mainCourses[i].starts;
      }
    }
    // FIXME: Ignores bass courses
    return this.finishes;
  };
  this.draw = function(){
    this.xpos = curx;
    this.ypos = cury;
    this.rpos = curx;
    this.tuning = curTuning;
    if(!this.DOMObj) { // is the test necessary?
      this.DOMObj = svgGroup(TabCodeDocument.SVG, 
                             "chord"+(editable && (!this.reading || !this.reading.readOnly()) 
                                      ? " editable" : " readonly")
                             +extraClasses, false);
    }
    this.drawMainCourses();
    this.drawBassCourses();
    this.drawRhythm();
    curx = this.rpos ? Math.max(this.rpos + (ld/5), this.xpos + (5/4*ld)) : this.xpos + (4*ld/3);
    if(this.selections.length) {
      $(this.DOMObj).data("word", this);
      $(this.DOMObj).click(playSelection);
    }
  };
  this.pitches = function(distinct){
    if(!this.tuning) this.tuning = curTuning;
    var pitches = new Array();
    var p = false;
		for(var i=0; i<6; i++){
			if(this.mainCourses[i] && this.tuning && this.mainCourses[i].pitch(this.tuning)){
        p = this.mainCourses[i].pitch(this.tuning);
        if(!distinct || pitches.indexOf(p)===-1){
          // If *distinct* is true, only add if not already present
			    pitches.push(p);
        }
			}
		}
		for(i=0; i<this.bassCourses.length; i++){
      if(this.bassCourses[i] && this.tuning && this.bassCourses[i].pitch(this.tuning)){
        p = this.bassCourses[i].pitch(this.tuning);
        if(!distinct || pitches.indexOf(p)===-1){
          pitches.push(p);
        }
      }
		}
		return pitches;    
  };
  this.sounds = function(){
    // Return true if any tabnotes have pitch. N.B. Am checking
    // whether we know their tuning. This may not be sensible.
    if(!this.tuning) this.tuning = curTuning;
    for(var i=0; i<this.mainCourses.length; i++){
      if(this.mainCourses[i] && this.tuning && this.mainCourses[i].pitch(this.tuning)){
        return true;
      }
    }
    for(i=0; i<this.bassCourses.length; i++){
      if(this.bassCourses[i] && this.tuning && this.bassCourses[i].pitch(this.tuning)){
        return true;
      }      
    }
    return false;
  };
  this.duration = function() {
    if(this.dur || this.dur===0) return this.dur;
    if(this.flag){
      if(this.dotted){
        curDur = FlagDur(this.flag)*ticksPerCrotchet*3/2;
      } else {
        curDur = FlagDur(this.flag)*ticksPerCrotchet;
      }
      this.dur = curDur;
    } else if(this.beamed){
	    if(this.dotted){
		    this.dur = Math.pow(2, (Math.max(this.lbeams, this.rbeams) - 1) * -1) * ticksPerCrotchet*3/2;
		  } else {
		    this.dur = Math.pow(2, (Math.max(this.lbeams, this.rbeams) - 1) * -1) * ticksPerCrotchet;
		  }      
    } else if (!this.sounds()){
      // Consists entirely of non-pitched objects (e.g. tenuto). Give
      // 0 rhythm and don't change curDur
      this.dur = 0;
    } else {
      this.dur = curDur;
    }
    // FIXME: Needs testing
    if(this.tripletGroup){
      this.dur = this.dur * this.tripletGroup.denominator / this.tripletGroup.numerator;
    }
    return this.dur;
  };
}

function TabNote(fret, extras, starts, course){
  this.tType = "TabNote";
  this.fret = fret;
  this.extras = new Array();
  this.starts = starts;
  this.fingerings = false;
  this.TC = extras;
  this.xpos = false;
  this.ypos = false;
  this.rpos = 0;
  this.course = course;
  this.chord = false;
  this.mapping = false;
	this.fretChar = function() {
    // FIXME: HACKHACKHACK
    if(this.fret == "-") return " ";
		return this.rule ? this.rule.tabChar(this.fret) : tabChar(this.fret);
	};
  this.pitch = function(tuning){
    if(this.fret == "-") return false;
    return tuning[this.course]+letterPitch(this.fret);
  };
	this.extendExtras = function(newChar) {
		this.TC = this.TC + newChar;
		var curchar;
		extras = [];
		for(var i=0; i<this.TC.length; i++) {
			curchar = this.TC.charAt(i);
			if(curchar=="("){
				// This is a longhand ornament or fingering
				var code = "";
				while(curchar!=")") {
					i++;
					if(i >= this.TC.length) break;
					curchar = this.TC.charAt(i);
					code+=curchar;
				}
				var newExtra = ParseFullExtra(code);
				if(newExtra) {
					this.extras.push(newExtra);
				}
			}
			else if (curchar == ".") {
				// Fingering dots are a special case, because multiple
				// symbols make one piece of information (e.g. a3...)
				var count = 0;
				while(curchar=="."){
					count++;
					i++;
					if(i >= this.TC.length) break;
					curchar = this.TC.charAt(i);
				}
				this.extras.push(new dotFingering(count,7));
				// We've overshot now
				i--;
			} else {
				var newExtra = ShorthandExtra(curchar);
				if(newExtra)
					this.extras.push(newExtra);
			}
      if(this.fret == "-" && this.extras.length) {
        this.extras[this.extras.length-1].nullfret = true;
      } 
		}
	};
  this.draw = function(svgEl, extraClasses){
    this.xpos = curx;
    this.ypos = cury;
    this.course = course;
    var fc = this.fretChar();
    var cl = "tabnote "+curTabType+" "+curFontName+(fc===" " ? " space" : "")+extraClasses;
    if(fc===" " && !this.extras.length) fc="-";
    var el = svgText(svgEl, this.xpos, this.ypos+yOffset(this.course), 
      cl, false, false, fc);
    el.setAttributeNS("xml", "space", "preserve");
    $(el).data("word", this);
//    this.rpos = curx + el.getBoundingClientRect().width;
    var box = el.getBoundingClientRect();
    this.rpos = box.right - TabCodeDocument.leftishHack;
    for(var i=0; i<this.extras.length; i++){
      this.rpos = Math.max(this.rpos, 
        this.extras[i].draw(this.xpos, this.ypos+yOffset(this.course), svgEl, this));
	  }
  };
}

function bassNote(fret, code, course, starts, numeric){
  this.tType = "BassNote";
  this.fret = fret;
  this.extra = new Array();
  this.start = starts;
  this.course = course;
  this.fingerings = false;
  this.numeric = numeric;
  this.TC = code;
  this.xpos = false;
  this.ypos = false;
  this.chord = false;
  this.rule = rule;
  this.DOMObj = false;
  this.mapping = false;
  this.fretChar = function(){
    return this.rule ? this.rule.tabChar(this.fret) : tabChar(this.fret);
  };
  this.extendExtras = function(newChar){
    extendExtras(this, newChar);
  };
  this.draw = function(svgEl, extraClasses){
    this.DOMObj = svgGroup(svgEl, "bassgroup", false);
    if(this.numeric){
      svgText(this.DOMObj, curx, cury+systemStep()-(ld/2), "bass number", false, false, this.numeric);
    } else if(this.fret==/^\d{1}$/){ // FIXME: No idea
      svgText(this.DOMObj, curx, cury+systemStep()-(ld/2), "bass", false, false, this.fret);
    } else if (curTabType == "French"){
      if(!this.numeric){
        drawSlashes(this.DOMObj, this.course);
        svgText(this.DOMObj, curx, cury+systemStep()-(ld*2/3)+this.course*3, 
          "bassnote French "+curFontName+extraClasses, false, false, this.fret);
      } else {
        svgText(this.DOMObj, curx, cury+systemStep()-(ld*2/3), 
          "bassnote French "+curFontName+extraClasses, false, false, this.course);
      }
    } else {
      drawItalianSlashes(this.DOMObj, this.course);
      svgText(this.DOMObj, curx, cury+(ld*2/3)-this.course*3, 
        "bassnote Italian "+curFontName+extraClasses, false, false, letterPitch(this.fret));
    }
    $(this.DOMObj).data("word", this);
  };
  this.pitch = function(tuning){
    return tuning[this.course+mainCourseCount]+letterPitch(this.fret);
  };
}


function Barline(TC, start, finish) {
	this.tType = "Barline";
  this.code = TC;
  this.xpos = false;
  this.ypos = false;
  // FIXME: move these to parser.js
	this.lRepeat = TC.charAt(0)===":";
	this.rRepeat = TC.length>1 && TC.charAt(TC.length - 1)===":";
  this.midDots = TC.indexOf("|:|")>-1;
	this.doubleBar = TC.indexOf("|") != TC.lastIndexOf("|");
	this.dashed = TC.indexOf("=") >= 0;
	this.starts = start;
	this.finishes = finish;
  this.DOMObj = false;
  this.xpos = false;
  this.ypos = false;
//  curBeams = 0;
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
  this.prev = false;
  this.next = false;
  this.draw = function(){
    this.xpos = curx;
    this.ypos = cury;
    var localx = curx;
    var left = curx;
    this.DOMObj = svgGroup(TabCodeDocument.SVG, "barline", false);
    $(this.DOMObj).data("word", this);
    if(this.lRepeat) {
      drawRepeat(this.DOMObj, localx);
      localx+=8;
    }
    if(this.midDots){
      drawBarline(this.DOMObj, localx, this.dashed, false);
      localx += 3;
      drawRepeat(this.DOMObj, localx);
      localx +=7;
      drawBarline(this.DOMObj, localx, this.dashed, false);
    } else {
      drawBarline(this.DOMObj, localx, this.dashed, this.doubleBar);
    }
    localx = curx;
    if(this.rRepeat){
      drawRepeat(this.DOMObj, localx+12);
    }
    curx += ld;
  };
}

function Meter(TC, starts, finishes){
  this.tType = "Meter";
  this.xpos = false;
  this.ypos = false;
  this.code = TC;
  this.starts = starts;
  this.finishes = finishes;
  this.DOMObj = false;
  this.components = [];
  this.mapping = false;
  this.apparatus = false;
  this.reading=false;
  this.prev = false;
  this.next = false;
  // FIXME: move these to parser.js
  if(TC.charAt(1) =="(" && TC.charAt(TC.length-1) == ")"){
    var code = TC.substring(2,TC.length-1);
    var subcodes = code.split(";");
    for(var i=0; i<subcodes.length; i++){
      // FIXME: should be objects
      this.components.push(subcodes[i].split(":"));
    }
  }
  this.componentStart = function(i, j){
    var startLooking = 2;
    for(var i2=0; i2<i; i2++){
      startLooking = this.code.indexOf(";", startLooking)+1;
    }
    for(var j2=0; j2<j; j2++){
      startLooking = this.code.indexOf(":", startLooking)+1;
    }
    return startLooking+this.starts;
  };
  this.drawOld = function(){
    this.xpos = curx;
    this.ypos = cury;
    var left = curx;
    var group = svgGroup(TabCodeDocument.SVG, "timesig", false);
    var width;
    if(editable) drawMetricalInsertBox(i, "before", this, TabCodeDocument.SVG);
    for(var i=0; i<this.components.length; i++){
      if(this.components[i].length > 1){
        // FIXME: ignoring third sig in triply stacked sigs
        width = drawTSComponent(group, this.components[i][0], false, i, 0, this);
        drawTSComponent(group, this.components[i][1], width, i, 1, this);
      } else {
        if(editable) drawMetricalInsertBoxes(i, this, TabCodeDocument.SVG);
        drawTSComponent(group, this.components[i][0], 0, i, 0, this);
      }
      if(editable) drawMetricalInsertBox(i, "after", this, TabCodeDocument.SVG);
    }
    curx = this.xpos + group.getBoundingClientRect().width;
  };
  this.draw = function(){
    var group = svgGroup(TabCodeDocument.SVG, "timesig", false);
    var newx = curx;
    this.xpos = curx;
    this.ypos = cury;
    if(editable) drawMetricalInsertBox(0, "before", this, TabCodeDocument.SVG);
    for (var i=0; i<this.components.length; i++){
      if(this.components[i].length==1 && editable){
        drawMetricalInsertBoxes(i, this, TabCodeDocument.SVG);
      }
      for(var j=0; j<this.components[i].length; j++){
        newx = Math.max(curx + drawTSC(group, this, i, j).getBoundingClientRect().width, newx, curx+2*ld);
      }
      curx = newx;
    }
    if(editable) drawMetricalInsertBox(this.components.length-1, "after", this, TabCodeDocument.SVG);
  };
}
///////////////////
// 
// In this file, the basics for managing multiple extracts
//
//
// Basically, the Tablature object from parser.js doesn't itself know
// very much -- it's just designed to hold tabcode and its parsed
// version. Most of the information about images, notation, context,
// edit history, etc. is provided by the Parameters object below. 
// 
// Parameters objects hold information not only about the tablature,
// but also about the database record. As such, they are slightly more
// task specific and (FIXME) there will need to be variants for other
// tasks. (I want inheritance and polymorphism)
//
// User objects hold basic user details, handle the synchronisation
// with the database and manage multiple pieces (assignments). An
// alternative User object is used in test/ to allow offline editing.
//
// User is initialised by the login procedure, specifically
// logFromForm(), giving:
//
// Login->LogFromForm->new User()->self.refreshAssignments->self.getDBAssignments->edit(<current>)
//
// edit is a function that initialises the Parameters object for the
// current object, draw some buttons and status stuff and then runs
// initialisePage2() 
//
// Why is this so complicated? I hear you ask. I think that it's
// because initialisePage2 is slightly less application-specific than
// either initialisePage and edit. initialisePage2
var curParams;

function Parameters(imageURL, tabcode, contextDur, contextTuning, tabType, fontName, history){
  // This object contains information about the basic unit of
  // transcription/edition. It also keeps track of its undo record
  // ('history'). For most applications, it is expected that this will
  // be retrieved from a remote server, usually on a live ajax link.
  this.imageURL = imageURL;
  this.tabcode = tabcode;
  this.contextDur = contextDur;
  this.contextTuning = contextTuning;
  this.tabType = tabType;
  this.fontName = fontName;
  this.history = history;
  this.id = false;
  this.num = false;
  this.allocated = false;
  this.edited = false;
  this.submitted = false;
  this.message = false;
  this.messageType = false;
  this.resp = false;
  this.tabcodeDocument = false;// added for collation use. See if useful.
  this.defaultDur = function(){return FlagDur(contextDur);};
  this.update = function(ruleset){
    if(ruleset.notation) this.tabType = ruleset.notation;
    if(ruleset.tuning) this.contextTuning = ruleset.tuning;
    if(ruleset.fontFamily()) this.fontName = ruleset.fontFamily();
    if(ruleset.staffLines()) lines = ruleset.staffLines();
  };
  this.font = function(){
    if(this.fontName == "Varietie"){
      return fonts[0];
    } else {
      return fonts[1];   
    }
  };
	this.fretFont = function() {
		if(this.tabType == "Italian") {
			// Normal numbers rather than a special font
			return fonts[2]; //FIXME: This is a non-free font
		} else {
			return this.font();
		}
	};
    this.flagFont = function () {
		if(this.tabType == "French") {
			return this.font();
		} else {			// Flags are always drawn as varietie for Italian tabs
			return fonts[0];
		}
	};
  this.drawContextDur = function(DOMObj){
//    alert(this.fontName);
    var obj = svgText(DOMObj, 10,10, "flag "+this.fontName, 
      "contextflag", false, this.contextDur);
    $(obj).data("word", this);
  };
  this.editMessage = function(){
    var dbox = dialogueBoxFloat();
    dbox.style.left = "10%";
    dbox.style.bottom = "5px";
    dbox.appendChild(DOMTextEl('h3', '', '', 'Messages'));
    dbox.appendChild(DOMSelect('MessageType', 'messages', 'messages', true, 
        messageSelectOptions(this.messageType)));
    var ta = DOMTextArea('messagetext', 'messagetext');
    if(this.message) ta.innerHTML = this.message;
    ta.cols = 60;
    ta.rows = 12;
    dbox.appendChild(ta);
    var div = DOMDiv('simplebuttonsbar', 'simplebuttonsbar', false);
    dbox.appendChild(div);
    div.appendChild(DOMButton('okbutton', 'okbutton',
      'Ok', function(id){
        return function(){
          var types = getTypes();
          var message = document.getElementById('messagetext').value;
          if(types!=this.messageType || message!= this.message){
            this.messageType = types;
            this.message = message;
            curUser.commitMessage(id, types, message);
          }
          clearButtons();
        };
      }(this.id)));
    div.appendChild(DOMButton('cancelbutton', 'cancelbutton',
      'Cancel', clearButtons));
  };
}

function getTypes(){
  var options = $("#messages option");
  var types = 0;
  for(var i=0; i<options.length; i++){
    if(options[i].selected){
      types += Math.pow(2,i);
    }
  }
  return types;
}

function messageTypeArray(n){
  var messageTypes = [["-- --"],
                      ["No tablature in image"],
                      ["Too many errors"],
                      ["Symbols illegible"],
                      ["Handwritten correction"],
                      ["Graphic too faint"],
                      ["Could not edit symbol"],
                      ["Could not add symbol"]];
  for(var i=messageTypes.length -1; i>=0; i--){
    if(n>=Math.pow(2, i)){
      n -=Math.pow(2, i);
      messageTypes[i].push(true);
    } else {
      messageTypes[i].push(false);
    }
  }
  return messageTypes;
}

function messageSelectOptions(n){
  var messageTypes = messageTypeArray(n);
  var optionarray = [];
  for(var i=0; i<messageTypes.length; i++){
    optionarray.push(DOMOption(i, i, messageTypes[i][0], messageTypes[i][1]));
  }
  return optionarray;
}

var curUser = false;
var myObj = false;
var saved = true;
var resync = false;
function User(name, password){
  this.name = name;
  this.password = password;
  this.assignments = false;
  this.getDBAssignments = function(){
    // if user name and password aren't in database, this will set
    // assignments as false
    myObj = this;
    $.ajax({
      type: 'POST',
      async: false,
      url: "db.php",
      datatype: 'json',
      data: {"username": this.name,
             "password": this.password,
             "agent": window.navigator.userAgent},
      contentType: "application/x-www-form-urlencoded;charset=UTF-8",
      failure: function(){
        alert("Assignment fetch failed");
      },
      success: function(data){
        myObj.assignments = JSON.parse(data);
        if(!curParams || myObj.getAssignmentById(curParams.id).state==2){
          var found = false;
          for(var i=0; i<myObj.assignments.length; i++){
            if(myObj.assignments[i].state <2){
              edit(myObj.assignments[i]);
              found = true;
              break;
            }
          }
          if(!found){
            // This shouldn't happen. If it does, something is wrong
            // with the allocation script
            console.log("No new allocation");
            myObj.assignments[myObj.assignments.length-1].state=1;
            edit(myObj.assignments[myObj.assignments.length-1]);
          }
        }
        // myObj.hideAssignments();
      }});
  };
  this.refreshAssignments = function (){
    this.getDBAssignments();
  };
  this.getAssignmentById = function(id){
    for(var i=0; i<this.assignments.length; i++){
      if(this.assignments[i].id == id){
        return this.assignments[i];
      }
    }
    return false;
  };
  this.dbSynchronise = function(doc, submit){
    var params = doc.parameters;
    var id = params.id;
    var code = doc.code;
    var history = JSON.stringify(params.history);
    var assignment = this.getAssignmentById(id);
    if(resync) {
      // If we've got a timeout scheduled to resync, stop it now
      window.clearTimeout(resync);
      resync = false;
    }
    if(assignment.tabcode == code && !submit){
      return;
    }
    $("#statuslamp").removeClass("lampsaved");
    $("#statuslamp").addClass("lampunsaved");
    assignment.tabcode = code;
    $.ajax({
      type: 'POST',
      async: true,
      url: "db.php",
      // datatype: 'json',
      data: {"username": this.name,
             "password": this.password,
             "id": id,
             "tabcode": code,
             "duration": params.contextDur,
             "tuning": JSON.stringify(params.contextTuning),
             "font": params.fontName,
             "tabtype": params.tabType,
             "finalFlag": doc.finalFlag,
             "history": history,
             "state": submit ? 2 : assignment.state,
             "submit": submit},
      contentType: "application/x-www-form-urlencoded;charset=UTF-8",
      failure: function(){
        saved = false;
        resync = window.setTimeout(dbSynchronise, 300);
        alert("reconnecting...");
      },
      success: function(data){
        saved = true;
        $("#statuslamp").removeClass("lampunsaved");
        $("#statuslamp").addClass("lampsaved");
        if(submit) {
          curUser.refreshAssignments();
        }
      }});
    if(submit); // do somthing alert("Saving corrections. Please note: this may take a little while...");
  };
  this.commitMessage = function(id, types, message){
    $.ajax({
      type: 'POST',
      async: true,
      url: "db.php",
      data: {"username": this.name,
             "password": this.password,
             "id": id,
             "message": message,
             "messageType": types},
      contentType: "application/x-www-form-urlencoded;charset=UTF-8",
      failure: function(){
        alert("Message not saved");
      },
      success: function(){
        return;
      }
    });
  };
  this.changePwd=function(){
    if(document.getElementById('pwd').value == this.password){
      if(document.getElementById('pwd2').value == document.getElementById('pwd3').value){
        if(document.getElementById('pwd2').value.length){
          $.ajax({
            type: 'POST',
            async: true,
            url: "db.php",
            data: {"username": this.name,
                   "password": this.password,
                   "newpassword": document.getElementById('pwd2').value},
            contentType: "application/x-www-form-urlencoded;charset=UTF-8",
            failure: function(){
              saved = false;
            },
            success: function(data){
              saved = true;
            }
          });
          $(document.getElementById('pchange')).hide();
          if(document.getElementById('showpwd')) {
            $(document.getElementById('showpwd')).show();
          } else {
            document.getElementById('changepwdbutton').disabled=false;
          }
        } else {
          alert("Please enter a new password");
        }
      } else {
        alert("New passwords are different. Please retype them.");
      }
    } else {
      // Not really forgotten -- probably mistyped
      alert("Incorrect password entered. If you have forgotten your password, please contact administrators.");
    }
  };
  this.nextAssignmentFn = function(backn){
    for(var i=backn; i<this.assignments.length; i++){
      if(this.assignments[i].id == curParams.id){
        return function(assign){
          return function() {edit(assign);};
        }(this.assignments[i-backn]);
      }
    }
    return false;
  };
  this.prevAssignmentFn = function(forwardn){
    for(var i=0; i<this.assignments.length-forwardn; i++){
      if(this.assignments[i].id == curParams.id){
        return function(assign){
          return function() {edit(assign);};
        }(this.assignments[i+forwardn]);
      }
    }
    return false;
  };
  this.latest = function(){
    if(this.assignments[0].id != curParams.id){
      return function(a){
        return function(){edit(a);};
      } (this.assignments[0]);
    }
    return false;
  };
  this.earliest = function(){
    if(this.assignments[this.assignments.length-1].id != curParams.id){
            return function(a){
        return function(){edit(a);};
      } (this.assignments[this.assignments.length-1]);
    }
    return false;
  };
  this.refreshAssignments();
}

function logIn(){
  if(!$("#login").length) {
    var logInDiv = DOMDiv("login", "login", DOMTextEl("h2", false, false, "Log in to help edit the Electronic Corpus of Lute Music’s new acquisitions"));
    logInDiv.appendChild(DOMDiv("msg", "logmsg", false));
    var inputs = DOMDiv("inputs", "inputs", DOMTextInput("User", "User", false, "Username: ", "Username"));
    inputs.appendChild(DOMPasswordInput("Password", "Password", false, "Password: ", "password"));
    logInDiv.appendChild(inputs);
    logInDiv.appendChild(DOMButton("LoginOK", "LoginOK", "Ok", logFromForm));
    logInDiv.appendChild(DOMButton("LoginCancel", "LoginCancel", "Cancel", cancelForm));
    document.body.appendChild(logInDiv);
    $('.Password, .User').keyup(checkConfirm);
  }
}

function checkConfirm (e){
  if(e.which ==13){
    logFromForm();
  };
}

function logFromForm(){
  var uname = document.getElementById('User').value;
  var pword = document.getElementById('Password').value;
  var newUser = new User(uname, pword);
  if(newUser.assignments.length){
    curUser = newUser;
    if($(document.getElementById('browse')).is(':visible')){
      updateNavButtons();
    } else if(curUser.assignments.length > 1){
      $(document.getElementById('viewprevbutton')).show();
    } else {
      $(document.getElementById('viewprevbutton')).hide();
    }
    $("#login").remove();
    if(document.getElementById("user")) document.getElementById("user").innerHTML=curUser.name;
  } else {
    $("#logmsg").html("The username or password has not been recognised");
  }
}

function cancelForm(){
  $("#login").remove();  
}

function viewCurAssignments(){
  curUser.showAssignments();
}

function dbSynchronise(){
  curUser.dbSynchronise(TabCodeDocument, 0);
}

function dbSubmit(){
  curUser.dbSynchronise(TabCodeDocument, 1);
//  curUser.refreshAssignments();
}

function edit(a){
  // curParams = new Parameters(a.imageurl, a.tabcode, a.contextDur, a.contextTuning, 
  //   a.tabType, a.fontName, new History());

  // This bit is a hack – There's a problem with new symbols at the
  // end of a system if the last character isn't whitespace. For now, enforce a space.
  if(a.tabcode.slice(-1)!==" ") a.tabcode = a.tabcode+" ";

  curParams = new Parameters(a.imageURL, a.tabcode, a.contextDur, typeof(a.contextTuning)=="string" ? JSON.parse(a.contextTuning) : a.contextTuning.map(Number), 
    a.tabType, a.fontName, new History());
  curParams.id = a.id;
  var infostring = "";
  if(a.num) {
    curParams.number = a.num;
    infostring += "No. "+a.num;
  }
  if(a.allocated && format_mysqldate(a.allocated)) {
    curParams.allocated = a.allocated;
    infostring += " <span id='allocated' class='dates'>allocated "+format_mysqldate(a.allocated)+"</span>";
  }
  if(a.submitted && format_mysqldate(a.submitted)) {
    curParams.submitted = a.submitted;
    infostring += " <span id='submitted' class='dates'> and <span>submitted "+format_mysqldate(a.submitted)+"</span></span>";
  } else if (a.state<2) {
    infostring += " <span class='unsubmitted'>not yet submitted.</class>";
  }
  if(a.edited && format_mysqldate(a.edited)) curParams.edited = a.edited;
  if(a.submitted) curParams.submitted = a.submitted;
  if(a.message) curParams.message = a.message;
  if(a.messageType) curParams.messageType = a.messageType;
  if(a.history){
    curParams.history = importHistory(a.history);
  }
  if(!node && document.getElementById("Submit")){
    if(a.state>2){
      // It's being collated
      alert("Editing of this edition is no longer possible as the text is now "
            + "with the core editorial tema for collation");
      document.getElementById("Submit").disabled = true;
    } else if(a.state == 2) {
      document.getElementById("Submit").disabled = true;
    } else {
      document.getElementById("Submit").disabled = false;
    }
  }
  if(curParams.contextTuning[5]==41) document.getElementById("tuning").innerHTML = "hfeff";
  if(!node && document.getElementById("assignment")) document.getElementById("assignment").innerHTML = infostring;
//  Extract = Example;
  if(!node) {
    if($(document.getElementById('browse')).is(':visible')){
      updateNavButtons();
    } else if(curUser && curUser.assignments.length > 1){
      $(document.getElementById('viewprevbutton')).show();
    } else {
      $(document.getElementById('viewprevbutton')).hide();
    }
  }
  initialisePage2();
//  $("#assignmentsbutton").click(viewCurAssignments);
}

function updateNavButtons(){
  var naf = curUser.nextAssignmentFn(1);
  var paf = curUser.prevAssignmentFn(1);
  var lf = curUser.latest();
  var ef = curUser.earliest();
  if(ef) {
    document.getElementById('firstass').disabled = false;
    document.getElementById('firstass').onclick = ef;
  } else {
    document.getElementById('firstass').disabled = true;
  }
  if(lf) {
    document.getElementById('latestass').disabled = false;
    document.getElementById('latestass').onclick = lf;
  } else {
    document.getElementById('latestass').disabled = true;
  }
  if(paf) {
    document.getElementById('prevass').disabled = false;
    document.getElementById('prevass').onclick = paf;
  } else {
    document.getElementById('prevass').disabled = true;
  }
  if(naf) {
    document.getElementById('nextass').disabled = false;
    document.getElementById('nextass').onclick = naf;
  } else {
    document.getElementById('nextass').disabled = true;
  }
}

function basepathname(imageURL){
  return imageURL.substring(0, imageURL.lastIndexOf("/"));
}

function facename(imageURL){
  var shorter = imageURL.substring(0, imageURL.lastIndexOf("/out/"));
  return shorter.substring(shorter.lastIndexOf("/")+1);
}

function curSysNo(){
  // FIXME: should just keep all the sys info...
  // FIXME: depends on nice path names -- not something we've guaranteed
  var imageURL = curParams.imageURL;
  return parseInt(imageURL.substring(imageURL.lastIndexOf("system")+6))-1;
}

function toggleTuning(){
  // FIXME: Hack for two-tuning world :)
  var tswitch = document.getElementById("tuning");
  var newT;
  if(tswitch.innerHTML == "ffeff"){
    tswitch.innerHTML = "hfeff";
    newT = ren_G_abzug;
  } else{
    tswitch.innerHTML = "ffeff";
    newT = ren_G;
  }
  TabCodeDocument.parameters.history.add(new replaceContextTuning(curParams, newT));
//  refresh();
}






/****Added by TC for loading individual systems via querystring in url***/
// NB Code suggested in email from DL 2 July 2012
function GETParameters(){
  var vars = new Querystring().params;
  if(!vars) return false;
  if(vars.browse){
   return browse(vars);
  } else if(vars.batch && vars.name && vars.system){
    var basepath = "../output/"+vars.batch+"/"+vars.batch+"_"+vars.name+"/out/system"+vars.system;
    if(vars.color)
       return new Parameters(basepath+".png", file_get_contents(basepath+".tc"), 
         "Q", ren_G, "Italian", "Varietie", new History());
   else
      return new Parameters(basepath+"_gray.png", file_get_contents(basepath+".tc"), 
        "Q", ren_G, "Italian", "Varietie", new History());
  } else if(vars.batch && vars.no && vars.part && vars.system){
    if(vars.part=="a"){
      nextpage = window.location.search.replace("part=a", "part=b");
      prevpage = window.location.search.replace("part=a", "part=b")
        .replace("num="+vars.no, "num="+threeWide(Number(vars.no)-1));
    } else {
      prevpage = window.location.search.replace("part=b", "part=a");
      nextpage = window.location.search.replace("part=b", "part=a")
        .replace("num="+vars.no, "num="+threeWide(Number(vars.no)+1));
    }
    var basepath = "../output/"+vars.batch+"/"+vars.batch+"_"+vars.no+"_part_"+vars.part+"/out/system"+vars.system;
    if(vars.color)
       return new Parameters(basepath+".png", file_get_contents(basepath+".tc"), "Q", ren_G, "Italian", "Varietie", new History());
    else
      return new Parameters(basepath+"_gray.png", file_get_contents(basepath+".tc"), "Q", ren_G, "Italian", "Varietie", new History());
  } else if (vars.imageURL && vars.tabcode){
    return new Parameters(vars.imageURL, vars.tabcode, vars.contextDur, vars.contextTuning, vars.tabType, vars.fontName, new History());
  } else {
    return false;
  }
}

function threeWide(n){
  if(n>99){
    return n+"";
  } else if(n>9){
    return "0"+""+n;
  } else {
    return "00"+""+n;
  }
}

// This alternative code might be more robust:

/* Client-side access to querystring name=value pairs
Version 1.3 28 May 2008
License (Simplified BSD): http://adamv.com/dev/javascript/qslicense.txt
*/
function Querystring(qs) { // optionally pass a querystring to parse
  this.params = {};
  if (qs == null) qs = location.search.substring(1, location.search.length);
  if (qs.length == 0) return;
  // Turn <plus> back to <space>
  // See: http://www.w3.org/TR/REC-html40/interact/forms.html#h-17.13.4.1
  qs = qs.replace(/\+/g, ' ');
  var args = qs.split('&'); // parse out name/value pairs separated via &
  // split out each name=value pair
  for (var i = 0; i < args.length; i++) {
    var pair = args[i].split('=');
    var name = decodeURIComponent(pair[0]);
    var value = (pair.length==2)
      ? decodeURIComponent(pair[1])
      : name;
    this.params[name] = value;
  }
}
Querystring.prototype.get = function(key, default_) {
  var value = this.params[key];
  return (value != null) ? value : default_;
};
Querystring.prototype.contains = function(key) {
  var value = this.params[key];
  return (value != null);
};

var p;
var dd;
var d;
function browse(vars){
  $.ajax({type: 'POST',
          async: false,
          url: "browse.php",
          datatype: 'json',
          data: {"source": vars.batch,
                 "page": vars.no,
                 "part": vars.part,
                 "colour": (typeof(vars.color)=="undefined" ? 0 : 1),
                 "system": vars.system},
          contentType: "application/x-www-form-urlencoded; charset=UTF-8",
          failure: function(){
            alert("Failed to fetch data due to a server error");
          },
          success: function(data){
            dd = data;
            d = JSON.parse(data);
            nextpage = d.nexturl;
            prevpage = d.prevurl;
            p = new Parameters(d.imageurl, d.tabcode, d.contextDur, 
              d.contextTuning, d.tabType, d.fontName, new History());
          }
  });
  return p;
}

