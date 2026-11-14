import * as THREE from 'three';
import { Rng } from '@/utils/rng';
import { MAT } from '../materials';
import { taperedCylinder, transform } from '../geometry';

export interface BambooParams {
  stalkCount: number;
  stalkHeight: number;
  stalkRadius: number;
  nodeSegments: number;
  spread: number;
  seed: number;
}

export const DEFAULT_BAMBOO: BambooParams = {
  stalkCount: 7,
  stalkHeight: 7,
  stalkRadius: 0.12,
  nodeSegments: 8,
  spread: 1.2,
  seed: 2,
};

/**
 * Bamboo cluster: multiple vertical segmented stalks with visible nodes,
 * varied heights and slight lean, in a small spread.
 */
export function createBamboo(p: Partial<BambooParams> = {}): THREE.Group {
  const params = { ...DEFAULT_BAMBOO, ...p };
  const rng = new Rng(params.seed);
  const cluster = new THREE.Group();

  for (let s = 0; s < params.stalkCount; s++) {
    const angle = (s / params.stalkCount) * Math.PI * 2 + rng.range(-0.3, 0.3);
    const dist = rng.range(0, params.spread);
    const bx = Math.cos(angle) * dist;
    const bz = Math.sin(angle) * dist;
    const h = params.stalkHeight * rng.range(0.7, 1.1);
    const lean = rng.range(0.04, 0.18);
    const leanDir = rng.range(0, Math.PI * 2);

    // Stalk: a thin cylinder.
    const stalk = taperedCylinder(params.stalkRadius, params.stalkRadius * 0.7, h, 5);
    transform(stalk, { rotX: Math.cos(leanDir) * lean, rotZ: Math.sin(leanDir) * lean, x: bx, z: bz });
    cluster.add(new THREE.Mesh(stalk, MAT.bamboo()));

    // Nodes: small torus-like rings along the stalk (simplified as short cylinders).
    for (let n = 1; n < params.nodeSegments; n++) {
      const t = n / params.nodeSegments;
      const ring = new THREE.CylinderGeometry(
        params.stalkRadius * 1.25,
        params.stalkRadius * 1.25,
        params.stalkRadius * 0.6,
        5,
      );
      ring.translate(
        bx + Math.cos(leanDir) * lean * t * h,
        t * h,
        bz + Math.sin(leanDir) * lean * t * h,
      );
      cluster.add(new THREE.Mesh(ring, MAT.bambooNode()));
    }
  }

  return cluster;
}