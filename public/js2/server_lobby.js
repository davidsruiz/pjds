
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Timer = require('./timer.js');
var _ = require('./ext/underscore-min.js');

var TIME = { sec: function sec(mil) {
    return mil * 1000;
  }, min: function min(mil) {
    return this.sec(mil) * 60;
  } };

var MAX_PLAYER_LIMIT = 8;
var MIN_PLAYER_LIMIT = 2;
var MAX_NUM_OF_TEAMS = 4;
var GAME_DURATION = [TIME.min(5), TIME.min(3), TIME.min(20)]; // 5 min 180000 3 min
var COUNTDOWN_DURATION = TIME.sec(3); // 3 sec
var OVERTIME_DURATION = TIME.sec(30);

Number.prototype.times = function (block) {
  for (var i = 0; i < this; i++) {
    block(i);
  }
};
Array.prototype.sample = function () {
  return this[Math.floor(Math.random() * this.length)];
};
Array.prototype.shuffle = function () {
  return this.sort(function () {
    return Math.flipCoin();
  });
};
Array.prototype.highestValuedIndex = function () {
  var highest = 0;for (var i = 0; i < this.length; i++) {
    if (this[i] > this[highest]) highest = i;if (typeof this[i] != 'undefined' && typeof this[highest] == 'undefined') highest = i;
  }return highest;
};
String.prototype.empty = function () {
  return this.trim() == "";
};
Array.new = function () {
  var l = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var filler = arguments[1];
  var a = new Array();l.times(function (i) {
    a.push(typeof filler == "function" ? filler(i) : filler);
  });return a;
};
Math.flipCoin = function () {
  var p = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.5;
  return Math.random() < p;
};
Math.randomIntMinMax = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

var Lobby = function () {
  function Lobby(id, type) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, Lobby);

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

    this.state = { scores: [], overtime: false };
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

  _createClass(Lobby, [{
    key: 'connect',
    value: function connect(client) {
      this.spectators.add(client);
      client.lobby = this;
    }
  }, {
    key: 'disconnect',
    value: function disconnect(client) {
      // lobby actions
      this.spectators.delete(client);
      this.playersMap.delete(client);

      // game actions //

      // if game is ongoing
      if (this.gameVars) {

        // alert other clients
        this.emit('playerDisconnected', client.id_);

        // take action depending on mode
        switch (this.gameVars.options.mode) {

          // ctf
          case 0:

            // make sure client isn't holding flag
            if (this.gameVars.modeLogic.flagIsHeldBy(client.id_)) {
              this.emit('flagDropped');
              this.gameVars.modeLogic.flagDropped();
            }

            break;

        }

        // if no player is left end game
        if (this.playersMap.size == 0) this.endGame();
      }

      delete client.lobby;
    }
  }, {
    key: 'join',
    value: function join(client, ship_data) {
      var _this = this;

      return new Promise(function (resolve, reject) {

        if (!_this.full && !_this.gameVars) {

          var exceedsMaxLimit = !(ship_data[2] < _this.options.maxTeams + 1);
          var exceedsMinLimit = ship_data[2] < 0;

          if (exceedsMaxLimit || exceedsMinLimit) {

            reject('illegal team number');
          } else {

            ship_data[3] = false;

            _this.spectators.delete(client);
            _this.playersMap.set(client, ship_data);
            resolve();
          }
        } else {
          reject('lobby is full or ongoing');
        }
      });
    }
  }, {
    key: 'startFrom',
    value: function startFrom(client, shipType) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {

        if (_this2.playersMap.has(client)) {
          _this2.playersMap.get(client)[3] = true;
          _this2.playersMap.get(client)[4] = shipType;
          resolve(_this2.sustainable && _this2.allPlayersReady());
        } else {
          reject('first become a player');
        }
      });
    }
  }, {
    key: 'allPlayersReady',
    value: function allPlayersReady() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.playersMap[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var p = _ref2[1];
          if (!p[3]) return false;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return true;
    }
  }, {
    key: 'setPasswordFrom',
    value: function setPasswordFrom(client, password) {
      this.setPassword(password);
      this.emit('passwordSet', password);
    }
  }, {
    key: 'clearPasswordFrom',
    value: function clearPasswordFrom(client) {
      this.clearPassword();
      this.emit('passwordCleared');
    }
  }, {
    key: 'updateUserRank',
    value: function updateUserRank(client, rank) {
      if (this.playersMap.has(client)) {
        // if public
        this.playersMap.get(client)[1] = rank;
        return true;
      }
      return false;
    }

    // start game!
    // when everyone is ready

  }, {
    key: 'startGame',
    value: function startGame() {
      var _this3 = this;

      this.cancelGame();

      // id name team index shipType

      var timerLength = GAME_DURATION[this.options.mode] + COUNTDOWN_DURATION;

      this.gameVars = {

        ongoing: true,

        setupData: {},

        scores: null,

        timer: new Timer(timerLength),

        modeLogic: null,

        options: Object.assign({}, this.options)

      };

      // setup data
      this.gameVars.setupData.teams = this.decideTeams();
      this.gameVars.setupData.colors = this.decideColors();
      this.gameVars.setupData.players = this.mapPlayers();
      this.gameVars.setupData.duration = GAME_DURATION[this.options.mode];
      this.gameVars.setupData.options = this.gameVars.options;

      // scores from team count
      this.gameVars.scores = new Array(this.gameVars.setupData.teams.length).fill(100);

      this.gameVars.modeLogic = new MODES[this.options.mode](function () {
        return _this3.endGame();
      }, this.gameVars.setupData.teams.length, this.gameVars.setupData.players);

      // timer start TODO - cleanup end game
      this.gameVars.timer.start(function () {
        return _this3.endGame();
      });

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

  }, {
    key: 'decideTeams',
    value: function decideTeams() {

      var teams = void 0;

      // 1. create team arrays
      var numberOfTeams = this.options.numOfTeams;
      if (numberOfTeams === undefined) {
        // if private
        var _teams = new Set();
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = this.playersMap[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _ref3 = _step2.value;

            var _ref4 = _slicedToArray(_ref3, 2);

            var c = _ref4[0];
            var data = _ref4[1];
            _teams.add(data[2] === 0 ? c : data[2]);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        numberOfTeams = _teams.size; // number of teams decided by player's choices
      }
      teams = Array.new(numberOfTeams, function () {
        return [];
      }); // create array of arrays

      // 2. distribute players to their respective teams
      if (this.type == 0) {
        // if public (automatic dist)

        var indexes = Array.new(this.playersMap.size, function (i) {
          return i;
        }).shuffle();
        indexes.forEach(function (index, i) {
          teams[i % teams.length].push(index);
        });
      } else {
        // if private or practice (manual dist)

        var teamsIndex = 0;
        var associations = new Map();
        Array.from(this.playersMap).forEach(function (_ref5, playersIndex) {
          var _ref6 = _slicedToArray(_ref5, 2),
              c = _ref6[0],
              data = _ref6[1];

          var playersTeam = data[2];
          if (playersTeam === 0) {
            // if solo
            teams[teamsIndex++].push(playersIndex);
          } else {
            // if chose team
            if (associations.get(playersTeam) !== undefined) {
              // if team prev assoc.
              teams[associations.get(playersTeam)].push(playersIndex);
            } else {
              // if team not prev assoc.
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

  }, {
    key: 'decideColors',
    value: function decideColors() {
      return [
      // team colors
      DeepSpaceGame.colorCombinations.get(this.gameVars.setupData.teams.length).sample().shuffle(),

      // light shading
      LIGHT.randomDraw()];
    }
  }, {
    key: 'getSetupData',
    value: function getSetupData() {
      return this.gameVars.setupData;
    }
  }, {
    key: 'endGame',
    value: function endGame() {
      // ... think EVEN more of this (duplication of code now)

      // 0. CHECK
      // return if already ended
      if (!this.gameVars || !this.gameVars.ongoing) return;
      this.gameVars.ongoing = false;

      // 1. ACCOUNT FOR RESULTS

      this.processResults();

      // 2. CLEAR AND SETUP NEW

      this.clearAndSetup();
    }
  }, {
    key: 'cancelGame',
    value: function cancelGame() {

      // 0. CHECK
      // return if already ended
      if (!this.gameVars || !this.gameVars.ongoing) return;
      this.gameVars.ongoing = false;

      // 1. NOTIFY UNFORTUNATE NEWS

      this.emitClosure();

      // 2. CLEAR AND SETUP NEW

      this.clearAndSetup();
    }
  }, {
    key: 'clearAndSetup',
    value: function clearAndSetup() {

      // 0. CHECK
      // return if already ended
      if (!this.gameVars) return;

      // 1. CLEAR

      if (this.gameVars.timer) this.gameVars.timer.cancel();
      this.clearGameData();

      // 2. SETUP NEW

      this.unreadyAllPlayers();
      this.emit('usersUpdate', this.mapUsers());
    }
  }, {
    key: 'processResults',
    value: function processResults() {

      var results = this.gameVars.modeLogic.recap();

      // if public .. weigh outcome
      if (this.type == 0) this.setWinForPlayers(results);

      // alert players
      this.emit('gameEnded', results);
    }
  }, {
    key: 'emitClosure',
    value: function emitClosure() {

      // alert players
      this.emit('gameCanceled');
    }
  }, {
    key: 'clearGameData',
    value: function clearGameData() {

      // return if game is already cleared
      if (!this.gameVars) return;

      // ...
      delete this.gameVars;
    }
  }, {
    key: 'unreadyAllPlayers',
    value: function unreadyAllPlayers() {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.playersMap[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _ref7 = _step3.value;

          var _ref8 = _slicedToArray(_ref7, 2);

          var data = _ref8[1];

          data[3] = false;
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }, {
    key: 'updateOptions',
    value: function updateOptions(data) {
      var _data = _slicedToArray(data, 2),
          key = _data[0],
          value = _data[1];

      if (_(this.editableSettings).contains(key)) {

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

  }, {
    key: 'emit',
    value: function emit(msg, data) {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.playersMap[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _ref9 = _step4.value;

          var _ref10 = _slicedToArray(_ref9, 1);

          var client = _ref10[0];

          client.emit(msg, data);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = this.spectators[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var _client = _step5.value;

          _client.emit(msg, data);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
  }, {
    key: 'broadcast',
    value: function broadcast(msg, data, client) {
      // TODO : redo
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = this.connected[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var connectedClient = _step6.value;

          if (connectedClient != client) connectedClient.emit(msg, data);
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }
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


  }, {
    key: 'active',
    value: function active(userid) {
      return this.playersMap.has(userid);
    }
  }, {
    key: 'setWinForPlayers',
    value: function setWinForPlayers(_ref11) {
      var _ref12 = _slicedToArray(_ref11, 2),
          scores = _ref12[0],
          results = _ref12[1];

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

      var wins = [];

      switch (this.gameVars.options.mode) {

        // ctf
        case 0:

          // win bool
          var bestScore = _(scores).min();
          scores.forEach(function (score) {
            return wins.push(bestScore == score);
          });

          break;

        // territorial
        case 1:

          // win bool
          var bestScore = _(scores).max();
          scores.forEach(function (score) {
            return wins.push(bestScore == score);
          });

          break;

      }

      // access and assign depending on players team

      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = this.playersMap[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var _ref13 = _step7.value;

          var _ref14 = _slicedToArray(_ref13, 2);

          var client = _ref14[0];
          var data = _ref14[1];

          var team = this.getTeamAndPlayerFor(client);
          var result = results[this.getPlayerIndexForClient(client)];
          var hits = result ? result[3] : 0;

          this.lastGameResults.set(client.id_, [wins[team], hits]);
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
    }
  }, {
    key: 'getTeamAndPlayerFor',
    value: function getTeamAndPlayerFor(client) {
      var _this4 = this;

      if (!this.gameVars || !client || !client.id_) return;

      var teams = this.gameVars.setupData.teams;
      for (var i = 0; i < teams.length; i++) {
        var players = teams[i];
        var indexList = players.map(function (p) {
          return _this4.getIDforPlayerIndex(p);
        });

        var contains = _(indexList).contains(client.id_);
        if (contains) return [i];
      }
    }
  }, {
    key: 'getIDforPlayerIndex',
    value: function getIDforPlayerIndex(index) {
      return this.gameVars.setupData.players[index][0];
    }
  }, {
    key: 'getPlayerIndexForClient',
    value: function getPlayerIndexForClient(client) {
      return this.gameVars.setupData.players.map(function (p) {
        return p[0];
      }).indexOf(client.id_);
    }
  }, {
    key: 'addWinner',
    value: function addWinner(id) {
      this.winners.add(id);
    }
  }, {
    key: 'removeWinner',
    value: function removeWinner(id) {
      return this.winners.delete(id);
    }
  }, {
    key: 'clearWinners',
    value: function clearWinners() {
      this.winners = new Set();
    }
  }, {
    key: 'timeout',
    value: function timeout() {
      var _this5 = this;

      this.emit('request progress');
      console.log('flagholder team ' + this.getTeam(this.state.flagHolder) + ' v.s. lead team ' + this.state.leadTeam);
      setTimeout(function () {
        if (_this5.state.overtime || _this5.state.flagHolder === undefined || _this5.getTeam(_this5.state.flagHolder) === _this5.state.leadTeam) {
          _this5.ongoing = false;
          _this5.finish();
        } else {
          _this5.state.overtime = true;
          _this5.emit('overtime');
          _this5.timer.cancel();
          _this5.timer.interval = OVERTIME_DURATION;
          _this5.timer.start(function () {
            _this5.timeout();
          });
        }
      }, TIME.sec(1));
    }
  }, {
    key: 'finish',
    value: function finish() {
      this.setWinForPlayers();
      this.emit('game over');
      this.endCurrentGame();
      this.emit('lobby state', this.simplify());
    }
  }, {
    key: 'endCurrentGame',
    value: function endCurrentGame() {
      this.clearLastGame();
      if (this.gameOverCallback) {
        this.gameOverCallback();delete this.gameOverCallback;
      }
      // this.pickupNewPlayers();
    }
  }, {
    key: 'clearLastGame',
    value: function clearLastGame() {
      this.ongoing = false;
      this.setupData = null;
      this.state.flagHolder = undefined;
      this.state.leadTeam = undefined;
      this.state.scores = [];
      this.state.overtime = false;
      this.timer.cancel();
      this.timer.interval = GAME_DURATION + COUNTDOWN_DURATION;
    }
  }, {
    key: 'getTeam',
    value: function getTeam(client_id) {
      var _this6 = this;

      this.gameVars.setupData.teams.forEach(function (team, teamIndex) {
        team.forEach(function (playerIndex) {
          if (_this6.gameVars.setupData.players[playerIndex][0] == client_id) return teamIndex;
        });
      });
      // for(let player of this.setupData.players)
      //   if(player.id == client_id)
      //     return player.team;
    }

    // PASSWORD
    // format: /\d{4}\

  }, {
    key: 'setPassword',
    value: function setPassword(p) {
      // validation: 4 digits
      if (/\d{4}/.test(p)) {
        this._password = p;
        return true;
      }
      return false;
    }
  }, {
    key: 'clearPassword',
    value: function clearPassword() {
      delete this._password;
    }
  }, {
    key: 'testPassword',
    value: function testPassword(p) {
      return this._password === p;
    }
  }, {
    key: 'map',
    value: function map() {
      // normalization
      // player -> [ name, rank, team, ready, ship, slots [] ]
      var play_arr = this.mapPlayers();
      // spectator -> name
      var spec_arr = this.mapSpectators();

      return {
        type: this.type,
        code: this.id,
        password: this._password,
        ongoing: !!this.gameVars,
        game_settings: this.mapSettings(),
        users: this.mapUsers()
      };
    }
  }, {
    key: 'mapUsers',
    value: function mapUsers() {
      return { players: this.mapPlayers(), spectators: this.mapSpectators() };
    }
  }, {
    key: 'mapPlayers',
    value: function mapPlayers() {
      return Array.from(this.playersMap).map(function (c) {
        return [c[0].id_].concat(_toConsumableArray(c[1]));
      });
    }
  }, {
    key: 'mapSpectators',
    value: function mapSpectators() {
      return Array.from(this.spectators).map(function (c) {
        return c.name || c.id_;
      }).filter(function (str) {
        return str;
      });
    }
  }, {
    key: 'mapSettings',
    value: function mapSettings() {
      var _this7 = this;

      var settings = {
        editableSettings: {},
        noneditableSettings: {}
      };

      _(this.options).each(function (val, key) {
        if (_(_this7.editableSettings).contains(key)) {
          settings.editableSettings[key] = val;
        } else {
          settings.noneditableSettings[key] = val;
        }
      });

      return settings;
    }

    // network and game functions

  }, {
    key: 'exec',
    value: function exec(msg, data, client) {
      this.gameVars ? this[msg](data, client) : 0; // if active run
    }
  }, {
    key: 'shipUpdated',
    value: function shipUpdated(data, client) {
      // reflect message
      this.broadcast('shipUpdated', data, client);
    }
  }, {
    key: 'shipOverridden',
    value: function shipOverridden(data, client) {
      // reflect message
      this.broadcast('shipOverridden', data, client);
    }
  }, {
    key: 'shipHPAdjusted',
    value: function shipHPAdjusted(data, client) {
      // reflect message
      this.broadcast('shipHPAdjusted', data, client);

      // log to game records

      var _data2 = _slicedToArray(data, 3),
          hp = _data2[1],
          fromID = _data2[2];

      this.gameVars.modeLogic.playerRecordsHPGivenIncrement(fromID, hp);
    }
  }, {
    key: 'bulletCreated',
    value: function bulletCreated(data, client) {
      // reflect message
      this.broadcast('bulletCreated', data, client);
    }
  }, {
    key: 'bulletDestroyed',
    value: function bulletDestroyed(data, client) {
      // reflect message
      this.broadcast('bulletDestroyed', data, client);
    }
  }, {
    key: 'blockCreated',
    value: function blockCreated(data, client) {
      // reflect message
      this.broadcast('blockCreated', data, client);

      // notify logic
      if (this.gameVars.options.mode == 1) {
        var id = data.id,
            team = data.team;

        this.gameVars.modeLogic.addBlockForTeam(id, team);
      }
    }
  }, {
    key: 'blockHPAdjusted',
    value: function blockHPAdjusted(data, client) {
      // reflect message
      this.broadcast('blockHPAdjusted', data, client);
    }
  }, {
    key: 'blockTeamSet',
    value: function blockTeamSet(data, client) {
      // reflect message
      this.broadcast('blockTeamSet', data, client);

      if (this.gameVars.options.mode == 1) {
        var _data3 = _slicedToArray(data, 2),
            id = _data3[0],
            team = _data3[1];

        this.gameVars.modeLogic.setBlockTeam(id, team);
      }
    }
  }, {
    key: 'blockDestroyed',
    value: function blockDestroyed(data, client) {
      // reflect message
      this.broadcast('blockDestroyed', data, client);

      // notify logic
      if (this.gameVars.options.mode == 1) {
        this.gameVars.modeLogic.removeBlock(data);
      }
    }
  }, {
    key: 'subCreated',
    value: function subCreated(data, client) {
      // reflect message
      this.broadcast('subCreated', data, client);
    }
  }, {
    key: 'subDestroyed',
    value: function subDestroyed(data, client) {
      // reflect message
      this.broadcast('subDestroyed', data, client);
    }
  }, {
    key: 'deathOccurrence',
    value: function deathOccurrence(data, client) {
      // reflect message
      this.broadcast('deathOccurrence', data, client);

      // log to game records

      var _data4 = _slicedToArray(data, 2),
          toID = _data4[0],
          fromID = _data4[1];

      this.gameVars.modeLogic.playerRecordsKillIncrement(fromID);
      this.gameVars.modeLogic.playerRecordsDeathIncrement(toID);
    }

    // mode (ctf)

  }, {
    key: 'flagCaptured',
    value: function flagCaptured(id, client) {

      // involve mode logic
      var modeLogic = this.gameVars.modeLogic;

      if (modeLogic.flagAvailable) {

        // reflect message
        this.broadcast('flagCaptured', id, client);

        // alert mode logic
        modeLogic.flagCaptured(id);
      }
    }
  }, {
    key: 'flagDropped',
    value: function flagDropped(data, client) {

      // reflect message
      this.broadcast('flagDropped', data, client);

      // notify mode logic
      this.gameVars.modeLogic.flagDropped();
    }
  }, {
    key: 'flagProgress',
    value: function flagProgress(data, client) {

      // interpret
      var _data5 = _slicedToArray(data, 2),
          team = _data5[0],
          score = _data5[1];

      var modeLogic = this.gameVars.modeLogic;

      // notify mode logic
      modeLogic.updateTeamScore(team, score);

      // reflect message
      this.broadcast('flagProgress', [team, modeLogic.scoreForTeam(team)], client);
    }
  }, {
    key: 'full',
    get: function get() {
      return !(this.playersMap.size < this.limit);
    }
  }, {
    key: 'empty',
    get: function get() {
      return this.playersMap.size == 0 && this.spectators.size == 0;
    }
  }, {
    key: 'connected',
    get: function get() {
      var everyone = Array.from(this.spectators).concat(Array.from(this.playersMap).map(function (i) {
        return i[0];
      }));
      return new Set(everyone);
    }
  }, {
    key: 'sustainable',
    get: function get() {
      return this.playersMap.size >= this.required_players;
    }
  }, {
    key: 'unsustainable',
    get: function get() {
      var unsus = this.playersMap.size < (this.limit == 1 ? 1 : 2); // console.log(`unsustainable: ${unsus}`);
      if (unsus) return true;
      return false;
    }
  }, {
    key: 'game_lead_team',
    get: function get() {
      return this.state.scores.shuffle().sort(function (a, b) {
        return a.s - b.s;
      })[0].t;
    }
  }, {
    key: 'locked',
    get: function get() {
      return typeof this._password !== 'undefined';
    }
  }]);

  return Lobby;
}();

var GameLogic = function () {
  function GameLogic(endCallback, numberOfTeams, players) {
    _classCallCheck(this, GameLogic);

    this.end = endCallback;
    this.setupPlayerRecords(players);
  }

  _createClass(GameLogic, [{
    key: 'setupPlayerRecords',
    value: function setupPlayerRecords(players) {

      this.playerRecords = new Map();
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = players[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var player = _step8.value;

          // sets default record for every id
          this.playerRecords.set(player[0], [0, 0, 0]);
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8.return) {
            _iterator8.return();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }
    }

    // Manipulate Players Records

  }, {
    key: 'playerRecordsKillIncrement',
    value: function playerRecordsKillIncrement(id) {
      var record = this.playerRecords.get(id);

      if (record) record[0]++; // kill count
    }
  }, {
    key: 'playerRecordsDeathIncrement',
    value: function playerRecordsDeathIncrement(id) {
      var record = this.playerRecords.get(id);

      if (record) record[1]++; // death count
    }
  }, {
    key: 'playerRecordsHPGivenIncrement',
    value: function playerRecordsHPGivenIncrement(id, hp) {
      var record = this.playerRecords.get(id);

      if (record) record[2] += hp; // hp given
    }
  }, {
    key: 'formatRecords',
    value: function formatRecords() {
      var recordsArray = [];
      this.playerRecords.forEach(function (record, id) {
        return recordsArray.push([id].concat(_toConsumableArray(record)));
      });
      return recordsArray;
    }
  }, {
    key: 'recap',
    value: function recap() {
      return [this.formatScores(), this.formatRecords()];
    }
  }]);

  return GameLogic;
}();

var CTFModeLogic = function (_GameLogic) {
  _inherits(CTFModeLogic, _GameLogic);

  function CTFModeLogic(endCallback, numberOfTeams, players) {
    _classCallCheck(this, CTFModeLogic);

    var _this8 = _possibleConstructorReturn(this, (CTFModeLogic.__proto__ || Object.getPrototypeOf(CTFModeLogic)).apply(this, arguments));

    _this8.scores = new Array(numberOfTeams).fill(100);
    _this8.playerWithFlag = null;

    _this8.updates = 0;
    return _this8;
  }

  _createClass(CTFModeLogic, [{
    key: 'flagCaptured',
    value: function flagCaptured(playersID) {
      this.playerWithFlag = playersID;this.updates = 0;
    }
  }, {
    key: 'flagDropped',
    value: function flagDropped() {
      this.playerWithFlag = null;this.updates = 0;
    }
  }, {
    key: 'flagIsHeldBy',
    value: function flagIsHeldBy(playersID) {
      return this.playerWithFlag === playersID;
    }
  }, {
    key: 'updateTeamScore',
    value: function updateTeamScore(team, score) {

      // only one update per flag capture
      // note: doesn't exactly validate appropriately
      if (++this.updates > 2) {
        console.log('update limit exceeded!');
        return;
      }

      // update registry
      if (score < 0) score = 0;
      if (this.scores[team]) this.scores[team] = score;

      console.log('team score updated: TEAM(' + team + ') SCORE(' + score + ')');

      // check for winner
      if (score < 1 && !this.flagAvailable) this.end();
    }
  }, {
    key: 'scoreForTeam',
    value: function scoreForTeam(number) {
      return this.scores[number];
    }
  }, {
    key: 'formatScores',
    value: function formatScores() {
      return this.scores;
    }
  }, {
    key: 'flagAvailable',
    get: function get() {
      return !this.playerWithFlag;
    }
  }]);

  return CTFModeLogic;
}(GameLogic);

var TerritorialModeLogic = function (_GameLogic2) {
  _inherits(TerritorialModeLogic, _GameLogic2);

  function TerritorialModeLogic(endCallback, numberOfTeams, players) {
    _classCallCheck(this, TerritorialModeLogic);

    var _this9 = _possibleConstructorReturn(this, (TerritorialModeLogic.__proto__ || Object.getPrototypeOf(TerritorialModeLogic)).apply(this, arguments));

    _this9.blocks = Array.new(numberOfTeams, function () {
      return new Set();
    });

    return _this9;
  }

  _createClass(TerritorialModeLogic, [{
    key: 'addBlockForTeam',
    value: function addBlockForTeam(id, index) {
      if (this.blocks[index]) this.blocks[index].add(id);
    }
  }, {
    key: 'removeBlock',
    value: function removeBlock(id) {
      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = this.blocks[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var teamCollection = _step9.value;

          if (teamCollection.delete(id)) return;
        }
      } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion9 && _iterator9.return) {
            _iterator9.return();
          }
        } finally {
          if (_didIteratorError9) {
            throw _iteratorError9;
          }
        }
      }
    }
  }, {
    key: 'setBlockTeam',
    value: function setBlockTeam(id, index) {
      this.removeBlock(id);
      this.addBlockForTeam(id, index);
    }
  }, {
    key: 'formatScores',
    value: function formatScores() {
      var scores = [];
      var _iteratorNormalCompletion10 = true;
      var _didIteratorError10 = false;
      var _iteratorError10 = undefined;

      try {
        for (var _iterator10 = this.blocks[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
          var teamCollection = _step10.value;

          scores.push(teamCollection.size);
        }
      } catch (err) {
        _didIteratorError10 = true;
        _iteratorError10 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion10 && _iterator10.return) {
            _iterator10.return();
          }
        } finally {
          if (_didIteratorError10) {
            throw _iteratorError10;
          }
        }
      }

      return scores;
    }
  }]);

  return TerritorialModeLogic;
}(GameLogic);

var MODES = [CTFModeLogic, TerritorialModeLogic];

// GAME PREF to be sent at start

var DeepSpaceGame = {};

DeepSpaceGame.colors = ['#FF4081', // 0 pink
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
'#F93FFF'];

DeepSpaceGame.colorCombinations = new Map([[1, [
// [0], [1], [2], [3], [4], [5], [10], [11], [12], [13]
[0], [1], [2], [3], [4], [11], [12], [13]]], [2, [[4, 0], [4, 1], [4, 10], [4, 2], [4, 11], [4, 3], [2, 1], [2, 0], [2, 5], [2, 12], [2, 11], [2, 13], [10, 12], [5, 11]]], [3, [[4, 3, 1], [4, 3, 0], [4, 2, 1], [4, 3, 2], [0, 2, 12], [2, 10, 12], [2, 0, 4], [2, 1, 5], [11, 5, 12], [11, 0, 2], [11, 2, 12], [11, 2, 4]]], [4, [[1, 2, 3, 4], [0, 2, 3, 4], [1, 2, 11, 4], [1, 2, 4, 5], [2, 1, 11, 5], [0, 2, 12, 4]]], [5, [[1, 10, 2, 3, 4], [1, 2, 3, 4, 5], [2, 11, 12, 4, 5], [0, 2, 12, 4, 5], [0, 2, 3, 4, 5], [10, 2, 3, 4, 5]]], [6, [[1, 10, 2, 3, 4, 5], [1, 10, 2, 3, 12, 4], [0, 10, 2, 3, 12, 4], [0, 2, 11, 12, 4, 5], [10, 2, 11, 12, 4, 5]]], [7, [[1, 10, 2, 3, 12, 4, 5], [0, 10, 2, 3, 12, 4, 5]]], [8, [[0, 10, 2, 11, 12, 4, 5, 13]]]]);

DeepSpaceGame.maps = [{
  name: "The Event Horizon",
  spawn: [[{ x: 10, y: 10 }, { x: 20, y: 20 }], [{ x: 758, y: 1014 }, { x: 748, y: 1004 }]]
}];

var LIGHT = {
  assortment: [['#0000ff', '#ff0000'], ['#0000ff', '#aedc39'], ['#0048ff', '#cc00ff']],

  randomDraw: function randomDraw() {
    var _LIGHT$assortment$sam = LIGHT.assortment.sample(),
        _LIGHT$assortment$sam2 = _slicedToArray(_LIGHT$assortment$sam, 2),
        c1 = _LIGHT$assortment$sam2[0],
        c2 = _LIGHT$assortment$sam2[1];

    return [Math.randomIntMinMax(15, 75), c1, c2];
  }
};

var REF = {
  lobby: {
    type: ['public', 'private', 'practice'],
    typeDesc: ['This is a public lobby. Players present have complete control over game settings', 'This is a private lobby. Players present have complete control over game settings', 'This is a practice lobby. Players present have complete control over game settings']
  },

  ship: {
    type: ['standard', 'rate', 'speed', 'defense', 'damage'],
    typeDesc: ['a tune with the world and itself, this is the balanced ship', 'this ship produces a stream of light bullets to trap and confuse', 'run your way out of any situation with the speed ship', 'take more than just a hit with the defense ship', 'this ship is feared across the reach of space, use it wisely'],
    sub: ['attractor', 'heat seeker', 'repulsors', 'stealth', 'block bomb'],
    stats: [['HEALTH', '0.6', '0.6', '0.2', '1.0', '0.7'], ['SPEED', '0.6', '0.6', '0.9', '0.4', '0.4'], ['ATTACK', '0.5', '0.4', '0.3', '0.5', '1.0'], ['RANGE', '0.5', '0.5', '0.3', '0.7', '0.4']]

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