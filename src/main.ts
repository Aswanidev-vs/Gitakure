import { createGame } from '@/core/Game';
import { CONFIG } from '@/core/Config';
import { BootScene } from '@/scenes/BootScene';
import { AttractScene } from '@/scenes/AttractScene';
import { VillageScene } from '@/scenes/VillageScene';
import { ForestScene } from '@/scenes/ForestScene';
import { RiversideScene } from '@/scenes/RiversideScene';
import { FarmlandScene } from '@/scenes/FarmlandScene';
import { ShrineScene } from '@/scenes/ShrineScene';
import { HideawayScene } from '@/scenes/HideawayScene';
import { device } from '@/core/Device';
import { settings } from '@/core/Settings';

const root = document.getElementById('game-root');
if (!root) throw new Error('Missing #game-root');

// Decide desktop or touch before the first scene is created, so no scene ever
// mounts the wrong controls and then swaps them out.
device.start();
applyDocumentTheme();

const game = createGame('game-root');

game.scene.add(CONFIG.scenes.boot, BootScene, false);
game.scene.add(CONFIG.scenes.attract, AttractScene, false);
game.scene.add(CONFIG.scenes.village, VillageScene, false);
game.scene.add('ForestScene', ForestScene, false);
game.scene.add('RiversideScene', RiversideScene, false);
game.scene.add('FarmlandScene', FarmlandScene, false);
game.scene.add('ShrineScene', ShrineScene, false);
game.scene.add('HideawayScene', HideawayScene, false);

game.scene.start(CONFIG.scenes.boot);

function applyDocumentTheme(): void {
  const el = document.documentElement;
  el.dataset.input = device.get().mode;
  el.dataset.motion = settings.get().reducedMotion ? 'reduced' : 'full';
  device.subscribe((p) => {
    el.dataset.input = p.mode;
  });
  settings.subscribe((s) => {
    el.dataset.motion = s.reducedMotion ? 'reduced' : 'full';
  });
}

// The DOM screens are created by the attract scene; the static shell in
// index.html carries the first paint until then.
if (import.meta.env.DEV) {
  (window as unknown as { __game: unknown }).__game = game;
}