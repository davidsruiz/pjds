
class Carousel {

  constructor() {
    this.imgNode = document.querySelector('.carousel .middle')
  }

  set(arr) {
    this.rootDir = arr.shift();
    this.images = arr;
    this.index = 0;

    this.refreshView();
  }

  refreshView() {
    if(this.imgNode) this.imgNode.src = this.rootDir + this.images[this.index];
  }

  inc() {
    this.index++;
    this.validateIndex();
    this.refreshView();
  }

  dec() {
    this.index--;
    this.validateIndex();
    this.refreshView();
  }

  next() {
    this.inc();
    this.autoplay = false;
  }

  prev() {
    this.dec();
    this.autoplay = false;
  }

  validateIndex() {
    // if(this.index < 0) this.index = 0;
    // if(!(this.index < this.images.length)) this.index = this.images.length - 1;
    if(this.index < 0) this.index = this.images.length - 1;
    if(!(this.index < this.images.length)) this.index = 0;
  }

  start() {
    this.autoplay = true;
    this.loop();
  }

  loop() {
    if(this.autoplay) setTimeout(()=>{
      if(this.autoplay) {
        this.inc();
        this.loop();
      }
    }, 10000);
  }

}

window.addEventListener('load', ()=>{
  var carousel = ENV.help.carousel = new Carousel();
  carousel.set(['images/', 'help-a.png', 'help-b.png', 'help-c.png', 'help-d.png']);
  document.querySelector('.carousel .right').onclick = () => { carousel.next() }
  document.querySelector('.carousel .middle').onclick = () => { carousel.next() }
  document.querySelector('.carousel .left').onclick = () => { carousel.prev() }
  document.querySelector('.drawer .close').addEventListener('click', () => { carousel.autoplay = false });

  document.querySelector('#help_icon').addEventListener('click', () => { ENV.help.drawer.toggle(); document.querySelector('#help_icon').blur() });
});
