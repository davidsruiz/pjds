"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Physics = function () {
  function Physics() {
    _classCallCheck(this, Physics);
  }

  _createClass(Physics, null, [{
    key: "distance",
    value: function distance(p1, p2) {
      return Math.sqrt(Math.sqr(p2.x - p1.x) + Math.sqr(p2.y - p1.y));
    }
  }, {
    key: "doTouch",
    value: function doTouch(a, b) {
      return Physics.distance(a.position, b.position) < a.radius + b.radius;
    }

    // circular bounce w/ one static

  }, {
    key: "bounce",
    value: function bounce(fluid, stationary, force) {
      var vel = fluid.velocity.length,

      // absorbed = 0.8,
      // distance = Physics.distance(fluid.position, stationary.position),
      // collision_distance = fluid.radius + stationary.radius,
      force_vector = fluid.position.copy().sub(stationary.position);
      force_vector.length = force || 300; //px/s
      // force_vector.length = vel * bounce_multiplier;
      fluid.velocity.add(force_vector);
    }

    // static bounce_off_line(circle, line_P1, line_P2) {
    //   let line = line_P2.sub_(line_P1);
    //   let rejection = V2D.rejc(circle.position.sub_(line_P1), line);
    //   if(true) {
    //   // if(rejection.length < circle.radius) {
    //     rejection.mul(-2).length = circle.velocity.length;
    //     circle.velocity.set(rejection);
    //   }
    // }

  }, {
    key: "overlap",
    value: function overlap(a, b) {
      return (a.radius + b.radius - Physics.distance(a.position, b.position)) / (a.radius + b.radius);
    }
  }]);

  return Physics;
}();
//# sourceMappingURL=physics.js.map