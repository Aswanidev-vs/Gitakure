/**
 * Activity normalizer: flattens raw GitHub data into a deterministic list of
 * "world events" that the progression engine consumes. Each event has a stable
 * id so repeated syncs never duplicate.
 */

export interface WorldEvent {
  id: string;
  kind: 'contribution-day' | 'streak' | 'repository' | 'milestone' | 'star' | 'fork' | 'pr' | 'issue';
  date: string;
  weight: number;
  meta: Record<string, string | number>;
}

export function normalizeContributions(
  calendar: { totalContributions: number; weeks: { days: { date: string; count: number }[] }[] },
  repos: { name: string; stars: number; forks: number; createdAt: string }[],
): WorldEvent[] {
  const events: WorldEvent[] = [];

  // Per-day contribution events, collapsed into weekly growth pips.
  let activeDays = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  for (const week of calendar.weeks) {
    for (const day of week.days) {
      if (day.count > 0) {
        activeDays++;
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
        // One growth pip per active day, but capped to keep the world balanced.
        if (activeDays <= 200) {
          events.push({
            id: `contrib:${day.date}`,
            kind: 'contribution-day',
            date: day.date,
            weight: Math.min(4, day.count),
            meta: { count: day.count },
          });
        }
      } else {
        currentStreak = 0;
      }
    }
  }

  if (longestStreak >= 7) {
    events.push({
      id: `streak:${longestStreak}`,
      kind: 'streak',
      date: calendar.weeks[0]?.days[0]?.date ?? new Date().toISOString().slice(0, 10),
      weight: Math.min(5, Math.floor(longestStreak / 7)),
      meta: { days: longestStreak },
    });
  }

  // Repositories become project stones, capped to a sensible number.
  const sortedRepos = [...repos].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  sortedRepos.slice(0, 12).forEach((r, i) => {
    events.push({
      id: `repo:${r.name}`,
      kind: 'repository',
      date: r.createdAt.slice(0, 10),
      weight: 1,
      meta: { name: r.name, stars: r.stars, forks: r.forks, index: i },
    });
    if (r.stars >= 5) {
      events.push({
        id: `star:${r.name}`,
        kind: 'star',
        date: r.createdAt.slice(0, 10),
        weight: Math.min(3, Math.floor(r.stars / 5)),
        meta: { name: r.name, stars: r.stars },
      });
    }
    if (r.forks >= 2) {
      events.push({
        id: `fork:${r.name}`,
        kind: 'fork',
        date: r.createdAt.slice(0, 10),
        weight: Math.min(2, Math.floor(r.forks / 2)),
        meta: { name: r.name, forks: r.forks },
      });
    }
  });

  return events;
}