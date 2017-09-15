"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

$(function () {

  ENV.friends = new Friends();
  ENV.friends_page = new FriendsPage(ENV.friends);
});

var DSGameFriends = function (_React$Component) {
  _inherits(DSGameFriends, _React$Component);

  function DSGameFriends(props) {
    _classCallCheck(this, DSGameFriends);

    var _this = _possibleConstructorReturn(this, (DSGameFriends.__proto__ || Object.getPrototypeOf(DSGameFriends)).call(this, props));

    _this.state = {
      lobbyOptionsShown: false
    };
    return _this;
  }

  _createClass(DSGameFriends, [{
    key: "lobbyOptionsToggle",
    value: function lobbyOptionsToggle() {
      this.setState({
        lobbyOptionsShown: !this.state.lobbyOptionsShown
      });
    }
  }, {
    key: "friendPlayer",
    value: function friendPlayer(data) {
      // data == [code, name]
      ENV.friends_page.friendPlayer(data);
    }
  }, {
    key: "unfriendPlayer",
    value: function unfriendPlayer(data) {
      // data == [code, name]
      ENV.friends_page.unfriendPlayer(data);
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _props$data = this.props.data,
          lobbies = _props$data.lobbies,
          unavailable = _props$data.unavailable,
          history = _props$data.history;


      return React.createElement(
        "div",
        { id: "ds-game-friends", className: "parent-container" },
        React.createElement(
          "div",
          { id: "part-1", className: "split-view-part1" },
          React.createElement(IconBar, null),
          React.createElement(FriendsHeader, null),
          React.createElement(LobbiesSection, { lobbies: lobbies, onClick: function onClick(data) {
              return _this2.unfriendPlayer(data);
            } })
        ),
        React.createElement(
          "div",
          { id: "part-2", className: "split-view-part2" },
          React.createElement(UnavailableSection, { unavailable: unavailable, onClick: function onClick(data) {
              return _this2.unfriendPlayer(data);
            } }),
          React.createElement(HistorySection, { history: history, onClick: function onClick(data) {
              return _this2.friendPlayer(data);
            } })
        )
      );
    }
  }]);

  return DSGameFriends;
}(React.Component);

var FriendsHeader = function (_React$Component2) {
  _inherits(FriendsHeader, _React$Component2);

  function FriendsHeader() {
    _classCallCheck(this, FriendsHeader);

    return _possibleConstructorReturn(this, (FriendsHeader.__proto__ || Object.getPrototypeOf(FriendsHeader)).apply(this, arguments));
  }

  _createClass(FriendsHeader, [{
    key: "handleAddFriendClick",
    value: function handleAddFriendClick() {
      ENV.friends_page.enterFriendCode();
    }
  }, {
    key: "render",
    value: function render() {
      var _this4 = this;

      return React.createElement(
        "div",
        { id: "friends-header" },
        React.createElement(
          "span",
          { id: "friends-header-title", className: "header-1" },
          FRIENDS_REF.title
        ),
        React.createElement(
          "span",
          { id: "friends-header-desc", className: "lobby-text" },
          FRIENDS_REF.description
        ),
        React.createElement(
          "div",
          { id: "friends-header-button-row" },
          React.createElement(
            "span",
            { className: "lobby-button", onClick: function onClick() {
                return _this4.handleAddFriendClick();
              } },
            "add friend"
          )
        )
      );
    }
  }]);

  return FriendsHeader;
}(React.Component);

var LobbiesSection = function (_React$Component3) {
  _inherits(LobbiesSection, _React$Component3);

  function LobbiesSection() {
    _classCallCheck(this, LobbiesSection);

    return _possibleConstructorReturn(this, (LobbiesSection.__proto__ || Object.getPrototypeOf(LobbiesSection)).apply(this, arguments));
  }

  _createClass(LobbiesSection, [{
    key: "handleHostMatchClick",
    value: function handleHostMatchClick() {
      ENV.friends_page.hostMatch();
    }
  }, {
    key: "handleJoinClick",
    value: function handleJoinClick(lobbyID) {
      window.location = window.location.origin + "/" + lobbyID;
    }
  }, {
    key: "render",
    value: function render() {
      var _this6 = this;

      var rows = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.props.lobbies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var lobby = _step.value;

          rows.push(React.createElement(LobbyRow, { key: lobby[0], lobby: lobby, onJoin: function onJoin(lobbyID) {
              return _this6.handleJoinClick(lobbyID);
            }, onClick: function onClick(data) {
              return _this6.props.onClick(data);
            } }));
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

      if (rows.length == 0) rows.push(React.createElement(
        "span",
        { key: '---', className: "filler-text" },
        "none"
      ));

      return React.createElement(
        "div",
        { id: "friends-lobby-section" },
        React.createElement(
          "div",
          { className: "title-row" },
          React.createElement(
            "span",
            { className: "header-2" },
            'JOINABLE'
          ),
          React.createElement(
            "span",
            { className: "lobby-button", onClick: function onClick() {
                return _this6.handleHostMatchClick();
              } },
            "host match"
          )
        ),
        rows
      );
    }
  }]);

  return LobbiesSection;
}(React.Component);

var LobbyRow = function (_React$Component4) {
  _inherits(LobbyRow, _React$Component4);

  function LobbyRow() {
    _classCallCheck(this, LobbyRow);

    return _possibleConstructorReturn(this, (LobbyRow.__proto__ || Object.getPrototypeOf(LobbyRow)).apply(this, arguments));
  }

  _createClass(LobbyRow, [{
    key: "render",
    value: function render() {
      var _this8 = this;

      var lobbyID = this.props.lobby[0];
      var players = this.props.lobby.slice(1);
      var playerList = [];

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = players[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _ref = _step2.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var code = _ref2[0];
          var name = _ref2[1];

          playerList.push(React.createElement(PlayerButton, { key: code, code: code, name: name, onClick: function onClick(data) {
              return _this8.props.onClick(data);
            } }));
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

      return React.createElement(
        "div",
        { className: "lobby-row" },
        React.createElement(
          "div",
          { className: "lobby-row-info-group" },
          React.createElement(
            "span",
            { className: "lobby-id" },
            lobbyID.toUpperCase()
          ),
          React.createElement(
            "div",
            { className: "player-list" },
            playerList
          )
        ),
        React.createElement(
          "span",
          { className: "lobby-button", onClick: function onClick() {
              return _this8.props.onJoin(lobbyID);
            } },
          "join"
        )
      );
    }
  }]);

  return LobbyRow;
}(React.Component);

var PlayerButton = function (_React$Component5) {
  _inherits(PlayerButton, _React$Component5);

  function PlayerButton() {
    _classCallCheck(this, PlayerButton);

    return _possibleConstructorReturn(this, (PlayerButton.__proto__ || Object.getPrototypeOf(PlayerButton)).apply(this, arguments));
  }

  _createClass(PlayerButton, [{
    key: "render",
    value: function render() {
      var _this10 = this;

      return React.createElement(
        "span",
        {
          className: "player-button",
          onClick: function onClick() {
            return _this10.props.onClick([_this10.props.code, _this10.props.name]);
          } },
        this.props.name || '---'
      );
    }
  }]);

  return PlayerButton;
}(React.Component);

var UnavailableSection = function (_React$Component6) {
  _inherits(UnavailableSection, _React$Component6);

  function UnavailableSection() {
    _classCallCheck(this, UnavailableSection);

    return _possibleConstructorReturn(this, (UnavailableSection.__proto__ || Object.getPrototypeOf(UnavailableSection)).apply(this, arguments));
  }

  _createClass(UnavailableSection, [{
    key: "render",
    value: function render() {
      var _this12 = this;

      var rows = [];
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.props.unavailable[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _ref3 = _step3.value;

          var _ref4 = _slicedToArray(_ref3, 2);

          var code = _ref4[0];
          var name = _ref4[1];

          rows.push(React.createElement(PlayerButton, { key: code, code: code, name: name, onClick: function onClick(data) {
              return _this12.props.onClick(data);
            } }));
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

      if (rows.length == 0) rows.push(React.createElement(
        "span",
        { key: '---', className: "filler-text" },
        "none"
      ));

      return React.createElement(
        "div",
        { id: "friends-unavailable-section", className: "split-view-part1" },
        React.createElement(
          "div",
          { className: "title-row" },
          React.createElement(
            "span",
            { className: "header-2" },
            'NOT AVAILABLE'
          )
        ),
        rows
      );
    }
  }]);

  return UnavailableSection;
}(React.Component);

var HistorySection = function (_React$Component7) {
  _inherits(HistorySection, _React$Component7);

  function HistorySection() {
    _classCallCheck(this, HistorySection);

    return _possibleConstructorReturn(this, (HistorySection.__proto__ || Object.getPrototypeOf(HistorySection)).apply(this, arguments));
  }

  _createClass(HistorySection, [{
    key: "handleClearHistoryClick",
    value: function handleClearHistoryClick() {
      ENV.friends_page.clearHistory();
    }
  }, {
    key: "render",
    value: function render() {
      var _this14 = this;

      var empty = this.props.history.length == 0;
      var buttonTitle = 'clear';
      var onClick = empty ? function () {} : function () {
        return _this14.handleClearHistoryClick();
      };
      var rows = [];

      if (!empty) {
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {

          for (var _iterator4 = this.props.history[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _ref5 = _step4.value;

            var _ref6 = _slicedToArray(_ref5, 2);

            var code = _ref6[0];
            var name = _ref6[1];

            rows.push(React.createElement(PlayerButton, { key: code, code: code, name: name, onClick: function onClick(data) {
                return _this14.props.onClick(data);
              } }));
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      } else {

        rows.push(React.createElement(
          "span",
          { key: '---', className: "filler-text" },
          "none"
        ));
      }

      return React.createElement(
        "div",
        { id: "friends-history-section", className: "split-view-part2" },
        React.createElement(
          "div",
          { className: "title-row" },
          React.createElement(
            "span",
            { className: "header-2" },
            'HISTORY'
          ),
          React.createElement(
            "span",
            { className: "lobby-button", disabled: empty, onClick: onClick },
            buttonTitle
          )
        ),
        rows
      );
    }
  }]);

  return HistorySection;
}(React.Component);

var IconBar = function (_React$Component8) {
  _inherits(IconBar, _React$Component8);

  function IconBar() {
    _classCallCheck(this, IconBar);

    return _possibleConstructorReturn(this, (IconBar.__proto__ || Object.getPrototypeOf(IconBar)).apply(this, arguments));
  }

  _createClass(IconBar, [{
    key: "render",
    value: function render() {

      var homeAction = function homeAction() {
        return window.location.reset();
      };

      return React.createElement(
        "div",
        { id: "icon-bar" },
        React.createElement(IconButton, { iconName: "home", onClick: function onClick() {
            return homeAction();
          } }),
        React.createElement(IconButton, { iconName: "volume_up" }),
        React.createElement(IconButton, { iconName: "help" }),
        React.createElement(IconButton, { iconName: "settings" })
      );
    }
  }]);

  return IconBar;
}(React.Component);

var IconButton = function (_React$Component9) {
  _inherits(IconButton, _React$Component9);

  function IconButton() {
    _classCallCheck(this, IconButton);

    return _possibleConstructorReturn(this, (IconButton.__proto__ || Object.getPrototypeOf(IconButton)).apply(this, arguments));
  }

  _createClass(IconButton, [{
    key: "render",
    value: function render() {
      var _this17 = this;

      return React.createElement(
        "button",
        { className: this.props.iconName + '_icon', onClick: function onClick() {
            return _this17.props.onClick();
          } },
        React.createElement(
          "i",
          { className: "material-icons" },
          this.props.iconName
        )
      );
    }
  }]);

  return IconButton;
}(React.Component);

var sendSAMPLEDATA = ['4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3'];

var receiveSAMPLEDATA = {

  lobbies: [['Dks73k', '4a50adb3', '4a50adb3'], ['HJKADF', '4a50adb3', '4a50adb3'], ['BJ5QBE', '4a50adb3']],

  unavailable: ['4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3'],

  names: [['bro', 'bro', 'bro', 'bro', 'bro', 'bro', 'bro', 'bro', 'bro', 'bro'], ['4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3']]

};

var dataSAMPLEDATA = {

  lobbies: [['Dks73k', ['4a50adb3', 'bro'], ['4a50adb3', 'bro']], ['HJKADF', ['4a50adb3', 'bro'], ['4a50adb3', 'bro']], ['BJ5QBE', ['4a50adb3', 'bro'], ['4a50adb3', 'bro']]],

  unavailable: [['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro']],

  history: [['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro'], ['4a50adb3', 'bro']]

};

var FriendsPage = function () {
  function FriendsPage(adapter) {
    _classCallCheck(this, FriendsPage);

    // interface with local player record
    this.adapter = adapter;

    // data formatted for React
    this.data = { lobbies: [], unavailable: [], history: [] };

    this.loadHistory(); // fill history portion
    this.contactServer(); // fill lobbies/unavailable portion
  }

  // [- Process -]
  // 1. a friends list will be sent to find out who is available to play
  // 2. the server responds with the names and lobbies of connected players

  _createClass(FriendsPage, [{
    key: "contactServer",
    value: function contactServer() {
      var _this18 = this;

      var IDList = Array.from(this.adapter.friends).map(function (a) {
        return a[0];
      }); // from map to 1d arr.

      $.ajax({
        url: '/online_status',
        type: 'POST',
        data: JSON.stringify({ list: IDList }),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json'
      }).done(function (data) {
        return _this18.serverResponded(data);
      });
    }
  }, {
    key: "serverResponded",
    value: function serverResponded(data) {
      var _this19 = this;

      console.log(data);

      // sync names from server
      this.setNames(data.names);

      // lobbies
      this.data.lobbies = [];
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = data.lobbies[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var lobby = _step5.value;

          var convertedLobby = [];
          convertedLobby.push(lobby.shift());
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = lobby[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var code = _step6.value;

              convertedLobby.push(this.namedPairFor(code));
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }

          this.data.lobbies.push(convertedLobby);
        }

        // unavailable
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      this.data.unavailable = data.unavailable.map(function (code) {
        return _this19.namedPairFor(code);
      });

      // refresh React
      this.loadHistory();
      this.render();
    }
  }, {
    key: "setNames",
    value: function setNames(namesList) {
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = namesList[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var _ref7 = _step7.value;

          var _ref8 = _slicedToArray(_ref7, 2);

          var id = _ref8[0];
          var name = _ref8[1];

          this.adapter.setFriendName(id, name);
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
    }
  }, {
    key: "namedPairFor",
    value: function namedPairFor(code) {
      return [code, this.adapter.friends.get(code)];
    }
  }, {
    key: "friendPlayer",
    value: function friendPlayer(_ref9) {
      var _ref10 = _slicedToArray(_ref9, 2),
          code = _ref10[0],
          name = _ref10[1];

      if (!window.confirm(FRIENDS_REF.friendQuestion(name))) return;

      if (this.adapter.friends.has(code)) return;

      this.adapter.addFriend(code, name);

      this.contactServer();
    }
  }, {
    key: "unfriendPlayer",
    value: function unfriendPlayer(_ref11) {
      var _ref12 = _slicedToArray(_ref11, 2),
          code = _ref12[0],
          name = _ref12[1];

      if (!window.confirm(FRIENDS_REF.unfriendQuestion(name))) return;

      if (!this.adapter.friends.has(code)) return;

      this.adapter.deleteFriend(code);
      this.loadHistory();
      this.render();

      this.contactServer();
    }

    // for host button

  }, {
    key: "hostMatch",
    value: function hostMatch() {

      var method = 'post';
      var url = '/create';

      var form = $('<form>', {
        method: method,
        action: url
      });

      $('body').append(form);
      form.submit();

      // $.ajax({
      //   url: '/create',
      //   type: 'POST',
      // }).done(
      //   data => data.redirect ? window.location.href = data.redirect : 0
      // );


      // <form action="/create" method="POST"><input type="submit" value="host"></form>
    }
  }, {
    key: "loadHistory",
    value: function loadHistory() {
      var _this20 = this;

      var history = Array.from(this.adapter.history); // map to 2d arr.

      history = _(history).reject(function (p) {
        return _this20.adapter.friends.has(p[0]);
      }); // filter out any friends

      this.data.history = history; // assign
    }
  }, {
    key: "clearHistory",
    value: function clearHistory() {

      if (!window.confirm(FRIENDS_REF.clearHistoryQuestion)) return;

      this.adapter.clearHistory();
      this.loadHistory();
      this.render();
    }
  }, {
    key: "enterFriendCode",
    value: function enterFriendCode() {

      var response = window.prompt("Enter a friends ID code.\nHere is yours to copy:", ENV.user.id);
      var passedValidation = /^(\d|\w){8}$/.test(response);
      var isNotOurOwn = response != ENV.user.id;

      if (passedValidation && isNotOurOwn) {

        this.adapter.addFriend(response);
        this.contactServer();
      } else {
        console.log("ID (" + response + ") was rejected as a friend. see enterFriendCode");
      }
    }
  }, {
    key: "render",
    value: function render() {
      ReactDOM.render(React.createElement(DSGameFriends, { data: this.data }), document.getElementById('container'));
    }
  }]);

  return FriendsPage;
}();

var FRIENDS_REF = {
  title: "FRIENDS",
  description: "Add friends to join them when they\u2019re online.\nYou can also find recent players here.",
  friendQuestion: function friendQuestion(name) {
    return "Add " + (name || 'this player') + " as a friend?";
  },
  unfriendQuestion: function unfriendQuestion(name) {
    return "Remove " + (name || 'this player') + " as a friend?";
  },
  clearHistoryQuestion: "Clear history?"
};
//# sourceMappingURL=friends_page.js.map