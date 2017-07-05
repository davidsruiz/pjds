var g;
class NetworkHelper {

  static out_input_stack(arr) {
    socket.emit('input stack', { senderID: ENV.id, stack: arr });
  }

  static in_input_stack(data) {
    let p = ENV.game.players.get(data.senderID);
    if(p) p.input = data.stack;
  }

  static out_ship_update(data) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('ship update', { senderID: ENV["id"], shipData: data });
  }
  static in_ship_update(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.players.get(data.senderID).ship.apply(data.shipData);
  }
  static out_ship_override(data) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('ship override', { senderID: ENV["id"], shipData: data });
  }
  static in_ship_override(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.players.get(data.senderID).ship.override(data.shipData);
  }
  static sendShip(shipModel) { if(!DeepSpaceGame.runningInstance) return;
    // if(Math.flipCoin(0.8)) return;
    socket.emit('ship update', { senderID: ENV["id"], shipData: shipModel.export() });
  }
  static setShip(data) { if(!DeepSpaceGame.runningInstance) return;
    var shipModel = data.shipData;
    ENV.game.players.get(data.senderID).ship.update(shipModel);
  }

  static bullet_create(ship) { if(!DeepSpaceGame.runningInstance) return;
    // let angle = options.shoot_simple ? ship.angle : ship.shoot_angle,
    //     shoot_position = options.shoot_simple ? ship.front_weapon_position : ship.shoot_position;
    let id = Math.uuid(),
        data = {
          id: id,
          creator: ship.owner.id,
          team: ship.owner.team.number,
          position: ship.shoot_position,
          angle: ship.shoot_angle + (ship.ATTACK_SPREAD / 2) * ((Math.random()*2) - 1),
          radius: ship.ATTACK_RADIUS,
          hp: ship.ATTACK_HP,
          lifespan: ship.ATTACK_LIFESPAN,
          velocity: ship.velocity,
          speed: ship.ATTACK_SPEED
        };
    socket.emit('bullet create', { senderID: ENV["id"], bulletData: data});
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
  static in_bullet_create(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.startBullet(data.bulletData);
  }
  static bullet_destroy(bulletID) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('bullet destroy', { senderID: ENV["id"], bulletID: bulletID });
    ENV.game.endBullet(bulletID);
  }
  // static out_bullet_destroy(bulletID) { if(!DeepSpaceGame.runningInstance) return;
  //   socket.emit('bullet destroy', { senderID: ENV["id"], bulletID: bulletID });
  // }
  static in_bullet_destroy(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.endBullet(data.bulletID);
  }

  // ask server(other players) first for effect
  // TODO break up as: ask_to_damage, perform_damage. in/out as needed
  static out_ship_damage(playerID, hp) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('ship damage', { senderID: ENV["id"], playerID: playerID, hp: hp});
  }
  static in_ship_damage(data) { if(!DeepSpaceGame.runningInstance) return;
    if(localIDMatches(data.playerID)) {
      var ship = ENV.game.players.get(data.playerID).ship;
      if(ship.damage(data.hp)) NetworkHelper.out_msg_ship_kill(ship.owner.id, data.senderID);
    }
  }

  static out_msg_ship_kill(takerID, giverID) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('msg ship kill', { senderID: ENV["id"], takerID: takerID, giverID: giverID});
  }

  static in_msg_ship_kill(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.msgShipKill(data.takerID, data.giverID);
  }


  static block_create(ship) { if(!DeepSpaceGame.runningInstance) return;
    var id = Math.uuid();
    var send_data = { senderID: ENV["id"], blockData: {
      id: id,
      team: ship.owner.team.number,
      position: ship.front_weapon_position,
      angle: (ship.angle) + ((ship.BLOCK_SPREAD / 2) * ((Math.random()*2) - 1)),
      hp: ship.BLOCK_HP_CAPACITY,
      // radius: Math.randomIntMinMax(Block.stats.MIN_RADIUS, Block.stats.MAX_RADIUS)
      radius: Block.stats.MAX_RADIUS,
      speed: Math.randomIntMinMax(Block.stats.MIN_SPEED, Block.stats.MAX_SPEED)
    }};
    socket.emit('block create', send_data);
    NetworkHelper.in_block_create(send_data);
    return id;
  }
  static in_block_create(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.startBlock(data.blockData);
  }
  static block_destroy(blockID) { if(!DeepSpaceGame.runningInstance) return;
    var send_data = { senderID: ENV["id"], blockID: blockID };
    socket.emit('block destroy', send_data);
    NetworkHelper.in_block_destroy(send_data);
  }
  static in_block_destroy(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.endBlock(data.blockID);
  }
  static block_damage(blockID, hp) { if(!DeepSpaceGame.runningInstance) return;
    var send_data = { senderID: ENV["id"], blockID: blockID, hp: hp};
    socket.emit('block damage', send_data);
    NetworkHelper.in_block_damage(send_data);
  }
  static in_block_damage(data) { if(!DeepSpaceGame.runningInstance) return;
    var block;
    if(block = ENV.game.model.blocks.get(data.blockID)) block.damage(data.hp);
  }
  static block_change(blockID) { if(!DeepSpaceGame.runningInstance) return;
    var send_data = { senderID: ENV["id"], blockID: blockID};
    socket.emit('block change', send_data);
    NetworkHelper.in_block_change(send_data);

    // var block, sender;
    // if(block = ENV.game.model.blocks.get(blockID)) if(sender = ENV.game.players.get(ENV["id"])) ENV.game.changeBlock(block.id, sender.team.number);
  }
  static in_block_change(data) { if(!DeepSpaceGame.runningInstance) return;
    var block, sender;
    if(block = ENV.game.model.blocks.get(data.blockID)) if(sender = ENV.game.players.get(data.senderID)) ENV.game.changeBlock(block.id, sender.team.number);
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

  static sub_create(ship) { if(!DeepSpaceGame.runningInstance) return;
    var id = Math.uuid();
    var send_data = { senderID: ENV["id"], subData: {
      id: id,
      type: ship.SUB_TYPE,
      team: ship.owner.team.number,
      player: ENV["id"],
      position: ship.front_weapon_position,
      angle: ship.angle
    }};
    socket.emit('sub create', send_data);
    NetworkHelper.in_sub_create(send_data);
    return id;
  }
  static in_sub_create(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.startSub(data.subData);
  }
  static sub_destroy(subID) { if(!DeepSpaceGame.runningInstance) return;
    var send_data = { senderID: ENV["id"], subID: subID };
    socket.emit('sub destroy', send_data);
    NetworkHelper.in_sub_destroy(send_data);
  }
  static out_only_sub_destroy(subID) { if(!DeepSpaceGame.runningInstance) return;
    var send_data = { senderID: ENV["id"], subID: subID };
    socket.emit('sub destroy', send_data);
  }
  static in_sub_destroy(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.endSub(data.subID);
  }

  // ctf
  static out_flag_pickup(playerID) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('flag pickup', { senderID: ENV["id"], playerID: playerID });
  }
  static in_flag_pickup(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.pickupFlag(data.playerID);
  }
  static out_flag_drop() { if(!DeepSpaceGame.runningInstance) return;
    if(ENV.spectate) { console.warn(`illegal spectator command`); return; }
    socket.emit('flag drop', { senderID: ENV["id"] });
  }
  static in_flag_drop(data) { if(!DeepSpaceGame.runningInstance) return;
    if(!ENV.spectate) {
      let game = ENV.game, team_number = game.player.team.number, team_score = game.game.scores[team_number];
      if(ENV.game.game.flag.holderID == ENV["id"]) {
        if(false && ENV.game.game.overtime) { // always false
          NetworkHelper.out_game_over(team_number);
        } else {
          socket.emit('flag progress confirm', { senderID: ENV["id"], team: team_number, score: team_score });
        }
      }
    }
    if(!ENV.game.game.disabled) ENV.game.dropFlag();

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

  static end_with_winner(data) {
    let {winningTeam, score} = data;
    LOBBY.disableGame();
    setTimeout(() => LOBBY.showResults(), 3000);
  }

  static end_game() {
    LOBBY.disableGame();
    setTimeout(() => LOBBY.showResults(), 3000);
  }

  static request_local_progress() {
    NetworkHelper.send_local_progress();
  }

  static send_local_progress() {
    if(!ENV.spectate) {
      let game = ENV.game, team_number = game.player.team.number, team_score = game.game.scores[team_number];
      if(ENV.game.game.flag.holderID == ENV["id"]) socket.emit('flag progress', { senderID: ENV["id"], team: team_number, score: team_score });
    }
  }

  static go_overtime() {
    ENV.game.takeOvertime();
  }


  static progress(team, score) { socket.emit('flag progress', { senderID: ENV["id"], team: team, score: score }) }

  static out_game_over(winningTeam) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('game over', { senderID: ENV["id"], winningTeam: winningTeam });
  }
  static in_game_over(data) { if(!DeepSpaceGame.runningInstance) return;
    LOBBY.disableGame();
    setTimeout(NetworkHelper.in_game_over_ready, 3000);
  }
  static in_game_over_ready() { if(!DeepSpaceGame.runningInstance) return;
    LOBBY.showResults();
  }

  static in_game_overtime() { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.takeOvertime();
    setTimeout(LOBBY.disableGame, TIME.sec(30));
  }

  // disconnect players
  static in_disconnect_player(userid) { if(!DeepSpaceGame.runningInstance) return;
    ENV.game.disconnectPlayer(userid);
  }


  /*static add() { // static no longer works as network helper now holds state
    NetworkHelper.messages.push(new Array(...arguments));
  }

  static release() { // static no longer works as network helper now holds state
    socket.emit('combined', NetworkHelper.messages); NetworkHelper.messages = [];
  }*/

}
// NetworkHelper.messages = [];