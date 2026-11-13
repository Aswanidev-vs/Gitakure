/**
 * Props, buildings and interactables.
 *
 * Buildings share one grammar: stone plinth, plastered or timbered wall, then a
 * hipped roof whose ridge sits high and whose eaves overhang by a tile. The
 * Kerala half shows up as laterite plinths and steep clay-tile roofs; the Japan
 * half as deep eaves, shoji grids and small stone lanterns.
 */

import { PAL, mix, shade, tint } from './palette';
import { mulberry32, PixelCanvas } from './PixelCanvas';

export type PropId =
  /* Village furniture */
  | 'house_small'
  | 'house_medium'
  | 'house_player'
  | 'shop'
  | 'noticeboard'
  | 'bench'
  | 'lantern'
  | 'stone_lantern'
  | 'well'
  | 'fence_h'
  | 'fence_v'
  | 'signpost'
  | 'torii'
  | 'shrine'
  | 'farmhouse'
  | 'barn'
  | 'greenhouse'
  | 'desk'
  | 'bookshelf'
  | 'computer'
  | 'workbench'
  | 'crate'
  | 'barrel'
  | 'flower_pot'
  | 'bridge_h'
  | 'bridge_v'
  | 'campfire'
  | 'stone_marker'
  | 'project_stone'
  | 'observatory'
  | 'ruin_pillar'
  | 'market_stall'
  | 'window';

export interface PropSpec {
  w: number;
  h: number;
  /** Solid footprint measured from bottom-centre in pixels. 0 = walk-through. */
  solidW: number;
  solidH: number;
  /** Interactable label; absent means decoration only. */
  verb?: string;
  seed: number;
}

export const PROPS: Record<PropId, PropSpec> = {
  house_small: { w: 80, h: 80, solidW: 68, solidH: 20, verb: 'Enter', seed: 301 },
  house_medium: { w: 112, h: 96, solidW: 100, solidH: 24, verb: 'Enter', seed: 307 },
  house_player: { w: 112, h: 96, solidW: 100, solidH: 24, verb: 'Enter', seed: 311 },
  shop: { w: 112, h: 96, solidW: 100, solidH: 24, verb: 'Browse', seed: 313 },
  noticeboard: { w: 32, h: 40, solidW: 24, solidH: 8, verb: 'Read', seed: 317 },
  bench: { w: 32, h: 24, solidW: 26, solidH: 8, verb: 'Sit', seed: 331 },
  lantern: { w: 16, h: 40, solidW: 8, solidH: 6, seed: 337 },
  stone_lantern: { w: 20, h: 36, solidW: 14, solidH: 8, seed: 347 },
  well: { w: 40, h: 40, solidW: 30, solidH: 14, verb: 'Draw water', seed: 349 },
  fence_h: { w: 32, h: 24, solidW: 32, solidH: 6, seed: 353 },
  fence_v: { w: 32, h: 24, solidW: 6, solidH: 24, seed: 359 },
  signpost: { w: 24, h: 36, solidW: 10, solidH: 6, verb: 'Read', seed: 367 },
  torii: { w: 64, h: 72, solidW: 56, solidH: 10, seed: 373 },
  shrine: { w: 96, h: 88, solidW: 84, solidH: 22, verb: 'Enter', seed: 379 },
  farmhouse: { w: 112, h: 96, solidW: 100, solidH: 24, verb: 'Enter', seed: 383 },
  barn: { w: 96, h: 88, solidW: 86, solidH: 22, verb: 'Enter', seed: 389 },
  greenhouse: { w: 96, h: 80, solidW: 86, solidH: 20, verb: 'Enter', seed: 397 },
  desk: { w: 40, h: 28, solidW: 34, solidH: 12, verb: 'Work', seed: 401 },
  bookshelf: { w: 32, h: 40, solidW: 28, solidH: 10, verb: 'Read', seed: 409 },
  computer: { w: 24, h: 20, solidW: 20, solidH: 8, verb: 'Use', seed: 419 },
  workbench: { w: 40, h: 28, solidW: 34, solidH: 12, verb: 'Craft', seed: 421 },
  crate: { w: 24, h: 24, solidW: 20, solidH: 10, seed: 431 },
  barrel: { w: 20, h: 26, solidW: 16, solidH: 10, seed: 433 },
  flower_pot: { w: 16, h: 20, solidW: 12, solidH: 6, seed: 439 },
  bridge_h: { w: 96, h: 48, solidW: 0, solidH: 0, seed: 443 },
  bridge_v: { w: 48, h: 96, solidW: 0, solidH: 0, seed: 449 },
  campfire: { w: 24, h: 20, solidW: 16, solidH: 8, verb: 'Rest', seed: 457 },
  stone_marker: { w: 24, h: 32, solidW: 18, solidH: 8, verb: 'Examine', seed: 461 },
  project_stone: { w: 32, h: 48, solidW: 24, solidH: 10, verb: 'Examine', seed: 463 },
  observatory: { w: 96, h: 104, solidW: 84, solidH: 24, verb: 'Enter', seed: 467 },
  ruin_pillar: { w: 24, h: 56, solidW: 18, solidH: 10, seed: 471 },
  market_stall: { w: 48, h: 44, solidW: 40, solidH: 12, verb: 'Browse', seed: 479 },
  window: { w: 32, h: 36, solidW: 0, solidH: 0, seed: 487 },
};

/* ---------- shared sub-painters ---------- */

/** Stone plinth with a laterite tint — the Kerala floor of every building. */
function plinth(c: PixelCanvas, x: number, y: number, w: number, h: number): void {
  c.rect(x, y, w, h, PAL.stoneDark);
  for (let row = 0; row < h; row += 4) {
    c.hline(x, y + row, w, shade(PAL.stoneDark, 0.25));
    for (let bx = (row % 8 === 0 ? 0 : 5); bx < w; bx += 10) c.vline(x + bx, y + row, 4, shade(PAL.stoneDark, 0.15));
  }
  c.hline(x, y, w, PAL.stone);
}

/** Plaster wall with an optional timber frame. */
function wall(
  c: PixelCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { timber?: boolean; shoji?: boolean; seed?: number } = {},
): void {
  const { timber = true, shoji = false, seed = 5 } = opts;
  const rnd = mulberry32(seed);
  c.rect(x, y, w, h, PAL.plaster);
  for (let i = 0; i < w * h * 0.05; i++) {
    c.px(x + Math.floor(rnd() * w), y + Math.floor(rnd() * h), mix(PAL.plaster, PAL.parchmentDeep, 0.5));
  }
  c.hline(x, y, w, tint(PAL.plaster, 0.24));
  c.hline(x, y + h - 1, w, shade(PAL.plaster, 0.34));
  if (timber) {
    c.rect(x, y, 3, h, PAL.wood);
    c.rect(x + w - 3, y, 3, h, PAL.wood);
    c.vline(x, y, h, PAL.woodDark);
    c.vline(x + w - 1, y, h, PAL.woodDark);
    c.hline(x, y, w, PAL.woodDark);
    c.hline(x, y + h - 4, w, PAL.woodDark);
  }
  if (shoji) {
    const cols = Math.max(2, Math.floor(w / 16));
    for (let i = 1; i < cols; i++) {
      const gx = x + Math.round((w / cols) * i);
      c.vline(gx, y + 4, h - 8, PAL.woodDark);
    }
    for (let gy = y + 8; gy < y + h - 4; gy += 8) c.hline(x + 2, gy, w - 4, PAL.woodDark);
  }
}

/** Hipped roof with deep eaves and a clay-tile or slate finish. */
function roof(
  c: PixelCanvas,
  cx: number,
  eaveY: number,
  ridgeY: number,
  halfW: number,
  palette: { dark: string; mid: string; lit: string },
  rnd: () => number,
): void {
  const h = eaveY - ridgeY;
  for (let row = 0; row <= h; row++) {
    const t = row / h;
    const w = Math.round(halfW * (0.16 + t * 0.9));
    const y = ridgeY + row;
    c.hline(Math.round(cx - w), y, Math.max(2, w * 2), palette.mid);
    // Tile courses.
    for (let x = -w; x <= w; x += 5) {
      c.px(Math.round(cx + x), y, palette.dark);
      if (row % 3 === 0) c.px(Math.round(cx + x + 1), y, palette.lit);
    }
    if (row % 4 === 0) c.hline(Math.round(cx - w), y, Math.max(2, w * 2), palette.dark);
  }
  // Ridge cap.
  c.hline(Math.round(cx - halfW * 0.2), ridgeY, Math.round(halfW * 0.4), palette.lit);
  c.hline(Math.round(cx - halfW * 0.2), ridgeY - 1, Math.round(halfW * 0.4), palette.dark);
  // Eave underside shadow.
  c.hline(Math.round(cx - halfW), eaveY, halfW * 2, shade(palette.dark, 0.4));
  for (let i = 0; i < 6; i++) c.px(Math.round(cx - halfW + rnd() * halfW * 2), eaveY + 1, shade(palette.dark, 0.5));
}

const ROOF_CLAY = { dark: '#6b3f30', mid: '#8f5238', lit: '#b06a44' };
const ROOF_SLATE = { dark: PAL.roofDark, mid: PAL.roof, lit: PAL.roofLit };

/** Two-panel sliding door on the front face. */
function doors(c: PixelCanvas, cx: number, y: number, h: number, open = false): void {
  const w = 22;
  const x = Math.round(cx - w / 2);
  c.rect(x - 2, y - 2, w + 4, h + 2, PAL.woodDark);
  if (open) {
    c.rect(x, y, w, h, PAL.ink);
    c.rect(x, y, w, 3, shade(PAL.woodDark, 0.2));
  } else {
    c.rect(x, y, w, h, PAL.wood);
    c.vline(x + Math.floor(w / 2), y, h, PAL.woodDark);
    for (let i = 4; i < h - 2; i += 6) c.hline(x + 1, y + i, w - 2, mix(PAL.wood, PAL.woodLit, 0.3));
    c.px(x + Math.floor(w / 2) - 2, y + Math.floor(h / 2), PAL.accent);
    c.px(x + Math.floor(w / 2) + 2, y + Math.floor(h / 2), PAL.accent);
  }
}

/** Warm window glow; the light source that makes the village feel inhabited. */
function window(c: PixelCanvas, x: number, y: number, w = 14, h = 12, lit = true): void {
  c.rect(x - 1, y - 1, w + 2, h + 2, PAL.woodDark);
  c.rect(x, y, w, h, lit ? PAL.lamp : PAL.waterDeep);
  if (lit) {
    c.rect(x + 1, y + 1, w - 2, Math.floor(h / 2), PAL.lampCore);
    c.hline(x, y + h - 1, w, shade(PAL.lamp, 0.3));
  }
  c.vline(x + Math.floor(w / 2), y, h, PAL.woodDark);
  c.hline(x, y + Math.floor(h / 2), w, PAL.woodDark);
}

function house(c: PixelCanvas, spec: PropSpec, roofPal: typeof ROOF_CLAY, opts: { twoStory?: boolean; shoji?: boolean } = {}): void {
  const rnd = mulberry32(spec.seed);
  const cx = spec.w / 2;
  const bodyW = Math.round(spec.w * 0.78);
  const bodyH = opts.twoStory ? 48 : 36;
  const plinthH = 8;
  const eaveY = spec.h - plinthH - bodyH;
  const ridgeY = Math.max(4, eaveY - (opts.twoStory ? 30 : 24));
  const bodyX = Math.round(cx - bodyW / 2);
  const bodyY = eaveY;

  plinth(c, bodyX - 2, bodyY + bodyH, bodyW + 4, plinthH);
  wall(c, bodyX, bodyY, bodyW, bodyH, { shoji: opts.shoji, seed: spec.seed });
  roof(c, cx, eaveY + 1, ridgeY, Math.round(spec.w * 0.52), roofPal, rnd);

  const doorH = Math.min(bodyH - 12, 26);
  doors(c, cx, bodyY + bodyH - doorH, doorH);
  const wy = bodyY + 8;
  window(c, bodyX + 8, wy);
  window(c, bodyX + bodyW - 22, wy);

  if (opts.twoStory) {
    // A smaller upper storey peeking above the main eave.
    const upW = Math.round(bodyW * 0.6);
    const upH = 16;
    const upY = eaveY - upH;
    wall(c, Math.round(cx - upW / 2), upY, upW, upH, { shoji: true, seed: spec.seed + 1 });
    window(c, Math.round(cx - upW / 2) + 6, upY + 4, 10, 8);
    window(c, Math.round(cx + upW / 2) - 16, upY + 4, 10, 8);
    roof(c, cx, upY, ridgeY, Math.round(upW * 0.75), roofPal, rnd);
  }
  c.outline(PAL.outline);
}

export function paintProp(id: PropId, opts: { lit?: boolean } = {}): PixelCanvas {
  const spec = PROPS[id];
  const c = PixelCanvas.from(spec.w, spec.h);
  const rnd = mulberry32(spec.seed);
  const cx = spec.w / 2;
  const base = spec.h - 1;
  const lit = opts.lit ?? true;

  switch (id) {
    case 'house_small':
      house(c, spec, ROOF_CLAY);
      break;
    case 'house_medium':
      house(c, spec, ROOF_CLAY, { twoStory: true, shoji: true });
      break;
    case 'house_player':
      house(c, spec, ROOF_CLAY, { twoStory: true });
      break;
    case 'shop':
      house(c, spec, ROOF_CLAY, { shoji: true });
      // Shop curtain.
      {
        const bodyW = Math.round(spec.w * 0.78);
        const bodyX = Math.round(cx - bodyW / 2);
        const cy = spec.h - 8 - 30;
        for (let i = 0; i < 12; i++) {
          const x = bodyX + 6 + i * 5;
          c.rect(x, cy, 5, 10, i % 2 === 0 ? PAL.blossomDark : PAL.blossom);
        }
        c.hline(bodyX + 6, cy, 60, PAL.woodDark);
      }
      break;
    case 'farmhouse':
      house(c, spec, ROOF_CLAY, { twoStory: false, shoji: true });
      break;
    case 'shrine': {
      plinth(c, 4, spec.h - 10, spec.w - 8, 10);
      wall(c, 10, spec.h - 46, spec.w - 20, 36, { timber: true, shoji: true, seed: spec.seed });
      roof(c, cx, spec.h - 44, 6, Math.round(spec.w * 0.56), ROOF_SLATE, rnd);
      // Offering box and bell rope.
      c.rect(cx - 10, spec.h - 24, 20, 10, PAL.wood);
      c.hline(cx - 10, spec.h - 24, 20, PAL.woodDark);
      for (let i = -10; i <= 10; i += 4) c.vline(cx + i, spec.h - 24, 10, PAL.woodDark);
      c.vline(cx, spec.h - 44, 14, PAL.parchmentDim);
      c.disc(cx, spec.h - 29, 3, PAL.parchment);
      c.outline(PAL.outline);
      break;
    }
    case 'barn': {
      const bodyW = spec.w - 12;
      const bodyX = 6;
      const bodyH = spec.h - 18;
      const bodyY = spec.h - 10 - bodyH;
      plinth(c, bodyX, bodyY + bodyH, bodyW, 10);
      wall(c, bodyX, bodyY, bodyW, bodyH, { timber: true, seed: spec.seed });
      roof(c, cx, bodyY + 1, 4, Math.round(spec.w * 0.55), ROOF_CLAY, rnd);
      doors(c, cx, bodyY + bodyH - 26, 26);
      c.outline(PAL.outline);
      break;
    }
    case 'greenhouse': {
      const bodyW = spec.w - 14;
      const bodyX = 7;
      const bodyH = spec.h - 16;
      const bodyY = spec.h - 8 - bodyH;
      // Glass panels.
      c.rect(bodyX, bodyY, bodyW, bodyH, PAL.waterLit, 130);
      c.rect(bodyX, bodyY, bodyW, bodyH, PAL.foam, 40);
      for (let x = bodyX; x <= bodyX + bodyW; x += 8) c.vline(x, bodyY, bodyH, PAL.parchmentDim);
      for (let y = bodyY; y <= bodyY + bodyH; y += 8) c.hline(bodyX, y, bodyW, PAL.parchmentDim);
      // Plants inside.
      for (let i = 0; i < 6; i++) {
        const px = bodyX + 6 + Math.floor(rnd() * (bodyW - 12));
        const py = bodyY + bodyH - 4;
        c.disc(px, py - 3, 3, PAL.leaf);
        c.px(px - 1, py - 4, PAL.leafLit);
      }
      // Frame.
      c.frame(bodyX, bodyY, bodyW, bodyH, PAL.parchmentDim);
      roof(c, cx, bodyY, 6, Math.round(spec.w * 0.5), { dark: PAL.stoneDark, mid: PAL.stone, lit: PAL.stoneLit }, rnd);
      c.outline(PAL.outline);
      break;
    }
    case 'observatory': {
      const bodyW = spec.w - 16;
      const bodyX = 8;
      const bodyH = spec.h - 26;
      const bodyY = spec.h - 12 - bodyH;
      plinth(c, bodyX, bodyY + bodyH, bodyW, 12);
      wall(c, bodyX, bodyY, bodyW, bodyH, { timber: true, seed: spec.seed });
      window(c, bodyX + 10, bodyY + 12, 16, 14, lit);
      window(c, bodyX + bodyW - 26, bodyY + 12, 16, 14, lit);
      doors(c, cx, bodyY + bodyH - 24, 24);
      // Dome.
      const domeY = bodyY - 2;
      c.disc(cx, domeY, 24, PAL.roof);
      c.disc(cx, domeY - 1, 22, PAL.roofLit);
      for (let a = 0; a < Math.PI; a += 0.22) {
        c.px(Math.round(cx + Math.cos(a) * 23), Math.round(domeY - Math.sin(a) * 22), PAL.roofDark);
      }
      c.rect(cx - 3, domeY - 28, 6, 12, PAL.roofDark);
      c.disc(cx, domeY - 30, 4, PAL.parchmentDim);
      c.outline(PAL.outline);
      break;
    }
    case 'noticeboard': {
      c.rect(cx - 2, base - 14, 4, 14, PAL.woodDark);
      c.rect(cx - 14, 6, 28, 20, PAL.wood);
      c.frame(cx - 14, 6, 28, 20, PAL.woodDark);
      // Pinned notes.
      const notes = [PAL.parchment, PAL.parchmentDim, PAL.blossomLit];
      for (let i = 0; i < 3; i++) {
        c.rect(cx - 11 + i * 8, 9 + (i % 2) * 6, 6, 8, notes[i]!);
        c.hline(cx - 11 + i * 8, 10 + (i % 2) * 6, 6, PAL.parchmentDeep);
      }
      c.rect(cx - 16, 2, 32, 4, ROOF_CLAY.mid);
      c.hline(cx - 16, 2, 32, ROOF_CLAY.lit);
      c.outline(PAL.outline);
      break;
    }
    case 'bench': {
      const y = base - 14;
      c.rect(2, y, spec.w - 4, 5, PAL.wood);
      c.hline(2, y, spec.w - 4, PAL.woodLit);
      c.rect(2, y - 8, spec.w - 4, 4, PAL.wood);
      c.hline(2, y - 8, spec.w - 4, PAL.woodLit);
      c.rect(4, y + 5, 4, 8, PAL.woodDark);
      c.rect(spec.w - 8, y + 5, 4, 8, PAL.woodDark);
      c.outline(PAL.outline);
      break;
    }
    case 'lantern': {
      c.rect(cx - 1, base - 8, 2, 8, PAL.woodDark);
      c.rect(cx - 5, base - 26, 10, 18, PAL.wood);
      c.frame(cx - 5, base - 26, 10, 18, PAL.woodDark);
      if (lit) {
        c.rect(cx - 3, base - 23, 6, 12, PAL.lampCore);
        c.rect(cx - 3, base - 23, 6, 6, PAL.lamp);
      } else {
        c.rect(cx - 3, base - 23, 6, 12, PAL.parchmentDeep);
      }
      c.rect(cx - 7, base - 30, 14, 4, ROOF_SLATE.mid);
      c.hline(cx - 7, base - 30, 14, ROOF_SLATE.lit);
      c.outline(PAL.outline);
      break;
    }
    case 'stone_lantern': {
      const y = base - 30;
      c.rect(cx - 5, base - 8, 10, 8, PAL.stoneDark);
      c.rect(cx - 3, y + 8, 6, 16, PAL.stone);
      c.vline(cx - 3, y + 8, 16, PAL.stoneDark);
      c.rect(cx - 8, y + 2, 16, 7, PAL.stone);
      c.rect(cx - 6, y + 3, 12, 5, lit ? PAL.lamp : PAL.stoneDark);
      c.rect(cx - 9, y - 4, 18, 6, PAL.stoneDark);
      c.hline(cx - 9, y - 4, 18, PAL.stoneLit);
      c.disc(cx, y - 6, 3, PAL.stone);
      c.outline(PAL.outline);
      break;
    }
    case 'well': {
      const y = base - 16;
      c.rect(cx - 15, y, 30, 16, PAL.stoneDark);
      for (let row = 0; row < 16; row += 4) {
        c.hline(cx - 15, y + row, 30, shade(PAL.stoneDark, 0.2));
        for (let bx = 0; bx < 30; bx += 8) c.vline(cx - 15 + bx + (row % 8 ? 4 : 0), y + row, 4, PAL.stone);
      }
      c.rect(cx - 12, y + 2, 24, 5, PAL.ink);
      c.rect(cx - 12, y + 2, 24, 2, PAL.waterDeep);
      // Posts and crossbar.
      c.rect(cx - 14, y - 18, 3, 18, PAL.wood);
      c.rect(cx + 11, y - 18, 3, 18, PAL.wood);
      c.rect(cx - 16, y - 22, 32, 4, ROOF_CLAY.mid);
      c.hline(cx - 16, y - 22, 32, ROOF_CLAY.lit);
      c.vline(cx, y - 18, 10, PAL.parchmentDim);
      c.rect(cx - 3, y - 10, 6, 5, PAL.woodDark);
      c.outline(PAL.outline);
      break;
    }
    case 'fence_h': {
      const y = base - 16;
      c.rect(0, y, spec.w, 3, PAL.wood);
      c.hline(0, y, spec.w, PAL.woodLit);
      c.rect(0, y + 7, spec.w, 3, PAL.wood);
      c.hline(0, y + 7, spec.w, PAL.woodLit);
      c.rect(4, y - 3, 4, 19, PAL.woodDark);
      c.rect(spec.w - 8, y - 3, 4, 19, PAL.woodDark);
      c.outline(PAL.outline);
      break;
    }
    case 'fence_v': {
      c.rect(13, 0, 3, spec.h, PAL.wood);
      c.vline(13, 0, spec.h, PAL.woodLit);
      c.rect(20, 0, 3, spec.h, PAL.wood);
      c.vline(20, 0, spec.h, PAL.woodLit);
      c.rect(10, 6, 4, 10, PAL.woodDark);
      c.rect(10, spec.h - 16, 4, 10, PAL.woodDark);
      c.outline(PAL.outline);
      break;
    }
    case 'signpost': {
      c.rect(cx - 2, base - 24, 4, 24, PAL.woodDark);
      c.rect(2, 6, spec.w - 4, 12, PAL.wood);
      c.frame(2, 6, spec.w - 4, 12, PAL.woodDark);
      for (let i = 0; i < 3; i++) c.hline(5, 9 + i * 3, spec.w - 14, PAL.woodDark);
      c.outline(PAL.outline);
      break;
    }
    case 'torii': {
      const y = base - 60;
      c.rect(cx - 26, y, 6, 60, PAL.ember);
      c.rect(cx + 20, y, 6, 60, PAL.ember);
      c.vline(cx - 26, y, 60, shade(PAL.ember, 0.35));
      c.vline(cx + 25, y, 60, shade(PAL.ember, 0.35));
      // Kasagi (top lintel) with the upward curve.
      c.rect(cx - 32, y - 8, 64, 7, PAL.ember);
      c.hline(cx - 32, y - 8, 64, tint(PAL.ember, 0.24));
      c.rect(cx - 34, y - 11, 68, 4, shade(PAL.ember, 0.3));
      c.rect(cx - 30, y + 12, 60, 5, PAL.ember);
      c.hline(cx - 30, y + 12, 60, shade(PAL.ember, 0.2));
      c.outline(PAL.outline);
      break;
    }
    case 'desk': {
      const y = base - 16;
      c.rect(1, y, spec.w - 2, 5, PAL.wood);
      c.hline(1, y, spec.w - 2, PAL.plank);
      c.rect(3, y + 5, 4, 11, PAL.woodDark);
      c.rect(spec.w - 7, y + 5, 4, 11, PAL.woodDark);
      // Papers and a lamp.
      c.rect(6, y - 3, 12, 3, PAL.parchment);
      c.rect(20, y - 5, 6, 5, PAL.parchmentDim);
      c.rect(spec.w - 12, y - 8, 6, 8, PAL.stoneDark);
      c.rect(spec.w - 11, y - 7, 4, 5, PAL.lamp);
      c.outline(PAL.outline);
      break;
    }
    case 'bookshelf': {
      const y = 2;
      const h = base - 2;
      c.rect(1, y, spec.w - 2, h, PAL.woodDark);
      c.rect(3, y + 2, spec.w - 6, h - 4, shade(PAL.woodDark, 0.2));
      const bookCols = [PAL.blossomDark, PAL.stamina, PAL.accent, PAL.waterDeep, PAL.parchmentDeep, PAL.spirit];
      for (let shelf = 0; shelf < 3; shelf++) {
        const sy = y + 4 + shelf * 12;
        c.hline(3, sy + 9, spec.w - 6, PAL.wood);
        let bx = 4;
        while (bx < spec.w - 6) {
          const bw = 2 + Math.floor(rnd() * 3);
          const bh = 6 + Math.floor(rnd() * 3);
          const col = bookCols[Math.floor(rnd() * bookCols.length)]!;
          c.rect(bx, sy + 9 - bh, bw, bh, col);
          c.vline(bx, sy + 9 - bh, bh, shade(col, 0.3));
          bx += bw + 1;
        }
      }
      c.outline(PAL.outline);
      break;
    }
    case 'computer': {
      // A chunky CRT on a small stand — deliberately not a modern all-in-one.
      c.rect(1, base - 6, spec.w - 2, 6, PAL.woodDark);
      c.rect(2, 2, spec.w - 4, spec.h - 10, PAL.parchmentDim);
      c.rect(4, 4, spec.w - 8, spec.h - 16, PAL.ink);
      c.rect(5, 5, spec.w - 10, spec.h - 18, '#2c4a44');
      for (let i = 0; i < 4; i++) {
        const w = 2 + Math.floor(rnd() * 8);
        c.hline(7, 7 + i * 3, w, PAL.stamina);
      }
      c.outline(PAL.outline);
      break;
    }
    case 'workbench': {
      const y = base - 16;
      c.rect(0, y, spec.w, 6, PAL.plank);
      c.hline(0, y, spec.w, tint(PAL.plank, 0.2));
      c.rect(2, y + 6, 4, 10, PAL.woodDark);
      c.rect(spec.w - 6, y + 6, 4, 10, PAL.woodDark);
      // Tools laid out.
      c.rect(6, y - 4, 10, 3, PAL.stone);
      c.rect(20, y - 6, 3, 5, PAL.woodDark);
      c.rect(24, y - 4, 6, 3, PAL.stoneLit);
      c.outline(PAL.outline);
      break;
    }
    case 'crate': {
      const y = base - 20;
      c.rect(2, y, spec.w - 4, 20, PAL.wood);
      c.frame(2, y, spec.w - 4, 20, PAL.woodDark);
      c.line(3, y + 1, spec.w - 3, y + 19, PAL.woodDark);
      c.line(spec.w - 3, y + 1, 3, y + 19, PAL.woodDark);
      c.hline(2, y + 6, spec.w - 4, PAL.woodLit);
      c.outline(PAL.outline);
      break;
    }
    case 'barrel': {
      const y = base - 22;
      c.rect(2, y, spec.w - 4, 22, PAL.wood);
      c.rect(2, y + 3, spec.w - 4, 2, PAL.stoneDark);
      c.rect(2, y + 15, spec.w - 4, 2, PAL.stoneDark);
      for (let x = 4; x < spec.w - 3; x += 5) c.vline(x, y + 1, 20, shade(PAL.wood, 0.18));
      c.hline(2, y, spec.w - 4, PAL.plank);
      c.outline(PAL.outline);
      break;
    }
    case 'flower_pot': {
      const y = base - 8;
      c.rect(3, y + 4, spec.w - 6, 6, '#9c5f42');
      c.rect(3, y + 4, spec.w - 6, 2, '#b87352');
      c.hline(3, y + 9, spec.w - 6, '#7a4632');
      c.vline(8, y - 2, 7, PAL.leaf);
      c.vline(11, y - 4, 9, PAL.leafLit);
      c.disc(8, y - 3, 2, PAL.blossom);
      c.disc(12, y - 5, 2, PAL.accentSoft);
      c.outline(PAL.outline);
      break;
    }
    case 'bridge_h': {
      // Planks running across a stream, with rails.
      c.rect(0, 6, spec.w, spec.h - 12, PAL.wood);
      for (let x = 0; x < spec.w; x += 6) {
        c.vline(x, 6, spec.h - 12, PAL.woodDark);
        c.vline(x + 1, 7, spec.h - 14, mix(PAL.wood, PAL.woodLit, 0.3));
      }
      c.rect(0, 2, spec.w, 4, PAL.woodDark);
      c.hline(0, 2, spec.w, PAL.plank);
      c.rect(0, spec.h - 6, spec.w, 4, PAL.woodDark);
      c.hline(0, spec.h - 6, spec.w, PAL.plank);
      for (let x = 4; x < spec.w; x += 24) {
        c.rect(x, 0, 4, spec.h, PAL.woodDark);
      }
      c.outline(PAL.outline);
      break;
    }
    case 'bridge_v': {
      c.rect(6, 0, spec.h ? spec.w - 12 : 0, spec.h, PAL.wood);
      for (let y = 0; y < spec.h; y += 6) {
        c.hline(6, y, spec.w - 12, PAL.woodDark);
        c.hline(7, y + 1, spec.w - 14, mix(PAL.wood, PAL.woodLit, 0.3));
      }
      c.rect(2, 0, 4, spec.h, PAL.woodDark);
      c.rect(spec.w - 6, 0, 4, spec.h, PAL.woodDark);
      c.outline(PAL.outline);
      break;
    }
    case 'campfire': {
      const y = base - 6;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        c.disc(cx + Math.cos(a) * 8, y + Math.sin(a) * 3, 3, PAL.stone);
      }
      c.line(cx - 6, y + 2, cx + 6, y - 2, PAL.woodDark);
      c.line(cx - 6, y - 2, cx + 6, y + 2, PAL.woodDark);
      c.disc(cx, y - 4, 4, PAL.ember);
      c.disc(cx, y - 6, 3, PAL.fire);
      c.disc(cx, y - 8, 2, PAL.lampCore);
      c.outline(PAL.outline);
      break;
    }
    case 'stone_marker':
    case 'project_stone': {
      const h = spec.h - 6;
      c.rect(cx - 8, base - h, 16, h, PAL.stone);
      c.rect(cx - 8, base - h, 5, h, PAL.stoneLit);
      c.vline(cx + 6, base - h, h, PAL.stoneDark);
      // Inscription band.
      c.rect(cx - 5, base - h + 8, 10, 12, shade(PAL.stone, 0.3));
      for (let i = 0; i < 3; i++) c.hline(cx - 3, base - h + 11 + i * 3, 6 - i, PAL.parchmentDim);
      if (id === 'project_stone') {
        // A small carved glyph that reads as a repository mark.
        c.frame(cx - 4, base - h + 24, 8, 8, PAL.accent);
        c.px(cx, base - h + 27, PAL.accentSoft);
        c.px(cx - 1, base - h + 28, PAL.accentSoft);
        c.px(cx + 1, base - h + 28, PAL.accentSoft);
      }
      c.outline(PAL.outline);
      break;
    }
    case 'ruin_pillar': {
      const y = 4;
      c.rect(cx - 8, y, 16, spec.h - 6, PAL.stone);
      c.rect(cx - 8, y, 5, spec.h - 6, PAL.stoneLit);
      c.vline(cx + 6, y, spec.h - 6, PAL.stoneDark);
      // Weathering: moss at the base and a broken top.
      c.rect(cx - 8, base - 12, 16, 10, PAL.moss, 150);
      c.rect(cx - 8, y, 16, 4, PAL.stoneDark);
      for (let i = 0; i < 5; i++) c.px(cx - 6 + i * 3, y + 4 + (i % 2) * 2, PAL.stoneDark);
      // Carved band.
      c.hline(cx - 6, y + 18, 12, shade(PAL.stone, 0.3));
      c.outline(PAL.outline);
      break;
    }
    case 'market_stall': {
      const y = base - 30;
      c.rect(cx - 20, y + 10, 4, 20, PAL.woodDark);
      c.rect(cx + 16, y + 10, 4, 20, PAL.woodDark);
      // Striped awning.
      for (let i = 0; i < 10; i++) {
        c.rect(cx - 24 + i * 5, y, 5, 12, i % 2 === 0 ? PAL.blossom : PAL.parchment);
      }
      c.hline(cx - 24, y, 50, shade(PAL.blossomDark, 0.2));
      for (let i = 0; i < 10; i++) c.px(cx - 22 + i * 5, y + 12, PAL.blossomDark);
      // Counter and produce.
      c.rect(cx - 22, y + 18, 44, 8, PAL.plank);
      c.hline(cx - 22, y + 18, 44, tint(PAL.plank, 0.2));
      const produce = [PAL.ember, PAL.accent, PAL.stamina, PAL.blossom];
      for (let i = 0; i < 8; i++) {
        const px = cx - 18 + (i % 4) * 10;
        const py = y + 16 - Math.floor(i / 4) * 3;
        c.disc(px, py, 3, produce[i % produce.length]!);
      }
      c.outline(PAL.outline);
      break;
    }
    case 'window': {
      // A timber-framed window onto the fields. Used in the hideaway.
      c.rect(0, 0, spec.w, spec.h, PAL.woodDark);
      c.rect(3, 3, spec.w - 6, spec.h - 6, PAL.wood);
      c.rect(5, 5, spec.w - 10, spec.h - 10, '#6f8fa0');
      // Banded sky and a low green horizon.
      for (let y = 5; y < 19; y++) {
        const t = (y - 5) / 14;
        c.hline(5, y, spec.w - 10, mix('#8fb8c4', '#e0c05a', t * 0.55));
      }
      c.rect(5, 20, spec.w - 10, 8, PAL.leaf);
      c.hline(5, 20, spec.w - 10, PAL.leafLit);
      c.rect(5, 27, spec.w - 10, 4, PAL.moss);
      // Mullions.
      c.vline(spec.w / 2, 5, spec.h - 10, PAL.woodDark);
      c.hline(5, 20, spec.w - 10, PAL.woodDark);
      c.frame(5, 5, spec.w - 10, spec.h - 10, PAL.woodDark);
      c.hline(3, spec.h - 3, spec.w - 6, PAL.woodLit);
      c.outline(PAL.outline);
      break;
    }
    default:
      break;
  }

  c.outline(PAL.outline);
  return c;
}

/** Build one canvas per prop, for texture registration. */
export function buildProps(lit = true): Record<PropId, PixelCanvas> {
  const out = {} as Record<PropId, PixelCanvas>;
  for (const id of Object.keys(PROPS) as PropId[]) out[id] = paintProp(id, { lit });
  return out;
}