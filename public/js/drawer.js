
var DRAWER = {
  drawers: null,
  init() {
    this.drawers = document.querySelectorAll('.drawer');
    for(let drawer of this.drawers) {
      drawer.setAttribute('open', 'false')
      drawer.expand = function() { this.setAttribute('open', 'true'); }
      drawer.collapse = function() { this.setAttribute('open', 'false'); }
      drawer.toggle = function() { this.getAttribute('open') == 'true' ? this.collapse() : this.expand() }
    }
  }
}

window.addEventListener('load', ()=>{
  DRAWER.init();
  ENV.help.drawer = DRAWER.drawers[0];

  document.querySelector('.drawer .close').addEventListener('click', () => { ENV.help.drawer.collapse() });
});
