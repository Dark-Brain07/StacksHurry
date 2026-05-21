/**
 * Stacks Hurry - Particle System
 * Manages explosions and visual feedback effects using high-performance object pooling
 */

/**
 * Represents a single visual particle effect element.
 * Utilizes an object pooling pattern to avoid garbage collection during gameplay.
 */
export class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0;
    this.color = '#ffffff';
    this.radius = 1;
    this.active = false;
  }

  init(x, y, vx, vy, life, color, radius) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.radius = radius;
    this.active = true;
  }

  update() {
    if (!this.active) return false;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.vx *= 0.98;
    this.vy *= 0.98;
    if (this.life <= 0) {
      this.active = false;
    }
    return this.active;
  }

  render(ctx) {
    if (!this.active) return;
    const alpha = this.life / this.maxLife;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/**
 * Streamlined Particle Pool for zero GC allocations.
 * Reuses inactive particles instead of instantiating new ones.
 */
class ParticlePool {
  constructor(size = 800) {
    this.pool = Array.from({ length: size }, () => new Particle());
  }

  get(x, y, vx, vy, life, color, radius) {
    const p = this.pool.find(item => !item.active) || this.pool[0];
    p.init(x, y, vx, vy, life, color, radius);
    return p;
  }

  reset() {
    this.pool.forEach(p => p.active = false);
  }
}

const poolInstance = new ParticlePool(1000);
let particles = [];

export function getParticleCount() { return particles.length; }

export function updateParticles() {
  particles = particles.filter(p => p.update());
}

export function renderParticles(ctx) {
  if (!ctx) return;
  particles.forEach(p => p.render(ctx));
}

export function spawnExplosion(x, y, radius, lowGraphics = false, colorOverride = null) {
  const baseCount = Math.floor(radius * 1.5) + 8;
  const count = lowGraphics ? Math.floor(baseCount / 3) : baseCount;
  
  let palette;
  if (colorOverride) {
    palette = [colorOverride];
  } else if (radius > 25) {
    palette = ['#f87171', '#fb923c', '#fbbf24', '#b91c1c', '#ea580c'];
  } else if (radius > 15) {
    palette = ['#00f0ff', '#a855f7', '#f472b6', '#3b82f6', '#8b5cf6'];
  } else {
    palette = ['#e0e7ff', '#f0f4ff', '#00f0ff', '#fbbf24'];
  }
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 1.5;
    const particleLife = Math.floor(Math.random() * 40) + 20;
    
    particles.push(poolInstance.get(
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
  poolInstance.reset();
}

export const BASE_PARTICLE_DECAY = 0.05;

export function spawnPlayerExhaust(x, y, vx, vy, color = '#00f0ff', yOffset = 14) {
  const angle = Math.atan2(vy, vx) + Math.PI + (Math.random() - 0.5) * 0.4;
  const speed = Math.hypot(vx, vy) * 0.3 + Math.random() * 1.2 + 0.6;
  const px = x + (Math.random() - 0.5) * 6;
  const py = y + yOffset; // Base of the player ship
  const life = Math.floor(Math.random() * 12) + 8;
  const radius = Math.random() * 2.2 + 0.8;
  
  particles.push(poolInstance.get(
    px,
    py,
    Math.cos(angle) * speed,
    Math.sin(angle) * speed + 2.5, // Drift downward
    life,
    color,
    radius
  ));
}
