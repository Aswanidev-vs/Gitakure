/**
 * Weather and particle painters, plus the light overlay.
 *
 * Every effect is authored as a small square so Phaser can tile it as a
 * particle. Nothing here animates on its own: the weather system scrolls these
 * and recycles them, which keeps particle counts predictable.
 */

import { PAL, mix, shade } from './palette';
import { mulberry32, PixelCanvas } from './PixelCanvas';

export type EffectId =
  | 'rain_drop'
  | 'rain_drop_heavy'
  | 'snow_flake'
  | 'petal'
  | 'leaf'
  | 'firefly'
  | 'dust'
  | 'splash'
  | 'smoke'
  | 'ripple'
  | 'butterfly'
  | 'bird'
  | 'spark';

export const EFFECTS: Record<EffectId, { w: number; h: number }> = {
  rain_drop: { w: 2, h: 8 },
  rain_drop_heavy: { w: 2, h: 12 },
  snow_flake: { w: 3, h: 3 },
  petal: { w: 4, h: 4 },
  leaf: { w: 5, h: 4 },
  firefly: { w: 3, h: 3 },
  dust: { w: 2, h: 2 },
  splash: { w: 6, h: 4 },
  smoke: { w: 8, h: 8 },
  ripple: { w: 16, h: 6 },
  butterfly: { w: 6, h: 5 },
  bird: { w: 7, h: 4 },
  spark: { w: 3, h: 3 },
};

export function paintEffect(id: EffectId, variant = 0): PixelCanvas {
  const { w, h } = EFFECTS[id];
  const c = PixelCanvas.from(w, h);
  const rnd = mulberry32(700 + variant * 13 + id.length);

  switch (id) {
    case 'rain_drop':
      c.vline(0, 0, h, PAL.waterLit);
      c.px(0, 0, PAL.foam);
      break;
    case 'rain_drop_heavy':
      c.vline(0, 0, h, mix(PAL.waterLit, PAL.parchmentDim, 0.3));
      c.vline(1, 2, h - 2, PAL.waterLit);
      c.px(0, 0, PAL.foam);
      break;
    case 'snow_flake':
      c.fill(PAL.parchment);
      c.px(0, 0, PAL.parchment);
      c.px(2, 0, PAL.parchment);
      c.px(1, 2, PAL.parchment);
      break;
    case 'petal':
      c.px(1, 0, PAL.petal);
      c.px(0, 1, PAL.blossomLit);
      c.px(1, 1, PAL.blossom);
      c.px(2, 1, PAL.blossomLit);
      c.px(1, 2, PAL.blossomDark);
      break;
    case 'leaf':
      c.px(1, 0, PAL.leafLit);
      c.px(0, 1, PAL.leaf);
      c.px(1, 1, PAL.leafPale);
      c.px(2, 1, PAL.leaf);
      c.px(1, 2, PAL.leafDeep);
      break;
    case 'firefly':
      c.px(1, 1, PAL.lampCore);
      c.px(0, 1, PAL.lamp, 150);
      c.px(2, 1, PAL.lamp, 150);
      c.px(1, 0, PAL.lamp, 150);
      c.px(1, 2, PAL.lamp, 150);
      break;
    case 'dust':
      c.px(0, 0, PAL.parchmentDeep, 160);
      break;
    case 'splash':
      c.px(0, 2, PAL.foam);
      c.px(2, 1, PAL.foam);
      c.px(4, 2, PAL.foam);
      c.px(1, 3, PAL.ripple);
      c.px(3, 3, PAL.ripple);
      c.px(5, 3, PAL.ripple);
      break;
    case 'smoke':
      c.disc(4, 4, 3, PAL.shadowSoft, 90);
      c.disc(3, 3, 2, PAL.stone, 70);
      break;
    case 'ripple': {
      const y = 3;
      for (let x = 0; x < w; x++) {
        const t = x / (w - 1);
        const yy = Math.round(y + Math.sin(t * Math.PI) * -1.5);
        c.px(x, yy, PAL.foam);
        if (rnd() < 0.2) c.px(x, yy + 1, PAL.ripple);
      }
      break;
    }
    case 'butterfly': {
      const col = variant % 2 === 0 ? PAL.accentSoft : PAL.blossomLit;
      c.px(1, 1, shade(col, 0.2));
      c.px(2, 1, col);
      c.px(3, 1, shade(col, 0.2));
      c.px(4, 1, col);
      c.px(2, 2, PAL.ink);
      c.px(1, 0, tintSafe(col));
      c.px(4, 0, tintSafe(col));
      break;
    }
    case 'bird':
      c.px(0, 1, PAL.shadowSoft);
      c.px(1, 0, PAL.shadowDeep);
      c.px(2, 1, PAL.shadowSoft);
      c.px(3, 0, PAL.shadowDeep);
      c.px(4, 1, PAL.shadowSoft);
      c.px(5, 0, PAL.shadowDeep);
      break;
    case 'spark':
      c.px(1, 1, PAL.lampCore);
      c.px(0, 1, PAL.lamp, 120);
      c.px(2, 1, PAL.lamp, 120);
      break;
    default:
      break;
  }
  return c;
}

function tintSafe(color: string): string {
  return mix(color, '#fff6ea', 0.35);
}

/**
 * A radial falloff used for night tint, lantern pools and the shrine glow.
 * Drawn at low resolution and scaled up with nearest-neighbour so it stays
 * chunky rather than turning into an airbrushed gradient.
 */
export function paintLightMask(radius: number, color = PAL.ink, softness = 0.55): PixelCanvas {
  const size = radius * 2;
  const c = PixelCanvas.from(size, size);
  const [r, g, b] = hexToRgb(color);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - radius + 0.5) / radius;
      const dy = (y - radius + 0.5) / radius;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      // Stepped falloff: four bands, no smooth gradient.
      const t = 1 - d;
      const band = t > softness ? 1 : t > softness * 0.6 ? 0.66 : t > softness * 0.3 ? 0.38 : 0.18;
      c.setPixel(x, y, r, g, b, Math.round(band * 255));
    }
  }
  return c;
}

function hexToRgb(color: string): [number, number, number] {
  const v = Number.parseInt(color.replace('#', ''), 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

/** Soft vignette for the screen edges. */
export function paintVignette(w: number, h: number): PixelCanvas {
  const c = PixelCanvas.from(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - w / 2) / (w / 2);
      const ny = (y - h / 2) / (h / 2);
      const d = Math.min(1, Math.sqrt(nx * nx + ny * ny) / 1.42);
      if (d < 0.55) continue;
      const band = d > 0.85 ? 0.85 : d > 0.72 ? 0.55 : 0.28;
      c.setPixel(x, y, ...hexToRgb(PAL.ink), Math.round(band * 255));
    }
  }
  return c;
}

/** Sky gradient for the title screen and the map panel, banded not smooth. */
export function paintSky(w: number, h: number, top: string, bottom: string, bands = 9): PixelCanvas {
  const c = PixelCanvas.from(w, h);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    const band = Math.floor(t * bands) / (bands - 1);
    c.hline(0, y, w, mix(top, bottom, Math.min(1, band)));
  }
  return c;
}