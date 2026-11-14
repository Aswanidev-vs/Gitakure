import * as THREE from 'three';
import { MAT } from '@/game/procedural/materials';
import { box, taperedCylinder, blob } from '@/game/procedural/geometry';

// Stylized low-poly player character: a simple humanoid built from primitives
// (head, torso, arms, legs) with procedural walk/idle/sit animation driven by
// `update(dt)`. No rigged GLB in the asset pack, so this is the player.

export type PlayerAnim = 'idle' | 'walk' | 'sit';

export class Player {
  readonly group: THREE.Group;
  private parts: {
    head: THREE.Mesh;
    torso: THREE.Mesh;
    armL: THREE.Mesh;
    armR: THREE.Mesh;
    legL: THREE.Mesh;
    legR: THREE.Mesh;
  };
  private anim: PlayerAnim = 'idle';
  private walkPhase = 0;
  private sitBlend = 0;
  private facing = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'player';

    const skin = MAT.dirt(); // reuse a warm tone for skin
    const cloth = new THREE.MeshStandardMaterial({ color: 0x4a7fb5, roughness: 0.85, flatShading: true });
    const pants = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.9, flatShading: true });

    // Torso
    const torso = new THREE.Mesh(box(0.55, 0.7, 0.3), cloth);
    torso.position.y = 1.05;
    torso.castShadow = true;
    this.group.add(torso);

    // Head
    const head = new THREE.Mesh(blob(0.24, 1, 8), skin);
    head.position.y = 1.62;
    head.castShadow = true;
    this.group.add(head);

    // Hair (a flattened blob on top)
    const hair = new THREE.Mesh(blob(0.25, 0.5, 8), MAT.barkDark());
    hair.position.y = 1.74;
    this.group.add(hair);

    // Arms (pivot at shoulder)
    const armGeo = taperedCylinder(0.09, 0.08, 0.6, 5);
    const armL = new THREE.Mesh(armGeo, cloth);
    armL.position.set(-0.34, 1.4, 0);
    armL.castShadow = true;
    this.group.add(armL);
    const armR = new THREE.Mesh(armGeo.clone(), cloth);
    armR.position.set(0.34, 1.4, 0);
    armR.castShadow = true;
    this.group.add(armR);

    // Legs (pivot at hip)
    const legGeo = taperedCylinder(0.11, 0.09, 0.75, 5);
    const legL = new THREE.Mesh(legGeo, pants);
    legL.position.set(-0.16, 0.7, 0);
    legL.castShadow = true;
    this.group.add(legL);
    const legR = new THREE.Mesh(legGeo.clone(), pants);
    legR.position.set(0.16, 0.7, 0);
    legR.castShadow = true;
    this.group.add(legR);

    this.parts = { head, torso, armL, armR, legL, legR };
  }

  setAnim(anim: PlayerAnim): void {
    this.anim = anim;
  }

  setFacing(yaw: number): void {
    this.facing = yaw;
  }

  /** Advance procedural animation. */
  update(dt: number, speed: number): void {
    const p = this.parts;
    if (this.anim === 'walk') {
      this.walkPhase += dt * (4 + speed * 6);
      const swing = Math.sin(this.walkPhase) * 0.6;
      p.legL.rotation.x = swing;
      p.legR.rotation.x = -swing;
      p.armL.rotation.x = -swing * 0.7;
      p.armR.rotation.x = swing * 0.7;
      // Gentle torso bob.
      p.torso.position.y = 1.05 + Math.abs(Math.sin(this.walkPhase * 2)) * 0.04;
    } else if (this.anim === 'idle') {
      this.walkPhase = 0;
      const breathe = Math.sin(performance.now() * 0.0015) * 0.02;
      p.legL.rotation.x = 0;
      p.legR.rotation.x = 0;
      p.armL.rotation.x = 0;
      p.armR.rotation.x = 0;
      p.torso.position.y = 1.05 + breathe;
    } else if (this.anim === 'sit') {
      // Blend legs forward, lower torso.
      this.sitBlend = Math.min(1, this.sitBlend + dt * 4);
      const b = this.sitBlend;
      p.legL.rotation.x = b * (Math.PI / 2);
      p.legR.rotation.x = b * (Math.PI / 2);
      p.armL.rotation.x = b * 0.3;
      p.armR.rotation.x = b * 0.3;
      p.torso.position.y = 1.05 - b * 0.35;
      p.head.position.y = 1.62 - b * 0.35;
    }

    // Face movement direction.
    this.group.rotation.y = this.facing;
  }

  /** Reset sit blend when standing up. */
  stand(): void {
    this.sitBlend = 0;
  }
}