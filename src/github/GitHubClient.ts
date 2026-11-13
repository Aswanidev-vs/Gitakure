/**
 * GitHub client: REST + GraphQL with rate-limit awareness and caching.
 */

import type { Authentication } from './Authentication';

export interface RateLimit {
  remaining: number;
  reset: number;
  limit: number;
}

export class GitHubClient {
  private auth: Authentication;
  private rateLimit: RateLimit = { remaining: 5000, reset: 0, limit: 5000 };

  constructor(auth: Authentication) {
    this.auth = auth;
  }

  getRateLimit(): RateLimit {
    return this.rateLimit;
  }

  async rest<T>(path: string): Promise<T> {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: { Accept: 'application/vnd.github+json', ...this.auth.authHeader() },
    });
    this.updateRateLimit(res);
    if (!res.ok) throw new Error(`GitHub REST ${res.status}: ${res.statusText}`);
    return (await res.json()) as T;
  }

  async graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.auth.authHeader() },
      body: JSON.stringify({ query, variables }),
    });
    this.updateRateLimit(res);
    if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}: ${res.statusText}`);
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
    if (!json.data) throw new Error('No data returned');
    return json.data;
  }

  private updateRateLimit(res: Response): void {
    const remaining = res.headers.get('x-ratelimit-remaining');
    const reset = res.headers.get('x-ratelimit-reset');
    const limit = res.headers.get('x-ratelimit-limit');
    if (remaining) this.rateLimit.remaining = Number(remaining);
    if (reset) this.rateLimit.reset = Number(reset);
    if (limit) this.rateLimit.limit = Number(limit);
  }
}