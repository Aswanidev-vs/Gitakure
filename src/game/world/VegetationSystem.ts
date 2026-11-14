import * as THREE from 'three';
import { TerrainSystem } from './TerrainSystem';
import { Rng } from '@/utils/rng';
import { createCoconutPalm } from '@/game/procedural/vegetation/palm';
import { createBamboo } from '@/game/procedural/vegetation/bamboo';
import { createSakura } from '@/game/procedural/vegetation/sakura';
import { createPine } from '@/game/procedural/vegetation/pine';
import { createGrassTuft, createFlowerCluster, createBush, createRock } from '@/game/procedural/props';

// Places vegetation across the terrain by biome: Kerala tropical near the
// river (palms, bamboo, big plants), Japanese grove near the village
// (pine, sakura). Uses procedural generators for hero trees and ground
// cover. Designed for low-end hardware (spec §18): shared geometry/materials.

export interface VegetationResult {
  group: THREE.Group;
  instanceCount: number;
}

export class VegetationSystem {
  readonly group = new THREE.Group();
  private loaded = 0;

  constructor(private terrain: TerrainSystem) {
    this.group.name = 'vegetation';
  }

  /** Build the full vegetation layer. */
  async build(): Promise<VegetationResult> {
    const rng = new Rng(this.terrain.opts.seed + 999);

    // Scatter ground-cover (grass + flowers) across the whole map, denser near center.
    const grassPts = this.terrain.scatter(rng, 120, 2, 45);
    for (const p of grassPts) {
      const t = createGrassTuft({ seed: (p.x * 100) | 0 });
      t.position.set(p.x, p.y, p.z);
      t.scale.setScalar(0.8 + rng.next() * 0.6);
      this.group.add(t);
    }

    const flowerPts = this.terrain.scatter(rng, 40, 3, 30);
    for (const p of flowerPts) {
      const f = createFlowerCluster({
        seed: (p.z * 100) | 0,
        color: rng.pick(['flowerPink', 'flowerYellow', 'flowerWhite'] as const),
      });
      f.position.set(p.x, p.y, p.z);
      this.group.add(f);
    }

    // Hero trees: palms near the river (Kerala), sakura/pine near village (Japanese).
    const palmPts = this.terrain.scatter(rng, 10, 8, 40);
    for (const p of palmPts) {
      const palm = createCoconutPalm({ seed: (p.x * 7) | 0, curvature: rng.range(0.1, 0.5) });
      palm.position.set(p.x, p.y, p.z);
      palm.scale.setScalar(0.9 + rng.next() * 0.3);
      this.group.add(palm);
    }

    const sakuraPts = this.terrain.scatter(rng, 5, 10, 35);
    for (const p of sakuraPts) {
      const s = createSakura({ seed: (p.z * 7) | 0 });
      s.position.set(p.x, p.y, p.z);
      this.group.add(s);
    }

    const pinePts = this.terrain.scatter(rng, 6, 12, 40);
    for (const p of pinePts) {
      const pine = createPine({ seed: (p.x * 3) | 0 });
      pine.position.set(p.x, p.y, p.z);
      this.group.add(pine);
    }

    const bambooPts = this.terrain.scatter(rng, 4, 6, 25);
    for (const p of bambooPts) {
      const b = createBamboo({ seed: (p.x * 11) | 0 });
      b.position.set(p.x, p.y, p.z);
      this.group.add(b);
    }

    // Rocks scattered near riverbanks and slopes.
    const rockPts = this.terrain.scatter(rng, 18, 4, 42, false);
    for (const p of rockPts) {
      const r = createRock({ seed: (p.x * 13) | 0, radius: 0.3 + rng.next() * 0.6 });
      r.position.set(p.x, p.y + 0.1, p.z);
      r.rotation.y = rng.range(0, Math.PI * 2);
      this.group.add(r);
    }

    // Bushes filling gaps.
    const bushPts = this.terrain.scatter(rng, 12, 5, 30);
    for (const p of bushPts) {
      const b = createBush({ seed: (p.z * 17) | 0 });
      b.position.set(p.x, p.y, p.z);
      this.group.add(b);
    }

    this.loaded = this.group.children.length;
    return { group: this.group, instanceCount: this.loaded };
  }

  get count(): number {
    return this.loaded;
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry?.dispose();
      }
    });
    this.group.clear();
  }
}