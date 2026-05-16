/**
 * Stacks Hurry - Particle System
 * Manages explosions and visual feedback effects
 */

export class Particle {
  constructor(x, y, vx, vy, life, color, radius) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.radius = radius;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.vx *= 0.98;
    this.vy *= 0.98;
    return this.life > 0;
  }

  render(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

let particles = [];

export function getParticleCount() { return particles.length; }

export function updateParticles() {
  particles = particles.filter(p => p.update());
}

export function renderParticles(ctx) {
  particles.forEach(p => p.render(ctx));
}

export function spawnExplosion(x, y, radius, lowGraphics = false, colorOverride = null) {
  const baseCount = Math.floor(radius * 1.5) + 8; // Optimized for mobile
  const count = lowGraphics ? Math.floor(baseCount / 3) : baseCount;
  
  // Mass-based color palettes
  let palette;
  if (colorOverride) {
    palette = [colorOverride];
  } else if (radius > 25) {
    // Heavy mass: fiery dense core
    palette = ['#f87171', '#fb923c', '#fbbf24', '#b91c1c', '#ea580c'];
  } else if (radius > 15) {
    // Medium mass: vibrant cosmic plasma
    palette = ['#00f0ff', '#a855f7', '#f472b6', '#3b82f6', '#8b5cf6'];
  } else {
    // Light mass: quick bright sparks
    palette = ['#e0e7ff', '#f0f4ff', '#00f0ff', '#fbbf24'];
  }
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 1.5;
    const particleLife = Math.floor(Math.random() * 40) + 20;
    
    particles.push(new Particle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      particleLife,
      palette[Math.floor(Math.random() * palette.length)],
      Math.random() * 4 + 1.5
    ));
  }
}

export function resetParticles() {
  particles = [];
}

export const BASE_PARTICLE_DECAY = 0.05;
