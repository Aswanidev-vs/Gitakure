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

    <!-- Subtle On-Screen Sitting Indicator -->
    <div v-if="store.isSitting" class="sitting-banner hud-panel interactive">
      <span class="sitting-icon">🪑</span>
      <span class="sitting-text">Resting at {{ store.sittingLocation || 'Peaceful Corner' }} · Press <strong>C</strong> or <strong>WASD</strong> to stand</span>
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
  bottom: 24px;
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

.sitting-icon {
  font-size: 15px;
}
</style>
