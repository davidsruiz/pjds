

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
  LOBBY.startCountdown(()=>{
    PARTICLES.stop();
    LOBBY.showHelpButton();
  	g = ENV.game = DeepSpaceGame.start(data);
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

socket.on('game over', (data) => NetworkHelper.in_game_over(data));
socket.on('game over ready', (data) => NetworkHelper.in_game_over_ready(data));

socket.on('disconnect player', (userid) => NetworkHelper.in_disconnect_player(userid));

function recordHistory(data) {
  let pp = ENV.storage.getItem("previous_players");

  if(pp) { pp = JSON.parse(pp).toSet() } else { pp = new Set() }
  for(let player of data.players) if(player.id !== ENV["id"]) {pp.delete(player.id); pp.add(player.id);}//pp.add(`${player.id}::${player.name}`);

  ENV.storage.setItem("previous_players", JSON.stringify(pp.toArray()));
}
