/**
 * Boot scene: registers every generated texture into Phaser's texture manager,
 * then hands off to the loading scene. All art is painted in-process, so there
 * is no network fetch and the game works offline.
 */

import Phaser from 'phaser';
import { buildAllTextures, TEX, META } from '@/art/registry';
import { CONFIG } from '@/core/Config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: CONFIG.scenes.boot });
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
      } else if (key.startsWith('animal:')) {
        const animalId = key.slice('animal:'.length) as keyof typeof META.ANIMALS;
        const spec = META.ANIMALS[animalId];
        if (spec) {
          this.textures.addSpriteSheet(key, c as unknown as HTMLImageElement, {
            frameWidth: spec.w,
            frameHeight: spec.h,
          });
        } else {
          this.textures.addCanvas(key, c);
        }
      } else {
        this.textures.addCanvas(key, c);
      }
    }
    this.registry.set('meta', META);
    this.registry.set('tex', TEX);
    this.scene.start(CONFIG.scenes.loading);
  }
}