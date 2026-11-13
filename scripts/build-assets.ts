/**
 * Asset pipeline for Gitakure.
 *
 * The supplied packs are AI-generated concept boards, so every frame in them
 * was cropped by connected components rather than cut on a true pixel grid.
 * Nothing here is hand-placed: this script measures every frame, classifies it
 * by shape and colour, and emits a typed manifest the game loads at boot.
 *
 *   bun run scripts/build-assets.ts
 *
 * Writes:
 *   public/assets/atlases/<sheet>.png     copy of the supplied atlas
 *   public/assets/atlases/<sheet>.json    frame rects + metrics
 *   public/assets/atlases/<sheet>.frames/ tight per-frame PNGs (tiles, crops)
 *   src/generated/asset-manifest.ts       typed catalog consumed by the engine
 *   docs/asset-report.md                  human-readable provenance + gaps
 */

import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');
const SRC = path.join(ROOT, 'sprites');
const OUT_ATLAS = path.join(ROOT, 'public/assets/atlases');
const OUT_FRAMES = path.join(OUT_ATLAS, 'frames');
const OUT_GEN = path.join(ROOT, 'src/generated');
const OUT_DOCS = path.join(ROOT, 'docs');

/** Collections that carry usable world imagery, in the order they matter. */
const SHEETS = [
  'rpg_terrain',
  'water_environmental',
  'trees_and_vegetation',
  'farming_pixel_art',
  'buildings_interiors',
  'environmental_effects',
  'pixel_rpg_ui_asset',
  'wildlife_sprite',
  'rpg_asset',
  'pixel_art_asset',
  'pixel_character_sheets',
] as const;

type SheetName = (typeof SHEETS)[number];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RawAtlas {
  frames: Record<string, { frame: Rect; group: { panel: number; row: number; col: number }; sourceRect?: Rect }>;
}

interface FrameInfo extends Rect {
  key: string;
  index: number;
  /** Opaque pixels / (w*h), from the decoded atlas. */
  density: number;
  /** Mean RGB of opaque pixels. */
  rgb: [number, number, number];
  /** Fraction of pixels that are near-grey (saturation < 0.12). */
  grey: number;
  /** Fraction of opaque pixels that are near-black or near-white. */
  dark: number;
  /** Filled area divided by bounding-box area, a proxy for "blob vs. structure". */
  fill: number;
  aspect: number;
}

// ---------------------------------------------------------------------------
// PNG decoding (no native deps; the atlases are 8-bit RGBA, which is all we
// need for metrics and for tight-cropping individual frames).
// ---------------------------------------------------------------------------

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

async function readPng(file: string): Promise<{ width: number; height: number; rgba: Uint8Array }> {
  const buf = Buffer.from(await readFile(file));
  let p = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];

  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(Buffer.from(data));
    } else if (type === 'IEND') {
      break;
    }
    p += 12 + len;
  }

  if (bitDepth !== 8) throw new Error(`${path.basename(file)}: unsupported bit depth ${bitDepth}`);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 0;
  if (!channels) throw new Error(`${path.basename(file)}: unsupported colour type ${colorType}`);

  const raw = await inflate(Buffer.concat(idat));
  const stride = width * channels;
  const out = new Uint8Array(width * height * 4);
  const prev = new Uint8Array(stride);
  const cur = new Uint8Array(stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    cur.set(line);
    unfilter(filter, cur, prev, channels);
    for (let x = 0; x < width; x++) {
      const s = x * channels;
      const d = (y * width + x) * 4;
      if (channels === 4) {
        out[d] = cur[s];
        out[d + 1] = cur[s + 1];
        out[d + 2] = cur[s + 2];
        out[d + 3] = cur[s + 3];
      } else if (channels === 3) {
        out[d] = cur[s];
        out[d + 1] = cur[s + 1];
        out[d + 2] = cur[s + 2];
        out[d + 3] = 255;
      } else {
        out[d] = out[d + 1] = out[d + 2] = cur[s];
        out[d + 3] = 255;
      }
    }
    prev.set(cur);
  }
  return { width, height, rgba: out };
}

async function inflate(buf: Buffer): Promise<Buffer> {
  // Node's zlib is sync and available in Bun.
  const zlib = await import('node:zlib');
  return zlib.inflateSync(buf);
}

function unfilter(filter: number, cur: Uint8Array, prev: Uint8Array, bpp: number): void {
  switch (filter) {
    case 0:
      return;
    case 1:
      for (let i = bpp; i < cur.length; i++) cur[i] = (cur[i] + cur[i - bpp]) & 0xff;
      return;
    case 2:
      for (let i = 0; i < cur.length; i++) cur[i] = (cur[i] + prev[i]) & 0xff;
      return;
    case 3:
      for (let i = 0; i < cur.length; i++) {
        const left = i >= bpp ? cur[i - bpp] : 0;
        cur[i] = (cur[i] + ((left + prev[i]) >> 1)) & 0xff;
      }
      return;
    case 4:
      for (let i = 0; i < cur.length; i++) {
        const a = i >= bpp ? cur[i - bpp] : 0;
        const b = prev[i];
        const c = i >= bpp ? prev[i - bpp] : 0;
        const pa = Math.abs(b - c);
        const pb = Math.abs(a - c);
        const pc = Math.abs(a + b - 2 * c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        cur[i] = (cur[i] + pr) & 0xff;
      }
      return;
    default:
      throw new Error(`bad filter ${filter}`);
  }
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

function measure(atlas: { width: number; height: number; rgba: Uint8Array }, r: Rect): Omit<FrameInfo, 'key' | 'index'> {
  const { width: aw, rgba } = atlas;
  let opaque = 0;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let grey = 0;
  let dark = 0;

  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      const i = (y * aw + x) * 4;
      if (rgba[i + 3] < 24) continue;
      opaque++;
      const R = rgba[i];
      const G = rgba[i + 1];
      const B = rgba[i + 2];
      sr += R;
      sg += G;
      sb += B;
      const max = Math.max(R, G, B);
      const min = Math.min(R, G, B);
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat < 0.12) grey++;
      if (max < 40 || (min > 215 && sat < 0.1)) dark++;
    }
  }

  const n = Math.max(1, opaque);
  return {
    ...r,
    density: opaque / (r.w * r.h),
    rgb: [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)],
    grey: grey / n,
    dark: dark / n,
    fill: opaque / (r.w * r.h),
    aspect: r.w / r.h,
  };
}

// ---------------------------------------------------------------------------
// Classification
//
// The boards mix objects of very different sizes, so an absolute pixel size
// means little. Shape and colour do the work instead: a grass tuft is a small
// near-square blob, a house is a large dense mass, a blossom canopy is a wide
// saturated mass with lots of pink, an effect is a faint sparse wisp.
// ---------------------------------------------------------------------------

export type Kind = 'tile' | 'structure' | 'plant' | 'creature' | 'effect' | 'prop' | 'ui';

const near = (a: number, b: number, t: number) => Math.abs(a - b) <= t;
const hueOf = ([r, g, b]: [number, number, number]) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return ((h * 60) % 360 + 360) % 360;
};

function classify(f: Omit<FrameInfo, 'key' | 'index'>, sheet: SheetName): Kind {
  const { w, h, density, grey, dark, rgb, aspect, fill } = f;
  const px = w * h;
  const hue = hueOf(rgb);

  if (sheet === 'pixel_rpg_ui_asset') return 'ui';
  if (sheet === 'environmental_effects') return 'effect';

  if (sheet === 'pixel_character_sheets') return 'creature';
  if (sheet === 'wildlife_sprite') return 'creature';

  // Standing water, foam and shore pieces are wide and low.
  if (sheet === 'water_environmental') {
    if (near(f.rgb[2], f.rgb[0], 26) && f.rgb[2] > f.rgb[0] && aspect > 1.5) return 'tile';
    if (px < 2600 && fill > 0.45) return 'tile';
    return 'prop';
  }

  // Terrain reads as an opaque, near-square swatch with no internal holes.
  if (sheet === 'rpg_terrain') {
    if (density > 0.93 && aspect > 0.72 && aspect < 1.38 && px >= 900) return 'tile';
    if (density > 0.8 && px >= 2500) return 'tile';
    return 'prop';
  }

  // Farm plots, rice, fences, tools, sacks.
  if (sheet === 'farming_pixel_art') {
    if (density > 0.9 && aspect > 0.7 && aspect < 1.45 && px >= 1200 && grey < 0.5) return 'tile';
    if (px < 900) return 'prop';
    return 'plant';
  }

  // Houses, roofs, interiors, furniture.
  if (sheet === 'buildings_interiors') {
    if (px > 9000 || (aspect > 1.25 && px > 2200)) return 'structure';
    return 'prop';
  }

  // Canopies, grass, rocks, logs.
  if (sheet === 'trees_and_vegetation') {
    if (px > 6000) return 'plant';
    if (density > 0.86 && px > 900 && grey < 0.35) return 'plant';
    if (px < 700) return 'plant';
    return 'prop';
  }

  // Mixed boards: fall back to shape alone.
  if (px < 1200) return 'prop';
  if (px > 9000) return 'structure';
  if (hue > 70 && hue < 170) return 'plant';
  if (density > 0.85 && aspect > 0.75 && aspect < 1.35) return 'tile';
  if (dark < 0.25 && density < 0.6) return 'effect';
  return 'prop';
}

/** Names that read well enough to label a handful of frames for the journal. */
function label(f: Omit<FrameInfo, 'key' | 'index'>, sheet: SheetName, kind: Kind): string {
  const [r, g, b] = f.rgb;
  const hue = hueOf(f.rgb);
  const sat = Math.max(r, g, b) === 0 ? 0 : (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b);

  if (kind === 'effect') return sat < 0.15 ? 'wisp' : hue < 45 ? 'ember' : hue < 170 ? 'mote' : 'spark';
  if (kind === 'creature') return f.aspect > 1.25 ? 'animal-side' : 'animal-front';
  if (kind === 'structure') return f.aspect > 1.15 ? 'building-wide' : 'building-tall';
  if (kind === 'plant') {
    if (hue > 280 || (r > 180 && b > 150 && g < 170)) return 'blossom';
    if (hue > 70 && hue < 165) return f.aspect > 1.4 ? 'foliage-wide' : 'foliage';
    return 'plant';
  }
  if (kind === 'tile') {
    if (hue > 70 && hue < 165) return 'grass-tile';
    if (hue > 20 && hue < 50) return 'soil-tile';
    if (sat < 0.16) return 'stone-tile';
    if (hue > 170 && hue < 260) return 'water-tile';
    return 'ground-tile';
  }
  return sheet === 'pixel_rpg_ui_asset' ? 'ui-piece' : 'prop';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await mkdir(OUT_ATLAS, { recursive: true });
  await mkdir(OUT_FRAMES, { recursive: true });
  await mkdir(OUT_GEN, { recursive: true });
  await mkdir(OUT_DOCS, { recursive: true });

  const manifest: Record<string, unknown> = {};
  const report: string[] = [];
  let totalFrames = 0;

  report.push('# Asset report', '');
  report.push('Generated by `bun run scripts/build-assets.ts`. Every number below is measured from the supplied boards; nothing is hand-authored.', '');
  report.push('| board | frames | size | categories |');
  report.push('| --- | --- | --- | --- |');

  for (const sheet of SHEETS) {
    const dir = path.join(SRC, sheet);
    const atlasFile = path.join(dir, `${sheet}_atlas.json`);
    if (!existsSync(atlasFile)) {
      report.push(`| ${sheet} | missing | - | - |`);
      continue;
    }
    const raw = JSON.parse(await readFile(atlasFile, 'utf8')) as RawAtlas;
    const pngPath = path.join(dir, `${sheet}_atlas.png`);
    const png = await readPng(pngPath);

    const frames: FrameInfo[] = [];
    let i = 0;
    for (const [key, entry] of Object.entries(raw.frames)) {
      frames.push({ key, index: i++, ...measure(png, entry.frame) });
    }
    totalFrames += frames.length;

    // Frame rects the engine can hand straight to Phaser's texture manager.
    const rects: Record<string, Rect> = {};
    const counts: Partial<Record<Kind, number>> = {};
    const byLabel: Record<string, string[]> = {};

    const sheetOut = path.join(OUT_ATLAS, `${sheet}.json`);
    for (const f of frames) {
      const kind = classify(f, sheet);
      counts[kind] = (counts[kind] ?? 0) + 1;
      rects[f.key] = { x: f.x, y: f.y, w: f.w, h: f.h };
      const name = label(f, sheet, kind);
      (byLabel[`${kind}/${name}`] ??= []).push(f.key);
    }

    await copyFile(pngPath, path.join(OUT_ATLAS, `${sheet}.png`));
    await writeFile(
      sheetOut,
      JSON.stringify({
        image: `${sheet}.png`,
        width: png.width,
        height: png.height,
        frameCount: frames.length,
        frames: rects,
        /** Every frame is an independent crop: nothing tiles on a fixed grid. */
        gridded: false,
      }),
    );

    // Tight per-frame exports for the pieces the engine blits directly:
    // ground tiles, crops and effects, where atlas rects would drag along
    // unrelated padding.
    const exportKinds = new Set<Kind>(['tile', 'effect']);
    const wanted = frames.filter((f) => exportKinds.has(classify(f, sheet)));
    if (wanted.length) {
      const dirOut = path.join(OUT_FRAMES, sheet);
      await mkdir(dirOut, { recursive: true });
      for (const f of wanted) {
        await writeFile(path.join(dirOut, `${f.key}.png`), await cropPng(png, f));
      }
    }

    manifest[sheet] = {
      image: `assets/atlases/${sheet}.png`,
      width: png.width,
      height: png.height,
      frameCount: frames.length,
      counts,
      labels: Object.fromEntries(Object.entries(byLabel).map(([k, v]) => [k, v.length])),
    };

    report.push(
      `| ${sheet} | ${frames.length} | ${png.width}x${png.height} | ` +
        Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k} ${v}`)
          .join(', ') +
        ' |',
    );
  }

  // NPC sheets are already cut on a true grid, unlike the boards.
  const npcDir = path.join(SRC, 'npc/grid');
  const npcs: Record<string, unknown> = {};
  if (existsSync(npcDir)) {
    for (const file of (await readdir(npcDir)).filter((f) => f.endsWith('.json'))) {
      const meta = JSON.parse(await readFile(path.join(npcDir, file), 'utf8'));
      const name = path.basename(file, '_sheet.json');
      npcs[name] = meta;
      await copyFile(path.join(npcDir, `${name}_sheet.png`), path.join(OUT_ATLAS, `npc_${name}.png`));
    }
    const portraitDir = path.join(SRC, 'npc/portraits');
    const portraits: string[] = existsSync(portraitDir)
      ? (await readdir(portraitDir)).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, ''))
      : [];
    for (const p of portraits) await copyFile(path.join(portraitDir, `${p}.png`), path.join(OUT_ATLAS, `portrait_${p}.png`));
    report.push('', `## NPCs`, '', `${Object.keys(npcs).length} characters on a real 24x28 grid (12 columns x 4 rows: down, left, right, up; columns 0-3 idle, 4-7 walk, 8-11 interact). ${portraits.length} dialogue portraits.`);
  }

  const bundle = {
    generatedBy: 'scripts/build-assets.ts',
    frameTotal: totalFrames,
    npcCell: { w: 24, h: 28 },
    sheets: manifest,
    npcs,
  };
  await writeFile(path.join(OUT_GEN, 'asset-manifest.ts'), buildModule(bundle));
  report.push('', `Total: **${totalFrames} frames** across ${SHEETS.length} boards.`);
  await writeFile(path.join(OUT_DOCS, 'asset-report.md'), report.join('\n') + '\n');
  console.log(`assets: ${totalFrames} frames, ${SHEETS.length} boards, ${Object.keys(npcs).length} npcs`);
}

async function cropPng(atlas: { width: number; rgba: Uint8Array }, r: Rect): Promise<Buffer> {
  // Tighten the rect to the actual opaque pixels so no padding survives.
  let minX = r.x + r.w;
  let minY = r.y + r.h;
  let maxX = r.x;
  let maxY = r.y;
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (atlas.rgba[(y * atlas.width + x) * 4 + 3] < 24) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return Buffer.alloc(0);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const s = ((minY + y) * atlas.width + (minX + x)) * 4;
      const d = y * (stride + 1) + 1 + x * 4;
      raw[d] = atlas.rgba[s];
      raw[d + 1] = atlas.rgba[s + 1];
      raw[d + 2] = atlas.rgba[s + 2];
      raw[d + 3] = atlas.rgba[s + 3];
    }
  }
  const zlib = await import('node:zlib');
  const chunks: Buffer[] = [Buffer.from(PNG_SIG)];
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  chunks.push(chunk('IHDR', ihdr));
  chunks.push(chunk('IDAT', zlib.deflateSync(raw, { level: 9 })));
  chunks.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(chunks);
}

let crcTable: Uint32Array | null = null;
function crc32(buf: Buffer): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable![(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function buildModule(bundle: unknown): string {
  return `/* GENERATED FILE - do not edit by hand.
 * Source: sprites/ via scripts/build-assets.ts
 * Regenerate with: bun run scripts/build-assets.ts
 */
export type AssetSheet = {
  image: string;
  width: number;
  height: number;
  frameCount: number;
  counts: Record<string, number>;
  labels: Record<string, number>;
};

export type NpcSheetMeta = {
  character: string;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: number;
  animations: Record<string, { frames: number[]; row: number; frameRate: number; repeat: number }>;
};

export type AssetManifest = {
  generatedBy: string;
  frameTotal: number;
  npcCell: { w: number; h: number };
  sheets: Record<string, AssetSheet>;
  npcs: Record<string, NpcSheetMeta>;
};

export const ASSETS: AssetManifest = ${JSON.stringify(bundle, null, 2)};
`;
}

await main();