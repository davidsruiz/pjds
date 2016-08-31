
function refreshLobbyView() {

  // clear it up
  $('span.mi').remove()

  // populate
  var players = ENV["lobby"]["players"];
  players.forEach((id, player) => {

    var name = player.name;
    if(id == sessionStorage.id) {
      var span = document.createElement('span'); span.className = 'mi';
      var input = document.createElement('input');
      input.type = "text";
      input.placeholder = "your name";
      input.value = name;
      input.onkeydown = function(e) { if(e.keyCode==13) $(this).blur() };
      input.onfocus = function() { editing = true };
      input.onblur = function() { socket.emit('set name', this.value); editing = false; refreshLobbyView() }
      var select = document.createElement('select');
      // var placeholder = document.createElement('option');
      // placeholder.innerHTML = 'choose type';
      // placeholder.disabled = 'true';
      // placeholder.value = "";
      // select.appendChild(placeholder);
      types.forEach(t => {
        var option = document.createElement('option');
        option.innerHTML = t;
        select.appendChild(option);
      });
      select.value = sessionStorage.type;
      select.onchange = function(e) { socket.emit('set type', this.value); sessionStorage.type = this.value; };

      span.appendChild(input);
      span.appendChild(select);

      $('.lobby > main').append(span);
    } else {
      var span = document.createElement('span'); span.className = 'mi'; span.textContent = name;
      $('.lobby > main').append(span);
    }
  });
}

var types = ['damage', 'speed', 'balanced', 'rate', 'defense'];
