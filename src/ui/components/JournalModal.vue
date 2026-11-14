<template>
  <div v-if="isOpen" class="modal-backdrop interactive" @click.self="store.closeModal()">
    <div class="journal-card washi-panel">
      <!-- Header -->
      <div class="journal-header">
        <div class="journal-title-group">
          <span class="journal-icon">📖</span>
          <div>
            <h2 class="journal-title">Personal Archive & Valley Journal</h2>
            <span class="journal-subtitle">記憶の帳 · Discoveries, Letters & Reflections</span>
          </div>
        </div>
        <button class="close-btn" @click="store.closeModal()">✕</button>
      </div>

      <!-- Tabs -->
      <div class="journal-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="j-tab"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Content -->
      <div class="journal-body">
        <!-- 1. Journal Letters -->
        <div v-if="currentTab === 'chronicle'" class="tab-pane">
          <div v-if="store.journalEntries.length === 0" class="empty-notice">
            <span>No written entries yet. Wander the countryside or visit the tea porch.</span>
          </div>
          <div v-for="entry in store.journalEntries" :key="entry.id" class="journal-entry-card">
            <div class="entry-header">
              <h3 class="entry-title">{{ entry.title }}</h3>
              <span class="entry-meta">{{ entry.createdAt }} · {{ entry.season }}</span>
            </div>
            <p class="entry-text">{{ entry.text }}</p>
          </div>
        </div>

        <!-- 2. Discovered Keepsakes & Memories -->
        <div v-if="currentTab === 'discoveries'" class="tab-pane">
          <div v-if="store.discoveries.length === 0" class="empty-notice">
            <span>Discoveries reveal themselves as you explore benches, boats and the shrine grove.</span>
          </div>
          <div class="discovery-grid">
            <div v-for="disc in store.discoveries" :key="disc.id" class="disc-card">
              <div class="disc-icon">{{ disc.icon }}</div>
              <div class="disc-info">
                <h4 class="disc-title">{{ disc.title }}</h4>
                <div class="disc-sub">{{ disc.subtitle }}</div>
                <p class="disc-desc">{{ disc.description }}</p>
                <div v-if="disc.quote" class="disc-quote">“{{ disc.quote }}”</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Core Philosophy & Barakamon Spirit -->
        <div v-if="currentTab === 'philosophy'" class="tab-pane">
          <div class="philosophy-sheet">
            <h3 class="philo-heading">The Gitakure Principle</h3>
            <p class="philo-body">
              This world exists for the tired developer who needs an unhurried corner of the universe.
              There are no leaderboards, no energy bars, no daily streaks to maintain, and no crops that rot when you step away.
            </p>
            <div class="philo-duo">
              <div class="duo-item">
                <span class="duo-symbol">🍵</span>
                <strong>Japanese Countryside</strong>
                <p>Bamboo groves, silent wooden tea rooms, sakura blossoms, and shrines that honor quiet craftsmanship.</p>
              </div>
              <div class="duo-item">
                <span class="duo-symbol">🌴</span>
                <strong>Rural Kerala Backwaters</strong>
                <p>Monsoon rains over clay-tiled roofs, swaying coconut palms, country boats on canals, and evening campfires.</p>
              </div>
            </div>
            <blockquote class="philo-quote">
              “The player should be allowed to enjoy existing in the world.”
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useGitakureStore } from '@/state/pinia-store';

const store = useGitakureStore();
const isOpen = computed(() => store.activeModal === 'journal');
const currentTab = ref<'chronicle' | 'discoveries' | 'philosophy'>('chronicle');

const tabs: { id: 'chronicle' | 'discoveries' | 'philosophy'; label: string }[] = [
  { id: 'chronicle', label: 'Valley Letters & Reflections' },
  { id: 'discoveries', label: 'Discovered Keepsakes' },
  { id: 'philosophy', label: 'World Spirit' },
];

onMounted(() => {
  store.refreshJournal();
  store.refreshDiscoveries();
});
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

.journal-card {
  width: 90%;
  max-width: 720px;
  height: 520px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.journal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-washi);
  padding-bottom: 12px;
  margin-bottom: 14px;
}

.journal-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.journal-icon {
  font-size: 24px;
}

.journal-title {
  font-family: var(--font-serif);
  font-size: 20px;
  color: var(--text-dark);
}

.journal-subtitle {
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

.journal-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.j-tab {
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-dark-muted);
}

.j-tab.active {
  background: var(--text-dark);
  color: var(--bg-washi);
}

.journal-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty-notice {
  text-align: center;
  font-size: 13px;
  color: var(--text-dark-muted);
  padding: 40px 0;
}

.journal-entry-card {
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid var(--border-washi);
  border-radius: 6px;
  padding: 16px;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
  padding-bottom: 6px;
}

.entry-title {
  font-family: var(--font-serif);
  font-size: 16px;
  color: var(--text-dark);
}

.entry-meta {
  font-size: 11px;
  color: var(--text-dark-muted);
}

.entry-text {
  font-family: var(--font-serif);
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--text-dark);
}

.discovery-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.disc-card {
  display: flex;
  gap: 16px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid var(--border-washi);
  border-radius: 6px;
  padding: 14px;
}

.disc-icon {
  font-size: 28px;
}

.disc-info {
  flex: 1;
}

.disc-title {
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--text-dark);
  margin-bottom: 2px;
}

.disc-sub {
  font-size: 11px;
  color: var(--accent-bamboo);
  font-weight: 600;
  margin-bottom: 6px;
}

.disc-desc {
  font-size: 12.5px;
  color: var(--text-dark-muted);
  line-height: 1.5;
  margin-bottom: 6px;
}

.disc-quote {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 12px;
  color: var(--text-dark);
  background: rgba(0, 0, 0, 0.03);
  padding: 4px 8px;
  border-left: 2px solid var(--accent-gold);
}

.philosophy-sheet {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--border-washi);
  border-radius: 6px;
  padding: 20px;
}

.philo-heading {
  font-family: var(--font-serif);
  font-size: 18px;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.philo-body {
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--text-dark);
  margin-bottom: 18px;
}

.philo-duo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
}

.duo-item {
  background: #fff;
  border: 1px solid var(--border-washi);
  border-radius: 6px;
  padding: 12px;
  font-size: 12px;
  color: var(--text-dark-muted);
}

.duo-symbol {
  font-size: 20px;
  display: block;
  margin-bottom: 6px;
}

.duo-item strong {
  display: block;
  font-size: 13px;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.philo-quote {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 14px;
  color: var(--accent-vermilion);
  text-align: center;
  padding-top: 8px;
}
</style>
