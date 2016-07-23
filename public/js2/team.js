
class Team {

  constructor(game, number) {
    this.game = game;
    this.number = number;
    this.players = [];
  }

  get color() {
    return this.game.colors[this.number]
  }

  createPlayer(id, name, type) {
    var p = new Player(this, id);
    p.name = name; p.type = type;

    this.players.push(p);
    this.game.players.push(p);
  }
}
