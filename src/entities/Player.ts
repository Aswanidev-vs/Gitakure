/**
 * Player entity.
 *
 * Movement is arcade-physics based but constrained to 4 directions, with
 * separate walk/run speeds and a facing direction that drives the animation.
 * Collision is handled by the scene handing us a collider layer.
 */

import Phaser from 'phaser';
import { CONFIG } from '@/core/Config';
import { META, TEX } from '@/art/registry';
import type { Direction, PlayerAppearance } from '@/shared/types';
import { PLAYER_SKIN_A, PLAYER_SKIN_B, applyOutfit } from '@/art/characters';

const DIR_INDEX: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 };

export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: Direction = 'down';
  private moving = false;
  private running = false;
  private animTimer = 0;
  private animFrame = 0;
  private currentPose = 'idle';

  constructor(scene: Phaser.Scene, x: number, y: number, appearance?: PlayerAppearance) {
    super(scene, x, y, TEX.player, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setSize(14, 10);
    this.setOffset(9, 34);
    this.setDepth(10);
    this.applyAppearance(appearance);
    this.playIdle();
  }

  applyAppearance(appearance?: PlayerAppearance): void {
    const base = appearance?.body === 'b' ? PLAYER_SKIN_B : PLAYER_SKIN_A;
    applyOutfit(base, appearance?.outfit ?? 'field');
    // Re-register a sheet for this skin if needed; for now reuse the default sheet.
    this.setTexture(TEX.player);
  }

  getFacing(): Direction {
    return this.facing;
  }

  isMoving(): boolean {
    return this.moving;
  }

  updateControls(keys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    run: Phaser.Input.Keyboard.Key;
  }): void {
    const vx =
      (keys.right.isDown ? 1 : 0) - (keys.left.isDown ? 1 : 0);
    const vy =
      (keys.down.isDown ? 1 : 0) - (keys.up.isDown ? 1 : 0);

    this.running = keys.run.isDown && (vx !== 0 || vy !== 0);
    const speed = this.running ? CONFIG.runSpeed : CONFIG.walkSpeed;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      this.setVelocity((vx / len) * speed, (vy / len) * speed);
      this.moving = true;
      if (Math.abs(vx) > Math.abs(vy)) {
        this.facing = vx > 0 ? 'right' : 'left';
      } else {
        this.facing = vy > 0 ? 'down' : 'up';
      }
    } else {
      this.setVelocity(0, 0);
      this.moving = false;
    }
  }

  update(delta: number): void {
    this.animTimer += delta;
    const frameInterval = this.moving ? (this.running ? 90 : 130) : 400;
    if (this.animTimer >= frameInterval) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % (this.moving ? 4 : 2);
    }

    const pose = this.moving
      ? this.running
        ? this.animFrame % 2 === 0
          ? 'run1'
          : 'run2'
        : ['walk1', 'walk2', 'walk3', 'walk4'][this.animFrame]!
      : 'idle';

    if (pose !== this.currentPose) {
      this.currentPose = pose;
    }

    // Frame index into the sheet: row = pose index, col = direction index.
    const poseIndex = META.POSE_INDEX[pose as keyof typeof META.POSE_INDEX] ?? 0;
    const dirIndex = DIR_INDEX[this.facing];
    const frame = poseIndex * 4 + dirIndex;
    this.setFrame(frame);
  }

  playIdle(): void {
    this.currentPose = 'idle';
    this.setFrame(META.POSE_INDEX.idle * 4 + DIR_INDEX[this.facing]);
  }

  getFacingVector(): { x: number; y: number } {
    switch (this.facing) {
      case 'up':
        return { x: 0, y: -1 };
      case 'down':
        return { x: 0, y: 1 };
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
    }
  }
}