'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var User = function () {
  function User() {
    _classCallCheck(this, User);

    this.id = ENV.storage.id;
    this.name = ENV.storage.user_name;
    this.rank = ENV.storage.rank;
    this.money = ENV.storage.money;

    this.simple_rank = ENV.storage.simple_rank; // this is a number from 0 to 599
    this.simple_money = ENV.storage.simple_money;

    this.stats = {};
    this.stats.wins = ENV.storage.wins;
    this.stats.losses = ENV.storage.losses;
    this.stats.kills = ENV.storage.kills;
    this.stats.deaths = ENV.storage.deaths;

    var simpleRankIsInvalid = !(this.simple_rank >= 0);

    if (this.id && simpleRankIsInvalid) {
      // if id and invalid rank, reset
      this.resetRank();
    } else {
      this.refreshUserMiniView();
    }

    this.watch('id', this.idChangeHandler);
    this.watch('name', this.nameChangeHandler);
    this.watch('rank', this.propChangeHandler);
    this.watch('simple_rank', this.propChangeHandler);
    this.watch('money', this.propChangeHandler);
    this.watch('simple_money', this.propChangeHandler);

    this.stats.watch('wins', this.propChangeHandler);
    this.stats.watch('losses', this.propChangeHandler);
    this.stats.watch('kills', this.propChangeHandler);
    this.stats.watch('deaths', this.propChangeHandler);

    this.validateStats();

    // promises
    // this.get_id = () => {
    //   return new Promise((resolve, reject) => {
    //     if (this.id) {
    //       resolve(this.id);
    //     } else {
    //       $.ajax({
    //         url: '/id',
    //         type: 'POST'
    //       })
    //         .done(resolve);
    //     }
    //   });
    //
    // }
    // this.get_name = () => {
    //   return new Promise((resolve, reject) => {
    //     let name = this.name,
    //         validation = name => {
    //           // only alphanumeric and whitespace characters
    //           if(!(/^(\w|\s)+$/.test(name))) return false;
    //
    //           // no profanity
    //           if(swearjar.profane(name)) return false;
    //
    //           return true;
    //         }
    //
    //     while(!name || (name.trim()==="") || !validation(name)) {
    //       name = window.prompt('please enter a display name');
    //     }
    //
    //     this.name = name.trim();
    //     resolve(name);
    //   })
    // }

    // this.get_rank =

    this.listeners = new Map();
  }

  _createClass(User, [{
    key: 'refreshUserMiniView',
    value: function refreshUserMiniView() {
      this.refreshUserNameMiniView();
      this.refreshUserRankMiniView();
      this.refreshUserMoneyMiniView();
    }
  }, {
    key: 'refreshUserNameMiniView',
    value: function refreshUserNameMiniView() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.name;

      if (!userViewsAreAvailable()) return;

      var no_name_small = 'g';
      var no_name_large = 'guest';
      var node_small = document.querySelector('#umi_name_letter');
      var node_large = document.querySelector('#umi_name_full');
      var name_small = name ? name[0] : no_name_small;
      if (node_small && node_large) {
        node_small.textContent = name_small;
        node_large.textContent = name || no_name_large;
      }
    }
  }, {
    key: 'refreshUserRankMiniView',
    value: function refreshUserRankMiniView() {
      if (!userViewsAreAvailable()) return;

      var box_node = document.querySelector('#user_mini_info');
      var rank_node = box_node.querySelector('#umi_stats_rank');
      if (this.name && this.simple_rank >= 0) {
        rank_node.textContent = this.rank_letter + ' ' + this.rank_number;
        box_node.removeAttribute('limited');
      } else {
        box_node.setAttribute('limited', '');
      }
    }
  }, {
    key: 'refreshUserMoneyMiniView',
    value: function refreshUserMoneyMiniView() {
      if (!userViewsAreAvailable()) return;

      var box_node = document.querySelector('#user_mini_info');
      var money_node = box_node.querySelector('#umi_stats_currency');
      if (this.name && this.simple_rank >= 0 && this.simple_money >= 0) {
        money_node.textContent = this.simple_money;
        box_node.removeAttribute('limited');
      } else {
        box_node.setAttribute('limited', '');
      }
    }
  }, {
    key: 'refreshUserViews',
    value: function refreshUserViews() {
      this.refreshUserMiniView();
      this.refreshUserLayer();
    }
  }, {
    key: 'refreshUserLayer',
    value: function refreshUserLayer() {
      if (!userViewsAreAvailable()) return;
      if (ENV.UA) ENV.UA.refreshUI();
    }
  }, {
    key: 'idChangeHandler',
    value: function idChangeHandler(prop, old_value, new_value) {
      ENV.storage.id = new_value;
      if (old_value != new_value) this.resetRank.wait(10);
      return new_value;
    }
  }, {
    key: 'nameChangeHandler',
    value: function nameChangeHandler(prop, old_value, new_value) {
      ENV.storage.user_name = new_value;
      this.refreshUserNameMiniView(new_value);
      return new_value;
    }
  }, {
    key: 'propChangeHandler',
    value: function propChangeHandler(prop, old_value, new_value) {
      ENV.storage[prop] = new_value;
      return new_value;
    }
  }, {
    key: 'resetRank',
    value: function resetRank() {
      var _this = this;

      var resolveCallback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
      var rejectCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

      $.ajax({
        url: '/rank',
        type: 'POST',
        data: JSON.stringify({ id: this.id }),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json'
      }).done(function (data) {
        var simple = data.simple,
            encoded = data.encoded;

        _this.simple_rank = simple;
        _this.rank = encoded;

        resolveCallback(simple);
        // this.refreshUserRankMiniView();
      }).fail(function () {
        rejectCallback();
      });
    }
  }, {
    key: 'updateRank',
    value: function updateRank() {
      var _this2 = this;

      $.ajax({
        url: '/update_rank',
        type: 'POST',
        data: JSON.stringify({ rank: this.rank, id: this.id }),
        // data: JSON.stringify({ history: pp }),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json'
      }).done(function (data) {
        var simple = data.simple,
            encoded = data.encoded;

        _this2.simple_rank = simple;
        _this2.rank = encoded;

        _this2.refreshUserRankMiniView();
      });
    }
  }, {
    key: 'updateStatsAjax',
    value: function updateStatsAjax() {
      var _this3 = this;

      $.ajax({
        url: '/update_stats',
        type: 'POST',
        data: JSON.stringify([this.id, this.rank, this.money]),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json'
      }).done(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 4),
            rank = _ref2[0],
            money = _ref2[1],
            simple_rank = _ref2[2],
            simple_money = _ref2[3];

        _this3.rank = rank;
        _this3.money = money;
        _this3.simple_rank = simple_rank;
        _this3.simple_money = simple_money;

        _this3.execListeners('serverUpdate', { rank: rank, money: money, simple_rank: simple_rank, simple_money: simple_money });

        _this3.refreshUserViews();
      });
    }
  }, {
    key: 'validateStats',
    value: function validateStats() {
      if (!(this.stats.wins >= 0)) this.stats.wins = 0;
      if (!(this.stats.losses >= 0)) this.stats.losses = 0;
      if (!(this.stats.kills >= 0)) this.stats.kills = 0;
      if (!(this.stats.deaths >= 0)) this.stats.deaths = 0;
    }
  }, {
    key: 'resetStats',
    value: function resetStats() {
      this.stats.wins = 0;
      this.stats.losses = 0;
      this.stats.kills = 0;
      this.stats.deaths = 0;
    }

    // Listeners

  }, {
    key: 'addListener',
    value: function addListener(key, handler) {

      if (typeof handler !== 'function') return false;

      var listenerList = this.listeners.get(key) || [];
      listenerList.push(handler);
      this.listeners.set(key, listenerList);

      return true; // success
    }
  }, {
    key: 'execListeners',
    value: function execListeners(key, info) {
      var listenerList = this.listeners.get(key) || [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = listenerList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var listener = _step.value;

          listener(info);
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
    key: 'removeListener',
    value: function removeListener(key, handler) {
      var listenerList = this.listeners.get(key) || [];
      var indexOf = listenerList.indexOf(handler);
      if (indexOf === -1) return false; // failure
      listenerList.splice(indexOf, 1);
      return true; // success
    }
  }, {
    key: 'get_rank',
    get: function get() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        if (_this4.simple_rank >= 0) {
          resolve(_this4.simple_rank);
        } else {
          _this4.resetRank(resolve, reject);
        }
      });
    }
  }, {
    key: 'rank_letter',
    get: function get() {
      return User.calculateRankLetter(this.simple_rank);
    }
  }, {
    key: 'rank_number',
    get: function get() {
      return User.calculateRankNumber(this.simple_rank);
    }
  }], [{
    key: 'calculateRankLetter',
    value: function calculateRankLetter(simple_rank) {
      return ['E', 'D', 'C', 'B', 'A', 'M'][parseInt(simple_rank / 100)];
    }
  }, {
    key: 'calculateRankNumber',
    value: function calculateRankNumber(simple_rank) {
      return simple_rank % 100;
    }
  }, {
    key: 'calculateRankString',
    value: function calculateRankString(simple_rank) {
      return User.calculateRankLetter(simple_rank) + ' ' + User.calculateRankNumber(simple_rank);
    }
  }]);

  return User;
}();

var UserAdapter = function () {
  function UserAdapter(root) {
    _classCallCheck(this, UserAdapter);

    this._root = root;
  }

  _createClass(UserAdapter, [{
    key: 'getName',
    value: function getName() {
      var name = void 0,
          default_name = 'user' + String(Math.randomIntMinMax(10, 10000)).padding(4, '0'),
          attempts = 0,
          validation = function validation(name) {
        // only alphanumeric and whitespace characters
        if (!/^(\w|\s)+$/.test(name)) return false;

        // no profanity
        if (swearjar.profane(name)) return false;

        return true;
      };

      while (!name || name.trim() === "" || !validation(name)) {
        if (++attempts > 3) {
          name = default_name;
        } else {
          name = window.prompt('please enter a display name' + (attempts - 1 ? ' (letters and numbers only please)' : ''), this._root.name || '');
        }
      }

      name = name.trim().substring(0, 10);

      this._root.name = name;
      this.refreshUI();

      return name;
    }
  }, {
    key: 'refreshUI',
    value: function refreshUI() {
      // mini user info
      // mini user info end

      // user info content
      var name_set = !!ENV.user.name;
      var user_set = name_set && !!ENV.user.rank;

      //name
      $('#uic_title').val(ENV.user.name || '_name_');
      // edit button
      $('#uic_title_edit').text(name_set ? 'change' : 'set');

      if (user_set) {

        var friends = ENV.friends ? ENV.friends.friends.size : 0;
        var wins = ENV.user.stats.wins || 0;
        var losses = ENV.user.stats.losses || 0;
        var kills = ENV.user.stats.kills || 0;
        var deaths = ENV.user.stats.deaths || 0;
        var winRate = (wins / losses || 0).round(1);
        if (winRate > 10) winRate = '10+';

        $('#uic_money_cell').text(ENV.user.simple_money);
        $('#uic_rank_cell').text(ENV.user.rank_letter + ' - ' + ENV.user.rank_number);
        $('#uic_win_cell').text(winRate);
        $('#uic_friends_cell').text(friends);

        $('#uic_wins_row').text(wins);
        $('#uic_losses_row').text(losses);
        $('#uic_kills_row').text(kills);
        $('#uic_deaths_row').text(deaths);

        $('#uic_reset_button').removeAttr('disabled');
      } else {
        $('#uic_money_cell').text('-');
        $('#uic_rank_cell').text('-');
        $('#uic_win_cell').text('-');
        $('#uic_friends_cell').text('-');

        $('#uic_wins_row').text('-');
        $('#uic_losses_row').text('-');
        $('#uic_kills_row').text('-');
        $('#uic_deaths_row').text('-');

        $('#uic_reset_button').attr('disabled', 'true');
      }
    }
  }]);

  return UserAdapter;
}();

var userViewsAreAvailable = function userViewsAreAvailable() {
  return document.querySelector('#user_mini_info');
};

$(function () {

  ENV.user = new User();
  if (ENV.storage.ongoing == 'true') {
    ENV.user.updateStatsAjax();ENV.storage.ongoing = 'false';
  }

  if (userViewsAreAvailable()) {
    // revise ... make user always accessible with its view components optional

    ENV.UA = new UserAdapter(ENV.user);
    $('#uic_title_edit').click(function (jqEvent) {
      ENV.UA.getName();
    });
    $('#uic_reset_button').click(function (jqEvent) {
      ENV.user.resetStats();ENV.UA.refreshUI();
    });
    ENV.UA.refreshUI();

    $('#user_mini_info').click(function (jqEvent) {
      ENV.UA.refreshUI();LOBBY.showLayer('#user_info_layer');
    });
    $('#user_info_background, #uic_close_button').click(function (jqEvent) {
      LOBBY.hideLayer('#user_info_layer');
    });
  }
});