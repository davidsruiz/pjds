"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// ----------- view ----------- //


// -- -- -- -- view -- -- -- -- //


// ----------- model ----------- //

var Hint = function Hint(title, body) {
  _classCallCheck(this, Hint);

  this.title = title;
  this.body = body;
};

var Topic = function Topic(title, hints) {
  _classCallCheck(this, Topic);

  this.title = title;
  this.hints = hints;
};

// -- -- -- -- model -- -- -- -- //

// ----------- controller ----------- //

var HintModule = function () {
  function HintModule() {
    _classCallCheck(this, HintModule);

    // init model
    this.topics = [];
    if (!HintModule.topics) this.initTopics();

    // init & setup view

  }

  // model manipulation methods

  _createClass(HintModule, [{
    key: "initTopics",
    value: function initTopics() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(HintModule.topicData)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var name = _step.value;

          var hints = [];
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = HintModule.topicData[name][Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var hintData = _step2.value;

              hints.push(new Hint());
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: "loadTopics",
    value: function loadTopics(list) {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = list[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var name = _step3.value;
          this.loadTopic(name);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }, {
    key: "loadTopic",
    value: function loadTopic(name) {

      var data = HintModule.topics[name];
      if (!data) return;

      var hints = [];

      var topic = new Topic(name, hints);
      this.topics.push(topic);
    }
  }]);

  return HintModule;
}();

// -- -- -- -- controller -- -- -- -- //


// ----------- data ----------- //

HintModule.topicData = {

  'Friends': [["Play with Friends", "% _join_ to go to any lobby hosted by friends"], ["Add Friends", "% _friends_ to enter a player's code"], ["Remove Friends", "% any friend's name to un-friend"], ["Add from History", "% any player's name in your history to friend"]],

  'Joining the Battle': [["Join Match", "% _JOIN_ to play on team of your choice"]],

  'Private Lobby': [["Share", "Friends can join you by sending them a link"], ["Lobby Options", "% _options_ to adjust the settings"]],

  'Practice Lobby': [["Lobby Options", "% _options_ to adjust the settings"], ["Player Limit", "Only one player can participate at a time"]],

  'Other': [["Spectators", "Sharing a link to this lobby, others can watch"]]

};

// -- -- -- -- data -- -- -- -- //