<script setup lang="ts">
import { ref } from 'vue';
import GithubModal from './GithubModal.vue';

defineProps<{ hasSave: boolean }>();
const emit = defineEmits<{ continue: []; newJourney: []; settings: []; github: []; about: [] }>();

const showGithub = ref(false);
</script>

<template>
  <div class="main-menu">
    <div class="menu-card">
      <h1 class="title">Gitakure</h1>
      <p class="tagline">A little world, shaped by your journey.</p>

      <nav class="menu-actions">
        <button v-if="hasSave" class="primary" @click="emit('continue')">Continue</button>
        <button :class="{ primary: !hasSave }" @click="emit('newJourney')">New Journey</button>
        <button @click="showGithub = true">GitHub Connection</button>
        <button @click="emit('settings')">Settings</button>
        <button @click="emit('about')">About</button>
      </nav>

      <p class="hint">WASD to move · E to interact · V to switch camera · Shift+Space to pause</p>
    </div>

    <GithubModal :open="showGithub" @close="showGithub = false" @connected="emit('github')" />
  </div>
</template>

<style scoped>
.main-menu {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 30%, #1a2f28 0%, #0a1410 100%);
  z-index: 200;
  color: #e8f0ea;
  font-family: 'Shippori Mincho', 'Zen Kaku Gothic New', serif;
}
.menu-card {
  text-align: center;
  padding: 2.5rem;
  max-width: 420px;
}
.title {
  font-size: 3rem;
  margin: 0;
  letter-spacing: 0.15em;
  font-weight: 500;
}
.tagline {
  opacity: 0.7;
  margin: 0.5rem 0 2rem;
  font-style: italic;
}
.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.menu-actions button {
  padding: 0.8rem 1.5rem;
  border: 1px solid rgba(180, 200, 190, 0.25);
  background: rgba(15, 26, 23, 0.5);
  color: #e8f0ea;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background 0.2s, transform 0.1s;
}
.menu-actions button:hover {
  background: rgba(40, 60, 55, 0.8);
  transform: translateY(-1px);
}
.menu-actions .primary {
  background: #8fb3a0;
  color: #0f1a17;
  border-color: #8fb3a0;
}
.menu-actions .primary:hover {
  background: #a3c5b0;
}
.hint {
  margin-top: 2rem;
  font-size: 0.75rem;
  opacity: 0.5;
  font-family: system-ui, sans-serif;
}
</style>