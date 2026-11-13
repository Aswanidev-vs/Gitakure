/**
 * GitHub authentication. PAT is kept in memory only during the session; never
 * persisted to localStorage and never logged. Production should use a backend
 * OAuth flow; this module supports both.
 */

export interface AuthState {
  mode: 'none' | 'pat' | 'oauth';
  token: string | null;
  username: string | null;
}

export class Authentication {
  private state: AuthState = { mode: 'none', token: null, username: null };

  getState(): AuthState {
    return this.state;
  }

  setPat(token: string, username: string): void {
    this.state = { mode: 'pat', token, username };
  }

  clear(): void {
    this.state = { mode: 'none', token: null, username: null };
  }

  authHeader(): Record<string, string> {
    if (!this.state.token) return {};
    return { Authorization: `Bearer ${this.state.token}` };
  }
}