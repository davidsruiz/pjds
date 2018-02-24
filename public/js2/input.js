'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventProtocol = function () {
  function EventProtocol() {
    _classCallCheck(this, EventProtocol);

    this.listeners = new Map();

    // aliases
    this.on = this.addListener;
  }

  _createClass(EventProtocol, [{
    key: 'addListener',
    value: function addListener(key, handler) {

      if (typeof handler !== 'function') return false;

      var listenerList = this.listeners.get(key) || [];
      listenerList.push(handler);
      this.listeners.set(key, listenerList);

      return true; // success
    }
  }, {
    key: 'execListeners',
    value: function execListeners(key, info) {
      var listenerList = this.listeners.get(key) || [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = listenerList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var listener = _step.value;

          listener(info);
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
    key: 'removeListener',
    value: function removeListener(key, handler) {
      var listenerList = this.listeners.get(key) || [];
      var indexOf = listenerList.indexOf(handler);
      if (indexOf === -1) return false; // failure
      listenerList.splice(indexOf, 1);
      return true; // success
    }
  }]);

  return EventProtocol;
}();

var Button = function () {
  function Button(id) {
    _classCallCheck(this, Button);

    this.id = id;
    this.state = false;
    this.trueHandlers = new Set();
    this.falseHandlers = new Set();

    this.ontrue = this._ontrue.bind(this);
    this.onfalse = this._onfalse.bind(this);
  }

  _createClass(Button, [{
    key: 'setState',
    value: function setState(bool) {
      if (this.state === bool) return;

      this.state = bool;
      this.handlerGroup = bool ? this.trueHandlers : this.falseHandlers;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.handlerGroup[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var handler = _step2.value;

          handler();
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
    key: '_ontrue',
    value: function _ontrue(handler) {
      this.trueHandlers.add(handler);
    }
  }, {
    key: '_onfalse',
    value: function _onfalse(handler) {
      this.falseHandlers.add(handler);
    }
  }, {
    key: 'remove',
    value: function remove(handler) {
      return this.trueHandlers.delete(handler) || this.falseHandlers.delete(handler);
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.trueHandlers.clear();
      this.falseHandlers.clear();
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.clear();
    }
  }, {
    key: 'hasHandlers',
    get: function get() {
      return !!this.trueHandlers.size || !!this.falseHandlers.size;
    }
  }]);

  return Button;
}();

var Axis = function () {
  function Axis(id) {
    _classCallCheck(this, Axis);

    this.id = id;
    this.state = 0;
    this.morethanhandlers = new Map();
    this.lessthanhandlers = new Map();

    this.onlessthan = this._onlessthan.bind(this);
    this.onmorethan = this._onmorethan.bind(this);
  }

  _createClass(Axis, [{
    key: 'setState',
    value: function setState(value) {
      if (this.state === value) return;

      this.state = value;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.morethanhandlers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _ref = _step3.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var handler = _ref2[0];

          var _ref2$ = _slicedToArray(_ref2[1], 2);

          var limit = _ref2$[0];
          var active = _ref2$[1];

          if (value > limit) handler(this.state);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.lessthanhandlers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _ref3 = _step4.value;

          var _ref4 = _slicedToArray(_ref3, 2);

          var _handler = _ref4[0];

          var _ref4$ = _slicedToArray(_ref4[1], 2);

          var _limit = _ref4$[0];
          var _active = _ref4$[1];

          if (value < _limit) _handler(this.state);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }, {
    key: '_onmorethan',
    value: function _onmorethan(limit) {
      var _this = this;

      return function (handler) {
        _this.morethanhandlers.set(handler, [limit, false]);
      };
    }
  }, {
    key: '_onlessthan',
    value: function _onlessthan(limit) {
      var _this2 = this;

      return function (handler) {
        _this2.lessthanhandlers.set(handler, [limit, false]);
      };
    }
  }, {
    key: 'remove',
    value: function remove(handler) {
      return this.morethanhandlers.delete(handler) || this.lessthanhandlers.delete(handler);
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.morethanhandlers.clear();
      this.lessthanhandlers.clear();
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.clear();
    }
  }, {
    key: 'hasHandlers',
    get: function get() {
      return !!this.morethanhandlers.size || !!this.lessthanhandlers.size;
    }
  }]);

  return Axis;
}();

var Input = function (_EventProtocol) {
  _inherits(Input, _EventProtocol);

  function Input() {
    _classCallCheck(this, Input);

    var _this3 = _possibleConstructorReturn(this, (Input.__proto__ || Object.getPrototypeOf(Input)).call(this));

    _this3._buttons = new Map();
    _this3._axes = new Map();

    return _this3;
  }

  _createClass(Input, [{
    key: 'button',
    value: function button(id) {

      var button = this._buttons.get(id);
      if (!button) button = new Button(id);
      this._buttons.set(id, button);

      return button;
    }
  }, {
    key: 'axis',
    value: function axis(id) {

      var axis = this._axes.get(id);
      if (!axis) axis = new Axis(id);
      this._axes.set(id, axis);

      return axis;
    }
  }]);

  return Input;
}(EventProtocol);

var KeyboardInput = function (_Input) {
  _inherits(KeyboardInput, _Input);

  function KeyboardInput() {
    _classCallCheck(this, KeyboardInput);

    var _this4 = _possibleConstructorReturn(this, (KeyboardInput.__proto__ || Object.getPrototypeOf(KeyboardInput)).call(this));

    _this4.boundHandle = function (event) {
      return _this4.handle(event);
    };
    _this4.startListening();
    return _this4;
  }

  // being a keyboard input made up of only keys or _buttons
  // the keyboard is listening for only keydown and keyup events
  // to alert the corresponding handlers


  _createClass(KeyboardInput, [{
    key: 'startListening',
    value: function startListening() {

      document.addEventListener('keydown', this.boundHandle);
      document.addEventListener('keyup', this.boundHandle);
    }
  }, {
    key: 'handle',
    value: function handle(event) {
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {

        for (var _iterator5 = this._buttons[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var _ref5 = _step5.value;

          var _ref6 = _slicedToArray(_ref5, 2);

          var id = _ref6[0];
          var button = _ref6[1];

          if (id != event.keyCode) continue;
          button.setState(event.type === 'keydown');
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
  }, {
    key: 'stopListening',
    value: function stopListening() {

      document.removeEventListener('keydown', this.boundHandle);
      document.removeEventListener('keyup', this.boundHandle);
    }
  }]);

  return KeyboardInput;
}(Input);

var GamepadInput = function (_Input2) {
  _inherits(GamepadInput, _Input2);

  // SETUP AND REFRESH LOOP

  function GamepadInput() {
    _classCallCheck(this, GamepadInput);

    var _this5 = _possibleConstructorReturn(this, (GamepadInput.__proto__ || Object.getPrototypeOf(GamepadInput)).call(this));

    _this5.refreshing = false;
    _this5.refreshRate = 16;

    _this5.lookForGamepad();
    window.addEventListener("gamepadconnected", function (e) {
      return _this5.setGamepad(e.gamepad);
    });
    window.addEventListener("gamepaddisconnected", function (e) {
      _this5.unsetGamepad();_this5.lookForGamepad();
    });

    return _this5;
  }

  _createClass(GamepadInput, [{
    key: 'lookForGamepad',
    value: function lookForGamepad() {

      if (navigator.getGamepads) {

        var gamepads = navigator.getGamepads();
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = gamepads[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var gamepad = _step6.value;

            if (gamepad) {
              this.setGamepad(gamepad);
              break;
            }
          }
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
              _iterator6.return();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }
      }
    }
  }, {
    key: 'setGamepad',
    value: function setGamepad(gamepad) {
      this.gamepad = gamepad;
      this.startRefreshing();
    }
  }, {
    key: 'startRefreshing',
    value: function startRefreshing() {
      this.refreshing = true;
      this.refresh();
    }
  }, {
    key: 'refresh',
    value: function refresh() {
      var _this6 = this;

      if (!this.gamepad || !this.gamepad.axes || !this.gamepad.buttons) this.unsetGamepad();
      if (!this.refreshing) return;

      this.refreshAxes();
      this.refreshButtons();

      setTimeout(function () {
        return _this6.refresh();
      }, this.refreshRate);
    }
  }, {
    key: 'refreshAxes',
    value: function refreshAxes() {

      for (var i = 0; i < this.gamepad.axes.length; i++) {
        var axisValue = this.gamepad.axes[i];
        this.axis(i).setState(axisValue);
      }
    }
  }, {
    key: 'refreshButtons',
    value: function refreshButtons() {

      for (var i = 0; i < this.gamepad.buttons.length; i++) {
        var buttonValue = this.gamepad.buttons[i].pressed;
        this.button(i).setState(buttonValue);
      }
    }
  }, {
    key: 'abortRefresh',
    value: function abortRefresh() {
      this.refreshing = false;
    }
  }, {
    key: 'unsetGamepad',
    value: function unsetGamepad() {
      this.gamepad = null;
      this.abortRefresh();
    }
  }]);

  return GamepadInput;
}(Input);

var MobileInput = function (_Input3) {
  _inherits(MobileInput, _Input3);

  // initial support excludes accelerometer data

  function MobileInput() {
    _classCallCheck(this, MobileInput);

    var _this7 = _possibleConstructorReturn(this, (MobileInput.__proto__ || Object.getPrototypeOf(MobileInput)).call(this));

    _this7._buttonNodes = new Map();
    _this7._verticalAxisNodes = new Map();
    _this7._horizontalAxisNodes = new Map();

    return _this7;
  }

  _createClass(MobileInput, [{
    key: 'createButton',
    value: function createButton(id, node) {
      var _this8 = this;

      var startHandler = function startHandler(e) {
        _this8.button(id).setState(true);
      };
      var endHandler = function endHandler(e) {
        _this8.button(id).setState(false);
      };
      node.addEventListener('touchstart', startHandler);
      node.addEventListener('touchend', endHandler);
      this._buttonNodes.set(id, [node, startHandler, endHandler]);
    }
  }, {
    key: 'deleteButton',
    value: function deleteButton(id) {
      var _buttonNodes$get = this._buttonNodes.get(id),
          _buttonNodes$get2 = _slicedToArray(_buttonNodes$get, 3),
          node = _buttonNodes$get2[0],
          startHandler = _buttonNodes$get2[1],
          endHandler = _buttonNodes$get2[2];

      node.removeEventListener('touchstart', startHandler);
      node.removeEventListener('touchend', endHandler);
      this._buttonNodes.delete(id);
    }
  }, {
    key: 'createVerticalAxis',
    value: function createVerticalAxis(id, node) {
      var _this9 = this;

      var gestureRecognizer = new Hammer(node);
      gestureRecognizer.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });
      gestureRecognizer.on('panmove', function (e) {
        _this9.axis(id).setState(e.deltaY);
      });
      gestureRecognizer.on('panend', function (e) {
        _this9.axis(id).setState(0);
      });
      this._verticalAxisNodes.set(id, [node, gestureRecognizer]);
    }
  }, {
    key: 'deleteVerticalAxis',
    value: function deleteVerticalAxis(id) {
      var _verticalAxisNodes$ge = this._verticalAxisNodes.get(id),
          _verticalAxisNodes$ge2 = _slicedToArray(_verticalAxisNodes$ge, 2),
          gestureRecognizer = _verticalAxisNodes$ge2[1];

      gestureRecognizer.destroy();
      this._verticalAxisNodes.delete(id);
    }
  }, {
    key: 'createHorizontalAxis',
    value: function createHorizontalAxis(id, node) {
      var _this10 = this;

      var gestureRecognizer = new Hammer(node);
      gestureRecognizer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });
      gestureRecognizer.on('panmove', function (e) {
        _this10.axis(id).setState(e.deltaX);
      });
      gestureRecognizer.on('panend', function (e) {
        _this10.axis(id).setState(0);
      });
      this._horizontalAxisNodes.set(id, [node, gestureRecognizer]);
    }
  }, {
    key: 'deleteHorizontalAxis',
    value: function deleteHorizontalAxis(id) {
      var _horizontalAxisNodes$ = this._horizontalAxisNodes.get(id),
          _horizontalAxisNodes$2 = _slicedToArray(_horizontalAxisNodes$, 2),
          gestureRecognizer = _horizontalAxisNodes$2[1];

      gestureRecognizer.destroy();
      this._horizontalAxisNodes.delete(id);
    }
  }]);

  return MobileInput;
}(Input);

var InputStack = function (_EventProtocol2) {
  _inherits(InputStack, _EventProtocol2);

  function InputStack() {
    _classCallCheck(this, InputStack);

    var _this11 = _possibleConstructorReturn(this, (InputStack.__proto__ || Object.getPrototypeOf(InputStack)).call(this));

    _this11.items = new Map();
    _this11.reference = new Map();
    _this11.addHandlers = new Map();
    _this11.removeHandlers = new Map();

    return _this11;
  }

  _createClass(InputStack, [{
    key: 'setItem',
    value: function setItem(item, value) {

      var itemIsNotAlreadyPresent = !this.items.has(item);
      var valueHasChanged = this.items.get(item) !== value;
      var changeOccurring = itemIsNotAlreadyPresent || valueHasChanged;

      this.items.set(item, value);

      if (changeOccurring) {
        this.callAddItemHandlers(item);
        this.execListeners('change');
      }
    }
  }, {
    key: 'clearItem',
    value: function clearItem(item) {

      var changeOccurring = this.items.has(item); // if item not already removed
      this.items.delete(item);

      if (changeOccurring) {
        this.callRemoveItemHandlers(item);
        this.execListeners('change');
      }
    }
  }, {
    key: 'onadd',
    value: function onadd(item, handler) {

      var handlersForItem = this.addHandlers.get(item);
      if (!handlersForItem) handlersForItem = new Set();
      handlersForItem.add(handler);
      this.addHandlers.set(item, handlersForItem);
    }
  }, {
    key: 'onremove',
    value: function onremove(item, handler) {

      var handlersForItem = this.removeHandlers.get(item);
      if (!handlersForItem) handlersForItem = new Set();
      handlersForItem.add(handler);
      this.removeHandlers.set(item, handlersForItem);
    }
  }, {
    key: 'addItemWhen',
    value: function addItemWhen(item, expectingHandler) {
      var _this12 = this;

      var valueInterpreter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (a) {
        return a;
      };


      expectingHandler(function () {
        var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;


        _this12.setItem(item, valueInterpreter(value));
      });
    }
  }, {
    key: 'removeItemWhen',
    value: function removeItemWhen(item, expectingHandler) {
      var _this13 = this;

      expectingHandler(function () {

        _this13.clearItem(item);
      });
    }
  }, {
    key: 'callAddItemHandlers',
    value: function callAddItemHandlers(item) {

      var handlersForItem = this.addHandlers.get(item);
      if (!handlersForItem) return;
      var itemValue = this.items.get(item);
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = handlersForItem[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var handler = _step7.value;

          handler(itemValue);
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
    }
  }, {
    key: 'callRemoveItemHandlers',
    value: function callRemoveItemHandlers(item) {

      var handlersForItem = this.removeHandlers.get(item);
      if (!handlersForItem) return;
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = handlersForItem[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var handler = _step8.value;

          handler();
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8.return) {
            _iterator8.return();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }
    }
  }, {
    key: 'removeItemHandler',
    value: function removeItemHandler(item, handler) {
      var addHandlers = this.addHandlers(item);
      if (addHandlers) addHandlers.delete(handler);
      var removeHandlers = this.removeHandlers(item);
      if (removeHandlers) removeHandlers.delete(handler);
    }
  }, {
    key: 'clearItemHandlers',
    value: function clearItemHandlers(item) {

      this.addHandlers.delete(item);
      this.removeHandlers.delete(item);
    }

    // this.execListeners('serverUpdate', {rank, money, simple_rank, simple_money});

  }, {
    key: 'toString',
    value: function toString() {
      return this.items.toString();
    }
  }]);

  return InputStack;
}(EventProtocol);

// var keyboard = new KeyboardInput();
// var gamepad = new GamepadInput();
//
// var stack = new InputStack();
//
// stack.addItemWhen('shoot', keyboard.button(32).ontrue);
// stack.removeItemWhen('shoot', keyboard.button(32).onfalse);
//
// stack.addItemWhen('left', gamepad.axis(0).onlessthan(-0.2));
// stack.removeItemWhen('left', gamepad.axis(0).onmorethan(-0.2));
// stack.addItemWhen('right', gamepad.axis(0).onmorethan(0.2));
// stack.removeItemWhen('right', gamepad.axis(0).onlessthan(0.2));
//
// stack.onadd('shoot', () => console.log('shoot added'));
// stack.onremove('shoot', () => console.log('shoot removed'));
//
// stack.onadd('left', () => console.log('left added'));
// stack.onremove('left', () => console.log('left removed'));
//
// stack.onadd('right', () => console.log('right added'));
// stack.onremove('right', () => console.log('right removed'));


(function () {
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
//# sourceMappingURL=input.js.map