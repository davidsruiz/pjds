
function refreshLobbyView() {

  // clear it up
  $('span.mi').remove()

  // populate
  var players = ENV["lobby"]["players"];
  for (var key in players) {
    if (players.hasOwnProperty(key)) {

      var name = players[key].name;
      if(key == sessionStorage.id) {
        var span = document.createElement('span'); span.className = 'mi';
        var input = document.createElement('input');
        input.type = "text";
        input.placeholder = "your name";
        input.value = name;
        input.onkeydown = function(e) { if(e.keyCode==13) socket.emit('set name', this.value) };
        span.appendChild(input);
        $('.lobby > main').append(span);
      } else {
        var span = document.createElement('span'); span.className = 'mi'; span.textContent = name;
        $('.lobby > main').append(span);
      }

    }
  }
}
