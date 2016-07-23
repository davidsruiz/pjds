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
  }

  setupView() {
    this.setupCanvas();
    this.setupPalette();
    this.setupViewObjects();
  }

  setupCanvas() { // (revise)
    var canvas = $('#canvas')[0];
    canvas.width = 480;
    canvas.height = 320;

    var stage = new createjs.Stage();
    stage.canvas = canvas;

    this.view = stage;
  }

  setupPalette() {
    this.colors = this.setupData.colors;
  }

  setupViewObjects() {
    this.setupMap();
    this.setupShipViewObjects();
    this.setupParticles();
  }

  setupMap() {
    var canvas = this.view.canvas, background = new createjs.Shape();
    background.graphics.beginFill('#455A64').drawRect(0, 0, canvas.width, canvas.height);
    this.view.addChild(background);
  }

  setupShipViewObjects() {
    var shipView = this.ships.heavy.view = new createjs.Shape();
    shipView.graphics.setStrokeStyle(4,"miter").beginStroke(this.ships.heavy.owner.team.color).moveTo(10, 0).lineTo(-10, -10).lineTo(-10, 10).lineTo(10, 0).lineTo(-10, -10);
    this.view.addChild(shipView);
  }

  setupParticles() {}

  setupModel() {
    this.setupTeams();
    this.setupPlayers();
    this.setupShips();
  }

  setupTeams() {
    this.teams = [];
    var teamCount = this.setupData.teams;
    teamCount.times((i) => { this.teams.push(new Team(this, i)) });
  }

  setupPlayers() {
    this.players = [];
    this.teams.forEach((team, i) => {
      this.setupData.players.filter((e) => e.team == i).forEach((player) => {
        var {name, type, id} = player;
        team.createPlayer(id, name, type);
      });
    });
  }

  setupShips() {
    this.ships = {heavy: null, light: []}
    this.players.forEach((player) => {
      var ship;
      if( localIDMatches(player.id) ) {
        ship = new Ship(player);
        this.ships.heavy = ship;
      } else {
        ship = new BasicShip(player);
        this.ships.light.push(ship);
      }
      player.ship = ship;
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
    // this closure has access to the playerInput variable.. the alias for this.ships.heavy.owner.input
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
    this.ships.heavy.owner.input = playerInput;
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
  }

  updateShip() {
    var ship;
    if(ship = this.ships.heavy) {
      if(ship.disabled) return;

      var input = ship.owner.input;

      ship.acceleration.length = ship.LINEAR_ACCELERATION_LIMIT * input.get('forward');
      ship.acceleration.angle = ship.angle;

      ship.angular_acceleration = ship.ANGULAR_ACCELERATION_LIMIT * input.get('turn');

      // if(input.get('shoot')) ship.shoot();
      // if(input.get('block')) ship.block();

      ship.update();

      // validate new position (revise)
      if(ship.position.x < 0) ship.position.x = this.view.canvas.width;
      if(ship.position.y < 0) ship.position.y = this.view.canvas.height;
      if(ship.position.x > this.view.canvas.width) ship.position.x = 0;
      if(ship.position.y > this.view.canvas.height) ship.position.y = 0;
    }
  }

  checkForCollisions() {}

  draw() {
    this.drawShip();

    this.view.update();
  }

  drawShip() {
    var ship = this.ships.heavy;

    // if(!ship.disabled && Math.flipCoin(0.92)) { // randomization for 'flicker effect'

      // var shipDrawing = new createjs.Shape();
      // ship.player.team.color
      // shipDrawing.graphics.beginStroke('#FFFFFF').moveTo(10, 0).lineTo(-10, -10).lineTo(-10, 10).lineTo(10, 0);

      ship.view.x = ship.position.x;
      ship.view.y = ship.position.y;

      ship.view.rotation = Math.degrees(ship.angle);

      // this.view.addChild(shipDrawing)
    // }

  }

  log() {
    // var input = this.ships.heavy.owner.input;
    var ship = this.ships.heavy;
    // $('#log').text(`forward: ${input.get('forward')}, turn: ${input.get('turn')}, shoot: ${input.get('shoot')}, block: ${input.get('block')}, `)
    $('#log').text(
`    x: ${ship.position.x.round(2)}
    y: ${ship.position.y.round(2)}
angle: ${ship.angle.round(2)}`
    );
  }


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
