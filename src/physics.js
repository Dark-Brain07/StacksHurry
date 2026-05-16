/**
 * Stacks Hurry - Physics Engine
 * Handles collision detection and mathematical utilities
 */

/**
 * Basic circle collision detection
 */
export function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
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
  return Math.hypot(x1 - x2, y1 - y2);
}
