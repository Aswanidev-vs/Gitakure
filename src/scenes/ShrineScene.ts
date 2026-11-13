/**
 * Shrine and ruins: a stone stair, a gate older than the village, and a hillside
 * that keeps the milestones the village has forgotten.
 */

import type { TerrainId } from '@/art/tiles/terrain';
import { WorldScene, type WorldOptions } from './WorldScene';
import { scatter, type AnimalPlacement, type FloraPlacement, type PropPlacement, type WorldSpec } from '@/world/Scenery';

const W = 24;
const H = 20;

function buildShrineMap(): WorldSpec {
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

  rect(8, 2, 15, 9, 'cobble');
  rect(9, 3, 14, 8, 'stone_floor');
  rect(11, 9, 12, 17, 'stone');
  rect(6, 10, 17, 10, 'stone');
  rect(11, 17, 12, 18, 'path');

  // Worn patches in the moss.
  for (let y = 11; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (g[y]![x] === 'grass' && (x * 7 + y * 13) % 11 === 0) set(x, y, 'grass_flowers');
    }
  }

  const props: PropPlacement[] = [
    { tx: 10, ty: 2, id: 'shrine', verb: 'Pray', label: 'Hillside shrine', lines: ['The offering box is full of small coins and smaller stones. You add a quiet minute instead.'] },
    { tx: 11, ty: 6, id: 'torii', verb: 'Bow', label: 'Torii gate', lines: ['The gate leans a little east. It has been leaning for a long time, and it is still standing.'] },
    { tx: 8, ty: 9, id: 'stone_lantern', verb: 'Examine', label: 'Stone lantern', lines: ['The light inside is a stub of candle, sheltered from the wind by the stone.'] },
    { tx: 15, ty: 9, id: 'stone_lantern', verb: 'Examine', label: 'Stone lantern', lines: ['Someone has left a fresh wick and a dry matchbox. The village looks after this place.'] },
    { tx: 7, ty: 12, id: 'ruin_pillar', verb: 'Examine', label: 'Fallen pillar', lines: ['A pillar, a capital, and a piece of roof tile. Whatever stood here was grander than the shrine.'] },
    { tx: 16, ty: 12, id: 'ruin_pillar', verb: 'Examine', label: 'Standing pillar', lines: ['The carving is a knot of roots, or a river delta, or a family tree. It is hard to say.'] },
    { tx: 7, ty: 15, id: 'ruin_pillar', verb: 'Examine', label: 'Broken pillar', lines: ['Moss has taken the top third. The stone underneath is warm.'] },
    { tx: 14, ty: 14, id: 'stone_marker', verb: 'Examine', label: 'Milestone stone', lines: ['A date, a number of commits, and a line worn down to a suggestion. The world remembers in its own way.'] },
    { tx: 9, ty: 13, id: 'campfire', verb: 'Rest', label: 'Pilgrim’s fire', lines: ['A small fire, carefully banked. Whoever lit it meant to come back.'] },
    { tx: 17, ty: 6, id: 'lantern', solid: false },
    { tx: 6, ty: 6, id: 'lantern', solid: false },
  ];

  const flora: FloraPlacement[] = [
    { tx: 4, ty: 4, id: 'cherry' },
    { tx: 19, ty: 4, id: 'cherry' },
    { tx: 4, ty: 15, id: 'cherry' },
    { tx: 19, ty: 15, id: 'maple' },
    { tx: 3, ty: 9, id: 'bamboo' },
    { tx: 20, ty: 9, id: 'bamboo' },
    { tx: 6, ty: 17, id: 'pine' },
    { tx: 17, ty: 17, id: 'pine' },
  ];
  const ground: FloraPlacement[] = [
    ...scatter(6102, 12, W, H, (x, y) => g[y]![x] === 'grass' || g[y]![x] === 'grass_flowers').map((p) => ({ tx: p.tx, ty: p.ty, id: 'fern' as const })),
    ...scatter(6103, 8, W, H, (x, y) => g[y]![x] === 'grass' || g[y]![x] === 'grass_flowers').map((p) => ({ tx: p.tx, ty: p.ty, id: 'flowers' as const })),
    ...scatter(6104, 10, W, H, (x, y) => g[y]![x] === 'grass' || g[y]![x] === 'grass_flowers').map((p) => ({ tx: p.tx, ty: p.ty, id: 'grass_tuft' as const })),
  ];

  const animals: AnimalPlacement[] = [
    { tx: 12, ty: 14, id: 'cat', radius: 3 },
    { tx: 9, ty: 16, id: 'firefly', radius: 3, ambient: true },
    { tx: 15, ty: 16, id: 'firefly', radius: 3, ambient: true },
    { tx: 6, ty: 12, id: 'butterfly', radius: 2, ambient: true },
    { tx: 17, ty: 12, id: 'butterfly', radius: 2, ambient: true },
  ];

  return {
    key: 'ShrineScene',
    width: W,
    height: H,
    tiles: g,
    spawn: { tx: 11, ty: 17 },
    props,
    flora: [...flora, ...ground],
    animals,
    lights: [
      { tx: 11, ty: 5, radius: 80, color: '#f2c078', intensity: 0.6 },
      { tx: 8, ty: 9, radius: 36, color: '#f2c078', intensity: 0.4 },
      { tx: 15, ty: 9, radius: 36, color: '#f2c078', intensity: 0.4 },
      { tx: 17, ty: 6, radius: 46, color: '#f2c078', intensity: 0.4 },
      { tx: 6, ty: 6, radius: 46, color: '#f2c078', intensity: 0.4 },
      { tx: 9, ty: 13, radius: 70, color: '#f2c078', intensity: 0.55 },
    ],
    ambience: 'shrine',
    dayNight: true,
    weather: true,
    startMinutes: 8 * 60,
  };
}

export class ShrineScene extends WorldScene {
  constructor() {
    const options: WorldOptions = {
      ...buildShrineMap(),
      location: 'shrine',
      npcs: true,
      sync: false,
      save: true,
      music: 'shrine',
    };
    super(options);
  }
}