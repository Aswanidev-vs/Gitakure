import { defineStore } from 'pinia';
import { githubService } from '@/services/github/github-service';
import { GithubInterpreter } from '@/github/interpreter/github-interpreter';
import { memoriesRepo, githubMetaRepo } from '@/database/repositories';
import type { Milestone, NormalizedHistory } from '@/services/github/github-service';
import type { MemoryRecord } from '@/database/db';

// Bridges the GitHub interpreter, Dexie persistence, and the Vue UI.
// The game engine reads pending discoveries from this store and spawns
// keepsakes as the player explores.

const interpreter = new GithubInterpreter();

interface GithubState {
  username: string | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  history: NormalizedHistory | null;
  pendingDiscoveries: Milestone[];
  discovered: string[];
}

export const useGithubStore = defineStore('github', {
  state: (): GithubState => ({
    username: null,
    connected: false,
    loading: false,
    error: null,
    history: null,
    pendingDiscoveries: [],
    discovered: [],
  }),
  getters: {
    pendingCount: (s) => s.pendingDiscoveries.length,
    discoveredCount: (s) => s.discovered.length,
  },
  actions: {
    async connect(username: string, token?: string): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        const result = await interpreter.interpret(username, token);
        this.username = username;
        this.connected = true;
        this.history = result.history;
        this.pendingDiscoveries = result.discoveries;

        // Persist metadata + memory records (discovered=false initially).
        await githubMetaRepo.upsert({
          username,
          lastSyncAt: Date.now(),
          lastProcessedCommitCount: result.history.totalCommits,
          repoCount: result.history.repoCount,
          highestStreak: result.history.longestStreak,
        });
        for (const m of result.discoveries) {
          const id = `${username}:${m.id}`;
          if (!(await memoriesRepo.has(id))) {
            const rec: MemoryRecord = {
              id,
              username,
              milestoneId: m.id,
              kind: m.kind,
              label: m.label,
              position: [0, 0, 0], // filled in by the engine when spawned
              discovered: false,
              createdAt: Date.now(),
            };
            await memoriesRepo.put(rec);
          }
        }
        this.discovered = (await memoriesRepo.list(username)).filter((r) => r.discovered).map((r) => r.milestoneId);
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to connect.';
        this.connected = false;
      } finally {
        this.loading = false;
      }
    },

    async markDiscovered(milestoneId: string): Promise<void> {
      if (!this.username) return;
      const id = `${this.username}:${milestoneId}`;
      await memoriesRepo.markDiscovered(id);
      if (!this.discovered.includes(milestoneId)) {
        this.discovered.push(milestoneId);
      }
      this.pendingDiscoveries = this.pendingDiscoveries.filter((m) => m.id !== milestoneId);
    },

    async disconnect(): Promise<void> {
      this.username = null;
      this.connected = false;
      this.history = null;
      this.pendingDiscoveries = [];
      this.discovered = [];
      this.error = null;
    },
  },
});

export { githubService };