<template>
  <div class="toast-stack interactive">
    <transition name="toast">
      <div v-if="store.recentToast" class="toast-item hud-panel">
        <span class="toast-bullet">{{ store.recentToast.icon }}</span>
        <span class="toast-text">{{ store.recentToast.text }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useGitakureStore } from '@/state/pinia-store';

const store = useGitakureStore();
</script>

<style scoped>
.toast-stack {
  position: absolute;
  top: 64px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 90;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-main);
  box-shadow: var(--shadow-soft);
  border-color: rgba(91, 138, 85, 0.45);
}

.toast-bullet {
  font-size: 14px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
