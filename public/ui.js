let SOUND = {
  mute() {
    $('#not_muted').css('display', 'none');
    $('#muted').css('display', 'inline-block');
    ENV.sound.mute = true;
    localStorage.mute = ENV.sound.mute = true;
  },

  unmute() {
    $('#muted').css('display', 'none');
    $('#not_muted').css('display', 'inline-block');
    localStorage.mute = ENV.sound.mute = false;
  }
};

$(() => {

  $('#muted').click(jqEvent => {
    var span = jqEvent.currentTarget;
    $(span).css('display', 'none');
    $('#not_muted').css('display', 'inline-block');
    localStorage.mute = ENV.sound.mute = false;

  });
  $('#not_muted').click(jqEvent => {
    var span = jqEvent.currentTarget;
    $(span).css('display', 'none');
    $('#muted').css('display', 'inline-block');
    ENV.sound.mute = true;
    localStorage.mute = ENV.sound.mute = true;
  });

  localStorage.mute === 'false' ? SOUND.unmute() : SOUND.mute()

});
