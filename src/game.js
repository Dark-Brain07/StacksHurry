/**
 * Stacks Hurry - Game Engine
 * HTML5 Canvas rocket shooter with progressive difficulty
 */

import { playShoot, playExplosion, playHit, playGameOver, playLevelUp, playCollect, initAudio } from './audio.js';
import { COLORS, PLAYER_SIZE, BULLET_SPEED, BULLET_RADIUS } from './constants.js';

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
let particles = [];
let stars = [];
let powerups = [];
let enemies = [];
let enemyBullets = [];
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

// Callbacks
let onScoreUpdate = null;
let onLivesUpdate = null;
let onLevelUpdate = null;
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
  asteroidSpawnRate = 90;
  asteroidSpeed = 2;
  bullets = [];
  asteroids = [];
  particles = [];
  powerups = [];
  enemies = [];
  enemyBullets = [];
  floatingTexts = [];
  shootCooldown = 0;

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
  if (player.multiShotActive > 0) player.multiShotActive--;

  // Speed timer
  if (player.speedActive > 0) player.speedActive--;

  // Multiplier timer
  if (multiplierTimer > 0) {
    multiplierTimer--;
    if (multiplierTimer <= 0) comboCount = 0;
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
    spawnEnemy();
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
        spawnExplosion(a.x, a.y, a.radius);
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
          spawnExplosion(a.x, a.y, a.radius);
          playHit();
        } else {
          lives--;
          player.invincible = 90; // 1.5 sec invincibility
          shakeTime = 15;
          spawnExplosion(a.x, a.y, a.radius);
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

  // Update enemies
  enemies = enemies.filter(e => {
    e.x += e.vx;
    e.y += e.vy;

    // Bounce off edges
    if (e.x < 30 || e.x > canvas.width - 30) e.vx *= -1;

    // Alien shooting
    if (Math.random() < 0.015) {
      enemyBullets.push({ x: e.x, y: e.y + 10, vy: BULLET_SPEED * 0.8 });
    }

    // Off screen bottom
    if (e.y > canvas.height + 50) return false;

    // Bullet collision
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      const dist = Math.hypot(b.x - e.x, b.y - e.y);
      if (dist < e.radius + BULLET_RADIUS) {
        bullets.splice(i, 1);
        spawnExplosion(e.x, e.y, e.radius);
        playExplosion();

        // Score & Combo
        comboCount++;
        if (comboCount >= 5) multiplierTimer = 300;
        const mult = multiplierTimer > 0 ? 2 : 1;
        const points = 200 * mult;
        score += points;
        spawnFloatingText(e.x, e.y, `+${points}`);
        if (onScoreUpdate) onScoreUpdate(score);

        return false;
      }
    }

    // Player collision
    if (player.invincible <= 0) {
      const pDist = Math.hypot(player.x - e.x, player.y - e.y);
      if (pDist < e.radius + PLAYER_SIZE * 0.6) {
        if (player.shieldActive) {
          player.shieldActive = false;
          player.invincible = 30;
          spawnExplosion(e.x, e.y, e.radius);
          playHit();
          return false;
        } else {
          lives--;
          player.invincible = 90;
          shakeTime = 15;
          spawnExplosion(e.x, e.y, e.radius);
          playHit();
          if (onLivesUpdate) onLivesUpdate(lives);
          if (lives <= 0) {
            gameRunning = false;
            playGameOver();
            if (onGameOver) onGameOver({ score, level, asteroidsDestroyed });
          }
          return false;
        }
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
        player.multiShotActive = 600; // 10 seconds at 60fps
      } else if (p.type === 'speed') {
        player.speedActive = 600;
      } else if (p.type === 'health') {
        if (lives < 5) {
          lives++;
          if (onLivesUpdate) onLivesUpdate(lives);
        }
      }
      playCollect();
      score += 50; // Bonus score for collecting powerup
      if (onScoreUpdate) onScoreUpdate(score);
      return false;
    }

    return true;
  });

  // Update enemy bullets
  enemyBullets = enemyBullets.filter(b => {
    b.y += b.vy;
    if (b.y > canvas.height + 10) return false;

    // Player collision
    if (player.invincible <= 0) {
      const pDist = Math.hypot(player.x - b.x, player.y - b.y);
      if (pDist < BULLET_RADIUS + PLAYER_SIZE * 0.6) {
        if (player.shieldActive) {
          player.shieldActive = false;
          player.invincible = 30;
          spawnExplosion(b.x, b.y, 10);
          playHit();
        } else {
          lives--;
          player.invincible = 90;
          shakeTime = 15;
          spawnExplosion(b.x, b.y, 10);
          playHit();
          if (onLivesUpdate) onLivesUpdate(lives);
          if (lives <= 0) {
            gameRunning = false;
            playGameOver();
            if (onGameOver) onGameOver({ score, level, asteroidsDestroyed });
          }
        }
        return false;
      }
    }
    return true;
  });

  // Update particles
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.vx *= 0.98;
    p.vy *= 0.98;
    return p.life > 0;
  });

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

function spawnExplosion(x, y, radius) {
  const count = Math.floor(radius * 1.5) + 8;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 1;
    const colors = ['#00f0ff', '#a855f7', '#fb923c', '#f87171', '#fbbf24', '#f0f4ff'];
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: Math.floor(Math.random() * 30) + 15,
      maxLife: 45,
      radius: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
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

function spawnEnemy() {
  const isLeft = Math.random() > 0.5;
  enemies.push({
    x: isLeft ? -30 : canvas.width + 30,
    y: Math.random() * 100 + 50,
    vx: isLeft ? 2 : -2,
    vy: 0.5,
    radius: 20,
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

  // Particles
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

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
  enemies.forEach(e => {
    ctx.save();
    ctx.translate(e.x, e.y);

    // UFO Base
    ctx.beginPath();
    ctx.ellipse(0, 5, 24, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#64748b'; // Grey metal
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // UFO Dome
    ctx.beginPath();
    ctx.ellipse(0, -2, 12, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'; // Red glass dome
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.stroke();

    // Dome glow
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Alien eye (pulsing)
    ctx.beginPath();
    ctx.arc(0, -2, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(frameCount * 0.1) * 0.5})`;
    ctx.fill();

    ctx.restore();
  });

  // Enemy Bullets
  enemyBullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444'; // Red bullet
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x, b.y - 12);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

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
}
