import { defineStore } from 'pinia';
import { DEFAULT_SETTINGS, type GameSettings } from '@/types';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: structuredClone(DEFAULT_SETTINGS) as GameSettings,
  }),
  actions: {
    setCameraMode(mode: GameSettings['camera']['mode']) {
      this.settings.camera.mode = mode;
    },
    setFollowDistance(d: number) {
      this.settings.camera.followDistance = d;
    },
    setQuality(q: GameSettings['graphics']['quality']) {
      this.settings.graphics = { ...DEFAULT_SETTINGS.graphics, quality: q };
    },
  },
});