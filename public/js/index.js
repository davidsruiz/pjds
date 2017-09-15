
// EXTENTION //
// Array.new = function(length, filler){let a = []; for(let i = 0; i < length; i++) a.push(filler); return a;};
// let TIME = {sec: function(mil) {return mil * 1000}, min: function(mil) {return this.sec(mil) * 60}};
///////////////

const LobbyManager = require('./lobby_manager.js');
const LM = new LobbyManager();
let clients = new Map();

const TEA = require('./TEA.js');
const RANK = {
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

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

// Math.flipCoin = (p = 0.5) => Math.random() < p;
// Array.prototype.shuffle = function() { return this.sort(() => Math.flipCoin() )};
const UUID = () => s4() + s4();



let
  gameport        = process.env.PORT || 4004,

  io              = require('socket.io'),
  express         = require('express'),
  // UUID            = require('node-uuid'),

  verbose         = false,
  http            = require('http'),
  app             = express(),
  server          = http.createServer(app);

// let shortid = require('shortid');
// shortid.characters("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
// const UUID = () => shortid.generate();

const colors = require('colors');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const path = require('path');

app.use(express.static(path.resolve('public')));

//Tell the server to listen for incoming connections
server.listen(80);
server.listen(gameport);
//Log something so we know that it succeeded.
console.log('\t :: Express :: Listening on port ' + gameport );


app.get( '/', function( req, res ) {

  res.sendfile(path.resolve('public/home.html'));

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
      const IDs = req.body.list;

      // lobbies/unavailable
      const lobbiesMap = new Map();
      const unavailable = [];
      for(let id of IDs) {
        const client = clients.get(id);
        if(client && client.lobby && LM.existsInPrivate(client.lobby.id)) {
          // lobbies
          const lobby = lobbiesMap.get(client.lobby.id) || [];
          lobby.push(id);
          lobbiesMap.set(client.lobby.id, lobby);
        } else {
          // unavailable
          unavailable.push(id);
        }
      }
      const lobbies = Array.from(lobbiesMap).map(pair => [pair[0], ...pair[1]]); // transform lobbies map

      // names
      const names = [];
      for(let id of IDs) {
        const client = clients.get(id);
        if(client) names.push([id, client.name])
      }

      // response
      res.json({lobbies, unavailable, names});

      break;
    case "rank":
      var id = req.body.id,
        encoded_rank,
        simple_rank = 0;

      if(!id) {
        res.status(400).send('No ID');
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
      // if(client && client.lobby && client.lobby.removeWinner(id)) { // if connected and needs winning
        client.won = false;
        simple_rank = RANK.win(simple_rank);
      } else {
        simple_rank = RANK.lose(simple_rank);
      }

      encoded_rank = TEA.encrypt(simple_rank, id);
      res.json({simple: simple_rank, encoded: encoded_rank});
      break;
    case 'update_stats':

      let id = req.body[0] || UUID();
      let rank = req.body[1] || '';
      let money = req.body[2] || '';
      let simple_rank = parseInt(TEA.decrypt(rank, id));
      let simple_money = parseInt(TEA.decrypt(money, id));

      // if either is invalid, reset.
      if(isNaN(simple_rank) || isNaN(simple_money)) {
        simple_rank = 0;
        simple_money = 0;
      }

      const onlineClient = clients.get(id);
      if((onlineClient && onlineClient.lobby) && onlineClient.lobby.lastGameResults.has(id)) {

        const [won, hits] = onlineClient.lobby.lastGameResults.get(id);
        onlineClient.lobby.lastGameResults.delete(id);

        // rank
        if(won) {
          simple_rank = RANK.win(simple_rank);
        } else {
          simple_rank = RANK.lose(simple_rank);
        }

        // money
        simple_money += hits;

      } else { simple_rank = RANK.lose(simple_rank); }

      rank = TEA.encrypt(simple_rank, id);
      money = TEA.encrypt(simple_money, id);
      res.json([rank, money, simple_rank, simple_money]);


      break;
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
  // if(req.params.type == "practice") {
  //   lobbyID = LM.new_private({players: 1});
  // }
  //
  // // if(req.params.type == "private") private[lobbyID] = lobbies[lobbyID] = new Lobby(lobbyID);
  // // console.log(`new lobby: ${lobbyID}`);
  // res.redirect(`/${lobbyID}`);

});


app.get( '/friends' , function( req, res, next ) {

  res.sendfile(path.resolve('public/friends.html'));

}); //app.get /friends

// routing to lobby
app.get( '/*' , function( req, res, next ) {

  let lobbyID = req.params[0];
  if(LM.exists(lobbyID)) {
    res.sendfile(path.resolve('public/game.html'));
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
// Lobby = require('./old_lobby.js');
// LobbyManager.

//Socket.io will call this function when a client connects,
//So we can send that client looking for a game to play,
//as well as give that client a unique ID to use so we can
//maintain the list if players.





sio.sockets.on('connection', function (client) {

  client.on('connect', data => {
    // data [lobby_id, user_id, user_name]
    // reply with either auth or connected

    // identify lobby
    const lobby = LM.lobby(data[0]);
    if(lobby) {

      // assign values to client
      client.id_ = data[1] || UUID();
      client.name = data[2];

      // require authentication (or not)
      if(lobby.locked) {
        client.emit('auth');
      } else {
        // connect to lobby
        lobby.connect(client);
        // send client it's ID copy of lobby as now stands
        client.emit('connected', [client.id_, lobby.map()]);
        lobby.broadcast('usersUpdate', lobby.mapUsers(), client);
      }
    } else { client.emit('error', `lobby ${data[0]} not found`); }

    // client.emit('connected');
  });

  client.on('auth', data => {
    // data [lobby_id, password]
    // reply with either auth or connected

    // identify lobby
    const lobby = LM.lobby(data[0]);
    if(lobby) {

      // check if password is needed
      if(lobby.locked) {

        // test against password
        if(lobby.testPassword(data[1])) {
          lobby.connect(client);
          client.emit('connected', [client.id_, lobby.map()]);
          lobby.broadcast('usersUpdate', lobby.mapUsers(), client);
        } else {
          client.emit('auth');
        }
      } else {
        console.warn(`no auth needed! for lobby ${data[0]}`);
        client.emit('connected', [client.id_, lobby.map()]);
        lobby.broadcast('usersUpdate', lobby.mapUsers(), client);
      }
    } else { client.emit('error', `lobby ${data[0]} not found`); }

  });

  client.on('join', data => {

    // verify participant to lobby
    const lobby = client.lobby;
    if(lobby) {

      // return if client has already joined
      if(lobby.playersMap.has(client)) return;

      // actual joining
      lobby.join(client, data)
        .then(()=>{
          client.emit('joined');
          lobby.emit('usersUpdate', lobby.mapUsers())

          // show up on server's radar
          // rank change and more
          clients.set(client.id_, client);
        })
        .catch((reason)=>{
          console.log(reason.message.yellow);
          // client.emit('error', reason);
        });

    }

  });

  client.on('start', data => {

    // verify participant to lobby
    const lobby = client.lobby;
    if(lobby) {

      // return if client has already opted to start
      if(lobby.playersMap.get(client)[3]) return;

      // actual opt to start
      lobby.startFrom(client, data)
        .then((everyoneIsReady)=>{
          client.emit('starting');
          lobby.emit('playersUpdate', lobby.mapPlayers());

          // start if everyone is ready
          if(everyoneIsReady)
            lobby.startGame(), lobby.emit('gameStarted', lobby.getSetupData());
        })
        .catch((reason)=>{
          console.log(reason.message.yellow);
          // client.emit('error', reason.message);
        });

    }

  });




  client.on('updateOptions', data => {

    // remove connection to lobby
    const lobby = client.lobby;
    if(lobby) {

      lobby.updateOptions(data);

    } else {  }

  });

  client.on('setPassword', data => {

    // remove connection to lobby
    const lobby = client.lobby;
    if(lobby) {

      lobby.setPasswordFrom(client, data);

    } else {  }

  });

  client.on('clearPassword', data => {

    // remove connection to lobby
    const lobby = client.lobby;
    if(lobby) {

      lobby.clearPasswordFrom(client, data);

    } else {  }

  });





  client.on('disconnect', data => {

    // remove connection to lobby
    const lobby = client.lobby;
    if(lobby) {

      lobby.disconnect(client);
      lobby.emit('usersUpdate', lobby.mapUsers());

      // delete empty lobby after 5 seconds
      setTimeout(()=>{
        if(lobby.empty) LM.delete(lobby.id)
      }, 5000);

    } else {  }

    // remove from server's radar
    clients.delete(client.id_)

  });









  //
  //     //tell the player they connected, giving them their id
  //   client.emit('onconnected', { id: UUID() } );
  // client.on('userid', (id) => {
  //     client.userid = id;
  //     console.log(`client ${client.userid} +`.green);
  //   });
  //
  //   client.on('join lobby', lobbyID => {
  //     let lobby = LM.lobby(lobbyID);
  //     if(lobby) {
  //       // check if there is room in lobby
  //       lobby.emit('lobby state', lobby.simplify());
  //       if(!lobby.join(client)) {
  //         client.emit('spectate');
  //         if(lobby.ongoing) {
  //           client.emit('start', lobby.start());
  //         }
  //       } else { client.emit('lobby joined', lobby.type) }
  //       clients.set(client.userid, client);
  //       if(lobby.type == 'public') LM.updateLobbyPlacement(lobby); // TODO
  //     } else {
  //       client.emit('error', `lobby ${lobbyID} not found`);
  //     }
  //   });
  //
  //   client.on('set name', name => {
  //     let lobby
  //     if(lobby = client.lobby) {
  //       if(client.active) lobby.players.get(client.userid).name = name;
  //
  //       lobby.emit('lobby state', lobby.simplify());
  //
  //       // if(lobby.full && lobby.ready) lobby.emit('start', lobby.game());
  //     } else {
  //       client.emit('error', 'set name request ignored');
  //     }
  //   });
  //
  //   client.on('set type', type => {
  //     let lobby
  //     if(lobby = client.lobby) {
  //       if(client.active) lobby.players.get(client.userid).type = type;
  //       client.emit('lobby state', lobby.simplify());
  //       // if(lobby.full && lobby.ready) lobby.emit('start', lobby.game());
  //     } else {
  //       client.emit('error', 'set type request ignored');
  //     }
  //   });
  //
  //
  //   client.on('set team', team => {
  //     let lobby;
  //     if((lobby = client.lobby) && lobby.type == 'private') {
  //       if(team < lobby.max_teams && team >= -1) { // validations
  //         if(client.active) lobby.players.get(client.userid).team = team;
  //         // client.emit('lobby state', lobby.simplify());
  //       } else { client.emit('error', 'invalid team'); }
  //     } else {
  //       client.emit('error', 'set team request ignored');
  //     }
  //   });
  //
  //
  //   client.on('ready', () => {
  //     let lobby;
  //     if(lobby = client.lobby) {
  //       if(lobby.playerCleared(client)) client.ready = true;
  //       lobby.emit('lobby state', lobby.simplify());
  //       console.log('ready');
  //       if(lobby.sustainable && lobby.ready)
  //         {
  //           lobby.emit('start', lobby.start(()=>{
  //             // on finish.. TODO: fix this.. also encapsulate all of these anonymous functions into a controller class
  //             if(lobby.type == 'public') LM.updateLobbyPlacement(lobby);
  //           }));
  //         }
  //     } else {
  //       client.emit('error', 'ready request ignored');
  //     }
  //
  //   });
  //
  //
  //
  //   client.on('disconnect', function () {
  //
  //           //Useful to know when someone disconnects
  //       console.log(`client ${client.userid} -`.red);
  //
  //       clients.delete(client.userid);
  //
  //       let lobby = client.lobby;
  //       if(lobby) {
  //         let was_active = client.active;
  //         lobby.remove(client);
  //         if(lobby.ongoing && was_active) {
  //           if(lobby.state.flagHolder == client.userid) lobby.emit('flag drop');
  //           lobby.emit('disconnect player', client.userid);
  //           if(lobby.unsustainable) {
  //             lobby.emit('game error', 'a communications error occured');
  //             lobby.endCurrentGame();
  //           }
  //         }
  //         lobby.emit('lobby state', lobby.simplify());
  //         if(lobby.type == 'public') LM.updateLobbyPlacement(lobby);
  //
  //         // once a lobby has been vacated by all players it is safe for that lobby to cease existence
  //         // a single player joining an empty lobby will not happen often except with private practice lobbies
  //         // otherwise keep it in the realm
  //         setTimeout(()=>{ let del = false;
  //           if(lobby.connected.size == 0) { LM.delete(lobby.id); del = true }
  //           console.log(`lobby ${lobby.id} ${del ? `deleted` : `preserved`}`);
  //         }, 5000);
  //
  //       }
  //
  //   }); //client.on disconnect





  // during game
  // client.on('input stack', data => client.lobby ? client.lobby.broadcast('input stack', data, client) : client.emit('stop'));

  const addListenerList = function (list) {
    for(let msg of list) addListener(msg);
  };
  
  const addListener = function (msg) {
    client.on(msg, (a) => client.lobby ? client.lobby.exec(msg, a, client) : 0);
  };

  const incomingMessages = [
    'shipUpdated', 'shipOverridden', 'shipHPAdjusted',
    'bulletCreated', 'bulletDestroyed',
    'blockCreated', 'blockHPAdjusted', 'blockTeamSet', 'blockDestroyed',
    'subCreated', 'subDestroyed',
    'deathOccurrence',
    'flagCaptured', 'flagDropped','flagProgress'];

  addListenerList(incomingMessages);








  // client.on('ship update', data => client.lobby ? client.lobby.broadcast('ship update', data, client) : client.emit('stop'));
  // client.on('ship override', data => client.lobby ? client.lobby.broadcast('ship override', data, client) : client.emit('stop'));
  // client.on('bullet create', data => client.lobby ? client.lobby.broadcast('bullet create', data, client) : client.emit('stop'));
  // client.on('bullet destroy', data => client.lobby ? client.lobby.broadcast('bullet destroy', data, client) : client.emit('stop'));
  //
  // client.on('ship damage', data => client.lobby ? client.lobby.emit('ship damage', data) : client.emit('stop'));
  //
  // client.on('block create', data => client.lobby ? client.lobby.broadcast('block create', data, client) : client.emit('stop'));
  // client.on('block destroy', data => client.lobby ? client.lobby.broadcast('block destroy', data, client) : client.emit('stop'));
  // client.on('block damage', data => client.lobby ? client.lobby.broadcast('block damage', data, client) : client.emit('stop'));
  // client.on('block change', data => client.lobby ? client.lobby.broadcast('block change', data, client) : client.emit('stop'));
  //
  // client.on('sub create', data => client.lobby ? client.lobby.broadcast('sub create', data, client) : client.emit('stop'));
  // client.on('sub destroy', data => client.lobby ? client.lobby.broadcast('sub destroy', data, client) : client.emit('stop'));

  /*client.on('combined', messages => {
   if(!client.lobby) { client.emit('stop'); return; }

   for(var [key, data] of messages) {
   switch(key) {
   case 'ship update':
   client.lobby.broadcast('ship update', data, client); break;
   case 'ship override':
   client.lobby.broadcast('ship override', data, client); break;
   }
   }
   });*/





  this.onFinish = () => {

  }















}); //sio.sockets.on connection
