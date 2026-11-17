import * as THREE from 'three';
import { TerrainSystem } from './TerrainSystem';
import { createHouse } from '@/game/procedural/buildings/house';
import { createTorii } from '@/game/procedural/buildings/torii';
import { createBridge } from '@/game/procedural/buildings/bridge';
import { createRock } from '@/game/procedural/props';
import { createPaddyPlot, createRiverBoat } from '@/game/procedural/props';

// Places a small handcrafted-feeling village on the plateau: a few houses,
// a shrine gate, a bridge over the river, stone paths, and a campfire spot.

export interface VillageResult {
  group: THREE.Group;
  campfirePosition: THREE.Vector3;
  benchPosition: THREE.Vector3;
}

export class VillageGenerator {
  readonly group = new THREE.Group();
  readonly campfirePosition = new THREE.Vector3();
  readonly benchPosition = new THREE.Vector3();

  constructor(private terrain: TerrainSystem) {
    this.group.name = 'village';
  }

  build(): VillageResult {
    // Village plateau is centered around (18, -10) per TerrainSystem.
    const cx = 18;
    const cz = -10;

    // Houses: a loose cluster with varied styles and rotations.
    const houseSpots: Array<{ dx: number; dz: number; style: 'japanese' | 'kerala'; rot: number }> = [
      { dx: -6, dz: -4, style: 'japanese', rot: 0.2 },
      { dx: 6, dz: -2, style: 'kerala', rot: -0.4 },
      { dx: -2, dz: 6, style: 'japanese', rot: 1.2 },
      { dx: 8, dz: 6, style: 'kerala', rot: 2.8 },
    ];
    for (const spot of houseSpots) {
      const x = cx + spot.dx;
      const z = cz + spot.dz;
      const y = this.terrain.heightAt(x, z);
      const house = createHouse({ style: spot.style, seed: (x * 31 + z) | 0 });
      house.position.set(x, y, z);
      house.rotation.y = spot.rot;
      this.group.add(house);
    }

    // Shrine torii at the village entrance (toward the river).
    const toriiX = cx - 4;
    const toriiZ = cz + 16;
    const toriiY = this.terrain.heightAt(toriiX, toriiZ);
    const torii = createTorii({ seed: 42 });
    torii.position.set(toriiX, toriiY, toriiZ);
    this.group.add(torii);

    // Bridge over the river near the village path.
    const riverCenterAtZ = Math.sin(cz * 0.05) * 6;
    const bridgeX = riverCenterAtZ;
    const bridgeZ = cz + 6;
    const bridgeY = this.terrain.heightAt(bridgeX, bridgeZ);
    const bridge = createBridge({ length: 10, seed: 43 });
    bridge.position.set(bridgeX, bridgeY + 0.6, bridgeZ);
    bridge.rotation.y = Math.PI / 2;
    this.group.add(bridge);

    // Campfire: a clearing a short walk from the houses.
    const fireX = cx - 12;
    const fireZ = cz + 8;
    const fireY = this.terrain.heightAt(fireX, fireZ);
    this.campfirePosition.set(fireX, fireY, fireZ);
    this.buildCampfireBase(fireX, fireY, fireZ);

    // A bench under a tree near the campfire.
    const benchX = fireX + 2.5;
    const benchZ = fireZ + 1;
    const benchY = this.terrain.heightAt(benchX, benchZ);
    this.benchPosition.set(benchX, benchY, benchZ);
    this.buildBench(benchX, benchY, benchZ, 0.5);

    // Paddy plot near the village.
    const paddy = createPaddyPlot({ columns: 2, rows: 2, seed: 7 });
    paddy.position.set(cx + 12, this.terrain.heightAt(cx + 12, cz + 2), cz + 2);
    this.group.add(paddy);

    // River boat near the bridge.
    const boat = createRiverBoat({ seed: 3 });
    boat.position.set(bridgeX, bridgeY + 0.2, bridgeZ + 6);
    this.group.add(boat);

    return { group: this.group, campfirePosition: this.campfirePosition, benchPosition: this.benchPosition };
  }

  private buildCampfireBase(x: number, y: number, z: number): void {
    const fire = new THREE.Group();
    // Stone ring
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = createRock({ seed: (x * 13 + i) | 0, radius: 0.18 });
      r.position.set(Math.cos(a) * 0.7, 0.05, Math.sin(a) * 0.7);
      fire.add(r);
    }
    // Logs
    const logMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 1 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3;
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 5), logMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = a;
      log.position.set(Math.cos(a) * 0.15, 0.15, Math.sin(a) * 0.15);
      log.castShadow = true;
      fire.add(log);
    }
    fire.position.set(x, y, z);
    fire.name = 'campfire-base';
    this.group.add(fire);
  }

  private buildBench(x: number, y: number, z: number, rotY: number): void {
    const bench = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.9, flatShading: true });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.5), wood);
    seat.position.y = 0.5;
    seat.castShadow = true;
    bench.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.1), wood);
    back.position.set(0, 0.85, -0.2);
    back.castShadow = true;
    bench.add(back);
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.4), wood);
      leg.position.set(sx * 0.7, 0.25, 0);
      leg.castShadow = true;
      bench.add(leg);
    }
    bench.position.set(x, y, z);
    bench.rotation.y = rotY;
    bench.name = 'bench';
    this.group.add(bench);
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry?.dispose();
    });
    this.group.clear();
  }
}