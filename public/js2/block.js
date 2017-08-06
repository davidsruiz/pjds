"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Block = function () {
  function Block(data) {
    _classCallCheck(this, Block);

    this.id = data.id;
    this.team = data.team;

    Object.assign(this, Block.stats);

    // needs work
    this.position = new V2D(data.position.x, data.position.y);

    this.velocity = new V2D();
    this.velocity.length = data.speed;
    this.velocity.angle = data.angle;

    this.radius = data.radius;
    this.locked = false;

    this.hp = this.HP_CAPACITY = data.hp;

    this.life_counter = 0;
    this.disabled = false;
  }

  _createClass(Block, [{
    key: "update",
    value: function update(dt) {
      if (!this.locked) {
        this.velocity.mul(Math.pow(this.FRICTION, 60 * dt));
        this.position.add(this.velocity.mul_(dt));

        // this.radius = (this.velocity.length * 0.9 + 3); //(8 -> 3)
        this.scale = (this.velocity.length * 0.006 + 3) / 10; //(.8 -> .3)

        // if(this.velocity.length < this.LOWER_VELOCITY_LIMIT) this.lock();
        if ((this.life_counter += dt) > this.LIFESPAN) this.lock();
      }
      // if(++this.life_counter > this.LIFESPAN) this.disabled = true;
    }
  }, {
    key: "lock",
    value: function lock() {
      this.scale = 1;
      // this.radius = 10;
      this.qualified = true;
    }
  }, {
    key: "damage",
    value: function damage(hp) {
      this.hp -= hp;
      if (this.hp <= 0) this.disabled = true;
      if (this.disabled) ENV.game.endBlock(this.id);
      return this.disabled;
    }
  }, {
    key: "health",
    get: function get() {
      return this.hp / this.HP_CAPACITY;
    },
    set: function set(percent) {
      this.hp = percent * this.HP_CAPACITY;
    }
  }]);

  return Block;
}();

Block.stats = {
  MIN_RADIUS: 45, //18, //16, //10,
  MAX_RADIUS: 70, //36, //30, //20,
  SPEED: 440,
  MIN_SPEED: 360,
  MAX_SPEED: 900,
  FRICTION: 0.96,
  LOWER_VELOCITY_LIMIT: 30,
  // DRIFT: 30,
  LIFESPAN: 0.6, //s

  DISRUPTIVE_FRICTION: 0.1
};
//# sourceMappingURL=block.js.map