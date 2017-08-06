let RESULTS = {
  layer_node: null,
  getLayerNode: function() {
    return this.layer_node ? this.layer_node : this.layer_node = document.querySelector('#results_layer');
  },
  load: function(game_data) {
    this.clear_DOM();

    var summary = this.structure(game_data),
        layer = this.getLayerNode();

    summary.forEach((team, i)=>{
      var results_team = document.createElement('div'),
          results_team_win_state = document.createElement('span'),
          results_team_score = document.createElement('span'),
          results_players = document.createElement('div');
      var {r, g, b} = COLOR.hexToRgb(team.color);
      var RGBAcolor = `rgba(${r}, ${g}, ${b}, 0.3)`;

      results_team.className = 'results_team';
      results_team_win_state.className = 'results_team_win_state';
      results_team_win_state.textContent = i == 0 ? 'WIN' : 'LOSE';
      results_team_win_state.style.color = team.color;
      results_team_score.className = 'results_team_score';
      results_team_score.textContent = team.score;
      results_players.className = 'results_players';

      team.players.forEach((player)=>{
        var results_player = document.createElement('span'),
            results_player_name = document.createElement('span'),
            results_player_score = document.createElement('span');

        results_player.className = 'results_player';
        results_player.style.backgroundColor = RGBAcolor;
        results_player_name.className = 'results_player_name';
        results_player_name.textContent = player[0];
        results_player_score.className = 'results_player_score';
        results_player_score.textContent = `${player[1]}+ ${player[2]}-`;

        results_player.appendChild(results_player_name);
        results_player.appendChild(results_player_score);

        results_players.appendChild(results_player);
      });

      results_team_win_state.appendChild(results_team_score);
      results_team.appendChild(results_team_win_state);
      results_team.appendChild(results_players);

      layer.appendChild(results_team);
    })

  },
  clear_DOM: function() {
    var myNode = this.getLayerNode();
    while (myNode.children[1]) {
      myNode.removeChild(myNode.children[1]);
    }
  },


  // returns this format [{color: '#333233', score: 90, players: [['joan', 4, 5], ['billy', 4, 5]]}, [['acp', 1, 3], ['cake', 3, 4]]]
  structure(game_data) {
    var summary = [];
    var [model, teams] = game_data;
    teams.forEach((team)=>{
      var color = team.color,
          score = 100 - model.scores[team.number],
          players = [];
      team.players.forEach((player)=>{
        players.push([player.name, player.score.kills, player.score.deaths]);
      });
      players.sort((a, b)=> b[1] - a[1]);
      summary.push({color, score, players});
    });
    summary.sort((a, b)=> b.score - a.score );
    return summary;
  }


};
