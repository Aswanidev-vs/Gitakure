/**
 * Crop loader: loads the pre-cropped reference art from public/assets/crops
 * into Phaser textures. These are used as painted backdrops and decorative
 * billboards, layered behind the procedural collision tiles.
 */

export const CROP_TEXTURES = {
  terrain: Array.from({ length: 16 }, (_, i) => `crops/terrain_${String(i).padStart(2, '0')}.png`),
  buildings: Array.from({ length: 9 }, (_, i) => `crops/buildings_${String(i).padStart(2, '0')}.png`),
  trees: Array.from({ length: 16 }, (_, i) => `crops/trees_${String(i).padStart(2, '0')}.png`),
  water: Array.from({ length: 12 }, (_, i) => `crops/water_${String(i).padStart(2, '0')}.png`),
  wildlife: Array.from({ length: 16 }, (_, i) => `crops/wildlife_${String(i).padStart(2, '0')}.png`),
  characters: Array.from({ length: 16 }, (_, i) => `crops/characters_${String(i).padStart(2, '0')}.png`),
  farming: Array.from({ length: 12 }, (_, i) => `crops/farming_${String(i).padStart(2, '0')}.png`),
  npc: Array.from({ length: 16 }, (_, i) => `crops/npc_${String(i).padStart(2, '0')}.png`),
  effects: Array.from({ length: 12 }, (_, i) => `crops/effects_${String(i).padStart(2, '0')}.png`),
  ui: Array.from({ length: 16 }, (_, i) => `crops/ui_${String(i).padStart(2, '0')}.png`),
  asset: Array.from({ length: 12 }, (_, i) => `crops/asset_${String(i).padStart(2, '0')}.png`),
};

export function loadCropTextures(scene: Phaser.Scene): void {
  for (const files of Object.values(CROP_TEXTURES)) {
    for (const f of files) {
      const name = f.replace('crops/', '').replace('.png', '');
      if (!scene.textures.exists(`crop:${name}`)) scene.load.image(`crop:${name}`, f);
    }
  }
}