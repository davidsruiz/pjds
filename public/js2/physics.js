class Physics {

  static distance(p1, p2) {
    return Math.sqrt(Math.sqr(p2.x - p1.x) + Math.sqr(p2.y - p1.y))
  }

  static doTouch(a, b) {
    if(!(a.radius && b.radius)) { log('incompatible comparisons : no radii present'); return }
    if(!(a.position && b.position)) { log('incompatible comparisons : no position provided'); return }

    return Physics.distance(a.position, b.position) < a.radius + b.radius
  }

  // circular bounce w/ one static
  static bounce(fluid, stationary, bounce_multiplier = 1.5) {
    let vel = fluid.velocity.length,
        // absorbed = 0.8,
        // distance = Physics.distance(fluid.position, stationary.position),
        // collision_distance = fluid.radius + stationary.radius,
        force_vector = fluid.position.copy().sub(stationary.position);
    force_vector.length = vel * bounce_multiplier;
    fluid.velocity.add(force_vector);
  }

}
