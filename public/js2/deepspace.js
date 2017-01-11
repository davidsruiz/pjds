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
    this.timer = new Timer(data.duration);
    this.timer.start(() => { this.timerExpire() });
    SoundHelper.start();
    // this.soundHelper = SoundHelper.start();

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
    let teamCount = this.setupData.teams;
    teamCount.times((i) => { this.teams.push(new Team(this, i)) });

    this.setupSpawnCamps();
  }

  setupSpawnCamps() {
    this.teams.forEach(team => {
      team.spawn_camp = {position: V2D.new(DeepSpaceGame.maps[0].spawn[team.game.teams.length-1][team.number]), radius: 64}
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
    model.subs = new Map();

    this.model = model;
  }

  setupGame() {
    this.game = {};
    this.game.disabled = false;
    this.game.ended = false;
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
        this.game.lead = undefined; // team in the lead

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
    this.view.subs = new Map()
  }

  // createParticleViews() {
  //   this.ships.forEach((ship) => {
  //     var view = ship.view;
  //
  //     DeepSpaceGame.renderingParameters.times(() => {
  //       var particle = DeepSpaceGame.graphics.particle();
  //       view.reserve.push(new createjs.Shape);
  //     });
  //
  //     this.stage.addChild(ship.view = view);
  //   });
  // }

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
      // sub : true or false

      var keypressWeight = 0.85;

      // var playerInput = new Map([["forward", 0], ["turn", 0], ["shoot", false], ["block", false], ["sub", false]]);
      // var playerInput = new Map([["verticle", 0], ["horizontal", 0], ["shoot", false], ["block", false], ["sub", false]]);
      var playerInput = new Map([["move_v_axis", 0], ["move_h_axis", 0], ["shoot_v_axis", 0], ["shoot_h_axis", 0], ["block", false], ["sub", false]]);

      // KEYBOARD
      // key mappings, have multiple ('values') so you can switch between key bindings
      var values = [
        // up: ▲
        ["move_v_axis", [38], keypressWeight, 0],
        // down: ▼
        ["move_v_axis", [40], -keypressWeight, 0],
        // right: ▶︎
        ["move_h_axis", [39], keypressWeight, 0],
        // left: ◀︎
        ["move_h_axis", [37], -keypressWeight, 0],
        // up: w
        ["shoot_v_axis", [87], keypressWeight, 0],
        // down: s
        ["shoot_v_axis", [83], -keypressWeight, 0],
        // right: d
        ["shoot_h_axis", [68], keypressWeight, 0],
        // left: a
        ["shoot_h_axis", [65], -keypressWeight, 0],
        // block: space
        ["block", [32], true, false],
        // sub: e
        ["sub", [69], true, false]
      ];

      // var values = [
      //   // up: ▲ , w
      //   ["forward", [38, 87], keypressWeight, 0],
      //   // right: ▶︎ , d
      //   ["turn", [39, 68], keypressWeight, 0],
      //   // left: ◀︎ , a
      //   ["turn", [37, 65], -keypressWeight, 0],
      //   // shoot: z , k
      //   ["shoot", [90, 75], true, false],
      //   // block: x , l
      //   ["block", [88, 76], true, false],
      //   // block: c , ;
      //   ["sub", [67, 186], true, false]

        // // up: ▲ , w
        // ["move_v_axis", [38, 87], keypressWeight, 0],
        // // down: ▼ , s
        // ["move_v_axis", [40, 83], -keypressWeight, 0],
        // // right: ▶︎ , d
        // ["move_h_axis", [39, 68], keypressWeight, 0],
        // // left: ◀︎ , a
        // ["move_h_axis", [37, 65], -keypressWeight, 0],
      // ];

      var keyHandler = (e) => {
        var type = e.type;

        if(type == 'keyup' || type == 'keydown') {
          var eventCode = e.keyCode;

          values.forEach((row) => {
            row[1].forEach((code) => {
              if(code == eventCode) {

                var val = playerInput.get(row[0]);
                if(!type.is('keyup')) {
                  val = row[2];
                } else {
                  if(playerInput.get(row[0]) == row[2]) val = row[3];
                }
                playerInput.set(row[0], val);
              }
              //
              // if(code == eventCode) playerInput.set(row[0], type.is('keyup') ? row[3] : row[2]);

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
      this.updateGamepadInput = (!navigator.getGamepads) ? () => {} : () => {
        var gamepad = navigator.getGamepads()[0];
        if(!gamepad) return;

        var val, deadZone;

        // UP
        deadZone = 0.0;
        val = gamepad.axes[3]; val = (val + 1) / 2; // adjusted weird (-1 to 1 back trigger) axis seup
        val = (val > deadZone) ? (val - deadZone) / (1 - deadZone) : 0;
        playerInput.set("forward", val);

        // LEFT and RIGHT
        deadZone = 0.15;
        val = gamepad.axes[0];
        val = (val < -deadZone || val > deadZone) ? (val - deadZone) / (1 - deadZone) : 0;
        playerInput.set("turn", val);

        // FIRE
        playerInput.set("shoot", gamepad.buttons[3].pressed);

        // BLOCK
        playerInput.set("block", gamepad.buttons[7].pressed);

        // OTHER
        playerInput.set("sub", gamepad.buttons[0].pressed);
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
    refGroups.enemySubs = new Set();

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

    // this.ship_override_interval = window.setInterval()
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

    // scores
    this.setupData.state.scores.forEach((entry)=>{ this.game.scores[entry.t] = entry.s });

    // flag
    var holder;
    setTimeout(()=>{if(holder = this.setupData.state.flagHolder) this.pickupFlag(holder);}, 100);

    // disconnects
    this.setupData.disconnects.forEach(id => this.disconnectPlayer(id))

  }


  loop() {
    this.update();
    this.log();

    getAnimationFrame(()=> this.game.ended ? true : this.loop())
  }

  update() {
    // this function duty is as follows:
    // to update all the moving parts pertaining to the current/local user.
    // any collisions should be sent back to the server to sync the changes.
    var over = this.game.disabled;
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
    this.updateShips();
    this.broadcastShip();

    this.updateBullets();
    this.updateBlocks();
    this.updateSubs();
  }

  updateShips() {
    for(var ship of this.ships) {

      ship.update();

      if(ship == this.ships.main && !ship.disabled) {

        var input = ship.owner.input;

        ship.acceleration.set({x: input.get('move_h_axis'), y: -input.get('move_v_axis')})
        if(ship.acceleration.length) ship.acceleration.length = ship.LINEAR_ACCELERATION_LIMIT;

        // ship.acceleration.angle = ship.angle;
        if(ship.acceleration.length) ship.angle = ship.acceleration.angle
        // ship.angular_acceleration = ship.ANGULAR_ACCELERATION_LIMIT * input.get('turn');

        // ship.acceleration.length = ship.LINEAR_ACCELERATION_LIMIT * input.get('forward');
        // ship.acceleration.angle = ship.angle;
        //
        // ship.angular_acceleration = ship.ANGULAR_ACCELERATION_LIMIT * input.get('turn');

        var direction_v = new V2D(input.get('shoot_h_axis'), -input.get('shoot_v_axis'))
        ship.shoot_angle = direction_v.angle;

        if(direction_v.length) ship.shoot();

        // if(input.get('shoot')) ship.shoot();
        if(input.get('block')) ship.block();
        // option to drop with sub button
        // if(input.get('sub')) ship.sub();
        if(input.get('sub')) ship.flag ? NetworkHelper.out_flag_drop() : ship.sub();
      }

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
      NetworkHelper.out_ship_update(ship.export_update());
      if((new Date()).getTime()%60 < 2) NetworkHelper.out_ship_override(ship.export_override());
      if(ship.flag && ship.disabled && !this.game.flag.idle) NetworkHelper.out_flag_drop();
    }
  }

  updateBullets() {
    this.model.bullets.forEach(b => { b.update() });
    // this.model.bullets.forEach(b => { b.update(); if(b.disabled) NetworkHelper.out_bullet_destroy(b.id) });
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

  updateSubs() {
    this.model.subs.forEach(p => {
      p.update();

      switch(p.type) {
        case 'attractor':
        case 'repulsor':

          // field effects
          var distance, direction;
          this.model.bullets.forEach((b)=>{
            if(!b.disabled && p.team != b.team) {
              if((distance = Physics.distance(b.position, p.position)) < p.RANGE) {
                var force = new V2D(); direction = p.position.copy(); direction.sub(b.position);
                force.length = p.INTENSITY_FUNCTION(distance);
                force.angle = direction.angle;
                if(p.type == 'repulsor') force.angle = force.angle - Math.PI;
                b.velocity.add(force);
                b.velocity.length *= 0.94; // friction
              }
            }
          });

          break;
        case 'block_bomb':


          if(p.exploding) {

            // only the player who created it hands out damage to the blocks so it is done once
            var ship;
            if((ship = this.ships.main) && (ship.subs.has(p.id))) {
              var distance;
              this.refGroups.enemyBlocks.forEach(block => {
                if(block && !block.disabled) {
                  if((distance = Physics.distance(block.position, p.position)) < p.EXPLOSION_RANGE) {
                    NetworkHelper.block_damage(block.id, p.EXPLOSION_DAMAGE_FUNCTION(distance));
                  }
                }
              });
            }

            // the player is the only one who must wait, the others have been notified to endSub
            this.endSub(p.id);
          }

          break;
        case 'stealth_cloak':
          break;
        case 'missile':

          // targeting
          if(p.target && (Physics.distance(p.target.position, p.position) > p.VISION_RANGE || p.target.stealth)) p.target = null;
          this.ships.forEach(ship => {
            if(ship && !ship.disabled && !ship.stealth && ship.owner.team.number != p.team) {
              if(!p.target && ((distance = Physics.distance(ship.position, p.position)) < p.VISION_RANGE)) {
                p.target = ship;
              }
            }
          });

          // exploding
          if(p.exploding) {

            // only the player who created it hands out damage to the blocks so it is done once
            var ship;
            if((ship = this.ships.main) && (ship.subs.has(p.id))) {
              var distance;
              this.refGroups.enemyBlocks.forEach(block => {
                if(block && !block.disabled) {
                  if((distance = Physics.distance(block.position, p.position) - block.radius) < p.EXPLOSION_RANGE) {
                    NetworkHelper.block_change(block.id)
                  }
                }
              });
            }

            // the player is the only one who must wait, the others have been notified to endSub
            this.endSub(p.id);
          }

          break;
        default:
          break;
      }


    });

  }

  checkForCollisions() {
    // in theory, the user will only check
    // collisions of those things which it
    // created. though in practice, perhaps
    // just it's attack moves. e.g. bullets

    this.bulletCollisions();
    this.shipCollisions();
    this.subCollisions();
  }

  bulletCollisions() {
    // checked in order of precidence
    // e.g. a bullet colliding with a spawn
    // camp is unable to collide with a ship
    // safe within the walls

    this.bulletSpawnCampCollisions();
    this.bulletBlockCollisions();
    this.bulletShipCollisions();
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
              NetworkHelper.bullet_destroy(b.id);

              // b.disabled = true;
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
              NetworkHelper.block_damage(block.id, b.hp);
              NetworkHelper.bullet_destroy(b.id);
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
            NetworkHelper.bullet_destroy(b.id);
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
          // the destroy approach
          // NetworkHelper.out_block_destroy(block.id);

          // the slow down approach
          // ship.acceleration.mul(0.1);
          // log('ship-block')

          // the convert approach
          // NetworkHelper.block_change(block.id);

          // the convert after upon exit approach
          ship.intersectingBlocks.add(block);

        }
        // ship.block_friction = (Physics.doTouch(ship, block) ? block.DISRUPTIVE_FRICTION : 0);
      }
    });
    ship.intersectingBlocks.forEach(block => {
      if(block && !block.disabled) {
        if(!Physics.doTouch(ship, block)) {
          NetworkHelper.block_change(block.id);
          ship.intersectingBlocks.delete(block);
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

  subCollisions() {
    this.subBlockCollisions();
    this.subShipCollisions();
    this.subSpawnCampCollisions();
  }

  subBlockCollisions() {
    var p, b;
    this.ships.main.subs.forEach(id => {
      if((p = this.model.subs.get(id)) && !p.disabled) {

        if(p.type != 'stealth_cloak') { // stealth does not collide
          this.refGroups.enemyBlocks.forEach(b => {
            if(b && !b.disabled) {
              if(Physics.doTouch(p, b)) {
                switch(p.type) {
                  case 'attractor':
                  case 'repulsor':
                    NetworkHelper.sub_destroy(p.id);
                    NetworkHelper.block_destroy(b.id);
                    break;
                  case 'block_bomb':
                  case 'missile':
                    p.explode();
                  break;
                }
              }
            }
          });
        }

      }
    });

  }

  subShipCollisions() {
    var p;
    this.ships.main.subs.forEach(id => {
      if((p = this.model.subs.get(id)) && !p.disabled) {

        if(p.type == 'missile') { // only missles collide with ships
          this.enemyPlayers.forEach(player => {
            var ship = player.ship;
            if(ship && !ship.disabled) {
              if(Physics.doTouch(ship, p)) {
                NetworkHelper.out_ship_damage(player.id, p.hp);
                NetworkHelper.sub_destroy(p.id)
              }
            }
          });
        }

      }
    });
  }

  subSpawnCampCollisions() {
    for(let team of this.teams) {
      if(team == this.team) continue;
      var p;
      this.ships.main.subs.forEach(id => {
        if((p = this.model.subs.get(id)) && !p.disabled) {

          if(p.type == 'missile') {
            if(Physics.doTouch(team.spawn_camp, p)) {
              NetworkHelper.sub_destroy(p.id);
            }
          }

        }
      });
    }
  }

  updateGame() {
    var flag = this.game.flag;
    if(!flag.idle) {
      var player = this.players.get(flag.holderID),
          p = player.ship.last_known_position;
      flag.position.x = p.x;
      flag.position.y = p.y;

      // real game stuff
      var centerX = this.mapInfo.width / 2, // cache somehow...
          centerY = this.mapInfo.height / 2,
          distance = Physics.distance(p, {x: centerX, y: centerY}),
          percent = distance / this.game.max,
          low_score = this.game.scores[player.team.number],
          current_score = 100 - Math.round(percent * 100);

      if(current_score < low_score && current_score >= 0) this.game.scores[player.team.number] = current_score;

      if(!(percent < 1) && player == this.player) NetworkHelper.out_game_over(player.team.number);


      // LEAD COMPARISON
      // replace lead if none exists
      if(!this.game.lead) this.game.lead = player.team;

      // replace lead if record shows
      if(current_score < this.game.scores[this.game.lead.number]) {

        if(!this.spectate) {
          // if you are replacing
          if(player.team == this.team) {
            let c = this.team.color;
            this.alert(
              DeepSpaceGame.localizationStrings.alerts['teamTakesLead'][this.language]()
              , c);
          }
          // if you are being replaced
          else if(this.game.lead == this.team) {
            let c = player.team.color;
            this.alert(
              DeepSpaceGame.localizationStrings.alerts['teamLosesLead'][this.language]()
              , c);
          }
        }

        this.game.lead = player.team;
      }


    }




  }

  updateView() {
    this.updateShipViews();
    this.updateBulletViews();
    this.updateBlockViews();
    this.updateSubViews();

    this.updateCamera();
    this.updateGrid();

    this.updateGameViews();

    this.stage.update(); // render changes!!
  }

  updateShipViews() {
    this.ships.forEach((ship)=>{

      var visibility = 1;
      if(ship.disabled) {
        visibility = 0;
      } else if(ship.stealth) {
        if(!this.spectate && ship.owner.team == this.ships.main.owner.team) {
          visibility = Math.flipCoin(0.2) ? 0 : 0.4;
        } else {
          visibility = 0;
        }
      } else {
        visibility = 1;
      }

      ship.view.alpha = ship.health * visibility;

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
      if(!b.locked || (v.visible = this.camera.showing(b))) {
        v.alpha = b.health;
        if(!b.locked) {
          v.x = b.position.x;
          v.y = b.position.y;
          // v.graphics.command.radius = b.radius;
          v.scaleX = v.scaleY = b.scale;
        }
      }
    });
  }

  updateSubViews() {
    var views = this.view.subs;
    this.model.subs.forEach(p => {
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

  updateGrid() {
    var focus = this.camera.focus;
    if(focus) GRID.offset(-focus.x, -focus.y)
  }

  updateGameViews() {

    this.view.overlay.score.team.forEach((text, i)=>{
      text.text = this.game.scores[i];
      text.scaleX = text.scaleY = (this.teams[i] == this.game.lead ? 1 : 0.9);
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

    v.alpha = not_visible ? 0.1 : (flag.idle ? 1 : 0);
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


  // end vs stop: end happens when the local game appears to conclude; interaction with the game is stopped
  // and the state might even be obstructed from view though the simluation continues;

  disableInteraction() {
    this.game.disabled = true;
    if(this.player) this.resetInput();
    this.deinitListeners();
    this.timer.cancel();
  }

  endSimulation() {
    this.game.ended = true;
    SoundHelper.stop();
  }

  timerExpire() {
    LOBBY.endGame();

    // disconnect if no server response after 6s
    setTimeout(() => {
      if(!this.game.ended) LOBBY.disconnect();
    }, 6000);
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

    // sound
    // if(this.camera.showing(b)) SoundHelper.fireShot();

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

  changeBlock(id, team) {
    // retrieve and store block
    var b = this.model.blocks.get(id);
    if(!b) return false;

    // begin change if locked
    if(b.locked) {

      // skip if change is unnecessary
      if(b.team != team) {

        // assign new team
        b.team = team;

        // if not spectating add or remove from ref group
        if(!this.spectate) {
          if(b.team != this.team.number) {
            this.refGroups.enemyBlocks.add(b);
          } else {
            this.refGroups.enemyBlocks.delete(b);
          }
        }

        // replace and delete old view
        var v = this.view.blocks.get(id);
        if(v) {
          v.graphics = DeepSpaceGame.graphics.block(this.teams[b.team].color, b.radius);
          v.updateCache();
        }

      }
    }
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

  startSub(data) {
    var p;
    switch(data.type) {
      case 'attractor':
        p = new Attractor(data)
        break;
      case 'repulsor':
        p = new Repulsor(data)
        break;
      case 'block_bomb':
        p = new BlockBomb(data)
        break;
      case 'stealth_cloak':
        p = new StealthCloak(data)
        break;
      case 'missile':
        p = new Missile(data)
        break;
      default:
        break;
    }

    // create a view for it.
    if(data.type != 'stealth_cloak') {
      var graphics;
      switch(data.type) {
        case 'attractor':
        graphics = DeepSpaceGame.graphics.attractor(this.teams[p.team].color)
        break;
        case 'repulsor':
        graphics = DeepSpaceGame.graphics.repulsor(this.teams[p.team].color)
        break;
        case 'block_bomb':
        graphics = DeepSpaceGame.graphics.block_bomb(this.teams[p.team].color)
        break;
        case 'missile':
        graphics = DeepSpaceGame.graphics.missile(this.teams[p.team].color)
        break;
        default:
        break;
      }
      var pv = new createjs.Shape(graphics);
      this.view.layer.action.back.addChild(pv);

      this.view.subs.set(p.id, pv);

      // if(this.camera.showing(p)) SoundHelper.fireSub(); // no sound for stealth
    }

    this.model.subs.set(p.id, p);

    if(!this.spectate) if(p.team != this.ships.main.owner.team.number) this.refGroups.enemySubs.add(p.id);

    return p;
  }

  endSub(id) {
    var p = this.model.subs.get(id);
    if(!p) return false;

    this.model.subs.delete(id);
    if(!this.spectate) this.ships.main.subs.delete(id);

    this.refGroups.enemySubs.delete(p.id);

    // erase the view for it.
    if(p.type != 'stealth_cloak') {
      var v = this.view.subs.get(id);
      if(v) {
        this.view.subs.delete(id);
        this.view.layer.action.back.removeChild(v);
      }
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

    // sound
    us ? SoundHelper.teamYay() : SoundHelper.teamNay();

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
    var t = this.players.get(takerID), g = this.players.get(giverID);
    if(t) t.score.deaths++; if(g) g.score.kills++;

    if(this.spectate) return;
    if(takerID == this.player.id) {
      const player = this.players.get(giverID);
      this.alert_kill(
        DeepSpaceGame.localizationStrings.alerts['yourDeath'][this.language](
          player.name
        )
      );
      this.camera.animateFocus(player.ship.view, [this.player.ship, 'disabled']);
      // this.camera.animateFocus(player.ship.view, player.ship.RESPAWN_DELAY*16.7);
    } else
    if(giverID == this.player.id) {
      this.alert_kill(
        DeepSpaceGame.localizationStrings.alerts['yourKill'][this.language](
          this.players.get(takerID).name
        )
      );
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
    for(let [,handler] of this.inputHandlers) {
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
      input.set("sub", false);
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
  particle: (color, size) => new createjs.Graphics().beginStroke(color).setStrokeStyle(4).drawCircle(0, 0, size),
  // bullet: (color) => DeepSpaceGame.graphics.particle(color)
  block: (color, size) => new createjs.Graphics().beginFill(color).drawCircle(0, 0, size),

  attractor: color => new createjs.Graphics().beginFill(color).moveTo(2, 2).lineTo(2, 8).lineTo(-2, 8).lineTo(-2, 2).lineTo(-8, 2).lineTo(-8, -2).lineTo(-2, -2).lineTo(-2, -8).lineTo(2, -8).lineTo(2, -2).lineTo(8, -2).lineTo(8, 2).lineTo(2, 2),
  repulsor: color => new createjs.Graphics().beginFill(color).moveTo(2, -8).lineTo(2, 8).lineTo(-2, 8).lineTo(-2, -8).lineTo(2, -8),//.lineTo(-8, -2).lineTo(-2, -2).lineTo(-2, -8).lineTo(2, -8).lineTo(2, -2).lineTo(8, -2).lineTo(8, 2).lineTo(2, 2),
  block_bomb: color => new createjs.Graphics().beginFill(color).moveTo(-10, 0).arcTo(-10, -10, 0, -10, 10).lineTo(0, 10).arcTo(-9, 9, -10, 0, 10),
  missile: color => new createjs.Graphics().beginFill(color).moveTo(6, 0).lineTo(-6, -6).lineTo(-6, 6).lineTo(6, 0),


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
    },
    teamTakesLead: {
      en: () => `We took the lead!`
    },
    teamLosesLead: {
      en: () => `We lost the lead!`
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
    flag_radius: 18,
    time_limit: FRAMES.mins(3)
  }
};
