/**
 * Loading scene: a brief atmospheric splash while the world is readied. Because
 * all art is generated at boot, this is mostly a courtesy pause for the eye —
 * but it also sets the audio context and reads the save slot.
 */

import Phaser from 'phaser';
import { CONFIG } from '@/core/Config';

export class LoadingScene extends Phaser.Scene {
  private bar!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: CONFIG.scenes.loading });
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#141019');

    this.add
      .text(width / 2, height / 2 - 24, 'Gitakure', {
        fontFamily: 'serif',
        fontSize: '28px',
        color: '#e8dcc0',
      })
      .setOrigin(0.5);

    const label = this.add
      .text(width / 2, height / 2 + 8, 'Planting the first seeds…', {
        fontFamily: 'serif',
        fontSize: '12px',
        color: '#c9bc9f',
      })
      .setOrigin(0.5);
    void label;

    const track = this.add.rectangle(width / 2, height / 2 + 40, 200, 6, 0x241f2c);
    track.setOrigin(0.5);
    this.bar = this.add.rectangle(width / 2 - 100, height / 2 + 40, 0, 6, 0xc9a227);
    this.bar.setOrigin(0, 0.5);

    this.time.delayedCall(900, () => this.scene.start(CONFIG.scenes.menu));
  }

  update(_time: number, delta: number): void {
    const target = 200;
    const current = this.bar.width;
    this.bar.width = Math.min(target, current + (delta / 900) * target);
  }
}