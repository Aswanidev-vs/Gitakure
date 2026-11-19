import * as THREE from 'three';
import { box, taperedCylinder, blob, cone } from '@/game/procedural/geometry';
import { Rng } from '@/utils/rng';
import { createAnimeFaceTexture, createFaceCap } from './CharacterFactory';
import { createContactShadow } from './contactShadow';

const toon = (color: number) => new THREE.MeshToonMaterial({ color });

function part(
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

export type NPCRole = 'elder-man' | 'elder-woman' | 'child' | 'maiden' | 'farmer';

export interface NPCParams {
  name: string;
  role: NPCRole;
  wanderRadius: number;
  seed: number;
}

/**
 * Peaceful Villager NPCs matching the 5 designs in Image 4.
 * Features custom procedural attire, hair, accessories (hats, beards, tools),
 * wander pathing, and friendly atmospheric dialogue (Image 8).
 */
export class NPC {
  readonly group: THREE.Group;
  readonly name: string;
  readonly role: NPCRole;
  private home: THREE.Vector3;
  private target: THREE.Vector3;
  private speed = 0.85;
  private waitTimer = 0;
  private walking = false;
  private walkPhase = 0;
  private parts: {
    armL: THREE.Group;
    armR: THREE.Group;
    legL: THREE.Group;
    legR: THREE.Group;
    torso: THREE.Group;
    head: THREE.Group;
  };
  private rng: Rng;
  private isTalking = false;

  constructor(params: NPCParams, home: THREE.Vector3) {
    this.name = params.name;
    this.role = params.role;
    this.home = home.clone();
    this.target = home.clone();
    this.rng = new Rng(params.seed);
    this.group = new THREE.Group();
    this.group.name = `npc-${params.name}`;
    this.group.add(createContactShadow(0.95, 0.42));

    const skinMat = new THREE.MeshToonMaterial({ color: 0xfce4c8 });

    // Build specific clothing and hair based on Role from Image 4
    const rig = this.buildRoleRig(params.role, skinMat);
    this.parts = rig;

    // Scale child slightly smaller (Haru)
    if (params.role === 'child') {
      this.group.scale.set(0.78, 0.78, 0.78);
      this.speed = 0.95;
    }

    this.group.position.copy(home);
  }

  private buildRoleRig(role: NPCRole, skinMat: THREE.Material) {
    const torso = new THREE.Group();
    torso.position.y = 1.0;
    const head = new THREE.Group();
    head.position.y = 1.55;
    const armL = new THREE.Group();
    armL.position.set(-0.3, 1.34, 0);
    const armR = new THREE.Group();
    armR.position.set(0.3, 1.34, 0);
    const legL = new THREE.Group();
    legL.position.set(-0.14, 0.66, 0);
    const legR = new THREE.Group();
    legR.position.set(0.14, 0.66, 0);

    // Rounded head with a curved face patch that wraps the front (never seen
    // floating off the head from behind like a billboard).
    part(head, blob(0.26, 1, 12), skinMat);
    const isFemaleRole = role === 'elder-woman' || role === 'maiden';
    const { texture: faceTex } = createAnimeFaceTexture(
      isFemaleRole ? 'female' : 'male',
      role === 'maiden' ? 'happy' : 'smile',
      '#fce4c8',
    );
    const face = new THREE.Mesh(createFaceCap(0.266), new THREE.MeshToonMaterial({ map: faceTex }));
    face.castShadow = true;
    head.add(face);

    const hairDark = toon(0x2a2220);
    const sandal = toon(0x55402d);
    const feet = (groupL: THREE.Group, groupR: THREE.Group, y = -0.64) => {
      for (const g of [groupL, groupR]) {
        part(g, box(0.11, 0.035, 0.2), sandal, 0, y, 0.04);
        part(g, box(0.115, 0.018, 0.05), sandal, 0, y + 0.04, 0.09);
      }
    };

    if (role === 'elder-man') {
      // Dark tan kimono, indigo obi, white hair and long beard.
      const kimono = toon(0x7d6447);
      const obi = toon(0x335f8a);
      const pants = toon(0x34302c);
      const white = toon(0xe8e4dc);
      part(torso, taperedCylinder(0.23, 0.27, 0.5, 10), kimono, 0, -0.18);
      part(torso, taperedCylinder(0.245, 0.245, 0.16, 10), obi, 0, -0.2);
      part(torso, box(0.09, 0.26, 0.035), white, -0.07, 0.13, 0.235, 0, 0, -0.5);
      part(torso, box(0.09, 0.26, 0.035), white, 0.07, 0.13, 0.245, 0, 0, 0.5);
      part(head, blob(0.27, 0.7, 10), white, 0, 0.11, -0.04);
      part(head, blob(0.17, 0.85, 9), white, 0, -0.06, -0.11);
      part(head, blob(0.15, 0.9, 8), white, 0, -0.16, 0.16);
      for (const a of [-0.3, 0, 0.3]) part(head, blob(0.06, 0.7, 6), white, a, 0.2, 0.2);
      for (const a of [armL, armR]) {
        part(a, taperedCylinder(0.15, 0.1, 0.4, 8), kimono, 0, -0.4);
        part(a, blob(0.055, 1, 6), skinMat, 0, -0.46);
      }
      for (const l of [legL, legR]) part(l, taperedCylinder(0.12, 0.09, 0.62, 7), pants, 0, -0.62);
      feet(legL, legR, -0.64);
    } else if (role === 'elder-woman') {
      // Plum kimono, lavender skirt, silver hair in a bun.
      const plum = toon(0x6b3a58);
      const lavender = toon(0x98869a);
      const silver = toon(0x4f565c);
      part(torso, taperedCylinder(0.22, 0.26, 0.48, 10), plum, 0, -0.16);
      part(torso, taperedCylinder(0.37, 0.22, 0.62, 10), lavender, 0, -0.78);
      part(torso, taperedCylinder(0.375, 0.375, 0.05, 10), plum, 0, -0.78);
      part(torso, box(0.09, 0.25, 0.035), toon(0xe8d9cc), -0.07, 0.12, 0.235, 0, 0, -0.5);
      part(torso, box(0.09, 0.25, 0.035), toon(0xe8d9cc), 0.07, 0.12, 0.245, 0, 0, 0.5);
      part(head, blob(0.27, 0.72, 10), silver, 0, 0.1, -0.04);
      part(head, blob(0.17, 0.85, 9), silver, 0, -0.05, -0.11);
      part(head, blob(0.13, 0.9, 8), silver, 0, 0.14, -0.26);
      part(head, blob(0.075, 1, 7), silver, -0.21, -0.02, -0.02);
      part(head, blob(0.075, 1, 7), silver, 0.21, -0.02, -0.02);
      for (const a of [armL, armR]) {
        part(a, taperedCylinder(0.15, 0.1, 0.4, 8), plum, 0, -0.4);
        part(a, blob(0.055, 1, 6), skinMat, 0, -0.46);
      }
      for (const l of [legL, legR]) part(l, taperedCylinder(0.08, 0.06, 0.5, 6), skinMat, 0, -0.5);
      feet(legL, legR, -0.52);
    } else if (role === 'child') {
      // Haru: teal tunic, brown shorts, playfully messy hair.
      const teal = toon(0x368e80);
      const shorts = toon(0x6a513c);
      part(torso, taperedCylinder(0.21, 0.24, 0.44, 9), teal, 0, -0.15);
      part(torso, taperedCylinder(0.23, 0.23, 0.1, 9), shorts, 0, -0.2);
      part(head, blob(0.27, 0.74, 10), hairDark, 0, 0.11, -0.04);
      part(head, blob(0.16, 0.85, 9), hairDark, 0, -0.05, -0.11);
      const tufts = [
        { x: -0.17, y: 0.23, rz: 0.5 }, { x: -0.06, y: 0.27, rz: 0.2 },
        { x: 0.06, y: 0.27, rz: -0.2 }, { x: 0.17, y: 0.23, rz: -0.5 },
      ];
      for (const t of tufts) part(head, blob(0.08, 0.7, 6), hairDark, t.x, t.y, 0.18, 0, 0, t.rz);
      for (const a of [armL, armR]) {
        part(a, taperedCylinder(0.12, 0.09, 0.38, 7), teal, 0, -0.38);
        part(a, blob(0.05, 1, 6), skinMat, 0, -0.44);
      }
      for (const l of [legL, legR]) part(l, taperedCylinder(0.1, 0.075, 0.6, 7), shorts, 0, -0.6);
      feet(legL, legR, -0.62);
    } else if (role === 'maiden') {
      // Mika in the village: white blouse, green vest, apron dress and flower.
      const white = toon(0xf7efe1);
      const green = toon(0x3b7746);
      const pink = toon(0xf2a2b8);
      part(torso, taperedCylinder(0.22, 0.26, 0.46, 10), white, 0, -0.16);
      part(torso, taperedCylinder(0.375, 0.22, 0.66, 10), white, 0, -0.8);
      part(torso, taperedCylinder(0.38, 0.38, 0.05, 10), green, 0, -0.8);
      // Vest panels leave the white blouse showing down the front.
      part(torso, box(0.13, 0.42, 0.06), green, -0.16, -0.02, 0.235, 0, 0, -0.08);
      part(torso, box(0.13, 0.42, 0.06), green, 0.16, -0.02, 0.245, 0, 0, 0.08);
      part(torso, box(0.44, 0.42, 0.05), green, 0, -0.02, -0.25);
      part(head, blob(0.27, 0.74, 10), hairDark, 0, 0.1, -0.04);
      part(head, blob(0.16, 0.85, 9), hairDark, 0, -0.05, -0.11);
      for (let i = -2; i <= 2; i++) part(head, blob(0.075, 0.6, 6), hairDark, i * 0.085, 0.2, 0.2, 0, 0, i * 0.12);
      part(head, blob(0.13, 0.9, 8), hairDark, 0.22, 0.04, -0.14);
      part(head, taperedCylinder(0.045, 0.022, 0.3, 6), hairDark, -0.225, -0.32, 0.12, 0, 0, 0.06);
      part(head, taperedCylinder(0.045, 0.022, 0.3, 6), hairDark, 0.225, -0.32, 0.12, 0, 0, -0.06);
      part(head, blob(0.05, 0.6, 7), pink, 0.19, 0.14, 0.12);
      for (const a of [armL, armR]) {
        part(a, taperedCylinder(0.13, 0.1, 0.38, 8), white, 0, -0.38);
        part(a, blob(0.055, 1, 6), skinMat, 0, -0.44);
      }
      for (const l of [legL, legR]) part(l, taperedCylinder(0.08, 0.06, 0.5, 6), skinMat, 0, -0.5);
      feet(legL, legR, -0.52);
    } else {
      // Devan the farmer: straw kasa, work vest, indigo trousers and a hoe.
      const vest = toon(0x9d7b4d);
      const trousers = toon(0x3f5573);
      const straw = toon(0xddc491);
      const wood = toon(0x5a3e28);
      part(torso, taperedCylinder(0.24, 0.27, 0.5, 10), vest, 0, -0.18);
      part(torso, taperedCylinder(0.255, 0.255, 0.08, 10), wood, 0, -0.22);
      part(head, blob(0.27, 0.74, 10), hairDark, 0, 0.08, -0.04);
      part(head, cone(0.46, 0.22, 10), straw, 0, 0.24);
      part(head, taperedCylinder(0.44, 0.3, 0.05, 10), straw, 0, 0.235);
      part(torso, taperedCylinder(0.028, 0.028, 1.35, 6), wood, 0.42, -0.2, 0.22, 0.12, 0, -0.06);
      part(torso, box(0.16, 0.09, 0.04), toon(0x565a5c), 0.5, 1.12, 0.3);
      for (const a of [armL, armR]) {
        part(a, taperedCylinder(0.14, 0.1, 0.4, 8), vest, 0, -0.4);
        part(a, blob(0.058, 1, 6), skinMat, 0, -0.46);
      }
      for (const l of [legL, legR]) part(l, taperedCylinder(0.13, 0.1, 0.62, 7), trousers, 0, -0.62);
      feet(legL, legR, -0.64);
    }

    this.group.add(torso, head, armL, armR, legL, legR);
    return { armL, armR, legL, legR, torso, head };
  }

  getDialogue(): string {
    switch (this.role) {
      case 'maiden':
        return "It's such a beautiful day, isn't it? The gentle breeze from the river feels so peaceful.";
      case 'elder-man':
        return "Take your time, traveler. In this village, nobody rushes. The river has flowed for centuries, and so shall our days.";
      case 'elder-woman':
        return "Ah, have you listened to the crickets by the bridge yet? A warm cup of tea warms any quiet heart.";
      case 'child':
        return "I saw orange butterflies down by the water! The cat was trying to catch them, but fell asleep instead!";
      case 'farmer':
        return "The soil is rich and sweet this season. The coconut palms and riverbanks are flourishing.";
    }
  }

  /**
   * Turns to face the player and stops moving during conversation.
   */
  talkTo(playerPos: THREE.Vector3): string {
    this.isTalking = true;
    this.walking = false;
    this.waitTimer = 8; // pause for 8 seconds after talking

    // Face player
    const dir = new THREE.Vector3().subVectors(playerPos, this.group.position);
    this.group.rotation.y = Math.atan2(dir.x, dir.z);

    return this.getDialogue();
  }

  update(dt: number): void {
    if (this.isTalking) {
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) {
        this.isTalking = false;
      }
      this.animateIdle();
      return;
    }

    if (!this.walking) {
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) {
        // Pick a new wander target within radius of home.
        const a = this.rng.range(0, Math.PI * 2);
        const d = this.rng.range(1.5, 5);
        this.target.set(this.home.x + Math.cos(a) * d, this.home.y, this.home.z + Math.sin(a) * d);
        this.walking = true;
      }
      this.animateIdle();
      return;
    }

    // Move toward target
    const dir = new THREE.Vector3().subVectors(this.target, this.group.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist < 0.3) {
      this.walking = false;
      this.waitTimer = this.rng.range(3, 7);
      return;
    }
    dir.normalize();
    this.group.position.addScaledVector(dir, this.speed * dt);

    // Smooth turn towards movement direction
    const targetYaw = Math.atan2(dir.x, dir.z);
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetYaw, dt * 5);

    // Walk animation
    this.walkPhase += dt * 6;
    const legSwing = Math.sin(this.walkPhase) * 0.45;
    this.parts.legL.rotation.x = legSwing;
    this.parts.legR.rotation.x = -legSwing;
    this.parts.armL.rotation.x = -legSwing * 0.7;
    this.parts.armR.rotation.x = legSwing * 0.7;
    this.parts.torso.position.y = 1.0 + Math.abs(Math.sin(this.walkPhase)) * 0.02;
  }

  private animateIdle(): void {
    const time = performance.now() * 0.0016;
    this.parts.legL.rotation.x = 0;
    this.parts.legR.rotation.x = 0;
    this.parts.armL.rotation.x = Math.sin(time * 0.8) * 0.02;
    this.parts.armR.rotation.x = -Math.sin(time * 0.8) * 0.02;
    this.parts.torso.position.y = 1.0 + Math.sin(time) * 0.01;
    this.parts.head.position.y = 1.55 + Math.sin(time) * 0.008;
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
      }
    });
    this.group.clear();
  }
}
