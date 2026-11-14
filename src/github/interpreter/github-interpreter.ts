import { githubService, type GithubRepo, type Milestone, type NormalizedHistory } from '@/services/github/github-service';

// GitHub history interpreter (spec §16). Normalizes a user's history into a
// small set of meaningful milestones, prioritizes them, and converts selected
// ones into environmental keepsakes. No productivity ranking — GitHub
// provides memories; exploration gives the player time to discover them.

export interface InterpretResult {
  history: NormalizedHistory;
  /** The subset of milestones to place in the world now (gradual discovery). */
  discoveries: Milestone[];
}

export class GithubInterpreter {
  /** Fetch and normalize a user's public GitHub history. */
  async interpret(username: string, token?: string): Promise<InterpretResult> {
    const [user, repos] = await Promise.all([
      githubService.fetchUser(username, token),
      githubService.fetchRepos(username, token),
    ]);

    // Sample commits from a few representative repos to estimate activity
    // without overwhelming the API (rate-limit friendly).
    const sampleRepos = this.groupRepos(repos).slice(0, 5);
    let totalCommits = 0;
    const commitDates: string[] = [];
    for (const repo of sampleRepos) {
      try {
        const commits = await githubService.fetchCommits(username, repo.name, token);
        totalCommits += commits.length;
        for (const c of commits) {
          if (c.date) commitDates.push(c.date);
        }
      } catch {
        // Skip repos that error (empty, rate-limited, etc.).
      }
    }

    commitDates.sort();
    const firstCommitDate = commitDates[0] ?? null;
    const languages = this.collectLanguages(repos);
    const longestStreak = this.computeStreak(commitDates);
    const displayName = user.name ?? user.login;

    const history: NormalizedHistory = {
      username: user.login,
      displayName,
      repoCount: repos.length,
      totalCommits,
      firstCommitDate,
      longestStreak,
      languages,
      milestones: [],
    };

    const milestones = this.buildMilestones(history);
    history.milestones = milestones;

    // Gradual discovery: pick the top 3 by weight, never more.
    const discoveries = [...milestones].sort((a, b) => b.weight - a.weight).slice(0, 3);

    return { history, discoveries };
  }

  /** Group repositories by language into meaningful clusters (spec §16.3). */
  private groupRepos(repos: GithubRepo[]): GithubRepo[] {
    // Sort by activity (recent push) and size to surface the most meaningful.
    return [...repos].sort((a, b) => {
      const pa = new Date(a.pushed_at).getTime();
      const pb = new Date(b.pushed_at).getTime();
      return pb - pa;
    });
  }

  private collectLanguages(repos: GithubRepo[]): string[] {
    const set = new Set<string>();
    for (const r of repos) {
      if (r.language) set.add(r.language);
    }
    return [...set].slice(0, 8);
  }

  /** Longest run of consecutive days with commits (computed from sampled dates). */
  private computeStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    const days = new Set(dates.map((d) => d.slice(0, 10)));
    const sorted = [...days].sort();
    let longest = 1;
    let current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]!);
      const cur = new Date(sorted[i]!);
      const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) {
        current++;
        longest = Math.max(longest, current);
      } else if (diffDays > 1) {
        current = 1;
      }
    }
    return longest;
  }

  /** Convert normalized history into environmental memory milestones. */
  private buildMilestones(history: NormalizedHistory): Milestone[] {
    const milestones: Milestone[] = [];

    // 0 commits → quiet solitude keepsake.
    if (history.totalCommits === 0) {
      milestones.push({
        id: 'quiet-solitude',
        kind: 'quiet-solitude',
        label: 'Quiet Solitude',
        detail: 'A season of rest. The valley remembers your stillness.',
        weight: 10,
      });
      return milestones;
    }

    // First commit → the first seed (always the most meaningful).
    if (history.firstCommitDate) {
      milestones.push({
        id: 'first-seed',
        kind: 'first-seed',
        label: 'The First Seed',
        detail: `Planted on ${history.firstCommitDate.slice(0, 10)}. Every journey begins with a single commit.`,
        weight: 100,
      });
    }

    // Language milestone → a scroll for the most-used language.
    const primaryLang = history.languages[0];
    if (primaryLang) {
      milestones.push({
        id: `language-${primaryLang.toLowerCase()}`,
        kind: 'language-scroll',
        label: `${primaryLang} Scroll`,
        detail: `A keepsake for your work in ${primaryLang}.`,
        weight: 60 + history.languages.length,
      });
    }

    // Many repos → a river lantern.
    if (history.repoCount >= 5) {
      milestones.push({
        id: 'river-lantern',
        kind: 'river-lantern',
        label: 'River Lantern',
        detail: `${history.repoCount} repositories, each a lantern on the water.`,
        weight: 50,
      });
    }

    // Long streak → a constellation.
    if (history.longestStreak >= 5) {
      milestones.push({
        id: 'constellation',
        kind: 'constellation',
        label: `Constellation of ${history.longestStreak} Days`,
        detail: `A ${history.longestStreak}-day rhythm of steady work, written in the stars.`,
        weight: 40,
      });
    }

    return milestones;
  }
}

export type { Milestone };
export { githubService };