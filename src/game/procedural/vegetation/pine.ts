import * as THREE from 'three';
import { Rng } from '@/utils/rng';
import { MAT } from '../materials';
import { taperedCylinder, cone, transform } from '../geometry';

export interface PineParams {
  height: number;
  trunkThickness: number;
  layerCount: number;
  layerRadius: number;
  seed: number;
}

export const DEFAULT_PINE: PineParams = {
  height: 7,
  trunkThickness: 0.35,
  layerCount: 5,
  layerRadius: 1.8,
  seed: 4,
};

/**
 * Pine / conifer: straight trunk + stacked conical foliage layers narrowing
 * toward the top. Japanese hillside influence.
 */
export function createPine(p: Partial<PineParams> = {}): THREE.Group {
  const params = { ...DEFAULT_PINE, ...p };
  const rng = new Rng(params.seed);
  const tree = new THREE.Group();

  const trunk = taperedCylinder(params.trunkThickness, params.trunkThickness * 0.6, params.height, 6);
  tree.add(new THREE.Mesh(trunk, MAT.bark()));

  for (let i = 0; i < params.layerCount; i++) {
    const t = i / params.layerCount;
    const y = params.height * (0.35 + t * 0.6);
    const r = params.layerRadius * (1 - t * 0.7) * rng.range(0.85, 1.1);
    const h = params.height * 0.22;
    const c = cone(r, h, 7);
    transform(c, { y: y });
    tree.add(new THREE.Mesh(c, i % 2 === 0 ? MAT.leafDark() : MAT.leafMid()));
  }

  return tree;
}