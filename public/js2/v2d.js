"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var V2D = function () {
  function V2D() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    _classCallCheck(this, V2D);

    var _ref = [x, y];
    this.x = _ref[0];
    this.y = _ref[1];
  }

  _createClass(V2D, [{
    key: "set",
    value: function set(_ref2) {
      var x = _ref2.x,
          y = _ref2.y;
      var _ref3 = [x, y];
      this.x = _ref3[0];
      this.y = _ref3[1];
    }
  }, {
    key: "reset",
    value: function reset() {
      this.set({ x: 0, y: 0 });
    }
  }, {
    key: "copy",
    value: function copy() {
      return new V2D(this.x, this.y);
    }
  }, {
    key: "add",
    value: function add(v) {
      this.x += v.x;this.y += v.y;return this;
    }
  }, {
    key: "sub",
    value: function sub(v) {
      this.x -= v.x;this.y -= v.y;return this;
    }
  }, {
    key: "mul",
    value: function mul(n) {
      this.x *= n;this.y *= n;return this;
    }
  }, {
    key: "div",
    value: function div(n) {
      this.x /= n;this.y /= n;return this;
    }

    // non mutating

  }, {
    key: "add_",
    value: function add_(n) {
      return this.copy().add(n);
    }
  }, {
    key: "sub_",
    value: function sub_(n) {
      return this.copy().sub(n);
    }
  }, {
    key: "mul_",
    value: function mul_(n) {
      return this.copy().mul(n);
    }
  }, {
    key: "div_",
    value: function div_(n) {
      return this.copy().div(n);
    }

    // unit vector

  }, {
    key: "unit_v",
    value: function unit_v() {
      return this.div_(this.length);
    }

    // dot product

  }, {
    key: "angle",
    get: function get() {
      return Math.atan2(this.y, this.x);
    },
    set: function set(a) {
      var l = this.length;
      this.x = Math.cos(a) * l;
      this.y = Math.sin(a) * l;
    }
  }, {
    key: "length",
    get: function get() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    set: function set(l) {
      var a = this.angle;
      this.x = Math.cos(a) * l;
      this.y = Math.sin(a) * l;
    }
  }], [{
    key: "new",
    value: function _new() {
      var v = new V2D();
      switch (arguments.length) {
        case 0:
          v.set({ x: 0, y: 0 });
          break;
        case 1:
          if (arguments[0].x && arguments[0].y) v.set(arguments[0]);
          if (arguments[0].length && arguments[0].angle) {
            v.length = arguments[0].length;v.angle = arguments[0].angle;
          }
          break;
        case 2:
          v.set({ x: arguments[0], y: arguments[1] });
          break;
      }
      return v;
    }
  }, {
    key: "dot",
    value: function dot(a, b) {
      return a.x * b.x + a.y * b.y;
    }

    // projection of a onto b

  }, {
    key: "proj",
    value: function proj(a, b) {
      return b.mul_(V2D.dot(a, b) / V2D.dot(b, b));
    }

    // rejection of a from b

  }, {
    key: "rejc",
    value: function rejc(a, b) {
      return a.sub_(V2D.proj(a, b));
    }
  }]);

  return V2D;
}();

var Rect = function Rect(x, y, w, h) {
  _classCallCheck(this, Rect);

  this.x = x;this.y = y;
  this.width = w;this.height = h;
};