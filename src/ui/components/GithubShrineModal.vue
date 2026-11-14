<template>
  <div v-if="isOpen" class="modal-backdrop interactive" @click.self="store.closeModal()">
    <div class="shrine-card washi-panel">
      <!-- Header -->
      <div class="shrine-header">
        <div class="shrine-title-group">
          <span class="torii-symbol">⛩️</span>
          <div>
            <h2 class="shrine-title">The Sanctuary of Memories</h2>
            <span class="shrine-subtitle">記憶の祠 · A Gentle Reflection on Your Journey</span>
          </div>
        </div>
        <button class="close-btn" @click="store.closeModal()">✕</button>
      </div>

      <!-- Philosophy Notice -->
      <div class="philosophy-box">
        <p class="philosophy-text">
          <strong>The Gitakure Vow:</strong> Connecting your GitHub journey is completely optional and pressure-free.
          Your history will quietly become subtle keepsakes and journal chapters scattered across the countryside.
          There are no rankings, no commit streaks, and no expectations.
        </p>
      </div>

      <!-- Username Input Section -->
      <div class="input-section">
        <label class="input-label" for="gh-user">Connect your GitHub journey (Public Read-Only):</label>
        <div class="input-row">
          <input
            id="gh-user"
            v-model="inputUsername"
            type="text"
            placeholder="e.g. your GitHub username"
            class="gh-input"
            @keydown.enter="submitUsername"
          />
          <button class="bless-btn" :disabled="loading" @click="submitUsername">
            {{ loading ? 'Listening...' : 'Weave Memories' }}
          </button>
        </div>

        <!-- Simulation Presets (100% Offline Friendly) -->
        <div class="preset-row">
          <span class="preset-label">Or weave a peaceful offline journey:</span>
          <button class="preset-pill" @click="applyPreset('wanderer')">🍃 Quiet Solitude (No Commits)</button>
          <button class="preset-pill" @click="applyPreset('first_spark')">🌱 The First Spark (Beginner Year)</button>
          <button class="preset-pill" @click="applyPreset('deep_roots')">🌳 Deep Roots (Years of Craft)</button>
        </div>
      </div>

      <!-- History Summary Preview -->
      <div v-if="historyPreview" class="history-preview-card">
        <div class="preview-badge">WEAVED INTO THE VALLEY</div>
        <h3 class="preview-title">{{ historyPreview.username }}’s Journey</h3>
        <p class="preview-stats">
          {{ historyPreview.yearsOfJourney }} Seasons of Craft · {{ historyPreview.totalRepos }} Projects
          <span v-if="historyPreview.favoriteLanguages.length > 0">
            · Languages: {{ historyPreview.favoriteLanguages.join(', ') }}
          </span>
        </p>

        <div class="discoveries-preview">
          <div v-for="disc in historyPreview.generatedDiscoveries" :key="disc.id" class="disc-pill">
            <span class="dp-icon">{{ disc.icon }}</span>
            <span class="dp-title">{{ disc.title }}</span>
          </div>
        </div>

        <p class="preview-note">
          These memories and letters have been recorded in your <strong>Field Journal (J)</strong>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGitakureStore } from '@/state/pinia-store';
import {
  GitHubHistoryInterpreter,
  type InterpretedDevelopmentHistory,
} from '@/github/interpreter/github-interpreter';

const store = useGitakureStore();
const isOpen = computed(() => store.activeModal === 'shrine');

const inputUsername = ref(store.connectedGithubUser || '');
const loading = ref(false);
const historyPreview = ref<InterpretedDevelopmentHistory | null>(null);

async function submitUsername() {
  const username = inputUsername.value.trim();
  if (!username) return;

  loading.value = true;
  const history = await GitHubHistoryInterpreter.fetchAndInterpret(username);
  await GitHubHistoryInterpreter.applyToLocalWorld(history);

  store.connectedGithubUser = username;
  historyPreview.value = history;
  await store.refreshDiscoveries();
  await store.refreshJournal();

  store.showToast(`Memories of ${username} have been weaved into the valley.`, '🌱');
  loading.value = false;
}

async function applyPreset(type: 'wanderer' | 'first_spark' | 'deep_roots') {
  loading.value = true;
  let name = 'Valley Wanderer';
  if (type === 'first_spark') name = 'Curious Apprentice';
  if (type === 'deep_roots') name = 'Weathered Craftsman';

  const history = GitHubHistoryInterpreter.generateDefaultTranquilHistory(name);
  if (type === 'deep_roots') {
    history.yearsOfJourney = 6;
    history.favoriteLanguages = ['TypeScript', 'Rust', 'Silence'];
  }

  await GitHubHistoryInterpreter.applyToLocalWorld(history);
  historyPreview.value = history;
  await store.refreshDiscoveries();
  await store.refreshJournal();

  store.showToast(`Tranquil memories of ${name} recorded.`, '🍃');
  loading.value = false;
}
</script>

<style scoped>
.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(14, 20, 17, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  z-index: 100;
}

.shrine-card {
  width: 90%;
  max-width: 650px;
  max-height: 85vh;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.shrine-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-washi);
  padding-bottom: 12px;
  margin-bottom: 14px;
}

.shrine-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.torii-symbol {
  font-size: 24px;
}

.shrine-title {
  font-family: var(--font-serif);
  font-size: 19px;
  color: var(--text-dark);
}

.shrine-subtitle {
  font-size: 11.5px;
  color: var(--text-dark-muted);
}

.close-btn {
  font-size: 16px;
  color: var(--text-dark-muted);
}

.close-btn:hover {
  color: var(--accent-vermilion);
}

.philosophy-box {
  background: rgba(211, 78, 54, 0.08);
  border-left: 3px solid var(--accent-vermilion);
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.philosophy-text {
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-dark);
}

.input-section {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 12px;
  color: var(--text-dark-muted);
  margin-bottom: 6px;
}

.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.gh-input {
  flex: 1;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid var(--border-washi);
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-dark);
  outline: none;
}

.gh-input:focus {
  border-color: var(--accent-vermilion);
}

.bless-btn {
  padding: 8px 16px;
  background: var(--accent-vermilion);
  color: #fff;
  font-size: 12.5px;
  border-radius: 4px;
}

.bless-btn:hover {
  background: #bf3f28;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.preset-label {
  font-size: 11px;
  color: var(--text-dark-muted);
}

.preset-pill {
  font-size: 11px;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-washi);
  border-radius: 12px;
  color: var(--text-dark);
}

.preset-pill:hover {
  background: #fff;
  border-color: var(--accent-gold);
}

.history-preview-card {
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid var(--border-washi);
  border-radius: 6px;
  padding: 14px;
  margin-top: 10px;
}

.preview-badge {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--accent-bamboo);
  letter-spacing: 1px;
}

.preview-title {
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--text-dark);
  margin: 3px 0;
}

.preview-stats {
  font-size: 12px;
  color: var(--text-dark-muted);
  margin-bottom: 10px;
}

.discoveries-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.disc-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid var(--border-washi);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11.5px;
  color: var(--text-dark);
}

.preview-note {
  font-size: 11.5px;
  color: var(--text-dark-muted);
}
</style>
