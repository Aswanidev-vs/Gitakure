import { describe, expect, it } from 'vitest';
import { createPaddyPlot, createRiverBoat } from '@/game/procedural/props';
import { TerrainSystem } from '@/game/world/TerrainSystem';
import { VillageGenerator } from '@/game/world/VillageGenerator';

describe('reference-signature procedural assets', () => {
  it('creates seeded paddy plots with water cells and seedlings', () => {
    const first = createPaddyPlot({ columns: 2, rows: 2, seed: 7 });
    const second = createPaddyPlot({ columns: 2, rows: 2, seed: 7 });

    expect(first.name).toBe('paddy-plot');
    expect(first.children.length).toBe(26);
    expect(first.children.map((child) => child.position.toArray())).toEqual(
      second.children.map((child) => child.position.toArray()),
    );
  });

  it('normalizes empty dimensions instead of creating invalid geometry', () => {
    expect(() => createPaddyPlot({ width: 0, depth: 0, columns: 0, rows: 0 })).not.toThrow();
    expect(() => createRiverBoat({ length: 0, width: 0 })).not.toThrow();
  });

  it('creates a river boat with a stable scene name', () => {
    const boat = createRiverBoat({ seed: 3 });

    expect(boat.name).toBe('river-boat');
    expect(boat.children).toHaveLength(4);
  });

  it('places both reference-signature props in the village build', () => {
    const terrain = new TerrainSystem({ seed: 3, segments: 12 });
    const village = new VillageGenerator(terrain);
    const result = village.build();

    expect(result.group.getObjectByName('paddy-plot')).toBeDefined();
    expect(result.group.getObjectByName('river-boat')).toBeDefined();

    village.dispose();
    terrain.dispose();
  });
});
