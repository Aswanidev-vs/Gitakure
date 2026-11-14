import Dexie, { type Table } from 'dexie';
import type { PlayerState, WorldState, GameSettings } from '@/types';

// Versioned IndexedDB schema via Dexie (spec §17). Persists player position,
// world state, settings, and discovered GitHub memories.

export interface GameStateRecord {
  id: number;
  player: PlayerState;
  world: WorldState;
  updatedAt: number;
}

export interface MemoryRecord {
  id: string; // `${username}:${milestoneId}`
  username: string;
  milestoneId: string;
  kind: string; // 'lantern' | 'stone' | 'tree' | 'scroll' ...
  label: string;
  position: [number, number, number];
  discovered: boolean;
  createdAt: number;
}

export interface GithubMetaRecord {
  id: number;
  username: string;
  lastSyncAt: number;
  lastProcessedCommitCount: number;
  repoCount: number;
  highestStreak: number;
}

export class GitakureDB extends Dexie {
  gameState!: Table<GameStateRecord, number>;
  settings!: Table<{ key: string; value: GameSettings }, string>;
  memories!: Table<MemoryRecord, string>;
  githubMeta!: Table<GithubMetaRecord, number>;

  constructor() {
    super('gitakure');
    this.version(1).stores({
      gameState: '++id,updatedAt',
      settings: 'key',
      memories: 'id,username,discovered,kind',
      githubMeta: '++id,username',
    });
  }
}

export const db = new GitakureDB();