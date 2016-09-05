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

    update() {
      if(!this.locked) {
        this.velocity.mul(this.FRICTION);
        this.position.add(this.velocity);

        // this.radius = (this.velocity.length * 0.9 + 3); //(8 -> 3)
        this.scale = (this.velocity.length * 0.9 + 3) / 10; //(.8 -> .3)

        if(this.velocity.length < 0.2) this.lock();
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
      return this.disabled;
    }
  }

  Block.stats = {
    MIN_RADIUS: 10,
    MAX_RADIUS: 20,
    SPEED: 6,
    FRICTION: 0.92,
    DRIFT: 60,
    LIFESPAN: 120,

    DISRUPTIVE_FRICTION: 0.1
  }
