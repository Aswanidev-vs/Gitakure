<script setup lang="ts">
import { ref } from 'vue';
import GithubModal from './GithubModal.vue';

defineProps<{ hasSave: boolean }>();
const emit = defineEmits<{ continue: []; newJourney: []; settings: []; github: [] }>();

const showGithub = ref(false);
const showAbout = ref(false);
</script>

<template>
  <div class="main-menu">
    <div class="menu-card">
      <img
        class="menu-logo"
        src="/brand/logo-96.png"
        width="96"
        height="96"
        alt=""
        aria-hidden="true"
      />
      <h1 class="title">Gitakure</h1>
      <p class="tagline">A little world, shaped by your journey.</p>

      <nav class="menu-actions">
        <button v-if="hasSave" class="primary" @click="emit('continue')">Continue</button>
        <button :class="{ primary: !hasSave }" @click="emit('newJourney')">New Journey</button>
        <button @click="showGithub = true">GitHub Connection</button>
        <button @click="emit('settings')">Settings</button>
        <button @click="showAbout = true">About</button>
      </nav>

      <p class="hint">WASD to move · E to interact · V to switch camera · Shift+Space to pause</p>
    </div>

    <GithubModal :open="showGithub" @close="showGithub = false" @connected="emit('github')" />

    <div v-if="showAbout" class="modal-backdrop" @click.self="showAbout = false">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <h2 id="about-title">About Gitakure</h2>
        <p class="about-body">
          A peaceful low-poly countryside that runs in your browser. There is nothing to complete:
          explore a village, sit by the river, watch the weather turn, and stay by the fire as long
          as you like.
        </p>
        <p class="about-body">
          Built with Three.js, Vue, Pinia and Dexie. Terrain, water, buildings and vegetation are
          generated from code at runtime. Nature models are from
          <a href="https://quaternius.com/" target="_blank" rel="noopener noreferrer">Quaternius</a>
          (CC0).
        </p>
        <p class="about-body about-quiet">
          Your progress is stored in this browser only. Nothing is uploaded.
        </p>
        <div class="modal-actions">
          <button class="primary" @click="showAbout = false">Close</button>
        </div>
      </div>
    </div>
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
.menu-logo {
  display: block;
  width: 96px;
  height: 96px;
  margin: 0 auto 1.1rem;
  user-select: none;
  -webkit-user-drag: none;
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

/* ── about ────────────────────────────────────────────────── */

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 10, 8, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 1.25rem;
  backdrop-filter: blur(4px);
}

.modal {
  background: #162420;
  border: 1px solid rgba(180, 200, 190, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  width: min(460px, 100%);
  color: #e8f0ea;
  font-family: 'Zen Kaku Gothic New', system-ui, sans-serif;
}

.modal h2 {
  margin: 0 0 0.9rem;
  font-size: 1.2rem;
  font-weight: 500;
  font-family: 'Shippori Mincho', Georgia, serif;
}

.about-body {
  margin: 0 0 0.9rem;
  font-size: 0.9rem;
  line-height: 1.65;
  color: #c6cbb4;
}

.about-body a {
  color: #8fb3a0;
  text-underline-offset: 3px;
}

.about-quiet {
  font-size: 0.82rem;
  opacity: 0.72;
}

.modal-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
  margin-top: 1.1rem;
}

.modal-actions button {
  padding: 0.5rem 1rem;
  min-height: 40px;
  border: 1px solid rgba(180, 200, 190, 0.3);
  background: transparent;
  color: #e8f0ea;
  border-radius: 6px;
  font: inherit;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background-color 160ms cubic-bezier(0.22, 1, 0.36, 1);
}

.modal-actions .primary {
  background: #8fb3a0;
  color: #0f1a17;
  border-color: #8fb3a0;
}

.modal-actions .primary:hover {
  background: #a3c5b0;
}
</style>