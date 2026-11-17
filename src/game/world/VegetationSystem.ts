import * as THREE from 'three';
import { TerrainSystem } from './TerrainSystem';
import { Rng } from '@/utils/rng';
import { createCoconutPalm } from '@/game/procedural/vegetation/palm';
import { createBamboo } from '@/game/procedural/vegetation/bamboo';
import { createSakura } from '@/game/procedural/vegetation/sakura';
import { createPine } from '@/game/procedural/vegetation/pine';
import { createGhibliTree } from '@/game/procedural/vegetation/ghibliTree';
import { createBush, createRock } from '@/game/procedural/props';
import { MAT } from '@/game/procedural/materials';
import { cone, transform, mergeColored, vertexColorMaterial, blob } from '@/game/procedural/geometry';

// Overhauled vegetation layer for lush Studio Ghibli landscape:
// Uses GPU InstancedMesh for thousands of grass blades and wildflower meadows
// in 2 draw calls, plus multi-tiered hero trees (Sakura, Ghibli broadleaf,
// Kerala palms, Bamboo groves, Mountain pines, River reeds).

export interface VegetationResult {
  group: THREE.Group;
  instanceCount: number;
}

export class VegetationSystem {
  readonly group = new THREE.Group();
  private loaded = 0;
  private instancedMeshes: THREE.InstancedMesh[] = [];

  constructor(private terrain: TerrainSystem) {
    this.group.name = 'vegetation';
  }

  /** Build the full vegetation layer. */
  async build(): Promise<VegetationResult> {
    const rng = new Rng(this.terrain.opts.seed + 999);

    // 1. DENSE INSTANCED MEADOW GRASS (600 instances, 1 draw call)
    this.buildInstancedGrass(rng, 650);

    // 2. DENSE INSTANCED WILDFLOWERS (240 instances, 1 draw call)
    this.buildInstancedFlowers(rng, 240);

    // 3. HERO SAKURA BLOSSOMS (Japanese village & riverside vista)
    // Iconic large riverside sakura (Image 1 vista landmark)
    const heroSakura = createSakura({ height: 6.8, canopyRadius: 1.4, canopyClusters: 10, seed: 101 });
    const hsX = 8;
    const hsZ = 12;
    heroSakura.position.set(hsX, this.terrain.heightAt(hsX, hsZ), hsZ);
    this.group.add(heroSakura);
    this.buildSakuraPetalCarpet(rng, hsX, hsZ, 35);

    // Village entrance sakura grove
    const villageSakuras = [
      { x: 16, z: 12, s: 0.95 },
      { x: 25, z: 8, s: 1.1 },
      { x: 12, z: -18, s: 0.85 },
    ];
    for (const spot of villageSakuras) {
      const s = createSakura({ height: 5.4 * spot.s, seed: (spot.x * 19 + spot.z) | 0 });
      s.position.set(spot.x, this.terrain.heightAt(spot.x, spot.z), spot.z);
      this.group.add(s);
      this.buildSakuraPetalCarpet(rng, spot.x, spot.z, 20);
    }

    // 4. LUSH GHIBLI BROADLEAF TREES (fluffy round green canopies)
    const ghibliTreeSpots = [
      { x: 24, z: -6, h: 4.2 },
      { x: 28, z: -12, h: 4.8 },
      { x: 14, z: -26, h: 3.8 },
      { x: -16, z: -18, h: 4.5 },
      { x: -22, z: -8, h: 4.0 },
      { x: -12, z: 28, h: 3.6 },
    ];
    for (let i = 0; i < ghibliTreeSpots.length; i++) {
      const spot = ghibliTreeSpots[i]!;
      const tree = createGhibliTree({ height: spot.h, canopy: spot.h * 0.45, seed: 200 + i });
      tree.position.set(spot.x, this.terrain.heightAt(spot.x, spot.z), spot.z);
      this.group.add(tree);
    }

    // 5. KERALA TROPICAL PALMS (along the winding riverbanks)
    const palmPts = this.terrain.scatter(rng, 14, 10, 52);
    for (const p of palmPts) {
      // Favor riverside planting
      if (Math.abs(p.x - Math.sin(p.z * 0.045) * 7.5) < 18) {
        const palm = createCoconutPalm({ seed: (p.x * 7) | 0, curvature: rng.range(0.15, 0.45) });
        palm.position.set(p.x, p.y, p.z);
        palm.scale.setScalar(0.85 + rng.next() * 0.35);
        this.group.add(palm);
      }
    }

    // 6. BAMBOO GROVES (dense clumping near village margins)
    const bambooClusterCenters = [
      { cx: 8, cz: -16 },
      { cx: 22, cz: 16 },
      { cx: -8, cz: -24 },
    ];
    for (const cluster of bambooClusterCenters) {
      for (let i = 0; i < 4; i++) {
        const bx = cluster.cx + rng.range(-2.5, 2.5);
        const bz = cluster.cz + rng.range(-2.5, 2.5);
        const b = createBamboo({ seed: (bx * 13 + bz) | 0 });
        b.position.set(bx, this.terrain.heightAt(bx, bz), bz);
        b.rotation.y = rng.range(0, Math.PI * 2);
        this.group.add(b);
      }
    }

    // 7. MOUNTAIN PINES (ridge elevations and valley fringes)
    const pinePts = this.terrain.scatter(rng, 10, 20, 55);
    for (const p of pinePts) {
      const pine = createPine({ seed: (p.x * 3 + p.z) | 0 });
      pine.position.set(p.x, p.y, p.z);
      pine.scale.setScalar(0.9 + rng.next() * 0.4);
      this.group.add(pine);
    }

    // 8. ROCKS & RIVERBANK BOULDERS
    const rockPts = this.terrain.scatter(rng, 22, 4, 48, false);
    for (const p of rockPts) {
      const r = createRock({ seed: (p.x * 13 + p.z) | 0, radius: 0.25 + rng.next() * 0.65 });
      r.position.set(p.x, p.y + 0.08, p.z);
      r.rotation.y = rng.range(0, Math.PI * 2);
      this.group.add(r);
    }

    // 9. LUSH FLOWERING BUSHES
    const bushPts = this.terrain.scatter(rng, 16, 5, 35);
    for (const p of bushPts) {
      const b = createBush({ seed: (p.z * 17 + p.x) | 0 });
      b.position.set(p.x, p.y, p.z);
      this.group.add(b);
    }

    this.loaded = this.group.children.length + 650 + 240;
    return { group: this.group, instanceCount: this.loaded };
  }

  /** Efficient GPU Instanced grass clusters across meadows */
  private buildInstancedGrass(rng: Rng, count: number): void {
    // 5-blade grass cluster geometry with vertex coloring
    const parts: Array<{ geometry: THREE.BufferGeometry; color: THREE.Color }> = [];
    const colors = [new THREE.Color(0x6aa648), new THREE.Color(0x86c24f), new THREE.Color(0x568c3a)];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rng.range(-0.2, 0.2);
      const r = 0.08 + rng.next() * 0.08;
      const h = 0.35 + rng.next() * 0.25;
      const blade = cone(0.035, h, 3);
      transform(blade, { rotZ: rng.range(-0.35, 0.35), x: Math.cos(a) * r, z: Math.sin(a) * r });
      parts.push({ geometry: blade, color: colors[i % colors.length]! });
    }
    const tuftGeo = mergeColored(parts);
    const mat = vertexColorMaterial();
    const instancedGrass = new THREE.InstancedMesh(tuftGeo, mat, count);
    instancedGrass.name = 'instanced-grass';
    instancedGrass.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const points = this.terrain.scatter(rng, count, 3, 58, true);
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.y = rng.range(0, Math.PI * 2);
      const s = 0.75 + rng.next() * 0.6;
      dummy.scale.set(s, s * (0.8 + rng.next() * 0.4), s);
      dummy.updateMatrix();
      instancedGrass.setMatrixAt(i, dummy.matrix);
    }
    instancedGrass.instanceMatrix.needsUpdate = true;
    this.instancedMeshes.push(instancedGrass);
    this.group.add(instancedGrass);
  }

  /** Efficient GPU Instanced wildflowers across countryside */
  private buildInstancedFlowers(rng: Rng, count: number): void {
    // 3-flower cluster geometry with colorful petals and green stems
    const parts: Array<{ geometry: THREE.BufferGeometry; color: THREE.Color }> = [];
    const stemColor = new THREE.Color(0x568c3a);
    const petalColors = [new THREE.Color(0xf2a0c0), new THREE.Color(0xf6db58), new THREE.Color(0xffffff)];

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const r = 0.12;
      const h = 0.28 + (i * 0.05);
      const stem = cone(0.02, h, 3);
      transform(stem, { x: Math.cos(a) * r, z: Math.sin(a) * r });
      parts.push({ geometry: stem, color: stemColor });

      const flowerHead = blob(0.065, 0.6, 5);
      transform(flowerHead, { x: Math.cos(a) * r, y: h, z: Math.sin(a) * r });
      parts.push({ geometry: flowerHead, color: petalColors[i]! });
    }
    const flowerGeo = mergeColored(parts);
    const mat = vertexColorMaterial();
    const instancedFlowers = new THREE.InstancedMesh(flowerGeo, mat, count);
    instancedFlowers.name = 'instanced-flowers';
    instancedFlowers.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const points = this.terrain.scatter(rng, count, 4, 46, true);
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.y = rng.range(0, Math.PI * 2);
      const s = 0.8 + rng.next() * 0.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      instancedFlowers.setMatrixAt(i, dummy.matrix);
    }
    instancedFlowers.instanceMatrix.needsUpdate = true;
    this.instancedMeshes.push(instancedFlowers);
    this.group.add(instancedFlowers);
  }

  /** Scatter fallen sakura petals on the grass beneath cherry trees */
  private buildSakuraPetalCarpet(rng: Rng, cx: number, cz: number, count: number): void {
    const petalMat = MAT.leafSakura();
    const petalGeo = new THREE.CircleGeometry(0.06, 4);
    petalGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < count; i++) {
      const a = rng.range(0, Math.PI * 2);
      const r = rng.range(0.4, 3.8);
      const px = cx + Math.cos(a) * r;
      const pz = cz + Math.sin(a) * r;
      const py = this.terrain.heightAt(px, pz) + 0.015;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(px, py, pz);
      petal.rotation.y = rng.range(0, Math.PI * 2);
      this.group.add(petal);
    }
  }

  get count(): number {
    return this.loaded;
  }

  dispose(): void {
    for (const mesh of this.instancedMeshes) {
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material)?.dispose();
    }
    this.instancedMeshes = [];
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry?.dispose();
      }
    });
    this.group.clear();
  }
}