/**
 * Riverside: a wide, slow river with a wooden bridge, fishing stones and a
 * bank path that runs the length of the map.
 */

import type { TerrainId } from '@/art/tiles/terrain';
import { WorldScene, type WorldOptions } from './WorldScene';
import { scatter, type AnimalPlacement, type FloraPlacement, type PropPlacement, type WorldSpec } from '@/world/Scenery';

const W = 32;
const H = 22;

function buildRiversideMap(): WorldSpec {
  const g: TerrainId[][] = [];
  for (let y = 0; y < H; y++) {
    const row: TerrainId[] = [];
    for (let x = 0; x < W; x++) row.push('grass');
    g.push(row);
  }
  const set = (x: number, y: number, id: TerrainId): void => {
    if (x >= 0 && y >= 0 && x < W && y < H) g[y]![x] = id;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, id: TerrainId): void => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, id);
  };

  rect(0, 0, W - 1, 2, 'grass_tall');
  rect(0, H - 2, W - 1, H - 1, 'grass_tall');
  rect(0, 0, 1, H - 1, 'grass_tall');
  rect(W - 2, 0, W - 1, H - 1, 'grass_tall');

  // River.
  rect(2, 9, W - 3, 13, 'water_edge');
  rect(2, 10, W - 3, 12, 'water');
  for (let x = 2; x < W - 2; x++) {
    if (x % 7 === 0) set(x, 11, 'water_deep');
  }
  rect(2, 9, W - 3, 9, 'water_edge');
  rect(2, 13, W - 3, 13, 'water_edge');

  // Bank paths and the bridge road.
  rect(2, 15, W - 3, 15, 'path');
  rect(2, 7, W - 3, 7, 'path');
  rect(14, 7, 15, 15, 'path');
  rect(10, 15, 10, 19, 'path');
  rect(20, 15, 20, 19, 'path');

  const props: PropPlacement[] = [
    { tx: 14, ty: 10, id: 'bridge_v', verb: 'Cross', label: 'River bridge', lines: ['The planks are silvered with age. Underneath, the river keeps its own counsel.'] },
    { tx: 12, ty: 8, id: 'signpost', verb: 'Read', label: 'River sign', lines: ['Fishing stones, upstream. The deep pool is downstream, and it is deeper than it looks.'] },
    { tx: 9, ty: 16, id: 'bench', verb: 'Sit', label: 'Bank bench', lines: ['You sit and watch the water go by. It is not going anywhere, and neither are you.'] },
    { tx: 24, ty: 14, id: 'campfire', verb: 'Rest', label: 'Angler’s fire', lines: ['A ring of stones, a little ash, and a stick with a fish on it. The fish is not for you.'] },
    { tx: 6, ty: 8, id: 'stone_marker', verb: 'Examine', label: 'River stone', lines: ['A flat stone with a line worn across it. A measure, maybe, for how high the water used to come.'] },
    { tx: 27, ty: 16, id: 'crate', verb: 'Search', label: 'Tackle box', lines: ['Hooks, line, a tin of something that used to be bait.'] },
    { tx: 13, ty: 9, id: 'lantern', solid: false },
    { tx: 16, ty: 9, id: 'lantern', solid: false },
    { tx: 13, ty: 13, id: 'lantern', solid: false },
    { tx: 16, ty: 13, id: 'lantern', solid: false },
  ];

  const flora: FloraPlacement[] = [
    { tx: 5, ty: 5, id: 'coconut' },
    { tx: 26, ty: 5, id: 'coconut' },
    { tx: 7, ty: 17, id: 'banana' },
    { tx: 23, ty: 18, id: 'banana' },
    { tx: 4, ty: 18, id: 'bamboo' },
    { tx: 28, ty: 18, id: 'bamboo' },
    { tx: 18, ty: 5, id: 'mango' },
    { tx: 9, ty: 18, id: 'mango' },
    { tx: 29, ty: 8, id: 'cherry' },
  ];
  const ground: FloraPlacement[] = [
    ...scatter(4101, 14, W, H, (x, y) => g[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'grass_tuft' as const })),
    ...scatter(4102, 8, W, H, (x, y) => g[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'fern' as const })),
    ...scatter(4103, 8, W, H, (x, y) => g[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'flowers' as const })),
  ];

  const animals: AnimalPlacement[] = [
    { tx: 11, ty: 11, id: 'duck', radius: 2 },
    { tx: 21, ty: 11, id: 'duck', radius: 2 },
    { tx: 18, ty: 12, id: 'frog', radius: 1 },
    { tx: 8, ty: 14, id: 'frog', radius: 1 },
    { tx: 12, ty: 16, id: 'butterfly', radius: 2, ambient: true },
    { tx: 24, ty: 6, id: 'butterfly', radius: 2, ambient: true },
    { tx: 10, ty: 18, id: 'firefly', radius: 3, ambient: true },
    { tx: 22, ty: 16, id: 'firefly', radius: 3, ambient: true },
  ];

  return {
    key: 'RiversideScene',
    width: W,
    height: H,
    tiles: g,
    spawn: { tx: 4, ty: 16 },
    props,
    flora: [...flora, ...ground],
    animals,
    lights: [
      { tx: 13, ty: 9, radius: 44, color: '#f2c078', intensity: 0.4 },
      { tx: 16, ty: 9, radius: 44, color: '#f2c078', intensity: 0.4 },
      { tx: 13, ty: 13, radius: 44, color: '#f2c078', intensity: 0.4 },
      { tx: 16, ty: 13, radius: 44, color: '#f2c078', intensity: 0.4 },
      { tx: 24, ty: 14, radius: 70, color: '#f2c078', intensity: 0.55 },
    ],
    ambience: 'water',
    dayNight: true,
    weather: true,
    startMinutes: 8 * 60,
  };
}

export class RiversideScene extends WorldScene {
  constructor() {
    const options: WorldOptions = {
      ...buildRiversideMap(),
      location: 'riverside',
      npcs: true,
      sync: false,
      save: true,
      music: 'riverside',
    };
    super(options);
  }
}