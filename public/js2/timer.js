/**
 * Created by davidsruiz on 1/7/17.
 */

/*
 *  Timer: a class that functions as a software timer, a device to countdown a time interval given the amount
 */

"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Timer = function () {
  function Timer() {
    var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    _classCallCheck(this, Timer);

    // the waiting period expressed as time in ms
    this.interval = time;

    // this.startTime: registers the time of the last activation of the timer (if any)
    this.startTime;

    // this.timeoutID: holds the running system timeout ID (if any)
    this.timeoutID;

    // this.callback: holds the callback (if any) to be executed upon completion
    this.callback = function () {};
  }

  /* this.start: starts the timer executing the callback upon completion */


  _createClass(Timer, [{
    key: "start",
    value: function start() {
      var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

      if (this.timeoutID) this.cancel();

      this.callback = callback;
      this.startTime = Date.now();
      this.timeoutID = setTimeout(this.callback, this.interval);
    }

    /* this.end: ends the timer prematurely executing the callback immediately */

  }, {
    key: "end",
    value: function end() {
      this.cancel();
      this.callback();
    }

    /* this.cancel: cancels callback execution */

  }, {
    key: "cancel",
    value: function cancel() {
      clearTimeout(this.timeoutID);
      delete this.timeoutID;
    }
  }, {
    key: "endTime",
    get: function get() {
      return this.startTime + this.interval;
    }
  }, {
    key: "timeElapsed",
    get: function get() {
      return Date.now() - this.startTime;
    }
  }, {
    key: "timeLeft",
    get: function get() {
      return this.endTime - Date.now();
    }
  }]);

  return Timer;
}();

// var module;
// if(module)


try {
  module.exports = Timer;
} catch (e) {
  console.warn(e);
}