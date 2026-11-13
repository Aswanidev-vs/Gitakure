/**
 * Animal painter.
 *
 * Animals are 24x24 with a two-frame idle bob. Keeping them small and low to
 * the ground is deliberate: they should read as texture in the world, so the
 * player notices them only when they move.
 */

import { PAL, shade, tint } from './palette';
import { mulberry32, PixelCanvas } from './PixelCanvas';

export type AnimalId =
  | 'cat'
  | 'dog'
  | 'chicken'
  | 'duck'
  | 'cow'
  | 'goat'
  | 'sheep'
  | 'rabbit'
  | 'deer'
  | 'fox'
  | 'frog'
  | 'fish'
  | 'butterfly'
  | 'firefly';

export interface AnimalSpec {
  w: number;
  h: number;
  /** Blocks the player. */
  solid: boolean;
  /** Where it belongs; used for spawn rules. */
  habitat: 'village' | 'forest' | 'riverside' | 'farmland' | 'any';
  /** Active phase; night-only creatures appear after dusk. */
  nocturnal?: boolean;
  seed: number;
}

export const ANIMALS: Record<AnimalId, AnimalSpec> = {
  cat: { w: 24, h: 24, solid: false, habitat: 'village', seed: 801 },
  dog: { w: 24, h: 24, solid: false, habitat: 'village', seed: 809 },
  chicken: { w: 20, h: 20, solid: false, habitat: 'farmland', seed: 811 },
  duck: { w: 20, h: 20, solid: false, habitat: 'riverside', seed: 821 },
  cow: { w: 32, h: 28, solid: true, habitat: 'farmland', seed: 823 },
  goat: { w: 26, h: 26, solid: false, habitat: 'farmland', seed: 827 },
  sheep: { w: 28, h: 26, solid: false, habitat: 'farmland', seed: 829 },
  rabbit: { w: 16, h: 18, solid: false, habitat: 'forest', seed: 839 },
  deer: { w: 32, h: 32, solid: false, habitat: 'forest', seed: 853 },
  fox: { w: 28, h: 22, solid: false, habitat: 'forest', seed: 857 },
  frog: { w: 16, h: 14, solid: false, habitat: 'riverside', seed: 863 },
  fish: { w: 18, h: 12, solid: false, habitat: 'riverside', seed: 877 },
  butterfly: { w: 12, h: 10, solid: false, habitat: 'any', seed: 881 },
  firefly: { w: 8, h: 8, solid: false, habitat: 'any', nocturnal: true, seed: 883 },
};

function bodyBase(c: PixelCanvas, x: number, y: number, w: number, h: number, color: string): void {
  c.rect(x, y, w, h, color);
  c.hline(x, y, w, tint(color, 0.2));
  c.hline(x, y + h - 1, w, shade(color, 0.3));
  c.vline(x, y, h, shade(color, 0.18));
  c.vline(x + w - 1, y, h, shade(color, 0.18));
}

function legs(c: PixelCanvas, xs: number[], topY: number, len: number, color: string): void {
  for (const x of xs) c.rect(x, topY, 2, len, color);
}

export function paintAnimal(id: AnimalId, frame = 0): PixelCanvas {
  const spec = ANIMALS[id];
  const c = PixelCanvas.from(spec.w, spec.h);
  const rnd = mulberry32(spec.seed);
  const bob = frame === 1 ? 1 : 0;

  switch (id) {
    case 'cat': {
      const y = 10 + bob;
      bodyBase(c, 5, y, 14, 8, '#8a7566');
      c.rect(5, y + 2, 4, 6, '#6d5b4f');
      // Head
      c.disc(6, y + 2, 4, '#8a7566');
      c.px(4, y - 1, '#8a7566');
      c.px(7, y - 1, '#8a7566');
      c.px(5, y + 2, PAL.ink);
      c.px(8, y + 2, PAL.ink);
      // Tail
      c.line(19, y + 3, 22, y - 2, '#8a7566');
      c.px(22, y - 3, '#6d5b4f');
      legs(c, [7, 11, 15], y + 8, 4, '#6d5b4f');
      break;
    }
    case 'dog': {
      const y = 8 + bob;
      bodyBase(c, 4, y, 16, 8, '#a98d68');
      c.disc(5, y + 1, 4, '#a98d68');
      c.px(3, y, '#8a7052');
      c.px(4, y + 3, PAL.ink);
      c.rect(7, y + 4, 3, 2, '#8a7052');
      c.line(20, y + 2, 22, y - 4, '#a98d68');
      legs(c, [6, 10, 15, 18], y + 8, 5, '#8a7052');
      break;
    }
    case 'chicken': {
      const y = 6 + bob;
      c.disc(10, y + 6, 5, PAL.parchment);
      c.disc(10, y + 6, 4, tint(PAL.parchment, 0.2));
      c.disc(15, y + 2, 3, PAL.parchment);
      c.px(17, y + 2, PAL.ember);
      c.px(15, y + 1, PAL.health);
      c.px(16, y + 1, PAL.health);
      c.px(16, y + 3, PAL.ink);
      c.vline(10, y + 11, 3, PAL.ember);
      c.vline(13, y + 11, 3, PAL.ember);
      c.px(6, y + 6, PAL.parchmentDim);
      break;
    }
    case 'duck': {
      const y = 7 + bob;
      c.disc(10, y + 6, 5, '#6d7a6a');
      c.disc(14, y + 2, 3, '#3f5a48');
      c.px(17, y + 2, PAL.accent);
      c.px(15, y + 2, PAL.ink);
      c.vline(10, y + 11, 2, PAL.ember);
      c.vline(13, y + 11, 2, PAL.ember);
      break;
    }
    case 'cow': {
      const y = 8 + bob;
      bodyBase(c, 4, y, 22, 12, PAL.parchment);
      // Patch
      c.disc(14, y + 5, 4, '#3a3238');
      c.disc(20, y + 8, 3, '#3a3238');
      c.disc(6, y + 2, 4, PAL.parchment);
      c.px(5, y + 1, PAL.ink);
      c.px(8, y + 2, PAL.ink);
      c.px(5, y + 5, PAL.blossomDark);
      c.px(9, y + 5, PAL.blossomDark);
      c.px(4, y - 1, PAL.parchmentDim);
      c.px(9, y - 1, PAL.parchmentDim);
      legs(c, [6, 11, 19, 23], y + 12, 6, '#4a4048');
      c.line(26, y + 3, 28, y + 9, '#4a4048');
      break;
    }
    case 'goat': {
      const y = 9 + bob;
      bodyBase(c, 4, y, 16, 9, '#b8a894');
      c.disc(5, y + 2, 4, '#b8a894');
      c.line(3, y, 1, y - 4, '#6d6055');
      c.line(6, y, 8, y - 4, '#6d6055');
      c.px(4, y + 2, PAL.ink);
      c.rect(6, y + 5, 3, 3, '#b8a894');
      c.line(20, y + 3, 22, y - 1, '#b8a894');
      legs(c, [6, 11, 15, 18], y + 9, 5, '#6d6055');
      break;
    }
    case 'sheep': {
      const y = 7 + bob;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        c.disc(14 + Math.cos(a) * 6, y + 7 + Math.sin(a) * 4, 4, PAL.parchmentDim);
      }
      c.disc(14, y + 7, 7, PAL.parchment);
      c.disc(7, y + 4, 4, '#4a4048');
      c.px(6, y + 3, PAL.parchmentDim);
      c.px(9, y + 3, PAL.parchmentDim);
      legs(c, [9, 12, 17, 20], y + 12, 5, '#4a4048');
      break;
    }
    case 'rabbit': {
      const y = 8 + bob;
      c.disc(8, y + 5, 5, '#b0a394');
      c.disc(12, y + 3, 3, '#b0a394');
      c.rect(11, y - 4, 2, 6, '#b0a394');
      c.rect(14, y - 3, 2, 5, '#c9bcae');
      c.px(13, y + 3, PAL.ink);
      c.px(15, y + 4, PAL.blossom);
      c.disc(4, y + 6, 2, PAL.parchment);
      break;
    }
    case 'deer': {
      const y = 8 + bob;
      bodyBase(c, 4, y + 4, 20, 10, '#a3703f');
      c.disc(6, y + 2, 4, '#a3703f');
      c.px(5, y + 1, PAL.ink);
      c.px(8, y + 1, PAL.ink);
      c.px(6, y + 4, PAL.ink);
      // Antlers
      c.line(5, y - 2, 3, y - 7, '#6d5b4f');
      c.line(3, y - 5, 1, y - 7, '#6d5b4f');
      c.line(8, y - 2, 10, y - 7, '#6d5b4f');
      c.line(10, y - 5, 12, y - 7, '#6d5b4f');
      // Spots
      for (let i = 0; i < 5; i++) c.px(9 + Math.floor(rnd() * 12), y + 6 + Math.floor(rnd() * 4), PAL.parchment);
      legs(c, [7, 11, 18, 21], y + 14, 7, '#6d5b4f');
      c.px(4, y + 8, PAL.parchment);
      break;
    }
    case 'fox': {
      const y = 9 + bob;
      bodyBase(c, 4, y + 2, 17, 8, '#c06a35');
      c.disc(5, y + 1, 4, '#c06a35');
      c.px(3, y - 2, '#c06a35');
      c.px(7, y - 2, '#c06a35');
      c.px(3, y - 1, PAL.ink);
      c.px(5, y + 1, PAL.ink);
      c.rect(6, y + 3, 4, 3, PAL.parchment);
      c.line(21, y + 2, 24, y - 4, '#c06a35');
      c.px(24, y - 5, PAL.parchment);
      legs(c, [6, 10, 16, 19], y + 10, 5, '#4a3428');
      break;
    }
    case 'frog': {
      const y = 5 + bob;
      c.disc(8, y + 5, 5, '#5b7a3c');
      c.disc(5, y + 2, 2, '#5b7a3c');
      c.disc(11, y + 2, 2, '#5b7a3c');
      c.px(5, y + 1, PAL.ink);
      c.px(11, y + 1, PAL.ink);
      c.px(2, y + 8, '#4a6630');
      c.px(14, y + 8, '#4a6630');
      break;
    }
    case 'fish': {
      const y = 3 + bob;
      c.disc(9, y + 3, 4, '#7c9aa8');
      c.disc(8, y + 2, 3, '#9ab8c4');
      c.px(5, y + 2, PAL.ink);
      c.line(13, y + 3, 17, y, '#5b7a8a');
      c.line(13, y + 3, 17, y + 6, '#5b7a8a');
      c.line(13, y + 3, 17, y + 3, '#5b7a8a');
      break;
    }
    case 'butterfly': {
      const flap = frame === 1 ? 1 : 0;
      const col = PAL.accentSoft;
      c.px(5, 4, PAL.ink);
      c.px(3, 3 - flap, col);
      c.px(4, 3 - flap, col);
      c.px(6, 3 - flap, col);
      c.px(7, 3 - flap, col);
      c.px(3, 5 + flap, col);
      c.px(7, 5 + flap, col);
      c.px(2, 4, shade(col, 0.25));
      c.px(8, 4, shade(col, 0.25));
      break;
    }
    case 'firefly': {
      const a = frame === 1 ? 255 : 150;
      c.disc(4, 4, 2, PAL.lamp, a);
      c.disc(4, 4, 1, PAL.lampCore, 255);
      break;
    }
    default:
      break;
  }
  return c;
}

/** Two-frame strip per animal. */
export function buildAnimals(): Record<AnimalId, PixelCanvas> {
  const out = {} as Record<AnimalId, PixelCanvas>;
  for (const id of Object.keys(ANIMALS) as AnimalId[]) {
    const spec = ANIMALS[id];
    const strip = PixelCanvas.from(spec.w * 2, spec.h);
    strip.blit(paintAnimal(id, 0), 0, 0);
    strip.blit(paintAnimal(id, 1), spec.w, 0);
    out[id] = strip;
  }
  return out;
}