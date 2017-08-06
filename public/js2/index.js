'use strict';

// EXTENTION //
// Array.new = function(length, filler){let a = []; for(let i = 0; i < length; i++) a.push(filler); return a;};
// let TIME = {sec: function(mil) {return mil * 1000}, min: function(mil) {return this.sec(mil) * 60}};
///////////////

var LobbyManager = require('./lobby_manager.js');
var LM = new LobbyManager();
var clients = new Map();

var TEA = require('./TEA.js');
var RANK = {
  MIN: 0, MAX: 599,
  win: function win(current_rank) {
    var new_rank = current_rank + this.f1(current_rank);
    return this.validate(new_rank);
  },
  lose: function lose(current_rank) {
    var new_rank = void 0;
    if (current_rank < 300) {
      new_rank = current_rank - this.f2(current_rank);
    } else if (current_rank < 500) {
      new_rank = current_rank - this.f1(current_rank);
    } else {
      new_rank = current_rank - this.f3(current_rank);
    }
    return this.validate(new_rank);
  },
  f1: function f1(x) {
    return Math.round(2000 / (x + 100));
  },
  // rank win (0 - 599), rank lose (300 - 499)
  f2: function f2(x) {
    return Math.round(600 / (x + 100) + 21 / 6);
  },
  // rank lose (0 - 299)
  f3: function f3(x) {
    return Math.round(Math.pow(-0.006 * (x - 400), 2) + 3);
  },
  // rank lose (500 - 599)
  validate: function validate(rank) {
    if (rank < this.MIN) {
      rank = this.MIN;
    } else if (rank > this.MAX) {
      rank = this.MAX;
    }
    return rank;
  }
};

var gameport = process.env.PORT || 4004,
    io = require('socket.io'),
    express = require('express'),
    UUID = require('node-uuid'),
    verbose = false,
    http = require('http'),
    app = express(),
    server = http.createServer(app);

// let shortid = require('shortid');
// shortid.characters("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
var colors = require('colors');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
var path = require('path');

app.use(express.static(path.resolve('public')));

//Tell the server to listen for incoming connections
server.listen(80);
server.listen(gameport);
//Log something so we know that it succeeded.
console.log('\t :: Express :: Listening on port ' + gameport);

app.get('/', function (req, res) {

  res.sendfile(path.resolve('public/server_m.html'));
});

// app.get( '/play', function( req, res ){ res.sendfile("play.html")

app.post('/:type', function (req, res) {

  var lobbyID = void 0,
      type = req.params.type;

  switch (type) {
    case "pool":
    case "create":
    case "practice":
      if (type == "pool") lobbyID = LM.next();
      if (type == "create") lobbyID = LM.new_private();
      if (type == "practice") lobbyID = LM.new_practice();
      res.redirect('/' + lobbyID);
      break;

    case "online_status":
      var list = req.body.history;
      var online = [];var c = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _id = _step.value;

          var _client = clients.get(_id);
          if (_client && _client.lobby && LM.existsInPrivate(_client.lobby.id)) {
            var entry = [_client.name, _client.lobby.id];
            online.push(entry);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      res.json(online);
      break;
    case "rank":
      var id = req.body.id,
          encoded_rank,
          simple_rank = 0;

      if (!id) {
        res.status(400).send('Bad Request');
      } else {
        encoded_rank = TEA.encrypt(simple_rank, id);
        res.json({ simple: simple_rank, encoded: encoded_rank });
      }
      break;
    case "update_rank":
      var id = req.body.id || UUID(),
          encoded_rank = req.body.rank || '',
          simple_rank = parseInt(TEA.decrypt(encoded_rank, id));

      if (isNaN(simple_rank)) simple_rank = 0;

      var client = clients.get(id);
      if (client && client.won) {
        // if connected and needs winning
        simple_rank = RANK.win(simple_rank);
        client.won = false;
      } else {
        simple_rank = RANK.lose(simple_rank);
      }

      encoded_rank = TEA.encrypt(simple_rank, id);
      res.json({ simple: simple_rank, encoded: encoded_rank });
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

app.get('/friends', function (req, res, next) {

  res.sendfile(path.resolve('public/friends.html'));
}); //app.get /friends

// routing to lobby
app.get('/*', function (req, res, next) {

  var lobbyID = req.params[0];
  if (LM.exists(lobbyID)) {
    res.sendfile(path.resolve('public/game.html'));
  } else {
    res.redirect('/');
  }
}); //app.get *

//Create a socket.io instance using our express server
var sio = io.listen(server);

//Configure the socket.io connection settings.
//See http://socket.io/
sio.configure(function () {
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

  client.on('connect', function (data) {
    // data [lobby_id, user_id, user_name]
    // reply with either auth or connected

    // identify lobby
    var lobby = LM.lobby(data[0]);
    if (lobby) {

      // assign values to client
      client.id_ = data[1] || UUID();
      client.name = data[2];

      // require authentication (or not)
      if (lobby.locked) {
        client.emit('auth');
      } else {
        // connect to lobby
        lobby.connect(client);
        // send client it's ID copy of lobby as now stands
        client.emit('connected', [client.id_, lobby.map()]);
      }
    } else {
      client.emit('error', 'lobby ' + data[0] + ' not found');
    }

    // client.emit('connected');
  });

  client.on('auth', function (data) {
    // data [lobby_id, password]
    // reply with either auth or connected

    // identify lobby
    var lobby = LM.lobby(data[0]);
    if (lobby) {

      // check if password is needed
      if (lobby.locked) {

        // test against password
        if (lobby.testPassword(data[1])) {
          lobby.connect(client);
          client.emit('connected', [client.id, lobby.map()]);
        } else {
          client.emit('auth');
        }
      } else {
        console.warn('no auth needed! for lobby ' + data[0]);
        client.emit('connected', [client.id, lobby.map()]);
      }
    } else {
      client.emit('error', 'lobby ' + data[0] + ' not found');
    }
  });

  client.on('join', function (data) {

    // verify participant to lobby
    var lobby = client.lobby;
    if (lobby) {

      // return if client has already joined
      if (lobby.players.has(client)) return;

      // actual joining
      lobby.join(client, data);
    }
  });

  client.on('connect', function (data) {

    // verify participant to lobby
    var lobby = client.lobby;
    if (lobby) {

      // return if client has already joined
      if (lobby.players.has(client)) return;

      // actual joining
      lobby.join(client, data);
    }
  });

  client.on('disconnect', function (data) {

    // remove connection to lobby
    var lobby = client.lobby;
    if (lobby) {

      lobby.disconnect(client);
    } else {}
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

  client.on('ship update', function (data) {
    return client.lobby ? client.lobby.broadcast('ship update', data, client) : client.emit('stop');
  });
  client.on('ship override', function (data) {
    return client.lobby ? client.lobby.broadcast('ship override', data, client) : client.emit('stop');
  });
  client.on('bullet create', function (data) {
    return client.lobby ? client.lobby.broadcast('bullet create', data, client) : client.emit('stop');
  });
  client.on('bullet destroy', function (data) {
    return client.lobby ? client.lobby.broadcast('bullet destroy', data, client) : client.emit('stop');
  });

  client.on('ship damage', function (data) {
    return client.lobby ? client.lobby.emit('ship damage', data) : client.emit('stop');
  });

  client.on('block create', function (data) {
    return client.lobby ? client.lobby.broadcast('block create', data, client) : client.emit('stop');
  });
  client.on('block destroy', function (data) {
    return client.lobby ? client.lobby.broadcast('block destroy', data, client) : client.emit('stop');
  });
  client.on('block damage', function (data) {
    return client.lobby ? client.lobby.broadcast('block damage', data, client) : client.emit('stop');
  });
  client.on('block change', function (data) {
    return client.lobby ? client.lobby.broadcast('block change', data, client) : client.emit('stop');
  });

  client.on('sub create', function (data) {
    return client.lobby ? client.lobby.broadcast('sub create', data, client) : client.emit('stop');
  });
  client.on('sub destroy', function (data) {
    return client.lobby ? client.lobby.broadcast('sub destroy', data, client) : client.emit('stop');
  });

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

  // TODO: figure out what happens when a flag holder disconnects..
  client.on('flag pickup', function (data) {
    if (client.lobby) {
      if (!client.lobby.state.flagHolder) {
        client.lobby.emit('flag pickup', data);
        // client.lobby.first.emit('begin create asteroids')
        client.lobby.state.flagHolder = data.playerID;
        if (typeof client.lobby.state.leadTeam == 'undefined') client.lobby.state.leadTeam = client.lobby.getTeam(client.userid);
      } else {
        client.lobby.emit('flag drop', data);
      }
    } else {
      client.emit('stop');
    }
  });
  client.on('flag drop', function (data) {
    if (client.lobby) {
      client.lobby.emit('flag drop', data);
      // client.lobby.emit('stop create asteroids')
    } else {
      client.emit('stop');
    }
  });
  client.on('flag progress confirm', function (data) {
    if (client.lobby) {
      console.log('client ' + client.name + ' sent ' + data.score);
      if (client.userid == client.lobby.state.flagHolder) {
        client.lobby.state.scores[data.team] = { t: data.team, s: data.score };
        client.lobby.state.flagHolder = undefined;
        client.lobby.state.leadTeam = client.lobby.game_lead_team;
        console.log('client.on(\'flag progress confirm\' >> current team lead: ' + client.lobby.game_lead_team);

        // if(client.lobby.ongoing) this.finish();
        // console.log(`data.team ${data.team}, data.score: ${data.score}`);
      }
    } else {
      client.emit('stop');
    }
  });

  client.on('flag progress', function (data) {
    if (client.lobby) {
      console.log('client ' + client.name + ' sent ' + data.score);
      if (data.score >= 0 && data.score <= 100) {
        client.lobby.state.scores[data.team] = { t: data.team, s: data.score };
        client.lobby.state.leadTeam = client.lobby.game_lead_team;
        console.log('client.on(\'flag progress\' >> current team lead: ' + client.lobby.game_lead_team);
      }
    } else {
      client.emit('stop');
    }
  });

  client.on('msg ship kill', function (data) {
    return client.lobby ? client.lobby.emit('msg ship kill', data) : client.emit('stop');
  });

  client.on('game over', function (data) {
    var lobby = void 0;
    if ((lobby = client.lobby) && lobby.state.flagHolder == client.userid) {
      console.log('from \'game over\'. winningTeam: ' + data.winningTeam);
      if (lobby.type == 'public') lobby.setWinForPlayers(data.winningTeam);

      lobby.emit('game over');
      // lobby.emit('end with winner', {winner: data.winningTeam});
      lobby.endCurrentGame();
      lobby.emit('lobby state', lobby.simplify());
    }
  });

  // let client_game_over = (data) => {
  //   let lobby;
  //   if((lobby = client.lobby) && lobby.state.flagHolder == client.userid) {
  //     console.log(`from 'game over'. winningTeam: ${data.winningTeam}`);
  //     if(lobby.type == 'public') lobby.setWinForPlayers(data.winningTeam);
  //     lobby.emit('game over', data);
  //     lobby.endCurrentGame();
  //     lobby.emit('lobby state', lobby.simplify());
  //   }
  // };

}); //sio.sockets.on connection
//# sourceMappingURL=index.js.map