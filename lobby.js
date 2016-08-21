
"use strict";

Array.prototype.sample = function() { return this[Math.floor(Math.random() * this.length)] };
Array.prototype.shuffle = function() { return this.sort(() => Math.flipCoin() )};
Math.flipCoin = (p = 0.5) => Math.random() < p

class Lobby {
  constructor(id) {
    this.id = id;
    this.limit = 2;
    this.players = {};
  }
  join(client) {
    var joined = false;
    if(Object.keys(this.players).length < this.limit) {
      this.players[client.userid] = client;
      joined = true;
    }
    return joined;
  }
  remove(client) {
    delete this.players[client.userid];
  }
  emit(msg, data) {
    for(var key in this.players)
      this.players[key].emit(msg, data);
  }

  broadcast(msg, data, client) {
    for(var key in this.players)
      if(key != client.userid)
        this.players[key].emit(msg, data);
  }

  // to remove circular dependancies and minimize bandwidth consumption,
    // only select data is sent over.
  simplify() {
    var obj = {};
    var block = (e) => {
      return { name: e.name}
    };
    Object.keys(this.players).map( (key) => obj[key] = block(this.players[key]) )
    return { players: obj };
  }

  get isFull() { return Object.keys(this.players).length >= this.limit }

  game() {
    var numOfTeams = 2;
    var colors = DeepSpaceGame.colorCombinations.get(numOfTeams).sample().shuffle().map(e => DeepSpaceGame.colors[e]);

    var block = (p, i, id) => {
      return { name: p.name, team: i%numOfTeams, index: i, id: id, type: "balanced" }
    };
    var players = Object.keys(this.players).map( (key, i) => block(this.players[key], i, key) );
    return {
      teams: numOfTeams,
      colors: colors,
      players: players
    };
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

DeepSpaceGame.colorCombinations = new Map([[2, [
  [1, 4], // red, blue
  [1, 2], // red, yellow
  [5, 2], // purple, yellow
  [2, 4], // yellow, blue
  [2, 0], // yellow, pink
  [0, 4], // pink, blue
  [4, 3]  // blue, green
]],
[3,[

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
