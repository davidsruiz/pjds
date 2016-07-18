
class Player {
  constructor(name) {
    this.name = name;
    this.ship = new (Ship(this));
  }
}


class Game {
  constructor(lobby) {
    this.localPlayer =
    this.players = [];
  }
}
