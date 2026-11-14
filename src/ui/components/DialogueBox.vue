<template>
  <div v-if="dialogue" class="dialogue-wrapper interactive">
    <div class="dialogue-card washi-panel">
      <!-- Header -->
      <div class="dialogue-header">
        <div class="speaker-meta">
          <h2 class="speaker-name">{{ dialogue.speaker }}</h2>
          <span class="speaker-title">{{ dialogue.title }}</span>
        </div>
        <button class="close-btn" title="Close (Esc)" @click="store.closeDialogue()">✕</button>
      </div>

      <!-- Dialogue Content -->
      <div class="dialogue-body">
        <p class="dialogue-text">{{ displayedText }}</p>
      </div>

      <!-- Dialogue Options / Actions -->
      <div class="dialogue-footer">
        <div v-if="dialogue.options && dialogue.options.length > 0" class="options-list">
          <button
            v-for="(opt, idx) in dialogue.options"
            :key="idx"
            class="dialogue-option-btn"
            @click="selectOption(opt)"
          >
            <span class="opt-bullet">◆</span>
            <span>{{ opt.label }}</span>
          </button>
        </div>
        <div v-else class="continue-prompt">
          <button class="continue-btn" @click="store.closeDialogue()">
            <span>Depart in peace</span>
            <span class="key-hint">Space</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useGitakureStore } from '@/state/pinia-store';

const store = useGitakureStore();
const dialogue = computed(() => store.currentDialogue);
const displayedText = ref('');
let typeInterval: number | null = null;

function startTypewriter(fullText: string) {
  if (typeInterval) clearInterval(typeInterval);
  displayedText.value = '';
  let index = 0;

  typeInterval = window.setInterval(() => {
    if (index < fullText.length) {
      displayedText.value += fullText[index];
      index++;
    } else {
      if (typeInterval) clearInterval(typeInterval);
      typeInterval = null;
    }
  }, 22);
}

watch(
  () => store.currentDialogue?.text,
  (newText) => {
    if (newText) {
      startTypewriter(newText);
    }
  },
  { immediate: true }
);

function selectOption(opt: { label: string; action?: () => void; nextText?: string }) {
  if (opt.action) {
    opt.action();
  }
  if (opt.nextText && store.currentDialogue) {
    store.currentDialogue.text = opt.nextText;
    store.currentDialogue.options = [];
  } else if (!opt.action) {
    store.closeDialogue();
  }
}

function handleKey(e: KeyboardEvent) {
  if (!store.currentDialogue) return;
  if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
    if (dialogue.value && (!dialogue.value.options || dialogue.value.options.length === 0)) {
      store.closeDialogue();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
  if (typeInterval) clearInterval(typeInterval);
});
</script>

<style scoped>
.dialogue-wrapper {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 680px;
}

.dialogue-card {
  padding: 20px 24px;
  border-radius: 8px;
}

.dialogue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-washi);
  padding-bottom: 10px;
  margin-bottom: 14px;
}

.speaker-name {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 600;
  color: var(--text-dark);
  letter-spacing: 0.5px;
}

.speaker-title {
  font-size: 11.5px;
  color: var(--text-dark-muted);
}

.close-btn {
  font-size: 14px;
  color: var(--text-dark-muted);
  padding: 4px 8px;
}

.close-btn:hover {
  color: var(--accent-vermilion);
}

.dialogue-body {
  min-height: 50px;
  margin-bottom: 14px;
}

.dialogue-text {
  font-family: var(--font-serif);
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--text-dark);
}

.dialogue-footer {
  display: flex;
  justify-content: flex-end;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.dialogue-option-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-washi);
  border-radius: 4px;
  font-size: 12.5px;
  color: var(--text-dark);
  text-align: left;
}

.dialogue-option-btn:hover {
  background: rgba(211, 78, 54, 0.08);
  border-color: var(--accent-vermilion);
  color: var(--accent-vermilion);
}

.opt-bullet {
  font-size: 10px;
  color: var(--accent-vermilion);
}

.continue-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-dark-muted);
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

.continue-btn:hover {
  color: var(--text-dark);
  background: rgba(0, 0, 0, 0.07);
}

.key-hint {
  font-family: var(--font-mono);
  font-size: 10px;
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 5px;
  border-radius: 3px;
}
</style>
