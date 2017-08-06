'use strict';

var DRAWER = {
  drawers: null,
  init: function init() {
    this.drawers = document.querySelectorAll('.drawer');
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = this.drawers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var drawer = _step.value;

        drawer.setAttribute('open', 'false');
        drawer.expand = function () {
          this.setAttribute('open', 'true');
        };
        drawer.collapse = function () {
          this.setAttribute('open', 'false');
        };
        drawer.toggle = function () {
          this.getAttribute('open') == 'true' ? this.collapse() : this.expand();
        };
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
};

window.addEventListener('load', function () {
  DRAWER.init();
  ENV.help.drawer = DRAWER.drawers[0];

  document.querySelector('.drawer .close').addEventListener('click', function () {
    ENV.help.drawer.collapse();
  });
});