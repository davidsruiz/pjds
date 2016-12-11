
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

    if(ENV.lobby.type == 'public') ENV.user.updateRank();
    ENV.storage.ongoing = false;

    setTimeout(()=>{this.revealLobby();}, TIME.sec(11));
  },

  revealLobby() {
    PARTICLES.start();
    this.showLayer('#menu_layer');
    setTimeout(()=>{this.hideLayer('#results_layer');}, TIME.sec(1));
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
  }


};
