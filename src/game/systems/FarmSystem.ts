import type Phaser from 'phaser';
import type { CropState } from '@/types';
import { gameActions, gameStore } from '@/state/game-store';
import { soundEngine } from '@/audio/procedural-audio';

export class FarmSystem {
  private scene: Phaser.Scene;
  private plots: Map<string, { state: CropState; groundSprite: Phaser.GameObjects.Sprite; plantSprite?: Phaser.GameObjects.Sprite }> = new Map();
  private plotContainer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.plotContainer = this.scene.add.container(0, 0);
    this.plotContainer.setDepth(15);
  }

  public registerPlot(tileX: number, tileY: number): void {
    const key = `${tileX}_${tileY}`;
    if (this.plots.has(key)) return;

    const posX = tileX * 32 + 16;
    const posY = tileY * 32 + 16;

    // Default unturned ground overlay or marker
    const groundSprite = this.scene.add.sprite(posX, posY, 'farming_pixel_art', 'farming_pixel_art_p01_r00_c01');
    groundSprite.setDisplaySize(32, 32);
    groundSprite.setAlpha(0.35); // faint until tilled
    groundSprite.setTint(0x6f8f5a); // faint wild green
    groundSprite.setInteractive({ useHandCursor: true });

    const state: CropState = {
      id: key,
      x: tileX,
      y: tileY,
      tilled: false,
      watered: false,
      cropType: null,
      stage: 0,
      maxStage: 3,
    };

    groundSprite.on('pointerdown', () => {
      this.interactWithPlot(tileX, tileY);
    });

    this.plotContainer.add(groundSprite);
    this.plots.set(key, { state, groundSprite });
  }

  public interactWithPlot(tileX: number, tileY: number): boolean {
    const key = `${tileX}_${tileY}`;
    const plot = this.plots.get(key);
    if (!plot) return false;

    const { state, groundSprite } = plot;
    const tool = gameStore.activeTool;

    // 1. Hoe: Till earth
    if (tool === 'hoe') {
      if (!state.tilled) {
        state.tilled = true;
        groundSprite.setAlpha(1.0);
        groundSprite.setTint(0x9c7a53); // rich tilled earth
        this.popFeedback(groundSprite, 'Tilled');
        soundEngine.playTill();
        gameActions.addToast('Soil turned and aerated.', 'farm');
        return true;
      }
    }

    // 2. Watering Can: Water soil
    if (tool === 'watering_can') {
      if (state.tilled && !state.watered) {
        state.watered = true;
        groundSprite.setTint(0x5a422d); // dark rich wet loam
        this.popFeedback(groundSprite, 'Watered');
        soundEngine.playWater();
        gameActions.addToast('Plot watered with fresh river water.', 'farm');
        return true;
      }
    }

    // 3. Planting Seeds
    if (tool.startsWith('seeds_')) {
      if (state.tilled && !state.cropType) {
        const crop = tool.replace('seeds_', '') as 'rice' | 'radish' | 'tea' | 'starlight';
        const seedId = `seed_${crop}`;
        const hasSeed = gameActions.consumeItem(seedId, 1);

        if (hasSeed) {
          state.cropType = crop;
          state.stage = 0;
          this.updatePlantVisual(key);
          this.popFeedback(plot.plantSprite ?? groundSprite, 'Sown');
          soundEngine.playPlant();
          gameStore.stats.seedsPlanted += 1;
          gameActions.addToast(`Sowed ${crop} seeds gently into the earth.`, 'farm');
          return true;
        } else {
          gameActions.addToast(`No more ${crop} seeds in your satchel.`, 'info');
          return false;
        }
      }
    }

    // 4. Harvesting with Hand or Basket
    if (tool === 'hand' || tool === 'basket') {
      if (state.cropType && state.stage >= state.maxStage) {
        const crop = state.cropType;
        const cropName =
          crop === 'rice'
            ? 'Valley Golden Rice'
            : crop === 'radish'
              ? 'Sweet Daikon Radish'
              : crop === 'tea'
                ? 'Fresh Tea Leaves'
                : 'Luminous Starlight Blossom';

        const cropJp =
          crop === 'rice'
            ? '黄金米'
            : crop === 'radish'
              ? '甘大根'
              : crop === 'tea'
                ? '新茶'
                : '星彩花';

        const iconFrame =
          crop === 'rice'
            ? 'farming_pixel_art_p01_r00_c04'
            : crop === 'radish'
              ? 'farming_pixel_art_p01_r00_c05'
              : crop === 'tea'
                ? 'farming_pixel_art_p01_r00_c08'
                : 'environmental_effects_p01_r00_c01';

        const atlas = crop === 'starlight' ? 'environmental_effects' : 'farming_pixel_art';

        gameActions.addItem({
          id: `crop_${crop}`,
          name: cropName,
          japaneseName: cropJp,
          description: `Harvested with care from the Gitakure farm terraces.`,
          category: 'crop',
          iconFrame,
          atlas,
        }, 1);

        // Reward moment: pop the plant, float the harvest name up, then reset.
        if (plot.plantSprite) {
          this.popFeedback(plot.plantSprite, `+1 ${cropName}`);
          this.scene.tweens.add({
            targets: plot.plantSprite,
            y: plot.plantSprite.y - 18,
            alpha: 0,
            duration: 700,
            ease: 'Sine.easeOut',
            onComplete: () => {
              if (plot.plantSprite) {
                plot.plantSprite.destroy();
                plot.plantSprite = undefined;
              }
            },
          });
        } else {
          this.popFeedback(groundSprite, `+1 ${cropName}`);
        }

        // Reset plant
        state.cropType = null;
        state.stage = 0;
        state.watered = false;
        groundSprite.setTint(0x9c7a53); // Back to dry tilled soil

        soundEngine.playHarvest();
        gameStore.stats.cropsHarvested += 1;
        gameActions.addToast(`Harvested fresh ${cropName}!`, 'farm');
        return true;
      } else if (state.cropType && state.stage < state.maxStage) {
        gameActions.addToast('Still growing peacefully. Water it and wait for dawn.', 'nature');
      }
    }

    return false;
  }

  public updatePlantVisual(key: string): void {
    const plot = this.plots.get(key);
    if (!plot || !plot.state.cropType) return;

    const { state } = plot;
    const posX = state.x * 32 + 16;
    const posY = state.y * 32 + 14;

    if (!plot.plantSprite) {
      plot.plantSprite = this.scene.add.sprite(posX, posY, 'farming_pixel_art', 'farming_pixel_art_p01_r00_c02');
      plot.plantSprite.setDisplaySize(24, 24);
      plot.plantSprite.setDepth(16);
      this.plotContainer.add(plot.plantSprite);
    }

    // Adjust frame based on growth stage
    if (state.stage === 0) {
      plot.plantSprite.setFrame('farming_pixel_art_p01_r00_c02');
      plot.plantSprite.setScale(0.7);
    } else if (state.stage === 1) {
      plot.plantSprite.setFrame('farming_pixel_art_p01_r00_c03');
      plot.plantSprite.setScale(0.9);
    } else if (state.stage === 2) {
      plot.plantSprite.setFrame('farming_pixel_art_p01_r00_c04');
      plot.plantSprite.setScale(1.1);
    } else {
      // Fully mature
      plot.plantSprite.setFrame(
        state.cropType === 'radish'
          ? 'farming_pixel_art_p01_r00_c05'
          : state.cropType === 'rice'
            ? 'farming_pixel_art_p01_r00_c04'
            : state.cropType === 'tea'
              ? 'farming_pixel_art_p01_r00_c08'
              : 'environmental_effects_p01_r00_c01'
      );
      plot.plantSprite.setScale(1.25);

      // Add gentle shimmer tween for mature crop
      this.scene.tweens.add({
        targets: plot.plantSprite,
        y: posY - 2,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  public growAllCrops(stages = 1): void {
    this.plots.forEach((plot, key) => {
      if (plot.state.cropType && plot.state.stage < plot.state.maxStage) {
        plot.state.stage = Math.min(plot.state.maxStage, plot.state.stage + stages);
        this.updatePlantVisual(key);
        // Visible growth feedback: a brief scale-pop on the plant.
        if (plot.plantSprite) {
          this.scene.tweens.add({
            targets: plot.plantSprite,
            scaleX: { from: 0.4, to: plot.plantSprite.scaleX },
            scaleY: { from: 0.4, to: plot.plantSprite.scaleY },
            duration: 500,
            ease: 'Back.easeOut',
          });
        }
      }
      // Dry out soil for next cycle unless raining
      if (gameStore.weather !== 'gentle_rain') {
        plot.state.watered = false;
        if (plot.state.tilled) {
          plot.groundSprite.setTint(0x9c7a53);
        }
      }
    });
  }

  /** Floating label above a plot — the immediate "this happened" feedback. */
  private popFeedback(target: Phaser.GameObjects.Sprite, text: string): void {
    const label = this.scene.add.text(target.x, target.y - 20, text, {
      fontFamily: 'Zen Kaku Gothic New, sans-serif',
      fontSize: '12px',
      color: '#f0ece1',
      backgroundColor: '#1c2720dd',
      padding: { x: 5, y: 2 },
    });
    label.setOrigin(0.5);
    label.setDepth(2000);
    this.scene.tweens.add({
      targets: label,
      y: label.y - 26,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  public waterAllPlots(): void {
    this.plots.forEach((plot) => {
      if (plot.state.tilled) {
        plot.state.watered = true;
        plot.groundSprite.setTint(0x5a422d);
      }
    });
  }
}
