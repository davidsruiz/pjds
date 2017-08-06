'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// function refreshLobbyView() {
//
//   // clear it up
//   $('span.mi').remove();
//
//   // populate
//   let players = ENV["lobby"]["players"];
//   players.forEach((id, player) => {
//
//     let name = player.name;
//     if(id == ENV.storage.id) {
//       let span = document.createElement('span'); span.className = 'mi';
//       let input = document.createElement('input'); input.id = "name-input";
//       input.type = "text";
//       input.placeholder = "your name";
//       input.value = name;
//       input.onkeydown = function(e) { if(e.keyCode==13) $(this).blur() };
//       input.oninput = function() { ENV.sound.play('type') };
//       input.onfocus = function() { editing = true };
//       input.onblur = function() { socket.emit('set name', this.value.substr(0, 24)); editing = false; refreshLobbyView() };
//       let row = document.createElement('span'); row.className = 'mi-row';
//       let select = document.createElement('select');
//       // let defoption = document.createElement('option'); defoption.disabled = true; defoption.textContent = "choose ship type";
//       // select.appendChild(defoption);
//       // let random_option = document.createElement('option'); random_option.textContent = "random"; random_option.value = types.sample();
//       // select.appendChild(random_option);
//       types.forEach(t => {
//         let option = document.createElement('option');
//         option.innerHTML = t;
//         select.appendChild(option);
//       });
//       select.value = ENV.storage.type || 'standard';//defoption.textContent;
//       select.onchange = function(e) { socket.emit('set type', this.value); ENV.storage.type = this.value; };
//       let team = document.createElement('select');
//       let no_team = document.createElement('option');
//       no_team.innerHTML = '-';
//       no_team.value = -1;
//       team.appendChild(no_team);
//       ENV.lobby.team_capacity.times(i => {
//         let option = document.createElement('option');
//         option.innerHTML = i+1;
//         option.value = i;
//         team.appendChild(option);
//       });
//       team.value = ENV.storage.team || -1;
//       team.onchange = function(e) { socket.emit('set team', this.value); ENV.storage.team = this.value; };
//       // let right = document.createElement('span');
//       let checkbox = document.createElement('input'); checkbox.type = "checkbox"; checkbox.name = "checkbox";
//       checkbox.onchange = function() { if(this.checked) { socket.emit('ready'); ENV.sound.play('ready') } };
//
//       row.appendChild(document.createTextNode("type:"));
//       row.appendChild(select);
//       if(ENV.lobby.type == 'private') row.appendChild(document.createTextNode("team:"));
//       if(ENV.lobby.type == 'private') row.appendChild(team);
//       if(player.cleared) row.appendChild(document.createTextNode("ready?"));
//       if(player.cleared) row.appendChild(checkbox); //row.appendChild(checkboxlabel);
//
//       span.appendChild(input);
//       span.appendChild(row);
//
//       $('.lobby > main').append(span);
//       if(player.ready) { input.disabled = true; select.disabled = true; checkbox.checked = true; checkbox.disabled = true; }
//     } else {
//       let span = document.createElement('span'); span.className = 'mi player'; span.textContent = name || 'connected..'; span.title = name;
//       $('.lobby > main').append(span);
//     }
//   });
//
//   let emptySlots =  ENV["lobby"]["capacity"] - Object.keys(players).length;
//   emptySlots.times(()=>{
//     let span = document.createElement('span'); span.className = 'mi vacant'; span.textContent = 'waiting for players...';
//     $('.lobby > main').append(span);
//   });
//
// }


var types = ['damage', 'speed', 'standard', 'rate', 'defense'];

// scroll view
// let resetScrollView = () => {
// var scroll_view = document.querySelector('#touch_layer .scroll');
// scroll_view.scrollTop = scroll_view.scrollHeight/2;
// };
// $(()=>resetScrollView());

var lastTouchEnd = 0;
document.documentElement.addEventListener('touchend', function (event) {
  var now = new Date().getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

window.addEventListener('load', function () {
  document.querySelector('#touch_layer').addEventListener('touchstart', function (event) {
    event.preventDefault();
  }, true);
  document.querySelector('#touch_layer').addEventListener('touchend', function (event) {
    event.preventDefault();
  }, false);
});

var TINT = {
  assortment: [['#0000ff', '#ff0000'], ['#0000ff', '#aedc39'], ['#0048ff', '#cc00ff']],

  shuffle: function shuffle() {
    var _TINT$assortment$samp = TINT.assortment.sample(),
        _TINT$assortment$samp2 = _slicedToArray(_TINT$assortment$samp, 2),
        c1 = _TINT$assortment$samp2[0],
        c2 = _TINT$assortment$samp2[1],
        deg = Math.randomIntMinMax(15, 75);

    TINT.load(deg, c1, c2);
  },
  load: function load(deg, c1, c2) {
    var elem = document.querySelector('#tint');
    if (elem) $(elem).css('background', 'linear-gradient(' + deg + 'deg, ' + c1 + ', ' + c2 + ')');
  }
};

var DSGameLobby = function (_React$Component) {
  _inherits(DSGameLobby, _React$Component);

  function DSGameLobby(props) {
    _classCallCheck(this, DSGameLobby);

    var _this = _possibleConstructorReturn(this, (DSGameLobby.__proto__ || Object.getPrototypeOf(DSGameLobby)).call(this, props));

    _this.state = {
      // state.userEngagementPhase
      //   values: 0 - available to join
      //           1 - joined
      //           2 - locked in
      //           3 - not available to join
      userEngagementPhase: 0,
      lobbyOptionsShown: false
    };
    return _this;
  }

  _createClass(DSGameLobby, [{
    key: 'lobbyOptionsToggle',
    value: function lobbyOptionsToggle() {
      this.setState({
        lobbyOptionsShown: !this.state.lobbyOptionsShown
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var data = this.props.data;

      return React.createElement(
        'div',
        { id: 'ds-game-lobby' },
        React.createElement(
          'div',
          { id: 'part-1' },
          React.createElement(IconBar, null),
          React.createElement(
            'span',
            { id: 'logo-type' },
            'DEEP SPACE'
          ),
          React.createElement(LobbyType, { type: data.type }),
          React.createElement(LobbyActions, { code: data.code, prefs: data.game_settings, onClick: function onClick() {
              return _this2.lobbyOptionsToggle();
            } }),
          React.createElement(LobbyOptions, { prefs: data.game_settings, show: this.state.lobbyOptionsShown })
        ),
        React.createElement(
          'div',
          { id: 'part-2' },
          React.createElement(PlayerConfig, { userEngagementPhase: this.state.userEngagementPhase }),
          React.createElement(LobbyUsers, { users: data.users, playerLimit: data.game_settings.player_capacity })
        )
      );
    }
  }]);

  return DSGameLobby;
}(React.Component);

var IconBar = function (_React$Component2) {
  _inherits(IconBar, _React$Component2);

  function IconBar() {
    _classCallCheck(this, IconBar);

    return _possibleConstructorReturn(this, (IconBar.__proto__ || Object.getPrototypeOf(IconBar)).apply(this, arguments));
  }

  _createClass(IconBar, [{
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        { id: 'icon-bar' },
        React.createElement(IconButton, { iconName: 'home' }),
        React.createElement(IconButton, { iconName: 'volume_up' }),
        React.createElement(IconButton, { iconName: 'help' }),
        React.createElement(IconButton, { iconName: 'settings' })
      );
    }
  }]);

  return IconBar;
}(React.Component);

var IconButton = function (_React$Component3) {
  _inherits(IconButton, _React$Component3);

  function IconButton() {
    _classCallCheck(this, IconButton);

    return _possibleConstructorReturn(this, (IconButton.__proto__ || Object.getPrototypeOf(IconButton)).apply(this, arguments));
  }

  _createClass(IconButton, [{
    key: 'render',
    value: function render() {
      return React.createElement(
        'button',
        { className: this.props.iconName + '_icon' },
        React.createElement(
          'i',
          { className: 'material-icons' },
          this.props.iconName
        )
      );
    }
  }]);

  return IconButton;
}(React.Component);

var LobbyType = function (_React$Component4) {
  _inherits(LobbyType, _React$Component4);

  function LobbyType() {
    _classCallCheck(this, LobbyType);

    return _possibleConstructorReturn(this, (LobbyType.__proto__ || Object.getPrototypeOf(LobbyType)).apply(this, arguments));
  }

  _createClass(LobbyType, [{
    key: 'render',
    value: function render() {

      var name = (REF.lobby.type[this.props.type] + ' lobby').toUpperCase();
      var desc = REF.lobby.typeDesc[this.props.type];

      return React.createElement(
        'div',
        { id: 'lobby-type' },
        React.createElement(
          'span',
          { id: 'lobby-type-name' },
          name
        ),
        React.createElement(
          'span',
          { id: 'lobby-type-desc' },
          desc
        )
      );
    }
  }]);

  return LobbyType;
}(React.Component);

var LobbyActions = function (_React$Component5) {
  _inherits(LobbyActions, _React$Component5);

  function LobbyActions() {
    _classCallCheck(this, LobbyActions);

    return _possibleConstructorReturn(this, (LobbyActions.__proto__ || Object.getPrototypeOf(LobbyActions)).apply(this, arguments));
  }

  _createClass(LobbyActions, [{
    key: 'render',
    value: function render() {
      var _this7 = this;

      var code = this.props.code;

      return React.createElement(
        'div',
        { id: 'lobby-action' },
        React.createElement(
          'span',
          { id: 'lobby-id' },
          code.toUpperCase()
        ),
        React.createElement(
          'div',
          { id: 'lobby-action-buttons' },
          React.createElement(
            'span',
            { className: 'lobby-button' },
            'share'
          ),
          React.createElement(
            'span',
            { className: 'lobby-button' },
            'add password'
          ),
          React.createElement(
            'span',
            { id: 'lobby-button-option', className: 'lobby-button', onClick: function onClick() {
                return _this7.props.onClick();
              } },
            'options'
          )
        )
      );
    }
  }]);

  return LobbyActions;
}(React.Component);

var LobbyOptions = function (_React$Component6) {
  _inherits(LobbyOptions, _React$Component6);

  function LobbyOptions(props) {
    _classCallCheck(this, LobbyOptions);

    var _this8 = _possibleConstructorReturn(this, (LobbyOptions.__proto__ || Object.getPrototypeOf(LobbyOptions)).call(this, props));

    _this8.state = {
      prefs: props.prefs
    };
    return _this8;
  }

  _createClass(LobbyOptions, [{
    key: 'handleOptionChange',
    value: function handleOptionChange(optionKey, choiceIndex) {

      var copy = Object.assign({}, this.state.prefs);
      copy[optionKey] = choiceIndex;
      this.setState({
        prefs: copy
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this9 = this;

      var options = [];

      // iterating over object
      Object.keys(this.state.prefs).forEach(function (optionKey) {
        var optionValue = _this9.state.prefs[optionKey];
        options.push(React.createElement(ListSelect, { key: optionKey, optionKey: optionKey, optionValue: optionValue, onClick: function onClick(optionKey, choiceIndex) {
            return _this9.handleOptionChange(optionKey, choiceIndex);
          } }));
      });

      return React.createElement(
        'div',
        { id: 'lobby-options', className: this.props.show ? '' : 'hidden' },
        options
      );
    }
  }]);

  return LobbyOptions;
}(React.Component);

var ListSelect = function (_React$Component7) {
  _inherits(ListSelect, _React$Component7);

  function ListSelect() {
    _classCallCheck(this, ListSelect);

    return _possibleConstructorReturn(this, (ListSelect.__proto__ || Object.getPrototypeOf(ListSelect)).apply(this, arguments));
  }

  _createClass(ListSelect, [{
    key: 'render',
    value: function render() {
      var _this11 = this;

      var optionKey = this.props.optionKey;
      var selectedChoice = this.props.optionValue;

      var selectTitle = LOBBY_OPTIONS[optionKey][0];
      var choices = LOBBY_OPTIONS[optionKey].slice(1);

      var optionChoices = [];
      choices.forEach(function (choice, choiceIndex) {
        optionChoices.push(React.createElement(ListSelectOption, {
          key: choice,
          title: choice,
          selected: choiceIndex === selectedChoice,
          onClick: function onClick() {
            return _this11.props.onClick(optionKey, choiceIndex);
          } }));
      });

      return React.createElement(
        'div',
        { className: 'list-select' },
        React.createElement(
          'span',
          { className: 'list-select-title' },
          selectTitle
        ),
        React.createElement(
          'div',
          { className: 'list-select-options' },
          optionChoices
        )
      );
    }
  }]);

  return ListSelect;
}(React.Component);

var ListSelectOption = function (_React$Component8) {
  _inherits(ListSelectOption, _React$Component8);

  function ListSelectOption() {
    _classCallCheck(this, ListSelectOption);

    return _possibleConstructorReturn(this, (ListSelectOption.__proto__ || Object.getPrototypeOf(ListSelectOption)).apply(this, arguments));
  }

  _createClass(ListSelectOption, [{
    key: 'render',
    value: function render() {
      var _this13 = this;

      var title = this.props.title;
      var selected = this.props.selected;
      var className = selected ? 'active' : '';

      return React.createElement(
        'span',
        { className: className, onClick: function onClick() {
            return _this13.props.onClick();
          } },
        title
      );
    }
  }]);

  return ListSelectOption;
}(React.Component);

var PlayerConfig = function (_React$Component9) {
  _inherits(PlayerConfig, _React$Component9);

  function PlayerConfig(props) {
    _classCallCheck(this, PlayerConfig);

    var _this14 = _possibleConstructorReturn(this, (PlayerConfig.__proto__ || Object.getPrototypeOf(PlayerConfig)).call(this, props));

    _this14.shipCatalogue = [0, 1, 2, 3, 4];
    _this14.catalogueIndex = 0;

    _this14.state = {
      ship: _this14.shipCatalogue[_this14.catalogueIndex],
      // abilities: [3x],
      expanded: false
    };

    return _this14;
  }

  _createClass(PlayerConfig, [{
    key: 'refreshShip',
    value: function refreshShip() {
      this.setState({
        ship: this.shipCatalogue[this.catalogueIndex]
      });
    }
  }, {
    key: 'nextShip',
    value: function nextShip() {
      this.catalogueIndex++;
      if (this.catalogueIndex > this.shipCatalogue.length - 1) this.catalogueIndex = 0;
      this.refreshShip();
    }
  }, {
    key: 'prevShip',
    value: function prevShip() {
      this.catalogueIndex--;
      if (this.catalogueIndex < 0) this.catalogueIndex = this.shipCatalogue.length - 1;
      this.refreshShip();
    }
  }, {
    key: 'handleClick',
    value: function handleClick(isLeft) {
      isLeft ? this.prevShip() : this.nextShip();
    }
  }, {
    key: 'handleExpansionToggle',
    value: function handleExpansionToggle() {
      this.setState({
        expanded: !this.state.expanded
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this15 = this;

      return React.createElement(
        'div',
        { id: 'player-config' },
        React.createElement(ShipPicker, { ship: this.state.ship, onClick: function onClick(isLeft) {
            return _this15.handleClick(isLeft);
          } }),
        React.createElement(ShipDesc, { ship: this.state.ship }),
        React.createElement(ShipStats, { ship: this.state.ship, expanded: this.state.expanded }),
        React.createElement(ShipSub, { ship: this.state.ship, expanded: this.state.expanded }),
        React.createElement(
          'div',
          { id: 'ability-action-box' },
          React.createElement(
            'div',
            { id: 'ability-action-box-row' },
            React.createElement(
              'span',
              { onClick: function onClick() {
                  return _this15.handleExpansionToggle();
                } },
              this.state.expanded ? 'less' : 'more'
            ),
            React.createElement(ActionButton, { userEngagementPhase: this.props.userEngagementPhase })
          )
        )
      );
    }
  }]);

  return PlayerConfig;
}(React.Component);

var ShipPicker = function (_React$Component10) {
  _inherits(ShipPicker, _React$Component10);

  function ShipPicker() {
    _classCallCheck(this, ShipPicker);

    return _possibleConstructorReturn(this, (ShipPicker.__proto__ || Object.getPrototypeOf(ShipPicker)).apply(this, arguments));
  }

  _createClass(ShipPicker, [{
    key: 'render',
    value: function render() {
      var _this17 = this;

      var i = this.props.ship;
      var typeName = REF.ship.type[i];

      return React.createElement(
        'div',
        { id: 'ship-picker' },
        React.createElement(
          'span',
          {
            id: 'ship-picker-left',
            className: 'ship-picker-arrow',
            onClick: function onClick() {
              return _this17.props.onClick(true);
            } },
          '<'
        ),
        React.createElement(
          'span',
          { id: 'ship-picker-text',
            onClick: function onClick() {
              return _this17.props.onClick(false);
            } },
          typeName.toUpperCase()
        ),
        React.createElement(
          'span',
          {
            id: 'ship-picker-right',
            className: 'ship-picker-arrow',
            onClick: function onClick() {
              return _this17.props.onClick(false);
            } },
          '>'
        )
      );
    }
  }]);

  return ShipPicker;
}(React.Component);

var ShipDesc = function (_React$Component11) {
  _inherits(ShipDesc, _React$Component11);

  function ShipDesc() {
    _classCallCheck(this, ShipDesc);

    return _possibleConstructorReturn(this, (ShipDesc.__proto__ || Object.getPrototypeOf(ShipDesc)).apply(this, arguments));
  }

  _createClass(ShipDesc, [{
    key: 'render',
    value: function render() {
      var i = this.props.ship;
      var typeName = REF.ship.type[i];
      var imagePath = IMAGES.ship[i];
      var typeDesc = REF.ship.typeDesc[i];

      return React.createElement(
        'div',
        { id: 'ship-desc' },
        React.createElement(
          'div',
          { id: 'ship-desc-image' },
          React.createElement('div', { id: 'ship-desc-image-background' }),
          React.createElement('img', { src: imagePath, alt: typeName + ' ship image', id: 'ship-desc-image-mask' })
        ),
        React.createElement(
          'span',
          { id: 'ship-desc-text' },
          typeDesc
        )
      );
    }
  }]);

  return ShipDesc;
}(React.Component);

var ShipStats = function (_React$Component12) {
  _inherits(ShipStats, _React$Component12);

  function ShipStats() {
    _classCallCheck(this, ShipStats);

    return _possibleConstructorReturn(this, (ShipStats.__proto__ || Object.getPrototypeOf(ShipStats)).apply(this, arguments));
  }

  _createClass(ShipStats, [{
    key: 'render',
    value: function render() {

      var className = this.props.expanded ? '' : 'collapsed';

      var rows = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = REF.ship.stats[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var metric = _step.value;

          var title = metric[0];
          var value = metric.slice(1)[this.props.ship];
          rows.push(React.createElement(ShipStatsRow, { key: title, title: title, value: value }));
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

      return React.createElement(
        'div',
        { id: 'ship-stats', className: className },
        rows
      );
    }
  }]);

  return ShipStats;
}(React.Component);

var ShipStatsRow = function (_React$Component13) {
  _inherits(ShipStatsRow, _React$Component13);

  function ShipStatsRow() {
    _classCallCheck(this, ShipStatsRow);

    return _possibleConstructorReturn(this, (ShipStatsRow.__proto__ || Object.getPrototypeOf(ShipStatsRow)).apply(this, arguments));
  }

  _createClass(ShipStatsRow, [{
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        { className: 'ship-stats-row' },
        React.createElement(
          'span',
          { className: 'ship-stats-row-label' },
          this.props.title
        ),
        React.createElement(
          'span',
          { className: 'ship-stats-bar' },
          React.createElement('span', { className: 'ship-stats-bar-value-' + this.props.value * 10 })
        )
      );
    }
  }]);

  return ShipStatsRow;
}(React.Component);

var ShipSub = function (_React$Component14) {
  _inherits(ShipSub, _React$Component14);

  function ShipSub() {
    _classCallCheck(this, ShipSub);

    return _possibleConstructorReturn(this, (ShipSub.__proto__ || Object.getPrototypeOf(ShipSub)).apply(this, arguments));
  }

  _createClass(ShipSub, [{
    key: 'render',
    value: function render() {

      var className = this.props.expanded ? '' : 'collapsed';

      var i = this.props.ship;
      var subName = REF.ship.sub[i];
      var imagePath = IMAGES.shipSub[i];

      return React.createElement(
        'div',
        { id: 'ship-sub', className: className },
        React.createElement(
          'span',
          { id: 'ship-sub-label' },
          'SUB'
        ),
        React.createElement(
          'div',
          { id: 'ship-sub-image' },
          React.createElement('div', { id: 'ship-sub-image-background' }),
          React.createElement('img', { src: imagePath, alt: subName + ' ship sub image', id: 'ship-sub-image-mask' })
        ),
        React.createElement(
          'span',
          { id: 'ship-sub-title' },
          subName
        )
      );
    }
  }]);

  return ShipSub;
}(React.Component);

var ActionButton = function (_React$Component15) {
  _inherits(ActionButton, _React$Component15);

  function ActionButton() {
    _classCallCheck(this, ActionButton);

    return _possibleConstructorReturn(this, (ActionButton.__proto__ || Object.getPrototypeOf(ActionButton)).apply(this, arguments));
  }

  _createClass(ActionButton, [{
    key: 'render',
    value: function render() {
      var buttonTitle = ['CONNECT', 'START', 'waiting...', 'LOBBY FULL'][this.props.userEngagementPhase];
      var className = this.props.userEngagementPhase === 3 ? 'disabled' : '';
      return React.createElement(
        'button',
        { className: className },
        buttonTitle
      );
    }
  }]);

  return ActionButton;
}(React.Component);

var LobbyUsers = function (_React$Component16) {
  _inherits(LobbyUsers, _React$Component16);

  function LobbyUsers() {
    _classCallCheck(this, LobbyUsers);

    return _possibleConstructorReturn(this, (LobbyUsers.__proto__ || Object.getPrototypeOf(LobbyUsers)).apply(this, arguments));
  }

  _createClass(LobbyUsers, [{
    key: 'render',
    value: function render() {
      var players = this.props.users.players;
      var spectators = this.props.users.spectators;
      var limit = this.props.playerLimit;

      return React.createElement(
        'div',
        { id: 'lobby-users' },
        React.createElement(PlayersTable, { users: players, limit: limit }),
        React.createElement(SpectatorsTable, { users: spectators })
      );
    }
  }]);

  return LobbyUsers;
}(React.Component);

var PlayersTable = function (_React$Component17) {
  _inherits(PlayersTable, _React$Component17);

  function PlayersTable() {
    _classCallCheck(this, PlayersTable);

    return _possibleConstructorReturn(this, (PlayersTable.__proto__ || Object.getPrototypeOf(PlayersTable)).apply(this, arguments));
  }

  _createClass(PlayersTable, [{
    key: 'render',
    value: function render() {

      var rows = [];
      var index = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.props.users[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _ref = _step2.value;

          var _ref2 = _slicedToArray(_ref, 4);

          var name = _ref2[0];
          var rank = _ref2[1];
          var team = _ref2[2];
          var ready = _ref2[3];


          ready = ready ? '✓' : '';
          var sign = rank % 100 <= 30 ? '-' : rank % 100 >= 70 ? '+' : '';
          rank = '' + (User.calculateRankLetter(rank) + sign);
          team = team || 'SOLO';
          rows.push(React.createElement(
            'tr',
            { key: name + rank },
            React.createElement(
              'td',
              null,
              ++index + '.'
            ),
            React.createElement(
              'td',
              null,
              ready
            ),
            React.createElement(
              'td',
              null,
              name
            ),
            React.createElement(
              'td',
              null,
              rank
            ),
            React.createElement(
              'td',
              null,
              team
            )
          ));
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

      for (var i = 0; i < this.props.limit - this.props.users.length; i++) {
        rows.push(React.createElement(
          'tr',
          { key: ++index, className: 'empty-row' },
          React.createElement('td', null),
          React.createElement('td', null),
          React.createElement(
            'td',
            null,
            'empty'
          ),
          React.createElement('td', null),
          React.createElement('td', null)
        ));
      }

      return React.createElement(
        'table',
        { id: 'players-table', className: 'users-table' },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            null,
            React.createElement('th', null),
            React.createElement('th', null),
            React.createElement(
              'th',
              null,
              'PLAYERS'
            ),
            React.createElement(
              'th',
              null,
              'RANK'
            ),
            React.createElement(
              'th',
              null,
              'TEAM'
            )
          )
        ),
        React.createElement(
          'tbody',
          null,
          rows
        )
      );
    }
  }]);

  return PlayersTable;
}(React.Component);

var SpectatorsTable = function (_React$Component18) {
  _inherits(SpectatorsTable, _React$Component18);

  function SpectatorsTable() {
    _classCallCheck(this, SpectatorsTable);

    return _possibleConstructorReturn(this, (SpectatorsTable.__proto__ || Object.getPrototypeOf(SpectatorsTable)).apply(this, arguments));
  }

  _createClass(SpectatorsTable, [{
    key: 'render',
    value: function render() {

      var rows = [];
      var index = 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.props.users[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var name = _step3.value;

          index++;
          rows.push(React.createElement(
            'tr',
            { key: name + index },
            React.createElement(
              'td',
              null,
              name
            )
          ));
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

      return React.createElement(
        'table',
        { id: 'spectators-table', className: 'users-table' },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            null,
            React.createElement(
              'th',
              null,
              'SPECTATING (',
              index,
              ')'
            )
          )
        ),
        React.createElement(
          'tbody',
          null,
          rows
        )
      );
    }
  }]);

  return SpectatorsTable;
}(React.Component);

/*class ProductCategoryRow extends React.Component {
  render() {
    return <tr><th colSpan="2">{this.props.category}</th></tr>;
  }
}

class ProductRow extends React.Component {
  render() {
    var name = this.props.product.stocked ?
      this.props.product.name :
      <span style={{color: 'red'}}>
        {this.props.product.name}
      </span>;
    return (
      <tr>
        <td>{name}</td>
        <td>{this.props.product.price}</td>
      </tr>
    );
  }
}

class ProductTable extends React.Component {
  render() {
    var rows = [];
    var lastCategory = null;
    this.props.products.forEach(function(product) {
      if (product.category !== lastCategory) {
        rows.push(<ProductCategoryRow category={product.category} key={product.category} />);
      }
      rows.push(<ProductRow product={product} key={product.name} />);
      lastCategory = product.category;
    });
    return (
      <table>
        <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
        </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }
}

class SearchBar extends React.Component {
  render() {
    return (
      <form>
        <input type="text" placeholder="Search..." />
        <p>
          <input type="checkbox" />
          {' '}
          Only show products in stock
        </p>
      </form>
    );
  }
}

class FilterableProductTable extends React.Component {
  render() {
    return (
      <div>
        <SearchBar />
        <ProductTable products={this.props.products} />
      </div>
    );
  }
}*/

// var PRODUCTS = [
//   {category: 'Sporting Goods', price: '$49.99', stocked: true, name: 'Football'},
//   {category: 'Sporting Goods', price: '$9.99', stocked: true, name: 'Baseball'},
//   {category: 'Sporting Goods', price: '$29.99', stocked: false, name: 'Basketball'},
//   {category: 'Electronics', price: '$99.99', stocked: true, name: 'iPod Touch'},
//   {category: 'Electronics', price: '$399.99', stocked: false, name: 'iPhone 5'},
//   {category: 'Electronics', price: '$199.99', stocked: true, name: 'Nexus 7'}
// ];

var INFO = {
  type: 1,
  code: 'Hkd3M-',
  password: null,
  game_settings: {
    map: 2,
    mode: 0,
    stock: 3,
    player_capacity: 6
  },
  users: {
    players: [
    // {name, rank, team, ready, ship, slots []}

    ['Billy', 302, 1, true, 2], ['twenty-one p', 380, 1, false, 1], ['user1902', 340, 0, true, 1]],
    spectators: ['markees', 'facemace']
  }
};

var LOBBY_OPTIONS = {
  map: ['MAP', 'alpha map', 'beta map', 'gamma map'],
  mode: ['GAME MODE', 'Capture the Flag', 'Territorial', 'Survival'],
  player_capacity: ['MAX PLAYERS', '2', '3', '4', '5', '6', '7', '8'],
  stock: ['STOCK', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
};

var REF = {
  lobby: {
    type: ['public', 'private', 'practice'],
    typeDesc: ['This is a public lobby. Players present have complete control over game settings', 'This is a private lobby. Players present have complete control over game settings', 'This is a practice lobby. Players present have complete control over game settings']
  },

  ship: {
    type: ['standard', 'rate', 'speed', 'defense', 'damage'],
    typeDesc: ['a tune with the world and itself, this is the balanced ship', 'this ship produces a stream of light bullets to trap and confuse', 'run your way out of any situation with the speed ship', 'take more than just a hit with the defense ship', 'this ship is feared across the reach of space, use it wisely'],
    sub: ['attractor', 'heat seeker', 'repulsors', 'stealth', 'block bomb'],
    stats: [['HEALTH', '0.6', '0.6', '0.2', '1.0', '0.7'], ['SPEED', '0.6', '0.6', '0.9', '0.4', '0.4'], ['ATTACK', '0.5', '0.4', '0.3', '0.5', '1.0'], ['RANGE', '0.5', '0.5', '0.3', '0.7', '0.4']]

  }

};

var IMAGES = {
  ship: ['images/menu-ship-standard.png', 'images/menu-ship-rate.png', 'images/menu-ship-speed.png', 'images/menu-ship-defense.png', 'images/menu-ship-damage.png'],
  shipSub: ['images/menu-ship-sub-standard.png', 'images/menu-ship-sub-rate.png', 'images/menu-ship-sub-speed.png', 'images/menu-ship-sub-defense.png', 'images/menu-ship-sub-damage.png']
};

// ReactDOM.render(
//   <DSGameLobby data={INFO} />,
//   document.getElementById('container')
// );
//# sourceMappingURL=view.js.map