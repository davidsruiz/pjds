'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TIME = { sec: function sec(mil) {
    return mil * 1000;
  }, min: function min(mil) {
    return this.sec(mil) * 60;
  } };

var Sound = function () {
  function Sound(set) {
    // this.root = '/sound/'
    // this._volume = 0.4;
    // this._pan = 0;
    // this._mute = 0;
    // this.activated = new Map();
    // createjs.Sound.on("fileload", this.loadHandler, this);
    //
    //   // every loaded sound is here
    // this.loaded = new Set();
    //   // loading sounds waiting play
    // this.waiting = new Set();
    //   // where looping information is stored if needed
    // this.looping = new Map();
    // if(set) this.load(set);

    _classCallCheck(this, Sound);
  }

  _createClass(Sound, [{
    key: 'load',
    value: function load(set) {

      // set = Sound.sets[set];
      //
      // for(var item of set) {
      //   createjs.Sound.registerSound(this.root + item[1], item[0]);
      //   if(item[2] !== undefined) this.looping.set(item[0], {start: item[2], end: item[3]})
      // }
    }
  }, {
    key: 'loadHandler',
    value: function loadHandler(e) {
      var id = e.id;
      this.loaded.add(id);console.log('loaded ' + id);
      if (this.waiting.has(id)) {
        this.waiting.delete(id);
        this.play(id);
      }
    }
  }, {
    key: 'play',
    value: function play(id) {
      // if(this.activated.has(id)) {
      //   var instance = this.activated.get(id);
      //   (instance.playState == "playFinished") ? instance.play() : instance.position = 0;
      // } else if(this.loaded.has(id)) {
      //   var instance = createjs.Sound.play(id);
      //   this.activated.set(id, instance);
      //   instance.volume = this.volume; instance.pan = this.pan; instance.muted = this.mute;
      //   if(this.looping.has(id)) {
      //     var {start, end} = this.looping.get(id);
      //     end = end || instance.duration;
      //     instance.setLoop(99);
      //     instance.setDuration(end)
      //     instance.setStartTime(start) // effective next cycle
      //     setTimeout(() => { instance.setDuration(end - start); }, end); // effective immediately, hence delay
      //   }
      // } else {
      //   this.waiting.add(id);
      // }
    }
  }, {
    key: 'pause',
    value: function pause(id) {
      if (this.activated.has(id)) {
        var instance = this.activated.get(id);
        instance.paused = true;
      }
    }
  }, {
    key: 'stop',
    value: function stop(id) {
      // if(this.activated.has(id)) {
      //   var instance = this.activated.get(id);
      //   instance.paused = true;
      //   instance.position = 0;
      //   instance.stop()
      // } else if(this.waiting.has(id)) {
      //   this.waiting.delete(id)
      // }
    }
  }, {
    key: 'volume',
    get: function get() {
      return this._volume;
    },
    set: function set(new_volume) {
      if (new_volume < 0) new_volume = 0;
      if (new_volume > 1) new_volume = 1;
      this._volume = new_volume;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.activated[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var instance = _ref2[1];

          instance.volume = this._volume;
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
    key: 'pan',
    get: function get() {
      return this._pan;
    },
    set: function set(new_pan) {
      if (new_pan < -1) new_pan = -1;
      if (new_pan > 1) new_pan = 1;
      this._pan = new_pan;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.activated[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _ref3 = _step2.value;

          var _ref4 = _slicedToArray(_ref3, 2);

          var instance = _ref4[1];

          instance.pan = this._pan;
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
    key: 'mute',
    get: function get() {
      return this._mute;
    },
    set: function set(new_mute) {
      // this._mute = !!new_mute;
      // for(var [,instance] of this.activated)
      //   instance.muted = this._mute;
    }
  }]);

  return Sound;
}();

Sound.sets = {
  // set: ['soundname', 'file'[, startLoop, endLoop]]
  menu: [['ambiance', 'DB-T.mp3', TIME.sec(10.0)], ['item-hover', 'blip0.mp3']],
  lobby: [['chill', 'lounge.mp3', 10, TIME.sec(36.571)], ['ready', 'blip1.mp3'], ['type', 'blip2.mp3']],
  level: [['track1', 'DR-T.mp3']],
  game: [
  // ['pulse', 'pulse.wav'],
  // ['shoot', 'standard_shot.wav'],
  // ['damp', '.mp3'],
  ['rise', 'rise.wav'], ['fall', 'fall.wav']
  // ['drop', '.mp3']
  ]
};