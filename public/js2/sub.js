
class Sub {

}

class Attractor {

  constructor(data) {
    this.id = data.id;
    this.team = data.team;
    this.type = data.type;

    this.assignAttrFrom(Attractor.stats);

    // needs work
    this.position = new V2D(data.position.x, data.position.y);

    this.velocity = new V2D();
    this.velocity.length = this.SPEED;
    this.velocity.angle = data.angle;

    this.rotation = 0;

    this.radius = 4;

    // this.hp = data.hp;

    this.life_counter = 0;
    this.disabled = false;
  }

  update() {
    this.velocity.mul(this.FRICTION);
    this.position.add(this.velocity);
    this.rotation += ((this.velocity.length / 360) + 0.05);
    if(++this.life_counter > this.LIFESPAN) {
      this.disabled = true;
      ENV["game"].endSub(this.id);
    }
  }
}

Attractor.stats = {
  radius: 4,
  SPEED: 12,
  FRICTION: 0.96,

  // (attraction strength) you put in a distance it gives you the acceleration force
  //   linear: (from 0 at 200px to 0.26 ppf at 30px)
  // INTENSITY_FUNCTION: x => -0.0015*x + 0.3,
  INTENSITY_FUNCTION: x => Math.sqrt(Math.sqrt(200-x))/2,
  RANGE: 200,

  LIFESPAN: 180
}


class Repulsor {

  constructor(data) {
    this.id = data.id;
    this.team = data.team;
    this.type = data.type;

    this.assignAttrFrom(Repulsor.stats);

    // needs work
    this.position = new V2D(data.position.x, data.position.y);

    this.velocity = new V2D();
    this.velocity.length = this.SPEED;
    this.velocity.angle = data.angle;

    this.rotation = 0;

    this.radius = 4;

    this.hp = data.hp;

    this.life_counter = 0;
    this.disabled = false;
  }

  update() {
    this.velocity.mul(this.FRICTION);
    this.position.add(this.velocity);
    this.rotation += ((this.velocity.length / 360) + 0.05);
    if(++this.life_counter > this.LIFESPAN) {
      this.disabled = true;
      ENV["game"].endSub(this.id);
    }
  }
}

Repulsor.stats = {
  radius: 4,
  SPEED: 10,
  FRICTION: 0.96,

  // (attraction strength) you put in a distance it gives you the acceleration force
  //   linear: (from 0 at 200px to 0.26 ppf at 30px)
  // INTENSITY_FUNCTION: x => -0.0015*x + 0.3,
  INTENSITY_FUNCTION: x => Math.sqrt(Math.sqrt(160-x))/2,//(80 / x) - 0.8,
  RANGE: 160,

  LIFESPAN: 180
}

class BlockBomb {

  constructor(data) {
    this.id = data.id;
    this.team = data.team;
    this.type = data.type;

    this.assignAttrFrom(BlockBomb.stats);

    // needs work
    this.position = new V2D(data.position.x, data.position.y);

    this.velocity = new V2D();
    this.velocity.length = this.SPEED;
    this.velocity.angle = data.angle;

    this.rotation = 0;

    this.radius = 4;

    this.life_counter = 0;
    this.disabled = false;
  }

  update() {
    // if(this.disabled) ENV["game"].endSub(this.id);
    this.velocity.mul(this.FRICTION);
    this.position.add(this.velocity);
    // this.rotation += ((this.velocity.length / 360) + 0.05);
    this.rotation += ((this.velocity.length / 40) + 0.1);
    if(++this.life_counter > this.LIFESPAN) {
      this.explode();
    }
  }

  explode() {
    this.exploding = true;
    NetworkHelper.out_only_sub_destroy(this.id);
  }
}

BlockBomb.stats = {
  radius: 10,
  SPEED: 25,
  FRICTION: 0.95,

  EXPLOSION_RANGE: 300,
  EXPLOSION_DAMAGE_FUNCTION: x => (8000/(x+100))-20, // 60hp at contact and 0hp at 300px

  LIFESPAN: 120
}
