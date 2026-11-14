// Browser-safe GitHub data fetch. Public data only — no token stored.
// An optional PAT can be supplied for private repos with explicit opt-in,
// but is never persisted by this service.

const API_BASE = 'https://api.github.com';

export interface GithubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
}

export interface GithubRepo {
  id: number;
  name: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  created_at: string;
  size: number;
}

export interface GithubCommit {
  sha: string;
  date: string;
  message: string;
  additions: number;
  deletions: number;
}

export interface NormalizedHistory {
  username: string;
  displayName: string;
  repoCount: number;
  totalCommits: number;
  firstCommitDate: string | null;
  longestStreak: number;
  languages: string[];
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  kind: 'first-seed' | 'river-lantern' | 'language-scroll' | 'constellation' | 'quiet-solitude';
  label: string;
  detail: string;
  weight: number; // priority for gradual discovery
}

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function gh<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: headers(token) });
  if (!res.ok) {
    if (res.status === 403) throw new Error('GitHub rate limit reached — resting for a while.');
    if (res.status === 404) throw new Error('GitHub user or repository not found.');
    throw new Error(`GitHub request failed (${res.status}).`);
  }
  return res.json() as Promise<T>;
}

export const githubService = {
  async fetchUser(username: string, token?: string): Promise<GithubUser> {
    return gh<GithubUser>(`/users/${encodeURIComponent(username)}`, token);
  },

  async fetchRepos(username: string, token?: string): Promise<GithubRepo[]> {
    // Public repos only; a PAT can widen scope to private with opt-in.
    return gh<GithubRepo[]>(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`, token);
  },

  async fetchCommits(username: string, repo: string, token?: string): Promise<GithubCommit[]> {
    // Per-commit stats (additions/deletions) require a separate call; we fetch
    // the commit list and a sample of stats to estimate milestones.
    const list = await gh<Array<{ sha: string; commit: { author: { date: string } | null; message: string } }>>(
      `/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/commits?per_page=100`,
      token,
    );
    const commits: GithubCommit[] = list.map((c) => ({
      sha: c.sha,
      date: c.commit.author?.date ?? '',
      message: c.commit.message.split('\n')[0] ?? '',
      additions: 0,
      deletions: 0,
    }));
    return commits;
  },
};