
"use strict";
var Lobby = require('./lobby.js');
var shortid = require('shortid');
Set.prototype.draw = function() { var next = this.values().next().value; this.delete(next); return next }
Map.prototype.shift = function() { var key = this.keys().next().value; var next = this.get(key); this.delete(key); return next }


class LobbyManager {
  constructor () {
    this.lobbies = new Map();
    this.public = new Map();
    this.private = new Map();
    // this.ongoing = new Map();
    // this.available = new Map();

    this.joinable = new Map();
    this.min_available_lobby_count = 2;
    for(var i = 0; i < this.min_available_lobby_count; i++) this.new_public(); // populate
  }

  exists(lobbyID) {return this.lobbies.has(lobbyID)}

  lobby(ID) {return this.lobbies.get(ID)}

  next() {
    this.relay_status();
    if(this.joinable.size < this.min_available_lobby_count) this.new_public();
    var next = this.joinable.shift();
    setTimeout(() => {
      if(!next.full) { this.joinable.set(next.id, next); console.log(`lobby ${next.id} not full, re-adding`) }
    }, 1000);
    return next.id;
  }

  relay_status() {
    console.log(`------------STATUS-------------`)
    console.log(`total active lobbies ${this.lobbies.size}`);
    console.log(`total available lobbies ${this.joinable.size}`);
    console.log(`===============================`)
  }

  new_ID() {return shortid.generate()}

  new_public() {
    var lobby = this.new_lobby('public', {players: 2, teams: 2});
    this.public.set(lobby.id, lobby);
    this.joinable.set(lobby.id, lobby);
    return lobby.id;
  }

  new_private(options) {
    var lobby = this.new_lobby('private');
    this.private.set(lobby.id, lobby);
    return lobby.id;
  }

  new_practice() {
    var lobby = this.new_lobby('practice', {players: 1});
    this.private.set(lobby.id, lobby);
    return lobby.id;
  }

  new_lobby(type, options) {
    var id = this.new_ID();
    var lobby = new Lobby(id, type, options);
    this.lobbies.set(id, lobby);
    console.log(`new lobby: ${id}`);
    return lobby;
  }

  delete(id) {
    this.lobbies.delete(id);
    this.public.delete(id);
    this.private.delete(id);
    this.joinable.delete(id);
  }


}

module.exports = LobbyManager;
