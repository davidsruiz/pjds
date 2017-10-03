
"use strict";
var Lobby = require('./server_lobby.js');
var RankedLobby = require('./server_lobby_ranked.js');
var shortid = require('shortid');
Set.prototype.draw = function() { var next = this.values().next().value; this.delete(next); return next }
Map.prototype.shift = function() { var key = this.keys().next().value; var next = this.get(key); this.delete(key); return next }

//+ Carlos R. L. Rodrigues
//@ http://jsfromhell.com/array/nearest-number [rev. #0]

function getNearestNumber(a, n){
  if((l = a.length) < 2)
    return l - 1;
  for(var l, p = Math.abs(a[--l] - n); l--;)
    if(p < (p = Math.abs(a[l] - n)))
      break;
  return l + 1;
}


class LobbyManager {
  constructor (cycles) {
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

  exists(lobbyID) {return this.lobbies.has(lobbyID)}
  existsInPrivate(lobbyID) {return this.private.has(lobbyID)}

  lobby(ID) {return this.lobbies.get(ID)}

  findLobbyFor(rank) {

    const sortedLobbies = [...this.publicAvailableLobbies.values()].sort((a, b) => a.rank - b.rank);
    const sortedLobbyRanks = sortedLobbies.map(l => l.rank);

    const nearestIndex = getNearestNumber(sortedLobbyRanks, rank);
    const nearestLobby = sortedLobbies[nearestIndex];

    if(nearestLobby && Math.abs(nearestLobby.rank - rank) < 30) {
      this.publicAvailableLobbies.delete(nearestLobby.id);

      this.waitThenCheck(nearestLobby);
      return nearestLobby.id;
    }

    return this.new_public();

  }

  checkLobby(lobby) {

    // check if anyone is present
    const isEmpty = lobby.empty;

    if(isEmpty) {
      this.delete(lobby.id);
      return false;
    }

    // otherwise, set and return availability
    const hasRoom = !lobby.full;
    const isNotInProgress = !lobby.ongoing;
    const stillExists = this.public.has(lobby.id);

    if(hasRoom && isNotInProgress && stillExists) {
      this.publicAvailableLobbies.set(lobby.id, lobby);
      return true;
    }

    this.publicAvailableLobbies.delete(lobby.id);
    return false;

  }

  waitThenCheck(lobby, waitTime = 6000) {
    setTimeout(() => this.checkLobby(lobby), waitTime);
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

  relay_status() {
    console.log(`---------- STATUS -----------`);
    console.log(`| public (${this.public.size})`);
    console.log(`| `, Array.from(this.public).map(a=>a[0]));
    console.log(`| available (${this.publicAvailableLobbies.size})`);
    console.log(`| `, Array.from(this.publicAvailableLobbies).map(a=>a[0]));
    // console.log(`===============================`);
  }

  new_ID() {
    return shortid.generate().slice(0, 6);
  }

  new_public() {
    var lobby = this.new_lobby(0, {players: 4, teams: 2});
    this.public.set(lobby.id, lobby);
    this.publicAvailableLobbies.set(lobby.id, lobby);
    // this.joinable.set(lobby.id, lobby);
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
    const id = this.new_ID();
    const lobby = typeIndex ? new Lobby(id, typeIndex, options) : new RankedLobby(id, typeIndex, rank=>this.findLobbyFor(rank), ()=>this.waitThenCheck(...arguments), this.cycles, options);
    this.lobbies.set(id, lobby);
    console.log(`new lobby: ${id}`);
    return lobby;
  }

  delete(id) {
    this.lobbies.delete(id);
    this.public.delete(id);
    this.private.delete(id);
    this.practice.delete(id);
    this.publicAvailableLobbies.delete(id);
  }


}

module.exports = LobbyManager;
