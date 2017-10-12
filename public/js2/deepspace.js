'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// deep space js by david ruiz.


var DeepSpaceGame = function () {

  // at initialization we can assume the environment
  // knows certain game parameters:
  // - map
  // - game mode
  // - players: amount, names, ship types, indexes,
  function DeepSpaceGame(data, network) {
    _classCallCheck(this, DeepSpaceGame);

    this.interpret(data, network);
    this.setup();
    // this.loop();
  }

  _createClass(DeepSpaceGame, [{
    key: 'start',
    value: function start() {
      var _this = this;

      this.loop();
      this.timer.start(function () {
        _this.timerExpire();
      });
    }
  }, {
    key: 'interpret',
    value: function interpret(data, network) {
      // anything pertaining to game
      // object itself gets set
      this.spectate = ENV.spectate;
      this.isHost = data.host;
      this.mapInfo = DeepSpaceGame.maps[data.options.map];
      this.gameMode = data.options.mode;
      this.game = {};
      this.language = 'en';
      this.timer = new Timer(data.duration - TIME.sec(1.5));

      this.network = network;
      this.network.game = this;

      // SoundHelper.start(); // new
      // this.soundHelper = SoundHelper.start(); // olc

      try {
        // if (TINT) TINT.load(...data.colors[1])
        if (TINT) {
          if (this.mapInfo.tint) {
            var _TINT;

            (_TINT = TINT).load.apply(_TINT, _toConsumableArray(this.mapInfo.tint));
          } else {
            var _TINT2;

            (_TINT2 = TINT).load.apply(_TINT2, _toConsumableArray(data.colors[1]));
          }
        }
      } catch (e) {
        log('tint load failed');
      }

      // everything else:
      this.setupData = data;
    }
  }, {
    key: 'setup',
    value: function setup() {
      this.setupPhysics();
      this.setupModel();
      this.setupView();
      this.setupListeners();
      this.setupLoop();
      this.setupReferences();

      // if (this.spectate) this.actualize();
    }
  }, {
    key: 'setupModel',
    value: function setupModel() {
      this.setupTeams();
      this.setupPlayers();
      this.setupShips();
      this.setupObjectPools();

      this.setupGame();
      this.setupMap();
    }
  }, {
    key: 'setupTeams',
    value: function setupTeams() {
      var _this2 = this;

      this.teams = [];
      var teamCount = this.setupData.teams.length;
      teamCount.times(function (i) {
        _this2.teams.push(new Team(_this2, i));
      });

      this.setupSpawnCamps();
    }
  }, {
    key: 'setupSpawnCamps',
    value: function setupSpawnCamps() {
      var _this3 = this;

      this.teams.forEach(function (team) {
        team.spawn_camp = {
          position: V2D.new(_this3.mapInfo.spawn[team.game.teams.length - 1][team.number]),
          radius: 64,
          team: team.number
        };
      });
    }
  }, {
    key: 'setupPlayers',
    value: function setupPlayers() {
      var _this4 = this;

      this.players = new Map();
      this.teams.forEach(function (team, i) {
        _this4.setupData.teams[i].forEach(function (playerIndex) {
          var _setupData$players$pl = _slicedToArray(_this4.setupData.players[playerIndex], 6),
              id = _setupData$players$pl[0],
              name = _setupData$players$pl[1],
              type = _setupData$players$pl[5];

          team.createPlayer(id, name, type);
        });
      });
    }
  }, {
    key: 'setupShips',
    value: function setupShips() {
      var _this5 = this;

      this.ships = [];
      this.players.forEach(function (player) {
        var ship;
        if (localIDMatches(player.id) && !_this5.spectate) {
          ship = new Ship(player);
          ship.isMain = true;
          _this5.ships.main = ship;
        } else {
          ship = new BasicShip(player);
        }
        _this5.ships.push(ship);
        player.ship = ship;
      });
    }
  }, {
    key: 'setupObjectPools',
    value: function setupObjectPools() {
      var model = {};
      model.bullets = new Map();
      model.blocks = new Map();
      model.subs = new Map();

      this.model = model;
    }
  }, {
    key: 'setupGame',
    value: function setupGame() {
      this.game = {};
      this.game.disabled = false; // interaction disabled
      this.game.ended = false; // game over happened
      this.game.overtime = false; // game overtime happened

      this.game.scores = new Array(this.teams.length);

      // this.timer = DeepSpaceGame.modes[this.gameMode];
      switch (this.gameMode) {
        case 0:
          // ctf

          // flag whatevers
          var centerX = this.mapInfo.width / 2;
          var centerY = this.mapInfo.height / 2;
          var flag = new Flag(new V2D(centerX, centerY));
          flag.collision_groups = [this.physics.collision_groups.FLAG];
          this.setCollisionDivisions(flag);
          this.game.flag = flag;

          // actual game stats
          this.game.scores.fill(100);
          this.game.max = Physics.distance(this.teams[0].spawn_camp.position, { x: centerX, y: centerY });
          this.game.lead = undefined; // team in the lead

          break;

        case 1:

          this.game.scores.fill(0);

          break;
      }
    }
  }, {
    key: 'setupMap',
    value: function setupMap() {
      var _map$impermeables;

      var map = this.model.map = {},
          info = this.mapInfo;

      var cX = info.width / 2,
          cY = info.height / 2;

      // IMPERMEABLES
      var initial_impermeables = [],
          radii = new Set();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = info.impermeables.bodies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var radius_size_group = _step.value;

          var list = radius_size_group.slice(),
              radius = list.shift();
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = list[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var _ref = _step3.value;

              var _ref2 = _slicedToArray(_ref, 2);

              var x = _ref2[0];
              var y = _ref2[1];

              initial_impermeables.push({
                radius: radius,
                position: { x: x, y: y }
              });
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }

          radii.add(radius);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      map.impermeables = [];
      map.impermeables.radii = radii;
      // in the future use the 'copies' variable on impermeables
      // and make it odd symmetry
      (_map$impermeables = map.impermeables).push.apply(_map$impermeables, initial_impermeables);
      if (info.impermeables.copies >= 2) {
        var _map$impermeables2;

        (_map$impermeables2 = map.impermeables).push.apply(_map$impermeables2, _toConsumableArray(initial_impermeables.map(function (obj) {
          return {
            radius: obj.radius,
            position: { x: info.width - obj.position.x, y: info.width - obj.position.y }
          };
        })));

        if (info.impermeables.copies == 4) {
          var _map$impermeables3, _map$impermeables4;

          (_map$impermeables3 = map.impermeables).push.apply(_map$impermeables3, _toConsumableArray(initial_impermeables.map(function (obj) {
            return {
              radius: obj.radius,
              position: { x: info.width - obj.position.y, y: obj.position.x }
            };
          })));

          (_map$impermeables4 = map.impermeables).push.apply(_map$impermeables4, _toConsumableArray(initial_impermeables.map(function (obj) {
            return {
              radius: obj.radius,
              position: { x: obj.position.y, y: info.width - obj.position.x }
            };
          })));
        }
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = map.impermeables[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var imp = _step2.value;

          imp.collision_groups = [this.physics.collision_groups.IMPERMEABLES];
          this.setCollisionDivisions(imp);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'setupView',
    value: function setupView() {
      this.setupPalette();
      this.configureCreateJS();
      this.setupCamera();
    }
  }, {
    key: 'setupPalette',
    value: function setupPalette() {
      this.colors = this.setupData.colors;
    }
  }, {
    key: 'configureCreateJS',
    value: function configureCreateJS() {
      this.setupCanvas();
      // populate stage
      this.createViews();
    }
  }, {
    key: 'setupCanvas',
    value: function setupCanvas() {
      // TODO: (revise)
      var canvas = $('#canvas')[0];
      canvas.width = document.body.clientWidth;
      canvas.height = document.body.clientHeight;
      // if (canvas.width > 1024) canvas.width = 1024;
      // if (canvas.height > 768) canvas.height = 768;

      this.scale = Math.sqrt(canvas.width * canvas.height) / Math.sqrt(1024 * 768);
      // this.scale ;

      var stage = new createjs.Stage();
      stage.canvas = canvas;
      stage.snapToPixel = true;
      // gui.add(stage, 'snapToPixel');

      this.stage = stage;

      this.HDPSupport();
    }
  }, {
    key: 'HDPSupport',
    value: function HDPSupport() {
      this.HDPScale = 1;
      if (window.devicePixelRatio) {
        var stage = this.stage;
        var canvas = stage.canvas;

        // grab the width and height from canvas
        var height = canvas.getAttribute('height');
        var width = canvas.getAttribute('width');
        // reset the canvas width and height with window.devicePixelRatio applied
        canvas.setAttribute('width', Math.round(width * window.devicePixelRatio));
        canvas.setAttribute('height', Math.round(height * window.devicePixelRatio));
        // force the canvas back to the original size using css
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        // set CreateJS to render scaled
        stage.scaleX = stage.scaleY = window.devicePixelRatio;
        this.HDPScale = 1 / window.devicePixelRatio;
      }
    }
  }, {
    key: 'createViews',
    value: function createViews() {
      this.view = {
        grid: { width: 48, height: 48 }
      };
      this.window = {
        width: this.stage.canvas.width * this.HDPScale,
        height: this.stage.canvas.height * this.HDPScale
      };

      this.createLayers();
      this.createBackgroundViews();
      this.createGameModeSpecificViewsAction();
      this.createSpawnCampViews();
      this.createShipViews();
      this.createPoolViews();
      this.createOverlayViews();
    }
  }, {
    key: 'snapToGrid',
    value: function snapToGrid(position) {
      position.x = Math.round(position.x / this.view.grid.width) * this.view.grid.width;
      position.y = Math.round(position.y / this.view.grid.height) * this.view.grid.height;
    }
  }, {
    key: 'createLayers',
    value: function createLayers() {
      var layer = {};

      layer.background = new createjs.Container();
      layer.action = new createjs.Container();
      layer.overlay = new createjs.Container();

      layer.action.back = new createjs.Container();
      layer.action.front = new createjs.Container();
      layer.action.addChild(layer.action.back);
      layer.action.addChild(layer.action.front);

      layer.action.scaleX = layer.action.scaleY = this.scale;

      this.stage.addChild(layer.background);
      this.stage.addChild(layer.action);
      this.stage.addChild(layer.overlay);

      this.view.layer = layer;
    }
  }, {
    key: 'createBackgroundViews',
    value: function createBackgroundViews() {
      // var canvas = this.stage.canvas, background = new createjs.Shape();
      // // background.graphics.beginFill('#37474F').drawRect(0, 0, canvas.width, canvas.height);
      // // background.cache(0, 0, canvas.width, canvas.height);
      // // this.view.layer.background.addChild(background);
      // //
      // // background = new createjs.Shape();
      // background.graphics.beginFill('#455A64').drawRect(0, 0, canvas.width, canvas.height);
      // background.cache(0, 0, canvas.width, canvas.height);
      // this.view.layer.background.map_background = background;
      // this.view.layer.background.addChild(background);


      var canvas = this.stage.canvas,
          canvasBackground = new createjs.Shape(),
          mapBackground = new createjs.Shape();
      canvasBackground.graphics.beginFill('#37474F').drawRect(0, 0, this.window.width, this.window.height);
      canvasBackground.cache(0, 0, canvas.width, canvas.height);
      this.view.layer.background.addChild(canvasBackground);

      var background_width = this.window.width * 2;
      var background_height = this.window.width * 2;
      var hypotenuse = Math.sqrt(Math.sqr(this.window.width) + Math.sqr(this.window.height)) / this.scale;
      mapBackground.graphics.beginFill('#455A64').drawRect(0, 0, hypotenuse, hypotenuse);
      mapBackground.cache(0, 0, hypotenuse, hypotenuse);
      mapBackground.regX = hypotenuse / 2;
      mapBackground.regY = hypotenuse / 2;
      this.view.layer.background.map_background = mapBackground;
      this.view.layer.action.back.addChild(mapBackground);
    }
  }, {
    key: 'createGameModeSpecificViewsAction',
    value: function createGameModeSpecificViewsAction() {
      var _this6 = this;

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
      this.model.map.impermeables.radii.forEach(function (r) {
        var view = new createjs.Shape(DeepSpaceGame.graphics.block_fill('#37474F', r));
        var s = r * 1.2;
        view.cache(-s, -s, s * 2, s * 2);

        caches.set(r, view.cacheCanvas);
      });

      // create views
      this.view.map = { impermeables: [] };
      this.model.map.impermeables.forEach(function (block) {
        var view = new createjs.Bitmap(caches.get(block.radius)),
            pos = block.position;
        view.x = pos.x - block.radius * 1.2;
        view.y = pos.y - block.radius * 1.2;
        _this6.view.map.impermeables.push(view);
        _this6.view.layer.action.front.addChild(view);
      });
    }
  }, {
    key: 'createSpawnCampViews',
    value: function createSpawnCampViews() {
      var _this7 = this;

      // this.view.teams = { spawn_camp: []}

      // DeepSpaceGame.maps[0].spawn[this.owner.team.game.teams.length][this.owner.team.number]
      var s = 64 + 3; // radius + border-half
      this.teams.forEach(function (team, i) {
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
        _this7.view.layer.action.back.addChild(group);
      });
    }
  }, {
    key: 'createShipViews',
    value: function createShipViews() {
      var _this8 = this;

      var our_ship = this.ships.main,
          our_team = void 0;
      if (our_ship) our_team = our_ship.owner.team;
      this.ships.forEach(function (ship) {
        var container = new createjs.Container();
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


        _this8.view.layer.action.front.addChild(ship.view = container);
      });

      if (our_ship) {
        var container = our_ship.view,
            color = this.ships.main.owner.team.color,
            innerRadius = 5 / this.scale,
            outerRadius = 7 / this.scale,
            meter = new createjs.Shape(DeepSpaceGame.graphics.energyMeter(this.ships.main.owner.team.color, 1, this.scale)),
            shadow = new createjs.Shape(DeepSpaceGame.graphics.energyMeterShadow('#455A64', this.scale)),
            offset = { x: 22, y: -22 };

        shadow.cache(-outerRadius, -outerRadius, outerRadius * 2, outerRadius * 2);

        meter.x = shadow.x = offset.x;
        meter.y = shadow.y = offset.y;

        container.addChild(container.meter_shadow = meter.shadow = shadow);
        container.addChild(container.meter = meter);
      }
    }
  }, {
    key: 'createPoolViews',
    value: function createPoolViews() {
      this.view.bullets = new Map();
      this.view.blocks = new Map();
      this.view.subs = new Map();
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

  }, {
    key: 'createOverlayViews',
    value: function createOverlayViews() {
      var _this9 = this;

      var overlay = {};

      overlay.score = new createjs.Container();
      overlay.score.team = [];
      var imagined_width = 120;
      this.teams.forEach(function (team, i) {
        var text = new createjs.Text(_this9.game.scores[i].toString(), "48px Unica One", team.color);
        text.x = i * imagined_width + imagined_width / 2;
        text.textAlign = "center";
        text.shadow = new createjs.Shadow("#455A64", 0, 0, 6);
        overlay.score.addChild(text);
        overlay.score.team.push(text);
      });
      overlay.score.x = this.window.width / 2 - this.teams.length * imagined_width / 2;
      overlay.score.y = 12;

      this.view.layer.overlay.addChild(overlay.score);

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

      // var imagined_width = 512;
      overlay.message = new createjs.Text("", "24px Roboto Condensed");
      overlay.message.textAlign = "center";
      overlay.message.x = this.window.width / 2;
      overlay.message.y = 76;
      overlay.message.shadow = new createjs.Shadow("#455A64", 0, 0, 6);

      this.view.layer.overlay.addChild(overlay.message);

      // var imagined_width = 512;
      overlay.kill_message = new createjs.Text("", "24px Roboto Condensed");
      overlay.kill_message.textAlign = "center";
      overlay.kill_message.x = this.window.width / 2;
      overlay.kill_message.y = this.window.height - 76;
      overlay.kill_message.shadow = new createjs.Shadow("#455A64", 0, 0, 6);

      this.view.layer.overlay.addChild(overlay.kill_message);

      switch (this.gameMode) {
        case 0:
          // ctf
          // var centerX = this.mapInfo.width / 2;
          // var centerY = this.mapInfo.height / 2;

          var r = DeepSpaceGame.modes["ctf"].flag_radius * this.scale,
              s = r * 1.2;
          var flag = new createjs.Shape(DeepSpaceGame.graphics.flag(r));
          flag.shadow = DeepSpaceGame.graphics.flag_shadow();
          flag.cache(-s, -s, s * 2, s * 2);

          // flag.x = centerX; flag.y = centerY;

          this.view.layer.overlay.addChild(flag);
          this.view.flag = flag;

          break;
      }

      this.view.overlay = overlay;
    }
  }, {
    key: 'createOverlayMinimapViews',
    value: function createOverlayMinimapViews(overlay_model, overlay_view) {
      var _this10 = this;

      var mini = overlay_model.minimap = new createjs.Container();

      mini.width = mini.height = 168;
      mini.scale = mini.width / this.mapInfo.width;
      mini.regX = mini.width / 2;
      mini.regY = mini.height / 2;
      mini.rotation = Math.degrees(-this.ships.main.spawnRotation) - 90;

      var padd = this.window.width < 600 ? 0 : 32;
      mini.x = padd + mini.width / 2;
      mini.y = this.window.height - (padd + mini.height) + mini.height / 2;

      // background
      var background = mini.background = new createjs.Shape();
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

      this.model.map.impermeables.forEach(function (block) {
        var scale = block.radius * mini.scale / r,
            view = new createjs.Bitmap(cache),
            pos = block.position;
        view.scaleX = view.scaleY = scale;
        view.x = pos.x * mini.scale - scale * cache.width / 2;
        view.y = pos.y * mini.scale - scale * cache.height / 2;
        mini.addChild(view);
      });

      // spawns
      this.teams.forEach(function (team) {
        var camp = team.spawn_camp,
            radius = team == _this10.ships.main.owner.team ? 8 : 6,

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
      if (this.gameMode == 0) {
        var flag_view = mini.flag = new createjs.Shape(DeepSpaceGame.graphics.circle_fill('#ECEFF1', 6));
        mini.addChild(flag_view);
      }

      // ships .. hmmm.. intel >.>
      // (only same team for now)
      var this_player = this.ships.main.owner,
          this_team = this_player.team;
      mini.players = [];
      this_team.players.forEach(function (player) {
        var view = new createjs.Shape(DeepSpaceGame.graphics.circle_fill(this_team.color, 4));
        view.alpha = player == this_player ? 1 : 0.6;
        mini.players.push(view);
        mini.addChild(view);
      });

      // and also eventually blocks
      mini.blocks = new Map();

      overlay_view.addChild(mini);
    }
  }, {
    key: 'createOverlayMinimapBlockViewFor',
    value: function createOverlayMinimapBlockViewFor(block) {
      var cache = DeepSpaceGame.graphicsCaches.minimap.blocks[block.team],
          blv = new createjs.Bitmap(cache),
          mini = this.view.overlay.minimap,
          scale = mini.scale;

      // blv.alpha = 0.2
      blv.x = block.position.x * scale;
      blv.y = block.position.y * scale;

      blv.regX = blv.regY = cache.width / 2;

      mini.addChild(blv);
      mini.setChildIndex(blv, 1);
      mini.blocks.set(block.id, blv);

      // flag always on top
      // mini.setChildIndex(mini.flag, mini.numChildren-1)
    }
  }, {
    key: 'destroyOverlayMinimapBlockViewFor',
    value: function destroyOverlayMinimapBlockViewFor(id) {
      if (!this.spectate) {
        var v = this.view.overlay.minimap.blocks.get(id);
        if (v) {
          this.view.overlay.minimap.blocks.delete(id);
          this.view.overlay.minimap.removeChild(v);
        }
      }
    }
  }, {
    key: 'setupCamera',
    value: function setupCamera() {
      var _this11 = this;

      this.view.layer.action.width = this.mapInfo.width;
      this.view.layer.action.height = this.mapInfo.height;
      this.camera = new Camera(this.stage.canvas, this.view.layer.action, this.scale, this.HDPScale);

      if (this.spectate) {
        this.activePlayerIndex = 0;
        // this.playerShipViews = new Map();
        // this.setupData.players.forEach((p, i)=>{
        //   this.playerShipViews.set(i, this.players.get(p.id).ship.view);
        // });
        this.activePlayers = this.setupData.players.map(function (p) {
          return _this11.players.get(p[0]);
        });
        this.updateCameraFocus();
      } else {
        this.camera.focus = this.ships.main.view;
      }

      this.camera.width = this.window.width;
      this.camera.height = this.window.height;
    }
  }, {
    key: 'setupListeners',
    value: function setupListeners() {
      var _this12 = this;

      // (needs (even more) work)
      this.inputHandlers = new Map();
      var receiver = window;

      if (this.spectate) {
        var keyHandler = function keyHandler(e) {
          if (e.keyCode == 37) {
            // left: ◀︎
            _this12.activePlayerIndex--;
            if (_this12.activePlayerIndex < 0) _this12.activePlayerIndex = _this12.activePlayers.length - 1;
          }
          if (e.keyCode == 39) {
            // right: ▶︎
            _this12.activePlayerIndex++;
            if (_this12.activePlayerIndex >= _this12.activePlayers.length) _this12.activePlayerIndex = 0;
          }
          _this12.updateCameraFocus();
        };
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
        ["sub", [69]]];

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

        var _keyHandler = function _keyHandler(e) {
          var type = e.type;

          if (type == 'keyup' || type == 'keydown') {
            var eventCode = e.keyCode;

            keymap.forEach(function (row) {
              row[1].forEach(function (code) {
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
                    inputStack.delete(row[0]);
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

        receiver.addEventListener('keydown', _keyHandler); // onkeydown
        receiver.addEventListener('keyup', _keyHandler); // onkeyup

        this.inputHandlers.set('keydown', _keyHandler);
        this.inputHandlers.set('keyup', _keyHandler);

        // GAMEPAD
        receiver.addEventListener("gamepadconnected", function (e) {
          return _this12.gamepad = e.gamepad;
        });
        // this closure has access to the inputStack variable.. the alias for this.ships.main.owner.input
        // .. thus it is left here .. please revise
        this.updateGamepadInput = !navigator.getGamepads ? function () {} : function () {
          var gamepad = navigator.getGamepads()[0];
          if (!gamepad) return;

          /*var val, deadZone;
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
          inputStack.set("sub", gamepad.buttons[0].pressed);*/

          // NEW :)
          var deadZone = 0.15;
          var buttonMap = new Map([['up', [

          // - y axis
          gamepad.axes[1] < -deadZone,

          // l trigger
          gamepad.axes[3] > 0]], ['dn', [

          // + y axis
          gamepad.axes[1] > deadZone,

          // r trigger
          gamepad.axes[4] > 0]], ['lt', [

          // - x axis
          gamepad.axes[0] < -deadZone]], ['rt', [

          // - x axis
          gamepad.axes[0] > deadZone]], ['up2', [

          // - y axis 2
          gamepad.axes[5] < -deadZone]], ['dn2', [

          // + y axis 2
          gamepad.axes[5] > deadZone]], ['lt2', [

          // - x axis 2
          gamepad.axes[2] < -deadZone]], ['rt2', [

          // + x axis 2
          gamepad.axes[2] > deadZone]], ['shoot', [

          // buttons a & b
          gamepad.buttons[0].pressed, gamepad.buttons[1].pressed]], ['block', [

          // r shoulder button
          gamepad.buttons[7].pressed]], ['sub', [

          // buttons x & y
          gamepad.buttons[3].pressed, gamepad.buttons[4].pressed,

          // l shoulder button
          gamepad.buttons[6].pressed,

          // r joystick press
          gamepad.buttons[14].pressed]]]);

          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = buttonMap[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var _ref3 = _step4.value;

              var _ref4 = _slicedToArray(_ref3, 2);

              var code = _ref4[0];
              var bindings = _ref4[1];


              var activation = _(bindings).contains(true);

              if (activation) {

                if (inputStack.has(code)) continue;

                inputStack.add(code);
                inputStack.changed = true;
              } else {

                if (!inputStack.has(code)) continue;

                inputStack.delete(code);
                inputStack.changed = true;
              }
            }
          } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
              }
            } finally {
              if (_didIteratorError4) {
                throw _iteratorError4;
              }
            }
          }
        };

        // MOBILE
        var raw_acc_data = [0, 0],
            applied_acc_data = [0, 0]; // [x, y]
        var threshold = 1,
            bias = [0, 0]; // deadzone
        bias = ENV.storage.calibration = ENV.storage.calibration ? ENV.storage.calibration.split(",").map(Number) : [0, 0];
        // let origin = [0, bias];
        if (ENV.mobile && window.DeviceMotionEvent != undefined) {
          window.ondevicemotion = function (e) {
            raw_acc_data = [e.accelerationIncludingGravity.x, e.accelerationIncludingGravity.y];
            // if ( e.rotationRate )  {
            //   document.getElementById("rotationAlpha").innerHTML = e.rotationRate.alpha;
            //   document.getElementById("rotationBeta").innerHTML = e.rotationRate.beta;
            //   document.getElementById("rotationGamma").innerHTML = e.rotationRate.gamma;
            // }
          };

          inputStack.updateMotion = function () {
            var orientation = window.orientation,
                _raw_acc_data = raw_acc_data,
                _raw_acc_data2 = _slicedToArray(_raw_acc_data, 2),
                raw_x = _raw_acc_data2[0],
                raw_y = _raw_acc_data2[1],
                x = raw_x,
                y = raw_y;


            if (orientation === 90) {
              x = -raw_y, y = raw_x;
            } else if (orientation === -90) {
              x = raw_y, y = -raw_x;
            } else if (orientation === 180 || orientation === -180) {
              x = -x, y = -y;
            }

            applied_acc_data = [x, y];
            x -= bias[0]; // bias towards player;
            y -= bias[1];

            if (ENV.options.input.invertControls) {
              x = -x;y = -y;
            }

            if (x > threshold) {
              inputStack.add('rt');
            } else {
              inputStack.delete('rt');
            }
            if (x < -threshold) {
              inputStack.add('lt');
            } else {
              inputStack.delete('lt');
            }
            if (y > threshold) {
              inputStack.add('up');
            } else {
              inputStack.delete('up');
            }
            if (y < -threshold) {
              inputStack.add('dn');
            } else {
              inputStack.delete('dn');
            }
          };
        }

        var left = document.querySelector('#touch_layer > .left');
        left.addEventListener('touchstart', function (e) {
          inputStack.add('block');
        });
        left.addEventListener('touchend', function (e) {
          inputStack.delete('block');
        });

        var joystick = new V2D(),
            joystick_deadzone_radius = 30;
        var right = document.querySelector('#touch_layer > .right');
        right.addEventListener('touchstart', function (e) {
          inputStack.add('shoot');
        });
        right.addEventListener('touchend', function (e) {
          inputStack.delete('shoot');
          inputStack.delete('up2');
          inputStack.delete('dn2');
          inputStack.delete('lt2');
          inputStack.delete('rt2');
        });
        var right_hammer = new Hammer(right);
        right_hammer.on('panmove', function (e) {
          var v = new V2D(e.deltaX, e.deltaY),
              a = v.angle;
          if (v.length > joystick_deadzone_radius) {
            if (a < -0.39 && a > -2.74) {
              inputStack.add('up2');
            } else {
              inputStack.delete('up2');
            }
            if (a > 0.39 && a < 2.74) {
              inputStack.add('dn2');
            } else {
              inputStack.delete('dn2');
            }
            if (a > 1.96 || a < -1.96) {
              inputStack.add('lt2');
            } else {
              inputStack.delete('lt2');
            }
            if (a > -1.18 && a < 1.18) {
              inputStack.add('rt2');
            } else {
              inputStack.delete('rt2');
            }
          } else {}
          // console.log(e)
        });

        var hammertime = new Hammer(document.querySelector('#touch_layer'));
        hammertime.get('tap').set({ taps: 2 });
        hammertime.get('swipe').set({ direction: Hammer.DIRECTION_LEFT });
        hammertime.on('tap', function (ev) {
          inputStack.add('sub');
          (function () {
            return inputStack.delete('sub');
          }).wait(200);
        });
        hammertime.on('swipe', function (e) {
          // calibrate
          bias = applied_acc_data;
          ENV.storage.calibration = bias;
        });
      }
    }
  }, {
    key: 'setupPhysics',
    value: function setupPhysics() {
      this.setupCollisionSystem();
      this.assignCollisionPatterns();
      this.setupReferenceGroups();
    }
  }, {
    key: 'setupCollisionSystem',
    value: function setupCollisionSystem() {
      var physics = this.physics = {};

      physics.block_size = 512;
      physics.world_size = { width: this.mapInfo.width, height: this.mapInfo.height };

      var rows = Math.ceil(physics.world_size.width / physics.block_size),
          cols = Math.ceil(physics.world_size.height / physics.block_size);

      physics.divisions = [];
      // rows.times(i => {
      //   physics.divisions.push([]);
      //   cols.times(() => {
      //     physics.divisions[i].push(new Set())
      //   })
      // })

      physics.division_index = function (x, y) {
        return y * cols + x;
      };

      physics.division_coordinates = function (i) {
        return [i % rows, Math.floor(i / cols)];
      };

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

      (rows * cols).times(function () {
        var obj = {};
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = Object.keys(physics.collision_groups)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var group = _step5.value;
            obj[physics.collision_groups[group]] = new Set();
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        physics.divisions.push(obj);
      });

      /*
       END RESULT LOOKS SOMETHING LIKE:
       [.. {...}, {SHIPS: [Set], OUR_BULLETS: Set [b, b, ..], ...}, {...}, ...]
        */
    }
  }, {
    key: 'setCollisionDivisions',
    value: function setCollisionDivisions(physics_body) {
      var _this13 = this;

      this.clearCollisionDivisions(physics_body);

      var d = physics_body.divisions = new Set(),
          r = physics_body.radius,
          _ref5 = [physics_body.position.x, physics_body.position.y],
          x = _ref5[0],
          y = _ref5[1];


      [[1, 0], [0, -1], [-1, 0], [0, 1]].forEach(function (unit_offset_array) {
        var check_x = x + r * unit_offset_array[0],
            check_y = y + r * unit_offset_array[1];

        var division_x = Math.floor(check_x / _this13.physics.block_size),
            division_y = Math.floor(check_y / _this13.physics.block_size),
            division_index = _this13.physics.division_index(division_x, division_y);

        if (_this13.physics.divisions[division_index]) d.add(division_index);
      });

      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = d[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var division_index = _step6.value;
          var _iteratorNormalCompletion7 = true;
          var _didIteratorError7 = false;
          var _iteratorError7 = undefined;

          try {
            for (var _iterator7 = physics_body.collision_groups[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
              var group = _step7.value;

              this.physics.divisions[division_index][group].add(physics_body);
            }
          } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion7 && _iterator7.return) {
                _iterator7.return();
              }
            } finally {
              if (_didIteratorError7) {
                throw _iteratorError7;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }
    }
  }, {
    key: 'clearCollisionDivisions',
    value: function clearCollisionDivisions(physics_body) {
      if (physics_body.divisions) {
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = physics_body.divisions[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var i = _step8.value;
            var _iteratorNormalCompletion9 = true;
            var _didIteratorError9 = false;
            var _iteratorError9 = undefined;

            try {
              for (var _iterator9 = physics_body.collision_groups[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                var group = _step9.value;

                this.physics.divisions[i][group].delete(physics_body);
              }
            } catch (err) {
              _didIteratorError9 = true;
              _iteratorError9 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion9 && _iterator9.return) {
                  _iterator9.return();
                }
              } finally {
                if (_didIteratorError9) {
                  throw _iteratorError9;
                }
              }
            }
          }
        } catch (err) {
          _didIteratorError8 = true;
          _iteratorError8 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
              _iterator8.return();
            }
          } finally {
            if (_didIteratorError8) {
              throw _iteratorError8;
            }
          }
        }
      }
    }
  }, {
    key: 'assignCollisionPatterns',
    value: function assignCollisionPatterns() {
      var _this14 = this;

      var checks = this.physics.collision_checks,
          groups = this.physics.collision_groups;

      if (!this.spectate) {

        // MY BULLET <-> ENEMY SHIPS
        checks.push([groups.MY_BULLETS, groups.ENEMY_SHIPS, function (bullet, ship) {
          if (!bullet.disabled && !ship.disabled) {
            _this14.damageShip(ship.owner.id, bullet.hp, bullet.creator);
            _this14.removeBullet(bullet.id);
          }
        }]);

        // MY BULLET <-> ENEMY BLOCKS
        checks.push([groups.MY_BULLETS, groups.ENEMY_BLOCKS, function (bullet, block) {
          if (!bullet.disabled && !block.disabled) {
            _this14.damageBlock(block.id, bullet.hp);
            if (bullet.hp < block.hp) _this14.removeBullet(bullet.id);
          }
        }]);

        // MY BULLET <-> ENEMY SPAWN_CAMPS
        checks.push([groups.MY_BULLETS, groups.ENEMY_SPAWN_CAMPS, function (bullet, spawn_camp) {
          if (!bullet.disabled) {
            _this14.removeBullet(bullet.id);
          }
        }]);

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
        checks.push([groups.OUR_SHIP, groups.FLAG, function (ship, flag) {
          if (!ship.disabled && flag.idle) if (ship.canPickupFlag()) _this14.assumeFlag(ship);
        }]);

        // OUR SUBS <-> ENEMY BLOCKS
        checks.push([groups.OUR_PROJ_SUBS, groups.ENEMY_BLOCKS, function (sub, block) {
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
        }]);

        // OUR SUBS <-> ENEMY SHIPS
        checks.push([groups.OUR_PROJ_SUBS, groups.ENEMY_SHIPS, function (sub, ship) {
          if (!sub.disabled && !ship.disabled) {
            if (sub.type == 'missile') {
              _this14.damageShip(ship.owner.id, sub.hp, sub.player);
              _this14.removeSub(sub.id);
            }
          }
        }]);

        // OUR SUBS <-> ENEMY SPAWN_CAMPS
        checks.push([groups.OUR_PROJ_SUBS, groups.ENEMY_SPAWN_CAMPS, function (sub, spawn_camp) {
          if (!sub.disabled) _this14.removeSub(sub.id);
        }]);

        // OUR BLOCKS <-> OUR BLOCKS
        checks.push([groups.OUR_BLOCKS, groups.OUR_BLOCKS, function (block_a, block_b) {
          if (block_a != block_b && !block_a.disabled && !block_b.disabled) if (Physics.overlap(block_a, block_b) > 0.8) // 0.8
            _this14.removeBlock(block_a.id);
        }]);
      }

      // SHIPS <-> WALL OR CAMP (REFUGE)
      checks.push([groups.SHIPS, groups.REFUGE, function (ship, refuge) {
        if (!ship.disabled) {
          if (ship.owner.team.number != refuge.team) {
            Physics.bounce(ship, refuge);
          } else {
            ship.charging = true;
          }
        }
      }]);

      // SHIPS <-> IMPERMEABLES
      checks.push([groups.SHIPS, groups.IMPERMEABLES, function (ship, imp) {
        if (!ship.disabled) {
          Physics.bounce(ship, imp);
        }
      }]);

      // BULLETS <-> IMPERMEABLES
      checks.push([groups.BULLETS, groups.IMPERMEABLES, function (bullet, imp) {
        if (!bullet.disabled) {
          if (Physics.overlap(bullet, imp) < 0.1) {
            Physics.bounce(bullet, imp);
          } else {
            _this14.removeBullet(bullet.id);
          }
        }
      }]);
    }
  }, {
    key: 'setupReferenceGroups',
    value: function setupReferenceGroups() {
      var refGroups = {};

      refGroups.enemyBlocks = new Set();
      refGroups.enemySubs = new Set();

      refGroups.animate = new Set();

      // this.collisionGroups = groups;
      this.refGroups = refGroups;
    }
  }, {
    key: 'setupLoop',
    value: function setupLoop() {
      var FPS = function FPS(n) {
        return 1000 / n;
      };
      window.getAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, FPS(60));
      };

      this.setupDT();
    }
  }, {
    key: 'setupDT',
    value: function setupDT() {
      this.last_time = new Date().getTime();

      // the variable percentage of a second that has gone by since the last frame
      // usually expressed: 0.016 when running 60 fps
      this.dt = 0;
    }
  }, {
    key: 'updateDT',
    value: function updateDT() {
      var now = new Date().getTime();
      this.dt = (now - this.last_time) / 1000;
      this.last_time = now;
    }
  }, {
    key: 'setupReferences',
    value: function setupReferences() {
      this.setupShortcutsToCommonCalls();
      this.setupFinishCollisionAssignment();
      this.setupGraphicsCaches();
    }
  }, {
    key: 'setupShortcutsToCommonCalls',
    value: function setupShortcutsToCommonCalls() {
      var _this15 = this;

      if (!this.spectate) {
        // model references
        this.enemyTeams = this.teams.filter(function (team) {
          return team.number != _this15.ships.main.owner.team.number;
        });
        this.enemyPlayers = this.enemyTeams.reduce(function (list, team) {
          return list.concat(team.players);
        }, []);

        this.player = this.ships.main.owner;
        this.team = this.player.team;
      }
    }
  }, {
    key: 'setupFinishCollisionAssignment',
    value: function setupFinishCollisionAssignment() {
      var _this16 = this;

      /*
       this method is run near end of the setup since things like ships and players
       and teams and everything else is assigned and references can be made to the
       local players team and such..
       */

      // spawn camps
      this.teams.forEach(function (team) {
        var spawn_c = team.spawn_camp;
        spawn_c.collision_groups = [_this16.physics.collision_groups.SPAWN_CAMPS, _this16.physics.collision_groups.REFUGE]; // TODO COLLISION OR PHYSICS CLASS PROTOCOLS
        if (team == _this16.team) {
          spawn_c.collision_groups.push(_this16.physics.collision_groups.OUR_SPAWN_CAMP);
          spawn_c.collision_groups.push(_this16.physics.collision_groups.OUR_REFUGE);
        } else {
          spawn_c.collision_groups.push(_this16.physics.collision_groups.ENEMY_SPAWN_CAMPS);
        }
        _this16.setCollisionDivisions(spawn_c);
      });

      // ships
      this.ships.forEach(function (ship) {
        ship.collision_groups = [_this16.physics.collision_groups.SHIPS];
        if (ship == _this16.ships.main) ship.collision_groups.push(_this16.physics.collision_groups.OUR_SHIP);
        ship.collision_groups.push(ship.owner.team == _this16.team ? _this16.physics.collision_groups.OUR_SHIPS : _this16.physics.collision_groups.ENEMY_SHIPS);
      });
    }
  }, {
    key: 'setupGraphicsCaches',
    value: function setupGraphicsCaches() {
      // TODO: deinit graphics caches

      // cache background
      // this.view.layer.background.cache(0, 0, this.mapInfo.width, this.mapInfo.height);

      // create single cache for common objects
      this.setupCommonGraphicsCachePool();
    }
  }, {
    key: 'setupCommonGraphicsCachePool',
    value: function setupCommonGraphicsCachePool() {
      var _this17 = this;

      var gc = DeepSpaceGame.graphicsCaches = {};

      // bullets
      gc.bullets = [];
      this.teams.forEach(function (team) {

        // always caching the largest version
        var radius = Bullet.stats.MAX_RADIUS;

        var v = new createjs.Shape(DeepSpaceGame.graphics.particle(_this17.teams[team.number].color, radius));

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
      this.teams.forEach(function (team) {

        // always caching the largest version
        var radius = Block.stats.MAX_RADIUS;

        var fill = new createjs.Shape(DeepSpaceGame.graphics.block_fill(_this17.teams[team.number].color, radius)),
            border = new createjs.Shape(DeepSpaceGame.graphics.block_border(_this17.teams[team.number].color, radius));

        var s = radius * 1.2;
        var c = void 0;

        // enemy
        c = new createjs.Container();
        fill.alpha = 0.24;
        c.addChild(fill);
        c.cache(-s, -s, s * 2, s * 2);
        gc.blocks.enemy[team.number] = c.cacheCanvas;

        // unlocked
        // fill.alpha = 0.16;
        // fill = new createjs.Shape(DeepSpaceGame.graphics.block_fill(COLOR.mix(this.teams[team.number].color, '#37474F', 40), radius))
        c = new createjs.Container();
        c.addChild(fill);
        c.cache(-s, -s, s * 2, s * 2);
        gc.blocks.unlocked[team.number] = c.cacheCanvas;

        // locked
        // fill.alpha = 1;
        // fill = new createjs.Shape(DeepSpaceGame.graphics.block_fill(COLOR.mix(this.teams[team.number].color, '#455A64', 40), radius))
        c = new createjs.Container();
        c.addChild(fill);
        // c.addChild(border);
        c.cache(-s, -s, s * 2, s * 2);
        gc.blocks.locked[team.number] = c.cacheCanvas;
      });

      // minimap
      if (this.spectate) return; // TODO make minimap accesible to all even spectators
      gc.minimap = { blocks: [] };
      this.teams.forEach(function (team) {
        // '#37474F'
        var radius = Block.stats.MAX_RADIUS * _this17.view.overlay.minimap.scale;

        var fill = new createjs.Shape(DeepSpaceGame.graphics.block_fill(COLOR.mix(_this17.teams[team.number].color, '#37474F', 40), radius));

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
  }, {
    key: 'actualize',
    value: function actualize() {
      var _this18 = this;

      // bring an outside game up to speed
      // DEPRECIATED :: .. no client can join match after start

      // scores
      // this.setupData.state.scores.forEach((entry) => {
      //   this.game.scores[entry.t] = entry.s
      // });
      this.setupData.teams.forEach(function (team, i) {
        _this18.game.scores[i] = 100;
      });

      // flag
      // var holder;
      // setTimeout(() => {
      //   if (holder = this.setupData.state.flagHolder) this.pickupFlag(holder);
      // }, 100);

      // disconnects
      // this.setupData.disconnects.forEach(id => this.disconnectPlayer(id))
    }
  }, {
    key: 'loop',
    value: function loop() {
      var _this19 = this;

      // stats.begin();
      this.updateDT();
      this.update();
      this.log();
      // stats.end();

      // NetworkHelper.release();

      getAnimationFrame(function () {
        return _this19.game.ended ? true : _this19.loop();
      });
    }
  }, {
    key: 'update',
    value: function update() {
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
  }, {
    key: 'updateInput',
    value: function updateInput() {
      if (!this.spectate) this.updateGamepadInput();
      if (!this.spectate) if (this.player.input.updateMotion) this.player.input.updateMotion();
    }

    // updateGamepadInput() {}

  }, {
    key: 'updateModel',
    value: function updateModel() {
      this.updateShips();
      this.broadcastShip();

      this.updateBullets();
      this.updateBlocks();
      this.updateSubs();
    }
  }, {
    key: 'updateShips',
    value: function updateShips() {
      var _iteratorNormalCompletion10 = true;
      var _didIteratorError10 = false;
      var _iteratorError10 = undefined;

      try {
        for (var _iterator10 = this.ships[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
          var ship = _step10.value;


          ship.update(this.dt);

          if (ship == this.ships.main && !ship.disabled) {

            var input = ship.owner.input,
                x = 0,
                y = 0,
                x2 = 0,
                y2 = 0,
                s = false;

            var _iteratorNormalCompletion11 = true;
            var _didIteratorError11 = false;
            var _iteratorError11 = undefined;

            try {
              for (var _iterator11 = input[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                var prop = _step11.value;

                switch (prop) {
                  case 'up':
                    y = 1;
                    // y = -1;
                    break;
                  case 'dn':
                    y = -1;
                    // y = 1;
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
                    if (ship.flag) {
                      this.releaseFlag();
                    } else {
                      if (ship.canSub()) this.addSub(ship);
                    }
                    break;
                  case 'block':
                    if (ship.canBlock()) {
                      while (ship.reachedBlockLimit) {
                        this.removeBlock(ship.oldestBlockID());
                      }this.addBlock(ship);
                    }
                    break;
                  case 'shoot':
                    s = true;
                    break;
                }
              }

              // ship.acceleration.set({x, y})
              // if (ship.acceleration.length) ship.acceleration.length = ship.LINEAR_ACCELERATION_LIMIT;
              //
              // // if(ship.acceleration.length) ship.angle = ship.acceleration.angle
              // if (ship.velocity.length) ship.angle = ship.velocity.angle;
            } catch (err) {
              _didIteratorError11 = true;
              _iteratorError11 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion11 && _iterator11.return) {
                  _iterator11.return();
                }
              } finally {
                if (_didIteratorError11) {
                  throw _iteratorError11;
                }
              }
            }

            var direction_v = new V2D(x2, y2);
            ship.relative_shoot_angle = direction_v.length ? direction_v.angle + Math.PI / 2 : 0;

            // new ship controls
            ship.acceleration = ship.LINEAR_ACCELERATION_LIMIT * y;
            ship.angular_acceleration = ship.ANGULAR_ACCELERATION_LIMIT * x;

            // if(direction_v.length) ship.shoot();


            if (s || direction_v.length) if (ship.canShoot()) this.addBullet(ship);
          }

          // validate new position TODO (revise)
          var r = ship.radius + 8;
          if (ship.position.x - r < 0) {
            ship.position.x = r;
            ship.velocity.x = 0;
          }
          if (ship.position.y - r < 0) {
            ship.position.y = r;
            ship.velocity.y = 0;
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
      } catch (err) {
        _didIteratorError10 = true;
        _iteratorError10 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion10 && _iterator10.return) {
            _iterator10.return();
          }
        } finally {
          if (_didIteratorError10) {
            throw _iteratorError10;
          }
        }
      }
    }
  }, {
    key: 'broadcastShip',
    value: function broadcastShip() {
      var ship, input;
      if ((ship = this.ships.main) && (input = ship.owner.input)) {
        if (input.changed) {
          // log(Array.from(input));
          // NetworkHelper.out_input_stack(Array.from(input));
          input.changed = false;
        }

        this.network.sendShipUpdate(ship.export_update());

        if (new Date().getTime() % 60 < 2) this.network.sendShipOverride(ship.export_override());
        if (ship.flag && ship.disabled) this.releaseFlag();
        // if(ship.flag && ship.disabled && !this.game.flag.idle) NetworkHelper.out_flag_drop();
      }
    }
  }, {
    key: 'updateBullets',
    value: function updateBullets() {
      var _this20 = this;

      this.model.bullets.forEach(function (b) {
        b.update(_this20.dt);
        _this20.setCollisionDivisions(b);
      });
      // this.model.bullets.forEach(b => { b.update(); if(b.disabled) NetworkHelper.out_bullet_destroy(b.id) });
    }
  }, {
    key: 'updateBlocks',
    value: function updateBlocks() {
      var _this21 = this;

      // needs needs work
      this.model.blocks.forEach(function (b) {
        if (b.locked) return;
        if (b.qualified) {
          _this21.snapToGrid(b.position);
          b.scale = 1;
          _this21.setCollisionDivisions(b);
          if (!_this21.spectate) _this21.createOverlayMinimapBlockViewFor(b);
          if (!_this21.spectate) if (b.team != _this21.team.number) _this21.refGroups.enemyBlocks.add(b); // TODO REVISE AFTER NEW COLLISION SYSTEM!!
          b.locked = true;
          b.qualified = false;
        }
        b.update(_this21.dt);
        // if(b.disabled) NetworkHelper.out_block_destroy(b.id) // due to aging
      });
    }
  }, {
    key: 'updateSubs',
    value: function updateSubs() {
      var _this22 = this;

      this.model.subs.forEach(function (p) {
        p.update(_this22.dt);
        if (p.collision_groups) _this22.setCollisionDivisions(p);

        switch (p.type) {
          case 'attractor':
          case 'repulsor':

            // field effects TODO is games responsibility..? dt is passed to subs themseves..
            var distance, direction;
            _this22.model.bullets.forEach(function (b) {
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
              if ((ship = _this22.ships.main) && ship.subs.has(p.id)) {
                var distance;
                _this22.refGroups.enemyBlocks.forEach(function (block) {
                  if (block && !block.disabled) {
                    if ((distance = Physics.distance(block.position, p.position)) < p.EXPLOSION_RANGE) {
                      _this22.damageBlock(block.id, p.EXPLOSION_DAMAGE_FUNCTION(distance));
                    }
                  }
                });
              }

              // the player is the only one who must wait, the others have been notified to endSub
              _this22.removeSub(p.id);
            }

            break;
          case 'stealth_cloak':
            if (p.disabled) ENV.game.destroySub(p.id);
            break;
          case 'missile':

            // targeting
            if (p.target && (Physics.distance(p.target.position, p.position) > p.VISION_RANGE || p.target.stealth)) p.target = null;
            _this22.ships.forEach(function (ship) {
              if (ship && !ship.disabled && !ship.stealth && ship.owner.team.number != p.team) {
                if (!p.target && (distance = Physics.distance(ship.position, p.position)) < p.VISION_RANGE) {
                  p.target = ship;
                }
              }
            });

            // exploding
            if (p.exploding) {

              // only the player who created it hands out damage to the blocks so it is done once
              var ship;
              if ((ship = _this22.ships.main) && ship.subs.has(p.id)) {
                var distance;
                _this22.refGroups.enemyBlocks.forEach(function (block) {
                  if (block && !block.disabled) {
                    if ((distance = Physics.distance(block.position, p.position) - block.radius) < p.EXPLOSION_RANGE) {
                      _this22.changeBlock(block.id, ship.owner.team.number);
                      if (!_this22.spectate) _this22.ships.main.blocks.add(block.id);
                    }
                  }
                });
              }

              // the player is the only one who must wait, the others have been notified to endSub
              _this22.removeSub(p.id);
            }

            break;
          default:
            break;
        }
      });
    }
  }, {
    key: 'checkForCollisions',
    value: function checkForCollisions() {
      // in theory, the user will only check
      // collisions of those things which it
      // created. though in practice, perhaps
      // just it's attack moves. e.g. bullets

      var _iteratorNormalCompletion12 = true;
      var _didIteratorError12 = false;
      var _iteratorError12 = undefined;

      try {
        for (var _iterator12 = this.physics.divisions[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
          var div = _step12.value;
          var _iteratorNormalCompletion13 = true;
          var _didIteratorError13 = false;
          var _iteratorError13 = undefined;

          try {
            for (var _iterator13 = this.physics.collision_checks[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
              var _ref6 = _step13.value;

              var _ref7 = _slicedToArray(_ref6, 3);

              var a_type = _ref7[0];
              var b_type = _ref7[1];
              var check = _ref7[2];
              var _iteratorNormalCompletion14 = true;
              var _didIteratorError14 = false;
              var _iteratorError14 = undefined;

              try {
                for (var _iterator14 = div[a_type][Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                  var body_a = _step14.value;
                  var _iteratorNormalCompletion15 = true;
                  var _didIteratorError15 = false;
                  var _iteratorError15 = undefined;

                  try {
                    for (var _iterator15 = div[b_type][Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
                      var body_b = _step15.value;

                      if (Physics.doTouch(body_a, body_b)) check(body_a, body_b);
                    }
                  } catch (err) {
                    _didIteratorError15 = true;
                    _iteratorError15 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion15 && _iterator15.return) {
                        _iterator15.return();
                      }
                    } finally {
                      if (_didIteratorError15) {
                        throw _iteratorError15;
                      }
                    }
                  }
                }
              } catch (err) {
                _didIteratorError14 = true;
                _iteratorError14 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion14 && _iterator14.return) {
                    _iterator14.return();
                  }
                } finally {
                  if (_didIteratorError14) {
                    throw _iteratorError14;
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError13 = true;
            _iteratorError13 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion13 && _iterator13.return) {
                _iterator13.return();
              }
            } finally {
              if (_didIteratorError13) {
                throw _iteratorError13;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError12 = true;
        _iteratorError12 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion12 && _iterator12.return) {
            _iterator12.return();
          }
        } finally {
          if (_didIteratorError12) {
            throw _iteratorError12;
          }
        }
      }
    }
  }, {
    key: 'updateGame',
    value: function updateGame() {
      switch (this.gameMode) {

        case 0:
          // ctf

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

            if (percent < 0 && player == this.player) this.network.sendFlagProgress([player.team.number, current_score]);
            // this.network.out_game_over(player.team.number);


            // LEAD COMPARISON
            // replace lead if none exists
            if (!this.game.lead) this.game.lead = player.team;

            // replace lead if record shows
            if (current_score < this.game.scores[this.game.lead.number]) {

              if (!this.spectate) {
                // if you are replacing
                if (player.team == this.team) {
                  var c = this.team.color;
                  this.alert(DeepSpaceGame.localizationStrings.alerts['teamTakesLead'][this.language](), c);
                  this.network.sendFlagProgress([player.team.number, current_score]);
                  // if (this.game.overtime) this.network.out_game_over(this.team.number);
                }
                // if you are being replaced
                else if (this.game.lead == this.team) {
                    var _c = player.team.color;
                    this.alert(DeepSpaceGame.localizationStrings.alerts['teamLosesLead'][this.language](), _c);
                  }
              }

              this.game.lead = player.team;
            }
          }

          break;

        case 1:

          break;

      } // end switch

    }
  }, {
    key: 'updateView',
    value: function updateView() {
      this.updateShipViews();
      this.updateBulletViews();
      this.updateBlockViews();
      this.updateSubViews();

      this.updateCamera();
      this.updateBackground();
      this.updateMap();
      // this.updateTINT();
      // this.updateGrid();

      this.updateGameViews();

      if (!this.spectate) this.updateMinimapView();

      this.stage.update(); // render changes!!
    }
  }, {
    key: 'updateShipViews',
    value: function updateShipViews() {
      var _this23 = this;

      this.ships.forEach(function (ship) {

        var isVisible = ship.view.visible = _this23.camera.showing(ship);
        var shipIsVisible = ship.view.visible = _this23.camera.showing(ship);

        if (ship.view.visible = _this23.camera.showing(ship) || ship.view == _this23.camera.focus) {

          var visibility = 1;
          if (ship.disabled) {
            visibility = 0;
          } else {
            if (_this23.game.flag && _this23.game.flag.holderID === ship.owner.id) {
              visibility = 1;
            } else {
              if (ship.owner.team != _this23.team && ship.charging) {
                visibility = 0;
              } else if (ship.stealth) {
                if (ship.owner.team == _this23.team) {
                  visibility = Math.flipCoin(0.2) ? 0 : 0.4;
                } else {
                  visibility = 0;
                }
              }
            }
          }

          var ship_view = ship.view.ship;
          ship_view.alpha = ship.health * visibility;
          ship_view.rotation = Math.degrees(ship.angle);

          ship.view.x = ship.position.x;
          ship.view.y = ship.position.y;

          // ship.view.graphics.clear();
          ship_view.image = ship.flag ? ship_view.filled : ship_view.hollow;
        }
      });
      this.updateEnergyMeterView();
      this.updateNameViews();
    }
  }, {
    key: 'updateEnergyMeterView',
    value: function updateEnergyMeterView() {
      if (this.spectate) return;

      var ship = this.player.ship,
          meterView = ship.view.meter,
          shadowView = meterView.shadow,
          percent = ship.energy / 100,
          offset = V2D.new({ angle: ship.angle + Math.PI / 4, length: 30 / this.scale });
      meterView.graphics = DeepSpaceGame.graphics.energyMeter(this.team.color, percent, this.scale);
      meterView.alpha = shadowView.alpha = ship.disabled ? 0 : 1;
      meterView.x = shadowView.x = offset.x;
      meterView.y = shadowView.y = offset.y;
      meterView.rotation = shadowView.rotation = Math.degrees(ship.angle + Math.PI / 2);
    }
  }, {
    key: 'updateNameViews',
    value: function updateNameViews() {
      if (this.spectate) return;

      var our_ship = this.ships.main,
          our_team = void 0;
      if (our_ship) our_team = our_ship.owner.team;

      this.ships.forEach(function (ship) {
        if (ship.owner.team == our_team && ship != our_ship) {
          var textView = ship.view.text,
              offset = V2D.new({ angle: our_ship.angle, length: 30 });
          textView.x = offset.x;
          textView.y = offset.y;
          textView.rotation = Math.degrees(our_ship.angle + Math.PI / 2);
        }
      });
    }
  }, {
    key: 'updateBulletViews',
    value: function updateBulletViews() {
      var _this24 = this;

      var views = this.view.bullets;
      this.model.bullets.forEach(function (b) {
        var v = views.get(b.id);
        if (_this24.camera.showing(b)) {
          if (!v) v = _this24.createBulletView(b);
          v.x = b.position.x;
          v.y = b.position.y;
        } else {
          if (v) _this24.destroyBulletView(b.id);
        }
      });
    }
  }, {
    key: 'updateBlockViews',
    value: function updateBlockViews() {
      var _this25 = this;

      var views = this.view.blocks;
      this.model.blocks.forEach(function (b) {
        var v = views.get(b.id);

        if (_this25.camera.showing(b)) {
          if (!v) v = _this25.createBlockView(b);
          v.alpha = b.health * 0.9 + 0.1;
          v.x = b.position.x;
          v.y = b.position.y;
          v.scaleX = v.scaleY = b.radius / Block.stats.MAX_RADIUS * b.scale;
          if (b.qualified) {
            var type = b.isForeign ? 'enemy' : 'locked';
            v.image = DeepSpaceGame.graphicsCaches.blocks[type][b.team];
          }
        } else {
          if (v) _this25.destroyBlockView(b.id);
        }
      });
    }
  }, {
    key: 'updateSubViews',
    value: function updateSubViews() {
      var _this26 = this;

      var views = this.view.subs;
      this.model.subs.forEach(function (s) {
        var v = views.get(s.id);
        if (v && (v.visible = _this26.camera.showing(s))) {
          v.x = s.position.x;
          v.y = s.position.y;
          v.rotation = Math.degrees(s.rotation);
        }
      });
    }
  }, {
    key: 'updateCamera',
    value: function updateCamera() {
      this.camera.update();
      // if(camera.position)
    }
  }, {
    key: 'updateBackground',
    value: function updateBackground() {

      var background = this.view.layer.background.map_background;
      var map_width = this.mapInfo.width;
      var map_height = this.mapInfo.height;
      var half_window_width = this.window.width / 2;
      var half_window_height = this.window.height / 2;
      var half_background_width = background.cacheCanvas.width / 2;
      var half_background_height = background.cacheCanvas.height / 2;
      var backgroundPositionVector = V2D.new(this.camera.focus);
      var centerOffset = V2D.new({ x: this.camera.offset.x - half_window_width, y: this.camera.offset.y - half_window_height });

      centerOffset.div(this.scale);
      centerOffset.angle = Math.radians(this.camera.focus.ship.rotation);
      backgroundPositionVector.add(centerOffset);

      // edges
      if (backgroundPositionVector.x < half_background_width) backgroundPositionVector.x = half_background_width;
      if (backgroundPositionVector.y < half_background_height) backgroundPositionVector.y = half_background_height;

      if (backgroundPositionVector.x > map_width - half_background_width) backgroundPositionVector.x = map_width - half_background_width;
      if (backgroundPositionVector.y > map_height - half_background_height) backgroundPositionVector.y = map_height - half_background_height;

      background.x = backgroundPositionVector.x;
      background.y = backgroundPositionVector.y;

      background.rotation = -90;

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
  }, {
    key: 'updateMap',
    value: function updateMap() {
      var _this27 = this;

      this.teams.forEach(function (team) {
        team.spawn_camp.view.visible = _this27.camera.showing(team.spawn_camp);
      });

      this.model.map.impermeables.forEach(function (imp, i) {
        _this27.view.map.impermeables[i].visible = _this27.camera.showing(imp);
      });
    }
  }, {
    key: 'updateTINT',
    value: function updateTINT() {
      try {
        if (TINT) TINT.setAngleOffset(-this.camera.focus.ship.rotation);
      } catch (e) {
        log('tint load failed');
      }
    }
  }, {
    key: 'updateGrid',
    value: function updateGrid() {
      var focus = this.camera.focus;
      if (focus) GRID.offset(-focus.x, -focus.y);
    }
  }, {
    key: 'updateGameViews',
    value: function updateGameViews() {
      var _this28 = this;

      var list = this.calculateTeamScoreAppearance();

      this.view.overlay.score.team.forEach(function (text, i) {
        text.text = _this28.game.scores[i];
        // text.scaleX = text.scaleY = (this.teams[i] == this.game.lead ? 1 : 0.86);

        if (_this28.gameMode == 0) // todo FIX --     export logic to another function to know which is larger
          text.scaleX = text.scaleY = list[i] ? 1 : 0.86;
      });

      if (this.gameMode == 0) this.updateFlagView();
    }
  }, {
    key: 'calculateTeamScoreAppearance',
    value: function calculateTeamScoreAppearance() {

      var list = [];

      switch (this.gameMode) {

        case 0:
          // ctf

          var _iteratorNormalCompletion16 = true;
          var _didIteratorError16 = false;
          var _iteratorError16 = undefined;

          try {
            for (var _iterator16 = this.teams[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
              var team = _step16.value;

              list.push(team.players.map(function (p) {
                return p.id;
              }).indexOf(this.game.flag.holderID) != -1);
            }
          } catch (err) {
            _didIteratorError16 = true;
            _iteratorError16 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion16 && _iterator16.return) {
                _iterator16.return();
              }
            } finally {
              if (_didIteratorError16) {
                throw _iteratorError16;
              }
            }
          }

          break;

        case 1:
          // territory

          var bestScore = _(this.game.scores).max();
          _(this.game.scores).each(function (score) {
            return list.push(score == bestScore);
          });

          break;

      }

      return list;
    }
  }, {
    key: 'updateFlagView',
    value: function updateFlagView() {
      var v = this.view.flag,
          flag = this.game.flag;

      var not_visible = false;
      var newPosition = new V2D(flag.position.x - this.camera.plane.regX, flag.position.y - this.camera.plane.regY);
      newPosition.angle -= Math.radians(this.camera.focus.ship.rotation + 90);
      newPosition.mul(this.scale);
      newPosition.add({ x: this.camera.plane.x, y: this.camera.plane.y });
      v.x = newPosition.x;
      v.y = newPosition.y;
      var padding = flag.radius * 2;
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

      v.alpha = not_visible ? 0.3 : flag.idle ? 1 : 0;

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
  }, {
    key: 'updateMinimapView',
    value: function updateMinimapView() {
      var mini = this.view.overlay.minimap;

      // ships
      this.team.players.forEach(function (player, i) {
        mini.players[i].x = player.ship.position.x * mini.scale;
        mini.players[i].y = player.ship.position.y * mini.scale;
      });

      // flag
      if (this.gameMode == 0) {
        var flag = this.game.flag;
        mini.flag.x = flag.position.x * mini.scale;
        mini.flag.y = flag.position.y * mini.scale;
      }
    }
  }, {
    key: 'updateCameraFocus',
    value: function updateCameraFocus() {
      this.camera.focus = this.activePlayers[this.activePlayerIndex].ship.view;
    }
  }, {
    key: 'log',
    value: function log() {}
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


    // end vs stop: end happens when the local game appears to conclude; interaction with the game is stopped
    // and the state might even be obstructed from view though the simluation continues;

  }, {
    key: 'disableInteraction',
    value: function disableInteraction() {
      this.game.disabled = true;
      if (this.player) this.resetInput();
      this.deinitListeners();
      this.timer.cancel();
    }
  }, {
    key: 'endSimulation',
    value: function endSimulation() {
      this.game.ended = true;
      // SoundHelper.stop();
    }
  }, {
    key: 'timerExpire',
    value: function timerExpire() {
      var _this29 = this;

      // let server know TODO this should not lie here like this..
      switch (this.gameMode) {

        case 0:
          // ctf

          var team = this.player.team.number;
          var score = this.game.scores[team];
          this.network.sendFlagProgress([team, score]);

          break;

      }

      // LOBBY.disableGame();

      // disconnect if no server response after 6s
      setTimeout(function () {
        if (!(_this29.game.ended || _this29.game.overtime)) LOBBY.disconnect();
      }, 6000);
    }
  }, {
    key: 'takeOvertime',
    value: function takeOvertime() {
      var _this30 = this;

      this.game.overtime = true;

      // disconnect if no server response after 40s
      setTimeout(function () {
        if (!_this30.game.ended) LOBBY.disconnect();
      }, TIME.sec(40)); // OVERTIME DURATION.. todo
    }
  }, {
    key: 'end',
    value: function end(results) {

      // this.setScoreToResults(results);

      this.game.ended = true;
      this.disableInteraction();
    }
  }, {
    key: 'setScoreToResults',
    value: function setScoreToResults(results) {}
    // this.game.scores = results;


    // *** NEW NETWORK STRUCTURE *** //

    // ** SHIP ** //

  }, {
    key: 'damageShip',
    value: function damageShip(toID, hp, fromID) {

      // interpret damage data
      var data = [toID, hp, fromID];

      // adjust locally (if possible)
      this.adjustShipHP(data);

      // send through network
      this.network.sendAdjustShipHP(data);
    }
  }, {
    key: 'adjustShipHP',
    value: function adjustShipHP(_ref8) {
      var _ref9 = _slicedToArray(_ref8, 3),
          toID = _ref9[0],
          hp = _ref9[1],
          fromID = _ref9[2];

      // health on a player can only be adjusted by own player
      if (toID !== this.player.id) return;

      // damage and send death if neccessary
      if (this.player.ship.damage(hp)) this.processDeath([toID, fromID]);
    }
  }, {
    key: 'processDeath',
    value: function processDeath(data) {

      // announce locally
      this.deathOccurrence(data);

      // send through network
      this.network.sendDeathOccurrence(data);
    }
  }, {
    key: 'deathOccurrence',
    value: function deathOccurrence(_ref10) {
      var _ref11 = _slicedToArray(_ref10, 2),
          toID = _ref11[0],
          fromID = _ref11[1];

      var t = this.players.get(toID);
      var g = this.players.get(fromID);

      if (t) t.score.deaths++;
      if (g) g.score.kills++;

      if (this.spectate) return;
      if (toID == this.player.id) {
        var player = this.players.get(fromID);
        this.alert_kill(DeepSpaceGame.localizationStrings.alerts['yourDeath'][this.language](player.name));
        this.camera.animateFocus(player.ship.view, [this.player.ship, 'disabled']);
        // this.camera.animateFocus(player.ship.view, player.ship.RESPAWN_DELAY*16.7);
      } else if (fromID == this.player.id) {
        this.alert_kill(DeepSpaceGame.localizationStrings.alerts['yourKill'][this.language](this.players.get(toID).name));
      }
    }

    // ** PROJECTILES ** //

    // * BULLETS * //

  }, {
    key: 'addBullet',
    value: function addBullet(ship) {

      // interpretation ship data for bullet creation
      var data = this.generateBulletData(ship);

      // actually create bullet object
      this.createBullet(data);

      // ditribute bullet creation data to other clients
      this.network.sendCreateBullet(data);

      // notify ship
      ship.didShoot(data.id);
    }
  }, {
    key: 'generateBulletData',
    value: function generateBulletData(ship) {

      return {
        id: Math.uuid(),
        creator: ship.owner.id,
        team: ship.owner.team.number,
        position: ship.shoot_position,
        angle: ship.shoot_angle + ship.shot_RNG,
        radius: ship.ATTACK_RADIUS,
        hp: ship.ATTACK_HP,
        lifespan: ship.ATTACK_LIFESPAN,
        velocity: ship.velocity,
        speed: ship.ATTACK_SPEED
      };
    }
  }, {
    key: 'createBullet',
    value: function createBullet(data) {

      var b = new Bullet(data);

      // set model map
      this.model.bullets.set(b.id, b);

      // collision groups
      b.collision_groups = [this.physics.collision_groups.BULLETS];
      b.collision_groups.push(this.teams[b.team] == this.team ? this.physics.collision_groups.OUR_BULLETS : this.physics.collision_groups.ENEMY_BULLETS);
      if (!this.spectate && b.creator == this.player.id) b.collision_groups.push(this.physics.collision_groups.MY_BULLETS);
    }
  }, {
    key: 'removeBullet',
    value: function removeBullet(id) {

      // remove local copy
      this.destroyBullet(id);

      // annouce bullet demise
      this.network.sendDestroyBullet(id);
    }
  }, {
    key: 'destroyBullet',
    value: function destroyBullet(id) {

      var b = this.model.bullets.get(id);
      if (!b) return;

      this.clearCollisionDivisions(b);

      this.model.bullets.delete(id);
      if (!this.spectate) this.ships.main.bullets.delete(id);

      // erase the view for it.
      this.destroyBulletView(id);
    }

    // * BLOCKS * //

  }, {
    key: 'addBlock',
    value: function addBlock(ship) {

      // interpretation ship data for block creation
      var data = this.generateBlockData(ship);

      // actually create block object
      this.createBlock(data);

      // ditribute bullet creation data to other clients
      this.network.sendCreateBlock(data);

      // notify ship
      ship.didBlock(data.id);
    }
  }, {
    key: 'generateBlockData',
    value: function generateBlockData(ship) {
      return {
        id: Math.uuid(),
        creator: ship.owner.id,
        team: ship.owner.team.number,
        position: ship.front_weapon_position,
        angle: ship.angle + ship.BLOCK_SPREAD / 2 * (Math.random() * 2 - 1),
        hp: ship.BLOCK_HP_CAPACITY,
        // radius: Math.randomIntMinMax(Block.stats.MIN_RADIUS, Block.stats.MAX_RADIUS)
        radius: Block.stats.MAX_RADIUS,
        speed: Math.randomIntMinMax(Block.stats.MIN_SPEED, Block.stats.MAX_SPEED)
      };
    }
  }, {
    key: 'createBlock',
    value: function createBlock(data) {

      var bl = new Block(data);

      // misc..?
      bl.isForeign = this.spectate || bl.team != this.team.number;

      // set model map
      this.model.blocks.set(bl.id, bl);

      // collision groups
      bl.collision_groups = [this.physics.collision_groups.REFUGE];
      if (this.teams[bl.team] != this.team) {
        bl.collision_groups.push(this.physics.collision_groups.ENEMY_BLOCKS);
      } else {
        bl.collision_groups.push(this.physics.collision_groups.OUR_REFUGE);
        bl.collision_groups.push(this.physics.collision_groups.OUR_BLOCKS);
      }

      // notify game
      if (this.gameMode == 1) this.game.scores[data.team]++;
    }
  }, {
    key: 'damageBlock',
    value: function damageBlock(id, hp) {

      // interpret damage data
      var data = [id, hp];

      // adjust locally
      this.adjustBlockHP(data);

      // send through network
      this.network.sendAdjustBlockHP(data);
    }
  }, {
    key: 'adjustBlockHP',
    value: function adjustBlockHP(_ref12) {
      var _ref13 = _slicedToArray(_ref12, 2),
          id = _ref13[0],
          hp = _ref13[1];

      var block = ENV.game.model.blocks.get(id);
      if (block) block.damage(hp);
    }
  }, {
    key: 'changeBlock',
    value: function changeBlock(id, team) {

      // interpret change data
      var data = [id, team];

      // adjust locally
      this.setBlockTeam(data);

      // send through network
      this.network.sendSetBlockTeam(data);
    }
  }, {
    key: 'setBlockTeam',
    value: function setBlockTeam(_ref14) {
      var _ref15 = _slicedToArray(_ref14, 2),
          id = _ref15[0],
          team = _ref15[1];

      // retrieve and store block
      var b = this.model.blocks.get(id);
      if (!b) return false;

      // begin change if locked
      if (b.locked) {

        // skip if change is unnecessary
        if (b.team != team) {

          var oldTeam = b.team;

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

          //
          if (!this.spectate) {

            this.ships.main.blocks.delete(id);
          }

          // replace and delete old view
          var v = this.view.blocks.get(id);
          if (v) {
            var type = this.refGroups.enemyBlocks.has(b) ? 'enemy' : b.locked ? 'locked' : 'unlocked';
            v.image = DeepSpaceGame.graphicsCaches.blocks[type][b.team];
            // v.updateCache();
          }

          // collision groups
          this.clearCollisionDivisions(b);
          b.collision_groups = [this.physics.collision_groups.REFUGE];
          if (this.teams[b.team] != this.team) {
            b.collision_groups.push(this.physics.collision_groups.ENEMY_BLOCKS);
          } else {
            b.collision_groups.push(this.physics.collision_groups.OUR_REFUGE);
          }
          this.setCollisionDivisions(b);

          // notify game
          if (this.gameMode == 1) {
            this.game.scores[oldTeam]--;
            this.game.scores[team]++;
          }
        } // end if(b.team != team)
      } // end if(!b.locked)

    }
  }, {
    key: 'removeBlock',
    value: function removeBlock(id) {

      // remove local copy
      this.destroyBlock(id);

      // annouce blocks demise
      this.network.sendDestroyBlock(id);
    }
  }, {
    key: 'destroyBlock',
    value: function destroyBlock(id) {
      var b = this.model.blocks.get(id);
      if (!b) return false;

      this.clearCollisionDivisions(b);

      this.model.blocks.delete(id);
      if (!this.spectate) this.ships.main.blocks.delete(id);

      if (b.locked) this.refGroups.enemyBlocks.delete(b);

      // erase the view for it.
      this.destroyBlockView(id);
      this.destroyOverlayMinimapBlockViewFor(id);

      // notify game
      if (this.gameMode == 1) this.game.scores[b.team]--;

      return true;
    }

    // * SUBS * //

  }, {
    key: 'addSub',
    value: function addSub(ship) {

      // interpretation ship data for sub creation
      var data = this.generateSubData(ship);

      // actually create block object
      this.createSub(data);

      // ditribute bullet creation data to other clients
      this.network.sendCreateSub(data);

      // notify ship
      ship.didSub(data.id);
    }
  }, {
    key: 'generateSubData',
    value: function generateSubData(ship) {
      return {
        id: Math.uuid(),
        type: ship.SUB_TYPE,
        team: ship.owner.team.number,
        player: ship.owner.id,
        position: ship.front_weapon_position,
        angle: ship.angle
      };
    }
  }, {
    key: 'createSub',
    value: function createSub(data) {
      var p;
      switch (data.type) {
        case 'attractor':
          p = new Attractor(data);
          break;
        case 'repulsor':
          p = new Repulsor(data);
          break;
        case 'block_bomb':
          p = new BlockBomb(data);
          break;
        case 'stealth_cloak':
          p = new StealthCloak(data);
          break;
        case 'missile':
          p = new Missile(data);
          break;
        default:
          break;
      }

      // create a view for it.
      if (data.type != 'stealth_cloak') {
        var graphics = DeepSpaceGame.graphics[data.type](this.teams[p.team].color);
        var pv = new createjs.Shape(graphics);
        pv.cache(-12, -12, 24, 24);
        this.view.layer.action.back.addChild(pv);

        this.view.subs.set(p.id, pv);

        // if(this.camera.showing(p)) SoundHelper.fireSub(); // no sound for stealth

        p.collision_groups = this.teams[p.team] == this.team ? [this.physics.collision_groups.OUR_PROJ_SUBS] : [];
      }

      this.model.subs.set(p.id, p);

      if (!this.spectate) if (p.team != this.ships.main.owner.team.number) this.refGroups.enemySubs.add(p.id);

      return p;
    }
  }, {
    key: 'removeSub',
    value: function removeSub(id) {

      // remove local copy
      this.destroySub(id);

      // annouce blocks demise
      this.network.sendDestroySub(id);
    }
  }, {
    key: 'destroySub',
    value: function destroySub(id) {
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

    // * GAME * //

    // CTF //

  }, {
    key: 'assumeFlag',
    value: function assumeFlag(ship) {

      // interpret for flag capture
      var id = ship.owner.id;

      // capture flag locally
      this.captureFlag(id);

      // let other clients know
      this.network.sendCaptureFlag(id);

      // notify ship
      ship.didPickupFlag();
    }
  }, {
    key: 'captureFlag',
    value: function captureFlag(id) {

      // set flag and ship state
      var player = this.players.get(id);
      this.game.flag.holderID = id;
      if (this.players.get(id)) this.players.get(id).ship.setFlag(this.game.flag);

      // alert
      var c = player.team.color,
          us = player.team == this.team;
      // var c = DeepSpaceGame.colors[player.team.color], us = player.team == this.team;
      this.alert(DeepSpaceGame.localizationStrings.alerts[us ? 'teamTakesFlag' : 'enemyTakesFlag'][this.language](DeepSpaceGame.localizationStrings.colors[c][this.language]), c);

      // sound
      // us ? SoundHelper.teamYay() : SoundHelper.teamNay();

      // this.updateFlagView();
    }
  }, {
    key: 'releaseFlag',
    value: function releaseFlag() {

      // capture flag locally
      this.dropFlag();

      // let other clients know
      this.network.sendDropFlag();

      // let server know
      var team = this.player.team.number;
      var score = this.game.scores[team];
      this.network.sendFlagProgress([team, score]);
    }
  }, {
    key: 'dropFlag',
    value: function dropFlag() {

      var id,
          flag = this.game.flag,
          ship = null;

      if (id = flag.holderID) {
        var player = this.players.get(flag.holderID);
        if (ship = player.ship) ship.clearFlag();

        flag.reset();

        var c = player.team.color,
            us = player.team == this.team;
        var color = undefined; //us || this.spectate ? undefined : this.team.color;
        this.alert(DeepSpaceGame.localizationStrings.alerts[us ? 'teamDropsFlag' : 'enemyDropsFlag'][this.language](DeepSpaceGame.localizationStrings.colors[c][this.language]), color);

        // this.updateFlagView();
      }
    }
  }, {
    key: 'flagProgress',
    value: function flagProgress(_ref16) {
      var _ref17 = _slicedToArray(_ref16, 2),
          team = _ref17[0],
          score = _ref17[1];

      // update local registry w/ server score
      this.game.scores[team] = score;
    }

    // pickupFlag(playerID) { // flag activation needs to go through here
    //   var flag = this.game.flag, ship = null;
    //   // if(!flag.idle) NetworkHelper.out_flag_drop();
    //   flag.holderID = playerID;
    //
    //   var player = this.players.get(flag.holderID);
    //
    //
    //   if (ship = player.ship) {
    //     ship.setFlag(flag);
    //     if(this.game.overtime)
    //       if(ship.owner.team == this.game.lead)
    //         if(ship.owner.team == this.team)
    //           this.network.out_game_over(this.team.number);
    //   }
    //
    //
    //
    //   var c = DeepSpaceGame.colors[player.team.color], us = player.team == this.team;
    //   this.alert(
    //     DeepSpaceGame.localizationStrings.alerts[us ? 'teamTakesFlag' : 'enemyTakesFlag'][this.language](
    //       DeepSpaceGame.localizationStrings.colors[c][this.language]
    //     )
    //     , c);
    //
    //   // sound
    //   us ? SoundHelper.teamYay() : SoundHelper.teamNay();
    //
    //   // this.updateFlagView();
    // }

    // dropFlag() {
    //   var id, flag = this.game.flag, ship = null;
    //   if (id = flag.holderID) {
    //     var player = this.players.get(flag.holderID)
    //     if (ship = player.ship)
    //       ship.clearFlag();
    //
    //     flag.reset();
    //
    //     var c = player.team.color, us = player.team == this.team;
    //     this.alert(
    //       DeepSpaceGame.localizationStrings.alerts[us ? 'teamDropsFlag' : 'enemyDropsFlag'][this.language](
    //         DeepSpaceGame.localizationStrings.colors[c][this.language]
    //       )
    //       , us || this.spectate ? undefined : this.team.color);
    //
    //     // this.updateFlagView();
    //   }
    //
    // }


  }, {
    key: 'alert',
    value: function alert(msg) {
      var _this31 = this;

      var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "#ECEFF1";

      clearTimeout(this.alertTimeout);
      var v = this.view.overlay.message;
      v.text = msg;
      v.color = color;
      if (msg.trim() !== '') this.alertTimeout = setTimeout(function () {
        _this31.alert("");
      }, 4000);
    }
  }, {
    key: 'alert_kill',
    value: function alert_kill(msg) {
      var _this32 = this;

      var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "#ECEFF1";

      clearTimeout(this.alertKillTimeout);
      var v = this.view.overlay.kill_message;
      v.text = msg;
      v.color = color;
      if (msg.trim() !== '') this.alertKillTimeout = setTimeout(function () {
        _this32.alert_kill("");
      }, 4000);
    }
  }, {
    key: 'msgShipKill',
    value: function msgShipKill(takerID, giverID) {
      //alert(`takerID ${takerID}, giverID ${giverID},`)
      var t = this.players.get(takerID),
          g = this.players.get(giverID);
      if (t) t.score.deaths++;
      if (g) g.score.kills++;

      if (this.spectate) return;
      if (takerID == this.player.id) {
        var player = this.players.get(giverID);
        this.alert_kill(DeepSpaceGame.localizationStrings.alerts['yourDeath'][this.language](player.name));
        this.camera.animateFocus(player.ship.view, [this.player.ship, 'disabled']);
        // this.camera.animateFocus(player.ship.view, player.ship.RESPAWN_DELAY*16.7);
      } else if (giverID == this.player.id) {
        this.alert_kill(DeepSpaceGame.localizationStrings.alerts['yourKill'][this.language](this.players.get(takerID).name));
      }
    }

    /* NEW DYNAMIC GRAPHICS */
    // Size has grown. It is now ineffective to keep copies
    // of views for all map objects and choose to render
    // based on visibility. Views will be created and
    // destroyed dynamically. This will hopefully have
    // great performance benefits 09/17/17

  }, {
    key: 'createBulletView',
    value: function createBulletView(b) {

      var cache = DeepSpaceGame.graphicsCaches.bullets[b.team];
      var bv = new createjs.Bitmap(cache);
      bv.scaleX = bv.scaleY = b.radius / Bullet.stats.MAX_RADIUS;
      bv.regX = bv.regY = cache.width / 2;
      this.view.layer.action.back.addChild(bv);

      // set view map
      this.view.bullets.set(b.id, bv);

      return bv;
    }
  }, {
    key: 'destroyBulletView',
    value: function destroyBulletView(id) {

      var v = this.view.bullets.get(id);
      if (v) {
        this.view.bullets.delete(id);
        this.view.layer.action.back.removeChild(v);
      }
    }
  }, {
    key: 'createBlockView',
    value: function createBlockView(bl) {

      // a block can either look fluid or locked
      // these being either ours or theirs

      // create a view for it.
      var type = 'unlocked';
      if (bl.locked || bl.qualified) type = bl.isForeign ? 'enemy' : 'locked';
      var cache = DeepSpaceGame.graphicsCaches.blocks[type][bl.team];
      var blv = new createjs.Bitmap(cache);
      blv.scaleX = blv.scaleY = bl.radius / Block.stats.MAX_RADIUS;
      blv.regX = blv.regY = cache.width / 2;
      this.view.layer.action.back.addChild(blv);

      // set view map
      this.view.blocks.set(bl.id, blv);

      return blv;
    }
  }, {
    key: 'destroyBlockView',
    value: function destroyBlockView(id) {

      var v = this.view.blocks.get(id);
      if (v) {
        this.view.blocks.delete(id);
        this.view.layer.action.back.removeChild(v);
      }
    }

    /* DEINITIALIZATION */

  }, {
    key: 'deinit',
    value: function deinit() {
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
  }, {
    key: 'deinitCaches',
    value: function deinitCaches() {
      delete this.enemyTeams;
      delete this.enemyPlayers;
      delete this.player;
      delete this.team;

      delete DeepSpaceGame.graphicsCaches;
    }
  }, {
    key: 'deinitPhysics',
    value: function deinitPhysics() {
      delete this.refGroups;
    }
  }, {
    key: 'deinitInput',
    value: function deinitInput() {
      var main = this.ships.main;
      if (main) delete main.owner.input;
    }
  }, {
    key: 'deinitListeners',
    value: function deinitListeners() {
      var _iteratorNormalCompletion17 = true;
      var _didIteratorError17 = false;
      var _iteratorError17 = undefined;

      try {
        for (var _iterator17 = this.inputHandlers[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
          var _ref18 = _step17.value;

          var _ref19 = _slicedToArray(_ref18, 2);

          var handler = _ref19[1];

          window.removeEventListener('keydown', handler); // onkeydown
          window.removeEventListener('keyup', handler); // onkeyup
        }
      } catch (err) {
        _didIteratorError17 = true;
        _iteratorError17 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion17 && _iterator17.return) {
            _iterator17.return();
          }
        } finally {
          if (_didIteratorError17) {
            throw _iteratorError17;
          }
        }
      }
    }
  }, {
    key: 'deinitCamera',
    value: function deinitCamera() {
      delete this.camera;
    }
  }, {
    key: 'deinitView',
    value: function deinitView() {
      delete this.view;
      delete this.window;
      this.stage.removeAllChildren();
      delete this.stage;
      delete this.colors;
    }
  }, {
    key: 'deinitGame',
    value: function deinitGame() {
      delete this.game;
    }
  }, {
    key: 'deinitModel',
    value: function deinitModel() {
      delete this.ships;
      delete this.players;
      delete this.teams;
    }
  }, {
    key: 'reset',
    value: function reset() {}
  }, {
    key: 'resetInput',
    value: function resetInput() {
      var input;
      if (this.player) if (input = this.player.input) input.clear();
    }
  }, {
    key: 'disconnectPlayer',
    value: function disconnectPlayer(id) {
      var player = this.players.get(id);
      if (player) {
        player.disconnected = true;
        player.ship.disabled = true;
        if (this.spectate) this.activePlayers.delete(player);

        // alert team members
        if (!this.spectate) {
          if (player.team === this.team) this.alert(DeepSpaceGame.localizationStrings.alerts['teamMemberDisconnects'][this.language](player.name));
        }
      } else {
        log('ERR in disconnectPlayer :: id(' + id + ') not found');
      }
    }
  }], [{
    key: 'create',
    value: function create(data, network) {
      if (DeepSpaceGame.runningInstance) DeepSpaceGame.runningInstance.deinit();
      return DeepSpaceGame.runningInstance = new DeepSpaceGame(data, network);
    }
  }]);

  return DeepSpaceGame;
}();

DeepSpaceGame.graphics = {
  circle_fill: function circle_fill(color, size) {
    return new createjs.Graphics().beginFill(color).drawCircle(0, 0, size);
  },

  spawn_camp: function spawn_camp(color) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(6).drawCircle(0, 0, 64);
  },
  spawn_camp_fill: function spawn_camp_fill(color) {
    return new createjs.Graphics().beginFill(color).drawCircle(0, 0, 64);
  },
  // spawn_camp: () => new createjs.Graphics().beginStroke("#37474F").setStrokeStyle(4).drawCircle(0, 0, 64),
  ship: [
  // 0 "standard"
  [function (color, width) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(8, 0).lineTo(-8, -8).lineTo(-8, 8).lineTo(8, 0).lineTo(-8, -8);
  }, function (color, width) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(8, 0).lineTo(-8, -8).lineTo(-8, 8).lineTo(8, 0).lineTo(-8, -8);
  }],

  // 1 "rate"
  [function (color, width) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(8, 0).lineTo(-4.8, -8).lineTo(-8, 0).lineTo(-4.8, 8).lineTo(8, 0).lineTo(-4.8, -8);
  }, function (color, width) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(8, 0).lineTo(-4.8, -8).lineTo(-8, 0).lineTo(-4.8, 8).lineTo(8, 0).lineTo(-4.8, -8);
  }],

  // 2 "speed"
  [function (color, width) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(8, 0).lineTo(-8, -8).lineTo(-4.8, 0).lineTo(-8, 8).lineTo(8, 0).lineTo(-8, -8);
  }, function (color, width) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(8, 0).lineTo(-8, -8).lineTo(-4.8, 0).lineTo(-8, 8).lineTo(8, 0).lineTo(-8, -8);
  }],

  // 3 "defense"
  [function (color, width) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(8, 0).lineTo(6.4, -4).lineTo(-8, -8).lineTo(-8, 8).lineTo(6.4, 4).lineTo(8, 0).lineTo(6.4, -4);
  }, function (color, width) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(8, 0).lineTo(6.4, -4).lineTo(-8, -8).lineTo(-8, 8).lineTo(6.4, 4).lineTo(8, 0).lineTo(6.4, -4);
  }],

  // 4 "damage"
  [function (color, width) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(width).moveTo(8, 0).lineTo(4.8, -8).lineTo(-8, -8).lineTo(-4.8, 0).lineTo(-8, 8).lineTo(4.8, 8).lineTo(8, 0).lineTo(4.8, -8);
  }, function (color, width) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(width).beginFill(color).moveTo(8, 0).lineTo(4.8, -8).lineTo(-8, -8).lineTo(-4.8, 0).lineTo(-8, 8).lineTo(4.8, 8).lineTo(8, 0).lineTo(4.8, -8);
  }]],
  particle: function particle(color, size) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(4).drawCircle(0, 0, size);
  },
  // bullet: (color) => DeepSpaceGame.graphics.particle(color)
  // block: (color, size) => new createjs.Graphics().beginFill(color).drawCircle(0, 0, size),
  block_border: function block_border(color, size) {
    return new createjs.Graphics().beginStroke(color).setStrokeStyle(2).drawCircle(0, 0, size);
  },
  block_fill: function block_fill(color, size) {
    return new createjs.Graphics().beginFill(color).drawCircle(0, 0, size);
  },
  block_center: function block_center(color) {
    return new createjs.Graphics().beginFill(color).drawCircle(0, 0, 2);
  },

  attractor: function attractor(color) {
    return new createjs.Graphics().beginFill(color).moveTo(2, 2).lineTo(2, 8).lineTo(-2, 8).lineTo(-2, 2).lineTo(-8, 2).lineTo(-8, -2).lineTo(-2, -2).lineTo(-2, -8).lineTo(2, -8).lineTo(2, -2).lineTo(8, -2).lineTo(8, 2).lineTo(2, 2);
  },
  repulsor: function repulsor(color) {
    return new createjs.Graphics().beginFill(color).moveTo(2, -8).lineTo(2, 8).lineTo(-2, 8).lineTo(-2, -8).lineTo(2, -8);
  }, //.lineTo(-8, -2).lineTo(-2, -2).lineTo(-2, -8).lineTo(2, -8).lineTo(2, -2).lineTo(8, -2).lineTo(8, 2).lineTo(2, 2),
  block_bomb: function block_bomb(color) {
    return new createjs.Graphics().beginFill(color).moveTo(-10, 0).arcTo(-10, -10, 0, -10, 10).lineTo(0, 10).arcTo(-9, 9, -10, 0, 10);
  },
  missile: function missile(color) {
    return new createjs.Graphics().beginFill(color).moveTo(6, 0).lineTo(-6, -6).lineTo(-6, 6).lineTo(6, 0);
  },

  ring: function ring(r) {
    return new createjs.Graphics().beginStroke("#ECEFF1").setStrokeStyle(16).drawCircle(0, 0, r);
  },
  flag: function flag(r) {
    return new createjs.Graphics().beginFill("#ECEFF1").drawCircle(0, 0, r);
  },
  flag_shadow: function flag_shadow() {
    return new createjs.Shadow("#ECEFF1", 0, 0, 10);
  },

  energyMeter: function energyMeter(color, percent, scale) {
    var radius = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 5;
    return new createjs.Graphics().beginFill(color).moveTo(0, 0).arc(0, 0, radius / scale, -Math.PI / 2, 2 * Math.PI * percent - Math.PI / 2);
  },
  energyMeterShadow: function energyMeterShadow(color, scale) {
    var radius = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 7;
    return new createjs.Graphics().beginFill(color).moveTo(0, 0).arc(0, 0, radius / scale, 0, 2 * Math.PI);
  }
};

DeepSpaceGame.renderingParameters = {
  'bulletCount': 100,
  'shipThrustParticleCount': 80
};

DeepSpaceGame.localizationStrings = {
  alerts: {
    enemyTakesFlag: {
      en: function en(color) {
        return 'The ' + color + ' team has the moon!';
      }
    },
    teamTakesFlag: {
      en: function en() {
        return 'We have the moon!';
      }
    },
    enemyDropsFlag: {
      en: function en(color) {
        return 'The ' + color + ' team dropped the moon!';
      }
    },
    teamDropsFlag: {
      en: function en() {
        return 'We dropped the moon!';
      }
    },
    yourKill: {
      en: function en(name) {
        return 'you got ' + name;
      }
    },
    yourDeath: {
      en: function en(name) {
        return name + ' got you!';
      }
    },
    teamTakesLead: {
      en: function en() {
        return 'We took the lead!';
      }
    },
    teamLosesLead: {
      en: function en() {
        return 'We lost the lead!';
      }
    },
    teamMemberDisconnects: {
      en: function en(name) {
        return 'Your teammate ' + name + ' has disconnected';
      }
    }
  },
  colors: {
    '#FF4081': {
      en: 'pink'
    },
    '#FF5252': {
      en: 'red'
    },
    '#FFEA00': {
      en: 'yellow'
    },
    '#00E676': {
      en: 'green'
    },
    '#00B0FF': {
      en: 'blue'
    },
    '#BB33FF': {
      en: 'purple'
    },
    '#ECEFF1': {
      en: 'white'
    },
    '#90A4AE': {
      en: 'light'
    },
    '#37474F': {
      en: 'dark'
    },
    '#263238': {
      en: 'black'
    },

    '#FFA33F': {
      en: 'orange'
    }, // 10 orange
    '#82E600': {
      en: 'lime'
    }, // 11 grass
    '#00FFE2': {
      en: 'aqua'
    }, // 12 aqua
    '#F93FFF': {
      en: 'magenta'
    } // 13 magenta
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

};DeepSpaceGame.colors = ['#FF4081', // 0 pink
'#FF5252', // 1 red
'#FFEA00', // 2 yellow
'#00E676', // 3 green
'#00B0FF', // 4 blue
'#BB33FF', // 5 purple AA00FF old
'#ECEFF1', // 6 white
'#90A4AE', // 7 light
'#37474F', // 8 dark
'#263238', // 9 black

// added colors
'#FFA33F', // 10 orange
'#82E600', // 11 grass
'#00FFE2', // 12 aqua
'#F93FFF'];

DeepSpaceGame.maps = [{
  name: "The Event Horizon",
  width: 1920, height: 1920,
  // width: 1024, height: 1024,
  spawn: [[{ x: 30, y: 30 }, { x: 30, y: 60 }, { x: 60, y: 60 }, { x: 60, y: 30 }], [{ x: 450, y: 290 }, { x: 450, y: 260 }], [{ x: 450, y: 290 }, { x: 450, y: 260 }]]
}];

DeepSpaceGame.maps = [{ // 0
  name: "Wide Sky",
  width: 3072 * 1, height: 3072 * 1,
  teams: [2],

  spawn: [
  // [{x: 192, y: 192}, {x: 3072 - 192, y: 3072 - 192}] // 2

  [{ x: 600 + 64, y: 777 + 64, rotation: Math.PI }, { x: 3072 - 600 - 64, y: 3072 - 777 - 64, rotation: 0 }, { x: 777 + 64, y: 3072 - 600 - 64, rotation: Math.PI / +2 }, { x: 3072 - 777 - 64, y: 600 + 64, rotation: Math.PI / -2 }, { x: 1476 + 64, y: 267 + 64, rotation: Math.PI / -2 }, { x: 3072 - 1476 - 64, y: 3072 - 267 - 64, rotation: Math.PI / 2 }, { x: 267 + 64, y: 3072 - 1476 - 64, rotation: Math.PI }, { x: 3072 - 267 - 64, y: 1476 + 64, rotation: 0 }], [{ x: 600 + 64, y: 777 + 64, rotation: Math.PI }, { x: 3072 - 600 - 64, y: 3072 - 777 - 64, rotation: 0 }, { x: 777 + 64, y: 3072 - 600 - 64, rotation: Math.PI / +2 }, { x: 3072 - 777 - 64, y: 600 + 64, rotation: Math.PI / -2 }, { x: 1476 + 64, y: 267 + 64, rotation: Math.PI / -2 }, { x: 3072 - 1476 - 64, y: 3072 - 267 - 64, rotation: Math.PI / 2 }, { x: 267 + 64, y: 3072 - 1476 - 64, rotation: Math.PI }, { x: 3072 - 267 - 64, y: 1476 + 64, rotation: 0 }], [{ x: 600 + 64, y: 777 + 64, rotation: Math.PI }, { x: 3072 - 600 - 64, y: 3072 - 777 - 64, rotation: 0 }, { x: 777 + 64, y: 3072 - 600 - 64, rotation: Math.PI / +2 }, { x: 3072 - 777 - 64, y: 600 + 64, rotation: Math.PI / -2 }, { x: 1476 + 64, y: 267 + 64, rotation: Math.PI / -2 }, { x: 3072 - 1476 - 64, y: 3072 - 267 - 64, rotation: Math.PI / 2 }, { x: 267 + 64, y: 3072 - 1476 - 64, rotation: Math.PI }, { x: 3072 - 267 - 64, y: 1476 + 64, rotation: 0 }], [{ x: 600 + 64, y: 777 + 64, rotation: Math.PI }, { x: 3072 - 600 - 64, y: 3072 - 777 - 64, rotation: 0 }, { x: 777 + 64, y: 3072 - 600 - 64, rotation: Math.PI / +2 }, { x: 3072 - 777 - 64, y: 600 + 64, rotation: Math.PI / -2 }, { x: 1476 + 64, y: 267 + 64, rotation: Math.PI / -2 }, { x: 3072 - 1476 - 64, y: 3072 - 267 - 64, rotation: Math.PI / 2 }, { x: 267 + 64, y: 3072 - 1476 - 64, rotation: Math.PI }, { x: 3072 - 267 - 64, y: 1476 + 64, rotation: 0 }], [{ x: 600 + 64, y: 777 + 64, rotation: Math.PI }, { x: 3072 - 600 - 64, y: 3072 - 777 - 64, rotation: 0 }, { x: 777 + 64, y: 3072 - 600 - 64, rotation: Math.PI / +2 }, { x: 3072 - 777 - 64, y: 600 + 64, rotation: Math.PI / -2 }, { x: 1476 + 64, y: 267 + 64, rotation: Math.PI / -2 }, { x: 3072 - 1476 - 64, y: 3072 - 267 - 64, rotation: Math.PI / 2 }, { x: 267 + 64, y: 3072 - 1476 - 64, rotation: Math.PI }, { x: 3072 - 267 - 64, y: 1476 + 64, rotation: 0 }], [{ x: 600 + 64, y: 777 + 64, rotation: Math.PI }, { x: 3072 - 600 - 64, y: 3072 - 777 - 64, rotation: 0 }, { x: 777 + 64, y: 3072 - 600 - 64, rotation: Math.PI / +2 }, { x: 3072 - 777 - 64, y: 600 + 64, rotation: Math.PI / -2 }, { x: 1476 + 64, y: 267 + 64, rotation: Math.PI / -2 }, { x: 3072 - 1476 - 64, y: 3072 - 267 - 64, rotation: Math.PI / 2 }, { x: 267 + 64, y: 3072 - 1476 - 64, rotation: Math.PI }, { x: 3072 - 267 - 64, y: 1476 + 64, rotation: 0 }], [{ x: 600 + 64, y: 777 + 64, rotation: Math.PI }, { x: 3072 - 600 - 64, y: 3072 - 777 - 64, rotation: 0 }, { x: 777 + 64, y: 3072 - 600 - 64, rotation: Math.PI / +2 }, { x: 3072 - 777 - 64, y: 600 + 64, rotation: Math.PI / -2 }, { x: 1476 + 64, y: 267 + 64, rotation: Math.PI / -2 }, { x: 3072 - 1476 - 64, y: 3072 - 267 - 64, rotation: Math.PI / 2 }, { x: 267 + 64, y: 3072 - 1476 - 64, rotation: Math.PI }, { x: 3072 - 267 - 64, y: 1476 + 64, rotation: 0 }], [{ x: 600 + 64, y: 777 + 64, rotation: Math.PI }, { x: 3072 - 600 - 64, y: 3072 - 777 - 64, rotation: 0 }, { x: 777 + 64, y: 3072 - 600 - 64, rotation: Math.PI / +2 }, { x: 3072 - 777 - 64, y: 600 + 64, rotation: Math.PI / -2 }, { x: 1476 + 64, y: 267 + 64, rotation: Math.PI / -2 }, { x: 3072 - 1476 - 64, y: 3072 - 267 - 64, rotation: Math.PI / 2 }, { x: 267 + 64, y: 3072 - 1476 - 64, rotation: Math.PI }, { x: 3072 - 267 - 64, y: 1476 + 64, rotation: 0 }]],
  impermeables: {
    copies: 4,
    bodies: [[32, // radius
    [1192, 382], [716, 414], [1496, 87], [1668, 441], [1670, 849], [869, 1320], [276, 1270], [1380, 681], [344, 1228], [632, 1022], [427, 1256], [728, 1150], [140, 1096], [76, 1146], [716, 1064]], [48, [1332, 585], [1021, 265], [1224, 1006], [520, 1308], [812, 1006], [536, 974]], [64, [408, 942], [856, 878], [684, 537], [1160, 274], [957, 761], [840, 1210]], [96, [491, 169], [860, 601], [1338, 409]], [128, [1540, 569]]]
  }
}, { // 0
  name: "Nautical",
  width: 3072 * 1, height: 3072 * 1,
  teams: [2],

  // first array is for the number of teams coresponding to the teams array
  // second is place in the arrangement for that number of teams
  // object is position
  spawn: [
  // [{x: 192, y: 192}, {x: 3072 - 192, y: 3072 - 192}] // 2

  [{ x: 581, y: 555, rotation: Math.PI / 2 }, { x: 3072 - 581, y: 3072 - 555, rotation: -Math.PI / 2 }, { x: 3072 - 581, y: 555, rotation: Math.PI }, { x: 581, y: 3072 - 555, rotation: 0 }], [{ x: 581, y: 555, rotation: Math.PI / 2 }, { x: 3072 - 581, y: 3072 - 555, rotation: -Math.PI / 2 }, { x: 3072 - 581, y: 555, rotation: Math.PI }, { x: 581, y: 3072 - 555, rotation: 0 }], [{ x: 581, y: 555, rotation: Math.PI / 2 }, { x: 3072 - 581, y: 3072 - 555, rotation: -Math.PI / 2 }, { x: 3072 - 581, y: 555, rotation: Math.PI }, { x: 581, y: 3072 - 555, rotation: 0 }], [{ x: 581, y: 555, rotation: Math.PI / 2 }, { x: 3072 - 581, y: 3072 - 555, rotation: -Math.PI / 2 }, { x: 3072 - 581, y: 555, rotation: Math.PI }, { x: 581, y: 3072 - 555, rotation: 0 }]],
  impermeables: {
    copies: 4,
    bodies: [[32, // radius
    [325, 764], [989, 98], [746, 898], [1054, 1308], [1179, 1260], [1514, 1308], [993, 1356], [534, 1308], [1546, 194], [1488, 130], [173, 1028], [173, 892], [470, 880], [325, 764], [667, 892]], [48, [1218, 274], [1242, 786], [618, 1260], [1139, 1340], [238, 960], [794, 818]], [64, [1084, 475], [422, 322], [914, 784], [1654, 546], [1279, 1219], [1423, 1228]], [96, [298, 539], [967, 610]], [128, [831, 411]]]
  }
},
/*{ // 1
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
},*/
{
  name: "Nebula",
  width: 3072, height: 3072,
  teams: [2],
  tint: [180, '#FFFFFF', '#000000'],

  // first array is for the number of teams coresponding to the teams array
  // second is place in the arrangement for that number of teams
  // object is position
  spawn: [
  // [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}] // 2

  [{ x: 1791, y: 160, rotation: Math.PI / 2 }, { x: 3072 - 1791, y: 3072 - 160, rotation: -Math.PI / 2 }], [{ x: 1791, y: 160, rotation: Math.PI / 2 }, { x: 3072 - 1791, y: 3072 - 160, rotation: -Math.PI / 2 }]],
  impermeables: {
    copies: 2,
    bodies: [[32, // radius
    [456, 549], [692, 1238], [787, 1367], [2013, 176], [1199, 1175], [555, 1731], [1276, 1143], [1507, 192], [1587, 224], [1443, 391], [3030, 697], [2609, 847], [1727, 920], [1911, 643], [898, 1303], [1078, 1358], [1503, 1341], [1575, 1316], [1639, 1358], [2798, 859]], [48, [898, 1207], [510, 1183], [1110, 1206], [1343, 1214], [1459, 274], [2888, 863]], [64, [1372, 1079], [1631, 845], [946, 1422], [1515, 86], [1007, 1278], [341, 660], [2166, 1047], [541, 1348], [421, 1271], [1395, 160], [992, 847], [566, 537], [2449, 560], [2936, 751], [2699, 909], [2077, 86], [1497, 811], [2417, 697], [2737, 258]], [96, [231, 304], [330, 485], [1355, 911], [276, 822], [820, 879], [1853, 845], [2045, 920], [2221, 1213], [2277, 592]], [128, [2609, 421], [385, 1037], [641, 724], [1267, 334], [1215, 613], [427, 1519], [2149, 278], [2289, 857]]]
  }
}, {
  name: "Clockwise",
  width: 2048, height: 2048,
  teams: [2],
  tint: [180, '#207272', '#000000'],

  // first array is for the number of teams coresponding to the teams array
  // second is place in the arrangement for that number of teams
  // object is position
  spawn: [
  // [{x: 192, y: 192}, {x: 1920 - 192, y: 1920 - 192}] // 2

  [{ x: 1023, y: 119, rotation: Math.PI / 2 }, { x: 2048 - 1023, y: 2048 - 119, rotation: -Math.PI / 2 }], [{ x: 1023, y: 119, rotation: Math.PI / 2 }, { x: 2048 - 1023, y: 2048 - 119, rotation: -Math.PI / 2 }]],
  impermeables: {
    copies: 2,
    bodies: [[32, // radius
    [557, 1059], [509, 1367], [1000, 876], [1077, 844], [678, 1420], [1897, 192], [1977, 224], [1162, 344], [589, 173], [1613, 398], [1367, 299], [1439, 274], [1485, 211]], [48, [589, 77], [481, 1009], [587, 1415], [911, 907], [1144, 915], [941, 372], [745, 1491]], [64, [278, 205], [541, 748], [635, 276], [1865, 86], [507, 521], [826, 661], [370, 1091], [420, 1312], [317, 1219], [1056, 320], [1266, 332], [497, 883], [1549, 302]], [96, [806, 292], [656, 617], [118, 662]]]
  }
}];

DeepSpaceGame.spawn_structure = [[{ x: 0, y: 0 }], // 1 player
[{ x: 18, y: 0 }, { x: -18, y: 0 }], // 2
[{ x: 26, y: 0 }, { x: -13, y: 22 }, { x: -13, y: -22 }], // 3
[{ x: 34, y: 0 }, { x: 0, y: 34 }, { x: -34, y: 0 }, { x: 0, y: -34 }], //4
[{ x: 34, y: 0 }, { x: 10, y: 32 }, { x: -28, y: 20 }, { x: -28, y: -20 }, { x: 10, y: -32 }], // 5
[{ x: 34, y: 0 }, { x: 17, y: 30 }, { x: -17, y: 30 }, { x: -34, y: 0 }, { x: -17, y: -30 }, { x: 17, y: -30 }] // 6
];

DeepSpaceGame.modes = {
  ctf: { // capture the flag
    ring_radius: 720,
    flag_radius: 18,
    time_limit: FRAMES.mins(3)
  }
};
//# sourceMappingURL=deepspace.js.map