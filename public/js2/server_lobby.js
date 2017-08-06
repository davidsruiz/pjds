
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Timer = require('./timer.js');

var TIME = { sec: function sec(mil) {
    return mil * 1000;
  }, min: function min(mil) {
    return this.sec(mil) * 60;
  } };

var MAX_PLAYER_LIMIT = 8;
var MIN_PLAYER_LIMIT = 2;
var MAX_NUM_OF_TEAMS = 4;
var GAME_DURATION = TIME.min(5); // 5 min 180000 3 min
var COUNTDOWN_DURATION = TIME.sec(3); // 3 sec
var OVERTIME_DURATION = TIME.sec(30);

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
    this.players = new Set();
    this.ongoing = false;

    this.connected = new Set();

    this.colors;
    // this.colors = DeepSpaceGame.colorCombinations.get(this.numOfTeams).sample().shuffle().map(e => DeepSpaceGame.colors[e])

    this.state = { scores: [], overtime: false };
    this.timer = new Timer(GAME_DURATION + COUNTDOWN_DURATION);
    this.setupData;

    this.gameOverCallback;
  }

  _createClass(Lobby, [{
    key: 'connect',
    value: function connect(client) {
      this.connected.add(client);
      client.lobby = this;
    }
  }, {
    key: 'disconnect',
    value: function disconnect(client) {
      this.connected.delete(client);
      delete client.lobby;
    }
  }, {
    key: 'join',
    value: function join(client, ship_data) {
      var status = ""; //
    }
  }, {
    key: 'join',
    value: function join(client) {
      var joined = false;
      if (this.players.size < this.limit && !this.ongoing) {
        this.players.set(client.userid, client);
        client.active = true;
        joined = true;
      }
      this.connected.set(client.userid, client);
      client.lobby = this;
      return joined;
    }
  }, {
    key: 'remove',
    value: function remove(client) {
      this.players.delete(client.userid);
      this.connected.delete(client.userid);

      if (client.active && this.ongoing) this.setupData.disconnects.push(client.userid);

      delete client.lobby;
      client.active = false;
    }
  }, {
    key: 'emit',
    value: function emit(msg, data) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.connected[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var key = _ref2[0];
          var value = _ref2[1];

          this.connected.get(key).emit(msg, data);
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
    }
  }, {
    key: 'broadcast',
    value: function broadcast(msg, data, client) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.connected[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _ref3 = _step2.value;

          var _ref4 = _slicedToArray(_ref3, 2);

          var key = _ref4[0];
          var value = _ref4[1];

          if (key != client.userid) this.connected.get(key).emit(msg, data);
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
    }

    // to remove circular dependencies and minimize bandwidth consumption,
    // only select data is sent over.

  }, {
    key: 'simplify',
    value: function simplify() {
      var _this = this;

      var obj = {};
      var block = function block(e) {
        return { name: e.name, cleared: _this.playerCleared(e), ready: !!e.ready };
      };
      this.players.forEach(function (player) {
        obj[player.userid] = block(player);
      });
      var send = { type: this.type, players: obj, capacity: this.limit, team_capacity: this.max_teams };
      // if(this.type == 'private') send.team_capacity = this.max_teams;
      return send;
    }
  }, {
    key: 'start',
    value: function start(callback) {
      var _this2 = this;

      if (!this.setupData) {
        this.gameOverCallback = callback;
        this.ongoing = true;
        this.timer.start(function () {
          _this2.timeout();
        });
        var numOfTeams = this.setupTeams();console.log(numOfTeams);
        var colors = DeepSpaceGame.colorCombinations.get(numOfTeams).sample().shuffle().map(function (e) {
          return DeepSpaceGame.colors[e];
        });
        var players = [],
            counter = 0;
        var block = function block(id, p, i) {
          // p.team = i%numOfTeams;
          return { name: p.name, team: p.team, index: i, id: id, type: p.type };
        };
        Array.from(this.players).shuffle().forEach(function (entry) {
          var _entry = _slicedToArray(entry, 2),
              id = _entry[0],
              player = _entry[1];

          players.push(block(id, player, counter++));
        });
        this.setupData = {
          teams: numOfTeams,
          colors: colors,
          players: players,
          state: this.state,
          disconnects: [],
          tint: TINT.shuffle()
        };

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = this.players[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _ref5 = _step3.value;

            var _ref6 = _slicedToArray(_ref5, 2);

            var id = _ref6[0];
            var player = _ref6[1];
            player.ready = false;
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

        for (var i = 0; i < numOfTeams; i++) {
          this.state.scores.push({ t: i, s: 100 });
        }
      }
      this.setupData.duration = this.timer.timeLeft - COUNTDOWN_DURATION;
      return this.setupData;
    }
  }, {
    key: 'setupTeams',
    value: function setupTeams() {
      // private matches distribute teams freely
      if (this.type == 'practice') this.max_teams = 1; // TODO: fix.. not good
      return this.type == 'private' ? this.freeTeamCountSetup() : this.explicitTeamCountSetup();
    }
  }, {
    key: 'explicitTeamCountSetup',
    value: function explicitTeamCountSetup() {
      var _this3 = this;

      Array.from(this.players).shuffle().forEach(function (entry, i) {
        var _entry2 = _slicedToArray(entry, 2),
            player = _entry2[1];

        player.team = i % _this3.max_teams;
      });
      return this.max_teams;
    }
  }, {
    key: 'freeTeamCountSetup',
    value: function freeTeamCountSetup() {
      var teams = [];
      for (var i = 0; i < this.max_teams; i++) {
        teams.push([]);
      } // first players that have explicitly chosen a team get assigned to it (if valid)
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.players[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _ref7 = _step4.value;

          var _ref8 = _slicedToArray(_ref7, 2);

          var player = _ref8[1];

          if (player.team < this.max_teams && player.team >= 0) {
            teams[player.team].push(player);
          } else {
            player.team = -1;
          }
        }

        // then empty teams are removed
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

      teams = teams.filter(function (arr) {
        return arr.length != 0;
      }); // console.log(teams.map(arr => arr.length)); console.log(teams.map(arr => arr.map(player => player.name)));

      // and every player without a team gets its own team
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = this.players[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var _ref9 = _step5.value;

          var _ref10 = _slicedToArray(_ref9, 2);

          var _player = _ref10[1];

          if (_player.team == -1) teams.push([_player]);
        } // players are given their final (and now organized) team number
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

      teams.forEach(function (team, i) {
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = team[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var _player2 = _step6.value;

            _player2.team = i;
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
      });

      return teams.length;
    }
  }, {
    key: 'playerCleared',
    value: function playerCleared(player) {
      return !(!player.type || player.name.empty());
    }
  }, {
    key: 'active',
    value: function active(userid) {
      return this.players.has(userid);
    }
  }, {
    key: 'setWinForPlayers',
    value: function setWinForPlayers(winningTeam) {
      var _this4 = this;

      if (this.type != 'public') return;
      // if no winning team index is presented, one is deducted using the current scores
      // if(typeof winningTeam === 'undefined') {
      //   if(this.state.scores.length != 0) {
      //     winningTeam = this.state.scores.shuffle().sort((a,b) => a.s-b.s)[0].t;
      //   } else {
      //     winningTeam = Math.floor(Math.random()*this.setupData.teams);
      //     `no scores were registered!!`.yellow();
      //   }
      // }
      winningTeam = winningTeam || this.state.leadTeam;
      this.setupData.players.forEach(function (player_info) {
        var client = _this4.players.get(player_info.id);
        if (client && player_info.team == winningTeam) client.won = true;
      });
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
      }, 1000);
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
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = this.setupData.players[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var player = _step7.value;

          if (player.id == client_id) return player.team;
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
      // player -> { name, rank, team, ready, ship, slots [] }
      var play_arr = Array.from(this.players).map(function (c) {
        return c.name;
      }).filter(function (str) {
        return str;
      });
      // spectator -> name
      var spec_arr = Array.from(this.connected).map(function (c) {
        return c.id_;
      }).filter(function (str) {
        return str;
      });

      var type = REF.lobby.type.indexOf(this.type);

      return {
        type: type,
        code: this.id,
        password: this._password,
        game_settings: {
          map: null,
          player_capacity: null,
          mode: null,
          stock: null
        },
        users: {
          players: [
            // {name, rank, team, ready, ship, slots []}
          ],
          spectators: spec_arr
        }
      };
    }
  }, {
    key: 'full',
    get: function get() {
      return !(this.players.size < this.limit);
    }
  }, {
    key: 'ready',
    get: function get() {
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = this.players[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var _ref11 = _step8.value;

          var _ref12 = _slicedToArray(_ref11, 2);

          var id = _ref12[0];
          var player = _ref12[1];
          // console.log(`${player.userid} : ${player.ready}`);
          if (!player.ready) return false;
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

      return true;
    }
  }, {
    key: 'sustainable',
    get: function get() {
      return this.players.size >= this.required_players;
    }
  }, {
    key: 'unsustainable',
    get: function get() {
      var unsus = this.players.size < (this.limit == 1 ? 1 : 2); // console.log(`unsustainable: ${unsus}`);
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

var GameTimer = function () {
  function GameTimer() {
    var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    _classCallCheck(this, GameTimer);

    this.duration = time;
  }

  _createClass(GameTimer, [{
    key: 'start',
    value: function start(block) {
      this.startTime = Date.now();
      this.timout_id = setTimeout(function () {
        block();
      }, this.duration);
    }
  }, {
    key: 'stop',
    value: function stop() {
      clearTimeout(this.timout_id);
    }
  }, {
    key: 'timeElapsed',
    get: function get() {
      return Date.now() - this.startTime;
    }
  }, {
    key: 'timeLeft',
    get: function get() {
      return this.duration - this.timeElapsed;
    }
  }]);

  return GameTimer;
}();

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
'#263238' // 9 black
];

DeepSpaceGame.colorCombinations = new Map([[1, [[0], [1], [2], [3], [4], [5]]], [2, [[1, 4], // red, blue
[1, 2], // red, yellow
[5, 2], // purple, yellow
[2, 4], // yellow, blue
[2, 0], // yellow, pink
[0, 4], // pink, blue
[4, 3] // blue, green
]], [3, [[1, 3, 4], // red, green, blue
[2, 3, 4], // yellow, green, blue
[0, 2, 4] // pink, yellow, blue
]], [4, [[1, 2, 3, 4], // red, yellow, green, blue
[0, 2, 3, 4] // pink, yellow, green, blue
]]]);

DeepSpaceGame.maps = [{
  name: "The Event Horizon",
  spawn: [[{ x: 10, y: 10 }, { x: 20, y: 20 }], [{ x: 758, y: 1014 }, { x: 748, y: 1004 }]]
}];

var TINT = {
  assortment: [['#0000ff', '#ff0000'], ['#0000ff', '#aedc39'], ['#0048ff', '#cc00ff']],

  shuffle: function shuffle() {
    var _TINT$assortment$samp = TINT.assortment.sample(),
        _TINT$assortment$samp2 = _slicedToArray(_TINT$assortment$samp, 2),
        c1 = _TINT$assortment$samp2[0],
        c2 = _TINT$assortment$samp2[1];

    return [Math.randomIntMinMax(15, 75), c1, c2];
  }
};

var REF = {
  lobby: {
    type: ['public', 'private', 'practice'],
    typeDesc: ['This is a private lobby. Players present have complete control over game settings', 'This is a private lobby. Players present have complete control over game settings']
  },

  ship: {
    type: ['standard', 'rate', 'speed', 'defense', 'damage'],
    typeDesc: ['a tune with the world and itself, this is the balanced ship', 'this ship produces a stream of light bullets to trap and confuse', 'run your way out of any situation with the speed ship', 'take more than just a hit with the defense ship', 'this ship is feared across the reach of space, use it wisely'],
    sub: ['attractor', 'heat seeker', 'repulsors', 'stealth', 'block bomb'],
    stats: [['HEALTH', '0.6', '0.6', '0.2', '1.0', '0.7'], ['SPEED', '0.6', '0.6', '0.9', '0.4', '0.4'], ['ATTACK', '0.5', '0.4', '0.3', '0.5', '1.0'], ['RANGE', '0.5', '0.5', '0.3', '0.7', '0.4']]

  }

};

module.exports = Lobby;
//# sourceMappingURL=server_lobby.js.map