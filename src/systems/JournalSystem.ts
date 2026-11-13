/**
 * Journal: collects entries (milestones, discoveries, people, notes, github).
 * Persisted as part of the save game.
 */

import type { JournalEntry } from '@/shared/types';

export class JournalSystem {
  private entries: JournalEntry[] = [];

  getEntries(): JournalEntry[] {
    return this.entries;
  }

  set(entries: JournalEntry[]): void {
    this.entries = entries;
  }

  add(entry: Omit<JournalEntry, 'uid'>): JournalEntry {
    const full: JournalEntry = { uid: `j:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, ...entry };
    this.entries.unshift(full);
    return full;
  }

  has(title: string): boolean {
    return this.entries.some((e) => e.title === title);
  }
}