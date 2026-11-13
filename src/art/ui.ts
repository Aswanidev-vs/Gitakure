/**
 * UI chrome and icons, painted in the same pixel grammar as the world.
 *
 * Panels use a parchment face with a dark timber frame; that pairing is the
 * game's visual signature and it is reused for the dialogue box, inventory,
 * journal and map. Icons are 16x16 so they sit comfortably in a 32px hotbar.
 */

import { PAL, mix, tint } from './palette';
import { mulberry32, PixelCanvas } from './PixelCanvas';

export type IconId =
  | 'hoe'
  | 'watering_can'
  | 'sickle'
  | 'rod'
  | 'axe'
  | 'seed_rice'
  | 'seed_wheat'
  | 'seed_tomato'
  | 'seed_carrot'
  | 'seed_potato'
  | 'seed_pumpkin'
  | 'seed_strawberry'
  | 'seed_corn'
  | 'seed_cabbage'
  | 'seed_flower'
  | 'rice'
  | 'wheat'
  | 'tomato'
  | 'carrot'
  | 'potato'
  | 'pumpkin'
  | 'strawberry'
  | 'corn'
  | 'cabbage'
  | 'flower'
  | 'fish'
  | 'wood'
  | 'stone'
  | 'heart'
  | 'clock'
  | 'sun'
  | 'moon'
  | 'cloud'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'book'
  | 'map'
  | 'bag'
  | 'person'
  | 'star';

export const ICON_SIZE = 16;

export function paintIcon(id: IconId): PixelCanvas {
  const c = PixelCanvas.from(ICON_SIZE, ICON_SIZE);

  switch (id) {
    case 'hoe':
      c.vline(5, 3, 11, PAL.wood);
      c.vline(6, 3, 11, PAL.woodLit);
      c.rect(3, 2, 6, 3, PAL.stoneLit);
      c.hline(3, 2, 6, PAL.stone);
      break;
    case 'watering_can':
      c.rect(4, 6, 8, 7, PAL.stone);
      c.hline(4, 6, 8, PAL.stoneLit);
      c.rect(2, 7, 2, 3, PAL.stoneDark);
      c.line(12, 7, 15, 4, PAL.stone);
      c.px(15, 3, PAL.waterLit);
      c.px(14, 4, PAL.waterLit);
      break;
    case 'sickle':
      c.vline(4, 4, 10, PAL.woodDark);
      for (let a = 0.4; a < 2.6; a += 0.25) {
        c.px(Math.round(4 + Math.cos(a) * 6), Math.round(4 - Math.sin(a) * 5), PAL.stoneLit);
      }
      break;
    case 'rod':
      c.line(2, 14, 13, 1, PAL.wood);
      c.px(13, 1, PAL.stoneLit);
      c.line(13, 2, 12, 8, PAL.parchmentDim);
      c.px(12, 9, PAL.stoneLit);
      break;
    case 'axe':
      c.vline(7, 2, 12, PAL.wood);
      c.vline(8, 2, 12, PAL.woodLit);
      c.rect(3, 2, 6, 5, PAL.stone);
      c.hline(3, 2, 6, PAL.stoneLit);
      break;
    case 'rice':
    case 'wheat': {
      const col = id === 'rice' ? '#c9b872' : '#d3b969';
      for (let i = 0; i < 5; i++) {
        const x = 4 + i * 2;
        c.vline(x, 4 + (i % 2), 9, PAL.leaf);
        c.px(x, 3 + (i % 2), col);
        c.px(x - 1, 4 + (i % 2), tint(col, 0.3));
      }
      break;
    }
    case 'tomato':
      c.disc(8, 9, 5, '#b4544a');
      c.disc(7, 8, 3, '#c96055');
      c.px(8, 4, PAL.leaf);
      c.px(6, 4, PAL.leaf);
      c.px(10, 4, PAL.leaf);
      c.px(7, 7, '#d97a6a');
      break;
    case 'carrot':
      for (let y = 5; y < 14; y++) {
        const w = Math.max(1, 6 - (y - 5));
        c.hline(8 - Math.floor(w / 2), y, w, '#d2762f');
      }
      c.px(7, 7, '#e89a55');
      c.px(4, 3, PAL.leaf);
      c.px(6, 2, PAL.leafLit);
      c.px(9, 3, PAL.leaf);
      break;
    case 'potato':
      c.disc(8, 9, 5, '#b08a55');
      c.disc(7, 8, 3, '#c69f68');
      c.px(5, 10, '#8f6d42');
      c.px(10, 7, '#8f6d42');
      c.px(11, 11, '#8f6d42');
      break;
    case 'pumpkin':
      c.disc(8, 9, 6, '#c26a2a');
      c.disc(7, 8, 5, '#d2762f');
      c.vline(5, 4, 11, '#a8541f');
      c.vline(10, 4, 11, '#a8541f');
      c.vline(8, 3, 12, '#b05d24');
      c.rect(7, 2, 2, 2, PAL.leafDeep);
      break;
    case 'strawberry':
      for (let y = 5; y < 13; y++) {
        const w = Math.max(1, 7 - (y - 5));
        c.hline(8 - Math.floor(w / 2), y, w, '#c0424b');
      }
      c.px(6, 7, '#e0707a');
      c.px(9, 9, '#e0707a');
      c.px(4, 4, PAL.leaf);
      c.px(8, 3, PAL.leaf);
      c.px(12, 4, PAL.leaf);
      break;
    case 'corn':
      c.disc(8, 8, 4, '#e0c05a');
      for (let y = 5; y < 12; y += 2) c.hline(5, y, 7, '#c9a227');
      c.px(3, 4, PAL.leaf);
      c.px(3, 8, PAL.leafLit);
      c.px(3, 11, PAL.leaf);
      c.px(12, 6, PAL.leaf);
      c.px(12, 10, PAL.leafLit);
      break;
    case 'cabbage':
      c.disc(8, 9, 6, PAL.leafDeep);
      c.disc(8, 9, 5, PAL.leaf);
      c.disc(7, 8, 3, PAL.leafLit);
      c.disc(8, 9, 2, PAL.leafPale);
      break;
    case 'flower':
      c.vline(8, 8, 6, PAL.leaf);
      c.px(6, 11, PAL.leafLit);
      c.px(10, 10, PAL.leaf);
      c.disc(8, 5, 3, PAL.blossomLit);
      c.disc(8, 5, 1, PAL.lampCore);
      c.px(5, 6, PAL.blossom);
      c.px(11, 6, PAL.blossom);
      break;
    case 'fish':
      c.disc(7, 8, 4, '#7c9aa8');
      c.disc(6, 7, 2, '#9ab8c4');
      c.px(4, 7, PAL.ink);
      c.line(11, 8, 15, 4, '#5b7a8a');
      c.line(11, 8, 15, 12, '#5b7a8a');
      c.line(11, 8, 15, 8, '#5b7a8a');
      break;
    case 'wood':
      c.rect(2, 7, 12, 5, PAL.wood);
      c.hline(2, 7, 12, PAL.woodLit);
      c.hline(2, 11, 12, PAL.woodDark);
      c.disc(4, 9, 2, PAL.plank);
      c.px(4, 9, PAL.woodDark);
      break;
    case 'stone':
      c.disc(8, 9, 5, PAL.stone);
      c.disc(7, 8, 3, PAL.stoneLit);
      c.px(10, 11, PAL.stoneDark);
      break;
    case 'heart':
      c.disc(5, 6, 3, PAL.health);
      c.disc(10, 6, 3, PAL.health);
      for (let y = 6; y < 13; y++) {
        const w = Math.max(1, 8 - (y - 6));
        c.hline(8 - Math.floor(w / 2), y, w, PAL.health);
      }
      c.px(4, 5, '#d4756a');
      break;
    case 'clock':
      c.disc(8, 8, 6, PAL.parchmentDim);
      c.disc(8, 8, 5, PAL.parchment);
      c.px(8, 4, PAL.ink);
      c.px(8, 8, PAL.ink);
      c.px(11, 8, PAL.ink);
      c.px(8, 5, PAL.ink);
      c.px(8, 6, PAL.ink);
      c.px(8, 7, PAL.ink);
      break;
    case 'sun':
      c.disc(8, 8, 4, PAL.accent);
      c.disc(8, 8, 3, PAL.accentSoft);
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        c.px(Math.round(8 + Math.cos(a) * 6), Math.round(8 + Math.sin(a) * 6), PAL.accentSoft);
      }
      break;
    case 'moon':
      c.disc(8, 8, 5, PAL.parchment);
      c.disc(11, 6, 4, PAL.panel);
      c.px(6, 7, PAL.parchmentDim);
      c.px(7, 10, PAL.parchmentDim);
      break;
    case 'cloud':
      c.disc(5, 9, 3, PAL.parchmentDim);
      c.disc(9, 8, 4, PAL.parchment);
      c.disc(12, 10, 3, PAL.parchmentDim);
      c.hline(3, 11, 10, PAL.parchmentDeep);
      break;
    case 'rain':
      c.disc(5, 6, 3, PAL.parchmentDim);
      c.disc(9, 5, 4, PAL.parchment);
      c.disc(12, 7, 3, PAL.parchmentDim);
      c.vline(5, 11, 3, PAL.waterLit);
      c.vline(8, 11, 4, PAL.waterLit);
      c.vline(11, 11, 3, PAL.waterLit);
      break;
    case 'snow':
      c.disc(6, 6, 3, PAL.parchmentDim);
      c.disc(10, 5, 3, PAL.parchment);
      c.px(5, 12, PAL.parchment);
      c.px(8, 13, PAL.parchment);
      c.px(11, 12, PAL.parchment);
      break;
    case 'fog':
      c.hline(2, 6, 12, PAL.parchmentDim);
      c.hline(4, 9, 10, PAL.parchmentDim);
      c.hline(1, 12, 12, PAL.parchmentDim);
      break;
    case 'book':
      c.rect(3, 3, 10, 11, PAL.blossomDark);
      c.rect(4, 4, 8, 9, PAL.parchment);
      c.vline(8, 4, 9, PAL.parchmentDeep);
      c.hline(5, 6, 3, PAL.parchmentDeep);
      c.hline(5, 8, 3, PAL.parchmentDeep);
      c.hline(10, 6, 2, PAL.parchmentDeep);
      break;
    case 'map':
      c.rect(2, 4, 12, 9, PAL.parchment);
      c.hline(2, 4, 12, PAL.parchmentDeep);
      c.line(5, 5, 8, 11, PAL.moss);
      c.line(8, 11, 12, 6, PAL.waterLit);
      c.px(6, 7, PAL.blossomDark);
      c.px(10, 9, PAL.accent);
      break;
    case 'bag':
      c.rect(3, 6, 10, 8, '#8a6a48');
      c.hline(3, 6, 10, '#a3835e');
      c.hline(3, 13, 10, '#6b4f34');
      c.line(5, 6, 6, 2, '#6b4f34');
      c.line(10, 6, 9, 2, '#6b4f34');
      c.rect(6, 8, 4, 3, PAL.parchmentDim);
      break;
    case 'person':
      c.disc(8, 5, 3, PAL.parchmentDim);
      c.rect(5, 9, 6, 5, PAL.parchmentDim);
      break;
    case 'star':
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const dx = Math.abs(x - 7.5);
          const dy = Math.abs(y - 7.5);
          if (dx + dy < 5 || (dx < 1.2 && dy < 7) || (dy < 1.2 && dx < 7)) {
            c.px(x, y, dx + dy < 2.5 ? PAL.lampCore : PAL.accent);
          }
        }
      }
      break;
    default:
      break;
  }
  return c;
}

/** Nine-slice parchment panel, 48x48 with a 12px border. */
export function paintPanel(size = 48): PixelCanvas {
  const c = PixelCanvas.from(size, size);
  const rnd = mulberry32(991);
  c.fill(PAL.parchment);
  for (let i = 0; i < size * size * 0.04; i++) {
    c.px(Math.floor(rnd() * size), Math.floor(rnd() * size), mix(PAL.parchment, PAL.parchmentDeep, 0.5));
  }
  // Timber frame with a lighter inner lip.
  c.frame(0, 0, size, size, PAL.woodDark);
  c.frame(1, 1, size - 2, size - 2, PAL.wood);
  c.frame(3, 3, size - 6, size - 6, PAL.woodDark);
  c.frame(4, 4, size - 8, size - 8, tint(PAL.parchment, 0.24));
  // Corner pegs.
  const pegs: [number, number][] = [
    [2, 2],
    [size - 4, 2],
    [2, size - 4],
    [size - 4, size - 4],
  ];
  for (const peg of pegs) {
    c.rect(peg[0], peg[1], 2, 2, PAL.plank);
  }
  return c;
}

/** Dark UI plate used for the HUD strip and the pause overlay. */
export function paintPlate(w: number, h: number): PixelCanvas {
  const c = PixelCanvas.from(w, h, PAL.panel);
  c.frame(0, 0, w, h, PAL.woodDark);
  c.frame(1, 1, w - 2, h - 2, PAL.panelLit);
  return c;
}

export function paintIconSet(): Record<IconId, PixelCanvas> {
  const out = {} as Record<IconId, PixelCanvas>;
  for (const id of ICON_IDS) out[id] = paintIcon(id);
  return out;
}

export const ICON_IDS: IconId[] = [
  'hoe', 'watering_can', 'sickle', 'rod', 'axe',
  'seed_rice', 'seed_wheat', 'seed_tomato', 'seed_carrot', 'seed_potato', 'seed_pumpkin', 'seed_strawberry', 'seed_corn', 'seed_cabbage', 'seed_flower',
  'rice', 'wheat', 'tomato', 'carrot', 'potato', 'pumpkin', 'strawberry', 'corn', 'cabbage', 'flower',
  'fish', 'wood', 'stone', 'heart', 'clock', 'sun', 'moon', 'cloud', 'rain', 'snow', 'fog',
  'book', 'map', 'bag', 'person', 'star',
];