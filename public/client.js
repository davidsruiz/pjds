
var ENV = {};

// NETWORK INTERACTION

// CONNECT TO server
var socket = io.connect();

socket.on('onconnected', function(obj) {
  if(sessionStorage.id === undefined) sessionStorage.id = obj.id;
  socket.emit('userid', sessionStorage.id);
  ENV["id"] = sessionStorage.id;

  // REQUEST JOIN lobby
  var lobbyID = window.location.pathname.slice(1);
  socket.emit('join lobby', lobbyID);
  console.log(lobbyID);

  // send stored info
  var name = sessionStorage.nickname || "";
  socket.emit('set name', name);

  var type = sessionStorage.type;// || "balanced";
  if(type) socket.emit('set type', type);

  LOBBY.setupLink();

});

// handle errors
socket.on('error', msg => log(msg));

// on join lobby
var editing;
socket.on('lobby state', lobby => {
  // log(`lobby state`);
  // log(lobby.players);
  ENV["lobby"] = lobby;
  sessionStorage.nickname = lobby.players[sessionStorage.id].name;
  if(!editing) refreshLobbyView();
});

socket.on('spectate', function() {
  if(confirm("This lobby is closed. Join as a spectator?")) {
    ENV["spectate"] = true;
  } else {
    window.location = window.location.origin;
  }
});


















// START game

socket.on('start', function(data) {

  // log(`received start msg with data:`);
  // log(data);
  sud = data

  data.spectate = !!ENV["spectate"];

  LOBBY.startCountdown(()=>{
  	g = ENV["game"] = DeepSpaceGame.start(data);
  })
});

// during game

socket.on('ship update', (data) => NetworkHelper.setShip(data))
socket.on('bullet create', (data) => NetworkHelper.in_bullet_create(data))
socket.on('bullet destroy', (data) => NetworkHelper.in_bullet_destroy(data))
socket.on('ship damage', (data) => NetworkHelper.in_ship_damage(data))
socket.on('block create', (data) => NetworkHelper.in_block_create(data))
socket.on('block destroy', (data) => NetworkHelper.in_block_destroy(data))
socket.on('block damage', (data) => NetworkHelper.in_block_damage(data))

socket.on('pulse create', (data) => NetworkHelper.in_pulse_create(data))
socket.on('pulse destroy', (data) => NetworkHelper.in_pulse_destroy(data))

socket.on('flag pickup', (data) => NetworkHelper.in_flag_pickup(data))
socket.on('flag drop', (data) => NetworkHelper.in_flag_drop(data))

socket.on('msg ship kill', (data) => NetworkHelper.in_msg_ship_kill(data))

socket.on('stop', () => delete g)
