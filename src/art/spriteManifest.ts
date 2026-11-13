/**
 * Sprite manifest: hardcoded list of extracted sprites, curated per category.
 * Generated from scripts/extract-sprites.py output.
 */

export interface SpriteEntry {
  key: string;
  file: string;
  category: string;
}

const CATEGORIES: Record<string, number> = {
  terrain: 152,
  building: 30,
  tree: 147,
  water: 155,
  animal: 468,
  char: 92,
  npc: 71,
  crop: 249,
  fx: 264,
  ui: 182,
  prop: 50,
};

/** Curated count per category (spread across available sprites). */
const CURATED: Record<string, number> = {
  terrain: 24,
  building: 20,
  tree: 32,
  water: 20,
  animal: 24,
  char: 20,
  npc: 16,
  crop: 24,
  fx: 20,
  ui: 20,
  prop: 16,
};

function buildManifest(): SpriteEntry[] {
  const out: SpriteEntry[] = [];
  for (const [cat, total] of Object.entries(CATEGORIES)) {
    const want = Math.min(CURATED[cat] ?? 16, total);
    const step = total / want;
    for (let i = 0; i < want; i++) {
      const idx = Math.floor(i * step);
      const file = `${cat}_${String(idx).padStart(3, '0')}.png`;
      out.push({ key: `spr:${cat}_${String(idx).padStart(3, '0')}`, file: `assets/sprites/${file}`, category: cat });
    }
  }
  return out;
}

export const SPRITE_MANIFEST = buildManifest();

export const SPRITES_BY_CATEGORY: Record<string, SpriteEntry[]> = SPRITE_MANIFEST.reduce(
  (acc, s) => { (acc[s.category] ??= []).push(s); return acc; },
  {} as Record<string, SpriteEntry[]>,
);