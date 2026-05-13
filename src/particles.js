/**
 * Stacks Hurry - Particle System
 * Manages explosions and visual feedback effects
 */

let particles = [];

export function updateParticles() {
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.vx *= 0.98;
    p.vy *= 0.98;
    return p.life > 0;
  });
}

export function renderParticles(ctx) {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

export function spawnExplosion(x, y, radius, lowGraphics = false, colorOverride = null) {
  const baseCount = Math.floor(radius * 1.5) + 8; // Optimized for mobile
  const count = lowGraphics ? Math.floor(baseCount / 3) : baseCount;
  const defaultColors = ['#00f0ff', '#a855f7', '#fb923c', '#f87171', '#fbbf24', '#f0f4ff'];
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 1.5;
    const particleLife = Math.floor(Math.random() * 40) + 20;
    
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: particleLife,
      maxLife: particleLife,
      radius: Math.random() * 4 + 1.5,
      color: colorOverride || defaultColors[Math.floor(Math.random() * defaultColors.length)],
    });
  }
}

export function resetParticles() {
  particles = [];
}
