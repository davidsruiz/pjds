class NetworkHelper {
  static sendShip(shipModel) {
    socket.emit('ship update', { senderID: ENV["id"], shipData: shipModel.export() });
  }
  static setShip(data) {
    var shipModel = data.shipData;
    ENV["game"].players.get(data.senderID).ship.update(shipModel);
  }

  static createBullet() {}
  static destroyBullet() {}
}
