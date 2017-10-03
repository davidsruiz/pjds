'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// client.js
// by David Ruiz
// Copyright DEEP SPACE All Rights Reserved 2017


var Lobby = function () {
  function Lobby() {
    var _this = this;

    _classCallCheck(this, Lobby);

    this.info = {
      type: null,
      code: null,
      password: null,
      game_settings: {
        map: null,
        player_capacity: null,
        mode: null,
        stock: null
      },
      players: [
        // {name, rank, team, ready, ship, slots []}
      ],
      spectators: [
        // {name?}
      ]
    };

    this.user = {
      isJoined: false,
      isReady: false,
      team: null
    };

    this.socketSetup();
    this.network = new GameNetworkAdapter(null, this.socket);

    window.onbeforeunload = function (e) {
      return _this.beforeExit(e);
    };
  }

  _createClass(Lobby, [{
    key: 'socketSetup',
    value: function socketSetup() {
      var _this2 = this;

      var socket = this.socket = io.connect();

      socket.on('pie', function () {
        alert('received');
      });
      socket.on('error', function (msg) {
        console.error('server error -- ' + msg);
      });

      // setting up responses`

      // connect -> auth
      // connect -> connected
      socket.on('auth', function (a) {
        return _this2.auth(a);
      });
      socket.on('connected', function (a) {
        return _this2.connected(a);
      });
      socket.on('passwordSet', function (a) {
        return _this2.passwordSet(a);
      });
      socket.on('passwordCleared', function (a) {
        return _this2.passwordCleared(a);
      });

      socket.on('joined', function (a) {
        return _this2.joined(a);
      });
      socket.on('lobbyFull', function (a) {
        return _this2.lobbyFull(a);
      });
      socket.on('starting', function (a) {
        return _this2.starting(a);
      });

      socket.on('lobbyUpdate', function (a) {
        return _this2.lobbyUpdate(a);
      });
      socket.on('usersUpdate', function (a) {
        return _this2.usersUpdate(a);
      });
      socket.on('playersUpdate', function (a) {
        return _this2.playersUpdate(a);
      });
      socket.on('optionsUpdate', function (a) {
        return _this2.optionsUpdate(a);
      });
      socket.on('rotationUpdate', function (a) {
        return _this2.rotationUpdate(a);
      });

      socket.on('gameStarted', function (a) {
        return _this2.gameStarted(a);
      });
      socket.on('gameEnded', function (a) {
        return _this2.gameEnded(a);
      });

      socket.on('disconnect', function (a) {
        return _this2.disconnect(a);
      });
      socket.on('shouldChangeLobby', function (a) {
        return _this2.shouldChangeLobby(a);
      });
    }
  }, {
    key: 'connect',
    value: function connect() {

      // connect to specific lobby presenting id and name
      var lobbyID = window.location.pathname.slice(1),

      // [lobby_id, user_id, user_name];

      data = [lobbyID, ENV.user.id, ENV.user.name];

      this.socket.emit('connect', data);
    }
  }, {
    key: 'auth',
    value: function auth() {

      var password = window.prompt('This lobby requires a password. Enter it here:');

      // if dialog was canceled, return home
      if (password === null) {
        history.back();
        return;
      }

      // connect to specific lobby presenting id and name
      var lobbyID = window.location.pathname.slice(1),

      // [lobby_id, user_id, user_name];
      data = [lobbyID, password];

      this.socket.emit('auth', data);
    }
  }, {
    key: 'connected',
    value: function connected(data) {
      var _this3 = this;

      // data [user_id, lobby_object]

      ENV.user.id = data[0];

      this.info = data[1];

      // ENV.UI.init();
      ENV.lobby_ui.render();

      // NOTE NOTE NOTE: if the lobby is public or private automatically join as
      // there was always room for you as intended.
      var lobbyType = this.info.type;
      if (lobbyType == 0 || lobbyType == 2) this.join();

      if (lobbyType === 0) ENV.user.addListener('serverUpdate', function (data) {
        return _this3.serverUpdate(data);
      });
    }
  }, {
    key: 'join',
    value: function join() {
      var _this4 = this;

      // OLD
      // the prerequisits for joining are:
      // {name, rank, team, ready, ship, slots []}

      // NEW
      // the prerequisits for joining are:
      // {name, rank, team}

      // :name
      if (!ENV.user.name) ENV.UA.getName();

      // :team
      switch (this.info.type) {
        case 0:
          // public
          this.user.team = null;
          break;
        case 1:
          // private
          if ((this.user.team = ENV.lobby_ui.getTeam()) === null) return;
          break;
        case 2:
          // practice
          this.user.team = 0;
          break;
      }

      // :rank
      ENV.user.get_rank.then(function (rank) {

        var data = [ENV.user.name, rank, _this4.user.team];
        _this4.socket.emit('join', data);
      }).catch(function () {
        alert('An error occurred...');
      });

      // connect to specific lobby presenting id and name
      // let lobbyID = window.location.pathname.slice(1),
      //   // [lobby_id, user_id, user_name];
      //
      //   data = [ENV.user.name, shipType];
      //
      // this.socket.emit('join', data);
    }
  }, {
    key: 'joined',
    value: function joined() {
      this.user.isJoined = true;
      ENV.lobby_ui.render();
    }
  }, {
    key: 'lobbyFull',
    value: function lobbyFull() {
      ENV.lobby_ui.render();
    }
  }, {
    key: 'start',
    value: function start(shipType) {

      // future prerequisits for starting are:
      // {shipType, [slots]}

      // the prerequisits for starting are:
      // {shipType}

      this.socket.emit('start', shipType);
    }
  }, {
    key: 'starting',
    value: function starting() {
      this.user.isReady = true;
      ENV.lobby_ui.render();
    }
  }, {
    key: 'lobbyUpdate',
    value: function lobbyUpdate(newLobbyData) {
      this.info = newLobbyData;
      ENV.lobby_ui.render();
    }
  }, {
    key: 'usersUpdate',
    value: function usersUpdate(newUsersData) {
      this.info.users = newUsersData;
      ENV.lobby_ui.render();
    }
  }, {
    key: 'playersUpdate',
    value: function playersUpdate(newUsersData) {
      this.info.users.players = newUsersData;
      ENV.lobby_ui.render();
    }
  }, {
    key: 'updateOptions',
    value: function updateOptions(key, value) {
      var data = [key, value];
      this.socket.emit('updateOptions', data);
    }
  }, {
    key: 'optionsUpdate',
    value: function optionsUpdate(data) {
      var _data = _slicedToArray(data, 2),
          key = _data[0],
          value = _data[1];

      this.info.game_settings.editableSettings[key] = value;
      ENV.lobby_ui.render();
    }
  }, {
    key: 'rotationUpdate',
    value: function rotationUpdate(data) {
      var rotation = data.rotation,
          nextChange = data.nextChange;

      this.info.rotation = rotation;
      this.info.nextChange = nextChange;
      ENV.lobby_ui.render();
    }
  }, {
    key: 'setPassword',
    value: function setPassword() {

      var p = ENV.lobby_ui.getPassword();
      if (p) {
        this.socket.emit('setPassword', p);
      }
    }
  }, {
    key: 'passwordSet',
    value: function passwordSet(password) {
      this.info.password = password;
      ENV.lobby_ui.render();
    }
  }, {
    key: 'clearPassword',
    value: function clearPassword() {
      this.socket.emit('clearPassword');
    }
  }, {
    key: 'passwordCleared',
    value: function passwordCleared() {
      this.info.password = null;
      ENV.lobby_ui.render();
    }

    // on game start

  }, {
    key: 'gameStarted',
    value: function gameStarted(setupData) {

      this.info.ongoing = true;

      ENV.spectate = !this.user.isJoined;
      ENV.game = DeepSpaceGame.create(setupData, this.network);
      ENV.friends.addHistory(_(setupData.players).reject(function (p) {
        return p[0] === ENV.user.id;
      }).map(function (p) {
        return [p[0], p[1]];
      }));
      this.network.listen();

      LOBBY.startCountdown(function () {
        ENV.game.start();
        LOBBY.refreshClock();
      });
    }
  }, {
    key: 'gameEnded',
    value: function gameEnded(results) {

      console.log(results);

      this.user.isReady = false;
      this.info.ongoing = false;

      this.network.stopListening();

      ENV.game.end();
      LOBBY.hideGame();
      if (this.info.type === 0) RESULTS.updateUserWithResults(results);

      console.log(results);

      setTimeout(function () {

        LOBBY.showResults(results);
      }, TIME.sec(2));

      // this.game.end();
    }
  }, {
    key: 'serverUpdate',
    value: function serverUpdate(data) {
      var simple_rank = data.simple_rank;

      this.socket.emit('updateRank', simple_rank);
    }
  }, {
    key: 'disconnect',
    value: function disconnect(reason) {
      // window.alert('You have been disconnected');
      // window.location.reset();
      // window.location.replace(window.location.origin);
      // window.history.pushState({}, 'home', '/');

      window.location.reload();
    }
  }, {
    key: 'shouldChangeLobby',
    value: function shouldChangeLobby(lobbyID) {
      this.newLobbyID = lobbyID;
    }
  }, {
    key: 'changeLobby',
    value: function changeLobby() {
      window.location = window.location.origin + '/' + this.newLobbyID;
    }
  }, {
    key: 'beforeExit',
    value: function beforeExit(e) {

      // as a user closes the window..
      // - record if they leave a team alone
      var isOngoing = this.info.ongoing;
      var isPlaying = this.user.isJoined;
      var isPublicLobby = this.info.type == 0;
      if (isOngoing && isPlaying && isPublicLobby) ENV.storage.ongoing = true; // save in local storage TODO revise


      // const dialogText = 'Leave battle? You will lose rank points';
      // e.returnValue = dialogText;
      // return dialogText;

      return null;
    }
  }]);

  return Lobby;
}();

$(function () {

  // A client loads a lobby page..

  //-1. instantiate lobby (app)
  ENV.friends = new Friends();
  ENV.lobby = new Lobby();
  ENV.lobby_ui = new LobbyUI();

  // 0. open a connection with server
  ENV.lobby.connect();

  // 1. a valid id and valid name is sent
  //    response is either lobby data or denial
  //    remains in limbo state with frame only but not active

  // 2. if game is active, client is asked about continuing
  //    once accepted, lobby information is sent to client
  //    option to join is available

  // 3. request to join is sent
  //    response is either unable or simply success

  // 4. upon joining, player information is sent and options locked
  //


  //    popup handling place?

});

// handles lobby code about ui

var LobbyUI = function () {
  function LobbyUI() {
    _classCallCheck(this, LobbyUI);
  }

  _createClass(LobbyUI, [{
    key: 'get_name',
    value: function get_name() {

      var regex = /^(\w|\s)+$/,
          validation = function validation(name) {
        // only alphanumeric and whitespace characters
        if (!/^(\w|\s)+$/.test(name)) return false;

        // no profanity
        if (swearjar.profane(name)) return false;

        return true;
      };

      var name = ENV.user.name;
      while (!name || name.trim() === "" || !validation(name)) {
        name = window.prompt('please enter a display name');
      }

      this.name = name.trim();
      resolve(name);
    }
  }, {
    key: 'getTeam',
    value: function getTeam() {
      var max_team_count = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ENV.lobby.info.game_settings.noneditableSettings.maxTeams;
      var solo_option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      var result = window.prompt('Type your team # between 1 and ' + max_team_count + ' (blank for none)');
      if (result === '') result = 0; // shortcut for solo

      var userCanceledDialog = result === null;
      var isNotANumber = isNaN(new Number(result));
      var isUnderBounds = result < 0;
      var isOverBounds = result > max_team_count;

      if (userCanceledDialog || isNotANumber || isUnderBounds || isOverBounds) return null;
      return result;
    }
  }, {
    key: 'getPassword',
    value: function getPassword() {

      var password = window.prompt('Enter a 4 digit password', '0000');

      if (/^\d{4}$/.test(password)) {

        // success
        return password;
      } else if (password === null) {

        // cancel
        return;
      } else {

        // failure
        window.alert('Not 4 numbers, please try again...');
        return;
      }
    }
  }, {
    key: 'render',
    value: function render() {
      ReactDOM.render(React.createElement(DSGameLobby, { lobbySummary: ENV.lobby.info, joined: ENV.lobby.user.isJoined, ready: ENV.lobby.user.isReady }), document.getElementById('container'));
    }
  }]);

  return LobbyUI;
}();

/*





// NETWORK INTERACTION

// CONNECT TO server
let socket = io.connect();

socket.on('onconnected', function(obj) {
  if(ENV.user.id === undefined) ENV.user.id = obj.id;
  socket.emit('userid', ENV.user.id);
  ENV["id"] = ENV.user.id;

  // REQUEST JOIN lobby
  let lobbyID = window.location.pathname.slice(1);
  socket.emit('join lobby', lobbyID);

  // send stored info
  let name = ENV.storage.user_name || "";
  socket.emit('set name', name);

  let type = ENV.storage.type || "standard"; // TODO: double hard-coded see view.js:36
  if(type) socket.emit('set type', type);

  // if(sessionStorage.ready = !!(sessionStorage.nickname && sessionStorage.type)) socket.emit('ready');

  LOBBY.setupLink();
  LOBBY.focusOnInput();
});

socket.on('lobby joined', lobby_type => {
  if(lobby_type == 'private') {
    let team = ENV.storage.team || -1; // TODO: double hard-coded see view.js:36
    if(team) socket.emit('set team', team);
  }
})

// handle errors
socket.on('error', msg => log(msg));
socket.on('game error', msg => LOBBY.disconnect(msg));

// on join lobby
let editing;
socket.on('lobby state', lobby => {
  // log(`lobby state`);
  // log(lobby.players);
  ENV["lobby"] = lobby;
  let me = lobby.players[ENV.storage.id];
  if(me) ENV.user.name = me.name;
  if(!editing) refreshLobbyView();
});

socket.on('spectate', function() {
  if(confirm("This lobby is closed. Join as a spectator?")) {
    ENV["spectate"] = true;
  } else {
    window.location.reset()
  }
});

socket.on('ready', () => {
  // LOBBY.disableInput();
});

// socket.on('disconnect', () => LOBBY.disconnect(`you are no longer connected`));















// NEEDS WORK
let CODE = {};

// START game

CODE.start_game = function(data) {

  if(!ENV.lobby) { setTimeout(()=>{CODE.start_game(data)}, 100); return; }

  recordHistory(data);

  data.spectate = !!ENV["spectate"];
  ENV.sound.stop('chill');
  if(ENV.lobby.type == 'public' && !ENV.spectate) ENV.storage.ongoing = 'true';
  if(!ENV.storage.first_game  && !ENV.spectate) { ENV.help.drawer.expand(); ENV.help.carousel.start(); ENV.storage.first_game = true; }
  g = ENV.game = DeepSpaceGame.create(data);
  LOBBY.startCountdown(()=>{
    PARTICLES.stop();
    LOBBY.showHelpButton();
  	ENV.game.start();
  	LOBBY.refreshClock();
  })
};

socket.on('start', CODE.start_game);

// during game

// socket.on('input stack', (data) => NetworkHelper.in_input_stack(data));
socket.on('ship update', (data) => NetworkHelper.in_ship_update(data));
socket.on('ship override', (data) => NetworkHelper.in_ship_override(data));
socket.on('bullet create', (data) => NetworkHelper.in_bullet_create(data));
socket.on('bullet destroy', (data) => NetworkHelper.in_bullet_destroy(data));
socket.on('ship damage', (data) => NetworkHelper.in_ship_damage(data));
socket.on('block create', (data) => NetworkHelper.in_block_create(data));
socket.on('block destroy', (data) => NetworkHelper.in_block_destroy(data));
socket.on('block damage', (data) => NetworkHelper.in_block_damage(data));
socket.on('block change', (data) => NetworkHelper.in_block_change(data));

socket.on('sub create', (data) => NetworkHelper.in_sub_create(data));
socket.on('sub destroy', (data) => NetworkHelper.in_sub_destroy(data));

socket.on('flag pickup', (data) => NetworkHelper.in_flag_pickup(data));
socket.on('flag drop', (data) => NetworkHelper.in_flag_drop(data));

socket.on('msg ship kill', (data) => NetworkHelper.in_msg_ship_kill(data));

socket.on('stop', () => delete DeepSpaceGame.runningInstance);

socket.on('game over', (data) => NetworkHelper.end_game());
socket.on('request progress', (data) => NetworkHelper.request_local_progress());
socket.on('overtime', () => NetworkHelper.go_overtime());

socket.on('disconnect player', (userid) => NetworkHelper.in_disconnect_player(userid));

function recordHistory(data) {
  let pp = ENV.storage.getItem("previous_players");

  if(pp) { pp = JSON.parse(pp).toSet() } else { pp = new Set() }
  for(let player of data.players) if(player.id !== ENV["id"]) {pp.delete(player.id); pp.add(player.id);}//pp.add(`${player.id}::${player.name}`);

  ENV.storage.setItem("previous_players", JSON.stringify(pp.toArray()));
}
*/
//# sourceMappingURL=client.js.map