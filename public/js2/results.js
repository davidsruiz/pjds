'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var RESULTS = {
  layer_node: null,
  getLayerNode: function getLayerNode() {
    return this.layer_node ? this.layer_node : this.layer_node = document.querySelector('#results_layer');
  },
  load: function load(game_data) {
    this.clear_DOM();

    var summary = this.structure(game_data),
        layer = this.getLayerNode();

    summary.forEach(function (team, i) {
      var results_team = document.createElement('div'),
          results_team_win_state = document.createElement('span'),
          results_team_score = document.createElement('span'),
          results_players = document.createElement('div');

      var _COLOR$hexToRgb = COLOR.hexToRgb(team.color),
          r = _COLOR$hexToRgb.r,
          g = _COLOR$hexToRgb.g,
          b = _COLOR$hexToRgb.b;

      var RGBAcolor = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.3)';

      results_team.className = 'results_team';
      results_team_win_state.className = 'results_team_win_state';
      results_team_win_state.textContent = i == 0 ? 'WIN' : 'LOSE';
      results_team_win_state.style.color = team.color;
      results_team_score.className = 'results_team_score';
      results_team_score.textContent = team.score;
      results_players.className = 'results_players';

      team.players.forEach(function (player) {
        var results_player = document.createElement('span'),
            results_player_name = document.createElement('span'),
            results_player_score = document.createElement('span');

        results_player.className = 'results_player';
        results_player.style.backgroundColor = RGBAcolor;
        results_player_name.className = 'results_player_name';
        results_player_name.textContent = player[0];
        results_player_score.className = 'results_player_score';
        results_player_score.textContent = player[1] + '+ ' + player[2] + '-';

        results_player.appendChild(results_player_name);
        results_player.appendChild(results_player_score);

        results_players.appendChild(results_player);
      });

      results_team_win_state.appendChild(results_team_score);
      results_team.appendChild(results_team_win_state);
      results_team.appendChild(results_players);

      layer.appendChild(results_team);
    });
  },
  clear_DOM: function clear_DOM() {
    var myNode = this.getLayerNode();
    while (myNode.children[1]) {
      myNode.removeChild(myNode.children[1]);
    }
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
  }
};
//# sourceMappingURL=results.js.map