class NetworkHelper {
  static sendShip(shipModel) {
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
      position: ship.position.copy(),
      angle: ship.angle,
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
}
