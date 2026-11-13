/**
 * A tiny deterministic pixel canvas.
 *
 * Every asset in Gitakure is authored through this API rather than drawn by
 * hand in an image editor, so the whole art set is reproducible from source and
 * can be regenerated (or restyled for a season) by changing code.
 *
 * No anti-aliasing, no fractional coordinates, no gradients that are not
 * explicitly stepped. That constraint is what keeps the art crisp.
 */

import { PAL } from './palette';

export class PixelCanvas {
  readonly width: number;
  readonly height: number;
  private readonly data: Uint8ClampedArray;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  static from(width: number, height: number, fill: string | null = null): PixelCanvas {
    const c = new PixelCanvas(width, height);
    if (fill) c.fill(fill);
    return c;
  }

  /** Draw this canvas into another at an offset. */
  blit(
    src: PixelCanvas,
    dx: number,
    dy: number,
    opts: { flipX?: boolean; flipY?: boolean; tint?: string; alpha?: number } = {},
  ): this {
    const { flipX = false, flipY = false, tint, alpha = 1 } = opts;
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const sx = flipX ? src.width - 1 - x : x;
        const sy = flipY ? src.height - 1 - y : y;
        const [r, g, b, a] = src.pixel(sx, sy);
        if (a === 0) continue;
        const color = tint ? parseHex(tint) : [r, g, b];
        this.setPixel(dx + x, dy + y, color[0]!, color[1]!, color[2]!, Math.round(a * alpha));
      }
    }
    return this;
  }

  fill(color: string): this {
    return this.rect(0, 0, this.width, this.height, color);
  }

  pixel(x: number, y: number): [number, number, number, number] {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return [0, 0, 0, 0];
    const i = (y * this.width + x) * 4;
    return [this.data[i]!, this.data[i + 1]!, this.data[i + 2]!, this.data[i + 3]!];
  }

  setPixel(x: number, y: number, r: number, g: number, b: number, a = 255): this {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height || a === 0) return this;
    const i = (y * this.width + x) * 4;
    if (a === 255) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = 255;
      return this;
    }
    // Source-over with the existing pixel.
    const sa = a / 255;
    const da = this.data[i + 3]! / 255;
    const outA = sa + da * (1 - sa);
    if (outA === 0) return this;
    this.data[i] = Math.round((r * sa + this.data[i]! * da * (1 - sa)) / outA);
    this.data[i + 1] = Math.round((g * sa + this.data[i + 1]! * da * (1 - sa)) / outA);
    this.data[i + 2] = Math.round((b * sa + this.data[i + 2]! * da * (1 - sa)) / outA);
    this.data[i + 3] = Math.round(outA * 255);
    return this;
  }

  px(x: number, y: number, color: string, alpha = 255): this {
    const [r, g, b] = parseHex(color);
    return this.setPixel(x, y, r, g, b, alpha);
  }

  rect(x: number, y: number, w: number, h: number, color: string, alpha = 255): this {
    const [r, g, b] = parseHex(color);
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        this.setPixel(xx, yy, r, g, b, alpha);
      }
    }
    return this;
  }

  frame(x: number, y: number, w: number, h: number, color: string): this {
    for (let xx = x; xx < x + w; xx++) {
      this.px(xx, y, color);
      this.px(xx, y + h - 1, color);
    }
    for (let yy = y; yy < y + h; yy++) {
      this.px(x, yy, color);
      this.px(x + w - 1, yy, color);
    }
    return this;
  }

  hline(x: number, y: number, w: number, color: string): this {
    for (let i = 0; i < w; i++) this.px(x + i, y, color);
    return this;
  }

  vline(x: number, y: number, h: number, color: string): this {
    for (let i = 0; i < h; i++) this.px(x, y + i, color);
    return this;
  }

  /** Filled circle drawn with a scanline fill; no anti-aliasing. */
  disc(cx: number, cy: number, r: number, color: string, alpha = 255): this {
    const [cr, cg, cb] = parseHex(color);
    const rr = r * r;
    for (let y = -r; y <= r; y++) {
      const span = Math.floor(Math.sqrt(Math.max(0, rr - y * y)));
      for (let x = -span; x <= span; x++) {
        this.setPixel(cx + x, cy + y, cr, cg, cb, alpha);
      }
    }
    return this;
  }

  /** Bresenham line. */
  line(x0: number, y0: number, x1: number, y1: number, color: string): this {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      this.px(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
    return this;
  }

  /** Replace every opaque pixel of `from` with `to`. Handy for palette swaps. */
  swap(from: string, to: string): this {
    const [fr, fg, fb] = parseHex(from);
    const [tr, tg, tb] = parseHex(to);
    for (let i = 0; i < this.data.length; i += 4) {
      if (this.data[i + 3] === 0) continue;
      if (this.data[i] === fr && this.data[i + 1] === fg && this.data[i + 2] === fb) {
        this.data[i] = tr;
        this.data[i + 1] = tg;
        this.data[i + 2] = tb;
      }
    }
    return this;
  }

  /** Add a 1px darker outline around every opaque cluster. */
  outline(color = PAL.outline): this {
    const src = new Uint8ClampedArray(this.data);
    const [r, g, b] = parseHex(color);
    const at = (x: number, y: number): number => {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
      return src[(y * this.width + x) * 4 + 3]!;
    };
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (at(x, y) !== 0) continue;
        if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) {
          const i = (y * this.width + x) * 4;
          this.data[i] = r;
          this.data[i + 1] = g;
          this.data[i + 2] = b;
          this.data[i + 3] = 255;
        }
      }
    }
    return this;
  }

  /** Random but reproducible speckle, for dirt and foliage texture. */
  speckle(seed: number, color: string, density = 0.12, alpha = 255): this {
    const rnd = mulberry32(seed);
    const [r, g, b] = parseHex(color);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (rnd() < density) this.setPixel(x, y, r, g, b, alpha);
      }
    }
    return this;
  }

  toDataUrl(): string {
    return canvasToDataUrl(this.width, this.height, this.data);
  }

  toCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.width;
    c.height = this.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    const img = ctx.createImageData(this.width, this.height);
    img.data.set(this.data);
    ctx.putImageData(img, 0, 0);
    return c;
  }
}

function parseHex(color: string): [number, number, number] {
  const v = Number.parseInt(color.replace('#', ''), 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

/** Small, fast, seedable PRNG so every generated asset is reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasToDataUrl(w: number, h: number, data: Uint8ClampedArray): string {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  const img = ctx.createImageData(w, h);
  img.data.set(data);
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}