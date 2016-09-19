
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
})
