
class BasicShip {

  constructor(player) {
    this.owner = player;

    this.disabled = false;
    this.position = new V2D(20, 20);
    this.angle = 0;
    this.health = 24;

    this.radius = 8;

    this.bullets = [];
  }

  update(data) {
    this.disabled = data.disabled;
    this.position = data.position;
    this.angle = data.angle;
    this.health = data.health;

    this.bullets = data.bullets;
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

    this.recoil_counter = 0;
    this.respawn_counter = 0;

    this.assignAttrFrom(Ship.type.balanced);
  }

  export() {
    return {
      disabled: this.disabled,
      position: this.position,
      angle: this.angle,
      health: this.health,

      bullets: this.bullets
    }
  }

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

      this.bullets.push(id);
      this.recoil_counter = 0;
      ;
    }
  }

  damage(hp) {
    this.health -= hp;
    if(this.health <= 0) this.disabled = true;
    return this.disabled;
  }

  reset() {
    this.position.set(this.spawn);
    this.velocity.reset()
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
    ACCURACY: (2 * Math.PI) * (0.01), // (1%) angle sweep in radians.
    MAX_WALL_COUNT: 32,

    RECOIL_DELAY: 8,
    RESPAWN_DELAY: 120,

    ATTACK: 8,
    REGEN_DELAY: 120,
    REGEN_RATE: 0.4, // hp/frame
  }
}
