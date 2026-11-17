import * as THREE from 'three';
import { box, taperedCylinder, blob, cone } from '@/game/procedural/geometry';

export type CharacterGender = 'female' | 'male';
export type CharacterExpression = 'neutral' | 'happy' | 'smile' | 'side';

export interface CharacterRig {
  root: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  hairExtra?: THREE.Object3D;
  faceMaterial: THREE.MeshToonMaterial;
  setExpression: (expr: CharacterExpression) => void;
}

/**
 * Creates a dynamic HTML5 Canvas texture for expressive anime faces.
 */
export function createAnimeFaceTexture(
  gender: CharacterGender,
  expression: CharacterExpression = 'neutral',
): { texture: THREE.CanvasTexture; updateExpression: (expr: CharacterExpression) => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  function draw(expr: CharacterExpression) {
    ctx.clearRect(0, 0, 256, 256);
    // Base skin tone
    ctx.fillStyle = '#fce4c8';
    ctx.fillRect(0, 0, 256, 256);

    // Cheek blush (females have slightly stronger blush)
    const blushAlpha = gender === 'female' ? 0.45 : 0.25;
    const blushL = ctx.createRadialGradient(58, 148, 2, 58, 148, 24);
    blushL.addColorStop(0, `rgba(250, 140, 160, ${blushAlpha})`);
    blushL.addColorStop(1, 'rgba(250, 140, 160, 0)');
    ctx.fillStyle = blushL;
    ctx.fillRect(30, 120, 60, 60);

    const blushR = ctx.createRadialGradient(198, 148, 2, 198, 148, 24);
    blushR.addColorStop(0, `rgba(250, 140, 160, ${blushAlpha})`);
    blushR.addColorStop(1, 'rgba(250, 140, 160, 0)');
    ctx.fillStyle = blushR;
    ctx.fillRect(170, 120, 60, 60);

    // Eyebrows (male slightly thicker)
    ctx.strokeStyle = '#2b231d';
    ctx.lineWidth = gender === 'male' ? 5.5 : 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (expr === 'happy') {
      ctx.arc(68, 86, 22, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(188, 86, 22, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      ctx.moveTo(50, 92);
      ctx.quadraticCurveTo(72, 82, 94, 90);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(162, 90);
      ctx.quadraticCurveTo(184, 82, 206, 92);
      ctx.stroke();
    }

    // Eyes
    if (expr === 'happy') {
      // Joyful closed laughing eyes (^ ^)
      ctx.strokeStyle = '#231a15';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(72, 128, 24, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(184, 128, 24, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      // Open anime eyes
      const eyeXOffset = expr === 'side' ? 8 : 0;
      for (const eyeCenterX of [72, 184]) {
        // Eyelash line
        ctx.fillStyle = '#231a15';
        ctx.beginPath();
        ctx.arc(eyeCenterX, 118, 24, Math.PI * 1.05, Math.PI * 1.95);
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#231a15';
        ctx.stroke();

        // Iris
        const irisGrad = ctx.createLinearGradient(0, 108, 0, 142);
        irisGrad.addColorStop(0, '#262228');
        irisGrad.addColorStop(0.5, '#4a382e');
        irisGrad.addColorStop(1, '#825f46');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.ellipse(eyeCenterX + eyeXOffset, 126, 14, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#141212';
        ctx.beginPath();
        ctx.arc(eyeCenterX + eyeXOffset, 126, 7, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle Highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeCenterX + eyeXOffset - 4, 120, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeCenterX + eyeXOffset + 4, 131, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Mouth
    ctx.strokeStyle = '#b85e58';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    if (expr === 'happy' || expr === 'smile') {
      ctx.arc(128, 172, 16, 0.1, Math.PI - 0.1);
      ctx.fillStyle = '#d65b63';
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.moveTo(116, 174);
      ctx.quadraticCurveTo(128, 178, 140, 174);
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

/**
 * Builds the complete 3D Female Character Rig (Image 2 - Mika style)
 */
export function buildFemaleCharacter(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'character-female';

  // Materials
  const skinMat = new THREE.MeshToonMaterial({ color: 0xfce4c8 });
  const redHaori = new THREE.MeshToonMaterial({ color: 0xb53535 });
  const darkObi = new THREE.MeshToonMaterial({ color: 0x2d363b });
  const creamSkirt = new THREE.MeshToonMaterial({ color: 0xf5ede1 });
  const hairMat = new THREE.MeshToonMaterial({ color: 0x2e2320 });
  const sakuraPink = new THREE.MeshToonMaterial({ color: 0xf472b6 });
  const goldCenter = new THREE.MeshToonMaterial({ color: 0xfde047 });
  const sandalMat = new THREE.MeshToonMaterial({ color: 0x4a3a2a });

  const { texture: faceTex, updateExpression } = createAnimeFaceTexture('female', 'neutral');
  const faceMat = new THREE.MeshToonMaterial({ map: faceTex });

  // 1. Torso Group
  const torso = new THREE.Group();
  torso.position.y = 1.05;

  // Upper Kimono / Haori
  const haoriMesh = new THREE.Mesh(box(0.48, 0.52, 0.28), redHaori);
  haoriMesh.castShadow = true;
  torso.add(haoriMesh);

  // White inner collar trim
  const collarTrim = new THREE.Mesh(box(0.2, 0.28, 0.29), new THREE.MeshToonMaterial({ color: 0xffffff }));
  collarTrim.position.set(0, 0.12, 0.01);
  torso.add(collarTrim);

  // Obi sash belt
  const obiMesh = new THREE.Mesh(box(0.5, 0.18, 0.3), darkObi);
  obiMesh.position.y = -0.16;
  obiMesh.castShadow = true;
  torso.add(obiMesh);

  // Obi bow knot at back
  const obiKnot = new THREE.Mesh(box(0.22, 0.14, 0.1), darkObi);
  obiKnot.position.set(0, -0.16, -0.18);
  torso.add(obiKnot);

  // Skirt (Long Hakama A-line)
  const skirtGeo = taperedCylinder(0.35, 0.25, 0.68, 8);
  const skirtMesh = new THREE.Mesh(skirtGeo, creamSkirt);
  skirtMesh.position.y = -0.48;
  skirtMesh.castShadow = true;
  torso.add(skirtMesh);

  // Subtle pink sakura trim at skirt bottom
  const skirtTrim = new THREE.Mesh(box(0.44, 0.1, 0.34), redHaori);
  skirtTrim.position.y = -0.76;
  torso.add(skirtTrim);

  root.add(torso);

  // 2. Head Group
  const head = new THREE.Group();
  head.position.y = 1.62;

  // Base Head
  const headMesh = new THREE.Mesh(blob(0.26, 1, 8), skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Front Face Quad with Canvas Face Texture
  const faceQuadGeo = new THREE.PlaneGeometry(0.34, 0.34);
  const faceQuad = new THREE.Mesh(faceQuadGeo, faceMat);
  faceQuad.position.set(0, 0.02, 0.22);
  head.add(faceQuad);

  // Hair Base (crown + back)
  const hairBase = new THREE.Mesh(blob(0.29, 0.7, 8), hairMat);
  hairBase.position.set(0, 0.1, -0.04);
  head.add(hairBase);

  // Front Bangs
  for (let i = -2; i <= 2; i++) {
    const bang = new THREE.Mesh(cone(0.04, 0.16, 4), hairMat);
    bang.rotation.z = Math.PI + i * 0.18;
    bang.position.set(i * 0.05, 0.12, 0.19);
    head.add(bang);
  }

  // Side hair strands
  for (const sx of [-0.2, 0.2]) {
    const sideLock = new THREE.Mesh(taperedCylinder(0.04, 0.02, 0.32, 4), hairMat);
    sideLock.position.set(sx, -0.04, 0.12);
    head.add(sideLock);
  }

  // Side Ponytail (Female hairstyle)
  const ponytail = new THREE.Group();
  ponytail.position.set(0.22, 0.12, -0.1);

  const ponytailBun = new THREE.Mesh(blob(0.12, 0.8, 6), hairMat);
  ponytail.add(ponytailBun);

  const ponytailTail = new THREE.Mesh(taperedCylinder(0.08, 0.03, 0.45, 5), hairMat);
  ponytailTail.position.set(0.06, -0.22, 0);
  ponytailTail.rotation.z = -0.25;
  ponytail.add(ponytailTail);

  // Sakura Blossom Hairpin on Ponytail
  const sakuraClip = new THREE.Group();
  sakuraClip.position.set(-0.06, 0.06, 0.08);
  for (let i = 0; i < 5; i++) {
    const petal = new THREE.Mesh(blob(0.045, 0.6, 5), sakuraPink);
    const a = (i / 5) * Math.PI * 2;
    petal.position.set(Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0);
    sakuraClip.add(petal);
  }
  const flowerCenter = new THREE.Mesh(blob(0.025, 1, 5), goldCenter);
  flowerCenter.position.z = 0.01;
  sakuraClip.add(flowerCenter);
  ponytail.add(sakuraClip);

  head.add(ponytail);
  root.add(head);

  // 3. Arms
  const armL = new THREE.Group();
  armL.position.set(-0.31, 1.34, 0);
  const sleeveL = new THREE.Mesh(box(0.16, 0.38, 0.22), redHaori);
  sleeveL.position.y = -0.18;
  sleeveL.castShadow = true;
  armL.add(sleeveL);
  const handL = new THREE.Mesh(blob(0.05, 0.8, 5), skinMat);
  handL.position.y = -0.42;
  armL.add(handL);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.31, 1.34, 0);
  const sleeveR = new THREE.Mesh(box(0.16, 0.38, 0.22), redHaori);
  sleeveR.position.y = -0.18;
  sleeveR.castShadow = true;
  armR.add(sleeveR);
  const handR = new THREE.Mesh(blob(0.05, 0.8, 5), skinMat);
  handR.position.y = -0.42;
  armR.add(handR);
  root.add(armR);

  // 4. Legs & Sandals
  const legL = new THREE.Group();
  legL.position.set(-0.13, 0.45, 0);
  const lowerLegL = new THREE.Mesh(taperedCylinder(0.07, 0.05, 0.45, 5), skinMat);
  lowerLegL.position.y = -0.22;
  lowerLegL.castShadow = true;
  legL.add(lowerLegL);
  const sandalL = new THREE.Mesh(box(0.1, 0.04, 0.18), sandalMat);
  sandalL.position.set(0, -0.44, 0.04);
  legL.add(sandalL);
  root.add(legL);

  const legR = new THREE.Group();
  legR.position.set(0.13, 0.45, 0);
  const lowerLegR = new THREE.Mesh(taperedCylinder(0.07, 0.05, 0.45, 5), skinMat);
  lowerLegR.position.y = -0.22;
  lowerLegR.castShadow = true;
  legR.add(lowerLegR);
  const sandalR = new THREE.Mesh(box(0.1, 0.04, 0.18), sandalMat);
  sandalR.position.set(0, -0.44, 0.04);
  legR.add(sandalR);
  root.add(legR);

  return {
    root,
    head,
    torso,
    armL,
    armR,
    legL,
    legR,
    hairExtra: ponytailTail,
    faceMaterial: faceMat,
    setExpression: updateExpression,
  };
}

/**
 * Builds the complete 3D Male Character Rig (Image 2 - Traveler style)
 */
export function buildMaleCharacter(): CharacterRig {
  const root = new THREE.Group();
  root.name = 'character-male';

  const skinMat = new THREE.MeshToonMaterial({ color: 0xfce4c8 });
  const creamShirt = new THREE.MeshToonMaterial({ color: 0xede0cb });
  const darkUndershirt = new THREE.MeshToonMaterial({ color: 0x282c30 });
  const waistSash = new THREE.MeshToonMaterial({ color: 0xd9c2a5 });
  const brownPants = new THREE.MeshToonMaterial({ color: 0x47392d });
  const hairMat = new THREE.MeshToonMaterial({ color: 0x201c1c });
  const sandalMat = new THREE.MeshToonMaterial({ color: 0x3d2f23 });

  const { texture: faceTex, updateExpression } = createAnimeFaceTexture('male', 'neutral');
  const faceMat = new THREE.MeshToonMaterial({ map: faceTex });

  // 1. Torso
  const torso = new THREE.Group();
  torso.position.y = 1.08;

  // Cream open shirt
  const shirtMesh = new THREE.Mesh(box(0.52, 0.58, 0.3), creamShirt);
  shirtMesh.castShadow = true;
  torso.add(shirtMesh);

  // Dark undershirt visible down center
  const innerShirt = new THREE.Mesh(box(0.18, 0.52, 0.31), darkUndershirt);
  innerShirt.position.set(0, 0.02, 0.01);
  torso.add(innerShirt);

  // Folded collar
  const collarL = new THREE.Mesh(box(0.12, 0.22, 0.32), creamShirt);
  collarL.position.set(-0.12, 0.24, 0.02);
  collarL.rotation.z = -0.2;
  torso.add(collarL);

  const collarR = new THREE.Mesh(box(0.12, 0.22, 0.32), creamShirt);
  collarR.position.set(0.12, 0.24, 0.02);
  collarR.rotation.z = 0.2;
  torso.add(collarR);

  // Waist cloth sash wrap
  const sashWrap = new THREE.Mesh(box(0.54, 0.16, 0.32), waistSash);
  sashWrap.position.y = -0.22;
  sashWrap.castShadow = true;
  torso.add(sashWrap);

  // Sash hanging knot end
  const sashTails = new THREE.Mesh(box(0.14, 0.32, 0.06), waistSash);
  sashTails.position.set(-0.16, -0.36, 0.16);
  torso.add(sashTails);

  root.add(torso);

  // 2. Head
  const head = new THREE.Group();
  head.position.y = 1.66;

  const headMesh = new THREE.Mesh(blob(0.24, 1, 8), skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  const faceQuad = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), faceMat);
  faceQuad.position.set(0, 0.02, 0.23);
  head.add(faceQuad);

  // Spiky Anime Hair
  const hairCrown = new THREE.Mesh(blob(0.26, 0.8, 8), hairMat);
  hairCrown.position.set(0, 0.1, -0.02);
  head.add(hairCrown);

  // Spiky locks
  const spikePositions = [
    { x: -0.14, y: 0.24, z: 0.1, rz: 0.4 },
    { x: -0.04, y: 0.28, z: 0.08, rz: 0.1 },
    { x: 0.08, y: 0.27, z: 0.09, rz: -0.25 },
    { x: 0.18, y: 0.22, z: 0.06, rz: -0.5 },
    { x: -0.2, y: 0.12, z: 0.15, rz: 0.6 },
    { x: 0.2, y: 0.12, z: 0.15, rz: -0.6 },
  ];
  for (const sp of spikePositions) {
    const spike = new THREE.Mesh(cone(0.06, 0.18, 4), hairMat);
    spike.position.set(sp.x, sp.y, sp.z);
    spike.rotation.z = sp.rz;
    head.add(spike);
  }

  root.add(head);

  // 3. Arms
  const armL = new THREE.Group();
  armL.position.set(-0.34, 1.38, 0);
  const sleeveL = new THREE.Mesh(box(0.14, 0.34, 0.18), creamShirt);
  sleeveL.position.y = -0.16;
  sleeveL.castShadow = true;
  armL.add(sleeveL);
  const bareForearmL = new THREE.Mesh(taperedCylinder(0.07, 0.06, 0.28, 5), skinMat);
  bareForearmL.position.y = -0.38;
  armL.add(bareForearmL);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.34, 1.38, 0);
  const sleeveR = new THREE.Mesh(box(0.14, 0.34, 0.18), creamShirt);
  sleeveR.position.y = -0.16;
  sleeveR.castShadow = true;
  armR.add(sleeveR);
  const bareForearmR = new THREE.Mesh(taperedCylinder(0.07, 0.06, 0.28, 5), skinMat);
  bareForearmR.position.y = -0.38;
  armR.add(bareForearmR);
  root.add(armR);

  // 4. Legs (Cropped Brown Baggy Trousers + Sandals)
  const legL = new THREE.Group();
  legL.position.set(-0.16, 0.65, 0);
  const pantL = new THREE.Mesh(taperedCylinder(0.14, 0.11, 0.48, 6), brownPants);
  pantL.position.y = -0.22;
  pantL.castShadow = true;
  legL.add(pantL);
  const calfL = new THREE.Mesh(taperedCylinder(0.07, 0.05, 0.28, 5), skinMat);
  calfL.position.y = -0.52;
  legL.add(calfL);
  const sandalL = new THREE.Mesh(box(0.11, 0.04, 0.2), sandalMat);
  sandalL.position.set(0, -0.66, 0.04);
  legL.add(sandalL);
  root.add(legL);

  const legR = new THREE.Group();
  legR.position.set(0.16, 0.65, 0);
  const pantR = new THREE.Mesh(taperedCylinder(0.14, 0.11, 0.48, 6), brownPants);
  pantR.position.y = -0.22;
  pantR.castShadow = true;
  legR.add(pantR);
  const calfR = new THREE.Mesh(taperedCylinder(0.07, 0.05, 0.28, 5), skinMat);
  calfR.position.y = -0.52;
  legR.add(calfR);
  const sandalR = new THREE.Mesh(box(0.11, 0.04, 0.2), sandalMat);
  sandalR.position.set(0, -0.66, 0.04);
  legR.add(sandalR);
  root.add(legR);

  return {
    root,
    head,
    torso,
    armL,
    armR,
    legL,
    legR,
    faceMaterial: faceMat,
    setExpression: updateExpression,
  };
}
