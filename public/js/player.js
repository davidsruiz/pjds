//player.js ...........................................................

var Player = (function()
{
	//exposed methods:

	var create = function(name)
	{
		var obj = Object.create(def);
        obj.name = name;
		obj.points = 0;

		return obj;
	};

	//definition:

	var def =
	{
        name: null,
		team: null,
        ship: null,
		points: null,

		addPoints: function(p)
		{
			this.points += p;
		},

        setPoints: function(p)
        {
            this.points = p;
        }
	};

	return {create:create};
}());
