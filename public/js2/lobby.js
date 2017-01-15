
var LOBBY = {

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
      $('#countdown').text(n--);
      if(n >= 0) setTimeout(()=>{countdown(n)}, 1000);
    };

    countdown();
    setTimeout(()=>{this.revealGame(callback)}, this.coundownTime*1000);
  },

  revealGame(callback) {
    this.hideLayer('#countdown_layer');
    this.hideLayer('#menu_layer');
    if(callback) callback();
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
   *  LOBBY.endGame: stops interaction with the game and partially hides it from view. Serves as an interlude while waiting
   *  for any last server operations. Usually seceded by LOBBY.showResults
   *  part 1 of 2 in closing a match
   */
  endGame() {

    // fades in the overlay
    $('#countdown').text('FINISH');
    this.showLayer('#countdown_layer');
    $('#game_layer').css('filter', 'blur(4px)');

    // hides unnecessary game UI
    LOBBY.hideHelpButton();

    // stops game interaction
    ENV.game.disableInteraction();

  },

  /*
   *  LOBBY.showResults: upon server command, gets the game results (team scores, kills, and user rank change) prepared,
   *  displayed and eventually removed
   *  part 2 of 2 in closing a match
   */
  showResults() {


    // load results into HTML
    var game = ENV.game;
    RESULTS.load([g.game, g.teams]);


    // unveil results
    //  stage 1 - show results underneath
    setTimeout(()=>{this.showLayer('#results_layer');}, TIME.sec(0.5));
    //  stage 2 - remove overlay to reveal results
    setTimeout(()=>{
      game.endSimulation();
      this.hideLayer('#countdown_layer');
    }, TIME.sec(1));
    //  stage 3 - unblur the game layer (after, since it can be expensive)
    setTimeout(()=>{$('#game_layer').css('filter', 'blur(0px)');}, TIME.sec(2));


    // perform extra tasks for ranked lobbies
    if(ENV.lobby.type == 'public' && !ENV.spectate) {
      var old_rank = ENV.user.simple_rank;
      ENV.user.updateRank();
      ENV.storage.ongoing = false;
      (()=>{this.animateRankChange(old_rank, ENV.user.simple_rank)}).wait(TIME.sec(5))
    }


    setTimeout(()=>{this.revealLobby();}, TIME.sec(8));
  },

  revealLobby() {
    PARTICLES.start();
    this.showLayer('#menu_layer');
    setTimeout(()=>{this.hideLayer('#results_layer');}, TIME.sec(1));
  },

  animateRankChange(old_rank = 0, new_rank) {console.log(`OLD ${old_rank}`, `NEW ${new_rank}`)
    $('#countdown').text(`RANK  -  ${ENV.user.calculateRankString(old_rank)}`);
    this.showLayer('#countdown_layer');

    (()=>{
      var ms_delay = 20,
          animate_length = 1000,
          frame_count = animate_length / ms_delay,
          rank_delta = new_rank - old_rank;

      frame_count.times(i => {
        var progress = (++i) / frame_count,
            current_rank = Math.round(parseInt(old_rank) + (rank_delta*progress)),
            wait_time = ms_delay*i;
        (()=>{$('#countdown').text(`RANK  -  ${ENV.user.calculateRankString(current_rank)}`);}).wait(wait_time);
      })
    }).wait(1000);


    // $('#countdown').text('FINISH');
    // this.showLayer('#countdown_layer');
    (()=>{
      this.hideLayer('#countdown_layer');
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
    let seconds = Math.round(interval/1000),
        minutes = Math.floor(seconds/60),
        remaining_seconds = seconds % 60;
    if(remaining_seconds < 10) remaining_seconds = "0" + remaining_seconds;
    $('#clock').text(`${minutes}:${remaining_seconds}`);
  },

  refreshClock() {
    LOBBY.setClock(ENV.game.timer.timeLeft);
    if(!ENV.game.game.disabled) setTimeout(()=>{ LOBBY.refreshClock() }, 1000);
  }


};
