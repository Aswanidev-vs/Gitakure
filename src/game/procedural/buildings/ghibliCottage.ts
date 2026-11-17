import * as THREE from 'three';
import { MAT } from '../materials';
import { box } from '../geometry';

export interface GhibliCottageParams {
  width?: number;
  depth?: number;
  height?: number;
}

export function createGhibliCottage(p: Partial<GhibliCottageParams> = {}): THREE.Group {
  const params: GhibliCottageParams = { width: 3.2, depth: 2.6, height: 2.0, ...p };
  const g = new THREE.Group();
  g.name = 'ghibli-cottage';

  const w = params.width ?? 3.2;
  const d = params.depth ?? 2.6;
  const h = params.height ?? 2.0;

  // Walls
  const walls = new THREE.Mesh(box(w, h, d), MAT.woodPlank());
  walls.position.y = h / 2;
  walls.castShadow = true;
  g.add(walls);

  // Door
  const door = new THREE.Mesh(box(0.7, 1.1, 0.08), MAT.woodDark());
  door.position.set(0, 0.55, d / 2 + 0.02);
  g.add(door);

  // Windows
  for (const sx of [-0.9, 0.9]) {
    const win = new THREE.Mesh(box(0.5, 0.5, 0.06), new THREE.MeshToonMaterial({ color: 0xfff5dd, emissive: 0xfff5dd, emissiveIntensity: 0.3 }));
    win.position.set(sx, h * 0.6, d / 2 + 0.02);
    g.add(win);
  }

  // Thatched roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, h * 0.9, 4), MAT.roofTerracotta());
  roof.position.y = h + (h * 0.9) / 2;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  // Chimney
  const chimney = new THREE.Mesh(box(0.35, 0.9, 0.35), MAT.stoneDark());
  chimney.position.set(w * 0.25, h + 0.45, -d * 0.15);
  chimney.castShadow = true;
  g.add(chimney);

  return g;
}
