//wall-particle.js ...........................................................

var WallParticle = (function()
{
	//exposed methods:

	var create = function()
	{
		var obj = Object.create(def);
		obj.radius = 2;
		obj.color = '#FFF';
		obj.lifeSpan = 0;
		obj.hp = 10;
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
    hp: null,
		fric: null,
		pos: null,
		vel: null,
		blacklisted: null,

		update: function()
		{
			this.pos.add(this.vel);
			this.vel.mul(this.fric);

			if(this.lifeSpan-- < 0)
			{
				this.blacklisted = true;
			}
		},

        damage: function(hp)
		{
			this.hp -= hp;

			if(this.hp <= 0)
			{
				this.blacklisted = true;
			}
		},

		reset: function()
		{
			this.blacklisted = false;
		}
	};

	return {create:create};
}());
