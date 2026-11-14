import * as THREE from 'three';
import type { Milestone } from '@/services/github/github-service';
import type { TerrainSystem } from '@/game/world/TerrainSystem';
import { MAT } from '@/game/procedural/materials';
import { blob, taperedCylinder, transform } from '@/game/procedural/geometry';

// Converts GitHub milestones into environmental keepsakes (spec §16).
// Each kind maps to a distinct procedural object placed near the village.
// Discovered keepsakes persist in Dexie; undiscovered ones are not yet
// spawned (gradual discovery).

export interface KeepsakePlacement {
  id: string;
  milestone: Milestone;
  position: THREE.Vector3;
  object: THREE.Object3D;
}

export class GitHubWorldSystem {
  readonly group = new THREE.Group();
  private placements = new Map<string, KeepsakePlacement>();
  private undiscovered: Milestone[] = [];

  constructor(private terrain: TerrainSystem) {
    this.group.name = 'github-keepsakes';
  }

  /** Queue milestones for gradual discovery (not yet all spawned). */
  setPending(milestones: Milestone[]): void {
    this.undiscovered = [...milestones];
  }

  /** Spawn a single milestone's keepsake near the village. */
  spawn(milestone: Milestone, villageCenter: THREE.Vector3, index: number): KeepsakePlacement {
    const angle = (index / 6) * Math.PI * 2;
    const dist = 14 + index * 2;
    const x = villageCenter.x + Math.cos(angle) * dist;
    const z = villageCenter.z + Math.sin(angle) * dist;
    const y = this.terrain.heightAt(x, z);
    const position = new THREE.Vector3(x, y, z);

    const object = this.buildKeepsake(milestone);
    object.position.copy(position);
    object.name = `keepsake-${milestone.id}`;
    this.group.add(object);

    const placement: KeepsakePlacement = { id: milestone.id, milestone, position, object };
    this.placements.set(milestone.id, placement);
    return placement;
  }

  /** Spawn the next pending milestone (called as the player explores). */
  spawnNext(villageCenter: THREE.Vector3): KeepsakePlacement | null {
    const next = this.undiscovered.shift();
    if (!next) return null;
    const index = this.placements.size;
    return this.spawn(next, villageCenter, index);
  }

  get pendingCount(): number {
    return this.undiscovered.length;
  }

  get placedCount(): number {
    return this.placements.size;
  }

  getKeepsake(id: string): THREE.Object3D | null {
    return this.placements.get(id)?.object ?? null;
  }

  private buildKeepsake(milestone: Milestone): THREE.Object3D {
    const g = new THREE.Group();
    switch (milestone.kind) {
      case 'first-seed': {
        // A young sapling.
        const trunk = taperedCylinder(0.15, 0.1, 1.2, 6);
        g.add(new THREE.Mesh(trunk, MAT.bark()));
        for (let i = 0; i < 3; i++) {
          const leaf = blob(0.4, 0.7, 6);
          transform(leaf, { x: (i - 1) * 0.2, y: 1.2 + i * 0.15 });
          g.add(new THREE.Mesh(leaf, MAT.leafLight()));
        }
        break;
      }
      case 'river-lantern': {
        // A stone lantern with a warm glow.
        const base = taperedCylinder(0.3, 0.25, 0.8, 6);
        g.add(new THREE.Mesh(base, MAT.stone()));
        const lightGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        transform(lightGeo, { y: 1.0 });
        const light = new THREE.Mesh(
          lightGeo,
          new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xff9a3a, emissiveIntensity: 1.2 }),
        );
        g.add(light);
        break;
      }
      case 'language-scroll': {
        // A floating scroll stone (flat slab with a colored top).
        const slabGeo = new THREE.BoxGeometry(0.6, 0.8, 0.15);
        transform(slabGeo, { y: 0.4 });
        g.add(new THREE.Mesh(slabGeo, MAT.stone()));
        const topGeo = new THREE.BoxGeometry(0.5, 0.2, 0.05);
        transform(topGeo, { y: 0.85 });
        g.add(new THREE.Mesh(topGeo, MAT.roofTerracotta()));
        break;
      }
      case 'constellation': {
        // A small obelisk reaching skyward.
        const obelisk = taperedCylinder(0.2, 0.05, 2.2, 5);
        g.add(new THREE.Mesh(obelisk, MAT.stoneDark()));
        const glowGeo = new THREE.SphereGeometry(0.12, 8, 6);
        transform(glowGeo, { y: 2.3 });
        const glow = new THREE.Mesh(
          glowGeo,
          new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x4488ff, emissiveIntensity: 1.5 }),
        );
        g.add(glow);
        break;
      }
      case 'quiet-solitude':
      default: {
        // A smooth river pebble — the quietest keepsake.
        const pebbleGeo = new THREE.IcosahedronGeometry(0.4, 1);
        transform(pebbleGeo, { y: 0.3 });
        g.add(new THREE.Mesh(pebbleGeo, MAT.stone()));
        break;
      }
    }
    return g;
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry?.dispose();
    });
    this.group.clear();
    this.placements.clear();
    this.undiscovered = [];
  }
}