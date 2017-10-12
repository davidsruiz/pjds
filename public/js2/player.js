"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Player = function Player(team, id) {
  _classCallCheck(this, Player);

  this.team = team;
  this.id = id;

  this.name = null;
  this.type = null;
  this.ship = null;
  this.input = null;

  this.score = { kills: 0, deaths: 0 };
  this.disconnected = false;
};