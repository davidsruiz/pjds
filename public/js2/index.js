'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// EXTENTION //
// Array.new = function(length, filler){let a = []; for(let i = 0; i < length; i++) a.push(filler); return a;};
// let TIME = {sec: function(mil) {return mil * 1000}, min: function(mil) {return this.sec(mil) * 60}};
///////////////

var TIME = {

  sec: function sec(_sec) {
    return _sec * 1000;
  },
  min: function min(_min) {
    return this.sec(_min * 60);
  },
  hrs: function hrs(_hrs) {
    return this.min(_hrs * 60);
  },
  days: function days(_days) {
    return this.hrs(_days * 24);
  }

};

var GameCycles = require('./game_cycles.js');
var cycles = new GameCycles({ refreshRate: TIME.hrs(1) });
var LobbyManager = require('./lobby_manager.js');
var LM = new LobbyManager(cycles);
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

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

// Math.flipCoin = (p = 0.5) => Math.random() < p;
// Array.prototype.shuffle = function() { return this.sort(() => Math.flipCoin() )};
var UUID = function UUID() {
  return s4() + s4();
};
var validateUUID = function validateUUID(uuid) {
  return (/^(\d|\w){8}$/.test(uuid)
  );
};

var gameport = process.env.PORT || 4004,
    io = require('socket.io'),
    express = require('express'),

// UUID            = require('node-uuid'),

verbose = false,
    http = require('http'),
    app = express(),
    server = http.createServer(app);

// let shortid = require('shortid');
// shortid.characters("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
// const UUID = () => shortid.generate();

// const colors = require('colors');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
var path = require('path');

app.use(express.static(path.resolve('public')));

//Tell the server to listen for incoming connections
// server.listen(80);
server.listen(gameport);
//Log something so we know that it succeeded.
console.log('\t :: Express :: Listening on port ' + gameport);

app.get('/', function (req, res) {

  res.sendFile(path.resolve('public/home.html'));
});

// app.get( '/play', function( req, res ){ res.sendFile("play.html")

app.post('/:type', function (req, res) {

  var lobbyID = void 0,
      type = req.params.type;

  switch (type) {
    case "request_public_lobby":

      console.log(req.body);

      var _ref = req.body || [],
          _ref2 = _slicedToArray(_ref, 2),
          _ref2$ = _ref2[0],
          requestID = _ref2$ === undefined ? '' : _ref2$,
          _ref2$2 = _ref2[1],
          encodedRequestRank = _ref2$2 === undefined ? '' : _ref2$2;

      var decodedRequestRank = TEA.decrypt(String(encodedRequestRank), requestID);

      if (!(decodedRequestRank >= 0)) decodedRequestRank = 0;

      res.json(LM.findLobbyFor(decodedRequestRank));

      break;
    case "create":
    case "practice":
      // if(type == "pool") lobbyID = LM.next();
      if (type == "create") lobbyID = LM.new_private();
      if (type == "practice") lobbyID = LM.new_practice();
      res.redirect('/' + lobbyID);
      break;

    case "online_status":
      var IDs = req.body.list;

      // lobbies/unavailable
      var lobbiesMap = new Map();
      var unavailable = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = IDs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _id2 = _step.value;

          var _client = clients.get(_id2);
          if (_client && _client.lobby && LM.existsInPrivate(_client.lobby.id)) {
            // lobbies
            var lobby = lobbiesMap.get(_client.lobby.id) || [];
            lobby.push(_id2);
            lobbiesMap.set(_client.lobby.id, lobby);
          } else {
            // unavailable
            unavailable.push(_id2);
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

      var lobbies = Array.from(lobbiesMap).map(function (pair) {
        return [pair[0]].concat(_toConsumableArray(pair[1]));
      }); // transform lobbies map

      // names
      var names = [];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = IDs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _id3 = _step2.value;

          var _client2 = clients.get(_id3);
          if (_client2) names.push([_id3, _client2.name]);
        }

        // response
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      res.json({ lobbies: lobbies, unavailable: unavailable, names: names });

      break;
    case "rank":
      var _id = req.body.id,
          encoded_rank,
          _simple_rank = 0;

      if (!_id) {
        res.status(400).send('No ID');
      } else {
        encoded_rank = TEA.encrypt(_simple_rank, _id);
        res.json({ simple: _simple_rank, encoded: encoded_rank });
      }
      break;
    case "update_rank":
      var _id = req.body.id || UUID(),
          encoded_rank = String(req.body.rank) || '',
          _simple_rank = parseInt(TEA.decrypt(encoded_rank, _id));

      if (isNaN(_simple_rank)) _simple_rank = 0;

      var client = clients.get(_id);
      if (client && client.won) {
        // if connected and needs winning
        // if(client && client.lobby && client.lobby.removeWinner(id)) { // if connected and needs winning
        client.won = false;
        _simple_rank = RANK.win(_simple_rank);
      } else {
        _simple_rank = RANK.lose(_simple_rank);
      }

      encoded_rank = TEA.encrypt(_simple_rank, _id);
      res.json({ simple: _simple_rank, encoded: encoded_rank });
      break;
    case 'update_stats':

      var _id = req.body[0] || UUID();
      var rank = String(req.body[1]) || '';
      var money = String(req.body[2]) || '';
      var _simple_rank = parseInt(TEA.decrypt(rank, _id));
      var simple_money = parseInt(TEA.decrypt(money, _id));

      // if either is invalid, reset.
      if (isNaN(_simple_rank) || isNaN(simple_money)) {
        _simple_rank = 0;
        simple_money = 0;
      }

      var onlineClient = clients.get(_id);
      if (onlineClient && onlineClient.lobby && onlineClient.lobby.lastGameResults.has(_id)) {
        var _onlineClient$lobby$l = onlineClient.lobby.lastGameResults.get(_id),
            _onlineClient$lobby$l2 = _slicedToArray(_onlineClient$lobby$l, 2),
            won = _onlineClient$lobby$l2[0],
            hits = _onlineClient$lobby$l2[1];

        onlineClient.lobby.lastGameResults.delete(_id);

        // rank
        if (won) {
          _simple_rank = RANK.win(_simple_rank);
        } else {
          _simple_rank = RANK.lose(_simple_rank);
        }

        // money
        simple_money += hits;
      } else {
        _simple_rank = RANK.lose(_simple_rank);
      }

      rank = TEA.encrypt(_simple_rank, _id);
      money = TEA.encrypt(simple_money, _id);
      res.json([rank, money, _simple_rank, simple_money]);

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

app.get('/friends', function (req, res, next) {

  res.sendFile(path.resolve('public/friends.html'));
}); //app.get /friends

// routing to lobby
app.get('/*', function (req, res, next) {

  var lobbyID = req.params[0];
  if (LM.exists(lobbyID)) {
    res.sendFile(path.resolve('public/game.html'));
  } else {
    res.redirect('/');
  }
}); //app.get *

//Create a socket.io instance using our express server
var sio = io.listen(server);

//Configure the socket.io connection settings.
//See http://socket.io/
// sio.configure(function (){
//   sio.set('log level', 0);
//   sio.set('authorization', function (handshakeData, callback) {
//     callback(null, true); // error first callback style
//   });
// });

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
        lobby.broadcast('usersUpdate', lobby.mapUsers(), client);
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
          client.emit('connected', [client.id_, lobby.map()]);
          lobby.broadcast('usersUpdate', lobby.mapUsers(), client);
        } else {
          client.emit('auth');
        }
      } else {
        console.warn('no auth needed! for lobby ' + data[0]);
        client.emit('connected', [client.id_, lobby.map()]);
        lobby.broadcast('usersUpdate', lobby.mapUsers(), client);
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
      if (lobby.playersMap.has(client)) return;

      // actual joining
      lobby.join(client, data).then(function () {
        client.emit('joined');
        lobby.emit('usersUpdate', lobby.mapUsers());

        // show up on server's radar
        // rank change and more
        clients.set(client.id_, client);
      }).catch(function (reason) {
        console.log(reason.message.yellow);
        // client.emit('error', reason);
      });
    }
  });

  client.on('start', function (data) {

    // verify participant to lobby
    var lobby = client.lobby;
    if (lobby) {

      // return if client has already opted to start
      if (lobby.playersMap.get(client)[3]) return;

      // actual opt to start
      lobby.startFrom(client, data).then(function (everyoneIsReady) {
        client.emit('starting');
        lobby.emit('playersUpdate', lobby.mapPlayers());

        // start if everyone is ready
        if (everyoneIsReady) lobby.startGame(), lobby.emit('gameStarted', lobby.getSetupData());
      }).catch(function (reason) {
        console.log(reason.message.yellow);
        // client.emit('error', reason.message);
      });
    }
  });

  client.on('updateOptions', function (data) {

    // remove connection to lobby
    var lobby = client.lobby;
    if (lobby) {

      lobby.updateOptions(data);
    } else {}
  });

  client.on('setPassword', function (data) {

    // remove connection to lobby
    var lobby = client.lobby;
    if (lobby) {

      lobby.setPasswordFrom(client, data);
    } else {}
  });

  client.on('clearPassword', function (data) {

    // remove connection to lobby
    var lobby = client.lobby;
    if (lobby) {

      lobby.clearPasswordFrom(client, data);
    } else {}
  });

  client.on('updateRank', function (data) {

    // remove connection to lobby
    var lobby = client.lobby;
    if (lobby) {

      lobby.updateUserRank(client, data);
    } else {}
  });

  client.on('disconnect', function (data) {

    // remove connection to lobby
    var lobby = client.lobby;
    if (lobby) {

      lobby.disconnect(client);
      lobby.emit('usersUpdate', lobby.mapUsers());

      // delete empty lobby after 5 seconds
      LM.waitThenCheck(lobby);
    } else {}

    // remove from server's radar
    clients.delete(client.id_);
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

  var addListenerList = function addListenerList(list) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = list[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var msg = _step3.value;
        addListener(msg);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }
  };

  var addListener = function addListener(msg) {
    client.on(msg, function (a) {
      return client.lobby ? client.lobby.exec(msg, a, client) : 0;
    });
  };

  var incomingMessages = ['shipUpdated', 'shipOverridden', 'shipHPAdjusted', 'bubbleHPAdjusted', 'bulletCreated', 'bulletDestroyed', 'blockCreated', 'blockHPAdjusted', 'blockTeamSet', 'blockDestroyed', 'subCreated', 'subDestroyed', 'deathOccurrence', 'flagCaptured', 'flagDropped', 'flagProgress'];

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

  this.onFinish = function () {};
}); //sio.sockets.on connection