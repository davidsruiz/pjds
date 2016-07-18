
var ENV = {};

// NETWORK INTERACTION

// CONNECT TO server
var socket = io.connect();

socket.on('onconnected', function(obj) {
  if(sessionStorage.id === undefined) sessionStorage.id = obj.id;
  socket.emit('userid', sessionStorage.id);

  // REQUEST JOIN lobby
  var lobbyID = window.location.pathname.slice(1);
  socket.emit('join lobby', lobbyID);
  console.log(lobbyID);

  // send name
  var name = sessionStorage.nickname || "";
  socket.emit('set name', name);

});

// handle errors
socket.on('error', msg => log(msg));

// on join lobby
socket.on('lobby state', lobby => {
  ENV["lobby"] = lobby;
  sessionStorage.nickname = lobby.players[sessionStorage.id].name;
  refreshLobbyView();
  log(lobby);
});





















// WAITING IN lobby

var lobby;

socket.on('lobby snapshot', function(names) {
	lobby = names;
});

socket.on('index', function(i) {
  game_index = i;
});

// START game

socket.on('start', function() {
	console.log('start requested, lobby: ' + lobby);
	// start();
});











socket.on('reset', function() {
});









var game_index;

function addPlayer(name) {
  // create player
  if(!name) name = "Player " + (players.length + 1);
  var p = players[players.length] = Player.create(name);

  // create and assign ship
  p.ship = Ship.create(screenWidth >> 1, screenHeight >> 1, this);

  // assign player on team
  teams[(players.length-1)%2].addPlayer(p);
  p.ship.color = p.team.color;

  // create Input logs
  playerInput.push([0, 0, false, false]);

}



// socket io








// socket.on('index', function(index) {
//   game.setup(index + 1);
//   game_index = index;
// });
//
// socket.on('new player', game.addPlayer);
// socket.on('begin', game.start);
//
// socket.on('update player', game.receive);
//
// function outputChange() {
//
// }

// function broadcastSelf() {
//   if(game_index === undefined) return;
//   socket.emit('state update', {shipData: players[game_index].ship.data(), inputData: playerInput[game_index], game_index: game_index});
//   return data;
// }


// function broadcastChange() {
//   if(game_index === undefined) return;
//   socket.emit('input update', {game_index: game_index, inputData: playerInput[game_index]});
// }
//
// socket.on('input update', function(data) {
//   playerInput[data.game_index] = data.inputData;
// });

function broadcastShip() {
  if(game_index === undefined) return;
  socket.emit('ship update', {game_index: game_index, shipData: players[game_index].ship.data()});
}

socket.on('ship update', function(data) {
  if(players[data.game_index]) players[data.game_index].ship = Ship.load(data.shipData);
});

function broadcastParticle(p) {
  if(game_index === undefined) return;
  socket.emit('particle update', {game_index: game_index, particle: p});
}

socket.on('particle update', function(data) {
  particles[particles.length] = Particle.load(data.particle);
});

function broadcastBullet(b) {
  if(game_index === undefined) return;
  socket.emit('bullet update', {game_index: game_index, bullet: b});
}

socket.on('bullet update', function(data) {
  bullets[bullets.length] = Bullet.load(data.bullet);
});

// COLLISIONS


function collideS(player_i) {
  socket.emit('collide ship', player_i);
}

socket.on('collide ship', function(player_i) {
  console.log(players[player_i].ship.idle);
  popShip(players[player_i].ship);
});

function collideB(b) {
  socket.emit('collide bullet', b.timestamp);
}

socket.on('collide bullet', function(timestamp) {
  var b = bullets.find(function(b) {return b.timestamp === timestamp});
  if(b) stopBullet(b);
});



// function () {
//   if(game_index === undefined) return;
//   socket.emit('input update', {game_index: game_index, inputData: playerInput[game_index]});
// }
