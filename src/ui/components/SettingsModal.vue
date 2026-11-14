<template>
  <div v-if="isOpen" class="modal-backdrop interactive" @click.self="store.closeModal()">
    <div class="settings-card washi-panel">
      <!-- Header -->
      <div class="settings-header">
        <div class="settings-title-group">
          <span class="settings-icon">⚙️</span>
          <div>
            <h2 class="settings-title">Valley Atmosphere & Settings</h2>
            <span class="settings-subtitle">環境設定 · Soundscapes, Time & Privacy</span>
          </div>
        </div>
        <button class="close-btn" @click="store.closeModal()">✕</button>
      </div>

      <!-- Settings Content -->
      <div class="settings-body">
        <!-- Audio Channels -->
        <section class="settings-section">
          <h3 class="section-title">Soundscape Channels</h3>
          
          <div class="slider-row">
            <label class="slider-label">Master Volume</label>
            <input
              v-model.number="localSettings.musicVolume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              class="slider"
              @input="onVolumeChange"
            />
            <span class="val-num">{{ Math.round(localSettings.musicVolume * 100) }}%</span>
          </div>

          <div class="slider-row">
            <label class="slider-label">Rain, Stream & Ambience</label>
            <input
              v-model.number="localSettings.ambientVolume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              class="slider"
              @input="onVolumeChange"
            />
            <span class="val-num">{{ Math.round(localSettings.ambientVolume * 100) }}%</span>
          </div>

          <div class="slider-row">
            <label class="slider-label">Footsteps & Interactions</label>
            <input
              v-model.number="localSettings.sfxVolume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              class="slider"
              @input="onVolumeChange"
            />
            <span class="val-num">{{ Math.round(localSettings.sfxVolume * 100) }}%</span>
          </div>
        </section>

        <!-- Environment & Clocks -->
        <section class="settings-section">
          <h3 class="section-title">World Immersion</h3>

          <div class="toggle-row">
            <div>
              <div class="toggle-title">Synchronize with Local Clock</div>
              <div class="toggle-desc">Sunlight, dusk transitions and seasons gently track your real-world timezone.</div>
            </div>
            <input
              v-model="localSettings.realWorldTimeSync"
              type="checkbox"
              class="checkbox"
              @change="saveSettingsChange"
            />
          </div>

          <div class="toggle-row">
            <div>
              <div class="toggle-title">Reduced Particle Motion</div>
              <div class="toggle-desc">Softens falling sakura petals and wind drifts for comfort.</div>
            </div>
            <input
              v-model="localSettings.reducedMotion"
              type="checkbox"
              class="checkbox"
              @change="saveSettingsChange"
            />
          </div>

          <div class="slider-row" style="margin-top: 14px;">
            <label class="slider-label">Camera Perspective Zoom</label>
            <input
              v-model.number="localSettings.zoomLevel"
              type="range"
              min="1.0"
              max="1.8"
              step="0.05"
              class="slider"
              @input="onZoomChange"
            />
            <span class="val-num">{{ localSettings.zoomLevel.toFixed(2) }}x</span>
          </div>
        </section>

        <!-- Privacy & Local Data -->
        <section class="settings-section">
          <h3 class="section-title">Privacy & Local Storage (IndexedDB)</h3>
          <p class="privacy-note">
            Gitakure stores everything strictly in your browser’s IndexedDB. No backend servers, no analytics, no cookies.
          </p>

          <button class="clear-data-btn" @click="handleClearData">
            🗑️ Clear Saved Discoveries & Journal
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useGitakureStore } from '@/state/pinia-store';
import { soundscapes } from '@/game/audio/soundscapes';
import { clearLocalData } from '@/storage/db';
import { gameBridge } from '@/bridge/game-bridge';

const store = useGitakureStore();
const isOpen = computed(() => store.activeModal === 'settings');

const localSettings = ref({ ...store.settings });

watch(
  () => store.settings,
  (s) => {
    localSettings.value = { ...s };
  },
  { deep: true }
);

function onVolumeChange() {
  soundscapes.setVolumes({
    master: localSettings.value.musicVolume,
    ambient: localSettings.value.ambientVolume,
    music: localSettings.value.musicVolume,
    sfx: localSettings.value.sfxVolume,
  });
  store.updateSettings(localSettings.value);
}

function saveSettingsChange() {
  store.updateSettings(localSettings.value);
  gameBridge.emit('reduced_motion', { enabled: localSettings.value.reducedMotion });
}

function onZoomChange() {
  store.updateSettings(localSettings.value);
  gameBridge.emit('camera_zoom', { zoom: localSettings.value.zoomLevel });
}

async function handleClearData() {
  if (confirm('Clear all local Gitakure journal entries and stored memories?')) {
    await clearLocalData();
    await store.refreshDiscoveries();
    await store.refreshJournal();
    store.showToast('Local memory cleared in peace.', '🍃');
    store.closeModal();
  }
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

.settings-card {
  width: 90%;
  max-width: 620px;
  max-height: 85vh;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-washi);
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.settings-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-icon {
  font-size: 22px;
}

.settings-title {
  font-family: var(--font-serif);
  font-size: 19px;
  color: var(--text-dark);
}

.settings-subtitle {
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

.settings-body {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.settings-section {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid var(--border-washi);
  border-radius: 6px;
  padding: 14px 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 12px;
}

.slider-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.slider-label {
  font-size: 12.5px;
  color: var(--text-dark);
  flex: 1.2;
}

.slider {
  flex: 2;
  accent-color: var(--accent-bamboo);
}

.val-num {
  font-family: var(--font-mono);
  font-size: 12px;
  width: 38px;
  text-align: right;
  color: var(--text-dark-muted);
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.toggle-title {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-dark);
}

.toggle-desc {
  font-size: 11px;
  color: var(--text-dark-muted);
}

.checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-bamboo);
}

.privacy-note {
  font-size: 12px;
  color: var(--text-dark-muted);
  line-height: 1.5;
  margin-bottom: 12px;
}

.clear-data-btn {
  font-size: 12px;
  padding: 6px 14px;
  border: 1px solid rgba(211, 78, 54, 0.4);
  background: rgba(211, 78, 54, 0.08);
  color: var(--accent-vermilion);
  border-radius: 4px;
}

.clear-data-btn:hover {
  background: rgba(211, 78, 54, 0.15);
}
</style>
