
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
      ENV.game.endSub(this.id);
    }
  }
}

Attractor.stats = {
  radius: 4,
  SPEED: 12,
  FRICTION: 0.96,

  // (attraction strength) you put in a distance it gives you the acceleration force
  // INTENSITY_FUNCTION:
  // x => fourth root of (a-(x * b)) over 2
    // where: a is (y-intercept * 2)^4
    //        b is a / x-intercept
  // y-intercept (max effect) is 2 and x-intercept (range) is 200
  RANGE: 240,
  MAX_INTENSITY: 2,
  INTENSITY_FUNCTION(x) { return Math.sqrt(Math.sqrt((Attractor.stats._A) - (x * (Attractor.stats._B))))/2 },

  LIFESPAN: 240
};

Attractor.stats._A = Math.pow(Attractor.stats.MAX_INTENSITY*2, 4);
Attractor.stats._B = Attractor.stats._A / Attractor.stats.RANGE;


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
      ENV.game.endSub(this.id);
    }
  }
}

Repulsor.stats = {
  radius: 4,
  SPEED: 10,
  FRICTION: 0.96,

  // (repulsion strength) you put in a distance it gives you the acceleration force
  // INTENSITY_FUNCTION: x => fourth root of (a-(x * b)) over 2
  // y-intercept (max effect) is 2 and x-intercept (range) is 160
  // a is 256 and b is
  RANGE: 160,
  MAX_INTENSITY: 2,
  INTENSITY_FUNCTION(x) { return Math.sqrt(Math.sqrt((Repulsor.stats._A) - (x * (Repulsor.stats._B))))/2 },

  LIFESPAN: 180
};

Repulsor.stats._A = Math.pow(Repulsor.stats.MAX_INTENSITY*2, 4);
Repulsor.stats._B = Repulsor.stats._A / Repulsor.stats.RANGE;

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
    // if(this.disabled) ENV.game.endSub(this.id);
    this.velocity.mul(this.FRICTION);
    this.position.add(this.velocity);
    // this.rotation += ((this.velocity.length / 360) + 0.05);
    this.rotation += ((this.velocity.length / 40) + 0.0);
    if(++this.life_counter > this.LIFESPAN) {
      this.exploding = true;
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

  EXPLOSION_RANGE: 200,
  EXPLOSION_DAMAGE_FUNCTION: x => (8000/((BlockBomb.stats._A * x)+100))-20, // 60hp at contact and 0hp at range px

  LIFESPAN: 100
}

BlockBomb.stats._A = 300 / Repulsor.stats.RANGE;

class StealthCloak {

  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.team = data.team;

    this.target = ENV.game.players.get(data.player);

    this.assignAttrFrom(StealthCloak.stats);

    this.life_counter = 0;
    this.disabled = false;
  }

  update() {
    var dead;
    if(this.target) {
      dead = (++this.life_counter > this.LIFESPAN) || (this.target.ship.disabled) || (this.target.ship.flag);
      this.target.ship.stealth = !dead;
    }
    if(dead) {
      ENV.game.endSub(this.id);
    }
  }

}

StealthCloak.stats = {
  LIFESPAN: 240
}


class Missile {

  constructor(data) {
    this.id = data.id;
    this.team = data.team;
    this.type = data.type;

    this.target = null; // ship

    this.assignAttrFrom(Missile.stats);

    this.position = new V2D(data.position.x, data.position.y);

    this.velocity = new V2D();
    this.velocity.length = this.SPEED;
    this.velocity.angle = data.angle;

    this.rotation = this.velocity.angle;

    this.life_counter = 0;
    this.disabled = false;
  }

  update() {

    if(this.target) {
      // http://stackoverflow.com/questions/1878907/the-smallest-difference-between-2-angles?noredirect=1&lq=1
      // x is the target angle. y is the source or starting angle
      // It returns the signed delta angle.
      // var x = this.target.position.angle, y = this.position.angle;
      // var delta_angle = Math.atan2(Math.sin(x-y), Math.cos(x-y)); log(`delta_angle: ${delta_angle}`)


      var direction = this.target.position.copy().sub(this.position);


      var x = direction.angle, y = this.rotation;
      var delta_angle = Math.atan2(Math.sin(x-y), Math.cos(x-y)); // log(`delta_angle: ${delta_angle}`)

      // var delta_rotation = direction.angle - this.rotation; log(Math.degrees(delta_rotation));
      if(delta_angle > this.MAX_TURN_SPEED) delta_angle = this.MAX_TURN_SPEED;
      if(delta_angle <-this.MAX_TURN_SPEED) delta_angle = -this.MAX_TURN_SPEED;
      this.velocity.angle = this.rotation + delta_angle;
    }

    this.position.add(this.velocity);
    this.rotation = this.velocity.angle;

    if(++this.life_counter > this.LIFESPAN) {
      this.exploding = true;
    }
  }

  explode() {
    this.exploding = true;
    NetworkHelper.out_only_sub_destroy(this.id);
  }
}

Missile.stats = {
  radius: 12,
  SPEED: 4.6, // 8
  hp: 30,
  MAX_TURN_SPEED: (Math.PI / 120), // radians

  VISION_RANGE: 400,
  EXPLOSION_RANGE: 30, // 200

  LIFESPAN: 240
}
