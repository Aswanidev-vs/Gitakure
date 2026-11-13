/**
 * Character painter.
 *
 * Characters are 32x48 with the body filling roughly rows 8-44 and row 45 kept
 * clear for the ground shadow. One painter serves the player and every villager
 * so proportions never drift: the only differences are the palette and a couple
 * of silhouette flags (hat, hair, apron, beard).
 *
 * Directions: 0 down, 1 left, 2 right, 3 up.
 */

import { PAL, mix, shade, tint } from './palette';
import { mulberry32, PixelCanvas } from './PixelCanvas';

export const CHAR_W = 32;
export const CHAR_H = 48;

export type Pose =
  | 'idle'
  | 'walk1'
  | 'walk2'
  | 'walk3'
  | 'walk4'
  | 'run1'
  | 'run2'
  | 'tool'
  | 'fish'
  | 'sit'
  | 'sleep';

export type Dir = 0 | 1 | 2 | 3;

export interface CharacterSkin {
  skin: string;
  skinShade: string;
  hair: string;
  hairLit: string;
  hairStyle: 'crop' | 'short' | 'bun' | 'long' | 'bald' | 'wrap';
  outfit: string;
  outfitDark: string;
  trim: string;
  trousers: string;
  /** Optional silhouette extras. */
  hat?: 'straw' | 'cap' | 'none';
  apron?: boolean;
  beard?: boolean;
  build?: 'slim' | 'sturdy';
}

export const PLAYER_SKIN_A: CharacterSkin = {
  skin: '#d9a97e',
  skinShade: '#b3825e',
  hair: '#2b2129',
  hairLit: '#453540',
  hairStyle: 'crop',
  outfit: '#5b7a6a',
  outfitDark: '#3d564a',
  trim: PAL.parchment,
  trousers: '#3a3d52',
};

export const PLAYER_SKIN_B: CharacterSkin = {
  skin: '#e0b48c',
  skinShade: '#bd8f6b',
  hair: '#3b2a24',
  hairLit: '#5a4136',
  hairStyle: 'bun',
  outfit: '#8a5c62',
  outfitDark: '#653f47',
  trim: PAL.parchment,
  trousers: '#414a5c',
};

const OUTFIT_SWAPS: Record<string, Partial<CharacterSkin>> = {
  field: { outfit: '#6b7a44', outfitDark: '#4a5730', trim: PAL.parchment },
  travel: { outfit: '#5b7a6a', outfitDark: '#3d564a', trim: '#a9c6c6' },
  festival: { outfit: '#a2545f', outfitDark: '#75383f', trim: PAL.accentSoft },
  rain: { outfit: '#5c6b78', outfitDark: '#3f4c58', trim: '#9fb3bd' },
};

/** Apply an outfit variant to a base skin. */
export function applyOutfit(base: CharacterSkin, outfit: string): CharacterSkin {
  const swap = OUTFIT_SWAPS[outfit];
  return swap ? { ...base, ...swap } : base;
}

interface Frame {
  bob: number;
  legPhase: number;
  armPhase: number;
  lean: number;
}

function frameFor(pose: Pose): Frame {
  switch (pose) {
    case 'idle':
      return { bob: 0, legPhase: 0, armPhase: 0, lean: 0 };
    case 'walk1':
      return { bob: 0, legPhase: 1, armPhase: 1, lean: 0 };
    case 'walk2':
      return { bob: -1, legPhase: 0, armPhase: 0, lean: 0 };
    case 'walk3':
      return { bob: 0, legPhase: -1, armPhase: -1, lean: 0 };
    case 'walk4':
      return { bob: -1, legPhase: 0, armPhase: 0, lean: 0 };
    case 'run1':
      return { bob: -1, legPhase: 2, armPhase: 2, lean: 1 };
    case 'run2':
      return { bob: 0, legPhase: -2, armPhase: -2, lean: 1 };
    case 'tool':
      return { bob: -1, legPhase: 0, armPhase: 2, lean: 1 };
    case 'fish':
      return { bob: 0, legPhase: 0, armPhase: 1, lean: 0 };
    case 'sit':
      return { bob: 4, legPhase: 0, armPhase: 0, lean: 0 };
    case 'sleep':
      return { bob: 10, legPhase: 0, armPhase: 0, lean: 0 };
    default:
      return { bob: 0, legPhase: 0, armPhase: 0, lean: 0 };
  }
}

const POSES: Pose[] = ['idle', 'walk1', 'walk2', 'walk3', 'walk4', 'run1', 'run2', 'tool', 'fish', 'sit', 'sleep'];
export const POSE_INDEX: Record<Pose, number> = POSES.reduce(
  (acc, p, i) => ({ ...acc, [p]: i }),
  {} as Record<Pose, number>,
);
export const POSE_COUNT = POSES.length;

/**
 * Paints one character frame into a fresh canvas.
 * `dir` 0=down 1=left 2=right 3=up.
 */
export function paintCharacter(skin: CharacterSkin, dir: Dir, pose: Pose): PixelCanvas {
  const f = frameFor(pose);
  const c = PixelCanvas.from(CHAR_W, CHAR_H);
  const sturdy = skin.build === 'sturdy';
  const shoulder = sturdy ? 11 : 10;
  const bodyW = shoulder * 2;
  const bodyX = 16 - shoulder;
  const top = 9 + f.bob;

  const drawing = (fn: () => void): void => {
    fn();
  };

  if (pose === 'sleep') {
    // Curled up: a low lump with the head tucked in.
    c.disc(16, 38, 9, skin.outfit);
    c.disc(16, 38, 9, skin.outfitDark, 90);
    c.disc(11, 35, 5, skin.skin);
    c.disc(11, 35, 4, skin.hair, 255);
    c.hline(8, 42, 16, shade(skin.outfit, 0.35));
    c.outline(PAL.outline);
    return c;
  }

  drawing(() => {
    /* Legs. */
    const legTop = top + 24;
    const legH = 12 - Math.abs(f.legPhase);
    const legOffset = f.legPhase;
    // Back leg
    c.rect(13 - legOffset, legTop, 4, legH, shade(skin.trousers, 0.28));
    // Front leg
    c.rect(16 + legOffset, legTop, 4, legH, skin.trousers);
    // Feet
    c.rect(13 - legOffset, legTop + legH, 5, 3, shade(PAL.woodDark, 0.15));
    c.rect(16 + legOffset, legTop + legH, 5, 3, PAL.woodDark);

    /* Torso. */
    const torsoY = top + 13;
    const torsoH = pose === 'sit' ? 13 : 14;
    c.rect(bodyX, torsoY, bodyW, torsoH, skin.outfit);
    // Side shading gives volume without gradients.
    c.vline(bodyX, torsoY, torsoH, skin.outfitDark);
    c.vline(bodyX + bodyW - 1, torsoY, torsoH, skin.outfitDark);
    // Collar / trim.
    c.hline(bodyX, torsoY, bodyW, mix(skin.outfit, PAL.parchment, 0.28));
    if (skin.apron) {
      c.rect(12, torsoY + 4, 8, torsoH - 4, PAL.parchment);
      c.hline(12, torsoY + 4, 8, PAL.parchmentDeep);
    }
    // Belt
    c.hline(bodyX, torsoY + torsoH - 3, bodyW, skin.outfitDark);
    c.px(16, torsoY + torsoH - 3, skin.trim);

    /* Arms. */
    const armY = torsoY + 2;
    const armLen = 9;
    const swing = f.armPhase;
    if (dir === 3) {
      // Back view: arms hidden behind the torso.
      c.vline(bodyX - 1, armY, armLen, skin.outfitDark);
      c.vline(bodyX + bodyW, armY, armLen, skin.outfitDark);
    } else {
      c.rect(bodyX - 2, armY + Math.max(0, swing), 3, armLen, skin.outfit);
      c.px(bodyX - 2, armY + Math.max(0, swing) + armLen, skin.skin);
      c.rect(bodyX + bodyW - 1, armY + Math.max(0, -swing), 3, armLen, skin.outfit);
      c.px(bodyX + bodyW, armY + Math.max(0, -swing) + armLen, skin.skin);
    }

    /* Neck + head. */
    const headY = top + 1;
    c.rect(14, headY + 11, 4, 3, skin.skinShade);
    c.rect(11, headY, 10, 12, skin.skin);
    c.vline(11, headY, 12, skin.skinShade);
    c.vline(20, headY, 12, skin.skinShade);
    c.hline(11, headY + 11, 10, skin.skinShade);

    /* Hair. */
    drawHair(c, skin, dir, headY);

    /* Hat. */
    if (skin.hat === 'straw') {
      c.rect(7, headY - 1, 18, 3, PAL.sand);
      c.hline(7, headY - 1, 18, PAL.parchment);
      c.hline(7, headY + 2, 18, shade(PAL.sand, 0.3));
      c.rect(10, headY - 4, 12, 4, mix(PAL.sand, PAL.parchment, 0.4));
      c.hline(10, headY - 4, 12, PAL.parchmentDeep);
    } else if (skin.hat === 'cap') {
      c.rect(10, headY - 3, 12, 4, skin.outfitDark);
      c.rect(9, headY + 1, 14, 2, shade(skin.outfitDark, 0.3));
    }

    /* Face. */
    if (dir === 0) {
      // Down: both eyes, small mouth.
      c.px(13, headY + 6, PAL.outline);
      c.px(18, headY + 6, PAL.outline);
      c.px(13, headY + 7, skin.skinShade);
      c.px(18, headY + 7, skin.skinShade);
      c.hline(15, headY + 9, 2, skin.skinShade);
      if (skin.beard) {
        c.rect(12, headY + 8, 8, 4, skin.hair);
        c.hline(12, headY + 8, 8, skin.hairLit);
      }
    } else if (dir === 1) {
      // Left: profile, single eye.
      c.px(12, headY + 6, PAL.outline);
      c.px(12, headY + 7, skin.skinShade);
      c.px(11, headY + 8, skin.skinShade);
      if (skin.beard) c.rect(11, headY + 8, 5, 4, skin.hair);
    } else if (dir === 2) {
      c.px(19, headY + 6, PAL.outline);
      c.px(19, headY + 7, skin.skinShade);
      c.px(20, headY + 8, skin.skinShade);
      if (skin.beard) c.rect(16, headY + 8, 5, 4, skin.hair);
    }

    /* Held tool for the farm/fish poses. */
    if (pose === 'tool') {
      c.vline(25, 14, 16, PAL.wood);
      c.rect(23, 12, 6, 3, PAL.stoneLit);
      c.hline(23, 12, 6, PAL.stone);
    }
    if (pose === 'fish') {
      c.line(24, 18, 29, 30, PAL.parchmentDim);
      c.px(29, 31, PAL.parchment);
      c.vline(24, 14, 5, PAL.wood);
    }
  });

  c.outline(PAL.outline);
  return c;
}

function drawHair(c: PixelCanvas, skin: CharacterSkin, dir: Dir, headY: number): void {
  const h = skin.hair;
  switch (skin.hairStyle) {
    case 'bald':
      break;
    case 'crop':
      c.rect(11, headY - 1, 10, 4, h);
      c.hline(11, headY - 1, 10, skin.hairLit);
      c.hline(11, headY + 3, 2, h);
      c.hline(19, headY + 3, 2, h);
      break;
    case 'short':
      c.rect(10, headY - 2, 12, 6, h);
      c.hline(10, headY - 2, 12, skin.hairLit);
      c.px(10, headY + 4, h);
      c.px(21, headY + 4, h);
      break;
    case 'bun':
      c.rect(10, headY - 2, 12, 5, h);
      c.hline(10, headY - 2, 12, skin.hairLit);
      c.disc(16, headY - 4, 3, h);
      c.px(15, headY - 5, skin.hairLit);
      if (dir === 3) c.rect(13, headY + 3, 6, 5, h);
      break;
    case 'long':
      c.rect(9, headY - 2, 14, 6, h);
      c.hline(9, headY - 2, 14, skin.hairLit);
      if (dir !== 0) {
        c.rect(9, headY + 3, 3, 9, h);
        c.rect(20, headY + 3, 3, 9, h);
      } else {
        c.rect(9, headY + 3, 3, 10, h);
        c.rect(20, headY + 3, 3, 10, h);
      }
      break;
    case 'wrap':
      c.rect(10, headY - 2, 12, 5, skin.trim);
      c.hline(10, headY - 2, 12, tint(skin.trim, 0.3));
      c.hline(10, headY + 2, 12, shade(skin.trim, 0.3));
      break;
  }
}

/** Paints a full character sheet: pose rows x direction columns. */
export function paintCharacterSheet(skin: CharacterSkin): PixelCanvas {
  const sheet = PixelCanvas.from(CHAR_W * 4, CHAR_H * POSES.length);
  POSES.forEach((pose, row) => {
    ([0, 1, 2, 3] as Dir[]).forEach((dir, col) => {
      sheet.blit(paintCharacter(skin, dir, pose), col * CHAR_W, row * CHAR_H);
    });
  });
  return sheet;
}

/** An NPC portrait bust, 48x48, for the dialogue box. */
export function paintPortrait(skin: CharacterSkin, seed: number): PixelCanvas {
  const c = PixelCanvas.from(48, 48);
  const rnd = mulberry32(seed);
  c.fill(PAL.panel);
  // Warm rim light behind the head.
  c.disc(24, 26, 15, mix(PAL.panel, PAL.lamp, 0.14));
  c.disc(24, 26, 11, mix(PAL.panel, PAL.lamp, 0.2));
  // Shoulders.
  c.rect(8, 36, 32, 12, skin.outfit);
  c.rect(8, 36, 32, 2, mix(skin.outfit, PAL.parchment, 0.24));
  c.rect(20, 36, 8, 4, skin.skinShade);
  // Head.
  c.rect(14, 15, 20, 23, skin.skin);
  c.vline(14, 15, 23, skin.skinShade);
  c.vline(33, 15, 23, skin.skinShade);
  c.hline(14, 37, 20, skin.skinShade);
  // Hair.
  const headTop = 14;
  if (skin.hairStyle === 'bald') {
    c.hline(16, headTop, 16, skin.skin);
  } else if (skin.hairStyle === 'bun') {
    c.rect(13, headTop - 2, 22, 8, skin.hair);
    c.disc(24, headTop - 4, 5, skin.hair);
    c.hline(13, headTop - 2, 22, skin.hairLit);
  } else if (skin.hairStyle === 'long') {
    c.rect(12, headTop - 2, 24, 10, skin.hair);
    c.rect(11, headTop + 8, 5, 20, skin.hair);
    c.rect(32, headTop + 8, 5, 20, skin.hair);
    c.hline(12, headTop - 2, 24, skin.hairLit);
  } else if (skin.hairStyle === 'wrap') {
    c.rect(13, headTop - 3, 22, 9, skin.trim);
    c.hline(13, headTop - 3, 22, tint(skin.trim, 0.32));
    c.hline(13, headTop + 5, 22, shade(skin.trim, 0.3));
  } else {
    c.rect(13, headTop - 2, 22, 8, skin.hair);
    c.hline(13, headTop - 2, 22, skin.hairLit);
    c.px(13, headTop + 6, skin.hair);
    c.px(34, headTop + 6, skin.hair);
  }
  // Eyes and brow.
  c.rect(19, 26, 3, 2, PAL.outline);
  c.rect(27, 26, 3, 2, PAL.outline);
  c.px(20, 26, PAL.parchment);
  c.px(28, 26, PAL.parchment);
  c.hline(19, 23, 4, skin.hairLit);
  c.hline(26, 23, 4, skin.hairLit);
  // Nose and mouth.
  c.vline(24, 28, 3, skin.skinShade);
  c.hline(21, 33, 6, skin.skinShade);
  if (skin.beard) {
    c.rect(18, 30, 13, 8, skin.hair);
    c.hline(18, 30, 13, skin.hairLit);
  }
  // A touch of grain so the flat fills do not look vector-clean.
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rnd() * 48);
    const y = Math.floor(rnd() * 48);
    const [, , , a] = c.pixel(x, y);
    if (a === 0) c.px(x, y, mix(PAL.panel, PAL.lamp, 0.06));
  }
  return c;
}