
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
    this.stealth = false;

    this.assignAttrFrom(Ship.baseStats);           // write base stats
    this.assignAttrFrom(Ship.type[player.type]);   // then overwrite with type specific changes

    this.spawn =
      V2D.new(DeepSpaceGame.maps[0].spawn[this.owner.team.game.teams.length-1][this.owner.team.number])
      .add(DeepSpaceGame.spawn_structure[this.owner.team.players.length - 1][this.owner.team.players.indexOf(this.owner)]);
    this.last_known_position = this.position;
    this.reset()
  }

  update() {
    if(!this.disabled) {
      let intert = this.acceleration.x == 0 && this.acceleration.y == 0;
      !intert ? this.velocity.add(this.acceleration) : this.velocity.mul(this.LINEAR_FRICTION);

      // this.velocity.mul((this.LINEAR_FRICTION) - ((this.flag) ? this.flag.drag : 0));
      if(this.flag) this.velocity.mul(this.flag.drag);

      if(this.velocity.length > this.LINEAR_VELOCITY_LIMIT)
         this.velocity.length = this.LINEAR_VELOCITY_LIMIT;

      this.position.add(this.velocity);

      // this.angular_velocity += this.angular_acceleration
      // this.angular_velocity *= this.ANGULAR_FRICTION - ((this.flag) ? this.flag.drag : 0)
      // this.angle += this.angular_velocity
      //
      // if(this.angular_velocity > this.ANGULAR_VELOCITY_LIMIT)
      //    this.angular_velocity = this.ANGULAR_VELOCITY_LIMIT;
      // if(this.angular_velocity <-this.ANGULAR_VELOCITY_LIMIT)
      //    this.angular_velocity =-this.ANGULAR_VELOCITY_LIMIT;
    }
  }

  // adjusts forces letting the simulation continue
  apply(data) {
    this.disabled = data.disabled;
    this.acceleration = data.acceleration;
    // this.angular_acceleration = data.angular_acceleration;
    this.angle = data.angle;
    this.health = data.health;
  }
  // replaces the state of the ship
  override(data) {
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

    this.energy = 100;

    this.block_friction = 0;

    this.shoot_angle = 0;

    this.bullets = new Set();
    this.blocks = new Set();
    this.subs = new Set();

    this.intersecting = new Set();

    this.recoil_counter = 0;
    this.respawn_counter = 0;
    this.regen_counter = 0;
    this.block_recoil_counter = 0;
    this.sub_recoil_counter = this.SUB_RECOIL_DELAY;

    // this.assignAttrFrom(Ship.type[player.type]); >> moved to super!
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
      // angular_acceleration: this.angular_acceleration,
      angle: this.angle,
      health: this.health
    }
  }

  export_override() {
    return {
      position: this.position//,
      // angle: this.angle
    }
  }

  get health() { return this.hp / this.HP_CAPACITY }
  set health(percent) { this.hp = percent * this.HP_CAPACITY }

  get shoot_position() { var fwp = this.position.copy(); var shift = new V2D(); shift.length = 8*2; shift.angle = this.shoot_angle; fwp.add(shift); return fwp; }

  get front_weapon_position() { var fwp = this.position.copy(); var shift = new V2D(); shift.length = 8*2; shift.angle = this.angle; fwp.add(shift); return fwp; }
  get back_weapon_position() { var bwp = this.position.copy(); var shift = new V2D(); shift.length = 8*2; shift.angle = this.angle - Math.PI; bwp.add(shift); return bwp }

  update() {
    super.update();
    this.last_known_position = this.position;
    if(!this.disabled) {
      if(this.regen_counter++ > this.REGEN_DELAY) this.heal(this.REGEN_RATE);

      this.charge(this.IDLE_ENERGY_REGEN_RATE);
      if(this.charging) this.charge(this.ACTIVE_ENERGY_REGEN_RATE);
    } else {
      if(++this.respawn_counter > this.RESPAWN_DELAY) {
        this.respawn_counter = 0;
        this.reset();
      }
    }
    this.recoil_counter++; this.block_recoil_counter++; this.sub_recoil_counter++;
  }

  shoot() {
    if(this.recoil_counter > this.ATTACK_RECOIL_DELAY && this.drain(this.ATTACK_HP*this.ATTACK_ENERGY_FRACTION_HP)) {

      var id = NetworkHelper.bullet_create(this);

      this.bullets.add(id);
      this.recoil_counter = 0;

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
    if(this.flag) return;
    if(this.block_recoil_counter > this.BLOCK_RECOIL_DELAY && this.drain(this.BLOCK_ENERGY_COST)) {
      if(this.blocks.size > this.BLOCK_CAPACITY)
        NetworkHelper.block_destroy(this.blocks.draw());

      var id = NetworkHelper.block_create(this);
      this.blocks.add(id);
      this.block_recoil_counter = 0;
    }
  }

  sub() {
    if(!(this.subs.size < this.SUB_CAPACITY || this.subs.size == 0)) return;
    if(this.sub_recoil_counter > this.SUB_RECOIL_DELAY && this.drain(this.SUB_ENERGY_COST)) {
      // if(!(this.subs.size > this.PULSE_CAPACITY))
      //   NetworkHelper.out_sub_destroy(this.subs.draw());

      var id = NetworkHelper.sub_create(this);
      this.subs.add(id);
      this.sub_recoil_counter = 0;
    }
  }

  get subPercent() {
    if(this.sub_recoil_counter + 1 > this.SUB_RECOIL_DELAY) { return 1; }
    else if(this.sub_recoil_counter > 0) { return (this.sub_recoil_counter + 1) / this.SUB_RECOIL_DELAY; }
    else { return 0; }
  }

  // adds to energy reserve
  charge(energy) {
    this.energy += energy;
    if(this.energy > 100) this.energy = 100;
  }

  // takes if possible, returns a result as bool
  drain(energy) {
    if(this.flag) return true;
    if(this.energy - energy < 0) return false;
    this.energy -= energy; return true;
  }

  reset() {
    this.position.set(this.spawn);
    this.velocity.reset();
    this.energy = this.ENERGY_CAPACITY;
    this.health = 1;
    this.disabled = false;
    this.flag = undefined;
    this.sub_recoil_counter = this.SUB_RECOIL_DELAY;

    NetworkHelper.out_ship_override(this.export_override());
  }

  pickup(flag) {
    super.pickup(flag);
    // this.energy = this.ENERGY_CAPACITY;
  }

}

Ship.type = {
  "balanced" : {
    type: 'balanced',

    SUB_TYPE: 'attractor',
    SUB_RECOIL_DELAY: 30,
    SUB_ENERGY_COST: 45
  },

  "speed" : {
    type: 'speed',

    HP_CAPACITY: 18, // 20

    LINEAR_VELOCITY_LIMIT: 4, // 3
    // LINEAR_ACCELERATION_LIMIT: 0.26, // 0.26

    ATTACK_HP: 7, // 8
    ATTACK_RADIUS: 10, // 8
    ATTACK_SPREAD: (2 * Math.PI) * (0.08), // (0.01)
    ATTACK_LIFESPAN: 20, // 30

    // BLOCK_RECOIL_DELAY: 4, // 6

    SUB_TYPE: 'repulsor',
    SUB_RECOIL_DELAY: 30, // 120
    SUB_ENERGY_COST: 30
  },

  "defense" : {
    type: 'defense',

    HP_CAPACITY: 32, // 20

    LINEAR_VELOCITY_LIMIT: 2.6, // 3

    ATTACK_HP: 6, // 8
    ATTACK_RECOIL_DELAY: 10, // 8
    ATTACK_LIFESPAN: 36, // 30

    REGEN_RATE: 0.18, // 0.4

    // BLOCK_HP_CAPACITY: 12, // 8
    BLOCK_RECOIL_DELAY: 10, // 8
    BLOCK_ENERGY_COST: 10, // 8

    SUB_TYPE: 'stealth_cloak',
    SUB_RECOIL_DELAY: 60,
    SUB_CAPACITY: 1,
    SUB_ENERGY_COST: 80
  },

  "rate" : {
    type: 'rate',

    RESPAWN_DELAY: 200, // 240

    ATTACK_HP: 6, // 8
    ATTACK_RECOIL_DELAY: 6, // 8
    ATTACK_RADIUS: 6, // 8

    // BLOCK_HP_CAPACITY: 6, // 8
    BLOCK_RECOIL_DELAY: 12, // 8

    SUB_TYPE: 'missile',
    SUB_RECOIL_DELAY: 60, // 120
    SUB_CAPACITY: 1,
    SUB_ENERGY_COST: 80
  },

  "damage" : {
    type: 'damage',

    HP_CAPACITY: 22, // 20

    LINEAR_VELOCITY_LIMIT: 2.6, // 3

    ATTACK_HP: 24, // 8
    ATTACK_RECOIL_DELAY: 50, // 8
    ATTACK_RADIUS: 12, // 8
    ATTACK_LIFESPAN: 48, // 30

    SUB_TYPE: 'block_bomb',
    SUB_RECOIL_DELAY: 30,
    SUB_ENERGY_COST: 50
  }
};

// BASE STATS
Ship.baseStats = {
  type: 'base',

  HP_CAPACITY: 20,
  // ANGULAR_FRICTION: 0.8,//0.9,
  // ANGULAR_VELOCITY_LIMIT: 0.12,
  // ANGULAR_ACCELERATION_LIMIT: 0.04,//0.016,
  LINEAR_FRICTION: 0.9,
  LINEAR_VELOCITY_LIMIT: 3,//8,
  LINEAR_ACCELERATION_LIMIT: 0.26,//0.6,

  RESPAWN_DELAY: 240,

  ATTACK_HP: 8,
  ATTACK_RECOIL_DELAY: 8,
  ATTACK_RADIUS: 8,
  ATTACK_SPREAD: (2 * Math.PI) * (0.01), // (1%) angle sweep in radians.8,
  ATTACK_LIFESPAN: 30, //60,
  ATTACK_ENERGY_FRACTION_HP: 0.3,

  REGEN_DELAY: 180,
  REGEN_RATE: 0.4, // hp/frame

  BLOCK_CAPACITY: 40, //32,
  BLOCK_HP_CAPACITY: 20, //16,
  BLOCK_SPREAD: (2 * Math.PI) * (0), // 0.3 (30%) angle sweep in radians.
  BLOCK_RECOIL_DELAY: 8, // 4
  BLOCK_ENERGY_COST: 8,

  SUB_TYPE: 'block_bomb',
  SUB_RECOIL_DELAY: 30,
  SUB_CAPACITY: 5,
  SUB_ENERGY_COST: 40,

  ENERGY_CAPACITY: 100,
  IDLE_ENERGY_REGEN_RATE: 0.07, // of automatic energy per frame
  ACTIVE_ENERGY_REGEN_RATE: 0.4 // of automatic energy per second
};
