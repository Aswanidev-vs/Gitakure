import { createApp } from 'vue';
import Workshop from '@/components/Workshop.vue';
import '@/styles.css';

// Developer-only asset workshop entry (spec §9). Loaded via /workshop.html,
// NOT part of the player build. Run `bun run dev` and open /workshop.html.

createApp(Workshop).mount('#workshop-app');