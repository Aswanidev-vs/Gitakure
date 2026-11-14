/**
 * World tuning.
 *
 * One place for every number that shapes how the valley feels, so the mood can
 * be adjusted without hunting through systems. Values are chosen for a calm,
 * legible world: the player walks rather than sprints, the camera sits high
 * enough to read the terraces, and a full day passes in about twenty minutes.
 */

export const CONFIG = {
  /** Radius of the playable valley, in world units. */
  worldRadius: 220,
  /** Terrain mesh resolution. Higher is smoother and slower. */
  terrainSegments: 200,

  /** Height of the river surface. Terrain below this is submerged. */
  waterLevel: -2.2,

  camera: {
    /** Distance behind the player. */
    distance: 11,
    /** Height above the player's feet. */
    height: 6.2,
    /** How far the camera looks ahead of the player. */
    lookAhead: 2.4,
    /** Follow smoothing per second. */
    followLambda: 6.5,
    /** Orbit smoothing. */
    orbitLambda: 9,
    minPitch: 0.12,
    maxPitch: 1.15,
    startPitch: 0.46,
    startYaw: Math.PI * 0.15,
    /** Field of view in degrees. */
    fov: 52,
  },

  player: {
    walkSpeed: 4.6,
    runSpeed: 8.4,
    /** Acceleration and deceleration, in units/s². */
    accel: 26,
    turnLambda: 12,
    /** Collision radius against props. */
    radius: 0.45,
    eyeHeight: 1.6,
  },

  /** Seconds of real time per in-game day. */
  dayLengthSeconds: 1200,
  /** The day starts at this hour. */
  startHour: 6.5,

  /** Number of scenery instances per category; density of the world. */
  scatter: {
    grassTufts: 26000,
    flowers: 2600,
    trees: 900,
    bamboo: 420,
    rocks: 260,
    reeds: 1500,
    lilyPads: 120,
  },

  save: {
    key: 'gitakure.save',
    version: 1,
    intervalMs: 15000,
  },
} as const;

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'clear' | 'overcast' | 'rain' | 'storm' | 'mist';

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

/**
 * Season palettes.
 *
 * Colour is where the seasons actually read in a low-poly world, so each one
 * carries its own ground, foliage, grass and sky values rather than a tint.
 */
export const SEASON_PALETTE: Record<
  Season,
  {
    ground: number;
    groundDry: number;
    foliage: number;
    foliageAlt: number;
    grass: number;
    flower: number;
    sky: number;
    horizon: number;
    ambient: number;
    sun: number;
    fog: number;
  }
> = {
  spring: {
    ground: 0x6f9e52,
    groundDry: 0x8fae62,
    foliage: 0x74ad55,
    foliageAlt: 0x9ac96a,
    grass: 0x7cb85c,
    flower: 0xf0b8c8,
    sky: 0x8fc4e8,
    horizon: 0xdfeef7,
    ambient: 0xbcd6e8,
    sun: 0xfff2d8,
    fog: 0xcfe3ee,
  },
  summer: {
    ground: 0x5f9445,
    groundDry: 0x87a850,
    foliage: 0x4f8c3e,
    foliageAlt: 0x76ad4c,
    grass: 0x69a844,
    flower: 0xf2d268,
    sky: 0x74b6e4,
    horizon: 0xd6ecf8,
    ambient: 0xb2d2e8,
    sun: 0xfff0cc,
    fog: 0xc8e0ee,
  },
  autumn: {
    ground: 0x8a8f4a,
    groundDry: 0xa8965a,
    foliage: 0xc9762f,
    foliageAlt: 0xd9a13c,
    grass: 0xa8a054,
    flower: 0xe8c46a,
    sky: 0x8fb8d6,
    horizon: 0xf0dfc8,
    ambient: 0xd6c6ac,
    sun: 0xffdca8,
    fog: 0xe2d3bc,
  },
  winter: {
    ground: 0xd8e4ea,
    groundDry: 0xc2d2da,
    foliage: 0x5f7a6a,
    foliageAlt: 0x7d9484,
    grass: 0xc8d8de,
    flower: 0xdfe9f0,
    sky: 0xa8bed4,
    horizon: 0xe8f0f6,
    ambient: 0xc8d8e8,
    sun: 0xe8f0ff,
    fog: 0xdfe8f0,
  },
};