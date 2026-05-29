/**
 * Stacks Hurry - Particle System Unit Tests
 * Tests for Particle class lifecycle, ParticlePool, spawn functions, and VFX utilities
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  Particle,
  getParticleCount,
  updateParticles,
  spawnExplosion,
  resetParticles,
  spawnPlayerExhaust,
  spawnPowerupTrail,
  spawnImpactRing,
  BASE_PARTICLE_DECAY
} from '../src/particles.js';

// ─── Particle Class Tests ───

describe('Particle', () => {
  it('should create an inactive particle with default values', () => {
    const p = new Particle();
    expect(p.active).toBe(false);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
    expect(p.life).toBe(0);
  });

  it('should initialize with provided values', () => {
    const p = new Particle();
    p.init(100, 200, 3, -2, 30, '#ff0000', 5);
    expect(p.active).toBe(true);
    expect(p.x).toBe(100);
    expect(p.y).toBe(200);
    expect(p.vx).toBe(3);
    expect(p.vy).toBe(-2);
    expect(p.life).toBe(30);
    expect(p.maxLife).toBe(30);
    expect(p.color).toBe('#ff0000');
    expect(p.radius).toBe(5);
  });

  it('should update position and decrement life', () => {
    const p = new Particle();
    p.init(0, 0, 10, 5, 30, '#fff', 2);
    p.update();
    expect(p.x).toBeCloseTo(10, 1);
    expect(p.y).toBeCloseTo(5, 1);
    expect(p.life).toBe(29);
  });

  it('should apply velocity friction during update', () => {
    const p = new Particle();
    p.init(0, 0, 10, 10, 30, '#fff', 2);
    p.update();
    // vx/vy should be multiplied by 0.98 each frame
    expect(p.vx).toBeCloseTo(10 * 0.98, 4);
    expect(p.vy).toBeCloseTo(10 * 0.98, 4);
  });

  it('should deactivate when life reaches zero', () => {
    const p = new Particle();
    p.init(0, 0, 0, 0, 1, '#fff', 2);
    expect(p.active).toBe(true);
    p.update();
    expect(p.life).toBe(0);
    expect(p.active).toBe(false);
  });

  it('should return false from update when inactive', () => {
    const p = new Particle();
    expect(p.update()).toBe(false);
  });

  it('should return true from update when still active', () => {
    const p = new Particle();
    p.init(0, 0, 0, 0, 10, '#fff', 2);
    expect(p.update()).toBe(true);
  });
});

// ─── Particle Pool & Spawning Tests ───

describe('Particle Spawning', () => {
  beforeEach(() => {
    resetParticles();
  });

  it('should start with zero particles after reset', () => {
    expect(getParticleCount()).toBe(0);
  });

  it('should spawn explosion particles', () => {
    spawnExplosion(100, 100, 20);
    expect(getParticleCount()).toBeGreaterThan(0);
  });

  it('should spawn more particles for larger explosions', () => {
    spawnExplosion(100, 100, 10);
    const smallCount = getParticleCount();
    resetParticles();

    spawnExplosion(100, 100, 40);
    const largeCount = getParticleCount();
    expect(largeCount).toBeGreaterThan(smallCount);
  });

  it('should spawn fewer particles in lowGraphics mode', () => {
    spawnExplosion(100, 100, 30, false);
    const normalCount = getParticleCount();
    resetParticles();

    spawnExplosion(100, 100, 30, true);
    const lowCount = getParticleCount();
    expect(lowCount).toBeLessThan(normalCount);
  });

  it('should use color override when provided', () => {
    spawnExplosion(100, 100, 20, false, '#ff0000');
    expect(getParticleCount()).toBeGreaterThan(0);
  });

  it('should spawn white-hot flash cores for large explosions', () => {
    spawnExplosion(100, 100, 30, false); // radius > 20
    const countWithCores = getParticleCount();
    resetParticles();

    spawnExplosion(100, 100, 10, false); // radius <= 20
    const countWithoutCores = getParticleCount();

    // Large explosions should have more particles due to flash cores
    expect(countWithCores).toBeGreaterThan(countWithoutCores);
  });

  it('should spawn player exhaust particles', () => {
    spawnPlayerExhaust(200, 300, 2, -3);
    expect(getParticleCount()).toBe(1);
  });

  it('should spawn powerup trail particles', () => {
    spawnPowerupTrail(150, 250, '#a855f7');
    expect(getParticleCount()).toBe(1);
  });

  it('should spawn impact ring with correct particle count', () => {
    spawnImpactRing(200, 200, 40, '#00f0ff', 16);
    expect(getParticleCount()).toBe(16);
  });

  it('should spawn impact ring with default parameters', () => {
    spawnImpactRing(200, 200);
    expect(getParticleCount()).toBe(16); // default count
  });
});

// ─── Particle Update Lifecycle Tests ───

describe('Particle Lifecycle', () => {
  beforeEach(() => {
    resetParticles();
  });

  it('should remove expired particles during update', () => {
    // Spawn short-lived particles
    spawnExplosion(100, 100, 5);
    const initialCount = getParticleCount();
    expect(initialCount).toBeGreaterThan(0);

    // Run many update cycles to expire all particles
    for (let i = 0; i < 200; i++) {
      updateParticles();
    }
    expect(getParticleCount()).toBe(0);
  });

  it('should maintain particles during their lifetime', () => {
    spawnExplosion(100, 100, 20);
    const beforeUpdate = getParticleCount();
    updateParticles();
    // After one update, most particles should still be alive
    expect(getParticleCount()).toBe(beforeUpdate);
  });
});

// ─── Constants Tests ───

describe('BASE_PARTICLE_DECAY', () => {
  it('should be a small positive number', () => {
    expect(BASE_PARTICLE_DECAY).toBeGreaterThan(0);
    expect(BASE_PARTICLE_DECAY).toBeLessThan(1);
    expect(typeof BASE_PARTICLE_DECAY).toBe('number');
  });
});
