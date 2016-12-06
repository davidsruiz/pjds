
var LOBBY = {

  coundownTime: 3,

  setupLink() {
    $('#lobbylink').val(location.href);
  },

  focusOnInput() {
    $('#name-input').focus();
  },

  startCountdown(callback) { log(`starting countdown...`)
    $('#countdown_layer').css('display', 'initial');
    $('#countdown_layer').css('opacity', '1');

    var countdown = (n = this.coundownTime) => {
      $('#countdown').text(n--);
      if(n >= 0) setTimeout(()=>{countdown(n)}, 1000);
    }

    countdown();
    setTimeout(()=>{this.revealGame(callback)}, this.coundownTime*1000);
  },

  revealGame(callback) {
    $('#countdown_layer').css('opacity', '0');
    $('#menu_layer').css('opacity', '0');
    if(callback) callback();
    setTimeout(()=>{
      $('#countdown_layer').css('display', 'none');
      $('#menu_layer').css('display', 'none');
    }, 1000);

  },

  disconnect(msg = `A network error occured`) {
    socket.disconnect();
    alert(msg);
    location.reset();
  },

  showResults(g) {
    alert('somebody won..');
    this.revealLobby();
  },

  revealLobby() {
    PARTICLES.start();
    $('#menu_layer').css('display', 'initial');
    $('#menu_layer').css('opacity', '1');
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
