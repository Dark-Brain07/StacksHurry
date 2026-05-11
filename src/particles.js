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

export function spawnExplosion(x, y, radius, lowGraphics = false) {
  const baseCount = Math.floor(radius * 1.5) + 8;
  const count = lowGraphics ? Math.floor(baseCount / 3) : baseCount;
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

export function resetParticles() {
  particles = [];
}
