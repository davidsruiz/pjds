// deep space js by david ruiz.



class DeepSpaceGame {

  // at initialization we can assume the environment
  // knows certain game parameters:
  // - map
  // - game mode
  // - players: amount, names, ship types, indexes,
  constructor(data) {
    this.interpret(data);
    this.setup();
    this.loop();
  }

  static start(data) {
    return new DeepSpaceGame(data);
  }

  interpret(data) {
    // anything pertaining to game
    // object itself gets set
    this.isHost = data.host;

    // everything else:
    this.setupData = data;
  }

  setup() {
    this.setupModel();
    this.setupView();
    this.setupListeners();
    this.setupLoop();
    this.setupCaches();
  }

  setupModel() {
    this.setupTeams();
    this.setupPlayers();
    this.setupShips();
    this.setupObjectPools();
  }

  setupTeams() {
    this.teams = [];
    var teamCount = this.setupData.teams;
    teamCount.times((i) => { this.teams.push(new Team(this, i)) });
  }

  setupPlayers() {
    this.players = new Map();
    this.teams.forEach((team, i) => {
      this.setupData.players.filter((e) => e.team == i).forEach((player) => {
        var {name, type, id} = player;
        team.createPlayer(id, name, type);
      });
    });
  }

  setupShips() {
    this.ships = []
    this.players.forEach((player) => {
      var ship;
      if( localIDMatches(player.id) ) {
        ship = new Ship(player);
        ship.isMain = true;
        this.ships.main = ship;
      } else {
        ship = new BasicShip(player);
      }
      this.ships.push(ship);
      player.ship = ship;
    });
  }

  setupObjectPools() {
    var model = {};
    model.bullets = new Map();

    this.model = model;
  }

  setupView() {
    this.setupPalette();
    this.configureCreateJS();
  }

  setupPalette() {
    this.colors = this.setupData.colors;
  }

  configureCreateJS() {
    this.setupCanvas();
    // populate stage
    this.createViews();
  }

  setupCanvas() { // (revise)
    var canvas = $('#canvas')[0];
    canvas.width = 480;
    canvas.height = 320;

    var stage = new createjs.Stage();
    stage.canvas = canvas;

    this.stage = stage;
  }

  createViews() {
    this.createMapView();
    this.createShipViews();
    this.createPoolViews();
    // this.createParticleViews();
  }

  createMapView() { // (rethink)
    var canvas = this.stage.canvas, background = new createjs.Shape();
    background.graphics.beginFill('#455A64').drawRect(0, 0, canvas.width, canvas.height);
    this.stage.addChild(background);
  }

  createShipViews() {
    this.ships.forEach((ship) => {
      var view = new createjs.Shape(
        DeepSpaceGame.graphics.ship[ship.owner.type](ship.owner.team.color, ship.isMain ? 4 : 2)
      );
      view.reserve = [], view.using = [];
      this.stage.addChild(ship.view = view);
    });
  }

  createPoolViews() {
    this.view = {
      bullets: new Map()
    };
    // this.createBulletPoolViews();
  }

  createParticleViews() {
    this.ships.forEach((ship) => {
      var view = ship.view;

      DeepSpaceGame.renderingParameters.times(() => {
        var particle = DeepSpaceGame.graphics.particle();
        view.reserve.push(new createjs.Shape);
      });

      this.stage.addChild(ship.view = view);
    });
  }

  setupListeners() { // (needs work)
    // forward :  0 to 1
    // turn    : -1 to 1
    // shoot   : true or false
    // block   : true or false

    var receiver = window;
    var keypressWeight = 0.85;

    var playerInput = new Map([["forward", 0], ["turn", 0], ["shoot", false], ["block", false]]);

    // KEYBOARD
    var values = [
      // up: ▲ , w
      ["forward", [38, 87], keypressWeight, 0],
      // right: ▶︎ , d
      ["turn", [39, 68], keypressWeight, 0],
      // left: ◀︎ , a
      ["turn", [37, 65], -keypressWeight, 0],
      // shoot: z , k
      ["shoot", [90, 75], true, false],
      // block: x , l
      ["block", [88, 76], true, false]
    ];

    var keyHandler = (e) => {
      var type = e.type;

      if(type == 'keyup' || type == 'keydown') {
        var eventCode = e.keyCode;

        values.forEach((row) => {
          row[1].forEach((code) => {
            if(code == eventCode) playerInput.set(row[0], type.is('keyup') ? row[3] : row[2]);
          });
        });
      }
    };

    receiver.addEventListener('keydown', keyHandler); // onkeydown
    receiver.addEventListener('keyup', keyHandler); // onkeyup


    // GAMEPAD
    receiver.addEventListener("gamepadconnected", (e) => this.gamepad = e.gamepad);
    // this closure has access to the playerInput variable.. the alias for this.ships.main.owner.input
    // .. thus it is left here .. please revise
    this.updateGamepadInput = () => {
      var gamepad = navigator.getGamepads()[0];
      if(!gamepad) return;

      var val;

      // UP
      var deadZone = 0.0;
      val = gamepad.axes[3]; val = (val + 1) / 2; // adjusted weird (-1 to 1 back trigger) axis seup
      val = (val > deadZone) ? (val - deadZone) / (1 - deadZone) : 0;
      playerInput.set("forward", val);

      // LEFT and RIGHT
      var deadZone = 0.15;
      val = gamepad.axes[0];
      val = (val < -deadZone || val > deadZone) ? (val - deadZone) / (1 - deadZone) : 0;
      playerInput.set("turn", val);

      // FIRE
      playerInput.set("shoot", gamepad.buttons[3].pressed);

      // BLOCK
      playerInput.set("block", gamepad.buttons[7].pressed);
    };

    // ALIAS
    this.ships.main.owner.input = playerInput;
  }

  setupLoop() {
    var FPS = n => 1000 / n;
    window.getAnimationFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) { window.setTimeout(callback, FPS(60)) };
  }

  setupCaches() {
    this.enemyTeams = this.teams.filter(team => team.number != this.ships.main.owner.team.number);
    this.enemyPlayers = this.enemyTeams.reduce((list, team) => list.concat(team.players), []);
  }

  loop() {
    this.update();
    this.draw();
    this.log();
    getAnimationFrame(()=>this.loop());
  }

  update() {
    // this function duty is as follows:
    // to update all the moving parts pertaining to the current/local user.
    // any collisions should be sent back to the server to sync the changes.
    this.updateInput();
    this.updateModel();
    this.checkForCollisions();

    if(this.isHost) this.generateMapEntities();
  }

  updateInput() {
    this.updateGamepadInput();
  }

  // updateGamepadInput() {}

  updateModel() {
    this.updateShip();
    this.broadcastShip();

    this.updateBullets();
  }

  updateShip() {
    var ship;
    if(ship = this.ships.main) {
      if(ship.disabled) return;

      var input = ship.owner.input;

      ship.acceleration.length = ship.LINEAR_ACCELERATION_LIMIT * input.get('forward');
      ship.acceleration.angle = ship.angle;

      ship.angular_acceleration = ship.ANGULAR_ACCELERATION_LIMIT * input.get('turn');

      if(input.get('shoot')) ship.shoot();
      // if(input.get('block')) ship.block();

      ship.update();

      // validate new position (revise)
      if(ship.position.x < 0) ship.position.x = this.stage.canvas.width;
      if(ship.position.y < 0) ship.position.y = this.stage.canvas.height;
      if(ship.position.x > this.stage.canvas.width) ship.position.x = 0;
      if(ship.position.y > this.stage.canvas.height) ship.position.y = 0;
    }
  }

  broadcastShip() {
    var ship;
    if(ship = this.ships.main) {
      NetworkHelper.sendShip(ship);
    }
  }

  updateBullets() {
    this.model.bullets.forEach(b => { b.update(); if(b.disabled) NetworkHelper.out_bullet_destroy(b.id) });
  }

  checkForCollisions() {
    // in theory, the user will only check
    // collisions of those things which it
    // created. though in practice, perhaps
    // just it's attack moves. e.g. bullets

    this.bulletCollisions();
  }

  bulletCollisions() {
    this.ships.main.bullets.forEach((id, same, set) => {
      var b = this.model.bullets.get(id);
      if(b && !b.disabled) {
        // check against enemy ships
        this.enemyPlayers.forEach(player => {
          var ship = player.ship;
          if(ship && !ship.disabled) {
            if(Physics.doTouch(ship, b)) {
              NetworkHelper.out_ship_damage(player.id, b.hp);
              // ship.damage(b.hp);
              b.disabled = true;
            }
          }
        });
      } else {
        // remove from tracked bullets list ... this.endBullet
        // set.delete(id);
      }
    });
  }

  draw() {
    this.drawShips();
    this.updateBulletViews();

    this.stage.update();
  }

  drawShips() {
    this.ships.forEach((ship)=>{

      var hide = ship.disabled //|| Math.flipCoin(0.02);
      // ship.view.alpha = (hide ? 0 : 1); // randomization for 'flicker effect'

      ship.view.alpha = ship.health;

      ship.view.x = ship.position.x;
      ship.view.y = ship.position.y;

      ship.view.rotation = Math.degrees(ship.angle);
    });
  }

  updateBulletViews() {
    var views = this.view.bullets;
    this.model.bullets.forEach(b => {
      var v = views.get(b.id);
      if(v) {
        v.x = b.position.x;
        v.y = b.position.y;
      }
    });
  }

  log() {
    // var input = this.ships.main.owner.input;
    // var ship = this.ships.main;
    // $('#log').text(`forward: ${input.get('forward')}, turn: ${input.get('turn')}, shoot: ${input.get('shoot')}, block: ${input.get('block')}, `)
//     $('#log').text(
// `    x: ${ship.position.x.round(2)}
//     y: ${ship.position.y.round(2)}
// angle: ${ship.angle.round(2)}`
//     );
  }

  // maybe..

  startBullet(data) {
    var b = new Bullet(data);

    // create a view for it.
    var bv = new createjs.Shape(
      DeepSpaceGame.graphics.particle(this.teams[b.team].color, b.radius)
    );
    this.stage.addChild(bv);

    this.model.bullets.set(b.id, b);
    this.view.bullets.set(b.id, bv);

    return b;
  }

  endBullet(id) {
    var b = this.model.bullets.get(id);
    if(!b) return;

    this.model.bullets.delete(id);
    this.ships.main.bullets.delete(id);

    // erase the view for it.
    var v = this.view.bullets.get(id);
    if(v) {
      this.view.bullets.delete(id);
      this.stage.removeChild(v);
    }

  }

}

DeepSpaceGame.graphics = {
  ship: {
    "balanced": (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(10, 0).lineTo(-10, -10).lineTo(-10, 10).lineTo(10, 0).lineTo(-10, -10)
  },
  particle: (color, size) => new createjs.Graphics().beginStroke(color).setStrokeStyle(2).drawCircle(0, 0, size),
  // bullet: (color) => DeepSpaceGame.graphics.particle(color)
};

DeepSpaceGame.renderingParameters = {
  'bulletCount' : 100,
  'shipThrustParticleCount' : 80
}

// DeepSpaceGame.colors = [
//   '#FF4081', // 0 pink
//   '#FF5252', // 1 red
//   '#FFEA00', // 2 yellow
//   '#00E676', // 3 green
//   '#00B0FF', // 4 blue
//   '#AA00FF', // 5 purple
//   '#ECEFF1', // 6 white
//   '#90A4AE', // 7 light
//   '#37474F', // 8 dark
//   '#263238'  // 9 black
// ];
//
// DeepSpaceGame.colorCombinations = new Map([2, [
//   [1, 4], // red, blue
//   [1, 2], // red, yellow
//   [5, 2], // purple, yellow
//   [2, 4], // yellow, blue
//   [2, 0], // yellow, pink
//   [0, 4], // pink, blue
//   [4, 3]  // blue, green
// ]],
// [3,[
//
// ]]
// );
//
// DeepSpaceGame.maps = [
//   {
//     name: "The Event Horizon",
//     spawn: [
//       [{x: 10, y: 10}, {x: 20, y: 20}],
//       [{x: 758, y: 1014}, {x: 748, y: 1004}]
//     ]
//   }
// ];
