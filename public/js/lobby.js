
let LOBBY = {

  coundownTime: 3,

  setupLink() {
    $('#lobbylink').val(location.href);
  },

  focusOnInput() {
    $('#name-input').focus();
  },

  startCountdown(callback) { log(`starting countdown...`);
    this.showLayer('#countdown_layer');

    var countdown = (n = this.coundownTime) => {
      $('#countdown').text(n>0 ? n : 'GO');
      if(n-- >= 0) setTimeout(()=>{countdown(n)}, 1000);
    };

    countdown();
    setTimeout(()=>{this.revealGame(callback)}, this.coundownTime*1000);
  },

  revealGame(callback) {
    this.hideLayer('#menu_layer');
    if(callback) callback();
    setTimeout(()=>{ this.hideLayer('#countdown_layer'); }, 600);
  },

  hideLayer(css_selector) {
    $(css_selector).css('opacity', '0');
    setTimeout(()=>{
      $(css_selector).css('display', 'none');
    }, 1000);
  },
  showLayer(css_selector) {
    $(css_selector).css('display', 'initial');
    setTimeout(()=>{
      $(css_selector).css('opacity', '1');
    }, 10);
  },

  disconnect(msg = `A network error occured`) {
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
  hideGame() {

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
  showResults(results) {


    // load results into HTML
    var game = ENV.game;
    RESULTS.load(results);


    // unveil results
    //  stage 1 - show results underneath
    setTimeout(()=>{this.showLayer('#results_layer');}, TIME.sec(0.5));
    //  stage 2 - remove overlay to reveal results
    setTimeout(()=>{
      game.endSimulation();
      this.hideLayer('#countdown_layer');
    }, TIME.sec(1));
    //  stage 3 - unblur the game layer (after, since it can be expensive) -- cross that (currently disabled for performance)
    // setTimeout(()=>{$('#game_layer').css('filter', 'blur(0px)');}, TIME.sec(2));


    // perform extra tasks for ranked lobbies
    if(ENV.lobby.info.type == 0 && !ENV.spectate) {

      const old_rank = ENV.user.simple_rank || 0;
      const old_money = ENV.user.simple_money || 0;
      ENV.user.updateStatsAjax();

      ENV.storage.ongoing = false;

      (()=>{this.updateStatsChanges(old_rank, ENV.user.simple_rank, old_money, ENV.user.simple_money)}).wait(TIME.sec(5))

    }


    setTimeout(()=>{this.revealLobby();}, TIME.sec(8));
  },

  revealLobby() {
    // PARTICLES.start();
    this.showLayer('#menu_layer');
    setTimeout(()=>{this.hideLayer('#results_layer');}, TIME.sec(1));
  },

  updateStatsChanges(old_rank, new_rank, old_money, new_money) {
    console.log(`RANK OLD ${old_rank}`, `NEW ${new_rank}`);
    console.log(`MONEY OLD ${old_money}`, `NEW ${new_money}`);
    $('#re_rank_group_value').text(`${User.calculateRankLetter(old_rank)} - ${User.calculateRankNumber(old_rank)}`);
    $('#re_money_group_value').text(`$ ${old_money}`);
    this.showLayer('#results_effect_layer');

    const deltaRank = new_rank - old_rank;
    const deltaMoney = new_money - old_money;

    setTimeout(() => {
      setAnimationTimeout((dt, elapsed, timeout) => {

        const percent = elapsed / timeout;
        const rank = Math.round(parseInt(old_rank) + (deltaRank * percent));
        const money = Math.round(parseInt(old_money) + (deltaMoney * percent));
        $('#re_rank_group_value').text(`${User.calculateRankLetter(rank)} - ${User.calculateRankNumber(rank)}`);
        $('#re_money_group_value').text(`$ ${money}`);

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
    (()=>{
      this.hideLayer('#results_effect_layer');
      if(DeepSpaceGame.runningInstance) DeepSpaceGame.runningInstance.deinit();
    }).wait(TIME.sec(3.5))
  },


  disableInput() {
    $('input').attr('disabled')
    $('select').attr('disabled')
  },

  enableInput() {
    $('input').removeAttr('disabled')
    $('select').removeAttr('disabled')
  },

  lobbyStatus(m) {
    $('#lobby-status').text(m)
  },

  showHelpButton() {
    $('#help_icon').removeAttr('hidden')
  },
  hideHelpButton() {
    $('#help_icon').attr('hidden')
  },

  setClock(interval) {
    // interval -= TIME.sec(10);

    if(interval < 0) interval = 0;

    let seconds = Math.round(interval/1000),
      minutes = Math.floor(seconds/60),
      remaining_seconds = seconds % 60;
    if(remaining_seconds < 10) remaining_seconds = "0" + remaining_seconds;
    let str = `${minutes}:${remaining_seconds}`;

    LOBBY.writeClock(str);
  },

  writeClock(str) {
    $('#clock').text(str);
  },

  refreshClock() {
    ENV.game.game.overtime ? LOBBY.writeClock('OVERTIME') : LOBBY.setClock(ENV.game.timer.timeLeft);
    // LOBBY.setClock(ENV.game.timer.timeLeft);
    if(!ENV.game.game.disabled) setTimeout(()=>{ LOBBY.refreshClock() }, 1000);
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
