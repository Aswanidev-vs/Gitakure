/**
 * Game configuration. Every magic number that shapes how the game feels lives
 * here so tuning is a one-line change rather than a search through systems.
 */

export const CONFIG = {
  /** Internal resolution. 640x360 scales cleanly to 16:9 and 4:3 displays. */
  width: 640,
  height: 360,
  /** Tile size in pixels. */
  tileSize: 32,
  /** Character frame size. */
  charW: 32,
  charH: 48,
  /** In-game minutes per real second. 1 real minute = 1 game hour. */
  minutesPerSecond: 60,
  /** Walking speed in pixels per second. */
  walkSpeed: 96,
  /** Running speed in pixels per second. */
  runSpeed: 168,
  /** Camera dead-zone in pixels. */
  cameraLerp: 0.12,
  /** Auto-save cadence in real seconds. */
  autoSaveEvery: 120,
  /** Scene keys. */
  scenes: {
    boot: 'BootScene',
    attract: 'AttractScene',
    village: 'VillageScene',
    forest: 'ForestScene',
    farm: 'FarmScene',
    interior: 'InteriorScene',
  },
  /** Save schema version. Bump on breaking changes and migrate in persistence. */
  saveVersion: 1,
  /** GitHub API endpoints. */
  github: {
    graphql: 'https://api.github.com/graphql',
    rest: 'https://api.github.com',
  },
  /** Local-storage key for the (dev-only) PAT. Session memory only in production. */
  patStorageKey: 'gitakure:dev-pat',
} as const;

export type Config = typeof CONFIG;