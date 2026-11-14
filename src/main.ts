import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/ui/App.vue';
import { createPhaserGame } from '@/game/phaser-game';
import '@/ui/styles.css';

// 1. Mount Vue UI with Pinia
const uiApp = createApp(App);
const pinia = createPinia();
uiApp.use(pinia);
uiApp.mount('#ui-root');

// 2. Initialize Isometric Phaser Game
window.addEventListener('DOMContentLoaded', () => {
  createPhaserGame();
});
