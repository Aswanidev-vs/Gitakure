/**
 * The single place that knows which textures the game needs and how their
 * frames are laid out. Scenes never invent keys; they read from `TEX`.
 *
 * Art is painted into canvases in-process at boot rather than fetched, which
 * keeps the game working fully offline and makes every pixel reproducible from
 * source. The `canvases()` function returns a key/canvas map that the Boot
 * scene hands to Phaser's texture manager.
 */

import { buildTerrainTiles, type TerrainId, TILE } from '@/art/tiles/terrain';
import { buildFlora, type FloraId, FLORA } from '@/art/flora';
import { buildProps, type PropId, PROPS } from '@/art/props';
import { buildCrops, type CropId, CROPS, CROP_TILE } from '@/art/crops';
import { buildAnimals, type AnimalId, ANIMALS } from '@/art/animals';
import { paintEffect, EFFECTS, type EffectId, paintVignette, paintLightMask } from '@/art/effects';
import { paintIcon, ICON_IDS, ICON_SIZE, paintPanel, type IconId } from '@/art/ui';
import {
  paintCharacterSheet,
  paintPortrait,
  CHAR_W,
  CHAR_H,
  POSE_COUNT,
  POSE_INDEX,
  PLAYER_SKIN_A,
  PLAYER_SKIN_B,
  type CharacterSkin,
  type Pose,
} from '@/art/characters';
import { PAL } from '@/art/palette';
import { PixelCanvas } from '@/art/PixelCanvas';
import { NPC_SKINS } from '@/data/npcs';

export const TEX = {
  terrain: (id: TerrainId): string => `terrain:${id}`,
  flora: (id: FloraId): string => `flora:${id}`,
  prop: (id: PropId, lit = true): string => `prop:${id}${lit ? ':lit' : ':dim'}`,
  crop: (id: CropId, stage: number): string => `crop:${id}:${Math.min(5, Math.max(0, stage))}`,
  animal: (id: AnimalId): string => `animal:${id}`,
  effect: (id: EffectId, variant = 0): string => `effect:${id}:${variant}`,
  icon: (id: IconId): string => `icon:${id}`,
  player: 'char:player',
  playerAlt: 'char:player-alt',
  npc: (id: string): string => `char:npc:${id}`,
  portrait: (id: string): string => `portrait:${id}`,
  panel: 'ui:panel',
  shadow: 'fx:shadow',
  light: 'fx:light',
  vignette: 'fx:vignette',
  white: 'fx:white',
} as const;

/** A soft blob used as a drop shadow under characters, props and animals. */
function paintShadow(): PixelCanvas {
  const c = PixelCanvas.from(32, 12);
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 32; x++) {
      const dx = (x - 16) / 15;
      const dy = (y - 6) / 5;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const band = d < 0.35 ? 0.34 : d < 0.7 ? 0.2 : 0.1;
      c.setPixel(x, y, 0x14, 0x10, 0x19, Math.round(band * 255));
    }
  }
  return c;
}

/**
 * Paints every texture the game needs. Returns a map of texture key to canvas;
 * the caller registers each one and the map is discarded.
 */
export function buildAllTextures(opts: { dimProps?: boolean } = {}): Map<string, PixelCanvas> {
  const map = new Map<string, PixelCanvas>();
  const put = (key: string, canvas: PixelCanvas): void => {
    map.set(key, canvas);
  };

  for (const [id, canvas] of Object.entries(buildTerrainTiles())) put(TEX.terrain(id as TerrainId), canvas);
  for (const [id, canvas] of Object.entries(buildFlora('spring'))) put(TEX.flora(id as FloraId), canvas);
  for (const [id, canvas] of Object.entries(buildProps(!opts.dimProps))) put(TEX.prop(id as PropId, !opts.dimProps), canvas);

  for (const [id, stages] of Object.entries(buildCrops())) {
    stages.forEach((canvas, i) => put(TEX.crop(id as CropId, i), canvas));
  }

  for (const [id, canvas] of Object.entries(buildAnimals())) put(TEX.animal(id as AnimalId), canvas);

  for (const id of Object.keys(EFFECTS) as EffectId[]) {
    for (let v = 0; v < 3; v++) put(TEX.effect(id, v), paintEffect(id, v));
  }

  for (const id of ICON_IDS) put(TEX.icon(id), paintIcon(id));
  put(TEX.panel, paintPanel());

  put(TEX.player, paintCharacterSheet(PLAYER_SKIN_A));
  put(TEX.playerAlt, paintCharacterSheet(PLAYER_SKIN_B));
  for (const [id, skin] of Object.entries(NPC_SKINS)) {
    put(TEX.npc(id), paintCharacterSheet(skin));
    put(TEX.portrait(id), paintPortrait(skin, id.length * 37 + 11));
  }

  put(TEX.shadow, paintShadow());
  put(TEX.light, paintLightMask(48, PAL.ink, 0.5));
  put(TEX.vignette, paintVignette(640, 360));

  const white = new PixelCanvas(1, 1);
  white.px(0, 0, '#ffffff');
  put(TEX.white, white);

  return map;
}

/** Frame metadata scenes need for animations and collision. */
export const META = {
  TILE,
  CHAR_W,
  CHAR_H,
  POSE_COUNT,
  POSE_INDEX,
  CROP_TILE,
  ICON_SIZE,
  FLORA,
  PROPS,
  CROPS,
  ANIMALS,
  PAL,
  ICON_IDS,
} as const;

export type { CharacterSkin, Pose, TerrainId, FloraId, PropId, CropId, AnimalId, EffectId, IconId };