/**
 * The Gitakure palette. Derived from the supplied reference posters, which sit
 * in a narrow band of dark plum shadows, mossy golds, weathered timber and
 * slate-teal water. Every colour the game draws comes from here so the pixel
 * art stays coherent across hand-authored tiles and generated ones.
 */

export const PAL = {
  /* Neutrals — plum-shifted, never pure black. */
  ink: '#141019',
  shadowDeep: '#1d1826',
  shadow: '#292232',
  shadowSoft: '#362c3e',
  outline: '#100c16',

  /* Ground — mossy golds and worn earth. */
  grassDark: '#4c5a2c',
  grass: '#6d7a38',
  grassLit: '#8d9445',
  grassPale: '#ada663',
  moss: '#5b6a35',

  /* Earth and stone. */
  soilDark: '#4d3635',
  soil: '#785845',
  soilLit: '#96705a',
  sand: '#b8a271',
  stoneDark: '#4f4a4f',
  stone: '#726a6b',
  stoneLit: '#9c9188',
  cliff: '#3c3340',

  /* Timber and buildings. */
  woodDark: '#4a2f2a',
  wood: '#6d4636',
  woodLit: '#8e6b54',
  plank: '#ac876c',
  plaster: '#dfb592',
  roofDark: '#39303e',
  roof: '#544a56',
  roofLit: '#75687a',

  /* Water. */
  waterDeep: '#27405b',
  water: '#3d6b85',
  waterLit: '#5b90a4',
  foam: '#a9c6c6',
  ripple: '#88a4a4',

  /* Foliage. */
  leafDark: '#243021',
  leafDeep: '#2f3d28',
  leaf: '#41552f',
  leafLit: '#5c7239',
  leafPale: '#7c8f45',

  /* Blossom and accent. */
  blossomDark: '#a35f74',
  blossom: '#d08b9c',
  blossomLit: '#efb9c2',
  petal: '#f6d5da',

  /* Mangrove and tropical greens (the Kerala half). */
  palmDark: '#1f3327',
  palm: '#2f5033',
  palmLit: '#4a7541',
  banana: '#3c6b3a',
  bananaLit: '#61914a',

  /* Warm light. */
  lamp: '#f2c078',
  lampCore: '#ffe6b0',
  ember: '#e2703f',
  fire: '#f0a04b',

  /* UI. */
  parchment: '#e8dcc0',
  parchmentDim: '#c9bc9f',
  parchmentDeep: '#a89b80',
  panel: '#241f2c',
  panelLit: '#332c3c',
  accent: '#c9a227',
  accentSoft: '#e0c05a',
  link: '#8fb8a8',

  /* Feedback. */
  health: '#b4544a',
  stamina: '#6f9a58',
  spirit: '#7f8fc4',
} as const;

export type ColorName = keyof typeof PAL;

/** `#rrggbb` to a Phaser-friendly 0xRRGGBB integer. */
export function hex(color: string): number {
  return Number.parseInt(color.replace('#', ''), 16);
}

/** Linear mix of two hex colours; t = 0 yields a, t = 1 yields b. */
export function mix(a: string, b: string, t: number): string {
  const av = hex(a);
  const bv = hex(b);
  const ar = (av >> 16) & 0xff;
  const ag = (av >> 8) & 0xff;
  const ab = av & 0xff;
  const br = (bv >> 16) & 0xff;
  const bg = (bv >> 8) & 0xff;
  const bb = bv & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

/** Darken towards the shadow end of the ramp. */
export const shade = (c: string, t = 0.3): string => mix(c, PAL.shadowDeep, t);

/** Lighten towards paper white, keeping the plum tint. */
export const tint = (c: string, t = 0.3): string => mix(c, '#fff6ea', t);