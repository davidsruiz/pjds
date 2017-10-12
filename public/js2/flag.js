"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Flag = function () {
  function Flag(p) {
    _classCallCheck(this, Flag);

    this.spawn = this.position = p;
    this.radius = 18;
    this.reset();

    this.drag = 0.3; // reduce vel limit to %
    // this.drag = 80; // takes from ships vel limit
  }

  _createClass(Flag, [{
    key: "reset",
    value: function reset() {
      delete this.holderID;
      // this.position = this.spawn.copy();
    }
  }, {
    key: "idle",
    get: function get() {
      return !this.holderID;
    }
  }]);

  return Flag;
}();