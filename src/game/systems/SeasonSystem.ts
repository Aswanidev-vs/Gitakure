import * as THREE from 'three';
import type { Season } from '@/types';

// Seasonal cycle: spring/summer/monsoon/autumn/winter. Advances every few
// minutes. Exposes a foliage tint + a seasonal particle color for
// falling leaves/blossoms (driven by the caller's particle system).

const SEASON_ORDER: Season[] = ['spring', 'summer', 'monsoon', 'autumn', 'winter'];
const SEASON_DURATION = 240; // seconds per season

const FOLIAGE_TINT: Record<Season, number> = {
  spring: 0xf2b6d0, // sakura pink
  summer: 0x4f8f4f, // deep green
  monsoon: 0x3a7f5f, // wet teal-green
  autumn: 0xd2743a, // burnt orange
  winter: 0xd8e0e8, // frost
};

export class SeasonSystem {
  private index = 0;
  private elapsed = 0;
  private listener: ((s: Season) => void) | null = null;

  get season(): Season {
    return SEASON_ORDER[this.index]!;
  }

  onSeasonChange(fn: (s: Season) => void): void {
    this.listener = fn;
  }

  update(dt: number): void {
    this.elapsed += dt;
    if (this.elapsed >= SEASON_DURATION) {
      this.elapsed = 0;
      const prev = this.season;
      this.index = (this.index + 1) % SEASON_ORDER.length;
      if (this.season !== prev) this.listener?.(this.season);
    }
  }

  /** Tint applied to foliage materials for the current season. */
  foliageTint(): THREE.Color {
    return new THREE.Color(FOLIAGE_TINT[this.season]);
  }

  setSeason(s: Season): void {
    this.index = SEASON_ORDER.indexOf(s);
    this.elapsed = 0;
    this.listener?.(s);
  }
}