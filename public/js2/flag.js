class Flag {

  constructor(p) {
    this.spawn = p;
    this.radius = 12;
    this.reset();

    this.drag = 0.16; // additional friction
  }

  reset() {
    delete this.holderID;
    this.position = this.spawn.copy();
  }

  get idle() {return !(this.holderID)}

}
