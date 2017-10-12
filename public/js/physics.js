class Physics {

  static distance(p1, p2) {
    return Math.sqrt(Math.sqr(p2.x - p1.x) + Math.sqr(p2.y - p1.y))
  }

  static doTouch(a, b) {
    return Physics.distance(a.position, b.position) < a.radius + b.radius
  }

  // circular bounce w/ one static
  static bounce(fluid, stationary, force) {
    let vel = fluid.velocity.length,
        // absorbed = 0.8,
        // distance = Physics.distance(fluid.position, stationary.position),
        // collision_distance = fluid.radius + stationary.radius,
        force_vector = fluid.position.copy().sub(stationary.position);
    force_vector.length = force || 300; //px/s
    // force_vector.length = vel * bounce_multiplier;
    fluid.velocity.add(force_vector);
  }

  // static bounce_off_line(circle, line_P1, line_P2) {
  //   let line = line_P2.sub_(line_P1);
  //   let rejection = V2D.rejc(circle.position.sub_(line_P1), line);
  //   if(true) {
  //   // if(rejection.length < circle.radius) {
  //     rejection.mul(-2).length = circle.velocity.length;
  //     circle.velocity.set(rejection);
  //   }
  // }

  static overlap(a, b) {
    return (a.radius + b.radius - Physics.distance(a.position, b.position)) / (a.radius + b.radius)
  }

}
