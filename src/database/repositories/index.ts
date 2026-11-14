import { db, type GameStateRecord, type MemoryRecord, type GithubMetaRecord } from '../db';
import type { PlayerState, WorldState, GameSettings } from '@/types';

// Typed repository accessors over Dexie tables.

export const gameStateRepo = {
  async load(): Promise<{ player: PlayerState; world: WorldState } | null> {
    const rec = await db.gameState.orderBy('updatedAt').last();
    return rec ? { player: rec.player, world: rec.world } : null;
  },
  async save(player: PlayerState, world: WorldState): Promise<void> {
    const existing = await db.gameState.toCollection().first();
    const record: GameStateRecord = {
      id: existing?.id ?? 1,
      player,
      world,
      updatedAt: Date.now(),
    };
    await db.gameState.put(record);
  },
};

export const settingsRepo = {
  async load(): Promise<GameSettings | null> {
    const rec = await db.settings.get('current');
    return rec?.value ?? null;
  },
  async save(settings: GameSettings): Promise<void> {
    await db.settings.put({ key: 'current', value: settings });
  },
};

export const memoriesRepo = {
  async list(username: string): Promise<MemoryRecord[]> {
    return db.memories.where('username').equals(username).toArray();
  },
  async listUndiscovered(username: string): Promise<MemoryRecord[]> {
    return db.memories.where('username').equals(username).filter((m) => !m.discovered).toArray();
  },
  async put(memory: MemoryRecord): Promise<void> {
    await db.memories.put(memory);
  },
  async markDiscovered(id: string): Promise<void> {
    await db.memories.update(id, { discovered: true });
  },
  async has(id: string): Promise<boolean> {
    return (await db.memories.get(id)) !== undefined;
  },
  async clearAll(): Promise<void> {
    await db.memories.clear();
  },
};

export const githubMetaRepo = {
  async get(username: string): Promise<GithubMetaRecord | null> {
    const all = await db.githubMeta.toArray();
    return all.find((m) => m.username === username) ?? null;
  },
  async upsert(meta: Omit<GithubMetaRecord, 'id'>): Promise<void> {
    const existing = await githubMetaRepo.get(meta.username);
    await db.githubMeta.put({ id: existing?.id ?? 1, ...meta });
  },
  async clear(): Promise<void> {
    await db.githubMeta.clear();
  },
};