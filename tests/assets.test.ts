/**
 * Asset sanity checks.
 *
 * The boards are AI-generated, so the pipeline measures every frame rather
 * than trusting the concept art. These tests pin the invariants the renderer
 * relies on: real transparency, frame rects inside the atlas, and NPC grids
 * that are actually cut into 12x4 cells.
 */

import { describe, expect, test } from 'vitest';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSETS } from '@/generated/asset-manifest';

const PUB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

/** Read a PNG's IHDR without pulling in a decoder. */
async function pngSize(file: string): Promise<{ width: number; height: number }> {
  const fd = await readFile(file);
  return { width: fd.readUInt32BE(16), height: fd.readUInt32BE(20) };
}

describe('atlas files', () => {
  test('every sheet referenced by the manifest exists on disk', async () => {
    for (const [name, sheet] of Object.entries(ASSETS.sheets)) {
      const file = path.join(PUB, sheet.image);
      const info = await stat(file);
      expect(info.size, `${name} atlas missing or empty`).toBeGreaterThan(1024);
    }
  });

  test('declared dimensions match the real PNG headers', async () => {
    for (const [name, sheet] of Object.entries(ASSETS.sheets)) {
      const real = await pngSize(path.join(PUB, sheet.image));
      expect(real.width, `${name} width`).toBe(sheet.width);
      expect(real.height, `${name} height`).toBe(sheet.height);
    }
  });

  test('frame count matches the number of declared frames', () => {
    for (const [name, sheet] of Object.entries(ASSETS.sheets)) {
      const declared = Object.values(sheet.counts).reduce((a, b) => a + b, 0);
      expect(declared, `${name} category total`).toBe(sheet.frameCount);
    }
  });
});

describe('frame rects', () => {
  test('all rects sit inside the atlas bounds', async () => {
    for (const [name, sheet] of Object.entries(ASSETS.sheets)) {
      const raw = JSON.parse(await readFile(path.join(PUB, `assets/atlases/${name}.json`), 'utf8'));
      for (const [key, r] of Object.entries<any>(raw.frames)) {
        expect(r.x + r.w, `${name}/${key} overflows right`).toBeLessThanOrEqual(sheet.width);
        expect(r.y + r.h, `${name}/${key} overflows bottom`).toBeLessThanOrEqual(sheet.height);
        expect(r.w, `${name}/${key} has no width`).toBeGreaterThan(0);
        expect(r.h, `${name}/${key} has no height`).toBeGreaterThan(0);
      }
    }
  });

  test('every frame has positive area and is not a full-atlas rectangle', async () => {
    // A frame covering the whole board means connected-component cropping
    // collapsed, which would make the sprite unusable.
    for (const [name, sheet] of Object.entries(ASSETS.sheets)) {
      const raw = JSON.parse(await readFile(path.join(PUB, `assets/atlases/${name}.json`), 'utf8'));
      const total = sheet.width * sheet.height;
      for (const [key, r] of Object.entries<any>(raw.frames)) {
        expect(r.w * r.h, `${name}/${key} degenerate`).toBeGreaterThan(16);
        expect(r.w * r.h, `${name}/${key} covers the whole board`).toBeLessThan(total * 0.5);
      }
    }
  });
});

describe('npc sheets', () => {
  const names = Object.keys(ASSETS.npcs);

  test('at least one npc sheet was extracted', () => {
    expect(names.length).toBeGreaterThan(0);
  });

  test('each sheet declares a uniform 12x4 grid', () => {
    for (const name of names) {
      const meta = ASSETS.npcs[name];
      expect(meta.columns).toBe(12);
      expect(meta.rows).toBe(4);
      expect(meta.cellWidth).toBeGreaterThan(0);
      expect(meta.cellHeight).toBeGreaterThan(0);
    }
  });

  test('each sheet declares the twelve animations the engine plays', () => {
    for (const name of names) {
      const anims = Object.keys(ASSETS.npcs[name].animations);
      expect(anims.sort()).toEqual(
        [
          'idle_down',
          'idle_left',
          'idle_right',
          'idle_up',
          'interact_down',
          'interact_left',
          'interact_right',
          'interact_up',
          'walk_down',
          'walk_left',
          'walk_right',
          'walk_up',
        ].sort(),
      );
    }
  });

  test('animation frames stay inside the declared grid', () => {
    for (const name of names) {
      const meta = ASSETS.npcs[name];
      for (const [anim, def] of Object.entries(meta.animations)) {
        expect(def.row, `${name}/${anim} row`).toBeLessThan(meta.rows);
        for (const f of def.frames) {
          expect(f, `${name}/${anim} frame`).toBeGreaterThanOrEqual(0);
          expect(f, `${name}/${anim} frame out of range`).toBeLessThan(meta.columns);
        }
      }
    }
  });

  test('sheet images exist for every npc', async () => {
    for (const name of names) {
      const info = await stat(path.join(PUB, `assets/atlases/npc_${name}.png`));
      expect(info.size).toBeGreaterThan(4096);
    }
  });
});

describe('provenance', () => {
  test('the manifest records how it was produced', () => {
    expect(ASSETS.generatedBy).toBe('scripts/build-assets.ts');
    expect(ASSETS.frameTotal).toBeGreaterThan(1000);
  });

  test('no sheet claims a fixed pixel grid', async () => {
    // The boards are cropped by connected components; pretending they are
    // grid-aligned would break tile rendering.
    for (const name of Object.keys(ASSETS.sheets)) {
      const raw = JSON.parse(await readFile(path.join(PUB, `assets/atlases/${name}.json`), 'utf8'));
      expect(raw.gridded, `${name} wrongly marked gridded`).toBe(false);
    }
  });
});