/**
 * Time system: advances in-game minutes based on wall-clock delta scaled by
 * minutesPerSecond. Emits phase and day boundaries so other systems can react.
 */

import { bus } from '@/core/EventBus';
import type { DayPhase, Season, Weather, WorldClock } from '@/shared/types';

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
export const WEATHERS: Weather[] = ['sunny', 'cloudy', 'rain', 'fog'];

export function phaseForMinutes(m: number): DayPhase {
  const md = ((m % 1440) + 1440) % 1440;
  if (md < 300) return 'night';
  if (md < 420) return 'dawn';
  if (md < 720) return 'morning';
  if (md < 1020) return 'afternoon';
  if (md < 1140) return 'dusk';
  return 'night';
}

export function seasonForDay(day: number): Season {
  // ~30 in-game days per season.
  const idx = Math.floor(day / 30) % 4;
  return SEASONS[idx]!;
}

export class TimeSystem {
  private clock: WorldClock;
  private lastPhase: DayPhase;

  constructor(start: WorldClock) {
    this.clock = { ...start };
    this.lastPhase = this.clock.phase;
  }

  getClock(): WorldClock {
    return this.clock;
  }

  /** Advance by real delta (ms). Returns the new clock. */
  tick(deltaMs: number, minutesPerSecond: number): WorldClock {
    const minutes = (deltaMs / 1000) * minutesPerSecond;
    this.clock.minutes += minutes;
    const newDay = Math.floor(this.clock.minutes / 1440);
    if (newDay !== this.clock.day) {
      this.clock.day = newDay;
      this.clock.season = seasonForDay(newDay);
    }
    const newPhase = phaseForMinutes(this.clock.minutes);
    if (newPhase !== this.lastPhase) {
      this.lastPhase = newPhase;
      this.clock.phase = newPhase;
      bus.emit('clock:phase', { phase: newPhase, clock: this.clock });
    }
    this.clock.phase = newPhase;
    bus.emit('clock:tick', { clock: this.clock, minutesPerSecond });
    return this.clock;
  }

  setWeather(w: Weather): void {
    if (w === this.clock.weather) return;
    this.clock.weather = w;
    bus.emit('weather:change', { weather: w, clock: this.clock });
  }

  setSeason(s: Season): void {
    if (s === this.clock.season) return;
    this.clock.season = s;
    bus.emit('season:change', { season: s, clock: this.clock });
  }
}