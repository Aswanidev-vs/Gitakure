<script setup lang="ts">
import { computed } from 'vue'
import CharacterPortrait from './CharacterPortrait.vue'

type PortraitKind = 'traveler' | 'mika' | 'elder' | 'elderWoman' | 'child' | 'maiden' | 'farmer'

const props = defineProps<{
  open: boolean;
  speaker: string;
  text: string;
}>()

const emit = defineEmits<{ close: [] }>()

const portraitKind = computed<PortraitKind>(() => {
  const name = props.speaker.trim().toLowerCase()
  if (name === 'mika') return 'mika'
  if (name === 'jiro') return 'elder'
  if (name === 'kashi') return 'elderWoman'
  if (name === 'haru') return 'child'
  if (name === 'devan') return 'farmer'
  if (name === 'you' || name === 'traveler') return 'traveler'
  return 'maiden'
})
</script>

<template>
  <div v-if="open" class="dialogue-overlay" @click="emit('close')">
    <div class="dialogue-stage" role="dialog" aria-label="Conversation">
      <div class="dialogue-label">
        <span class="label-leaf" aria-hidden="true"></span>
        Dialogue
      </div>

      <div class="dialogue-frame">
        <!-- Speaker bust, rising out of the caption card -->
        <div class="speaker-portrait" aria-hidden="true">
          <CharacterPortrait :kind="portraitKind" />
        </div>

        <!-- Player seen from behind in the foreground -->
        <svg class="player-back" viewBox="0 0 200 240" aria-hidden="true">
          <defs>
            <linearGradient id="player-back-cloth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#c8ad7d" />
              <stop offset="100%" stop-color="#8a6b46" />
            </linearGradient>
          </defs>
          <path d="M8 240 C8 182 44 158 78 150 L122 150 C156 158 192 182 192 240 Z" fill="url(#player-back-cloth)" />
          <path d="M78 150 L100 186 L122 150" fill="#e6d4ac" opacity="0.6" />
          <path d="M84 142 L116 142 L116 164 L84 164 Z" fill="#d9aa82" />
          <ellipse cx="100" cy="96" rx="56" ry="62" fill="#2b2422" />
          <path d="M56 92 C56 44 78 28 100 28 C126 28 146 48 144 96 C138 68 122 58 100 58 C78 58 64 70 56 92 Z" fill="#3a2e29" />
          <ellipse cx="52" cy="104" rx="8" ry="13" fill="#d9aa82" />
          <ellipse cx="148" cy="104" rx="8" ry="13" fill="#d9aa82" />
        </svg>

        <!-- Parchment caption card -->
        <div class="dialogue-box">
          <span class="speaker-name">{{ speaker }}</span>
          <p class="dialogue-text">{{ text }}</p>
          <div class="advance-indicator" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialogue-overlay {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  z-index: 120;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 32px;
  cursor: pointer;
  user-select: none;
}

.dialogue-stage {
  position: relative;
  width: min(840px, 92vw);
  animation: slideUp 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.dialogue-label {
  position: absolute;
  top: -26px;
  left: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fbf1df;
  font-family: Georgia, 'Shippori Mincho', serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.75);
}

.label-leaf {
  width: 12px;
  height: 7px;
  border-radius: 100% 0 100% 0;
  background: #d6923e;
  transform: rotate(-24deg);
}

.dialogue-frame {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 214px;
}

.speaker-portrait {
  position: relative;
  z-index: 3;
  flex: 0 0 196px;
  width: 196px;
  height: 214px;
  margin-left: 4px;
  filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.38));
}

.player-back {
  position: absolute;
  right: -14px;
  bottom: -6px;
  width: 150px;
  height: 180px;
  z-index: 1;
  opacity: 0.96;
  filter: drop-shadow(-6px 4px 8px rgba(0, 0, 0, 0.45));
  pointer-events: none;
}

.dialogue-box {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 104px;
  margin: 0 92px 18px -14px;
  padding: 16px 24px 20px 40px;
  background: #fbf5eb;
  border: 3px solid #dfcfb8;
  border-radius: 18px;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.45),
    inset 0 0 24px rgba(224, 198, 160, 0.3);
  font-family: 'Zen Kaku Gothic New', system-ui, sans-serif;
  color: #2b211a;
}

.speaker-name {
  display: inline-block;
  margin-bottom: 6px;
  color: #9a5a2e;
  font-family: Georgia, 'Shippori Mincho', serif;
  font-size: 17px;
  font-weight: 600;
}

.dialogue-text {
  font-size: 16.5px;
  line-height: 1.6;
  font-weight: 500;
  color: #2b211a;
  margin: 0;
  padding-right: 18px;
}

.advance-indicator {
  position: absolute;
  right: 16px;
  bottom: 10px;
  width: 20px;
  height: 20px;
  color: #8c6a46;
  animation: blinkBounce 1.2s infinite ease-in-out;
}

.advance-indicator svg {
  width: 100%;
  height: 100%;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes blinkBounce {
  0%, 100% { transform: translateY(0); opacity: 0.9; }
  50% { transform: translateY(3px); opacity: 0.4; }
}

@media (max-width: 640px) {
  .speaker-portrait { flex-basis: 128px; width: 128px; height: 150px; }
  .dialogue-box { margin: 0 58px 12px -10px; padding: 12px 14px 16px 28px; }
  .player-back { width: 104px; height: 130px; }
  .dialogue-text { font-size: 14px; }
}
</style>
