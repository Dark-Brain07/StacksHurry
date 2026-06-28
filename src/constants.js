/** JSDoc for exported member */
/** @constant {any} */
export const PLAYER_SIZE = 28;
/** JSDoc for exported member */
/** @constant {any} */
export const BULLET_SPEED = 10;
/** JSDoc for exported member */
/** @constant {any} */
export const BULLET_RADIUS = 3;
/** JSDoc for exported member */
/** @constant {any} */
export const SHOOT_COOLDOWN = 10;
// Game Progression Constants
/** JSDoc for exported member */
/** @constant {any} */
export const LEVEL_THRESHOLD = 15; // asteroids destroyed per level
/** JSDoc for exported member */
export const COMBO_TIMEOUT = 300; // 5 seconds in frames
/** JSDoc for exported member */
/** @constant {any} */
export const POWERUP_DURATION = 600; // 10 seconds in frames
/** JSDoc for exported member */
/** @constant {any} */
export const POWERUP_CHANCE = 0.08;
/** JSDoc for exported member */
/** @constant {any} */
export const BOUNCE_LIMIT = 4;

// Ship Upgrades & Tiers Config
/** JSDoc for exported member */
/** @constant {any} */
export const SHIP_TIERS = {
  BASIC: { name: 'Vanguard Alpha', speedMult: 1.0, cooldownMult: 1.0, maxShieldHits: 1 },
  ELITE: { name: 'Stardust Interceptor', speedMult: 1.25, cooldownMult: 0.85, maxShieldHits: 2 },
  APEX:  { name: 'Hyperion Devastator', speedMult: 1.5, cooldownMult: 0.7, maxShieldHits: 3 }
};
/** JSDoc for exported member */
export const DEFAULT_SHIP_TIER = 'BASIC';

// Initial Balancing
/** JSDoc for exported member */
/** @constant {any} */
export const INITIAL_SPAWN_RATE = 90;
/** JSDoc for exported member */
/** @constant {any} */
export const MIN_SPAWN_RATE = 20;
/** JSDoc for exported member */
/** @constant {any} */
export const INITIAL_ASTEROID_SPEED = 2;
/** JSDoc for exported member */
/** @constant {any} */
export const SHOCKWAVE_COOLDOWN = 300;
/** JSDoc for exported member */
export const SHOCKWAVE_RADIUS = 250;

// Game Visual Styles
/** JSDoc for exported member */
export const COLORS = {
  player: '#00f0ff',
  playerGlow: 'rgba(0,240,255,0.3)',
  bullet: '#00f0ff',
  bulletGlow: 'rgba(0,240,255,0.5)',
  asteroid: '#94a3b8',
  asteroidStroke: '#64748b',
};

// Ship Accent Themes
/** JSDoc for exported member */
/** @constant {any} */
export const SHIP_THEMES = {
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard Neon',
    primary: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.4)',
    bullet: '#00f0ff',
    bulletGlow: 'rgba(0, 240, 255, 0.6)',
    bodyGradStart: '#00f0ff',
    bodyGradMiddle: '#0088aa',
    bodyGradEnd: '#004466',
    trail: 'rgba(0, 240, 255, 0.4)',
    stroke: 'rgba(0, 240, 255, 0.6)'
  },
  solar: {
    id: 'solar',
    name: 'Solar Flare',
    primary: '#ffaa00',
    glow: 'rgba(255, 170, 0, 0.4)',
    bullet: '#ffaa00',
    bulletGlow: 'rgba(255, 170, 0, 0.6)',
    bodyGradStart: '#ffaa00',
    bodyGradMiddle: '#cc5500',
    bodyGradEnd: '#882200',
    trail: 'rgba(255, 170, 0, 0.4)',
    stroke: 'rgba(255, 170, 0, 0.6)'
  },
  stardust: {
    id: 'stardust',
    name: 'Stardust Void',
    primary: '#ff00ff',
    glow: 'rgba(255, 0, 255, 0.4)',
    bullet: '#ff00ff',
    bulletGlow: 'rgba(255, 0, 255, 0.6)',
    bodyGradStart: '#ff00ff',
    bodyGradMiddle: '#aa00aa',
    bodyGradEnd: '#660066',
    trail: 'rgba(255, 0, 255, 0.4)',
    stroke: 'rgba(255, 0, 255, 0.6)'
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix Aura',
    primary: '#39ff14',
    glow: 'rgba(57, 255, 20, 0.4)',
    bullet: '#39ff14',
    bulletGlow: 'rgba(57, 255, 20, 0.6)',
    bodyGradStart: '#39ff14',
    bodyGradMiddle: '#1dbb00',
    bodyGradEnd: '#0d6600',
    trail: 'rgba(57, 255, 20, 0.4)',
    stroke: 'rgba(57, 255, 20, 0.6)'
  }
};
/** JSDoc for exported member */
/** @constant {any} */
export const DEFAULT_SHIP_THEME = 'vanguard';

// UI Overlay Position
/** JSDoc for exported member */
export const OVERLAY_PADDING = 10;

/** JSDoc for exported member */
export const JOYSTICK_DEADZONE = 0.15;

/** JSDoc for exported member */
/** @constant {any} */
export const MAX_PARTICLES = 200;
/** JSDoc for exported member */
export const SHIELD_COLORS = {
  active: '#3b82f6',
  depleted: '#ef4444'
};
// AI Behavior
/** JSDoc for exported member */
/** @constant {any} */
export const AI_DETECTION_RADIUS = 300;
/** JSDoc for exported member */
/** @constant {any} */
export const AI_LUNGE_DURATION = 1000;
/** JSDoc for exported member */
/** @constant {any} */
export const AI_LUNGE_SPEED_MULTIPLIER = 4;
/** JSDoc for exported member */
/** @constant {any} */
export const AI_ORBIT_RADIUS = 150;
/** @constant {any} */
export const AI_ORBIT_SPEED = 0.02;
/** @constant {any} */
export const DEFAULT_GAME_VOLUME = 0.5;

// ─── New Contract Addresses (Mainnet) ───
/** @constant {any} */
export const CONTRACT_DAILY_QUESTS = 'SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF.daily-quest-tracker-v2';
/** @constant {any} */
export const CONTRACT_POWERUP_STORE = 'SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF.powerup-store';
export const CONTRACT_PILOT_REGISTRY = 'SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF.pilot-registry';
