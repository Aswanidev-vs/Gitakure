import * as THREE from 'three';
import { Rng } from '@/utils/rng';
import { MAT } from './materials';
import { icoRock, blob, transform, cone, mergeColored, vertexColorMaterial } from './geometry';

export interface RockParams {
  radius: number;
  detail: number;
  color: 'stone' | 'stoneDark';
  seed: number;
}

export function createRock(p: Partial<RockParams> = {}): THREE.Mesh {
  const params: RockParams = { radius: 0.6, detail: 0, color: 'stone', seed: 5, ...p };
  const rng = new Rng(params.seed);
  const g = icoRock(params.radius, params.detail);
  // Random per-vertex jitter for an irregular, natural silhouette.
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const j = 0.85 + rng.next() * 0.3;
    pos.setXYZ(i, pos.getX(i) * j, pos.getY(i) * (0.7 + rng.next() * 0.5), pos.getZ(i) * j);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, params.color === 'stone' ? MAT.stone() : MAT.stoneDark());
  m.castShadow = true;
  return m;
}

export interface GrassTuftParams {
  blades: number;
  height: number;
  color: 'leafMid' | 'leafLight';
  seed: number;
}

export function createGrassTuft(p: Partial<GrassTuftParams> = {}): THREE.Group {
  const params: GrassTuftParams = { blades: 7, height: 0.5, color: 'leafMid', seed: 6, ...p };
  const rng = new Rng(params.seed);
  const g = new THREE.Group();
  const color = MAT[params.color]().color;
  const parts: Array<{ geometry: THREE.BufferGeometry; color: THREE.Color }> = [];
  for (let i = 0; i < params.blades; i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(0, 0.15);
    const h = params.height * rng.range(0.6, 1.2);
    const blade = cone(0.04, h, 3);
    transform(blade, { rotZ: rng.range(-0.3, 0.3), x: Math.cos(a) * r, z: Math.sin(a) * r });
    parts.push({ geometry: blade, color });
  }
  // Merge all blades into a single vertex-colored mesh (1 draw call).
  const merged = mergeColored(parts);
  const mesh = new THREE.Mesh(merged, vertexColorMaterial());
  g.add(mesh);
  return g;
}

export interface FlowerClusterParams {
  count: number;
  color: 'flowerPink' | 'flowerYellow' | 'flowerWhite';
  seed: number;
}

export function createFlowerCluster(p: Partial<FlowerClusterParams> = {}): THREE.Group {
  const params: FlowerClusterParams = { count: 5, color: 'flowerPink', seed: 7, ...p };
  const rng = new Rng(params.seed);
  const g = new THREE.Group();
  for (let i = 0; i < params.count; i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(0, 0.3);
    const h = rng.range(0.2, 0.5);
    const stem = cone(0.02, h, 3);
    transform(stem, { x: Math.cos(a) * r, z: Math.sin(a) * r });
    g.add(new THREE.Mesh(stem, MAT.leafMid()));
    const head = blob(0.07, 0.6, 5);
    transform(head, { x: Math.cos(a) * r, y: h, z: Math.sin(a) * r });
    g.add(new THREE.Mesh(head, MAT[params.color]()));
  }
  return g;
}

export interface BushParams {
  radius: number;
  color: 'leafMid' | 'leafDark' | 'leafLight';
  seed: number;
}

export function createBush(p: Partial<BushParams> = {}): THREE.Group {
  const params: BushParams = { radius: 0.7, color: 'leafMid', seed: 8, ...p };
  const rng = new Rng(params.seed);
  const g = new THREE.Group();
  const lobes = 3;
  for (let i = 0; i < lobes; i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(0, params.radius * 0.5);
    const b = blob(params.radius * rng.range(0.6, 1.0), 0.8, 6);
    transform(b, { x: Math.cos(a) * r, y: rng.range(0.1, 0.3), z: Math.sin(a) * r });
    g.add(new THREE.Mesh(b, MAT[params.color]()));
  }
  return g;
}

export interface StoneLanternParams {
  withLight?: boolean;
}

export function createStoneLantern(p: StoneLanternParams = {}): THREE.Group {
  const g = new THREE.Group();
  g.name = 'stone-lantern';
  const stoneMat = MAT.stone();

  // Base
  const base1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.6), stoneMat);
  base1.position.y = 0.075;
  base1.castShadow = true;
  g.add(base1);

  const base2 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.46), stoneMat);
  base2.position.y = 0.21;
  base2.castShadow = true;
  g.add(base2);

  // Post / column
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.6, 0.24), stoneMat);
  post.position.y = 0.57;
  post.castShadow = true;
  g.add(post);

  // Platform (chudai)
  const platform = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.55), stoneMat);
  platform.position.y = 0.92;
  platform.castShadow = true;
  g.add(platform);

  // Light chamber (hibukuro) - outer frame
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xffdf78,
    emissive: 0xffaa22,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });
  const chamber = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.34), glowMat);
  chamber.position.y = 1.13;
  g.add(chamber);

  // Roof (kasa) - 4-sided flared pagoda roof
  const roofGeo = new THREE.ConeGeometry(0.52, 0.25, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, stoneMat);
  roof.position.y = 1.41;
  roof.castShadow = true;
  g.add(roof);

  // Finial (hoju)
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), stoneMat);
  finial.position.y = 1.58;
  g.add(finial);

  if (p.withLight !== false) {
    const light = new THREE.PointLight(0xffa834, 1.4, 7);
    light.position.set(0, 1.13, 0);
    g.add(light);
  }

  return g;
}
