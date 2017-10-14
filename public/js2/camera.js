"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Camera = function () {
  function Camera(window, plane, scale, HDPScale) {
    _classCallCheck(this, Camera);

    this.window = window;this.plane = plane;this.scale = scale;this.HDPScale = HDPScale;
    this.edge_x = -this.plane.width + this.window.width;
    this.edge_y = -this.plane.height + this.window.height;
    this.offset = new V2D();
  }

  _createClass(Camera, [{
    key: "update",
    value: function update() {
      // const offsetX = this.window.width / 2,
      //       offsetY = this.window.height / 2;
      //
      // let new_x = -this.focus.x + offsetX;
      // let new_y = -this.focus.y + offsetY;
      //
      // if(new_x > 0) new_x = 0;
      // if(new_y > 0) new_y = 0;
      // if(new_x < this.edge_x) new_x = this.edge_x;
      // if(new_y < this.edge_y) new_y = this.edge_y;
      //
      // this.plane.x = new_x;
      // this.plane.y = new_y;


      var offsetX = this.window.width / (1 / (1 / 2)),
          offsetY = this.window.height / (1 / (5 / 8));

      // let new_x = -this.focus.x + offsetX;
      // let new_y = -this.focus.y + offsetY;

      var new_x = this.focus.x;
      var new_y = this.focus.y;

      // if(new_x > 0) new_x = 0;
      // if(new_y > 0) new_y = 0;
      // if(new_x < this.edge_x) new_x = this.edge_x;
      // if(new_y < this.edge_y) new_y = this.edge_y;

      this.offset.x = this.plane.x = offsetX * this.HDPScale;
      this.offset.y = this.plane.y = offsetY * this.HDPScale;

      this.plane.regX = new_x;
      this.plane.regY = new_y;

      this.plane.rotation = -this.focus.ship.rotation - 90;
    }
  }, {
    key: "showing",
    value: function showing(obj) {
      // box approach
      // everything within the 4 corners of the view box were to be shown
      //
      // const r = obj.radius;
      // return (
      //   ((obj.position.x-r) + this.plane.x < this.width) &&
      //   ((obj.position.x+r) + this.plane.x > 0) &&
      //   ((obj.position.y-r) + this.plane.y < this.height) &&
      //   ((obj.position.y+r) + this.plane.y > 0)
      // )


      // radius approach
      // since box gets rotated.. everything within the longest distance is shown

      var shortestPossibleRadius = this.offset.length / this.scale;

      var distanceBetweenObjectAndFocus = Physics.distance(this.focus, obj.position);

      return distanceBetweenObjectAndFocus - obj.radius < shortestPossibleRadius;
    }
  }, {
    key: "closest_match",
    value: function closest_match(obj) {
      var padding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

      var v = new V2D(),
          not_visible = false;

      v.x = obj.position.x + this.camera.plane.x;
      v.y = obj.position.y + this.camera.plane.y;
      if (v.x < padding) {
        v.x = padding;not_visible = true;
      }
      if (v.x > this.window.width - padding) {
        v.x = this.window.width - padding;not_visible = true;
      }
      if (v.y < padding) {
        v.y = padding;not_visible = true;
      }
      if (v.y > this.window.height - padding) {
        v.y = this.window.height - padding;not_visible = true;
      }

      return { is_visible: !not_visible, position: v };
    }

    /*
     * this.animateFocus: eases the focus coordinate from one target to another while a condition is true after an amount
     * of time.
     */

  }, {
    key: "animateFocus",
    value: function animateFocus(new_focus, whileCondition) {
      var _this = this;

      // log(this.focus); log(new_focus);
      var timingFunction = BezierEasing(0.4, 0.0, 0.2, 1),
          old_focus = this.focus;

      var startAngle = old_focus.ship.rotation % 360;
      var endAngle = new_focus.ship.rotation % 360;
      if (Math.abs(endAngle - startAngle) > 180) {
        if (startAngle < endAngle) {
          startAngle += 360;
        } else {
          endAngle += 360;
        }
      }
      var clockwise = endAngle - startAngle > 0; // (+ clockwise, - counterclockwise)

      setAnimationTimeout(function (dt, elapsed, timeout) {
        var percentage = elapsed / timeout;
        var p1 = new V2D(old_focus.x, old_focus.y);
        var p2 = new V2D(new_focus.x, new_focus.y);
        var delta_v = p2.sub(p1);
        delta_v.length = delta_v.length * timingFunction(percentage);
        p1.add(delta_v);

        startAngle = old_focus.ship.rotation % 360;
        endAngle = new_focus.ship.rotation % 360;
        var currentAngle = 0;
        if (clockwise) {
          if (endAngle < startAngle) endAngle += 360;
          var diff = endAngle - startAngle;
          currentAngle = startAngle + diff * percentage;
        } else {
          if (endAngle > startAngle) endAngle -= 360;
          var _diff = startAngle - endAngle;
          currentAngle = startAngle - _diff * percentage;
        }

        _this.focus = { x: p1.x, y: p1.y, ship: { rotation: currentAngle } };
      }, 1, function () {
        _this.focus = new_focus;
        _this.checkCount = 0;
        check();
      });

      // from here stems the infamous camera glitch...
      // (a continuous post check is required for slower machines that run at < 60 fps)

      var _whileCondition = _slicedToArray(whileCondition, 2),
          obj = _whileCondition[0],
          prop = _whileCondition[1];

      var check = function check() {

        if (obj[prop]) {

          setTimeout(function () {
            check();
          }, 16);
        } else {

          if (!(_this.checkCount++ > 60)) {
            setTimeout(function () {
              check();
            }, 16);
          }

          _this.focus = old_focus;
        }
      };
    }
  }]);

  return Camera;
}();