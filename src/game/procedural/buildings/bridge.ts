import * as THREE from 'three';
import { MAT } from '../materials';
import { box, transform } from '../geometry';

export interface BridgeParams {
  length: number;
  width: number;
  arch: number;
  seed: number;
}

export const DEFAULT_BRIDGE: BridgeParams = {
  length: 8,
  width: 2,
  arch: 0.8,
  seed: 11,
};

/**
 * Simple wooden bridge: slightly arched plank deck with side rails.
 * Spans rivers/canals in the village.
 */
export function createBridge(p: Partial<BridgeParams> = {}): THREE.Group {
  const params = { ...DEFAULT_BRIDGE, ...p };
  const g = new THREE.Group();
  const len = params.length;
  const w = params.width;
  const arch = params.arch;

  // Deck: a gently arched series of planks approximated by a single box
  // tilted along its length (sufficient for stylized low-poly).
  const deck = box(len, 0.2, w);
  transform(deck, { y: arch });
  g.add(new THREE.Mesh(deck, MAT.woodPlank()));

  // Railings
  for (const sz of [-1, 1]) {
    const rail = box(len, 0.08, 0.08);
    transform(rail, { y: arch + 0.6, z: (sz * w) / 2 });
    g.add(new THREE.Mesh(rail, MAT.woodDark()));

    // Posts
    for (let i = 0; i <= 4; i++) {
      const x = -len / 2 + (i / 4) * len;
      const post = box(0.1, 0.6, 0.1);
      transform(post, { x, y: arch, z: (sz * w) / 2 });
      g.add(new THREE.Mesh(post, MAT.woodDark()));
    }
  }

  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}