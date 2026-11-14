import type { TimeOfDay, Season, Weather } from '@/types';

// Day/night time system: advances a normalized day fraction (0..1), derives
// the named time-of-day phase, and exposes sun/ambient targets for Lighting.
// A full day cycle is configurable (default 10 min).

export const DAY_LENGTH_SECONDS = 600;

export function timeOfDayFromFraction(t: number): TimeOfDay {
  // 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset
  if (t < 0.22) return 'night';
  if (t < 0.3) return 'sunrise';
  if (t < 0.45) return 'morning';
  if (t < 0.55) return 'afternoon';
  if (t < 0.7) return 'sunset';
  if (t < 0.8) return 'evening';
  return 'night';
}

export class TimeSystem {
  time = 0.35; // start mid-morning
  day = 1;
  private listener: ((time: number, day: number, phase: TimeOfDay) => void) | null = null;

  onTick(fn: (time: number, day: number, phase: TimeOfDay) => void): void {
    this.listener = fn;
  }

  update(dt: number): void {
    const prev = this.time;
    this.time = (this.time + dt / DAY_LENGTH_SECONDS) % 1;
    if (this.time < prev) this.day++; // wrapped past midnight
    this.listener?.(this.time, this.day, timeOfDayFromFraction(this.time));
  }

  setTime(t: number): void {
    this.time = ((t % 1) + 1) % 1;
    this.listener?.(this.time, this.day, timeOfDayFromFraction(this.time));
  }

  get phase(): TimeOfDay {
    return timeOfDayFromFraction(this.time);
  }
}

export type { Season, Weather };