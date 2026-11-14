import * as THREE from 'three';
import { Rng } from '@/utils/rng';
import { MAT } from '../materials';
import { cone, blob } from '../geometry';

export interface PalmParams {
  height: number;
  trunkThickness: number;
  frondCount: number;
  frondLength: number;
  frondWidth: number;
  coconutCount: number;
  curvature: number; // 0..1 lean
  seed: number;
}

export const DEFAULT_PALM: PalmParams = {
  height: 6,
  trunkThickness: 0.35,
  frondCount: 9,
  frondLength: 3.2,
  frondWidth: 0.6,
  coconutCount: 3,
  curvature: 0.25,
  seed: 1,
};

/**
 * Coconut palm: curved/leaning trunk, radial fronds (tapered cones), optional
 * coconuts. Deterministic per seed.
 */
export function createCoconutPalm(p: Partial<PalmParams> = {}): THREE.Group {
  const params = { ...DEFAULT_PALM, ...p };
  const rng = new Rng(params.seed);
  const tree = new THREE.Group();

  // Trunk: stacked segments following a quadratic lean curve.
  const trunkSegments = 6;
  const lean = params.curvature * params.height * 0.4;
  const dir = rng.range(0, Math.PI * 2);
  const trunkPts: THREE.Vector3[] = [];
  for (let i = 0; i <= trunkSegments; i++) {
    const t = i / trunkSegments;
    const y = t * params.height;
    const offset = t * t * lean;
    trunkPts.push(new THREE.Vector3(Math.cos(dir) * offset, y, Math.sin(dir) * offset));
  }
  const curve = new THREE.CatmullRomCurve3(trunkPts);
  const tube = new THREE.TubeGeometry(curve, trunkSegments * 2, params.trunkThickness, 5, false);
  const trunk = new THREE.Mesh(tube, MAT.bark());
  trunk.castShadow = true;
  tree.add(trunk);

  const top = trunkPts[trunkPts.length - 1]!;

  // Fronds: curved tapered leaves radiating from the crown.
  for (let i = 0; i < params.frondCount; i++) {
    const angle = (i / params.frondCount) * Math.PI * 2 + rng.range(-0.2, 0.2);
    const droop = rng.range(0.15, 0.5);
    const len = params.frondLength * rng.range(0.8, 1.1);
    // A frond is a stretched, flattened cone angled outward and drooping.
    const frond = cone(params.frondWidth, len, 4);
    frond.scale(1, 1, 0.25);
    frond.rotateX(Math.PI / 2 - droop); // tilt down
    frond.rotateY(angle);
    frond.translate(top.x, top.y, top.z);
    const frondMesh = new THREE.Mesh(frond, MAT.palmFrond());
    frondMesh.castShadow = true;
    tree.add(frondMesh);
  }

  // Coconuts: small clusters at the crown base.
  for (let i = 0; i < params.coconutCount; i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = params.trunkThickness * 1.5;
    const c = blob(0.22, 0.9, 6);
    c.translate(top.x + Math.cos(a) * r, top.y - 0.15, top.z + Math.sin(a) * r);
    tree.add(new THREE.Mesh(c, MAT.leafDark()));
  }

  return tree;
}