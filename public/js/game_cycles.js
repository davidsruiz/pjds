/*
 *  GameCycles: a class that maintains an on
 *  note ~ time will be measured in minutes
 */

"use strict";

const _ = require('./ext/underscore-min.js');

const TIME = {

  sec: function(sec) { return sec * 1000 },
  min: function(min) { return this.sec(min * 60) },
  hrs: function(hrs) { return this.min(hrs * 60) },
  days: function(days) { return this.hrs(days * 24) },

};

// VARIATIONS : the properties the game cycles class can change and their options
const VARIATIONS = {

  'mode'    : [0, 1],
  'map'     : [0, 1, 2, 3],

};


class GameCycles {

  constructor (options = {}) {

    const {
      variables           = ['mode', 'map'], // items of focus
      refreshRate         = TIME.hrs(6), // ms
      refreshOffset       = 0, // %
      seed                = new Date(2017, 0, 1), // 2017 Jan 1st @ 00:00.000 (month is 0-based)
    } = options;

    
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



  loop() {
    this.change();
    this.execListeners('rotationUpdate', this.rotation);
    this.timeoutIndex =
      setTimeout(() => {
        this.loop();
      }, this.timeLeftUntilNextChange);
  }
  
  change() {

    this.rotation = {};

    for(let prop of this.variables) {

      if( !(VARIATIONS[prop] instanceof Array) ) continue;

      const choice = _(VARIATIONS[prop]).sample();

      if(typeof choice !== 'undefined') this.rotation[prop] = choice;

    }
  }

  stop() {
    clearTimeout(this.timeoutIndex);
  }



  get timeSinceSeedWithDelay() {

    const now = Date.now();
    const delay = parseInt(this.refreshOffset * this.refreshRate);
    const seedWithDelay = this.seed + delay;

    return ( now - seedWithDelay );

  }

  get nextChangeTime() {

    const interval = this.refreshRate;
    const timeSinceSeed = this.timeSinceSeedWithDelay;
    const cyclesSinceSeed = parseInt(timeSinceSeed / interval);
    const nextNumberOfCycles = cyclesSinceSeed + 1;
    const nextTime = this.seed + (interval * nextNumberOfCycles);

    return nextTime;

  }

  get timeLeftUntilNextChange() {

    const interval = this.refreshRate;
    const timeSinceSeed = this.timeSinceSeedWithDelay;
    const elapsedTimeInCycle = timeSinceSeed % interval;
    const remainingTimeInCycle = interval - elapsedTimeInCycle;

    return remainingTimeInCycle;

  }


  // Listeners
  addListener(key, handler) {

    if(typeof handler !== 'function')
      return false;

    const listenerList = this.listeners.get(key) || [];
    listenerList.push(handler);
    this.listeners.set(key, listenerList);

    return true; // success

  }

  execListeners(key, info) {
    const listenerList = this.listeners.get(key) || [];
    for(let listener of listenerList)
      listener(info);
  }

  removeListener(key, handler) {
    const listenerList = this.listeners.get(key) || [];
    const indexOf = listenerList.indexOf(handler);
    if(indexOf === -1) return false; // failure
    listenerList.splice(indexOf, 1);
    return true; // success
  }

}



try {
  module.exports = GameCycles;
} catch(e) {console.warn(e)}