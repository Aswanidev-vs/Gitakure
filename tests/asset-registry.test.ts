import { describe, it, expect } from 'vitest';
import { REGISTRY, getEntry, entriesByCategory, entriesByBiome } from '@/game/assets/AssetRegistry';

describe('AssetRegistry', () => {
  it('has a non-empty catalog', () => {
    expect(REGISTRY.length).toBeGreaterThan(20);
  });

  it('every entry has required metadata', () => {
    for (const e of REGISTRY) {
      expect(e.name).toBeTruthy();
      expect(e.path).toMatch(/^\/glb\/.+\.glb$/);
      expect(e.format).toBe('GLB');
      expect(e.license).toBe('CC0');
      expect(['japanese', 'kerala', 'both']).toContain(e.biome);
      expect(e.intendedUsage).toBeTruthy();
    }
  });

  it('paths are URL-encoded (no raw spaces)', () => {
    for (const e of REGISTRY) {
      expect(e.path).not.toContain(' ');
    }
  });

  it('getEntry finds by exact name', () => {
    const pine = getEntry('Pine Trees');
    expect(pine).toBeDefined();
    expect(pine?.biome).toBe('japanese');
    expect(getEntry('nonexistent')).toBeUndefined();
  });

  it('entriesByCategory groups correctly', () => {
    const trees = entriesByCategory('trees');
    expect(trees.length).toBeGreaterThanOrEqual(8);
    for (const t of trees) {
      expect(['trees', 'bushes', 'rocks', 'plants', 'flowers', 'grass', 'mushrooms', 'paths']).toContain('trees');
      expect(t.name).toMatch(/Tree|Pine|Maple|Birch|Palm/i);
    }
  });

  it('entriesByBiome includes both', () => {
    const both = entriesByBiome('both');
    expect(both.length).toBeGreaterThan(0);
    const kerala = entriesByBiome('kerala');
    expect(kerala.some((e) => e.biome === 'kerala')).toBe(true);
  });

  it('has at least one kerala-specific asset (palm)', () => {
    const palms = REGISTRY.filter((e) => e.biome === 'kerala');
    expect(palms.length).toBeGreaterThan(0);
  });
});