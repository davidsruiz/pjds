class Flag {

  constructor(p) {
    this.spawn = this.position = p;
    this.radius = 18;
    this.reset();

    this.drag = 0.7; // additional friction
  }

  reset() {
    delete this.holderID;
    // this.position = this.spawn.copy();
  }

  get idle() {return !(this.holderID)}

}
