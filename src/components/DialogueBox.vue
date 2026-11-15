<script setup lang="ts">
defineProps<{
  open: boolean;
  speaker: string;
  text: string;
}>();

const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div v-if="open" class="dialogue-overlay" @click="emit('close')">
    <div class="dialogue-box" role="dialog" aria-label="Conversation">
      <!-- Speaker Tag (Matches Image 8) -->
      <div class="speaker-tag">
        <span>{{ speaker }}</span>
      </div>

      <!-- Dialogue Line -->
      <p class="dialogue-text">{{ text }}</p>

      <!-- Continue Arrow Cursor (Image 8) -->
      <div class="advance-indicator">▼</div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

.dialogue-overlay {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  z-index: 120;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 50px;
  cursor: pointer;
  user-select: none;
}

/* Parchment Dialogue Box (Image 8) */
.dialogue-box {
  position: relative;
  width: min(640px, 90vw);
  background: #fbf5eb;
  border: 3px solid #dfcfb8;
  border-radius: 18px;
  padding: 22px 28px 20px;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.45),
    inset 0 0 24px rgba(224, 198, 160, 0.3);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  color: #2b211a;
  animation: slideUp 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Amber Speaker Tag (Image 8) */
.speaker-tag {
  position: absolute;
  top: -16px;
  left: 24px;
  background: #d99243;
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 700;
  padding: 4px 18px;
  border-radius: 9999px;
  box-shadow: 0 4px 12px rgba(217, 146, 67, 0.4);
  letter-spacing: 0.2px;
}

.dialogue-text {
  font-size: 16.5px;
  line-height: 1.6;
  font-weight: 500;
  color: #2b211a;
  margin: 0;
  padding-right: 20px;
}

/* Blinking Down Arrow (Image 8) */
.advance-indicator {
  position: absolute;
  right: 18px;
  bottom: 12px;
  font-size: 12px;
  color: #8c6a46;
  animation: blinkBounce 1.2s infinite ease-in-out;
}

@keyframes blinkBounce {
  0%, 100% { transform: translateY(0); opacity: 0.9; }
  50% { transform: translateY(3px); opacity: 0.4; }
}
</style>
