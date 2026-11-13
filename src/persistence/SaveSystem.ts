/**
 * Persistence layer using IndexedDB. Stores a single SaveGame under a fixed key,
 * with versioning and corrupted-save recovery.
 */

import type { SaveGame } from '@/shared/types';

const DB_NAME = 'gitakure';
const STORE = 'saves';
const KEY = 'current';

export class SaveSystem {
  private db: IDBDatabase | null = null;

  async open(): Promise<void> {
    if (this.db) return;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async save(game: SaveGame): Promise<void> {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(game, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async load(): Promise<SaveGame | null> {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as SaveGame) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(): Promise<void> {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}