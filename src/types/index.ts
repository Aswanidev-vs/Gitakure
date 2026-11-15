// Core shared types for Gitakure.

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type CameraMode = 'firstPerson' | 'thirdPerson' | 'menu';

export type Season = 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter';

export type Weather = 'clear' | 'cloudy' | 'lightRain' | 'heavyRain' | 'mist';

export type TimeOfDay =
  | 'sunrise'
  | 'morning'
  | 'afternoon'
  | 'sunset'
  | 'evening'
  | 'night';

export interface GraphicsSettings {
  quality: GraphicsQuality;
  pixelRatioCap: number;
  shadows: boolean;
  antialias: boolean;
  maxPixelCount: number;
}

export interface AudioSettings {
  master: number;
  ambience: number;
  sfx: number;
  music: boolean;
}

export interface CameraSettings {
  mode: CameraMode;
  followDistance: number;
  fov: number;
}

export interface GameSettings {
  graphics: GraphicsSettings;
  audio: AudioSettings;
  camera: CameraSettings;
  reducedMotion: boolean;
  showTime: boolean;
  showWeather: boolean;
}

export interface PlayerState {
  position: [number, number, number];
  rotation: number;
}

export interface WorldState {
  time: number; // 0..1 day fraction
  day: number;
  season: Season;
  weather: Weather;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  graphics: {
    quality: 'low',
    pixelRatioCap: 1.5,
    shadows: false,
    antialias: true,
    maxPixelCount: 3840 * 2160,
  },
  audio: { master: 0.8, ambience: 0.7, sfx: 0.8, music: false },
  camera: { mode: 'thirdPerson', followDistance: 6, fov: 50 },
  reducedMotion: false,
  showTime: true,
  showWeather: true,
};

/**
 * Detach a settings object from Vue reactivity.
 *
 * `structuredClone` cannot clone a reactive proxy and throws DataCloneError, so
 * round-tripping through JSON is used instead. Settings are plain JSON — no
 * functions, dates or class instances — so this is lossless here.
 */
export function plainSettings(s: GameSettings): GameSettings {
  return JSON.parse(JSON.stringify(s)) as GameSettings;
}