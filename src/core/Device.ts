/**
 * Device and input-mode detection.
 *
 * Gitakure is played with a keyboard on a desk and with thumbs on a phone, and
 * those are not the same interface. This module decides which one to present,
 * using pointer capability rather than the user-agent string (a touch laptop
 * and a phone with a keyboard both lie about who they are). The player can
 * override the decision in Settings; the choice survives a reload.
 */

export type InputMode = 'desktop' | 'touch';
export type InputPreference = 'auto' | 'desktop' | 'touch';

export interface DeviceSignals {
  /** Primary pointer cannot hover (finger). */
  coarsePointer: boolean;
  /** Primary pointer can hover (mouse or trackpad). */
  finePointer: boolean;
  /** Reported touch points; 0 on a desktop without a digitiser. */
  touchPoints: number;
  /** Layout viewport width in CSS pixels. */
  width: number;
  /** Layout viewport height in CSS pixels. */
  height: number;
}

export interface DeviceProfile extends DeviceSignals {
  mode: InputMode;
  preference: InputPreference;
  /** Short explanation, useful in the settings screen and in bug reports. */
  reason: string;
  dpr: number;
}

export interface Detection {
  mode: InputMode;
  reason: string;
}

const PREFERENCE_KEY = 'gitakure:input-mode';

/**
 * Pure resolution step: given raw signals, decide the mode. Kept separate from
 * the browser bindings so it can be tested without a DOM.
 */
export function detectMode(signals: DeviceSignals, preference: InputPreference = 'auto'): Detection {
  if (preference === 'desktop') return { mode: 'desktop', reason: 'set in settings' };
  if (preference === 'touch') return { mode: 'touch', reason: 'set in settings' };

  const touch =
    signals.coarsePointer ||
    signals.touchPoints > 0 ||
    (typeof navigator !== 'undefined' && 'ontouchstart' in window);

  // A device that can hover with a fine pointer is a desktop, even if it also
  // has a touchscreen (Surface, iPad with a trackpad, touch laptops).
  if (signals.finePointer && !signals.coarsePointer) {
    return { mode: 'desktop', reason: 'mouse or trackpad detected' };
  }

  if (signals.coarsePointer) return { mode: 'touch', reason: 'touch-first screen' };

  if (touch) {
    const small = Math.min(signals.width, signals.height) < 820;
    if (small) return { mode: 'touch', reason: 'small touch screen' };
    return { mode: 'touch', reason: 'touch input detected' };
  }

  return { mode: 'desktop', reason: 'no touch input detected' };
}

function readPreference(): InputPreference {
  try {
    const raw = localStorage.getItem(PREFERENCE_KEY);
    if (raw === 'auto' || raw === 'desktop' || raw === 'touch') return raw;
  } catch {
    /* Storage can be blocked; auto is a fine default. */
  }
  return 'auto';
}

function writePreference(preference: InputPreference): void {
  try {
    localStorage.setItem(PREFERENCE_KEY, preference);
  } catch {
    /* Ignore quota or privacy-mode failures. */
  }
}

function media(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(query);
}

class DeviceManager {
  private preference: InputPreference = 'auto';
  private profile: DeviceProfile;
  private listeners = new Set<(profile: DeviceProfile) => void>();
  private queries: MediaQueryList[] = [];
  private started = false;
  private resizeQueued = false;

  constructor() {
    this.preference = readPreference();
    this.profile = this.compute();
  }

  /** Current profile. Safe to read before `start()`. */
  get(): DeviceProfile {
    return this.profile;
  }

  isTouch(): boolean {
    return this.profile.mode === 'touch';
  }

  getPreference(): InputPreference {
    return this.preference;
  }

  setPreference(preference: InputPreference): void {
    this.preference = preference;
    writePreference(preference);
    this.refresh();
  }

  /** Subscribe to mode changes. The callback is not called immediately. */
  subscribe(listener: (profile: DeviceProfile) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Bind media-query and touch listeners. Idempotent. */
  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    for (const q of ['(pointer: coarse)', '(pointer: fine)', '(hover: hover)', '(any-pointer: coarse)']) {
      const mql = media(q);
      if (!mql) continue;
      this.queries.push(mql);
      const onChange = () => this.refresh();
      if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange);
      else if (typeof mql.addListener === 'function') mql.addListener(onChange);
    }

    // A hybrid device may report a fine pointer until the first real touch.
    window.addEventListener(
      'touchstart',
      () => {
        if (this.preference === 'auto' && this.profile.mode !== 'touch') {
          this.preference = 'auto';
          this.refresh({ forceTouch: true });
        }
      },
      { passive: true, once: false },
    );

    window.addEventListener('resize', () => this.queueResize(), { passive: true });
    window.addEventListener('orientationchange', () => this.queueResize(), { passive: true });
  }

  private queueResize(): void {
    if (this.resizeQueued) return;
    this.resizeQueued = true;
    requestAnimationFrame(() => {
      this.resizeQueued = false;
      this.refresh();
    });
  }

  private refresh(opts: { forceTouch?: boolean } = {}): void {
    const next = this.compute(opts);
    const changed =
      next.mode !== this.profile.mode ||
      next.reason !== this.profile.reason ||
      next.width !== this.profile.width ||
      next.height !== this.profile.height;
    this.profile = next;
    if (changed) {
      for (const listener of this.listeners) listener(this.profile);
    }
  }

  private compute(opts: { forceTouch?: boolean } = {}): DeviceProfile {
    const width = typeof window === 'undefined' ? 1280 : window.innerWidth;
    const height = typeof window === 'undefined' ? 720 : window.innerHeight;
    const coarsePointer = media('(pointer: coarse)')?.matches ?? false;
    const finePointer = media('(hover: hover) and (pointer: fine)')?.matches ?? false;
    const touchPoints =
      typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints || 0;
    const signals: DeviceSignals = {
      coarsePointer: opts.forceTouch ? true : coarsePointer,
      finePointer: opts.forceTouch ? false : finePointer,
      touchPoints,
      width,
      height,
    };
    const detection = detectMode(signals, this.preference);
    return {
      ...signals,
      mode: detection.mode,
      reason: detection.reason,
      preference: this.preference,
      dpr: typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
    };
  }
}

export const device = new DeviceManager();

/** Keycap label for an action, or null when the interface is touch-only. */
export function keyHint(action: 'interact' | 'run' | 'journal' | 'map' | 'menu' | 'advance'): string | null {
  if (device.isTouch()) return null;
  switch (action) {
    case 'interact':
      return 'E';
    case 'run':
      return 'Shift';
    case 'journal':
      return 'J';
    case 'map':
      return 'M';
    case 'menu':
      return 'Esc';
    case 'advance':
      return 'Space';
  }
}

/** Verb shown on the touch action button for an interaction. */
export function touchVerb(verb: string): string {
  const v = verb.trim();
  if (v.length <= 8) return v;
  return v.split(' ')[0] ?? 'Use';
}