import * as THREE from 'three';
import { box, taperedCylinder, blob, cone } from '@/game/procedural/geometry';
import { Rng } from '@/utils/rng';
import { createAnimeFaceTexture } from './CharacterFactory';

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
    armL.position.set(-0.3, 1.35, 0);

    const armR = new THREE.Group();
    armR.position.set(0.3, 1.35, 0);

    const legL = new THREE.Group();
    legL.position.set(-0.14, 0.65, 0);

    const legR = new THREE.Group();
    legR.position.set(0.14, 0.65, 0);

    // Common head base
    const headMesh = new THREE.Mesh(blob(0.22, 1, 8), skinMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Expressive Anime Face Texture Quad (Image 4 & 8)
    const isFemaleRole = role === 'elder-woman' || role === 'maiden';
    const { texture: faceTex } = createAnimeFaceTexture(
      isFemaleRole ? 'female' : 'male',
      role === 'maiden' ? 'happy' : 'smile',
    );
    const faceMat = new THREE.MeshToonMaterial({ map: faceTex });
    const faceQuad = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), faceMat);
    faceQuad.position.set(0, 0.02, 0.18);
    head.add(faceQuad);

    // Role-specific attire & accessories
    if (role === 'elder-man') {
      // 1. Elder Grandfather: tan kimono, blue sash, white beard & hair
      const tanKimono = new THREE.MeshToonMaterial({ color: 0x8a6f4d });
      const blueObi = new THREE.MeshToonMaterial({ color: 0x2e6094 });
      const darkPants = new THREE.MeshToonMaterial({ color: 0x333130 });
      const whiteHairMat = new THREE.MeshToonMaterial({ color: 0xeae6df });

      // Torso & Robe
      const torsoMesh = new THREE.Mesh(box(0.5, 0.65, 0.3), tanKimono);
      torso.add(torsoMesh);
      const obiMesh = new THREE.Mesh(box(0.52, 0.16, 0.32), blueObi);
      obiMesh.position.y = -0.15;
      torso.add(obiMesh);

      // White hair + Beard
      const hair = new THREE.Mesh(blob(0.23, 0.6, 7), whiteHairMat);
      hair.position.set(0, 0.1, -0.02);
      head.add(hair);
      const beard = new THREE.Mesh(blob(0.14, 0.8, 6), whiteHairMat);
      beard.position.set(0, -0.12, 0.14);
      head.add(beard);

      // Sleeves & legs
      armL.add(new THREE.Mesh(taperedCylinder(0.1, 0.08, 0.55, 5), tanKimono));
      armR.add(new THREE.Mesh(taperedCylinder(0.1, 0.08, 0.55, 5), tanKimono));
      legL.add(new THREE.Mesh(taperedCylinder(0.11, 0.08, 0.7, 5), darkPants));
      legR.add(new THREE.Mesh(taperedCylinder(0.11, 0.08, 0.7, 5), darkPants));

    } else if (role === 'elder-woman') {
      // 2. Elder Grandmother: plum kimono, lavender skirt, gray bun
      const plumMat = new THREE.MeshToonMaterial({ color: 0x6e3852 });
      const lavenderSkirt = new THREE.MeshToonMaterial({ color: 0x938294 });
      const grayHairMat = new THREE.MeshToonMaterial({ color: 0xb5b0ab });

      const torsoMesh = new THREE.Mesh(box(0.48, 0.6, 0.28), plumMat);
      torso.add(torsoMesh);
      const skirtMesh = new THREE.Mesh(taperedCylinder(0.32, 0.24, 0.65, 7), lavenderSkirt);
      skirtMesh.position.y = -0.42;
      torso.add(skirtMesh);

      // Gray Hair with Bun
      const hair = new THREE.Mesh(blob(0.23, 0.6, 7), grayHairMat);
      hair.position.y = 0.08;
      head.add(hair);
      const bun = new THREE.Mesh(blob(0.12, 0.9, 6), grayHairMat);
      bun.position.set(0, 0.12, -0.18);
      head.add(bun);

      armL.add(new THREE.Mesh(taperedCylinder(0.09, 0.07, 0.52, 5), plumMat));
      armR.add(new THREE.Mesh(taperedCylinder(0.09, 0.07, 0.52, 5), plumMat));
      legL.add(new THREE.Mesh(taperedCylinder(0.09, 0.07, 0.5, 5), skinMat));
      legR.add(new THREE.Mesh(taperedCylinder(0.09, 0.07, 0.5, 5), skinMat));

    } else if (role === 'child') {
      // 3. Village Boy (Haru): teal green tunic, brown shorts, dark messy hair
      const tealTunic = new THREE.MeshToonMaterial({ color: 0x2e8074 });
      const brownShorts = new THREE.MeshToonMaterial({ color: 0x634d3a });
      const darkHairMat = new THREE.MeshToonMaterial({ color: 0x241d18 });

      const torsoMesh = new THREE.Mesh(box(0.44, 0.55, 0.26), tealTunic);
      torso.add(torsoMesh);

      const hair = new THREE.Mesh(blob(0.24, 0.6, 7), darkHairMat);
      hair.position.y = 0.09;
      head.add(hair);

      armL.add(new THREE.Mesh(taperedCylinder(0.07, 0.06, 0.48, 5), tealTunic));
      armR.add(new THREE.Mesh(taperedCylinder(0.07, 0.06, 0.48, 5), tealTunic));
      legL.add(new THREE.Mesh(taperedCylinder(0.09, 0.07, 0.58, 5), brownShorts));
      legR.add(new THREE.Mesh(taperedCylinder(0.09, 0.07, 0.58, 5), brownShorts));

    } else if (role === 'maiden') {
      // 4. Mika: Green vest over white blouse, white & green apron dress, sakura flower
      const greenVest = new THREE.MeshToonMaterial({ color: 0x2e6b3b });
      const whiteBlouse = new THREE.MeshToonMaterial({ color: 0xfaf5ec });
      const darkHairMat = new THREE.MeshToonMaterial({ color: 0x261e1b });
      const sakuraPink = new THREE.MeshToonMaterial({ color: 0xf472b6 });

      const torsoMesh = new THREE.Mesh(box(0.46, 0.52, 0.28), greenVest);
      torso.add(torsoMesh);
      const apron = new THREE.Mesh(taperedCylinder(0.34, 0.24, 0.65, 8), whiteBlouse);
      apron.position.y = -0.45;
      torso.add(apron);
      const apronHem = new THREE.Mesh(box(0.42, 0.12, 0.32), greenVest);
      apronHem.position.y = -0.74;
      torso.add(apronHem);

      // Dark hair + side ponytail + sakura flower
      const hair = new THREE.Mesh(blob(0.24, 0.6, 8), darkHairMat);
      hair.position.y = 0.08;
      head.add(hair);
      const ponytail = new THREE.Mesh(blob(0.12, 0.9, 6), darkHairMat);
      ponytail.position.set(0.18, 0.06, -0.12);
      head.add(ponytail);
      const flower = new THREE.Mesh(blob(0.05, 0.8, 5), sakuraPink);
      flower.position.set(0.16, 0.12, 0.08);
      head.add(flower);

      armL.add(new THREE.Mesh(taperedCylinder(0.08, 0.07, 0.52, 5), whiteBlouse));
      armR.add(new THREE.Mesh(taperedCylinder(0.08, 0.07, 0.52, 5), whiteBlouse));
      legL.add(new THREE.Mesh(taperedCylinder(0.08, 0.06, 0.5, 5), skinMat));
      legR.add(new THREE.Mesh(taperedCylinder(0.08, 0.06, 0.5, 5), skinMat));

    } else {
      // 5. Farmer Devan: Straw conical hat (kasa), tan work vest, blue trousers, wooden hoe
      const tanVest = new THREE.MeshToonMaterial({ color: 0x9c7a4b });
      const bluePants = new THREE.MeshToonMaterial({ color: 0x3d5475 });
      const strawMat = new THREE.MeshToonMaterial({ color: 0xd9be8f });
      const woodMat = new THREE.MeshToonMaterial({ color: 0x5a3e26 });

      const torsoMesh = new THREE.Mesh(box(0.52, 0.62, 0.3), tanVest);
      torso.add(torsoMesh);

      // Straw Conical Hat (Kasa)
      const hatGeo = cone(0.44, 0.18, 8);
      const hat = new THREE.Mesh(hatGeo, strawMat);
      hat.position.set(0, 0.24, 0);
      head.add(hat);

      // Wooden Gardening Hoe in hand
      const hoeHandle = new THREE.Mesh(taperedCylinder(0.03, 0.03, 1.4, 4), woodMat);
      hoeHandle.position.set(0.45, 0.45, 0.2);
      hoeHandle.rotation.x = 0.2;
      torso.add(hoeHandle);
      const hoeBlade = new THREE.Mesh(box(0.14, 0.08, 0.04), new THREE.MeshToonMaterial({ color: 0x4a4a4a }));
      hoeBlade.position.set(0.45, 1.1, 0.3);
      torso.add(hoeBlade);

      armL.add(new THREE.Mesh(taperedCylinder(0.09, 0.07, 0.55, 5), tanVest));
      armR.add(new THREE.Mesh(taperedCylinder(0.09, 0.07, 0.55, 5), tanVest));
      legL.add(new THREE.Mesh(taperedCylinder(0.12, 0.09, 0.72, 5), bluePants));
      legR.add(new THREE.Mesh(taperedCylinder(0.12, 0.09, 0.72, 5), bluePants));
    }

    this.group.add(torso);
    this.group.add(head);
    this.group.add(armL);
    this.group.add(armR);
    this.group.add(legL);
    this.group.add(legR);

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
