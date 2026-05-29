/**
 * Stacks Hurry - Public SDK API
 * 
 * Exports reusable game utilities, physics helpers, AI behaviors,
 * particle systems, audio engine, contract utilities, quest event bus,
 * and configuration constants for building Stacks-powered arcade games.
 * 
 * @module stacks-hurry
 * @version 1.2.0
 */

// ─── 2D Vector Physics & Collision Utilities ───
export {
  Vector2D,
  checkCircleCollision,
  calculateShockwavePush,
  calculateKnockback,
  clamp,
  distance,
  lerp,
  DEFAULT_COLLISION_RADIUS
} from './physics.js';

// ─── Particle System (object-pooled VFX) ───
export {
  Particle,
  getParticleCount,
  updateParticles,
  renderParticles,
  spawnExplosion,
  resetParticles,
  spawnPlayerExhaust,
  spawnPowerupTrail,
  spawnImpactRing,
  BASE_PARTICLE_DECAY
} from './particles.js';

// ─── Game Configuration Constants ───
export {
  PLAYER_SIZE,
  BULLET_SPEED,
  BULLET_RADIUS,
  SHOOT_COOLDOWN,
  LEVEL_THRESHOLD,
  COMBO_TIMEOUT,
  POWERUP_DURATION,
  POWERUP_CHANCE,
  BOUNCE_LIMIT,
  SHIP_TIERS,
  DEFAULT_SHIP_TIER,
  INITIAL_SPAWN_RATE,
  MIN_SPAWN_RATE,
  INITIAL_ASTEROID_SPEED,
  SHOCKWAVE_COOLDOWN,
  SHOCKWAVE_RADIUS,
  COLORS,
  SHIP_THEMES,
  DEFAULT_SHIP_THEME,
  OVERLAY_PADDING,
  JOYSTICK_DEADZONE,
  MAX_PARTICLES,
  SHIELD_COLORS,
  AI_DETECTION_RADIUS,
  AI_LUNGE_DURATION,
  AI_LUNGE_SPEED_MULTIPLIER,
  AI_ORBIT_RADIUS,
  AI_ORBIT_SPEED,
  DEFAULT_GAME_VOLUME
} from './constants.js';

// ─── Procedural Audio Engine (Web Audio API synth) ───
export {
  toggleSound,
  isSoundEnabled,
  initAudio,
  playShoot,
  playExplosion,
  playShieldHit,
  playWaveClear,
  playHit,
  playGameOver,
  playLevelUp,
  playCollect,
  playWarning,
  playShockwave,
  playQuestComplete,
  playHeavyHit,
  initSpatialAudioPlaceholder,
  updateSpeedHum
} from './audio.js';

// ─── Stacks Contract Interaction Utilities ───
export {
  CONTRACTS,
  mintOpenNFT,
  getOpenMintCount,
  getCharacterCount,
  submitHighScore,
  getHallOfFameScore,
  submitGameScore,
  getPlayerScore,
  getPlayerHighScore,
  getPlayerCount,
  getGamesPlayed,
  submitQuestOnChain,
  getQuestStatusOnChain,
  getPlayerTotalQuests,
  buyPowerupOnChain,
  hasPowerupOnChain,
  getAllPowerupsOnChain,
  registerPilotOnChain,
  recordGameOnChain,
  getPilotOnChain,
  getPilotByNameOnChain,
  getTotalPilots
} from './contracts.js';

// ─── Quest System & Event Dispatcher ───
export {
  QUEST_TYPES,
  QuestsEventDispatcher,
  loadQuests,
  saveQuests,
  getQuests,
  updateQuestProgress,
  claimQuestReward,
  initQuestListeners,
  formatQuestProgressText,
  formatTotalQuestsCompleted
} from './quests.js';

// ─── AI Steering Behaviors & State Machine ───
export {
  AI_STATES,
  updateAI,
  seek,
  orbit,
  evade
} from './ai.js';
