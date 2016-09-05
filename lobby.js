
"use strict";

var NUM_OF_PLAYERS = 2;
var NUM_OF_TEAMS = 2;


Array.prototype.sample = function() { return this[Math.floor(Math.random() * this.length)] };
Array.prototype.shuffle = function() { return this.sort(() => Math.flipCoin() )};
String.prototype.empty = function() { return this.trim() == ""}
Math.flipCoin = (p = 0.5) => Math.random() < p

class Lobby {
  constructor(id, pCount) {
    this.id = id;
    this.limit = pCount || NUM_OF_PLAYERS;
    this.numOfTeams = (NUM_OF_TEAMS > pCount) ? pCount : NUM_OF_TEAMS;
    this.players = new Map();
    this.ongoing = false;
    this.connected = new Map();

    this.colors = DeepSpaceGame.colorCombinations.get(this.numOfTeams).sample().shuffle().map(e => DeepSpaceGame.colors[e])

    this.state = {};
    this.setupData;
  }
  get full() {return !(this.players.size < this.limit) }
  join(client) {
    var joined = false;
    if(this.players.size < this.limit && !this.ongoing) {
      this.players.set(client.userid, client);
      client.active = true;
      joined = true;
    }
    this.connected.set(client.userid, client);
    client.lobby = this;
    return joined;
  }
  remove(client) {
    this.players.delete(client.userid);
    this.connected.delete(client.userid);

    if(client.active && this.ongoing)
      this.setupData.disconnects.push(client.userid);

    delete client.lobby;
    client.active = false;
  }
  emit(msg, data) {
    for (let [key, value] of this.connected)
      this.connected.get(key).emit(msg, data);
  }

  broadcast(msg, data, client) {
    for (let [key, value] of this.connected)
      if(key != client.userid)
        this.connected.get(key).emit(msg, data);
  }

  // to remove circular dependancies and minimize bandwidth consumption,
    // only select data is sent over.
  simplify() {
    var obj = {};
    var block = (e) => {
      return { name: e.name, cleared: this.playerCleared(e), ready: !!e.ready }
    };
    this.players.forEach((player)=>{
      obj[player.userid] = block(player)
    });
    return { players: obj };
  }

  game() {
    if(!this.setupData) {
      this.ongoing = true;
      var players = [], counter = 0;
      var block = (id, p, i) => {
        p.team = i%this.numOfTeams;
        return { name: p.name, team: p.team, index: i, id: id, type: p.type }
      };
      this.players.forEach((player, id)=>{
        players.push(block(id, player, counter++));
      });
      this.setupData = {
        teams: this.numOfTeams,
        colors: this.colors,
        players: players,
        state: this.state,
        disconnects: []
      };

      for (let [id, player] of this.players) player.ready = false;
    }
    return this.setupData;
  }

  get ready() {
    for (let [id, player] of this.players){console.log(`${player.userid} : ${player.ready}`)
      if(!player.ready) return false;}
    return true;
  }

  playerCleared(player) {
    return !(!player.type || player.name.empty())
  }

  get unsustainable() {
    var unsus = this.players.size < (this.limit == 1 ? 1 : 2 ); console.log(`unsustainable: ${unsus}`)
    if(unsus) return true;
    return false;
  }

  active(userid) {
    return this.players.has(userid);
  }

  endCurrentGame() {
    this.clearLastGame();
    // this.pickupNewPlayers();
  }

  clearLastGame() {
    this.ongoing = false;
    this.setupData = null;
    this.state.flagHolder = undefined;
  }



}

// GAME PREF to be sent at start
var DeepSpaceGame = {};

DeepSpaceGame.colors = [
  '#FF4081', // 0 pink
  '#FF5252', // 1 red
  '#FFEA00', // 2 yellow
  '#00E676', // 3 green
  '#00B0FF', // 4 blue
  '#BB33FF', // 5 purple AA00FF old
  '#ECEFF1', // 6 white
  '#90A4AE', // 7 light
  '#37474F', // 8 dark
  '#263238'  // 9 black
];

DeepSpaceGame.colorCombinations = new Map([
[1, [[1], [2], [3], [4], [5]]],
[2, [
  [1, 4], // red, blue
  [1, 2], // red, yellow
  [5, 2], // purple, yellow
  [2, 4], // yellow, blue
  [2, 0], // yellow, pink
  [0, 4], // pink, blue
  [4, 3]  // blue, green
]],
[3,[
  [1, 3, 4], // red, green, blue
  [2, 3, 4], // yellow, green, blue
  [0, 2, 4]  // pink, yellow, blue
]],
[4,[
  [1, 2, 3, 4] // red, yellow, green, blue
]]]
);

DeepSpaceGame.maps = [
  {
    name: "The Event Horizon",
    spawn: [
      [{x: 10, y: 10}, {x: 20, y: 20}],
      [{x: 758, y: 1014}, {x: 748, y: 1004}]
    ]
  }
];


module.exports = Lobby;
