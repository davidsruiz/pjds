/**
 * Created by davidsruiz on 1/7/17.
 */

/*
 *  Timer: a class that functions as a software timer, a device to countdown a time interval given the amount
 */

"use strict";

class Timer {

  constructor (time = 0) {

    // the waiting period expressed as time in ms
    this.interval = time;

    // this.startTime: registers the time of the last activation of the timer (if any)
    this.startTime;

    // this.timeoutID: holds the running system timeout ID (if any)
    this.timeoutID;

    // this.callback: holds the callback (if any) to be executed upon completion
    this.callback = () => {};
  }

  /* this.start: starts the timer executing the callback upon completion */
  start(callback = () => {}) {
    if(this.timeoutID) this.cancel();

    this.callback = callback;
    this.startTime = Date.now();
    this.timeoutID = setTimeout(this.callback, this.interval);
  }

  /* this.end: ends the timer prematurely executing the callback immediately */
  end() {
    this.cancel();
    this.callback();
  }

  /* this.cancel: cancels callback execution */
  cancel() {
    clearTimeout(this.timeoutID);
    delete this.timeoutID;
  }

  get endTime() { return this.startTime + this.interval }
  get timeElapsed() { return Date.now() - this.startTime }
  get timeLeft() { return this.endTime - Date.now() }
}

var module;
if(module) module.exports = Timer;