
class BasicShip {

  constructor(player) {
    this.owner = player;

    this.disabled = false;
    this.position = new V2D(20, 20);
        this.velocity = new V2D();
        this.acceleration = new V2D();
    this.angle = 0;
        this.angular_velocity = 0;
        this.angular_acceleration = 0;
    this.health = 1;
    this.radius = 10;

    this.assignAttrFrom(Ship.type[player.type]);

    this.spawn =
      V2D.new(DeepSpaceGame.maps[0].spawn[this.owner.team.game.teams.length][this.owner.team.number])
      .add(DeepSpaceGame.spawn_structure[this.owner.team.players.length - 1][this.owner.team.players.indexOf(this.owner)]);
    this.reset()
  }

  update() {
    if(!this.disabled) {
      this.velocity.mul((this.LINEAR_FRICTION) - ((this.flag) ? this.flag.drag : 0));
      this.velocity.add(this.acceleration);
      this.position.add(this.velocity);

      if(this.velocity.length > this.LINEAR_VELOCITY_LIMIT)
         this.velocity.length = this.LINEAR_VELOCITY_LIMIT;

      this.angular_velocity += this.angular_acceleration
      this.angular_velocity *= this.ANGULAR_FRICTION - ((this.flag) ? this.flag.drag : 0)
      this.angle += this.angular_velocity

      if(this.angular_velocity > this.ANGULAR_VELOCITY_LIMIT)
         this.angular_velocity = this.ANGULAR_VELOCITY_LIMIT;
      if(this.angular_velocity <-this.ANGULAR_VELOCITY_LIMIT)
         this.angular_velocity =-this.ANGULAR_VELOCITY_LIMIT;
    }
  }

  // adjusts forces letting the simulation continue
  apply(data) {
    this.disabled = data.disabled;
    this.acceleration = data.acceleration;
    this.angular_acceleration = data.angular_acceleration;
    this.health = data.health;
  }
  // replaces the state of the ship
  override(data) {
    this.position.set(data.position);
    this.angle = data.angle;
  }

  // update(data) {
  //   this.disabled = data.disabled;
  //   this.position = data.position;
  //   this.angle = data.angle;
  //   this.health = data.health;
  // }

  reset() {
    this.position.set(this.spawn);
    this.velocity.reset()
    this.health = 1;
    this.disabled = false;
  }

  pickup(flag) { this.flag = flag }
  drop(flag) { this.flag = undefined }
}

class Ship extends BasicShip {

  constructor(player) {
    super(player);

    this.block_friction = 0;

    this.bullets = new Set();
    this.blocks = new Set();
    this.pulses = new Set();

    this.recoil_counter = 0;
    this.respawn_counter = 0;
    this.regen_counter = 0;
    this.block_recoil_counter = 0;
    this.pulse_recoil_counter = 0;

    // this.assignAttrFrom(Ship.type[player.type]);
    this.hp = this.HP_CAPACITY;

    // this.spawn =
    //   V2D.new(DeepSpaceGame.maps[0].spawn[this.owner.team.game.teams.length][this.owner.team.number])
    //   .add(DeepSpaceGame.spawn_structure[this.owner.team.players.length - 1][this.owner.team.players.indexOf(this.owner)]);
    // this.reset()
  }

  // export() {
  //   return {
  //     disabled: this.disabled,
  //     position: this.position,
  //     angle: this.angle,
  //     health: this.health
  //   }
  // }

  export_update() {
    return {
      disabled: this.disabled,
      acceleration: this.acceleration,
      angular_acceleration: this.angular_acceleration,
      health: this.health
    }
  }

  export_override() {
    return {
      position: this.position,
      angle: this.angle
    }
  }

  get health() { return this.hp / this.HP_CAPACITY }
  set health(percent) { this.hp = percent * this.HP_CAPACITY }

  get front_weapon_position() { var fwp = this.position.copy(); var shift = new V2D(); shift.length = 8*2; shift.angle = this.angle; fwp.add(shift); return fwp; }
  get back_weapon_position() { var bwp = this.position.copy(); var shift = new V2D(); shift.length = 8*2; shift.angle = this.angle - Math.PI; bwp.add(shift); return bwp }

  update() {
    super.update();
    if(!this.disabled) {
      if(this.regen_counter++ > this.REGEN_DELAY) this.heal(this.REGEN_RATE);
    } else {
      if(++this.respawn_counter > this.RESPAWN_DELAY) {
        this.respawn_counter = 0;
        this.reset();
      }
    }
    this.recoil_counter++; this.block_recoil_counter++; this.pulse_recoil_counter++;
  }

  shoot() {
    if(this.recoil_counter > this.RECOIL_DELAY) {

      var id = NetworkHelper.bullet_create(this);

      this.bullets.add(id);
      this.recoil_counter = 0;
      ;
    }
  }

  damage(hp) {
    this.hp -= hp; this.regen_counter = 0;
    if(this.hp <= 0) this.disabled = true;
    return this.disabled;
  }

  heal(hp) {
    this.hp += hp;
    if(this.hp > this.HP_CAPACITY) this.hp = this.HP_CAPACITY;
  }

  block() {
    if(this.block_recoil_counter > this.BLOCK_RECOIL_DELAY) {
      if(this.blocks.size > this.BLOCK_CAPACITY)
        NetworkHelper.out_block_destroy(this.blocks.draw());

      var id = NetworkHelper.out_block_create(this);
      this.blocks.add(id);
      this.block_recoil_counter = 0;
    }
  }

  pulse() {
    if(!(this.pulses.size < this.PULSE_CAPACITY)) return;
    if(this.pulse_recoil_counter > this.PULSE_RECOIL_DELAY) {
      // if(!(this.pulses.size > this.PULSE_CAPACITY))
      //   NetworkHelper.out_pulse_destroy(this.pulses.draw());

      var id = NetworkHelper.out_pulse_create(this);
      this.pulses.add(id);
      this.pulse_recoil_counter = 0;
    }
    // if(this.pulses.size > 0) return;
    // var id = NetworkHelper.out_pulse_create(this);
    // this.pulses.add(id);
  }


  reset() {
    this.position.set(this.spawn);
    this.velocity.reset()
    this.health = 1;
    this.disabled = false;

    NetworkHelper.out_ship_override(this.export_override());
  }

}

Ship.type = {
  "balanced" : {
    type: 'balanced',

    HP_CAPACITY: 24,
    ANGULAR_FRICTION: 0.8,//0.9,
    ANGULAR_VELOCITY_LIMIT: 0.12,
    ANGULAR_ACCELERATION_LIMIT: 0.04,//0.016,
    LINEAR_FRICTION: 0.9,//0.97,
    LINEAR_VELOCITY_LIMIT: 8,//6,//5,
    LINEAR_ACCELERATION_LIMIT: 0.6,//0.22, //0.18,
    SHOT_SPREAD: (2 * Math.PI) * (0.01), // (1%) angle sweep in radians.

    RECOIL_DELAY: 8,
    RESPAWN_DELAY: 120,

    ATTACK: 8,
    ATTACK_LIFESPAN: 60,

    REGEN_DELAY: 180,
    REGEN_RATE: 0.4, // hp/frame

    BLOCK_CAPACITY: 120, //32,
    BLOCK_HP_CAPACITY: 24,
    BLOCK_SPREAD: (2 * Math.PI) * (0.1), // (10%) angle sweep in radians.
    BLOCK_RECOIL_DELAY: 3,

    PULSE_RECOIL_DELAY: 120,
    PULSE_CAPACITY: 1
  },

  "speed" : {
    type: 'speed',

    HP_CAPACITY: 18, // 24
    ANGULAR_FRICTION: 0.9,
    ANGULAR_VELOCITY_LIMIT: 0.12,
    ANGULAR_ACCELERATION_LIMIT: 0.02,//0.016,
    LINEAR_FRICTION: 0.97,
    LINEAR_VELOCITY_LIMIT: 7.6, // 6
    LINEAR_ACCELERATION_LIMIT: 0.26, // 0.22
    SHOT_SPREAD: (2 * Math.PI) * (0.005), // (0.5%) angle sweep in radians.

    RECOIL_DELAY: 10, // 8
    RESPAWN_DELAY: 120,

    ATTACK: 7, // 8
    ATTACK_LIFESPAN: 60,

    REGEN_DELAY: 180,
    REGEN_RATE: 0.4, // hp/frame

    BLOCK_CAPACITY: 120, // 120
    BLOCK_HP_CAPACITY: 24,
    BLOCK_SPREAD: (2 * Math.PI) * (0.1), // (10%) angle sweep in radians.
    BLOCK_RECOIL_DELAY: 3,

    PULSE_RECOIL_DELAY: 120,
    PULSE_CAPACITY: 1
  },

  "defense" : {
    type: 'defense',

    HP_CAPACITY: 30, // 24
    ANGULAR_FRICTION: 0.9,
    ANGULAR_VELOCITY_LIMIT: 0.12,
    ANGULAR_ACCELERATION_LIMIT: 0.02,//0.016,
    LINEAR_FRICTION: 0.97,
    LINEAR_VELOCITY_LIMIT: 4, // 6
    LINEAR_ACCELERATION_LIMIT: 0.18, // 0.22
    SHOT_SPREAD: (2 * Math.PI) * (0.01), // (1%) angle sweep in radians.

    RECOIL_DELAY: 8,
    RESPAWN_DELAY: 120,

    ATTACK: 8,
    ATTACK_LIFESPAN: 60,

    REGEN_DELAY: 180,
    REGEN_RATE: 0.4, // hp/frame

    BLOCK_CAPACITY: 120,
    BLOCK_HP_CAPACITY: 30, // 24
    BLOCK_SPREAD: (2 * Math.PI) * (0.1), // (10%) angle sweep in radians.
    BLOCK_RECOIL_DELAY: 3,

    PULSE_RECOIL_DELAY: 120,
    PULSE_CAPACITY: 1
  },

  "rate" : {
    type: 'rate',

    HP_CAPACITY: 20, // 24
    ANGULAR_FRICTION: 0.9,
    ANGULAR_VELOCITY_LIMIT: 0.12,
    ANGULAR_ACCELERATION_LIMIT: 0.02,//0.016,
    LINEAR_FRICTION: 0.97,
    LINEAR_VELOCITY_LIMIT: 5.2, // 6
    LINEAR_ACCELERATION_LIMIT: 0.22, // 0.22
    SHOT_SPREAD: (2 * Math.PI) * (0.05), // (5%) angle sweep in radians.

    RECOIL_DELAY: 5, // 8
    RESPAWN_DELAY: 120,

    ATTACK: 4, // 8
    ATTACK_LIFESPAN: 40, // 120

    REGEN_DELAY: 180,
    REGEN_RATE: 0.4, // hp/frame

    BLOCK_CAPACITY: 60, // 120
    BLOCK_HP_CAPACITY: 24,
    BLOCK_SPREAD: (2 * Math.PI) * (0.15), // (15%) angle sweep in radians. (10%)
    BLOCK_RECOIL_DELAY: 2, // 3

    PULSE_RECOIL_DELAY: 120,
    PULSE_CAPACITY: 1
  },

  "damage" : {
    type: 'damage',

    HP_CAPACITY: 24,
    ANGULAR_FRICTION: 0.9,
    ANGULAR_VELOCITY_LIMIT: 0.12,
    ANGULAR_ACCELERATION_LIMIT: 0.02,
    LINEAR_FRICTION: 0.97,
    LINEAR_VELOCITY_LIMIT: 5, // 6
    LINEAR_ACCELERATION_LIMIT: 0.18, // 0.22
    SHOT_SPREAD: (2 * Math.PI) * (0.01), // (1%) angle sweep in radians.

    RECOIL_DELAY: 8,
    RESPAWN_DELAY: 120,

    ATTACK: 10,
    ATTACK_LIFESPAN: 60,

    REGEN_DELAY: 180,
    REGEN_RATE: 0.4, // hp/frame

    BLOCK_CAPACITY: 120,
    BLOCK_HP_CAPACITY: 12, // 24
    BLOCK_SPREAD: (2 * Math.PI) * (0.2), // (20%) angle sweep in radians.
    BLOCK_RECOIL_DELAY: 5, // 3

    PULSE_RECOIL_DELAY: 120,
    PULSE_CAPACITY: 1
  }
}
//
//
//
// class NetworkShip {
//
//   constructor(player) {
//     this.owner = player;
//
//     this.disabled = false;
//     this.position = new V2D(20, 20);
//     this.receviedPosition = this.position;
//     this.angle = 0;
//     this.receviedAngle = this.angle;
//     this.health = 1;
//
//     this.radius = 10;
//
//     // movement
//     this.velocity = new V2D();
//     this.acceleration = new V2D();
//
//     this.angular_velocity = 0;
//     this.angular_acceleration = 0;
//
//     this.assignAttrFrom(Ship.type.balanced);
//   }
//
//   update(data) {
//     this.disabled = data.disabled;
//     this.position = data.position;
//     this.angle = data.angle;
//     this.health = data.health;
//   }
//
//   compute() {
//     if(!this.disabled) {
//       this.velocity.mul(this.LINEAR_FRICTION);
//       this.velocity.add(this.acceleration);
//       this.position.add(this.velocity);
//
//       if(this.velocity.length > this.LINEAR_VELOCITY_LIMIT)
//          this.velocity.length = this.LINEAR_VELOCITY_LIMIT;
//
//       this.angular_velocity += this.angular_acceleration
//       this.angular_velocity *= this.ANGULAR_FRICTION
//       this.angle += this.angular_velocity
//
//       if(this.angular_velocity > this.ANGULAR_VELOCITY_LIMIT)
//          this.angular_velocity = this.ANGULAR_VELOCITY_LIMIT;
//       if(this.angular_velocity <-this.ANGULAR_VELOCITY_LIMIT)
//          this.angular_velocity =-this.ANGULAR_VELOCITY_LIMIT;
//
//       // calculate force needed to move ship towards received position and angle
//
//     }
//   }
// }
