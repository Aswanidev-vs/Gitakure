import * as THREE from 'three';
import { box, taperedCylinder, blob } from '@/game/procedural/geometry';

export type CharacterGender = 'female' | 'male';
export type CharacterExpression = 'neutral' | 'happy' | 'smile' | 'side';

export interface CharacterRig {
  root: THREE.Group;
  head: THREE.Object3D;
  torso: THREE.Object3D;
  armL: THREE.Object3D;
  armR: THREE.Object3D;
  legL: THREE.Object3D;
  legR: THREE.Object3D;
  hairExtra?: THREE.Object3D;
  faceMaterial: THREE.MeshToonMaterial | THREE.MeshBasicMaterial;
  setExpression: (expr: CharacterExpression) => void;
}

function toon(color: number): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color });
}

function add(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  parent.add(m);
  return m;
}

/** A soft collar panel — a thin, slightly tilted slab. */
function collarPanel(
  parent: THREE.Object3D,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  tilt: number,
  width = 0.085,
  height = 0.28,
): void {
  add(parent, box(width, height, 0.035), material, x, y, z, 0, 0, tilt);
}

/** Five-petal blossom used as a hairpin. */
function blossom(parent: THREE.Object3D, pink: THREE.Material, gold: THREE.Material, x: number, y: number, z: number, scale = 1): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const petal = add(g, blob(0.055, 0.55, 7), pink, Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0);
    petal.rotation.z = a;
  }
  add(g, blob(0.028, 1, 6), gold, 0, 0, 0.02);
  parent.add(g);
  return g;
}

/**
 * A curved face patch that hugs the head sphere. Flat quads poke out past the
 * head silhouette from behind; this cap wraps the front and disappears cleanly
 * under the hair.
 */
export function createFaceCap(radius: number): THREE.SphereGeometry {
  // Wide enough to cover the whole front of the head, so the skin-toned patch
  // blends into the head instead of reading as a small pale coin.
  const cap = new THREE.SphereGeometry(radius, 28, 20, Math.PI / 2 - 0.82, 1.64, 0.9, 1.3);
  const uv = cap.attributes.uv!;
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }
  const spanU = maxU - minU || 1;
  const spanV = maxV - minV || 1;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (uv.getX(i) - minU) / spanU, (uv.getY(i) - minV) / spanV);
  }
  uv.needsUpdate = true;
  return cap;
}

/**
 * Canvas face texture. Transparent corners let the patch sit on the rounded
 * head without a square edge, and large eyes stay readable at gameplay distance.
 */
export function createAnimeFaceTexture(
  gender: CharacterGender,
  expression: CharacterExpression = 'neutral',
  skin = '#f6cba8',
): { texture: THREE.CanvasTexture; updateExpression: (expr: CharacterExpression) => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  function draw(expr: CharacterExpression) {
    ctx.clearRect(0, 0, 256, 256);

    // The whole patch is skin-toned: it is mapped onto a cap that must merge
    // seamlessly with the lit head sphere underneath.
    ctx.fillStyle = skin;
    ctx.fillRect(0, 0, 256, 256);

    // Soft jaw shading.
    const jaw = ctx.createLinearGradient(0, 150, 0, 256);
    jaw.addColorStop(0, 'rgba(150,88,56,0)');
    jaw.addColorStop(1, 'rgba(150,88,56,0.22)');
    ctx.fillStyle = jaw;
    ctx.fillRect(16, 150, 224, 106);

    // Cheek blush.
    const blushAlpha = gender === 'female' ? 0.4 : 0.18;
    for (const bx of [60, 196]) {
      const blush = ctx.createRadialGradient(bx, 150, 2, bx, 150, 30);
      blush.addColorStop(0, `rgba(236,120,136,${blushAlpha})`);
      blush.addColorStop(1, 'rgba(236,120,136,0)');
      ctx.fillStyle = blush;
      ctx.fillRect(bx - 34, 118, 68, 64);
    }

    // Eyebrows — kept soft and slightly arched.
    ctx.strokeStyle = gender === 'male' ? 'rgba(48,34,26,0.85)' : 'rgba(58,40,32,0.78)';
    ctx.lineWidth = gender === 'male' ? 5 : 4;
    ctx.lineCap = 'round';
    for (const [cx, flip] of [[80, 1], [176, -1]] as const) {
      ctx.beginPath();
      if (expr === 'happy') {
        ctx.arc(cx, 92, 21, Math.PI * 1.15, Math.PI * 1.85);
      } else {
        ctx.moveTo(cx - 20, 96);
        ctx.quadraticCurveTo(cx, 86, cx + 20, 96 - flip * 3);
      }
      ctx.stroke();
    }

    // Eyes.
    if (expr === 'happy') {
      ctx.strokeStyle = '#2a1e18';
      ctx.lineWidth = 6;
      for (const cx of [80, 176]) {
        ctx.beginPath();
        ctx.arc(cx, 126, 22, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    } else {
      const shift = expr === 'side' ? 7 : 0;
      for (const cx of [82, 174]) {
        // Sclera.
        ctx.fillStyle = '#fdf7ef';
        ctx.beginPath();
        ctx.ellipse(cx, 124, 20, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(58,40,30,0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Upper lash line, thickest at the outer corner.
        ctx.strokeStyle = '#241a15';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.arc(cx, 117, 22.5, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();

        // Iris.
        const iris = ctx.createLinearGradient(0, 104, 0, 142);
        iris.addColorStop(0, '#2c1f1c');
        iris.addColorStop(0.55, '#6a4632');
        iris.addColorStop(1, '#b07a4c');
        ctx.fillStyle = iris;
        ctx.beginPath();
        ctx.ellipse(cx + shift, 126, 15, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupil and sparkle.
        ctx.fillStyle = '#151011';
        ctx.beginPath();
        ctx.arc(cx + shift, 127, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + shift - 4.8, 118, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + shift + 4.8, 134, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // A small shadow under the lash line gives the eye depth.
        ctx.strokeStyle = 'rgba(90,52,40,0.35)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx, 130, 17, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
    }

    // Small nose.
    ctx.fillStyle = 'rgba(158,98,70,0.32)';
    ctx.beginPath();
    ctx.ellipse(128, 152, 3.4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mouth.
    ctx.strokeStyle = '#a95850';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (expr === 'happy' || expr === 'smile') {
      ctx.arc(128, 174, 16, 0.16, Math.PI - 0.16);
      ctx.fillStyle = '#c86067';
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.moveTo(116, 178);
      ctx.quadraticCurveTo(128, 182, 140, 178);
      ctx.stroke();
    }
  }

  draw(expression);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  function updateExpression(nextExpr: CharacterExpression) {
    draw(nextExpr);
    texture.needsUpdate = true;
  }

  return { texture, updateExpression };
}

/** Mika — red kimono, cream floral skirt, tied dark hair with a blossom. */
export function buildFemaleCharacter(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'character-female';

  const skin = toon(0xf6cba8);
  const red = toon(0xa83443);
  const redDark = toon(0x852631);
  const cream = toon(0xf4e7d0);
  const skirtRed = toon(0x9b2d3c);
  const skirtDark = toon(0x7a2130);
  const obi = toon(0x3a3634);
  const hair = toon(0x2b2223);
  const hairLight = toon(0x3d2e2e);
  const pink = toon(0xf2a2b8);
  const gold = toon(0xf2c85a);
  const sandal = toon(0x5a3f2b);

  const { texture: faceTex, updateExpression } = createAnimeFaceTexture('female', 'neutral', '#f6cba8');
  // Lit exactly like the head so the cap merges into the skin with no pale seam.
  const faceMat = new THREE.MeshToonMaterial({ map: faceTex });

  // Torso: tapered kimono body, crossed collar, obi with back bow.
  const torso = new THREE.Group();
  torso.position.y = 1.16;
  add(torso, taperedCylinder(0.22, 0.27, 0.46, 10), red, 0, -0.16);
  add(torso, taperedCylinder(0.235, 0.235, 0.055, 10), redDark, 0, -0.19);
  collarPanel(torso, cream, -0.052, 0.16, 0.232, 0.62, 0.055, 0.2);
  collarPanel(torso, cream, 0.052, 0.16, 0.24, -0.62, 0.055, 0.2);
  add(torso, taperedCylinder(0.245, 0.245, 0.17, 10), obi, 0, -0.2);
  // A compact obi knot with ribbon loops and short tails, rather than a big
  // bow that reads as a pair of wings from behind.
  add(torso, blob(0.055, 0.7, 7), obi, -0.07, -0.115, -0.26);
  add(torso, blob(0.055, 0.7, 7), obi, 0.07, -0.115, -0.26);
  add(torso, blob(0.048, 0.9, 7), redDark, 0, -0.14, -0.28);
  add(torso, box(0.035, 0.14, 0.03), obi, -0.045, -0.25, -0.25, 0, 0, 0.14);
  add(torso, box(0.035, 0.14, 0.03), obi, 0.045, -0.25, -0.25, 0, 0, -0.14);

  // Pleated A-line skirt in the same crimson as the kimono top.
  add(torso, taperedCylinder(0.41, 0.22, 0.68, 12), skirtRed, 0, -0.8);
  add(torso, taperedCylinder(0.415, 0.415, 0.07, 12), skirtDark, 0, -0.8);
  for (const px of [-0.24, -0.12, 0.12, 0.24]) {
    add(torso, box(0.02, 0.42, 0.02), skirtDark, px, -0.78, 0.3);
  }
  root.add(torso);

  // Neck bridges the shoulders and the (now smaller, more reference-accurate)
  // head so the silhouette stays natural. Upper-body parts live under `torso`
  // so sitting/bobbing moves the whole body coherently.
  add(torso, taperedCylinder(0.085, 0.095, 0.34, 8), skin, 0, 0.06);

  // Head: rounded, soft fringe, face-framing locks and a low ponytail.
  const head = new THREE.Group();
  head.position.y = 0.56;
  head.scale.setScalar(0.7);
  add(head, blob(0.285, 1, 12), skin);
  const face = new THREE.Mesh(createFaceCap(0.291), faceMat);
  face.name = 'face';
  head.add(face);

  // Crown and back volume: full coverage so no scalp shows through.
  add(head, blob(0.305, 0.74, 12), hair, 0, 0.1, -0.04);
  add(head, blob(0.26, 0.95, 10), hair, 0, 0.0, -0.11);
  add(head, blob(0.17, 0.9, 9), hair, 0, -0.16, -0.16);
  // Nape coverage down to the collar so no skin patch shows through.
  add(head, blob(0.16, 0.9, 9), hair, 0, -0.21, -0.15);
  // Side volume sits behind the cheeks, not on top of them.
  for (const sx of [-1, 1]) {
    add(head, blob(0.1, 1, 8), hair, sx * 0.235, -0.03, -0.02);
  }

  // Fringe: staggered rounded strands with a soft side-swept edge.
  const bangs = [
    { x: -0.19, y: 0.165, rz: 0.3, r: 0.064 },
    { x: -0.1, y: 0.205, rz: 0.16, r: 0.072 },
    { x: 0.0, y: 0.22, rz: 0, r: 0.075 },
    { x: 0.1, y: 0.205, rz: -0.16, r: 0.072 },
    { x: 0.19, y: 0.165, rz: -0.3, r: 0.064 },
  ];
  for (const b of bangs) {
    const strand = add(head, blob(b.r, 0.52, 7), b.r > 0.07 ? hair : hairLight, b.x, b.y, 0.2);
    strand.rotation.z = b.rz;
  }
  // Longer face-framing strands down past the jaw, tucked into the side mass.
  for (const sx of [-0.235, 0.235]) {
    const lock = add(head, taperedCylinder(0.062, 0.028, 0.4, 7), hair, sx, -0.3, 0.12, 0, 0, sx > 0 ? -0.06 : 0.06);
    lock.castShadow = true;
  }

  // Low side ponytail with a red tie, draped over the right shoulder.
  const ponytail = new THREE.Group();
  ponytail.position.set(0.14, -0.02, -0.25);
  add(ponytail, blob(0.105, 0.9, 9), hair, 0, 0.0, -0.02);
  add(ponytail, taperedCylinder(0.075, 0.028, 0.3, 7), hair, 0.02, -0.29, 0.01, 0.14, 0, -0.1);
  add(ponytail, blob(0.075, 0.7, 7), hairLight, 0.03, -0.2, 0.035);
  add(ponytail, blob(0.05, 0.75, 6), redDark, -0.06, 0.015, 0.035);
  add(ponytail, blob(0.05, 0.75, 6), redDark, 0.03, 0.015, 0.035);
  add(ponytail, taperedCylinder(0.028, 0.012, 0.13, 5), redDark, 0.04, -0.02, 0.05, 0.25, 0, -0.55);
  blossom(ponytail, pink, gold, 0.09, 0.13, 0.01, 0.95);
  head.add(ponytail);
  const hairExtra: THREE.Object3D = ponytail;
  torso.add(head);

  // Rounded shoulders soften the kimono silhouette.
  for (const sx of [-0.245, 0.245]) {
    add(torso, blob(0.11, 1, 8), red, sx, 0.19, 0);
  }

  // Arms: gently flared kimono sleeves with visible hands.
  const armL = new THREE.Group();
  armL.position.set(-0.285, 0.22, 0);
  add(armL, taperedCylinder(0.115, 0.075, 0.32, 8), red, 0, -0.32);
  add(armL, taperedCylinder(0.118, 0.09, 0.03, 8), redDark, 0, -0.32);
  add(armL, blob(0.055, 1, 7), skin, 0, -0.36);
  torso.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.285, 0.22, 0);
  add(armR, taperedCylinder(0.115, 0.075, 0.32, 8), red, 0, -0.32);
  add(armR, taperedCylinder(0.118, 0.09, 0.03, 8), redDark, 0, -0.32);
  add(armR, blob(0.055, 1, 7), skin, 0, -0.36);
  torso.add(armR);

  // Legs with strapped sandals.
  const legL = new THREE.Group();
  legL.position.set(-0.13, 0.6, 0);
  add(legL, taperedCylinder(0.075, 0.055, 0.56, 7), skin, 0, -0.56);
  add(legL, box(0.12, 0.035, 0.22), sandal, 0, -0.58, 0.04);
  add(legL, box(0.125, 0.018, 0.05), sandal, 0, -0.54, 0.09);
  root.add(legL);

  const legR = new THREE.Group();
  legR.position.set(0.13, 0.6, 0);
  add(legR, taperedCylinder(0.075, 0.055, 0.56, 7), skin, 0, -0.56);
  add(legR, box(0.12, 0.035, 0.22), sandal, 0, -0.58, 0.04);
  add(legR, box(0.125, 0.018, 0.05), sandal, 0, -0.54, 0.09);
  root.add(legR);

  return { root, head, torso, armL, armR, legL, legR, hairExtra, faceMaterial: faceMat, setExpression: updateExpression };
}

/** Traveler — cream tunic, brown sash, cropped trousers, short wavy hair. */
export function buildMaleCharacter(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'character-male';

  const skin = toon(0xf2c4a0);
  const cream = toon(0xe8d6b2);
  const creamShade = toon(0xd4bd96);
  const inner = toon(0x38332f);
  const sash = toon(0xc9985f);
  const pants = toon(0x4d3d30);
  const hair = toon(0x2a2321);
  const hairLight = toon(0x3e312c);
  const sandal = toon(0x4a3829);

  const { texture: faceTex, updateExpression } = createAnimeFaceTexture('male', 'neutral', '#f2c4a0');
  const faceMat = new THREE.MeshToonMaterial({ map: faceTex });

  // Tunic body with a dark V-neck and folded collar.
  const torso = new THREE.Group();
  torso.position.y = 1.2;
  add(torso, taperedCylinder(0.24, 0.28, 0.5, 10), cream, 0, -0.18);
  add(torso, box(0.2, 0.44, 0.03), inner, 0, 0.02, 0.25);
  collarPanel(torso, cream, -0.08, 0.14, 0.27, 0.5, 0.07, 0.3);
  collarPanel(torso, cream, 0.08, 0.14, 0.28, -0.5, 0.07, 0.3);
  add(torso, taperedCylinder(0.255, 0.255, 0.16, 10), sash, 0, -0.22);
  add(torso, box(0.15, 0.3, 0.05), sash, -0.16, -0.36, 0.2, 0, 0, 0.08);
  add(torso, box(0.13, 0.26, 0.05), creamShade, 0, -0.03, 0.27);
  root.add(torso);

  // Neck.
  add(torso, taperedCylinder(0.095, 0.105, 0.44, 8), skin, 0, 0.05);

  // Head with soft, wavy layered locks rather than sharp spikes.
  const head = new THREE.Group();
  head.position.y = 0.62;
  head.scale.setScalar(0.7);
  add(head, blob(0.275, 1, 12), skin);
  const face = new THREE.Mesh(createFaceCap(0.281), faceMat);
  face.name = 'face';
  head.add(face);
  add(head, blob(0.29, 0.78, 12), hair, 0, 0.11, -0.04);
  // Nape coverage.
  add(head, blob(0.2, 0.9, 10), hair, 0, -0.02, -0.14);
  const waveSpots = [
    { x: -0.19, y: 0.18, z: 0.18, rz: 0.55 },
    { x: -0.1, y: 0.23, z: 0.21, rz: 0.28 },
    { x: 0.0, y: 0.26, z: 0.22, rz: 0 },
    { x: 0.1, y: 0.23, z: 0.21, rz: -0.28 },
    { x: 0.19, y: 0.18, z: 0.18, rz: -0.55 },
  ];
  for (const w of waveSpots) {
    const lock = add(head, blob(0.085, 0.72, 7), w.x < 0 ? hair : hairLight, w.x, w.y, w.z);
    lock.rotation.z = w.rz;
  }
  add(head, taperedCylinder(0.06, 0.03, 0.24, 6), hair, -0.24, -0.24, 0.11, 0, 0, 0.1);
  add(head, taperedCylinder(0.06, 0.03, 0.24, 6), hair, 0.24, -0.24, 0.11, 0, 0, -0.1);
  torso.add(head);

  // Arms: short sleeves, bare forearms, hands.
  const armL = new THREE.Group();
  armL.position.set(-0.32, 0.27, 0);
  add(armL, taperedCylinder(0.145, 0.115, 0.26, 8), cream, 0, -0.26);
  add(armL, taperedCylinder(0.075, 0.06, 0.3, 7), skin, 0, -0.52);
  add(armL, blob(0.06, 1, 7), skin, 0, -0.58);
  torso.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.32, 0.27, 0);
  add(armR, taperedCylinder(0.145, 0.115, 0.26, 8), cream, 0, -0.26);
  add(armR, taperedCylinder(0.075, 0.06, 0.3, 7), skin, 0, -0.52);
  add(armR, blob(0.06, 1, 7), skin, 0, -0.58);
  torso.add(armR);

  // Cropped trousers, calves and sandals.
  const legL = new THREE.Group();
  legL.position.set(-0.15, 0.82, 0);
  add(legL, taperedCylinder(0.17, 0.13, 0.5, 8), pants, 0, -0.5);
  add(legL, taperedCylinder(0.075, 0.055, 0.34, 7), skin, 0, -0.84);
  add(legL, box(0.13, 0.035, 0.23), sandal, 0, -0.86, 0.04);
  add(legL, box(0.135, 0.018, 0.05), sandal, 0, -0.82, 0.09);
  root.add(legL);

  const legR = new THREE.Group();
  legR.position.set(0.15, 0.82, 0);
  add(legR, taperedCylinder(0.17, 0.13, 0.5, 8), pants, 0, -0.5);
  add(legR, taperedCylinder(0.075, 0.055, 0.34, 7), skin, 0, -0.84);
  add(legR, box(0.13, 0.035, 0.23), sandal, 0, -0.86, 0.04);
  add(legR, box(0.135, 0.018, 0.05), sandal, 0, -0.82, 0.09);
  root.add(legR);

  return { root, head, torso, armL, armR, legL, legR, faceMaterial: faceMat, setExpression: updateExpression };
}
