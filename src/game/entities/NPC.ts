import Phaser from 'phaser';
import type { DialogueNode } from '@/types';
import { gameActions } from '@/state/game-store';

export interface NPCConfig {
  id: string;
  name: string;
  title: string;
  x: number;
  y: number;
  atlas: string;
  frame: string;
  dialogue: DialogueNode;
}

export class NPC extends Phaser.Physics.Arcade.Sprite {
  public npcConfig: NPCConfig;
  private promptIcon: Phaser.GameObjects.Text;
  private isNearPlayer = false;

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    super(scene, config.x, config.y, config.atlas, config.frame);
    this.npcConfig = config;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    this.setDisplaySize(32, 42);
    this.setDepth(config.y + 16);

    // Floating interaction prompt above head — a keycap affordance, not an emoji.
    this.promptIcon = scene.add.text(config.x, config.y - 32, '[E] Talk', {
      fontFamily: 'Zen Kaku Gothic New, sans-serif',
      fontSize: '11px',
      color: '#f7f4ed',
      backgroundColor: '#1c2720dd',
      padding: { x: 6, y: 3 },
    });
    this.promptIcon.setOrigin(0.5);
    this.promptIcon.setDepth(1000);
    this.promptIcon.setVisible(false);

    // Subtle gentle breathing float
    scene.tweens.add({
      targets: this.promptIcon,
      y: config.y - 36,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public checkPlayerProximity(playerX: number, playerY: number, interactPressed: boolean): void {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const wasNear = this.isNearPlayer;
    this.isNearPlayer = dist < 48;

    if (this.isNearPlayer !== wasNear) {
      this.promptIcon.setVisible(this.isNearPlayer);
    }

    if (this.isNearPlayer && interactPressed) {
      gameActions.openDialogue(this.npcConfig.dialogue);
    }
  }

  public destroy(fromScene?: boolean): void {
    this.promptIcon.destroy();
    super.destroy(fromScene);
  }
}
