/**
 * Stacks Hurry - Enemy System
 * Manages UFOs and enemy projectiles
 */

import { spawnExplosion } from './particles.js';
import { playHit, playExplosion } from './audio.js';
import { BULLET_RADIUS, PLAYER_SIZE } from './constants.js';

let enemies = [];
let enemyBullets = [];

export function updateEnemies(canvas, frameCount) {
  // Update enemies
  enemies = enemies.filter(e => {
    e.x += e.vx;
    e.y += e.vy;

    // Boundary bounce
    if (e.x < 20 || e.x > canvas.width - 20) e.vx *= -1;

    // Off screen
    if (e.y > canvas.height + 50) return false;

    // Shooting
    if (frameCount % 120 === 0) {
      enemyBullets.push({
        x: e.x,
        y: e.y + 10,
        vy: 4,
      });
    }

    return true;
  });

  // Update bullets
  enemyBullets = enemyBullets.filter(b => {
    b.y += b.vy;
    return b.y <= canvas.height + 10;
  });
}

export function renderEnemies(ctx) {
  // Enemies
  enemies.forEach(e => {
    ctx.save();
    ctx.translate(e.x, e.y);
    
    // Draw UFO
    ctx.beginPath();
    ctx.ellipse(0, 5, 24, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#64748b';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, 12, Math.PI, 0);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.fill();
    
    // Lights
    const lightColor = (Math.floor(Date.now() / 200) % 2 === 0) ? '#00f0ff' : '#f87171';
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.arc(-12, 6, 2, 0, Math.PI * 2);
    ctx.arc(0, 7, 2, 0, Math.PI * 2);
    ctx.arc(12, 6, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  });

  // Bullets
  enemyBullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#f87171';
    ctx.fill();
  });
}

export function spawnEnemy(canvas) {
  const isLeft = Math.random() > 0.5;
  enemies.push({
    x: isLeft ? -30 : canvas.width + 30,
    y: Math.random() * 100 + 50,
    vx: isLeft ? 2 : -2,
    vy: 0.5,
    radius: 20,
  });
}

export function checkEnemyCollisions(player, bullets, onEnemyHit, lowGraphics) {
  // Bullets vs Enemies
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dist = Math.hypot(b.x - e.x, b.y - e.y);
      if (dist < e.radius + BULLET_RADIUS) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        spawnExplosion(e.x, e.y, e.radius, lowGraphics);
        playExplosion();
        onEnemyHit(e.x, e.y, 150);
        return; 
      }
    }
  }

  // Player vs Enemy Bullets
  if (player.invincible <= 0) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      const dist = Math.hypot(player.x - b.x, player.y - b.y);
      if (dist < BULLET_RADIUS + PLAYER_SIZE * 0.6) {
        enemyBullets.splice(i, 1);
        return 'bullet';
      }
    }
    
    // Player vs Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const dist = Math.hypot(player.x - e.x, player.y - e.y);
      if (dist < e.radius + PLAYER_SIZE * 0.6) {
        enemies.splice(i, 1);
        return 'enemy';
      }
    }
  }
  return null;
}

export function resetEnemies() {
  enemies = [];
  enemyBullets = [];
}
