import * as THREE from 'three';
import { TerrainSystem } from './TerrainSystem';
import { createHouse } from '@/game/procedural/buildings/house';
import { createTorii } from '@/game/procedural/buildings/torii';
import { createBridge } from '@/game/procedural/buildings/bridge';
import { createRock, createStoneLantern, createPaddyPlot, createRiverBoat } from '@/game/procedural/props';
import { createGhibliTree } from '@/game/procedural/vegetation/ghibliTree';
import { createGhibliCottage } from '@/game/procedural/buildings/ghibliCottage';
import { MAT } from '@/game/procedural/materials';
import { box } from '@/game/procedural/geometry';

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
    // First house is the main two-story Japanese manor house (Image 1 & 5 signature)
    const houseSpots: Array<{ dx: number; dz: number; style: 'japanese' | 'kerala'; rot: number; secondFloor?: boolean }> = [
      { dx: -6, dz: -4, style: 'japanese', rot: 0.2, secondFloor: true },
      { dx: 6, dz: -2, style: 'kerala', rot: -0.4 },
      { dx: -2, dz: 6, style: 'japanese', rot: 1.2 },
      { dx: 8, dz: 6, style: 'kerala', rot: 2.8 },
    ];
    for (const spot of houseSpots) {
      const x = cx + spot.dx;
      const z = cz + spot.dz;
      const y = this.terrain.heightAt(x, z);
      const house = createHouse({
        style: spot.style,
        hasSecondFloor: spot.secondFloor ?? false,
        seed: (x * 31 + z) | 0,
      });
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
    const riverCenterAtZ = Math.sin((cz + 6) * 0.045) * 7.5;
    const bridgeX = riverCenterAtZ;
    const bridgeZ = cz + 6;
    const bridgeY = this.terrain.heightAt(bridgeX, bridgeZ);
    const bridge = createBridge({ length: 11, seed: 43 });
    bridge.position.set(bridgeX, bridgeY + 0.4, bridgeZ);
    bridge.rotation.y = Math.PI / 2;
    this.group.add(bridge);

    // Campfire: a clearing a short walk from the houses.
    const fireX = cx - 12;
    const fireZ = cz + 8;
    const fireY = this.terrain.heightAt(fireX, fireZ);
    this.campfirePosition.set(fireX, fireY, fireZ);
    this.buildCampfireBase(fireX, fireY, fireZ);

    // A bench overlooking the river near the campfire (Image 1 vista)
    const benchX = fireX + 2.5;
    const benchZ = fireZ + 1;
    const benchY = this.terrain.heightAt(benchX, benchZ);
    this.benchPosition.set(benchX, benchY, benchZ);
    this.buildBench(benchX, benchY, benchZ, Math.PI + 0.5);

    // Iconic stone lantern beside the riverside bench (Image 1 signature)
    const lantern = createStoneLantern({ withLight: true });
    lantern.position.set(benchX + 1.6, benchY, benchZ + 0.5);
    lantern.scale.setScalar(0.86);
    this.group.add(lantern);

    // Riverside wooden dock / pier
    const dock = this.buildDock(bridgeX + 1.5, bridgeZ + 6);
    this.group.add(dock);

    // Paddy plot near the village.
    const paddy = createPaddyPlot({ columns: 2, rows: 2, seed: 7 });
    paddy.position.set(cx + 12, this.terrain.heightAt(cx + 12, cz + 2), cz + 2);
    this.group.add(paddy);

    // River boat moored by the dock
    const boat = createRiverBoat({ seed: 3 });
    boat.position.set(bridgeX + 2.8, bridgeY + 0.1, bridgeZ + 6.5);
    boat.rotation.y = -0.3;
    this.group.add(boat);

    // Ghibli-style cottage and round-canopy trees near the village.
    const cottage = createGhibliCottage();
    const cottageX = cx + 14;
    const cottageZ = cz - 6;
    const cottageY = this.terrain.heightAt(cottageX, cottageZ);
    cottage.position.set(cottageX, cottageY, cottageZ);
    cottage.rotation.y = -0.6;
    this.group.add(cottage);

    for (let i = 0; i < 3; i++) {
      const t = createGhibliTree({ seed: 100 + i, height: 2.8 + i * 0.4 });
      const tx = cottageX - 4 + i * 2.5;
      const tz = cottageZ + 3 + i * 1.5;
      const ty = this.terrain.heightAt(tx, tz);
      t.position.set(tx, ty, tz);
      this.group.add(t);
    }

    // Rustic wooden fences along the village path (Images 1, 5, 6, 7)
    this.buildVillageFences(cx, cz);

    return { group: this.group, campfirePosition: this.campfirePosition, benchPosition: this.benchPosition };
  }

  private buildDock(x: number, z: number): THREE.Group {
    const dock = new THREE.Group();
    const dockY = this.terrain.heightAt(x, z);
    const deck = new THREE.Mesh(box(3.2, 0.14, 1.8), MAT.woodPlank());
    deck.position.set(0, 0.35, 0);
    dock.add(deck);

    for (const sx of [-1.4, 1.4]) {
      for (const sz of [-0.7, 0.7]) {
        const post = new THREE.Mesh(box(0.12, 1.6, 0.12), MAT.woodDark());
        post.position.set(sx, -0.4, sz);
        dock.add(post);
      }
    }
    dock.position.set(x, dockY, z);
    return dock;
  }

  private buildVillageFences(cx: number, cz: number): void {
    const fenceSegments = [
      { x1: cx - 4, z1: cz + 2, x2: cx - 4, z2: cz + 8 },
      { x1: cx + 2, z1: cz - 8, x2: cx + 8, z2: cz - 8 },
      { x1: cx - 8, z1: cz + 6, x2: cx - 11, z2: cz + 6 },
    ];
    for (const seg of fenceSegments) {
      const dx = seg.x2 - seg.x1;
      const dz = seg.z2 - seg.z1;
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);
      const midX = (seg.x1 + seg.x2) / 2;
      const midZ = (seg.z1 + seg.z2) / 2;
      const midY = this.terrain.heightAt(midX, midZ);

      const fGroup = new THREE.Group();
      // Rails
      const railTop = new THREE.Mesh(box(len, 0.08, 0.06), MAT.woodDark());
      railTop.position.set(0, 0.7, 0);
      fGroup.add(railTop);

      const railBot = new THREE.Mesh(box(len, 0.08, 0.06), MAT.woodDark());
      railBot.position.set(0, 0.35, 0);
      fGroup.add(railBot);

      // Posts
      const postsCount = Math.max(2, Math.round(len / 1.5));
      for (let i = 0; i <= postsCount; i++) {
        const post = new THREE.Mesh(box(0.1, 0.85, 0.1), MAT.woodDark());
        post.position.set(-len / 2 + (i / postsCount) * len, 0.4, 0);
        fGroup.add(post);
      }

      fGroup.position.set(midX, midY, midZ);
      fGroup.rotation.y = -angle;
      this.group.add(fGroup);
    }
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
    // Chunky plank seat: low so the seated character reads from behind.
    const wood = new THREE.MeshStandardMaterial({ color: 0x4e3320, roughness: 1, flatShading: true });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x3a2415, roughness: 1, flatShading: true });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 0.56), wood);
    seat.position.y = 0.5;
    seat.castShadow = true;
    seat.receiveShadow = true;
    bench.add(seat);
    for (const sx of [-0.85, 0.85]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.48), woodDark);
      leg.position.set(sx * 0.82, 0.25, 0);
      leg.castShadow = true;
      bench.add(leg);
    }
    const brace = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), woodDark);
    brace.position.set(0, 0.22, 0);
    bench.add(brace);
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