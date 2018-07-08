// TODO optimize by giving radius a getter instead of progress since it is the lesser called var

class SimpleBubble {

  constructor(data) {
    this.id = data.id;
    this.team = data.team;

    Object.assign(this, Bubble.stats);

    this.target = data.target;
    this.position = new V2D();

    this.radius = this.INNER_RADIUS;

    this.growing = false;
    this.locked = false;
    this.complete = false;
    this.disabled = false;

  }

  get progress() {
    if(this.radius <= this.INNER_RADIUS) return 0;
    if(this.radius < this.OUTER_RADIUS) return (this.radius - this.INNER_RADIUS) / (this.OUTER_RADIUS - this.INNER_RADIUS);
    else return 1;
  }

  update(dt) {

    if(!this.locked) {
      const { x, y } = this.target.position;
      this.position.set({ x, y });
    }

  }

}

class Bubble extends SimpleBubble {

  constructor(data) {
    super(data);
    this.dropCooldownCounter = 0;
  }

  get progress() {
    return super.progress
  }

  set progress(percent) {
    this.radius = (percent * (this.OUTER_RADIUS - this.INNER_RADIUS)) + this.INNER_RADIUS
  }

  get ready() { return this.dropCooldownCounter > this.DROP_COOLDOWN }

  update(dt) {

    super.update(dt);

    if(this.locked) {
      this.dropCooldownCounter += dt;
    } else {
      this.dropCooldownCounter = 0;
    }

    if(this.growing) {
      let currentProgress = this.progress;
      let futureProgress = currentProgress + (this.GROWTH_RATE * dt);

      if(futureProgress >= 1) {
        futureProgress = 1;
        this.secure();
      }
      this.progress = futureProgress;
    }

    this.growing = false;

  }

  secure() {
    this.complete = true;
  }

  damage(hp) {
    // TODO (see top) .. like this validation, shouldn't be happening here.. I think
    let currentProgress = this.progress;
    let effectOnProgress = this.HP_TO_PROGRESS * hp;
    let futureProgress = currentProgress - effectOnProgress;

    if(futureProgress < 0) futureProgress = 0;

    this.progress = futureProgress;
  }

  resetDropCooldownCounter() {
    this.dropCooldownCounter = 0;
  }

}

Bubble.stats = {
  INNER_RADIUS: 64, // px
  OUTER_RADIUS: 256, // px
  GROWTH_RATE: 0.2, // r / s
  HP_TO_PROGRESS: 0.01, // % / hp
  DROP_COOLDOWN: 1,
};


class BubbleCore {

  constructor(bubble) {

    this.bubble = bubble;

    Object.assign(this, BubbleCore.stats);

    this.radius = this.RADIUS;

  }

  get position() { return this.bubble.position }

  get disabled() {
    const b = this.bubble;
    return !b.locked || b.complete || !b.ready;
  }

}

BubbleCore.stats = {
  RADIUS: 10,
};

