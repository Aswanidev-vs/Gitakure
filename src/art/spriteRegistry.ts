/**
 * Sprite registry: loads the extracted sprites from public/assets/sprites
 * and registers them as Phaser textures. A curated subset is used per
 * category to keep the texture count manageable.
 */

import type Phaser from 'phaser';

export interface SpriteEntry {
  key: string;
  file: string;
  category: string;
  w: number;
  h: number;
}

let cache: SpriteEntry[] | null = null;

export async function loadSpriteManifest(): Promise<SpriteEntry[]> {
  if (cache) return cache;
  const res = await fetch('assets/sprites/manifest.json');
  const raw = await res.json() as { file: string; w: number; h: number }[];
  cache = raw.map((m) => {
    const category = m.file.split('_')[0] ?? 'prop';
    const key = `spr:${m.file.replace('.png', '')}`;
    return { key, file: `assets/sprites/${m.file}`, category, w: m.w, h: m.h };
  });
  return cache;
}

/** Curate a subset per category, filtered by reasonable size. */
export function curateSprites(entries: SpriteEntry[]): Record<string, SpriteEntry[]> {
  const byCat: Record<string, SpriteEntry[]> = {};
  for (const e of entries) {
    // Filter out tiny noise and huge blobs
    if (e.w < 16 || e.h < 16) continue;
    if (e.w > 400 || e.h > 300) continue;
    if (!byCat[e.category]) byCat[e.category] = [];
    byCat[e.category]!.push(e);
  }
  // Sort by area and take a spread
  for (const cat of Object.keys(byCat)) {
    const items = byCat[cat]!;
    items.sort((a, b) => (b.w * b.h) - (a.w * a.h));
    // Take up to 40 per category, evenly spread
    if (items.length > 40) {
      const step = items.length / 40;
      byCat[cat] = Array.from({ length: 40 }, (_, i) => items[Math.floor(i * step)]!);
    }
  }
  return byCat;
}

export function preloadSprites(scene: Phaser.Scene, entries: SpriteEntry[]): void {
  for (const e of entries) {
    if (!scene.textures.exists(e.key)) {
      scene.load.image(e.key, e.file);
    }
  }
}