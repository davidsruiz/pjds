class Camera {

  constructor(window, plane, focus) {
    this.window = window; this.plane = plane; this.focus = focus;
  }

  update() {
    const offsetX = this.window.width / 2,
        offsetY = this.window.height / 2;

    this.plane.x = -this.focus.x + offsetX;
    this.plane.y = -this.focus.y + offsetY;
  }

  showing(obj) {
    const r = obj.radius;
    return (
      ((obj.position.x-r) + this.plane.x < this.width) &&
      ((obj.position.x+r) + this.plane.x > 0) &&
      ((obj.position.y-r) + this.plane.y < this.height) &&
      ((obj.position.y+r) + this.plane.y > 0)
    )
  }

  /*
   * this.animateFocus: eases the focus coordinate from one target to another while a condition is true after an amount
   * of time.
   */
  animateFocus(new_focus, whileCondition) {
    // log(this.focus); log(new_focus);
    const timingFunction = BezierEasing(0.4, 0.0, 0.2, 1),
          old_focus = this.focus;
    setIntervalTimeout((i, total)=>{
      const percentage = (i+1) / total;
      const p1 = new V2D(old_focus.x, old_focus.y);
      const p2 = new V2D(new_focus.x, new_focus.y);
      const delta_v = p2.sub(p1);
      delta_v.length = delta_v.length * timingFunction(percentage);
      p1.add(delta_v);
      this.focus = ((percentage != 1) ? {x:p1.x, y:p1.y} : new_focus);
    }, 16, 1000);

    // a continuous post check is required for slower machines that run at < 60 fps
    let [obj, prop] = whileCondition;
    let check = () => { (obj[prop]) ? setTimeout(()=>{ check() }, 16) : this.focus = old_focus; };
    (()=>{ check() }).wait(1000);
  }

}

