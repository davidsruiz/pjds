'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Network = function () {
  function Network() {
    _classCallCheck(this, Network);
  }

  // connect to server using id and name

  _createClass(Network, [{
    key: 'connect',
    value: function connect() {}
  }]);

  return Network;
}();

var Lobby = function () {
  function Lobby() {
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

    this.socketSetup();
  }

  _createClass(Lobby, [{
    key: 'socketSetup',
    value: function socketSetup() {
      var _this = this;

      var socket = this.socket = io.connect();

      socket.on('pie', function () {
        alert('received');
      });

      // setting up responses`

      // connect -> auth
      // connect -> connected
      socket.on('auth', function (a) {
        return _this.auth(a);
      });
      socket.on('connected', function (a) {
        return _this.connected(a);
      });

      socket.on('playerAdded', function (a) {
        return _this.playerAdded(a);
      });
      socket.on('playerUpdated', function (a) {
        return _this.playerUpdated(a);
      });
      socket.on('playerRemoved', function (a) {
        return _this.playerRemoved(a);
      });

      socket.on('spectatorAdded', function (a) {
        return _this.spectatorAdded(a);
      });
      socket.on('spectatorUpdated', function (a) {
        return _this.spectatorUpdated(a);
      });
      socket.on('spectatorRemoved', function (a) {
        return _this.spectatorRemoved(a);
      });

      socket.on('updateMap', function (a) {
        return _this.updateMap(a);
      });

      socket.on('disconnected', function (a) {
        return _this.disconnected(a);
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

      // connect to specific lobby presenting id and name
      var lobbyID = window.location.pathname.slice(1),

      // [lobby_id, user_id, user_name];
      data = [lobbyID, password];

      this.socket.emit('auth', data);
    }
  }, {
    key: 'connected',
    value: function connected(data) {
      // data [user_id, lobby_object]

      ENV.user.id = data[0];

      this.info = data[1];

      // ENV.UI.init();
      ENV.lobby_ui.initReact();
    }
  }, {
    key: 'join',
    value: function join(shipType) {

      // the prerequisits for joining are:
      // {name, rank, team, ready, ship, slots []}

      // connect to specific lobby presenting id and name
      var lobbyID = window.location.pathname.slice(1),

      // [lobby_id, user_id, user_name];

      data = [lobbyID, ENV.user.id, ENV.user.name, false];

      this.socket.emit('connect', data);
    }
  }, {
    key: 'playerAdded',
    value: function playerAdded() {}
  }, {
    key: 'playerUpdated',
    value: function playerUpdated() {}
  }, {
    key: 'playerRemoved',
    value: function playerRemoved() {}
  }, {
    key: 'updateMap',
    value: function updateMap() {}
  }, {
    key: 'disconnected',
    value: function disconnected() {}
  }, {
    key: 'setPassword',
    value: function setPassword() {}
  }, {
    key: 'passwordSet',
    value: function passwordSet() {}
  }]);

  return Lobby;
}();

$(function () {

  // A client loads a lobby page..

  //-1. instantiate lobby (app)
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
    key: 'get_team',
    value: function get_team(max_team_count, solo_option) {}
  }, {
    key: 'initReact',
    value: function initReact() {
      ReactDOM.render(React.createElement(DSGameLobby, { data: ENV.lobby.info }), document.getElementById('container'));
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