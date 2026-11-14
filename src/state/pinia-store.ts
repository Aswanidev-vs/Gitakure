import { defineStore } from 'pinia';
import {
  getSettings,
  saveSettings,
  getDiscoveries,
  getJournalEntries,
  type GameSettings,
  type WorldDiscovery,
  type JournalEntry,
} from '@/storage/db';
import { gameBridge } from '@/bridge/game-bridge';
import type { DialogueNode } from '@/types';

export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'dusk' | 'night';
export type Season = 'spring' | 'monsoon' | 'autumn' | 'winter';
export type WeatherType = 'clear' | 'sakura_breeze' | 'monsoon_rain' | 'evening_mist';

export const useGitakureStore = defineStore('gitakure', {
  state: () => ({
    isLoaded: false,
    isSitting: false,
    sittingLocation: null as string | null,
    isFishing: false,
    activePrompt: null as { text: string; key: string } | null,
    campfireLit: true,
    activeModal: null as 'journal' | 'shrine' | 'settings' | null,
    currentDialogue: null as DialogueNode | null,

    // Time & Atmosphere
    activeSeason: 'monsoon' as Season,
    weather: 'monsoon_rain' as WeatherType,
    timeOfDay: 'dusk' as TimeOfDay,
    realWorldTime: {
      hour: 17,
      minute: 30,
      formatted: '17:30',
      isRealWorldSync: true,
    },

    // Persistence
    settings: {
      id: 'default',
      musicVolume: 0.7,
      ambientVolume: 0.85,
      sfxVolume: 0.8,
      isMuted: false,
      realWorldTimeSync: true,
      zoomLevel: 1.4,
      reducedMotion: false,
    } as GameSettings,

    discoveries: [] as WorldDiscovery[],
    journalEntries: [] as JournalEntry[],
    connectedGithubUser: null as string | null,
    recentToast: null as { id: string; text: string; icon: string } | null,
  }),

  actions: {
    async initialize() {
      if (this.isLoaded) return;
      try {
        const loadedSettings = await getSettings();
        this.settings = loadedSettings;
        this.discoveries = await getDiscoveries();
        this.journalEntries = await getJournalEntries();

        // Check real world time if sync enabled
        if (this.settings.realWorldTimeSync) {
          this.syncWithRealWorldClock();
        }

        // Bridge listeners
        gameBridge.on('player_sit', (p: { locationName?: string }) => {
          this.isSitting = true;
          this.sittingLocation = p?.locationName || 'Peaceful Veranda';
          this.showToast(`Resting peacefully at ${this.sittingLocation}.`, '🪑');
        });

        gameBridge.on('player_stand', () => {
          this.isSitting = false;
          this.sittingLocation = null;
        });

        gameBridge.on('campfire_toggle', (p: { isLit: boolean }) => {
          this.campfireLit = p.isLit;
          this.showToast(p.isLit ? 'The campfire crackles with warmth.' : 'The embers cool into quiet ashes.', '🔥');
        });

        gameBridge.on('discovery_unlocked', async (disc: WorldDiscovery) => {
          await this.refreshDiscoveries();
          this.showToast(`Discovered: ${disc.title}`, disc.icon || '✨');
        });

        gameBridge.on('dialogue_open', (node: DialogueNode) => {
          this.currentDialogue = node;
        });

        gameBridge.on('dialogue_close', () => {
          this.currentDialogue = null;
        });

        gameBridge.on('interaction_prompt', (p: any) => {
          this.activePrompt = p ? { text: p.text, key: p.key || 'E' } : null;
        });

        gameBridge.on('fishing_start', () => {
          this.isFishing = true;
          this.showToast('Cast your line into the calm backwaters...', '🎣');
        });

        gameBridge.on('fishing_end', () => {
          this.isFishing = false;
        });

        this.isLoaded = true;
      } catch (err) {
        console.error('Failed to initialize Gitakure store:', err);
      }
    },

    syncWithRealWorldClock() {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();

      this.realWorldTime.hour = h;
      this.realWorldTime.minute = m;
      this.realWorldTime.formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      // Set time of day according to local sunlight
      if (h >= 5 && h < 7) {
        this.timeOfDay = 'dawn';
      } else if (h >= 7 && h < 12) {
        this.timeOfDay = 'morning';
      } else if (h >= 12 && h < 16) {
        this.timeOfDay = 'noon';
      } else if (h >= 16 && h < 19) {
        this.timeOfDay = 'dusk';
      } else {
        this.timeOfDay = 'night';
      }

      // Infer gradual seasonal vibe: e.g. June-August = Monsoon season (Kerala rainy season)
      const month = now.getMonth();
      if (month >= 5 && month <= 8) {
        this.activeSeason = 'monsoon';
      } else if (month >= 2 && month <= 4) {
        this.activeSeason = 'spring';
      } else if (month >= 9 && month <= 10) {
        this.activeSeason = 'autumn';
      } else {
        this.activeSeason = 'winter';
      }
    },

    toggleSit() {
      this.isSitting = !this.isSitting;
      if (this.isSitting) {
        gameBridge.notifySitting(true, 'Riverside Bank');
      } else {
        gameBridge.notifySitting(false);
      }
    },

    toggleFishing() {
      if (this.isFishing) {
        gameBridge.emit('fishing_end');
        this.isFishing = false;
      } else {
        gameBridge.emit('fishing_start');
      }
    },

    toggleCampfire() {
      this.campfireLit = !this.campfireLit;
      gameBridge.notifyCampfire(this.campfireLit);
    },

    toggleModal(modal: 'journal' | 'shrine' | 'settings') {
      if (this.activeModal === modal) {
        this.activeModal = null;
      } else {
        this.activeModal = modal;
      }
    },

    closeModal() {
      this.activeModal = null;
    },

    closeDialogue() {
      this.currentDialogue = null;
    },

    async updateSettings(partial: Partial<GameSettings>) {
      this.settings = { ...this.settings, ...partial };
      await saveSettings(partial);
      gameBridge.emit('settings_updated', this.settings);
    },

    async refreshDiscoveries() {
      this.discoveries = await getDiscoveries();
    },

    async refreshJournal() {
      this.journalEntries = await getJournalEntries();
    },

    showToast(text: string, icon = '🍃') {
      const id = Math.random().toString(36).substring(2, 9);
      this.recentToast = { id, text, icon };
      setTimeout(() => {
        if (this.recentToast?.id === id) {
          this.recentToast = null;
        }
      }, 4000);
    },
  },
});
