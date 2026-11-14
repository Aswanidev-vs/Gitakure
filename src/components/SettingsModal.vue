<script setup lang="ts">
import { reactive, watch } from 'vue';
import { gameBridge } from '@/game/core/GameBridge';
import type { GameSettings } from '@/types';

const props = defineProps<{ settings: GameSettings; open: boolean }>();
const emit = defineEmits<{ close: []; change: [settings: GameSettings] }>();

const draft = reactive<GameSettings>(structuredClone(props.settings));

watch(
  () => props.open,
  (open) => {
    if (open) Object.assign(draft, structuredClone(props.settings));
  },
);

function apply() {
  gameBridge.emit({ type: 'setQuality', settings: draft.graphics });
  gameBridge.emit({ type: 'setAudio', settings: draft.audio });
  gameBridge.emit({ type: 'setCameraMode', mode: draft.camera.mode });
  gameBridge.emit({ type: 'setFollowDistance', distance: draft.camera.followDistance });
  gameBridge.emit({ type: 'setReducedMotion', value: draft.reducedMotion });
  emit('change', structuredClone(draft));
  emit('close');
}
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <h2>Settings</h2>

      <section>
        <h3>Graphics</h3>
        <label class="row">
          Quality
          <select v-model="draft.graphics.quality">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label class="row">
          Shadows
          <input type="checkbox" v-model="draft.graphics.shadows" />
        </label>
      </section>

      <section>
        <h3>Camera</h3>
        <label class="row">
          Mode
          <select v-model="draft.camera.mode">
            <option value="thirdPerson">Third-person</option>
            <option value="firstPerson">First-person</option>
          </select>
        </label>
        <label class="row">
          Follow distance
          <input type="range" min="2" max="14" step="0.5" v-model.number="draft.camera.followDistance" />
          <span class="val">{{ draft.camera.followDistance }}</span>
        </label>
      </section>

      <section>
        <h3>Audio</h3>
        <label class="row">
          Master
          <input type="range" min="0" max="1" step="0.05" v-model.number="draft.audio.master" />
        </label>
        <label class="row">
          Ambience
          <input type="range" min="0" max="1" step="0.05" v-model.number="draft.audio.ambience" />
        </label>
        <label class="row">
          SFX
          <input type="range" min="0" max="1" step="0.05" v-model.number="draft.audio.sfx" />
        </label>
        <label class="row">
          Music (optional)
          <input type="checkbox" v-model="draft.audio.music" />
        </label>
      </section>

      <section>
        <h3>Accessibility</h3>
        <label class="row">
          Reduced motion
          <input type="checkbox" v-model="draft.reducedMotion" />
        </label>
        <label class="row">
          Show time
          <input type="checkbox" v-model="draft.showTime" />
        </label>
        <label class="row">
          Show weather
          <input type="checkbox" v-model="draft.showWeather" />
        </label>
      </section>

      <div class="modal-actions">
        <button @click="emit('close')">Cancel</button>
        <button class="primary" @click="apply">Apply</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 10, 8, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}
.modal {
  background: #162420;
  border: 1px solid rgba(180, 200, 190, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  width: min(440px, 92vw);
  max-height: 85vh;
  overflow-y: auto;
  color: #e8f0ea;
}
.modal h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
}
.modal section {
  margin-bottom: 1.2rem;
}
.modal h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.6;
  margin: 0 0 0.6rem;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.4rem 0;
  font-size: 0.9rem;
}
.row select {
  background: #0f1a17;
  color: #e8f0ea;
  border: 1px solid rgba(180, 200, 190, 0.3);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
}
.val {
  opacity: 0.7;
  min-width: 2rem;
  text-align: right;
}
.modal-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
.modal-actions button {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(180, 200, 190, 0.3);
  background: transparent;
  color: #e8f0ea;
  border-radius: 6px;
  cursor: pointer;
}
.modal-actions .primary {
  background: #8fb3a0;
  color: #0f1a17;
}
</style>