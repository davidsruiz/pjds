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
    if(DeepSpaceGame.runningInstance) DeepSpaceGame.runningInstance.deinit();
    return DeepSpaceGame.runningInstance = new DeepSpaceGame(data);
  }

  interpret(data) {
    // anything pertaining to game
    // object itself gets set
    this.spectate = data.spectate;
    this.isHost = data.host;
    this.mapInfo = DeepSpaceGame.maps[0];
    this.gameMode = 'ctf'; // data.mode;
    this.language = 'en';
    this.soundHelper = SoundHelper.start();

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

    if(this.spectate) this.actualize();
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

    this.setupSpawnCamps();
  }

  setupSpawnCamps() {
    this.teams.forEach(team => {
      team.spawn_camp = {position: V2D.new(DeepSpaceGame.maps[0].spawn[team.game.teams.length][team.number]), radius: 64}
    });
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
      if(localIDMatches(player.id) && !this.spectate) {
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
    this.game.over = false;
    // this.timer = DeepSpaceGame.modes[this.gameMode];
    switch(this.gameMode) {
      case "ctf":

        // flag whatevers
        var centerX = this.mapInfo.width / 2;
        var centerY = this.mapInfo.height / 2;
        this.game.flag = new Flag(new V2D(centerX, centerY));

        // actual game stats
        this.game.scores = Array.new(this.teams.length, 100);
        this.game.max = DeepSpaceGame.modes["ctf"].ring_radius;

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
    canvas.width = 1024;
    canvas.height = 768;
    // canvas.width = 512;
    // canvas.height = 480;

    var stage = new createjs.Stage();
    stage.canvas = canvas;
    stage.snapToPixel = true;

    this.stage = stage;
  }

  createViews() {
    this.view = {};
    this.window = {
      width: this.stage.canvas.width,
      height: this.stage.canvas.height,
    };

    this.createLayers();
    this.createBackgroundViews();
    this.createGameModeSpecificViewsAction();
    this.createSpawnCampViews()
    this.createShipViews();
    this.createPoolViews();
    this.createOverlayViews();
  }


  createLayers() {
    var layer = {}

    layer.background = new createjs.Container();
    layer.action = new createjs.Container();
    layer.overlay = new createjs.Container();

    layer.action.back = new createjs.Container();
    layer.action.front = new createjs.Container();
    layer.action.addChild(layer.action.back);
    layer.action.addChild(layer.action.front);


    this.stage.addChild(layer.background);
    this.stage.addChild(layer.action);
    this.stage.addChild(layer.overlay);

    this.view.layer = layer;
  }

  createBackgroundViews() {
    var canvas = this.stage.canvas, background = new createjs.Shape();
    background.graphics.beginFill('#37474F').drawRect(0, 0, canvas.width, canvas.height);
    this.view.layer.background.addChild(background);

    background = new createjs.Shape();
    background.graphics.beginFill('#455A64').drawRect(0, 0, this.mapInfo.width, this.mapInfo.height);

    this.view.layer.action.back.addChild(background);
  }

  createGameModeSpecificViewsAction() {
    switch(this.gameMode) {
      case "ctf":
        // ring and flag

        var centerX = this.mapInfo.width / 2;
        var centerY = this.mapInfo.height / 2;

        var r = DeepSpaceGame.modes["ctf"].ring_radius, s = r * 1.2;
        var ring = new createjs.Shape(
          DeepSpaceGame.graphics.ring(r)
        );
        ring.cache(-s, -s, s*2, s*2);

        // var r = DeepSpaceGame.modes["ctf"].flag_radius, s = r * 1.2;
        // var flag = new createjs.Shape(
        //   DeepSpaceGame.graphics.flag(DeepSpaceGame.modes["ctf"].flag_radius)
        // );
        // flag.shadow = DeepSpaceGame.graphics.flag_shadow();
        // flag.cache(-s, -s, s*2, s*2);
        //
        ring.x = centerX; ring.y = centerY;
        // flag.x = centerX; flag.y = centerY;


        this.view.layer.action.back.addChild(ring);
        // this.view.layer.action.back.addChild(flag);

        // this.view.flag = flag;

        // actual game things


        break;
    }
  }

  createSpawnCampViews() {

    // DeepSpaceGame.maps[0].spawn[this.owner.team.game.teams.length][this.owner.team.number]
    var s = 64 + 2;
    this.teams.forEach(team => {
      var camp = new createjs.Shape(DeepSpaceGame.graphics.spawn_camp()),
          pos = team.spawn_camp.position;
      camp.x = pos.x;
      camp.y = pos.y;
      camp.cache(-s, -s, s*2, s*2);
      this.view.layer.action.back.addChild(camp);
    });
  }

  createShipViews() {
    this.ships.forEach((ship) => {
      var hollow = DeepSpaceGame.graphics.ship[ship.owner.type][0](ship.owner.team.color, ship.isMain ? 4 : 2),
          filled = DeepSpaceGame.graphics.ship[ship.owner.type][1](ship.owner.team.color, ship.isMain ? 4 : 2);
      var view = new createjs.Shape(hollow);
      view.hollow = hollow, view.filled = filled;
      this.view.layer.action.front.addChild(ship.view = view);
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

  createOverlayViews() {
    var overlay = {};

    overlay.score = new createjs.Container();
    overlay.score.team = [];
    var imagined_width = 120;
    this.teams.forEach((team, i)=>{
      var text = new createjs.Text(this.game.scores[i].toString(), "48px Roboto", team.color);
      text.x = (i * imagined_width) + (imagined_width / 2);
      text.textAlign = "center";
      overlay.score.addChild(text);
      overlay.score.team.push(text);
    });
    overlay.score.x = (this.window.width / 2) - ((this.teams.length * imagined_width) / 2)
    overlay.score.y = 12;

    this.view.layer.overlay.addChild(overlay.score);

    // var imagined_width = 512;
    overlay.message = new createjs.Text("", "24px Roboto"); overlay.message.textAlign = "center";
    overlay.message.x = (this.window.width / 2); overlay.message.y = 76;

    this.view.layer.overlay.addChild(overlay.message);

    // var imagined_width = 512;
    overlay.kill_message = new createjs.Text("", "24px Roboto"); overlay.kill_message.textAlign = "center";
    overlay.kill_message.x = (this.window.width / 2); overlay.kill_message.y = this.window.height - 76;

    this.view.layer.overlay.addChild(overlay.kill_message);

    switch(this.gameMode) {
      case "ctf":
        // var centerX = this.mapInfo.width / 2;
        // var centerY = this.mapInfo.height / 2;

        var r = DeepSpaceGame.modes["ctf"].flag_radius, s = r * 1.2;
        var flag = new createjs.Shape(
          DeepSpaceGame.graphics.flag(DeepSpaceGame.modes["ctf"].flag_radius)
        );
        flag.shadow = DeepSpaceGame.graphics.flag_shadow();
        flag.cache(-s, -s, s*2, s*2);

        // flag.x = centerX; flag.y = centerY;

        this.view.layer.overlay.addChild(flag);
        this.view.flag = flag;

        break;
    }

    this.view.overlay = overlay;
  }

  setupCamera() {
    this.camera = new Camera(this.stage.canvas, this.view.layer.action);

    if(this.spectate) {
      this.activePlayerIndex = 0;
      // this.playerShipViews = new Map();
      // this.setupData.players.forEach((p, i)=>{
      //   this.playerShipViews.set(i, this.players.get(p.id).ship.view);
      // });
      this.activePlayers = this.setupData.players.map(p => this.players.get(p.id));
      this.updateCameraFocus();
    } else {
      this.camera.focus = this.ships.main.view;
    }

    this.camera.width = this.window.width;
    this.camera.height = this.window.height;
  }

  setupListeners() { // (needs (even more) work)
    this.inputHandlers = new Map();
    var receiver = window;

    if(this.spectate) {
      var keyHandler = (e) => {
        if(e.keyCode == 37) { // left: ◀︎
          this.activePlayerIndex--;
          if(this.activePlayerIndex < 0) this.activePlayerIndex = this.activePlayers.length - 1;
        }
        if(e.keyCode == 39) { // right: ▶︎
          this.activePlayerIndex++;
          if(this.activePlayerIndex >= this.activePlayers.length) this.activePlayerIndex = 0;
        }
        this.updateCameraFocus();
      }
      receiver.addEventListener('keydown', keyHandler); // onkeydown
      this.inputHandlers.set('keydown', keyHandler);
    } else {
      // forward :  0 to 1
      // turn    : -1 to 1
      // shoot   : true or false
      // block   : true or false
      // pulse : true or false

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

      this.inputHandlers.set('keydown', keyHandler);
      this.inputHandlers.set('keyup', keyHandler);

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

        // OTHER
        playerInput.set("pulse", gamepad.buttons[0].pressed);
      };

      // ALIAS
      this.ships.main.owner.input = playerInput;
    }
  }

  setupPhysics() {
    this.setupReferenceGroups();
  }

  setupReferenceGroups() {
    var refGroups = {};

    refGroups.enemyBlocks = new Set();
    refGroups.enemyPulses = new Set();

    refGroups.animate = new Set();

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
    if(!this.spectate) {
      // model references
      this.enemyTeams = this.teams.filter(team => team.number != this.ships.main.owner.team.number);
      this.enemyPlayers = this.enemyTeams.reduce((list, team) => list.concat(team.players), []);

      this.player = this.ships.main.owner;
      this.team = this.player.team;
    }
    // create js caches
    this.view.layer.background.cache(0, 0, this.mapInfo.width, this.mapInfo.height);
  }

  actualize() {
    // bring an outside game up to speed

    // flag
    var holder;
    setTimeout(()=>{if(holder = this.setupData.state.flagHolder) this.pickupFlag(holder);}, 100);

    this.setupData.disconnects.forEach(id => this.disconnectPlayer(id))
  }


  loop() {
    this.update();
    this.log();

    getAnimationFrame(()=>this.loop())
  }

  update() {
    // this function duty is as follows:
    // to update all the moving parts pertaining to the current/local user.
    // any collisions should be sent back to the server to sync the changes.
    var over = this.game.over;
    if(!over) this.updateInput();
    this.updateModel();
    if(!over) if(!this.spectate) this.checkForCollisions();
    if(this.isHost) this.generateMapEntities();

    if(!over) this.updateGame();

    this.updateView();
  }

  updateInput() {
    if(!this.spectate) this.updateGamepadInput();
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
      if(ship.flag && ship.disabled && !this.game.flag.idle) NetworkHelper.out_flag_drop();
    }
  }

  updateBullets() {
    this.model.bullets.forEach(b => { b.update(); if(b.disabled) NetworkHelper.out_bullet_destroy(b.id) });
  }

  updateBlocks() { // needs needs work
    this.model.blocks.forEach(b => { if(b.locked) return;
      if(b.qualified) {
        if(!this.spectate) if(b.team != this.team.number) this.refGroups.enemyBlocks.add(b);
        b.locked = true;
        b.qualified = false;
      }
      b.update();
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
    this.bulletSpawnCampCollisions();
  }

  bulletShipCollisions() {
    var main = this.ships.main;
    main.bullets.forEach((id, same, set) => {
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
        this.refGroups.enemyBlocks.forEach(block => {
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

  bulletSpawnCampCollisions() {
    for(let team of this.teams) {
      if(team == this.team) continue;
      this.ships.main.bullets.forEach((id, same, set) => {
        var b = this.model.bullets.get(id);
        if(b && !b.disabled) {
          if(Physics.doTouch(team.spawn_camp, b)) {
            b.disabled = true;
          }
        }
      });
    }
  }

  shipCollisions() {
    this.shipBlockCollisions();
    this.shipFlagCollisions();
  }

  shipBlockCollisions() {
    var ship = this.ships.main; if(ship.disabled) return;
    this.refGroups.enemyBlocks.forEach(block => {
      if(block && !block.disabled) {
        if(Physics.doTouch(ship, block)) {
          // NetworkHelper.out_block_destroy(block.id);
          ship.acceleration.mul(0.1);
          // log('passed')
        }
        // ship.block_friction = (Physics.doTouch(ship, block) ? block.DISRUPTIVE_FRICTION : 0);
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
        this.refGroups.enemyBlocks.forEach(b => {
          if(b && !b.disabled) {
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
    if(!flag.idle) {
      var player = this.players.get(flag.holderID),
          p = player.ship.position;
      flag.position.x = p.x;
      flag.position.y = p.y;

      // real game stuff
      var centerX = this.mapInfo.width / 2, // cache somehow...
          centerY = this.mapInfo.height / 2,
          distance = Physics.distance(p, {x: centerX, y: centerY}),
          percent = distance / this.game.max,
          high_score = this.game.scores[player.team.number],
          current_score = 100 - Math.round(percent * 100);
      if(current_score < high_score) this.game.scores[player.team.number] = current_score;

      if(!(percent < 1)) { this.game.winningTeam = this.players.get(flag.holderID).team; this.end() }
    }




  }

  updateView() {
    this.updateShipViews();
    this.updateBulletViews();
    this.updateBlockViews();
    this.updatePulseViews();

    this.updateCamera();

    this.updateGameViews();

    this.stage.update(); // render changes!!
  }

  updateShipViews() {
    this.ships.forEach((ship)=>{

      var hide = ship.disabled //|| Math.flipCoin(0.02);
      // ship.view.alpha = (hide ? 0 : 1); // randomization for 'flicker effect'

      ship.view.alpha = hide ? 0 : ship.health;

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
      if(v.visible = this.camera.showing(b)) {
        v.x = b.position.x;
        v.y = b.position.y;
      }
    });
  }

  updateBlockViews() {
    var views = this.view.blocks;
    this.model.blocks.forEach(b => {
      var v = views.get(b.id);
      if(true) {
        v.alpha = b.health;
        if(!b.locked) {
          v.x = b.position.x;
          v.y = b.position.y;
          v.graphics.command.radius = b.radius;
        }
      }
      v.visible = this.camera.showing(b)
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

    this.view.overlay.score.team.forEach((text, i)=>{
      text.text = this.game.scores[i];
    })

    this.updateFlagView();

  }

  updateFlagView() {
    var v = this.view.flag, flag = this.game.flag;

    var not_visible = false;
    v.x = flag.position.x + this.camera.plane.x;
    v.y = flag.position.y + this.camera.plane.y;
    var padding = (flag.radius * 2)
    if(v.x < padding) { v.x = padding; not_visible = true; }
    if(v.x > this.window.width - padding) { v.x = this.window.width - padding; not_visible = true; }
    if(v.y < padding) { v.y = padding; not_visible = true; }
    if(v.y > this.window.height - padding) { v.y = this.window.height - padding; not_visible = true; }

    v.alpha = not_visible ? 0.4 : (flag.idle ? 1 : 0);
  }

  updateCameraFocus() {
    this.camera.focus = this.activePlayers[this.activePlayerIndex].ship.view;
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
    this.game.over = true;
    if(this.player) this.resetInput();
    this.deinitListeners();
    NetworkHelper.out_game_over();
    LOBBY.showResults(this.game);
  }

  // maybe..

  startBullet(data) {
    var b = new Bullet(data);

    // create a view for it.
    var bv = new createjs.Shape(
      DeepSpaceGame.graphics.particle(this.teams[b.team].color, b.radius)
    );
    var s = b.radius * 1.2;
    bv.cache(-s, -s, s*2, s*2);
    this.view.layer.action.back.addChild(bv);

    this.model.bullets.set(b.id, b);
    this.view.bullets.set(b.id, bv);

    return b;
  }

  endBullet(id) {
    var b = this.model.bullets.get(id);
    if(!b) return;

    this.model.bullets.delete(id);
    if(!this.spectate) this.ships.main.bullets.delete(id);

    // erase the view for it.
    var v = this.view.bullets.get(id);
    if(v) {
      this.view.bullets.delete(id);
      this.view.layer.action.back.removeChild(v);
    }

  }

  startBlock(data) {
    var bl = new Block(data);

    // create a view for it.
    var blv = new createjs.Shape(
      DeepSpaceGame.graphics.block(this.teams[bl.team].color, bl.radius)
    );
    var s = bl.radius * 1.2;
    blv.cache(-s, -s, s*2, s*2);
    this.view.layer.action.back.addChild(blv);

    this.model.blocks.set(bl.id, bl);
    this.view.blocks.set(bl.id, blv);

    return bl;
  }

  endBlock(id) {
    var b = this.model.blocks.get(id);
    if(!b) return false;

    this.model.blocks.delete(id);
    if(!this.spectate) this.ships.main.blocks.delete(id);

    if(b.locked) this.refGroups.enemyBlocks.delete(b);

    // erase the view for it.
    var v = this.view.blocks.get(id);
    if(v) {
      this.view.blocks.delete(id);
      this.view.layer.action.back.removeChild(v);
    }
    return true;
  }

  startPulse(data) {
    var p = new Pulse(data);

    // create a view for it.
    var pv = new createjs.Shape(
      DeepSpaceGame.graphics.attractor(this.teams[p.team].color)
    );
    this.view.layer.action.back.addChild(pv);

    this.model.pulses.set(p.id, p);
    this.view.pulses.set(p.id, pv);

    if(!this.spectate) if(p.team != this.ships.main.owner.team.number) this.refGroups.enemyPulses.add(p.id);

    return p;
  }

  endPulse(id) {
    var p = this.model.pulses.get(id);
    if(!p) return false;

    this.model.pulses.delete(id);
    if(!this.spectate) this.ships.main.pulses.delete(id);

    this.refGroups.enemyPulses.delete(p.id);

    // erase the view for it.
    var v = this.view.pulses.get(id);
    if(v) {
      this.view.pulses.delete(id);
      this.view.layer.action.back.removeChild(v);
    }
    return true;
  }

  pickupFlag(playerID) {
    var flag = this.game.flag, ship = null;
    // if(!flag.idle) NetworkHelper.out_flag_drop();
    flag.holderID = playerID;

    var player = this.players.get(flag.holderID);
    if(ship = player.ship)
      ship.pickup(flag);

    var c = player.team.color, us = player.team == this.team;
    this.alert(
      DeepSpaceGame.localizationStrings.alerts[us ? 'teamTakesFlag' : 'enemyTakesFlag'][this.language](
        DeepSpaceGame.localizationStrings.colors[c][this.language]
      )
    , c);

    // this.updateFlagView();
  }

  dropFlag() {
    var id, flag = this.game.flag, ship = null;
    if(id = flag.holderID) {
      var player = this.players.get(flag.holderID)
      if(ship = player.ship)
        ship.drop(flag);

      flag.reset();

      var c = player.team.color, us = player.team == this.team;
      this.alert(
        DeepSpaceGame.localizationStrings.alerts[us ? 'teamDropsFlag' : 'enemyDropsFlag'][this.language](
          DeepSpaceGame.localizationStrings.colors[c][this.language]
        )
      , us || this.spectate ? undefined : this.team.color);

      // this.updateFlagView();
    }

  }

  alert(msg, color = "#ECEFF1") {
    clearTimeout(this.alertTimeout)
    var v = this.view.overlay.message;
    v.text = msg; v.color = color;
    if(msg.trim() !== '') this.alertTimeout = setTimeout(()=>{this.alert("")}, 4000)
  }

  alert_kill(msg, color = "#ECEFF1") {
    clearTimeout(this.alertKillTimeout)
    var v = this.view.overlay.kill_message;
    v.text = msg; v.color = color;
    if(msg.trim() !== '') this.alertKillTimeout = setTimeout(()=>{this.alert_kill("")}, 4000)
  }


  msgShipKill(takerID, giverID) {//alert(`takerID ${takerID}, giverID ${giverID},`)
    if(this.spectate) return;
    if(takerID == this.player.id) {
      this.alert_kill(
        DeepSpaceGame.localizationStrings.alerts['yourDeath'][this.language](
          this.players.get(giverID).name
        )
      );
    } else
    if(giverID == this.player.id) {
      this.alert_kill(
        DeepSpaceGame.localizationStrings.alerts['yourKill'][this.language](
          this.players.get(takerID).name
        )
      );
      this.player.score.kills++;
    }
  }

  // inturruptions, closure and game over


  deinit() {
    // it must go in reverse order
      // as children of root objects will
      // need to know what to get removed from
    this.deinitCaches();
    this.deinitPhysics();
    this.deinitInput();
    this.deinitListeners();
    this.deinitCamera();
    this.deinitView();
    this.deinitGame();
    this.deinitModel();

    delete DeepSpaceGame.runningInstance;
  }
  deinitCaches() {
    delete this.enemyTeams;
    delete this.enemyPlayers;
    delete this.player;
    delete this.team;
  }
  deinitPhysics() {
    delete this.refGroups;
  }
  deinitInput() {
    var main = this.ships.main;
    if(main) delete main.owner.input;
  }
  deinitListeners() {
    for(let [,handler] of this.inputHandlers) { log(handler);
      window.removeEventListener('keydown', handler); // onkeydown
      window.removeEventListener('keyup', handler); // onkeyup
    }
  }
  deinitCamera() {
    delete this.camera;
  }
  deinitView() {
    delete this.view;
    delete this.window;
    this.stage.removeAllChildren();
    delete this.stage;
    delete this.colors;
  }
  deinitGame() {
    delete this.game;
  }
  deinitModel() {
    delete this.ships;
    delete this.players;
    delete this.teams;
  }

  reset() {

  }

  resetInput() {
    var input;
    if(this.player) if(input = this.player.input) {
      input.set("forward", 0);
      input.set("turn", 0);
      input.set("shoot", false);
      input.set("block", false);
      input.set("pulse", false);
    }
  }

  disconnectPlayer(id) {
    var player = this.players.get(id);
    if(player) {
      player.disconnected = true;
      player.ship.disabled = true;
      if(this.spectate) this.activePlayers.delete(player)
    } else { log(`not found`) }
  }

}

DeepSpaceGame.graphics = {
  spawn_camp: () => new createjs.Graphics().beginStroke("#37474F").setStrokeStyle(4).drawCircle(0, 0, 64),
  ship: {
    "damage":   [(color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(10, 0).lineTo(6, -10).lineTo(-10, -10).lineTo(-6, 0).lineTo(-10, 10).lineTo(6, 10).lineTo(10, 0).lineTo(6, -10),
                 (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(10, 0).lineTo(6, -10).lineTo(-10, -10).lineTo(-6, 0).lineTo(-10, 10).lineTo(6, 10).lineTo(10, 0).lineTo(6, -10)],

    "speed":    [(color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(10, 0).lineTo(-10, -10).lineTo(-6, 0).lineTo(-10, 10).lineTo(10, 0).lineTo(-10, -10),
                 (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(10, 0).lineTo(-10, -10).lineTo(-6, 0).lineTo(-10, 10).lineTo(10, 0).lineTo(-10, -10)],

    "balanced": [(color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(10, 0).lineTo(-10, -10).lineTo(-10, 10).lineTo(10, 0).lineTo(-10, -10),
                 (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(10, 0).lineTo(-10, -10).lineTo(-10, 10).lineTo(10, 0).lineTo(-10, -10)],

    "rate":     [(color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(10, 0).lineTo(-6, -10).lineTo(-10, 0).lineTo(-6, 10).lineTo(10, 0).lineTo(-6, -10),
                 (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(10, 0).lineTo(-6, -10).lineTo(-10, 0).lineTo(-6, 10).lineTo(10, 0).lineTo(-6, -10)],

    "defense":  [(color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(10, 0).lineTo(8, -5).lineTo(-10, -10).lineTo(-10, 10).lineTo(8, 5).lineTo(10, 0).lineTo(8, -5),
                 (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(10, 0).lineTo(8, -5).lineTo(-10, -10).lineTo(-10, 10).lineTo(8, 5).lineTo(10, 0).lineTo(8, -5)]
  },
  particle: (color, size) => new createjs.Graphics().beginStroke(color).setStrokeStyle(2).drawCircle(0, 0, size),
  // bullet: (color) => DeepSpaceGame.graphics.particle(color)
  block: (color, size) => new createjs.Graphics().beginFill(color).drawCircle(0, 0, size),
  attractor: color => new createjs.Graphics().beginFill(color).moveTo(2, 2).lineTo(2, 8).lineTo(-2, 8).lineTo(-2, 2).lineTo(-8, 2).lineTo(-8, -2).lineTo(-2, -2).lineTo(-2, -8).lineTo(2, -8).lineTo(2, -2).lineTo(8, -2).lineTo(8, 2).lineTo(2, 2),


  ring: r => new createjs.Graphics().beginStroke("#ECEFF1").setStrokeStyle(16).drawCircle(0, 0, r),
  flag: r => new createjs.Graphics().beginFill("#ECEFF1").drawCircle(0, 0, r),
  flag_shadow: ()=> new createjs.Shadow("#ECEFF1", 0, 0, 10)
};

DeepSpaceGame.renderingParameters = {
  'bulletCount' : 100,
  'shipThrustParticleCount' : 80
}

DeepSpaceGame.localizationStrings = {
  alerts: {
    enemyTakesFlag: {
      en: (color) => `The ${color} team has the pearl!`
    },
    teamTakesFlag: {
      en: () => `We have the pearl!`
    },
    enemyDropsFlag: {
      en: (color) => `The ${color} team dropped the pearl!`
    },
    teamDropsFlag: {
      en: () => `We dropped the pearl!`
    },
    yourKill: {
      en: (name) => `you got ${name}`
    },
    yourDeath: {
      en: (name) => `${name} got you!`
    }
  },
  colors: {
    '#FF4081': {
      en: `pink`
    },
    '#FF5252': {
      en: `red`
    },
    '#FFEA00': {
      en: `yellow`
    },
    '#00E676': {
      en: `green`
    },
    '#00B0FF': {
      en: `blue`
    },
    '#BB33FF': {
      en: `purple`
    },
    '#ECEFF1': {
      en: `white`
    },
    '#90A4AE': {
      en: `light`
    },
    '#37474F': {
      en: `dark`
    },
    '#263238': {
      en: `black`
    }
  }
}

// DeepSpaceGame.colorNames = [
//   '#FF4081': `pink`,
//   '#FF5252': `red`,
//   '#FFEA00': `yellow`,
//   '#00E676': `green`,
//   '#00B0FF': `blue`,
//   '#AA00FF': `purple`,
//   '#ECEFF1': `white`,
//   '#90A4AE': `light`,
//   '#37474F': `dark`,
//   '#263238': `black`
// ];

// DeepSpaceGame.colorNames = [
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
    width: 1920, height: 1920,
    // width: 1024, height: 1024,
    spawn: [
      [{x: 30, y: 30}, {x: 30, y: 60}, {x: 60, y: 60}, {x: 60, y: 30}],
      [{x: 450, y: 290}, {x: 450, y: 260}],
      [{x: 450, y: 290}, {x: 450, y: 260}]
    ]
  }
];

DeepSpaceGame.maps = [
  {
    name: "The Event Horizon",
    width: 1920, height: 1920,
    // width: 1024, height: 1024
    spawn: [
      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}],
      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}],
      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}],
      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}]
    ]
  }
];

DeepSpaceGame.spawn_structure = [
  [{x: 0, y: 0}], // 1 player
  [{x: 18, y: 0}, {x: -18, y: 0}], // 2
  [{x: 26, y: 0}, {x: -13, y: 22}, {x: -13, y: -22}], // 3
  [{x: 34, y: 0}, {x: 0, y: 34}, {x: -34, y: 0}, {x: 0, y: -34}], //4
  [{x: 34, y: 0}, {x: 10, y: 32}, {x: -28, y: 20}, {x: -28, y: -20}, {x: 10, y: -32}], // 5
  [{x: 34, y: 0}, {x: 17, y: 30}, {x: -17, y: 30}, {x: -34, y: 0}, {x: -17, y: -30}, {x: 17, y: -30}] // 6
]

DeepSpaceGame.modes = {
  ctf: { // capture the flag
    ring_radius: 720,
    flag_radius: 12,
    time_limit: FRAMES.mins(3)
  }
};
