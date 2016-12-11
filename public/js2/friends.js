
function listHistory(callback) {
  var pp = ENV.storage.previous_players;
  if(pp) {
    pp = JSON.parse(pp);

    $.ajax({
      url: '/online_status',
      type: 'POST',
      data: JSON.stringify({ history: pp }),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    })
    .done(function( list ) {
      list = list.reverse();
      for(var user of list) {
        var a = document.createElement('a'); a.href = `${location.origin}/${user[1]}`;
        var span = document.createElement('span'); span.className = 'mi'; span.textContent = user[0];

        a.appendChild(span);

        $('.menu').append(a);

        // <a href="/friends"><input type="submit" value="with friends"></a>

        console.log(user)
      }
      callback();
    });

  }
}

$(() => {
  listHistory(()=>{

    $('.mi:not([disabled])').mouseover(jqEvent => {
      $('.mi').removeClass('selected');
      var span = jqEvent.currentTarget;
      span.classList.add('selected')
      ENV.sound.play('item-hover');
    });
    $('.mi:not([disabled])').mouseout(jqEvent => {
      var span = jqEvent.currentTarget;
      span.classList.remove('selected')
    });

  });
})
