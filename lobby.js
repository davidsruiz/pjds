
"use strict";

var NUM_OF_PLAYERS = 1;
var NUM_OF_TEAMS = 1;


Array.prototype.sample = function() { return this[Math.floor(Math.random() * this.length)] };
Array.prototype.shuffle = function() { return this.sort(() => Math.flipCoin() )};
String.prototype.empty = function() { return this.trim() == ""}
Math.flipCoin = (p = 0.5) => Math.random() < p

class Lobby {
  constructor(id) {
    this.id = id;
    this.limit = NUM_OF_PLAYERS;
    this.players = new Map();
  }
  get full() {return !(this.players.size < this.limit) }
  join(client) {
    var joined = false;
    if(this.players.size < this.limit) {
      this.players.set(client.userid, client);
      joined = true;
    }
    return joined;
  }
  remove(client) {
    this.players.delete(client.userid);
  }
  emit(msg, data) {
    for (let [key, value] of this.players)
      this.players.get(key).emit(msg, data);
  }

  broadcast(msg, data, client) {
    for (let [key, value] of this.players)
      if(key != client.userid)
        this.players.get(key).emit(msg, data);
  }

  // to remove circular dependancies and minimize bandwidth consumption,
    // only select data is sent over.
  simplify() {
    var obj = {};
    var block = (e) => {
      return { name: e.name }
    };
    this.players.forEach((player)=>{
      obj[player.userid] = block(player)
    });
    return { players: obj };
  }

  game() {
    var numOfTeams = NUM_OF_TEAMS;
    var colors = DeepSpaceGame.colorCombinations.get(numOfTeams).sample().shuffle().map(e => DeepSpaceGame.colors[e]);
    var players = [], counter = 0;
    var block = (id, p, i) => {
      return { name: p.name, team: i%numOfTeams, index: i, id: id, type: p.type }
    };
    this.players.forEach((player, id)=>{
      players.push(block(id, player, counter++));
    });
    return {
      teams: numOfTeams,
      colors: colors,
      players: players
    };
  }

  get ready() {
    for (let [id, player] of this.players)
      if(!player.type || player.name.empty()) return false;
    return true;
  }

  // get ready() {
  //   Object.keys(this.players).forEach((k) => { if(!this.players[k].ready) return false });
  //   return true;
  // }
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
