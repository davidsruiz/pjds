
"use strict";

let Timer = require('./timer.js');
const _ = require('./ext/underscore-min.js');

let TIME = {sec: function(mil) {return mil * 1000}, min: function(mil) {return this.sec(mil) * 60}};

const MAX_PLAYER_LIMIT = 8;
const MIN_PLAYER_LIMIT = 2;
const MAX_NUM_OF_TEAMS = 4;
const GAME_DURATION = [TIME.min(5), TIME.min(3), TIME.min(20)]; // 5 min 180000 3 min
const COUNTDOWN_DURATION = TIME.sec(3); // 3 sec
const OVERTIME_DURATION = TIME.sec(30);

Number.prototype.times = function(block) { for(var i = 0; i < this; i++) block(i); };
Array.prototype.sample = function() { return this[Math.floor(Math.random() * this.length)] };
Array.prototype.shuffle = function() { return this.sort(() => Math.flipCoin() )};
Array.prototype.highestValuedIndex = function() { let highest = 0; for(let i = 0; i < this.length; i++) { if(this[i] > this[highest]) highest = i; if(typeof this[i] != 'undefined' && typeof this[highest] == 'undefined') highest = i; } return highest; };
String.prototype.empty = function() { return this.trim() == ""};
Array.new = function(l = 0, filler) { var a = new Array(); l.times((i)=>{a.push(typeof(filler)=="function" ? filler(i) : filler)}); return a }
Math.flipCoin = (p = 0.5) => Math.random() < p;
Math.randomIntMinMax = (min, max) => Math.floor((Math.random()*(max - min)) + min);

class Lobby {
  constructor(id, type, options = {}) {
    this.id = id;
    this.type = type;
    this.required_players = options.players || MIN_PLAYER_LIMIT;
    this.limit = options.max_players || options.players || MAX_PLAYER_LIMIT; // max_players_allowed
    // this.limit = pCount || NUM_OF_PLAYERS;
    this.max_teams = options.teams || MAX_NUM_OF_TEAMS;
    this.numOfTeams = options.teams;

    this.ongoing = false;

    // this.connected = new Set();
    this.players = new Set();

    this.colors;
    // this.colors = DeepSpaceGame.colorCombinations.get(this.numOfTeams).sample().shuffle().map(e => DeepSpaceGame.colors[e])

    this.state = {scores: [], overtime: false};
    this.timer = new Timer(GAME_DURATION + COUNTDOWN_DURATION);
    this.setupData;

    this.gameOverCallback;


    // new :)
    this.spectators = new Set();
    this.playersMap = new Map();
    this.gameVars = null; // set during this.startGame
    this.options = {
      // settable
      map: 0,
      mode: 1,
      stock: 0,

      // non-settable
      maxTeams: MAX_NUM_OF_TEAMS,
      numOfTeams: options.teams,
      maxPlayers: this.limit
    };
    this.editableSettings = ['map', 'mode'];
    this.lastGameResults = new Map();
  }

  // NEW //

  get full() {return !(this.playersMap.size < this.limit) }
  get empty() {return (this.playersMap.size == 0 && this.spectators.size == 0) }

  get connected() {
    let everyone = Array.from(this.spectators).concat(Array.from(this.playersMap).map(i=>i[0]));
    return new Set(everyone);
  }

  connect(client) {
    this.spectators.add(client);
    client.lobby = this;
  }

  disconnect(client) {
    // lobby actions
    this.spectators.delete(client);
    this.playersMap.delete(client);


    // game actions //

    // if game is ongoing
    if(this.gameVars) {

      // alert other clients
      this.emit('playerDisconnected', client.id_);

      // take action depending on mode
      switch(this.gameVars.options.mode) {

        // ctf
        case 0:

          // make sure client isn't holding flag
          if(this.gameVars.modeLogic.flagIsHeldBy(client.id_)) {
            this.emit('flagDropped');
            this.gameVars.modeLogic.flagDropped();
          }

          break;

      }

      // if no player is left end game
      if(this.playersMap.size == 0) this.endGame();
    }




    delete client.lobby;
  }

  join(client, ship_data) {

    return (new Promise((resolve, reject) => {

      if(!this.full && !this.gameVars) {

        const exceedsMaxLimit = !(ship_data[2] < this.options.maxTeams+1);
        const exceedsMinLimit = (ship_data[2] < 0);

        if(exceedsMaxLimit || exceedsMinLimit) {

          reject('illegal team number');

        } else {

          ship_data[3] = false;

          this.spectators.delete(client);
          this.playersMap.set(client, ship_data);
          resolve();

        }

      } else {
        reject('lobby is full or ongoing');
      }

    }))
  }

  startFrom(client, shipType) {

    return (new Promise((resolve, reject) => {

      if(this.playersMap.has(client)) {
        this.playersMap.get(client)[3] = true;
        this.playersMap.get(client)[4] = shipType;
        resolve(this.sustainable && this.allPlayersReady());
      } else {
        reject('first become a player');
      }

    }));
  }

  allPlayersReady() {
    for(let [,p] of this.playersMap) if(!p[3]) return false;
    return true;
  }

  setPasswordFrom(client, password) {
    this.setPassword(password);
    this.emit('passwordSet', password);
  }

  clearPasswordFrom(client) {
    this.clearPassword();
    this.emit('passwordCleared');
  }

  updateUserRank(client, rank) {
    if(this.playersMap.has(client)) { // if public
      this.playersMap.get(client)[1] = rank;
      return true;
    }
    return false;
  }




  // start game!
  // when everyone is ready

  startGame() {

    this.cancelGame();

    // id name team index shipType

    const timerLength = GAME_DURATION[this.options.mode] + COUNTDOWN_DURATION;

    this.gameVars = {

      ongoing: true,

      setupData: {},

      scores: null,

      timer: new Timer(timerLength),

      modeLogic: null,

      options: Object.assign({}, this.options),

    };

    // setup data
    this.gameVars.setupData.teams = this.decideTeams();
    this.gameVars.setupData.colors = this.decideColors();
    this.gameVars.setupData.players = this.mapPlayers();
    this.gameVars.setupData.duration = GAME_DURATION[this.options.mode];
    this.gameVars.setupData.options = this.gameVars.options;

    // scores from team count
    this.gameVars.scores = new Array(this.gameVars.setupData.teams.length).fill(100);

    this.gameVars.modeLogic = new MODES[this.options.mode](()=>this.endGame(), this.gameVars.setupData.teams.length, this.gameVars.setupData.players);

    // timer start TODO - cleanup end game
    this.gameVars.timer.start(() => this.endGame());

    /*

     flag captured
     flag dropped
     time expired


     block created
     block damaged
     block converted

     stock lost


     */


    // if(!this.setupData) {
    //   this.gameOverCallback = callback;
    //   this.ongoing = true;
    //   this.timer.start(() => { this.timeout() });
    //   var numOfTeams = this.setupTeams(); console.log(numOfTeams);
    //   var colors = DeepSpaceGame.colorCombinations.get(numOfTeams).sample().shuffle().map(e => DeepSpaceGame.colors[e]);
    //   var players = [], counter = 0;
    //   var block = (id, p, i) => {
    //     // p.team = i%numOfTeams;
    //     return { name: p.name, team: p.team, index: i, id: id, type: p.type }
    //   };
    //   Array.from(this.players).shuffle().forEach(entry => {
    //     let [id, player] = entry;
    //     players.push(block(id, player, counter++));
    //   });
    //   this.setupData = {
    //     teams: numOfTeams,
    //     colors: colors,
    //     players: players,
    //     state: this.state,
    //     disconnects: [],
    //     tint: TINT.shuffle()
    //   };
    //
    //   for (let [id, player] of this.players) player.ready = false;
    //   for (let i = 0; i < numOfTeams; i++) this.state.scores.push({t:i, s:100});
    // }
    // this.setupData.duration = this.timer.timeLeft - COUNTDOWN_DURATION;
    // return this.setupData;


    // clear remaining data from last game
    // no longer relevant
    this.lastGameResults.clear();

  }

  // decideTeams()
  //   returns an array of teams being arrays of players indexes
  //   e.g. [[3, 2], [1, 5], [0, 4]] representing 3 teams
  //        with team one consisting of players [3 and 2]
  //        team two of [1 and 5] and three of [0 and 4]
  decideTeams() {

    let teams;

    // 1. create team arrays
    let numberOfTeams = this.options.numOfTeams;
    if(numberOfTeams === undefined) { // if private
      let teams = new Set();
      for(let [c, data] of this.playersMap) teams.add(data[2] === 0 ? c : data[2]);
      numberOfTeams = teams.size; // number of teams decided by player's choices
    }
    teams = Array.new(numberOfTeams, ()=>[]); // create array of arrays

    // 2. distribute players to their respective teams
    if(this.type == 0) { // if public (automatic dist)

      let indexes = Array.new(this.playersMap.size, i => i).shuffle();
      indexes.forEach((index, i) => {
        teams[i % teams.length].push(index);
      });

    } else { // if private or practice (manual dist)

      let teamsIndex = 0;
      let associations = new Map();
      Array.from(this.playersMap).forEach(([c, data], playersIndex) => {

        const playersTeam = data[2];
        if(playersTeam === 0) { // if solo
          teams[teamsIndex++].push(playersIndex);
        } else { // if chose team
          if(associations.get(playersTeam) !== undefined) { // if team prev assoc.
            teams[associations.get(playersTeam)].push(playersIndex)
          } else { // if team not prev assoc.
            associations.set(playersTeam, teamsIndex);
            teams[teamsIndex++].push(playersIndex);
          }
        }

      });

    }

    // 3. done
    console.log(teams);
    return teams;

  }

  // decideColors()
  //   returns team colors and light shading information
  //   e.g. [[2, 4, 5, 3], [45(deg), (color), (color)]]
  decideColors() {
    return ([
      // team colors
      DeepSpaceGame.colorCombinations.get(this.gameVars.setupData.teams.length).sample().shuffle(),

      // light shading
      LIGHT.randomDraw()
    ]);
  }

  getSetupData() {
    return this.gameVars.setupData;
  }




  endGame() { // ... think EVEN more of this (duplication of code now)

    // 0. CHECK
    // return if already ended
    if(!this.gameVars || !this.gameVars.ongoing) return;
    this.gameVars.ongoing = false;

    // 1. ACCOUNT FOR RESULTS

    this.processResults();


    // 2. CLEAR AND SETUP NEW

    this.clearAndSetup();


  }

  cancelGame() {

    // 0. CHECK
    // return if already ended
    if(!this.gameVars || !this.gameVars.ongoing) return;
    this.gameVars.ongoing = false;

    // 1. NOTIFY UNFORTUNATE NEWS

    this.emitClosure();


    // 2. CLEAR AND SETUP NEW

    this.clearAndSetup();

  }

  clearAndSetup() {

    // 0. CHECK
    // return if already ended
    if(!this.gameVars) return;

    // 1. CLEAR

    if(this.gameVars.timer) this.gameVars.timer.cancel();
    this.clearGameData();


    // 2. SETUP NEW

    this.unreadyAllPlayers();
    this.emit('usersUpdate', this.mapUsers())

  }

  processResults() {

    const results = this.gameVars.modeLogic.recap();

    // if public .. weigh outcome
    if(this.type == 0) this.setWinForPlayers(results);

    // alert players
    this.emit('gameEnded', results);

  }

  emitClosure() {

    // alert players
    this.emit('gameCanceled');

  }

  clearGameData() {

    // return if game is already cleared
    if(!this.gameVars) return;

    // ...
    delete this.gameVars;


  }

  unreadyAllPlayers() {
    for(let [, data] of this.playersMap)
      data[3] = false;
  }







  updateOptions(data) {

    const [key, value] = data;

    if(_(this.editableSettings).contains(key)) {

      this.options[key] = value;

      this.emit('optionsUpdate', data);

    }


  }






  // join(client) {
  //   var joined = false;
  //   if(this.players.size < this.limit && !this.ongoing) {
  //     this.players.set(client.userid, client);
  //     client.active = true;
  //     joined = true;
  //   }
  //   this.connected.set(client.userid, client);
  //   client.lobby = this;
  //   return joined;
  // }

  // remove(client) {
  //   this.players.delete(client.userid);
  //   this.connected.delete(client.userid);
  //
  //   if(client.active && this.ongoing)
  //     this.setupData.disconnects.push(client.userid);
  //
  //   delete client.lobby;
  //   client.active = false;
  // }


  
  // Networking Socket Utilities
  emit(msg, data) {
    for (let [client, ] of this.playersMap)
      client.emit(msg, data);
    for (let client of this.spectators)
      client.emit(msg, data);
  }
  broadcast(msg, data, client) { // TODO : redo
    for (let connectedClient of this.connected)
      if(connectedClient != client)
        connectedClient.emit(msg, data);
  }


  
  // to remove circular dependencies and minimize bandwidth consumption,
  // only select data is sent over.
  // simplify() {
  //   var obj = {};
  //   var block = (e) => {
  //     return { name: e.name, cleared: this.playerCleared(e), ready: !!e.ready }
  //   };
  //   this.players.forEach((player)=>{
  //     obj[player.userid] = block(player)
  //   });
  //   let send = { type: this.type, players: obj, capacity: this.limit, team_capacity: this.max_teams };
  //   // if(this.type == 'private') send.team_capacity = this.max_teams;
  //   return send;
  // }

  // start(callback) {
  //   if(!this.setupData) {
  //     this.gameOverCallback = callback;
  //     this.ongoing = true;
  //     this.timer.start(() => { this.timeout() });
  //     var numOfTeams = this.setupTeams(); console.log(numOfTeams);
  //     var colors = DeepSpaceGame.colorCombinations.get(numOfTeams).sample().shuffle().map(e => DeepSpaceGame.colors[e]);
  //     var players = [], counter = 0;
  //     var block = (id, p, i) => {
  //       // p.team = i%numOfTeams;
  //       return { name: p.name, team: p.team, index: i, id: id, type: p.type }
  //     };
  //     Array.from(this.players).shuffle().forEach(entry => {
  //       let [id, player] = entry;
  //       players.push(block(id, player, counter++));
  //     });
  //     this.setupData = {
  //       teams: numOfTeams,
  //       colors: colors,
  //       players: players,
  //       state: this.state,
  //       disconnects: [],
  //       tint: TINT.shuffle()
  //     };
  //
  //     for (let [id, player] of this.players) player.ready = false;
  //     for (let i = 0; i < numOfTeams; i++) this.state.scores.push({t:i, s:100});
  //   }
  //   this.setupData.duration = this.timer.timeLeft - COUNTDOWN_DURATION;
  //   return this.setupData;
  // }

  // setupTeams() {
  //   // private matches distribute teams freely
  //   if(this.type == 'practice') this.max_teams = 1; // TODO: fix.. not good
  //   return (this.type == 'private') ? this.freeTeamCountSetup() : this.explicitTeamCountSetup();
  // }
  //
  // explicitTeamCountSetup() {
  //   Array.from(this.players).shuffle().forEach((entry, i) => {
  //     let [, player] = entry;
  //     player.team = i % this.max_teams;
  //   });
  //   return this.max_teams;
  // }
  //
  // freeTeamCountSetup() {
  //   let teams = [];
  //   for (let i = 0; i < this.max_teams; i++) teams.push([]);
  //   // first players that have explicitly chosen a team get assigned to it (if valid)
  //   for (let [, player] of this.players) {
  //     if(player.team < this.max_teams && player.team >= 0) {
  //       teams[player.team].push(player);
  //     } else {
  //       player.team = -1;
  //     }
  //   }
  //
  //   // then empty teams are removed
  //   teams = teams.filter(arr => arr.length != 0); // console.log(teams.map(arr => arr.length)); console.log(teams.map(arr => arr.map(player => player.name)));
  //
  //   // and every player without a team gets its own team
  //   for (let [, player] of this.players)
  //     if(player.team == -1)
  //       teams.push([player]);
  //
  //   // players are given their final (and now organized) team number
  //   teams.forEach( (team, i) => {
  //     for(let player of team)
  //       player.team = i;
  //   });
  //
  //   return teams.length;
  // }
  //
  // get ready() {
  //   for (let [id, player] of this.players) { // console.log(`${player.userid} : ${player.ready}`);
  //     if(!player.ready) return false;}
  //   return true;
  // }

  // playerCleared(player) {
  //   return !(!player.type || player.name.empty())
  // }

  
  get sustainable() {
    return this.playersMap.size >= this.required_players;
  }

  get unsustainable() {
    var unsus = this.playersMap.size < (this.limit == 1 ? 1 : 2 ); // console.log(`unsustainable: ${unsus}`);
    if(unsus) return true;
    return false;
  }

  active(userid) {
    return this.playersMap.has(userid);
  }



  setWinForPlayers([scores, results]) {

    // let winningTeam = 0;
    // if(this.type != 'public') return;
    // // if no winning team index is presented, one is deducted using the current scores
    // // if(typeof winningTeam === 'undefined') {
    // //   if(this.state.scores.length != 0) {
    // //     winningTeam = this.state.scores.shuffle().sort((a,b) => a.s-b.s)[0].t;
    // //   } else {
    // //     winningTeam = Math.floor(Math.random()*this.setupData.teams);
    // //     `no scores were registered!!`.yellow();
    // //   }
    // // }
    // winningTeam = winningTeam || this.state.leadTeam;
    // this.setupData.players.forEach((player_info)=>{
    //   var client = this.players.get(player_info.id);
    //   if(client && (player_info.team == winningTeam)) client.won = true;
    // });


    // create respective wins array

    const wins = [];

    switch(this.gameVars.options.mode) {

      // ctf
      case 0:

        // win bool
        var bestScore = _(scores).min();
        scores.forEach(score => wins.push(bestScore == score))

        break;

      // territorial
      case 1:

        // win bool
        var bestScore = _(scores).max();
        scores.forEach(score => wins.push(bestScore == score));

        break;

    }

    // access and assign depending on players team

    for(let [client, data] of this.playersMap) {
      const team = this.getTeamAndPlayerFor(client);
      const result = results[this.getPlayerIndexForClient(client)];
      const hits = result ? result[3] : 0;

      this.lastGameResults.set(client.id_, [wins[team], hits]);
    }

  }

  getTeamAndPlayerFor(client) {

    if(!this.gameVars || !client || !client.id_) return;


    const teams = this.gameVars.setupData.teams;
    for(let i = 0; i < teams.length; i++) {
      const players = teams[i];
      const indexList = players.map(p => this.getIDforPlayerIndex(p));

      const contains = _(indexList).contains(client.id_);
      if(contains) return [i];
    }

  }

  getIDforPlayerIndex(index) {
    return this.gameVars.setupData.players[index][0];
  }

  getPlayerIndexForClient(client) {
    return this.gameVars.setupData.players.map(p => p[0]).indexOf(client.id_);
  }


  addWinner(id) {
    this.winners.add(id);
  }

  removeWinner(id) {
    return this.winners.delete(id);
  }

  clearWinners() {
    this.winners = new Set();
  }



  timeout() {
    this.emit('request progress');
    console.log(`flagholder team ${this.getTeam(this.state.flagHolder)} v.s. lead team ${this.state.leadTeam}`)
    setTimeout(()=>{
      if(this.state.overtime || this.state.flagHolder === undefined || this.getTeam(this.state.flagHolder) === this.state.leadTeam) {
        this.ongoing = false;
        this.finish();
      } else {
        this.state.overtime = true;
        this.emit('overtime');
        this.timer.cancel();
        this.timer.interval = OVERTIME_DURATION;
        this.timer.start(() => { this.timeout() });
      }
    }, TIME.sec(1));
  }

  finish() {
    this.setWinForPlayers();
    this.emit('game over');
    this.endCurrentGame();
    this.emit('lobby state', this.simplify());
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
    this.state.leadTeam = undefined;
    this.state.scores = [];
    this.state.overtime = false;
    this.timer.cancel();
    this.timer.interval = GAME_DURATION + COUNTDOWN_DURATION;
  }

  get game_lead_team() {
    return this.state.scores.shuffle().sort((a,b) => a.s-b.s)[0].t;
  }

  getTeam(client_id) {
    this.gameVars.setupData.teams.forEach((team, teamIndex)=>{
      team.forEach((playerIndex)=>{
        if(this.gameVars.setupData.players[playerIndex][0] == client_id) return teamIndex;
      })
    });
    // for(let player of this.setupData.players)
    //   if(player.id == client_id)
    //     return player.team;
  }



  // PASSWORD
  // format: /\d{4}\

  setPassword(p) {
    // validation: 4 digits
    if(/\d{4}/.test(p)) {
      this._password = p;
      return true;
    }
    return false;
  }

  clearPassword() { delete this._password }

  testPassword(p) {
    return this._password === p;
  }

  get locked() { return typeof this._password !== 'undefined' }


  map() {
    // normalization
    // player -> [ name, rank, team, ready, ship, slots [] ]
    const play_arr = this.mapPlayers();
    // spectator -> name
    const spec_arr = this.mapSpectators();

    return {
      type: this.type,
      code: this.id,
      password: this._password,
      ongoing: !!this.gameVars,
      game_settings: this.mapSettings(),
      users: this.mapUsers()
    };
  }
  mapUsers() { return {players: this.mapPlayers(), spectators: this.mapSpectators()}}
  mapPlayers() { return Array.from(this.playersMap).map(c => [c[0].id_, ...c[1]]) }
  mapSpectators() { return Array.from(this.spectators).map(c => c.name || c.id_).filter(str => str); }
  mapSettings() {

    const settings = {
      editableSettings: {},
      noneditableSettings: {},
    };

    _(this.options).each((val, key)=>{
      if(_(this.editableSettings).contains(key)) {
        settings.editableSettings[key] = val
      } else {
        settings.noneditableSettings[key] = val
      }
    });

    return settings;
  }


  // network and game functions

  exec(msg, data, client) {
    this.gameVars ? this[msg](data, client) : 0; // if active run
  }

  shipUpdated(data, client) {
    // reflect message
    this.broadcast('shipUpdated', data, client)
  }

  shipOverridden(data, client) {
    // reflect message
    this.broadcast('shipOverridden', data, client)
  }

  shipHPAdjusted(data, client) {
    // reflect message
    this.broadcast('shipHPAdjusted', data, client)

    // log to game records
    const [, hp, fromID] = data;
    this.gameVars.modeLogic.playerRecordsHPGivenIncrement(fromID, hp);
  }

  bulletCreated(data, client) {
    // reflect message
    this.broadcast('bulletCreated', data, client)
  }

  bulletDestroyed(data, client) {
    // reflect message
    this.broadcast('bulletDestroyed', data, client)
  }

  blockCreated(data, client) {
    // reflect message
    this.broadcast('blockCreated', data, client);

    // notify logic
    if(this.gameVars.options.mode == 1) {
      const {id, team} = data;
      this.gameVars.modeLogic.addBlockForTeam(id, team);
    }
  }

  blockHPAdjusted(data, client) {
    // reflect message
    this.broadcast('blockHPAdjusted', data, client)
  }

  blockTeamSet(data, client) {
    // reflect message
    this.broadcast('blockTeamSet', data, client);

    if(this.gameVars.options.mode == 1) {
      const [id, team] = data;
      this.gameVars.modeLogic.setBlockTeam(id, team);
    }
  }

  blockDestroyed(data, client) {
    // reflect message
    this.broadcast('blockDestroyed', data, client)

    // notify logic
    if(this.gameVars.options.mode == 1) {
      this.gameVars.modeLogic.removeBlock(data);
    }
  }

  subCreated(data, client) {
    // reflect message
    this.broadcast('subCreated', data, client)
  }

  subDestroyed(data, client) {
    // reflect message
    this.broadcast('subDestroyed', data, client)
  }

  deathOccurrence(data, client) {
    // reflect message
    this.broadcast('deathOccurrence', data, client)

    // log to game records
    const [toID, fromID] = data;
    this.gameVars.modeLogic.playerRecordsKillIncrement(fromID);
    this.gameVars.modeLogic.playerRecordsDeathIncrement(toID);
  }

  // mode (ctf)

  flagCaptured(id, client) {

    // involve mode logic
    const modeLogic = this.gameVars.modeLogic;

    if(modeLogic.flagAvailable) {

      // reflect message
      this.broadcast('flagCaptured', id, client);

      // alert mode logic
      modeLogic.flagCaptured(id);

    }
  }

  flagDropped(data, client) {

    // reflect message
    this.broadcast('flagDropped', data, client);

    // notify mode logic
    this.gameVars.modeLogic.flagDropped();

  }

  flagProgress(data, client) {

    // interpret
    const [team, score] = data;
    const modeLogic = this.gameVars.modeLogic;

    // notify mode logic
    modeLogic.updateTeamScore(team, score);

    // reflect message
    this.broadcast('flagProgress', [team, modeLogic.scoreForTeam(team)], client);
  }


}


class GameLogic {

  constructor(endCallback, numberOfTeams, players) {
    this.end = endCallback;
    this.setupPlayerRecords(players);

  }

  setupPlayerRecords(players) {

    this.playerRecords = new Map();
    for(let player of players)
      // sets default record for every id
      this.playerRecords.set(player[0], [0, 0, 0]);

  }


  // Manipulate Players Records

  playerRecordsKillIncrement(id) {
    const record = this.playerRecords.get(id);

    if (record) record[0]++; // kill count
  }

  playerRecordsDeathIncrement(id) {
    const record = this.playerRecords.get(id);

    if (record) record[1]++; // death count
  }

  playerRecordsHPGivenIncrement(id, hp) {
    const record = this.playerRecords.get(id);

    if (record) record[2] += hp; // hp given
  }

  formatRecords() {
    const recordsArray = [];
    this.playerRecords.forEach((record, id) => recordsArray.push([id, ...record]));
    return recordsArray;
  }

  recap() {
    return [this.formatScores(), this.formatRecords()]
  }

}


class CTFModeLogic extends GameLogic {

  constructor(endCallback, numberOfTeams, players) {
    super(...arguments);

    this.scores = new Array(numberOfTeams).fill(100);
    this.playerWithFlag = null;

    this.updates = 0;
  }

  flagCaptured(playersID) { this.playerWithFlag = playersID; this.updates = 0 }
  flagDropped() { this.playerWithFlag = null; this.updates = 0 }
  get flagAvailable() { return !this.playerWithFlag }
  flagIsHeldBy(playersID) { return this.playerWithFlag === playersID }

  updateTeamScore(team, score) {

    // only one update per flag capture
    // note: doesn't exactly validate appropriately
    if(++this.updates > 2) {
      console.log(`update limit exceeded!`);
      return;
    }

    // update registry
    if(score < 0) score = 0;
    if(this.scores[team])
      this.scores[team] = score;

    console.log(`team score updated: TEAM(${team}) SCORE(${score})`);

    // check for winner
    if(score < 1 && !this.flagAvailable) this.end();

  }

  scoreForTeam(number) {
    return this.scores[number]
  }

  formatScores() {
    return this.scores;
  }



}

class TerritorialModeLogic extends GameLogic {

  constructor(endCallback, numberOfTeams, players) {
    super(...arguments);

    this.blocks = Array.new(numberOfTeams, () => new Set());

  }

  addBlockForTeam(id, index) {
    if(this.blocks[index])
      this.blocks[index].add(id);
  }

  removeBlock(id) {
    for(let teamCollection of this.blocks)
      if(teamCollection.delete(id))
        return
  }

  setBlockTeam(id, index) {
    this.removeBlock(id);
    this.addBlockForTeam(id, index)
  }

  formatScores() {
    const scores = [];
    for(let teamCollection of this.blocks)
      scores.push(teamCollection.size);
    return scores;
  }

}

const MODES = [CTFModeLogic, TerritorialModeLogic];






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
  '#263238', // 9 black

  // added colors
  '#FFA33F', // 10 orange
  '#82E600', // 11 lime
  '#00FFE2', // 12 aqua
  '#F93FFF', // 13 magenta
];

DeepSpaceGame.colorCombinations = new Map([
  [1, [
    // [0], [1], [2], [3], [4], [5], [10], [11], [12], [13]
    [0], [1], [2], [3], [4], [11], [12], [13]
  ]],
  [2, [
    [4, 0],
    [4, 1],
    [4, 10],
    [4, 2],
    [4, 11],
    [4, 3],
    [2, 1],
    [2, 0],
    [2, 5],
    [2, 12],
    [2, 11],
    [2, 13],
    [10, 12],
    [5, 11],
  ]],
  [3, [
    [4, 3, 1],
    [4, 3, 0],
    [4, 2, 1],
    [4, 3, 2],
    [0, 2, 12],
    [2, 10, 12],
    [2, 0, 4],
    [2, 1, 5],
    [11, 5, 12],
    [11, 0, 2],
    [11, 2, 12],
    [11, 2, 4],
  ]],
  [4, [
    [1, 2, 3, 4],
    [0, 2, 3, 4],
    [1, 2, 11, 4],
    [1, 2, 4, 5],
    [2, 1, 11, 5],
    [0, 2, 12, 4],
  ]],
  [5, [
    [1, 10, 2, 3, 4],
    [1, 2, 3, 4, 5],
    [2, 11, 12, 4, 5],
    [0, 2, 12, 4, 5],
    [0, 2, 3, 4, 5],
    [10, 2, 3, 4, 5],
  ]],
  [6, [
    [1, 10, 2, 3, 4, 5],
    [1, 10, 2, 3, 12, 4],
    [0, 10, 2, 3, 12, 4],
    [0, 2, 11, 12, 4, 5],
    [10, 2, 11, 12, 4, 5],
  ]],
  [7, [
    [1, 10, 2, 3, 12, 4, 5],
    [0, 10, 2, 3, 12, 4, 5],
  ]],
  [8, [
    [0, 10, 2, 11, 12, 4, 5, 13]
  ]]
]);

DeepSpaceGame.maps = [
  {
    name: "The Event Horizon",
    spawn: [
      [{x: 10, y: 10}, {x: 20, y: 20}],
      [{x: 758, y: 1014}, {x: 748, y: 1004}]
    ]
  }
];

const LIGHT = {
  assortment: [
    ['#0000ff', '#ff0000'],
    ['#0000ff', '#aedc39'],
    ['#0048ff', '#cc00ff']
  ],

  randomDraw() {
    let [c1, c2] = LIGHT.assortment.sample();
    return [Math.randomIntMinMax(15, 75), c1, c2];
  }
};

const REF = {
  lobby: {
    type: ['public', 'private', 'practice'],
    typeDesc: [
      'This is a public lobby. Players present have complete control over game settings',
      'This is a private lobby. Players present have complete control over game settings',
      'This is a practice lobby. Players present have complete control over game settings',
    ]
  },

  ship: {
    type: ['standard', 'rate', 'speed', 'defense', 'damage'],
    typeDesc: [
      'a tune with the world and itself, this is the balanced ship',
      'this ship produces a stream of light bullets to trap and confuse',
      'run your way out of any situation with the speed ship',
      'take more than just a hit with the defense ship',
      'this ship is feared across the reach of space, use it wisely'
    ],
    sub: ['attractor', 'heat seeker', 'repulsors', 'stealth', 'block bomb'],
    stats: [
      ['HEALTH' , '0.6', '0.6', '0.2', '1.0', '0.7'],
      ['SPEED'  , '0.6', '0.6', '0.9', '0.4', '0.4'],
      ['ATTACK' , '0.5', '0.4', '0.3', '0.5', '1.0'],
      ['RANGE'  , '0.5', '0.5', '0.3', '0.7', '0.4'],
    ]

  },

  results: {
    scoringUnits: ['distance', 'amount covered', 'time lasted']
  }

};




// class TerritorialGMLogic {
//
//   constructor(numberOfTeams) {
//     this.scores = new Array(numberOfTeams);
//     for(let i = 0; i < numberOfTeams; i++) this.scores[i] = [i, 0];
//   }
//
//   inc(teamIndex) {
//     this.scores[teamIndex][1]++;
//   }
//
//   dec(teamIndex) {
//     this.scores[teamIndex][1]--;
//   }
//
//   recap() {
//     return this.scores.sort((a, b) => b[1] - a[1])
//   }
//
// }
//
// class CTFGMLogic {
//
//   constructor(numberOfTeams) {
//     this.scores = new Array(numberOfTeams);
//     for(let i = 0; i < numberOfTeams; i++) this.scores[i] = [i, 0];
//   }
//
//   inc(teamIndex) {
//     this.scores[teamIndex][1]++;
//   }
//
//   dec(teamIndex) {
//     this.scores[teamIndex][1]--;
//   }
//
//   recap() {
//     return this.scores.sort((a, b) => b[1] - a[1])
//   }
//
// }
























module.exports = Lobby;
