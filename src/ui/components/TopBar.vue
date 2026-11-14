<template>
  <header class="topbar-container interactive">
    <!-- Brand & Local Atmosphere -->
    <div class="topbar-section left">
      <div class="valley-brand">
        <span class="torii-icon">⛩️</span>
        <div class="brand-text">
          <h1 class="brand-title">Gitakure</h1>
          <span class="brand-subtitle">谷と運河の里 · Japanese-Kerala Countryside</span>
        </div>
      </div>

      <div class="atmosphere-badge">
        <span class="season-badge">{{ seasonLabel }}</span>
        <span class="divider">·</span>
        <span class="clock-display">{{ store.realWorldTime.formatted }}</span>
        <span class="time-of-day">{{ timeOfDayLabel }}</span>
      </div>
    </div>

    <!-- Actions & Peaceful Controls -->
    <div class="topbar-section right">
      <!-- Sit / Stand Toggle Button -->
      <button
        class="nav-btn sit-btn"
        :class="{ active: store.isSitting }"
        :title="store.isSitting ? 'Stand up (WASD / C)' : 'Sit and rest peacefully (C)'"
        @click="store.toggleSit()"
      >
        <span class="btn-icon">🪑</span>
        <span class="btn-text">{{ store.isSitting ? 'Resting (Stand: C)' : 'Sit Down (C)' }}</span>
      </button>

      <!-- Campfire Button -->
      <button
        class="nav-btn campfire-btn"
        :class="{ active: store.campfireLit }"
        title="Toggle riverside campfire"
        @click="store.toggleCampfire()"
      >
        <span class="btn-icon">{{ store.campfireLit ? '🔥' : '🪵' }}</span>
        <span class="btn-text">Campfire</span>
      </button>

      <!-- Journal -->
      <button
        class="nav-btn journal-btn"
        :class="{ active: store.activeModal === 'journal' }"
        title="Open Personal Archive & Field Journal (J)"
        @click="store.toggleModal('journal')"
      >
        <span class="btn-icon">📖</span>
        <span class="btn-text">Journal</span>
      </button>

      <!-- GitHub Shrine -->
      <button
        class="nav-btn shrine-btn"
        :class="{ active: store.activeModal === 'shrine' }"
        title="Visit Sanctuary of Memories"
        @click="store.toggleModal('shrine')"
      >
        <span class="btn-icon">⛩️</span>
        <span class="btn-text">Shrine</span>
      </button>

      <!-- Settings -->
      <button
        class="nav-btn settings-btn"
        :class="{ active: store.activeModal === 'settings' }"
        title="Soundscape & Atmosphere Settings"
        @click="store.toggleModal('settings')"
      >
        <span class="btn-icon">⚙️</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGitakureStore } from '@/state/pinia-store';

const store = useGitakureStore();

const seasonLabel = computed(() => {
  const map: Record<string, string> = {
    spring: 'Spring · 桜の春',
    monsoon: 'Monsoon · ഇടവപ്പാതി (Rain Season)',
    autumn: 'Autumn · 秋日',
    winter: 'Cool Season · 冬静',
  };
  return map[store.activeSeason] || 'Spring';
});

const timeOfDayLabel = computed(() => {
  const map: Record<string, string> = {
    dawn: 'Dawn (朝焼け)',
    morning: 'Morning (പ്രഭാതം)',
    noon: 'Noon (സൂര്യോദയം)',
    dusk: 'Dusk (സന്ധ്യ / 黄昏)',
    night: 'Night (രാത്രി / 夜静)',
  };
  return map[store.timeOfDay] || 'Day';
});
</script>

<style scoped>
.topbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 18px;
  background: linear-gradient(180deg, rgba(14, 20, 17, 0.94) 0%, rgba(14, 20, 17, 0.6) 80%, transparent 100%);
  width: 100%;
}

.topbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.valley-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.torii-icon {
  font-size: 20px;
}

.brand-title {
  font-family: var(--font-serif);
  font-size: 19px;
  font-weight: 600;
  color: var(--text-main);
  letter-spacing: 1.5px;
  line-height: 1.1;
}

.brand-subtitle {
  font-size: 10.5px;
  color: var(--text-muted);
  letter-spacing: 0.4px;
}

.atmosphere-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-secondary);
}

.divider {
  color: var(--text-muted);
}

.clock-display {
  font-family: var(--font-mono);
  color: var(--accent-gold);
}

.time-of-day {
  color: var(--text-main);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 12.5px;
  color: var(--text-main);
}

.nav-btn:hover {
  background: var(--bg-surface-elevated);
  border-color: var(--border-prominent);
}

.nav-btn.active {
  background: var(--accent-vermilion);
  border-color: var(--accent-vermilion);
  color: #fff;
}

.sit-btn.active {
  background: rgba(91, 138, 85, 0.35);
  border-color: var(--accent-bamboo);
  color: var(--text-main);
}
</style>
