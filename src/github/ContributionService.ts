/**
 * Contribution service: pulls the contribution calendar and repository list.
 */

import type { GitHubClient } from './GitHubClient';

export interface DayContribution {
  date: string;
  count: number;
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: { days: DayContribution[] }[];
}

export interface RepoSummary {
  name: string;
  stars: number;
  forks: number;
  createdAt: string;
  pushedAt: string;
  isPrivate: boolean;
}

export class ContributionService {
  private client: GitHubClient;

  constructor(client: GitHubClient) {
    this.client = client;
  }

  async fetchCalendar(username: string, from: string, to: string): Promise<ContributionCalendar> {
    const query = `
      query($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks { contributionDays { date contributionCount } }
            }
          }
        }
      }
    `;
    const data = await this.client.graphql<{
      user: { contributionsCollection: { contributionCalendar: { totalContributions: number; weeks: { contributionDays: { date: string; contributionCount: number }[] }[] } } };
    }>(query, { login: username, from, to });
    const cal = data.user.contributionsCollection.contributionCalendar;
    return {
      totalContributions: cal.totalContributions,
      weeks: cal.weeks.map((w) => ({
        days: w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
      })),
    };
  }

  async fetchRepos(username: string): Promise<RepoSummary[]> {
    const list = await this.client.rest<
      { name: string; stargazers_count: number; forks_count: number; created_at: string; pushed_at: string; private: boolean }[]
    >(`/users/${username}/repos?per_page=100&sort=updated`);
    return list.map((r) => ({
      name: r.name,
      stars: r.stargazers_count,
      forks: r.forks_count,
      createdAt: r.created_at,
      pushedAt: r.pushed_at,
      isPrivate: r.private,
    }));
  }
}