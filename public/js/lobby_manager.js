
"use strict";
var Lobby = require('./server_lobby.js');
var shortid = require('shortid');
Set.prototype.draw = function() { var next = this.values().next().value; this.delete(next); return next }
Map.prototype.shift = function() { var key = this.keys().next().value; var next = this.get(key); this.delete(key); return next }


class LobbyManager {
  constructor () {
    this.lobbies = new Map();
    this.public = new Map();
    this.private = new Map();
    this.practice = new Map();
    // this.ongoing = new Map();
    // this.available = new Map();

    this.joinable = new Map();
    this.min_available_lobby_count = 2;
    for(var i = 0; i < this.min_available_lobby_count; i++) this.new_public(); // populate
  }

  exists(lobbyID) {return this.lobbies.has(lobbyID)}
  existsInPrivate(lobbyID) {return this.private.has(lobbyID)}

  lobby(ID) {return this.lobbies.get(ID)}

  next() {
    // this.relay_status();
    while(this.joinable.size < this.min_available_lobby_count) this.new_public();
    let next = this.joinable.shift();
    setTimeout(() => { this.updateLobbyPlacement(next) }, 2000);
    return next.id;
  }

  updateLobbyPlacement(lobby) {
    // console.log(`${lobby.id} :: full: ${lobby.full}, ongoing: ${lobby.ongoing}, public ${this.public.has(lobby.id)}`)
    if(!lobby.full && !lobby.ongoing && this.public.has(lobby.id)) {
      this.joinable.set(lobby.id, lobby);
      console.log(`lobby ${lobby.id} IS joinable`);
    }
    else { this.joinable.delete(lobby.id); console.log(`lobby ${lobby.id} is NOT joinable`) }
  }

  relay_status() {
    console.log(`---------- OVERVIEW -----------`);
    console.log(`| lobbies ${this.lobbies.size}`);
    console.log(`| `, Array.from(this.lobbies).map(a=>a[0]));
    console.log(`| joinable ${this.joinable.size}`);
    console.log(`| `, Array.from(this.joinable).map(a=>a[0]));
    console.log(`===============================`);
  }

  new_ID() {
    return shortid.generate().slice(0, 6);
  }

  new_public() {
    var lobby = this.new_lobby(0, {players: 4, teams: 2});
    this.public.set(lobby.id, lobby);
    this.joinable.set(lobby.id, lobby);
    return lobby.id;
  }

  new_private(options) {
    var lobby = this.new_lobby(1);
    this.private.set(lobby.id, lobby);
    return lobby.id;
  }

  new_practice() {
    var lobby = this.new_lobby(2, {players: 1});
    this.practice.set(lobby.id, lobby);
    return lobby.id;
  }

  new_lobby(typeIndex, options) {
    var id = this.new_ID();
    var lobby = new Lobby(id, typeIndex, options);
    this.lobbies.set(id, lobby);
    console.log(`new lobby: ${id}`);
    return lobby;
  }

  delete(id) {
    this.lobbies.delete(id);
    this.public.delete(id);
    this.private.delete(id);
    this.practice.delete(id);
    this.joinable.delete(id);
  }


}

module.exports = LobbyManager;
