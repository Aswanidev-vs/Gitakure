/**
 * Achievements: simple milestone tracker with unlock notifications.
 */

import { bus } from '@/core/EventBus';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: number | null;
}

const DEFS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first-steps', title: 'First steps', description: 'Enter the world for the first time.' },
  { id: 'first-talk', title: 'First conversation', description: 'Talk to a villager.' },
  { id: 'first-harvest', title: 'First harvest', description: 'Harvest a crop.' },
  { id: 'first-sync', title: 'First sync', description: 'Synchronize GitHub activity.' },
  { id: 'explorer', title: 'Explorer', description: 'Visit all five regions.' },
  { id: 'green-thumb', title: 'Green thumb', description: 'Grow ten crops to harvest.' },
  { id: 'stargazer', title: 'Stargazer', description: 'Earn a star monument.' },
];

export class AchievementSystem {
  private items: Achievement[] = DEFS.map((d) => ({ ...d, unlocked: false, unlockedAt: null }));
  private unlockedIds = new Set<string>();

  getAll(): Achievement[] {
    return this.items;
  }

  isUnlocked(id: string): boolean {
    return this.unlockedIds.has(id);
  }

  unlock(id: string): boolean {
    if (this.unlockedIds.has(id)) return false;
    const a = this.items.find((x) => x.id === id);
    if (!a) return false;
    a.unlocked = true;
    a.unlockedAt = Date.now();
    this.unlockedIds.add(id);
    bus.emit('ui:toast', { text: `Achievement: ${a.title}`, tone: 'warm' });
    return true;
  }

  setUnlocked(ids: string[]): void {
    for (const id of ids) this.unlock(id);
  }

  getUnlockedIds(): string[] {
    return [...this.unlockedIds];
  }
}