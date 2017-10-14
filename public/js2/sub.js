"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Sub = function Sub() {
  _classCallCheck(this, Sub);
};

var Attractor = function () {
  function Attractor(data) {
    _classCallCheck(this, Attractor);

    this.id = data.id;
    this.team = data.team;
    this.type = data.type;

    Object.assign(this, Attractor.stats);

    // needs work
    this.position = new V2D(data.position.x, data.position.y);

    this.velocity = new V2D();
    this.velocity.length = this.SPEED;
    this.velocity.angle = data.angle;

    this.rotation = 0;

    this.radius = 4;

    // this.hp = data.hp;

    this.life_counter = 0;
    this.disabled = false;
  }

  _createClass(Attractor, [{
    key: "update",
    value: function update(dt) {
      this.velocity.mul(Math.pow(this.FRICTION, 60 * dt));
      this.position.add(this.velocity.mul_(dt));
      this.rotation += this.velocity.length / 21600 + 0.05;
      if ((this.life_counter += dt) > this.LIFESPAN) {
        this.disabled = true;
        ENV.game.removeSub(this.id);
      }
    }
  }]);

  return Attractor;
}();

Attractor.stats = {
  radius: 4,
  SPEED: 720, //px/s
  FRICTION: 0.96,

  // (attraction strength) you put in a distance it gives you the acceleration force
  // INTENSITY_FUNCTION:
  // x => fourth root of (a-(x * b)) over 2
  // where: a is (y-intercept * 2)^4
  //        b is a / x-intercept
  // y-intercept (max effect) is 120px/s and x-intercept (range) is 200
  RANGE: 240,
  MAX_INTENSITY: 2,
  INTENSITY_FUNCTION: function INTENSITY_FUNCTION(x) {
    return Math.sqrt(Math.sqrt(Attractor.stats._A - x * Attractor.stats._B)) / 2 * 20;
  },


  LIFESPAN: 4 //s
};

Attractor.stats._A = Math.pow(Attractor.stats.MAX_INTENSITY * 2, 4);
Attractor.stats._B = Attractor.stats._A / Attractor.stats.RANGE;

var Repulsor = function () {
  function Repulsor(data) {
    _classCallCheck(this, Repulsor);

    this.id = data.id;
    this.team = data.team;
    this.type = data.type;

    Object.assign(this, Repulsor.stats);

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

  _createClass(Repulsor, [{
    key: "update",
    value: function update(dt) {
      this.velocity.mul(Math.pow(this.FRICTION, 60 * dt));
      this.position.add(this.velocity.mul_(dt));
      this.rotation += this.velocity.length / 21600 + 0.05;
      if ((this.life_counter += dt) > this.LIFESPAN) {
        this.disabled = true;
        ENV.game.removeSub(this.id);
      }
    }
  }]);

  return Repulsor;
}();

Repulsor.stats = {
  radius: 4,
  SPEED: 600, //px/s
  FRICTION: 0.96,

  // (repulsion strength) you put in a distance it gives you the acceleration force
  // INTENSITY_FUNCTION: x => fourth root of (a-(x * b)) over 2
  // y-intercept (max effect) is 120px/s and x-intercept (range) is 160
  // a is 256 and b is
  RANGE: 160,
  MAX_INTENSITY: 2,
  INTENSITY_FUNCTION: function INTENSITY_FUNCTION(x) {
    return Math.sqrt(Math.sqrt(Repulsor.stats._A - x * Repulsor.stats._B)) / 2 * 20;
  },


  LIFESPAN: 3 //s
};

Repulsor.stats._A = Math.pow(Repulsor.stats.MAX_INTENSITY * 2, 4);
Repulsor.stats._B = Repulsor.stats._A / Repulsor.stats.RANGE;

var BlockBomb = function () {
  function BlockBomb(data) {
    _classCallCheck(this, BlockBomb);

    this.id = data.id;
    this.team = data.team;
    this.type = data.type;

    Object.assign(this, BlockBomb.stats);

    // needs work
    this.position = new V2D(data.position.x, data.position.y);

    this.velocity = new V2D();
    this.velocity.length = this.SPEED;
    this.velocity.angle = data.angle;

    this.rotation = 0;

    this.radius = 4;

    this.life_counter = 0;
    this.disabled = false;
  }

  _createClass(BlockBomb, [{
    key: "update",
    value: function update(dt) {
      // if(this.disabled) ENV.game.endSub(this.id);
      this.velocity.mul(Math.pow(this.FRICTION, 60 * dt));
      this.position.add(this.velocity.mul_(dt));
      // this.rotation += ((this.velocity.length / 360) + 0.05);
      this.rotation += this.velocity.length / 2400 + 0.0;
      if ((this.life_counter += dt) > this.LIFESPAN) {
        this.exploding = true;
      }
    }
  }, {
    key: "explode",
    value: function explode() {
      // TODO PLEASE FIX
      this.exploding = true;
      // ENV.game.removeSub(this.id);
    }
  }]);

  return BlockBomb;
}();

BlockBomb.stats = {
  radius: 10,
  SPEED: 360, //px/s
  FRICTION: 0.99,

  EXPLOSION_RANGE: 120,
  EXPLOSION_DAMAGE_FUNCTION: function EXPLOSION_DAMAGE_FUNCTION(x) {
    return (8000 / (BlockBomb.stats._A * x + 100) - 20) * 3;
  }, // 60hp at contact and 0hp at range px

  LIFESPAN: 2.4 //s
};

BlockBomb.stats._A = 300 / Repulsor.stats.RANGE;

var StealthCloak = function () {
  function StealthCloak(data) {
    _classCallCheck(this, StealthCloak);

    this.id = data.id;
    this.type = data.type;
    this.team = data.team;

    this.target = ENV.game.players.get(data.player);

    Object.assign(this, StealthCloak.stats);

    this.life_counter = 0;
    this.disabled = false;
  }

  _createClass(StealthCloak, [{
    key: "update",
    value: function update(dt) {
      var dead = void 0;
      if (this.target) {
        dead = (this.life_counter += dt) > this.LIFESPAN || this.target.ship.disabled || this.target.ship.flag;
        this.target.ship.stealth = !dead;
      }
      if (dead) {
        // ENV.game.removeSub(this.id);
      }
      this.disabled = dead;
    }
  }]);

  return StealthCloak;
}();

StealthCloak.stats = {
  LIFESPAN: 6 //s
};

var Missile = function () {
  function Missile(data) {
    _classCallCheck(this, Missile);

    this.id = data.id;
    this.team = data.team;
    this.type = data.type;

    this.target = null; // ship

    Object.assign(this, Missile.stats);

    this.position = new V2D(data.position.x, data.position.y);

    this.velocity = new V2D();
    this.velocity.length = this.SPEED;
    this.velocity.angle = data.angle;

    this.rotation = this.velocity.angle;

    this.life_counter = 0;
    this.disabled = false;
  }

  _createClass(Missile, [{
    key: "update",
    value: function update(dt) {

      if (this.target) {
        // http://stackoverflow.com/questions/1878907/the-smallest-difference-between-2-angles?noredirect=1&lq=1
        // x is the target angle. y is the source or starting angle
        // It returns the signed delta angle.
        // var x = this.target.position.angle, y = this.position.angle;
        // var delta_angle = Math.atan2(Math.sin(x-y), Math.cos(x-y)); log(`delta_angle: ${delta_angle}`)


        var direction = this.target.position.copy().sub(this.position);

        var x = direction.angle,
            y = this.rotation;
        var delta_angle = Math.atan2(Math.sin(x - y), Math.cos(x - y)); // log(`delta_angle: ${delta_angle}`)

        // var delta_rotation = direction.angle - this.rotation; log(Math.degrees(delta_rotation));
        if (delta_angle > this.MAX_TURN_SPEED * dt) delta_angle = this.MAX_TURN_SPEED * dt;
        if (delta_angle < -this.MAX_TURN_SPEED * dt) delta_angle = -this.MAX_TURN_SPEED * dt;
        this.velocity.angle = this.rotation + delta_angle;
      }

      this.position.add(this.velocity.mul_(dt));
      this.rotation = this.velocity.angle;

      if ((this.life_counter += dt) > this.LIFESPAN) {
        this.exploding = true;
      }
    }
  }, {
    key: "explode",
    value: function explode() {
      this.exploding = true;
      // ENV.game.removeSub(this.id);
    }
  }]);

  return Missile;
}();

Missile.stats = {
  radius: 12,
  SPEED: 220, //px/s
  hp: 16,
  MAX_TURN_SPEED: Math.PI / 2, // radians/s

  VISION_RANGE: 400,
  EXPLOSION_RANGE: 30, // 200

  LIFESPAN: 2.6 //s
};