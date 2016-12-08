var TIME = {sec: function(mil) {return mil * 1000}, min: function(mil) {return this.sec(mil) * 60}};

class Sound {

  constructor(set) {
    this.root = '/sound/'
    this._volume = 0.7;
    this._pan = 0;
    this._mute = 0;
    this.activated = new Map();
    createjs.Sound.on("fileload", this.loadHandler, this);

      // every loaded sound is here
    this.loaded = new Set();
      // loading sounds waiting play
    this.waiting = new Set();
      // where looping information is stored if needed
    this.looping = new Map();
    if(set) this.load(set);
  }

  load(set) {

    set = Sound.sets[set];

    for(var item of set) {
      createjs.Sound.registerSound(this.root + item[1], item[0]);
      if(item[2] !== undefined) this.looping.set(item[0], {start: item[2], end: item[3]})
    }
  }

  loadHandler(e) {
    let id = e.id;
    this.loaded.add(id); console.log(`loaded ${id}`)
    if(this.waiting.has(id)) {
      this.waiting.delete(id)
      this.play(id)
    }
  }

  play(id) {
    if(this.activated.has(id)) {
      var instance = this.activated.get(id);
      (instance.playState == "playFinished") ? instance.play() : instance.position = 0;
    } else if(this.loaded.has(id)) {
      var instance = createjs.Sound.play(id);
      this.activated.set(id, instance);
      instance.volume = this.volume; instance.pan = this.pan; instance.muted = this.mute;
      if(this.looping.has(id)) {
        var {start, end} = this.looping.get(id);
        end = end || instance.duration;
        instance.setLoop(99);
        instance.setDuration(end)
        instance.setStartTime(start) // effective next cycle
        setTimeout(() => { instance.setDuration(end - start); }, end); // effective immediately, hence delay
      }
    } else {
      this.waiting.add(id);
    }
  }

  pause(id) {
    if(this.activated.has(id)) {
      var instance = this.activated.get(id);
      instance.paused = true;
    }
  }

  stop(id) {
    if(this.activated.has(id)) {
      var instance = this.activated.get(id);
      instance.paused = true;
      instance.position = 0;
      instance.stop()
    } else if(this.waiting.has(id)) {
      this.waiting.delete(id)
    }
  }

  get volume() {
    return this._volume;
  }

  set volume(new_volume) {
    if(new_volume < 0) new_volume = 0;
    if(new_volume > 1) new_volume = 1;
    this._volume = new_volume;
    for(var [,instance] of this.activated)
      instance.volume = this._volume;
  }

  get pan() {
    return this._pan;
  }

  set pan(new_pan) {
    if(new_pan < -1) new_pan = -1;
    if(new_pan > 1) new_pan = 1;
    this._pan = new_pan;
    for(var [,instance] of this.activated)
      instance.pan = this._pan;
  }

  get mute() {
    return this._mute;
  }

  set mute(new_mute) {
    this._mute = !!new_mute;
    for(var [,instance] of this.activated)
      instance.muted = this._mute;
  }

}

Sound.sets = {
// set: ['soundname', 'file'[, startLoop, endLoop]]
  menu: [
    ['ambiance', 'DB-T.mp3', TIME.sec(10.0)],
    ['item-hover', 'blip0.mp3']
  ],
  lobby: [
    ['chill', 'lounge.mp3', 10, TIME.sec(36.571)],
    ['ready', 'blip1.mp3'],
    ['type', 'blip2.mp3']
  ],
  level: [
    ['track1', 'DR-T.mp3']
  ],
  game: [
    // ['pulse', 'pulse.wav'],
    // ['shoot', 'standard_shot.wav'],
    // ['damp', '.mp3'],
    ['rise', 'rise.wav'],
    ['fall', 'fall.wav']
    // ['drop', '.mp3']
  ]
}
