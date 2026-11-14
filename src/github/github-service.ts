import type { GitHubValleyBlessing } from '@/types';

export class GitHubService {
  /**
   * Fetch user public info and translate into a stress-free valley blessing.
   * If network fails or user has 0 commits, gracefully offers the "Restful Valley" blessing.
   */
  public static async fetchUserBlessing(username: string): Promise<GitHubValleyBlessing> {
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      return this.getDefaultBlessing('Valley Wanderer');
    }

    try {
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`);
      if (!userRes.ok) {
        return this.getDefaultBlessing(cleanUsername);
      }
      const userData = await userRes.json();

      // Fetch public events to gauge recent activity softly
      let recentEventsCount = 0;
      try {
        const eventsRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}/events?per_page=30`);
        if (eventsRes.ok) {
          const events = await eventsRes.json();
          if (Array.isArray(events)) {
            recentEventsCount = events.filter((e: { type: string }) =>
              e.type === 'PushEvent' || e.type === 'CreateEvent' || e.type === 'PullRequestEvent'
            ).length;
          }
        }
      } catch {
        // Soft fallback
      }

      const publicRepos = userData.public_repos || 0;
      return this.computeBlessing(cleanUsername, recentEventsCount, publicRepos);
    } catch {
      return this.getDefaultBlessing(cleanUsername);
    }
  }

  public static computeBlessing(username: string, recentEvents: number, repos: number): GitHubValleyBlessing {
    if (recentEvents === 0) {
      return {
        username,
        contributions: 0,
        streak: 0,
        blessingType: 'peaceful_rest',
        title: 'The Blessing of Quiet Solitude (静寂の恵み)',
        description: 'The valley welcomes your rest. No crops will dry up, and the gentle mountain dew keeps the soil soft.',
        quote: 'Rest is not time lost; it is the quiet winter where soil gathers strength.',
      };
    }

    if (recentEvents < 6) {
      return {
        username,
        contributions: recentEvents,
        streak: Math.min(repos, 5),
        blessingType: 'starlight_dew',
        title: 'The Blessing of Gentle Stream (清流の恵み)',
        description: 'A tranquil pace. Sweet spring water flows through the irrigation ditches, providing +1 Starlight Seed.',
        quote: 'Like water carving stone, the calmest rhythm travels the furthest.',
      };
    }

    if (recentEvents < 15) {
      return {
        username,
        contributions: recentEvents,
        streak: Math.min(repos, 12),
        blessingType: 'calm_rain',
        title: 'The Blessing of Sakura Rain (桜雨の恵み)',
        description: 'Warm spring mist enriches the crops. All planted crops gain an instant stage of gentle growth.',
        quote: 'The blossoms open not in haste, but in harmony with the gentle rain.',
      };
    }

    return {
      username,
      contributions: recentEvents,
      streak: repos,
      blessingType: 'bamboo_growth',
      title: 'The Blessing of Golden Harvest (豊穣の恵み)',
      description: 'The village shrine glows with warm lantern light. Rare Camellia blossoms appear across the forest trails.',
      quote: 'When purpose is clear, every leaf and branch shares in the prosperity.',
    };
  }

  public static getDefaultBlessing(username = 'Valley Wanderer'): GitHubValleyBlessing {
    return {
      username,
      contributions: 3,
      streak: 1,
      blessingType: 'peaceful_rest',
      title: 'The Blessing of Peaceful Rest (安息の恵み)',
      description: 'The valley exists for your peace. Explore the village, water the tea plants, or watch the cranes by the river.',
      quote: 'Here in Gitakure, there are no deadlines — only the sunrise, the river, and the season.',
    };
  }
}
