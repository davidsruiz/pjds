/*
 *  GameCycles: a class that maintains an on
 *  note ~ time will be measured in minutes
 */

"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('./ext/underscore-min.js');

var TIME = {

  sec: function sec(_sec) {
    return _sec * 1000;
  },
  min: function min(_min) {
    return this.sec(_min * 60);
  },
  hrs: function hrs(_hrs) {
    return this.min(_hrs * 60);
  },
  days: function days(_days) {
    return this.hrs(_days * 24);
  }

};

// VARIATIONS : the properties the game cycles class can change and their options
var VARIATIONS = {

  'mode': [0, 1],
  'map': [0, 1, 2, 3]

};

var GameCycles = function () {
  function GameCycles() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, GameCycles);

    var _options$variables = options.variables,
        variables = _options$variables === undefined ? ['mode', 'map'] : _options$variables,
        _options$refreshRate = options.refreshRate,
        refreshRate = _options$refreshRate === undefined ? TIME.hrs(6) : _options$refreshRate,
        _options$refreshOffse = options.refreshOffset,
        refreshOffset = _options$refreshOffse === undefined ? 0 : _options$refreshOffse,
        _options$seed = options.seed,
        seed = _options$seed === undefined ? new Date(2017, 0, 1) : _options$seed;

    // PUBLIC //

    // this.variables: these are the objects being cycled.

    this.variables = variables;

    // this.refreshRate: how often the cycles are updated in minutes;
    //   constraints: 0 < x
    this.refreshRate = refreshRate; // 1 hr

    // this.refreshOffset: the % of the refresh rate serving as the delay when starting at time 0
    //   constraints: 0 <= x < 1
    this.refreshOffset = refreshOffset;

    // this.rotation: is the current state of the variables.
    this.rotation = {};

    // PRIVATE //

    // this.timeoutIndex = every loop sets the next timeout which is saved here
    this.timeoutIndex = -1;

    this.seed = seed.valueOf();

    this.listeners = new Map();

    // START //
    this.loop();
  }

  _createClass(GameCycles, [{
    key: 'loop',
    value: function loop() {
      var _this = this;

      this.change();
      this.execListeners('rotationUpdate', this.rotation);
      this.timeoutIndex = setTimeout(function () {
        _this.loop();
      }, this.timeLeftUntilNextChange);
    }
  }, {
    key: 'change',
    value: function change() {

      this.rotation = {};

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.variables[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var prop = _step.value;


          if (!(VARIATIONS[prop] instanceof Array)) continue;

          var choice = _(VARIATIONS[prop]).sample();

          if (typeof choice !== 'undefined') this.rotation[prop] = choice;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'stop',
    value: function stop() {
      clearTimeout(this.timeoutIndex);
    }
  }, {
    key: 'addListener',


    // Listeners
    value: function addListener(key, handler) {

      if (typeof handler !== 'function') return false;

      var listenerList = this.listeners.get(key) || [];
      listenerList.push(handler);
      this.listeners.set(key, listenerList);

      return true; // success
    }
  }, {
    key: 'execListeners',
    value: function execListeners(key, info) {
      var listenerList = this.listeners.get(key) || [];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = listenerList[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var listener = _step2.value;

          listener(info);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'removeListener',
    value: function removeListener(key, handler) {
      var listenerList = this.listeners.get(key) || [];
      var indexOf = listenerList.indexOf(handler);
      if (indexOf === -1) return false; // failure
      listenerList.splice(indexOf, 1);
      return true; // success
    }
  }, {
    key: 'timeSinceSeedWithDelay',
    get: function get() {

      var now = Date.now();
      var delay = parseInt(this.refreshOffset * this.refreshRate);
      var seedWithDelay = this.seed + delay;

      return now - seedWithDelay;
    }
  }, {
    key: 'nextChangeTime',
    get: function get() {

      var interval = this.refreshRate;
      var timeSinceSeed = this.timeSinceSeedWithDelay;
      var cyclesSinceSeed = parseInt(timeSinceSeed / interval);
      var nextNumberOfCycles = cyclesSinceSeed + 1;
      var nextTime = this.seed + interval * nextNumberOfCycles;

      return nextTime;
    }
  }, {
    key: 'timeLeftUntilNextChange',
    get: function get() {

      var interval = this.refreshRate;
      var timeSinceSeed = this.timeSinceSeedWithDelay;
      var elapsedTimeInCycle = timeSinceSeed % interval;
      var remainingTimeInCycle = interval - elapsedTimeInCycle;

      return remainingTimeInCycle;
    }
  }]);

  return GameCycles;
}();

try {
  module.exports = GameCycles;
} catch (e) {
  console.warn(e);
}
//# sourceMappingURL=game_cycles.js.map