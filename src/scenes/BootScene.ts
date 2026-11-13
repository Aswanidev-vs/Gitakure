import Phaser from 'phaser';
import { buildAllTextures, META } from '@/art/registry';
import { SPRITE_MANIFEST } from '@/art/spriteManifest';
import { CONFIG } from '@/core/Config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: CONFIG.scenes.boot });
  }

  preload(): void {
    for (const s of SPRITE_MANIFEST) {
      if (!this.textures.exists(s.key)) {
        this.load.image(s.key, s.file);
      }
    }
  }

  create(): void {
    const textures = buildAllTextures();
    for (const [key, canvas] of textures) {
      if (this.textures.exists(key)) continue;
      const c = canvas.toCanvas();
      if (key.startsWith('char:')) {
        this.textures.addSpriteSheet(key, c as unknown as HTMLImageElement, {
          frameWidth: META.CHAR_W,
          frameHeight: META.CHAR_H,
        });
      } else {
        this.textures.addCanvas(key, c);
      }
    }
    this.registry.set('meta', META);
    this.scene.start(CONFIG.scenes.attract);
  }
}