import * as THREE from 'three';
import {
  buildFemaleCharacter,
  buildMaleCharacter,
  type CharacterGender,
  type CharacterExpression,
  type CharacterRig,
} from './CharacterFactory';
import { createContactShadow } from './contactShadow';
import { loadRiggedCharacter, peekRiggedCharacter } from './RiggedCharacter';

export type PlayerAnim = 'idle' | 'walk' | 'sit' | 'fish';

/**
 * Stylized Anime Player Entity (Image 2)
 * Supports dynamic switching between Female (Mika style) and Male (Traveler style)
 * with animated face expressions, walk cycles, breathing, and sitting poses.
 */
export class Player {
  readonly group: THREE.Group;
  private currentRig: CharacterRig;
  private gender: CharacterGender;
  private anim: PlayerAnim = 'idle';
  private walkPhase = 0;
  private sitBlend = 0;
  private facing = 0;
  private torsoBaseY = 1.05;
  private headBaseY = 1.62;

  constructor(gender: CharacterGender = 'female') {
    this.gender = gender;
    this.group = new THREE.Group();
    this.group.name = 'player';

    // Soft contact shadow: grounds the character even when the low sun throws
    // his/her cast shadow far behind the body.
    this.group.add(createContactShadow(1.15, 0.55));

    this.currentRig = gender === 'female' ? buildFemaleCharacter() : buildMaleCharacter();
    this.captureBaselines();
    this.group.add(this.currentRig.root);

    // The detailed reference models load asynchronously; swap in as soon as
    // they are ready, keeping the procedural rig as the instant fallback.
    void this.useRiggedModel(gender);
  }

  /** Replace the active rig (and re-read its animation baselines). */
  private swapRig(rig: CharacterRig): void {
    this.group.remove(this.currentRig.root);
    this.currentRig = rig;
    this.captureBaselines();
    this.group.add(rig.root);
  }

  /** Load and activate the skinned GLB for a gender. */
  private async useRiggedModel(gender: CharacterGender): Promise<void> {
    try {
      const rig = await loadRiggedCharacter(gender);
      if (this.gender !== gender) return; // model changed while loading
      this.swapRig(rig);
    } catch (e) {
      console.warn('Rigged character failed to load; keeping procedural model.', e);
    }
  }
  private captureBaselines(): void {
    this.torsoBaseY = this.currentRig.torso.position.y;
    this.headBaseY = this.currentRig.head.position.y;
  }

  get modelGender(): CharacterGender {
    return this.gender;
  }

  setModel(gender: CharacterGender): void {
    if (this.gender === gender) return;
    this.gender = gender;

    const cached = peekRiggedCharacter(gender);
    if (cached) {
      this.swapRig(cached);
    } else {
      this.swapRig(gender === 'female' ? buildFemaleCharacter() : buildMaleCharacter());
      void this.useRiggedModel(gender);
    }
  }

  setExpression(expr: CharacterExpression): void {
    this.currentRig.setExpression(expr);
  }

  setAnim(anim: PlayerAnim): void {
    this.anim = anim;
  }

  setFacing(yaw: number): void {
    this.facing = yaw;
  }

  stand(): void {
    this.sitBlend = 0;
    this.anim = 'idle';
  }

  /**
   * Advance procedural animations based on dt and velocity.
   */
  update(dt: number, speed: number): void {
    const r = this.currentRig;

    if (this.anim === 'walk') {
      this.walkPhase += dt * (5 + speed * 6);
      const legSwing = Math.sin(this.walkPhase) * 0.65;
      const armSwing = Math.sin(this.walkPhase) * 0.55;

      r.legL.rotation.x = legSwing;
      r.legR.rotation.x = -legSwing;
      r.armL.rotation.x = -armSwing;
      r.armR.rotation.x = armSwing;

      // Natural torso and head bob
      const bob = Math.abs(Math.sin(this.walkPhase)) * 0.04;
      r.torso.position.y = this.torsoBaseY + bob;
      r.head.position.y = this.headBaseY + bob * 0.25;

      // Gentle ponytail physics sway
      if (r.hairExtra) {
        r.hairExtra.rotation.x = Math.sin(this.walkPhase - 0.4) * 0.25;
      }
    } else if (this.anim === 'idle') {
      this.walkPhase = 0;
      const time = performance.now() * 0.0016;
      const breathe = Math.sin(time) * 0.015;

      r.legL.rotation.x = 0;
      r.legR.rotation.x = 0;
      r.armL.rotation.x = Math.sin(time * 0.8) * 0.03;
      r.armR.rotation.x = -Math.sin(time * 0.8) * 0.03;
      r.torso.position.y = this.torsoBaseY + breathe;
      r.head.position.y = this.headBaseY + breathe * 0.3;

      if (r.hairExtra) {
        r.hairExtra.rotation.x = Math.sin(time * 0.5) * 0.06;
      }
    } else if (this.anim === 'sit') {
      // Smoothly blend sitting posture: bend legs forward, lower torso
      this.sitBlend = Math.min(1, this.sitBlend + dt * 4);
      const b = this.sitBlend;

      r.legL.rotation.x = b * (Math.PI / 2.2);
      r.legR.rotation.x = b * (Math.PI / 2.2);
      r.armL.rotation.x = b * 0.25;
      r.armR.rotation.x = b * 0.25;

      r.torso.position.y = this.torsoBaseY - b * 0.12;
      r.head.position.y = this.headBaseY;
    } else if (this.anim === 'fish') {
      const time = performance.now() * 0.002;
      r.legL.rotation.x = 0;
      r.legR.rotation.x = 0;
      r.armR.rotation.x = -Math.PI * 0.38 + Math.sin(time) * 0.04;
      r.armL.rotation.x = -Math.PI * 0.15 + Math.sin(time) * 0.02;
      r.torso.position.y = this.torsoBaseY + Math.sin(time * 0.8) * 0.01;
      r.head.position.y = this.headBaseY;
    }

    this.group.rotation.y = this.facing;
  }
}
