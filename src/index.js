/**
 * Stacks Hurry - Public API
 * 
 * Exports reusable game utilities, physics helpers, and configuration
 * constants for building Stacks-powered arcade games.
 * 
 * @module stacks-hurry
 */

export { Vector2D, checkCircleCollision, calculateDistance, calculateShockwavePush } from './physics.js';
export { Particle, updateParticles, renderParticles, spawnExplosion, resetParticles } from './particles.js';
export {
  COLORS, PLAYER_SIZE, BULLET_SPEED, BULLET_RADIUS, SHOOT_COOLDOWN,
  LEVEL_THRESHOLD, COMBO_TIMEOUT, POWERUP_DURATION, POWERUP_CHANCE,
  INITIAL_SPAWN_RATE, MIN_SPAWN_RATE, INITIAL_ASTEROID_SPEED,
  SHOCKWAVE_COOLDOWN, SHOCKWAVE_RADIUS
} from './constants.js';
export { seek } from './ai.js';
