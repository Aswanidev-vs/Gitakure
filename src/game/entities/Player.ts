import * as THREE from 'three';
import {
  buildFemaleCharacter,
  buildMaleCharacter,
  type CharacterGender,
  type CharacterExpression,
  type CharacterRig,
} from './CharacterFactory';

export type PlayerAnim = 'idle' | 'walk' | 'sit';

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

  constructor(gender: CharacterGender = 'female') {
    this.gender = gender;
    this.group = new THREE.Group();
    this.group.name = 'player';

    this.currentRig = gender === 'female' ? buildFemaleCharacter() : buildMaleCharacter();
    this.group.add(this.currentRig.root);
  }

  get modelGender(): CharacterGender {
    return this.gender;
  }

  setModel(gender: CharacterGender): void {
    if (this.gender === gender) return;
    this.gender = gender;
    this.group.remove(this.currentRig.root);

    this.currentRig = gender === 'female' ? buildFemaleCharacter() : buildMaleCharacter();
    this.group.add(this.currentRig.root);
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
      r.torso.position.y = 1.05 + bob;
      r.head.position.y = 1.62 + bob * 0.6;

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
      r.torso.position.y = 1.05 + breathe;
      r.head.position.y = 1.62 + breathe * 0.7;

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

      r.torso.position.y = 1.05 - b * 0.38;
      r.head.position.y = 1.62 - b * 0.38;
    }

    this.group.rotation.y = this.facing;
  }
}
