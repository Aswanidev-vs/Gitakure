import * as THREE from 'three';
import { MAT } from '../materials';
import { box } from '../geometry';

export interface BridgeParams {
  length: number;
  width: number;
  arch: number;
  seed: number;
}

export const DEFAULT_BRIDGE: BridgeParams = {
  length: 11,
  width: 2.6,
  arch: 1.2,
  seed: 11,
};

/**
 * Traditional Japanese curved wooden river bridge:
 * Segmented curved deck spanning the river, supported by water pilings,
 * with curved wooden handrails and baluster posts (Images 1, 5, 6).
 */
export function createBridge(p: Partial<BridgeParams> = {}): THREE.Group {
  const params = { ...DEFAULT_BRIDGE, ...p };
  const g = new THREE.Group();
  const len = params.length;
  const w = params.width;
  const arch = params.arch;
  const segments = 12;

  // Segmented arched deck planks
  const segLen = (len / segments) * 1.05;
  for (let i = 0; i < segments; i++) {
    const t0 = (i / segments) * 2 - 1; // -1 to 1
    const t1 = ((i + 1) / segments) * 2 - 1;
    const x0 = t0 * (len / 2);
    const x1 = t1 * (len / 2);
    const y0 = Math.cos(t0 * Math.PI * 0.45) * arch;
    const y1 = Math.cos(t1 * Math.PI * 0.45) * arch;

    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    const angle = Math.atan2(y1 - y0, x1 - x0);

    const plankMesh = new THREE.Mesh(box(segLen, 0.16, w), MAT.woodPlank());
    plankMesh.position.set(midX, midY, 0);
    plankMesh.rotation.z = angle;
    g.add(plankMesh);

    // Side handrail segments
    for (const sz of [-1, 1]) {
      const railZ = (sz * (w - 0.15)) / 2;
      const railMesh = new THREE.Mesh(box(segLen, 0.1, 0.1), MAT.woodDark());
      railMesh.position.set(midX, midY + 0.65, railZ);
      railMesh.rotation.z = angle;
      g.add(railMesh);

      // Baluster post at each joint
      if (i % 2 === 0 || i === segments - 1) {
        const postMesh = new THREE.Mesh(box(0.12, 0.75, 0.12), MAT.woodDark());
        postMesh.position.set(x0, y0 + 0.35, railZ);
        g.add(postMesh);

        // Ornamental post cap (giboshi)
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), MAT.stoneDark());
        cap.position.set(x0, y0 + 0.78, railZ);
        g.add(cap);
      }
    }
  }

  // Wooden support pilings extending into the riverbed
  for (const frac of [-0.3, 0.3]) {
    const px = frac * len;
    const py = Math.cos(frac * 2 * Math.PI * 0.45) * arch;
    for (const pz of [-(w - 0.4) / 2, (w - 0.4) / 2]) {
      const pilingMesh = new THREE.Mesh(box(0.2, 3.5, 0.2), MAT.woodDark());
      pilingMesh.position.set(px, py - 1.6, pz);
      g.add(pilingMesh);
    }
    // Horizontal cross-beam connecting pilings under deck
    const beamMesh = new THREE.Mesh(box(0.22, 0.22, w + 0.2), MAT.woodDark());
    beamMesh.position.set(px, py - 0.2, 0);
    g.add(beamMesh);
  }

  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return g;
}