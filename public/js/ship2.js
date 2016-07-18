
// Object.prototype.merge = function (obj) {for (var attrname in obj) { this[attrname] = obj[attrname] }};

var BasicShip = (function () {

  var create = function(player) {
    var ship = Object.create(def);

    return ship;
  };

  var def = {
    disabled: null,   //
    type: null,       //
    position: null,   // - for display -
    angle: null,      //
    health: null,     //

    radius: null,     // - for collisions -
    player: null,     //

    bullets: null,

    update: function() {}
  };

  return {create:create}
})();

var Ship = (function () {
  var shipTypes = {
    balanced: []
  };

  var create = function(player) {
    var ship = Object.create(def);

    ship.position = map.positions[player.i];


    return ship;
  };

  var def = {
    disabled: null,
    type: null,

    position: null,
    velocity: null,
    acceleration: null,
    friction: null,

    angle: null,
    angular_velocity: null,
    angular_acceleration: null,
    angular_friction: null,

    health: null,

    radius: null,
    player: null,

    bullets: null,
    bulletPool: null,

    export: function() {}
  }

  return {create:create}
})();
