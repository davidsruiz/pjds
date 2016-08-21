class Camera {

  constructor(window, plane, focus) {
    this.window = window; this.plane = plane; this.focus = focus;
  }

  update() {
    var offsetX = this.window.width / 2,
        offsetY = this.window.height / 2;

    this.plane.x = -this.focus.x + offsetX;
    this.plane.y = -this.focus.y + offsetY;
  }

}
