'use strict';

var ENV = ENV || {};

ENV.sound = new Sound();
ENV.sound.load('lobby');
ENV.sound.play('chill');

ENV.sound.load('level');
ENV.sound.load('game');

$(function () {
  ENV.user = new User();
  if (ENV.storage.ongoing == 'true') {
    ENV.user.updateRank();ENV.storage.ongoing = 'false';
  }

  document.querySelector('#home_icon').addEventListener('click', function () {
    window.location.reset();
  });

  // TODO fix..!
  if (ENV.mobile) document.querySelector('#touch_layer').remove();
});
//# sourceMappingURL=game.js.map