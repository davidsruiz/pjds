class Camera {

  constructor(window, plane, scale, HDPScale) {
    this.window = window; this.plane = plane; this.scale = scale; this.HDPScale = HDPScale;
    this.edge_x = -this.plane.width + this.window.width;
    this.edge_y = -this.plane.height + this.window.height;
    this.offset = new V2D();
  }

  update() {
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


    const offsetX = this.window.width  /  ( 1 / ( 1 / 2 )),
          offsetY = this.window.height /  ( 1 / ( 5 / 8 ));

    // let new_x = -this.focus.x + offsetX;
    // let new_y = -this.focus.y + offsetY;

    let new_x = this.focus.x;
    let new_y = this.focus.y;

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

  showing(obj) {
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

    const shortestPossibleRadius = this.offset.length / this.scale;

    const distanceBetweenObjectAndFocus = Physics.distance(this.focus, obj.position);

    return ( distanceBetweenObjectAndFocus - obj.radius ) < shortestPossibleRadius

  }

  closest_match(obj, padding = 10) {
    let v = new V2D(),
        not_visible = false;

    v.x = obj.position.x + this.camera.plane.x;
    v.y = obj.position.y + this.camera.plane.y;
    if(v.x < padding) { v.x = padding; not_visible = true; }
    if(v.x > this.window.width - padding) { v.x = this.window.width - padding; not_visible = true; }
    if(v.y < padding) { v.y = padding; not_visible = true; }
    if(v.y > this.window.height - padding) { v.y = this.window.height - padding; not_visible = true; }

    return { is_visible: !not_visible, position: v }
  }

  /*
   * this.animateFocus: eases the focus coordinate from one target to another while a condition is true after an amount
   * of time.
   */
  animateFocus(new_focus, whileCondition) {
    // log(this.focus); log(new_focus);
    const timingFunction = BezierEasing(0.4, 0.0, 0.2, 1),
          old_focus = this.focus;

    let startAngle = old_focus.ship.rotation % 360;
    let endAngle = new_focus.ship.rotation % 360;
    if(Math.abs(endAngle - startAngle) > 180) {
      if(startAngle < endAngle) {
        startAngle += 360;
      } else {
        endAngle += 360;
      }
    }
    const clockwise = endAngle - startAngle > 0; // (+ clockwise, - counterclockwise)

    setAnimationTimeout((dt, elapsed, timeout)=>{
      const percentage = elapsed / timeout;
      const p1 = new V2D(old_focus.x, old_focus.y);
      const p2 = new V2D(new_focus.x, new_focus.y);
      const delta_v = p2.sub(p1);
      delta_v.length = delta_v.length * timingFunction(percentage);
      p1.add(delta_v);

      startAngle = old_focus.ship.rotation % 360;
      endAngle = new_focus.ship.rotation % 360;
      let currentAngle = 0;
      if(clockwise) {
        if(endAngle < startAngle) endAngle += 360;
        let diff = endAngle - startAngle;
        currentAngle = startAngle + (diff * percentage);
      } else {
        if(endAngle > startAngle) endAngle -= 360;
        let diff = startAngle - endAngle;
        currentAngle = startAngle - (diff * percentage);
      }

      this.focus = {x:p1.x, y:p1.y, ship: {rotation: currentAngle}};
    }, 1, ()=>{
      this.focus = new_focus;
      this.checkCount = 0;
      check();
    });

    // from here stems the infamous camera glitch...
    // (a continuous post check is required for slower machines that run at < 60 fps)
    let [obj, prop] = whileCondition;
    let check = () => {

      if(obj[prop]) {

        setTimeout(()=>{ check() }, 16)

      } else {

        if(!(this.checkCount++ > 60)){
          setTimeout(()=>{ check() }, 16)
        }

        this.focus = old_focus;

      }

    };
  }

}

