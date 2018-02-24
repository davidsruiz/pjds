'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BasicShip = function () {
  function BasicShip(player) {
    _classCallCheck(this, BasicShip);

    this.owner = player;

    this.disabled = false;
    this.position = new V2D(20, 20);
    this.velocity = new V2D();
    // this.acceleration = new V2D();
    this.acceleration = 0;
    this.angle = 0;
    this.angular_velocity = 0;
    this.angular_acceleration = 0;
    this.health = 1;
    this.radius = 10;
    this.stealth = false;

    Object.assign(this, Ship.baseStats); // write base stats
    Object.assign(this, Ship.type[player.type]); // then overwrite with type specific changes

    this.spawn = V2D.new(this.owner.team.game.mapInfo.spawn[this.owner.team.game.teams.length - 1][this.owner.team.number]).add(DeepSpaceGame.spawn_structure[this.owner.team.players.length - 1][this.owner.team.players.indexOf(this.owner)]);
    this.spawnRotation = this.owner.team.game.mapInfo.spawn[this.owner.team.game.teams.length - 1][this.owner.team.number].rotation;
    this.last_known_position = this.position;
    this.reset();
  }

  _createClass(BasicShip, [{
    key: 'update',
    value: function update(dt) {
      if (!this.disabled) {
        // let inert = this.acceleration.length == 0 ;
        // !inert ? this.velocity.add(this.acceleration.mul_(60*dt)) : this.velocity.mul(Math.pow(this.LINEAR_FRICTION, (60*dt)) ); // TODO revise
        //
        // // if(this.flag) this.velocity.mul(this.flag.drag);
        //
        // let limit = this.LINEAR_VELOCITY_LIMIT; if(this.flag) limit *= this.flag.drag; if(this.charging) limit += this.LINEAR_VELOCITY_LIMIT_EXTENDED;
        // if(this.velocity.length > limit)
        //    this.velocity.length = limit;
        //
        // this.position.add(this.velocity.mul_(dt));
        //
        // this.charging = false;


        // NEW SHIP CONTROLS //

        //// angular motion

        // apply acceleration
        var angularMotion = this.angular_acceleration !== 0;
        angularMotion ? this.angular_velocity += this.angular_acceleration * 60 * dt : this.angular_velocity *= Math.pow(this.ANGULAR_FRICTION, 60 * dt);

        // validate and adjust new velocity
        var percentOfFullSpeed = this.velocity.length / this.LINEAR_VELOCITY_LIMIT;
        var angularVelocityLimit = this.ANGULAR_VELOCITY_LIMIT_MAX - percentOfFullSpeed * (this.ANGULAR_VELOCITY_LIMIT_MAX - this.ANGULAR_VELOCITY_LIMIT_MIN); // lower percent greater ability to turn

        if (this.angular_velocity > angularVelocityLimit) this.angular_velocity = angularVelocityLimit;
        if (this.angular_velocity < -angularVelocityLimit) this.angular_velocity = -angularVelocityLimit;

        this.angle += this.angular_velocity * dt;

        //// linear motion

        // apply acceleration
        var isLinearlyMoving = this.acceleration !== 0;
        var accelerationIsPositive = this.acceleration > 0;
        var accelerationVector = V2D.new({ angle: this.angle, length: 1 });accelerationVector.length = this.acceleration;
        // if(isLinearlyMoving && accelerationIsPositive) this.velocity.add(accelerationVector.mul(60*dt))
        if (isLinearlyMoving) {
          this.velocity.add(accelerationVector.mul(60 * dt));
        } else {
          // apply friction
          this.velocity.mul(Math.pow(this.LINEAR_FRICTION, 60 * dt));
        }

        // validate and adjust new velocity
        var linearVelocityLimit = this.LINEAR_VELOCITY_LIMIT;if (this.flag) linearVelocityLimit *= this.flag.drag;if (this.charging) linearVelocityLimit += this.LINEAR_VELOCITY_LIMIT_EXTENDED;
        if (this.velocity.length > linearVelocityLimit) this.velocity.length = linearVelocityLimit;
        if (this.velocity.length < 0) this.velocity.length = 0;

        // apply velocity
        this.position.add(this.velocity.mul_(dt));

        // misc.
        this.charging = false;
      }
    }
  }, {
    key: 'apply',


    // adjusts forces letting the simulation continue
    value: function apply(data) {
      this.disabled = data.disabled;
      // this.acceleration.set(data.acceleration);
      this.acceleration = data.acceleration;
      this.angular_acceleration = data.angular_acceleration;
      this.angle = data.angle;
      this.health = data.health;
    }
    // replaces the state of the ship

  }, {
    key: 'override',
    value: function override(data) {
      this.position.set(data.position);
      this.last_known_position.set(data.position);
      // this.angle = data.angle;
    }

    // update(data) {
    //   this.disabled = data.disabled;
    //   this.position = data.position;
    //   this.angle = data.angle;
    //   this.health = data.health;
    // }

  }, {
    key: 'reset',
    value: function reset() {
      this.position.set(this.spawn);
      this.velocity.reset();
      this.health = 1;
      this.disabled = false;
    }
  }, {
    key: 'setFlag',
    value: function setFlag(flag) {
      this.flag = flag;
    }
  }, {
    key: 'clearFlag',
    value: function clearFlag() {
      this.flag = undefined;
    }
  }, {
    key: 'front_weapon_position',
    get: function get() {
      var fwp = this.position.copy();var shift = new V2D();shift.length = 8 * 2;shift.angle = this.angle;fwp.add(shift);return fwp;
    }
  }, {
    key: 'back_weapon_position',
    get: function get() {
      var bwp = this.position.copy();var shift = new V2D();shift.length = 8 * 2;shift.angle = this.angle - Math.PI;bwp.add(shift);return bwp;
    }
  }]);

  return BasicShip;
}();

var Ship = function (_BasicShip) {
  _inherits(Ship, _BasicShip);

  function Ship(player) {
    _classCallCheck(this, Ship);

    // this._angle = 0;

    var _this = _possibleConstructorReturn(this, (Ship.__proto__ || Object.getPrototypeOf(Ship)).call(this, player));

    _this.energy = 100;

    _this.block_friction = 0;

    _this.relative_shoot_angle = 0;

    _this.bullets = new Set();
    _this.blocks = new Set();
    _this.subs = new Set();

    _this.intersecting = new Set();

    _this.recoil_counter = 0;
    _this.respawn_counter = 0;
    _this.regen_counter = 0;
    _this.block_recoil_counter = 0;
    _this.sub_recoil_counter = _this.SUB_RECOIL_DELAY;
    _this.flag_recoil_counter = _this.FLAG_RECOIL_DELAY;

    // Object.assign(this, Ship.type[player.type]); >> moved to super!
    _this.hp = _this.HP_CAPACITY;

    // this.spawn =
    //   V2D.new(DeepSpaceGame.maps[0].spawn[this.owner.team.game.teams.length][this.owner.team.number])
    //   .add(DeepSpaceGame.spawn_structure[this.owner.team.players.length - 1][this.owner.team.players.indexOf(this.owner)]);
    // this.reset()
    return _this;
  }

  // export() {
  //   return {
  //     disabled: this.disabled,
  //     position: this.position,
  //     angle: this.angle,
  //     health: this.health
  //   }
  // }

  _createClass(Ship, [{
    key: 'export_update',
    value: function export_update() {
      return {
        disabled: this.disabled,
        acceleration: this.acceleration,
        angular_acceleration: this.angular_acceleration,
        angle: this.angle,
        health: this.health
      };
    }
  }, {
    key: 'export_override',
    value: function export_override() {
      return {
        position: this.position //,
        // angle: this.angle
      };
    }

    // get angle() { return this._angle }
    // set angle(angle) { if(this._angle != angle) this.recoil_counter = this.ATTACK_RECOIL_DELAY; this._angle = angle; }

  }, {
    key: 'update',
    value: function update(dt) {
      var c = this.charging;
      _get(Ship.prototype.__proto__ || Object.getPrototypeOf(Ship.prototype), 'update', this).call(this, dt);
      this.charging = c;
      this.last_known_position = this.position;

      if (!this.disabled) {
        this.regen_counter += dt;

        this.charge(this.IDLE_ENERGY_REGEN_RATE * dt);
        if (this.charging) {
          this.charge(this.ACTIVE_ENERGY_REGEN_RATE * dt);
          if (this.regen_counter > this.REGEN_DELAY) this.heal(this.REGEN_RATE * dt);
        }this.charging = false;
        // if(this.charging && !this.stealth) this.charge(this.ACTIVE_ENERGY_REGEN_RATE*dt);
      } else {
        if ((this.respawn_counter += dt) > this.RESPAWN_DELAY) {
          this.respawn_counter = 0;
          this.reset();
        }
      }
      if (!this.flag) this.flag_recoil_counter += dt;
      this.recoil_counter += dt;this.block_recoil_counter += dt;this.sub_recoil_counter += dt;
    }
  }, {
    key: 'canShoot',
    value: function canShoot() {

      var recoilHasPast = this.recoil_counter > this.ATTACK_RECOIL_DELAY;
      var hasEnoughEnergy = this.canDrain(this.ATTACK_HP * this.ATTACK_ENERGY_FRACTION_HP);

      return recoilHasPast && hasEnoughEnergy;
    }
  }, {
    key: 'didShoot',
    value: function didShoot(id) {

      // list new bullet id
      this.bullets.add(id);

      // drain energy
      this.drain(this.ATTACK_HP * this.ATTACK_ENERGY_FRACTION_HP);

      // reset recoil counter
      this.recoil_counter = 0;
    }
  }, {
    key: 'damage',
    value: function damage(hp) {
      this.hp -= hp;this.regen_counter = 0;
      if (this.hp <= 0) this.disabled = true;
      return this.disabled;
    }
  }, {
    key: 'heal',
    value: function heal(hp) {
      this.hp += hp;
      if (this.hp > this.HP_CAPACITY) this.hp = this.HP_CAPACITY;
    }
  }, {
    key: 'canBlock',
    value: function canBlock() {

      var hasNoFlag = !this.flag;
      var recoilHasPast = this.block_recoil_counter > this.BLOCK_RECOIL_DELAY;
      var hasEnoughEnergy = this.canDrain(this.BLOCK_ENERGY_COST);

      return hasNoFlag && recoilHasPast && hasEnoughEnergy;
    }
  }, {
    key: 'didBlock',
    value: function didBlock(id) {

      // list new block id
      this.blocks.add(id);

      // drain energy
      this.drain(this.BLOCK_ENERGY_COST);

      // reset recoil counter
      this.block_recoil_counter = 0;
    }
  }, {
    key: 'oldestBlockID',
    value: function oldestBlockID() {
      return this.blocks.first();
    }
  }, {
    key: 'canSub',
    value: function canSub() {

      var subLimitHasNotBeenReached = this.subs.size < this.SUB_CAPACITY;
      var recoilHasPast = this.sub_recoil_counter > this.SUB_RECOIL_DELAY;
      var hasEnoughEnergy = this.canDrain(this.SUB_ENERGY_COST);

      return subLimitHasNotBeenReached && recoilHasPast && hasEnoughEnergy;
    }
  }, {
    key: 'didSub',
    value: function didSub(id) {

      // list new sub id
      this.subs.add(id);

      // drain energy
      this.drain(this.SUB_ENERGY_COST);

      // reset recoil counter
      this.sub_recoil_counter = 0;
    }
  }, {
    key: 'charge',


    // adds to energy reserve
    value: function charge(energy) {
      this.energy += energy;
      if (this.energy > 100) this.energy = 100;
    }
  }, {
    key: 'canDrain',
    value: function canDrain(energy) {
      return !(this.energy - energy < 0);
    }

    // takes if possible, returns a result as bool

  }, {
    key: 'drain',
    value: function drain(energy) {
      if (this.flag) return true;
      if (this.energy - energy < 0) return false;
      this.energy -= energy;return true;
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.angle = this.spawnRotation;
      this.position.set(this.spawn);
      this.velocity.reset();
      this.energy = this.ENERGY_CAPACITY;
      this.health = 1;
      this.disabled = false;
      this.flag = undefined;
      this.sub_recoil_counter = this.SUB_RECOIL_DELAY;

      this.owner.team.game.network.sendShipOverride(this.export_override());
    }
  }, {
    key: 'canPickupFlag',
    value: function canPickupFlag() {

      var recoilHasPassed = this.flag_recoil_counter > this.FLAG_RECOIL_DELAY;

      return recoilHasPassed;
    }
  }, {
    key: 'didPickupFlag',
    value: function didPickupFlag() {
      this.flag_recoil_counter = 0;
    }
  }, {
    key: 'health',
    get: function get() {
      return this.hp / this.HP_CAPACITY;
    },
    set: function set(percent) {
      this.hp = percent * this.HP_CAPACITY;
    }
  }, {
    key: 'shoot_angle',
    get: function get() {
      return this.relative_shoot_angle + this.angle;
    }
  }, {
    key: 'shoot_position',
    get: function get() {
      var fwp = this.position.copy();var shift = new V2D();shift.length = 8 * 2;shift.angle = this.shoot_angle;fwp.add(shift);return fwp;
    }
  }, {
    key: 'shot_RNG',
    get: function get() {
      return this.ATTACK_SPREAD / 2 * (Math.random() * 2 - 1);
    }
  }, {
    key: 'reachedBlockLimit',
    get: function get() {
      return this.blocks.size >= this.BLOCK_CAPACITY;
    }
  }, {
    key: 'subPercent',
    get: function get() {
      if (this.sub_recoil_counter + 1 > this.SUB_RECOIL_DELAY) {
        return 1;
      } else if (this.sub_recoil_counter > 0) {
        return (this.sub_recoil_counter + 1) / this.SUB_RECOIL_DELAY;
      } else {
        return 0;
      }
    }
  }]);

  return Ship;
}(BasicShip);

Ship.type = [{
  type: 'standard',

  SUB_TYPE: 'attractor',
  SUB_RECOIL_DELAY: 0.5, //s
  SUB_ENERGY_COST: 45 // ep
}, {
  type: 'rate',

  RESPAWN_DELAY: 3, // 4

  ATTACK_HP: 6, // 8
  ATTACK_RECOIL_DELAY: 1 / 6, // (1/4)
  ATTACK_RADIUS: 6, // 8

  // BLOCK_HP_CAPACITY: 6, // 8
  BLOCK_RECOIL_DELAY: 1 / 5, // (1/6)

  SUB_TYPE: 'missile',
  SUB_RECOIL_DELAY: 1, //s 2
  SUB_CAPACITY: 1,
  SUB_ENERGY_COST: 70
}, {
  type: 'speed',

  HP_CAPACITY: 18, // 20

  LINEAR_VELOCITY_LIMIT: 140, // 120
  // LINEAR_ACCELERATION_LIMIT: ,

  ATTACK_HP: 7, // 8
  ATTACK_RADIUS: 10, // 8
  ATTACK_SPREAD: 2 * Math.PI * 0.02, // (0.01)
  ATTACK_LIFESPAN: 1, // 1.6

  // BLOCK_RECOIL_DELAY: ,

  SUB_TYPE: 'repulsor',
  SUB_RECOIL_DELAY: 0.5, //s
  SUB_ENERGY_COST: 30
}, {
  type: 'defense',

  HP_CAPACITY: 32, // 20

  LINEAR_VELOCITY_LIMIT: 100, // 120

  ATTACK_HP: 8, // 8
  ATTACK_RECOIL_DELAY: 1 / 3, // (1/4)
  ATTACK_LIFESPAN: 1.8, // 1.6

  REGEN_RATE: 10.8, // 24

  BLOCK_RECOIL_DELAY: 1 / 6, // (1/6)
  // BLOCK_ENERGY_COST: 10, // 8

  SUB_TYPE: 'stealth_cloak',
  SUB_RECOIL_DELAY: 1, //s
  SUB_CAPACITY: 1,
  SUB_ENERGY_COST: 90 // 70 when no charge upon stealth
}, {
  type: 'damage',

  HP_CAPACITY: 22, // 20

  LINEAR_VELOCITY_LIMIT: 100, // 120

  ATTACK_HP: 24, // 8
  ATTACK_RECOIL_DELAY: 1 / 1.2, // (1/4)
  ATTACK_RADIUS: 12, // 8
  ATTACK_LIFESPAN: 1.6, // 2.2
  ATTACK_SPEED: 140, // 200

  SUB_TYPE: 'block_bomb',
  SUB_RECOIL_DELAY: 0.5, //s
  SUB_ENERGY_COST: 50
}];

// BASE STATS
// measurements will be expressed in:
//  time: s
//  distance: px
//  velocity: px / s
//  acceleration: px / s*s
Ship.baseStats = {
  type: 'base',

  HP_CAPACITY: 40, //hp
  ANGULAR_FRICTION: 0.9, //%
  ANGULAR_VELOCITY_LIMIT_MIN: Math.radians(150), //deg/s
  ANGULAR_VELOCITY_LIMIT_MAX: Math.radians(180), //deg/s
  ANGULAR_ACCELERATION_LIMIT: Math.radians(8), //deg/s*s
  LINEAR_FRICTION: 0.9, //%
  LINEAR_VELOCITY_LIMIT: 240, //188 //px/s (3px/f)
  LINEAR_ACCELERATION_LIMIT: 10, //px/s*s (0.26px/f*f)
  LINEAR_VELOCITY_LIMIT_EXTENDED: 50, //px/s
  LINEAR_VELOCITY_LIMIT_BACKWARD: 60, //px/s

  // HP_CAPACITY: 20, //hp
  // ANGULAR_FRICTION: 0.9, //%
  // ANGULAR_VELOCITY_LIMIT_MIN: Math.radians(60), //deg/s
  // ANGULAR_VELOCITY_LIMIT_MAX: Math.radians(120), //deg/s
  // ANGULAR_ACCELERATION_LIMIT: Math.radians(8), //deg/s*s
  // LINEAR_FRICTION: 0.80, //%
  // LINEAR_VELOCITY_LIMIT: 120, //188 //px/s (3px/f)
  // LINEAR_ACCELERATION_LIMIT: 10, //px/s*s (0.26px/f*f)
  // LINEAR_VELOCITY_LIMIT_EXTENDED: 50, //px/s


  RESPAWN_DELAY: 4, //s (240f)

  ATTACK_HP: 8, //hp
  ATTACK_RECOIL_DELAY: 1 / 4, //8 //b/s (8f == 7.5b/s)
  ATTACK_RADIUS: 24, //px
  ATTACK_SPREAD: 2 * Math.PI * 0.01, // (1%) angle sweep in radians,
  ATTACK_LIFESPAN: 1.6, //0.5 //s,
  ATTACK_ENERGY_FRACTION_HP: 0.3, //%
  ATTACK_SPEED: 400, //px/s

  REGEN_DELAY: 3, //s (180f)
  REGEN_RATE: 24, //hp/s (0.4hp/f)

  BLOCK_CAPACITY: 500, //#
  BLOCK_HP_CAPACITY: 20, //hp
  BLOCK_SPREAD: 2 * Math.PI * 0.1, // 0.2 (30%) angle sweep in radians.
  BLOCK_RECOIL_DELAY: 1 / 4, //b/s (8f == 7.5b/s)
  BLOCK_ENERGY_COST: 8, //ep

  SUB_TYPE: 'block_bomb',
  SUB_RECOIL_DELAY: 0.5, //s
  SUB_CAPACITY: 5, //#
  SUB_ENERGY_COST: 40, //ep

  ENERGY_CAPACITY: 100, // (ep)
  IDLE_ENERGY_REGEN_RATE: 4.2, // of automatic energy per second (ep/s)
  ACTIVE_ENERGY_REGEN_RATE: 24, // while charging energy per second (ep/s)

  FLAG_RECOIL_DELAY: 1 // s
};

// SPECIALS??? LARGE HEAVY BLOCK, or INTEL
//# sourceMappingURL=ship.js.map