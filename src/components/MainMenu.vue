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
        <svg class="brand-symbol" viewBox="0 0 176 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- low sun -->
          <circle cx="126" cy="22" r="11" fill="#f0b85c"/>
          <!-- drifting cloud -->
          <path d="M146 30 Q150 22 158 25 Q163 18 170 24 Q176 24 175 31 Z" fill="#f7eee2" opacity="0.92"/>
          <!-- mountain range -->
          <path d="M6 52 L40 18 L64 40 L88 20 L116 52 Z" fill="#5d7f67" opacity="0.55"/>
          <path d="M40 18 L47 27 L56 24" stroke="#f7eee2" stroke-width="2" stroke-linecap="round"/>
          <path d="M6 52 L40 18 L64 40 L88 20 L116 52" stroke="#f7eee2" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- foreground hill -->
          <path d="M0 53 Q28 44 54 52 Q82 44 110 52 Q140 44 176 52" stroke="#f7eee2" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>
        </svg>

        <h1 class="game-title">Gitakure</h1>
        <p class="game-tagline">A life away, shaped by your journey</p>
      </div>

      <!-- Field-note menu index -->
      <nav class="menu-nav" aria-label="Main menu">
        <button
          v-if="hasSave"
          class="menu-pill active-pill"
          type="button"
          @click="emit('continue')"
        >
          <span class="menu-marker" aria-hidden="true"></span>
          <span class="pill-label">Continue</span>
        </button>

        <button
          :class="['menu-pill', { 'active-pill': !hasSave }]"
          type="button"
          @click="emit('newJourney')"
        >
          <span class="menu-marker" aria-hidden="true"></span>
          <span class="pill-label">New Journey</span>
        </button>

        <button class="menu-pill" type="button" @click="emit('settings')">
          <span class="menu-marker" aria-hidden="true"></span>
          <span class="pill-label">Settings</span>
        </button>

        <button class="menu-pill" type="button" @click="showGithub = true">
          <span class="menu-marker" aria-hidden="true"></span>
          <span class="pill-label">Winter Memories</span>
        </button>

        <button class="menu-pill" type="button" @click="showAbout = true">
          <span class="menu-marker" aria-hidden="true"></span>
          <span class="pill-label">About</span>
        </button>
      </nav>

      <!-- Version & Hints -->
      <div class="menu-footer">
        <span class="version-label">v1.4</span>
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

.main-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  pointer-events: none; /* Allows click-through to 3D canvas where needed */
  user-select: none;
  font-family: 'Zen Kaku Gothic New', system-ui, sans-serif;
  color: #faf3e4;
}

/* Left Sidebar framing — warm field-note scrim over the live sunset */
.menu-sidebar {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  max-width: 460px;
  height: 100%;
  padding: 40px 48px;
  background: linear-gradient(90deg, rgba(28, 22, 19, 0.82) 0%, rgba(38, 28, 22, 0.58) 55%, rgba(38, 28, 22, 0) 100%);
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
  font-family: Georgia, 'Shippori Mincho', serif;
  font-size: clamp(54px, 6vw, 72px);
  font-weight: 600;
  color: #fbf3e3;
  line-height: 1;
  margin: 4px 0 0;
  text-shadow: 0 3px 16px rgba(20, 12, 8, 0.55);
  letter-spacing: 0.5px;
}

.game-tagline {
  font-family: Georgia, 'Shippori Mincho', serif;
  font-size: 17px;
  font-style: italic;
  color: #f0dcc2;
  margin: 10px 0 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

/* Navigation Index */
.menu-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
  margin-bottom: auto;
  padding: 16px 0;
  max-width: 300px;
}

/* Field-note menu row */
.menu-pill {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #efe2ce;
  font-family: 'Zen Kaku Gothic New', system-ui, sans-serif;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
  text-align: left;
}

.menu-pill:hover {
  background: rgba(255, 246, 226, 0.1);
  transform: translateX(4px);
}

.menu-marker {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border: 1.5px solid rgba(239, 226, 206, 0.7);
  border-radius: 50%;
}

/* Amber brush-stroke selection */
.menu-pill.active-pill {
  background: rgba(214, 146, 62, 0.94);
  color: #2b1d12;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
}

.menu-pill.active-pill::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  width: 4px;
  height: 22px;
  border-radius: 2px;
  background: #f0b85c;
  transform: translateY(-50%);
}

.menu-pill.active-pill .menu-marker {
  border-color: #3a2717;
  background: #3a2717;
}

.menu-pill.active-pill:hover {
  background: rgba(227, 160, 74, 0.98);
  transform: translateX(4px);
}

.pill-label {
  flex-grow: 1;
}

/* Footer Version */
.menu-footer {
  margin-top: 20px;
}

.version-label {
  font-size: 12px;
  color: rgba(247, 238, 226, 0.6);
  font-weight: 500;
  letter-spacing: 0.4px;
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
  font-family: Georgia, 'Shippori Mincho', serif;
  font-size: 28px;
  font-weight: 600;
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
