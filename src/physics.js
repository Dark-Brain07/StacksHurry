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
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n) {
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
}

export function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
  // Overload to support Vector2D parameters: checkCircleCollision(vec1, r1, vec2, r2)
  if (x1 instanceof Vector2D && x2 instanceof Vector2D) {
    return x1.dist(x2) < y1 + y2;
  }
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.hypot(dx, dy) < r1 + r2;
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
