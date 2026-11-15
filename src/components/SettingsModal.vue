<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { gameBridge } from '@/game/core/GameBridge';
import { plainSettings, type GameSettings, type GraphicsQuality } from '@/types';

const props = defineProps<{ settings: GameSettings; open: boolean }>();
const emit = defineEmits<{ close: []; change: [settings: GameSettings] }>();

const activeTab = ref<'graphics' | 'audio' | 'controls' | 'accessibility' | 'github'>('graphics');

const draft = reactive<GameSettings>(plainSettings(props.settings));
const selectedCharacterModel = ref<'female' | 'male'>('female');
const bloomEnabled = ref(true);
const motionBlurEnabled = ref(false);
const renderScale = ref(1.0);

watch(
  () => props.open,
  (open) => {
    if (open) Object.assign(draft, plainSettings(props.settings));
  },
);

function setQuality(q: GraphicsQuality) {
  draft.graphics.quality = q;
  draft.graphics.shadows = q !== 'low';
}

function setCharacter(model: 'female' | 'male') {
  selectedCharacterModel.value = model;
  gameBridge.emit({ type: 'setCharacterModel', model });
}

function resetDefaults() {
  setQuality('medium');
  draft.camera.mode = 'thirdPerson';
  draft.camera.followDistance = 7;
  draft.audio.master = 0.8;
  draft.audio.ambience = 0.7;
  draft.audio.sfx = 0.6;
  draft.audio.music = false;
  draft.reducedMotion = false;
  renderScale.value = 1.0;
  bloomEnabled.value = true;
  motionBlurEnabled.value = false;
}

function apply() {
  gameBridge.emit({ type: 'setQuality', settings: draft.graphics });
  gameBridge.emit({ type: 'setAudio', settings: draft.audio });
  gameBridge.emit({ type: 'setCameraMode', mode: draft.camera.mode });
  gameBridge.emit({ type: 'setFollowDistance', distance: draft.camera.followDistance });
  gameBridge.emit({ type: 'setReducedMotion', value: draft.reducedMotion });
  emit('change', plainSettings(draft));
  emit('close');
}
</script>

<template>
  <div v-if="open" class="settings-backdrop" @click.self="emit('close')">
    <div class="parchment-settings-modal" role="dialog" aria-modal="true" aria-label="Settings">
      <!-- Header -->
      <div class="settings-header">
        <div class="header-left">
          <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <h2 class="header-title">Settings</h2>
        </div>
        <button class="close-x-btn" type="button" aria-label="Close" @click="emit('close')">✕</button>
      </div>

      <!-- Main Layout -->
      <div class="settings-body">
        <!-- Sidebar Navigation -->
        <nav class="settings-sidebar" aria-label="Settings categories">
          <button
            :class="['sidebar-item', { active: activeTab === 'graphics' }]"
            type="button"
            @click="activeTab = 'graphics'"
          >
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="20" height="14" x="2" y="3" rx="2"/>
              <line x1="8" x2="16" y1="21" y2="21"/>
              <line x1="12" x2="12" y1="17" y2="21"/>
            </svg>
            <span>Graphics</span>
          </button>

          <button
            :class="['sidebar-item', { active: activeTab === 'audio' }]"
            type="button"
            @click="activeTab = 'audio'"
          >
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
            <span>Audio</span>
          </button>

          <button
            :class="['sidebar-item', { active: activeTab === 'controls' }]"
            type="button"
            @click="activeTab = 'controls'"
          >
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="6" x2="10" y1="12" y2="12"/>
              <line x1="8" x2="8" y1="10" y2="14"/>
              <line x1="15" x2="15.01" y1="13" y2="13"/>
              <line x1="18" x2="18.01" y1="11" y2="11"/>
              <rect width="20" height="12" x="2" y="6" rx="6"/>
            </svg>
            <span>Controls</span>
          </button>

          <button
            :class="['sidebar-item', { active: activeTab === 'accessibility' }]"
            type="button"
            @click="activeTab = 'accessibility'"
          >
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="4" r="1"/>
              <path d="m18 19 1-7-6 1"/>
              <path d="m5 8 3-3 5.5 3-2.36 3.5"/>
              <path d="M4.24 14.5a5 5 0 0 0 6.88 6"/>
              <path d="M13.76 17.5a5 5 0 0 0-4-7.6"/>
            </svg>
            <span>Accessibility</span>
          </button>

          <button
            :class="['sidebar-item', { active: activeTab === 'github' }]"
            type="button"
            @click="activeTab = 'github'"
          >
            <svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </button>
        </nav>

        <!-- Right Content Section -->
        <div class="settings-content">
          <!-- 1. Graphics (Matches Image 3 & 10) -->
          <div v-if="activeTab === 'graphics'" class="settings-panel">
            <!-- Graphics Quality -->
            <div class="form-row">
              <span class="row-label">Graphics Quality</span>
              <div class="pill-group">
                <button
                  :class="['option-pill', { active: draft.graphics.quality === 'low' }]"
                  type="button"
                  @click="setQuality('low')"
                >
                  Low
                </button>
                <button
                  :class="['option-pill', { active: draft.graphics.quality === 'medium' }]"
                  type="button"
                  @click="setQuality('medium')"
                >
                  Medium
                </button>
                <button
                  :class="['option-pill', { active: draft.graphics.quality === 'high' }]"
                  type="button"
                  @click="setQuality('high')"
                >
                  High
                </button>
              </div>
            </div>

            <!-- Character Model Archetype (Image 2) -->
            <div class="form-row">
              <span class="row-label">Character Model</span>
              <div class="pill-group">
                <button
                  :class="['option-pill', { active: selectedCharacterModel === 'female' }]"
                  type="button"
                  @click="setCharacter('female')"
                >
                  Female (Mika)
                </button>
                <button
                  :class="['option-pill', { active: selectedCharacterModel === 'male' }]"
                  type="button"
                  @click="setCharacter('male')"
                >
                  Male (Traveler)
                </button>
              </div>
            </div>

            <!-- Shadow Quality -->
            <div class="form-row">
              <span class="row-label">Shadow Quality</span>
              <div class="pill-group">
                <button
                  :class="['option-pill', { active: !draft.graphics.shadows }]"
                  type="button"
                  @click="draft.graphics.shadows = false"
                >
                  Off
                </button>
                <button
                  :class="['option-pill', { active: draft.graphics.shadows }]"
                  type="button"
                  @click="draft.graphics.shadows = true"
                >
                  High
                </button>
              </div>
            </div>

            <!-- Render Scale -->
            <div class="form-row">
              <span class="row-label">Render Scale</span>
              <div class="slider-wrap">
                <input
                  v-model.number="renderScale"
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  class="custom-slider"
                />
                <span class="slider-val">{{ renderScale.toFixed(1) }}x</span>
              </div>
            </div>

            <!-- Bloom Toggle -->
            <div class="form-row">
              <span class="row-label">Bloom</span>
              <label class="toggle-switch">
                <input v-model="bloomEnabled" type="checkbox" />
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Motion Blur Toggle -->
            <div class="form-row">
              <span class="row-label">Motion Blur</span>
              <label class="toggle-switch">
                <input v-model="motionBlurEnabled" type="checkbox" />
                <span class="switch-slider"></span>
              </label>
            </div>
          </div>

          <!-- 2. Audio -->
          <div v-else-if="activeTab === 'audio'" class="settings-panel">
            <div class="form-row">
              <span class="row-label">Master Volume</span>
              <div class="slider-wrap">
                <input v-model.number="draft.audio.master" type="range" min="0" max="1" step="0.05" class="custom-slider" />
                <span class="slider-val">{{ Math.round(draft.audio.master * 100) }}%</span>
              </div>
            </div>

            <div class="form-row">
              <span class="row-label">Ambience (Wind &amp; River)</span>
              <div class="slider-wrap">
                <input v-model.number="draft.audio.ambience" type="range" min="0" max="1" step="0.05" class="custom-slider" />
                <span class="slider-val">{{ Math.round(draft.audio.ambience * 100) }}%</span>
              </div>
            </div>

            <div class="form-row">
              <span class="row-label">Sound Effects (Steps &amp; Fire)</span>
              <div class="slider-wrap">
                <input v-model.number="draft.audio.sfx" type="range" min="0" max="1" step="0.05" class="custom-slider" />
                <span class="slider-val">{{ Math.round(draft.audio.sfx * 100) }}%</span>
              </div>
            </div>

            <div class="form-row">
              <span class="row-label">Music</span>
              <label class="toggle-switch">
                <input v-model="draft.audio.music" type="checkbox" />
                <span class="switch-slider"></span>
              </label>
            </div>
          </div>

          <!-- 3. Controls -->
          <div v-else-if="activeTab === 'controls'" class="settings-panel">
            <div class="form-row">
              <span class="row-label">Camera Perspective</span>
              <div class="pill-group">
                <button
                  :class="['option-pill', { active: draft.camera.mode === 'thirdPerson' }]"
                  type="button"
                  @click="draft.camera.mode = 'thirdPerson'"
                >
                  Third-person
                </button>
                <button
                  :class="['option-pill', { active: draft.camera.mode === 'firstPerson' }]"
                  type="button"
                  @click="draft.camera.mode = 'firstPerson'"
                >
                  First-person
                </button>
              </div>
            </div>

            <div class="form-row">
              <span class="row-label">Camera Distance</span>
              <div class="slider-wrap">
                <input v-model.number="draft.camera.followDistance" type="range" min="3" max="14" step="0.5" class="custom-slider" />
                <span class="slider-val">{{ draft.camera.followDistance }}m</span>
              </div>
            </div>

            <div class="controls-guide">
              <h4 class="guide-title">Keyboard Shortcuts</h4>
              <ul class="guide-list">
                <li><kbd>W A S D</kbd> Walk / Run (Hold Shift)</li>
                <li><kbd>E</kbd> Interact / Sit / Talk</li>
                <li><kbd>Tab</kbd> Open Inventory</li>
                <li><kbd>M</kbd> Illustrated World Map</li>
                <li><kbd>V</kbd> Switch Camera View</li>
                <li><kbd>Esc</kbd> Pause / Settings Menu</li>
              </ul>
            </div>
          </div>

          <!-- 4. Accessibility -->
          <div v-else-if="activeTab === 'accessibility'" class="settings-panel">
            <div class="form-row">
              <span class="row-label">Reduced Motion</span>
              <label class="toggle-switch">
                <input v-model="draft.reducedMotion" type="checkbox" />
                <span class="switch-slider"></span>
              </label>
            </div>
            <div class="form-row">
              <span class="row-label">Always Show Time of Day</span>
              <label class="toggle-switch">
                <input v-model="draft.showTime" type="checkbox" />
                <span class="switch-slider"></span>
              </label>
            </div>
            <div class="form-row">
              <span class="row-label">Always Show Weather</span>
              <label class="toggle-switch">
                <input v-model="draft.showWeather" type="checkbox" />
                <span class="switch-slider"></span>
              </label>
            </div>
          </div>

          <!-- 5. GitHub -->
          <div v-else class="settings-panel">
            <h4 class="github-title">GitHub Memories Integration</h4>
            <p class="github-note">
              Gitakure honors your personal coding milestones without competition. Your commits and repositories subtly sprout quiet keepsakes, lanterns, and saplings around the village.
            </p>
            <p class="github-privacy">
              ✦ Public data only. No tokens or private data stored on any server.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer Buttons (Matches Image 3 & 10) -->
      <div class="settings-footer">
        <button class="btn-reset" type="button" @click="resetDefaults">Reset to Default</button>
        <button class="btn-apply" type="button" @click="apply">Apply</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

.settings-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 16, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 450;
  padding: 16px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  user-select: none;
}

/* Parchment Modal Container (Image 3 & 10) */
.parchment-settings-modal {
  width: min(720px, 94vw);
  background: #f6eee2;
  border: 3px solid #e2d2ba;
  border-radius: 22px;
  padding: 24px 28px 26px;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.6),
    inset 0 0 32px rgba(214, 188, 150, 0.35);
  color: #2b231d;
  animation: popIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.95) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  border-bottom: 2px solid #ecdcc8;
  padding-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  width: 22px;
  height: 22px;
  color: #48392d;
}

.header-title {
  font-family: 'Caveat', cursive, sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #2b221a;
  line-height: 1;
}

.close-x-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  color: #6a5747;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-x-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1a1410;
}

/* Body: Sidebar + Content */
.settings-body {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 24px;
  min-height: 310px;
}

.settings-sidebar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-right: 2px solid #ecdcc8;
  padding-right: 14px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #554435;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.sidebar-item:hover {
  background: #ecdcc8;
}

/* Active Highlight Pill (matches Image 3 & 10 yellow pill) */
.sidebar-item.active {
  background: #fbe092;
  color: #271f18;
  box-shadow: 0 2px 8px rgba(186, 142, 88, 0.25);
}

.tab-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Right Content */
.settings-content {
  padding: 4px 6px;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.row-label {
  font-size: 14.5px;
  font-weight: 600;
  color: #382c22;
}

/* Pill Selectors */
.pill-group {
  display: flex;
  gap: 6px;
  background: #ebdcc8;
  padding: 3px;
  border-radius: 9999px;
  border: 1px solid #dac7ad;
}

.option-pill {
  padding: 5px 14px;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: #5d4d3d;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.option-pill:hover {
  color: #271f18;
}

.option-pill.active {
  background: #ffffff;
  color: #1f1812;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

/* Custom Slider */
.slider-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.custom-slider {
  accent-color: #3f3126;
  width: 140px;
  cursor: pointer;
}

.slider-val {
  font-size: 13px;
  font-weight: 700;
  color: #4d3d30;
  min-width: 38px;
  text-align: right;
}

/* Toggle Switch (Image 3 green toggle) */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #c9bbaa;
  transition: 0.25s;
  border-radius: 24px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.25s;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .switch-slider {
  background-color: #5d8b58;
}

input:checked + .switch-slider:before {
  transform: translateX(20px);
}

/* Footer Action Buttons */
.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 22px;
  padding-top: 14px;
  border-top: 2px solid #ecdcc8;
}

.btn-reset {
  padding: 9px 20px;
  border: 1px solid #d2be9f;
  background: #eadecd;
  color: #4b3d30;
  border-radius: 9999px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-reset:hover {
  background: #ded0bc;
}

.btn-apply {
  padding: 9px 24px;
  border: none;
  background: #5d8b58;
  color: #ffffff;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(93, 139, 88, 0.35);
  transition: all 0.2s;
}

.btn-apply:hover {
  background: #4c7747;
  transform: translateY(-1px);
}

/* Controls Guide */
.controls-guide {
  background: #efe4d3;
  border: 1px solid #d8c7b0;
  border-radius: 12px;
  padding: 14px 16px;
  margin-top: 4px;
}

.guide-title {
  font-size: 14px;
  font-weight: 700;
  color: #2b221a;
  margin-bottom: 8px;
}

.guide-list {
  list-style: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
  font-size: 12.5px;
  color: #524235;
}

.guide-list kbd {
  background: #ffffff;
  border: 1px solid #caa885;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  color: #221c17;
}

.github-title {
  font-family: 'Caveat', cursive, sans-serif;
  font-size: 26px;
  margin-bottom: 8px;
}

.github-note {
  font-size: 14px;
  line-height: 1.6;
  color: #4b3e32;
  margin-bottom: 12px;
}

.github-privacy {
  font-size: 13px;
  color: #5d8b58;
  font-weight: 600;
}

@media (max-width: 680px) {
  .settings-body {
    grid-template-columns: 1fr;
  }
  .settings-sidebar {
    border-right: none;
    border-bottom: 2px solid #ecdcc8;
    padding-bottom: 12px;
    flex-direction: row;
    overflow-x: auto;
  }
}
</style>
