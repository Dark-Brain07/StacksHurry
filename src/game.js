/**
 * Stacks Hurry - Game Engine
 * HTML5 Canvas rocket shooter with progressive difficulty
 */

import { playShoot, playExplosion, playHit, playGameOver, playLevelUp, playCollect, playWarning, playShockwave, initAudio, playShieldHit, playWaveClear } from './audio.js';
import { 
  COLORS, PLAYER_SIZE, BULLET_SPEED, BULLET_RADIUS, SHOOT_COOLDOWN, 
  LEVEL_THRESHOLD, COMBO_TIMEOUT, POWERUP_DURATION, POWERUP_CHANCE,
  INITIAL_SPAWN_RATE, MIN_SPAWN_RATE, INITIAL_ASTEROID_SPEED,
  SHOCKWAVE_COOLDOWN, SHOCKWAVE_RADIUS
} from './constants.js';
import { updateParticles, renderParticles, spawnExplosion, resetParticles } from './particles.js';
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
  constructor(createFn) {
    this.pool = [];
    this.createFn = createFn;
  }
  get() {
    return this.pool.length > 0 ? this.pool.pop() : this.createFn();
  }
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
let powerups = [];
let floatingTexts = [];

// Stats
let score = 0;
let lives = 3;
let level = 1;
let asteroidsDestroyed = 0;
let frameCount = 0;
let comboCount = 0;
let multiplierTimer = 0;
let shake = { duration: 0, intensity: 0 };
let currentWave = 1;
let waveEnemiesRemaining = 0;
let waveInProgress = false;
let waveGracePeriod = 0;

/**
 * Trigger a screen shake with specific intensity
 */
export function addShake(duration, intensity) {
  const actualIntensity = intensity * shakeMultiplier;
  if (actualIntensity >= shake.intensity || shake.duration <= 0) {
    shake.duration = duration;
    shake.intensity = actualIntensity;
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
let shakeMultiplier = 1.0;

export function setSettings(settings) {
  if (settings.lowGraphics !== undefined) lowGraphics = settings.lowGraphics;
  if (settings.autoFire !== undefined) autoFire = settings.autoFire;
  if (settings.shakeMultiplier !== undefined) shakeMultiplier = settings.shakeMultiplier;
}
let secondaryCooldown = 0;
let shockwave = { active: false, x: 0, y: 0, radius: 0 };
let lastTouchTime = 0;
let warpTime = 0;
let achievements = { score1k: false, level5: false, asteroids50: false };

// Callbacks
let onScoreUpdate = null;
let onLivesUpdate = null;
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
  
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameRunning) togglePause();
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

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function generateStars() {
  stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.5 + 0.1,
      brightness: Math.random() * 0.5 + 0.3,
    });
  }
}

// ─── Input Handlers ───

function handleMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
}

function handleMouseDown(e) {
  initAudio();
  shooting = true;
}

function handleMouseUp() {
  shooting = false;
}

function handleTouchMove(e) {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    if (joystick.active && touch.identifier === joystick.pointerId) {
      joystick.dx = touch.clientX - joystick.startX;
      joystick.dy = touch.clientY - joystick.startY;
      const maxDist = 40;
      const dist = Math.hypot(joystick.dx, joystick.dy);
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

function handleTouchStart(e) {
  e.preventDefault();
  initAudio();
  
  // Double tap detection
  const now = Date.now();
  if (now - lastTouchTime < 300) {
    triggerSecondary();
  }
  lastTouchTime = now;

  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
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

function handleTouchEnd(e) {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
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

function triggerSecondary() {
  if (secondaryCooldown <= 0 && gameRunning && !gamePaused) {
    shockwave.active = true;
    shockwave.x = player.x;
    shockwave.y = player.y;
    shockwave.radius = 0;
    secondaryCooldown = SHOCKWAVE_COOLDOWN;
    playShockwave();
    addShake(10, 15);
  }
}

// ─── Main Loop ───

function gameLoop() {
  if (!gameRunning) return;

  if (!gamePaused) {
    update();
    render();
  }

  animFrameId = requestAnimationFrame(gameLoop);
}

// ─── Update ───

function update() {
  frameCount++;

  // Smooth player follow
  const speedMult = player.speedActive > 0 ? 0.22 : 0.12;
  if (joystick.active) {
    player.x += joystick.dx * 0.15;
    player.y += joystick.dy * 0.15;
    mouseX = player.x; // Sync mouse
    mouseY = player.y;
  } else {
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    player.x += (dx * speedMult) + player.kickbackX;
    player.y += (dy * speedMult) + player.kickbackY;
    
    // Friction
    player.kickbackX *= 0.85;
    player.kickbackY *= 0.85;
  }

  // Clamp to canvas
  player.x = Math.max(PLAYER_SIZE, Math.min(canvas.width - PLAYER_SIZE, player.x));
  player.y = Math.max(PLAYER_SIZE * 2, Math.min(canvas.height - PLAYER_SIZE, player.y));

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
    if (player.speedActive === 120 || player.speedActive === 60 || player.speedActive === 30) {
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
      }
    });

    // Clear projectiles
    clearEnemyProjectiles(shockwave.x, shockwave.y, shockwave.radius);
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
      if (b.target.hp <= 0 || b.target.y > canvas.height) {
        b.target = null;
      } else {
        seek(b, b.target, BULLET_SPEED * 1.2, 0.08);
      }
    }
    
    b.x += b.vx;
    b.y += b.vy;
    const active = b.y > -10 && b.x > -10 && b.x < canvas.width + 10;
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
    a.y += a.speed;
    a.rotation += a.rotationSpeed;

    // Off screen
    if (a.y > canvas.height + 50) return false;

    // Bullet collision
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (checkCircleCollision(b.x, b.y, BULLET_RADIUS, a.x, a.y, a.radius)) {
        bulletPool.release(bullets.splice(i, 1)[0]);
        
        a.hp--;
        if (a.hp > 0) {
          if (a.isShielded) playShieldHit();
          else playHit();
          spawnExplosion(b.x, b.y, 8, lowGraphics); 
          continue; 
        }

        spawnExplosion(a.x, a.y, a.radius, lowGraphics, a.isShielded ? '#00f0ff' : null);
        playExplosion();

        // Score & Combo
        comboCount++;
        if (comboCount >= 5) multiplierTimer = Math.max(120, COMBO_TIMEOUT - level * 10); 
        const mult = multiplierTimer > 0 ? 2 : 1;
        const points = Math.ceil(a.radius * 2) * (a.isShielded ? 3 : 1) * mult;
        score += points;
        if (a.isShielded) {
          spawnFloatingText(a.x, a.y - 20, "CRIT!", "#fbbf24");
        }
        
        spawnFloatingText(a.x, a.y, `+${points}`);
        asteroidsDestroyed++;
        
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
          spawnSmallAsteroid(a.x - 10, a.y, a.radius * 0.6);
          spawnSmallAsteroid(a.x + 10, a.y, a.radius * 0.6);
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
        } else {
          lives--;
          player.invincible = 90; // 1.5 sec invincibility
          addShake(15, 20);
          spawnExplosion(a.x, a.y, a.radius, lowGraphics);
          playHit();
          if (onVibrate) onVibrate([150, 100, 150]);

          if (onLivesUpdate) onLivesUpdate(lives);

          if (lives <= 0) {
            gameRunning = false;
            playGameOver();

            // Dispatch game event to decentralized Quests listener
            QuestsEventDispatcher.dispatchEvent('gameFinished', { score });

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

    if (p.y > canvas.height + 30) return false;

    // Player collects powerup
    if (checkCircleCollision(player.x, player.y, PLAYER_SIZE * 0.6, p.x, p.y, 20)) {
      if (p.type === 'shield') {
        player.shieldActive = true;
      } else if (p.type === 'multishot') {
        player.multiShotActive = 600;
      } else if (p.type === 'speed') {
        player.speedActive = 600;
      } else if (p.type === 'health') {
        if (lives < 5) {
          lives++;
          if (onLivesUpdate) onLivesUpdate(lives);
        }
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
    spawnFloatingText(x, y, `+${finalPoints}`);
    if (onScoreUpdate) onScoreUpdate(score);
    comboCount++;
    if (comboCount >= 5) multiplierTimer = 300;
  }, lowGraphics);

  if (enemyCollision) {
    if (player.shieldActive) {
      player.shieldActive = false;
      player.invincible = 30;
      playHit();
    } else {
      lives--;
      player.invincible = 90;
      addShake(15, 20);
      playHit();
      if (onLivesUpdate) onLivesUpdate(lives);
      if (lives <= 0) {
        gameRunning = false;
        playGameOver();
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

  // Update stars
  if (warpTime > 0) warpTime--;
  const starSpeedMult = (1 + (level * 0.2)) * (warpTime > 0 ? 15 : 1);
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
  waveEnemiesRemaining = 5 + (currentWave * 2);
  waveInProgress = true;
  waveGracePeriod = 120;
  spawnFloatingText(canvas.width / 2, canvas.height / 2, `WAVE ${currentWave}`);
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
  return b;
}

function fireBullet() {
  const bSpeed = player.speedActive > 0 ? BULLET_SPEED * 1.5 : BULLET_SPEED;

  if (player.multiShotActive > 0) {
    bullets.push(createBullet(player.x, player.y - PLAYER_SIZE, 0, -bSpeed, true));
    bullets.push(createBullet(player.x - 12, player.y - PLAYER_SIZE + 5, -bSpeed * 0.2, -bSpeed * 0.98, true));
    bullets.push(createBullet(player.x + 12, player.y - PLAYER_SIZE + 5, bSpeed * 0.2, -bSpeed * 0.98, true));
    player.kickbackY += 4; // Extra recoil for heavy weapons
  } else {
    bullets.push(createBullet(player.x - 8, player.y - PLAYER_SIZE, 0, -bSpeed));
    bullets.push(createBullet(player.x + 8, player.y - PLAYER_SIZE, 0, -bSpeed));
    player.kickbackY += 2;
  }
  playShoot();
}

function spawnAsteroid() {
  const radius = Math.random() * 26 + 14; 
  const isShielded = level > 2 && Math.random() < (0.1 + (level * 0.02));
  
  asteroids.push({
    x: Math.random() * (canvas.width - 60) + 30,
    y: -50,
    radius,
    speed: asteroidSpeed + Math.random() * 1.5,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.06,
    vertices: generateAsteroidShape(radius),
    hp: isShielded ? 3 : 1,
    isShielded: isShielded
  });
}

function spawnSmallAsteroid(x, y, radius) {
  asteroids.push({
    x,
    y,
    radius,
    speed: asteroidSpeed * 1.3,
    rotation: Math.random() * Math.PI,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
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
  if (rand < 0.25) type = 'shield';
  else if (rand < 0.5) type = 'multishot';
  else if (rand < 0.75) type = 'speed';
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
  floatingTexts.push({
    x,
    y,
    text,
    color,
    life: 30,
    maxLife: 30
  });
}

// ─── Render ───

function render() {
  // Clear
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  if (shake.duration > 0) {
    const dx = (Math.random() - 0.5) * shake.intensity;
    const dy = (Math.random() - 0.5) * shake.intensity;
    ctx.translate(dx, dy);
    shake.duration--;
    shake.intensity *= 0.9; // Smooth decay
  }

  // Stars
  stars.forEach(s => {
    if (warpTime > 0) {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x, s.y + s.radius * 20);
      ctx.strokeStyle = `rgba(255, 255, 255, ${s.brightness * (warpTime / 60)})`;
      ctx.lineWidth = s.radius;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
      ctx.fill();
    }
  });

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
  renderParticles(ctx);

  // Bullets
  bullets.forEach(b => {
    // Glow
    ctx.beginPath();
    ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bulletGlow;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bullet;
    ctx.fill();

    // Trail
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x, b.y + 12);
    ctx.strokeStyle = 'rgba(0,240,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

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
      ctx.fillStyle = `rgba(0, 240, 255, ${0.1 + (a.hp / 3) * 0.2})`;
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = 'rgba(100,116,139,0.6)';
      ctx.fill();
      ctx.strokeStyle = COLORS.asteroidStroke;
      ctx.lineWidth = 2;
    }
    ctx.stroke();

    ctx.restore();

    // HP Bar for shielded
    if (a.isShielded && a.hp < 3) {
      const barWidth = a.radius * 1.5;
      const barHeight = 4;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(a.x - barWidth/2, a.y - a.radius - 12, barWidth, barHeight);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(a.x - barWidth/2, a.y - a.radius - 12, barWidth * (a.hp / 3), barHeight);
    }
  });

  // Enemies
  // Enemies
  renderEnemies(ctx);

  // Floating texts
  floatingTexts.forEach(ft => {
    ctx.save();
    ctx.fillStyle = ft.color;
    ctx.globalAlpha = ft.life / ft.maxLife;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowBlur = 5;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.globalAlpha = 1.0;
    ctx.restore();
  });

  // Powerups
  powerups.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

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

  ctx.restore(); // Restore shake transform
}

function drawPlayer() {
  const { x, y, invincible } = player;

  // Skip every other frame when invincible (blink)
  if (invincible > 0 && frameCount % 6 < 3) return;

  ctx.save();
  ctx.translate(x, y);

  // Engine glow
  const glowGrad = ctx.createRadialGradient(0, PLAYER_SIZE * 0.5, 2, 0, PLAYER_SIZE * 0.5, PLAYER_SIZE);
  glowGrad.addColorStop(0, 'rgba(251,146,60,0.8)');
  glowGrad.addColorStop(0.5, 'rgba(251,146,60,0.3)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(-PLAYER_SIZE, 0, PLAYER_SIZE * 2, PLAYER_SIZE * 1.5);

  // Engine flame
  const flameHeight = PLAYER_SIZE * 0.5 + Math.sin(frameCount * 0.3) * 6;
  ctx.beginPath();
  ctx.moveTo(-6, PLAYER_SIZE * 0.3);
  ctx.lineTo(0, PLAYER_SIZE * 0.3 + flameHeight);
  ctx.lineTo(6, PLAYER_SIZE * 0.3);
  ctx.fillStyle = '#fb923c';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-3, PLAYER_SIZE * 0.3);
  ctx.lineTo(0, PLAYER_SIZE * 0.3 + flameHeight * 0.6);
  ctx.lineTo(3, PLAYER_SIZE * 0.3);
  ctx.fillStyle = '#fbbf24';
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
  bodyGrad.addColorStop(0, '#00f0ff');
  bodyGrad.addColorStop(0.5, '#0088aa');
  bodyGrad.addColorStop(1, '#004466');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,240,255,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cockpit
  ctx.beginPath();
  ctx.ellipse(0, -PLAYER_SIZE * 0.3, 5, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#a855f7';
  ctx.fill();
  ctx.strokeStyle = 'rgba(168,85,247,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Ship glow
  ctx.shadowColor = 'rgba(0,240,255,0.4)';
  ctx.shadowBlur = 20;

  // Draw Shield Bubble if active
  if (player.shieldActive) {
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_SIZE * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.2)'; // Transparent purple
    ctx.fill();
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pulse effect
    ctx.shadowColor = '#d8b4fe';
    ctx.shadowBlur = 15 + Math.sin(frameCount * 0.1) * 10;
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
}

function drawIndicator(x, y, percent, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(x - 20, y, 40, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x - 20, y, 40 * percent, 4);
  ctx.restore();
}
