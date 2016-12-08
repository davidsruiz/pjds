var g;
class NetworkHelper {

  static out_ship_update(data) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('ship update', { senderID: ENV["id"], shipData: data });
  }
  static in_ship_update(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].players.get(data.senderID).ship.apply(data.shipData);
  }
  static out_ship_override(data) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('ship override', { senderID: ENV["id"], shipData: data });
  }
  static in_ship_override(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].players.get(data.senderID).ship.override(data.shipData);
  }
  static sendShip(shipModel) { if(!DeepSpaceGame.runningInstance) return;
    // if(Math.flipCoin(0.8)) return;
    socket.emit('ship update', { senderID: ENV["id"], shipData: shipModel.export() });
  }
  static setShip(data) { if(!DeepSpaceGame.runningInstance) return;
    var shipModel = data.shipData;
    ENV["game"].players.get(data.senderID).ship.update(shipModel);
  }

  static bullet_create(ship) { if(!DeepSpaceGame.runningInstance) return;
    var id = Math.uuid();
    var data = {
      id: id,
      team: ship.owner.team.number,
      position: ship.shoot_position,
      angle: ship.shoot_angle + (ship.SHOT_SPREAD / 2) * ((Math.random()*2) - 1),
      radius: ship.SHOT_RADIUS,
      hp: ship.ATTACK,
      lifespan: ship.ATTACK_LIFESPAN
    }
    socket.emit('bullet create', { senderID: ENV["id"], bulletData: data});
    ENV["game"].startBullet(data);
    return id;
  }
  // static out_bullet_create(ship) { if(!DeepSpaceGame.runningInstance) return;
  //   var id = Math.uuid();
  //   socket.emit('bullet create', { senderID: ENV["id"], bulletData: {
  //     id: id,
  //     team: ship.owner.team.number,
  //     position: ship.front_weapon_position,
  //     angle: ship.angle + (ship.SHOT_SPREAD / 2) * ((Math.random()*2) - 1),
  //     hp: ship.ATTACK,
  //     lifespan: ship.ATTACK_LIFESPAN
  //   }});
  //   return id;
  // }
  static in_bullet_create(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].startBullet(data.bulletData);
  }
  static bullet_destroy(bulletID) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('bullet destroy', { senderID: ENV["id"], bulletID: bulletID });
    ENV["game"].endBullet(bulletID);
  }
  // static out_bullet_destroy(bulletID) { if(!DeepSpaceGame.runningInstance) return;
  //   socket.emit('bullet destroy', { senderID: ENV["id"], bulletID: bulletID });
  // }
  static in_bullet_destroy(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].endBullet(data.bulletID);
  }

  // ask server(other players) first for effect
  // TODO break up as: ask_to_damage, perform_damage. in/out as needed
  static out_ship_damage(playerID, hp) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('ship damage', { senderID: ENV["id"], playerID: playerID, hp: hp});
  }
  static in_ship_damage(data) { if(!DeepSpaceGame.runningInstance) return;
    if(localIDMatches(data.playerID)) {
      var ship = ENV["game"].players.get(data.playerID).ship;
      if(ship.damage(data.hp)) NetworkHelper.out_msg_ship_kill(ship.owner.id, data.senderID);
    }
  }

  static out_msg_ship_kill(takerID, giverID) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('msg ship kill', { senderID: ENV["id"], takerID: takerID, giverID: giverID});
  }

  static in_msg_ship_kill(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].msgShipKill(data.takerID, data.giverID);
  }


  static block_create(ship) { if(!DeepSpaceGame.runningInstance) return;
    var id = Math.uuid();
    var send_data = { senderID: ENV["id"], blockData: {
      id: id,
      team: ship.owner.team.number,
      position: ship.back_weapon_position,
      angle: (ship.angle - Math.PI) + (ship.BLOCK_SPREAD / 2) * ((Math.random()*2) - 1),
      hp: ship.BLOCK_HP_CAPACITY,
      radius: Math.randomIntMinMax(Block.stats.MIN_RADIUS, Block.stats.MAX_RADIUS)
    }};
    socket.emit('block create', send_data);
    NetworkHelper.in_block_create(send_data);
    return id;
  }
  static in_block_create(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].startBlock(data.blockData);
  }
  static block_destroy(blockID) { if(!DeepSpaceGame.runningInstance) return;
    var send_data = { senderID: ENV["id"], blockID: blockID };
    socket.emit('block destroy', send_data);
    NetworkHelper.in_block_destroy(send_data);
  }
  static in_block_destroy(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].endBlock(data.blockID);
  }
  static block_damage(blockID, hp) { if(!DeepSpaceGame.runningInstance) return;
    var send_data = { senderID: ENV["id"], blockID: blockID, hp: hp};
    socket.emit('block damage', send_data);
    NetworkHelper.in_block_damage(send_data);
  }
  static in_block_damage(data) { if(!DeepSpaceGame.runningInstance) return;
    var block;
    if(block = ENV["game"].model.blocks.get(data.blockID)) block.damage(data.hp);
  }
  static block_change(blockID) { if(!DeepSpaceGame.runningInstance) return;
    var send_data = { senderID: ENV["id"], blockID: blockID};
    socket.emit('block change', send_data);
    NetworkHelper.in_block_change(send_data);

    // var block, sender;
    // if(block = ENV["game"].model.blocks.get(blockID)) if(sender = ENV["game"].players.get(ENV["id"])) ENV["game"].changeBlock(block.id, sender.team.number);
  }
  static in_block_change(data) { if(!DeepSpaceGame.runningInstance) return;
    var block, sender;
    if(block = ENV["game"].model.blocks.get(data.blockID)) if(sender = ENV["game"].players.get(data.senderID)) ENV["game"].changeBlock(block.id, sender.team.number);
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
    ENV["game"].startSub(data.subData);
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
    ENV["game"].endSub(data.subID);
  }

  // ctf
  static out_flag_pickup(playerID) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('flag pickup', { senderID: ENV["id"], playerID: playerID });
  }
  static in_flag_pickup(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].pickupFlag(data.playerID);
  }
  static out_flag_drop() { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('flag drop', { senderID: ENV["id"] });
  }
  static in_flag_drop(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].dropFlag();
  }

  // game end
  static out_game_over(winningTeam) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('game over', { senderID: ENV["id"], winningTeam: winningTeam });
  }

  static in_game_over(data) { if(!DeepSpaceGame.runningInstance) return;
    var g = ENV["game"];
    g.game.winningTeam = data.winningTeam; g.end();
    LOBBY.showResults([g.game, g.teams]);
  }

  // disconnect players
  static in_disconnect_player(userid) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].disconnectPlayer(userid);
  }

}
