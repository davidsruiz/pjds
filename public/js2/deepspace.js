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
    this.mapInfo = DeepSpaceGame.maps[0];
    this.gameMode = 'ctf'; // data.mode;

    // everything else:
    this.setupData = data;
  }

  setup() {
    this.setupModel();
    this.setupView();
    this.setupListeners();
    this.setupPhysics();
    this.setupLoop();
    this.setupCaches();
  }

  setupModel() {
    this.setupTeams();
    this.setupPlayers();
    this.setupShips();
    this.setupObjectPools();

    this.setupGame();
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
    model.blocks = new Map();
    model.pulses = new Map();

    this.model = model;
  }

  setupGame() {
    this.game = {};
    // this.timer = DeepSpaceGame.modes[this.gameMode];
    switch(this.gameMode) {
      case "ctf":

        var centerX = this.mapInfo.width / 2;
        var centerY = this.mapInfo.height / 2;
        this.game.flag = new Flag(new V2D(centerX, centerY));

        break;
    }
  }

  setupView() {
    this.setupPalette();
    this.configureCreateJS();
    this.setupCamera();
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
    // canvas.width = 1024;
    // canvas.height = 768;
    canvas.width = 480;
    canvas.height = 320;

    var stage = new createjs.Stage();
    stage.canvas = canvas;

    this.stage = stage;
  }

  createViews() {
    this.view = {};

    this.createCanvasBackgroundView();

    this.createMapViews();
    this.createGameViews();
    this.createShipViews();
    this.createPoolViews();
    // this.createParticleViews();
  }

  createCanvasBackgroundView() { // (rethink)
    var canvas = this.stage.canvas, background = new createjs.Shape();
    background.graphics.beginFill('#37474F').drawRect(0, 0, canvas.width, canvas.height);
    this.stage.addChild(background);
  }

  createMapViews() {
    var map = new createjs.Container();

    var background = new createjs.Shape();
    background.graphics.beginFill('#455A64').drawRect(0, 0, this.mapInfo.width, this.mapInfo.height);

    map.addChild(background);
    this.stage.addChild(map);
    this.view.map = map;
  }

  createGameViews() {
    switch(this.gameMode) {
      case "ctf":
        // ring and flag

        var centerX = this.mapInfo.width / 2;
        var centerY = this.mapInfo.height / 2;

        var ring = new createjs.Shape(
          DeepSpaceGame.graphics.ring(DeepSpaceGame.modes["ctf"].ring_radius)
        );

        var flag = new createjs.Shape(
          DeepSpaceGame.graphics.flag(DeepSpaceGame.modes["ctf"].flag_radius)
        );

        ring.x = centerX; ring.y = centerY;
        flag.x = centerX; flag.y = centerY;

        this.view.map.addChild(ring);
        this.view.map.addChild(flag);

        this.view.flag = flag;

        break;
    }
  }

  createShipViews() {
    this.ships.forEach((ship) => {
      var hollow = DeepSpaceGame.graphics.ship[ship.owner.type][0](ship.owner.team.color, ship.isMain ? 4 : 2),
          filled = DeepSpaceGame.graphics.ship[ship.owner.type][1](ship.owner.team.color, ship.isMain ? 4 : 2);
      var view = new createjs.Shape(hollow);
      view.hollow = hollow, view.filled = filled;
      this.view.map.addChild(ship.view = view);
    });
  }

  createPoolViews() {
    this.view.bullets = new Map()
    this.view.blocks = new Map()
    this.view.pulses = new Map()
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

  setupCamera() {
    this.camera = new Camera(this.stage.canvas, this.view.map, this.ships.main.view);
  }

  setupListeners() { // (needs work)
    // forward :  0 to 1
    // turn    : -1 to 1
    // shoot   : true or false
    // block   : true or false
    // pulse : true or false

    var receiver = window;
    var keypressWeight = 0.85;

    var playerInput = new Map([["forward", 0], ["turn", 0], ["shoot", false], ["block", false], ["pulse", false]]);

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
      ["block", [88, 76], true, false],
      // block: c , ;
      ["pulse", [67, 186], true, false]
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

  setupPhysics() {
    this.setupReferenceGroups();
  }

  setupReferenceGroups() {
    var refGroups = {};

    refGroups.enemyBlocks = new Set();
    refGroups.enemyPulses = new Set();

    // this.collisionGroups = groups;
    this.refGroups = refGroups;
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

    this.updateGame();

    this.updateView();
  }

  updateInput() {
    this.updateGamepadInput();
  }

  // updateGamepadInput() {}

  updateModel() {
    this.updateShip();
    this.broadcastShip();

    this.updateBullets();
    this.updateBlocks();
    this.updatePulses();
  }

  updateShip() {
    var ship;
    if(ship = this.ships.main) {

      ship.update();
      if(ship.disabled) return;

      var input = ship.owner.input;

      ship.acceleration.length = ship.LINEAR_ACCELERATION_LIMIT * input.get('forward');
      ship.acceleration.angle = ship.angle;

      ship.angular_acceleration = ship.ANGULAR_ACCELERATION_LIMIT * input.get('turn');

      if(input.get('shoot')) ship.shoot();
      if(input.get('block')) ship.block();
      if(input.get('pulse')) ship.pulse();


      // validate new position (revise)
      if(ship.position.x < 0) ship.position.x = this.mapInfo.width;
      if(ship.position.y < 0) ship.position.y = this.mapInfo.height;
      if(ship.position.x > this.mapInfo.width) ship.position.x = 0;
      if(ship.position.y > this.mapInfo.height) ship.position.y = 0;
    }
  }

  broadcastShip() {
    var ship;
    if(ship = this.ships.main) {
      NetworkHelper.sendShip(ship);
    }
    if(ship.flag && ship.disabled && !this.game.flag.idle) NetworkHelper.out_flag_drop();
  }

  updateBullets() {
    this.model.bullets.forEach(b => { b.update(); if(b.disabled) NetworkHelper.out_bullet_destroy(b.id) });
  }

  updateBlocks() { // needs needs work
    this.model.blocks.forEach(b => { if(b.locked) return;
      b.update();
      if(b.qualified) {
        if(b.team != this.ships.main.owner.team.number) this.refGroups.enemyBlocks.add(b.id);
        b.locked = true;
      }
      // if(b.disabled) NetworkHelper.out_block_destroy(b.id) // due to aging
    });
  }

  updatePulses() {
    this.model.pulses.forEach(p => {
      p.update(); if(p.disabled) NetworkHelper.out_pulse_destroy(p.id);


      // field effects
      var distance, direction;
      this.model.bullets.forEach((b)=>{
        if(!b.disabled && p.team != b.team) {
          if((distance = Physics.distance(b.position, p.position)) < p.RANGE) {
            var force = new V2D(); direction = p.position.copy(); direction.sub(b.position);
            force.length = p.INTENSITY_FUNCTION(distance);
            force.angle = direction.angle;// - Math.PI; // uncomment for repulsion
            b.velocity.add(force);
            b.velocity.length *= 0.94; // friction
          }
        }
      });
    });

  }

  checkForCollisions() {
    // in theory, the user will only check
    // collisions of those things which it
    // created. though in practice, perhaps
    // just it's attack moves. e.g. bullets

    this.bulletCollisions();
    this.shipCollisions();
    this.pulseCollisions();
  }

  bulletCollisions() {
    this.bulletShipCollisions();
    this.bulletBlockCollisions();
  }

  bulletShipCollisions() {
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

  bulletBlockCollisions() {
    this.ships.main.bullets.forEach((id, same, set) => {
      var b = this.model.bullets.get(id);
      if(b && !b.disabled) {
        // check against enemy blocks
        this.refGroups.enemyBlocks.forEach(blockID => {
          var block = this.model.blocks.get(blockID);
          if(block && !block.disabled) {
            if(Physics.doTouch(block, b)) {
              NetworkHelper.out_block_damage(block.id, b.hp);
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

  shipCollisions() {
    this.shipBlockCollisions();
    this.shipFlagCollisions();
  }

  shipBlockCollisions() {
    var ship = this.ships.main; if(ship.disabled) return;
    this.refGroups.enemyBlocks.forEach(blockID => {
      var block = this.model.blocks.get(blockID);
      if(block && !block.disabled) {
        if(Physics.doTouch(ship, block)) {
          NetworkHelper.out_block_destroy(block.id);
        }
      }
    });
  }

  shipFlagCollisions() {
    if(this.gameMode != 'ctf') return;
    var ship = this.ships.main, flag = this.game.flag;
    if(!ship.disabled && flag.idle)
      if(Physics.doTouch(ship, flag))
        NetworkHelper.out_flag_pickup(ship.owner.id);

  }

  pulseCollisions() {
    this.pulseBlockCollisions();
  }

  pulseBlockCollisions() {
    var p, b;
    this.ships.main.pulses.forEach(id => {
      if((p = this.model.pulses.get(id)) && !p.disabled) {
        this.refGroups.enemyBlocks.forEach(blockID => {
          if((b = this.model.blocks.get(blockID)) && !b.disabled) {
            if(Physics.doTouch(p, b)) {
              NetworkHelper.out_pulse_destroy(p.id);
              NetworkHelper.out_block_destroy(b.id);
            }
          }
        });
      }
    });
  }

  updateGame() {
    var flag = this.game.flag;
    if(flag.idle) return;

    var p = this.players.get(flag.holderID).ship.position;
    flag.position.x = p.x;
    flag.position.y = p.y;

  }

  updateView() {
    this.updateShipViews();
    this.updateBulletViews();
    this.updateBlockViews();
    this.updatePulseViews();

    this.updateCamera();

    // this.updateGameViews();

    this.stage.update(); // render changes!!
  }

  updateShipViews() {
    this.ships.forEach((ship)=>{

      var hide = ship.disabled //|| Math.flipCoin(0.02);
      // ship.view.alpha = (hide ? 0 : 1); // randomization for 'flicker effect'

      ship.view.alpha = ship.health;

      ship.view.x = ship.position.x;
      ship.view.y = ship.position.y;

      ship.view.rotation = Math.degrees(ship.angle);

      // ship.view.graphics.clear();
      ship.view.graphics = ((ship.flag) ? ship.view.filled : ship.view.hollow);
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

  updateBlockViews() {
    var views = this.view.blocks;
    this.model.blocks.forEach(b => {
      var v = views.get(b.id);
      if(v) {
        v.x = b.position.x;
        v.y = b.position.y; //log(v);
        v.alpha = b.health;
        v.graphics.command.radius = b.radius;
      }
    });
  }

  updatePulseViews() {
    var views = this.view.pulses;
    this.model.pulses.forEach(p => {
      var v = views.get(p.id);
      if(v) {
        v.x = p.position.x;
        v.y = p.position.y;
        v.rotation = Math.degrees(p.rotation);
      }
    });
  }

  updateCamera() {
    this.camera.update();
    // if(camera.position)
  }

  updateGameViews() {
    var v = this.view.flag, flag = this.game.flag; log(flag.position);

    v.x = flag.position.x;
    v.y = flag.position.y;
    v.alpha = flag.idle ? 1 : 0;
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

  end() {
    // deinit()
  }

  // maybe..

  startBullet(data) {
    var b = new Bullet(data);

    // create a view for it.
    var bv = new createjs.Shape(
      DeepSpaceGame.graphics.particle(this.teams[b.team].color, b.radius)
    );
    this.view.map.addChild(bv);

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
      this.view.map.removeChild(v);
    }

  }

  startBlock(data) {
    var bl = new Block(data);

    // create a view for it.
    var blv = new createjs.Shape(
      DeepSpaceGame.graphics.block(this.teams[bl.team].color, bl.radius)
    );
    this.view.map.addChild(blv);

    this.model.blocks.set(bl.id, bl);
    this.view.blocks.set(bl.id, blv);

    return bl;
  }

  endBlock(id) {
    var b = this.model.blocks.get(id);
    if(!b) return false;

    this.model.blocks.delete(id);
    this.ships.main.blocks.delete(id);

    if(b.locked) this.refGroups.enemyBlocks.delete(b.id);

    // erase the view for it.
    var v = this.view.blocks.get(id);
    if(v) {
      this.view.blocks.delete(id);
      this.view.map.removeChild(v);
    }
    return true;
  }

  startPulse(data) {
    var p = new Pulse(data);

    // create a view for it.
    var pv = new createjs.Shape(
      DeepSpaceGame.graphics.attractor(this.teams[p.team].color)
    );
    this.view.map.addChild(pv);

    this.model.pulses.set(p.id, p);
    this.view.pulses.set(p.id, pv);

    if(p.team != this.ships.main.owner.team.number) this.refGroups.enemyPulses.add(p.id);

    return p;
  }

  endPulse(id) {
    var p = this.model.pulses.get(id);
    if(!p) return false;

    this.model.pulses.delete(id);
    this.ships.main.pulses.delete(id);

    this.refGroups.enemyPulses.delete(p.id);

    // erase the view for it.
    var v = this.view.pulses.get(id);
    if(v) {
      this.view.pulses.delete(id);
      this.view.map.removeChild(v);
    }
    return true;
  }

  pickupFlag(playerID) {
    var flag = this.game.flag, ship = null;
    if(!flag.idle) NetworkHelper.out_flag_drop();
    flag.holderID = playerID;

    if(ship = this.players.get(flag.holderID).ship)
      ship.pickup(flag);

    this.updateGameViews();
  }

  dropFlag() {
    var id, flag = this.game.flag, ship = null;
    if(id = flag.holderID) {
      if(ship = this.players.get(flag.holderID).ship)
        ship.drop(flag);

      flag.reset();
    }

    this.updateGameViews();
  }


  deinit() {

  }

}

DeepSpaceGame.graphics = {
  ship: {
    "balanced": [(color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(10, 0).lineTo(-10, -10).lineTo(-10, 10).lineTo(10, 0).lineTo(-10, -10),
                 (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(10, 0).lineTo(-10, -10).lineTo(-10, 10).lineTo(10, 0).lineTo(-10, -10)]
  },
  particle: (color, size) => new createjs.Graphics().beginStroke(color).setStrokeStyle(2).drawCircle(0, 0, size),
  // bullet: (color) => DeepSpaceGame.graphics.particle(color)
  block: (color, size) => new createjs.Graphics().beginFill(color).drawCircle(0, 0, size),
  attractor: color => new createjs.Graphics().beginFill(color).moveTo(2, 2).lineTo(2, 8).lineTo(-2, 8).lineTo(-2, 2).lineTo(-8, 2).lineTo(-8, -2).lineTo(-2, -2).lineTo(-2, -8).lineTo(2, -8).lineTo(2, -2).lineTo(8, -2).lineTo(8, 2).lineTo(2, 2),


  ring: r => new createjs.Graphics().beginStroke("#ECEFF1").setStrokeStyle(16).drawCircle(0, 0, r),
  flag: r => new createjs.Graphics().beginFill("#ECEFF1").drawCircle(0, 0, r)
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

DeepSpaceGame.maps = [
  {
    name: "The Event Horizon",
    // width: 1920, height: 1920,
    width: 1024, height: 1024,
    spawn: [
      [{x: 30, y: 30}, {x: 30, y: 60}, {x: 60, y: 60}, {x: 60, y: 30}],
      [{x: 450, y: 290}, {x: 450, y: 260}]
    ]
  }
];

DeepSpaceGame.modes = {
  ctf: { // capture the flag
    ring_radius: 720,
    flag_radius: 12,
    time_limit: FRAMES.mins(3)
  }
};
