let RESULTS = {
  layer_node: null,
  getLayerNode: function() {
    return this.layer_node ? this.layer_node : this.layer_node = document.querySelector('#results_layer');
  },
  load: function(server_data) {
    
    // DOM
    this.clear_DOM();
    const layer = this.getLayerNode();

    // data
    const summary = this.interpret(server_data);

    
    // HEADER //

    // setup
    const mainTeam = summary.teams.shift(); //team in question

    // header background
    const resultsHead = layer.querySelector('#results_head');
    resultsHead.style.background = mainTeam.color;

    // win outcome
    const outcomeResultNode = layer.querySelector('#results_win_outcome');
    outcomeResultNode.textContent = mainTeam.won ? 'WIN' : 'LOSE';

    // scoring unit
    const labelText = REF.results.modeMeasure[summary.mode];
    const scoreUnitLabelNode = layer.querySelector('#results_timeline_label');
    scoreUnitLabelNode.textContent = labelText.toUpperCase();

    // add bubbles
    const bubblesContainer = layer.querySelector('#results_timeline_bubbles');
    for(let team of summary.teams) {
      bubblesContainer.appendChild(this.createBubble(team));
    }
    bubblesContainer.appendChild(this.createBubble(mainTeam));

    // add main team player's table
    const header = document.querySelector('#results_head_content');
    const mainPlayersTable = this.createPlayerTable(mainTeam);
    header.appendChild(mainPlayersTable);



    // BODY //

    const resultsBodyNode = layer.querySelector('#results_body');
    for(let team of summary.teams) {
      const teamNode = document.createElement('div');
      teamNode.className = 'results_team';
      teamNode.style.color = team.color;

      teamNode.appendChild(this.createBubble(team));
      teamNode.appendChild(this.createPlayerTable(team));

      resultsBodyNode.appendChild(teamNode);
    }



    // summary.forEach((team, i)=>{
    //   var results_team = document.createElement('div'),
    //       results_team_win_state = document.createElement('span'),
    //       results_team_score = document.createElement('span'),
    //       results_players = document.createElement('div');
    //   var {r, g, b} = COLOR.hexToRgb(team.color);
    //   var RGBAcolor = `rgba(${r}, ${g}, ${b}, 0.3)`;
    //
    //   results_team.className = 'results_team';
    //   results_team_win_state.className = 'results_team_win_state';
    //   results_team_win_state.textContent = i == 0 ? 'WIN' : 'LOSE';
    //   results_team_win_state.style.color = team.color;
    //   results_team_score.className = 'results_team_score';
    //   results_team_score.textContent = team.score;
    //   results_players.className = 'results_players';
    //
    //   team.players.forEach((player)=>{
    //     var results_player = document.createElement('span'),
    //         results_player_name = document.createElement('span'),
    //         results_player_score = document.createElement('span');
    //
    //     results_player.className = 'results_player';
    //     results_player.style.backgroundColor = RGBAcolor;
    //     results_player_name.className = 'results_player_name';
    //     results_player_name.textContent = player[0];
    //     results_player_score.className = 'results_player_score';
    //     results_player_score.textContent = `${player[1]}+ ${player[2]}-`;
    //
    //     results_player.appendChild(results_player_name);
    //     results_player.appendChild(results_player_score);
    //
    //     results_players.appendChild(results_player);
    //   });
    //
    //   results_team_win_state.appendChild(results_team_score);
    //   results_team.appendChild(results_team_win_state);
    //   results_team.appendChild(results_players);
    //
    //   layer.appendChild(results_team);
    // })

  },
  clear_DOM: function() {
    const layerNode = this.getLayerNode();

    const bubblesGroup = layerNode.querySelector('#results_timeline_bubbles');
    while(bubblesGroup.children[0]) bubblesGroup.removeChild(bubblesGroup.children[0]);

    const playerTable = bubblesGroup.parentNode.parentNode.parentNode.querySelector('.results_players');
    if(playerTable) playerTable.parentNode.removeChild(playerTable);

    const resultsBody = layerNode.querySelector('#results_body');
    while(resultsBody.children[0]) resultsBody.removeChild(resultsBody.children[0]);

  },

  createPlayerTable(team) {

    const ce = tagName => document.createElement(tagName);

    // root and table elements
    const results_players = ce('div');
    const table = ce('table');
    const thead = ce('thead');
    const tbody = ce('tbody');
    results_players.className = 'results_players';


    // header
    const headerRow = ce('tr');
    const headerRowContents = ['', 'KILLS', 'DEATHS', 'HITS'];
    headerRowContents.length.times(i => {
      const headerCell = ce('th');
      headerCell.textContent = headerRowContents[i];
      headerRow.appendChild(headerCell);
    });
    thead.appendChild(headerRow);

    // player rows
    for(let player of team.players) {
      const row = ce('tr');
      player.length.times(i => {
        const cell = ce('th');
        cell.textContent = player[i];
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    }

    // hookup and connect
    table.appendChild(thead);
    table.appendChild(tbody);

    results_players.appendChild(table);

    return results_players;
    // var {r, g, b} = COLOR.hexToRgb(team.color);
    // var RGBAcolor = `rgba(${r}, ${g}, ${b}, 0.3)`;


  },


  createBubble(team) {
    const bubble = document.createElement('span');

    bubble.className = 'results_timeline_bubble';
    bubble.textContent = team.score;
    bubble.style.backgroundColor = team.color;
    bubble.style.left = team.progress + '%';

    return bubble
  },


  // returns this format [{color: '#333233', score: 90, players: [['joan', 4, 5], ['billy', 4, 5]]}, [['acp', 1, 3], ['cake', 3, 4]]]
  structure(game_data) {
    var summary = [];
    var [model, teams] = game_data;
    teams.forEach((team)=>{
      var color = team.color,
          score = 100 - model.scores[team.number],
          players = [];
      team.players.forEach((player) => {
        players.push([player.name, player.score.kills, player.score.deaths]);
      });
      players.sort((a, b) => b[1] - a[1]);
      summary.push({color, score, players});
    });
    summary.sort((a, b) => b.score - a.score );
    return summary;
  },

  interpret([scores, records]){

    scores = scores.slice(0);
    records = [...records.map(m => m.slice(0))];

    // reference materials
    const colors = ENV.game.teams.map(team => team.color);
    const mode = ENV.game.gameMode;

    // score to progress and win conversion
    const progresses = [];
    const respectiveWins = [];
    switch(mode) {

      // ctf
      case 0:

        // progresses
        const limit = 100;
        scores.forEach(score => progresses.push(limit - score))

        // win bool
        var bestScore = _(scores).min();
        scores.forEach(score => respectiveWins.push(bestScore == score))

        break;

      // territorial
      case 1:

        // progresses
        var bestScore = _(scores).max();
        scores.forEach(score => progresses.push(100 * score / bestScore))

        // win bool
        scores.forEach(score => respectiveWins.push(bestScore == score))

        break;

    }

    const indexOfWinner = _(respectiveWins).indexOf(true);
    const ourTeamIndex = ENV.spectate ? indexOfWinner : ENV.game.team.number;



    // creation of summary
    const summary = {};
    summary.mode = mode;
    summary.teams = [];
    scores.forEach((teamScore, index) => {

      // root
      const team = {};

      team.color = colors[index]; // color
      team.score = scores[index]; // score
      team.progress = progresses[index]; // progress
      team.won = respectiveWins[index]; // wins

      team.players = [];

      // stack onto summary
      summary.teams.push(team);

    });
    
    // add player records to respective teams
    for(let playerRecord of records) {
      const [teamIndex, name] = this.teamIndexAndNameFromPlayerID(playerRecord[0])
      playerRecord[0] = name;
      summary.teams[teamIndex].players.push(playerRecord);
    }


    // rearrange primary team on top
    const primaryTeam = summary.teams.splice(ourTeamIndex, 1).first();
    summary.teams.unshift(primaryTeam);


    return summary;

  },

  teamIndexAndNameFromPlayerID(id) {

    const player = ENV.game.players.get(id);

    if(player) {

      let teamIndex = player.team.number;
      let name = player.name;
      
      return [teamIndex, name];

    } else {
      console.warn(`RESULTS:: player ID not found (${id})`)
    }

  },




  // results as it pertains to user
  // ... todo .. relocate this please
  updateUserWithResults(server_data) {

    if(ENV.spectate) return;


    const summary = this.interpret(server_data);
    const stats = ENV.user.stats || {};
    const wins = stats.wins || 0;
    const losses = stats.losses || 0;
    const kills = stats.kills || 0;
    const deaths = stats.deaths || 0;


    console.log(summary.teams.map(t=>t.won));
    console.log(ENV.game.team.number);
    if(summary.teams[ENV.game.team.number].won) {
      stats.wins = Number(wins) + 1
    } else {
      stats.losses = Number(losses) + 1
    }

    stats.kills = Number(kills) + ENV.game.player.score.kills;
    stats.deaths = Number(deaths) + ENV.game.player.score.deaths;



  }


};


const fake_data = [
  {
    color: '#00B0FF',
    score: '∞',
    progress: 100,
    won: true,
    players: [
      ['david', 12, 15, 123],
      ['isabel', 10, 3, 152],
          ['john', 12, 15, 123],
          ['grill', 10, 3, 152],
    ],
  },
  // {
  //   color: '#00FFE2',
  //   score: 178,
  //   progress: 100,
  //   won: true,
  //   players: [
  //     ['john', 12, 15, 123],
  //     ['grill', 10, 3, 152],
  //   ],
  // },
  // {
  //   color: '#FFEA00',
  //   score: 120,
  //   progress: 67,
  //   won: false,
  //   players: [
  //     ['sam', 12, 15, 123],
  //     ['nancy', 10, 3, 152],
  //   ],
  // },
  // {
  //   color: '#00B0FF',
  //   score: 78,
  //   progress: 44,
  //   won: false,
  //   players: [
  //     ['shakespear', 12, 15, 123],
  //     ['underface', 10, 3, 152],
  //   ],
  // },
  {
    color: '#82E600',
    score: 4.3,
    progress: 90,
    won: false,
    players: [
      ['shakespear', 12, 15, 123],
      ['underface', 10, 3, 152],
          ['sam', 12, 15, 123],
          ['nancy', 10, 3, 152],
    ],
  },
  {
    color: '#FFEA00',
    score: 1.7,
    progress: 32,
    won: false,
    players: [
      ['shakespear', 12, 15, 123],
    ],
  },
];
// RESULTS.load(fake_data);





