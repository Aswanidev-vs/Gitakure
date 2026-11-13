/**
 * Player-facing settings, persisted in localStorage.
 *
 * Only preferences live here. Tokens and save data never do: the save game is
 * in IndexedDB and a GitHub token stays in memory for the session.
 */

import { device, type InputPreference } from './Device';

export type TextSpeed = 'slow' | 'normal' | 'fast';

export interface StoredSettings {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
  reducedMotion: boolean;
  textSpeed: TextSpeed;
}

const KEY = 'gitakure:settings';

function systemReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function defaults(): StoredSettings {
  return {
    master: 0.6,
    music: 0.35,
    sfx: 0.7,
    muted: false,
    reducedMotion: systemReducedMotion(),
    textSpeed: 'normal',
  };
}

function clamp01(n: unknown, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
}

class SettingsStore {
  private values: StoredSettings;
  private listeners = new Set<(s: StoredSettings) => void>();

  constructor() {
    this.values = this.read();
  }

  get(): StoredSettings {
    return this.values;
  }

  /** Input mode is stored by the device module but surfaced with settings. */
  get inputPreference(): InputPreference {
    return device.getPreference();
  }

  setInputPreference(preference: InputPreference): void {
    device.setPreference(preference);
    this.emit();
  }

  set(patch: Partial<StoredSettings>): void {
    const next = { ...this.values, ...patch };
    next.master = clamp01(next.master, this.values.master);
    next.music = clamp01(next.music, this.values.music);
    next.sfx = clamp01(next.sfx, this.values.sfx);
    this.values = next;
    this.persist();
    this.emit();
  }

  toggleMuted(): boolean {
    this.set({ muted: !this.values.muted });
    return this.values.muted;
  }

  subscribe(listener: (s: StoredSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.values);
  }

  private read(): StoredSettings {
    const base = defaults();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return base;
      const parsed = JSON.parse(raw) as Partial<StoredSettings>;
      return {
        master: clamp01(parsed.master, base.master),
        music: clamp01(parsed.music, base.music),
        sfx: clamp01(parsed.sfx, base.sfx),
        muted: typeof parsed.muted === 'boolean' ? parsed.muted : base.muted,
        reducedMotion:
          typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : base.reducedMotion,
        textSpeed:
          parsed.textSpeed === 'slow' || parsed.textSpeed === 'fast' || parsed.textSpeed === 'normal'
            ? parsed.textSpeed
            : base.textSpeed,
      };
    } catch {
      return base;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.values));
    } catch {
      /* Private mode or a full quota: settings stay in memory. */
    }
  }
}

export const settings = new SettingsStore();