/**
 * Attract scene: the title screen's living backdrop.
 *
 * The painted valley sits behind a DOM layer that carries the title and menu.
 * Only the atmosphere moves: cloud bars crossing the ridge, petals, fireflies,
 * lantern pools and the last light on the river. It is deliberately slower than
 * the game, so the menu feels like standing still at dusk.
 */

import Phaser from 'phaser';
import { CONFIG } from '@/core/Config';
import { paintBackdrop, paintCloud } from '@/art/backdrop';
import { TEX } from '@/art/registry';
import { PAL, hex } from '@/art/palette';
import { SaveSystem } from '@/persistence/SaveSystem';
import { Screens } from '@/ui/Screens';
import { LOCATION_BY_ID } from '@/data/locations';
import { settings } from '@/core/Settings';

const W = CONFIG.width;
const H = CONFIG.height;

export class AttractScene extends Phaser.Scene {
  private screens: Screens | null = null;
  private reduced = false;
  private loadTimer: Phaser.Time.TimerEvent | null = null;
  private continueScene = 'VillageScene';

  constructor() {
    super({ key: 'AttractScene' });
  }

  create(): void {
    this.reduced = settings.get().reducedMotion;
    this.cameras.main.setBackgroundColor('#141019');
    this.cameras.main.fadeIn(500, 10, 8, 16);

    this.paintBackdrop();
    this.paintClouds();
    this.paintGlow();
    this.paintParticles();

    this.screens = new Screens(document.getElementById('screen-layer')!);
    this.screens.showLoading();
    this.screens.setLoading(0.08, 'Reading the seed');
    this.runLoading();
    this.events.once('shutdown', () => this.cleanup());
  }

  private paintBackdrop(): void {
    if (!this.textures.exists('attract:bg')) {
      const canvas = paintBackdrop({ width: W, height: H, variant: 'dusk' });
      this.textures.addCanvas('attract:bg', canvas.toCanvas());
    }
    this.add.image(0, 0, 'attract:bg').setOrigin(0, 0).setDepth(0);
  }

  private paintClouds(): void {
    if (!this.textures.exists('attract:cloud')) {
      this.textures.addCanvas('attract:cloud', paintCloud(96, 26, 11).toCanvas());
    }
    if (this.reduced) return;
    const specs = [
      { y: 54, scale: 1.4, alpha: 0.35, duration: 90000, delay: 0 },
      { y: 92, scale: 1.0, alpha: 0.28, duration: 70000, delay: 18000 },
      { y: 128, scale: 1.7, alpha: 0.22, duration: 110000, delay: 42000 },
    ];
    for (const spec of specs) {
      const cloud = this.add
        .image(-120, spec.y, 'attract:cloud')
        .setOrigin(0, 0.5)
        .setScale(spec.scale)
        .setAlpha(spec.alpha)
        .setTint(hex(PAL.parchmentDim))
        .setDepth(5);
      this.tweens.add({
        targets: cloud,
        x: W + 140,
        duration: spec.duration,
        delay: spec.delay,
        repeat: -1,
        ease: 'Linear',
      });
    }
  }

  private paintGlow(): void {
    const lanterns = [
      { x: W * 0.37, y: H - 38 },
      { x: W * 0.56, y: H - 38 },
      { x: W * 0.48, y: H * 0.78 },
    ];
    for (const l of lanterns) {
      const glow = this.add
        .image(l.x, l.y, TEX.light)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(hex(PAL.lamp))
        .setDisplaySize(150, 150)
        .setAlpha(0.32)
        .setDepth(6);
      if (!this.reduced) {
        this.tweens.add({
          targets: glow,
          alpha: { from: 0.24, to: 0.4 },
          duration: 2600 + Math.random() * 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    // The river catching the last light.
    if (!this.reduced) {
      for (let i = 0; i < 7; i++) {
        const y = H * 0.82 + Math.random() * (H * 0.1);
        const x = W * 0.32 + Math.random() * W * 0.4;
        const glint = this.add
          .rectangle(x, y, 6 + Math.random() * 16, 1, hex(PAL.lamp), 0.0)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(6);
        this.tweens.add({
          targets: glint,
          alpha: { from: 0.05, to: 0.35 },
          duration: 1800 + Math.random() * 2200,
          delay: Math.random() * 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  private paintParticles(): void {
    if (this.reduced) return;
    const petals = this.add.particles(0, 0, TEX.effect('petal', 0), {
      x: { min: -20, max: W + 20 },
      y: -10,
      lifespan: 16000,
      speedX: { min: -14, max: 6 },
      speedY: { min: 8, max: 18 },
      scale: { min: 0.5, max: 1 },
      alpha: { start: 0.7, end: 0.05 },
      rotate: { min: 0, max: 360 },
      frequency: 1500,
      quantity: 1,
    });
    petals.setDepth(7);

    const fireflies = this.add.particles(0, 0, TEX.effect('firefly', 0), {
      x: { min: 0, max: W },
      y: { min: H * 0.55, max: H * 0.92 },
      lifespan: { min: 1600, max: 3000 },
      speedX: { min: -6, max: 6 },
      speedY: { min: -8, max: 2 },
      scale: { min: 0.6, max: 1.1 },
      alpha: { start: 0.9, end: 0 },
      frequency: 380,
      blendMode: 'ADD',
      quantity: 1,
    });
    fireflies.setDepth(7);
  }

  private runLoading(): void {
    const stages: { at: number; progress: number; label: string }[] = [
      { at: 200, progress: 0.22, label: 'Laying the paths' },
      { at: 650, progress: 0.46, label: 'Raising the roofs' },
      { at: 1100, progress: 0.7, label: 'Filling the paddy' },
      { at: 1550, progress: 0.88, label: 'Lighting the lanterns' },
      { at: 1950, progress: 1, label: 'Opening the gate' },
    ];
    for (const stage of stages) {
      this.time.delayedCall(stage.at, () => this.screens?.setLoading(stage.progress, stage.label));
    }
    this.loadTimer = this.time.delayedCall(2450, () => void this.showMenu());
  }

  private async showMenu(): Promise<void> {
    if (!this.screens) return;
    let hasSave = false;
    let saveLabel = 'Begin at the village gate';
    try {
      const save = await new SaveSystem().load();
      if (save) {
        hasSave = true;
        const loc = LOCATION_BY_ID[save.player.location];
        saveLabel = `Day ${save.clock.day + 1} · ${save.clock.season} · ${loc ? loc.name : 'the valley'}`;
        this.continueScene = loc?.scene ?? 'VillageScene';
      }
    } catch {
      hasSave = false;
    }
    if (!this.screens.isVisible()) return;
    this.screens.showMenu(
      { hasSave, saveLabel },
      {
        onContinue: () => this.startWorld(this.continueScene),
        onNew: () => this.startNew(),
        onSettings: () => this.screens?.showSettings(),
        onAbout: () => this.screens?.showAbout(),
      },
    );
  }

  private async startNew(): Promise<void> {
    try {
      await new SaveSystem().delete();
    } catch {
      /* A missing or blocked store simply means no save to replace. */
    }
    this.startWorld('VillageScene');
  }

  private startWorld(key: string): void {
    this.screens?.hide();
    this.cameras.main.fadeOut(320, 10, 8, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(key);
    });
  }

  cleanup(): void {
    this.loadTimer?.remove();
    this.loadTimer = null;
    this.screens?.hide();
    this.screens = null;
  }
}