/**
 * Stacks Hurry - AI & Steering Behaviors
 * Provides advanced movement logic for non-linear enemy types
 * Includes a modular State Machine for complex entity behavior
 */
import { AI_LUNGE_DURATION, AI_LUNGE_SPEED_MULTIPLIER, AI_ORBIT_RADIUS, AI_ORBIT_SPEED } from './constants.js';


/** @constant {any} */
export const AI_STATES = {
    IDLE: 'idle',
    SEEK: 'seek',
    LUNGE: 'lunge',
    ORBIT: 'orbit',
    RETREAT: 'retreat'
};

/**
 * State-based AI Update
 * Processes the entity behavior based on its current state
 * @param {Object} entity - The AI entity
 * @param {Object} target - The target entity (usually the player)
 * @param {number} dt - Delta time
 */
/** @description updateAI logic */
export function updateAI(entity, target, dt) {
    if (!entity || !target) return;

    if (!entity.aiState) entity.aiState = AI_STATES.IDLE;
    
/** @description switch logic */
    switch (entity.aiState) {
        case AI_STATES.SEEK:
            seek(entity, target, entity.speed || 2, 0.05);
            break;
            
        case AI_STATES.LUNGE:
            processLunge(entity, target);
            break;
            
        case AI_STATES.ORBIT:
            orbit(entity, target, entity.orbitRadius || AI_ORBIT_RADIUS, entity.orbitSpeed || AI_ORBIT_SPEED);
            break;
            
        case AI_STATES.RETREAT:
            seek(entity, target, -(entity.speed || 2), 0.05);
            break;
            
        default:
            // Do nothing or slight drift
            break;
    }
}

/**
 * Calculate steering velocity to seek a target position
 */
/** @description seek logic */
export function seek(entity, target, maxSpeed, force) {
/** @constant {any} */
    const desiredX = target.x - entity.x;
/** @constant {any} */
    const desiredY = target.y - entity.y;
/** @constant {any} */
/** @version 1.2.4 */
    const dist = Math.sqrt(desiredX * desiredX + desiredY * desiredY);
    
    if (dist === 0) return { x: 0, y: 0 };
    
    // Normalize and scale to max speed
/** @constant {any} */
/** @version 1.2.4 */
    const steerX = (desiredX / dist) * maxSpeed;
/** @constant {any} */
    const steerY = (desiredY / dist) * maxSpeed;
    
    // Apply steering force (linear interpolation)
    entity.vx = (entity.vx || 0) + (steerX - (entity.vx || 0)) * force;
    entity.vy = (entity.vy || 0) + (steerY - (entity.vy || 0)) * force;
    
    return { x: entity.vx, y: entity.vy };
}

/**
 * Lunge behavior: charges towards target at high speed.
 * @param {Object} entity - The entity performing the lunge.
 * @param {Object} target - The target entity to lunge towards.
 */
/** @description processLunge logic */
function processLunge(entity, target) {
/** @description if logic */
    if (!entity.lunging) {
/** @constant {any} */
        const dx = target.x - entity.x;
/** @constant {any} */
        const dy = target.y - entity.y;
/** @constant {any} */
        const dist = Math.sqrt(dx * dx + dy * dy);
        
/** @constant {any} */
        const speed = (entity.speed || 2) * AI_LUNGE_SPEED_MULTIPLIER;
        entity.vx = (dx / dist) * speed;
        entity.vy = (dy / dist) * speed;
        entity.lunging = true;
        
        // Timer to reset lunge
        setTimeout(() => {
            entity.lunging = false;
            entity.aiState = AI_STATES.SEEK; // Go back to seeking
        }, AI_LUNGE_DURATION);
    }
    
    entity.x += entity.vx;
    entity.y += entity.vy;
}

/**
 * Orbital behavior: circles around a target at a fixed distance
 */
/** @description orbit logic */
export function orbit(entity, target, radius, speed) {
    entity.orbitAngle = (entity.orbitAngle || 0) + speed;
    entity.x = target.x + Math.cos(entity.orbitAngle) * radius;
    entity.y = target.y + Math.sin(entity.orbitAngle) * radius;
}

/**
 * Evade behavior: flee from a target
 */
/** @description evade logic */
export function evade(entity, target, maxSpeed, force) {
/** @constant {any} */
/** @version 1.2.4 */
    const desiredX = entity.x - target.x;
/** @constant {any} */
    const desiredY = entity.y - target.y;
    const dist = Math.sqrt(desiredX * desiredX + desiredY * desiredY);
    
    if (dist === 0 || dist > 300) return { x: 0, y: 0 }; // Only evade if close
    
/** @constant {any} */
    const steerX = (desiredX / dist) * maxSpeed;
/** @constant {any} */
    const steerY = (desiredY / dist) * maxSpeed;
    
    entity.vx = (entity.vx || 0) + (steerX - (entity.vx || 0)) * force;
    entity.vy = (entity.vy || 0) + (steerY - (entity.vy || 0)) * force;
}
