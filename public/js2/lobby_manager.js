
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Lobby = require('./server_lobby.js');
var RankedLobby = require('./server_lobby_ranked.js');
var shortid = require('shortid');
Set.prototype.draw = function () {
  var next = this.values().next().value;this.delete(next);return next;
};
Map.prototype.shift = function () {
  var key = this.keys().next().value;var next = this.get(key);this.delete(key);return next;
};

//+ Carlos R. L. Rodrigues
//@ http://jsfromhell.com/array/nearest-number [rev. #0]

function getNearestNumber(a, n) {
  if ((l = a.length) < 2) return l - 1;
  for (var l, p = Math.abs(a[--l] - n); l--;) {
    if (p < (p = Math.abs(a[l] - n))) break;
  }return l + 1;
}

var LobbyManager = function () {
  function LobbyManager(cycles) {
    _classCallCheck(this, LobbyManager);

    this.lobbies = new Map();
    this.public = new Map();
    this.private = new Map();
    this.practice = new Map();
    // this.ongoing = new Map();
    // this.available = new Map();

    // this.joinable = new Map();
    // this.min_available_lobby_count = 2;
    // for(var i = 0; i < this.min_available_lobby_count; i++) this.new_public(); // populate

    this.cycles = cycles;

    this.publicAvailableLobbies = new Map();
  }

  _createClass(LobbyManager, [{
    key: 'exists',
    value: function exists(lobbyID) {
      return this.lobbies.has(lobbyID);
    }
  }, {
    key: 'existsInPrivate',
    value: function existsInPrivate(lobbyID) {
      return this.private.has(lobbyID);
    }
  }, {
    key: 'lobby',
    value: function lobby(ID) {
      return this.lobbies.get(ID);
    }
  }, {
    key: 'findLobbyFor',
    value: function findLobbyFor(rank) {

      var sortedLobbies = [].concat(_toConsumableArray(this.publicAvailableLobbies.values())).sort(function (a, b) {
        return a.rank - b.rank;
      });
      var sortedLobbyRanks = sortedLobbies.map(function (l) {
        return l.rank;
      });

      var nearestIndex = getNearestNumber(sortedLobbyRanks, rank);
      var nearestLobby = sortedLobbies[nearestIndex];

      if (nearestLobby && Math.abs(nearestLobby.rank - rank) < 30) {
        this.publicAvailableLobbies.delete(nearestLobby.id);

        this.waitThenCheck(nearestLobby);
        return nearestLobby.id;
      }

      return this.new_public();
    }
  }, {
    key: 'checkLobby',
    value: function checkLobby(lobby) {

      // check if anyone is present
      var isEmpty = lobby.empty;

      if (isEmpty) {
        this.delete(lobby.id);
        return false;
      }

      // otherwise, set and return availability
      var hasRoom = !lobby.full;
      var isNotInProgress = !lobby.ongoing;
      var stillExists = this.public.has(lobby.id);

      if (hasRoom && isNotInProgress && stillExists) {
        this.publicAvailableLobbies.set(lobby.id, lobby);
        return true;
      }

      this.publicAvailableLobbies.delete(lobby.id);
      return false;
    }
  }, {
    key: 'waitThenCheck',
    value: function waitThenCheck(lobby) {
      var _this = this;

      var waitTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 6000;

      setTimeout(function () {
        return _this.checkLobby(lobby);
      }, waitTime);
    }

    // next() {
    //   // this.relay_status();
    //   while(this.joinable.size < this.min_available_lobby_count) this.new_public();
    //   let next = this.joinable.shift();
    //   setTimeout(() => { this.updateLobbyPlacement(next) }, 2000);
    //   return next.id;
    // }
    //
    // updateLobbyPlacement(lobby) {
    //   // console.log(`${lobby.id} :: full: ${lobby.full}, ongoing: ${lobby.ongoing}, public ${this.public.has(lobby.id)}`)
    //   if(!lobby.full && !lobby.ongoing && this.public.has(lobby.id)) {
    //     this.joinable.set(lobby.id, lobby);
    //     console.log(`lobby ${lobby.id} IS joinable`);
    //   }
    //   else { this.joinable.delete(lobby.id); console.log(`lobby ${lobby.id} is NOT joinable`) }
    // }

  }, {
    key: 'relay_status',
    value: function relay_status() {
      console.log('---------- STATUS -----------');
      console.log('| public (' + this.public.size + ')');
      console.log('| ', Array.from(this.public).map(function (a) {
        return a[0];
      }));
      console.log('| available (' + this.publicAvailableLobbies.size + ')');
      console.log('| ', Array.from(this.publicAvailableLobbies).map(function (a) {
        return a[0];
      }));
      // console.log(`===============================`);
    }
  }, {
    key: 'new_ID',
    value: function new_ID() {
      return shortid.generate().slice(0, 6);
    }
  }, {
    key: 'new_public',
    value: function new_public() {
      var lobby = this.new_lobby(0, { players: 4, teams: 2 });
      this.public.set(lobby.id, lobby);
      this.publicAvailableLobbies.set(lobby.id, lobby);
      // this.joinable.set(lobby.id, lobby);
      return lobby.id;
    }
  }, {
    key: 'new_private',
    value: function new_private(options) {
      var lobby = this.new_lobby(1);
      this.private.set(lobby.id, lobby);
      return lobby.id;
    }
  }, {
    key: 'new_practice',
    value: function new_practice() {
      var lobby = this.new_lobby(2, { players: 1 });
      this.practice.set(lobby.id, lobby);
      return lobby.id;
    }
  }, {
    key: 'new_lobby',
    value: function new_lobby(typeIndex, options) {
      var _this2 = this,
          _arguments = arguments;

      var id = this.new_ID();
      var lobby = typeIndex ? new Lobby(id, typeIndex, options) : new RankedLobby(id, typeIndex, function (rank) {
        return _this2.findLobbyFor(rank);
      }, function () {
        return _this2.waitThenCheck.apply(_this2, _arguments);
      }, this.cycles, options);
      this.lobbies.set(id, lobby);
      console.log('new lobby: ' + id);
      return lobby;
    }
  }, {
    key: 'delete',
    value: function _delete(id) {
      this.lobbies.delete(id);
      this.public.delete(id);
      this.private.delete(id);
      this.practice.delete(id);
      this.publicAvailableLobbies.delete(id);
    }
  }]);

  return LobbyManager;
}();

module.exports = LobbyManager;
//# sourceMappingURL=lobby_manager.js.map