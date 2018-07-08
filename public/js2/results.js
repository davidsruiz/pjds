'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var RESULTS = {
  layer_node: null,
  getLayerNode: function getLayerNode() {
    return this.layer_node ? this.layer_node : this.layer_node = document.querySelector('#results_layer');
  },
  load: function load(server_data) {

    // DOM
    this.clear_DOM();
    var layer = this.getLayerNode();

    // data
    var summary = this.interpret(server_data);

    // HEADER //

    // setup
    var mainTeam = summary.teams.shift(); //team in question

    // header background
    var resultsHead = layer.querySelector('#results_head');
    resultsHead.style.background = mainTeam.color;

    // win outcome
    var outcomeResultNode = layer.querySelector('#results_win_outcome');
    outcomeResultNode.textContent = mainTeam.won ? 'WIN' : 'LOSE';

    // scoring unit
    var labelText = REF.results.modeMeasure[summary.mode];
    var scoreUnitLabelNode = layer.querySelector('#results_timeline_label');
    scoreUnitLabelNode.textContent = labelText.toUpperCase();

    // add bubbles
    var bubblesContainer = layer.querySelector('#results_timeline_bubbles');
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = summary.teams[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var team = _step.value;

        bubblesContainer.appendChild(this.createBubble(team));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    bubblesContainer.appendChild(this.createBubble(mainTeam));

    // add main team player's table
    var header = document.querySelector('#results_head_content');
    var mainPlayersTable = this.createPlayerTable(mainTeam);
    header.appendChild(mainPlayersTable);

    // BODY //

    var resultsBodyNode = layer.querySelector('#results_body');
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = summary.teams[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var _team = _step2.value;

        var teamNode = document.createElement('div');
        teamNode.className = 'results_team';
        teamNode.style.color = _team.color;

        teamNode.appendChild(this.createBubble(_team));
        teamNode.appendChild(this.createPlayerTable(_team));

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
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  },
  clear_DOM: function clear_DOM() {
    var layerNode = this.getLayerNode();

    var bubblesGroup = layerNode.querySelector('#results_timeline_bubbles');
    while (bubblesGroup.children[0]) {
      bubblesGroup.removeChild(bubblesGroup.children[0]);
    }var playerTable = bubblesGroup.parentNode.parentNode.parentNode.querySelector('.results_players');
    if (playerTable) playerTable.parentNode.removeChild(playerTable);

    var resultsBody = layerNode.querySelector('#results_body');
    while (resultsBody.children[0]) {
      resultsBody.removeChild(resultsBody.children[0]);
    }
  },

  createPlayerTable: function createPlayerTable(team) {

    var ce = function ce(tagName) {
      return document.createElement(tagName);
    };

    // root and table elements
    var results_players = ce('div');
    var table = ce('table');
    var thead = ce('thead');
    var tbody = ce('tbody');
    results_players.className = 'results_players';

    // header
    var headerRow = ce('tr');
    var headerRowContents = ['', 'KILLS', 'DEATHS', 'HITS'];
    headerRowContents.length.times(function (i) {
      var headerCell = ce('th');
      headerCell.textContent = headerRowContents[i];
      headerRow.appendChild(headerCell);
    });
    thead.appendChild(headerRow);

    // player rows

    var _loop = function _loop(player) {
      var row = ce('tr');
      player.length.times(function (i) {
        var cell = ce('th');
        cell.textContent = player[i];
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    };

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = team.players[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var player = _step3.value;

        _loop(player);
      }

      // hookup and connect
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    table.appendChild(thead);
    table.appendChild(tbody);

    results_players.appendChild(table);

    return results_players;
    // var {r, g, b} = COLOR.hexToRgb(team.color);
    // var RGBAcolor = `rgba(${r}, ${g}, ${b}, 0.3)`;

  },
  createBubble: function createBubble(team) {
    var bubble = document.createElement('span');

    bubble.className = 'results_timeline_bubble';
    bubble.textContent = team.score;
    bubble.style.backgroundColor = team.color;
    bubble.style.left = team.progress + '%';

    return bubble;
  },


  // returns this format [{color: '#333233', score: 90, players: [['joan', 4, 5], ['billy', 4, 5]]}, [['acp', 1, 3], ['cake', 3, 4]]]
  structure: function structure(game_data) {
    var summary = [];

    var _game_data = _slicedToArray(game_data, 2),
        model = _game_data[0],
        teams = _game_data[1];

    teams.forEach(function (team) {
      var color = team.color,
          score = 100 - model.scores[team.number],
          players = [];
      team.players.forEach(function (player) {
        players.push([player.name, player.score.kills, player.score.deaths]);
      });
      players.sort(function (a, b) {
        return b[1] - a[1];
      });
      summary.push({ color: color, score: score, players: players });
    });
    summary.sort(function (a, b) {
      return b.score - a.score;
    });
    return summary;
  },
  interpret: function interpret(_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        scores = _ref2[0],
        records = _ref2[1];

    scores = scores.slice(0);
    records = [].concat(_toConsumableArray(records.map(function (m) {
      return m.slice(0);
    })));

    // reference materials
    var colors = ENV.game.teams.map(function (team) {
      return team.color;
    });
    var mode = ENV.game.gameMode;

    // score to progress and win conversion
    var progresses = [];
    var respectiveWins = [];
    switch (mode) {

      // ctf
      case 0:

        // progresses
        scores.forEach(function (score) {
          return progresses.push(score);
        });

        // win bool
        var bestScore = _(scores).max();
        scores.forEach(function (score) {
          return respectiveWins.push(bestScore == score);
        });

        break;

      // territorial
      case 1:

        // progresses
        var bestScore = _(scores).max();
        scores.forEach(function (score) {
          return progresses.push(100 * score / bestScore);
        });

        // win bool
        scores.forEach(function (score) {
          return respectiveWins.push(bestScore == score);
        });

        break;

    }

    var indexOfWinner = _(respectiveWins).indexOf(true);
    var ourTeamIndex = ENV.spectate ? indexOfWinner : ENV.game.team.number;

    // creation of summary
    var summary = {};
    summary.mode = mode;
    summary.teams = [];
    scores.forEach(function (teamScore, index) {

      // root
      var team = {};

      team.color = colors[index]; // color
      team.score = scores[index]; // score
      team.progress = progresses[index]; // progress
      team.won = respectiveWins[index]; // wins

      team.players = [];

      // stack onto summary
      summary.teams.push(team);
    });

    // add player records to respective teams
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = records[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var playerRecord = _step4.value;

        var _teamIndexAndNameFrom = this.teamIndexAndNameFromPlayerID(playerRecord[0]),
            _teamIndexAndNameFrom2 = _slicedToArray(_teamIndexAndNameFrom, 2),
            teamIndex = _teamIndexAndNameFrom2[0],
            name = _teamIndexAndNameFrom2[1];

        playerRecord[0] = name;
        summary.teams[teamIndex].players.push(playerRecord);
      }

      // rearrange primary team on top
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }

    var primaryTeam = summary.teams.splice(ourTeamIndex, 1).first();
    summary.teams.unshift(primaryTeam);

    return summary;
  },
  teamIndexAndNameFromPlayerID: function teamIndexAndNameFromPlayerID(id) {

    var player = ENV.game.players.get(id);

    if (player) {

      var teamIndex = player.team.number;
      var name = player.name;

      return [teamIndex, name];
    } else {
      console.warn('RESULTS:: player ID not found (' + id + ')');
    }
  },


  // results as it pertains to user
  // ... todo .. relocate this please
  updateUserWithResults: function updateUserWithResults(server_data) {

    if (ENV.spectate) return;

    var summary = this.interpret(server_data);
    var stats = ENV.user.stats || {};
    var wins = stats.wins || 0;
    var losses = stats.losses || 0;
    var kills = stats.kills || 0;
    var deaths = stats.deaths || 0;

    console.log(summary.teams.map(function (t) {
      return t.won;
    }));
    console.log(ENV.game.team.number);
    if (summary.teams[ENV.game.team.number].won) {
      stats.wins = Number(wins) + 1;
    } else {
      stats.losses = Number(losses) + 1;
    }

    stats.kills = Number(kills) + ENV.game.player.score.kills;
    stats.deaths = Number(deaths) + ENV.game.player.score.deaths;
  }
};

var fake_data = [{
  color: '#00B0FF',
  score: '∞',
  progress: 100,
  won: true,
  players: [['david', 12, 15, 123], ['isabel', 10, 3, 152], ['john', 12, 15, 123], ['grill', 10, 3, 152]]
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
  players: [['shakespear', 12, 15, 123], ['underface', 10, 3, 152], ['sam', 12, 15, 123], ['nancy', 10, 3, 152]]
}, {
  color: '#FFEA00',
  score: 1.7,
  progress: 32,
  won: false,
  players: [['shakespear', 12, 15, 123]]
}];
// RESULTS.load(fake_data);