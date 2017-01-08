
function refreshLobbyView() {

  // clear it up
  $('span.mi').remove();

  // populate
  let players = ENV["lobby"]["players"];
  players.forEach((id, player) => {

    let name = player.name;
    if(id == ENV.storage.id) {
      let span = document.createElement('span'); span.className = 'mi';
      let input = document.createElement('input'); input.id = "name-input";
      input.type = "text";
      input.placeholder = "your name";
      input.value = name;
      input.onkeydown = function(e) { if(e.keyCode==13) $(this).blur() };
      input.oninput = function() { ENV.sound.play('type') };
      input.onfocus = function() { editing = true };
      input.onblur = function() { socket.emit('set name', this.value); editing = false; refreshLobbyView() };
      let row = document.createElement('span'); row.className = 'mi-row';
      let select = document.createElement('select');
      // let placeholder = document.createElement('option');
      // placeholder.innerHTML = 'choose type';
      // placeholder.disabled = 'true';
      // placeholder.value = "";
      // select.appendChild(placeholder);
      let defoption = document.createElement('option'); defoption.disabled = true; defoption.textContent = "choose ship type";
      select.appendChild(defoption);
      types.forEach(t => {
        let option = document.createElement('option');
        option.innerHTML = t;
        select.appendChild(option);
      });
      select.value = ENV.storage.type || 'balanced';//defoption.textContent;
      select.onchange = function(e) { socket.emit('set type', this.value); ENV.storage.type = this.value; };
      let right = document.createElement('span');
      let checkbox = document.createElement('input'); checkbox.type = "checkbox"; checkbox.name = "checkbox";
      checkbox.onchange = function() { if(this.checked) { socket.emit('ready'); ENV.sound.play('ready') } };

      row.appendChild(select);
      if(player.cleared) row.appendChild(document.createTextNode("ready?"));
      if(player.cleared) row.appendChild(checkbox); //row.appendChild(checkboxlabel);

      span.appendChild(input);
      span.appendChild(row);

      $('.lobby > main').append(span);
      log(player);
      if(player.ready) { input.disabled = true; select.disabled = true; checkbox.checked = true; checkbox.disabled = true; }
    } else {
      let span = document.createElement('span'); span.className = 'mi'; span.textContent = name || '-';
      $('.lobby > main').append(span);
    }
  });
}

let types = ['damage', 'speed', 'balanced', 'rate', 'defense'];
