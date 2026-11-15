import * as THREE from 'three';
import { box, blob, cone } from '@/game/procedural/geometry';

/**
 * Companion Cat — a peaceful low-poly orange tabby cat that rests
 * beside the character on the bench or near the campfire.
 */
export class Cat {
  readonly group: THREE.Group;
  private tail: THREE.Mesh;
  private head: THREE.Group;
  private animTimer = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'companion-cat';

    const orangeTabby = new THREE.MeshStandardMaterial({
      color: 0xd97529,
      roughness: 0.85,
      flatShading: true,
    });
    const whiteFur = new THREE.MeshStandardMaterial({
      color: 0xf5eedc,
      roughness: 0.85,
      flatShading: true,
    });
    const pinkEar = new THREE.MeshStandardMaterial({
      color: 0xf49db0,
      roughness: 0.85,
      flatShading: true,
    });
    const darkEye = new THREE.MeshBasicMaterial({ color: 0x221a14 });

    // Torso / body (sitting upright posture)
    const body = new THREE.Mesh(box(0.24, 0.32, 0.28), orangeTabby);
    body.position.y = 0.22;
    body.castShadow = true;
    this.group.add(body);

    // White chest bib
    const chest = new THREE.Mesh(box(0.16, 0.22, 0.05), whiteFur);
    chest.position.set(0, 0.2, 0.13);
    this.group.add(chest);

    // Front paws (sitting)
    for (const sx of [-0.07, 0.07]) {
      const paw = new THREE.Mesh(box(0.06, 0.08, 0.12), whiteFur);
      paw.position.set(sx, 0.04, 0.11);
      paw.castShadow = true;
      this.group.add(paw);
    }

    // Hind haunches (folded)
    for (const sx of [-0.12, 0.12]) {
      const haunch = new THREE.Mesh(box(0.08, 0.16, 0.18), orangeTabby);
      haunch.position.set(sx, 0.1, -0.02);
      this.group.add(haunch);
    }

    // Head Group
    this.head = new THREE.Group();
    this.head.position.set(0, 0.42, 0.04);

    const headMesh = new THREE.Mesh(blob(0.12, 1, 7), orangeTabby);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // White muzzle
    const muzzle = new THREE.Mesh(box(0.09, 0.06, 0.06), whiteFur);
    muzzle.position.set(0, -0.03, 0.1);
    this.head.add(muzzle);

    // Eyes
    for (const sx of [-0.05, 0.05]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, 0.01), darkEye);
      eye.position.set(sx, 0.02, 0.115);
      this.head.add(eye);
    }

    // Ears
    for (const sx of [-0.07, 0.07]) {
      const earOuter = new THREE.Mesh(cone(0.05, 0.08, 3), orangeTabby);
      earOuter.position.set(sx, 0.11, 0.01);
      earOuter.rotation.z = sx > 0 ? -0.2 : 0.2;
      this.head.add(earOuter);

      const earInner = new THREE.Mesh(cone(0.03, 0.05, 3), pinkEar);
      earInner.position.set(sx, 0.1, 0.025);
      earInner.rotation.z = sx > 0 ? -0.2 : 0.2;
      this.head.add(earInner);
    }

    this.group.add(this.head);

    // Tail (slender curved box chain or single cylinder)
    const tailGeo = box(0.04, 0.26, 0.04);
    this.tail = new THREE.Mesh(tailGeo, orangeTabby);
    this.tail.position.set(0, 0.15, -0.16);
    this.tail.rotation.x = -0.5;
    this.group.add(this.tail);

    // White tail tip
    const tailTip = new THREE.Mesh(box(0.042, 0.06, 0.042), whiteFur);
    tailTip.position.y = 0.12;
    this.tail.add(tailTip);
  }

  update(dt: number): void {
    this.animTimer += dt;
    // Breathing bob
    const breathe = Math.sin(this.animTimer * 2) * 0.008;
    this.head.position.y = 0.42 + breathe;

    // Gentle tail twitch
    const twitch = Math.sin(this.animTimer * 1.5) * 0.15 + Math.sin(this.animTimer * 4.5) * 0.08;
    this.tail.rotation.z = twitch;

    // Head occasional slow look
    this.head.rotation.y = Math.sin(this.animTimer * 0.4) * 0.12;
  }
}
