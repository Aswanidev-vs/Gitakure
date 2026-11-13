/**
 * Sync service: orchestrates GitHub fetch → normalize → apply, with caching,
 * idempotency, and graceful failure.
 */

import { Authentication } from '@/github/Authentication';
import { GitHubClient } from '@/github/GitHubClient';
import { ContributionService } from '@/github/ContributionService';
import { normalizeContributions } from '@/github/ActivityNormalizer';
import { applyEvents } from '@/github/WorldMapper';
import { bus } from '@/core/EventBus';
import type { Landmark, SyncSummary } from '@/shared/types';

export class SyncService {
  private client: GitHubClient;
  private contrib: ContributionService;

  constructor(auth: Authentication) {
    this.client = new GitHubClient(auth);
    this.contrib = new ContributionService(this.client);
  }

  async sync(username: string, alreadyApplied: Set<string>, existingLandmarks: Landmark[]): Promise<{ landmarks: Landmark[]; summary: SyncSummary; appliedIds: string[] }> {
    bus.emit('sync:started', { username });
    const notes: string[] = [];
    const now = new Date();
    const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
    const to = now.toISOString();

    let calendar = { totalContributions: 0, weeks: [] as { days: { date: string; count: number }[] }[] };
    let repos: { name: string; stars: number; forks: number; createdAt: string }[] = [];

    try {
      calendar = await this.contrib.fetchCalendar(username, from, to);
    } catch (e) {
      notes.push(`Contributions unavailable: ${(e as Error).message}`);
    }
    try {
      repos = await this.contrib.fetchRepos(username);
    } catch (e) {
      notes.push(`Repositories unavailable: ${(e as Error).message}`);
    }

    const events = normalizeContributions(calendar, repos);
    const result = applyEvents(events, alreadyApplied, existingLandmarks);

    const activeDays = calendar.weeks.reduce((a, w) => a + w.days.filter((d) => d.count > 0).length, 0);
    const allDays = calendar.weeks.flatMap((w) => w.days);
    let cur = 0;
    let best = 0;
    for (const d of allDays) {
      if (d.count > 0) { cur++; best = Math.max(best, cur); } else cur = 0;
    }

    const summary: SyncSummary = {
      lastSyncAt: Date.now(),
      source: 'github',
      username,
      totalContributions: calendar.totalContributions,
      activeDays,
      longestStreak: best,
      repositories: repos.length,
      stars: repos.reduce((a, r) => a + r.stars, 0),
      importedDays: events.filter((e) => e.kind === 'contribution-day').length,
      earliestDay: allDays[0]?.date ?? null,
      latestDay: allDays[allDays.length - 1]?.date ?? null,
      notes,
    };

    bus.emit('sync:complete', { summary });
    return { landmarks: result.newLandmarks, summary, appliedIds: result.appliedIds };
  }

  /** Sample data for offline/demo mode. */
  static sampleEvents(): { username: string } {
    return { username: 'sample' };
  }
}