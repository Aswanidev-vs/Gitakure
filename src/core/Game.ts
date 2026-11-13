import Phaser from 'phaser';
import { CONFIG } from './Config';

export function createGame(parent: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    parent,
    width: CONFIG.width,
    height: CONFIG.height,
    zoom: 1,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    backgroundColor: '#141019',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      min: {
        width: CONFIG.width,
        height: CONFIG.height,
      },
    },
    scene: [],
  };
  return new Phaser.Game(config);
}