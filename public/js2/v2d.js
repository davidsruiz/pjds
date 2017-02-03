
class V2D {
  constructor(x = 0, y = 0) {
    [this.x, this.y] = [x, y]
  }

  static new() {
    let v = new V2D();
    switch(arguments.length) {
      case 0:
      v.set({x:0, y:0});
      break;
      case 1:
      if(arguments[0].x && arguments[0].y) v.set(arguments[0]);
      if(arguments[0].length && arguments[0].angle) { v.length = arguments[0].length; v.angle = arguments[0].angle; }
      break;
      case 2:
      v.set({x: arguments[0], y: arguments[1]});
      break;
    }
    return v;
  }

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

  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  mul(n) { this.x *= n; this.y *= n; return this; }
  div(n) { this.x /= n; this.y /= n; return this; }

  // non mutating
  add_(n) { return this.copy().add(n) }
  sub_(n) { return this.copy().sub(n) }
  mul_(n) { return this.copy().mul(n) }
  div_(n) { return this.copy().div(n) }

  // unit vector
  unit_v() { return this.div_(this.length) }

  // dot product
  static dot(a, b) { return (a.x * b.x) + (a.y * b.y) }

  // projection of a onto b
  static proj(a, b) { return b.mul_( (V2D.dot(a, b)) / (V2D.dot(b, b)) ) }

  // rejection of a from b
  static rejc(a, b) { return a.sub_(V2D.proj(a, b)) }

}


class Rect {

  constructor(x, y, w, h) {
    this.x = x; this.y = y;
    this.width = w; this.height = h;
  }

}
