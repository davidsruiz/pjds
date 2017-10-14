
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Lobby = require('./server_lobby.js');

var Utilities = {

  median: function median(list) {

    list = list.sort(function (a, b) {
      return a - b;
    });

    var half = Math.floor(list.length / 2);

    if (list.length % 2) return list[half];else return (list[half - 1] + list[half]) / 2.0;
  },

  mean: function mean(list) {
    return list.reduce(function (a, b) {
      return a + b;
    }, 0) / list.length;
  },

  sqrDiff: function sqrDiff(list, reference) {
    return list.map(function (number) {
      return Math.pow(number - reference, 2);
    });
  },

  standardDeviation: function standardDeviation(list) {
    return Math.sqrt(Utilities.mean(Utilities.sqrDiff(list, Utilities.mean(list))));
  },

  deviation: function deviation(list) {
    return Math.sqrt(Utilities.mean(Utilities.sqrDiff(list, Utilities.median(list))));
  },

  // clear array

  clearArray: function clearArray(array) {
    while (array.length) {
      array.pop();
    }
  }

};

var RankedLobby = function (_Lobby) {
  _inherits(RankedLobby, _Lobby);

  function RankedLobby(id, type, requestLobbyFunction, waitThenCheckLobbyFunction, cycles) {
    var options = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};

    _classCallCheck(this, RankedLobby);

    var _this = _possibleConstructorReturn(this, (RankedLobby.__proto__ || Object.getPrototypeOf(RankedLobby)).call(this, id, type, options));

    Utilities.clearArray(_this.editableSettings);

    // request lobby for player using rank
    //  ( this is a function provided by the lobby manager )
    _this.requestLobby = requestLobbyFunction;
    _this.waitThenUpdateAvailabilityStatus = waitThenCheckLobbyFunction;

    _this.cycles = cycles;
    _this.cycles.addListener('rotationUpdate', function () {
      return _this.rotationUpdated();
    });

    _this.syncLobbyRotation();

    return _this;
  }

  _createClass(RankedLobby, [{
    key: 'endGame',
    value: function endGame() {
      _get(RankedLobby.prototype.__proto__ || Object.getPrototypeOf(RankedLobby.prototype), 'endGame', this).call(this);

      // // client and ranks from connected players
      // const clientRanks = [...this.playersMap].map(([client, data]) => [client, Number(data[1]).valueOf()]);
      // const ranks = clientRanks.map(i => i[1]);
      // const median = Utilities.median(ranks);
      // const dev = Utilities.deviation(ranks);
      //
      // const above = [];
      // const below = [];
      //
      // for(let [client, rank] of clientRanks) {
      //
      //   // any client's rank out of bounds is redirected
      //   if(rank > median + dev) {
      //     above.push([client, rank]);
      //   } else if(rank < median - dev) {
      //     below.push([client, rank]);
      //   }
      //
      // }
      //
      // let newLobbyID;
      //
      // newLobbyID = this.requestLobby(Utilities.median(above.map(i => i[1])));
      // for(let [client, ] of above) {
      //   client.emit('shouldChangeLobby', newLobbyID);
      // }
      //
      // newLobbyID = this.requestLobby(Utilities.median(below.map(i => i[1])));
      // for(let [client, ] of below) {
      //   client.emit('shouldChangeLobby', newLobbyID);
      // }
      //
      // this.waitThenUpdateAvailabilityStatus(this, 10000);
    }
  }, {
    key: 'syncLobbyRotation',
    value: function syncLobbyRotation() {
      var _rotation = this.rotation,
          map = _rotation.map,
          mode = _rotation.mode;


      this.options['map'] = map;
      this.options['mode'] = mode;
    }
  }, {
    key: 'rotationUpdated',
    value: function rotationUpdated() {

      var rotation = this.rotation;
      var nextChange = this.nextChange;
      var map = rotation.map,
          mode = rotation.mode;


      this.options['map'] = map;
      this.options['mode'] = mode;

      this.emit('optionsUpdate', ['map', map]);
      this.emit('optionsUpdate', ['mode', mode]);
      this.emit('rotationUpdate', { rotation: rotation, nextChange: nextChange });
    }
  }, {
    key: 'updateUserRank',
    value: function updateUserRank(client, rank) {

      _get(RankedLobby.prototype.__proto__ || Object.getPrototypeOf(RankedLobby.prototype), 'updateUserRank', this).call(this, client, rank);
      this.evaluatePlayerRank(client, rank);
    }
  }, {
    key: 'evaluatePlayerRank',
    value: function evaluatePlayerRank(client, rank) {

      // client and ranks from connected players
      var ranks = [].concat(_toConsumableArray(this.playersMap)).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            client = _ref2[0],
            data = _ref2[1];

        return Number(data[1]).valueOf();
      });
      var median = Utilities.median(ranks);
      var dev = Utilities.deviation(ranks);

      if (rank > median + dev || rank < median - dev) {
        client.emit('shouldChangeLobby', this.requestLobby(rank));
        this.waitThenUpdateAvailabilityStatus(this, 10000);
      }
    }
  }, {
    key: 'map',
    value: function map() {

      // 1. Do regular things
      var map = _get(RankedLobby.prototype.__proto__ || Object.getPrototypeOf(RankedLobby.prototype), 'map', this).call(this);

      // 2. Add special ranked lobby things, like:
      // 2a. Rotation info
      map.rotation = this.rotation;
      map.nextChange = this.nextChange;

      // 3. Return
      return map;
    }
  }, {
    key: 'emitAllLobbyData',
    value: function emitAllLobbyData() {
      this.emit('lobbyUpdate', this.map());
    }
  }, {
    key: 'rotation',
    get: function get() {
      return this.cycles.rotation;
    }
  }, {
    key: 'nextChange',
    get: function get() {
      return this.cycles.nextChangeTime;
    }
  }, {
    key: 'rank',
    get: function get() {
      return [].concat(_toConsumableArray(this.playersMap.values())).map(function (data) {
        return data[1];
      }).reduce(function (a, b) {
        return a + b;
      }, 0) / this.playersMap.size;
    }
  }]);

  return RankedLobby;
}(Lobby);

module.exports = RankedLobby;