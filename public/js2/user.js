'use strict';

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

    if (this.id && !(this.simple_rank >= 0)) {
      // if id and invalid rank, reset
      this.resetRank();
    } else {
      this.refreshUserView();
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
  }

  _createClass(User, [{
    key: 'refreshUserView',
    value: function refreshUserView() {
      this.refreshUserNameView();
      this.refreshUserRankView();
    }
  }, {
    key: 'refreshUserNameView',
    value: function refreshUserNameView() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.name;

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
    key: 'refreshUserRankView',
    value: function refreshUserRankView() {
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
      this.refreshUserNameView(new_value);
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

        _this.refreshUserRankView();
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

        _this2.refreshUserRankView();
      });
    }
  }, {
    key: 'validateStats',
    value: function validateStats() {
      if (!(this.stats.wins > 0)) this.stats.wins = 0;
      if (!(this.stats.losses > 0)) this.stats.losses = 0;
      if (!(this.stats.kills > 0)) this.stats.kills = 0;
      if (!(this.stats.deaths > 0)) this.stats.deaths = 0;
    }
  }, {
    key: 'resetStats',
    value: function resetStats() {
      this.stats.wins = 0;
      this.stats.losses = 0;
      this.stats.kills = 0;
      this.stats.deaths = 0;
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
      $('#uic_title').val(ENV.user.name || '- name -');
      // edit button
      $('#uic_title_edit').text(name_set ? 'change' : 'set');

      if (user_set) {
        $('#uic_money_cell').text('0');
        $('#uic_rank_cell').text(User.calculateRankLetter() + ' - ' + User.calculateRankNumber());
        $('#uic_win_cell').text('0');
        $('#uic_friends_cell').text('0');

        $('#uic_wins_row').text('0');
        $('#uic_losses_row').text('0');
        $('#uic_kills_row').text('0');
        $('#uic_deaths_row').text('0');
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

$(function () {
  ENV.user = new User();
  if (ENV.storage.ongoing == 'true') {
    ENV.user.updateRank();ENV.storage.ongoing = 'false';
  }

  $('#user_mini_info').click(function (jqEvent) {
    LOBBY.showLayer('#user_info_layer');
  });
  $('#user_info_background, #uic_close_button').click(function (jqEvent) {
    LOBBY.hideLayer('#user_info_layer');
  });

  var UA = new UserAdapter(ENV.user);
  $('#uic_title_edit').click(function (jqEvent) {
    UA.getName();
  });
  UA.refreshUI();
});
//# sourceMappingURL=user.js.map