var g;
class NetworkHelper {
  static sendShip(shipModel) { if(!DeepSpaceGame.runningInstance) return;
    // if(Math.flipCoin(0.8)) return;
    socket.emit('ship update', { senderID: ENV["id"], shipData: shipModel.export() });
  }
  static setShip(data) { if(!DeepSpaceGame.runningInstance) return;
    var shipModel = data.shipData;
    ENV["game"].players.get(data.senderID).ship.update(shipModel);
  }

  static out_bullet_create(ship) { if(!DeepSpaceGame.runningInstance) return;
    var id = Math.uuid();
    var data = { senderID: ENV["id"], bulletData: {
      id: id,
      team: ship.owner.team.number,
      position: ship.front_weapon_position,
      angle: ship.angle + (ship.SHOT_SPREAD / 2) * ((Math.random()*2) - 1),
      hp: ship.ATTACK,
      lifespan: ship.ATTACK_LIFESPAN
    }}
    socket.emit('bullet create', data);
    ENV["game"].startBullet(data.bulletData);
    return id;
  }
  static in_bullet_create(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].startBullet(data.bulletData);
  }
  static out_bullet_destroy(bulletID) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('bullet destroy', { senderID: ENV["id"], bulletID: bulletID });
    ENV["game"].endBullet(bulletID);
  }
  static in_bullet_destroy(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].endBullet(data.bulletID);
  }

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


  static out_block_create(ship) { if(!DeepSpaceGame.runningInstance) return;
    var id = Math.uuid();
    socket.emit('block create', { senderID: ENV["id"], blockData: {
      id: id,
      team: ship.owner.team.number,
      position: ship.back_weapon_position,
      angle: (ship.angle - Math.PI) + (ship.BLOCK_SPREAD / 2) * ((Math.random()*2) - 1),
      hp: ship.BLOCK_HP_CAPACITY,
      radius: Math.randomIntMinMax(Block.stats.MIN_RADIUS, Block.stats.MAX_RADIUS)
    }});
    return id;
  }
  static in_block_create(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].startBlock(data.blockData);
  }
  static out_block_destroy(blockID) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('block destroy', { senderID: ENV["id"], blockID: blockID });
  }
  static in_block_destroy(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].endBlock(data.blockID);
  }
  static out_block_damage(blockID, hp) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('block damage', { senderID: ENV["id"], blockID: blockID, hp: hp});
  }
  static in_block_damage(data) { if(!DeepSpaceGame.runningInstance) return;
    var block;
    if(block = ENV["game"].model.blocks.get(data.blockID)) block.damage(data.hp);
  }

  static out_pulse_create(ship) { if(!DeepSpaceGame.runningInstance) return;
    var id = Math.uuid();
    socket.emit('pulse create', { senderID: ENV["id"], pulseData: {
      id: id,
      team: ship.owner.team.number,
      position: ship.front_weapon_position,
      angle: ship.angle
    }});
    return id;
  }
  static in_pulse_create(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].startPulse(data.pulseData);
  }
  static out_pulse_destroy(pulseID) { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('pulse destroy', { senderID: ENV["id"], pulseID: pulseID });
  }
  static in_pulse_destroy(data) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].endPulse(data.pulseID);
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
  static out_game_over() { if(!DeepSpaceGame.runningInstance) return;
    socket.emit('game over', { senderID: ENV["id"] });
  }

  static in_game_over() { if(!DeepSpaceGame.runningInstance) return;
    var g = ENV["game"];
    if(!g.game.over) g.end();
  }

  // disconnect players
  static in_disconnect_player(userid) { if(!DeepSpaceGame.runningInstance) return;
    ENV["game"].disconnectPlayer(userid);
  }

}
