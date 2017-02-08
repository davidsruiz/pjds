
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
      input.onblur = function() { socket.emit('set name', this.value.substr(0, 24)); editing = false; refreshLobbyView() };
      let row = document.createElement('span'); row.className = 'mi-row';
      let select = document.createElement('select');
      // let defoption = document.createElement('option'); defoption.disabled = true; defoption.textContent = "choose ship type";
      // select.appendChild(defoption);
      // let random_option = document.createElement('option'); random_option.textContent = "random"; random_option.value = types.sample();
      // select.appendChild(random_option);
      types.forEach(t => {
        let option = document.createElement('option');
        option.innerHTML = t;
        select.appendChild(option);
      });
      select.value = ENV.storage.type || 'standard';//defoption.textContent;
      select.onchange = function(e) { socket.emit('set type', this.value); ENV.storage.type = this.value; };
      let team = document.createElement('select');
      let no_team = document.createElement('option');
      no_team.innerHTML = '-';
      no_team.value = -1;
      team.appendChild(no_team);
      ENV.lobby.team_capacity.times(i => {
        let option = document.createElement('option');
        option.innerHTML = i+1;
        option.value = i;
        team.appendChild(option);
      });
      team.value = ENV.storage.team || -1;
      team.onchange = function(e) { socket.emit('set team', this.value); ENV.storage.team = this.value; };
      // let right = document.createElement('span');
      let checkbox = document.createElement('input'); checkbox.type = "checkbox"; checkbox.name = "checkbox";
      checkbox.onchange = function() { if(this.checked) { socket.emit('ready'); ENV.sound.play('ready') } };

      row.appendChild(document.createTextNode("type:"));
      row.appendChild(select);
      if(ENV.lobby.type == 'private') row.appendChild(document.createTextNode("team:"));
      if(ENV.lobby.type == 'private') row.appendChild(team);
      if(player.cleared) row.appendChild(document.createTextNode("ready?"));
      if(player.cleared) row.appendChild(checkbox); //row.appendChild(checkboxlabel);

      span.appendChild(input);
      span.appendChild(row);

      $('.lobby > main').append(span);
      if(player.ready) { input.disabled = true; select.disabled = true; checkbox.checked = true; checkbox.disabled = true; }
    } else {
      let span = document.createElement('span'); span.className = 'mi player'; span.textContent = name || 'connected..'; span.title = name;
      $('.lobby > main').append(span);
    }
  });

  let emptySlots =  ENV["lobby"]["capacity"] - Object.keys(players).length;
  emptySlots.times(()=>{
    let span = document.createElement('span'); span.className = 'mi vacant'; span.textContent = 'waiting for players...';
    $('.lobby > main').append(span);
  });

}

let types = ['damage', 'speed', 'standard', 'rate', 'defense'];
