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
    // this.loop();
  }

  static create(data) {
    if (DeepSpaceGame.runningInstance) DeepSpaceGame.runningInstance.deinit();
    return DeepSpaceGame.runningInstance = new DeepSpaceGame(data);
  }

  start() {
    this.loop();
    this.timer.start(() => {
      this.timerExpire()
    });
  }

  interpret(data) {
    // anything pertaining to game
    // object itself gets set
    this.spectate = data.spectate;
    this.isHost = data.host;
    this.mapInfo = DeepSpaceGame.maps[2];
    this.gameMode = 'ctf'; // data.mode;
    this.language = 'en';
    this.timer = new Timer(data.duration);


    // SoundHelper.start(); // new
    // this.soundHelper = SoundHelper.start(); // olc

    try {
      if (TINT) TINT.load(...data.tint)
    } catch (e) {
      log('tint load failed')
    }

    // everything else:
    this.setupData = data;
  }

  setup() {
    this.setupPhysics();
    this.setupModel();
    this.setupView();
    this.setupListeners();
    this.setupLoop();
    this.setupReferences();

    if (this.spectate) this.actualize();
  }

  setupModel() {
    this.setupTeams();
    this.setupPlayers();
    this.setupShips();
    this.setupObjectPools();

    this.setupGame();
    this.setupMap();
  }

  setupTeams() {
    this.teams = [];
    let teamCount = this.setupData.teams;
    teamCount.times((i) => {
      this.teams.push(new Team(this, i))
    });

    this.setupSpawnCamps();
  }

  setupSpawnCamps() {
    this.teams.forEach(team => {
      team.spawn_camp = {
        position: V2D.new(this.mapInfo.spawn[team.game.teams.length - 1][team.number]),
        radius: 64,
        team: team.number
      }
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
    this.ships = [];
    this.players.forEach((player) => {
      var ship;
      if (localIDMatches(player.id) && !this.spectate) {
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
    this.game.disabled = false; // interaction disabled
    this.game.ended = false; // game over happened
    this.game.overtime = false; // game overtime happened

    // this.timer = DeepSpaceGame.modes[this.gameMode];
    switch (this.gameMode) {
      case "ctf":

        // flag whatevers
        var centerX = this.mapInfo.width / 2;
        var centerY = this.mapInfo.height / 2;
        let flag = new Flag(new V2D(centerX, centerY));
        flag.collision_groups = [this.physics.collision_groups.FLAG];
        this.setCollisionDivisions(flag);
        this.game.flag = flag;

        // actual game stats
        this.game.scores = Array.new(this.teams.length, 100);
        this.game.max = Physics.distance(this.teams[0].spawn_camp.position, {x: centerX, y: centerY});
        this.game.lead = undefined; // team in the lead

        break;
    }
  }

  setupMap() {
    let map = this.model.map = {},
      info = this.mapInfo;

    let cX = info.width / 2,
      cY = info.height / 2;


    // IMPERMEABLES
    let initial_impermeables = [], radii = new Set();
    for (let radius_size_group of info.impermeables.bodies) {
      let list = radius_size_group.slice(),
        radius = list.shift();
      for (let [x, y] of list) {
        initial_impermeables.push({
          radius: radius,
          position: {x, y}
        })
      }
      radii.add(radius);
    }

    map.impermeables = [];
    map.impermeables.radii = radii;
    // in the future use the 'copies' variable on impermeables
    // and make it odd symmetry
    map.impermeables.push(...initial_impermeables)
    if (info.impermeables.copies >= 2) {

      map.impermeables.push(...(initial_impermeables.map(obj => {
        return {
          radius: obj.radius,
          position: {x: info.width - obj.position.x, y: info.width - obj.position.y}
        }
      })));

      if (info.impermeables.copies == 4) {

        map.impermeables.push(...(initial_impermeables.map(obj => {
          return {
            radius: obj.radius,
            position: {x: info.width - obj.position.y, y: obj.position.x}
          }
        })));

        map.impermeables.push(...(initial_impermeables.map(obj => {
          return {
            radius: obj.radius,
            position: {x: obj.position.y, y: info.width - obj.position.x}
          }
        })));

      }

    }

    for (let imp of map.impermeables) {
      imp.collision_groups = [this.physics.collision_groups.IMPERMEABLES]
      this.setCollisionDivisions(imp);
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

  setupCanvas() { // TODO: (revise)
    var canvas = $('#canvas')[0];
    canvas.width = document.body.clientWidth;
    if (canvas.width > 1024) canvas.width = 1024;
    canvas.height = document.body.clientHeight;
    if (canvas.height > 768) canvas.height = 768;
    // canvas.width = 512;
    // canvas.height = 480;

    var stage = new createjs.Stage();
    stage.canvas = canvas;
    stage.snapToPixel = true;
    // gui.add(stage, 'snapToPixel');

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
    // background.graphics.beginFill('#37474F').drawRect(0, 0, canvas.width, canvas.height);
    // background.cache(0, 0, canvas.width, canvas.height);
    // this.view.layer.background.addChild(background);
    //
    // background = new createjs.Shape();
    background.graphics.beginFill('#455A64').drawRect(0, 0, canvas.width, canvas.height);
    background.cache(0, 0, canvas.width, canvas.height);
    this.view.layer.background.map_background = background;
    this.view.layer.background.addChild(background);
  }

  createGameModeSpecificViewsAction() {
    /*switch(this.gameMode) {
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
     }*/

    // create caches
    var caches = new Map();
    this.model.map.impermeables.radii.forEach(r => {
      var view = new createjs.Shape(DeepSpaceGame.graphics.block_fill('#37474F', r));
      var s = r * 1.2;
      view.cache(-s, -s, s * 2, s * 2);

      caches.set(r, view.cacheCanvas);
    })

    // create views
    this.view.map = {impermeables: []}
    this.model.map.impermeables.forEach(block => {
      var view = new createjs.Bitmap(caches.get(block.radius)),
        pos = block.position;
      view.x = pos.x - block.radius * 1.2;
      view.y = pos.y - block.radius * 1.2;
      this.view.map.impermeables.push(view)
      this.view.layer.action.front.addChild(view);
    });

  }

  createSpawnCampViews() {

    // this.view.teams = { spawn_camp: []}

    // DeepSpaceGame.maps[0].spawn[this.owner.team.game.teams.length][this.owner.team.number]
    var s = 64 + 2;
    this.teams.forEach((team, i) => {
      var group = new createjs.Container(),
        camp = new createjs.Shape(DeepSpaceGame.graphics.spawn_camp(team.color)),
        fill = new createjs.Shape(DeepSpaceGame.graphics.spawn_camp_fill(team.color)),
        pos = team.spawn_camp.position;
      fill.alpha = 0.08;
      group.x = pos.x;
      group.y = pos.y;
      group.addChild(fill);
      group.addChild(camp);
      group.cache(-s, -s, s * 2, s * 2);
      team.spawn_camp.view = group;
      this.view.layer.action.back.addChild(group);
    });
  }

  createShipViews() {
    let our_ship = this.ships.main, our_team;
    if (our_ship) our_team = our_ship.owner.team;
    this.ships.forEach((ship) => {
      let container = new createjs.Container();
      var hollow = new createjs.Shape(DeepSpaceGame.graphics.ship[ship.owner.type][0](ship.owner.team.color, ship.isMain ? 4 : 2)),
        filled = new createjs.Shape(DeepSpaceGame.graphics.ship[ship.owner.type][1](ship.owner.team.color, ship.isMain ? 4 : 2)),
        s = ship.radius * 1.2;
      hollow.cache(-s, -s, s * 2, s * 2);
      filled.cache(-s, -s, s * 2, s * 2);
      var view = new createjs.Bitmap(hollow.cacheCanvas);
      view.regX = view.regY = s;
      view.hollow = hollow.cacheCanvas, view.filled = filled.cacheCanvas; // TODO cache ships with interchangable bitmap instead
      container.ship = view;
      container.addChild(view);

      //text
      if (ship.owner.team == our_team && ship != our_ship) {
        var text = new createjs.Text(ship.owner.name, "14px Roboto", our_team.color);
        text.y = -30;
        text.textAlign = "center";
        // text.cache(-50, -30, 100, 60)
        container.text = text;
        container.addChild(text);
      }

      // if(ship == our_ship) {
      //   let color = this.ships.main.owner.team.color,
      //     view = new createjs.Shape(DeepSpaceGame.graphics.energyMeter(this.ships.main.owner.team.color, 1)),
      //     shadow = new createjs.Shape(DeepSpaceGame.graphics.energyMeterShadow('#455A64')),
      //     offset = { x: 22, y: -22 };
      //
      //   view.x = shadow.x = offset.x;
      //   view.y = shadow.y = offset.y;
      //
      //   container.addChild(container.meter_shadow = view.shadow = shadow);
      //   container.addChild(container.meter = view);
      // }


      this.view.layer.action.front.addChild(ship.view = container);
    });

    if (our_ship) {
      let container = our_ship.view,
        color = this.ships.main.owner.team.color,
        meter = new createjs.Shape(DeepSpaceGame.graphics.energyMeter(this.ships.main.owner.team.color, 1)),
        shadow = new createjs.Shape(DeepSpaceGame.graphics.energyMeterShadow('#455A64')),
        offset = {x: 22, y: -22};

      shadow.cache(-9, -9, 18, 18);

      meter.x = shadow.x = offset.x;
      meter.y = shadow.y = offset.y;

      container.addChild(container.meter_shadow = meter.shadow = shadow);
      container.addChild(container.meter = meter);
    }
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
    this.teams.forEach((team, i) => {
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
    overlay.message = new createjs.Text("", "24px Roboto");
    overlay.message.textAlign = "center";
    overlay.message.x = (this.window.width / 2);
    overlay.message.y = 76;

    this.view.layer.overlay.addChild(overlay.message);

    // var imagined_width = 512;
    overlay.kill_message = new createjs.Text("", "24px Roboto");
    overlay.kill_message.textAlign = "center";
    overlay.kill_message.x = (this.window.width / 2);
    overlay.kill_message.y = this.window.height - 76;

    this.view.layer.overlay.addChild(overlay.kill_message);

    switch (this.gameMode) {
      case "ctf":
        // var centerX = this.mapInfo.width / 2;
        // var centerY = this.mapInfo.height / 2;

        var r = DeepSpaceGame.modes["ctf"].flag_radius, s = r * 1.2;
        var flag = new createjs.Shape(
          DeepSpaceGame.graphics.flag(DeepSpaceGame.modes["ctf"].flag_radius)
        );
        flag.shadow = DeepSpaceGame.graphics.flag_shadow();
        flag.cache(-s, -s, s * 2, s * 2);

        // flag.x = centerX; flag.y = centerY;

        this.view.layer.overlay.addChild(flag);
        this.view.flag = flag;

        break;
    }

    // energy meter
    // if(!this.spectate) {
    //   overlay.ship = {};
    //   let color = this.ships.main.owner.team.color,
    //       view = new createjs.Shape(DeepSpaceGame.graphics.energyMeter(this.ships.main.owner.team.color, 1)),
    //       shadow = new createjs.Shape(DeepSpaceGame.graphics.energyMeterShadow('#455A64')),
    //       centerX = this.window.width / 2,
    //       centerY = this.window.height / 2,
    //       offset = { x: 22, y: -22 };
    //
    //   view.x = shadow.x = centerX + offset.x;
    //   view.y = shadow.y = centerY + offset.y;
    //
    //   this.view.layer.overlay.addChild(view.shadow = shadow);
    //   this.view.layer.overlay.addChild(overlay.ship.energyMeter = view);
    // }

    // MINI MAP
    if (!this.spectate) this.createOverlayMinimapViews(overlay, this.view.layer.overlay);


    this.view.overlay = overlay;
  }

  createOverlayMinimapViews(overlay_model, overlay_view) {

    let mini = overlay_model.minimap = new createjs.Container();

    mini.width = mini.height = 168;
    mini.scale = mini.width / this.mapInfo.width;

    let padd = 32;
    mini.x = padd;
    mini.y = this.window.height - (padd + mini.height)

    // background
    let background = mini.background = new createjs.Shape();
    background.graphics.beginFill('#263238').drawRect(0, 0, mini.width, mini.height);
    background.cache(0, 0, mini.width, mini.height);
    mini.addChild(background);

    // map obstacles
    var max = 128,
      r = max * mini.scale,
      block = new createjs.Shape(DeepSpaceGame.graphics.block_fill('#37474F', r)),
      s = r * 1.2;
    block.cache(-s, -s, s * 2, s * 2);
    var cache = block.cacheCanvas;

    this.model.map.impermeables.forEach(block => {
      var scale = (block.radius * mini.scale) / r,
        view = new createjs.Bitmap(cache),
        pos = block.position;
      view.scaleX = view.scaleY = scale;
      view.x = (pos.x * mini.scale) - (scale * cache.width / 2);
      view.y = (pos.y * mini.scale) - (scale * cache.height / 2);
      mini.addChild(view);
    });

    // spawns
    this.teams.forEach(team => {
      let camp = team.spawn_camp,
        radius = team == this.ships.main.owner.team ? 8 : 6,
        // radius = camp.radius*mini.scale,
        view = new createjs.Shape(DeepSpaceGame.graphics.circle_fill(team.color, 6)),
        pos = camp.position;
      view.x = pos.x * mini.scale;
      view.y = pos.y * mini.scale;
      var s = radius * 1.2;
      view.cache(-s, -s, s * 2, s * 2);
      mini.addChild(view);
    });

    // flag
    let flag_view = mini.flag = new createjs.Shape(DeepSpaceGame.graphics.circle_fill('#ECEFF1', 6))
    mini.addChild(flag_view);

    // ships .. hmmm.. intel >.>
    // (only same team for now)
    let this_player = this.ships.main.owner, this_team = this_player.team
    mini.players = [];
    this_team.players.forEach(player => {
      let view = new createjs.Shape(DeepSpaceGame.graphics.circle_fill(this_team.color, 4));
      view.alpha = player == this_player ? 1 : 0.6;
      mini.players.push(view);
      mini.addChild(view);
    });

    // and also eventually blocks
    mini.blocks = new Map();


    overlay_view.addChild(mini);
  }

  createOverlayMinimapBlockViewFor(block) {
    let cache = DeepSpaceGame.graphicsCaches.minimap.blocks[block.team],
      blv = new createjs.Bitmap(cache),
      mini = this.view.overlay.minimap,
      scale = mini.scale;

    // blv.alpha = 0.2
    blv.x = block.position.x * scale;
    blv.y = block.position.y * scale;

    blv.regX = blv.regY = (cache.width / 2);

    mini.addChild(blv);
    mini.setChildIndex(blv, 1)
    mini.blocks.set(block.id, blv);

    // flag always on top
    // mini.setChildIndex(mini.flag, mini.numChildren-1)
  }

  setupCamera() {
    this.view.layer.action.width = this.mapInfo.width;
    this.view.layer.action.height = this.mapInfo.height;
    this.camera = new Camera(this.stage.canvas, this.view.layer.action);

    if (this.spectate) {
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

    if (this.spectate) {
      var keyHandler = (e) => {
        if (e.keyCode == 37) { // left: ◀︎
          this.activePlayerIndex--;
          if (this.activePlayerIndex < 0) this.activePlayerIndex = this.activePlayers.length - 1;
        }
        if (e.keyCode == 39) { // right: ▶︎
          this.activePlayerIndex++;
          if (this.activePlayerIndex >= this.activePlayers.length) this.activePlayerIndex = 0;
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

      // var keypressWeight = 0.85;

      // var inputStack = new Map([["forward", 0], ["turn", 0], ["shoot", false], ["block", false], ["sub", false]]);
      // var inputStack = new Map([["verticle", 0], ["horizontal", 0], ["shoot", false], ["block", false], ["sub", false]]);
      // var inputStack = new Map([["move_v_axis", 0], ["move_h_axis", 0], ["shoot_v_axis", 0], ["shoot_h_axis", 0], ["block", false], ["sub", false]]);
      // var inputStack = new Map([
      //   ["up", 0], ["dn", 0], ["lt", 0], ["rt", 0],         // move direction
      //   ["up2", 0], ["dn2", 0], ["lt2", 0], ["rt2", 0],     // attack direction
      //   ["block", false], ["sub", false]                    // other
      // ]);

      // for(var [,player] of this.players) {
      //   player.input = [];
      // }
      var inputStack = this.ships.main.owner.input = new Set();
      inputStack.changed = false;

      // KEYBOARD
      // key mappings, have multiple ('values') so you can switch between key bindings
      // the default values are true / false
      var keymap = [
        // up: ▲
        ["up", [38]],
        // down: ▼
        ["dn", [40]],
        // left: ◀︎
        ["lt", [37]],
        // right: ▶︎
        ["rt", [39]],
        // up: w
        ["up2", [87]],
        // down: s
        ["dn2", [83]],
        // left: a
        ["lt2", [65]],
        // right: d
        ["rt2", [68]],
        // block: space, v
        ["block", [32, 86]],
        // sub: e
        ["sub", [69]]
      ];

      // var values = [
      //   // up: ▲
      //   ["up", [38], true, false],
      //   // down: ▼
      //   ["dn", [40], true, false],
      //   // left: ◀︎
      //   ["lt", [37], true, false],
      //   // right: ▶︎
      //   ["rt", [39], true, false],
      //   // up: w
      //   ["up2", [87], true, false],
      //   // down: s
      //   ["dn2", [83], true, false],
      //   // left: a
      //   ["lt2", [65], true, false],
      //   // right: d
      //   ["rt2", [68], true, false],
      //   // block: space
      //   ["block", [32], true, false],
      //   // sub: e
      //   ["sub", [69], true, false]
      // ];

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

      let keyHandler = (e) => {
        var type = e.type;

        if (type == 'keyup' || type == 'keydown') {
          var eventCode = e.keyCode;

          keymap.forEach((row) => {
            row[1].forEach((code) => {
              if (code == eventCode) {

                // row[0] e.g. 'up' or 'block'
                // row[2] is value on keydown
                // row[3] is value on keyup

                if (!type.is('keyup')) {
                  if (!inputStack.has(row[0])) {
                    inputStack.add(row[0]);
                    inputStack.changed = true;
                  }
                } else {
                  inputStack.delete(row[0])
                  inputStack.changed = true;
                }

                // inputStack.delete(row[0])
                // if(keydown)
                // if(!type.is('keyup')) inputStack.add(row[0]);

                // NetworkHelper.out_input_stack(Array.from(inputStack));
                // inputStack.changed = true;
                // log(Array.from(inputStack));
              }
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
      // this closure has access to the inputStack variable.. the alias for this.ships.main.owner.input
      // .. thus it is left here .. please revise
      this.updateGamepadInput = (!navigator.getGamepads) ? () => {
        } : () => {
          var gamepad = navigator.getGamepads()[0];
          if (!gamepad) return;

          var val, deadZone;

          // UP
          deadZone = 0.0;
          val = gamepad.axes[3];
          val = (val + 1) / 2; // adjusted weird (-1 to 1 back trigger) axis seup
          val = (val > deadZone) ? (val - deadZone) / (1 - deadZone) : 0;
          inputStack.set("forward", val);

          // LEFT and RIGHT
          deadZone = 0.15;
          val = gamepad.axes[0];
          val = (val < -deadZone || val > deadZone) ? (val - deadZone) / (1 - deadZone) : 0;
          inputStack.set("turn", val);

          // FIRE
          inputStack.set("shoot", gamepad.buttons[3].pressed);

          // BLOCK
          inputStack.set("block", gamepad.buttons[7].pressed);

          // OTHER
          inputStack.set("sub", gamepad.buttons[0].pressed);
        };

      // MOBILE
      let raw_acc_data = [0, 0], applied_acc_data = [0, 0]; // [x, y]
      let threshold = 1, bias = [0, 0]; // deadzone
      bias = ENV.storage.calibration = (ENV.storage.calibration) ? ENV.storage.calibration.split(",").map(Number) : [0, 0];
      // let origin = [0, bias];
      if (ENV.mobile && window.DeviceMotionEvent != undefined) {
        window.ondevicemotion = function (e) {
          raw_acc_data = [e.accelerationIncludingGravity.x, e.accelerationIncludingGravity.y];
          // if ( e.rotationRate )  {
          //   document.getElementById("rotationAlpha").innerHTML = e.rotationRate.alpha;
          //   document.getElementById("rotationBeta").innerHTML = e.rotationRate.beta;
          //   document.getElementById("rotationGamma").innerHTML = e.rotationRate.gamma;
          // }
        }

        inputStack.updateMotion = function () {
          let orientation = window.orientation,
            [raw_x, raw_y] = raw_acc_data, [x, y] = [raw_x, raw_y];

          if (orientation === 90) {
            x = -raw_y, y = raw_x
          }
          else if (orientation === -90) {
            x = raw_y, y = -raw_x
          }
          else if (orientation === 180 || orientation === -180) {
            x = -x, y = -y
          }

          applied_acc_data = [x, y];
          x -= bias[0]; // bias towards player;
          y -= bias[1];

          if (x > threshold) {
            inputStack.add('rt')
          } else {
            inputStack.delete('rt')
          }
          if (x < -threshold) {
            inputStack.add('lt')
          } else {
            inputStack.delete('lt')
          }
          if (y > threshold) {
            inputStack.add('up')
          } else {
            inputStack.delete('up')
          }
          if (y < -threshold) {
            inputStack.add('dn')
          } else {
            inputStack.delete('dn')
          }

        };
      }

      var left = document.querySelector('#touch_layer > .left');
      left.addEventListener('touchstart', e => {
        inputStack.add('block')
      });
      left.addEventListener('touchend', e => {
        inputStack.delete('block')
      });

      let joystick = new V2D(), joystick_deadzone_radius = 30;
      var right = document.querySelector('#touch_layer > .right');
      right.addEventListener('touchstart', e => {
        inputStack.add('shoot')
      });
      right.addEventListener('touchend', e => {
        inputStack.delete('shoot');
        inputStack.delete('up2');
        inputStack.delete('dn2');
        inputStack.delete('lt2');
        inputStack.delete('rt2');
      });
      var right_hammer = new Hammer(right);
      right_hammer.on('panmove', function (e) {
        var v = new V2D(e.deltaX, e.deltaY), a = v.angle;
        if (v.length > joystick_deadzone_radius) {
          if (a < -0.39 && a > -2.74) {
            inputStack.add('up2')
          } else {
            inputStack.delete('up2')
          }
          if (a > 0.39 && a < 2.74) {
            inputStack.add('dn2')
          } else {
            inputStack.delete('dn2')
          }
          if (a > 1.96 || a < -1.96) {
            inputStack.add('lt2')
          } else {
            inputStack.delete('lt2')
          }
          if (a > -1.18 && a < 1.18) {
            inputStack.add('rt2')
          } else {
            inputStack.delete('rt2')
          }
        } else {

        }
        // console.log(e)
      });

      var hammertime = new Hammer(document.querySelector('#touch_layer'));
      hammertime.get('tap').set({taps: 2})
      hammertime.get('swipe').set({direction: Hammer.DIRECTION_LEFT})
      hammertime.on('tap', function (ev) {
        inputStack.add('sub');
        ( () => inputStack.delete('sub') ).wait(200);
      });
      hammertime.on('swipe', function (e) {
        // calibrate
        bias = applied_acc_data;
        ENV.storage.calibration = bias;
      });


    }

  }

  setupPhysics() {
    this.setupCollisionSystem();
    this.assignCollisionPatterns();
    this.setupReferenceGroups();
  }

  setupCollisionSystem() {
    let physics = this.physics = {};

    physics.block_size = 512;
    physics.world_size = {width: this.mapInfo.width, height: this.mapInfo.height};

    let rows = Math.ceil(physics.world_size.width / physics.block_size),
      cols = Math.ceil(physics.world_size.height / physics.block_size);

    physics.divisions = [];
    // rows.times(i => {
    //   physics.divisions.push([]);
    //   cols.times(() => {
    //     physics.divisions[i].push(new Set())
    //   })
    // })

    physics.division_index = function (x, y) {
      return (y * cols) + x;
    }

    physics.division_coordinates = function (i) {
      return [i % rows, Math.floor(i / cols)]
    }

    /* collision testing will be composed of the following:

     within each division, all the tests will be performed
     with the objects available

     each division will contain all the collision groups within..
     they will be populated accordingly so when the tests are run
     tests between objects listed in the groups in the division
     will be tested. */
    physics.collision_checks = [];
    physics.collision_groups = {
      SHIPS: Symbol('SHIPS'),
      OUR_SHIP: Symbol('OUR_SHIP'),
      OUR_SHIPS: Symbol('OUR_SHIPS'),
      ENEMY_SHIPS: Symbol('ENEMY_SHIPS'),

      BULLETS: Symbol('BULLETS'),
      MY_BULLETS: Symbol('MY_BULLETS'),
      OUR_BULLETS: Symbol('OUR_BULLETS'),
      ENEMY_BULLETS: Symbol('ENEMY_BULLETS'),

      BLOCKS: Symbol('BLOCKS'),
      OUR_BLOCKS: Symbol('OUR_BLOCKS'),
      ENEMY_BLOCKS: Symbol('ENEMY_BLOCKS'),

      OUR_PROJ_SUBS: Symbol('OUR_PROJ_SUBS'),

      SPAWN_CAMPS: Symbol('SPAWN_CAMPS'),
      OUR_SPAWN_CAMP: Symbol('OUR_SPAWN_CAMP'),
      ENEMY_SPAWN_CAMPS: Symbol('ENEMY_SPAWN_CAMPS'),

      REFUGE: Symbol('REFUGE'), // block or camp
      OUR_REFUGE: Symbol('OUR_REFUGE'),

      FLAG: Symbol('FLAG'),
      IMPERMEABLES: Symbol('IMPERMEABLES')
    };


    (rows * cols).times(() => {
      let obj = {};
      for (let group of Object.keys(physics.collision_groups)) obj[physics.collision_groups[group]] = new Set();
      physics.divisions.push(obj);
    })

    /*
     END RESULT LOOKS SOMETHING LIKE:
     [.. {...}, {SHIPS: [Set], OUR_BULLETS: Set [b, b, ..], ...}, {...}, ...]

     */
  }

  setCollisionDivisions(physics_body) {
    this.clearCollisionDivisions(physics_body)

    let d = physics_body.divisions = new Set(),
      r = physics_body.radius,
      [x, y] = [physics_body.position.x, physics_body.position.y];

    [[1, 0], [0, -1], [-1, 0], [0, 1]].forEach(unit_offset_array => {
      let check_x = x + (r * unit_offset_array[0]),
        check_y = y + (r * unit_offset_array[1]);

      let division_x = Math.floor(check_x / this.physics.block_size),
        division_y = Math.floor(check_y / this.physics.block_size),
        division_index = this.physics.division_index(division_x, division_y);

      if (this.physics.divisions[division_index]) d.add(division_index);
    });

    for (let division_index of d)
      for (let group of physics_body.collision_groups)
        this.physics.divisions[division_index][group].add(physics_body);
  }

  clearCollisionDivisions(physics_body) {
    if (physics_body.divisions) {
      for (let i of physics_body.divisions)
        for (let group of physics_body.collision_groups)
          this.physics.divisions[i][group].delete(physics_body);
    }
  }

  assignCollisionPatterns() {
    let checks = this.physics.collision_checks,
      groups = this.physics.collision_groups;


    if (!this.spectate) {

      // MY BULLET <-> ENEMY SHIPS
      checks.push([
        groups.MY_BULLETS,
        groups.ENEMY_SHIPS,
        (bullet, ship) => {
          if (!bullet.disabled && !ship.disabled) {
            NetworkHelper.out_ship_damage(ship.owner.id, bullet.hp);
            NetworkHelper.bullet_destroy(bullet.id);
          }
        }]
      );

      // MY BULLET <-> ENEMY BLOCKS
      checks.push([
        groups.MY_BULLETS,
        groups.ENEMY_BLOCKS,
        (bullet, block) => {
          if (!bullet.disabled && !block.disabled) {
            NetworkHelper.block_damage(block.id, bullet.hp);
            if (bullet.hp < block.hp) NetworkHelper.bullet_destroy(bullet.id);
          }
        }]
      );

      // MY BULLET <-> ENEMY SPAWN_CAMPS
      checks.push([
        groups.MY_BULLETS,
        groups.ENEMY_SPAWN_CAMPS,
        (bullet, spawn_camp) => {
          if (!bullet.disabled) {
            NetworkHelper.bullet_destroy(bullet.id);
          }
        }]
      );

      // OUR BULLET <-> IMPERMEABLES
      // checks.push([
      //   groups.OUR_BULLETS,
      //   groups.IMPERMEABLES,
      //   (bullet, imp) => {
      //     if(!bullet.disabled) {
      //       NetworkHelper.bullet_destroy(bullet.id);
      //     }
      //   }]
      // );

      // // OUR SHIP <-> OUR REFUGE
      // checks.push([
      //   groups.OUR_SHIP,
      //   groups.OUR_REFUGE,
      //   (ship, refuge) => {
      //     if(!ship.disabled) ship.charging = true;
      //   }]
      // );

      // OUR SHIP <-> FLAG
      checks.push([
        groups.OUR_SHIP,
        groups.FLAG,
        (ship, flag) => {
          if (!ship.disabled && flag.idle) ship.pickup(flag);
        }]
      );

      // OUR SUBS <-> ENEMY BLOCKS
      checks.push([
        groups.OUR_PROJ_SUBS,
        groups.ENEMY_BLOCKS,
        (sub, block) => {
          if (!sub.disabled && !block.disabled) {
            switch (sub.type) {
              case 'attractor':
              case 'repulsor':
                // NetworkHelper.sub_destroy(sub.id);
                // NetworkHelper.block_destroy(block.id);
                break;
              case 'block_bomb':
              case 'missile':
                sub.explode();
                break;
            }
          }
        }]
      );

      // OUR SUBS <-> ENEMY SHIPS
      checks.push([
        groups.OUR_PROJ_SUBS,
        groups.ENEMY_SHIPS,
        (sub, ship) => {
          if (!sub.disabled && !ship.disabled) {
            if (sub.type == 'missile') {
              NetworkHelper.out_ship_damage(ship.owner.id, sub.hp);
              NetworkHelper.sub_destroy(sub.id);
            }
          }
        }]
      );

      // OUR SUBS <-> ENEMY SPAWN_CAMPS
      checks.push([
        groups.OUR_PROJ_SUBS,
        groups.ENEMY_SPAWN_CAMPS,
        (sub, spawn_camp) => {
          if (!sub.disabled) NetworkHelper.sub_destroy(sub.id);
        }]
      );

      // OUR SUBS <-> ENEMY SPAWN_CAMPS
      checks.push([
        groups.OUR_BLOCKS,
        groups.OUR_BLOCKS,
        (block_a, block_b) => {
          if (block_a != block_b && !block_a.disabled && !block_b.disabled)
            if (Physics.overlap(block_a, block_b) > 0.8)
              NetworkHelper.block_destroy(block_a.id);
        }]
      );

    }

    // SHIPS <-> WALL OR CAMP (REFUGE)
    checks.push([
      groups.SHIPS,
      groups.REFUGE,
      (ship, refuge) => {
        if (!ship.disabled) {
          if (ship.owner.team.number != refuge.team) {
            Physics.bounce(ship, refuge);
          } else {
            ship.charging = true;
          }
        }
      }]
    );

    // SHIPS <-> IMPERMEABLES
    checks.push([
      groups.SHIPS,
      groups.IMPERMEABLES,
      (ship, imp) => {
        if (!ship.disabled) {
          Physics.bounce(ship, imp);
        }
      }]
    );

    // BULLETS <-> IMPERMEABLES
    checks.push([
      groups.BULLETS,
      groups.IMPERMEABLES,
      (bullet, imp) => {
        if (!bullet.disabled) {
          if (Physics.overlap(bullet, imp) < 0.1) {
            Physics.bounce(bullet, imp, 0.8);
          } else {
            NetworkHelper.bullet_destroy(bullet.id);
          }
        }
      }]
    );

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
      function (callback) {
        window.setTimeout(callback, FPS(60))
      };

    this.setupDT();
  }

  setupDT() {
    this.last_time = (new Date()).getTime();

    // the variable percentage of a second that has gone by since the last frame
    // usually expressed: 0.016 when running 60 fps
    this.dt = 0;
  }

  updateDT() {
    let now = (new Date()).getTime();
    this.dt = (now - this.last_time) / 1000;
    this.last_time = now;
  }

  setupReferences() {
    this.setupShortcutsToCommonCalls();
    this.setupFinishCollisionAssignment();
    this.setupGraphicsCaches();
  }

  setupShortcutsToCommonCalls() {
    if (!this.spectate) {
      // model references
      this.enemyTeams = this.teams.filter(team => team.number != this.ships.main.owner.team.number);
      this.enemyPlayers = this.enemyTeams.reduce((list, team) => list.concat(team.players), []);

      this.player = this.ships.main.owner;
      this.team = this.player.team;
    }
  }

  setupFinishCollisionAssignment() {
    /*
     this method is run near end of the setup since things like ships and players
     and teams and everything else is assigned and references can be made to the
     local players team and such..
     */

    // spawn camps
    this.teams.forEach(team => {
      let spawn_c = team.spawn_camp;
      spawn_c.collision_groups = [this.physics.collision_groups.SPAWN_CAMPS, this.physics.collision_groups.REFUGE] // TODO COLLISION OR PHYSICS CLASS PROTOCOLS
      if (team == this.team) {
        spawn_c.collision_groups.push(this.physics.collision_groups.OUR_SPAWN_CAMP);
        spawn_c.collision_groups.push(this.physics.collision_groups.OUR_REFUGE);
      } else {
        spawn_c.collision_groups.push(this.physics.collision_groups.ENEMY_SPAWN_CAMPS);
      }
      this.setCollisionDivisions(spawn_c);
    });

    // ships
    this.ships.forEach(ship => {
      ship.collision_groups = [this.physics.collision_groups.SHIPS];
      if (ship == this.ships.main) ship.collision_groups.push(this.physics.collision_groups.OUR_SHIP);
      ship.collision_groups.push((ship.owner.team == this.team) ? this.physics.collision_groups.OUR_SHIPS : this.physics.collision_groups.ENEMY_SHIPS)
    });
  }

  setupGraphicsCaches() {
    // TODO: deinit graphics caches

    // cache background
    // this.view.layer.background.cache(0, 0, this.mapInfo.width, this.mapInfo.height);

    // create single cache for common objects
    this.setupCommonGraphicsCachePool();
  }


  setupCommonGraphicsCachePool() {
    let gc = DeepSpaceGame.graphicsCaches = {};

    // bullets
    gc.bullets = [];
    this.teams.forEach(team => {

      // always caching the largest version
      let radius = Bullet.stats.MAX_RADIUS;

      let v = new createjs.Shape(
        DeepSpaceGame.graphics.particle(this.teams[team.number].color, radius)
      );

      var s = radius * 1.2;
      v.cache(-s, -s, s * 2, s * 2);

      gc.bullets[team.number] = v.cacheCanvas;
    });

    // blocks
    gc.blocks = {
      unlocked: [],
      locked: [],
      enemy: []
    };
    this.teams.forEach(team => {

      // always caching the largest version
      let radius = Block.stats.MAX_RADIUS;


      let fill = new createjs.Shape(DeepSpaceGame.graphics.block_fill(this.teams[team.number].color, radius)),
        border = new createjs.Shape(DeepSpaceGame.graphics.block_border(this.teams[team.number].color, radius));

      var s = radius * 1.2;

      // enemy
      fill.cache(-s, -s, s * 2, s * 2);
      gc.blocks.enemy[team.number] = fill.cacheCanvas;

      // unlocked
      fill.alpha = 0.16;
      let c = new createjs.Container();
      c.addChild(fill);
      c.cache(-s, -s, s * 2, s * 2);
      gc.blocks.unlocked[team.number] = c.cacheCanvas;

      // locked
      c = new createjs.Container();
      c.addChild(fill);
      c.addChild(border);
      c.cache(-s, -s, s * 2, s * 2);
      gc.blocks.locked[team.number] = c.cacheCanvas;
    });

    // minimap
    if (this.spectate) return; // TODO make minimap accesible to all even spectators
    gc.minimap = {blocks: []};
    this.teams.forEach(team => {
      // '#37474F'
      let radius = Block.stats.MAX_RADIUS * this.view.overlay.minimap.scale;

      let fill = new createjs.Shape(DeepSpaceGame.graphics.block_fill(COLOR.mix(this.teams[team.number].color, '#37474F', 40), radius));

      var s = radius * 1.2;
      // fill.alpha = 0.16;
      fill.cache(-s, -s, s * 2, s * 2);
      gc.minimap.blocks[team.number] = fill.cacheCanvas;
    });
    // (()=>{
    //   let radius = 128 * this.view.overlay.minimap.scale;
    //
    //   let fill = new createjs.Shape(DeepSpaceGame.graphics.block_fill(, radius));
    //
    //   var s = radius * 1.2;
    //   // fill.alpha = 0.16;
    //   fill.cache(-s, -s, s*2, s*2);
    //   gc.minimap.blocks[team.number] = fill.cacheCanvas;
    //
    //   gc.minimap.impermeables = ;
    // })
  }

  actualize() {
    // bring an outside game up to speed

    // scores
    this.setupData.state.scores.forEach((entry) => {
      this.game.scores[entry.t] = entry.s
    });

    // flag
    var holder;
    setTimeout(() => {
      if (holder = this.setupData.state.flagHolder) this.pickupFlag(holder);
    }, 100);

    // disconnects
    this.setupData.disconnects.forEach(id => this.disconnectPlayer(id))

  }


  loop() {
    // stats.begin();
    this.updateDT();
    this.update();
    this.log();
    // stats.end();

    // NetworkHelper.release();

    getAnimationFrame(() => this.game.ended ? true : this.loop())
  }

  update() {
    // this function duty is as follows:
    // to update all the moving parts pertaining to the current/local user.
    // any collisions should be sent back to the server to sync the changes.
    var over = this.game.disabled;
    if (!over) this.updateInput();
    this.updateModel(); // TODO: improve performance
    if (!over) this.checkForCollisions();
    // if(this.isHost) this.generateMapEntities();

    if (!over) this.updateGame();

    this.updateView();
  }

  updateInput() {
    // if(!this.spectate) this.updateGamepadInput();
    if (!this.spectate) if (this.player.input.updateMotion) this.player.input.updateMotion();
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
    for (var ship of this.ships) {

      ship.update(this.dt);

      if (ship == this.ships.main && !ship.disabled) {

        var input = ship.owner.input,
          x = 0, y = 0, x2 = 0, y2 = 0,
          s = false;

        for (var prop of input) {
          switch (prop) {
            case 'up':
              y = -1;
              break;
            case 'dn':
              y = 1;
              break;
            case 'lt':
              x = -1;
              break;
            case 'rt':
              x = 1;
              break;
            case 'up2':
              y2 = -1;
              break;
            case 'dn2':
              y2 = 1;
              break;
            case 'lt2':
              x2 = -1;
              break;
            case 'rt2':
              x2 = 1;
              break;
            case 'sub':
              // if(!ship.flag) ship.sub();
              ship.flag ? NetworkHelper.out_flag_drop() : ship.sub();
              break;
            case 'block':
              ship.block();
              break;
            case 'shoot':
              s = true;
              break;
          }
        }

        ship.acceleration.set({x, y})
        if (ship.acceleration.length) ship.acceleration.length = ship.LINEAR_ACCELERATION_LIMIT;

        // if(ship.acceleration.length) ship.angle = ship.acceleration.angle
        if (ship.velocity.length) ship.angle = ship.velocity.angle;

        var direction_v = new V2D(x2, y2)
        ship.shoot_angle = direction_v.length ? direction_v.angle : ship.angle;

        // if(direction_v.length) ship.shoot();

        if (s || direction_v.length) ship.shoot();
      }

      // validate new position TODO (revise)
      let r = ship.radius + 8;
      if (ship.position.x - r < 0) {
        ship.position.x = r;
        ship.velocity.x = 0
      }
      if (ship.position.y - r < 0) {
        ship.position.y = r;
        ship.velocity.y = 0
      }
      if (ship.position.x + r > this.mapInfo.width) {
        ship.position.x = this.mapInfo.width - r;
        ship.velocity.x = 0;
      }
      if (ship.position.y + r > this.mapInfo.height) {
        ship.position.y = this.mapInfo.height - r;
        ship.velocity.y = 0;
      }

      this.setCollisionDivisions(ship);

      // if(ship.position.x < 0) Physics.bounce_off_line(ship, V2D.new(0, 0), V2D.new(0, this.mapInfo.height))
      // if(ship.position.y < 0) Physics.bounce_off_line(ship, V2D.new(0, 0), V2D.new(0, this.mapInfo.width))
      // if(ship.position.x > this.mapInfo.width) Physics.bounce_off_line(ship, V2D.new(0, this.mapInfo.height))
      // if(ship.position.y > this.mapInfo.height) Physics.bounce_off_line(ship, V2D.new(0, this.mapInfo.width))

      // if(ship.position.x < 0) ship.position.x = this.mapInfo.width;
      // if(ship.position.y < 0) ship.position.y = this.mapInfo.height;
      // if(ship.position.x > this.mapInfo.width) ship.position.x = 0;
      // if(ship.position.y > this.mapInfo.height) ship.position.y = 0;
    }
  }

  broadcastShip() {
    var ship, input;
    if ((ship = this.ships.main) && (input = ship.owner.input)) {
      if (input.changed) {
        // log(Array.from(input));
        // NetworkHelper.out_input_stack(Array.from(input));
        input.changed = false;
      }

      NetworkHelper.out_ship_update(ship.export_update());

      if ((new Date()).getTime() % 60 < 2) NetworkHelper.out_ship_override(ship.export_override());
      if (ship.flag && ship.disabled) NetworkHelper.out_flag_drop();
      // if(ship.flag && ship.disabled && !this.game.flag.idle) NetworkHelper.out_flag_drop();
    }
  }

  updateBullets() {
    this.model.bullets.forEach(b => {
      b.update(this.dt);
      this.setCollisionDivisions(b)
    });
    // this.model.bullets.forEach(b => { b.update(); if(b.disabled) NetworkHelper.out_bullet_destroy(b.id) });
  }

  updateBlocks() { // needs needs work
    this.model.blocks.forEach(b => {
      if (b.locked) return;
      if (b.qualified) {
        this.setCollisionDivisions(b);
        if (!this.spectate) this.createOverlayMinimapBlockViewFor(b);
        if (!this.spectate) if (b.team != this.team.number) this.refGroups.enemyBlocks.add(b); // TODO REVISE AFTER NEW COLLISION SYSTEM!!
        b.locked = true;
        b.qualified = false;
      }
      b.update(this.dt);
      // if(b.disabled) NetworkHelper.out_block_destroy(b.id) // due to aging
    });
  }

  updateSubs() {
    this.model.subs.forEach(p => {
      p.update(this.dt);
      if (p.collision_groups) this.setCollisionDivisions(p);

      switch (p.type) {
        case 'attractor':
        case 'repulsor':

          // field effects TODO is games responsibility..? dt is passed to subs themseves..
          var distance, direction;
          this.model.bullets.forEach((b) => {
            if (!b.disabled && p.team != b.team) {
              if ((distance = Physics.distance(b.position, p.position)) < p.RANGE) {
                var force = new V2D();
                direction = p.position.copy();
                direction.sub(b.position);
                force.length = p.INTENSITY_FUNCTION(distance);
                force.angle = direction.angle;
                if (p.type == 'repulsor') force.angle = force.angle - Math.PI;
                b.velocity.add(force);
                b.velocity.length *= 0.94; // friction TODO
              }
            }
          });

          break;
        case 'block_bomb':


          if (p.exploding) {

            // only the player who created it hands out damage to the blocks so it is done once
            var ship;
            if ((ship = this.ships.main) && (ship.subs.has(p.id))) {
              var distance;
              this.refGroups.enemyBlocks.forEach(block => {
                if (block && !block.disabled) {
                  if ((distance = Physics.distance(block.position, p.position)) < p.EXPLOSION_RANGE) {
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
          if (p.target && (Physics.distance(p.target.position, p.position) > p.VISION_RANGE || p.target.stealth)) p.target = null;
          this.ships.forEach(ship => {
            if (ship && !ship.disabled && !ship.stealth && ship.owner.team.number != p.team) {
              if (!p.target && ((distance = Physics.distance(ship.position, p.position)) < p.VISION_RANGE)) {
                p.target = ship;
              }
            }
          });

          // exploding
          if (p.exploding) {

            // only the player who created it hands out damage to the blocks so it is done once
            var ship;
            if ((ship = this.ships.main) && (ship.subs.has(p.id))) {
              var distance;
              this.refGroups.enemyBlocks.forEach(block => {
                if (block && !block.disabled) {
                  if ((distance = Physics.distance(block.position, p.position) - block.radius) < p.EXPLOSION_RANGE) {
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

    for (let div of this.physics.divisions) {
      for (var [a_type, b_type, check] of this.physics.collision_checks)
        for (let body_a of div[a_type])
          for (let body_b of div[b_type])
            if (Physics.doTouch(body_a, body_b))
              check(body_a, body_b);
    }

  }

  updateGame() {
    var flag = this.game.flag;
    if (!flag.idle) {
      var player = this.players.get(flag.holderID),
        p = player.ship.last_known_position,
        camp = player.team.spawn_camp;
      flag.position.x = p.x;
      flag.position.y = p.y;

      this.setCollisionDivisions(flag);

      // real game stuff
      var distance = Physics.distance(p, camp.position) - camp.radius,
        percent = distance / this.game.max,
        low_score = this.game.scores[player.team.number],
        current_score = Math.round(percent * 100);

      if (current_score < low_score && current_score >= 0) this.game.scores[player.team.number] = current_score;

      if ((percent < 0) && player == this.player) NetworkHelper.out_game_over(player.team.number);


      // LEAD COMPARISON
      // replace lead if none exists
      if (!this.game.lead) this.game.lead = player.team;

      // replace lead if record shows
      if (current_score < this.game.scores[this.game.lead.number]) {

        if (!this.spectate) {
          // if you are replacing
          if (player.team == this.team) {
            let c = this.team.color;
            this.alert(
              DeepSpaceGame.localizationStrings.alerts['teamTakesLead'][this.language]()
              , c);
            if (this.game.overtime) NetworkHelper.out_game_over(this.team.number);
          }
          // if you are being replaced
          else if (this.game.lead == this.team) {
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
    this.updateBackground();
    this.updateMap();
    // this.updateGrid();

    this.updateGameViews();

    if (!this.spectate) this.updateMinimapView()

    this.stage.update(); // render changes!!
  }

  updateShipViews() {
    this.ships.forEach((ship) => {

      if (ship.view.visible = this.camera.showing(ship) || ship.view == this.camera.focus) {

        var visibility = 1;
        if (ship.disabled) {
          visibility = 0;
        } else if (ship.stealth) {
          if (ship.owner.team == this.team) {
            visibility = Math.flipCoin(0.2) ? 0 : 0.4;
          } else {
            visibility = 0;
          }
        } else {
          visibility = 1;
        }

        let ship_view = ship.view.ship;
        ship_view.alpha = ship.health * visibility;
        ship_view.rotation = Math.degrees(ship.angle);

        ship.view.x = ship.position.x;
        ship.view.y = ship.position.y;

        // ship.view.graphics.clear();
        ship_view.image = ((ship.flag) ? ship_view.filled : ship_view.hollow);

      }

    });
    this.updateEnergyMeterView();
  }

  updateEnergyMeterView() {
    if (this.spectate) return;

    let ship = this.player.ship,
      meterView = ship.view.meter,
      shadowView = meterView.shadow,
      percent = ship.energy / 100;
    meterView.graphics = DeepSpaceGame.graphics.energyMeter(this.team.color, percent);
    meterView.alpha = shadowView.alpha = ship.disabled ? 0 : 1;
  }

  updateBulletViews() {
    var views = this.view.bullets;
    this.model.bullets.forEach(b => {
      var v = views.get(b.id);
      if (v.visible = this.camera.showing(b)) {
        v.x = b.position.x;
        v.y = b.position.y;
      }
    });
  }

  updateBlockViews() {
    var views = this.view.blocks;
    this.model.blocks.forEach(b => {
      var v = views.get(b.id);
      if (!b.locked || (v.visible = this.camera.showing(b))) {
        v.alpha = (b.health * 0.9 + 0.1);
        if (!b.locked) {
          v.x = b.position.x;
          v.y = b.position.y;
          // v.graphics.command.radius = b.radius;
          v.scaleX = v.scaleY = (b.radius / Block.stats.MAX_RADIUS) * b.scale;
        }
      }
      if (b.qualified) {
        let type = b.isForeign ? 'enemy' : 'locked';
        v.image = DeepSpaceGame.graphicsCaches.blocks[type][b.team];
      }
    });
  }

  updateSubViews() {
    var views = this.view.subs;
    this.model.subs.forEach(p => {
      var v = views.get(p.id);
      if (v) {
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

  updateBackground() {
    // let background = this.view.layer.background.map_background,
    //     full_map_width = this.mapInfo.width,
    //     full_map_height = this.mapInfo.height,
    //     {x, y} = this.camera.focus,
    //     half_window_width = this.window.width/2,
    //     half_window_height = this.window.height/2;
    //
    // if(x < half_window_width) background.x = half_window_width - x;
    // if(x > (full_map_width - half_window_width)) background.x = full_map_width - half_window_width - x;
    //
    // if(y < half_window_height) background.y = half_window_height - y;
    // if(y > (full_map_height - half_window_height)) background.y = full_map_height - half_window_height - y;
  }

  updateMap() {
    this.teams.forEach(team => {
      team.spawn_camp.view.visible = this.camera.showing(team.spawn_camp);
    })

    this.model.map.impermeables.forEach((imp, i) => {
      this.view.map.impermeables[i].visible = this.camera.showing(imp);
    });

  }

  updateGrid() {
    var focus = this.camera.focus;
    if (focus) GRID.offset(-focus.x, -focus.y)
  }

  updateGameViews() {

    this.view.overlay.score.team.forEach((text, i) => {
      text.text = this.game.scores[i];
      // text.scaleX = text.scaleY = (this.teams[i] == this.game.lead ? 1 : 0.86);
      text.scaleX = text.scaleY = (this.teams[i].players.indexOf(this.players.get(this.game.flag.holderID)) != -1 ? 1 : 0.86);
    })

    this.updateFlagView();

  }

  updateFlagView() {
    var v = this.view.flag, flag = this.game.flag;

    var not_visible = false;
    v.x = flag.position.x + this.camera.plane.x;
    v.y = flag.position.y + this.camera.plane.y;
    var padding = (flag.radius * 2)
    if (v.x < padding) {
      v.x = padding;
      not_visible = true;
    }
    if (v.x > this.window.width - padding) {
      v.x = this.window.width - padding;
      not_visible = true;
    }
    if (v.y < padding) {
      v.y = padding;
      not_visible = true;
    }
    if (v.y > this.window.height - padding) {
      v.y = this.window.height - padding;
      not_visible = true;
    }

    v.alpha = not_visible ? 0.3 : (flag.idle ? 1 : 0);


    // var v = this.view.flag, flag = this.game.flag;
    //
    // var not_visible = false;
    // v.x = flag.position.x + this.camera.plane.x;
    // v.y = flag.position.y + this.camera.plane.y;
    // var padding = (flag.radius * 2)
    // if(v.x < padding) { v.x = padding; not_visible = true; }
    // if(v.x > this.window.width - padding) { v.x = this.window.width - padding; not_visible = true; }
    // if(v.y < padding) { v.y = padding; not_visible = true; }
    // if(v.y > this.window.height - padding) { v.y = this.window.height - padding; not_visible = true; }
    //
    // v.alpha = not_visible ? 0.1 : (flag.idle ? 1 : 0);
  }

  updateMinimapView() {
    let mini = this.view.overlay.minimap;

    // ships
    this.team.players.forEach((player, i) => {
      mini.players[i].x = player.ship.position.x * mini.scale;
      mini.players[i].y = player.ship.position.y * mini.scale;
    })

    // flag
    let flag = this.game.flag;
    mini.flag.x = flag.position.x * mini.scale;
    mini.flag.y = flag.position.y * mini.scale;

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

    // FPS
    // this.last = this.last || [];
    // this.last.push(1/this.dt)
    // if(this.last.length > 10) this.last.shift();
    // $('#log').text(`fps ${Math.round(this.last.average())}`);
  }


  // end vs stop: end happens when the local game appears to conclude; interaction with the game is stopped
  // and the state might even be obstructed from view though the simluation continues;

  disableInteraction() {
    this.game.disabled = true;
    if (this.player) this.resetInput();
    this.deinitListeners();
    this.timer.cancel();
  }

  endSimulation() {
    this.game.ended = true;
    SoundHelper.stop();
  }

  timerExpire() {
    // LOBBY.disableGame();

    // disconnect if no server response after 6s
    setTimeout(() => {
      if (!(this.game.ended || this.game.overtime)) LOBBY.disconnect();
    }, 6000);
  }

  takeOvertime() {
    this.game.overtime = true;

    // disconnect if no server response after 40s
    setTimeout(() => {
      if (!(this.game.ended)) LOBBY.disconnect();
    }, TIME.sec(40)); // OVERTIME DURATION.. todo
  }

  // maybe..

  startBullet(data) {
    var b = new Bullet(data);

    // create a view for it.
    let cache = DeepSpaceGame.graphicsCaches.bullets[b.team];
    var bv = new createjs.Bitmap(cache);
    bv.scaleX = bv.scaleY = b.radius / Bullet.stats.MAX_RADIUS;
    bv.regX = bv.regY = (cache.width / 2);
    this.view.layer.action.back.addChild(bv);

    this.model.bullets.set(b.id, b);
    this.view.bullets.set(b.id, bv);

    b.collision_groups = [this.physics.collision_groups.BULLETS];
    b.collision_groups.push(this.teams[b.team] == this.team ? this.physics.collision_groups.OUR_BULLETS : this.physics.collision_groups.ENEMY_BULLETS);
    if (!this.spectate && b.creator == this.player.id) b.collision_groups.push(this.physics.collision_groups.MY_BULLETS);

    // sound
    // if(this.camera.showing(b)) SoundHelper.fireShot();

    return b;
  }

  endBullet(id) {
    var b = this.model.bullets.get(id);
    if (!b) return;

    this.clearCollisionDivisions(b);

    this.model.bullets.delete(id);
    if (!this.spectate) this.ships.main.bullets.delete(id);

    // erase the view for it.
    var v = this.view.bullets.get(id);
    if (v) {
      this.view.bullets.delete(id);
      this.view.layer.action.back.removeChild(v);
    }

  }

  startBlock(data) {
    var bl = new Block(data);

    // create a view for it.
    bl.isForeign = this.spectate || bl.team != this.team.number;
    let type = false ? 'enemy' : 'unlocked';
    let cache = DeepSpaceGame.graphicsCaches.blocks[type][bl.team];
    var blv = new createjs.Bitmap(cache);
    blv.scaleX = blv.scaleY = bl.radius / Block.stats.MAX_RADIUS;
    blv.regX = blv.regY = (cache.width / 2);
    this.view.layer.action.back.addChild(blv);

    this.model.blocks.set(bl.id, bl);
    this.view.blocks.set(bl.id, blv);

    bl.collision_groups = [this.physics.collision_groups.REFUGE]
    if (this.teams[bl.team] != this.team) {
      bl.collision_groups.push(this.physics.collision_groups.ENEMY_BLOCKS)
    } else {
      bl.collision_groups.push(this.physics.collision_groups.OUR_REFUGE)
      bl.collision_groups.push(this.physics.collision_groups.OUR_BLOCKS)
    }
    // bl.collision_groups = [this.teams[bl.team] == this.team ? this.physics.collision_groups.OUR_BULLETS : this.physics.collision_groups.ENEMY_BULLETS];

    return bl;
  }

  changeBlock(id, team) {
    // retrieve and store block
    var b = this.model.blocks.get(id);
    if (!b) return false;

    // begin change if locked
    if (b.locked) {

      // skip if change is unnecessary
      if (b.team != team) {

        // assign new team
        b.team = team;

        // if not spectating add or remove from ref group
        if (!this.spectate) {
          if (b.team != this.team.number) {
            this.refGroups.enemyBlocks.add(b);
          } else {
            this.refGroups.enemyBlocks.delete(b);
          }
        }

        // replace and delete old view
        var v = this.view.blocks.get(id);
        if (v) {
          let type = this.refGroups.enemyBlocks.has(b) ? 'enemy' : (b.locked ? 'locked' : 'unlocked');
          v.image = DeepSpaceGame.graphicsCaches.blocks[type][b.team];
          // v.updateCache();
        }

      }
    }

    this.clearCollisionDivisions(b);
    b.collision_groups = [this.physics.collision_groups.REFUGE]
    if (this.teams[b.team] != this.team) {
      b.collision_groups.push(this.physics.collision_groups.ENEMY_BLOCKS)
    } else {
      b.collision_groups.push(this.physics.collision_groups.OUR_REFUGE)
    }
    this.setCollisionDivisions(b);

  }

  endBlock(id) {
    var b = this.model.blocks.get(id);
    if (!b) return false;

    this.clearCollisionDivisions(b);

    this.model.blocks.delete(id);
    if (!this.spectate) this.ships.main.blocks.delete(id);

    if (b.locked) this.refGroups.enemyBlocks.delete(b);

    // erase the view for it.
    var v = this.view.blocks.get(id);
    if (v) {
      this.view.blocks.delete(id);
      this.view.layer.action.back.removeChild(v);
    }
    if (!this.spectate) {
      var v = this.view.overlay.minimap.blocks.get(id);
      if (v) {
        this.view.overlay.minimap.blocks.delete(id);
        this.view.overlay.minimap.removeChild(v);
      }
    }
    return true;
  }

  startSub(data) {
    var p;
    switch (data.type) {
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
    if (data.type != 'stealth_cloak') {
      var graphics;
      switch (data.type) {
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
      pv.cache(-12, -12, 24, 24);
      this.view.layer.action.back.addChild(pv);

      this.view.subs.set(p.id, pv);

      // if(this.camera.showing(p)) SoundHelper.fireSub(); // no sound for stealth

      p.collision_groups = (this.teams[p.team] == this.team) ? [this.physics.collision_groups.OUR_PROJ_SUBS] : [];
    }

    this.model.subs.set(p.id, p);

    if (!this.spectate) if (p.team != this.ships.main.owner.team.number) this.refGroups.enemySubs.add(p.id);

    return p;
  }

  endSub(id) {
    var p = this.model.subs.get(id);
    if (!p) return false;

    this.clearCollisionDivisions(p);

    this.model.subs.delete(id);
    if (!this.spectate) this.ships.main.subs.delete(id);

    this.refGroups.enemySubs.delete(p.id);

    // erase the view for it.
    if (p.type != 'stealth_cloak') {
      var v = this.view.subs.get(id);
      if (v) {
        this.view.subs.delete(id);
        this.view.layer.action.back.removeChild(v);
      }
    }
    return true;
  }

  pickupFlag(playerID) { // flag activation needs to go through here
    var flag = this.game.flag, ship = null;
    // if(!flag.idle) NetworkHelper.out_flag_drop();
    flag.holderID = playerID;

    var player = this.players.get(flag.holderID);


    if (ship = player.ship) {
      ship.setFlag(flag);
      if(this.game.overtime)
        if(ship.owner.team == this.game.lead)
          if(ship.owner.team == this.team)
            NetworkHelper.out_game_over(this.team.number);
    }



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
    if (id = flag.holderID) {
      var player = this.players.get(flag.holderID)
      if (ship = player.ship)
        ship.clearFlag();

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
    v.text = msg;
    v.color = color;
    if (msg.trim() !== '') this.alertTimeout = setTimeout(() => {
      this.alert("")
    }, 4000)
  }

  alert_kill(msg, color = "#ECEFF1") {
    clearTimeout(this.alertKillTimeout)
    var v = this.view.overlay.kill_message;
    v.text = msg;
    v.color = color;
    v.text = msg;
    v.color = color;
    if (msg.trim() !== '') this.alertKillTimeout = setTimeout(() => {
      this.alert_kill("")
    }, 4000)
  }


  msgShipKill(takerID, giverID) {//alert(`takerID ${takerID}, giverID ${giverID},`)
    var t = this.players.get(takerID), g = this.players.get(giverID);
    if (t) t.score.deaths++;
    if (g) g.score.kills++;

    if (this.spectate) return;
    if (takerID == this.player.id) {
      const player = this.players.get(giverID);
      this.alert_kill(
        DeepSpaceGame.localizationStrings.alerts['yourDeath'][this.language](
          player.name
        )
      );
      this.camera.animateFocus(player.ship.view, [this.player.ship, 'disabled']);
      // this.camera.animateFocus(player.ship.view, player.ship.RESPAWN_DELAY*16.7);
    } else if (giverID == this.player.id) {
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

    delete DeepSpaceGame.graphicsCaches;
  }

  deinitPhysics() {
    delete this.refGroups;
  }

  deinitInput() {
    var main = this.ships.main;
    if (main) delete main.owner.input;
  }

  deinitListeners() {
    for (let [, handler] of this.inputHandlers) {
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
    if (this.player) if (input = this.player.input) input.clear();
  }

  disconnectPlayer(id) {
    var player = this.players.get(id);
    if (player) {
      player.disconnected = true;
      player.ship.disabled = true;
      if (this.spectate) this.activePlayers.delete(player)
    } else {
      log(`not found`)
    }
  }

}

DeepSpaceGame.graphics = {
  circle_fill: (color, size) => new createjs.Graphics().beginFill(color).drawCircle(0, 0, size),

  spawn_camp: (color) => new createjs.Graphics().beginStroke(color).setStrokeStyle(4).drawCircle(0, 0, 64),
  spawn_camp_fill: (color) => new createjs.Graphics().beginFill(color).drawCircle(0, 0, 64),
  // spawn_camp: () => new createjs.Graphics().beginStroke("#37474F").setStrokeStyle(4).drawCircle(0, 0, 64),
  ship: {
    "damage": [(color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(8, 0).lineTo(4.8, -8).lineTo(-8, -8).lineTo(-4.8, 0).lineTo(-8, 8).lineTo(4.8, 8).lineTo(8, 0).lineTo(4.8, -8),
      (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(8, 0).lineTo(4.8, -8).lineTo(-8, -8).lineTo(-4.8, 0).lineTo(-8, 8).lineTo(4.8, 8).lineTo(8, 0).lineTo(4.8, -8)],

    "speed": [(color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(8, 0).lineTo(-8, -8).lineTo(-4.8, 0).lineTo(-8, 8).lineTo(8, 0).lineTo(-8, -8),
      (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(8, 0).lineTo(-8, -8).lineTo(-4.8, 0).lineTo(-8, 8).lineTo(8, 0).lineTo(-8, -8)],

    "standard": [(color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(8, 0).lineTo(-8, -8).lineTo(-8, 8).lineTo(8, 0).lineTo(-8, -8),
      (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(8, 0).lineTo(-8, -8).lineTo(-8, 8).lineTo(8, 0).lineTo(-8, -8)],

    "rate": [(color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(8, 0).lineTo(-4.8, -8).lineTo(-8, 0).lineTo(-4.8, 8).lineTo(8, 0).lineTo(-4.8, -8),
      (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(8, 0).lineTo(-4.8, -8).lineTo(-8, 0).lineTo(-4.8, 8).lineTo(8, 0).lineTo(-4.8, -8)],

    "defense": [(color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(8, 0).lineTo(6.4, -4).lineTo(-8, -8).lineTo(-8, 8).lineTo(6.4, 4).lineTo(8, 0).lineTo(6.4, -4),
      (color, width) => new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(8, 0).lineTo(6.4, -4).lineTo(-8, -8).lineTo(-8, 8).lineTo(6.4, 4).lineTo(8, 0).lineTo(6.4, -4)]
  },
  particle: (color, size) => new createjs.Graphics().beginStroke(color).setStrokeStyle(4).drawCircle(0, 0, size),
  // bullet: (color) => DeepSpaceGame.graphics.particle(color)
  // block: (color, size) => new createjs.Graphics().beginFill(color).drawCircle(0, 0, size),
  block_border: (color, size) => new createjs.Graphics().beginStroke(color).setStrokeStyle(2).drawCircle(0, 0, size),
  block_fill: (color, size) => new createjs.Graphics().beginFill(color).drawCircle(0, 0, size),
  block_center: (color) => new createjs.Graphics().beginFill(color).drawCircle(0, 0, 2),

  attractor: color => new createjs.Graphics().beginFill(color).moveTo(2, 2).lineTo(2, 8).lineTo(-2, 8).lineTo(-2, 2).lineTo(-8, 2).lineTo(-8, -2).lineTo(-2, -2).lineTo(-2, -8).lineTo(2, -8).lineTo(2, -2).lineTo(8, -2).lineTo(8, 2).lineTo(2, 2),
  repulsor: color => new createjs.Graphics().beginFill(color).moveTo(2, -8).lineTo(2, 8).lineTo(-2, 8).lineTo(-2, -8).lineTo(2, -8),//.lineTo(-8, -2).lineTo(-2, -2).lineTo(-2, -8).lineTo(2, -8).lineTo(2, -2).lineTo(8, -2).lineTo(8, 2).lineTo(2, 2),
  block_bomb: color => new createjs.Graphics().beginFill(color).moveTo(-10, 0).arcTo(-10, -10, 0, -10, 10).lineTo(0, 10).arcTo(-9, 9, -10, 0, 10),
  missile: color => new createjs.Graphics().beginFill(color).moveTo(6, 0).lineTo(-6, -6).lineTo(-6, 6).lineTo(6, 0),


  ring: r => new createjs.Graphics().beginStroke("#ECEFF1").setStrokeStyle(16).drawCircle(0, 0, r),
  flag: r => new createjs.Graphics().beginFill("#ECEFF1").drawCircle(0, 0, r),
  flag_shadow: () => new createjs.Shadow("#ECEFF1", 0, 0, 10),

  energyMeter: (color, percent, radius = 5) => new createjs.Graphics().beginFill(color).moveTo(0, 0).arc(0, 0, radius, (-Math.PI / 2), (2 * Math.PI * percent) - (Math.PI / 2)),
  energyMeterShadow: (color) => new createjs.Graphics().beginFill(color).moveTo(0, 0).arc(0, 0, 7, 0, 2 * Math.PI)
};

DeepSpaceGame.renderingParameters = {
  'bulletCount': 100,
  'shipThrustParticleCount': 80
}

DeepSpaceGame.localizationStrings = {
  alerts: {
    enemyTakesFlag: {
      en: (color) => `The ${color} team has the moon!`
    },
    teamTakesFlag: {
      en: () => `We have the moon!`
    },
    enemyDropsFlag: {
      en: (color) => `The ${color} team dropped the moon!`
    },
    teamDropsFlag: {
      en: () => `We dropped the moon!`
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

DeepSpaceGame.maps = [ // TODO : block bomb radius large hp damage less
  { // 0
    name: "The Event Horizon",
    width: 1920, height: 1920,
    // width: 1024, height: 1024
    spawn: [
      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}],
      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}],
      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}],
      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}]
    ]
  },
  { // 1
    name: "Liftor",
    width: 1920, height: 1920,
    teams: [2],

    // first array is for the number of teams coresponding to the teams array
    // second is place in the arrangement for that number of teams
    // object is position
    spawn: [
      // [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}] // 2

      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}],
      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}],
      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}],
      [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}, {x: 1920 - 192, y: 192}, {x: 192, y: 1920 - 192}]
    ],
    impermeables: {
      copies: 2,
      bodies: [
        [32, // radius
          [929, 76],
          [582, 128],
          [696, 176],
          [811, 226],
          [173, 892],
          [173, 1028]
        ],
        [48,
          [1218, 274],
          [1242, 786],
          [238, 960]
        ],
        [64,
          [1654, 546],
          [637, 578]
        ]
      ]
    }
  },
  { // 2
    name: "Nautical",
    width: 3072 * 1, height: 3072 * 1,
    teams: [2],

    // first array is for the number of teams coresponding to the teams array
    // second is place in the arrangement for that number of teams
    // object is position
    spawn: [
      // [{x: 192, y: 192}, {x: 3072 - 192, y: 3072 - 192}] // 2

      [{x: 581, y: 555}, {x: 3072 - 581, y: 3072 - 555}, {x: 3072 - 581, y: 555}, {x: 581, y: 3072 - 555}],
      [{x: 581, y: 555}, {x: 3072 - 581, y: 3072 - 555}, {x: 3072 - 581, y: 555}, {x: 581, y: 3072 - 555}],
      [{x: 581, y: 555}, {x: 3072 - 581, y: 3072 - 555}, {x: 3072 - 581, y: 555}, {x: 581, y: 3072 - 555}],
      [{x: 581, y: 555}, {x: 3072 - 581, y: 3072 - 555}, {x: 3072 - 581, y: 555}, {x: 581, y: 3072 - 555}]
    ],
    impermeables: {
      copies: 4,
      bodies: [
        [32, // radius
          [325, 764],
          [989, 98],
          [746, 898],
          [1054, 1308],
          [1179, 1260],
          [1514, 1308],
          [993, 1356],
          [534, 1308],
          [1546, 194],
          [1488, 130],
          [173, 1028],
          [173, 892],
          [470, 880],
          [325, 764],
          [667, 892]
        ],
        [48,
          [1218, 274],
          [1242, 786],
          [618, 1260],
          [1139, 1340],
          [238, 960],
          [794, 818]
        ],
        [64,
          [1084, 475],
          [422, 322],
          [914, 784],
          [1654, 546],
          [1279, 1219],
          [1423, 1228]
        ],
        [96,
          [298, 539],
          [967, 610]
        ],
        [128,
          [831, 411]
        ]
      ]
    }
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
