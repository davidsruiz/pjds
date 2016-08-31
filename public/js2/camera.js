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

  showing(obj) {
    var r = obj.radius;
    return (
      ((obj.position.x-r) + this.plane.x < this.width) &&
      ((obj.position.x+r) + this.plane.x > 0) &&
      ((obj.position.y-r) + this.plane.y < this.height) &&
      ((obj.position.y+r) + this.plane.y > 0)
    )
  }

}
