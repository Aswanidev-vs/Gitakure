/**
 * Farmland: paddy, vegetable beds, a farmhouse and the animals that live off
 * both. The rice is planted in standing water; the vegetables are not.
 */

import type { TerrainId } from '@/art/tiles/terrain';
import { WorldScene, type WorldOptions } from './WorldScene';
import { scatter, type AnimalPlacement, type CropPlacement, type FloraPlacement, type PropPlacement, type WorldSpec } from '@/world/Scenery';

const W = 30;
const H = 22;

function buildFarmlandMap(): WorldSpec {
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

  rect(0, 0, W - 1, 1, 'grass_tall');
  rect(0, H - 2, W - 1, H - 1, 'grass_tall');
  rect(0, 0, 1, H - 1, 'grass_tall');
  rect(W - 2, 0, W - 1, H - 1, 'grass_tall');

  // Paddy in standing water, vegetables in tilled soil.
  rect(4, 4, 12, 9, 'paddy');
  rect(5, 5, 11, 8, 'paddy_water');
  rect(14, 4, 22, 9, 'paddy');
  rect(15, 5, 21, 8, 'paddy_water');
  rect(6, 12, 20, 17, 'soil');
  for (let y = 12; y <= 17; y += 2) rect(6, y, 20, y, 'soil_wet');

  rect(2, 19, W - 3, 19, 'path');
  rect(2, 10, W - 3, 10, 'dirt');
  rect(13, 19, 13, 21, 'path');
  rect(25, 12, 26, 18, 'path');

  const props: PropPlacement[] = [
    { tx: 3, ty: 3, id: 'farmhouse', verb: 'Enter', label: 'Farmhouse', lines: ['A long room, a low table, and the smell of rice cooking somewhere behind the wall.'] },
    { tx: 23, ty: 3, id: 'barn', verb: 'Enter', label: 'Seed barn', lines: ['Sacks stacked to the beams. Every one is labelled in the same careful hand.'] },
    { tx: 24, ty: 11, id: 'greenhouse', verb: 'Enter', label: 'Greenhouse', lines: ['Warm, wet air. Seedlings in trays, each with a name and a date.'] },
    { tx: 14, ty: 10, id: 'well', verb: 'Draw water', label: 'Field well', lines: ['The water is cold enough to ache. A gourd floats at the edge, waiting.'] },
    { tx: 8, ty: 16, id: 'workbench', verb: 'Use', label: 'Workbench', lines: ['A hoe with a new handle, a sickle being sharpened, and a coil of irrigation line.'] },
    { tx: 12, ty: 18, id: 'signpost', verb: 'Read', label: 'Field sign', lines: ['Paddy, this side. Vegetables, that side. Do not walk on the bunds.'] },
  ];

  const flora: FloraPlacement[] = [
    { tx: 4, ty: 18, id: 'banana' },
    { tx: 22, ty: 18, id: 'banana' },
    { tx: 2, ty: 12, id: 'coconut' },
    { tx: 27, ty: 18, id: 'coconut' },
    { tx: 28, ty: 12, id: 'mango' },
    { tx: 2, ty: 6, id: 'mango' },
  ];
  const ground: FloraPlacement[] = [
    ...scatter(5101, 10, W, H, (x, y) => g[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'grass_tuft' as const })),
    ...scatter(5102, 6, W, H, (x, y) => g[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'flowers' as const })),
  ];

  const crops: CropPlacement[] = [];
  const kinds = ['tomato', 'carrot', 'potato', 'cabbage', 'strawberry'] as const;
  for (let y = 13; y <= 17; y += 2) {
    for (let x = 7; x <= 19; x += 2) {
      crops.push({ tx: x, ty: y, crop: kinds[(x + y) % kinds.length]!, stage: 2 + ((x + y) % 3) });
    }
  }

  const animals: AnimalPlacement[] = [
    { tx: 12, ty: 14, id: 'cow', radius: 3 },
    { tx: 17, ty: 14, id: 'goat', radius: 2 },
    { tx: 19, ty: 15, id: 'sheep', radius: 2 },
    { tx: 9, ty: 18, id: 'chicken', radius: 2 },
    { tx: 10, ty: 19, id: 'chicken', radius: 2 },
    { tx: 15, ty: 11, id: 'butterfly', radius: 2, ambient: true },
    { tx: 6, ty: 16, id: 'butterfly', radius: 2, ambient: true },
  ];

  return {
    key: 'FarmlandScene',
    width: W,
    height: H,
    tiles: g,
    spawn: { tx: 4, ty: 19 },
    props,
    flora: [...flora, ...ground],
    animals,
    crops,
    lights: [
      { tx: 8, ty: 6, radius: 60, color: '#f2c078', intensity: 0.4 },
      { tx: 26, ty: 6, radius: 50, color: '#f2c078', intensity: 0.35 },
      { tx: 25, ty: 13, radius: 50, color: '#f2c078', intensity: 0.35 },
    ],
    ambience: 'farm',
    dayNight: true,
    weather: true,
    startMinutes: 8 * 60,
  };
}

export class FarmlandScene extends WorldScene {
  constructor() {
    const options: WorldOptions = {
      ...buildFarmlandMap(),
      location: 'farmland',
      npcs: true,
      sync: false,
      save: true,
      music: 'farmland',
    };
    super(options);
  }
}