/**
 * Season system: tracks the current season and emits transitions.
 * Season is derived from in-game day (30 days per season) but can be
 * overridden for testing.
 */

import { bus } from '@/core/EventBus';
import type { Season } from '@/shared/types';

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export class SeasonSystem {
  private season: Season = 'spring';

  get(): Season {
    return this.season;
  }

  /** Update season from in-game day. Returns true if changed. */
  updateFromDay(day: number): boolean {
    const next = SEASONS[Math.floor(day / 30) % 4]!;
    if (next === this.season) return false;
    this.season = next;
    bus.emit('season:change', { season: next, clock: { minutes: day * 1440, day, season: next, weather: 'sunny', phase: 'morning' } });
    return true;
  }

  set(s: Season): void {
    if (s === this.season) return;
    this.season = s;
    bus.emit('season:change', { season: s, clock: { minutes: 0, day: 0, season: s, weather: 'sunny', phase: 'morning' } });
  }
}