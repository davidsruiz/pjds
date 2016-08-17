class Block {

    constructor(data) {
      this.id = data.id;
      this.team = data.team;

      this.assignAttrFrom(Block.stats);

      // needs work
      this.position = new V2D(data.position.x, data.position.y);
      var shift = new V2D(); shift.length = 8*2; shift.angle = data.angle;
      this.position.add(shift);

      this.velocity = new V2D();
      this.velocity.length = this.SPEED;
      this.velocity.angle = data.angle;

      this.radius = 4;
      this.locked = false;

      this.hp = data.hp;

      this.life_counter = 0;
      this.disabled = false;
    }

    update() {
      if(!this.locked) {
        this.velocity.mul(this.FRICTION);
        this.position.add(this.velocity);

        this.radius = (this.velocity.length + 3);

        if(this.velocity.length < 0.1) this.locked = true;
      } else {
        this.radius = 10;
      }

      if(++this.life_counter > this.LIFESPAN) this.disabled = true;
    }
  }

  Block.stats = {
    radius: 8,
    SPEED: 3,
    FRICTION: 0.92,
    DRIFT: 60,
    LIFESPAN: 180
  }
