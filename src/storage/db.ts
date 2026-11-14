import Dexie, { type EntityTable } from 'dexie';

export interface GameSettings {
  id: string;
  musicVolume: number;
  ambientVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  realWorldTimeSync: boolean;
  zoomLevel: number;
  reducedMotion: boolean;
}

export interface WorldDiscovery {
  id: string;
  title: string;
  subtitle: string;
  category: 'nature' | 'architecture' | 'github_memory' | 'folklore';
  discoveredAt: string;
  description: string;
  quote?: string;
  icon: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  createdAt: string;
  season: string;
  weather: string;
  timeOfDay: string;
  text: string;
  source: 'personal' | 'github_memory' | 'valley_chronicle';
}

export interface LocalGameState {
  id: string;
  playerX: number;
  playerY: number;
  isSitting: boolean;
  currentSeatId?: string;
  campfireLit: boolean;
  activeSeason: 'spring' | 'monsoon' | 'autumn' | 'winter';
  connectedGithubUser?: string;
  lastPlayed: string;
}

class GitakureDatabase extends Dexie {
  settings!: EntityTable<GameSettings, 'id'>;
  discoveries!: EntityTable<WorldDiscovery, 'id'>;
  journal!: EntityTable<JournalEntry, 'id'>;
  gameState!: EntityTable<LocalGameState, 'id'>;

  constructor() {
    super('GitakureDB');
    this.version(1).stores({
      settings: 'id',
      discoveries: 'id, category, discoveredAt',
      journal: 'id, source, createdAt',
      gameState: 'id',
    });
  }
}

export const db = new GitakureDatabase();

export async function getSettings(): Promise<GameSettings> {
  const current = await db.settings.get('default');
  if (current) return current;

  const defaults: GameSettings = {
    id: 'default',
    musicVolume: 0.7,
    ambientVolume: 0.85,
    sfxVolume: 0.8,
    isMuted: false,
    realWorldTimeSync: true,
    zoomLevel: 1.4,
    reducedMotion: false,
  };
  await db.settings.put(defaults);
  return defaults;
}

export async function saveSettings(settings: Partial<GameSettings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...settings });
}

export async function addDiscovery(discovery: WorldDiscovery): Promise<boolean> {
  const exists = await db.discoveries.get(discovery.id);
  if (exists) return false;
  await db.discoveries.add(discovery);
  return true;
}

export async function getDiscoveries(): Promise<WorldDiscovery[]> {
  return db.discoveries.toArray();
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  await db.journal.put(entry);
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return db.journal.orderBy('createdAt').reverse().toArray();
}

export async function getGameState(): Promise<LocalGameState> {
  const current = await db.gameState.get('default');
  if (current) return current;

  const defaults: LocalGameState = {
    id: 'default',
    playerX: 10,
    playerY: 10,
    isSitting: false,
    campfireLit: true,
    activeSeason: 'spring',
    lastPlayed: new Date().toISOString(),
  };
  await db.gameState.put(defaults);
  return defaults;
}

export async function saveGameState(state: Partial<LocalGameState>): Promise<void> {
  const current = await getGameState();
  await db.gameState.put({ ...current, ...state, lastPlayed: new Date().toISOString() });
}

export async function clearLocalData(): Promise<void> {
  await db.discoveries.clear();
  await db.journal.clear();
  await db.gameState.clear();
}
