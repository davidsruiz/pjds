
var LOBBY = {

  coundownTime: 3,

  setupLink() {
    $('#lobbylink').val(location.href);
  },

  focusOnInput() {
    $('#name-input').focus();
  },

  startCountdown(callback) { log(`starting countdown...`)
    this.showLayer('#countdown_layer');

    var countdown = (n = this.coundownTime) => {
      $('#countdown').text(n--);
      if(n >= 0) setTimeout(()=>{countdown(n)}, 1000);
    }

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

  showResults(game_data) {
    $('#countdown').text('FINISH');
    this.showLayer('#countdown_layer');
    $('#game_layer').css('filter', 'blur(4px)');

    RESULTS.load(game_data)
    setTimeout(()=>{this.showLayer('#results_layer');}, TIME.sec(3));
    setTimeout(()=>{this.hideLayer('#countdown_layer');}, TIME.sec(3.5));
    setTimeout(()=>{$('#game_layer').css('filter', 'blur(0px)');}, TIME.sec(5));

    LOBBY.hideHelpButton();

    if(ENV.lobby.type == 'public' && !ENV.spectate) {
      var old_rank = ENV.user.simple_rank;
      ENV.user.updateRank();
      ENV.storage.ongoing = false;
      (()=>{this.animateRankChange(old_rank, ENV.user.simple_rank)}).wait(TIME.sec(8))
    }

    setTimeout(()=>{this.revealLobby();}, TIME.sec(11));
  },

  revealLobby() {
    PARTICLES.start();
    this.showLayer('#menu_layer');
    setTimeout(()=>{this.hideLayer('#results_layer');}, TIME.sec(1));
  },

  animateRankChange(old_rank, new_rank) {console.log(`OLD ${old_rank}`, `NEW ${new_rank}`)
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
    (()=>{this.hideLayer('#countdown_layer');}).wait(TIME.sec(3.5))
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
  }


};
