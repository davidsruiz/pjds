var ENV = ENV || {};

class SoundHelper {

  constructor() {
    
  }

  static start() {
    ENV.sound.play('track1');
  }

  static stop() {
    ENV.sound.stop('track1');
  }

  static fireAttractor() {
    // if(!ENV.sound) return;
    ENV.sound.play('pulse')
  }

  static fireShot() {
    ENV.sound.play('shoot')
  }

  static takeDamage() {
    ENV.sound.play('damp')
  }

  static teamYay() {
    ENV.sound.play('rise')
  }

  static teamNay() {
    ENV.sound.play('fall')
  }

  static playerDisconnect() {
    ENV.sound.play('drop')
  }

}
