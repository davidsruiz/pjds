
"use strict";

// Object.prototype.map = function (block) { var obj = {}; Object.keys(this).map( (key) => obj[key] = block(this[key]) ); return obj };

class Lobby {
  constructor(id) {
    this.id = id;
    this.limit = 4;
    this.players = {};
  }
  join(client) {
    var joined = false;
    if(Object.keys(this.players).length < this.limit) {
      this.players[client.userid] = client;
      joined = true;
    }
    return joined;
  }
  remove(client) {
    delete this.players[client.userid];
  }
  emit(msg, data) {
    for(var key in this.players)
      this.players[key].emit(msg, data);
  }

  // to remove circular dependancies and minimize bandwidth consumption,
    // only select data is sent over.
  simplify() {
    var obj = {};
    var block = (e) => {
      return { name: e.name }
    };
    Object.keys(this.players).map( (key) => obj[key] = block(this.players[key]) )
    return { players: obj };
  }

  get ready() {
    Object.keys(this.players).forEach((k) => { if(!this.players[k].ready) return false });
    return true;
  }
}

module.exports = Lobby;
