import * as THREE from 'three';
import { blob, cone, taperedCylinder } from '@/game/procedural/geometry';

/**
 * Companion Cat — a chubby low-poly orange tabby that rests beside the
 * character on the bench. Built from rounded blobs so the silhouette reads as
 * a cat from every angle instead of a stack of boxes.
 */
export class Cat {
  readonly group: THREE.Group;
  private tail: THREE.Group;
  private head: THREE.Group;
  private animTimer = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'companion-cat';

    const orange = new THREE.MeshToonMaterial({ color: 0xe08b3c });
    const orangeDark = new THREE.MeshToonMaterial({ color: 0xc46f28 });
    const whiteFur = new THREE.MeshToonMaterial({ color: 0xf7efdd });
    const pink = new THREE.MeshToonMaterial({ color: 0xf2a0ac });
    const darkEye = new THREE.MeshBasicMaterial({ color: 0x241a14 });

    const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh => {
      const out = new THREE.Mesh(g, m);
      out.position.set(x, y, z);
      out.castShadow = true;
      return out;
    };

    // Folded haunches and upright chest.
    const haunch = mesh(blob(0.16, 0.92, 10), orange, 0, 0.14, -0.02);
    haunch.scale.set(1.1, 1, 1.25);
    this.group.add(haunch);
    this.group.add(mesh(blob(0.125, 1, 9), orange, 0, 0.29, 0.02));
    this.group.add(mesh(blob(0.08, 0.9, 8), whiteFur, 0, 0.28, 0.1));
    // Back stripes.
    for (const y of [0.17, 0.25]) {
      const stripe = mesh(blob(0.13, 0.3, 8), orangeDark, 0, y, -0.03);
      stripe.scale.set(1.05, 0.5, 1.1);
      this.group.add(stripe);
    }

    // Front legs and white paws.
    for (const sx of [-0.07, 0.07]) {
      this.group.add(mesh(taperedCylinder(0.042, 0.035, 0.2, 7), orange, sx, 0.02, 0.1));
      this.group.add(mesh(blob(0.042, 0.6, 7), whiteFur, sx, 0.04, 0.13));
    }

    // Head.
    this.head = new THREE.Group();
    this.head.position.set(0, 0.43, 0.05);
    this.head.add(mesh(blob(0.125, 0.95, 10), orange));
    const muzzle = mesh(blob(0.062, 0.72, 8), whiteFur, 0, -0.035, 0.09);
    muzzle.scale.set(1.15, 0.85, 0.9);
    this.head.add(muzzle);
    this.head.add(mesh(blob(0.018, 0.8, 5), pink, 0, -0.015, 0.15));
    for (const sx of [-0.045, 0.045]) {
      const eye = mesh(blob(0.016, 0.9, 6), darkEye, sx, 0.02, 0.106);
      this.head.add(eye);
    }
    // Ears: outer cone plus a pink inner cone.
    for (const sx of [-1, 1]) {
      const ear = mesh(cone(0.05, 0.085, 5), orange, sx * 0.078, 0.085, 0.0);
      ear.rotation.z = sx * 0.28;
      this.head.add(ear);
      const inner = mesh(cone(0.028, 0.05, 5), pink, sx * 0.078, 0.093, 0.015);
      inner.rotation.z = sx * 0.28;
      this.head.add(inner);
    }
    // Forehead stripes.
    for (const sx of [-0.03, 0, 0.03]) {
      const stripe = mesh(blob(0.012, 1, 4), orangeDark, sx, 0.1, 0.08);
      stripe.scale.set(1, 1.6, 0.4);
      this.head.add(stripe);
    }
    this.group.add(this.head);

    // Tail: a curled chain that sways.
    this.tail = new THREE.Group();
    this.tail.position.set(0.04, 0.16, -0.16);
    const tailA = mesh(taperedCylinder(0.038, 0.034, 0.16, 6), orange, 0, 0, 0);
    tailA.rotation.x = -0.5;
    this.tail.add(tailA);
    const tailB = mesh(taperedCylinder(0.034, 0.026, 0.15, 6), orange, 0, 0.02, -0.13);
    tailB.rotation.x = -1.1;
    this.tail.add(tailB);
    const tip = mesh(blob(0.032, 1, 6), whiteFur, 0, 0.0, -0.27);
    this.tail.add(tip);
    this.group.add(this.tail);
  }

  update(dt: number): void {
    this.animTimer += dt;
    const breathe = Math.sin(this.animTimer * 2) * 0.006;
    this.head.position.y = 0.43 + breathe;

    const twitch = Math.sin(this.animTimer * 1.3) * 0.22 + Math.sin(this.animTimer * 4.2) * 0.06;
    this.tail.rotation.z = twitch;
    this.tail.rotation.x = Math.sin(this.animTimer * 0.7) * 0.05;

    this.head.rotation.y = Math.sin(this.animTimer * 0.35) * 0.16;
    this.head.rotation.z = Math.sin(this.animTimer * 0.5) * 0.03;
  }
}
