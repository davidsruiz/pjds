Object.prototype.assignAttrFrom = function (obj) {for (var attrname in obj) { this[attrname] = obj[attrname] }};
Object.prototype.size = function () {return Object.keys(this).length};
Object.prototype.forEach = function(block) { Object.keys(this).forEach((key) => block(key, this[key], this)) }

Number.prototype.times = function(block) { for(var i = 0; i < this; i++) block(i); }

Array.prototype.sample = function() { return this[Math.floor(Math.random() * this.length)] };
Array.prototype.shuffle = function() { return this.sort(() => Math.flipCoin() )};
Array.prototype.delete = function(el) { var i = this.indexOf(el); if(i!=-1) { this.splice(i, 1); return true } return false }

Set.prototype.draw = function() { var next = this.values().next().value; this.delete(next); return next }


Array.new = function(l = 0, filler) { var a = new Array(); l.times((i)=>{a.push(typeof(filler)=="function" ? filler(i) : filler)}); return a }
Math.flipCoin = (p = 0.5) => Math.random() < p
Math.randomMinMax = (min, max) => (Math.random()*(max - min)) + min
Math.randomIntMinMax = (min, max) => Math.floor((Math.random()*(max - min)) + min)


// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

Math.sqr = x => Math.pow(x, 2);


// helpers
//  system
var log = m => {console.log(m); return m};
var err = m => console.error(m);

//  game
var localIDMatches = id => id == ENV["id"];

Array.prototype.first = function() {return this[0]}; Array.prototype.last = function() {return this[this.length-1]}
String.prototype.is = function(str) {return this == str}
Number.prototype.shift = function(n) {return this + n}
Number.prototype.scale = function(n) {return this * n}
Number.prototype.round = function(decimal_places) { var n = Math.pow(10, decimal_places); return Math.round(this*n)/n}

String.prototype.paddingL = function(n = 0, c = " ") { var s = this; while(s.length < n) s=c+s; return s }
String.prototype.paddingR = function(n = 0, c = " ") { var s = this; while(s.length < n) s=s+c; return s }
String.prototype.padding = function(n = 0, c = " ") { var [s, alt] = [this, true]; while(s.length < n) {alt?s=s+c:s=c+s;alt=!alt} return s }

// GamepadList.prototype.firstPresent = function() { for(i in this) if(this[i] !== undefined) return this[i] }

// not really a uuid, but works here.
Math.uuid = () => Math.random().toString(36).substring(2, 15);

window.location.reset = () => { window.location = window.location.origin }

FRAMES = {secs: s => s*60, mins: m => FRAMES.secs(m*60), hrs: h => FRAMES.mins(h*60)}

/* DOCUMENTATION //

-- Object.prototype.forEach
  The forEach() method executes a provided function once per key-value pair.

  Syntax
  obj.forEach(callback)

  Parameters
  callback
    Function to execute for each element, taking three arguments:
    key
      The current property key being processed.
    val
      The current property value being processed.
    obj
      The obj that forEach() is being applied to.
                                                                              */
