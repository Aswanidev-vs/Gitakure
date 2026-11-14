import * as THREE from 'three';
import { Rng } from '@/utils/rng';
import { MAT } from '../materials';
import { taperedCylinder, blob, transform } from '../geometry';

export interface SakuraParams {
  height: number;
  trunkThickness: number;
  canopyClusters: number;
  canopyRadius: number;
  seed: number;
}

export const DEFAULT_SAKURA: SakuraParams = {
  height: 5.5,
  trunkThickness: 0.4,
  canopyClusters: 8,
  canopyRadius: 1.1,
  seed: 3,
};

/**
 * Sakura (cherry blossom) tree: a sturdy trunk with a few branches and a
 * canopy of soft pink blobs. Japanese influence.
 */
export function createSakura(p: Partial<SakuraParams> = {}): THREE.Group {
  const params = { ...DEFAULT_SAKURA, ...p };
  const rng = new Rng(params.seed);
  const tree = new THREE.Group();

  // Trunk
  const trunk = taperedCylinder(params.trunkThickness, params.trunkThickness * 0.7, params.height, 6);
  tree.add(new THREE.Mesh(trunk, MAT.barkDark()));

  // Branches + canopy blobs clustered near the top
  const crownY = params.height * 0.9;
  for (let i = 0; i < params.canopyClusters; i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(0.2, 1.4) * params.canopyRadius;
    const b = blob(params.canopyRadius * rng.range(0.6, 1.1), 0.7, 7);
    transform(b, {
      x: Math.cos(a) * r,
      y: crownY + rng.range(-0.6, 1.2),
      z: Math.sin(a) * r,
    });
    tree.add(new THREE.Mesh(b, MAT.leafSakura()));
  }

  // A couple of visible branches
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rng.range(-0.3, 0.3);
    const br = taperedCylinder(params.trunkThickness * 0.35, params.trunkThickness * 0.15, 1.6, 5);
    transform(br, { rotZ: 0.7, rotY: a, y: params.height * 0.6 });
    tree.add(new THREE.Mesh(br, MAT.barkDark()));
  }

  return tree;
}