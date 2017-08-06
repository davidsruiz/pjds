"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Pulse = function () {
  function Pulse(data) {
    _classCallCheck(this, Pulse);

    this.id = data.id;
    this.team = data.team;

    Object.assign(this, Pulse.stats);

    // needs work
    this.position = new V2D(data.position.x, data.position.y);

    this.velocity = new V2D();
    this.velocity.length = this.SPEED;
    this.velocity.angle = data.angle;

    this.rotation = 0;

    this.radius = 4;

    this.hp = data.hp;

    this.life_counter = 0;
    this.disabled = false;
  }

  _createClass(Pulse, [{
    key: "update",
    value: function update() {
      this.velocity.mul(this.FRICTION);
      this.position.add(this.velocity);
      this.rotation += this.velocity.length / 360 + 0.05;
      if (++this.life_counter > this.LIFESPAN) this.disabled = true;
    }
  }]);

  return Pulse;
}();

Pulse.stats = {
  radius: 8,
  SPEED: 12,
  FRICTION: 0.96,

  // (attraction strength) you put in a distance it gives you the acceleration force
  //   linear: (from 0 at 200px to 0.26 ppf at 30px)
  // INTENSITY_FUNCTION: x => -0.0015*x + 0.3,
  INTENSITY_FUNCTION: function INTENSITY_FUNCTION(x) {
    return Math.sqrt(Math.sqrt(200 - x)) / 2;
  },
  RANGE: 200,

  LIFESPAN: 180
};
//# sourceMappingURL=pulse.js.map