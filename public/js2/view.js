
function refreshLobbyView() {

  // clear it up
  $('span.mi').remove()

  // populate
  var players = ENV["lobby"]["players"];
  players.forEach((id, player) => {

    var name = player.name;
    if(id == sessionStorage.id) {
      var span = document.createElement('span'); span.className = 'mi';
      var input = document.createElement('input'); input.id = "name-input"
      input.type = "text";
      input.placeholder = "your name";
      input.value = name;
      input.onkeydown = function(e) { if(e.keyCode==13) $(this).blur() };
      input.oninput = function() { ENV.sound.play('item-hover') };
      input.onfocus = function() { editing = true };
      input.onblur = function() { socket.emit('set name', this.value); editing = false; refreshLobbyView() }
      var row = document.createElement('span'); row.className = 'mi-row';
      var select = document.createElement('select');
      // var placeholder = document.createElement('option');
      // placeholder.innerHTML = 'choose type';
      // placeholder.disabled = 'true';
      // placeholder.value = "";
      // select.appendChild(placeholder);
      var defoption = document.createElement('option'); defoption.disabled = true; defoption.textContent = "choose a type";
      select.appendChild(defoption);
      types.forEach(t => {
        var option = document.createElement('option');
        option.innerHTML = t;
        select.appendChild(option);
      });
      select.value = sessionStorage.type || defoption.textContent;
      select.onchange = function(e) { socket.emit('set type', this.value); sessionStorage.type = this.value; };
      var right = document.createElement('span');
      var checkbox = document.createElement('input'); checkbox.type = "checkbox"; checkbox.name = "checkbox";
      checkbox.onchange = function() { if(this.checked) { socket.emit('ready'); sessionStorage.ready = true } }

      row.appendChild(select);
      if(player.cleared) row.appendChild(document.createTextNode("ready?"))
      if(player.cleared) row.appendChild(checkbox); //row.appendChild(checkboxlabel);

      span.appendChild(input);
      span.appendChild(row);

      $('.lobby > main').append(span);
      log(player)
      if(player.ready) { input.disabled = true; select.disabled = true; checkbox.checked = true; checkbox.disabled = true; }
    } else {
      var span = document.createElement('span'); span.className = 'mi'; span.textContent = name || '-';
      $('.lobby > main').append(span);
    }
  });
}

var types = ['damage', 'speed', 'balanced', 'rate', 'defense'];
