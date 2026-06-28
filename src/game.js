/**
 * Stacks Hurry - Game Engine
 * HTML5 Canvas rocket shooter with progressive difficulty
 */

import { playShoot, playExplosion, playHit, playGameOver, playLevelUp, playCollect, playWarning, playShockwave, initAudio, playShieldHit, playWaveClear, playHeavyHit, updateSpeedHum } from './audio.js';
import { 
  COLORS, PLAYER_SIZE, BULLET_SPEED, BULLET_RADIUS, SHOOT_COOLDOWN, 
  LEVEL_THRESHOLD, COMBO_TIMEOUT, POWERUP_DURATION, POWERUP_CHANCE,
  INITIAL_SPAWN_RATE, MIN_SPAWN_RATE, INITIAL_ASTEROID_SPEED,
  SHOCKWAVE_COOLDOWN, SHOCKWAVE_RADIUS, SHIP_THEMES, DEFAULT_SHIP_THEME,
  BOUNCE_LIMIT
} from './constants.js';
import { updateParticles, renderParticles, spawnExplosion, resetParticles, spawnPlayerExhaust, spawnPowerupTrail, spawnImpactRing } from './particles.js';
import { updateEnemies, renderEnemies, spawnEnemy, checkEnemyCollisions, resetEnemies, clearEnemyProjectiles } from './enemies.js';
import { checkCircleCollision, calculateShockwavePush } from './physics.js';
import { QuestsEventDispatcher } from './quests.js';
import { seek } from './ai.js';

// ─── Game State ───
let canvas, ctx;
let animFrameId = null;
let gameRunning = false;
let gamePaused = false;
let onPauseToggle = null;

// Object Pooling for bullets
class ObjectPool {
/** @param {any} param */
/** @description constructor logic */
  constructor(createFn) {
    this.pool = [];
    this.createFn = createFn;
  }
/** @param {any} param */
  get() {
    return this.pool.length > 0 ? this.pool.pop() : this.createFn();
  }
/** @param {any} param */
  release(obj) {
    obj.active = false;
    this.pool.push(obj);
  }
}

const bulletPool = new ObjectPool(() => ({ x: 0, y: 0, vx: 0, vy: 0, active: false }));

// Player
let player = {};
let bullets = [];
let asteroids = [];
let stars = [];
let nebulaClouds = [];
/** @type {any} */
let powerups = [];
let floatingTexts = [];

// Stats
let score = 0;
let lives = 3;
let level = 1;
/** @type {any} */
let asteroidsDestroyed = 0;
let frameCount = 0;
let comboCount = 0;
let multiplierTimer = 0;
let shake = { duration: 0, intensity: 0 };
/** @type {any} */
let damageFlash = 0; // Screen-wide red vignette flash timer
let currentWave = 1;
let waveEnemiesRemaining = 0;
/** @type {any} */
let waveInProgress = false;
let waveGracePeriod = 0;

// Cumulative run-specific stats tracking
let bulletsFiredThisGame = 0;
let bulletsHitThisGame = 0;
let asteroidsSmashedThisGame = 0;
let enemiesDestroyedThisGame = 0;

/**
 * Trigger a screen shake with specific intensity
 * Supports additive accumulation up to a maximum cap for premium visceral feedback
 */
export function addShake(duration, intensity) {
/** @constant {any} */
  const actualIntensity = intensity * shakeMultiplier;
/** @param {any} param */
  if (shake.duration <= 0) {
    shake.duration = duration;
    shake.intensity = actualIntensity;
  } else {
    // Additive accumulation with cap
    shake.duration = Math.max(shake.duration, duration);
    shake.intensity = Math.min(50, shake.intensity + actualIntensity * 0.5);
  }
}
// Difficulty
let asteroidSpawnRate = 90; // frames between spawns
let asteroidSpeed = 2;

// Mouse / touch position
let mouseX = 0;
let mouseY = 0;
let shooting = false;
let shootCooldown = 0;
let joystick = { active: false, startX: 0, startY: 0, dx: 0, dy: 0, pointerId: null };
let lowGraphics = false;
let autoFire = true;
/** @type {any} */
let shakeMultiplier = 1.0;
let joystickScale = 1.0;
let shipTheme = DEFAULT_SHIP_THEME;
const keys = { w: false, a: false, s: false, d: false, Space: false };
let keyboardActive = false;

export function setSettings(settings) {
  if (settings.lowGraphics !== undefined) lowGraphics = settings.lowGraphics;
  if (settings.autoFire !== undefined) autoFire = settings.autoFire;
  if (settings.shakeMultiplier !== undefined) shakeMultiplier = settings.shakeMultiplier;
  if (settings.joystickScale !== undefined) joystickScale = settings.joystickScale;
  if (settings.shipTheme !== undefined) shipTheme = settings.shipTheme;
}
let secondaryCooldown = 0;
let shockwave = { active: false, x: 0, y: 0, radius: 0 };
let lastTouchTime = 0;
let warpTime = 0;
let achievements = { score1k: false, score5k: false, level5: false, asteroids50: false };

// Callbacks
let onScoreUpdate = null;
let onLivesUpdate = null;
/** @type {any} */
let onLevelUpdate = null;
let onLevelProgress = null;
let onAchievement = null;
let onVibrate = null;
let onGameOver = null;

// ─── Initialization ───

export function initGame(canvasEl, callbacks) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');

  onScoreUpdate = callbacks.onScoreUpdate;
  onLivesUpdate = callbacks.onLivesUpdate;
  onLevelUpdate = callbacks.onLevelUpdate;
  onLevelProgress = callbacks.onLevelProgress;
  onAchievement = callbacks.onAchievement;
  onVibrate = callbacks.onVibrate;
  onGameOver = callbacks.onGameOver;
  onPauseToggle = callbacks.onPauseToggle;

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  const keyboardKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'p', 'escape'];
  
  window.addEventListener('keydown', (e) => {
    const keyLower = e.key.toLowerCase();
    if (keyboardKeys.includes(keyLower) || keyboardKeys.includes(e.key)) {
      keyboardActive = true;
      if (keyLower === 'w' || e.key === 'ArrowUp') keys.w = true;
      if (keyLower === 'a' || e.key === 'ArrowLeft') keys.a = true;
      if (keyLower === 's' || e.key === 'ArrowDown') keys.s = true;
      if (keyLower === 'd' || e.key === 'ArrowRight') keys.d = true;
/** @param {any} param */
      if (e.key === ' ') {
        keys.Space = true;
        shooting = true;
      }
      if ((keyLower === 'p' || e.key === 'Escape') && gameRunning) {
        togglePause();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    const keyLower = e.key.toLowerCase();
    if (keyLower === 'w' || e.key === 'ArrowUp') keys.w = false;
    if (keyLower === 'a' || e.key === 'ArrowLeft') keys.a = false;
    if (keyLower === 's' || e.key === 'ArrowDown') keys.s = false;
    if (keyLower === 'd' || e.key === 'ArrowRight') keys.d = false;
/** @param {any} param */
    if (e.key === ' ') {
      keys.Space = false;
      shooting = false;
    }
  });

  // Input
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd);
  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    triggerSecondary();
  });

  // Generate background stars
  generateStars();
}

/** @param {any} param */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/** @param {any} param */
function generateStars() {
  stars = [];
  nebulaClouds = [];
  const starColors = ['#ffffff', '#e0f2fe', '#fef08a', '#c4b5fd', '#93c5fd'];

  // 3-layer parallax depth system: far (slow/small), mid, near (fast/bright)
/** @constant {any} */
  const layers = [
    { count: 80, speedRange: [0.05, 0.2], radiusRange: [0.2, 0.8], brightnessRange: [0.15, 0.35], depthLabel: 'far' },
    { count: 50, speedRange: [0.2, 0.5], radiusRange: [0.5, 1.4], brightnessRange: [0.3, 0.55], depthLabel: 'mid' },
    { count: 30, speedRange: [0.5, 0.9], radiusRange: [1.2, 2.5], brightnessRange: [0.5, 0.8], depthLabel: 'near' }
  ];

  layers.forEach(layer => {
/** @param {any} param */
    for (let i = 0; i < layer.count; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * (layer.radiusRange[1] - layer.radiusRange[0]) + layer.radiusRange[0],
        speed: Math.random() * (layer.speedRange[1] - layer.speedRange[0]) + layer.speedRange[0],
        brightness: Math.random() * (layer.brightnessRange[1] - layer.brightnessRange[0]) + layer.brightnessRange[0],
        color: starColors[Math.floor(Math.random() * starColors.length)],
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        depth: layer.depthLabel
      });
    }
  });

  // Generate procedural nebula clouds for atmospheric depth
  const nebulaColors = [
    { r: 88, g: 28, b: 135 },   // Deep purple
    { r: 30, g: 58, b: 138 },   // Royal blue
    { r: 157, g: 23, b: 77 },   // Magenta-pink
    { r: 20, g: 83, b: 110 },   // Teal depth
    { r: 76, g: 29, b: 149 }    // Violet
  ];

/** @param {any} param */
  for (let i = 0; i < 5; i++) {
    const nc = nebulaColors[i % nebulaColors.length];
    nebulaClouds.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 250 + 150,
      color: nc,
      alpha: Math.random() * 0.06 + 0.02,
      driftX: (Math.random() - 0.5) * 0.15,
      driftY: Math.random() * 0.08 + 0.02
    });
  }
}

// ─── Input Handlers ───

/** @param {any} param */
function handleMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
}

/** @param {any} param */
/** @description handleMouseDown logic */
function handleMouseDown(e) {
  initAudio();
  shooting = true;
}

/** @param {any} param */
function handleMouseUp() {
  shooting = false;
}

/** @param {any} param */
function handleTouchMove(e) {
  e.preventDefault();
/** @param {any} param */
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
/** @param {any} param */
    if (joystick.active && touch.identifier === joystick.pointerId) {
      joystick.dx = touch.clientX - joystick.startX;
      joystick.dy = touch.clientY - joystick.startY;
      const maxDist = 45; // Increased joystick radius for better mobile feel
      const dist = Math.hypot(joystick.dx, joystick.dy);
/** @param {any} param */
      if (dist > maxDist) {
        joystick.dx = (joystick.dx / dist) * maxDist;
        joystick.dy = (joystick.dy / dist) * maxDist;
      }
    } else if (!joystick.active) {
      mouseX = touch.clientX;
      mouseY = touch.clientY;
    }
  }
}

/** @param {any} param */
function handleTouchStart(e) {
  e.preventDefault();
  initAudio();
  
  // Double tap detection
  const now = Date.now();
/** @param {any} param */
  if (now - lastTouchTime < 300) {
    triggerSecondary();
  }
  lastTouchTime = now;

/** @param {any} param */
/** @description for logic */
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
/** @param {any} param */
    if (touch.clientX < window.innerWidth / 2) {
      joystick.active = true;
      joystick.startX = touch.clientX;
      joystick.startY = touch.clientY;
      joystick.dx = 0;
      joystick.dy = 0;
      joystick.pointerId = touch.identifier;
    } else {
      shooting = true;
    }
  }
}

/** @param {any} param */
function handleTouchEnd(e) {
  e.preventDefault();
/** @param {any} param */
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
/** @param {any} param */
    if (joystick.active && touch.identifier === joystick.pointerId) {
      joystick.active = false;
      joystick.pointerId = null;
    } else {
      shooting = false;
    }
  }
}

// ─── Game Lifecycle ───



export function startGame() {
  // Reset state
  score = 0;
  lives = 3;
  level = 1;
  asteroidsDestroyed = 0;
  frameCount = 0;
  comboCount = 0;
  multiplierTimer = 0;
  bulletsFiredThisGame = 0;
  bulletsHitThisGame = 0;
  asteroidsSmashedThisGame = 0;
  enemiesDestroyedThisGame = 0;
  asteroidSpawnRate = INITIAL_SPAWN_RATE;
  asteroidSpeed = INITIAL_ASTEROID_SPEED;
  achievements = { score1k: false, level5: false, asteroids50: false };
  bullets = [];
  asteroids = [];
  powerups = [];
  floatingTexts = [];
  shootCooldown = 0;
  secondaryCooldown = 0;
  shockwave.active = false;
  damageFlash = 0;
  warpTime = 0;
  resetParticles();
  resetEnemies();
  onScoreUpdate(score);
  onLivesUpdate(lives);
  onLevelUpdate(level);
  if (onLevelProgress) onLevelProgress(0);

  resizeCanvas();

  player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE * 1.4,
    invincible: 0,
    shieldActive: false,
    multiShotActive: 0,
    speedActive: 0,
    bounceActive: 0,
    kickbackX: 0,
    kickbackY: 0,
  };

  mouseX = player.x;
  mouseY = player.y;

  gameRunning = true;
  gamePaused = false;

  if (onScoreUpdate) onScoreUpdate(score);
  if (onLivesUpdate) onLivesUpdate(lives);
  if (onLevelUpdate) onLevelUpdate(level);

  gameLoop();
}

export function stopGame() {
  gameRunning = false;
/** @param {any} param */
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

export function getScore() { return score; }
export function getLevel() { return level; }
export function getAsteroidsDestroyed() { return asteroidsDestroyed; }

export function togglePause() {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  if (onPauseToggle) onPauseToggle(gamePaused);
}

/** @param {any} param */
function triggerSecondary() {
/** @param {any} param */
  if (secondaryCooldown <= 0 && gameRunning && !gamePaused) {
    shockwave.active = true;
    shockwave.x = player.x;
    shockwave.y = player.y;
    shockwave.radius = 0;
    secondaryCooldown = SHOCKWAVE_COOLDOWN;
    playShockwave();
    addShake(10, 15);
    spawnImpactRing(player.x, player.y, 50, '#00f0ff', 20);
    asteroids.forEach(a => { a.pushedByShockwave = false; });
  }
}

// ─── Main Loop ───

/** @param {any} param */
function gameLoop() {
  if (!gameRunning) return;

/** @param {any} param */
  if (!gamePaused) {
    update();
    render();
  }

  animFrameId = requestAnimationFrame(gameLoop);
}

// ─── Update ───

/** @param {any} param */
function update() {
  frameCount++;

  const oldX = player.x;
  const oldY = player.y;

  // Smooth player follow
  const currentStack = player.speedStack || 0;
  const speedMult = currentStack === 0 ? 0.12 : (0.12 + currentStack * 0.08);
  const keyboardSpeed = currentStack === 0 ? 6 : (6 + currentStack * 2.5);
  
  if (keyboardActive && (keys.w || keys.a || keys.s || keys.d)) {
    let moveX = 0;
/** @type {any} */
    let moveY = 0;
    if (keys.w) moveY -= 1;
    if (keys.s) moveY += 1;
    if (keys.a) moveX -= 1;
    if (keys.d) moveX += 1;
    
    // Normalize diagonal movement speed
/** @param {any} param */
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }
    
    player.x += moveX * keyboardSpeed + player.kickbackX;
    player.y += moveY * keyboardSpeed + player.kickbackY;
    
    // Keep mouse coordinates synced so they don't snap back when mouse moves
    mouseX = player.x;
    mouseY = player.y;
  } else if (joystick.active) {
    player.x += (joystick.dx * 0.15 * joystickScale) + player.kickbackX;
    player.y += (joystick.dy * 0.15 * joystickScale) + player.kickbackY;
    mouseX = player.x; // Sync mouse
    mouseY = player.y;
  } else {
    // If mouse moves, switch keyboard off
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    // We only update via mouse if mouse is actually away from player to prevent micro-stutter
    if (Math.hypot(dx, dy) > 2) {
      keyboardActive = false;
      player.x += (dx * speedMult) + player.kickbackX;
      player.y += (dy * speedMult) + player.kickbackY;
    }
  }
  
  // Apply recoil friction uniformly
  player.kickbackX *= 0.85;
  player.kickbackY *= 0.85;

  // Clamp to canvas
  // Elastic boundaries
  const leftBound = PLAYER_SIZE;
  const rightBound = canvas.width - PLAYER_SIZE;
/** @param {any} param */
  if (player.x < leftBound) { player.x = leftBound; player.kickbackX = 3.0; }
  else if (player.x > rightBound) { player.x = rightBound; player.kickbackX = -3.0; }
  const topBound = PLAYER_SIZE * 2;
  const bottomBound = canvas.height - PLAYER_SIZE;
/** @param {any} param */
  if (player.y < topBound) { player.y = topBound; player.kickbackY = 3.0; }
  else if (player.y > bottomBound) { player.y = bottomBound; player.kickbackY = -3.0; }

  const vx = player.x - oldX;
/** @constant {any} */
  const vy = player.y - oldY;
  const speed = Math.sqrt(vx * vx + vy * vy);
  const maxHumSpeed = 12; // approximate max speed per frame
  const speedRatio = Math.min(speed / maxHumSpeed, 1.0);
  updateSpeedHum(speedRatio);

  // Spawn exhaust trail particles
/** @param {any} param */
  if (frameCount % 2 === 0 && !lowGraphics) {
    const exhaustColor = player.shieldActive ? '#60a5fa' : '#38bdf8';
    spawnPlayerExhaust(player.x, player.y, vx, vy, exhaustColor);
  }

  // Invincibility timer
  if (player.invincible > 0) player.invincible--;

  // Multi-shot timer
  if (player.multiShotActive > 0) {
    player.multiShotActive--;
    if (player.multiShotActive === 120 || player.multiShotActive === 60 || player.multiShotActive === 30) {
      playWarning();
    }
  }

  // Speed timer
  if (player.speedActive > 0) {
    player.speedActive--;
/** @description if logic */
    if (player.speedActive <= 0) {
/** @description if logic */
      if (player.speedStack > 1) {
        player.speedStack--;
        player.speedActive = 300;
        spawnFloatingText(player.x, player.y - 20, "SPEED DECAY", "#ea580c");
      } else {
        player.speedStack = 0;
      }
    }
    if (player.speedActive === 120 || player.speedActive === 60 || player.speedActive === 30) {
      playWarning();
    }
  }

  // Bounce timer
  if (player.bounceActive > 0) {
    player.bounceActive--;
/** @description if logic */
    if (player.bounceActive === 120 || player.bounceActive === 60 || player.bounceActive === 30) {
      playWarning();
    }
  }

  // Multiplier timer
  if (multiplierTimer > 0) {
    multiplierTimer--;
    if (multiplierTimer <= 0) comboCount = 0;
  }

  // Achievements
  if (!achievements.score1k && score >= 1000) {
    achievements.score1k = true;
    if (onAchievement) onAchievement('SCORE MASTER', 'Reached 1,000 points!', '💎');
  }
  if (!achievements.score5k && score >= 5000) {
    achievements.score5k = true;
    if (onAchievement) onAchievement('GRAND MASTER', 'Reached 5,000 points!', '🏆');
  }
  if (!achievements.level5 && level >= 5) {
    achievements.level5 = true;
    if (onAchievement) onAchievement('ELITE PILOT', 'Reached Level 5!', '🚀');
  }
  if (!achievements.asteroids50 && asteroidsDestroyed >= 50) {
    achievements.asteroids50 = true;
    if (onAchievement) onAchievement('DESTROYER', 'Smashed 50 asteroids!', '💥');
  }

  // Secondary cooldown
  if (secondaryCooldown > 0) secondaryCooldown--;

  // Shockwave logic
  if (shockwave.active) {
    shockwave.radius += 10;
    if (shockwave.radius > SHOCKWAVE_RADIUS) shockwave.active = false;

    // Push asteroids
    asteroids.forEach(a => {
      const push = calculateShockwavePush(a, shockwave);
      if (push) {
        a.x += push.x;
        a.y += push.y;
        if (!a.pushedByShockwave) {
          a.pushedByShockwave = true;
          QuestsEventDispatcher.dispatchEvent('shockwaveDeflected');
        }
      }
    });

    // Clear projectiles
    const cleared = clearEnemyProjectiles(shockwave.x, shockwave.y, shockwave.radius);
    if (cleared > 0) {
      for (let i = 0; i < cleared; i++) {
        QuestsEventDispatcher.dispatchEvent('shockwaveDeflected');
      }
    }
  }

  // Shooting
  if (shootCooldown > 0) shootCooldown--;
  if ((shooting || autoFire) && shootCooldown <= 0) {
    fireBullet();
    shootCooldown = SHOOT_COOLDOWN;
  }

  // Update bullets
  bullets = bullets.filter(b => {
    if (b.isHoming && b.target) {
/** @description if logic */
      if (b.target.hp <= 0 || b.target.y > canvas.height) {
        b.target = null;
      } else {
        seek(b, b.target, BULLET_SPEED * 1.2, 0.08);
      }
    }
    
    b.x += b.vx;
    b.y += b.vy;

    // Bounce physics
    if (b.bounceCount > 0) {
      let bounced = false;
      if (b.x < 5) {
        b.x = 5;
        b.vx = -b.vx;
        bounced = true;
      } else if (b.x > canvas.width - 5) {
        b.x = canvas.width - 5;
        b.vx = -b.vx;
        bounced = true;
      }
      if (b.y < 5) {
        b.y = 5;
        b.vy = -b.vy;
        bounced = true;
      } else if (b.y > canvas.height - 5) {
        b.y = canvas.height - 5;
        b.vy = -b.vy;
        bounced = true;
      }
      if (bounced) {
        b.bounceCount--;
        playCollect(); // Reuse playCollect as nice futuristic blip sound
      }
    }

    const active = b.y > -10 && b.y < canvas.height + 10 && b.x > -10 && b.x < canvas.width + 10;
    if (!active) bulletPool.release(b);
    return active;
  });

  // Wave Management
  if (!waveInProgress) {
    if (waveGracePeriod > 0) waveGracePeriod--;
    else startNextWave();
  }

  // Spawn asteroids
  if (waveInProgress && frameCount % asteroidSpawnRate === 0) {
    spawnAsteroid();
    waveEnemiesRemaining--;
    if (waveEnemiesRemaining <= 0) {
      waveInProgress = false;
      QuestsEventDispatcher.dispatchEvent('waveCleared');
      playWaveClear();
    }
  }

  // Spawn enemies
  if (waveInProgress && frameCount % 350 === 0) {
    spawnEnemy(canvas);
  }

  // Update asteroids
  asteroids = asteroids.filter(a => {
    if (a.vx !== undefined) { a.x += a.vx; a.y += a.vy; } else { a.y += a.speed; }
    a.rotation += a.rotationSpeed;

    // Off screen
    if (a.y > canvas.height + 50) return false;

    // Bullet collision
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (checkCircleCollision(b.x, b.y, BULLET_RADIUS, a.x, a.y, a.radius)) {
        bulletPool.release(bullets.splice(i, 1)[0]);
        bulletsHitThisGame++;
        
        a.hp--;
/** @description if logic */
        if (a.hp > 0) {
          if (a.isShielded) playShieldHit();
          else playHit();
          spawnExplosion(b.x, b.y, 8, lowGraphics); 
          continue; 
        }

        spawnExplosion(a.x, a.y, a.radius, lowGraphics, a.isShielded ? '#00f0ff' : null);
        if (a.radius > 25 && !a.isShielded) {
          playHeavyHit();
        } else {
          playExplosion();
        }

        // Score & Combo
        comboCount++;
        if (comboCount >= 5) multiplierTimer = Math.max(120, COMBO_TIMEOUT - level * 10); 
        const mult = multiplierTimer > 0 ? 2 : 1;
/** @constant {any} */
        const points = Math.ceil(a.radius * 2) * (a.isShielded ? 3 : 1) * mult;
        score += points;
        if (a.isShielded) {
          spawnFloatingText(a.x, a.y - 20, "CRIT!", "#fbbf24");
        }
        
        if (mult > 1) {
          spawnFloatingText(a.x, a.y, `+${points} (2X)`, "#a855f7");
        } else {
          spawnFloatingText(a.x, a.y, `+${points}`);
        }
        asteroidsDestroyed++;
        asteroidsSmashedThisGame++;
        
        // Dispatch event to decentralized Daily Quests engine
        QuestsEventDispatcher.dispatchEvent('asteroidSmashed');

        if (onScoreUpdate) onScoreUpdate(score);
        if (onLevelProgress) {
          const progress = (asteroidsDestroyed % LEVEL_THRESHOLD) / LEVEL_THRESHOLD * 100;
          onLevelProgress(progress);
        }

        // Level up
        if (asteroidsDestroyed % LEVEL_THRESHOLD === 0) {
          level++;
          asteroidSpawnRate = Math.max(MIN_SPAWN_RATE, INITIAL_SPAWN_RATE - level * 8);
          asteroidSpeed = INITIAL_ASTEROID_SPEED + level * 0.4;
          if (onLevelUpdate) onLevelUpdate(level);
          playLevelUp();
          warpTime = 60;
          if (onVibrate) onVibrate([100, 50, 100]);
        }

        // Split large asteroids
        if (a.radius > 26) {
          spawnSmallAsteroid(a.x - 10, a.y, a.radius * 0.6, a.speed, -0.5);
          spawnSmallAsteroid(a.x + 10, a.y, a.radius * 0.6, a.speed, 0.5);
        }

        // Random powerup drop
        if (Math.random() < POWERUP_CHANCE) spawnPowerup(a.x, a.y);

        return false;
      }
    }

    // Player collision
    if (player.invincible <= 0) {
      if (checkCircleCollision(player.x, player.y, PLAYER_SIZE * 0.6, a.x, a.y, a.radius)) {
        if (player.shieldActive) {
          player.shieldActive = false;
          player.invincible = 30; // Short invincibility after shield break
          spawnExplosion(a.x, a.y, a.radius, lowGraphics);
          playHit();
          if (onVibrate) onVibrate(40);
          QuestsEventDispatcher.dispatchEvent('shieldAbsorbed');
        } else {
          lives--;
          player.invincible = 90; // 1.5 sec invincibility
          addShake(15, 20);
          damageFlash = 20; // Trigger red vignette flash
          spawnExplosion(a.x, a.y, a.radius, lowGraphics);
          playHit();
          if (onVibrate) onVibrate([150, 100, 150]);

          if (onLivesUpdate) onLivesUpdate(lives);

/** @description if logic */
          if (lives <= 0) {
            gameRunning = false;
            playGameOver();

            // Dispatch game event to decentralized Quests listener
            QuestsEventDispatcher.dispatchEvent('gameFinished', { score, timeSurvived: Math.floor(frameCount / 60) });

            saveLocalStats();

            if (onGameOver) {
              onGameOver({ score, level, asteroidsDestroyed });
            }
          }
        }
        return false;
      }
    }

    return true;
  });

  // Update powerups
  powerups = powerups.filter(p => {
    p.y += p.speed;
    p.rotation += 0.05;

    // Spawn sparkling trail particles behind falling powerups
    if (!lowGraphics && frameCount % 3 === 0) {
      const trailColors = { shield: '#d8b4fe', multishot: '#fdba74', speed: '#86efac', health: '#fca5a5', bounce: '#fda4af' };
      spawnPowerupTrail(p.x, p.y, trailColors[p.type] || '#a855f7');
    }

    if (p.y > canvas.height + 30) return false;

    // Player collects powerup
    if (checkCircleCollision(player.x, player.y, PLAYER_SIZE * 0.6, p.x, p.y, 20)) {
      if (p.type === 'shield') {
        player.shieldActive = true;
      } else if (p.type === 'multishot') {
        player.multiShotActive = Math.min(1200, (player.multiShotActive || 0) + 600);
      } else if (p.type === 'speed') {
        player.speedStack = Math.min(3, (player.speedStack || 0) + 1);
        player.speedActive = Math.min(1200, (player.speedActive || 0) + 600);
        spawnFloatingText(player.x, player.y - 20, `SPEED X${player.speedStack}!`, "#38bdf8");
      } else if (p.type === 'health') {
        if (lives < 5) {
          lives++;
          if (onLivesUpdate) onLivesUpdate(lives);
        }
      } else if (p.type === 'bounce') {
        player.bounceActive = Math.min(1200, (player.bounceActive || 0) + 600);
        spawnFloatingText(player.x, player.y - 20, "BOUNCING BULLETS!", "#fb7185");
      }
      playCollect();
      if (onVibrate) onVibrate(30);
      score += 50;
      if (onScoreUpdate) onScoreUpdate(score);
      return false;
    }

    return true;
  });

  // Update enemies & collisions
  updateEnemies(canvas, frameCount, player);
  const enemyCollision = checkEnemyCollisions(player, bullets, (x, y, points) => {
    const mult = multiplierTimer > 0 ? 2 : 1;
    const finalPoints = points * mult;
    score += finalPoints;
    if (mult > 1) {
      spawnFloatingText(x, y, `+${finalPoints} (2X)`, "#a855f7");
    } else {
      spawnFloatingText(x, y, `+${finalPoints}`);
    }
    if (onScoreUpdate) onScoreUpdate(score);
    comboCount++;
    if (comboCount >= 5) multiplierTimer = 300;
    enemiesDestroyedThisGame++;
  }, lowGraphics, () => {
    bulletsHitThisGame++;
  });

  if (enemyCollision) {
    if (player.shieldActive) {
      player.shieldActive = false;
      player.invincible = 30;
      playHit();
      QuestsEventDispatcher.dispatchEvent('shieldAbsorbed');
    } else {
      lives--;
      player.invincible = 90;
      addShake(15, 20);
      damageFlash = 20;
      playHit();
      if (onLivesUpdate) onLivesUpdate(lives);
      if (lives <= 0) {
        gameRunning = false;
        playGameOver();
        saveLocalStats();
        if (onGameOver) onGameOver({ score, level, asteroidsDestroyed });
      }
    }
  }

  // Update particles
  updateParticles();

  // Update floating texts
  floatingTexts = floatingTexts.filter(ft => {
    ft.y -= 1;
    ft.life--;
    return ft.life > 0;
  });

  // Damage flash decay
  if (damageFlash > 0) damageFlash--;

  // Update stars
  if (warpTime > 0) warpTime--;
  const starSpeedMult = (1 + (level * 0.25)) * (warpTime > 0 ? 18 : 1);
  stars.forEach(s => {
    s.y += s.speed * starSpeedMult;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });
}

// ─── Spawn Functions ───

function startNextWave() {
  currentWave++;
  // Progressive non-linear difficulty curve
  waveEnemiesRemaining = Math.floor(5 + currentWave * 2.5 + Math.pow(currentWave, 1.25));
  waveInProgress = true;
  waveGracePeriod = 120;
  
  // Compress spawn rate slightly per wave to accelerate intensity
  asteroidSpawnRate = Math.max(20, Math.floor(asteroidSpawnRate * 0.95));
  
  if (currentWave >= 5) {
    spawnFloatingText(canvas.width / 2, canvas.height / 2 - 20, "DANGER: HIGH ESCALATION", "#ef4444");
    spawnFloatingText(canvas.width / 2, canvas.height / 2 + 10, `WAVE ${currentWave}`, "#fbbf24");
  } else {
    spawnFloatingText(canvas.width / 2, canvas.height / 2, `WAVE ${currentWave}`, "#00f0ff");
  }
}

function findNearestTarget(x, y, maxDist = 300) {
  let nearest = null;
  let minDist = maxDist;

  // Check asteroids
  asteroids.forEach(a => {
    const d = Math.hypot(a.x - x, a.y - y);
    if (d < minDist) {
      minDist = d;
      nearest = a;
    }
  });

  return nearest;
}

function createBullet(x, y, vx, vy, isHoming = false) {
  const b = bulletPool.get();
  b.x = x;
  b.y = y;
  b.vx = vx;
  b.vy = vy;
  b.active = true;
  b.isHoming = isHoming;
  b.target = isHoming ? findNearestTarget(x, y) : null;
  b.bounceCount = player.bounceActive > 0 ? BOUNCE_LIMIT : 0;
  return b;
}

function fireBullet() {
  const bSpeed = player.speedActive > 0 ? BULLET_SPEED * 1.5 : BULLET_SPEED;

  if (player.multiShotActive > 0) {
    bullets.push(createBullet(player.x, player.y - PLAYER_SIZE, 0, -bSpeed, true));
    bullets.push(createBullet(player.x - 12, player.y - PLAYER_SIZE + 5, -bSpeed * 0.2, -bSpeed * 0.98, true));
    bullets.push(createBullet(player.x + 12, player.y - PLAYER_SIZE + 5, bSpeed * 0.2, -bSpeed * 0.98, true));
    bulletsFiredThisGame += 3;
    player.kickbackY += 4; // Extra recoil for heavy weapons
    player.kickbackX += (Math.random() - 0.5) * 2.5;
  } else {
    bullets.push(createBullet(player.x - 8, player.y - PLAYER_SIZE, 0, -bSpeed));
    bullets.push(createBullet(player.x + 8, player.y - PLAYER_SIZE, 0, -bSpeed));
    bulletsFiredThisGame += 2;
    player.kickbackY += 2;
    player.kickbackX += (Math.random() - 0.5) * 1.0;
  }
  playShoot();
}

function spawnAsteroid() {
  const radius = Math.random() * 26 + 14; 
  const isShielded = level > 2 && Math.random() < (0.1 + (level * 0.02));
  const eliteHp = isShielded ? Math.min(6, 2 + Math.floor(level / 2)) : 1;
  
  // Generate procedural crater positions for visual detail
  const craterCount = Math.floor(Math.random() * 3) + 1;
  const craters = [];
  for (let c = 0; c < craterCount; c++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius * 0.5;
    craters.push({
      cx: Math.cos(angle) * dist,
      cy: Math.sin(angle) * dist,
      cr: Math.random() * (radius * 0.2) + radius * 0.08
    });
  }

  asteroids.push({
    x: Math.random() * (canvas.width - 60) + 30,
    y: -50,
    radius,
    speed: asteroidSpeed + Math.random() * 1.5,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * (0.06 + level * 0.005),
    vertices: generateAsteroidShape(radius),
    craters: craters,
    hp: eliteHp,
    maxHp: eliteHp,
    isShielded: isShielded
  });
}

function spawnSmallAsteroid(x, y, radius, parentSpeed = 2, angleOffset = 0.5) {
  const angle = Math.PI / 2 + angleOffset;
  const speedX = Math.cos(angle) * (parentSpeed * 1.2);
  const speedY = Math.sin(angle) * (parentSpeed * 1.2);

  asteroids.push({
    x,
    y,
    vx: speedX,
    vy: speedY,
    radius,
    speed: Math.hypot(speedX, speedY),
    rotation: Math.random() * Math.PI,
    rotationSpeed: (Math.random() - 0.5) * 0.25,
    vertices: generateAsteroidShape(radius),
    hp: 1,
    isShielded: false
  });
}

function generateAsteroidShape(radius) {
  const points = Math.floor(Math.random() * 4) + 7;
  const vertices = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius + (Math.random() - 0.5) * radius * 0.5;
    vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return vertices;
}

function spawnPowerup(x, y) {
  const rand = Math.random();
  let type = 'shield';
  if (rand < 0.2) type = 'shield';
  else if (rand < 0.4) type = 'multishot';
  else if (rand < 0.6) type = 'speed';
  else if (rand < 0.8) type = 'bounce';
  else type = 'health';

  powerups.push({
    x,
    y,
    speed: 1.5,
    rotation: 0,
    type,
  });
}



function spawnFloatingText(x, y, text, color = '#ffffff') {
  const safeX = Math.max(40, Math.min(canvas ? canvas.width - 40 : 1000, x));
  floatingTexts.push({
    x: safeX,
    y,
    text,
    color,
    life: 30,
    maxLife: 30
  });
}

// ─── Render ───

function render() {
  // Realistic Deep Space Gradient
  const bgGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height));
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.6, '#020617');
  bgGrad.addColorStop(1, '#000000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  if (shake.duration > 0) {
    const scale = lowGraphics ? 0.35 : 1.0;
    const angle = Math.random() * Math.PI * 2;
    const offset = Math.sin(shake.duration * 1.5) * shake.intensity * scale;
    const dx = Math.cos(angle) * offset;
    const dy = Math.sin(angle) * offset;
    ctx.translate(dx, dy);
    shake.duration--;
    shake.intensity *= 0.92;
  }

  // Nebula cloud atmosphere layer
  if (!lowGraphics) {
    ctx.save();
    nebulaClouds.forEach(nc => {
      nc.x += nc.driftX;
      nc.y += nc.driftY;
      if (nc.y > canvas.height + nc.radius) { nc.y = -nc.radius; nc.x = Math.random() * canvas.width; }
      if (nc.x < -nc.radius || nc.x > canvas.width + nc.radius) { nc.x = Math.random() * canvas.width; }
      const grad = ctx.createRadialGradient(nc.x, nc.y, 0, nc.x, nc.y, nc.radius);
      grad.addColorStop(0, `rgba(${nc.color.r}, ${nc.color.g}, ${nc.color.b}, ${nc.alpha})`);
      grad.addColorStop(0.5, `rgba(${nc.color.r}, ${nc.color.g}, ${nc.color.b}, ${nc.alpha * 0.4})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(nc.x - nc.radius, nc.y - nc.radius, nc.radius * 2, nc.radius * 2);
    });
    ctx.restore();
  }

  // Layered glowing stars with twinkle effect
  ctx.save();
  stars.forEach(s => {
    // Twinkle brightness modulation
    s.twinklePhase += s.twinkleSpeed;
    const twinkle = 0.7 + 0.3 * Math.sin(s.twinklePhase);
    const finalBrightness = s.brightness * twinkle;

    if (warpTime > 0) {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x, s.y + s.radius * 30);
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = finalBrightness * (warpTime / 60);
      ctx.lineWidth = s.radius * 0.8;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = finalBrightness;
      if (!lowGraphics && s.radius > 1.2) {
        ctx.shadowColor = s.color;
        ctx.shadowBlur = s.radius * 3;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    }
  });
  ctx.restore();

  // Shockwave
  if (shockwave.active) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 240, 255, ${1 - shockwave.radius / SHOCKWAVE_RADIUS})`;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Inner glow
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.restore();
  }

  // Particles
  renderParticles(ctx, lowGraphics);

  // Bullets
  // Realistic laser energy for bullets
  ctx.save();
  if (!lowGraphics) ctx.globalCompositeOperation = 'lighter';
/** @constant {any} */
  const activeTheme = SHIP_THEMES[shipTheme] || SHIP_THEMES.vanguard;
  bullets.forEach(b => {
    // Intense core
    ctx.beginPath();
    ctx.arc(b.x, b.y, BULLET_RADIUS * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    if (!lowGraphics) {
      ctx.shadowColor = activeTheme.bulletGlow;
      ctx.shadowBlur = 12;
    }
    ctx.fill();

    // Glowing aura
    ctx.beginPath();
    ctx.arc(b.x, b.y, BULLET_RADIUS * 2, 0, Math.PI * 2);
    ctx.fillStyle = activeTheme.bulletGlow;
    ctx.globalAlpha = 0.7;
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Laser trail
    const trailLen = Math.hypot(b.vx, b.vy) * 2;
    if (trailLen > 0) {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - (b.vx/Math.abs(b.vy)) * trailLen, b.y - Math.sign(b.vy) * trailLen);
      ctx.strokeStyle = activeTheme.trail;
      ctx.lineWidth = BULLET_RADIUS * 1.5;
      ctx.stroke();
    }
  });
  ctx.restore();

  // Asteroids
  asteroids.forEach(a => {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);

    ctx.beginPath();
    a.vertices.forEach((v, i) => {
      if (i === 0) ctx.moveTo(v.x, v.y);
      else ctx.lineTo(v.x, v.y);
    });
    ctx.closePath();

    if (a.isShielded) {
      const maxHp = a.maxHp || 3;
      const shieldPcnt = a.hp / maxHp;
      ctx.fillStyle = `rgba(0, 240, 255, ${0.1 + shieldPcnt * 0.2})`;
      ctx.fill();

      // Pulsing energy field outline
      const pulseAlpha = 0.4 + shieldPcnt * 0.6 + Math.sin(frameCount * 0.08) * 0.15;
      ctx.strokeStyle = `rgba(0, 240, 255, ${Math.min(1, pulseAlpha)})`;
      ctx.lineWidth = 2 + shieldPcnt;
      if (!lowGraphics) {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15 + Math.sin(frameCount * 0.12) * 8;
      }
      ctx.stroke();

      // Inner energy core glow
      if (!lowGraphics) {
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, a.radius * 0.6);
        coreGrad.addColorStop(0, `rgba(0, 240, 255, ${0.15 * shieldPcnt})`);
        coreGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrad;
        ctx.fill();
      }
    } else {
      // 3D-like realistic rock gradient with directional lighting
      const rockGrad = ctx.createLinearGradient(-a.radius, -a.radius, a.radius, a.radius);
      rockGrad.addColorStop(0, '#546478');
      rockGrad.addColorStop(0.4, '#475569');
      rockGrad.addColorStop(0.7, '#1e293b');
      rockGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = rockGrad;
      ctx.fill();
      
      // Depth and crater illusion outlines
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Procedural crater detail rendering
      if (!lowGraphics && a.craters) {
        a.craters.forEach(cr => {
          ctx.beginPath();
          ctx.arc(cr.cx, cr.cy, cr.cr, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
          ctx.fill();
          // Crater rim highlight
          ctx.beginPath();
          ctx.arc(cr.cx - cr.cr * 0.2, cr.cy - cr.cr * 0.2, cr.cr * 0.7, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });
      }

      // Specular highlight reflection (top-left light source)
      if (!lowGraphics) {
        const specGrad = ctx.createRadialGradient(
          -a.radius * 0.3, -a.radius * 0.3, 0,
          -a.radius * 0.3, -a.radius * 0.3, a.radius * 0.6
        );
        specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        specGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = specGrad;
        ctx.fill();
      }
      
      // Top lighting edge highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();

    // HP Bar for shielded
    if (a.isShielded && a.hp < (a.maxHp || 3)) {
      const maxHp = a.maxHp || 3;
      const barWidth = a.radius * 1.5;
/** @constant {any} */
      const barHeight = 4;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(a.x - barWidth/2, a.y - a.radius - 12, barWidth, barHeight);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(a.x - barWidth/2, a.y - a.radius - 12, barWidth * (a.hp / maxHp), barHeight);
    }
  });

  // Enemies
  // Enemies
  renderEnemies(ctx);

  // Floating texts with scale-bounce animation
  floatingTexts.forEach(ft => {
    ctx.save();
    const progress = ft.life / ft.maxLife;
    ctx.globalAlpha = progress;

    // Scale-bounce: pop in large then settle to normal size
    const elapsed = ft.maxLife - ft.life;
    const scaleBounce = elapsed < 8 ? 1.0 + (1.0 - elapsed / 8) * 0.6 : 1.0;
    ctx.translate(ft.x, ft.y);
    ctx.scale(scaleBounce, scaleBounce);

    ctx.fillStyle = ft.color;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.fillText(ft.text, 0, 0);
    ctx.globalAlpha = 1.0;
    ctx.restore();
  });

  // Powerups
  powerups.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

/** @description if logic */
    if (p.type === 'shield') {
      // Shield Icon (Diamond)
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 12);
      ctx.lineTo(-10, 0);
      ctx.closePath();

      ctx.fillStyle = 'rgba(168, 85, 247, 0.8)'; // Purple for shield
      ctx.fill();
      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowColor = '#d8b4fe';
      ctx.shadowBlur = 10;
      ctx.stroke();
    } else if (p.type === 'multishot') {
      // Multi-shot Icon (Triangle)
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(12, 10);
      ctx.lineTo(-12, 10);
      ctx.closePath();

      ctx.fillStyle = 'rgba(251, 146, 60, 0.8)'; // Orange for multi-shot
      ctx.fill();
      ctx.strokeStyle = '#fdba74';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowColor = '#fdba74';
      ctx.shadowBlur = 10;
      ctx.stroke();
    } else if (p.type === 'speed') {
      // Speed Icon (Chevron)
      ctx.beginPath();
      ctx.moveTo(-8, -10);
      ctx.lineTo(0, -10);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-8, 10);
      ctx.lineTo(0, 0);
      ctx.closePath();

      ctx.fillStyle = 'rgba(34, 197, 94, 0.8)'; // Green for speed
      ctx.fill();
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowColor = '#86efac';
      ctx.shadowBlur = 10;
      ctx.stroke();
    } else if (p.type === 'health') {
      // Health Icon (Cross)
      ctx.beginPath();
      ctx.rect(-4, -12, 8, 24);
      ctx.rect(-12, -4, 24, 8);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'; // Red for health
      ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowColor = '#fca5a5';
      ctx.shadowBlur = 10;
      ctx.stroke();
    } else if (p.type === 'bounce') {
      // Bounce Icon (Double Circle representing rebounding energy)
      ctx.beginPath();
      ctx.arc(-4, 0, 8, 0, Math.PI * 2);
      ctx.arc(4, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.8)'; // Pink for bounce
      ctx.fill();
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowColor = '#fda4af';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }

    ctx.restore();
  });

  // Player
  drawPlayer();

  // Virtual Joystick
  if (joystick.active) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(joystick.startX, joystick.startY, 40, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(joystick.startX + joystick.dx, joystick.startY + joystick.dy, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
    ctx.restore();
  }

  // Multiplier UI
  if (multiplierTimer > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(251, 191, 36, ${Math.min(1, multiplierTimer / 30)})`; // Fades out at end
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 15;
    ctx.fillText('2X MULTIPLIER', canvas.width / 2, 80);
    ctx.restore();
  }

  // Damage flash vignette overlay
  if (damageFlash > 0) {
/** @constant {any} */
    const flashAlpha = (damageFlash / 20) * 0.45;
    // Edge vignette gradient for cinematic damage feedback
    const vignetteGrad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.width * 0.25,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.75
    );
    vignetteGrad.addColorStop(0, 'transparent');
    vignetteGrad.addColorStop(0.6, `rgba(220, 38, 38, ${flashAlpha * 0.3})`);
    vignetteGrad.addColorStop(1, `rgba(185, 28, 28, ${flashAlpha})`);
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.restore(); // Restore shake transform
}

function drawPlayer() {
  const { x, y, invincible } = player;

  // Skip every other frame when invincible (blink)
  if (invincible > 0 && frameCount % 6 < 3) return;

  ctx.save();
  ctx.translate(x, y);

  const activeTheme = SHIP_THEMES[shipTheme] || SHIP_THEMES.vanguard;

  // Heat distortion shimmer behind engines (subtle wavering)
  if (!lowGraphics) {
    ctx.save();
    ctx.globalAlpha = 0.04;
    const shimmerOffset = Math.sin(frameCount * 0.5) * 3;
    const heatGrad = ctx.createLinearGradient(0, PLAYER_SIZE * 0.5, 0, PLAYER_SIZE * 2.5);
    heatGrad.addColorStop(0, 'rgba(251, 146, 60, 0.6)');
    heatGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.3)');
    heatGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = heatGrad;
    ctx.fillRect(-10 + shimmerOffset, PLAYER_SIZE * 0.4, 20, PLAYER_SIZE * 2);
    ctx.restore();
  }

  // Engine glow with enhanced radial bloom
  const glowGrad = ctx.createRadialGradient(0, PLAYER_SIZE * 0.5, 2, 0, PLAYER_SIZE * 0.5, PLAYER_SIZE * 1.2);
  glowGrad.addColorStop(0, 'rgba(251,146,60,0.8)');
  glowGrad.addColorStop(0.4, 'rgba(251,146,60,0.35)');
  glowGrad.addColorStop(0.7, 'rgba(251,100,20,0.1)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(-PLAYER_SIZE, 0, PLAYER_SIZE * 2, PLAYER_SIZE * 1.5);

  // Dual engine flames (left and right thrusters)
  const flameHeight = PLAYER_SIZE * 0.5 + Math.sin(frameCount * 0.3) * 6;
  const flameFlicker = Math.sin(frameCount * 0.7) * 2;

  // Left thruster flame
  ctx.beginPath();
  ctx.moveTo(-7, PLAYER_SIZE * 0.3);
  ctx.lineTo(-4, PLAYER_SIZE * 0.3 + flameHeight + flameFlicker);
  ctx.lineTo(-1, PLAYER_SIZE * 0.3);
  ctx.fillStyle = '#fb923c';
  ctx.fill();

  // Right thruster flame
  ctx.beginPath();
  ctx.moveTo(1, PLAYER_SIZE * 0.3);
  ctx.lineTo(4, PLAYER_SIZE * 0.3 + flameHeight - flameFlicker);
  ctx.lineTo(7, PLAYER_SIZE * 0.3);
  ctx.fillStyle = '#fb923c';
  ctx.fill();

  // Inner flame cores (white-hot center)
  ctx.beginPath();
  ctx.moveTo(-5, PLAYER_SIZE * 0.3);
  ctx.lineTo(-4, PLAYER_SIZE * 0.3 + flameHeight * 0.5);
  ctx.lineTo(-3, PLAYER_SIZE * 0.3);
  ctx.fillStyle = '#fef3c7';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(3, PLAYER_SIZE * 0.3);
  ctx.lineTo(4, PLAYER_SIZE * 0.3 + flameHeight * 0.5);
  ctx.lineTo(5, PLAYER_SIZE * 0.3);
  ctx.fillStyle = '#fef3c7';
  ctx.fill();

  // Ship body
  ctx.beginPath();
  ctx.moveTo(0, -PLAYER_SIZE);        // Nose
  ctx.lineTo(-PLAYER_SIZE * 0.7, PLAYER_SIZE * 0.3);  // Left wing
  ctx.lineTo(-PLAYER_SIZE * 0.3, PLAYER_SIZE * 0.2);
  ctx.lineTo(0, PLAYER_SIZE * 0.35);
  ctx.lineTo(PLAYER_SIZE * 0.3, PLAYER_SIZE * 0.2);
  ctx.lineTo(PLAYER_SIZE * 0.7, PLAYER_SIZE * 0.3);   // Right wing
  ctx.closePath();

  const bodyGrad = ctx.createLinearGradient(0, -PLAYER_SIZE, 0, PLAYER_SIZE * 0.3);
  bodyGrad.addColorStop(0, activeTheme.bodyGradStart);
  bodyGrad.addColorStop(0.5, activeTheme.bodyGradMiddle);
  bodyGrad.addColorStop(1, activeTheme.bodyGradEnd);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = activeTheme.stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Wing tip navigation lights (aviation convention: green port, red starboard)
  if (!lowGraphics) {
    const navPulse = 0.5 + 0.5 * Math.sin(frameCount * 0.08);
    // Left wing tip — green
    ctx.beginPath();
    ctx.arc(-PLAYER_SIZE * 0.65, PLAYER_SIZE * 0.25, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(34, 197, 94, ${0.5 + navPulse * 0.5})`;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 6 + navPulse * 4;
    ctx.fill();
    // Right wing tip — red
    ctx.beginPath();
    ctx.arc(PLAYER_SIZE * 0.65, PLAYER_SIZE * 0.25, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + navPulse * 0.5})`;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6 + navPulse * 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Cockpit canopy with reflection gradient
  ctx.beginPath();
  ctx.ellipse(0, -PLAYER_SIZE * 0.3, 5, 8, 0, 0, Math.PI * 2);
  const canopyGrad = ctx.createLinearGradient(-4, -PLAYER_SIZE * 0.45, 4, -PLAYER_SIZE * 0.15);
  canopyGrad.addColorStop(0, '#c084fc');
  canopyGrad.addColorStop(0.4, '#a855f7');
  canopyGrad.addColorStop(1, '#7c3aed');
  ctx.fillStyle = canopyGrad;
  ctx.fill();
  // Canopy specular reflection
  ctx.beginPath();
  ctx.ellipse(-1.5, -PLAYER_SIZE * 0.35, 2, 3, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fill();

  // Ship ambient glow
  ctx.shadowColor = activeTheme.glow;
  ctx.shadowBlur = 20;

  // Draw Shield Bubble if active
  if (player.shieldActive) {
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_SIZE * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.fill();

    // Animated hexagonal shield segments
    const shieldPulse = 0.6 + 0.4 * Math.sin(frameCount * 0.1);
    ctx.strokeStyle = `rgba(216, 180, 254, ${shieldPulse})`;
    ctx.lineWidth = 1.5 + Math.sin(frameCount * 0.15) * 0.5;
    ctx.stroke();

    // Shield energy glow
    ctx.shadowColor = '#d8b4fe';
    ctx.shadowBlur = 12 + Math.sin(frameCount * 0.1) * 10;
    ctx.stroke();
  }

  ctx.restore();

  // Power-up indicators (drawn relative to ship position)
  let indicatorY = y + 45;
  if (player.multiShotActive > 0) {
    drawIndicator(x, indicatorY, player.multiShotActive / 600, '#fb923c');
    indicatorY += 8;
  }
  if (player.speedActive > 0) {
    drawIndicator(x, indicatorY, player.speedActive / 600, '#22c55e');
    indicatorY += 8;
  }
  if (player.bounceActive > 0) {
    drawIndicator(x, indicatorY, player.bounceActive / 600, '#fb7185');
    indicatorY += 8;
  }
}

function drawIndicator(x, y, percent, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(x - 20, y, 40, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x - 20, y, 40 * percent, 4);
  ctx.restore();
}

export function resetGameStateHelpers() {
  return { isResetting: true };
}

/** Spawn real-time floating quest progress notifications inside the active run */
export function showQuestNotificationInGame(text, color = '#38bdf8') {
  if (!canvas) return;
  // Spawn a nice long-lived floating notification at the top middle of the screen
  floatingTexts.push({
    x: canvas.width / 2,
    y: 120,
    text: text,
    color: color,
    life: 150, // 2.5 seconds
    maxLife: 150
  });
}

function saveLocalStats() {
  try {
    const raw = localStorage.getItem('stacks_hurry_local_stats');
/** @type {any} */
    let stats = {
      totalAsteroids: 0,
      totalEnemies: 0,
      totalDuration: 0,
      bulletsFired: 0,
      bulletsHit: 0,
      gamesPlayed: 0
    };
    if (raw) {
      const parsed = JSON.parse(raw);
      stats = { ...stats, ...parsed };
    }

    stats.totalAsteroids += asteroidsSmashedThisGame;
    stats.totalEnemies += enemiesDestroyedThisGame;
    stats.totalDuration += Math.floor(frameCount / 60);
    stats.bulletsFired += bulletsFiredThisGame;
    stats.bulletsHit += bulletsHitThisGame;
    stats.gamesPlayed += 1;

    localStorage.setItem('stacks_hurry_local_stats', JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save local stats:', e);
  }
}

