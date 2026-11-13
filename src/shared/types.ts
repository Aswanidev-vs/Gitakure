/**
 * Shared world model types. These are the contracts every system in Gitakure
 * speaks. They deliberately contain no Phaser and no DOM types so the
 * progression rules can be reused by a future native client.
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'sunny' | 'cloudy' | 'rain' | 'downpour' | 'fog' | 'snow';
export type DayPhase = 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night';
export type Direction = 'down' | 'up' | 'left' | 'right';

export interface WorldClock {
  /** Total elapsed in-game minutes since the world was founded. */
  minutes: number;
  day: number;
  season: Season;
  weather: Weather;
  phase: DayPhase;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface TilePos {
  tx: number;
  ty: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LocationId =
  | 'village'
  | 'riverside'
  | 'forest'
  | 'farmland'
  | 'shrine'
  | 'hideaway';

export interface LocationMeta {
  id: LocationId;
  name: string;
  subtitle: string;
  /** Grid size of the map, in tiles. */
  width: number;
  height: number;
  /** Where the player appears when arriving from the world map. */
  spawn: TilePos;
  /** True once the player has set foot here. */
  discovered: boolean;
}

export type ItemId = string;

export interface ItemStack {
  id: ItemId;
  count: number;
}

export type CropStage = 0 | 1 | 2 | 3 | 4;

export interface PlantedCrop {
  /** Stable identity so saving and loading never duplicates a crop. */
  uid: string;
  crop: ItemId;
  tx: number;
  ty: number;
  location: LocationId;
  stage: CropStage;
  /** Growth accumulated in in-game minutes, not wall-clock time. */
  growthMinutes: number;
  watered: boolean;
  plantedDay: number;
  season: Season;
}

export interface Inventory {
  slots: (ItemStack | null)[];
  hotbar: number;
  capacity: number;
}

export type LandmarkKind =
  | 'homestead'
  | 'projectStone'
  | 'library'
  | 'shrine'
  | 'bridge'
  | 'monument'
  | 'greenhouse'
  | 'market'
  | 'observatory';

export interface Landmark {
  uid: string;
  kind: LandmarkKind;
  name: string;
  location: LocationId;
  tx: number;
  ty: number;
  /** GitHub event ids that produced this landmark; used for idempotency. */
  sources: string[];
  builtDay: number;
  /** Flavour line shown when the player examines it. */
  blurb: string;
}

export interface JournalEntry {
  uid: string;
  day: number;
  kind: 'milestone' | 'discovery' | 'person' | 'note' | 'github';
  title: string;
  body: string;
}

export interface NpcState {
  id: string;
  /** Current tile position inside its schedule location. */
  location: LocationId;
  tx: number;
  ty: number;
  /** Minutes since the world began, used to resolve the daily routine. */
  lastSeen: number;
  met: boolean;
  affinity: number;
  talkedToday: number;
  lastTalkDay: number;
}

export interface DiscoveredArea {
  id: LocationId;
  discovered: boolean;
}

export interface Settings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  reducedMotion: boolean;
  textSpeed: 'slow' | 'normal' | 'fast';
  showTouchControls: 'auto' | 'on' | 'off';
}

export interface SyncSummary {
  lastSyncAt: number | null;
  source: 'none' | 'github' | 'sample';
  username: string | null;
  totalContributions: number;
  activeDays: number;
  longestStreak: number;
  repositories: number;
  stars: number;
  importedDays: number;
  earliestDay: string | null;
  latestDay: string | null;
  notes: string[];
}

export interface SaveGame {
  version: number;
  createdAt: number;
  updatedAt: number;
  player: {
    name: string;
    appearance: PlayerAppearance;
    location: LocationId;
    x: number;
    y: number;
    direction: Direction;
  };
  clock: WorldClock;
  inventory: Inventory;
  crops: PlantedCrop[];
  landmarks: Landmark[];
  journal: JournalEntry[];
  npcs: Record<string, NpcState>;
  discovered: LocationId[];
  sync: SyncSummary;
  /** Set of GitHub event ids already applied, guaranteeing idempotency. */
  appliedEvents: string[];
  flags: Record<string, number>;
}

export interface PlayerAppearance {
  body: 'a' | 'b';
  hair: 'short' | 'bun' | 'long' | 'crop';
  outfit: 'field' | 'travel' | 'festival' | 'rain';
  accessory: 'none' | 'scarf' | 'satchel' | 'hat';
}