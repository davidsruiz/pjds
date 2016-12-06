
// EXTENTION //
Array.new=function(length, filler){var a = []; for(var i = 0; i < length; i++) a.push(filler); return a;}
var TIME = {sec: function(mil) {return mil * 1000}, min: function(mil) {return this.sec(mil) * 60}};
///////////////

LobbyManager = require('./lobby_manager.js');
var LM = new LobbyManager();
var clients = new Map();
// var lobbies = {}, public = {}, private = {};



var
    gameport        = process.env.PORT || 4004,

    io              = require('socket.io'),
    express         = require('express'),
    UUID            = require('node-uuid'),

    verbose         = false,
    http            = require('http'),
    app             = express(),
    server          = http.createServer(app);

// var shortid = require('shortid');
// shortid.characters("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
var colors = require('colors');
var bodyParser = require('body-parser');
app.use(bodyParser.json());

app.use(express.static('public'));

    //Tell the server to listen for incoming connections
    server.listen(80)
server.listen(gameport)
    //Log something so we know that it succeeded.
console.log('\t :: Express :: Listening on port ' + gameport );


app.get( '/', function( req, res ){

  res.sendfile("home.html");

});

// app.get( '/play', function( req, res ){ res.sendfile("play.html")

app.post( '/:type', function( req, res ){

  var lobbyID,
      type = req.params.type;

  switch(type) {
    case "pool":
    case "create":
    case "practice":
      if(type == "pool") lobbyID = LM.next();
      if(type == "create") lobbyID = LM.new_private();
      if(type == "practice") lobbyID = LM.new_private({players: 1});
      res.redirect(`/${lobbyID}`);
    break;

    case "online_status":
      console.log(`online_status`, req.body.history);
      var list = req.body.history;
      var online = []; var c = 0;
      for(var id of list) {
        var client = clients.get(id);
        if(client && client.lobby) {
          var entry = [client.name, client.lobby.id];
          online.push(entry);
        }
      }
      res.json(online);
    break;
  }

  // if(req.params.type == "pool") {
  //   lobbyID = LM.next();
  // } else
  // if(req.params.type == "create") {
  //   lobbyID = LM.new_private();
  // } else
  // if(req.params.type == "history") {
  //   lobbyID = LM.new_private();
  // }
  //
  // if(req.params.type == "practice") {
  //   lobbyID = LM.new_private({players: 1});
  // }
  //
  // // if(req.params.type == "private") private[lobbyID] = lobbies[lobbyID] = new Lobby(lobbyID);
  // // console.log(`new lobby: ${lobbyID}`);
  // res.redirect(`/${lobbyID}`);

});


app.get( '/friends' , function( req, res, next ) {

  res.sendfile("friends.html")

}); //app.get /friends

// routing to lobby
app.get( '/*' , function( req, res, next ) {

    var lobbyID = req.params[0];
    if(LM.exists(lobbyID)) {
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
// Lobby = require('./lobby.js');
// LobbyManager.

    //Socket.io will call this function when a client connects,
    //So we can send that client looking for a game to play,
    //as well as give that client a unique ID to use so we can
    //maintain the list if players.
sio.sockets.on('connection', function (client) {

      //tell the player they connected, giving them their id
    client.emit('onconnected', { id: UUID() } );
    client.on('userid', (id) => {
      client.userid = id;
      console.log(`client ${client.userid} +`.green);
    });

    client.on('join lobby', lobbyID => {
      var lobby = LM.lobby(lobbyID)
      if(lobby) {
        // check if there is room in lobby
        lobby.emit('lobby state', lobby.simplify());
        if(!lobby.join(client)) {
          client.emit('spectate');
          if(lobby.ongoing) {
            client.emit('start', lobby.game());
          }
        }
        clients.set(client.userid, client);
      } else {
        client.emit('error', `lobby ${lobbyID} not found`);
      }
    });

    client.on('set name', name => {
      var lobby
      if(lobby = client.lobby) {
        if(client.active) lobby.players.get(client.userid).name = name;

        lobby.emit('lobby state', lobby.simplify());

        // if(lobby.full && lobby.ready) lobby.emit('start', lobby.game());
      } else {
        client.emit('error', 'set name request ignored');
      }
    });

    client.on('set type', type => {
      var lobby
      if(lobby = client.lobby) {
        if(client.active) lobby.players.get(client.userid).type = type;
        client.emit('lobby state', lobby.simplify());
        // if(lobby.full && lobby.ready) lobby.emit('start', lobby.game());
      } else {
        client.emit('error', 'set type request ignored');
      }
    });


    client.on('ready', () => {
      var lobby
      if(lobby = client.lobby) {
        if(lobby.playerCleared(client)) client.ready = true;
        lobby.emit('lobby state', lobby.simplify());
console.log('ready')
        if(lobby.sustainable && lobby.ready)
          {lobby.emit('start', lobby.game()); }
      } else {
        client.emit('error', 'ready request ignored');
      }

    });



    client.on('disconnect', function () {

            //Useful to know when someone disconnects
        console.log(`client ${client.userid} -`.red);

        clients.delete(client.userid);

        var lobby = client.lobby
        if(lobby) {
          var was_active = client.active;
          lobby.remove(client);
          if(lobby.ongoing && was_active) {
            lobby.emit('disconnect player', client.userid);
            if(lobby.unsustainable) {
              lobby.emit('game error', 'a communications error occured');
              lobby.endCurrentGame();
            }
          }
          lobby.emit('lobby state', lobby.simplify());

          // remove if empty
          setTimeout(()=>{ var del = false;
            if(lobby.connected.size == 0) {LM.delete(lobby.id); del = true}
            // console.log(del ? `deleted` : `preserved`)
          }, 5000);

        }

    }); //client.on disconnect





    // during game
    client.on('ship update', data => client.lobby ? client.lobby.broadcast('ship update', data, client) : client.emit('stop'));
    client.on('ship override', data => client.lobby ? client.lobby.broadcast('ship override', data, client) : client.emit('stop'));
    client.on('bullet create', data => client.lobby ? client.lobby.broadcast('bullet create', data, client) : client.emit('stop'));
    client.on('bullet destroy', data => client.lobby ? client.lobby.broadcast('bullet destroy', data, client) : client.emit('stop'));

    client.on('ship damage', data => client.lobby ? client.lobby.emit('ship damage', data) : client.emit('stop'));

    client.on('block create', data => client.lobby ? client.lobby.broadcast('block create', data, client) : client.emit('stop'));
    client.on('block destroy', data => client.lobby ? client.lobby.broadcast('block destroy', data, client) : client.emit('stop'));
    client.on('block damage', data => client.lobby ? client.lobby.broadcast('block damage', data, client) : client.emit('stop'));
    client.on('block change', data => client.lobby ? client.lobby.broadcast('block change', data, client) : client.emit('stop'));

    client.on('sub create', data => client.lobby ? client.lobby.broadcast('sub create', data, client) : client.emit('stop'));
    client.on('sub destroy', data => client.lobby ? client.lobby.broadcast('sub destroy', data, client) : client.emit('stop'));


    client.on('flag pickup', data => {
      if(client.lobby) {
        client.lobby.emit('flag pickup', data)
        // client.lobby.first.emit('begin create asteroids')
        client.lobby.state.flagHolder = data.playerID;
      } else {
        client.emit('stop')
      }
    });
    client.on('flag drop', data => {
      if(client.lobby) {
        client.lobby.emit('flag drop', data)
        // client.lobby.emit('stop create asteroids')
        client.lobby.state.flagHolder = undefined;
      } else {
        client.emit('stop')
      }
    });

    client.on('msg ship kill', data => client.lobby ? client.lobby.emit('msg ship kill', data) : client.emit('stop'));

    client.on('game over', () => {
      var lobby;
      if(lobby = client.lobby) {
        lobby.endCurrentGame();
        client.emit('lobby state', lobby.simplify());
      }
    });

















}); //sio.sockets.on connection
