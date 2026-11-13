import { createGame } from '@/core/Game';
import { CONFIG } from '@/core/Config';
import { BootScene } from '@/scenes/BootScene';
import { LoadingScene } from '@/scenes/LoadingScene';
import { MainMenuScene } from '@/scenes/MainMenuScene';
import { VillageScene } from '@/scenes/VillageScene';
import { ForestScene } from '@/scenes/ForestScene';
import { RiversideScene } from '@/scenes/RiversideScene';
import { FarmlandScene } from '@/scenes/FarmlandScene';
import { ShrineScene } from '@/scenes/ShrineScene';

const root = document.getElementById('game-root');
if (!root) throw new Error('Missing #game-root');

const game = createGame('game-root');

game.scene.add(CONFIG.scenes.boot, BootScene, false);
game.scene.add(CONFIG.scenes.loading, LoadingScene, false);
game.scene.add(CONFIG.scenes.menu, MainMenuScene, false);
game.scene.add(CONFIG.scenes.village, VillageScene, false);
game.scene.add('ForestScene', ForestScene, false);
game.scene.add('RiversideScene', RiversideScene, false);
game.scene.add('FarmlandScene', FarmlandScene, false);
game.scene.add('ShrineScene', ShrineScene, false);

game.scene.start(CONFIG.scenes.boot);

if (import.meta.env.DEV) {
  (window as unknown as { __game: unknown }).__game = game;
}