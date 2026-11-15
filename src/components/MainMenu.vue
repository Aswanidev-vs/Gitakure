<script setup lang="ts">
import { ref } from 'vue';
import GithubModal from './GithubModal.vue';

defineProps<{ hasSave: boolean }>();
const emit = defineEmits<{ continue: []; newJourney: []; settings: []; github: [] }>();

const showGithub = ref(false);
const showAbout = ref(false);
</script>

<template>
  <div class="main-menu-overlay">
    <!-- Left Navigation & Title Panel -->
    <div class="menu-sidebar">
      <!-- Brand Header -->
      <div class="brand-block">
        <svg class="brand-symbol" viewBox="0 0 160 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Mountain outline -->
          <path d="M12 48 L46 16 L76 44 L98 28 L124 50" stroke="#f6eee3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M46 16 L54 26 L64 24" stroke="#f6eee3" stroke-width="2.2" stroke-linecap="round"/>
          <!-- Stylized bonsai tree on hill -->
          <path d="M110 48 Q125 36 142 48" stroke="#f6eee3" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M126 44 V34" stroke="#f6eee3" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M126 34 Q116 26 122 22 Q130 18 136 24 Q144 20 148 26 Q146 32 136 34 Z" fill="#f6eee3"/>
        </svg>

        <h1 class="game-title">Gitakure</h1>
        <p class="game-tagline">A little world, shaped by your journey.</p>
      </div>

      <!-- Navigation Pills -->
      <nav class="menu-nav" aria-label="Main menu">
        <button
          v-if="hasSave"
          class="menu-pill active-pill"
          type="button"
          @click="emit('continue')"
        >
          <span class="pill-icon play-icon">▶</span>
          <span class="pill-label">Continue</span>
        </button>

        <button
          :class="['menu-pill', { 'active-pill': !hasSave }]"
          type="button"
          @click="emit('newJourney')"
        >
          <svg class="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
          <span class="pill-label">New Journey</span>
        </button>

        <button class="menu-pill" type="button" @click="emit('settings')">
          <svg class="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span class="pill-label">Settings</span>
        </button>

        <button class="menu-pill" type="button" @click="showGithub = true">
          <svg class="pill-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span class="pill-label">GitHub Memories</span>
        </button>

        <button class="menu-pill" type="button" @click="showAbout = true">
          <svg class="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <span class="pill-label">About</span>
        </button>
      </nav>

      <!-- Version & Hints -->
      <div class="menu-footer">
        <span class="version-label">v0.1.0</span>
      </div>
    </div>

    <!-- Modals -->
    <GithubModal :open="showGithub" @close="showGithub = false" @connected="emit('github')" />

    <div v-if="showAbout" class="modal-backdrop" @click.self="showAbout = false">
      <div class="parchment-modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <h2 id="about-title" class="modal-title">About Gitakure</h2>
        <p class="modal-body">
          A peaceful countryside world blending Japanese and Kerala aesthetics. Step away from busy digital life: wander the village, sit on the bench, watch the river ripple in the sunset, or spend quiet time with your companion cat.
        </p>
        <p class="modal-body">
          Built programmatically with Three.js, Vue 3, Pinia and Dexie. No heavy external engines needed. Nature models by Quaternius (CC0).
        </p>
        <div class="modal-actions">
          <button class="close-btn" type="button" @click="showAbout = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.main-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  pointer-events: none; /* Allows click-through to 3D canvas where needed */
  user-select: none;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  color: #f7eee2;
}

/* Left Sidebar framing */
.menu-sidebar {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  max-width: 440px;
  height: 100%;
  padding: 42px 48px;
  background: linear-gradient(90deg, rgba(16, 24, 22, 0.72) 0%, rgba(16, 24, 22, 0.45) 60%, rgba(16, 24, 22, 0) 100%);
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Brand Section */
.brand-block {
  margin-bottom: 24px;
}

.brand-symbol {
  width: 140px;
  height: 52px;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
  margin-bottom: 4px;
}

.game-title {
  font-family: 'Caveat', cursive, sans-serif;
  font-size: clamp(52px, 6vw, 68px);
  font-weight: 700;
  color: #ffffff;
  line-height: 0.95;
  margin: 0;
  text-shadow: 0 3px 18px rgba(0, 0, 0, 0.5);
  letter-spacing: -0.5px;
}

.game-tagline {
  font-family: 'Caveat', cursive, sans-serif;
  font-size: 21px;
  color: #f4ebde;
  margin: 6px 0 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
}

/* Navigation List */
.menu-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  margin-bottom: auto;
  padding: 18px 0;
  max-width: 290px;
}

/* Individual Pill Button */
.menu-pill {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 11px 20px;
  border-radius: 9999px;
  border: 1px solid rgba(247, 238, 226, 0.24);
  background: rgba(22, 33, 29, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #f7eee2;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 15.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  text-align: left;
}

.menu-pill:hover {
  background: rgba(38, 54, 48, 0.7);
  border-color: rgba(247, 238, 226, 0.5);
  transform: translateX(4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}

/* Active Highlight Pill (e.g. Continue in Image 1) */
.menu-pill.active-pill {
  background: #f7eee2;
  border-color: #f7eee2;
  color: #1e2824;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.38), 0 2px 8px rgba(247, 238, 226, 0.4);
}

.menu-pill.active-pill:hover {
  background: #ffffff;
  transform: translateX(4px) scale(1.02);
}

.pill-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.play-icon {
  font-size: 14px;
  line-height: 1;
}

.pill-label {
  flex-grow: 1;
}

/* Footer Version */
.menu-footer {
  margin-top: 20px;
}

.version-label {
  font-size: 13px;
  color: rgba(247, 238, 226, 0.65);
  font-weight: 500;
}

/* About Modal (Parchment Paper Aesthetic) */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 16, 14, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  pointer-events: auto;
}

.parchment-modal {
  width: min(480px, 90vw);
  background: #f4ece1;
  color: #27201a;
  border: 2px solid #dfcfb8;
  border-radius: 18px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.modal-title {
  font-family: 'Caveat', cursive, sans-serif;
  font-size: 34px;
  font-weight: 700;
  margin: 0 0 14px;
  color: #1c1612;
}

.modal-body {
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 14px;
  color: #382e26;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.close-btn {
  padding: 10px 22px;
  background: #3a4e44;
  color: #f7eee2;
  border: none;
  border-radius: 9999px;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #283730;
}
</style>
