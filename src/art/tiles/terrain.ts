/**
 * Terrain tile painter.
 *
 * Every tile is 32x32 and drawn from the shared palette so a walkable village
 * path, a paddy bund and a shrine floor all look like they came from one world.
 * Tiles are painted with a little deterministic noise so large fields do not
 * look like flat wallpaper, but the noise is seeded — the same tile always
 * renders identically.
 */

import { PAL, mix, shade, tint } from '../palette';
import { mulberry32, PixelCanvas } from '../PixelCanvas';

export const TILE = 32;

export type TerrainId =
  | 'grass'
  | 'grass_flowers'
  | 'grass_tall'
  | 'dirt'
  | 'path'
  | 'stone'
  | 'cobble'
  | 'sand'
  | 'soil'
  | 'soil_wet'
  | 'paddy'
  | 'paddy_water'
  | 'mud'
  | 'water'
  | 'water_deep'
  | 'water_edge'
  | 'wood_floor'
  | 'tatami'
  | 'stone_floor'
  | 'cliff'
  | 'roof'
  | 'void';

interface TerrainSpec {
  base: string;
  /** Secondary flecks. */
  fleck: string;
  fleckDensity: number;
  /** Optional third tone, used sparingly. */
  accent?: string;
  accentDensity?: number;
  seed: number;
}

const SPECS: Record<TerrainId, TerrainSpec> = {
  grass: { base: PAL.grass, fleck: PAL.grassLit, fleckDensity: 0.1, accent: PAL.grassDark, accentDensity: 0.08, seed: 11 },
  grass_flowers: { base: PAL.grass, fleck: PAL.grassLit, fleckDensity: 0.08, accent: PAL.petal, accentDensity: 0.03, seed: 23 },
  grass_tall: { base: PAL.grassDark, fleck: PAL.grass, fleckDensity: 0.16, accent: PAL.grassLit, accentDensity: 0.07, seed: 31 },
  dirt: { base: PAL.soil, fleck: PAL.soilLit, fleckDensity: 0.13, accent: PAL.soilDark, accentDensity: 0.1, seed: 43 },
  path: { base: PAL.sand, fleck: PAL.parchmentDeep, fleckDensity: 0.11, accent: PAL.soilLit, accentDensity: 0.06, seed: 57 },
  stone: { base: PAL.stone, fleck: PAL.stoneLit, fleckDensity: 0.12, accent: PAL.stoneDark, accentDensity: 0.09, seed: 61 },
  cobble: { base: PAL.stoneDark, fleck: PAL.stone, fleckDensity: 0.14, accent: PAL.shadowSoft, accentDensity: 0.1, seed: 71 },
  sand: { base: PAL.sand, fleck: PAL.parchment, fleckDensity: 0.09, accent: PAL.parchmentDeep, accentDensity: 0.05, seed: 83 },
  soil: { base: PAL.soilDark, fleck: PAL.soil, fleckDensity: 0.15, accent: PAL.soilLit, accentDensity: 0.05, seed: 97 },
  soil_wet: { base: shade(PAL.soilDark, 0.25), fleck: PAL.soil, fleckDensity: 0.11, accent: PAL.waterDeep, accentDensity: 0.05, seed: 101 },
  paddy: { base: PAL.moss, fleck: PAL.leaf, fleckDensity: 0.13, accent: PAL.leafDark, accentDensity: 0.1, seed: 103 },
  paddy_water: { base: PAL.water, fleck: PAL.waterLit, fleckDensity: 0.09, accent: PAL.waterDeep, accentDensity: 0.07, seed: 107 },
  mud: { base: PAL.soilDark, fleck: PAL.soil, fleckDensity: 0.1, accent: PAL.waterDeep, accentDensity: 0.06, seed: 109 },
  water: { base: PAL.water, fleck: PAL.waterLit, fleckDensity: 0.07, accent: PAL.waterDeep, accentDensity: 0.06, seed: 113 },
  water_deep: { base: PAL.waterDeep, fleck: PAL.water, fleckDensity: 0.06, accent: PAL.ink, accentDensity: 0.05, seed: 127 },
  water_edge: { base: PAL.ripple, fleck: PAL.foam, fleckDensity: 0.1, accent: PAL.waterLit, accentDensity: 0.08, seed: 131 },
  wood_floor: { base: PAL.wood, fleck: PAL.woodLit, fleckDensity: 0.09, accent: PAL.woodDark, accentDensity: 0.08, seed: 137 },
  tatami: { base: PAL.parchmentDeep, fleck: PAL.parchment, fleckDensity: 0.1, accent: PAL.moss, accentDensity: 0.05, seed: 139 },
  stone_floor: { base: PAL.stone, fleck: PAL.stoneLit, fleckDensity: 0.08, accent: PAL.stoneDark, accentDensity: 0.06, seed: 149 },
  cliff: { base: PAL.cliff, fleck: PAL.shadowSoft, fleckDensity: 0.12, accent: PAL.shadowDeep, accentDensity: 0.12, seed: 151 },
  roof: { base: PAL.roof, fleck: PAL.roofLit, fleckDensity: 0.1, accent: PAL.roofDark, accentDensity: 0.1, seed: 157 },
  void: { base: PAL.ink, fleck: PAL.shadowDeep, fleckDensity: 0.05, seed: 163 },
};

/** Walkable tiles used by the collision layer. */
export const SOLID_TERRAIN: ReadonlySet<TerrainId> = new Set<TerrainId>([
  'water',
  'water_deep',
  'cliff',
  'void',
]);

/** Water tiles that still render as water but do not block. */
export const WATER_TERRAIN: ReadonlySet<TerrainId> = new Set<TerrainId>([
  'water',
  'water_deep',
  'paddy_water',
  'water_edge',
]);

/** Paints one terrain tile. Deterministic for a given id. */
export function paintTerrain(id: TerrainId): PixelCanvas {
  const spec = SPECS[id];
  const c = PixelCanvas.from(TILE, TILE, spec.base);
  const rnd = mulberry32(spec.seed);

  c.speckle(spec.seed, spec.fleck, spec.fleckDensity);
  if (spec.accent) c.speckle(spec.seed * 7 + 3, spec.accent, spec.accentDensity ?? 0.05);

  switch (id) {
    case 'grass':
    case 'grass_flowers':
    case 'grass_tall': {
      // Short blade clusters so grass reads as grass, not noise.
      for (let i = 0; i < 9; i++) {
        const x = Math.floor(rnd() * TILE);
        const y = Math.floor(rnd() * TILE);
        const len = 2 + Math.floor(rnd() * 2);
        const col = id === 'grass_tall' ? PAL.grassLit : PAL.grassDark;
        for (let k = 0; k < len; k++) c.px(x, y - k, col);
        if (id !== 'grass') c.px(x + 1, y - len + 1, mix(col, PAL.grassLit, 0.5));
      }
      if (id === 'grass_flowers') {
        const petals = [PAL.petal, PAL.blossomLit, PAL.accentSoft];
        for (let i = 0; i < 3; i++) {
          const x = 3 + Math.floor(rnd() * 26);
          const y = 3 + Math.floor(rnd() * 26);
          c.px(x, y, petals[Math.floor(rnd() * petals.length)]!);
        }
      }
      break;
    }
    case 'path':
    case 'sand': {
      // Pebbles.
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(rnd() * (TILE - 2));
        const y = Math.floor(rnd() * (TILE - 2));
        c.rect(x, y, 2, 1, mix(spec.fleck, PAL.parchment, 0.35));
        c.px(x, y + 1, shade(spec.fleck, 0.3));
      }
      break;
    }
    case 'stone':
    case 'cobble':
    case 'stone_floor': {
      // Flagstones: offset joints every 16px.
      for (let row = 0; row < 2; row++) {
        const oy = row * 16;
        const off = row % 2 === 0 ? 0 : 8;
        for (let bx = -1; bx < 3; bx++) {
          const x = bx * 16 + off;
          c.frame(x, oy, 16, 16, shade(spec.base, 0.28));
          c.hline(x + 1, oy + 1, 14, tint(spec.base, 0.14));
        }
      }
      break;
    }
    case 'wood_floor': {
      for (let row = 0; row < 4; row++) {
        const y = row * 8;
        c.hline(0, y, TILE, PAL.woodDark);
        c.hline(0, y + 1, TILE, mix(PAL.wood, PAL.woodLit, 0.3));
        const seam = (row % 2 === 0 ? 10 : 22) + Math.floor(rnd() * 4);
        c.vline(seam, y + 1, 7, PAL.woodDark);
      }
      break;
    }
    case 'tatami': {
      c.rect(0, 0, TILE, TILE, PAL.parchmentDeep);
      for (let y = 0; y < TILE; y += 2) c.hline(0, y, TILE, mix(PAL.parchmentDeep, PAL.moss, 0.16));
      c.frame(0, 0, TILE, TILE, shade(PAL.parchmentDeep, 0.42));
      c.hline(0, 15, TILE, shade(PAL.parchmentDeep, 0.3));
      break;
    }
    case 'soil':
    case 'soil_wet':
    case 'mud': {
      // Furrows every 8px, the way a hand-dug bed looks.
      for (let y = 3; y < TILE; y += 8) {
        c.hline(0, y, TILE, shade(spec.base, 0.22));
        c.hline(0, y + 1, TILE, tint(spec.base, 0.1));
      }
      if (id === 'soil_wet' || id === 'mud') {
        for (let i = 0; i < 4; i++) {
          const x = Math.floor(rnd() * (TILE - 6));
          const y = Math.floor(rnd() * (TILE - 2));
          c.hline(x, y, 3 + Math.floor(rnd() * 3), PAL.waterLit);
        }
      }
      break;
    }
    case 'paddy':
    case 'paddy_water': {
      if (id === 'paddy') {
        // Bunds: raised earth ridges every 16px.
        for (let y = 0; y < TILE; y += 16) {
          c.rect(0, y, TILE, 3, PAL.moss);
          c.hline(0, y, TILE, PAL.leaf);
          c.hline(0, y + 3, TILE, PAL.leafDark);
        }
      } else {
        c.rect(0, 0, TILE, TILE, PAL.water);
        for (let i = 0; i < 5; i++) {
          const y = 2 + Math.floor(rnd() * 28);
          c.hline(2 + Math.floor(rnd() * 10), y, 6 + Math.floor(rnd() * 10), PAL.waterLit);
        }
      }
      break;
    }
    case 'water':
    case 'water_deep':
    case 'water_edge': {
      // Horizontal ripple bands with a lighter crest.
      for (let y = 3; y < TILE; y += 6) {
        const w = 8 + Math.floor(rnd() * 10);
        const x = Math.floor(rnd() * (TILE - w));
        c.hline(x, y, w, mix(spec.base, PAL.waterLit, 0.4));
        c.hline(x + 1, y - 1, Math.max(2, w - 4), mix(spec.base, PAL.foam, 0.22));
      }
      if (id === 'water_edge') {
        for (let i = 0; i < 4; i++) {
          const x = Math.floor(rnd() * TILE);
          const y = Math.floor(rnd() * TILE);
          c.px(x, y, PAL.foam);
          c.px(x + 1, y, PAL.foam);
        }
      }
      break;
    }
    case 'cliff': {
      // Blocky strata.
      for (let y = 0; y < TILE; y += 6) {
        c.hline(0, y, TILE, PAL.shadowDeep);
        c.hline(0, y + 1, TILE, mix(spec.base, PAL.shadowSoft, 0.5));
      }
      for (let i = 0; i < 8; i++) {
        const x = Math.floor(rnd() * TILE);
        const y = Math.floor(rnd() * TILE);
        c.vline(x, y, 2 + Math.floor(rnd() * 4), PAL.shadowDeep);
      }
      break;
    }
    case 'roof': {
      // Tiled roof courses.
      for (let y = 0; y < TILE; y += 6) {
        c.hline(0, y, TILE, PAL.roofDark);
        for (let x = (y % 12 === 0 ? 0 : 4); x < TILE; x += 8) {
          c.px(x, y + 2, mix(spec.base, PAL.roofLit, 0.5));
        }
      }
      break;
    }
    case 'void': {
      break;
    }
    default:
      break;
  }

  // Slight edge darkening on grass-to-earth tiles keeps fields from looking flat.
  if (id === 'grass' || id === 'grass_tall') {
    for (let x = 0; x < TILE; x++) {
      if (rnd() < 0.18) c.px(x, TILE - 1, PAL.grassDark);
    }
  }

  return c;
}

/** All terrain tiles, keyed for registration. */
export function buildTerrainTiles(): Record<TerrainId, PixelCanvas> {
  const out = {} as Record<TerrainId, PixelCanvas>;
  for (const id of Object.keys(SPECS) as TerrainId[]) out[id] = paintTerrain(id);
  return out;
}