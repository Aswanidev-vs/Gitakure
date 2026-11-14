import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Elegant loading display
    const { width, height } = this.scale;

    const bgRect = this.add.rectangle(width / 2, height / 2, width, height, 0x141c18);
    bgRect.setOrigin(0.5);

    const titleText = this.add.text(width / 2, height / 2 - 40, 'GITAKURE', {
      fontFamily: 'Shippori Mincho, serif',
      fontSize: '28px',
      color: '#e8dfcb',
      letterSpacing: 6,
    });
    titleText.setOrigin(0.5);

    const subText = this.add.text(width / 2, height / 2 - 10, '谷の記憶 · Awakened Countryside', {
      fontFamily: 'Zen Kaku Gothic New, sans-serif',
      fontSize: '13px',
      color: '#8fa393',
    });
    subText.setOrigin(0.5);

    const barBg = this.add.rectangle(width / 2, height / 2 + 35, 240, 8, 0x223028);
    barBg.setOrigin(0.5);

    const progressBar = this.add.rectangle(width / 2 - 120, height / 2 + 35, 0, 8, 0x5b8a55);
    progressBar.setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.width = 240 * value;
    });

    // Load all 12 Atlases
    const atlases = [
      'buildings_interiors',
      'environmental_effects',
      'farming_pixel_art',
      'npc',
      'pixel_art_asset',
      'pixel_character_sheets',
      'pixel_rpg_ui_asset',
      'rpg_asset',
      'rpg_terrain',
      'trees_and_vegetation',
      'water_environmental',
      'wildlife_sprite',
    ];

    atlases.forEach((key) => {
      this.load.atlas(
        key,
        `/sprites/${key}/${key}_atlas.png`,
        `/sprites/${key}/${key}_atlas.json`
      );
    });
  }

  create(): void {
    this.scene.start('IsoValleyScene');
  }
}
