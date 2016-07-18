//particle.js ...........................................................

var Particle = (function()
{
	//exposed methods:

	var create = function()
	{
		var obj = Object.create(def);
		obj.radius = 2;
		obj.color = '#FFF';
		obj.lifeSpan = 0;
		obj.fric = 0.98;
		obj.pos = Vec2D.create(0, 0);
		obj.vel = Vec2D.create(0, 0);
		obj.blacklisted = false;

		return obj;
	};

	//definition:

	var def =
	{
		radius: null,
		color: null,
		lifeSpan: null,
		fric: null,
		pos: null,
		vel: null,
		blacklisted: null,

		update: function()
		{
			this.pos.add(this.vel);
			this.vel.mul(this.fric);
			this.radius -= 0.1;

			if(this.radius < 0.1) this.radius = 0.1;

			if(this.lifeSpan-- < 0)
			{
				this.blacklisted = true;
			}
		},

		reset: function()
		{
			this.blacklisted = false;
		},
    data: function() {
      return {
        radius: this.radius,
        color: this.color,
        lifeSpan: this.lifeSpan,
        fric: this.fric,
        pos: this.pos,
        vel: this.vel,
        blacklisted: this.blacklisted
      }
    }
	};

  var load = function(data) {
    var obj = Object.create(def);
    obj.radius = data.radius;
    obj.color = data.color;
    obj.lifeSpan = data.lifeSpan;
    obj.fric = data.fric;
		obj.pos = Vec2D.create(data.pos._x, data.pos._y);
		obj.vel = Vec2D.create(data.vel._x, data.vel._y);
    obj.blacklisted = data.blacklisted;

    return obj;
  }

	return {create:create, load:load};
}());
