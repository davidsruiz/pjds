
class BasicShip {

  constructor(player) {
    this.owner = player;

    this.disabled = false;
    this.position = new V2D(20, 20);
    this.angle = 0;
    this.health = 1;

    this.radius = 10;
  }

  update(data) {
    this.disabled = data.disabled;
    this.position = data.position;
    this.angle = data.angle;
    this.health = data.health;
  }
}

class Ship extends BasicShip {

  constructor(player) {
    super(player);

    this.velocity = new V2D();
    this.acceleration = new V2D();
    // this.friction = 0;

    this.angular_velocity = 0;
    this.angular_acceleration = 0;
    // this.angular_friction = 0;

    this.bullets = new Set();
    this.blocks = new Set();

    this.recoil_counter = 0;
    this.respawn_counter = 0;
    this.regen_counter = 0;

    this.assignAttrFrom(Ship.type.balanced);
    this.hp = this.HP_CAPACITY;

    this.spawn = DeepSpaceGame.maps[0].spawn[this.owner.team.number][this.owner.team.players.indexOf(this.owner)];
    this.reset()
  }

  export() {
    return {
      disabled: this.disabled,
      position: this.position,
      angle: this.angle,
      health: this.health
    }
  }

  get health() { return this.hp / this.HP_CAPACITY }
  set health(percent) { this.hp = percent * this.HP_CAPACITY }

  update() {
    if(!this.disabled) {
      this.velocity.mul(this.LINEAR_FRICTION);
      this.velocity.add(this.acceleration);
      this.position.add(this.velocity);

      if(this.velocity.length > this.LINEAR_VELOCITY_LIMIT)
         this.velocity.length = this.LINEAR_VELOCITY_LIMIT;

      this.angular_velocity += this.angular_acceleration
      this.angular_velocity *= this.ANGULAR_FRICTION
      this.angle += this.angular_velocity

      if(this.angular_velocity > this.ANGULAR_VELOCITY_LIMIT)
         this.angular_velocity = this.ANGULAR_VELOCITY_LIMIT;
      if(this.angular_velocity <-this.ANGULAR_VELOCITY_LIMIT)
         this.angular_velocity =-this.ANGULAR_VELOCITY_LIMIT;

      this.recoil_counter++;

      if(this.regen_counter++ > this.REGEN_DELAY) this.heal(this.REGEN_RATE);
    } else {
      if(++this.respawn_counter > this.RESPAWN_DELAY) {
        this.respawn_counter = 0;
        this.reset();
      }
    }
  }

  shoot() {
    if(this.recoil_counter > this.RECOIL_DELAY) {

      var id = NetworkHelper.out_bullet_create(this);

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
    if(this.blocks.size < this.BLOCK_CAPACITY) {
      var id = NetworkHelper.out_block_create(this);
      this.blocks.add(id);
    }
  }

  reset() {
    this.position.set(this.spawn);
    this.velocity.reset()
    this.health = 1;
    this.disabled = false;
  }

}

Ship.type = {
  "balanced" : {
    HP_CAPACITY: 24,
    ANGULAR_FRICTION: 0.9,
    ANGULAR_VELOCITY_LIMIT: 0.12,
    ANGULAR_ACCELERATION_LIMIT: 0.016,
    LINEAR_FRICTION: 0.97,
    LINEAR_VELOCITY_LIMIT: 5,
    LINEAR_ACCELERATION_LIMIT: 0.18,
    SHOT_VARIENCE: (2 * Math.PI) * (0.01), // (1%) angle sweep in radians.

    RECOIL_DELAY: 8,
    RESPAWN_DELAY: 120,

    ATTACK: 8,
    REGEN_DELAY: 120,
    REGEN_RATE: 0.4, // hp/frame

    BLOCK_CAPACITY: 32,
    WALL_SPREAD: (2 * Math.PI) * (0.1), // (10%) angle sweep in radians.
    BLOCK_HP_CAPACITY: 8
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
