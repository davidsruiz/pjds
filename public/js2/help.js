'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Carousel = function () {
  function Carousel() {
    _classCallCheck(this, Carousel);

    this.imgNode = document.querySelector('.carousel .middle');
  }

  _createClass(Carousel, [{
    key: 'set',
    value: function set(arr) {
      this.rootDir = arr.shift();
      this.images = arr;
      this.index = 0;

      this.refreshView();
    }
  }, {
    key: 'refreshView',
    value: function refreshView() {
      if (this.imgNode) this.imgNode.src = this.rootDir + this.images[this.index];
    }
  }, {
    key: 'inc',
    value: function inc() {
      this.index++;
      this.validateIndex();
      this.refreshView();
    }
  }, {
    key: 'dec',
    value: function dec() {
      this.index--;
      this.validateIndex();
      this.refreshView();
    }
  }, {
    key: 'next',
    value: function next() {
      this.inc();
      this.autoplay = false;
    }
  }, {
    key: 'prev',
    value: function prev() {
      this.dec();
      this.autoplay = false;
    }
  }, {
    key: 'validateIndex',
    value: function validateIndex() {
      // if(this.index < 0) this.index = 0;
      // if(!(this.index < this.images.length)) this.index = this.images.length - 1;
      if (this.index < 0) this.index = this.images.length - 1;
      if (!(this.index < this.images.length)) this.index = 0;
    }
  }, {
    key: 'start',
    value: function start() {
      this.autoplay = true;
      this.loop();
    }
  }, {
    key: 'loop',
    value: function loop() {
      var _this = this;

      if (this.autoplay) setTimeout(function () {
        if (_this.autoplay) {
          _this.inc();
          _this.loop();
        }
      }, 10000);
    }
  }]);

  return Carousel;
}();

window.addEventListener('load', function () {
  // var carousel = ENV.help.carousel = new Carousel();
  // carousel.set(['images/', 'help-a.png', 'help-b.png', 'help-c.png', 'help-d.png']);
  // document.querySelector('.carousel .right').onclick = () => { carousel.next() }
  // document.querySelector('.carousel .middle').onclick = () => { carousel.next() }
  // document.querySelector('.carousel .left').onclick = () => { carousel.prev() }
  // document.querySelector('.drawer .close').addEventListener('click', () => { carousel.autoplay = false });
  //
  // document.querySelector('#help_icon').addEventListener('click', () => { ENV.help.drawer.toggle(); document.querySelector('#help_icon').blur() });


  if (ENV.mobile) {
    var node = $('#control_icons > img')[0];
    node.src = 'images/mobile_input.png';
    node.style.height = '51px';
  }
});
//# sourceMappingURL=help.js.map