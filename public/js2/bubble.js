"use strict";

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO optimize by giving radius a getter instead of progress since it is the lesser called var

var SimpleBubble = function () {
  function SimpleBubble(data) {
    _classCallCheck(this, SimpleBubble);

    this.id = data.id;
    this.team = data.team;

    Object.assign(this, Bubble.stats);

    this.target = data.target;
    this.position = new V2D();

    this.radius = this.INNER_RADIUS;

    this.growing = false;
    this.locked = false;
    this.complete = false;
    this.disabled = false;
  }

  _createClass(SimpleBubble, [{
    key: "update",
    value: function update(dt) {

      if (!this.locked) {
        var _target$position = this.target.position,
            x = _target$position.x,
            y = _target$position.y;

        this.position.set({ x: x, y: y });
      }
    }
  }, {
    key: "progress",
    get: function get() {
      if (this.radius <= this.INNER_RADIUS) return 0;
      if (this.radius < this.OUTER_RADIUS) return (this.radius - this.INNER_RADIUS) / (this.OUTER_RADIUS - this.INNER_RADIUS);else return 1;
    }
  }]);

  return SimpleBubble;
}();

var Bubble = function (_SimpleBubble) {
  _inherits(Bubble, _SimpleBubble);

  function Bubble(data) {
    _classCallCheck(this, Bubble);

    var _this = _possibleConstructorReturn(this, (Bubble.__proto__ || Object.getPrototypeOf(Bubble)).call(this, data));

    _this.dropCooldownCounter = 0;
    return _this;
  }

  _createClass(Bubble, [{
    key: "update",
    value: function update(dt) {

      _get(Bubble.prototype.__proto__ || Object.getPrototypeOf(Bubble.prototype), "update", this).call(this, dt);

      if (this.locked) {
        this.dropCooldownCounter += dt;
      } else {
        this.dropCooldownCounter = 0;
      }

      if (this.growing) {
        var currentProgress = this.progress;
        var futureProgress = currentProgress + this.GROWTH_RATE * dt;

        if (futureProgress >= 1) {
          futureProgress = 1;
          this.secure();
        }
        this.progress = futureProgress;
      }

      this.growing = false;
    }
  }, {
    key: "secure",
    value: function secure() {
      this.complete = true;
    }
  }, {
    key: "damage",
    value: function damage(hp) {
      // TODO (see top) .. like this validation, shouldn't be happening here.. I think
      var currentProgress = this.progress;
      var effectOnProgress = this.HP_TO_PROGRESS * hp;
      var futureProgress = currentProgress - effectOnProgress;

      if (futureProgress < 0) futureProgress = 0;

      this.progress = futureProgress;
    }
  }, {
    key: "resetDropCooldownCounter",
    value: function resetDropCooldownCounter() {
      this.dropCooldownCounter = 0;
    }
  }, {
    key: "progress",
    get: function get() {
      return _get(Bubble.prototype.__proto__ || Object.getPrototypeOf(Bubble.prototype), "progress", this);
    },
    set: function set(percent) {
      this.radius = percent * (this.OUTER_RADIUS - this.INNER_RADIUS) + this.INNER_RADIUS;
    }
  }, {
    key: "ready",
    get: function get() {
      return this.dropCooldownCounter > this.DROP_COOLDOWN;
    }
  }]);

  return Bubble;
}(SimpleBubble);

Bubble.stats = {
  INNER_RADIUS: 64, // px
  OUTER_RADIUS: 256, // px
  GROWTH_RATE: 0.2, // r / s
  HP_TO_PROGRESS: 0.01, // % / hp
  DROP_COOLDOWN: 1
};

var BubbleCore = function () {
  function BubbleCore(bubble) {
    _classCallCheck(this, BubbleCore);

    this.bubble = bubble;

    Object.assign(this, BubbleCore.stats);

    this.radius = this.RADIUS;
  }

  _createClass(BubbleCore, [{
    key: "position",
    get: function get() {
      return this.bubble.position;
    }
  }, {
    key: "disabled",
    get: function get() {
      var b = this.bubble;
      return !b.locked || b.complete || !b.ready;
    }
  }]);

  return BubbleCore;
}();

BubbleCore.stats = {
  RADIUS: 10
};
//# sourceMappingURL=bubble.js.map