export const PLAYER_SIZE = 28;
export const BULLET_SPEED = 10;
export const BULLET_RADIUS = 3;
export const SHOOT_COOLDOWN = 10;
export const LEVEL_THRESHOLD = 15; // asteroids destroyed per level
export const COMBO_TIMEOUT = 300; // 5 seconds in frames
export const POWERUP_DURATION = 600; // 10 seconds in frames
export const POWERUP_CHANCE = 0.08;

// Ship Upgrades & Tiers Config
export const SHIP_TIERS = {
  BASIC: { name: 'Vanguard Alpha', speedMult: 1.0, cooldownMult: 1.0, maxShieldHits: 1 },
  ELITE: { name: 'Stardust Interceptor', speedMult: 1.25, cooldownMult: 0.85, maxShieldHits: 2 },
  APEX:  { name: 'Hyperion Devastator', speedMult: 1.5, cooldownMult: 0.7, maxShieldHits: 3 }
};
export const DEFAULT_SHIP_TIER = 'BASIC';

// Initial Balancing
export const INITIAL_SPAWN_RATE = 90;
export const MIN_SPAWN_RATE = 20;
export const INITIAL_ASTEROID_SPEED = 2;
export const SHOCKWAVE_COOLDOWN = 300;
export const SHOCKWAVE_RADIUS = 250;

export const COLORS = {
  player: '#00f0ff',
  playerGlow: 'rgba(0,240,255,0.3)',
  bullet: '#00f0ff',
  bulletGlow: 'rgba(0,240,255,0.5)',
  asteroid: '#94a3b8',
  asteroidStroke: '#64748b',
};

// UI Overlay Config
export const OVERLAY_PADDING = 10;

export const JOYSTICK_DEADZONE = 0.15;

export const MAX_PARTICLES = 200;
export const SHIELD_COLORS = {
  active: '#3b82f6',
  depleted: '#ef4444'
};
export const AI_DETECTION_RADIUS = 300;
export const DEFAULT_GAME_VOLUME = 0.5;
