/**
 * Painted backdrops for the title and loading screens.
 *
 * The game's world is dusk in the monsoon: a banded sky, a low sun, layered
 * hills, a village roofline with lit windows, and a river catching the last
 * light. This is drawn with the same pixel grammar as the tiles so the menu
 * feels like a place in the game rather than a web page about it.
 */

import { PAL, mix, shade } from './palette';
import { mulberry32, PixelCanvas } from './PixelCanvas';

export type BackdropVariant = 'dusk' | 'night' | 'dawn';

export interface BackdropOptions {
  width: number;
  height: number;
  variant?: BackdropVariant;
  /** Draw the village roofline and the river. */
  village?: boolean;
}

interface SkyStops {
  top: string;
  upper: string;
  mid: string;
  low: string;
  horizon: string;
  sun: string;
  sunCore: string;
  far: string;
  midHill: string;
  near: string;
  water: string;
  glint: string;
}

const SKIES: Record<BackdropVariant, SkyStops> = {
  dusk: {
    top: '#191428',
    upper: '#2b2340',
    mid: '#4a2f4a',
    low: '#8a4650',
    horizon: '#c9714f',
    sun: '#f2c078',
    sunCore: '#ffe6b0',
    far: '#3a2f4a',
    midHill: '#2a3431',
    near: '#1b2620',
    water: '#2c4657',
    glint: '#e0a06a',
  },
  night: {
    top: '#0d0b18',
    upper: '#141126',
    mid: '#1e1a33',
    low: '#2a2440',
    horizon: '#3a3048',
    sun: '#e8dcc0',
    sunCore: '#fff6ea',
    far: '#211d33',
    midHill: '#182420',
    near: '#111a16',
    water: '#1c2f3d',
    glint: '#c9b98a',
  },
  dawn: {
    top: '#1d1a30',
    upper: '#343050',
    mid: '#5a4058',
    low: '#a05c58',
    horizon: '#e0a06a',
    sun: '#f6d5a0',
    sunCore: '#fff6ea',
    far: '#3f3650',
    midHill: '#2f3a34',
    near: '#1f2a24',
    water: '#33505f',
    glint: '#f0c080',
  },
};

export function paintBackdrop(opts: BackdropOptions): PixelCanvas {
  const { width: w, height: h } = opts;
  const variant = opts.variant ?? 'dusk';
  const sky = SKIES[variant];
  const c = PixelCanvas.from(w, h);
  const rnd = mulberry32(variant.length * 977 + w);
  const horizon = Math.round(h * 0.6);

  /* Sky, banded with a one-pixel dither at each seam. */
  const bands = 18;
  for (let y = 0; y < horizon; y++) {
    const t = y / (horizon - 1);
    const idx = Math.min(bands - 1, Math.floor(t * bands));
    const local = t * bands - idx;
    const a = skyStopsAt(sky, idx / (bands - 1));
    const b = skyStopsAt(sky, Math.min(1, (idx + 1) / (bands - 1)));
    c.hline(0, y, w, local > 0.72 ? b : a);
  }

  /* Stars, thicker at the top and only at night. */
  const starCount = variant === 'night' ? 120 : variant === 'dusk' ? 55 : 25;
  for (let i = 0; i < starCount; i++) {
    const x = Math.floor(rnd() * w);
    const y = Math.floor(rnd() * horizon * 0.62);
    const bright = rnd();
    c.px(x, y, bright > 0.85 ? '#fff6ea' : bright > 0.55 ? PAL.parchmentDim : mix(sky.upper, PAL.parchment, 0.5));
    if (bright > 0.94) {
      c.px(x - 1, y, mix(sky.upper, PAL.parchment, 0.35));
      c.px(x + 1, y, mix(sky.upper, PAL.parchment, 0.35));
      c.px(x, y - 1, mix(sky.upper, PAL.parchment, 0.35));
      c.px(x, y + 1, mix(sky.upper, PAL.parchment, 0.35));
    }
  }

  /* Sun or moon, low over the ridge. */
  const sunX = Math.round(w * 0.72);
  const sunY = Math.round(horizon * (variant === 'night' ? 0.42 : 0.72));
  const sunR = variant === 'night' ? 11 : 15;
  c.disc(sunX, sunY, sunR + 5, mix(sky.horizon, sky.sun, 0.35), 70);
  c.disc(sunX, sunY, sunR + 2, mix(sky.horizon, sky.sun, 0.6), 110);
  c.disc(sunX, sunY, sunR, sky.sun);
  c.disc(sunX - 2, sunY - 2, Math.max(2, sunR - 5), sky.sunCore);
  if (variant === 'night') {
    c.disc(sunX + 5, sunY - 3, sunR - 2, sky.upper);
    c.disc(sunX + 7, sunY - 5, sunR - 3, sky.upper);
  }

  /* Long cloud bars, lit from below. */
  for (let i = 0; i < 5; i++) {
    const cy = Math.round(horizon * (0.24 + rnd() * 0.42));
    const cw = Math.round(w * (0.18 + rnd() * 0.3));
    const cx = Math.round(rnd() * (w - cw));
    const ch = 3 + Math.floor(rnd() * 4);
    c.ellipse(cx + cw / 2, cy, cw / 2, ch, mix(sky.mid, sky.low, 0.4), 120);
    c.hline(cx + 4, cy + ch - 1, cw - 8, mix(sky.low, sky.horizon, 0.45), 90);
  }

  /* Three ridges, each with a lit rim. */
  ridge(c, w, h, horizon + 6, 10, 0.9, sky.far, 0);
  treeLine(c, w, horizon, 0.55, 26, sky.far, rnd);
  ridge(c, w, h, horizon + 34, 14, 1.7, sky.midHill, 5);
  treeLine(c, w, horizon + 22, 0.9, 34, sky.midHill, rnd);
  ridge(c, w, h, horizon + 68, 9, 2.6, sky.near, 10);

  if (opts.village !== false) {
    village(c, w, horizon, sky, rnd);
    river(c, w, h, horizon, sky, rnd);
  }

  foreground(c, w, h, sky, rnd);
  return c;
}

function skyStopsAt(sky: SkyStops, t: number): string {
  // Five stops: top, upper, mid, low, horizon.
  const stops = [sky.top, sky.upper, sky.mid, sky.low, sky.horizon];
  const x = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(x);
  return mix(stops[i]!, stops[Math.min(stops.length - 1, i + 1)]!, x - i);
}

/** A filled ridge line with a 1px rim, using summed sines for a natural crest. */
function ridge(
  c: PixelCanvas,
  w: number,
  h: number,
  baseY: number,
  amp: number,
  freq: number,
  color: string,
  rimLight: number,
): void {
  const rim = mix(color, PAL.parchment, 0.18);
  for (let x = 0; x < w; x++) {
    const t = (x / w) * Math.PI * 2 * freq;
    const y = Math.round(baseY + Math.sin(t) * amp * 0.6 + Math.sin(t * 2.3 + 1.2) * amp * 0.3 + Math.sin(t * 0.7) * amp * 0.4);
    for (let yy = y; yy < h; yy++) c.px(x, yy, color);
    c.px(x, y, rimLight > 0 ? rim : mix(color, PAL.ink, 0.2));
  }
}

/** Pines and round canopies along a ridge. */
function treeLine(
  c: PixelCanvas,
  w: number,
  baseY: number,
  scale: number,
  count: number,
  color: string,
  rnd: () => number,
): void {
  const dark = shade(color, 0.35);
  for (let i = 0; i < count; i++) {
    const x = Math.floor((i + rnd() * 0.6) * (w / count));
    const y = Math.round(baseY + 4 + rnd() * 8);
    const tall = 6 + rnd() * 10 * scale;
    if (rnd() < 0.45) {
      // Conifer: stacked triangles.
      for (let k = 0; k < 3; k++) {
        const half = Math.max(1, Math.round((3 - k) * 2 * scale));
        const yy = Math.round(y - (tall * (k + 1)) / 3);
        for (let dx = -half; dx <= half; dx++) c.px(x + dx, yy, k === 2 ? color : dark);
      }
      c.vline(x, y - 2, 3, dark);
    } else {
      // Broadleaf: a small canopy mass.
      const r = Math.max(2, Math.round(3 * scale));
      c.disc(x, y - r, r, dark);
      c.disc(x - 1, y - r - 1, Math.max(1, r - 1), color);
      c.vline(x, y - 1, 3, dark);
    }
  }
}

/** A village roofline with lit windows and a torii on the right. */
function village(c: PixelCanvas, w: number, horizon: number, sky: SkyStops, rnd: () => number): void {
  const baseY = horizon + 58;
  const roof = mix(sky.near, PAL.woodDark, 0.35);
  const wall = mix(sky.midHill, PAL.plaster, 0.18);
  const lit = PAL.lamp;
  const litCore = PAL.lampCore;

  let x = Math.round(w * 0.08);
  while (x < w * 0.62) {
    const hw = 24 + Math.floor(rnd() * 30);
    const hh = 12 + Math.floor(rnd() * 10);
    c.rect(x, baseY - hh, hw, hh + 8, wall);
    // Hipped roof.
    for (let row = 0; row < 6; row++) {
      const inset = Math.round((row / 6) * (hw / 2));
      c.hline(x - 3 + inset, baseY - hh - 6 + row, hw + 6 - inset * 2, row < 2 ? mix(roof, PAL.roofLit, 0.3) : roof);
    }
    c.hline(x - 4, baseY - hh, hw + 8, shade(roof, 0.3));
    // Windows.
    if (rnd() < 0.8) {
      const wx = x + 4 + Math.floor(rnd() * Math.max(1, hw - 12));
      c.rect(wx, baseY - hh + 5, 4, 4, lit);
      c.px(wx + 1, baseY - hh + 6, litCore);
    }
    if (rnd() < 0.4) {
      const wx = x + hw - 9;
      c.rect(wx, baseY - hh + 6, 3, 3, mix(lit, PAL.ember, 0.3));
    }
    x += hw + 6 + Math.floor(rnd() * 10);
  }

  // Torii gate on the eastern rise.
  const tx = Math.round(w * 0.8);
  const ty = baseY - 4;
  const gate = mix(sky.near, PAL.ember, 0.25);
  c.rect(tx - 12, ty - 24, 3, 26, gate);
  c.rect(tx + 10, ty - 24, 3, 26, gate);
  c.rect(tx - 17, ty - 27, 35, 3, gate);
  c.rect(tx - 14, ty - 21, 29, 2, shade(gate, 0.2));
  c.rect(tx - 2, ty - 27, 4, 5, shade(gate, 0.15));

  // A few tiny figures crossing the square.
  for (let i = 0; i < 3; i++) {
    const fx = Math.round(w * (0.2 + rnd() * 0.35));
    const fy = baseY + 4;
    c.px(fx, fy - 4, PAL.ink);
    c.rect(fx, fy - 3, 2, 3, PAL.ink);
  }
}

/** The river catching the sky. */
function river(c: PixelCanvas, w: number, h: number, horizon: number, sky: SkyStops, rnd: () => number): void {
  const top = horizon + 74;
  c.rect(0, top, w, h - top, sky.water);
  for (let y = top; y < h; y++) {
    const t = (y - top) / Math.max(1, h - top);
    c.hline(0, y, w, mix(sky.water, sky.near, t * 0.55));
  }
  // Glints: broken horizontal strokes, denser under the sun.
  for (let i = 0; i < 70; i++) {
    const y = top + 2 + Math.floor(rnd() * (h - top - 4));
    const bias = 1 - Math.abs(y - (top + 6)) / (h - top);
    const x = Math.floor(w * (0.35 + rnd() * 0.5));
    const len = 2 + Math.floor(rnd() * (3 + bias * 8));
    c.hline(x, y, len, rnd() < 0.3 ? mix(sky.glint, PAL.parchment, 0.35) : sky.glint);
  }
}

function foreground(c: PixelCanvas, w: number, h: number, sky: SkyStops, rnd: () => number): void {
  const top = h - 34;
  c.rect(0, top, w, h - top, sky.near);
  for (let x = 0; x < w; x++) {
    const y = top + Math.round(Math.sin(x * 0.09) * 1.5 + Math.sin(x * 0.031) * 2);
    c.px(x, y, mix(sky.near, PAL.leaf, 0.2));
  }
  // Grass blades.
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd() * w);
    const y = top + 4 + Math.floor(rnd() * (h - top - 4));
    const len = 2 + Math.floor(rnd() * 4);
    for (let k = 0; k < len; k++) c.px(x, y - k, mix(sky.near, PAL.leafLit, 0.25 + rnd() * 0.2));
  }
  // A path from the bottom edge toward the village.
  for (let y = h - 1; y >= top + 2; y--) {
    const t = (h - y) / (h - top);
    const half = Math.round(4 + t * 16);
    const cx = Math.round(w * 0.46 + Math.sin(t * 3) * 6);
    c.hline(cx - half, y, half * 2, mix(PAL.soil, PAL.sand, 0.3 + t * 0.2));
  }
  // Lantern posts at the path edge.
  for (const lx of [Math.round(w * 0.37), Math.round(w * 0.56)]) {
    const ly = h - 18;
    c.vline(lx, ly - 18, 18, PAL.woodDark);
    c.rect(lx - 3, ly - 24, 7, 6, PAL.lamp);
    c.rect(lx - 2, ly - 23, 5, 4, PAL.lampCore);
    c.disc(lx, ly - 20, 8, PAL.lamp, 26);
  }
}

/** A single soft cloud, for the title screen's slow drift. */
export function paintCloud(w = 72, h = 20, seed = 7): PixelCanvas {
  const c = PixelCanvas.from(w, h);
  const rnd = mulberry32(seed);
  const base = mix(PAL.shadowSoft, PAL.parchmentDim, 0.35);
  for (let i = 0; i < 5; i++) {
    const cx = 8 + rnd() * (w - 16);
    const cy = h * 0.55 + (rnd() - 0.5) * 4;
    const r = 3 + rnd() * 4;
    c.disc(cx, cy, r, base, 150);
    c.disc(cx - 1, cy - 1, Math.max(1, r - 2), mix(base, PAL.parchment, 0.25), 150);
  }
  c.hline(4, h - 4, w - 8, mix(base, PAL.ink, 0.15), 90);
  return c;
}

/** A wide, soft mist band for the title and the fog weather. */
export function paintMist(w = 160, h = 12, seed = 3): PixelCanvas {
  const c = PixelCanvas.from(w, h);
  const rnd = mulberry32(seed);
  for (let i = 0; i < 26; i++) {
    const x = rnd() * w;
    const y = h * 0.5 + (rnd() - 0.5) * h * 0.5;
    const r = 2 + rnd() * 4;
    c.disc(x, y, r, PAL.parchmentDim, 26);
  }
  return c;
}