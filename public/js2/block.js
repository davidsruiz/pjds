class Block {

    constructor(data) {
      this.id = data.id;
      this.team = data.team;

      this.assignAttrFrom(Block.stats);

      // needs work
      this.position = new V2D(data.position.x, data.position.y);

      this.velocity = new V2D();
      this.velocity.length = this.SPEED;
      this.velocity.angle = data.angle;

      this.radius = data.radius;
      this.locked = false;

      this.hp = this.HP_CAPACITY = data.hp;

      this.life_counter = 0;
      this.disabled = false;
    }

    update(dt) {
      if(!this.locked) {
        this.velocity.mul(this.FRICTION);
        this.position.add(this.velocity.mul_(dt));

        // this.radius = (this.velocity.length * 0.9 + 3); //(8 -> 3)
        this.scale = (this.velocity.length * 0.015 + 3) / 10; //(.8 -> .3)

        if(this.velocity.length < this.LOWER_VELOCITY_LIMIT) this.lock();
        // if((this.life_counter+=dt) > this.LIFESPAN) this.lock();
      }
      // if(++this.life_counter > this.LIFESPAN) this.disabled = true;
    }

    lock() {
      this.scale = 1;
      // this.radius = 10;
      this.qualified = true;
    }

    get health() { return this.hp / this.HP_CAPACITY }
    set health(percent) { this.hp = percent * this.HP_CAPACITY }

    damage(hp) {
      this.hp -= hp;
      if(this.hp <= 0) this.disabled = true;
      if(this.disabled) ENV.game.endBlock(this.id);
      return this.disabled;
    }
  }

  Block.stats = {
    MIN_RADIUS: 45, //18, //16, //10,
    MAX_RADIUS: 50, //36, //30, //20,
    SPEED: 240,
    FRICTION: 0.96,
    LOWER_VELOCITY_LIMIT: 30,
    // DRIFT: 30,
    // LIFESPAN: 1, //s

    DISRUPTIVE_FRICTION: 0.1
  }
