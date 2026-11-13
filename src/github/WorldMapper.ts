/**
 * World mapper: applies normalized world events to the game world, producing
 * landmarks and journal entries. Idempotent via appliedEvents set.
 */

import type { Landmark, LandmarkKind, LocationId } from '@/shared/types';
import type { WorldEvent } from './ActivityNormalizer';

export interface ApplyResult {
  newLandmarks: Landmark[];
  journalEntries: { title: string; body: string }[];
  appliedIds: string[];
}

const LANDMARK_NAMES: Record<string, string[]> = {
  repository: ['Project Stone', 'Workshop Cairn', 'Foundation Marker'],
  streak: ['The Long Path', 'The Steady Tree'],
  star: ['Star Garden', 'Lantern Post'],
  milestone: ['Milestone Arch', 'Memory Obelisk'],
};

function pickName(kind: string, index: number): string {
  const pool = LANDMARK_NAMES[kind] ?? ['Quiet Stone'];
  return pool[index % pool.length]!;
}

function kindToLandmark(kind: WorldEvent['kind']): LandmarkKind {
  switch (kind) {
    case 'repository':
      return 'projectStone';
    case 'streak':
      return 'monument';
    case 'star':
      return 'observatory';
    default:
      return 'stone_marker' as unknown as LandmarkKind;
  }
}

export function applyEvents(
  events: WorldEvent[],
  alreadyApplied: Set<string>,
  existingLandmarks: Landmark[],
  location: LocationId = 'village',
): ApplyResult {
  const result: ApplyResult = { newLandmarks: [], journalEntries: [], appliedIds: [] };
  const landmarkCount = existingLandmarks.length;

  // Place landmarks in a spiral around the village centre so they never overlap.
  let cursor = landmarkCount;
  for (const ev of events) {
    if (alreadyApplied.has(ev.id)) continue;
    if (ev.kind === 'contribution-day') {
      // Contribution days don't spawn landmarks; they feed vegetation growth.
      result.appliedIds.push(ev.id);
      continue;
    }
    if (ev.kind === 'fork') {
      result.appliedIds.push(ev.id);
      continue;
    }

    const angle = (cursor * 137.5 * Math.PI) / 180;
    const radius = 6 + Math.floor(cursor / 3);
    const tx = Math.round(20 + Math.cos(angle) * radius);
    const ty = Math.round(15 + Math.sin(angle) * radius);

    const landmark: Landmark = {
      uid: `lm:${ev.id}`,
      kind: kindToLandmark(ev.kind),
      name: ev.kind === 'repository' ? String(ev.meta.name ?? pickName(ev.kind, cursor)) : pickName(ev.kind, cursor),
      location,
      tx,
      ty,
      sources: [ev.id],
      builtDay: 0,
      blurb:
        ev.kind === 'repository'
          ? `A stone for ${ev.meta.name}. ${ev.meta.stars} stars, ${ev.meta.forks} forks.`
          : ev.kind === 'streak'
            ? `A monument to ${ev.meta.days} steady days.`
            : ev.kind === 'star'
              ? `A lantern for ${ev.meta.stars} stars on ${ev.meta.name}.`
              : 'A quiet marker.',
    };
    result.newLandmarks.push(landmark);
    result.journalEntries.push({
      title: landmark.name,
      body: landmark.blurb,
    });
    result.appliedIds.push(ev.id);
    cursor++;
  }

  return result;
}