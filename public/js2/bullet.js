class Bullet {

  constructor(data) {
    this.id = data.id;
    this.team = data.team;

    this.assignAttrFrom(Bullet.stats);

    // needs work
    this.position = new V2D(data.position.x, data.position.y);

    this.velocity = new V2D();
    this.velocity.length = this.SPEED;
    this.velocity.angle = data.angle;

    this.radius = data.radius;

    this.hp = data.hp;
    this.LIFESPAN = data.lifespan;

    this.life_counter = 0;
    this.disabled = false;
  }

  update() {
    this.position.add(this.velocity);
    if(++this.life_counter > this.LIFESPAN) {
      this.disabled = true;
      ENV.game.endBullet(this.id);
    }
  }

  damage(hp) { // TODO: create a damagable or health-capable protocol ... https://github.com/Gozala/protocol
    this.hp -= hp;
    return this.disabled = (this.hp <= 0);
  }
}

Bullet.stats = {
  MAX_RADIUS: 12,
  // radius: 8, //8,
  SPEED: 10//, //14, //10,
  // LIFESPAN: 60 //120
}
