'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* New */

var GameNetworkAdapter = function () {
  function GameNetworkAdapter(game, socket) {
    _classCallCheck(this, GameNetworkAdapter);

    // Adapter works off own socket
    this.game = game;
    this.socket = socket;
    this.activated = false;
    this.sendSenderID = false;

    this.incomingMessages = ['shipUpdated', 'shipOverridden', 'shipHPAdjusted', 'bulletCreated', 'bulletDestroyed', 'bubbleHPAdjusted', 'blockCreated', 'blockHPAdjusted', 'blockTeamSet', 'blockDestroyed', 'subCreated', 'subDestroyed', 'deathOccurrence', 'flagCaptured', 'flagDropped', 'flagProgress', 'playerDisconnected'];
    this.listenersMap = new Map();

    this.activate();
    // this.listen();
  }

  _createClass(GameNetworkAdapter, [{
    key: 'activate',
    value: function activate() {
      this.activated = true;
    }
  }, {
    key: 'deactivate',
    value: function deactivate() {
      this.activated = false;
    }
  }, {
    key: 'listen',
    value: function listen() {
      this.addListenerList(this.incomingMessages);
    }
  }, {
    key: 'addListenerList',
    value: function addListenerList(list) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var msg = _step.value;
          this.addListener(msg);
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
    }
  }, {
    key: 'addListener',
    value: function addListener(msg) {
      var _this = this;

      var listener = function listener(a) {
        return _this.activated ? _this.exec(msg, a) : 0;
      };

      this.listenersMap.set(msg, listener);
      this.socket.on(msg, listener);
    }
  }, {
    key: 'exec',
    value: function exec(msg, a) {
      this[msg](a);
    }
  }, {
    key: 'stopListening',
    value: function stopListening() {
      this.removeListenerList(this.incomingMessages);
    }
  }, {
    key: 'removeListenerList',
    value: function removeListenerList(list) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = list[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var msg = _step2.value;
          this.removeListener(msg);
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
    key: 'removeListener',
    value: function removeListener(msg) {
      var listener = this.listenersMap.get(msg);
      if (listener) this.socket.removeListener(msg, listener);
    }
  }, {
    key: 'emit',
    value: function emit(msg, data) {
      var sendSender = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.sendSenderID;

      if (sendSender) data.senderID = ENV.user.id;
      this.socket.emit(msg, data);
      // this.socket.emit(msg, [data, ENV.user.id])
    }

    // game functions
    // ships

  }, {
    key: 'sendShipUpdate',
    value: function sendShipUpdate(data) {
      this.emit('shipUpdated', { shipData: data }, true);
    }
  }, {
    key: 'shipUpdated',
    value: function shipUpdated(data) {
      this.game.players.get(data.senderID).ship.apply(data.shipData);
    }
  }, {
    key: 'sendShipOverride',
    value: function sendShipOverride(data) {
      this.emit('shipOverridden', { shipData: data }, true);
    }
  }, {
    key: 'shipOverridden',
    value: function shipOverridden(data) {
      this.game.players.get(data.senderID).ship.override(data.shipData);
    }
  }, {
    key: 'sendAdjustShipHP',
    value: function sendAdjustShipHP(data) {
      this.emit('shipHPAdjusted', data);
    }
  }, {
    key: 'shipHPAdjusted',
    value: function shipHPAdjusted(data) {
      this.game.adjustShipHP(data);
    }

    // bubble

  }, {
    key: 'sendAdjustBubbleHP',
    value: function sendAdjustBubbleHP(data) {
      this.emit('bubbleHPAdjusted', data);
    }
  }, {
    key: 'bubbleHPAdjusted',
    value: function bubbleHPAdjusted(data) {
      this.game.adjustBubbleHP(data);
    }

    // bullets

  }, {
    key: 'sendCreateBullet',
    value: function sendCreateBullet(data) {
      this.emit('bulletCreated', data);
    }
  }, {
    key: 'bulletCreated',
    value: function bulletCreated(data) {
      this.game.createBullet(data);
    }
  }, {
    key: 'sendDestroyBullet',
    value: function sendDestroyBullet(id) {
      this.emit('bulletDestroyed', id);
    }
  }, {
    key: 'bulletDestroyed',
    value: function bulletDestroyed(id) {
      this.game.destroyBullet(id);
    }

    // blocks

  }, {
    key: 'sendCreateBlock',
    value: function sendCreateBlock(data) {
      this.emit('blockCreated', data);
    }
  }, {
    key: 'blockCreated',
    value: function blockCreated(data) {
      this.game.createBlock(data);
    }
  }, {
    key: 'sendAdjustBlockHP',
    value: function sendAdjustBlockHP(data) {
      this.emit('blockHPAdjusted', data);
    }
  }, {
    key: 'blockHPAdjusted',
    value: function blockHPAdjusted(data) {
      this.game.adjustBlockHP(data);
    }
  }, {
    key: 'sendSetBlockTeam',
    value: function sendSetBlockTeam(data) {
      this.emit('blockTeamSet', data);
    }
  }, {
    key: 'blockTeamSet',
    value: function blockTeamSet(data) {
      this.game.setBlockTeam(data);
    }
  }, {
    key: 'sendDestroyBlock',
    value: function sendDestroyBlock(id) {
      this.emit('blockDestroyed', id);
    }
  }, {
    key: 'blockDestroyed',
    value: function blockDestroyed(id) {
      this.game.destroyBlock(id);
    }

    // subs

  }, {
    key: 'sendCreateSub',
    value: function sendCreateSub(data) {
      this.emit('subCreated', data);
    }
  }, {
    key: 'subCreated',
    value: function subCreated(data) {
      this.game.createSub(data);
    }
  }, {
    key: 'sendDestroySub',
    value: function sendDestroySub(id) {
      this.emit('subDestroyed', id);
    }
  }, {
    key: 'subDestroyed',
    value: function subDestroyed(data) {
      this.game.destroySub(data);
    }
  }, {
    key: 'playerDisconnected',
    value: function playerDisconnected(id) {
      this.game.disconnectPlayer(id);
    }

    // announcements
    // TODO rethink stats update

  }, {
    key: 'sendDeathOccurrence',
    value: function sendDeathOccurrence(data) {
      this.emit('deathOccurrence', data);
    }
  }, {
    key: 'deathOccurrence',
    value: function deathOccurrence(data) {
      this.game.deathOccurrence(data);
    }

    // mode (ctf)

  }, {
    key: 'sendCaptureFlag',
    value: function sendCaptureFlag(id) {
      this.emit('flagCaptured', id);
    }
  }, {
    key: 'flagCaptured',
    value: function flagCaptured(id) {
      this.game.captureFlag(id);
    }
  }, {
    key: 'sendDropFlag',
    value: function sendDropFlag() {
      this.emit('flagDropped');
    }
  }, {
    key: 'flagDropped',
    value: function flagDropped() {
      this.game.dropFlag();
    }
  }, {
    key: 'sendFlagProgress',
    value: function sendFlagProgress(data) {
      this.emit('flagProgress', data);
    }
  }, {
    key: 'flagProgress',
    value: function flagProgress(data) {
      this.game.flagProgress(data);
    }

    // WorkInProgress

  }, {
    key: 'end_with_winner',
    value: function end_with_winner(data) {
      var winningTeam = data.winningTeam,
          score = data.score;

      LOBBY.disableGame();
      setTimeout(function () {
        return LOBBY.showResults();
      }, 3000);
    }
  }, {
    key: 'end_game',
    value: function end_game() {
      LOBBY.disableGame();
      setTimeout(function () {
        return LOBBY.showResults();
      }, 3000);
    }
  }, {
    key: 'request_local_progress',
    value: function request_local_progress() {
      this.send_local_progress();
    }
  }, {
    key: 'send_local_progress',
    value: function send_local_progress() {
      if (!ENV.spectate) {
        var game = ENV.game,
            team_number = game.player.team.number,
            team_score = game.game.scores[team_number];
        if (ENV.game.game.flag.holderID == ENV["id"]) ENV.lobby.socket.emit('flag progress', { senderID: ENV["id"], team: team_number, score: team_score });
      }
    }
  }, {
    key: 'go_overtime',
    value: function go_overtime() {
      ENV.game.takeOvertime();
    }
  }, {
    key: 'progress',
    value: function progress(team, score) {
      ENV.lobby.socket.emit('flag progress', { senderID: ENV["id"], team: team, score: score });
    }
  }, {
    key: 'out_game_over',
    value: function out_game_over(winningTeam) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.lobby.socket.emit('game over', { senderID: ENV["id"], winningTeam: winningTeam });
    }
  }, {
    key: 'in_game_over',
    value: function in_game_over(data) {
      if (!DeepSpaceGame.runningInstance) return;
      LOBBY.disableGame();
      setTimeout(this.in_game_over_ready, 3000);
    }
  }, {
    key: 'in_game_over_ready',
    value: function in_game_over_ready() {
      if (!DeepSpaceGame.runningInstance) return;
      LOBBY.showResults();
    }
  }, {
    key: 'in_game_overtime',
    value: function in_game_overtime() {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.takeOvertime();
      setTimeout(LOBBY.disableGame, TIME.sec(30));
    }

    // disconnect players

  }, {
    key: 'in_disconnect_player',
    value: function in_disconnect_player(userid) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.disconnectPlayer(userid);
    }
  }]);

  return GameNetworkAdapter;
}();

/* OLD */

var g;

var NetworkHelper = function () {
  function NetworkHelper() {
    _classCallCheck(this, NetworkHelper);
  }

  _createClass(NetworkHelper, null, [{
    key: 'out_input_stack',
    value: function out_input_stack(arr) {
      socket.emit('input stack', { senderID: ENV.id, stack: arr });
    }
  }, {
    key: 'in_input_stack',
    value: function in_input_stack(data) {
      var p = ENV.game.players.get(data.senderID);
      if (p) p.input = data.stack;
    }
  }, {
    key: 'out_ship_update',
    value: function out_ship_update(data) {
      if (!DeepSpaceGame.runningInstance) return;
      socket.emit('ship update', { senderID: ENV["id"], shipData: data });
    }
  }, {
    key: 'in_ship_update',
    value: function in_ship_update(data) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.players.get(data.senderID).ship.apply(data.shipData);
    }
  }, {
    key: 'out_ship_override',
    value: function out_ship_override(data) {
      if (!DeepSpaceGame.runningInstance) return;
      socket.emit('ship override', { senderID: ENV["id"], shipData: data });
    }
  }, {
    key: 'in_ship_override',
    value: function in_ship_override(data) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.players.get(data.senderID).ship.override(data.shipData);
    }
  }, {
    key: 'sendShip',
    value: function sendShip(shipModel) {
      if (!DeepSpaceGame.runningInstance) return;
      // if(Math.flipCoin(0.8)) return;
      socket.emit('ship update', { senderID: ENV["id"], shipData: shipModel.export() });
    }
  }, {
    key: 'setShip',
    value: function setShip(data) {
      if (!DeepSpaceGame.runningInstance) return;
      var shipModel = data.shipData;
      ENV.game.players.get(data.senderID).ship.update(shipModel);
    }
  }, {
    key: 'bullet_create',
    value: function bullet_create(ship) {
      if (!DeepSpaceGame.runningInstance) return;
      // let angle = options.shoot_simple ? ship.angle : ship.shoot_angle,
      //     shoot_position = options.shoot_simple ? ship.front_weapon_position : ship.shoot_position;
      var id = Math.uuid(),
          data = {
        id: id,
        creator: ship.owner.id,
        team: ship.owner.team.number,
        position: ship.shoot_position,
        angle: ship.shoot_angle + ship.ATTACK_SPREAD / 2 * (Math.random() * 2 - 1),
        radius: ship.ATTACK_RADIUS,
        hp: ship.ATTACK_HP,
        lifespan: ship.ATTACK_LIFESPAN,
        velocity: ship.velocity,
        speed: ship.ATTACK_SPEED
      };
      socket.emit('bullet create', { senderID: ENV["id"], bulletData: data });
      ENV.game.startBullet(data);
      return id;
    }
    // static out_bullet_create(ship) { if(!DeepSpaceGame.runningInstance) return;
    //   var id = Math.uuid();
    //   socket.emit('bullet create', { senderID: ENV["id"], bulletData: {
    //     id: id,
    //     team: ship.owner.team.number,
    //     position: ship.front_weapon_position,
    //     angle: ship.angle + (ship.ATTACK_SPREAD / 2) * ((Math.random()*2) - 1),
    //     hp: ship.ATTACK,
    //     lifespan: ship.ATTACK_LIFESPAN
    //   }});
    //   return id;
    // }

  }, {
    key: 'in_bullet_create',
    value: function in_bullet_create(data) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.startBullet(data.bulletData);
    }
  }, {
    key: 'bullet_destroy',
    value: function bullet_destroy(bulletID) {
      if (!DeepSpaceGame.runningInstance) return;
      socket.emit('bullet destroy', { senderID: ENV["id"], bulletID: bulletID });
      ENV.game.removeBullet(bulletID);
    }
    // static out_bullet_destroy(bulletID) { if(!DeepSpaceGame.runningInstance) return;
    //   socket.emit('bullet destroy', { senderID: ENV["id"], bulletID: bulletID });
    // }

  }, {
    key: 'in_bullet_destroy',
    value: function in_bullet_destroy(data) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.removeBullet(data.bulletID);
    }

    // ask server(other players) first for effect
    // TODO break up as: ask_to_damage, perform_damage. in/out as needed

  }, {
    key: 'out_ship_damage',
    value: function out_ship_damage(playerID, hp) {
      if (!DeepSpaceGame.runningInstance) return;
      socket.emit('ship damage', { senderID: ENV["id"], playerID: playerID, hp: hp });
    }
  }, {
    key: 'in_ship_damage',
    value: function in_ship_damage(data) {
      if (!DeepSpaceGame.runningInstance) return;
      if (localIDMatches(data.playerID)) {
        var ship = ENV.game.players.get(data.playerID).ship;
        if (ship.damage(data.hp)) NetworkHelper.out_msg_ship_kill(ship.owner.id, data.senderID);
      }
    }
  }, {
    key: 'out_msg_ship_kill',
    value: function out_msg_ship_kill(takerID, giverID) {
      if (!DeepSpaceGame.runningInstance) return;
      socket.emit('msg ship kill', { senderID: ENV["id"], takerID: takerID, giverID: giverID });
    }
  }, {
    key: 'in_msg_ship_kill',
    value: function in_msg_ship_kill(data) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.msgShipKill(data.takerID, data.giverID);
    }
  }, {
    key: 'block_create',
    value: function block_create(ship) {
      if (!DeepSpaceGame.runningInstance) return;
      var id = Math.uuid();
      var send_data = { senderID: ENV["id"], blockData: {
          id: id,
          team: ship.owner.team.number,
          position: ship.front_weapon_position,
          angle: ship.angle + ship.BLOCK_SPREAD / 2 * (Math.random() * 2 - 1),
          hp: ship.BLOCK_HP_CAPACITY,
          // radius: Math.randomIntMinMax(Block.stats.MIN_RADIUS, Block.stats.MAX_RADIUS)
          radius: Block.stats.MAX_RADIUS,
          speed: Math.randomIntMinMax(Block.stats.MIN_SPEED, Block.stats.MAX_SPEED)
        } };
      socket.emit('block create', send_data);
      NetworkHelper.in_block_create(send_data);
      return id;
    }
  }, {
    key: 'in_block_create',
    value: function in_block_create(data) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.startBlock(data.blockData);
    }
  }, {
    key: 'block_destroy',
    value: function block_destroy(blockID) {
      if (!DeepSpaceGame.runningInstance) return;
      var send_data = { senderID: ENV["id"], blockID: blockID };
      socket.emit('block destroy', send_data);
      NetworkHelper.in_block_destroy(send_data);
    }
  }, {
    key: 'in_block_destroy',
    value: function in_block_destroy(data) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.endBlock(data.blockID);
    }
  }, {
    key: 'block_damage',
    value: function block_damage(blockID, hp) {
      if (!DeepSpaceGame.runningInstance) return;
      var send_data = { senderID: ENV["id"], blockID: blockID, hp: hp };
      socket.emit('block damage', send_data);
      NetworkHelper.in_block_damage(send_data);
    }
  }, {
    key: 'in_block_damage',
    value: function in_block_damage(data) {
      if (!DeepSpaceGame.runningInstance) return;
      var block;
      if (block = ENV.game.model.blocks.get(data.blockID)) block.damage(data.hp);
    }
  }, {
    key: 'block_change',
    value: function block_change(blockID) {
      if (!DeepSpaceGame.runningInstance) return;
      var send_data = { senderID: ENV["id"], blockID: blockID };
      socket.emit('block change', send_data);
      NetworkHelper.in_block_change(send_data);

      // var block, sender;
      // if(block = ENV.game.model.blocks.get(blockID)) if(sender = ENV.game.players.get(ENV["id"])) ENV.game.changeBlock(block.id, sender.team.number);
    }
  }, {
    key: 'in_block_change',
    value: function in_block_change(data) {
      if (!DeepSpaceGame.runningInstance) return;
      var block, sender;
      if (block = ENV.game.model.blocks.get(data.blockID)) if (sender = ENV.game.players.get(data.senderID)) ENV.game.changeBlock(block.id, sender.team.number);
    }

    // static out_pulse_create(ship) { if(!DeepSpaceGame.runningInstance) return;
    //   var id = Math.uuid();
    //   socket.emit('pulse create', { senderID: ENV["id"], pulseData: {
    //     id: id,
    //     team: ship.owner.team.number,
    //     position: ship.front_weapon_position,
    //     angle: ship.angle
    //   }});
    //   return id;
    // }

  }, {
    key: 'sub_create',
    value: function sub_create(ship) {
      if (!DeepSpaceGame.runningInstance) return;
      var id = Math.uuid();
      var send_data = { senderID: ENV["id"], subData: {
          id: id,
          type: ship.SUB_TYPE,
          team: ship.owner.team.number,
          player: ENV["id"],
          position: ship.front_weapon_position,
          angle: ship.angle
        } };
      socket.emit('sub create', send_data);
      NetworkHelper.in_sub_create(send_data);
      return id;
    }
  }, {
    key: 'in_sub_create',
    value: function in_sub_create(data) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.startSub(data.subData);
    }
  }, {
    key: 'sub_destroy',
    value: function sub_destroy(subID) {
      if (!DeepSpaceGame.runningInstance) return;
      var send_data = { senderID: ENV["id"], subID: subID };
      socket.emit('sub destroy', send_data);
      NetworkHelper.in_sub_destroy(send_data);
    }
  }, {
    key: 'out_only_sub_destroy',
    value: function out_only_sub_destroy(subID) {
      if (!DeepSpaceGame.runningInstance) return;
      var send_data = { senderID: ENV["id"], subID: subID };
      socket.emit('sub destroy', send_data);
    }
  }, {
    key: 'in_sub_destroy',
    value: function in_sub_destroy(data) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.endSub(data.subID);
    }

    // ctf

  }, {
    key: 'out_flag_pickup',
    value: function out_flag_pickup(playerID) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.lobby.socket.emit('flag pickup', { senderID: ENV["id"], playerID: playerID });
    }
  }, {
    key: 'in_flag_pickup',
    value: function in_flag_pickup(data) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.pickupFlag(data.playerID);
    }
  }, {
    key: 'out_flag_drop',
    value: function out_flag_drop() {
      if (!DeepSpaceGame.runningInstance) return;
      if (ENV.spectate) {
        console.warn('illegal spectator command');return;
      }
      ENV.lobby.socket.emit('flag drop', { senderID: ENV["id"] });
    }
  }, {
    key: 'in_flag_drop',
    value: function in_flag_drop(data) {
      if (!DeepSpaceGame.runningInstance) return;
      if (!ENV.spectate) {
        var game = ENV.game,
            team_number = game.player.team.number,
            team_score = game.game.scores[team_number];
        if (ENV.game.game.flag.holderID == ENV["id"]) {
          if (false && ENV.game.game.overtime) {
            // always false
            NetworkHelper.out_game_over(team_number);
          } else {
            ENV.lobby.socket.emit('flag progress confirm', { senderID: ENV["id"], team: team_number, score: team_score });
          }
        }
      }
      if (!ENV.game.game.disabled) ENV.game.dropFlag();
    }

    /*
     * --- Game Management ---
     *
     * end_with_winner (IN)
     *   - ends the game with given winner and score
     *
     * progress
     * :: request_local_progress (IN)
     *   - server requests progress. (usually responded with NetworkHelper.send_local_progress)
     * :: send_local_progress (OUT)
     *   - sends local player's team's progress(team, score)
     *
     * go_overtime (IN)
     *   - tells the game to switch into overtime
     *
     */

  }, {
    key: 'end_with_winner',
    value: function end_with_winner(data) {
      var winningTeam = data.winningTeam,
          score = data.score;

      LOBBY.disableGame();
      setTimeout(function () {
        return LOBBY.showResults();
      }, 3000);
    }
  }, {
    key: 'end_game',
    value: function end_game() {
      LOBBY.disableGame();
      setTimeout(function () {
        return LOBBY.showResults();
      }, 3000);
    }
  }, {
    key: 'request_local_progress',
    value: function request_local_progress() {
      NetworkHelper.send_local_progress();
    }
  }, {
    key: 'send_local_progress',
    value: function send_local_progress() {
      if (!ENV.spectate) {
        var game = ENV.game,
            team_number = game.player.team.number,
            team_score = game.game.scores[team_number];
        if (ENV.game.game.flag.holderID == ENV["id"]) ENV.lobby.socket.emit('flag progress', { senderID: ENV["id"], team: team_number, score: team_score });
      }
    }
  }, {
    key: 'go_overtime',
    value: function go_overtime() {
      ENV.game.takeOvertime();
    }
  }, {
    key: 'progress',
    value: function progress(team, score) {
      ENV.lobby.socket.emit('flag progress', { senderID: ENV["id"], team: team, score: score });
    }
  }, {
    key: 'out_game_over',
    value: function out_game_over(winningTeam) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.lobby.socket.emit('game over', { senderID: ENV["id"], winningTeam: winningTeam });
    }
  }, {
    key: 'in_game_over',
    value: function in_game_over(data) {
      if (!DeepSpaceGame.runningInstance) return;
      LOBBY.disableGame();
      setTimeout(NetworkHelper.in_game_over_ready, 3000);
    }
  }, {
    key: 'in_game_over_ready',
    value: function in_game_over_ready() {
      if (!DeepSpaceGame.runningInstance) return;
      LOBBY.showResults();
    }
  }, {
    key: 'in_game_overtime',
    value: function in_game_overtime() {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.takeOvertime();
      setTimeout(LOBBY.disableGame, TIME.sec(30));
    }

    // disconnect players

  }, {
    key: 'in_disconnect_player',
    value: function in_disconnect_player(userid) {
      if (!DeepSpaceGame.runningInstance) return;
      ENV.game.disconnectPlayer(userid);
    }

    /*static add() { // static no longer works as network helper now holds state
     NetworkHelper.messages.push(new Array(...arguments));
     }
      static release() { // static no longer works as network helper now holds state
     socket.emit('combined', NetworkHelper.messages); NetworkHelper.messages = [];
     }*/

  }]);

  return NetworkHelper;
}();
// NetworkHelper.messages = [];