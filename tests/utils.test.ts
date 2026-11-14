import { describe, it, expect } from 'vitest';
import { Rng, hashSeed } from '@/utils/rng';
import { clamp, lerp, damp, fbm2, valueNoise2 } from '@/utils/math';

describe('Rng', () => {
  it('is deterministic for the same seed', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('next() is in [0,1)', () => {
    const r = new Rng(99);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('range/int/pick/chance work', () => {
    const r = new Rng(7);
    expect(r.range(5, 10)).toBeGreaterThanOrEqual(5);
    expect(r.range(5, 10)).toBeLessThan(10);
    const n = r.int(3, 6);
    expect(n).toBeGreaterThanOrEqual(3);
    expect(n).toBeLessThanOrEqual(6);
    expect([1, 2, 3]).toContain(r.pick([1, 2, 3] as const));
    const c = r.chance(0.5);
    expect(typeof c).toBe('boolean');
  });

  it('fork produces independent streams', () => {
    const base = new Rng(42);
    const fork = base.fork(1);
    const v1 = base.next();
    const v2 = fork.next();
    expect(v1).not.toBe(v2);
  });

  it('hashSeed is deterministic', () => {
    expect(hashSeed('hello')).toBe(hashSeed('hello'));
    expect(hashSeed('hello')).not.toBe(hashSeed('world'));
  });
});

describe('math', () => {
  it('clamp/lerp/damp', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(damp(0, 100, 10, 0.1)).toBeCloseTo(63.2, 1);
  });

  it('valueNoise2 is deterministic and in [0,1]', () => {
    const v = valueNoise2(3.5, 7.2, 0);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
    expect(valueNoise2(3.5, 7.2, 0)).toBe(v);
  });

  it('fbm2 is in [0,1] and deterministic', () => {
    const v = fbm2(10.5, 4.2, 4, 0);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
    expect(fbm2(10.5, 4.2, 4, 0)).toBe(v);
  });
});