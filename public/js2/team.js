"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Team = function () {
  function Team(game, number) {
    _classCallCheck(this, Team);

    this.game = game;
    this.number = number;
    this.players = [];
  }

  _createClass(Team, [{
    key: "createPlayer",
    value: function createPlayer(id, name, type) {
      var p = new Player(this, id);
      p.name = name;p.type = type;

      this.players.push(p);
      this.game.players.set(id, p);
    }
  }, {
    key: "color",
    get: function get() {
      return DeepSpaceGame.colors[this.game.colors[0][this.number]];
    }
  }]);

  return Team;
}();