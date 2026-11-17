import * as THREE from 'three';
import { Rng } from '@/utils/rng';
import { MAT } from '../materials';
import { blob, taperedCylinder } from '../geometry';

export interface GhibliTreeParams {
  height?: number;
  canopy?: number;
  seed?: number;
}

export function createGhibliTree(p: Partial<GhibliTreeParams> = {}): THREE.Group {
  const params: GhibliTreeParams = { height: 3.2, canopy: 1.6, seed: 1, ...p };
  const height = params.height ?? 3.2;
  const canopy = params.canopy ?? 1.6;
  const rng = new Rng(params.seed ?? 1);
  const g = new THREE.Group();
  g.name = 'ghibli-tree';

  const trunkH = height * 0.45;
  const trunk = new THREE.Mesh(taperedCylinder(0.18, 0.12, trunkH, 7), MAT.bark());
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  g.add(trunk);

  const canopyR = canopy;
  const main = new THREE.Mesh(blob(canopyR, 0.85, 8), MAT.leafMid());
  main.position.y = trunkH + canopyR * 0.5;
  main.castShadow = true;
  g.add(main);

  for (let i = 0; i < 3; i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(0.3, 0.8);
    const sub = new THREE.Mesh(blob(canopyR * rng.range(0.45, 0.65), 0.8, 6), MAT.leafLight());
    sub.position.set(Math.cos(a) * r, trunkH + rng.range(0.2, 0.9), Math.sin(a) * r);
    sub.castShadow = true;
    g.add(sub);
  }

  // Small root flare
  const flare = new THREE.Mesh(taperedCylinder(0.28, 0.18, 0.25, 6), MAT.barkDark());
  flare.position.y = 0.125;
  g.add(flare);

  return g;
}
