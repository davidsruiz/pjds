//bullet.js ...........................................................

var Bullet = (function()
{
	//exposed methods:

	var create = function()
	{
		var obj = Object.create(def);
		obj.radius = 4;
		obj.color = '#FFF';
		obj.pos = Vec2D.create(0, 0);
		obj.vel = Vec2D.create(0, 0);
		obj.blacklisted = false;
    obj.hp = 10;

		return obj;
	};

	//Bullet definition:

	var def =
	{
		radius: null,
		color: null,
		pos: null,
		vel: null,
		blacklisted: null,
    hp: 10,

		update: function()
		{
			this.pos.add(this.vel);
		},

		reset: function()
		{
			this.blacklisted = false;
		}
	};

  var load = function(data) {
    var obj = Object.create(def);
		obj.radius = data.radius;
		obj.color = data.color;
		obj.pos = Vec2D.create(data.pos._x, data.pos._y);
		obj.vel = Vec2D.create(data.vel._x, data.vel._y);
		obj.blacklisted = data.blacklisted;
    obj.hp = data.color;

		obj.timestamp = data.timestamp;
		obj.game_index = data.game_index;

		return obj;
  }
	return {create:create,load:load};
}());
