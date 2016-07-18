
// EXTENTION //
Array.new=function(length, filler){var a = []; for(var i = 0; i < length; i++) a.push(filler); return a;}
var TIME = {sec: function(mil) {return mil * 1000}, min: function(mil) {return this.sec(mil) * 60}};

// function toStr(o) {
//   var cache = [];
//   var str = JSON.stringify(o, function(key, value) {
//       if (typeof value === 'object' && value !== null) {
//           if (cache.indexOf(value) !== -1) {
//               // Circular reference found, discard key
//               return;
//           }
//           // Store value in our collection
//           cache.push(value);
//       }
//       return value;
//   });
//   cache = null; // Enable garbage collection
//   return str;
// }

// var Game = function(duration) {
//   this.ongoing = false;
//   this.duration = duration || TIME.sec(3);
//   return this;
// }
//
// Game.prototype.start = function() {
//   this.ongoing = true;
//   return this;
// }
//
// Game.prototype.over = function(callback) {
//   if(this.ongoing) setTimeout(function() { callback(); this.ongoing = false }, this.duration);
// }
// var Lobby = function() {
//   this.nil = 0;
//   this.size = 2;
//   this.spaces = Array.new(this.size, this.nil);
//
//   return this;
// }
//
// Lobby.prototype.inject = function(client) {
//   for(var i = 0; i < this.size; i++) {
//     if(this.spaces[i] == this.nil) {
//       this.spaces[i] = client;
//       return i;
//     }
//   }
//   return -1;
// }
//
// Lobby.prototype.remove = function(client) {
//   var i = this.spaces.indexOf(client);
//   if(i != -1) this.spaces[i] = 0;
// }
//
// Lobby.prototype.isFull = function() {
//   return this.spaces.indexOf(this.nil) == -1;
// }


var lobbies = {};

///////////////


var
    gameport        = process.env.PORT || 4004,

    io              = require('socket.io'),
    express         = require('express'),
    UUID            = require('node-uuid'),

    verbose         = false,
    http            = require('http'),
    app             = express(),
    server          = http.createServer(app);

var shortid = require('shortid');
// shortid.characters("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");

app.use(express.static('public'));

    //Tell the server to listen for incoming connections
server.listen(gameport)
    //Log something so we know that it succeeded.
console.log('\t :: Express :: Listening on port ' + gameport );


app.get( '/', function( req, res ){

  res.sendfile("home.html");

});

app.post( '/', function( req, res ){

  var lobbyID = shortid.generate();
  lobbies[lobbyID] = new Lobby(lobbyID); console.log(Object.keys(lobbies));
  res.redirect(`/${lobbyID}`);

});


// routing to lobby
app.get( '/*' , function( req, res, next ) {

    var lobbyID = req.params[0];
    if(lobbies[lobbyID]) {
      res.sendfile("game.html");
    } else {
      res.redirect(`/`);
    }

}); //app.get *

    //Create a socket.io instance using our express server
var sio = io.listen(server);


    //Configure the socket.io connection settings.
    //See http://socket.io/
sio.configure(function (){
    sio.set('log level', 0);
    sio.set('authorization', function (handshakeData, callback) {
      callback(null, true); // error first callback style
    });
});

    //Enter the game server code. The game server handles
    //client connections looking for a game, creating games,
    //leaving games, joining games and ending games when they leave.
// game_server = require('./game.server.js');
Lobby = require('./lobby.js');

    //Socket.io will call this function when a client connects,
    //So we can send that client looking for a game to play,
    //as well as give that client a unique ID to use so we can
    //maintain the list if players.
sio.sockets.on('connection', function (client) {

      //tell the player they connected, giving them their id
    client.emit('onconnected', { id: UUID() } );
    client.on('userid', (id) => {
      client.userid = id;
      console.log('\t socket.io:: player ' + client.userid + ' connected');
    });

    client.on('join lobby', lobbyID => {
      var lobby = lobbies[lobbyID]
      if(lobby) {
        // check if there is room in lobby
        if(lobby.join(client)) {
          client.lobby = lobby;
          lobby.emit('lobby state', lobby.simplify());
        } else {
          client.emit('error', 'this lobby is full');
        }
      } else {
        client.emit('error', `lobby ${lobbyID} not found`);
      }
    });

    client.on('set name', name => {
      var lobby = client.lobby
      if(lobby) {
        client.ready = true;
        lobby.players[client.userid].name = name;
        lobby.emit('lobby state', lobby.simplify());
      } else {
        client.emit('error', 'you are not part of this lobby');
      }
    });

    client.on('ready', () => { if(lobby.ready) client.lobby.emit('start') });



    client.on('disconnect', function () {

            //Useful to know when soomeone disconnects
        console.log('\t socket.io:: client disconnected ' + client.userid + ' ' + client.game_id);

        var lobby = client.lobby
        if(lobby) {
          lobby.remove(client);
          lobby.emit('lobby state', lobby.simplify());

          // remove if empty
          if(Object.keys(lobby.players).length == 0) delete lobbies[lobby.id];
        }

    }); //client.on disconnect


    // game

    // upon arrival
    /// try to join
    client.on('join with', function(name) {
      client.name = name;

      var clients_game_index = lobby.inject(client); // find spot
      if(clients_game_index != -1) { // if spot
        // success

        // send all lobby and the client its place in it
        sio.sockets.emit('lobby snapshot', lobby.spaces.map(function(e){return (e ? e.name : "")}) );
        client.emit('index', clients_game_index);

        // if server full begin
        if(lobby.isFull()) {
          client.emit('start');
          if(!game.ongoing) {
            // tell other clients
            client.broadcast.emit('start');
            // start local copy
            game.start()
            .over(function(){
              sio.sockets.emit('stop');
            });
          }
        }
        console.log(lobby.spaces.map(function(e){return (e ? e.name : "")}));
      } else {
        // failure
        // no more space in lobby
      }
    });


    // during game


    client.on('ship update', function(data) {
      // console.log("P " + data.game_index + " : x " + Math.round(data.shipData.pos._x).toString() + " : y " + Math.round(data.shipData.pos._y).toString());
      client.broadcast.emit('ship update', data);
    }); //client.on input update

    client.on('particle update', function(data) {
      client.broadcast.emit('particle update', data);
    }); //client.on input update

    client.on('bullet update', function(data) {
      client.broadcast.emit('bullet update', data);
    }); //client.on input update

    /// collisions
    client.on('collide ship', function(player_i) { sio.sockets.emit('collide ship', player_i); });
    client.on('collide bullet', function(timestamp) { sio.sockets.emit('collide bullet', timestamp); });



}); //sio.sockets.on connection




// var game = new Game();
// var lobby = new Lobby();


// setInterval(function() {}, 500);
