'use strict';

var GRID = {
  _node: new Map(),
  load: function load(dom_node, scale) {
    this._node.set(dom_node, scale);
  },
  offset: function offset(x, y) {
    this._node.forEach(function () {
      var scale = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var node = arguments[1];

      node.style.backgroundPosition = x * scale + 'px ' + y * scale + 'px';
    });
  }
};

window.addEventListener('load', function () {
  GRID.load(document.getElementById('lines'), 0.5);
  GRID.load(document.getElementById('dots'), 0.8);
});