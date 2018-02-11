
class EventProtocol {

  constructor() {
    this.listeners = new Map();

    // aliases
    this.on = this.addListener;
  }

  addListener(key, handler) {

    if(typeof handler !== 'function')
      return false;

    const listenerList = this.listeners.get(key) || [];
    listenerList.push(handler);
    this.listeners.set(key, listenerList);

    return true; // success

  }

  execListeners(key, info) {
    const listenerList = this.listeners.get(key) || [];
    for(let listener of listenerList)
      listener(info);
  }

  removeListener(key, handler) {
    const listenerList = this.listeners.get(key) || [];
    const indexOf = listenerList.indexOf(handler);
    if(indexOf === -1) return false; // failure
    listenerList.splice(indexOf, 1);
    return true; // success
  }

}

class Button {

  constructor(id) {

    this.id = id;
    this.state = false;
    this.trueHandlers = new Set();
    this.falseHandlers = new Set();

    this.ontrue = this._ontrue.bind(this);
    this.onfalse = this._onfalse.bind(this);

  }

  setState(bool) {
    if(this.state === bool) return;

    this.state = bool;
    this.handlerGroup = bool ? this.trueHandlers : this.falseHandlers;
    for(let handler of this.handlerGroup)
      handler();

  }

  get hasHandlers() {
    return (
      !!this.trueHandlers.size ||
      !!this.falseHandlers.size
    );
  }

  _ontrue(handler) {
    this.trueHandlers.add(handler);
  }

  _onfalse(handler) {
    this.falseHandlers.add(handler);
  }

  remove(handler) {
    return (
      this.trueHandlers.delete(handler) ||
      this.falseHandlers.delete(handler)
    );
  }

  clear() {
    this.trueHandlers.clear();
    this.falseHandlers.clear();
  }
  reset() {
    this.clear();
  }

}

class Axis {

  constructor(id) {

    this.id = id;
    this.state = 0;
    this.morethanhandlers = new Map();
    this.lessthanhandlers = new Map();

    this.onlessthan = this._onlessthan.bind(this);
    this.onmorethan = this._onmorethan.bind(this);

  }

  setState(value) {
    if(this.state === value) return;

    this.state = value;
    for(let [handler, [limit, active]] of this.morethanhandlers) {
      if(value > limit) handler(this.state);
    }
    for(let [handler, [limit, active]] of this.lessthanhandlers) {
      if(value < limit) handler(this.state);
    }

  }

  get hasHandlers() {
    return (
      !!this.morethanhandlers.size ||
      !!this.lessthanhandlers.size
    );
  }

  _onmorethan(limit) {
    return (handler => {
      this.morethanhandlers.set(handler, [limit, false]);
    });
  }

  _onlessthan(limit) {
    return (handler => {
      this.lessthanhandlers.set(handler, [limit, false]);
    });
  }

  remove(handler) {
    return (
      this.morethanhandlers.delete(handler) ||
      this.lessthanhandlers.delete(handler)
    );
  }

  clear() {
    this.morethanhandlers.clear();
    this.lessthanhandlers.clear();
  }
  reset() {
    this.clear();
  }


}

class Input extends EventProtocol {

  constructor() {
    super();

    this._buttons = new Map();
    this._axes = new Map();

  }

  button(id) {

    let button = this._buttons.get(id);
    if(!button) button = new Button(id);
    this._buttons.set(id, button);

    return button;

  }

  axis(id) {

    let axis = this._axes.get(id);
    if(!axis) axis = new Axis(id);
    this._axes.set(id, axis);

    return axis;

  }

}

class KeyboardInput extends Input {

  constructor() {
    super();

    this.boundHandle = (event) => this.handle(event);
    this.startListening();
  }


  // being a keyboard input made up of only keys or _buttons
  // the keyboard is listening for only keydown and keyup events
  // to alert the corresponding handlers
  startListening() {

    document.addEventListener('keydown', this.boundHandle);
    document.addEventListener('keyup', this.boundHandle);

  }

  handle(event) {

    for(let [id, button] of this._buttons) {
      if(id != event.keyCode) continue;
      button.setState(event.type === 'keydown');
    }

  }

  stopListening() {

    document.removeEventListener('keydown', this.boundHandle);
    document.removeEventListener('keyup', this.boundHandle);

  }

}

class GamepadInput extends Input {

  // SETUP AND REFRESH LOOP

  constructor() {
    super();

    this.refreshing = false;
    this.refreshRate = 16;

    this.lookForGamepad();
    window.addEventListener("gamepadconnected", e => this.setGamepad(e.gamepad));
    window.addEventListener("gamepaddisconnected", e => { this.unsetGamepad(); this.lookForGamepad() });

  }

  lookForGamepad() {

    if(navigator.getGamepads) {

      let gamepads = navigator.getGamepads();
      for(let gamepad of gamepads) {
        if(gamepad) {
          this.setGamepad(gamepad);
          break;
        }
      }

    }

  }

  setGamepad(gamepad) {
    this.gamepad = gamepad;
    this.startRefreshing();
  }

  startRefreshing() {
    this.refreshing = true;
    this.refresh();
  }

  refresh() {
    if(!this.gamepad || !this.gamepad.axes || !this.gamepad.buttons) this.unsetGamepad();
    if(!this.refreshing) return;

    this.refreshAxes();
    this.refreshButtons();

    setTimeout(()=>this.refresh(), this.refreshRate)
  }

  refreshAxes() {

    for(let i = 0; i < this.gamepad.axes.length; i++) {
      const axisValue = this.gamepad.axes[i];
      this.axis(i).setState(axisValue);
    }

  }

  refreshButtons() {

    for(let i = 0; i < this.gamepad.buttons.length; i++) {
      const buttonValue = this.gamepad.buttons[i].pressed;
      this.button(i).setState(buttonValue);
    }

  }

  abortRefresh() {
    this.refreshing = false;
  }

  unsetGamepad() {
    this.gamepad = null;
    this.abortRefresh()
  }





}

class MobileInput extends Input {

  // initial support is only for accelerometer data




}

class InputStack extends EventProtocol {

  constructor() {

    super();

    this.items = new Map();
    this.reference = new Map();
    this.addHandlers = new Map();
    this.removeHandlers = new Map();

  }

  setItem(item, value) {

    const changeOccurring = typeof this.items.get(item) === 'undefined'; // if item not already present
    this.items.set(item, value);

    if(changeOccurring) {
      this.callAddItemHandlers(item);
      this.execListeners('change');
    }

  }

  clearItem(item) {

    const changeOccurring = typeof this.items.get(item) !== 'undefined'; // if item not already removed
    this.items.delete(item);

    if(changeOccurring) {
      this.callRemoveItemHandlers(item);
      this.execListeners('change');
    }

  }

  onadd(item, handler) {

    let handlersForItem = this.addHandlers.get(item);
    if(!handlersForItem) handlersForItem = new Set();
    handlersForItem.add(handler);
    this.addHandlers.set(item, handlersForItem);

  }

  onremove(item, handler) {

    let handlersForItem = this.removeHandlers.get(item);
    if(!handlersForItem) handlersForItem = new Set();
    handlersForItem.add(handler);
    this.removeHandlers.set(item, handlersForItem);

  }

  addItemWhen(item, expectingHandler, valueInterpreter = a => a) {

    expectingHandler((value = 1) => {

      this.setItem(item, valueInterpreter(value));

    })

  }

  removeItemWhen(item, expectingHandler) {

    expectingHandler(() => {

      this.clearItem(item);

    })

  }

  callAddItemHandlers(item) {

    let handlersForItem = this.addHandlers.get(item);
    if(!handlersForItem) return;
    const itemValue = this.items.get(item);
    for(let handler of handlersForItem)
      handler(itemValue);

  }

  callRemoveItemHandlers(item) {

    let handlersForItem = this.removeHandlers.get(item);
    if(!handlersForItem) return;
    for(let handler of handlersForItem)
      handler();

  }

  removeItemHandler(item, handler) {
    const addHandlers = this.addHandlers(item);
    if(addHandlers) addHandlers.delete(handler);
    const removeHandlers = this.removeHandlers(item);
    if(removeHandlers) removeHandlers.delete(handler);
  }

  clearItemHandlers(item) {

    this.addHandlers.delete(item);
    this.removeHandlers.delete(item);

  }

  // this.execListeners('serverUpdate', {rank, money, simple_rank, simple_money});

  toString() {
    return this.items.toString();
  }

}



var keyboard = new KeyboardInput();
var gamepad = new GamepadInput();

var stack = new InputStack();

stack.addItemWhen('shoot', keyboard.button(32).ontrue);
stack.removeItemWhen('shoot', keyboard.button(32).onfalse);

stack.addItemWhen('left', gamepad.axis(0).onlessthan(-0.2));
stack.removeItemWhen('left', gamepad.axis(0).onmorethan(-0.2));
stack.addItemWhen('right', gamepad.axis(0).onmorethan(0.2));
stack.removeItemWhen('right', gamepad.axis(0).onlessthan(0.2));

stack.onadd('shoot', () => console.log('shoot added'));
stack.onremove('shoot', () => console.log('shoot removed'));

stack.onadd('left', () => console.log('left added'));
stack.onremove('left', () => console.log('left removed'));

stack.onadd('right', () => console.log('right added'));
stack.onremove('right', () => console.log('right removed'));


(() => {
  //
  // const handler = () => {};
  // const interpreter = ()=>{};
  //
  //
  // Keyboard.button(17).ontrue(handler);
  // Gamepad.axis(2).onmorethan(0.2, handler);
  // Gamepad.axis(0).onlessthan(0.2, handler);
  //
  // InputM.listAction(Gamepad.axis(2).onmorethan(-0.7), 'shoot');
  // InputM.listAction(Gamepad.axis(1).onmorethan(0.2), 'x+', interpreter)
  //
  //
  // Stack.enlist('shoot', Keyboard.button(3))




  //
  //
  // let raw_acc_data = [0, 0], applied_acc_data = [0, 0]; // [x, y]
  // let threshold = 1, bias = [0, 0]; // deadzone
  // const minThreshhold = 1;
  // const maxThreshhold = 4;
  // const thresholdSpan = maxThreshhold - minThreshhold;
  // bias = ENV.storage.calibration = (ENV.storage.calibration) ? ENV.storage.calibration.split(",").map(Number) : [0, 0];
  // // let origin = [0, bias];
  // if (ENV.mobile && window.DeviceMotionEvent != undefined) {
  //   window.ondevicemotion = function (e) {
  //     raw_acc_data = [e.accelerationIncludingGravity.x, e.accelerationIncludingGravity.y];
  //     // if ( e.rotationRate )  {
  //     //   document.getElementById("rotationAlpha").innerHTML = e.rotationRate.alpha;
  //     //   document.getElementById("rotationBeta").innerHTML = e.rotationRate.beta;
  //     //   document.getElementById("rotationGamma").innerHTML = e.rotationRate.gamma;
  //     // }
  //   }
  //
  //   inputs.updateMotion = function () {
  //
  //     // generate the data
  //
  //     let orientation = window.orientation,
  //       [raw_x, raw_y] = raw_acc_data, [x, y] = [raw_x, raw_y];
  //
  //     if (orientation === 90) {
  //       x = -raw_y, y = raw_x
  //     }
  //     else if (orientation === -90) {
  //       x = raw_y, y = -raw_x
  //     }
  //     else if (orientation === 180 || orientation === -180) {
  //       x = -x, y = -y
  //     }
  //
  //     applied_acc_data = [x, y];
  //     x -= bias[0]; // bias towards player;
  //     y -= bias[1];
  //
  //     if(ENV.options.input.invertControls) { x = -x; y = -y }
  //
  //     // apply the data
  //
  //
  //     if(x > minThreshhold) { // more
  //       if(x < maxThreshhold) inputs.angularAcceleration = (maxThreshhold - x) / thresholdSpan;
  //       else inputs.angularAcceleration = 1;
  //     } else if(x < -minThreshhold) { // less
  //       if(x > -maxThreshhold) inputs.angularAcceleration = (-maxThreshhold - x) / thresholdSpan;
  //       else inputs.angularAcceleration = -1;
  //     } else { // neither
  //       inputs.angularAcceleration = 0;
  //     }
  //
  //     if(y > minThreshhold) { // more
  //       if(y < maxThreshhold) inputs.acceleration = (maxThreshhold - y) / thresholdSpan;
  //       else inputs.acceleration = 1;
  //     } else if(y < -minThreshhold) { // less
  //       if(y > -maxThreshhold) inputs.acceleration = (-maxThreshhold - y) / thresholdSpan;
  //       else inputs.acceleration = -1;
  //     } else { // neither
  //       inputs.acceleration = 0;
  //     }
  //
  //     // if (x > threshold) {
  //     //   inputStack.add('rt')
  //     // } else {
  //     //   inputStack.delete('rt')
  //     // }
  //     // if (x < -threshold) {
  //     //   inputStack.add('lt')
  //     // } else {
  //     //   inputStack.delete('lt')
  //     // }
  //     // if (y > threshold) {
  //     //   inputStack.add('up')
  //     // } else {
  //     //   inputStack.delete('up')
  //     // }
  //     // if (y < -threshold) {
  //     //   inputStack.add('dn')
  //     // } else {
  //     //   inputStack.delete('dn')
  //     // }
  //
  //     $('#clock').text(`x: ${x.round(0)}, y: ${y.round(0)}`);
  //
  //   };
  // }
  //






})();