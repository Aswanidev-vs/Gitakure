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
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import TopBar from './components/TopBar.vue';
import DialogueBox from './components/DialogueBox.vue';
import JournalModal from './components/JournalModal.vue';
import GithubShrineModal from './components/GithubShrineModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import NotificationToast from './components/NotificationToast.vue';
import { useGitakureStore } from '@/state/pinia-store';

const store = useGitakureStore();

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
  store.showToast('Breathe in the mountain and backwater air.', '🍃');
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
</style>
