/**
 * Ambient animals.
 *
 * Animals are not quest objects. They exist so a still frame of the village
 * still has something alive in it: a cat crossing the square, ducks on the
 * river, a deer at the forest edge, fireflies after dusk. They wander, pause,
 * and never block the player.
 */

import Phaser from 'phaser';
import { TEX } from '@/art/registry';
import { ANIMALS, type AnimalId, type AnimalSpec } from '@/art/animals';

export interface AnimalOptions {
  /** Wander radius in pixels. */
  radius?: number;
  /** Ambient creatures drift on a fixed loop instead of walking. */
  ambient?: boolean;
  /** Pixel-space walkability test, supplied by the scene. */
  canWalk?: (x: number, y: number) => boolean;
  nocturnalOnly?: boolean;
}

const WALK_SPEED = 20;

export class Animal extends Phaser.Physics.Arcade.Sprite {
  private readonly spec: AnimalSpec;
  private readonly home: Phaser.Math.Vector2;
  private readonly radius: number;
  private readonly ambient: boolean;
  private readonly canWalk?: (x: number, y: number) => boolean;
  private readonly nocturnalOnly: boolean;
  private target: Phaser.Math.Vector2;
  private wait = 0;
  private animTimer = 0;
  private frameIndex = 0;
  private phase = Math.random() * Math.PI * 2;
  private shadow?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, id: AnimalId, opts: AnimalOptions = {}) {
    const spec = ANIMALS[id];
    super(scene, x, y, TEX.animal(id), 0);
    this.spec = spec;
    this.radius = opts.radius ?? 64;
    this.ambient = opts.ambient ?? false;
    this.canWalk = opts.canWalk;
    this.nocturnalOnly = opts.nocturnalOnly ?? spec.nocturnal ?? false;
    this.home = new Phaser.Math.Vector2(x, y);
    this.target = new Phaser.Math.Vector2(x, y);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setSize(Math.max(8, spec.w * 0.6), Math.max(6, spec.h * 0.5));
    this.setOffset(spec.w * 0.2, spec.h * 0.45);
    this.setCollideWorldBounds(true);
    this.setDepth(y);

    if (!this.ambient) {
      this.shadow = scene.add
        .image(x, y - 1, TEX.shadow)
        .setDisplaySize(Math.max(12, spec.w * 0.7), Math.max(5, spec.w * 0.22))
        .setAlpha(0.32)
        .setDepth(y - 1);
    }
    this.wait = Phaser.Math.Between(600, 2600);
  }

  update(delta: number, minutes: number): void {
    const night = minutes < 300 || minutes >= 1140;
    this.setVisible(!this.nocturnalOnly || night);
    if (!this.visible) {
      this.setVelocity(0, 0);
      return;
    }

    if (this.ambient) {
      this.drift(delta);
    } else {
      this.wander(delta);
    }

    this.setDepth(this.y);
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y - 1);
      this.shadow.setDepth(this.y - 1);
    }

    this.animTimer += delta;
    const interval = this.ambient ? 180 : 380;
    if (this.animTimer >= interval) {
      this.animTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % 2;
      this.setFrame(this.frameIndex);
    }
  }

  private drift(delta: number): void {
    const t = this.scene.time.now / 1000 + this.phase;
    const nx = this.home.x + Math.cos(t * 0.6) * this.radius * 0.45;
    const ny = this.home.y + Math.sin(t * 0.9) * this.radius * 0.22;
    this.setPosition(nx, ny);
    this.setFlipX(Math.cos(t * 0.6) < 0);
    void delta;
  }

  private wander(delta: number): void {
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 3) {
      this.setVelocity(0, 0);
      this.wait -= delta;
      if (this.wait <= 0) {
        this.pickTarget();
        this.wait = Phaser.Math.Between(1200, 4200);
      }
      return;
    }

    const speed = this.spec.solid ? WALK_SPEED * 0.7 : WALK_SPEED;
    this.setVelocity((dx / dist) * speed, (dy / dist) * speed);
    this.setFlipX(dx < 0);
  }

  private pickTarget(): void {
    for (let attempt = 0; attempt < 8; attempt++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * this.radius;
      const x = this.home.x + Math.cos(a) * r;
      const y = this.home.y + Math.sin(a) * r;
      if (this.canWalk && !this.canWalk(x, y)) continue;
      this.target.set(x, y);
      return;
    }
    this.target.copy(this.home);
  }
}
