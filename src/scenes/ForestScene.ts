/**
 * Bamboo forest: a darker, tighter map with a deer trail, a hermit's camp and
 * a pond that the village path forgot.
 */

import type { TerrainId } from '@/art/tiles/terrain';
import { mulberry32 } from '@/art/PixelCanvas';
import { WorldScene, type WorldOptions } from './WorldScene';
import { scatter, type AnimalPlacement, type FloraPlacement, type PropPlacement, type WorldSpec } from '@/world/Scenery';

const W = 32;
const H = 24;

function buildForestMap(): WorldSpec {
  const g: TerrainId[][] = [];
  for (let y = 0; y < H; y++) {
    const row: TerrainId[] = [];
    for (let x = 0; x < W; x++) row.push('grass');
    g.push(row);
  }
  const set = (x: number, y: number, id: TerrainId): void => {
    if (x >= 0 && y >= 0 && x < W && y < H) g[y]![x] = id;
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) set(x, y, 'grass_tall');
      else if (mulberry32(x * 73 + y * 131)() < 0.16) set(x, y, 'grass_tall');
    }
  }

  // A winding trail from the village to the eastern thicket.
  for (let x = 2; x < W - 2; x++) {
    const y = Math.round(12 + Math.sin(x / 3) * 2);
    set(x, y, 'path');
    set(x, y + 1, 'path');
    if (x % 5 === 0) {
      set(x, y - 1, 'dirt');
      set(x, y + 2, 'dirt');
    }
  }
  // Hermit's clearing.
  for (let y = 8; y <= 14; y++) for (let x = 13; x <= 19; x++) set(x, y, 'dirt');
  for (let y = 9; y <= 13; y++) for (let x = 14; x <= 18; x++) set(x, y, 'grass');

  // Pond.
  for (let y = 4; y <= 7; y++) {
    for (let x = 24; x <= 28; x++) {
      const d = ((x - 26) / 2.6) ** 2 + ((y - 5.5) / 1.8) ** 2;
      if (d <= 1) set(x, y, d > 0.6 ? 'water_edge' : d > 0.3 ? 'water' : 'water_deep');
    }
  }

  const props: PropPlacement[] = [
    { tx: 16, ty: 10, id: 'campfire', verb: 'Rest', label: "Hermit's fire", lines: ['A pot of something dark and good. The hermit is not here, but the fire is.'] },
    { tx: 8, ty: 8, id: 'ruin_pillar', verb: 'Examine', label: 'Broken pillar', lines: ['A pillar with no building left to hold up. Someone has stacked flat stones at its foot.'] },
    { tx: 9, ty: 8, id: 'ruin_pillar', verb: 'Examine', label: 'Broken pillar', lines: ['The carving is a river, or a road, or a very patient snake.'] },
    { tx: 20, ty: 16, id: 'stone_marker', verb: 'Examine', label: 'Mossy marker', lines: ['The letters have gone soft. A date, maybe, and a name that starts with K.'] },
    { tx: 4, ty: 12, id: 'signpost', verb: 'Read', label: 'Trail sign', lines: ['Village, back the way you came. River, if the bridge is still there.'] },
    { tx: 15, ty: 12, id: 'bench', verb: 'Sit', label: 'Fallen log', lines: ['The log is soft with moss. You sit anyway.'] },
    { tx: 17, ty: 11, id: 'crate', verb: 'Search', label: 'Hermit’s crate', lines: ['Jars of dried mushrooms, a stub of pencil, and a book with no cover.'] },
    { tx: 18, ty: 11, id: 'barrel', verb: 'Search', label: 'Rain barrel', lines: ['Full to the brim. A ring of leaves floats on top like a small, green island.'] },
    { tx: 25, ty: 9, id: 'lantern', solid: false },
  ];

  const flora: FloraPlacement[] = [
    { tx: 5, ty: 5, id: 'bamboo' },
    { tx: 6, ty: 6, id: 'bamboo' },
    { tx: 5, ty: 7, id: 'bamboo' },
    { tx: 7, ty: 4, id: 'bamboo' },
    { tx: 22, ty: 18, id: 'bamboo' },
    { tx: 23, ty: 17, id: 'bamboo' },
    { tx: 10, ty: 5, id: 'pine' },
    { tx: 12, ty: 6, id: 'pine' },
    { tx: 26, ty: 10, id: 'pine' },
    { tx: 8, ty: 18, id: 'pine' },
    { tx: 20, ty: 5, id: 'maple' },
    { tx: 27, ty: 15, id: 'maple' },
    { tx: 6, ty: 15, id: 'cherry' },
    { tx: 24, ty: 20, id: 'cherry' },
  ];

  const ground: FloraPlacement[] = [
    ...scatter(3101, 20, W, H, (x, y) => g[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'fern' as const })),
    ...scatter(3102, 18, W, H, (x, y) => g[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'mushroom' as const })),
    ...scatter(3103, 10, W, H, (x, y) => g[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'bush' as const })),
    ...scatter(3104, 16, W, H, (x, y) => g[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'grass_tuft' as const })),
  ];

  const animals: AnimalPlacement[] = [
    { tx: 18, ty: 8, id: 'deer', radius: 4 },
    { tx: 10, ty: 14, id: 'rabbit', radius: 2 },
    { tx: 26, ty: 6, id: 'fox', radius: 3 },
    { tx: 25, ty: 8, id: 'frog', radius: 1 },
    { tx: 12, ty: 10, id: 'butterfly', radius: 2, ambient: true },
    { tx: 14, ty: 13, id: 'firefly', radius: 3, ambient: true },
    { tx: 21, ty: 20, id: 'firefly', radius: 3, ambient: true },
  ];

  return {
    key: 'ForestScene',
    width: W,
    height: H,
    tiles: g,
    spawn: { tx: 3, ty: 12 },
    props,
    flora: [...flora, ...ground],
    animals,
    lights: [{ tx: 16, ty: 10, radius: 70, color: '#f2c078', intensity: 0.6 }],
    ambience: 'forest',
    dayNight: true,
    weather: true,
    startMinutes: 8 * 60,
  };
}

export class ForestScene extends WorldScene {
  constructor() {
    const options: WorldOptions = {
      ...buildForestMap(),
      location: 'forest',
      npcs: true,
      sync: false,
      save: true,
      music: 'forest',
    };
    super(options);
  }
}