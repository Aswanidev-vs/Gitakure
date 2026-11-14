import * as THREE from 'three';
import { Rng } from '@/utils/rng';
import { MAT } from './materials';
import { icoRock, blob, transform, cone } from './geometry';

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
  for (let i = 0; i < params.blades; i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(0, 0.15);
    const h = params.height * rng.range(0.6, 1.2);
    const blade = cone(0.04, h, 3);
    transform(blade, { rotZ: rng.range(-0.3, 0.3), x: Math.cos(a) * r, z: Math.sin(a) * r });
    g.add(new THREE.Mesh(blade, MAT[params.color]()));
  }
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