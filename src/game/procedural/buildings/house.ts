import * as THREE from 'three';
import { MAT } from '../materials';
import { box, taperedCylinder, transform } from '../geometry';

export interface HouseParams {
  width: number;
  depth: number;
  wallHeight: number;
  roofHeight: number;
  roofOverhang: number;
  style: 'japanese' | 'kerala';
  seed: number;
}

export const DEFAULT_HOUSE: HouseParams = {
  width: 5,
  depth: 4,
  wallHeight: 2.8,
  roofHeight: 2.2,
  roofOverhang: 0.6,
  style: 'japanese',
  seed: 9,
};

/**
 * Countryside house generator. Japanese: dark tiled gabled roof, wooden posts,
 * veranda. Kerala: terracotta pitched roof, red-earth walls. Blends both
 * influences with recognizable silhouettes (spec §8, §10).
 */
export function createHouse(p: Partial<HouseParams> = {}): THREE.Group {
  const params = { ...DEFAULT_HOUSE, ...p };
  const g = new THREE.Group();
  const w = params.width;
  const d = params.depth;
  const wh = params.wallHeight;
  const ov = params.roofOverhang;

  // Foundation
  const foundation = box(w + 0.4, 0.3, d + 0.4);
  g.add(new THREE.Mesh(foundation, MAT.stoneDark()));

  // Walls
  const walls = box(w, wh, d);
  const wallMat = params.style === 'japanese' ? MAT.woodPlank() : MAT.dirt();
  g.add(new THREE.Mesh(walls, wallMat));

  // Veranda (wooden porch on the front)
  const veranda = box(w + 0.6, 0.2, 1.2);
  transform(veranda, { z: d / 2 + 0.6 });
  g.add(new THREE.Mesh(veranda, MAT.woodPlank()));

  // Roof: a gabled roof made of two slanted boxes meeting at a ridge.
  const roofMat = params.style === 'japanese' ? MAT.roofDark() : MAT.roofTerracotta();
  const rh = params.roofHeight;
  const slope = Math.sqrt(ov * ov + rh * rh) / 2;
  const angle = Math.atan2(rh, d / 2 + ov);

  // Front slope
  const frontSlope = box(w + ov * 2, 0.15, slope * 2);
  transform(frontSlope, { rotX: -angle, y: wh + rh / 2, z: (d / 4 + ov / 2) });
  g.add(new THREE.Mesh(frontSlope, roofMat));

  // Back slope
  const backSlope = box(w + ov * 2, 0.15, slope * 2);
  transform(backSlope, { rotX: angle, y: wh + rh / 2, z: -(d / 4 + ov / 2) });
  g.add(new THREE.Mesh(backSlope, roofMat));

  // Ridge beam
  const ridge = box(w + ov * 2, 0.18, 0.3);
  transform(ridge, { y: wh + rh });
  g.add(new THREE.Mesh(ridge, MAT.woodDark()));

  // Corner posts (Japanese wooden aesthetic)
  if (params.style === 'japanese') {
    const postR = 0.12;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const post = taperedCylinder(postR, postR, wh, 5);
        transform(post, { x: (sx * w) / 2, z: (sz * d) / 2 });
        g.add(new THREE.Mesh(post, MAT.woodDark()));
      }
    }
  }

  // Door (dark inset on the veranda side)
  const door = box(0.9, 1.9, 0.1);
  transform(door, { y: 0.2, z: d / 2 + 0.05 });
  g.add(new THREE.Mesh(door, MAT.woodDark()));

  // Windows
  const win = box(0.7, 0.7, 0.08);
  transform(win, { x: w * 0.3, y: 1.4, z: d / 2 + 0.05 });
  g.add(new THREE.Mesh(win, MAT.woodDark()));

  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return g;
}