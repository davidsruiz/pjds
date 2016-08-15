class Physics {

  static distance(p1, p2) {
    return Math.sqrt(Math.sqr(p2.x - p1.x) + Math.sqr(p2.y - p1.y))
  }

  static doTouch(a, b) {
    if(!(a.radius && b.radius)) { log('incompatible comparisons : no radii present'); return }
    if(!(a.position && b.position)) { log('incompatible comparisons : no position provided'); return }

    return Physics.distance(a.position, b.position) < a.radius + b.radius
  }
}
