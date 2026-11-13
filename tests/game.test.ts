import { describe, it, expect } from 'vitest';
import { stageFor } from '@/systems/FarmingSystem';
import { normalizeContributions } from '@/github/ActivityNormalizer';
import { applyEvents } from '@/github/WorldMapper';

describe('farming stageFor', () => {
  it('returns 0 for a freshly planted crop', () => {
    const crop = {
      uid: 'c1', crop: 'tomato', tx: 0, ty: 0, location: 'village' as const,
      stage: 0 as const, growthMinutes: 0, watered: false, plantedDay: 0, season: 'spring' as const,
    };
    expect(stageFor(crop, 0)).toBe(0);
  });
  it('reaches stage 4 after full growth', () => {
    const crop = {
      uid: 'c2', crop: 'tomato', tx: 0, ty: 0, location: 'village' as const,
      stage: 0 as const, growthMinutes: 0, watered: false, plantedDay: 0, season: 'spring' as const,
    };
    // tomato growMinutes = 1440
    expect(stageFor(crop, 1440)).toBe(4);
  });
});

describe('activity normalizer', () => {
  it('produces stable event ids', () => {
    const cal = { totalContributions: 3, weeks: [{ days: [{ date: '2024-01-01', count: 2 }, { date: '2024-01-02', count: 1 }] }] };
    const repos = [{ name: 'foo', stars: 10, forks: 3, createdAt: '2024-01-01T00:00:00Z' }];
    const a = normalizeContributions(cal, repos);
    const b = normalizeContributions(cal, repos);
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id));
  });
  it('creates a repository event per repo', () => {
    const cal = { totalContributions: 0, weeks: [] };
    const repos = [{ name: 'bar', stars: 0, forks: 0, createdAt: '2024-01-01T00:00:00Z' }];
    const events = normalizeContributions(cal, repos);
    expect(events.some((e) => e.id === 'repo:bar')).toBe(true);
  });
});

describe('world mapper idempotency', () => {
  it('does not re-apply already-applied events', () => {
    const events = [{ id: 'repo:x', kind: 'repository' as const, date: '2024-01-01', weight: 1, meta: { name: 'x' } }];
    const already = new Set(['repo:x']);
    const res = applyEvents(events as any, already, []);
    expect(res.newLandmarks.length).toBe(0);
    expect(res.appliedIds).not.toContain('repo:x');
  });
});