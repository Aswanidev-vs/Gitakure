import Phaser from 'phaser';
import { PixelArtFactory } from '@/game/art/pixel-art-factory';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.scale;

    const bgRect = this.add.rectangle(width / 2, height / 2, width, height, 0x121815);
    bgRect.setOrigin(0.5);

    const titleText = this.add.text(width / 2, height / 2 - 30, 'GITAKURE', {
      fontFamily: 'Shippori Mincho, serif',
      fontSize: '32px',
      color: '#e8dfcb',
      letterSpacing: 6,
    });
    titleText.setOrigin(0.5);

    const subText = this.add.text(width / 2, height / 2 + 10, 'ギタクレ · ഗീതാകുരെ · Awakening Countryside', {
      fontFamily: 'Zen Kaku Gothic New, sans-serif',
      fontSize: '13px',
      color: '#8fa393',
    });
    subText.setOrigin(0.5);

    // Generate our handcrafted bespoke pixel art assets in memory
    PixelArtFactory.generateAll(this);
  }

  create(): void {
    // Transition to the isometric valley countryside
    this.scene.start('IsoValleyScene');
  }
}
