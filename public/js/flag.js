class Flag {

  constructor(p) {
    this.spawn = this.position = p;
    this.radius = 18;
    this.reset();

    this.drag = 0.3; // reduce vel limit to %
    // this.drag = 80; // takes from ships vel limit
  }

  reset() {
    delete this.holderID;
    // this.position = this.spawn.copy();
  }

  get idle() {return !(this.holderID)}

}
