
// client.js
// by David Ruiz
// Copyright DEEP SPACE All Rights Reserved 2017


class Lobby {

  constructor() {

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
      team: null,
    };
    this.userIsJoined = false;

    this.socketSetup();
    this.network = new GameNetworkAdapter(null, this.socket)

    window.onbeforeunload = () => this.beforeExit();

  }

  socketSetup() {
    let socket = this.socket = io.connect();

    socket.on('pie', ()=>{alert('received')});
    socket.on('error', (msg)=>{alert(`server error -- ${msg}`)});

    // setting up responses`

    // connect -> auth
    // connect -> connected
    socket.on('auth', (a)=>this.auth(a));
    socket.on('connected', (a)=>this.connected(a));
    socket.on('passwordSet', (a)=>this.passwordSet(a));
    socket.on('passwordCleared', (a)=>this.passwordCleared(a));

    socket.on('joined', (a)=>this.joined(a));
    socket.on('lobbyFull', (a)=>this.lobbyFull(a));
    socket.on('starting', (a)=>this.starting(a));

    socket.on('usersUpdate', (a)=>this.usersUpdate(a));
    socket.on('playersUpdate', (a)=>this.playersUpdate(a));
    socket.on('optionsUpdate', (a)=>this.optionsUpdate(a));

    socket.on('gameStarted', (a)=>this.gameStarted(a));
    socket.on('gameEnded', (a)=>this.gameEnded(a));

    socket.on('disconnected', (a)=>this.disconnected(a));
  }


  connect() {

    // connect to specific lobby presenting id and name
    let lobbyID = window.location.pathname.slice(1),
        // [lobby_id, user_id, user_name];

        data = [lobbyID, ENV.user.id, ENV.user.name];

    this.socket.emit('connect', data);
  }

  auth() {

    let password = window.prompt('This lobby requires a password. Enter it here:');

    // if dialog was canceled, return home
    if(password === null) {
      history.back();
      return;
    }
    
    // connect to specific lobby presenting id and name
    let lobbyID = window.location.pathname.slice(1),
      // [lobby_id, user_id, user_name];
      data = [lobbyID, password];

    this.socket.emit('auth', data);
  }

  connected(data) {
    // data [user_id, lobby_object]

    ENV.user.id = data[0];

    this.info = data[1];

    // ENV.UI.init();
    ENV.lobby_ui.render();

    // NOTE NOTE NOTE: if the lobby is public or private automatically join as
    // there was always room for you as intended.
    const lobbyType = this.info.type;
    if(lobbyType == 0 || lobbyType == 2) this.join();
  }

  join() {

    // OLD
    // the prerequisits for joining are:
    // {name, rank, team, ready, ship, slots []}

    // NEW
    // the prerequisits for joining are:
    // {name, rank, team}

    // :name
    if(!ENV.user.name) ENV.UA.getName();

    // :team
    switch(this.info.type) {
      case 0: // public
        this.user.team = null;
        break;
      case 1: // private
        if((this.user.team = ENV.lobby_ui.getTeam()) === null) return;
        break;
      case 2: // practice
        this.user.team = 0;
        break;
    }

    // :rank
    ENV.user.get_rank.then(rank => {

      let data = [ENV.user.name, rank, this.user.team];
      this.socket.emit('join', data);

    }).catch(()=>{
      alert('An error occurred...')
    });


    // connect to specific lobby presenting id and name
    // let lobbyID = window.location.pathname.slice(1),
    //   // [lobby_id, user_id, user_name];
    //
    //   data = [ENV.user.name, shipType];
    //
    // this.socket.emit('join', data);

  }

  joined() {
    this.user.isJoined = true;
    ENV.lobby_ui.render();
  }

  lobbyFull() {
    ENV.lobby_ui.render();
  }

  start(shipType) {

    // future prerequisits for starting are:
    // {shipType, [slots]}

    // the prerequisits for starting are:
    // {shipType}

    this.socket.emit('start', shipType);

  }

  starting() {
    this.user.isReady = true;
    ENV.lobby_ui.render();
  }

  usersUpdate(newUsersData) {
    this.info.users = newUsersData;
    ENV.lobby_ui.render();
  }

  playersUpdate(newUsersData) {
    this.info.users.players = newUsersData;
    ENV.lobby_ui.render();
  }

  updateOptions(key, value) {
    const data = [key, value];
    this.socket.emit('updateOptions', data);
  }

  optionsUpdate(data) {
    const [key, value] = data;
    this.info.game_settings.editableSettings[key] = value;
    ENV.lobby_ui.render();
  }

  setPassword() {

    const p = ENV.lobby_ui.getPassword();
    if(p) {
      this.socket.emit('setPassword', p);
    }

  }

  passwordSet(password) {
    this.info.password = password;
    ENV.lobby_ui.render();
  }

  clearPassword() {
    this.socket.emit('clearPassword');
  }
  
  passwordCleared() {
    this.info.password = null;
    ENV.lobby_ui.render();
  }



  // on game start
  gameStarted(setupData) {

    this.info.ongoing = true;

    ENV.spectate = !this.user.isJoined;
    ENV.game = DeepSpaceGame.create(setupData, this.network);
    ENV.friends.addHistory(_(setupData.players).reject(p => p[0] === ENV.user.id).map(p => [p[0], p[1]]));
    this.network.listen();

    LOBBY.startCountdown(()=>{
      ENV.game.start();
      LOBBY.refreshClock();
    })
  }

  gameEnded(results) {

    console.log(results);

    this.user.isReady = false;
    this.info.ongoing = false;

    this.network.stopListening();

    ENV.game.end();
    LOBBY.hideGame();

    setTimeout(() => {

      LOBBY.showResults(results);

    }, TIME.sec(2));

    // this.game.end();
  }


  disconnected() {}



  beforeExit() {

    // as a user closes the window..
    // - record if they leave a team alone
    const isOngoing = this.info.ongoing;
    const isPlaying = this.isJoined;
    const isPublicLobby = this.info.type == 0;
    if(isOngoing && isPlaying && isPublicLobby)
      ENV.storage.ongoing = true; // save in local storage TODO revise

  }

}




$(()=>{

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
class LobbyUI {

  constructor() {}

  get_name() {

    const
      regex = /^(\w|\s)+$/,
      validation = name => {
        // only alphanumeric and whitespace characters
        if(!(/^(\w|\s)+$/.test(name))) return false;

        // no profanity
        if(swearjar.profane(name)) return false;

        return true;
      };

    let name = ENV.user.name;
    while(!name || (name.trim()==="") || !validation(name)) {
      name = window.prompt('please enter a display name');
    }

    this.name = name.trim();
    resolve(name);



  }

  getTeam(max_team_count = ENV.lobby.info.game_settings.noneditableSettings.maxTeams, solo_option = true) {
    let result = window.prompt(`Type your team # between 1 and ${max_team_count} (blank for none)` );
    if(result === '') result = 0; // shortcut for solo

    const userCanceledDialog = result === null;
    const isNotANumber = isNaN(new Number(result));
    const isUnderBounds = result < 0;
    const isOverBounds = result > max_team_count;

    if(userCanceledDialog || isNotANumber || isUnderBounds || isOverBounds) return null;
    return result;
  }

  getPassword() {

    const password = window.prompt('Enter a 4 digit password', '0000');

    if(/^\d{4}$/.test(password)) {

      // success
      return password

    } else if(password === null) {

      // cancel
      return

    } else {

      // failure
      window.alert('Not 4 numbers, please try again...');
      return

    }

    

  }


  render() {
    ReactDOM.render(
      <DSGameLobby lobbySummary={ENV.lobby.info} joined={ENV.lobby.user.isJoined} ready={ENV.lobby.user.isReady} />,
      document.getElementById('container')
    );
  }

}
























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