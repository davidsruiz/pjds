
class BasicShip {

  constructor(player) {
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

    Object.assign(this, Ship.baseStats);           // write base stats
    Object.assign(this, Ship.type[player.type]);   // then overwrite with type specific changes

    this.spawn =
      V2D.new(this.owner.team.game.mapInfo.spawn[this.owner.team.game.teams.length-1][this.owner.team.number])
      .add(DeepSpaceGame.spawn_structure[this.owner.team.players.length - 1][this.owner.team.players.indexOf(this.owner)]);
    this.spawnRotation = this.owner.team.game.mapInfo.spawn[this.owner.team.game.teams.length-1][this.owner.team.number].rotation;
    this.last_known_position = this.position;
    this.reset()
  }

  update(dt) {
    if(!this.disabled) {
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
      const angularMotion = this.angular_acceleration !== 0;
      angularMotion ? this.angular_velocity += (this.angular_acceleration * 60*dt) : this.angular_velocity *= (Math.pow(this.ANGULAR_FRICTION, (60*dt) ))

      // validate and adjust new velocity
      const percentOfFullSpeed = this.velocity.length / this.LINEAR_VELOCITY_LIMIT;
      const angularVelocityLimit = this.ANGULAR_VELOCITY_LIMIT_MAX - (percentOfFullSpeed * (this.ANGULAR_VELOCITY_LIMIT_MAX - this.ANGULAR_VELOCITY_LIMIT_MIN)); // lower percent greater ability to turn

      if(this.angular_velocity > angularVelocityLimit)
        this.angular_velocity = angularVelocityLimit;
      if(this.angular_velocity < -angularVelocityLimit)
        this.angular_velocity = -angularVelocityLimit;

      this.angle += (this.angular_velocity * dt);


      //// linear motion

      // apply acceleration
      const isLinearlyMoving = this.acceleration !== 0;
      const accelerationIsPositive = this.acceleration > 0;
      const accelerationVector = V2D.new({angle: this.angle, length: 1}); accelerationVector.length = this.acceleration;
      // if(isLinearlyMoving && accelerationIsPositive) this.velocity.add(accelerationVector.mul(60*dt))
      if(isLinearlyMoving) {
        this.velocity.add(accelerationVector.mul(60*dt))
      } else {
        // apply friction
        this.velocity.mul(Math.pow(this.LINEAR_FRICTION, (60*dt) ))
      }

      // validate and adjust new velocity
      let linearVelocityLimit = this.LINEAR_VELOCITY_LIMIT; if(this.flag) linearVelocityLimit *= this.flag.drag; if(this.charging) linearVelocityLimit += this.LINEAR_VELOCITY_LIMIT_EXTENDED;
      if(this.velocity.length > linearVelocityLimit) this.velocity.length = linearVelocityLimit;
      if(this.velocity.length < 0) this.velocity.length = 0;

      // apply velocity
      this.position.add(this.velocity.mul_(dt));


      // misc.
      this.charging = false;

    }
  }

  // adjusts forces letting the simulation continue
  apply(data) {
    this.disabled = data.disabled;
    // this.acceleration.set(data.acceleration);
    this.acceleration = data.acceleration;
    this.angular_acceleration = data.angular_acceleration;
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

  setFlag(flag) { this.flag = flag }
  clearFlag() { this.flag = undefined }
}

class Ship extends BasicShip {

  constructor(player) {
    super(player);

    // this._angle = 0;

    this.energy = 100;

    this.block_friction = 0;

    this.relative_shoot_angle = 0;

    this.bullets = new Set();
    this.blocks = new Set();
    this.subs = new Set();

    this.intersecting = new Set();

    this.recoil_counter = 0;
    this.respawn_counter = 0;
    this.regen_counter = 0;
    this.block_recoil_counter = 0;
    this.sub_recoil_counter = this.SUB_RECOIL_DELAY;
    this.flag_recoil_counter = this.FLAG_RECOIL_DELAY;

    // Object.assign(this, Ship.type[player.type]); >> moved to super!
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

  // get angle() { return this._angle }
  // set angle(angle) { if(this._angle != angle) this.recoil_counter = this.ATTACK_RECOIL_DELAY; this._angle = angle; }

  get health() { return this.hp / this.HP_CAPACITY }
  set health(percent) { this.hp = percent * this.HP_CAPACITY }

  get shoot_angle() { return this.relative_shoot_angle + this.angle }
  get shoot_position() { const fwp = this.position.copy(); const shift = new V2D(); shift.length = 8*2; shift.angle = this.shoot_angle; fwp.add(shift); return fwp; }
  get shot_RNG() { return (this.ATTACK_SPREAD / 2) * ((Math.random()*2) - 1) }

  get front_weapon_position() { var fwp = this.position.copy(); var shift = new V2D(); shift.length = 8*2; shift.angle = this.angle; fwp.add(shift); return fwp; }
  get back_weapon_position() { var bwp = this.position.copy(); var shift = new V2D(); shift.length = 8*2; shift.angle = this.angle - Math.PI; bwp.add(shift); return bwp }

  update(dt) {
    let c = this.charging;
    super.update(dt);
    this.charging = c;
    this.last_known_position = this.position;

    if(!this.disabled) {
      this.regen_counter+=dt;

      this.charge(this.IDLE_ENERGY_REGEN_RATE*dt);
      if(this.charging) {
        this.charge(this.ACTIVE_ENERGY_REGEN_RATE*dt);
        if(this.regen_counter > this.REGEN_DELAY) this.heal(this.REGEN_RATE*dt);
      } this.charging = false;
      // if(this.charging && !this.stealth) this.charge(this.ACTIVE_ENERGY_REGEN_RATE*dt);
    } else {
      if((this.respawn_counter+=dt) > this.RESPAWN_DELAY) {
        this.respawn_counter = 0;
        this.reset();
      }
    }
    if(!this.flag) this.flag_recoil_counter+=dt;
    this.recoil_counter+=dt; this.block_recoil_counter+=dt; this.sub_recoil_counter+=dt;
  }

  canShoot() {

    const recoilHasPast = this.recoil_counter > this.ATTACK_RECOIL_DELAY;
    const hasEnoughEnergy = this.canDrain(this.ATTACK_HP * this.ATTACK_ENERGY_FRACTION_HP);

    return recoilHasPast && hasEnoughEnergy

  }

  didShoot(id) {

    // list new bullet id
    this.bullets.add(id);

    // drain energy
    this.drain(this.ATTACK_HP * this.ATTACK_ENERGY_FRACTION_HP);

    // reset recoil counter
    this.recoil_counter = 0;

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


  canBlock() {

    const hasNoFlag = !this.flag;
    const recoilHasPast = this.block_recoil_counter > this.BLOCK_RECOIL_DELAY;
    const hasEnoughEnergy = this.canDrain(this.BLOCK_ENERGY_COST);

    return hasNoFlag && recoilHasPast && hasEnoughEnergy

  }
  
  didBlock(id) {

    // list new block id
    this.blocks.add(id);

    // drain energy
    this.drain(this.BLOCK_ENERGY_COST);

    // reset recoil counter
    this.block_recoil_counter = 0;

  }

  get reachedBlockLimit() {
    return this.blocks.size >= this.BLOCK_CAPACITY
  }

  oldestBlockID() {
    return this.blocks.first()
  }


  canSub() {

    const subLimitHasNotBeenReached = this.subs.size < this.SUB_CAPACITY;
    const recoilHasPast = this.sub_recoil_counter > this.SUB_RECOIL_DELAY;
    const hasEnoughEnergy = this.canDrain(this.SUB_ENERGY_COST);

    return subLimitHasNotBeenReached && recoilHasPast && hasEnoughEnergy

  }

  didSub(id) {

    // list new sub id
    this.subs.add(id);

    // drain energy
    this.drain(this.SUB_ENERGY_COST);

    // reset recoil counter
    this.sub_recoil_counter = 0;

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


  canDrain(energy) {
    return !(this.energy - energy < 0)
  }

  // takes if possible, returns a result as bool
  drain(energy) {
    if(this.flag) return true;
    if(this.energy - energy < 0) return false;
    this.energy -= energy; return true;
  }

  reset() {
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

  canPickupFlag() {

    const recoilHasPassed = this.flag_recoil_counter > this.FLAG_RECOIL_DELAY;

    return recoilHasPassed

  }

  didPickupFlag() {
    this.flag_recoil_counter = 0;
  }

}

Ship.type = [
  {
    type: 'standard',

    SUB_TYPE: 'attractor',
    SUB_RECOIL_DELAY: 0.5, //s
    SUB_ENERGY_COST: 45 // ep
  },

  {
    type: 'rate',

    RESPAWN_DELAY: 3, // 4

    ATTACK_HP: 6, // 8
    ATTACK_RECOIL_DELAY: (1/6), // (1/4)
    ATTACK_RADIUS: 6, // 8

    // BLOCK_HP_CAPACITY: 6, // 8
    BLOCK_RECOIL_DELAY: (1/5), // (1/6)

    SUB_TYPE: 'missile',
    SUB_RECOIL_DELAY: 1, //s 2
    SUB_CAPACITY: 1,
    SUB_ENERGY_COST: 70
  },

  {
    type: 'speed',

    HP_CAPACITY: 18, // 20

    LINEAR_VELOCITY_LIMIT: 140, // 120
    // LINEAR_ACCELERATION_LIMIT: ,

    ATTACK_HP: 7, // 8
    ATTACK_RADIUS: 10, // 8
    ATTACK_SPREAD: (2 * Math.PI) * (0.02), // (0.01)
    ATTACK_LIFESPAN: 1, // 1.6

    // BLOCK_RECOIL_DELAY: ,

    SUB_TYPE: 'repulsor',
    SUB_RECOIL_DELAY: 0.5, //s
    SUB_ENERGY_COST: 30
  },

  {
    type: 'defense',

    HP_CAPACITY: 32, // 20

    LINEAR_VELOCITY_LIMIT: 100, // 120

    ATTACK_HP: 8, // 8
    ATTACK_RECOIL_DELAY: (1/3), // (1/4)
    ATTACK_LIFESPAN: 1.8, // 1.6

    REGEN_RATE: 10.8, // 24

    BLOCK_RECOIL_DELAY: (1/6), // (1/6)
    // BLOCK_ENERGY_COST: 10, // 8

    SUB_TYPE: 'stealth_cloak',
    SUB_RECOIL_DELAY: 1, //s
    SUB_CAPACITY: 1,
    SUB_ENERGY_COST: 90 // 70 when no charge upon stealth
  },

  {
    type: 'damage',

    HP_CAPACITY: 22, // 20

    LINEAR_VELOCITY_LIMIT: 100, // 120

    ATTACK_HP: 24, // 8
    ATTACK_RECOIL_DELAY: (1/1.2), // (1/4)
    ATTACK_RADIUS: 12, // 8
    ATTACK_LIFESPAN: 1.6, // 2.2
    ATTACK_SPEED: 140, // 200

    SUB_TYPE: 'block_bomb',
    SUB_RECOIL_DELAY: 0.5, //s
    SUB_ENERGY_COST: 50
  }
];

// BASE STATS
// measurements will be expressed in:
//  time: s
//  distance: px
//  velocity: px / s
//  acceleration: px / s*s
Ship.baseStats = {
  type: 'base',

  HP_CAPACITY: 20, //hp
  ANGULAR_FRICTION: 0.9, //%
  ANGULAR_VELOCITY_LIMIT_MIN: Math.radians(90), //deg/s
  ANGULAR_VELOCITY_LIMIT_MAX: Math.radians(120), //deg/s
  ANGULAR_ACCELERATION_LIMIT: Math.radians(8), //deg/s*s
  LINEAR_FRICTION: 0.9, //%
  LINEAR_VELOCITY_LIMIT: 120, //188 //px/s (3px/f)
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
  ATTACK_RECOIL_DELAY: 1/4, //8 //b/s (8f == 7.5b/s)
  ATTACK_RADIUS: 8, //px
  ATTACK_SPREAD: (2 * Math.PI) * (0.01), // (1%) angle sweep in radians,
  ATTACK_LIFESPAN: 1.6, //0.5 //s,
  ATTACK_ENERGY_FRACTION_HP: 0.3, //%
  ATTACK_SPEED: 200, //px/s

  REGEN_DELAY: 3, //s (180f)
  REGEN_RATE: 24, //hp/s (0.4hp/f)

  BLOCK_CAPACITY: 300, //#
  BLOCK_HP_CAPACITY: 20, //hp
  BLOCK_SPREAD: (2 * Math.PI) * (0.1), // 0.2 (30%) angle sweep in radians.
  BLOCK_RECOIL_DELAY: 1/6, //b/s (8f == 7.5b/s)
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
