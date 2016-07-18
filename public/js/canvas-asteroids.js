//canvas-asteroids.js ...........................................................

// var game = (function () {
//   var instance;
//
//   function createInstance() {
//     var object = new Object("I am the instance");
//     return object;
//   }
//
//   // game code
//
//
//   // end game code
//
//   return {
//     getInstance: function () {
//       if (!instance) {
//         instance = createInstance();
//       }
//       return instance;
//     }
//   };
// })();

var saveState = "";

var numOfPlayers = 4;

//common vars

var canvas;
var context;
var screenWidth;
var screenHeight;
var doublePI = Math.PI * 2;

//game vars

var teams = [];
var players = [];

var particlePool;
var particles;

var bulletPool;
var bullets;
//
var asteroidPool;
var asteroids;

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

function start() {
  canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');

	// window.onresize();
	onresize();

  teamsInit();
  playersInit();

	inputInit();
	particleInit();
	bulletInit();
	asteroidInit();
	// shipInit();

  // pregameLogic();

	loop();
}

// window.onload = function()
// {
// 	canvas = document.getElementById('canvas');
// 	context = canvas.getContext('2d');
//
// 	window.onresize();
//
//   teamsInit();
//   playersInit();
//
// 	inputInit();
// 	particleInit();
// 	// bulletInit();
// 	// asteroidInit();
// 	shipInit();
//
//   pregameLogic();
//
// 	loop();
// };

// window.onresize = function()
// {
// 	if(!canvas) return;
//
// 	screenWidth = canvas.clientWidth;
// 	screenHeight = canvas.clientHeight;
//
// 	canvas.width = screenWidth;
// 	canvas.height = screenHeight;
//
// 	hScan = (screenHeight / 4) >> 0;
// };

var onresize = function()
{
	if(!canvas) return;

	screenWidth = canvas.clientWidth;
	screenHeight = canvas.clientHeight;

	canvas.width = screenWidth;
	canvas.height = screenHeight;

	hScan = (screenHeight / 4) >> 0;
};

///////////////////////////

function teamsInit()
{

    createTeam(teamColors[1]);
    createTeam(teamColors[3]);
}

function createTeam(color) {
    teams[teams.length] = Team.create(color);
}

function playersInit() {
  for(var i = 0; i < lobby.length; i++) {
    addPlayer(lobby[i]);
  }
}

function createPlayer(name) {
    if(!name) name = "Player " + (players.length + 1);
    players[players.length] = Player.create(name);
}

function pregameLogic()
{
    designateTeams();
}

function designateTeams()
{
    for(var i = 0; i < players.length; i++) {
        // teams[(i < 2) ? 0 : 1].addPlayer(players[i]);
        teams[i%2].addPlayer(players[i]);
        players[i].ship.color = players[i].team.color;
    }
}

function inputInit()
{
    // var i = players.length - 1;
    //
    // for(i; i > -1; --i)
    // {
    //     //playerInput.push([false, false, false, false, false, false]); //left, up, right, down, fire, block
    //     playerInput.push([0, 0, false, false]); // left -1to1 right axis, down -1to1 up axis, fire toggle, block toggle
    // }



	window.onkeydown = function(e)
	{
    if(game_index === undefined) return;
		switch(e.keyCode)
		{
			//key A or LEFT
			case 65:
      case 37:

			playerInput[game_index][0] = -keypressValue;

			break;

			//key W or UP
			case 87:
      case 38:

			playerInput[game_index][1] = keypressValue;

			break;

			//key D or RIGHT
			case 68:
      case 39:

			playerInput[game_index][0] = keypressValue;

			break;

			//key S or DOWN
			case 83:
      case 40:

			playerInput[game_index][1] = -keypressValue;

			break;

			//key K or Space
      case 75:
      case 32:

			playerInput[game_index][2] = true;

			break;

			//key L or C
      case 76:
      case 67:

			playerInput[game_index][3] = true;

			break;

			case 49: // 1 key
				saveState = JSON.stringify({shipData: players[0].ship.data()});
				break;
			case 50: // 2 key
				players[0].ship = Ship.load(JSON.parse(saveState).shipData);
				break;
		}
    // broadcastChange();
    e.preventDefault();
	};

	window.onkeyup = function(e)
	{
    if(game_index === undefined) return;
		switch(e.keyCode)
		{
			//key A or LEFT
			case 65:
      case 37:

			playerInput[game_index][0] = 0;

			break;

			//key W or UP
			case 87:
      case 38:

			playerInput[game_index][1] = 0;

			break;

			//key D or RIGHT
			case 68:
      case 39:

			playerInput[game_index][0] = 0;

			break;

			//key S or DOWN
			case 83:
      case 40:

			playerInput[game_index][1] = 0;

			break;

			//key K or Space
      case 75:
      case 32:

			playerInput[game_index][2] = false;

			break;

			//key L or C
      case 76:
      case 67:

			playerInput[game_index][3] = false;

			break;
		}
    // broadcastChange();
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
    playerInput[game_index][0] = (val < -deadZone || val > deadZone) ? (val - deadZone) / (1 - deadZone) : 0;

    // UP
    deadZone = 0.0;
    val = navigator.getGamepads()[controller].axes[3]; val = (val + 1) / 2;
    playerInput[game_index][1] = (val > deadZone) ? (val - deadZone) / (1 - deadZone) : 0;
    //playerInput[2][1] = (navigator.getGamepads()[controller].axes[1] < -deadZone) ? true : false;

    // DOWN

    // FIRE

    playerInput[game_index][2] = navigator.getGamepads()[controller].buttons[3].pressed;

    // BLOCK

    //playerInput[0][5] = ((navigator.getGamepads()[controller].axes[3] + 1)/2 > deadZone) ? true : false;
    playerInput[game_index][3] = navigator.getGamepads()[controller].buttons[7].pressed;


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
  if(game_index !== undefined) {
    try {checkControllerInputs();} catch (e) {}

  	updateShip();
  	updateWallParticles();
  	updateParticles();
  	updateBullets();
  	// updateAsteroids();

  	checkCollisions();

  	render();
  }
	getAnimationFrame(loop);
}

function updateShip()
{
  var ship = players[game_index].ship;

  ship.update();

  if(ship.idle) return;

  if(playerInput[game_index][0] != 0) ship.angle += (ship.TURN_SPEED * playerInput[game_index][0]); // LEFT and RIGHT

  ship.thrust.setLength(ship.ACCELERATION * playerInput[game_index][1]); // THRUST
  ship.thrust.setAngle(ship.angle);

  if(playerInput[game_index][2]) ship.shoot(ship); // FIRE

  if(playerInput[game_index][3]) {
      generateWallParticle(ship);
  } else {
      generateThrustParticle(ship);
  }

  if(ship.pos.getX() > screenWidth) ship.pos.setX(0);
  else if(ship.pos.getX() < 0) ship.pos.setX(screenWidth);

  if(ship.pos.getY() > screenHeight) ship.pos.setY(0);
  else if(ship.pos.getY() < 0) ship.pos.setY(screenHeight);

  broadcastShip();
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

        broadcastParticle(p);
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
	// checkBulletAsteroidCollisions();
	// checkShipAsteroidCollisions();
	checkBulletShipCollisions();
    // checkWallShipCollisions();
    // checkWallBulletCollisions();
    // checkWallAsteroidCollisions();
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
		if(b.game_index != game_index) continue;

    for(var j = 0; j < players.length; j++)
    {

      var s = players[j].ship;
			if(s.idle) continue;

      if(b.color != s.color)
      {
        if(checkDistanceCollision(b, s))
        {
          collideS(j);
					collideB(b);
        }
      }
    }
	}
}

function popShip(s) {
	s.idle = true;
	generateShipExplosion(s);
}

function stopBullet(b) {
	b.blacklisted = true;
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
	renderBullets();
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

	b.game_index = game_index;
	b.timestamp = Date.now();

	b.radius = 2;
  b.color = ship.color;//'#FFF';
	b.pos.setXY(ship.pos.getX() + Math.cos(ship.angle) * 14, ship.pos.getY() + Math.sin(ship.angle) * 14);
	b.vel.setLength(10);
	b.vel.setAngle(ship.angle + (ship.ACCURACY * ((Math.random() * 2) - 1)));

	//bullets[bullets.length] = b; same as: bullets.push(b);

	bullets[bullets.length] = b;

  broadcastBullet(b);
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
