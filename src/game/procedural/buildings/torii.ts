import * as THREE from 'three';
import { taperedCylinder, box, transform } from '../geometry';

export interface ToriiParams {
  width: number;
  height: number;
  postThickness: number;
  seed: number;
}

export const DEFAULT_TORII: ToriiParams = {
  width: 4,
  height: 4,
  postThickness: 0.25,
  seed: 10,
};

/**
 * Shinto torii gate: two posts, a curved kasagi (top lintel), and a nuki
 * (lower crossbeam). Japanese shrine accent.
 */
export function createTorii(p: Partial<ToriiParams> = {}): THREE.Group {
  const params = { ...DEFAULT_TORII, ...p };
  const g = new THREE.Group();
  const w = params.width;
  const h = params.height;
  const r = params.postThickness;

  const vermilion = new THREE.MeshStandardMaterial({ color: 0xd23b2a, roughness: 0.7, flatShading: true });

  // Two posts
  for (const sx of [-1, 1]) {
    const post = taperedCylinder(r, r * 0.9, h, 6);
    transform(post, { x: (sx * w) / 2 });
    const m = new THREE.Mesh(post, vermilion);
    m.castShadow = true;
    g.add(m);
  }

  // Nuki (lower tie beam)
  const nuki = box(w + r * 2, r * 1.2, r * 0.8);
  transform(nuki, { y: h * 0.72 });
  g.add(new THREE.Mesh(nuki, vermilion));

  // Kasagi (top lintel, slightly wider)
  const kasagi = box(w + r * 4, r * 1.4, r * 1.2);
  transform(kasagi, { y: h });
  g.add(new THREE.Mesh(kasagi, vermilion));

  return g;
}