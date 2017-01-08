
// EXTENTION //
Array.new = function(length, filler){let a = []; for(let i = 0; i < length; i++) a.push(filler); return a;};
// let TIME = {sec: function(mil) {return mil * 1000}, min: function(mil) {return this.sec(mil) * 60}};
///////////////

let LobbyManager = require('./lobby_manager.js');
let LM = new LobbyManager();
let clients = new Map();

TEA = require('./TEA.js');
let RANK = {
  MIN: 0, MAX: 599,
  win(current_rank) {
    let new_rank = current_rank + this.f1(current_rank);
    return this.validate(new_rank);
  },
  lose(current_rank) {
    let new_rank;
    if(current_rank < 300) { new_rank = current_rank - this.f2(current_rank); }
    else if(current_rank < 500) { new_rank = current_rank - this.f1(current_rank); }
    else { new_rank = current_rank - this.f3(current_rank); }
    return this.validate(new_rank);
  },
  f1(x) {return Math.round(2000/(x+100))}, // rank win (0 - 599), rank lose (300 - 499)
  f2(x) {return Math.round((600/(x+100)) + (21/6))}, // rank lose (0 - 299)
  f3(x) {return Math.round(Math.pow((-0.006*(x-400)), 2) + 3)}, // rank lose (500 - 599)
  validate(rank) {
    if(rank < this.MIN) { rank = this.MIN }
    else if(rank > this.MAX) { rank = this.MAX }
    return rank;
  }
};



let
    gameport        = process.env.PORT || 4004,

    io              = require('socket.io'),
    express         = require('express'),
    UUID            = require('node-uuid'),

    verbose         = false,
    http            = require('http'),
    app             = express(),
    server          = http.createServer(app);

// let shortid = require('shortid');
// shortid.characters("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
let colors = require('colors');
let bodyParser = require('body-parser');
app.use(bodyParser.json());

app.use(express.static('public'));

    //Tell the server to listen for incoming connections
    server.listen(80);
server.listen(gameport);
    //Log something so we know that it succeeded.
console.log('\t :: Express :: Listening on port ' + gameport );


app.get( '/', function( req, res ){

  res.sendfile("home.html");

});

// app.get( '/play', function( req, res ){ res.sendfile("play.html")

app.post( '/:type', function( req, res ){

  let lobbyID,
      type = req.params.type;

  switch(type) {
    case "pool":
    case "create":
    case "practice":
      if(type == "pool") lobbyID = LM.next();
      if(type == "create") lobbyID = LM.new_private();
      if(type == "practice") lobbyID = LM.new_practice();
      res.redirect(`/${lobbyID}`);
    break;

    case "online_status":
      let list = req.body.history;
      let online = []; let c = 0;
      for(let id of list) {
        let client = clients.get(id);
        if(client && client.lobby) {
          let entry = [client.name, client.lobby.id];
          online.push(entry);
        }
      }
      res.json(online);
    break;
    case "rank":
      var id = req.body.id,
          encoded_rank,
          simple_rank = 0;

      if(!id) {
        res.status(400).send('Bad Request');
      } else {
        encoded_rank = TEA.encrypt(simple_rank, id);
        res.json({simple: simple_rank, encoded: encoded_rank});
      }
    break;
    case "update_rank":
      var id = req.body.id || UUID(),
          encoded_rank = req.body.rank || '',
          simple_rank = parseInt(TEA.decrypt(encoded_rank, id));

      if(isNaN(simple_rank)) simple_rank = 0;

      let client = clients.get(id);
      if(client && client.won) { // if connected and needs winning
        simple_rank = RANK.win(simple_rank);
        client.won = false;
      } else {
        simple_rank = RANK.lose(simple_rank);
      }

      encoded_rank = TEA.encrypt(simple_rank, id);
      res.json({simple: simple_rank, encoded: encoded_rank});
    case "id":
      res.json(UUID());
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

    let lobbyID = req.params[0];
    if(LM.exists(lobbyID)) {
      res.sendfile("game.html");
    } else {
      res.redirect(`/`);
    }

}); //app.get *

    //Create a socket.io instance using our express server
let sio = io.listen(server);


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
      let lobby = LM.lobby(lobbyID)
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
      let lobby
      if(lobby = client.lobby) {
        if(client.active) lobby.players.get(client.userid).name = name;

        lobby.emit('lobby state', lobby.simplify());

        // if(lobby.full && lobby.ready) lobby.emit('start', lobby.game());
      } else {
        client.emit('error', 'set name request ignored');
      }
    });

    client.on('set type', type => {
      let lobby
      if(lobby = client.lobby) {
        if(client.active) lobby.players.get(client.userid).type = type;
        client.emit('lobby state', lobby.simplify());
        // if(lobby.full && lobby.ready) lobby.emit('start', lobby.game());
      } else {
        client.emit('error', 'set type request ignored');
      }
    });


    client.on('ready', () => {
      let lobby;
      if(lobby = client.lobby) {
        if(lobby.playerCleared(client)) client.ready = true;
        lobby.emit('lobby state', lobby.simplify());
        console.log('ready');
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

        let lobby = client.lobby;
        if(lobby) {
          let was_active = client.active;
          lobby.remove(client);
          if(lobby.ongoing && was_active) {
            if(lobby.state.flagHolder == client.userid) lobby.emit('flag drop');
            lobby.emit('disconnect player', client.userid);
            if(lobby.unsustainable) {
              lobby.emit('game error', 'a communications error occured');
              lobby.endCurrentGame();
            }
          }
          lobby.emit('lobby state', lobby.simplify());

          // remove if empty
          setTimeout(()=>{ let del = false;
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
        client.lobby.emit('flag pickup', data);
        // client.lobby.first.emit('begin create asteroids')
        client.lobby.state.flagHolder = data.playerID;
      } else {
        client.emit('stop')
      }
    });
    client.on('flag drop', data => {
      if(client.lobby) {
        client.lobby.emit('flag drop', data);
        // client.lobby.emit('stop create asteroids')
      } else {
        client.emit('stop')
      }
    });
    client.on('flag progress', data => {
      if(client.lobby) {
        console.log(`client ${client.name} sent ${data.score}`);
        if(client.userid == client.lobby.state.flagHolder) {
          client.lobby.state.scores[data.team] = {t: data.team, s: data.score};
          client.lobby.state.flagHolder = undefined;
          console.log(`data.team ${data.team}, data.score: ${data.score}`);
        }
      } else {
        client.emit('stop')
      }
    });

    client.on('msg ship kill', data => client.lobby ? client.lobby.emit('msg ship kill', data) : client.emit('stop'));

    client.on('game over', (data) => {
      let lobby;
      if((lobby = client.lobby) && lobby.state.flagHolder == client.userid) {
        console.log(`from 'game over'. winningTeam: ${data.winningTeam}`);
        if(lobby.type == 'public') lobby.setWinForPlayers(data.winningTeam);
        lobby.emit('game over', data);
        lobby.endCurrentGame();
        lobby.emit('lobby state', lobby.simplify());
      }
    });

















}); //sio.sockets.on connection
