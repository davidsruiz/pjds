
"use strict";

let Timer = require('./public/js2/timer.js');

let MAX_PLAYER_LIMIT = 8;
let MIN_PLAYER_LIMIT = 2;
let MAX_NUM_OF_TEAMS = 4;
let GAME_DURATION = 300000; // 5 min 180000 3 min
let COUNTDOWN_DURATION = 3000; // 3 sec


Array.prototype.sample = function() { return this[Math.floor(Math.random() * this.length)] };
Array.prototype.shuffle = function() { return this.sort(() => Math.flipCoin() )};
Array.prototype.highestValuedIndex = function() { let highest = 0; for(let i = 0; i < this.length; i++) { if(this[i] > this[highest]) highest = i; if(typeof this[i] != 'undefined' && typeof this[highest] == 'undefined') highest = i; } return highest; };
String.prototype.empty = function() { return this.trim() == ""};
Math.flipCoin = (p = 0.5) => Math.random() < p;

class Lobby {
  constructor(id, type, options = {}) {
      this.id = id;
      this.type = type;
      this.required_players = options.players || MIN_PLAYER_LIMIT;
      this.limit = options.max_players || options.players || MAX_PLAYER_LIMIT; // max_players_allowed
      // this.limit = pCount || NUM_OF_PLAYERS;
      this.max_teams = options.teams || MAX_NUM_OF_TEAMS;
      this.numOfTeams = options.teams;
      this.players = new Map();
      this.ongoing = false;
      this.connected = new Map();

      this.colors;
      // this.colors = DeepSpaceGame.colorCombinations.get(this.numOfTeams).sample().shuffle().map(e => DeepSpaceGame.colors[e])

      this.state = {scores: []};
      this.timer = new Timer(GAME_DURATION + COUNTDOWN_DURATION);
      this.setupData;

      this.gameOverCallback;
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

  // to remove circular dependencies and minimize bandwidth consumption,
    // only select data is sent over.
  simplify() {
    var obj = {};
    var block = (e) => {
      return { name: e.name, cleared: this.playerCleared(e), ready: !!e.ready }
    };
    this.players.forEach((player)=>{
      obj[player.userid] = block(player)
    });
    let send = { type: this.type, players: obj, capacity: this.limit, team_capacity: this.max_teams };
    // if(this.type == 'private') send.team_capacity = this.max_teams;
    return send;
  }

  start(callback) {
    if(!this.setupData) {
      this.gameOverCallback = callback;
      this.ongoing = true;
      this.timer.start(() => { this.timeout() });
      var numOfTeams = this.setupTeams(); console.log(numOfTeams);
      var colors = DeepSpaceGame.colorCombinations.get(numOfTeams).sample().shuffle().map(e => DeepSpaceGame.colors[e]);
      var players = [], counter = 0;
      var block = (id, p, i) => {
        // p.team = i%numOfTeams;
        return { name: p.name, team: p.team, index: i, id: id, type: p.type }
      };
      Array.from(this.players).shuffle().forEach(entry => {
        let [id, player] = entry;
        players.push(block(id, player, counter++));
      });
      this.setupData = {
        teams: numOfTeams,
        colors: colors,
        players: players,
        state: this.state,
        disconnects: []
      };

      for (let [id, player] of this.players) player.ready = false;
      for (let i = 0; i < numOfTeams; i++) this.state.scores.push({t:i, s:100});
    }
    this.setupData.duration = this.timer.timeLeft - COUNTDOWN_DURATION;
    return this.setupData;
  }

  setupTeams() {
    let teams = [];
    for (let i = 0; i < this.max_teams; i++) teams.push([]);
    // first players that have explicitly chosen a team get assigned to it (if valid)
    for (let [, player] of this.players) {
      if(player.team < this.max_teams && player.team >= 0) {
        teams[player.team].push(player);
      } else {
        player.team = -1;
      }
    }

    // then empty teams are removed
    teams = teams.filter(arr => arr.length != 0); console.log(teams.map(arr => arr.length));

    // and every player without a team gets its own team
    for (let [, player] of this.players)
      if(player.team == -1)
        teams.push([player]);

    // players are given their final (and now organized) team number
    teams.forEach( (team, i) => {
      for(let player of team)
        player.team = i;
    });

    return teams.length;
  }

  get ready() {
    for (let [id, player] of this.players) { // console.log(`${player.userid} : ${player.ready}`);
      if(!player.ready) return false;}
    return true;
  }

  playerCleared(player) {
    return !(!player.type || player.name.empty())
  }

  get sustainable() {
    return this.players.size >= this.required_players;
  }

  get unsustainable() {
    var unsus = this.players.size < (this.limit == 1 ? 1 : 2 ); // console.log(`unsustainable: ${unsus}`);
    if(unsus) return true;
    return false;
  }

  active(userid) {
    return this.players.has(userid);
  }

  setWinForPlayers(winningTeam) { if(this.type != 'public') return;
    // if no winning team index is presented, one is deducted using the current scores
    if(typeof winningTeam === 'undefined') {
      if(this.state.scores.length != 0) {
        winningTeam = this.state.scores.shuffle().sort((a,b) => a.s-b.s)[0].t;
      } else {
        winningTeam = Math.floor(Math.random()*this.setupData.teams);
        `no scores were registered!!`.yellow();
      }
    }
    this.setupData.players.forEach((player_info)=>{
      var client = this.players.get(player_info.id);
      if(client && (player_info.team == winningTeam)) client.won = true;
    });
  }

  timeout() {
    setTimeout(()=>{ this.emit('flag drop'); }, 1000);
    setTimeout(()=>{
      this.setWinForPlayers();
      this.emit('game over ready');
      this.endCurrentGame();
      this.emit('lobby state', this.simplify());
    }, 3000);
  }

  endCurrentGame() {
    this.clearLastGame();
    if(this.gameOverCallback) {this.gameOverCallback(); delete this.gameOverCallback;}
    // this.pickupNewPlayers();
  }

  clearLastGame() {
    this.ongoing = false;
    this.setupData = null;
    this.state.flagHolder = undefined;
    this.state.scores = [];
    this.timer.cancel();
  }


}

class GameTimer {
  constructor(time = 0) {
    this.duration = time;
  }
  start(block) {
    this.startTime = Date.now();
    this.timout_id = setTimeout(()=>{block()}, this.duration)
  }
  stop() {
    clearTimeout(this.timout_id);
  }
  get timeElapsed() { return Date.now() - this.startTime }
  get timeLeft() { return this.duration - this.timeElapsed }
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
[1, [[0], [1], [2], [3], [4], [5]]],
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
  [1, 2, 3, 4], // red, yellow, green, blue
  [0, 2, 3, 4] // pink, yellow, green, blue
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
