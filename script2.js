//pool.js ...........................................................

var Pool = (function()
{
	//exposed methods:

	var create = function(type, size)
	{
		var obj = Object.create(def);
		obj.init(type, size);

		return obj;
	};

	//definition:

	var def =
	{
		_type: null,
		_size: null,
		_pointer: null,
		_elements: null,

		init: function(type, size)
		{
			this._type = type;
			this._size = size;
			this._pointer = size;
			this._elements = [];

			var i = 0;
			var length = this._size;

			for(i; i < length; ++i)
			{
				this._elements[i] = this._type.create();
			}
		},

		getElement: function()
		{
			if(this._pointer > 0) return this._elements[--this._pointer];

			return null;
		},

		disposeElement: function(obj)
		{
			this._elements[this._pointer++] = obj;
		}
	};

	return {create:create};
}());

//vec2d.js ...........................................................

var Vec2D = (function()
{
	//exposed methods:

	var create = function(x, y)
	{
		var obj = Object.create(def);
		obj.setXY(x, y);

		return obj;
	};

	//Vec2D definition:

	var def =
	{
		_x: 1,
		_y: 0,

		getX: function()
		{
			return this._x;
		},

		setX: function(value)
		{
			this._x = value;
		},

		getY: function()
		{
			return this._y;
		},

		setY: function(value)
		{
			this._y = value;
		},

		setXY: function(x, y)
		{
			this._x = x;
			this._y = y;
		},

		getLength: function()
		{
			return Math.sqrt(this._x * this._x + this._y * this._y);
		},

		setLength: function(length)
		{
			var angle = this.getAngle();
			this._x = Math.cos(angle) * length;
			this._y = Math.sin(angle) * length;
		},

		getAngle: function()
		{
			return Math.atan2(this._y, this._x);
		},

		setAngle: function(angle)
		{
			var length = this.getLength();
			this._x = Math.cos(angle) * length;
			this._y = Math.sin(angle) * length;
		},

		add: function(vector)
		{
			this._x += vector.getX();
			this._y += vector.getY();
		},

		sub: function(vector)
		{
			this._x -= vector.getX();
			this._y -= vector.getY();
		},

		mul: function(value)
		{
			this._x *= value;
			this._y *= value;
		},

		div: function(value)
		{
			this._x /= value;
			this._y /= value;
		}
	};

	return {create:create};
}());

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
		}
	};

	return {create:create};
}());

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

	return {create:create};
}());

//asteroid.js ...........................................................

var Asteroid = (function()
{
	//exposed methods:

	var create = function()
	{
		var obj = Object.create(def);
		obj.radius = 40;
		obj.color = '#FFF';//'#FF5900';
		obj.pos = Vec2D.create(0, 0);
		obj.vel = Vec2D.create(0, 0);
		obj.blacklisted = false;
		obj.type = 'b';
		obj.sides = (Math.random() * 2 + 7) >> 0;
		obj.angle = 0;
		obj.angleVel = (1 - Math.random() * 2) * 0.01;

		return obj;
	};

	//Ship definition:

	var def =
	{
		radius: null,
		color: null,
		pos: null,
		vel: null,
		blacklisted: null,
		type: null,
		sides: null,
		angle: null,
		angleVel: null,

		update: function()
		{
			this.pos.add(this.vel);
			this.angle += this.angleVel;
		},

		reset: function()
		{
			this.blacklisted = false;
		}
	};

	return {create:create};
}());

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
    init: function()
		{
			this.wallParticlePool = Pool.create(WallParticle, this.MAX_WALL_COUNT);
            this.wallParticles = [];
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

    reset: function()
		{

		},
		data: function() {
			return {
				angle: this.angle,
				pos: this.pos,
				vel: this.vel,
				thrust: this.thrust,
				idle: this.idle,
				color: this.color,
				hp: this.hp
			}
		}

	};

	var make = function(data) {
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

		obj.init();

		return obj;
	};


	return {create:create, make:make};
}());

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

//canvas-asteroids.js ...........................................................
var saveState = "";
//common vars

var canvas;
var context;
var screenWidth;
var screenHeight;
var doublePI = Math.PI * 2;

//game vars

var teams = [];
var players = [];

// var particlePool;
// var particles;
//
// var bulletPool;
// var bullets;
//
// var asteroidPool;
// var asteroids;

var hScan;
// var asteroidVelFactor = 0;

var teamColors = ["#FF4235", "#FFDE35", "#47C72A", "#3595FF", "#A235FF"];

//input vars

var playerInput = [];
var keypressValue = 0.85;

window.getAnimationFrame =
window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame ||
function(callback)
{
	window.setTimeout(callback, 16.6);
};

window.onload = function()
{
	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');

	window.onresize();

    teamsInit();
    playersInit();

	inputInit();
	particleInit();
	// bulletInit();
	// asteroidInit();
	shipInit();

    pregameLogic();

	loop();
};

window.onresize = function()
{
	if(!canvas) return;

	screenWidth = canvas.clientWidth;
	screenHeight = canvas.clientHeight;

	canvas.width = screenWidth;
	canvas.height = screenHeight;

	hScan = (screenHeight / 4) >> 0;
};

function teamsInit()
{

    createTeam(teamColors[1]);
    createTeam(teamColors[3]);
}

function createTeam(color) {
    teams[teams.length] = Team.create(color);
}

function playersInit() {
    addPlayer("bro");
    addPlayer("jonny");
}

function addPlayer(name) {
    if(!name) name = "Player " + (players.length + 1);
    players[players.length] = Player.create(name);
}

function pregameLogic()
{
    desegnateTeams();
}

function desegnateTeams()
{
    var on = true;

    for(var i = 0; i < players.length; i++) {
        // teams[(i < 2) ? 0 : 1].addPlayer(players[i]);
        teams[(on) ? 0 : 1].addPlayer(players[i]);
        players[i].ship.color = players[i].team.color;
        on = !on;
    }
}

function inputInit()
{
    var i = players.length - 1;

    for(i; i > -1; --i)
    {
        //playerInput.push([false, false, false, false, false, false]); //left, up, right, down, fire, block
        playerInput.push([0, 0, false, false]); // left -1to1 right axis, down -1to1 up axis, fire toggle, block toggle
    }

	window.onkeydown = function(e)
	{
		switch(e.keyCode)
		{
			//key A or LEFT
			case 65:

			playerInput[0][0] = -keypressValue;

			break;

			case 37:

			playerInput[1][0] = -keypressValue;

			break;

			//key W or UP
			case 87:

			playerInput[0][1] = keypressValue;

			break;

			case 38:

			playerInput[1][1] = keypressValue;

			break;

			//key D or RIGHT
			case 68:

			playerInput[0][0] = keypressValue;

			break;

			case 39:

			playerInput[1][0] = keypressValue;

			break;

			//key S or DOWN
			case 83:

			playerInput[0][1] = -keypressValue;

			break;

			case 40:

			playerInput[1][1] = -keypressValue;

			break;

			//key K or Space
            case 75:

			playerInput[0][2] = true;

			break;

            case 32:

			playerInput[1][2] = true;

			break;

			//key L or C
            case 76:

			playerInput[0][3] = true;

			break;

            case 67:

			playerInput[1][3] = true;

			break;

			case 49: // 1 key
				saveState = JSON.stringify(players[0].ship.data());
				break;
			case 50: // 2 key
				players[0].ship = Ship.make(JSON.parse(saveState));
				break;
		}

    e.preventDefault();
	};

	window.onkeyup = function(e)
	{
		switch(e.keyCode)
		{
			//key A or LEFT
			case 65:

			playerInput[0][0] = 0;

			break;

			case 37:

			playerInput[1][0] = 0;

			break;

			//key W or UP
			case 87:

			playerInput[0][1] = 0;

			break;

			case 38:

			playerInput[1][1] = 0;

			break;

			//key D or RIGHT
			case 68:

			playerInput[0][0] = 0;

			break;

			case 39:

			playerInput[1][0] = 0;

			break;

			//key S or DOWN
			case 83:

			playerInput[0][1] = 0;

			break;

			case 40:

			playerInput[1][1] = 0;

			break;

			//key K or Space
            case 75:

			playerInput[0][2] = false;

			break;

            case 32:

			playerInput[1][2] = false;

			break;

			//key L or C
            case 76:

			playerInput[0][3] = false;

			break;

            case 67:

			playerInput[1][3] = false;

			break;
		}

    e.preventDefault();
	};
}

var controller = 0;
var deadZone = 0.15;

window.addEventListener("gamepadconnected", function(e) {
    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
    e.gamepad.index, e.gamepad.id,
    e.gamepad.buttons.length, e.gamepad.axes.length);
    controller = e.gamepad.index;
    checkControllerInputs();
});

function checkControllerInputs() {
    if(!navigator.getGamepads()[controller]) return;

    var val;

    // LEFT and RIGHT

    val = navigator.getGamepads()[controller].axes[0];
    playerInput[0][0] = (val < -deadZone || val > deadZone) ? (val - deadZone) / (1 - deadZone) : 0;

    // UP
    deadZone = 0.0;
    val = navigator.getGamepads()[controller].axes[3]; val = (val + 1) / 2;
    playerInput[0][1] = (val > deadZone) ? (val - deadZone) / (1 - deadZone) : 0;
    //playerInput[2][1] = (navigator.getGamepads()[controller].axes[1] < -deadZone) ? true : false;

    // DOWN

    // FIRE

    playerInput[0][2] = navigator.getGamepads()[controller].buttons[3].pressed;

    // BLOCK

    //playerInput[0][5] = ((navigator.getGamepads()[controller].axes[3] + 1)/2 > deadZone) ? true : false;
    playerInput[0][3] = navigator.getGamepads()[controller].buttons[7].pressed;


}

function particleInit()
{
	particlePool = Pool.create(Particle, 200);
	particles = [];
}

function bulletInit()
{
	bulletPool = Pool.create(Bullet, 40);
	bullets = [];
}

function asteroidInit()
{
	asteroidPool = Pool.create(Asteroid, 30);
	asteroids = [];
}

function shipInit()
{
    for(var i = 0; i < players.length; i++)
    {
        players[i].ship = Ship.create((screenWidth >> 1) - 150 + (100*i), screenHeight >> 1, this);
    }
}

function loop()
{
    try {checkControllerInputs();} catch (e) {}

	updateShips();
	// updateWallParticles();
	updateParticles();
	// updateBullets();
	// updateAsteroids();

	// checkCollisions();

	render();

	getAnimationFrame(loop);
}

function updateShips()
{
    for(var i = 0; i < players.length; i++)
    {
        var ship = players[i].ship;

        ship.update();

        if(ship.idle) continue;

        if(playerInput[i][0] != 0) ship.angle += (ship.TURN_SPEED * playerInput[i][0]); // LEFT and RIGHT

        ship.thrust.setLength(ship.ACCELERATION * playerInput[i][1]); // THRUST
        ship.thrust.setAngle(ship.angle);

        // if(playerInput[i][2]) ship.shoot(ship); // FIRE

        if(playerInput[i][3]) {
            // generateWallParticle(ship);
        } else {
            generateThrustParticle(ship);
        }

        if(ship.pos.getX() > screenWidth) ship.pos.setX(0);
        else if(ship.pos.getX() < 0) ship.pos.setX(screenWidth);

        if(ship.pos.getY() > screenHeight) ship.pos.setY(0);
        else if(ship.pos.getY() < 0) ship.pos.setY(screenHeight);




    }
}

function generateThrustParticle(ship)
{
    if(Math.random() < ship.thrust.getLength() / ship.ACCELERATION)
    {
        var p = particlePool.getElement();

        //if the particle pool doesn't have more elements, will return 'null'.

        if(!p) return;

        p.radius = Math.random() * 3 + 2;
        p.color = '#FFF';
        p.lifeSpan = 80;
        p.pos.setXY(ship.pos.getX() + Math.cos(ship.angle) * -14, ship.pos.getY() + Math.sin(ship.angle) * -14);
        p.vel.setLength((8 / p.radius) * (ship.thrust.getLength() / ship.ACCELERATION));
        p.vel.setAngle(ship.angle + (1 - Math.random() * 2) * (Math.PI / 18));
        p.vel.mul(-1);

        //particles[particles.length] = p; same as: particles.push(p);

        particles[particles.length] = p;
    }
}

function generateWallParticle(ship)
{
    var w = ship.wallParticlePool.getElement();

	//if the pool doesn't have more elements, will return 'null'.

	if(!w) w = ship.wallParticles.shift(); w.reset();

	w.radius = Math.random() * 3 + 3;
	w.color = ship.color;
	w.lifeSpan = 240;
	w.pos.setXY(ship.pos.getX() + Math.cos(ship.angle) * -14, ship.pos.getY() + Math.sin(ship.angle) * -14);
	w.vel.setLength(4 / w.radius);
	w.vel.setAngle(ship.angle + (1 - Math.random() * 2) * (Math.PI / 18));
	w.vel.mul(-1);

	//particles[particles.length] = p; same as: particles.push(p);

	ship.wallParticles[ship.wallParticles.length] = w;
}

function updateWallParticles()
{
    for(var i = 0; i < players.length; i++)
    {
        var ship = players[i].ship;

        var j = ship.wallParticles.length - 1;

        for(j; j > -1; --j)
        {
            var w = ship.wallParticles[j];

            if(w.blacklisted)
            {
                w.reset();

                ship.wallParticles.splice(ship.wallParticles.indexOf(w), 1);
                ship.wallParticlePool.disposeElement(w);

                continue;
            }

            w.update();
        }

    }
}

function updateParticles()
{
	var i = particles.length - 1;

	for(i; i > -1; --i)
	{
		var p = particles[i];

		if(p.blacklisted)
		{
			p.reset();

			particles.splice(particles.indexOf(p), 1);
			particlePool.disposeElement(p);

			continue;
		}

		p.update();
	}
}

function updateBullets()
{
	var i = bullets.length - 1;

	for(i; i > -1; --i)
	{
		var b = bullets[i];

		if(b.blacklisted)
		{
			b.reset();

			bullets.splice(bullets.indexOf(b), 1);
			bulletPool.disposeElement(b);

			continue;
		}

		b.update();

		if(b.pos.getX() > screenWidth) b.blacklisted = true;
		else if(b.pos.getX() < 0) b.blacklisted = true;

		if(b.pos.getY() > screenHeight) b.blacklisted = true;
		else if(b.pos.getY() < 0) b.blacklisted = true;
	}
}

function updateAsteroids()
{
	var i = asteroids.length - 1;

	for(i; i > -1; --i)
	{
		var a = asteroids[i];

		if(a.blacklisted)
		{
			a.reset();

			asteroids.splice(asteroids.indexOf(a), 1);
			asteroidPool.disposeElement(a);

			continue;
		}

		a.update();

		if(a.pos.getX() > screenWidth + a.radius) a.pos.setX(-a.radius);
		else if(a.pos.getX() < -a.radius) a.pos.setX(screenWidth + a.radius);

		if(a.pos.getY() > screenHeight + a.radius) a.pos.setY(-a.radius);
		else if(a.pos.getY() < -a.radius) a.pos.setY(screenHeight + a.radius);
	}

	if(asteroids.length < 5)
	{
		var factor = (Math.random() * 2) >> 0;

		generateAsteroid(screenWidth * factor, screenHeight * factor, 60 , 'b');
	}
}

function generateAsteroid(x, y, radius, type)
{
	var a = asteroidPool.getElement();

	//if the bullet pool doesn't have more elements, will return 'null'.

	if(!a) return;

	a.radius = radius;
	a.type = type;
	a.pos.setXY(x, y);
	a.vel.setLength(1 + asteroidVelFactor);
	a.vel.setAngle(Math.random() * (Math.PI * 2));

	//bullets[bullets.length] = b; same as: bullets.push(b);

	asteroids[asteroids.length] = a;
	asteroidVelFactor += 0.025;
}

function checkCollisions()
{
	checkBulletAsteroidCollisions();
	checkShipAsteroidCollisions();
	checkBulletShipCollisions();
    checkWallShipCollisions();
    checkWallBulletCollisions();
    checkWallAsteroidCollisions();
}

function checkBulletAsteroidCollisions()
{
	var i = bullets.length - 1;
	var j;

	for(i; i > -1; --i)
	{
		j = asteroids.length - 1;

		for(j; j > -1; --j)
		{
			var b = bullets[i];
			var a = asteroids[j];

			if(checkDistanceCollision(b, a))
			{
				b.blacklisted = true;

				destroyAsteroid(a);
			}
		}
	}
}

function checkShipAsteroidCollisions()
{
	for(var i = 0; i < players.length; i++)
    {
        var j = asteroids.length - 1;

        for(j; j > -1; --j)
        {
            var a = asteroids[j];
            var s = players[i].ship;

            if(checkDistanceCollision(a, s))
            {
                if(s.idle) return;

                s.idle = true;

                generateShipExplosion(s);
                destroyAsteroid(a);
            }
        }
    }
}

function checkBulletShipCollisions()
{
	var i = bullets.length - 1;
	var j;

	for(i; i > -1; --i)
	{
        var b = bullets[i];

        for(var j = 0; j < players.length; j++)
        {
            var s = players[j].ship;

            if(b.color != s.color)
            {
                if(checkDistanceCollision(b, s))
                {
                    if(s.idle) return;

                    s.idle = true;

                    b.blacklisted = true;

                    generateShipExplosion(s);
                }
            }
        }
	}
}

function checkWallShipCollisions()
{
	var i = players.length - 1;
	var j, k;

	for(i; i > -1; --i)
	{
		j = players.length - 1;

		for(j; j > -1; --j)
		{
            if(players[i] === players[j]) continue;
            var s = players[i].ship;

            k = players[j].ship.wallParticles.length - 1;

            for(k; k > -1; --k)
            {
                var w = players[j].ship.wallParticles[k];

                if(checkDistanceCollision(s, w))
                {
                    if(s.color != w.color)
                    {
                        if(s.idle) return;
                        s.idle = true;

                        generateShipExplosion(s);
                    }
                }
            }
		}
	}
}

function checkWallBulletCollisions()
{
	var i = bullets.length - 1;
	var j, k;

	for(i; i > -1; --i)
	{
		j = players.length - 1;

		for(j; j > -1; --j)
		{
            k = players[j].ship.wallParticles.length - 1;

            for(k; k > -1; --k)
            {
                var b = bullets[i];
                var w = players[j].ship.wallParticles[k];

                if(b.color != w.color)
                {
                    if(checkDistanceCollision(b, w))
                    {
                        b.blacklisted = true;
                        w.damage(b.hp);
                    }
                }

            }

		}
	}
}

function checkWallAsteroidCollisions()
{
    var i = asteroids.length - 1;
	var j, k;

	for(i; i > -1; --i)
	{
		j = players.length - 1;

		for(j; j > -1; --j)
		{
            k = players[j].ship.wallParticles.length - 1;

            for(k; k > -1; --k)
            {
                var a = asteroids[i];
                var w = players[j].ship.wallParticles[k];


                if(checkDistanceCollision(a, w))
                {
                    destroyAsteroid(a);
                    w.damage(10);
                }


            }

		}
	}
}

function generateShipExplosion(ship)
{
	var i = 18;

	for(i; i > -1; --i)
	{
		var p = particlePool.getElement();

		//if the particle pool doesn't have more elements, will return 'null'.

		if(!p) return;

		p.radius = Math.random() * 6 + 2;
		p.lifeSpan = 80;
		p.color = ship.color;
		p.vel.setLength(20 / p.radius);
		p.vel.setAngle(ship.angle + (1 - Math.random() * 2) * doublePI);
		p.pos.setXY(ship.pos.getX() + Math.cos(p.vel.getAngle()) * (ship.radius * 0.8), ship.pos.getY() + Math.sin(p.vel.getAngle()) * (ship.radius * 0.8));

		//particles[particles.length] = p; same as: particles.push(p);

		particles[particles.length] = p;
	}
}

function checkDistanceCollision(obj1, obj2)
{
	var vx = obj1.pos.getX() - obj2.pos.getX();
	var vy = obj1.pos.getY() - obj2.pos.getY();
	var vec = Vec2D.create(vx, vy);

	if(vec.getLength() < obj1.radius + obj2.radius)
	{
		return true;
	}

	return false;
}

function destroyAsteroid(asteroid)
{
	asteroid.blacklisted = true;

	generateAsteroidExplosion(asteroid);
	resolveAsteroidType(asteroid);
}

function generateAsteroidExplosion(asteroid)
{
	var i = 18;

	for(i; i > -1; --i)
	{
		var p = particlePool.getElement();

		//if the particle pool doesn't have more elements, will return 'null'.

		if(!p) return;

		p.radius = Math.random() * (asteroid.radius >> 2) + 2;
		p.lifeSpan = 80;
		p.color = '#FFF';//'#FF5900';
		p.vel.setLength(20 / p.radius);
		p.vel.setAngle(0/**/ + (1 - Math.random() * 2) * doublePI);
		p.pos.setXY(asteroid.pos.getX() + Math.cos(p.vel.getAngle()) * (asteroid.radius * 0.8), asteroid.pos.getY() + Math.sin(p.vel.getAngle()) * (asteroid.radius * 0.8));

		//particles[particles.length] = p; same as: particles.push(p);

		particles[particles.length] = p;
	}
}

function resolveAsteroidType(asteroid)
{
	switch(asteroid.type)
	{
		case 'b':

		generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 40, 'm');
		generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 40, 'm');

		break;

		case 'm':

		generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 20, 's');
		generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 20, 's');

		break;
	}
}

function render()
{
	context.fillStyle = '#262626';
	context.globalAlpha = 0.4;
	context.fillRect(0, 0, screenWidth, screenHeight);
	context.globalAlpha = 1;

	renderShip();
	renderParticles();
	// renderBullets();
	// renderAsteroids();
	renderScanlines();
}

function renderShip()
{
    {
        for(var i = 0; i < players.length; i++)
        {
            var ship = players[i].ship;

            //RENDER SHIP WALL

            context.save();

            var j = ship.wallParticles.length - 1;

            for(j; j > -1; --j)
            {
                var w = ship.wallParticles[j];

                context.beginPath();
                context.fillStyle = w.color;
                context.arc(w.pos.getX() >> 0, w.pos.getY() >> 0, w.radius, 0, doublePI);
                if(Math.random() > 0.4) context.fill();
                context.closePath();
            }

            context.restore();

            //RENDER NAME

            context.save();
            context.translate(ship.pos.getX() >> 0, ship.pos.getY() >> 0);
            //context.translate(0, 50);

            context.font = "12px Source Sans pro";
            context.textAlign = "center";
            context.fillStyle = ship.color;
            context.fillText(players[i].name, 0, -20);

            context.restore();

            //RENDER SHIP

            if(ship.idle) continue;

            context.save();
            context.translate(ship.pos.getX() >> 0, ship.pos.getY() >> 0);
            context.rotate(ship.angle);

            context.strokeStyle = ship.color;
            context.lineWidth = (Math.random() > 0.9) ? 2 : 1;
            context.beginPath();
            context.moveTo(10, 0);
            context.lineTo(-10, -10);
            context.lineTo(-10, 10);
            context.lineTo(10, 0);
            context.stroke();
            context.closePath();

            context.restore();

        }

    }
}

function renderParticles()
{
	//inverse for loop = more performance.

	var i = particles.length - 1;

	for(i; i > -1; --i)
	{
		var p = particles[i];

		context.beginPath();
		context.strokeStyle = p.color;
		context.arc(p.pos.getX() >> 0, p.pos.getY() >> 0, p.radius, 0, doublePI);
		if(Math.random() > 0.4) context.stroke();
		context.closePath();
	}
}

function renderBullets()
{
	//inverse for loop = more performance.

	var i = bullets.length - 1;

	for(i; i > -1; --i)
	{
		var b = bullets[i];

		context.beginPath();
		context.strokeStyle = b.color;
		context.arc(b.pos.getX() >> 0, b.pos.getY() >> 0, b.radius, 0, doublePI);
		if(Math.random() > 0.2) context.stroke();
		context.closePath();
	}
}

function renderAsteroids()
{
	//inverse for loop = more performance.

	var i = asteroids.length - 1;

	for(i; i > -1; --i)
	{
		var a = asteroids[i];

		context.beginPath();
		context.lineWidth = (Math.random() > 0.2) ? 4 : 3;
		context.strokeStyle = a.color;

		var j = a.sides;

		context.moveTo((a.pos.getX() + Math.cos(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0, (a.pos.getY() + Math.sin(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0);

		for(j; j > -1; --j)
		{
			context.lineTo((a.pos.getX() + Math.cos(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0, (a.pos.getY() + Math.sin(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0);

		}

		if(Math.random() > 0.2) context.stroke();

		context.closePath();
	}
}

function renderScanlines()
{
	//inverse for loop = more performance.

	var i = hScan;

	context.globalAlpha = 0.05;
	context.lineWidth = 1;

	for(i; i > -1; --i)
	{
		context.beginPath();
		context.moveTo(0, i * 4);
		context.lineTo(screenWidth, i * 4);
		context.strokeStyle = (Math.random() > 0.0001) ? '#FFF' : '#222';
		context.stroke();
	}

	context.globalAlpha = 1;
}

function generateShot(ship)
{
	var b = bulletPool.getElement();

	//if the bullet pool doesn't have more elements, will return 'null'.

	if(!b) return;

	b.radius = 2;
    b.color = ship.color;//'#FFF';
	b.pos.setXY(ship.pos.getX() + Math.cos(ship.angle) * 14, ship.pos.getY() + Math.sin(ship.angle) * 14);
	b.vel.setLength(10);
	b.vel.setAngle(ship.angle + (ship.ACCURACY * ((Math.random() * 2) - 1)));

	//bullets[bullets.length] = b; same as: bullets.push(b);

	bullets[bullets.length] = b;
}

function resetGame()
{
	asteroidVelFactor = 0;

	shipP1.pos.setXY(screenWidth >> 1, screenHeight >> 1);
	shipP1.vel.setXY(0, 0);

	resetAsteroids();
}

function resetAsteroids()
{
	var i = asteroids.length - 1;

	for(i; i > -1; --i)
	{
		var a = asteroids[i];
		a.blacklisted = true;
	}
}

function resetShip(ship)
{
    ship.pos.setXY(screenWidth >> 1, screenHeight >> 1);
	ship.vel.setXY(0, 0);
}
