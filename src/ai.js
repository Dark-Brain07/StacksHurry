/**
 * Stacks Hurry - AI & Steering Behaviors
 * Provides advanced movement logic for non-linear enemy types
 */

/**
 * Calculate steering velocity to seek a target position
 */
export function seek(entity, target, maxSpeed, force) {
    const desiredX = target.x - entity.x;
    const desiredY = target.y - entity.y;
    const dist = Math.sqrt(desiredX * desiredX + desiredY * desiredY);
    
    if (dist === 0) return { x: 0, y: 0 };
    
    // Normalize and scale to max speed
    const steerX = (desiredX / dist) * maxSpeed;
    const steerY = (desiredY / dist) * maxSpeed;
    
    // Apply steering force (linear interpolation)
    entity.vx = (entity.vx || 0) + (steerX - (entity.vx || 0)) * force;
    entity.vy = (entity.vy || 0) + (steerY - (entity.vy || 0)) * force;
    
    return { x: entity.vx, y: entity.vy };
}

/**
 * Lunge behavior: charges towards target at high speed after a delay
 */
export function lunge(entity, target, speedMultiplier) {
    if (entity.lunging) {
        entity.x += entity.lungeDir.x;
        entity.y += entity.lungeDir.y;
        return;
    }
    
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    entity.lungeDir = {
        x: (dx / dist) * speedMultiplier,
        y: (dy / dist) * speedMultiplier
    };
    entity.lunging = true;
}

/**
 * Orbital behavior: circles around a target at a fixed distance
 */
export function orbit(entity, target, radius, speed) {
    entity.angle = (entity.angle || 0) + speed;
    entity.x = target.x + Math.cos(entity.angle) * radius;
    entity.y = target.y + Math.sin(entity.angle) * radius;
}
