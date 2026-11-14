export type ToolType =
  | 'hand'
  | 'hoe'
  | 'watering_can'
  | 'seeds_rice'
  | 'seeds_radish'
  | 'seeds_tea'
  | 'seeds_starlight'
  | 'basket'
  | 'lantern'
  | 'fishing_rod';

export interface InventoryItem {
  id: string;
  name: string;
  japaneseName: string;
  description: string;
  category: 'tool' | 'seed' | 'crop' | 'forage' | 'blessing';
  count: number;
  iconFrame: string;
  atlas: string;
}

export interface CropState {
  id: string;
  x: number; // tile X
  y: number; // tile Y
  tilled: boolean;
  watered: boolean;
  cropType: 'rice' | 'radish' | 'tea' | 'starlight' | null;
  stage: number; // 0: seed, 1: sprout, 2: growing, 3: mature
  maxStage: number;
}

export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'dusk' | 'night';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type WeatherType = 'sunny' | 'sakura_breeze' | 'gentle_rain' | 'starlight_mist';

export interface DialogueNode {
  speaker: string;
  title: string;
  portraitAtlas: string;
  portraitFrame: string;
  text: string;
  options?: {
    label: string;
    action?: () => void;
    nextText?: string;
  }[];
}

export interface GitHubValleyBlessing {
  username: string;
  contributions: number;
  streak: number;
  blessingType: 'starlight_dew' | 'calm_rain' | 'bamboo_growth' | 'peaceful_rest';
  title: string;
  description: string;
  quote: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  category: 'farm' | 'blessing' | 'nature' | 'info';
}
