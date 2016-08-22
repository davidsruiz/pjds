class NetworkHelper {
  static sendShip(shipModel) {
    // if(Math.flipCoin(0.8)) return;
    socket.emit('ship update', { senderID: ENV["id"], shipData: shipModel.export() });
  }
  static setShip(data) {
    var shipModel = data.shipData;
    ENV["game"].players.get(data.senderID).ship.update(shipModel);
  }

  static out_bullet_create(ship) {
    var id = Math.uuid();
    socket.emit('bullet create', { senderID: ENV["id"], bulletData: {
      id: id,
      team: ship.owner.team.number,
      position: ship.front_weapon_position,
      angle: ship.angle + (ship.SHOT_SPREAD / 2) * ((Math.random()*2) - 1),
      hp: ship.ATTACK
    }});
    return id;
  }
  static in_bullet_create(data) {
    ENV["game"].startBullet(data.bulletData);
  }
  static out_bullet_destroy(bulletID) {
    socket.emit('bullet destroy', { senderID: ENV["id"], bulletID: bulletID });
  }
  static in_bullet_destroy(data) {
    ENV["game"].endBullet(data.bulletID);
  }

  static out_ship_damage(playerID, hp) {
    socket.emit('ship damage', { senderID: ENV["id"], playerID: playerID, hp: hp});
  }
  static in_ship_damage(data) {
    if(localIDMatches(data.playerID)) ENV["game"].players.get(data.playerID).ship.damage(data.hp);
  }

  static out_block_create(ship) {
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
  static in_block_create(data) {
    ENV["game"].startBlock(data.blockData);
  }
  static out_block_destroy(blockID) {
    socket.emit('block destroy', { senderID: ENV["id"], blockID: blockID });
  }
  static in_block_destroy(data) {
    ENV["game"].endBlock(data.blockID);
  }
  static out_block_damage(blockID, hp) {
    socket.emit('block damage', { senderID: ENV["id"], blockID: blockID, hp: hp});
  }
  static in_block_damage(data) {
    var block;
    if(block = ENV["game"].model.blocks.get(data.blockID)) block.damage(data.hp);
  }

  static out_pulse_create(ship) {
    var id = Math.uuid();
    socket.emit('pulse create', { senderID: ENV["id"], pulseData: {
      id: id,
      team: ship.owner.team.number,
      position: ship.front_weapon_position,
      angle: ship.angle
    }});
    return id;
  }
  static in_pulse_create(data) {
    ENV["game"].startPulse(data.pulseData);
  }
  static out_pulse_destroy(pulseID) {
    socket.emit('pulse destroy', { senderID: ENV["id"], pulseID: pulseID });
  }
  static in_pulse_destroy(data) {
    ENV["game"].endPulse(data.pulseID);
  }

  // ctf
  static out_flag_pickup(playerID) {
    socket.emit('flag pickup', { senderID: ENV["id"], playerID: playerID });
  }
  static in_flag_pickup(data) {
    ENV["game"].pickupFlag(data.playerID);
  }
  static out_flag_drop() {
    socket.emit('flag drop', { senderID: ENV["id"] });
  }
  static in_flag_drop(data) {
    ENV["game"].dropFlag();
  }


}
