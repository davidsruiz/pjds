'use strict';

var ENV = ENV || {};

// ENV.sound = new Sound();
// ENV.sound.load('menu');
// ENV.sound.play('ambiance');

$(function () {
  $('#home-menu > *').mouseover(function (jqEvent) {
    $('#home-menu > *').removeClass('selected');
    var span = jqEvent.currentTarget;
    span.classList.add('selected');
    // ENV.sound.play('item-hover');
  });
  $('#home-menu > *').mouseout(function (jqEvent) {
    var span = jqEvent.currentTarget;
    span.classList.remove('selected');
  });

  // ENV.user = new User();
  // if(ENV.storage.ongoing == 'true') { ENV.user.updateRank(); ENV.storage.ongoing = 'false' }
  //
  // $('#user_mini_info').click(jqEvent => { LOBBY.showLayer('#user_info_layer') });
  // $('#user_info_background, #uic_close_button').click(jqEvent => { LOBBY.hideLayer('#user_info_layer') })
  //
  // const UA = new UserAdapter(ENV.user);
  // $('#uic_title_edit').click(jqEvent => { UA.getName() })
  // UA.refreshUI();
});
//# sourceMappingURL=home.js.map