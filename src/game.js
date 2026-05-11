/**
 * Stacks Hurry - Game Engine
 * HTML5 Canvas rocket shooter with progressive difficulty
 */

import { playShoot, playExplosion, playHit, playGameOver, playLevelUp, playCollect, playWarning, playShockwave, initAudio } from './audio.js';
import { COLORS, PLAYER_SIZE, BULLET_SPEED, BULLET_RADIUS } from './constants.js';
import { updateParticles, renderParticles, spawnExplosion, resetParticles } from './particles.js';
import { updateEnemies, renderEnemies, spawnEnemy, checkEnemyCollisions, resetEnemies, clearEnemyProjectiles } from './enemies.js';

// ─── Game State ───
let canvas, ctx;
let animFrameId = null;
let gameRunning = false;
let gamePaused = false;
let onPauseToggle = null;

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
let shakeTime = 0;

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
let secondaryCooldown = 0;
let shockwave = { active: false, x: 0, y: 0, radius: 0 };
let lastTouchTime = 0;

// Callbacks
let onScoreUpdate = null;
let onLivesUpdate = null;
let onLevelUpdate = null;
let onLevelProgress = null;
let onGameOver = null;

// ─── Constants ───
import { PLAYER_SIZE, BULLET_SPEED, BULLET_RADIUS, SHOOT_COOLDOWN, LEVEL_THRESHOLD, COLORS } from './constants.js';

// ─── Initialization ───

export function initGame(canvasEl, callbacks) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');

  onScoreUpdate = callbacks.onScoreUpdate;
  onLivesUpdate = callbacks.onLivesUpdate;
  onLevelUpdate = callbacks.onLevelUpdate;
  onLevelProgress = callbacks.onLevelProgress;
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

export function setLowGraphics(enabled) {
  lowGraphics = enabled;
}

export function startGame() {
  // Reset state
  score = 0;
  lives = 3;
  level = 1;
  asteroidsDestroyed = 0;
  frameCount = 0;
  comboCount = 0;
  multiplierTimer = 0;
  asteroidSpawnRate = 90;
  asteroidSpeed = 2;
  bullets = [];
  asteroids = [];
  powerups = [];
  floatingTexts = [];
  shootCooldown = 0;
  secondaryCooldown = 0;
  shockwave.active = false;
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
    secondaryCooldown = 300;
    playShockwave();
    shakeTime = 10;
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
    player.x += dx * speedMult;
    player.y += dy * speedMult;
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

  // Secondary cooldown
  if (secondaryCooldown > 0) secondaryCooldown--;

  // Shockwave logic
  if (shockwave.active) {
    shockwave.radius += 10;
    if (shockwave.radius > 250) shockwave.active = false;

    // Push asteroids
    asteroids.forEach(a => {
      const dist = Math.hypot(a.x - shockwave.x, a.y - shockwave.y);
      if (dist < shockwave.radius && dist > shockwave.radius - 40) {
        const angle = Math.atan2(a.y - shockwave.y, a.x - shockwave.x);
        a.x += Math.cos(angle) * 8;
        a.y += Math.sin(angle) * 8;
      }
    });

    // Clear projectiles
    clearEnemyProjectiles(shockwave.x, shockwave.y, shockwave.radius);
  }

  // Shooting
  if (shootCooldown > 0) shootCooldown--;
  if (shooting && shootCooldown <= 0) {
    fireBullet();
    shootCooldown = SHOOT_COOLDOWN;
  }

  // Update bullets
  bullets = bullets.filter(b => {
    b.x += b.vx;
    b.y += b.vy;
    return b.y > -10 && b.x > -10 && b.x < canvas.width + 10;
  });

  // Spawn asteroids
  if (frameCount % asteroidSpawnRate === 0) {
    spawnAsteroid();
  }

  // Spawn enemies
  if (frameCount > 0 && frameCount % 400 === 0) {
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
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      if (dist < a.radius + BULLET_RADIUS) {
        bullets.splice(i, 1);
        spawnExplosion(a.x, a.y, a.radius, lowGraphics);
        playExplosion();

        // Score & Combo
        comboCount++;
        if (comboCount >= 5) multiplierTimer = 300; // 5 sec of 2x
        const mult = multiplierTimer > 0 ? 2 : 1;
        const points = Math.ceil(a.radius * 2) * mult;
        score += points;
        spawnFloatingText(a.x, a.y, `+${points}`);
        asteroidsDestroyed++;
        if (onScoreUpdate) onScoreUpdate(score);
        if (onLevelProgress) {
          const progress = (asteroidsDestroyed % LEVEL_THRESHOLD) / LEVEL_THRESHOLD * 100;
          onLevelProgress(progress);
        }

        // Level up
        if (asteroidsDestroyed % LEVEL_THRESHOLD === 0) {
          level++;
          asteroidSpawnRate = Math.max(20, 90 - level * 8);
          asteroidSpeed = 2 + level * 0.4;
          if (onLevelUpdate) onLevelUpdate(level);
          playLevelUp();
        }

        // Random powerup drop (8% chance)
        if (Math.random() < 0.08) spawnPowerup(a.x, a.y);

        return false;
      }
    }

    // Player collision
    if (player.invincible <= 0) {
      const pDist = Math.hypot(player.x - a.x, player.y - a.y);
      if (pDist < a.radius + PLAYER_SIZE * 0.6) {
        if (player.shieldActive) {
          player.shieldActive = false;
          player.invincible = 30; // Short invincibility after shield break
          spawnExplosion(a.x, a.y, a.radius, lowGraphics);
          playHit();
        } else {
          lives--;
          player.invincible = 90; // 1.5 sec invincibility
          shakeTime = 15;
          spawnExplosion(a.x, a.y, a.radius, lowGraphics);
          playHit();

          if (onLivesUpdate) onLivesUpdate(lives);

          if (lives <= 0) {
            gameRunning = false;
            playGameOver();
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
    const pDist = Math.hypot(player.x - p.x, player.y - p.y);
    if (pDist < 20 + PLAYER_SIZE * 0.6) {
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
      shakeTime = 15;
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
  const starSpeedMult = 1 + (level * 0.2);
  stars.forEach(s => {
    s.y += s.speed * starSpeedMult;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });
}

// ─── Spawn Functions ───

function fireBullet() {
  const bSpeed = player.speedActive > 0 ? BULLET_SPEED * 1.5 : BULLET_SPEED;

  if (player.multiShotActive > 0) {
    // 3 bullets
    bullets.push({ x: player.x, y: player.y - PLAYER_SIZE, vx: 0, vy: -bSpeed });
    bullets.push({ x: player.x - 12, y: player.y - PLAYER_SIZE + 5, vx: -bSpeed * 0.2, vy: -bSpeed * 0.98 });
    bullets.push({ x: player.x + 12, y: player.y - PLAYER_SIZE + 5, vx: bSpeed * 0.2, vy: -bSpeed * 0.98 });
  } else {
    // Standard 2 bullets
    bullets.push({ x: player.x - 8, y: player.y - PLAYER_SIZE, vx: 0, vy: -bSpeed });
    bullets.push({ x: player.x + 8, y: player.y - PLAYER_SIZE, vx: 0, vy: -bSpeed });
  }
  playShoot();
}

function spawnAsteroid() {
  const radius = Math.random() * 20 + 14;
  asteroids.push({
    x: Math.random() * (canvas.width - 60) + 30,
    y: -50,
    radius,
    speed: asteroidSpeed + Math.random() * 1.5,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.06,
    vertices: generateAsteroidShape(radius),
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



function spawnFloatingText(x, y, text) {
  floatingTexts.push({
    x,
    y,
    text,
    life: 30,
  });
}

// ─── Render ───

function render() {
  // Clear
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  if (shakeTime > 0) {
    const dx = (Math.random() - 0.5) * 15;
    const dy = (Math.random() - 0.5) * 15;
    ctx.translate(dx, dy);
    shakeTime--;
  }

  // Stars
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
    ctx.fill();
  });

  // Shockwave
  if (shockwave.active) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 240, 255, ${1 - shockwave.radius / 250})`;
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

    ctx.fillStyle = 'rgba(100,116,139,0.6)';
    ctx.fill();
    ctx.strokeStyle = COLORS.asteroidStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  });

  // Enemies
  // Enemies
  renderEnemies(ctx);

  // Floating texts
  floatingTexts.forEach(ft => {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${ft.life / 30})`;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowBlur = 5;
    ctx.fillText(ft.text, ft.x, ft.y);
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
