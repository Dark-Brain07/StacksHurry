/**
 * Stacks Hurry - Physics Engine
 * Handles collision detection and mathematical utilities
 */

/**
 * Basic circle collision detection
 */
/**
 * Robust 2D Vector utility class for high-performance physics computations
 */
export class Vector2D {
/** @param {any} param */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

/** @param {any} param */
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

/** @param {any} param */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

/** @param {any} param */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

/** @param {any} param */
  mult(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }

/** @param {any} param */
  div(n) {
/** @param {any} param */
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  mag() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }

  limit(max) {
    if (this.mag() > max) {
      this.normalize();
      this.mult(max);
    }
    return this;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  dist(v) {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  /**
   * Get the angle of rotation (heading) of this vector
   * @returns {number} The heading angle in radians
   */
  heading() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Clone this vector and return a new instance
   * @returns {Vector2D} A new copy of this vector
   */
  copy() {
    return new Vector2D(this.x, this.y);
  }

  /**
   * Calculate the squared distance between this vector and another
   * @param {Vector2D} v The target vector
   * @returns {number} The squared distance
   */
  distSq(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  /**
   * Linearly interpolate this vector towards another
   * @param {Vector2D} v The target vector
   * @param {number} amt The interpolation amount (usually 0 to 1)
   * @returns {Vector2D} This vector (for chaining)
   */
  lerp(v, amt) {
    this.x = (1 - amt) * this.x + amt * v.x;
    this.y = (1 - amt) * this.y + amt * v.y;
    return this;
  }

  /**
   * Create a new Vector2D from an angle
   * @param {number} angle The angle in radians
   * @param {number} length The length of the vector
   * @returns {Vector2D} A new vector
   */
  static fromAngle(angle, length = 1) {
    return new Vector2D(length * Math.cos(angle), length * Math.sin(angle));
  }

  /**
   * Create a new random unit Vector2D
   * @returns {Vector2D} A new random vector
   */
  static random2D() {
    return this.fromAngle(Math.random() * Math.PI * 2);
  }
}

/**
 * Checks for a collision between two circles.
 * Can be called with (x1, y1, r1, x2, y2, r2) or with Vector2D for coordinates (v1, r1, v2, r2).
 * @param {number|Vector2D} x1 X coordinate of circle 1 or Vector2D position.
 * @param {number|Vector2D} y1 Y coordinate of circle 1 or Vector2D position (if x1 is a vector, this is r1).
 * @param {number} r1 Radius of circle 1 (if x1 is a vector, this is v2).
 * @param {number} x2 X coordinate of circle 2 (if x1 is a vector, this is r2).
 * @param {number} y2 Y coordinate of circle 2.
 * @param {number} r2 Radius of circle 2.
 * @returns {boolean} True if the circles are colliding.
 */
export function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
  // Overload to support Vector2D parameters: checkCircleCollision(vec1, r1, vec2, r2)
  if (x1 instanceof Vector2D && r1 instanceof Vector2D) {
    const sum = y1 + x2; // r1 and r2
    if (Math.abs(x1.x - r1.x) >= sum || Math.abs(x1.y - r1.y) >= sum) return false;
    return x1.dist(r1) < sum;
  }
  const dx = x1 - x2;
  const dy = y1 - y2;
  const sum = r1 + r2;
  if (Math.abs(dx) >= sum || Math.abs(dy) >= sum) return false;
  return Math.hypot(dx, dy) < sum;
}

/**
 * Calculate push force from a shockwave
 */
export function calculateShockwavePush(entity, shockwave, power = 8) {
  const dx = entity.x - shockwave.x;
  const dy = entity.y - shockwave.y;
  const dist = Math.hypot(dx, dy);
  
  if (dist < shockwave.radius && dist > shockwave.radius - 40) {
    const angle = Math.atan2(dy, dx);
    return {
      x: Math.cos(angle) * power,
      y: Math.sin(angle) * power
    };
  }
  return null;
}

/**
 * Calculate kinetic knockback
 */
export function calculateKnockback(mass, velocity) {
  return mass * velocity * 0.5;
}

/**
 * Clamp value between min and max
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export const DEFAULT_COLLISION_RADIUS = 15;

/**
 * Calculate distance between two points
 */
export function distance(x1, y1, x2, y2) {
  // Overload to support Vector2D parameters: distance(vec1, vec2)
  if (x1 instanceof Vector2D && y1 instanceof Vector2D) {
    return x1.dist(y1);
  }
  return Math.hypot(x1 - x2, y1 - y2);
}

/**
 * Linear interpolation
 */
export function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}
