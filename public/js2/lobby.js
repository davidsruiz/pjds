'use strict';

var LOBBY = {

  coundownTime: 3,

  setupLink: function setupLink() {
    $('#lobbylink').val(location.href);
  },
  focusOnInput: function focusOnInput() {
    $('#name-input').focus();
  },
  startCountdown: function startCountdown(callback) {
    var _this = this;

    log('starting countdown...');
    this.showLayer('#countdown_layer');

    var countdown = function countdown() {
      var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this.coundownTime;

      $('#countdown').text(n > 0 ? n : 'GO');
      if (n-- >= 0) setTimeout(function () {
        countdown(n);
      }, 1000);
    };

    countdown();
    setTimeout(function () {
      _this.revealGame(callback);
    }, this.coundownTime * 1000);
  },
  revealGame: function revealGame(callback) {
    var _this2 = this;

    this.hideLayer('#menu_layer');
    if (callback) callback();
    setTimeout(function () {
      _this2.hideLayer('#countdown_layer');
    }, 600);
  },
  hideLayer: function hideLayer(css_selector) {
    $(css_selector).css('opacity', '0');
    setTimeout(function () {
      $(css_selector).css('display', 'none');
    }, 1000);
  },
  showLayer: function showLayer(css_selector) {
    $(css_selector).css('display', 'initial');
    setTimeout(function () {
      $(css_selector).css('opacity', '1');
    }, 10);
  },
  disconnect: function disconnect() {
    var msg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'A network error occured';

    socket.disconnect();
    ENV.storage.ongoing = false;
    alert(msg);
    location.reset();
  },


  /*
   *  LOBBY.disableGame: stops interaction with the game and partially hides it from view. Serves as an interlude while waiting
   *  for any last server operations. Usually seceded by LOBBY.showResults
   *  part 1 of 2 in closing a match
   */
  hideGame: function hideGame() {

    // fades in the overlay
    $('#countdown').text('FINISH');
    this.showLayer('#countdown_layer');
    // $('#game_layer').css('filter', 'blur(4px)');

    // // hides unnecessary game UI
    // LOBBY.hideHelpButton();
    //
    // // stops game interaction
    // ENV.game.disableInteraction();
  },


  /*
   *  LOBBY.showResults: upon server command, gets the game results (team scores, kills, and user rank change) prepared,
   *  displayed and eventually removed
   *  part 2 of 2 in closing a match
   */
  showResults: function showResults(results) {
    var _this3 = this;

    // load results into HTML
    var game = ENV.game;
    RESULTS.load(results);

    // unveil results
    //  stage 1 - show results underneath
    setTimeout(function () {
      _this3.showLayer('#results_layer');
    }, TIME.sec(0.5));
    //  stage 2 - remove overlay to reveal results
    setTimeout(function () {
      game.endSimulation();
      _this3.hideLayer('#countdown_layer');
    }, TIME.sec(1));
    //  stage 3 - unblur the game layer (after, since it can be expensive) -- cross that (currently disabled for performance)
    // setTimeout(()=>{$('#game_layer').css('filter', 'blur(0px)');}, TIME.sec(2));


    // perform extra tasks for ranked lobbies
    if (ENV.lobby.info.type == 0 && !ENV.spectate) {

      var old_rank = ENV.user.simple_rank || 0;
      var old_money = ENV.user.simple_money || 0;
      ENV.user.updateStatsAjax();

      ENV.storage.ongoing = false;

      (function () {
        _this3.updateStatsChanges(old_rank, ENV.user.simple_rank, old_money, ENV.user.simple_money);
      }).wait(TIME.sec(5));
    }

    setTimeout(function () {
      if (ENV.lobby.newLobbyID) {
        ENV.lobby.changeLobby();
      } else {
        _this3.revealLobby();
      }
    }, TIME.sec(8));
  },
  revealLobby: function revealLobby() {
    var _this4 = this;

    // PARTICLES.start();
    this.showLayer('#menu_layer');
    setTimeout(function () {
      _this4.hideLayer('#results_layer');
    }, TIME.sec(1));
  },
  updateStatsChanges: function updateStatsChanges(old_rank, new_rank, old_money, new_money) {
    var _this5 = this;

    console.log('RANK OLD ' + old_rank, 'NEW ' + new_rank);
    console.log('MONEY OLD ' + old_money, 'NEW ' + new_money);
    $('#re_rank_group_value').text(User.calculateRankLetter(old_rank) + ' - ' + User.calculateRankNumber(old_rank));
    $('#re_money_group_value').text('$ ' + old_money);
    this.showLayer('#results_effect_layer');

    var deltaRank = new_rank - old_rank;
    var deltaMoney = new_money - old_money;

    setTimeout(function () {
      setAnimationTimeout(function (dt, elapsed, timeout) {

        var percent = elapsed / timeout;
        var rank = Math.round(parseInt(old_rank) + deltaRank * percent);
        var money = Math.round(parseInt(old_money) + deltaMoney * percent);
        $('#re_rank_group_value').text(User.calculateRankLetter(rank) + ' - ' + User.calculateRankNumber(rank));
        $('#re_money_group_value').text('$ ' + money);
      }, 1);
    }, TIME.sec(1));

    // (()=>{
    //   var ms_delay = 20,
    //       animate_length = 1000,
    //       frame_count = animate_length / ms_delay,
    //       rank_delta = new_rank - old_rank;
    //
    //   frame_count.times(i => {
    //     var progress = (++i) / frame_count,
    //         current_rank = Math.round(parseInt(old_rank) + (rank_delta*progress)),
    //         wait_time = ms_delay*i;
    //     (()=>{$('#re_rank_group_value').text(`${User.calculateRankLetter(old_rank)} - ${User.calculateRankNumber(current_rank)}`);}).wait(wait_time);
    //   })
    // }).wait(1000);


    // $('#countdown').text('FINISH');
    // this.showLayer('#countdown_layer');
    (function () {
      _this5.hideLayer('#results_effect_layer');
      if (DeepSpaceGame.runningInstance) DeepSpaceGame.runningInstance.deinit();
    }).wait(TIME.sec(3.5));
  },
  disableInput: function disableInput() {
    $('input').attr('disabled');
    $('select').attr('disabled');
  },
  enableInput: function enableInput() {
    $('input').removeAttr('disabled');
    $('select').removeAttr('disabled');
  },
  lobbyStatus: function lobbyStatus(m) {
    $('#lobby-status').text(m);
  },
  showHelpButton: function showHelpButton() {
    $('#help_icon').removeAttr('hidden');
  },
  hideHelpButton: function hideHelpButton() {
    $('#help_icon').attr('hidden');
  },
  setClock: function setClock(interval) {
    // interval -= TIME.sec(10);

    if (interval < 0) interval = 0;

    var seconds = Math.round(interval / 1000),
        minutes = Math.floor(seconds / 60),
        remaining_seconds = seconds % 60;
    if (remaining_seconds < 10) remaining_seconds = "0" + remaining_seconds;
    var str = minutes + ':' + remaining_seconds;

    LOBBY.writeClock(str);
  },
  writeClock: function writeClock(str) {
    $('#clock').text(str);
  },
  refreshClock: function refreshClock() {
    return;
    ENV.game.game.overtime ? LOBBY.writeClock('OVERTIME') : LOBBY.setClock(ENV.game.timer.timeLeft);
    // LOBBY.setClock(ENV.game.timer.timeLeft);
    if (!ENV.game.game.disabled) setTimeout(function () {
      LOBBY.refreshClock();
    }, 1000);
  }
};

ENV.lobby = {
  code: null,
  password: null,
  game_settings: {
    map: null,
    player_capacity: null,
    mode: null,
    stock: null
  },
  players: [
    // {name, rank, team, ready, ship, slots []}
  ],
  spectators: [
    // {name}
  ]
};
//# sourceMappingURL=lobby.js.map