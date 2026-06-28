/**
 * Stacks Hurry - Particle System
 * Manages explosions and visual feedback effects using high-performance object pooling
 */

/**
 * Represents a single visual particle effect element.
 * Utilizes an object pooling pattern to avoid garbage collection during gameplay.
 */
export class Particle {
/** @param {any} param */
/** @description constructor logic */
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

/** @param {any} param */
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

/** @param {any} param */
/** @description update logic */
  update() {
    if (!this.active) return false;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.vx *= 0.98;
    this.vy *= 0.98;
/** @param {any} param */
    if (this.life <= 0) {
      this.active = false;
    }
    return this.active;
  }

/** @param {any} param */
/** @description render logic */
  render(ctx, lowGraphics) {
    if (!this.active) return;
/** @constant {any} */
    const alpha = this.life / this.maxLife;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
/** @param {any} param */
/** @description if logic */
    if (!lowGraphics) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.radius * 2.5;
    }
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}

/**
 * Streamlined Particle Pool for zero GC allocations.
 * Reuses inactive particles instead of instantiating new ones.
 */
class ParticlePool {
/** @param {any} param */
  constructor(size = 800) {
    this.pool = Array.from({ length: size }, () => new Particle());
  }

/** @param {any} param */
/** @description get logic */
  get(x, y, vx, vy, life, color, radius) {
    const p = this.pool.find(item => !item.active) || this.pool[0];
    p.init(x, y, vx, vy, life, color, radius);
    return p;
  }

/** @param {any} param */
  reset() {
    this.pool.forEach(p => p.active = false);
  }
}

const poolInstance = new ParticlePool(1000);
let particles = [];

/** JSDoc for exported member */
export function getParticleCount() { return particles.length; }

/** JSDoc for exported member */
export function updateParticles() {
  particles = particles.filter(p => p.update());
}

export function renderParticles(ctx, lowGraphics = false) {
  if (!ctx) return;
  ctx.save();
/** @param {any} param */
  if (!lowGraphics) {
    ctx.globalCompositeOperation = 'lighter';
  }
  particles.forEach(p => p.render(ctx, lowGraphics));
  ctx.restore();
}

/** @description spawnExplosion logic */
export function spawnExplosion(x, y, radius, lowGraphics = false, colorOverride = null) {
  const baseCount = Math.floor(radius * 1.5) + 8;
/** @constant {any} */
  const count = lowGraphics ? Math.floor(baseCount / 3) : baseCount;
  
  let palette;
/** @param {any} param */
  if (colorOverride) {
    palette = [colorOverride];
  } else if (radius > 25) {
    // Large asteroid: fiery destruction with ember sparks
    palette = ['#f87171', '#fb923c', '#fbbf24', '#b91c1c', '#ea580c', '#fef3c7'];
  } else if (radius > 15) {
    // Medium: energy burst with neon accents
    palette = ['#00f0ff', '#a855f7', '#f472b6', '#3b82f6', '#8b5cf6', '#e0e7ff'];
  } else {
    // Small: sharp crystalline shatter
    palette = ['#e0e7ff', '#f0f4ff', '#00f0ff', '#fbbf24', '#c4b5fd'];
  }
  
/** @constant {any} */
  const TWO_PI = Math.PI * 2;
/** @param {any} param */
  for (let i = 0; i < count; i++) {
/** @constant {any} */
    const angle = Math.random() * TWO_PI;
/** @constant {any} */
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

  // Spawn white-hot flash core for large explosions
/** @param {any} param */
/** @description if logic */
  if (!lowGraphics && radius > 20) {
/** @param {any} param */
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * TWO_PI;
/** @constant {any} */
      const speed = Math.random() * 2 + 0.5;
      particles.push(poolInstance.get(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        8 + Math.floor(Math.random() * 6),
        '#ffffff',
        Math.random() * 3 + 2
      ));
    }
  }
}

export function resetParticles() {
  particles = [];
  poolInstance.reset();
}

export const BASE_PARTICLE_DECAY = 0.05;

export function spawnPlayerExhaust(x, y, vx, vy, color = '#00f0ff', yOffset = 14) {
/** @constant {any} */
  const angle = Math.atan2(vy, vx) + Math.PI + (Math.random() - 0.5) * 0.4;
/** @constant {any} */
  const speed = Math.hypot(vx, vy) * 0.3 + Math.random() * 1.2 + 0.6;
  const px = x + (Math.random() - 0.5) * 6;
  const py = y + yOffset; // Base of the player ship
  const life = Math.floor(Math.random() * 12) + 8;
/** @constant {any} */
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

/**
 * Spawn sparkling trail particles behind a falling powerup item.
 * Creates a gentle upward-drifting sparkle effect matching the powerup type color.
 * @param {number} x - Powerup X position
 * @param {number} y - Powerup Y position
 * @param {string} color - Trail color matching powerup type
 */
/** @description spawnPowerupTrail logic */
export function spawnPowerupTrail(x, y, color = '#a855f7') {
  const px = x + (Math.random() - 0.5) * 14;
  const py = y + (Math.random() - 0.5) * 8;
  const vx = (Math.random() - 0.5) * 0.8;
  const vy = -(Math.random() * 0.6 + 0.3); // Drift upward against gravity
  const life = Math.floor(Math.random() * 15) + 10;
/** @constant {any} */
  const radius = Math.random() * 1.8 + 0.5;

  particles.push(poolInstance.get(px, py, vx, vy, life, color, radius));
}

/**
 * Spawn a radial ring burst of particles at a specific impact point.
 * Used for heavy-hit feedback, shockwave origins, or boss defeat moments.
 * @param {number} x - Center X of the impact ring
 * @param {number} y - Center Y of the impact ring
 * @param {number} ringRadius - Approximate radius of the ring burst
 * @param {string} color - Color of the ring particles
 * @param {number} count - Number of particles in the ring
 */
export function spawnImpactRing(x, y, ringRadius = 40, color = '#00f0ff', count = 16) {
  const TWO_PI = Math.PI * 2;
/** @constant {any} */
  const angleStep = TWO_PI / count;
/** @param {any} param */
/** @description for logic */
  for (let i = 0; i < count; i++) {
    const angle = angleStep * i + (Math.random() - 0.5) * 0.2;
    const speed = ringRadius * 0.12 + Math.random() * 1.5;
/** @constant {any} */
    const life = Math.floor(Math.random() * 12) + 14;
    const radius = Math.random() * 2.5 + 1;
    particles.push(poolInstance.get(
      x + Math.cos(angle) * 4,
      y + Math.sin(angle) * 4,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      life,
      color,
      radius
    ));
  }
}
