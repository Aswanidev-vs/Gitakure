/**
 * Dev utility: downsample a PNG so a human can eyeball what the classifier did.
 *
 *   bun run scripts/preview.ts public/assets/atlases/rpg_terrain.png /tmp/out.png [step]
 *
 * Picks one pixel per `step` block, so a 2048px concept board collapses to a
 * few hundred pixels and stays readable at 1:1 in an image viewer.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (b: Buffer) => {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
};

function decode(file: string) {
  return readFile(file).then(async (buf) => {
    const zlib = await import('node:zlib');
    let off = 8;
    let w = 0;
    let h = 0;
    let ct = 0;
    const idat: Buffer[] = [];
    while (off < buf.length) {
      const len = buf.readUInt32BE(off);
      const t = buf.toString('ascii', off + 4, off + 8);
      const d = buf.subarray(off + 8, off + 8 + len);
      if (t === 'IHDR') {
        w = d.readUInt32BE(0);
        h = d.readUInt32BE(4);
        ct = d[9];
      } else if (t === 'IDAT') idat.push(Buffer.from(d));
      else if (t === 'IEND') break;
      off += 12 + len;
    }
    const ch = ct === 6 ? 4 : 3;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = w * ch;
    const out = Buffer.alloc(w * h * 4);
    const prev = Buffer.alloc(stride);
    const cur = Buffer.alloc(stride);
    for (let y = 0; y < h; y++) {
      const f = raw[y * (stride + 1)];
      cur.set(raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride));
      if (f === 1) for (let i = ch; i < stride; i++) cur[i] = (cur[i] + cur[i - ch]) & 255;
      else if (f === 2) for (let i = 0; i < stride; i++) cur[i] = (cur[i] + prev[i]) & 255;
      else if (f === 3)
        for (let i = 0; i < stride; i++) {
          const a = i >= ch ? cur[i - ch] : 0;
          cur[i] = (cur[i] + ((a + prev[i]) >> 1)) & 255;
        } else if (f === 4)
        for (let i = 0; i < stride; i++) {
          const a = i >= ch ? cur[i - ch] : 0;
          const b = prev[i];
          const c = i >= ch ? prev[i - ch] : 0;
          const pa = Math.abs(b - c);
          const pb = Math.abs(a - c);
          const pc = Math.abs(a + b - 2 * c);
          cur[i] = (cur[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
        }
      for (let x = 0; x < w; x++) {
        const s = x * ch;
        const d = (y * w + x) * 4;
        out[d] = cur[s];
        out[d + 1] = cur[s + 1];
        out[d + 2] = ch === 4 ? cur[s + 2] : cur[s + 2];
        out[d + 3] = ch === 4 ? cur[s + 3] : 255;
      }
      prev.set(cur);
    }
    return { w, h, px: out };
  });
}

function encode(w: number, h: number, px: Buffer) {
  return import('node:zlib').then((zlib) => {
    const stride = w * 4;
    const raw = Buffer.alloc((stride + 1) * h);
    for (let y = 0; y < h; y++) {
      raw[y * (stride + 1)] = 0;
      px.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
    }
    const ih = Buffer.alloc(13);
    ih.writeUInt32BE(w, 0);
    ih.writeUInt32BE(h, 4);
    ih[8] = 8;
    ih[9] = 6;
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ih),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  });
}

const [src, dest, stepArg] = process.argv.slice(2);
const step = Number(stepArg ?? 9);
const atlas = await decode(path.resolve(src));
const tw = Math.floor(atlas.w / step);
const th = Math.floor(atlas.h / step);
const out = Buffer.alloc(tw * th * 4);
for (let y = 0; y < th; y++) {
  for (let x = 0; x < tw; x++) {
    const sx = Math.min(atlas.w - 1, x * step + (step >> 1));
    const sy = Math.min(atlas.h - 1, y * step + (step >> 1));
    const s = (sy * atlas.w + sx) * 4;
    const d = (y * tw + x) * 4;
    out[d] = atlas.px[s];
    out[d + 1] = atlas.px[s + 1];
    out[d + 2] = atlas.px[s + 2];
    out[d + 3] = 255;
  }
}
await writeFile(dest, await encode(tw, th, out));
console.log(`${path.basename(src)} -> ${dest} (${tw}x${th})`);