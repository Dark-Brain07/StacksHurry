/**
 * Stacks Hurry - AI Steering Behaviors Unit Tests
 * Tests for seek, orbit, evade, updateAI state machine, and AI_STATES
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AI_STATES, updateAI, seek, orbit, evade } from '../src/ai.js';

// ─── AI States Constants ───

describe('AI_STATES', () => {
  it('should define all expected state keys', () => {
    expect(AI_STATES.IDLE).toBe('idle');
    expect(AI_STATES.SEEK).toBe('seek');
    expect(AI_STATES.LUNGE).toBe('lunge');
    expect(AI_STATES.ORBIT).toBe('orbit');
    expect(AI_STATES.RETREAT).toBe('retreat');
  });

  it('should have unique state values', () => {
    const values = Object.values(AI_STATES);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

// ─── Seek Behavior Tests ───

describe('seek', () => {
  let entity;
  let target;

  beforeEach(() => {
    entity = { x: 0, y: 0, vx: 0, vy: 0 };
    target = { x: 100, y: 0 };
  });

  it('should steer entity velocity towards target', () => {
    seek(entity, target, 5, 0.1);
    expect(entity.vx).toBeGreaterThan(0);
  });

  it('should not overshoot max speed', () => {
    // Multiple seek iterations
    for (let i = 0; i < 100; i++) {
      seek(entity, target, 5, 0.1);
    }
    const speed = Math.hypot(entity.vx, entity.vy);
    expect(speed).toBeLessThanOrEqual(5.1); // Small tolerance
  });

  it('should handle zero distance gracefully', () => {
    const samePos = { x: 0, y: 0 };
    const result = seek(entity, samePos, 5, 0.1);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('should return velocity object', () => {
    const result = seek(entity, target, 5, 0.1);
    expect(result).toHaveProperty('x');
    expect(result).toHaveProperty('y');
  });

  it('should steer in the correct direction for diagonal target', () => {
    target = { x: 100, y: 100 };
    seek(entity, target, 5, 0.5);
    expect(entity.vx).toBeGreaterThan(0);
    expect(entity.vy).toBeGreaterThan(0);
  });

  it('should handle negative target positions', () => {
    target = { x: -50, y: -50 };
    seek(entity, target, 5, 0.5);
    expect(entity.vx).toBeLessThan(0);
    expect(entity.vy).toBeLessThan(0);
  });
});

// ─── Orbit Behavior Tests ───

describe('orbit', () => {
  it('should move entity in a circular path around target', () => {
    const entity = { x: 0, y: 0, orbitAngle: 0 };
    const target = { x: 100, y: 100 };
    const radius = 50;

    orbit(entity, target, radius, 0.1);
    const dist = Math.hypot(entity.x - target.x, entity.y - target.y);
    expect(dist).toBeCloseTo(radius, 1);
  });

  it('should increment orbit angle over time', () => {
    const entity = { x: 0, y: 0, orbitAngle: 0 };
    const target = { x: 50, y: 50 };

    orbit(entity, target, 30, 0.1);
    expect(entity.orbitAngle).toBeCloseTo(0.1, 5);

    orbit(entity, target, 30, 0.1);
    expect(entity.orbitAngle).toBeCloseTo(0.2, 5);
  });

  it('should initialize orbitAngle if not present', () => {
    const entity = { x: 0, y: 0 };
    const target = { x: 50, y: 50 };
    orbit(entity, target, 30, 0.1);
    expect(entity.orbitAngle).toBeDefined();
  });
});

// ─── Evade Behavior Tests ───

describe('evade', () => {
  it('should steer entity away from target when close', () => {
    const entity = { x: 50, y: 50, vx: 0, vy: 0 };
    const target = { x: 100, y: 100 };
    evade(entity, target, 5, 0.1);
    // Entity should be moving away from target (negative direction)
    expect(entity.vx).toBeLessThan(0);
    expect(entity.vy).toBeLessThan(0);
  });

  it('should not evade when target is beyond evade range', () => {
    const entity = { x: 0, y: 0, vx: 0, vy: 0 };
    const target = { x: 500, y: 500 }; // dist > 300
    evade(entity, target, 5, 0.1);
    expect(entity.vx).toBe(0);
    expect(entity.vy).toBe(0);
  });

  it('should handle zero distance gracefully', () => {
    const entity = { x: 50, y: 50, vx: 0, vy: 0 };
    const target = { x: 50, y: 50 };
    evade(entity, target, 5, 0.1);
    // At zero distance, returns early without modifying velocity
    expect(entity.vx).toBe(0);
    expect(entity.vy).toBe(0);
  });
});

// ─── AI State Machine Tests ───

describe('updateAI', () => {
  it('should default to IDLE state when no state is set', () => {
    const entity = { x: 0, y: 0, vx: 0, vy: 0 };
    const target = { x: 100, y: 100 };
    updateAI(entity, target, 1);
    expect(entity.aiState).toBe(AI_STATES.IDLE);
  });

  it('should handle SEEK state by calling seek behavior', () => {
    const entity = { x: 0, y: 0, vx: 0, vy: 0, aiState: AI_STATES.SEEK, speed: 3 };
    const target = { x: 100, y: 100 };
    updateAI(entity, target, 1);
    expect(entity.vx).not.toBe(0);
    expect(entity.vy).not.toBe(0);
  });

  it('should handle ORBIT state', () => {
    const entity = { x: 0, y: 0, aiState: AI_STATES.ORBIT, orbitRadius: 50 };
    const target = { x: 100, y: 100 };
    updateAI(entity, target, 1);
    const dist = Math.hypot(entity.x - target.x, entity.y - target.y);
    expect(dist).toBeCloseTo(50, 0);
  });

  it('should handle RETREAT state (negative seek)', () => {
    const entity = { x: 50, y: 50, vx: 0, vy: 0, aiState: AI_STATES.RETREAT, speed: 3 };
    const target = { x: 100, y: 100 };
    updateAI(entity, target, 1);
    // Retreat should move away from target
    expect(entity.vx).toBeLessThan(0);
    expect(entity.vy).toBeLessThan(0);
  });

  it('should handle null entity gracefully', () => {
    expect(() => updateAI(null, { x: 0, y: 0 }, 1)).not.toThrow();
  });

  it('should handle null target gracefully', () => {
    expect(() => updateAI({ x: 0, y: 0 }, null, 1)).not.toThrow();
  });
});
