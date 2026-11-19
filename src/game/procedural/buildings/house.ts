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
  hasSecondFloor?: boolean;
  seed: number;
}

export const DEFAULT_HOUSE: HouseParams = {
  width: 5.5,
  depth: 4.4,
  wallHeight: 2.8,
  roofHeight: 2.2,
  roofOverhang: 0.7,
  style: 'japanese',
  hasSecondFloor: false,
  seed: 9,
};

/**
 * Countryside house generator:
 * Authentic Japanese-Kerala fusion architecture featuring tiered tiled roofs,
 * glowing shoji paper lattice windows, wooden engawa verandas, and corner pillars.
 */
export function createHouse(p: Partial<HouseParams> = {}): THREE.Group {
  const params = { ...DEFAULT_HOUSE, ...p };
  const g = new THREE.Group();
  const w = params.width;
  const d = params.depth;
  const wh = params.wallHeight;
  const ov = params.roofOverhang;

  // Stone foundation
  const foundation = new THREE.Mesh(box(w + 0.6, 0.35, d + 0.6), MAT.stoneDark());
  foundation.position.y = 0.175;
  g.add(foundation);

  // Wooden Engawa (raised veranda on front and side)
  const veranda = new THREE.Mesh(box(w + 0.8, 0.18, 1.3), MAT.woodPlank());
  veranda.position.set(0, 0.38, d / 2 + 0.65);
  g.add(veranda);

  // Veranda steps
  const step = new THREE.Mesh(box(1.8, 0.14, 0.5), MAT.stone());
  step.position.set(0, 0.14, d / 2 + 1.45);
  g.add(step);

  // Main ground walls: warm plaster panels framed in dark timber, the
  // signature look of the reference village houses.
  const wallMat = params.style === 'japanese' ? MAT.plaster() : MAT.plasterWarm();
  const walls = new THREE.Mesh(box(w, wh, d), wallMat);
  walls.position.y = wh / 2 + 0.35;
  g.add(walls);

  // Corner timber pillars
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pillar = new THREE.Mesh(taperedCylinder(0.12, 0.12, wh + 0.35, 6), MAT.woodDark());
      pillar.position.set((sx * w) / 2, 0, (sz * d) / 2);
      g.add(pillar);
    }
  }

  // Timber framing: sill beams, top plates and studs on every facade.
  const timber = MAT.woodDark();
  const frontZ = d / 2 + 0.045;
  const backZ = -d / 2 - 0.045;
  const sideX = w / 2 + 0.045;

  const beam = (bw: number, bh: number, bd: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(box(bw, bh, bd), timber);
    m.position.set(x, y, z);
    g.add(m);
  };

  // Front + back rails.
  for (const z of [frontZ, backZ]) {
    beam(w + 0.3, 0.13, 0.09, 0, 0.5, z);
    beam(w + 0.3, 0.15, 0.09, 0, wh + 0.2, z);
    for (const x of [-w / 2 + 0.12, -w / 4, w / 4, w / 2 - 0.12]) {
      beam(0.12, wh - 0.2, 0.075, x, 0.55, z);
    }
  }
  // Side rails + studs.
  for (const x of [sideX, -sideX]) {
    beam(0.075, 0.13, d + 0.3, x, 0.5, 0);
    beam(0.075, 0.15, d + 0.3, x, wh + 0.2, 0);
    for (const z of [-d / 2 + 0.12, 0, d / 2 - 0.12]) {
      beam(0.075, wh - 0.2, 0.12, x, 0.55, z);
    }
  }

  // Sliding Shoji doors & warm glowing lattice windows (Image 1 & 5 signature)
  const shojiGlowMat = new THREE.MeshToonMaterial({
    color: 0xffe6a3,
    emissive: new THREE.Color(0xffa834),
    emissiveIntensity: 0.9,
  });

  // Front sliding shoji door
  const doorFrame = new THREE.Mesh(box(1.2, 2.0, 0.08), MAT.woodDark());
  doorFrame.position.set(-0.6, 1.35, d / 2 + 0.04);
  g.add(doorFrame);

  const doorGlow = new THREE.Mesh(box(1.0, 1.8, 0.06), shojiGlowMat);
  doorGlow.position.set(-0.6, 1.35, d / 2 + 0.05);
  g.add(doorGlow);

  // Front glowing lattice windows
  const winFrame = new THREE.Mesh(box(1.4, 1.0, 0.08), MAT.woodDark());
  winFrame.position.set(1.4, 1.65, d / 2 + 0.04);
  g.add(winFrame);

  const winGlow = new THREE.Mesh(box(1.2, 0.8, 0.06), shojiGlowMat);
  winGlow.position.set(1.4, 1.65, d / 2 + 0.05);
  g.add(winGlow);

  // Side glowing window
  const sideWin = new THREE.Mesh(box(0.08, 0.9, 1.2), shojiGlowMat);
  sideWin.position.set(w / 2 + 0.04, 1.65, 0);
  g.add(sideWin);

  const farSideWin = new THREE.Mesh(box(0.08, 0.9, 1.2), shojiGlowMat);
  farSideWin.position.set(-(w / 2 + 0.04), 1.65, 0);
  g.add(farSideWin);

  // Shoji lattice: dark muntins over the glowing paper.
  const muntin = (bw: number, bh: number, bd: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(box(bw, bh, bd), MAT.woodDark());
    m.position.set(x, y, z);
    g.add(m);
  };
  for (const bx of [-1.05, -0.6, -0.15]) muntin(0.035, 1.7, 0.03, bx, 1.4, d / 2 + 0.095);
  for (const by of [1.6, 2.15, 2.75]) muntin(1.0, 0.035, 0.03, -0.6, by, d / 2 + 0.095);
  for (const bx of [1.05, 1.4, 1.75]) muntin(0.03, 0.8, 0.03, bx, 1.65, d / 2 + 0.095);
  muntin(1.16, 0.035, 0.03, 1.4, 2.02, d / 2 + 0.095);
  for (const sx of [1, -1]) {
    for (const bz of [-0.4, 0, 0.4]) muntin(0.03, 0.8, 0.03, sx * (w / 2 + 0.09), 1.65, bz);
    muntin(0.03, 0.035, 1.12, sx * (w / 2 + 0.09), 2.02, 0);
  }

  // Warm interior lantern glow light
  const interiorLight = new THREE.PointLight(0xffa834, 1.8, 8);
  interiorLight.position.set(0, 1.8, d / 2 + 0.8);
  g.add(interiorLight);

  // Roof construction
  const roofMat = params.style === 'japanese' ? MAT.roofDark() : MAT.roofTerracotta();
  const rh = params.roofHeight;
  const slope = Math.sqrt(ov * ov + rh * rh) / 2;
  const angle = Math.atan2(rh, d / 2 + ov);

  // Lower Main Roof
  const frontSlope = box(w + ov * 2, 0.16, slope * 2);
  transform(frontSlope, { rotX: -angle, y: wh + 0.35 + rh / 2, z: (d / 4 + ov / 2) });
  g.add(new THREE.Mesh(frontSlope, roofMat));

  const backSlope = box(w + ov * 2, 0.16, slope * 2);
  transform(backSlope, { rotX: angle, y: wh + 0.35 + rh / 2, z: -(d / 4 + ov / 2) });
  g.add(new THREE.Mesh(backSlope, roofMat));

  const ridge = new THREE.Mesh(box(w + ov * 2, 0.2, 0.35), MAT.woodDark());
  ridge.position.set(0, wh + 0.35 + rh, 0);
  g.add(ridge);

  // Deep eaves: a dark fascia beam plus exposed rafter ends.
  const fasciaFront = new THREE.Mesh(box(w + ov * 2 + 0.1, 0.17, 0.14), MAT.woodDark());
  fasciaFront.position.set(0, wh + 0.2, d / 2 + ov * 0.72);
  g.add(fasciaFront);
  const fasciaBack = new THREE.Mesh(box(w + ov * 2 + 0.1, 0.17, 0.14), MAT.woodDark());
  fasciaBack.position.set(0, wh + 0.2, -(d / 2 + ov * 0.72));
  g.add(fasciaBack);
  for (let i = 0; i < 7; i++) {
    const rx = -w / 2 + (i / 6) * w;
    for (const sz of [1, -1]) {
      const rafter = new THREE.Mesh(box(0.1, 0.1, 0.7), MAT.woodDark());
      rafter.position.set(rx, wh + 0.24, sz * (d / 2 + 0.3));
      g.add(rafter);
    }
  }

  // Raised tile seams give the roof a hand-built tiled rhythm.
  for (const sign of [1, -1] as const) {
    const rotX = sign === 1 ? -angle : angle;
    const seamY = wh + 0.35 + rh / 2;
    const seamZ = sign * (d / 4 + ov / 2);
    for (let i = 0; i < 8; i++) {
      const sx = -w / 2 - ov + 0.35 + (i / 7) * (w + ov * 2 - 0.7);
      const seam = box(0.05, 0.2, slope * 2);
      transform(seam, { rotX, x: sx, y: seamY, z: seamZ });
      g.add(new THREE.Mesh(seam, MAT.roofTile()));
    }
  }

  // Optional Second-Story Gable (for the village main manor house)
  if (params.hasSecondFloor) {
    const sW = w * 0.65;
    const sD = d * 0.65;
    const sH = 1.8;
    const upperWall = new THREE.Mesh(box(sW, sH, sD), MAT.woodPlank());
    upperWall.position.set(0, wh + 0.35 + rh * 0.6 + sH / 2, 0);
    g.add(upperWall);

    // Upper shoji window
    const upperWin = new THREE.Mesh(box(1.0, 0.7, 0.08), shojiGlowMat);
    upperWin.position.set(0, wh + 0.35 + rh * 0.6 + 0.9, sD / 2 + 0.04);
    g.add(upperWin);

    // Second-floor balcony with a simple timber railing.
    const balconyY = wh + 0.35 + rh * 0.6;
    const deck = new THREE.Mesh(box(sW + 1.0, 0.14, 0.8), MAT.woodPlank());
    deck.position.set(0, balconyY, sD / 2 + 0.42);
    g.add(deck);
    for (let i = 0; i < 6; i++) {
      const px = -(sW + 0.8) / 2 + (i / 5) * (sW + 0.8);
      const post = new THREE.Mesh(box(0.08, 0.72, 0.08), MAT.woodDark());
      post.position.set(px, balconyY + 0.14, sD / 2 + 0.78);
      g.add(post);
    }
    const rail = new THREE.Mesh(box(sW + 1.0, 0.09, 0.1), MAT.woodDark());
    rail.position.set(0, balconyY + 0.78, sD / 2 + 0.78);
    g.add(rail);

    // Upper side windows.
    for (const sx of [1, -1]) {
      const upperSide = new THREE.Mesh(box(0.06, 0.6, 0.9), shojiGlowMat);
      upperSide.position.set(sx * (sW / 2 + 0.03), balconyY + 0.75, 0);
      g.add(upperSide);
    }

    // Upper Roof
    const uRh = 1.5;
    const uOv = 0.5;
    const uSlope = Math.sqrt(uOv * uOv + uRh * uRh) / 2;
    const uAngle = Math.atan2(uRh, sD / 2 + uOv);

    const uFrontSlope = box(sW + uOv * 2, 0.14, uSlope * 2);
    transform(uFrontSlope, { rotX: -uAngle, y: wh + 0.35 + rh * 0.6 + sH + uRh / 2, z: (sD / 4 + uOv / 2) });
    g.add(new THREE.Mesh(uFrontSlope, roofMat));

    const uBackSlope = box(sW + uOv * 2, 0.14, uSlope * 2);
    transform(uBackSlope, { rotX: uAngle, y: wh + 0.35 + rh * 0.6 + sH + uRh / 2, z: -(sD / 4 + uOv / 2) });
    g.add(new THREE.Mesh(uBackSlope, roofMat));

    const uRidge = new THREE.Mesh(box(sW + uOv * 2, 0.16, 0.28), MAT.woodDark());
    uRidge.position.set(0, wh + 0.35 + rh * 0.6 + sH + uRh, 0);
    g.add(uRidge);
  }

  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return g;
}