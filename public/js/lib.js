/*
* object.watch polyfill
*
* 2012-04-03
*
* By Eli Grey, http://eligrey.com
* Public Domain.
* NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
*/

// object.watch
if (!Object.prototype.watch) {
  Object.defineProperty(Object.prototype, "watch", {
    enumerable: false
    , configurable: true
    , writable: false
    , value: function (prop, handler) {
      var
      oldval = this[prop]
      , newval = oldval
      , getter = function () {
        return newval;
      }
      , setter = function (val) {
        oldval = newval;
        return newval = handler.call(this, prop, oldval, val);
      }
      ;

      if (delete this[prop]) { // can't watch constants
      Object.defineProperty(this, prop, {
        get: getter
        , set: setter
        , enumerable: true
        , configurable: true
      });
    }
  }
});
}

// object.unwatch
if (!Object.prototype.unwatch) {
  Object.defineProperty(Object.prototype, "unwatch", {
    enumerable: false
    , configurable: true
    , writable: false
    , value: function (prop) {
      var val = this[prop];
      delete this[prop]; // remove accessors
      this[prop] = val;
    }
  });
}


// Object.prototype.assignAttrFrom = function (obj) {for (var attrname in obj) { this[attrname] = obj[attrname] }};
// Object.prototype.size = function () {return Object.keys(this).length};
// Object.prototype.forEach = function(block) { if(typeof block == "function") Object.keys(this).forEach((key) => block(key, this[key], this)) };

Number.prototype.times = function(block) { for(var i = 0; i < this; i++) block(i); };

Array.prototype.sample = function() { return this[Math.floor(Math.random() * this.length)] };
Array.prototype.shuffle = function() { return this.sort(() => Math.flipCoin() )};
Array.prototype.delete = function(el) { var i = this.indexOf(el); if(i!=-1) { this.splice(i, 1); return true } return false };
Array.prototype.toSet = function() { return new Set(this) };
Array.prototype.average = function() { let t; for(var el of this) if(typeof t == 'undefined') { t = el } else { t += el } return t/this.length };

Set.prototype.first = function() { return this.values().next().value };
Set.prototype.draw = function() { this.delete(this.first()) };
Set.prototype.toArray = function() { return Array.from(this) };

Array.new = function(l = 0, filler) { var a = new Array(); l.times((i)=>{a.push(typeof(filler)=="function" ? filler(i) : filler)}); return a }
Math.flipCoin = (p = 0.5) => Math.random() < p;
Math.randomMinMax = (min, max) => (Math.random()*(max - min)) + min;
Math.randomIntMinMax = (min, max) => Math.floor((Math.random()*(max - min)) + min);


const TIME = {sec: function(mil) {return mil * 1000}, min: function(mil) {return this.sec(mil) * 60}};



/*const setIntervalTimeout = function(block, interval, timeout) {

  var ms_delay = Math.round(interval),
    animate_length = Math.round(timeout);

  if(animate_length % ms_delay != 0) animate_length = Math.ceil(animate_length / ms_delay) * ms_delay;

  var frame_count = animate_length / ms_delay;

  frame_count.times(i => {
    var progress = (++i) / frame_count,
      wait_time = ms_delay*i;
    (()=>{
      block(i-1, frame_count);
    }).wait(wait_time);
  })

};*/

const setAnimationTimeout = function(block, timeout, callback = ()=>{}) {

  let last_time = (new Date()).getTime();

  // the variable percentage of a second that has gone by since the last frame
  // usually expressed: 0.016 when running 60 fps
  let dt = 0;
  let elapsed = 0;

  const update = () => {
    const now = (new Date()).getTime();
    dt = (now - last_time) / 1000;
    last_time = now;
    elapsed += dt;
  };

  const loop = (() => {
    update();
    // log(`${dt} :: ${elapsed} :: ${timeout}`);
    if(elapsed < timeout) {
      block(dt, elapsed, timeout);
      requestAnimationFrame(loop);
    } else {
      callback();
    }
  });

  loop();

};


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
(function(){}).constructor.prototype.wait = function(ms) { setTimeout(this, ms) };

//  game
var localIDMatches = id => id == ENV.user.id;

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
// Math.uuid = () => Math.random().toString(36).substring(2, 15);
Math.uuid = () => Date.now().toString(36);

window.location.reset = () => { window.location = window.location.origin }

const FRAMES = {secs: s => s*60, mins: m => FRAMES.secs(m*60), hrs: h => FRAMES.mins(h*60)}

// http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
const COLOR = {
  componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
  },
  rgbToHex(r, g, b) {
      return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
  },
  hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
      } : null;
  },

  // https://gist.github.com/jedfoster/7939513
  mix(color_1, color_2, weight) {
    function d2h(d) { return d.toString(16); }  // convert a decimal value to hex
    function h2d(h) { return parseInt(h, 16); } // convert a hex value to decimal

    weight = (typeof(weight) !== 'undefined') ? weight : 50; // set the weight to 50%, if that argument is omitted

    var color = "#"; color_1 = color_1.slice(1); color_2 = color_2.slice(1);

    for(var i = 0; i <= 5; i += 2) { // loop through each of the 3 hex pairs—red, green, and blue
      var v1 = h2d(color_1.substr(i, 2)), // extract the current pairs
        v2 = h2d(color_2.substr(i, 2)),

        // combine the current pairs from each source color, according to the specified weight
        val = d2h(Math.floor(v2 + (v1 - v2) * (weight / 100.0)));

      while(val.length < 2) { val = '0' + val; } // prepend a '0' if val results in a single digit

      color += val; // concatenate val to our new color string
    }

    return color; // PROFIT!
  }
};



function cloneCanvas(oldCanvas) {

  //create a new canvas
  var newCanvas = document.createElement('canvas');
  var context = newCanvas.getContext('2d');

  //set dimensions
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;

  //apply the old canvas to the new one
  context.drawImage(oldCanvas, 0, 0);

  //return the new canvas
  return newCanvas;
}




// UNDERSCORE JS //
try {

  _.mixin({
    draw: function(collection) {
      const item = collection.keys().next().value;
      collection.delete(item);
      return item;
    }
  });

} catch(e) {}



///////////////////

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
