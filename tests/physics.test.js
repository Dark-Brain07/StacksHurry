/**
 * Stacks Hurry - Physics Engine Unit Tests
 * Tests for Vector2D, collision detection, shockwave push, and math utilities
 */
import { describe, it, expect } from 'vitest';
import {
  Vector2D,
  checkCircleCollision,
  calculateShockwavePush,
  calculateKnockback,
  clamp,
  distance,
  lerp,
  DEFAULT_COLLISION_RADIUS
} from '../src/physics.js';

// ─── Vector2D Tests ───

describe('Vector2D', () => {
  it('should create a vector with default values (0, 0)', () => {
    const v = new Vector2D();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('should create a vector with specified values', () => {
    const v = new Vector2D(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it('should set x and y values', () => {
    const v = new Vector2D();
    v.set(5, 10);
    expect(v.x).toBe(5);
    expect(v.y).toBe(10);
  });

  it('should add two vectors', () => {
    const a = new Vector2D(1, 2);
    const b = new Vector2D(3, 4);
    a.add(b);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
  });

  it('should subtract two vectors', () => {
    const a = new Vector2D(5, 7);
    const b = new Vector2D(2, 3);
    a.sub(b);
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);
  });

  it('should multiply by scalar', () => {
    const v = new Vector2D(3, 4);
    v.mult(2);
    expect(v.x).toBe(6);
    expect(v.y).toBe(8);
  });

  it('should divide by scalar', () => {
    const v = new Vector2D(6, 8);
    v.div(2);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it('should not divide by zero', () => {
    const v = new Vector2D(6, 8);
    v.div(0);
    expect(v.x).toBe(6);
    expect(v.y).toBe(8);
  });

  it('should calculate magnitude for 3-4-5 triangle', () => {
    const v = new Vector2D(3, 4);
    expect(v.mag()).toBe(5);
  });

  it('should normalize to unit vector', () => {
    const v = new Vector2D(3, 4);
    v.normalize();
    expect(v.mag()).toBeCloseTo(1, 5);
    expect(v.x).toBeCloseTo(0.6, 5);
    expect(v.y).toBeCloseTo(0.8, 5);
  });

  it('should handle normalizing a zero vector', () => {
    const v = new Vector2D(0, 0);
    v.normalize();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('should limit vector magnitude', () => {
    const v = new Vector2D(6, 8);
    v.limit(5);
    expect(v.mag()).toBeCloseTo(5, 5);
  });

  it('should not limit vector when below max', () => {
    const v = new Vector2D(1, 1);
    v.limit(5);
    expect(v.mag()).toBeCloseTo(Math.SQRT2, 5);
  });

  it('should calculate dot product', () => {
    const a = new Vector2D(1, 0);
    const b = new Vector2D(0, 1);
    expect(a.dot(b)).toBe(0); // Perpendicular

    const c = new Vector2D(2, 3);
    const d = new Vector2D(4, 5);
    expect(c.dot(d)).toBe(23); // 2*4 + 3*5
  });

  it('should calculate distance between vectors', () => {
    const a = new Vector2D(0, 0);
    const b = new Vector2D(3, 4);
    expect(a.dist(b)).toBe(5);
  });

  it('should calculate heading angle', () => {
    const right = new Vector2D(1, 0);
    expect(right.heading()).toBeCloseTo(0, 5);

    const up = new Vector2D(0, -1);
    expect(up.heading()).toBeCloseTo(-Math.PI / 2, 5);
  });

  it('should copy vector to a new instance', () => {
    const v = new Vector2D(3, 4);
    const copy = v.copy();
    expect(copy.x).toBe(3);
    expect(copy.y).toBe(4);
    copy.x = 99;
    expect(v.x).toBe(3); // Original unchanged
  });

  it('should calculate squared distance', () => {
    const a = new Vector2D(0, 0);
    const b = new Vector2D(3, 4);
    expect(a.distSq(b)).toBe(25);
  });

  it('should linearly interpolate between vectors', () => {
    const a = new Vector2D(0, 0);
    const b = new Vector2D(10, 20);
    a.lerp(b, 0.5);
    expect(a.x).toBe(5);
    expect(a.y).toBe(10);
  });

  it('should create vector from angle', () => {
    const v = Vector2D.fromAngle(0, 5);
    expect(v.x).toBeCloseTo(5, 5);
    expect(v.y).toBeCloseTo(0, 5);

    const v2 = Vector2D.fromAngle(Math.PI / 2, 3);
    expect(v2.x).toBeCloseTo(0, 5);
    expect(v2.y).toBeCloseTo(3, 5);
  });

  it('should create a random 2D unit vector', () => {
    const v = Vector2D.random2D();
    expect(v.mag()).toBeCloseTo(1, 4);
  });

  it('should support method chaining', () => {
    const result = new Vector2D(1, 2).add(new Vector2D(3, 4)).mult(2);
    expect(result.x).toBe(8);
    expect(result.y).toBe(12);
  });
});

// ─── Collision Detection Tests ───

describe('checkCircleCollision', () => {
  it('should detect collision between overlapping circles', () => {
    expect(checkCircleCollision(0, 0, 10, 5, 0, 10)).toBe(true);
  });

  it('should not detect collision between distant circles', () => {
    expect(checkCircleCollision(0, 0, 5, 100, 100, 5)).toBe(false);
  });

  it('should not detect collision when circles are just touching', () => {
    // At exactly touching, distance === sum of radii, returns false (strict <)
    expect(checkCircleCollision(0, 0, 5, 10, 0, 5)).toBe(false);
  });

  it('should detect collision for concentric circles', () => {
    expect(checkCircleCollision(5, 5, 10, 5, 5, 3)).toBe(true);
  });

  it('should handle Vector2D parameter overload', () => {
    const v1 = new Vector2D(0, 0);
    const v2 = new Vector2D(5, 0);
    expect(checkCircleCollision(v1, 10, v2, 10)).toBe(true);
    expect(checkCircleCollision(v1, 2, v2, 2)).toBe(false);
  });

  it('should use AABB broadphase to reject far-apart circles quickly', () => {
    // These are far apart on X axis, should be rejected by broadphase
    expect(checkCircleCollision(0, 0, 5, 1000, 0, 5)).toBe(false);
  });
});

// ─── Shockwave Push Tests ───

describe('calculateShockwavePush', () => {
  it('should return push vector when entity is at shockwave edge', () => {
    const entity = { x: 50, y: 0 };
    const shockwave = { x: 0, y: 0, radius: 60 };
    const push = calculateShockwavePush(entity, shockwave);
    expect(push).not.toBeNull();
    expect(push.x).toBeGreaterThan(0);
  });

  it('should return null when entity is outside shockwave radius', () => {
    const entity = { x: 200, y: 200 };
    const shockwave = { x: 0, y: 0, radius: 50 };
    const push = calculateShockwavePush(entity, shockwave);
    expect(push).toBeNull();
  });

  it('should return null when entity is well inside shockwave (not at edge)', () => {
    const entity = { x: 5, y: 0 };
    const shockwave = { x: 0, y: 0, radius: 200 };
    const push = calculateShockwavePush(entity, shockwave);
    expect(push).toBeNull();
  });

  it('should use custom power parameter', () => {
    const entity = { x: 50, y: 0 };
    const shockwave = { x: 0, y: 0, radius: 60 };
    const weak = calculateShockwavePush(entity, shockwave, 4);
    const strong = calculateShockwavePush(entity, shockwave, 16);
    expect(Math.abs(strong.x)).toBeGreaterThan(Math.abs(weak.x));
  });
});

// ─── Math Utility Tests ───

describe('calculateKnockback', () => {
  it('should calculate knockback as mass * velocity * 0.5', () => {
    expect(calculateKnockback(10, 4)).toBe(20);
    expect(calculateKnockback(0, 10)).toBe(0);
  });
});

describe('clamp', () => {
  it('should clamp value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should return min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('should return max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('distance', () => {
  it('should calculate distance between two points', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
    expect(distance(1, 1, 1, 1)).toBe(0);
  });

  it('should handle Vector2D parameter overload', () => {
    const a = new Vector2D(0, 0);
    const b = new Vector2D(3, 4);
    expect(distance(a, b)).toBe(5);
  });
});

describe('lerp', () => {
  it('should interpolate between start and end', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
  });

  it('should extrapolate beyond range', () => {
    expect(lerp(0, 10, 1.5)).toBe(15);
    expect(lerp(0, 10, -0.5)).toBe(-5);
  });
});

describe('DEFAULT_COLLISION_RADIUS', () => {
  it('should be a positive number', () => {
    expect(DEFAULT_COLLISION_RADIUS).toBeGreaterThan(0);
    expect(typeof DEFAULT_COLLISION_RADIUS).toBe('number');
  });
});
