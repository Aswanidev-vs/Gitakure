/**
 * Farming system: planting, watering, growth driven by in-game minutes, and
 * harvesting. Growth is deterministic and idempotent: a crop's stage is a pure
 * function of (plantedDay, growthMinutes, season), so re-running sync never
 * duplicates growth.
 */

import { bus } from '@/core/EventBus';
import type { CropStage, PlantedCrop, Season } from '@/shared/types';
import { CROPS } from '@/art/crops';

export const CROP_GROWTH_MINUTES: Record<string, number> = Object.fromEntries(
  Object.entries(CROPS).map(([k, v]) => [k, v.growMinutes]),
);

export function stageFor(crop: PlantedCrop, nowMinutes: number): CropStage {
  // growthMinutes tracks accumulated growth; recompute from elapsed wall-clock-in-game.
  const totalElapsed = nowMinutes - crop.plantedDay * 1440;
  const target = CROP_GROWTH_MINUTES[crop.crop] ?? 1440;
  const progress = Math.min(1, Math.max(0, totalElapsed / target));
  const stage = Math.floor(progress * 4) as CropStage;
  return Math.min(4, Math.max(0, stage)) as CropStage;
}

export class FarmingSystem {
  private crops: PlantedCrop[] = [];

  getCrops(): PlantedCrop[] {
    return this.crops;
  }

  set(crops: PlantedCrop[]): void {
    this.crops = crops;
  }

  plant(uid: string, crop: string, tx: number, ty: number, location: string, season: Season, nowMinutes: number): PlantedCrop {
    const planted: PlantedCrop = {
      uid,
      crop,
      tx,
      ty,
      location: location as PlantedCrop['location'],
      stage: 0,
      growthMinutes: 0,
      watered: false,
      plantedDay: Math.floor(nowMinutes / 1440),
      season,
    };
    this.crops.push(planted);
    bus.emit('crop:planted', { uid, crop });
    return planted;
  }

  water(uid: string): boolean {
    const c = this.crops.find((x) => x.uid === uid);
    if (!c) return false;
    c.watered = true;
    return true;
  }

  /** Advance growth for all crops based on the current clock. */
  tick(nowMinutes: number): void {
    for (const c of this.crops) {
      if (c.stage >= 4) continue;
      const newStage = stageFor(c, nowMinutes);
      if (newStage !== c.stage) {
        c.stage = newStage;
        bus.emit('crop:growth', { uid: c.uid, stage: newStage });
      }
      if (c.watered) c.growthMinutes += 0; // growth is time-driven; watered flag kept for visuals
    }
  }

  harvest(uid: string): { crop: string; amount: number } | null {
    const idx = this.crops.findIndex((x) => x.uid === uid);
    if (idx < 0) return null;
    const c = this.crops[idx]!;
    if (c.stage < 4) return null;
    this.crops.splice(idx, 1);
    bus.emit('crop:harvested', { uid, crop: c.crop, amount: 1 });
    return { crop: c.crop, amount: 1 };
  }

  at(tx: number, ty: number, location: string): PlantedCrop | undefined {
    return this.crops.find((c) => c.tx === tx && c.ty === ty && c.location === location);
  }
}