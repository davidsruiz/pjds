
var ENV = ENV || {};

ENV.sound = new Sound();
ENV.sound.load('menu');
ENV.sound.play('ambiance');

$(() => {
  $('.mi').mouseover(jqEvent => {
    $('.mi').removeClass('selected');
    var span = jqEvent.currentTarget;
    span.classList.add('selected')
    ENV.sound.play('item-hover');
  });
  $('.mi').mouseout(jqEvent => {
    var span = jqEvent.currentTarget;
    span.classList.remove('selected')
  });

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

  localStorage.mute === 'true' ? SOUND.mute() : SOUND.unmute()

})


var SOUND = {
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
}
