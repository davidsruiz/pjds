//ship.js ...........................................................

var Ship = (function()
{
	//exposed methods:

	var create = function(x, y, ref)
	{
		var obj = Object.create(def);
		obj.ref = ref;

		obj.angle = 0;
		obj.pos = Vec2D.create(x, y);
		obj.vel = Vec2D.create(0, 0);
		obj.thrust = Vec2D.create(0, 0);
		obj.idle = false;
		obj.color = '#FFF';
    obj.hp = 10;

    obj.fireCounter = 0;
    obj.respawnCounter = 0;

    obj.fric = 0.97,
		obj.radius = 8;

    obj.MAX_HP = 10;
    obj.TURN_SPEED = 0.12; // max velocity
    obj.MAX_VELOCITY = 5;
    obj.ACCELERATION = 0.18;
    obj.ACCURACY = (2 * Math.PI) * (0.01); // (1%) angle sweep in radians.
    obj.MAX_WALL_COUNT = 32;

    obj.FIRE_FREQUENCY = 8;
		obj.RESPAWN_TIME = 120;

    obj.init();

		return obj;
	};

	//Ship definition:

	var def =
	{
    // DYNAMIC VARIABLES
		angle: null,
		pos: null,
		vel: null,
		thrust: null,
		idle: null,
    color: null,
    hp: null,

    fireCounter: null,
    respawnCounter: null,

    // STATIC VARIABLES
		ref: null,

    fric: null,
		radius: null,
            // stats //
    MAX_HP: null,
    TURN_SPEED: null,
    MAX_VELOCITY: null,
    ACCELERATION: null,
    ACCURACY: null,
    MAX_WALL_COUNT: null,

		FIRE_FREQUENCY: null,
		RESPAWN_TIME: null,

        // COLLECTIONS
		wallParticlePool: null,
		wallParticles: null,

        // FUNCTIONS
    init: function(wp)
		{
			this.wallParticlePool = Pool.create(WallParticle, this.MAX_WALL_COUNT);
      this.wallParticles = [] || wp;
		},

		update: function()
		{
			if(!this.idle)
      {
        this.vel.mul(this.fric);
        this.vel.add(this.thrust);
        this.pos.add(this.vel);

        if(this.vel.getLength() > this.MAX_VELOCITY) this.vel.setLength(this.MAX_VELOCITY);

        ++this.fireCounter;
      }
      else
      {
				if(++this.respawnCounter > this.RESPAWN_TIME)
				{
					this.respawnCounter = 0;
					this.idle = false;

					this.ref.resetShip(this);
				}
      }
		},

		shoot: function(instance)
		{
			if(this.fireCounter > this.FIRE_FREQUENCY)
			{
				this.ref.generateShot(instance);
				this.fireCounter = 0;
			}
		},

    damage: function(hp)
		{
			this.hp -= hp;

			if(this.hp <= 0 && !this.idle)
			{
				this.idle = true;
        this.ref.generateShipExplosion(this);
			}
		},

    reset: function() {},
		data: function() {
			return {
				angle: this.angle,
				pos: this.pos,
				vel: this.vel,
				thrust: this.thrust,
				idle: this.idle,
				color: this.color,
				hp: this.hp,
				wp: this.wallParticles
			}
		}

	};

	var load = function(data) {
		var obj = Object.create(def);
		// obj.ref = ref;

		obj.angle = data.angle;
		obj.pos = Vec2D.create(data.pos._x, data.pos._y);
		obj.vel = Vec2D.create(data.vel._x, data.vel._y);
		obj.thrust = Vec2D.create(data.thrust._x, data.thrust._y);
		obj.idle = data.idle;
		obj.color = data.color;
		obj.hp = data.hp;

		obj.fireCounter = 0;
		obj.respawnCounter = 0;

		obj.fric = 0.97,
		obj.radius = 8;

		obj.MAX_HP = 10;
		obj.TURN_SPEED = 0.12; // max velocity
		obj.MAX_VELOCITY = 5;
		obj.ACCELERATION = 0.18;
		obj.ACCURACY = (2 * Math.PI) * (0.01); // (1%) angle sweep in radians.
		obj.MAX_WALL_COUNT = 32;

		obj.FIRE_FREQUENCY = 8;
		obj.RESPAWN_TIME = 120;

		obj.init(data.wp);

		return obj;
	};


	return {create:create, load:load};
}());
