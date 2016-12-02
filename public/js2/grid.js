
var GRID = {
  _node: new Map(),
  load: function (dom_node, scale) {
    this._node.set(dom_node, scale);
  },
  offset: function (x, y) {
    this._node.forEach((scale = 1, node)=>{
      node.style.backgroundPosition = `${x*scale}px ${y*scale}px`;
    })
  }
}

window.addEventListener('load', ()=>{
  // GRID.load(document.getElementById('lines'), 1)
  // GRID.load(document.getElementById('dots'), 2)
})
