"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// function listHistory(callback) {
//   var pp = ENV.storage.previous_players;
//   if(pp) {
//     pp = JSON.parse(pp);
//
//     $.ajax({
//       url: '/online_status',
//       type: 'POST',
//       data: JSON.stringify({ history: pp }),
//       contentType: 'application/json; charset=utf-8',
//       dataType: 'json'
//     })
//     .done(function( list ) {
//       list = list.reverse();
//       for(var user of list) {
//         var a = document.createElement('a'); a.href = `${location.origin}/${user[1]}`;
//         var span = document.createElement('span'); span.className = 'mi'; span.textContent = user[0];
//
//         a.appendChild(span);
//
//         $('.menu').append(a);
//
//         // <a href="/friends"><input type="submit" value="with friends"></a>
//
//         console.log(user)
//       }
//       callback();
//     });
//
//   }
// }
// $(() => {
//   listHistory(()=>{
//
//     $('.mi:not([disabled])').mouseover(jqEvent => {
//       $('.mi').removeClass('selected');
//       var span = jqEvent.currentTarget;
//       span.classList.add('selected')
//       ENV.sound.play('item-hover');
//     });
//     $('.mi:not([disabled])').mouseout(jqEvent => {
//       var span = jqEvent.currentTarget;
//       span.classList.remove('selected')
//     });
//
//   });
// })


var Friends = function () {
  function Friends() {
    _classCallCheck(this, Friends);

    this.historyLimit = 24;

    this.loadState();
  }

  // interfacing with storage

  _createClass(Friends, [{
    key: "loadState",
    value: function loadState() {

      var history = this.parseMap(ENV.storage.history) || new Map();
      var friends = this.parseMap(ENV.storage.friends) || new Map();

      this.history = history;
      this.friends = friends;
    }
  }, {
    key: "saveState",
    value: function saveState() {

      ENV.storage.history = this.stringifyMap(this.history);
      ENV.storage.friends = this.stringifyMap(this.friends);
    }
  }, {
    key: "stringifyMap",
    value: function stringifyMap(map) {
      return JSON.stringify(Array.from(map));
    }
  }, {
    key: "parseMap",
    value: function parseMap(string) {

      var map = void 0;

      try {
        map = new Map(JSON.parse(string));
      } catch (e) {}

      return map;
    }

    // interfacing with the server


    // interfacing with friends class

  }, {
    key: "addFriend",
    value: function addFriend(code, name) {
      this.friends.set(code, name);
      this.saveState();
    }
  }, {
    key: "setFriendName",
    value: function setFriendName(code, name) {
      this.friends.set(code, name);
      this.saveState();
    }
  }, {
    key: "deleteFriend",
    value: function deleteFriend(code) {
      this.friends.delete(code);
      this.saveState();
    }
  }, {
    key: "addHistory",
    value: function addHistory(list) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var code = _ref2[0];
          var name = _ref2[1];

          this.history.set(code, name);
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

      while (this.history.size > this.historyLimit) {
        _(this.history).draw();
      }this.saveState();
    }
  }, {
    key: "clearHistory",
    value: function clearHistory() {
      this.history.clear();
      this.saveState();
    }
  }]);

  return Friends;
}();