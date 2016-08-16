class Bullet {

  constructor(data) {
    this.id = data.id;
    this.team = data.team;

    this.assignAttrFrom(Bullet.stats);

    // needs work
    this.position = new V2D(data.position.x, data.position.y);
    var shift = new V2D(); shift.length = 8*2; shift.angle = data.angle;
    this.position.add(shift);

    this.velocity = new V2D();
    this.velocity.length = this.SPEED;
    this.velocity.angle = data.angle;

    this.radius = 4;

    this.hp = data.hp;

    this.life_counter = 0;
    this.disabled = false;
  }

  update() {
    this.position.add(this.velocity);
    if(++this.life_counter > this.LIFESPAN) this.disabled = true;
  }
}

Bullet.stats = {
  radius: 8,
  SPEED: 10,
  LIFESPAN: 120
}