'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ENV = ENV || {};

var SoundHelper = function () {
  function SoundHelper() {
    _classCallCheck(this, SoundHelper);
  }

  _createClass(SoundHelper, null, [{
    key: 'start',
    value: function start() {
      ENV.sound.play('track1');
    }
  }, {
    key: 'stop',
    value: function stop() {
      ENV.sound.stop('track1');
    }
  }, {
    key: 'fireSub',
    value: function fireSub() {
      // if(!ENV.sound) return;
      ENV.sound.play('pulse');
    }
  }, {
    key: 'fireShot',
    value: function fireShot() {
      ENV.sound.play('shoot');
    }
  }, {
    key: 'takeDamage',
    value: function takeDamage() {
      ENV.sound.play('damp');
    }
  }, {
    key: 'teamYay',
    value: function teamYay() {
      ENV.sound.play('rise');
    }
  }, {
    key: 'teamNay',
    value: function teamNay() {
      ENV.sound.play('fall');
    }
  }, {
    key: 'playerDisconnect',
    value: function playerDisconnect() {
      ENV.sound.play('drop');
    }
  }]);

  return SoundHelper;
}();