<template>
  <div class="gitakure-ui-root">
    <!-- Top Bar -->
    <TopBar />

    <!-- Dialogue Box -->
    <DialogueBox />

    <!-- Modals -->
    <JournalModal />
    <GithubShrineModal />
    <SettingsModal />

    <!-- Toast Notifications -->
    <NotificationToast />

    <!-- Interaction Prompt (Dynamic Floating Pill) -->
    <div v-if="store.activePrompt && !store.isSitting && !store.isFishing" class="interaction-prompt hud-panel interactive">
      <span class="prompt-key">{{ store.activePrompt.key }}</span>
      <span class="prompt-label">{{ store.activePrompt.text }}</span>
    </div>

    <!-- Subtle On-Screen Sitting Indicator -->
    <div v-if="store.isSitting" class="sitting-banner hud-panel interactive">
      <span class="sitting-icon">🪑</span>
      <span class="sitting-text">Resting at {{ store.sittingLocation || 'Peaceful Corner' }} · Press <strong>C</strong> or <strong>WASD</strong> to stand</span>
    </div>

    <!-- Fishing In Progress Indicator -->
    <div v-if="store.isFishing" class="fishing-banner hud-panel interactive">
      <span class="fishing-icon">🎣</span>
      <span class="fishing-text">Watching the float bob gently on the water... Press <strong>F</strong> or <strong>WASD</strong> to reel in</span>
    </div>

    <!-- Bottom Tranquility Dock -->
    <div class="bottom-dock hud-panel interactive">
      <button class="dock-btn" :class="{ active: store.isSitting }" @click="store.toggleSit()" title="Sit & rest quietly (C)">
        <span class="dock-icon">🪑</span>
        <span class="dock-label">Sit (C)</span>
      </button>
      <button class="dock-btn" :class="{ active: store.isFishing }" @click="store.toggleFishing()" title="Peaceful canal fishing (F)">
        <span class="dock-icon">🎣</span>
        <span class="dock-label">Fish (F)</span>
      </button>
      <button class="dock-btn" @click="store.toggleModal('journal')" title="Open Valley Journal (J)">
        <span class="dock-icon">📖</span>
        <span class="dock-label">Journal (J)</span>
      </button>
      <button class="dock-btn" @click="store.toggleModal('shrine')" title="Visit GitHub Shrine">
        <span class="dock-icon">⛩️</span>
        <span class="dock-label">Shrine</span>
      </button>
    </div>

    <!-- Mobile Soft D-Pad -->
    <div v-if="isTouchDevice && !store.isSitting && !store.isFishing" class="mobile-dpad interactive">
      <button class="dpad-btn up" @touchstart.prevent="startMove(0, -1)" @touchend.prevent="stopMove">▲</button>
      <div class="dpad-mid">
        <button class="dpad-btn left" @touchstart.prevent="startMove(-1, 0)" @touchend.prevent="stopMove">◀</button>
        <div class="dpad-center">●</div>
        <button class="dpad-btn right" @touchstart.prevent="startMove(1, 0)" @touchend.prevent="stopMove">▶</button>
      </div>
      <button class="dpad-btn down" @touchstart.prevent="startMove(0, 1)" @touchend.prevent="stopMove">▼</button>
    </div>

    <!-- Peaceful Title / Welcome Screen -->
    <div v-if="showWelcomeOverlay" class="welcome-overlay interactive" @click="enterValley">
      <div class="welcome-card washi-panel" @click.stop>
        <div class="welcome-glyph">🍃</div>
        <h1 class="welcome-title">GITAKURE</h1>
        <p class="welcome-kanji">ギタクレ · ഗീതാകുരെ</p>
        <p class="welcome-desc">
          A quiet countryside sanctuary blending Japanese rural villages and Kerala backwaters.
          Your development journey quietly becomes part of the earth, while you are free to enjoy the world at your own pace.
        </p>
        <div class="welcome-action">
          <button class="enter-btn" @click="enterValley">Step into the Valley · 谷へ入る</button>
          <span class="enter-sub">Click anywhere to begin soundscapes and exploration</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import TopBar from './components/TopBar.vue';
import DialogueBox from './components/DialogueBox.vue';
import JournalModal from './components/JournalModal.vue';
import GithubShrineModal from './components/GithubShrineModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import NotificationToast from './components/NotificationToast.vue';
import { useGitakureStore } from '@/state/pinia-store';
import { soundscapes } from '@/game/audio/soundscapes';
import { gameBridge } from '@/bridge/game-bridge';

const store = useGitakureStore();
const showWelcomeOverlay = ref(true);
const isTouchDevice = ref(false);

function enterValley() {
  showWelcomeOverlay.value = false;
  soundscapes.init();
}

function startMove(dx: number, dy: number) {
  gameBridge.emit('virtual_joystick', { dx, dy });
}

function stopMove() {
  gameBridge.emit('virtual_joystick', { dx: 0, dy: 0 });
}

function handleGlobalKey(e: KeyboardEvent) {
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

  if (e.key === 'j' || e.key === 'J') {
    store.toggleModal('journal');
  } else if (e.key === 'c' || e.key === 'C') {
    store.toggleSit();
  } else if (e.key === 'f' || e.key === 'F') {
    store.toggleFishing();
  } else if (e.key === 'Escape') {
    if (store.activeModal) {
      store.closeModal();
    } else if (store.currentDialogue) {
      store.closeDialogue();
    }
  }
}

onMounted(async () => {
  await store.initialize();
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  window.addEventListener('keydown', handleGlobalKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKey);
});
</script>

<style scoped>
.gitakure-ui-root {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sitting-banner {
  position: absolute;
  bottom: 84px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 12.5px;
  color: var(--text-main);
  background: rgba(18, 28, 22, 0.9);
  border: 1px solid rgba(91, 138, 85, 0.5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.fishing-banner {
  position: absolute;
  bottom: 84px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 12.5px;
  color: #a8d5e5;
  background: rgba(18, 32, 40, 0.92);
  border: 1px solid rgba(74, 133, 148, 0.6);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.interaction-prompt {
  position: absolute;
  bottom: 128px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 16px;
  background: rgba(18, 24, 21, 0.92);
  border: 1px solid rgba(230, 161, 71, 0.45);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  font-size: 12px;
  color: var(--text-main);
  animation: promptPulse 2s infinite ease-in-out;
}

@keyframes promptPulse {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-2px); }
}

.prompt-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: var(--accent-gold);
  color: #1a231f;
  font-weight: 700;
  font-size: 11px;
}

.bottom-dock {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 24px;
  background: rgba(18, 24, 21, 0.88);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.dock-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dock-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
}

.dock-btn.active {
  background: rgba(91, 138, 85, 0.25);
  border-color: rgba(91, 138, 85, 0.5);
  color: #d2edd0;
}

.sitting-icon {
  font-size: 15px;
}

/* Mobile D-Pad */
.mobile-dpad {
  position: absolute;
  bottom: 24px;
  left: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  user-select: none;
  z-index: 50;
}

.dpad-mid {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dpad-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(26, 35, 31, 0.88);
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.dpad-btn:active {
  background: rgba(91, 138, 85, 0.4);
}

.dpad-center {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 10px;
}

/* Welcome Overlay */
.welcome-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(14, 20, 17, 0.82);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  cursor: pointer;
}

.welcome-card {
  width: 90%;
  max-width: 540px;
  padding: 36px 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-glyph {
  font-size: 32px;
  margin-bottom: 8px;
}

.welcome-title {
  font-family: var(--font-serif);
  font-size: 32px;
  letter-spacing: 4px;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.welcome-kanji {
  font-family: var(--font-serif);
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--accent-vermilion);
  margin-bottom: 16px;
}

.welcome-desc {
  font-size: 13.5px;
  line-height: 1.65;
  color: #3f5247;
  margin-bottom: 24px;
}

.welcome-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.enter-btn {
  padding: 12px 28px;
  border-radius: 24px;
  background: var(--accent-vermilion);
  color: #fff;
  font-family: var(--font-serif);
  font-size: 15px;
  letter-spacing: 1px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--accent-vermilion-glow);
  transition: all 0.25s ease;
}

.enter-btn:hover {
  background: #bf3e26;
  transform: translateY(-1px);
}

.enter-sub {
  font-size: 11px;
  color: var(--text-dark-muted);
}
</style>
