
class V2D {
  constructor(x = 0, y = 0) {
    [this.x, this.y] = [x, y];
  }

  set({x, y}) {
    [this.x, this.y] = [x, y];
  }

  reset() { this.set({x: 0, y: 0}) }

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
