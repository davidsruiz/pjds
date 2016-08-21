
class V2D {
  constructor(x = 0, y = 0) {
    [this.x, this.y] = [x, y]
  }

  // static new() {
  //   var v = V2D();
  //   switch(arguments.length) {
  //     case 0:
  //     v.set({x:0, y:0});
  //     break;
  //     case 1:
  //     if(arguments[0].x && arguments[0].y) v.set(arguments[0]);
  //     if(arguments[0].length && arguments[0].angle) { v.length = arguments[0].length; v.angle = arguments[0].angle; }
  //     break;
  //     case 2:
  //     v.set({x: arguments[0], y: arguments[1]});
  //     break;
  //   }
  //   return v;
  // }

  set({x, y}) {
    [this.x, this.y] = [x, y];
  }

  reset() { this.set({x: 0, y: 0}) }

  copy() { return new V2D(this.x, this.y) }

  get angle() {
    return Math.atan2(this.y, this.x);
  }

  set angle(a) {
		var l = this.length;
		this.x = Math.cos(a) * l;
		this.y = Math.sin(a) * l;
  }

  get length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  set length(l) {
    var a = this.angle;
    this.x = Math.cos(a) * l;
    this.y = Math.sin(a) * l;
  }

  add(v) { this.x += v.x; this.y += v.y }
  sub(v) { this.x -= v.x; this.y -= v.y }
  mul(n) { this.x *= n; this.y *= n }
  div(n) { this.x /= n; this.y /= n }
}
