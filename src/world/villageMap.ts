/**
 * The Secluded Village map.
 *
 * The layout is a compact, walkable square: player's house and two neighbours
 * to the west, shop and tea house to the east, shrine on the northern rise, a
 * pond and stream to the east, and paddy beds to the south-west. Paths connect
 * everything so the village reads at a glance and still has corners to turn.
 */

import type { TerrainId } from '@/art/tiles/terrain';
import { mulberry32 } from '@/art/PixelCanvas';
import { scatter, type AnimalPlacement, type CropPlacement, type FloraPlacement, type LightPlacement, type PropPlacement, type WorldSpec } from './Scenery';

const W = 40;
const H = 30;

const LANTERNS: { tx: number; ty: number }[] = [
  { tx: 15, ty: 15 },
  { tx: 25, ty: 15 },
  { tx: 19, ty: 10 },
  { tx: 19, ty: 22 },
  { tx: 28, ty: 16 },
  { tx: 30, ty: 14 },
];

const PROPS: PropPlacement[] = [
  {
    tx: 11, ty: 9, id: 'house_player', verb: 'Enter', label: 'Your house',
    lines: ['The door is warm. A kettle is somewhere inside, and the window faces the fields.'],
  },
  {
    tx: 4, ty: 8, id: 'house_small', verb: 'Knock', label: "Ilaya's house",
    lines: ['A radio murmurs behind the door. Nobody answers, but the step has been swept this morning.'],
  },
  {
    tx: 4, ty: 18, id: 'house_small', verb: 'Knock', label: "Kannan's house",
    lines: ['The smell of cardamom and cut grass. A bicycle leans against the wall.'],
  },
  {
    tx: 24, ty: 8, id: 'shop', verb: 'Browse', label: 'Village shop',
    lines: ['Jars of nails, seed packets, and a hand-written list of who owes what. The shopkeeper is out back.'],
  },
  {
    tx: 25, ty: 21, id: 'house_medium', verb: 'Enter', label: 'Tea house',
    lines: ['Low tables, a kettle that never quite stops, and a window full of rain.'],
  },
  {
    tx: 18, ty: 2, id: 'shrine', verb: 'Pray', label: 'Hillside shrine',
    lines: ['The bell rope is worn smooth. You leave a little quiet here and take some with you.'],
  },
  {
    tx: 19, ty: 6, id: 'torii', verb: 'Bow', label: 'Torii gate',
    lines: ['The gate is older than the path beneath it. Moss has made a home in the grain.'],
  },
  {
    tx: 18, ty: 12, id: 'noticeboard', verb: 'Read', label: 'Noticeboard',
    lines: ['A list of who is minding whose goats, a lost cat, and a note about the river being high.'],
  },
  {
    tx: 20, ty: 15, id: 'well', verb: 'Draw water', label: 'Old well',
    lines: ['The rope is cold. Somewhere far below, the water answers with a small, round sound.'],
  },
  {
    tx: 17, ty: 18, id: 'bench', verb: 'Sit', label: 'Bench',
    lines: ['You sit for a moment. The square is doing what squares do: nothing, beautifully.'],
  },
  {
    tx: 23, ty: 18, id: 'bench', verb: 'Sit', label: 'Bench',
    lines: ['From here you can see the whole valley, or at least the part of it that matters today.'],
  },
  {
    tx: 22, ty: 12, id: 'market_stall', verb: 'Browse', label: 'Market stall',
    lines: ['Mangoes, bananas, a bundle of curry leaves, and a scale that has been repaired more than once.'],
  },
  {
    tx: 21, ty: 24, id: 'signpost', verb: 'Read', label: 'Signpost',
    lines: ['Riverside, this way. Farmland, that way. Forest, if you must. The paint is newer than the wood.'],
  },
  {
    tx: 27, ty: 22, id: 'campfire', verb: 'Rest', label: 'Campfire',
    lines: ['Someone has kept this fire going. The stones around it are warm, and there is room for one more.'],
  },
  {
    tx: 8, ty: 20, id: 'well', verb: 'Draw water', label: 'Farm well',
    lines: ['The paddy needs this water more than you do. The bucket comes up cold and green at the edges.'],
  },
  {
    tx: 2, ty: 22, id: 'barn', verb: 'Enter', label: 'Store barn',
    lines: ['Sacks of paddy, a ladder to the loft, and the particular silence of a room full of stored weather.'],
  },
  ...LANTERNS.map<PropPlacement>((l) => ({ tx: l.tx, ty: l.ty, id: 'lantern', solid: false, noShadow: false })),
  { tx: 17, ty: 7, id: 'stone_lantern', verb: 'Examine', label: 'Stone lantern', lines: ['A small light left burning for whoever comes up the hill after dark.'] },
  { tx: 22, ty: 7, id: 'stone_lantern', verb: 'Examine', label: 'Stone lantern', lines: ['Rain has darkened the carving. It is still doing its job.'] },
  { tx: 10, ty: 13, id: 'flower_pot', solid: false, noShadow: true },
  { tx: 15, ty: 13, id: 'flower_pot', solid: false, noShadow: true },
  { tx: 23, ty: 10, id: 'crate', verb: 'Search', label: 'Crate', lines: ['Empty bottles, a coil of twine, and a receipt for something called a “longan”.'] },
  { tx: 22, ty: 10, id: 'barrel', verb: 'Search', label: 'Rain barrel', lines: ['The water is full and still. A mosquito larva turns over, slowly, and hides.'] },
];

const FARM_CROPS: CropPlacement[] = (() => {
  const crops: CropPlacement[] = [];
  const kinds = ['rice', 'tomato', 'carrot', 'cabbage'] as const;
  for (let y = 23; y <= 26; y++) {
    for (let x = 7; x <= 13; x++) {
      const kind = kinds[(x + y) % kinds.length]!;
      const stage = 1 + ((x * 3 + y) % 4);
      crops.push({ tx: x, ty: y, crop: kind, stage });
    }
  }
  return crops;
})();

const FLORA: FloraPlacement[] = [
  { tx: 8, ty: 6, id: 'cherry' },
  { tx: 14, ty: 6, id: 'cherry' },
  { tx: 27, ty: 5, id: 'cherry' },
  { tx: 35, ty: 12, id: 'cherry' },
  { tx: 12, ty: 24, id: 'cherry' },
  { tx: 3, ty: 13, id: 'coconut' },
  { tx: 5, ty: 14, id: 'coconut' },
  { tx: 33, ty: 21, id: 'coconut' },
  { tx: 28, ty: 26, id: 'coconut' },
  { tx: 25, ty: 25, id: 'mango' },
  { tx: 36, ty: 24, id: 'mango' },
  { tx: 3, ty: 4, id: 'bamboo' },
  { tx: 4, ty: 5, id: 'bamboo' },
  { tx: 3, ty: 6, id: 'bamboo' },
  { tx: 34, ty: 4, id: 'bamboo' },
  { tx: 7, ty: 19, id: 'banana' },
  { tx: 13, ty: 24, id: 'banana' },
  { tx: 10, ty: 3, id: 'pine' },
  { tx: 29, ty: 3, id: 'pine' },
  { tx: 23, ty: 4, id: 'maple' },
  { tx: 36, ty: 8, id: 'maple' },
];

const ANIMALS: AnimalPlacement[] = [
  { tx: 20, ty: 18, id: 'cat', radius: 3 },
  { tx: 14, ty: 15, id: 'dog', radius: 4 },
  { tx: 9, ty: 22, id: 'chicken', radius: 2 },
  { tx: 10, ty: 24, id: 'chicken', radius: 2 },
  { tx: 8, ty: 23, id: 'chicken', radius: 2 },
  { tx: 31, ty: 13, id: 'duck', radius: 2 },
  { tx: 30, ty: 12, id: 'frog', radius: 1 },
  { tx: 12, ty: 14, id: 'butterfly', radius: 2, ambient: true },
  { tx: 22, ty: 13, id: 'butterfly', radius: 2, ambient: true },
  { tx: 8, ty: 20, id: 'butterfly', radius: 2, ambient: true },
  { tx: 18, ty: 19, id: 'firefly', radius: 3, ambient: true },
  { tx: 26, ty: 17, id: 'firefly', radius: 3, ambient: true },
];

function buildTerrain(): TerrainId[][] {
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

  // Meadow variation, then the hedge that closes the valley.
  const rnd = mulberry32(4471);
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (rnd() < 0.055) set(x, y, 'grass_flowers');
    }
  }
  rect(0, 0, W - 1, 1, 'grass_tall');
  rect(0, H - 2, W - 1, H - 1, 'grass_tall');
  rect(0, 0, 1, H - 1, 'grass_tall');
  rect(W - 2, 0, W - 1, H - 1, 'grass_tall');

  // Pond and stream.
  const pond = (cx: number, cy: number, rx: number, ry: number): void => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d <= 1) set(x, y, d > 0.72 ? 'water_edge' : d > 0.38 ? 'water' : 'water_deep');
      }
    }
  };
  pond(32, 8, 3.4, 3.1);
  for (let y = 11; y <= 27; y++) {
    set(31, y, 'water_edge');
    set(32, y, 'water_deep');
    set(33, y, 'water_edge');
  }

  // Main east-west path, north-south path, and the plaza.
  rect(3, 16, 36, 17, 'path');
  rect(19, 4, 20, 27, 'path');
  rect(10, 13, 19, 13, 'path');
  rect(20, 12, 28, 12, 'path');
  rect(6, 21, 14, 21, 'path');

  rect(16, 12, 24, 19, 'cobble');
  rect(16, 12, 24, 12, 'stone');
  rect(16, 19, 24, 19, 'stone');
  rect(16, 13, 16, 18, 'stone');
  rect(24, 13, 24, 18, 'stone');

  // Shrine terrace.
  rect(16, 3, 23, 8, 'cobble');
  rect(18, 3, 21, 6, 'stone_floor');
  rect(19, 7, 20, 11, 'stone');

  // Paddy beds.
  rect(7, 23, 13, 26, 'soil');
  for (let y = 23; y <= 26; y += 2) rect(7, y, 13, y, 'soil_wet');

  // Doorsteps and aprons.
  rect(12, 12, 14, 12, 'dirt');
  rect(5, 10, 7, 10, 'dirt');
  rect(5, 20, 7, 20, 'dirt');
  rect(25, 11, 27, 11, 'dirt');
  rect(26, 24, 28, 24, 'dirt');
  rect(3, 24, 5, 24, 'dirt');

  return g;
}

function isFree(x: number, y: number): boolean {
  const blocked = [
    [9, 8, 16, 14],
    [3, 7, 8, 11],
    [3, 17, 8, 21],
    [23, 7, 29, 12],
    [24, 20, 30, 25],
    [16, 2, 23, 8],
    [1, 21, 6, 25],
    [15, 11, 25, 20],
    [5, 20, 15, 27],
  ];
  for (const [x0, y0, x1, y1] of blocked) {
    if (x >= x0! && x <= x1! && y >= y0! && y <= y1!) return false;
  }
  return true;
}

export function buildVillageMap(): WorldSpec {
  const tiles = buildTerrain();

  const groundCover: FloraPlacement[] = [
    ...scatter(9001, 16, W, H, (x, y) => isFree(x, y) && tiles[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'flowers' as const })),
    ...scatter(9002, 24, W, H, (x, y) => isFree(x, y) && tiles[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'grass_tuft' as const })),
    ...scatter(9003, 9, W, H, (x, y) => isFree(x, y) && tiles[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'fern' as const })),
    ...scatter(9004, 7, W, H, (x, y) => isFree(x, y) && tiles[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'bush' as const })),
    ...scatter(9005, 5, W, H, (x, y) => isFree(x, y) && tiles[y]![x] === 'grass').map((p) => ({ tx: p.tx, ty: p.ty, id: 'mushroom' as const })),
  ];

  const lights: LightPlacement[] = [
    ...LANTERNS.map((l) => ({ tx: l.tx, ty: l.ty, radius: 58, color: '#f2c078', intensity: 0.55 })),
    { tx: 17, ty: 7, radius: 34, color: '#f2c078', intensity: 0.4 },
    { tx: 22, ty: 7, radius: 34, color: '#f2c078', intensity: 0.4 },
    { tx: 13, ty: 11, radius: 46, color: '#f2c078', intensity: 0.35 },
    { tx: 26, ty: 10, radius: 46, color: '#f2c078', intensity: 0.35 },
  ];

  return {
    key: 'VillageScene',
    width: W,
    height: H,
    tiles,
    spawn: { tx: 20, ty: 18 },
    props: PROPS,
    flora: [...FLORA, ...groundCover],
    animals: ANIMALS,
    lights,
    crops: FARM_CROPS,
    ambience: 'village',
    dayNight: true,
    weather: true,
    zoom: 1,
    startMinutes: 8 * 60,
  };
}