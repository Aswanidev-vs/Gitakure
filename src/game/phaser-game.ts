import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { IsoValleyScene } from './scenes/IsoValleyScene';

export function createPhaserGame(): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-root',
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#121815',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, IsoValleyScene],
  };

  return new Phaser.Game(config);
}
