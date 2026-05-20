/**
 * Stacks Hurry - Enemy System
 * Manages UFOs and enemy projectiles
 */

import { spawnExplosion } from './particles.js';
import { playHit, playExplosion } from './audio.js';
import { BULLET_RADIUS, PLAYER_SIZE } from './constants.js';
import { seek } from './ai.js';
import { QuestsEventDispatcher } from './quests.js';

let enemies = [];
let enemyBullets = [];

export function updateEnemies(canvas, frameCount, player) {
  // Update enemies
  enemies = enemies.filter(e => {
    e.x += e.vx;
    e.y += e.vy;

    if (e.type === 'kamikaze') {
      // Advanced tracking using steering behaviors
      seek(e, player, 4.5, 0.04);
      
      // Trail
      if (frameCount % 2 === 0) {
        e.trail.push({ x: e.x, y: e.y, life: 15 });
      }
      e.trail = e.trail.filter(t => {
        t.life--;
        return t.life > 0;
      });
    } else if (e.type === 'elite') {
      // Elite: slow vertical bobbing and horizontal patrol
      e.y += Math.sin(frameCount * 0.03) * 0.4;
      if (e.x < 50 || e.x > canvas.width - 50) e.vx *= -1;

      // Fires 3-bullet spread
      if (frameCount % 130 === 0) {
        enemyBullets.push({ x: e.x, y: e.y + 12, vx: -1.5, vy: 3.5 });
        enemyBullets.push({ x: e.x, y: e.y + 12, vx: 0, vy: 4 });
        enemyBullets.push({ x: e.x, y: e.y + 12, vx: 1.5, vy: 3.5 });
      }
    } else {
      // Boundary bounce for UFOs
      if (e.x < 25 || e.x > canvas.width - 25) e.vx *= -1;

      // Shooting for UFOs
      if (frameCount % 120 === 0) {
        enemyBullets.push({
          x: e.x,
          y: e.y + 10,
          vx: 0,
          vy: 4,
        });
      }
    }

    // Off screen
    if (e.y > canvas.height + 50) return false;

    return true;
  });

  // Update bullets
  enemyBullets = enemyBullets.filter(b => {
    b.x += b.vx || 0;
    b.y += b.vy;
    return b.y <= canvas.height + 10 && b.x >= -10 && b.x <= canvas.width + 10;
  });
}

export function renderEnemies(ctx) {
  // Enemies
  enemies.forEach(e => {
    ctx.save();
    
    if (e.type === 'kamikaze') {
      // Draw Trail
      e.trail.forEach(t => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, e.radius * 0.4 * (t.life / 15), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(248, 113, 113, ${t.life / 30})`;
        ctx.fill();
      });

      ctx.translate(e.x, e.y);
      // Draw Kamikaze (Triangle ship)
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(-12, -10);
      ctx.lineTo(12, -10);
      ctx.closePath();
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (e.type === 'elite') {
      ctx.translate(e.x, e.y);
      // Draw Elite (Hex armored ship)
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(24, 0);
      ctx.lineTo(16, -18);
      ctx.lineTo(-16, -18);
      ctx.lineTo(-24, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Core glowing reactor
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = (Math.floor(Date.now() / 150) % 2 === 0) ? '#ef4444' : '#b91c1c';
      ctx.fill();
      
      // HP Bar above cruiser
      if (e.hp < e.maxHp) {
        const barW = 32;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barW/2, -26, barW, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-barW/2, -26, barW * (e.hp / e.maxHp), 4);
      }
    } else {
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
    }
    
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
  const rand = Math.random();
  let type = 'ufo';
  let radius = 20;
  let hp = 1;

  if (rand < 0.25) {
    type = 'kamikaze';
    radius = 15;
  } else if (rand < 0.45) {
    type = 'elite';
    radius = 28;
    hp = 3;
  }

  const isLeft = Math.random() > 0.5;

  enemies.push({
    x: isLeft ? -40 : canvas.width + 40,
    y: Math.random() * 120 + 60,
    vx: isLeft ? (type === 'kamikaze' ? 3.5 : (type === 'elite' ? 1.2 : 2.2)) : (type === 'kamikaze' ? -3.5 : (type === 'elite' ? -1.2 : -2.2)),
    vy: type === 'kamikaze' ? (1.2 + Math.random() * 0.3) : (type === 'elite' ? 0.25 : (0.5 + Math.random() * 0.2)),
    radius,
    type,
    hp,
    maxHp: hp,
    trail: []
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
        
        // Handle Elite Cruiser multi-hit logic
        if (e.type === 'elite') {
          e.hp--;
          spawnExplosion(b.x, b.y, 8, lowGraphics, '#fb923c');
          playHit();
          if (e.hp > 0) return null; // Don't destroy yet
        }
        
        enemies.splice(j, 1);
        const expColor = e.type === 'kamikaze' ? '#f87171' : (e.type === 'elite' ? '#fb923c' : '#94a3b8');
        spawnExplosion(e.x, e.y, e.radius, lowGraphics, expColor);
        playExplosion();
        const scoreAward = e.type === 'elite' ? 400 : 150;
        onEnemyHit(e.x, e.y, scoreAward);
        QuestsEventDispatcher.dispatchEvent('enemyDestroyed');
        return null; 
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

export function clearEnemyProjectiles(x, y, radius) {
  let clearedCount = 0;
  enemyBullets = enemyBullets.filter(b => {
    const dist = Math.hypot(b.x - x, b.y - y);
    if (dist < radius) {
      spawnExplosion(b.x, b.y, 5, true);
      clearedCount++;
      return false;
    }
    return true;
  });
  return clearedCount;
}

export const ADVANCED_EVASION_RATE = 1.2;
