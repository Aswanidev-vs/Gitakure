/**
 * Main menu: a quiet title screen. New World drops straight into the village;
 * the rest are honest placeholders that say what they do.
 */

import Phaser from 'phaser';
import { CONFIG } from '@/core/Config';
import { paintSky } from '@/art/effects';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: CONFIG.scenes.menu });
  }

  create(): void {
    const { width, height } = this.scale;
    if (this.cameras.main) this.cameras.main.setBackgroundColor('#141019');

    const sky = paintSky(width, height, '#2a2a3a', '#141019', 12);
    const skyTex = this.textures.addCanvas('menu:sky', sky.toCanvas());
    if (skyTex) this.add.image(0, 0, skyTex.key).setOrigin(0);

    const title = this.add.text(width / 2, height / 2 - 60, 'Gitakure', {
      fontFamily: 'serif',
      fontSize: '44px',
      color: '#e8dcc0',
      stroke: '#141019',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 24, 'A countryside that grows from your code', {
        fontFamily: 'serif',
        fontSize: '13px',
        color: '#c9bc9f',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    const btn = this.add
      .text(width / 2, height / 2 + 30, 'New world', {
        fontFamily: 'serif',
        fontSize: '18px',
        color: '#e8dcc0',
        backgroundColor: '#241f2c',
        padding: { x: 20, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#c9a227'));
    btn.on('pointerout', () => btn.setColor('#e8dcc0'));
    btn.on('pointerdown', () => this.scene.start(CONFIG.scenes.village));

    this.add
      .text(width / 2, height - 24, 'Press Enter to begin', {
        fontFamily: 'serif',
        fontSize: '11px',
        color: '#8a7f6e',
      })
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown-ENTER', () => this.scene.start(CONFIG.scenes.village));
  }
}