/**
 * Crop painter.
 *
 * Each crop has five growth stages (0 seed … 4 ready). Stage 0 is a soil
 * disturbance, stages 1-3 are the plant getting taller and bushier, and stage 4
 * adds the harvestable fruit. Growth is driven by in-game time, so a crop looks
 * the same whether the player watched it grow or found it grown.
 */

import { PAL, mix, shade, tint } from './palette';
import { mulberry32, PixelCanvas } from './PixelCanvas';
import type { Season } from '@/shared/types';

export type CropId =
  | 'rice'
  | 'wheat'
  | 'tomato'
  | 'carrot'
  | 'potato'
  | 'pumpkin'
  | 'strawberry'
  | 'corn'
  | 'cabbage'
  | 'flower';

export const CROP_TILE = 32;
export const CROP_STAGES = 5;

export interface CropSpec {
  label: string;
  /** In-game minutes from planting to harvest at stage 4. */
  growMinutes: number;
  /** Seasons this crop can be planted in. */
  seasons: Season[];
  /** Colour of the harvested item. */
  yieldColor: string;
  seed: number;
  /** Whether the plant is a tall stalk (drawn above the tile). */
  tall: boolean;
}

export const CROPS: Record<CropId, CropSpec> = {
  rice: { label: 'Rice', growMinutes: 2880, seasons: ['summer', 'autumn'], yieldColor: '#c9b872', seed: 601, tall: true },
  wheat: { label: 'Wheat', growMinutes: 2160, seasons: ['spring', 'summer'], yieldColor: '#d3b969', seed: 607, tall: true },
  tomato: { label: 'Tomato', growMinutes: 1440, seasons: ['spring', 'summer'], yieldColor: '#b4544a', seed: 613, tall: false },
  carrot: { label: 'Carrot', growMinutes: 1080, seasons: ['spring', 'autumn', 'winter'], yieldColor: '#d2762f', seed: 617, tall: false },
  potato: { label: 'Potato', growMinutes: 1260, seasons: ['spring', 'autumn'], yieldColor: '#b08a55', seed: 619, tall: false },
  pumpkin: { label: 'Pumpkin', growMinutes: 2520, seasons: ['summer', 'autumn'], yieldColor: '#d2762f', seed: 631, tall: false },
  strawberry: { label: 'Strawberry', growMinutes: 1440, seasons: ['spring', 'summer'], yieldColor: '#c0424b', seed: 641, tall: false },
  corn: { label: 'Corn', growMinutes: 2160, seasons: ['summer'], yieldColor: '#e0c05a', seed: 643, tall: true },
  cabbage: { label: 'Cabbage', growMinutes: 1800, seasons: ['autumn', 'winter'], yieldColor: '#7c9a58', seed: 647, tall: false },
  flower: { label: 'Flower', growMinutes: 900, seasons: ['spring', 'summer', 'autumn', 'winter'], yieldColor: '#d08b9c', seed: 653, tall: false },
};

/** Soil disturbance at the base of every planted tile. */
function seededSoil(c: PixelCanvas, seed: number): void {
  const rnd = mulberry32(seed);
  c.rect(4, 22, 24, 8, PAL.soilDark);
  for (let i = 0; i < 10; i++) {
    c.px(5 + Math.floor(rnd() * 22), 22 + Math.floor(rnd() * 8), rnd() < 0.5 ? PAL.soil : PAL.soilLit);
  }
  c.hline(4, 22, 24, shade(PAL.soilDark, 0.2));
}

function stem(c: PixelCanvas, x: number, topY: number, height: number, color: string = PAL.leaf): void {
  c.vline(x, topY, height, color);
  c.px(x, topY, PAL.leafLit);
}

export function paintCrop(crop: CropId, stage: number, watered = false): PixelCanvas {
  const spec = CROPS[crop];
  const c = PixelCanvas.from(CROP_TILE, CROP_TILE);
  const rnd = mulberry32(spec.seed + stage * 37);
  const cx = 16;

  seededSoil(c, spec.seed);

  if (stage === 0) {
    // Just-turned soil and a couple of seeds.
    c.px(cx - 3, 25, PAL.parchmentDeep);
    c.px(cx + 3, 26, PAL.parchmentDeep);
    if (watered) {
      for (let i = 0; i < 5; i++) c.px(6 + Math.floor(rnd() * 20), 24 + Math.floor(rnd() * 5), PAL.waterLit);
    }
    return c;
  }

  const h = [0, 8, 14, 20, 26][Math.min(4, stage)]!;
  const topY = 24 - h;

  switch (crop) {
    case 'rice':
    case 'wheat': {
      // A clump of blades; rice is greener, wheat goes gold at the top.
      const blades = 4 + stage * 2;
      for (let i = 0; i < blades; i++) {
        const bx = cx - 8 + (i * 16) / Math.max(1, blades - 1) + (rnd() - 0.5) * 2;
        const bh = h - Math.floor(rnd() * 4);
        const lean = rnd() < 0.5 ? -1 : 1;
        for (let k = 0; k < bh; k++) {
          const x = Math.round(bx + (k > bh * 0.6 ? lean : 0));
          const col = k > bh - 4 && stage >= 3 ? (crop === 'wheat' ? spec.yieldColor : mix(spec.yieldColor, PAL.leaf, 0.4)) : crop === 'rice' ? PAL.leafLit : PAL.grassPale;
          c.px(x, 24 - k, col);
        }
      }
      if (stage >= 3) {
        // Heavy seed heads bowing over.
        for (let i = 0; i < 3; i++) {
          const x = cx - 6 + i * 6;
          const y = 24 - h + 2 + (i % 2);
          c.rect(x, y, 2, 5, spec.yieldColor);
          c.px(x, y, tint(spec.yieldColor, 0.3));
        }
      }
      break;
    }
    case 'corn': {
      stem(c, cx, topY, h + 2, PAL.leafDeep);
      // Long blade leaves alternating up the stalk.
      for (let k = 0; k < 4; k++) {
        const y = 24 - 6 - k * 5;
        if (y < topY) break;
        const dir = k % 2 === 0 ? 1 : -1;
        for (let i = 1; i < 9 - k; i++) c.px(cx + dir * i, y - Math.floor(i / 3), i > 6 ? PAL.leaf : PAL.leafLit);
      }
      if (stage === 4) {
        c.rect(cx + 2, 24 - h + 6, 4, 8, PAL.grassPale);
        c.rect(cx + 3, 24 - h + 7, 2, 6, PAL.accentSoft);
        for (let i = 0; i < 4; i++) c.hline(cx + 2, 24 - h + 7 + i * 2, 4, PAL.grassPale);
      }
      break;
    }
    case 'tomato': {
      stem(c, cx, topY, h + 2, PAL.leafDeep);
      // Bushy foliage.
      for (let i = 0; i < 6 + stage * 2; i++) {
        const a = rnd() * Math.PI * 2;
        const d = rnd() * (4 + stage * 2.2);
        const x = Math.round(cx + Math.cos(a) * d);
        const y = Math.round(22 - h * 0.5 + Math.sin(a) * d * 0.7);
        c.disc(x, y, 2, rnd() < 0.4 ? PAL.leaf : PAL.leafDark);
        if (rnd() < 0.3) c.px(x - 1, y - 1, PAL.leafLit);
      }
      if (stage === 4) {
        const fruits = [[cx - 5, 18], [cx + 4, 16], [cx - 1, 21], [cx + 6, 21]];
        for (const pair of fruits) {
          const fx = pair[0]!;
          const fy = pair[1]!;
          c.disc(fx, fy, 3, spec.yieldColor);
          c.px(fx - 1, fy - 1, tint(spec.yieldColor, 0.35));
          c.px(fx, fy + 3, shade(spec.yieldColor, 0.3));
        }
      }
      break;
    }
    case 'strawberry': {
      // Low clump of trifoliate leaves.
      for (let i = 0; i < 5 + stage * 2; i++) {
        const a = rnd() * Math.PI * 2;
        const d = rnd() * (3 + stage * 2.4);
        const x = Math.round(cx + Math.cos(a) * d);
        const y = Math.round(22 - h * 0.35 + Math.sin(a) * d * 0.5);
        c.disc(x, y, 2, PAL.leaf);
        c.px(x - 1, y - 1, PAL.leafLit);
      }
      if (stage === 4) {
        const fruits = [[cx - 6, 20], [cx + 2, 21], [cx + 6, 17]];
        for (const pair of fruits) {
          const fx = pair[0]!;
          const fy = pair[1]!;
          c.disc(fx, fy, 2, spec.yieldColor);
          c.px(fx, fy - 1, tint(spec.yieldColor, 0.4));
          c.px(fx, fy + 2, PAL.leaf);
        }
      }
      break;
    }
    case 'carrot':
    case 'potato': {
      // Feathery tops; the root only shows at harvest.
      for (let i = 0; i < 4 + stage * 2; i++) {
        const bx = cx - 6 + i * (12 / Math.max(1, 3 + stage * 2));
        const bh = Math.max(2, h - Math.floor(rnd() * 3));
        for (let k = 0; k < bh; k++) {
          c.px(Math.round(bx), 23 - k, k > bh - 3 ? PAL.leafLit : PAL.leaf);
          if (k % 3 === 1) {
            c.px(Math.round(bx) - 1, 23 - k, PAL.leafDeep);
            c.px(Math.round(bx) + 1, 23 - k, PAL.leafDeep);
          }
        }
      }
      if (stage === 4 && crop === 'carrot') {
        c.rect(cx - 2, 22, 5, 3, spec.yieldColor);
        c.px(cx - 2, 22, tint(spec.yieldColor, 0.3));
      }
      if (stage === 4 && crop === 'potato') {
        c.rect(cx - 8, 24, 5, 4, spec.yieldColor);
        c.rect(cx + 3, 24, 4, 4, shade(spec.yieldColor, 0.2));
      }
      break;
    }
    case 'pumpkin': {
      // Broad lobed leaves sprawling over the soil.
      for (let i = 0; i < 3 + stage * 2; i++) {
        const a = rnd() * Math.PI * 2;
        const d = 2 + rnd() * (3 + stage * 2.6);
        const x = Math.round(cx + Math.cos(a) * d);
        const y = Math.round(20 + Math.sin(a) * d * 0.5);
        c.disc(x, y, 3, PAL.leafDeep);
        c.disc(x - 1, y - 1, 2, PAL.leaf);
        c.px(x - 2, y - 2, PAL.leafLit);
      }
      if (stage === 4) {
        const px = cx + 4;
        const py = 20;
        c.disc(px, py, 6, '#c26a2a');
        c.disc(px - 1, py - 1, 5, spec.yieldColor);
        // Ribs.
        c.vline(px - 3, py - 5, 11, '#a8541f');
        c.vline(px + 2, py - 5, 11, '#a8541f');
        c.vline(px, py - 6, 13, '#b05d24');
        c.px(px - 2, py - 3, '#e89a55');
        c.rect(px - 1, py - 8, 3, 3, PAL.leafDeep);
      }
      break;
    }
    case 'cabbage': {
      // Tight concentric heads.
      const r = 2 + stage * 1.6;
      c.disc(cx, 22 - r, r + 1, PAL.leafDeep);
      c.disc(cx, 22 - r, r, PAL.leaf);
      c.disc(cx - r * 0.2, 21 - r, r * 0.7, PAL.leafLit);
      if (stage >= 3) c.disc(cx, 21 - r, r * 0.4, PAL.leafPale);
      for (let i = 0; i < 5; i++) {
        const a = rnd() * Math.PI * 2;
        c.px(Math.round(cx + Math.cos(a) * r), Math.round(22 - r + Math.sin(a) * r * 0.8), PAL.leafPale);
      }
      break;
    }
    case 'flower': {
      const h2 = h + 4;
      for (let i = 0; i < 3; i++) {
        const bx = cx - 6 + i * 6;
        const bh = h2 - i;
        stem(c, bx, 24 - bh, bh);
        const top = 24 - bh;
        if (stage >= 3) {
          const col = i === 1 ? PAL.blossomLit : PAL.accentSoft;
          c.disc(bx, top, 3, col);
          c.disc(bx, top, 1, PAL.lampCore);
          c.px(bx - 2, top - 2, PAL.blossom);
          c.px(bx + 2, top - 1, PAL.petal);
        } else {
          c.disc(bx, top, 1, PAL.leafLit);
        }
      }
      break;
    }
    default:
      break;
  }

  if (watered) {
    // Dark damp soil and a couple of standing droplets.
    for (let i = 0; i < 12; i++) {
      const x = 4 + Math.floor(rnd() * 24);
      const y = 22 + Math.floor(rnd() * 8);
      if (c.pixel(x, y)[0] > 0) c.px(x, y, mix(PAL.soilDark, PAL.waterDeep, 0.4));
    }
    c.px(8, 24, PAL.waterLit);
    c.px(24, 27, PAL.waterLit);
  }

  return c;
}

/** Every crop at every stage. */
export function buildCrops(): Record<CropId, PixelCanvas[]> {
  const out = {} as Record<CropId, PixelCanvas[]>;
  for (const id of Object.keys(CROPS) as CropId[]) {
    out[id] = Array.from({ length: CROP_STAGES }, (_, s) => paintCrop(id, s));
    out[id].push(paintCrop(id, CROP_STAGES - 1, true));
  }
  return out;
}

export { seededSoil };