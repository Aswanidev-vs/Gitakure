/**
 * Vegetation painter.
 *
 * Trees and plants are authored with a fixed silhouette grammar: a trunk, a
 * canopy mass built from overlapping discs, then a lit rim on the sun side and
 * a shadowed underside. Keeping that grammar shared is what makes a cherry
 * tree and a coconut palm read as belonging to the same forest.
 */

import { PAL, mix, shade, tint } from './palette';
import { mulberry32, PixelCanvas } from './PixelCanvas';
import type { Season } from '@/shared/types';

export type FloraId =
  | 'cherry'
  | 'coconut'
  | 'mango'
  | 'banana'
  | 'bamboo'
  | 'pine'
  | 'maple'
  | 'bush'
  | 'fern'
  | 'flowers'
  | 'grass_tuft'
  | 'mushroom';

export interface FloraSpec {
  w: number;
  h: number;
  /** Collision footprint in pixels, measured from the bottom-centre. */
  solidW: number;
  solidH: number;
  seed: number;
}

export const FLORA: Record<FloraId, FloraSpec> = {
  cherry: { w: 64, h: 80, solidW: 18, solidH: 14, seed: 201 },
  coconut: { w: 64, h: 96, solidW: 16, solidH: 12, seed: 211 },
  mango: { w: 64, h: 80, solidW: 18, solidH: 14, seed: 223 },
  banana: { w: 48, h: 64, solidW: 20, solidH: 12, seed: 227 },
  bamboo: { w: 48, h: 96, solidW: 14, solidH: 10, seed: 229 },
  pine: { w: 56, h: 88, solidW: 16, solidH: 12, seed: 233 },
  maple: { w: 64, h: 76, solidW: 18, solidH: 14, seed: 239 },
  bush: { w: 32, h: 28, solidW: 0, solidH: 0, seed: 241 },
  fern: { w: 32, h: 28, solidW: 0, solidH: 0, seed: 251 },
  flowers: { w: 32, h: 24, solidW: 0, solidH: 0, seed: 257 },
  grass_tuft: { w: 32, h: 24, solidW: 0, solidH: 0, seed: 263 },
  mushroom: { w: 32, h: 24, solidW: 0, solidH: 0, seed: 269 },
};

interface SeasonFoliage {
  dark: string;
  mid: string;
  lit: string;
  /** Blossom or fruit colour, or null. */
  bloom: string | null;
  /** Ground litter under the canopy. */
  litter: string | null;
}

const SEASON_FOLIAGE: Record<Season, SeasonFoliage> = {
  spring: { dark: PAL.leafDeep, mid: PAL.leaf, lit: PAL.leafLit, bloom: PAL.blossom, litter: PAL.blossomDark },
  summer: { dark: PAL.palmDark, mid: PAL.palm, lit: PAL.palmLit, bloom: null, litter: null },
  autumn: { dark: '#5a3a2a', mid: '#8a5a2c', lit: '#c08a3e', bloom: '#d9a05a', litter: '#8a5a2c' },
  winter: { dark: '#3a3a40', mid: '#52525a', lit: '#7c7c86', bloom: null, litter: '#c9c9d1' },
};

export function foliageFor(season: Season): SeasonFoliage {
  return SEASON_FOLIAGE[season];
}

/** Broadleaf canopy: overlapping discs, lit on the upper-left. */
function broadleaf(
  c: PixelCanvas,
  cx: number,
  cy: number,
  radius: number,
  f: SeasonFoliage,
  rnd: () => number,
  density = 1,
): void {
  const blobs = Math.max(3, Math.round(6 * density));
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + rnd() * 0.6;
    const d = radius * 0.5 * rnd();
    const bx = cx + Math.cos(a) * d;
    const by = cy + Math.sin(a) * d * 0.75;
    const br = radius * (0.5 + rnd() * 0.3);
    c.disc(bx, by, br, f.dark);
    c.disc(bx - br * 0.12, by - br * 0.16, br * 0.86, f.mid);
    c.disc(bx - br * 0.3, by - br * 0.34, br * 0.5, f.lit);
  }
  // Rim light along the top-left arc.
  for (let i = 0; i < 26; i++) {
    const a = Math.PI * (0.95 + rnd() * 0.55);
    const d = radius * (0.55 + rnd() * 0.4);
    const x = Math.round(cx + Math.cos(a) * d);
    const y = Math.round(cy + Math.sin(a) * d * 0.8);
    c.px(x, y, tint(f.lit, 0.28));
  }
  // Shadowed underside.
  for (let i = 0; i < 20; i++) {
    const x = Math.round(cx + (rnd() - 0.5) * radius * 1.5);
    const y = Math.round(cy + radius * (0.45 + rnd() * 0.35));
    c.px(x, y, shade(f.dark, 0.3));
  }
}

function trunk(c: PixelCanvas, x: number, topY: number, botY: number, w: number, dark: string = PAL.woodDark): void {
  c.rect(x, topY, w, botY - topY, dark);
  c.vline(x, topY, botY - topY, shade(dark, 0.3));
  c.vline(x + w - 1, topY, botY - topY, mix(dark, PAL.woodLit, 0.45));
  // Bark flecks.
  for (let y = topY + 2; y < botY; y += 4) {
    c.px(x + 1, y, shade(dark, 0.2));
    c.px(x + w - 2, y + 1, mix(dark, PAL.woodLit, 0.3));
  }
}

export function paintFlora(id: FloraId, season: Season): PixelCanvas {
  const spec = FLORA[id];
  const c = PixelCanvas.from(spec.w, spec.h);
  const f = foliageFor(season);
  const rnd = mulberry32(spec.seed + season.length * 13);
  const cx = spec.w / 2;
  const base = spec.h - 1;

  switch (id) {
    case 'cherry': {
      trunk(c, cx - 3, 44, base, 6);
      // Two limbs.
      c.line(cx, 52, cx - 12, 38, PAL.woodDark);
      c.line(cx, 52, cx + 12, 36, PAL.woodDark);
      if (season === 'winter') {
        // Bare branches with a dusting.
        c.line(cx, 46, cx - 18, 26, PAL.woodDark);
        c.line(cx, 46, cx + 18, 24, PAL.woodDark);
        c.line(cx - 12, 34, cx - 22, 30, PAL.woodDark);
        c.line(cx + 12, 32, cx + 22, 28, PAL.woodDark);
      } else {
        broadleaf(c, cx, 30, 27, f, rnd);
        // Blossom clusters.
        for (let i = 0; i < 22; i++) {
          const a = rnd() * Math.PI * 2;
          const d = rnd() * 24;
          const x = Math.round(cx + Math.cos(a) * d);
          const y = Math.round(30 + Math.sin(a) * d * 0.8);
          c.px(x, y, season === 'spring' ? PAL.blossomLit : PAL.petal);
          if (rnd() < 0.4) c.px(x + 1, y, PAL.blossom);
        }
      }
      if (f.litter) {
        for (let i = 0; i < 14; i++) c.px(Math.floor(rnd() * spec.w), base - Math.floor(rnd() * 3), f.litter);
      }
      break;
    }
    case 'coconut': {
      // Leaning palm trunk with ring scars.
      let px = cx - 2;
      for (let y = base; y > 26; y -= 1) {
        px += y < 60 ? -0.06 : 0.05;
        const xx = Math.round(px);
        c.px(xx, y, PAL.woodDark);
        c.px(xx + 1, y, PAL.wood);
        c.px(xx + 2, y, PAL.woodLit);
        if (y % 5 === 0) c.hline(xx, y, 3, shade(PAL.woodDark, 0.25));
      }
      const topX = Math.round(cx - 4);
      const topY = 26;
      // Fronds radiating from the crown.
      const fronds = 8;
      for (let i = 0; i < fronds; i++) {
        const a = -Math.PI + (i / (fronds - 1)) * Math.PI;
        for (let t = 0; t < 24; t++) {
          const d = t;
          const droop = (t / 24) * (t / 24) * 10;
          const x = Math.round(topX + Math.cos(a) * d);
          const y = Math.round(topY + Math.sin(a) * d * 0.55 + droop);
          c.px(x, y, t > 15 ? PAL.palmDark : PAL.palm);
          if (t % 3 === 0) {
            c.px(x, y - 1, PAL.palmLit);
            c.px(x, y + 1, PAL.palmDark);
          }
        }
      }
      c.disc(topX, topY, 4, PAL.palmDark);
      c.disc(topX - 1, topY - 1, 3, PAL.palm);
      // Coconuts.
      c.disc(topX - 3, topY + 4, 2, '#5a4632');
      c.disc(topX + 3, topY + 5, 2, '#6b5238');
      break;
    }
    case 'mango': {
      trunk(c, cx - 3, 40, base, 7);
      c.line(cx, 50, cx - 14, 34, PAL.woodDark);
      c.line(cx, 50, cx + 14, 34, PAL.woodDark);
      broadleaf(c, cx, 30, 28, f, rnd, 1.2);
      if (season === 'summer') {
        for (let i = 0; i < 8; i++) {
          const a = rnd() * Math.PI * 2;
          const d = rnd() * 22;
          c.disc(cx + Math.cos(a) * d, 32 + Math.sin(a) * d * 0.8, 2, '#c9a227');
          c.px(Math.round(cx + Math.cos(a) * d), 31, '#e0c05a');
        }
      }
      break;
    }
    case 'banana': {
      // Pseudostem plus paddle leaves.
      c.rect(cx - 3, 34, 6, base - 34, PAL.banana);
      c.vline(cx - 3, 34, base - 34, PAL.palmDark);
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * 0.9 + (i / 4) * Math.PI * 0.8;
        const len = 20 + rnd() * 6;
        for (let t = 0; t < len; t++) {
          const droop = (t / len) * (t / len) * 12;
          const x = Math.round(cx + Math.cos(a) * t);
          const y = Math.round(34 + Math.sin(a) * t * 0.7 + droop);
          c.px(x, y, t > len * 0.7 ? PAL.palm : PAL.banana);
          if (t % 4 === 0) {
            c.px(x, y - 1, PAL.bananaLit);
            c.px(x, y + 1, PAL.palmDark);
          }
        }
      }
      // A hand of green fruit.
      c.disc(cx + 4, 46, 3, '#7c8f45');
      c.px(cx + 5, 45, '#a9c05a');
      break;
    }
    case 'bamboo': {
      const stalks = 3;
      for (let s = 0; s < stalks; s++) {
        const x = Math.round(cx - 8 + s * 8 + (rnd() - 0.5) * 3);
        const h = 60 + Math.floor(rnd() * 26);
        const topY = base - h;
        c.rect(x, topY, 3, h, s === 1 ? PAL.palmLit : PAL.leafLit);
        c.vline(x, topY, h, shade(PAL.leafDeep, 0.1));
        for (let y = topY + 4; y < base; y += 7) c.hline(x, y, 3, PAL.leafDeep);
        // Leaf sprays.
        for (let i = 0; i < 5; i++) {
          const ly = topY + i * 10 + 4;
          const dirSign = i % 2 === 0 ? -1 : 1;
          for (let k = 1; k < 8; k++) {
            c.px(x + dirSign * k, ly - Math.floor(k / 2), k > 5 ? PAL.leaf : PAL.leafLit);
          }
        }
      }
      break;
    }
    case 'pine': {
      trunk(c, cx - 2, 62, base, 5, '#4a3a30');
      // Layered skirts.
      for (let layer = 0; layer < 4; layer++) {
        const y = 26 + layer * 14;
        const halfW = 8 + layer * 5;
        for (let dx = -halfW; dx <= halfW; dx++) {
          const edge = Math.round((dx / halfW) * (dx / halfW) * 5);
          c.vline(Math.round(cx + dx), y + edge, 7 - edge, layer === 0 ? PAL.leaf : PAL.leafDark);
          c.px(Math.round(cx + dx), y + edge, layer === 0 ? PAL.leafLit : PAL.leaf);
        }
      }
      if (season === 'winter') {
        for (let layer = 0; layer < 4; layer++) {
          const y = 26 + layer * 14;
          const halfW = 8 + layer * 5;
          c.hline(Math.round(cx - halfW), y, halfW * 2, PAL.parchment);
        }
      }
      break;
    }
    case 'maple': {
      trunk(c, cx - 3, 42, base, 6);
      c.line(cx, 50, cx - 12, 36, PAL.woodDark);
      c.line(cx, 50, cx + 12, 34, PAL.woodDark);
      broadleaf(c, cx, 30, 26, f, rnd);
      if (season === 'autumn') {
        for (let i = 0; i < 10; i++) c.px(Math.floor(rnd() * spec.w), Math.floor(rnd() * 12) + 50, PAL.ember);
      }
      break;
    }
    case 'bush': {
      for (let i = 0; i < 4; i++) {
        const bx = 8 + i * 5;
        const by = 18 + (i % 2) * 3;
        c.disc(bx, by, 6, f.dark);
        c.disc(bx - 1, by - 1, 5, f.mid);
        c.disc(bx - 2, by - 2, 3, f.lit);
      }
      if (season === 'spring') {
        for (let i = 0; i < 5; i++) c.px(6 + Math.floor(rnd() * 20), 12 + Math.floor(rnd() * 10), PAL.blossomLit);
      }
      break;
    }
    case 'fern': {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * 0.85 + (i / 4) * Math.PI * 0.7;
        for (let t = 2; t < 14; t++) {
          const x = Math.round(16 + Math.cos(a) * t);
          const y = Math.round(24 + Math.sin(a) * t * 0.9);
          c.px(x, y, t > 9 ? PAL.leaf : PAL.leafLit);
          if (t % 3 === 1) {
            c.px(x - 1, y, PAL.leafDeep);
            c.px(x + 1, y, PAL.leafDeep);
          }
        }
      }
      break;
    }
    case 'flowers': {
      const cols = season === 'winter' ? [PAL.parchmentDim, PAL.spirit] : [PAL.blossomLit, PAL.accentSoft, PAL.petal, PAL.link];
      for (let i = 0; i < 7; i++) {
        const x = 4 + Math.floor(rnd() * 24);
        const y = 8 + Math.floor(rnd() * 14);
        c.vline(x, y, 4, PAL.leaf);
        c.px(x, y - 1, cols[Math.floor(rnd() * cols.length)]!);
        c.px(x - 1, y - 1, cols[Math.floor(rnd() * cols.length)]!);
        c.px(x + 1, y - 1, cols[Math.floor(rnd() * cols.length)]!);
        c.px(x, y - 2, PAL.accentSoft);
      }
      break;
    }
    case 'grass_tuft': {
      for (let i = 0; i < 10; i++) {
        const x = 3 + Math.floor(rnd() * 26);
        const h = 4 + Math.floor(rnd() * 8);
        const col = season === 'winter' ? PAL.parchmentDeep : rnd() < 0.4 ? PAL.grassLit : PAL.grass;
        for (let k = 0; k < h; k++) c.px(x + (k > h - 3 ? 1 : 0), 23 - k, col);
      }
      break;
    }
    case 'mushroom': {
      const spots = [[10, 18], [20, 20], [15, 14]];
      for (const spot of spots) {
        const mx = spot[0]!;
        const my = spot[1]!;
        c.rect(mx, my, 2, 4, PAL.parchmentDim);
        c.disc(mx + 1, my - 1, 3, '#a2545f');
        c.px(mx, my - 2, PAL.petal);
        c.px(mx + 2, my - 1, PAL.blossomLit);
      }
      break;
    }
    default:
      break;
  }

  c.outline(PAL.outline);
  return c;
}

/** Season x flora matrix, built once at boot. */
export function buildFlora(season: Season): Record<FloraId, PixelCanvas> {
  const out = {} as Record<FloraId, PixelCanvas>;
  for (const id of Object.keys(FLORA) as FloraId[]) out[id] = paintFlora(id, season);
  return out;
}