<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { Game } from '@/game/core/Game';
import { gameBridge } from '@/game/core/GameBridge';
import type { CameraMode, GameSettings } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import SettingsModal from '@/components/SettingsModal.vue';
import '@/styles.css';

const settingsStore = useSettingsStore();
const settings: GameSettings = settingsStore.settings;
const showSettings = ref(false);

const container = ref<HTMLDivElement | null>(null);
const game = ref<Game | null>(null);
const cameraMode = ref<CameraMode>(settings.camera.mode);
const fps = ref(0);
const drawCalls = ref(0);
const prompt = ref<string | null>(null);
const paused = ref(false);

const offSnapshot = gameBridge.on('snapshot', (e) => {
  fps.value = e.snapshot.fps;
  drawCalls.value = e.snapshot.drawCalls;
});
const offInteraction = gameBridge.on('interaction', (e) => {
  prompt.value = e.prompt;
});

function toggleCamera() {
  const next: CameraMode = cameraMode.value === 'thirdPerson' ? 'firstPerson' : 'thirdPerson';
  cameraMode.value = next;
  gameBridge.emit({ type: 'setCameraMode', mode: next });
}

function togglePause() {
  paused.value = !paused.value;
  gameBridge.emit({ type: 'setPaused', paused: paused.value });
}

function onKey(e: KeyboardEvent) {
  if (e.code === 'KeyV' && !e.repeat) {
    toggleCamera();
  } else if (e.code === 'Space' && e.shiftKey) {
    e.preventDefault();
    togglePause();
  }
}

function onSettingsChange(next: GameSettings) {
  Object.assign(settings, structuredClone(next));
  settingsStore.settings = structuredClone(next);
}

watch(
  () => settings.camera.followDistance,
  (d) => gameBridge.emit({ type: 'setFollowDistance', distance: d }),
);
watch(
  () => settings.graphics.quality,
  (q) => gameBridge.emit({ type: 'setQuality', settings: { ...settings.graphics, quality: q } }),
);

onMounted(() => {
  window.addEventListener('keydown', onKey);
  if (!container.value) return;
  const g = new Game(container.value, settings);
  game.value = g;
  void g.start();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  offSnapshot();
  offInteraction();
  game.value?.dispose();
});
</script>

<template>
  <div class="gitakure-root">
    <div ref="container" class="game-canvas"></div>

    <div class="hud">
      <div class="hud-left">
        <button class="hud-btn" @click="toggleCamera">
          {{ cameraMode === 'thirdPerson' ? 'Third-person' : 'First-person' }} · V
        </button>
        <button class="hud-btn" @click="togglePause">Pause</button>
        <button class="hud-btn" @click="showSettings = true">Settings</button>
      </div>
      <div class="hud-right">
        <span class="stat">{{ fps }} fps · {{ drawCalls }} calls</span>
      </div>
    </div>

    <div v-if="prompt" class="interaction-pill">{{ prompt }}</div>

    <SettingsModal :settings="settings" :open="showSettings" @close="showSettings = false" @change="onSettingsChange" />
  </div>
</template>

<style scoped>
.gitakure-root {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #0f1a17;
  font-family: 'Zen Kaku Gothic New', system-ui, sans-serif;
  color: #e8f0ea;
}
.game-canvas {
  position: absolute;
  inset: 0;
}
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  pointer-events: none;
  z-index: 10;
}
.hud-left,
.hud-right {
  display: flex;
  gap: 0.5rem;
  pointer-events: auto;
}
.hud-btn {
  background: rgba(15, 26, 23, 0.6);
  border: 1px solid rgba(180, 200, 190, 0.25);
  color: #e8f0ea;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background 0.2s;
}
.hud-btn:hover {
  background: rgba(40, 60, 55, 0.8);
}
.stat {
  font-size: 0.75rem;
  opacity: 0.7;
  background: rgba(15, 26, 23, 0.5);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
}
.interaction-pill {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 26, 23, 0.75);
  border: 1px solid rgba(180, 200, 190, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.9rem;
  z-index: 10;
  backdrop-filter: blur(6px);
}
</style>