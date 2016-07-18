//team.js ...........................................................

var Team = (function()
{
	//exposed methods:

	var create = function(color)
	{
		var obj = Object.create(def);
        obj.color = color;
        obj.players = [];

		return obj;
	};

	//definition:

	var def =
	{
        color: null,
        players: null,

		addPlayer: function(player)
		{
            this.players[this.players.length] = player;
            player.team = this;
		},

        removePlayer: function(player)
        {
            this.players.splice(this.players.indexOf(player), 1);
            player.team = null;
        },

        getPoints: function()
        {
            var total = 0;
            for(player of this.players) {
                total += player.points;
            }
            return total;
        }

	};

	return {create:create};
}());
