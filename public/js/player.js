
class Player {

  constructor(team, id) {
    this.team = team;
    this.id = id;

    this.name = null;
    this.type = null;
    this.ship = null;
    this.input = null;

    this.score = {kills: 0, deaths: 0}
    this.disconnected = false;
  }

}
