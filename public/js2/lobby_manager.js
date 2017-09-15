
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Lobby = require('./server_lobby.js');
var shortid = require('shortid');
Set.prototype.draw = function () {
  var next = this.values().next().value;this.delete(next);return next;
};
Map.prototype.shift = function () {
  var key = this.keys().next().value;var next = this.get(key);this.delete(key);return next;
};

var LobbyManager = function () {
  function LobbyManager() {
    _classCallCheck(this, LobbyManager);

    this.lobbies = new Map();
    this.public = new Map();
    this.private = new Map();
    this.practice = new Map();
    // this.ongoing = new Map();
    // this.available = new Map();

    this.joinable = new Map();
    this.min_available_lobby_count = 2;
    for (var i = 0; i < this.min_available_lobby_count; i++) {
      this.new_public();
    } // populate
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
    key: 'next',
    value: function next() {
      var _this = this;

      // this.relay_status();
      while (this.joinable.size < this.min_available_lobby_count) {
        this.new_public();
      }var next = this.joinable.shift();
      setTimeout(function () {
        _this.updateLobbyPlacement(next);
      }, 2000);
      return next.id;
    }
  }, {
    key: 'updateLobbyPlacement',
    value: function updateLobbyPlacement(lobby) {
      // console.log(`${lobby.id} :: full: ${lobby.full}, ongoing: ${lobby.ongoing}, public ${this.public.has(lobby.id)}`)
      if (!lobby.full && !lobby.ongoing && this.public.has(lobby.id)) {
        this.joinable.set(lobby.id, lobby);
        console.log('lobby ' + lobby.id + ' IS joinable');
      } else {
        this.joinable.delete(lobby.id);console.log('lobby ' + lobby.id + ' is NOT joinable');
      }
    }
  }, {
    key: 'relay_status',
    value: function relay_status() {
      console.log('---------- OVERVIEW -----------');
      console.log('| lobbies ' + this.lobbies.size);
      console.log('| ', Array.from(this.lobbies).map(function (a) {
        return a[0];
      }));
      console.log('| joinable ' + this.joinable.size);
      console.log('| ', Array.from(this.joinable).map(function (a) {
        return a[0];
      }));
      console.log('===============================');
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
      this.joinable.set(lobby.id, lobby);
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
      var id = this.new_ID();
      var lobby = new Lobby(id, typeIndex, options);
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
      this.joinable.delete(id);
    }
  }]);

  return LobbyManager;
}();

module.exports = LobbyManager;
//# sourceMappingURL=lobby_manager.js.map