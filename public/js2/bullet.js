'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Bullet = function () {
  function Bullet(data) {
    _classCallCheck(this, Bullet);

    this.id = data.id;
    this.team = data.team;
    this.creator = data.creator; // id

    Object.assign(this, Bullet.stats);

    // needs work
    this.position = new V2D(data.position.x, data.position.y);

    this.velocity = new V2D();
    this.velocity.length = data.speed;
    this.velocity.angle = data.angle;
    this.velocity.add(data.velocity);
    // this.velocity.add(V2D.proj(data.velocity, this.velocity));

    this.radius = data.radius;

    this.hp = data.hp;
    this.LIFESPAN = data.lifespan;

    this.life_counter = 0;
    this.disabled = false;
  }

  _createClass(Bullet, [{
    key: 'update',
    value: function update(dt) {
      this.position.add(this.velocity.mul_(dt));
      if ((this.life_counter += dt) > this.LIFESPAN) {
        this.disabled = true;
        ENV.game.removeBullet(this.id);
      }
    }
  }, {
    key: 'damage',
    value: function damage(hp) {
      // TODO: create a damagable or health-capable protocol ... https://github.com/Gozala/protocol
      this.hp -= hp;
      return this.disabled = this.hp <= 0;
    }
  }]);

  return Bullet;
}();

Bullet.stats = {
  MAX_RADIUS: 12,
  // radius: 8, //8,
  SPEED: 200, //600 //px/s
  velocity_effect: 'combined' // 'combined' or 'projected'
};
//# sourceMappingURL=bullet.js.map