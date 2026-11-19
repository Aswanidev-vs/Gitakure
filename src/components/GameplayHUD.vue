<script setup lang="ts">
import { computed } from 'vue'
import CharacterPortrait from './CharacterPortrait.vue'
import ItemGlyph, { type InventoryIcon } from './ItemGlyph.vue'

const props = defineProps<{
  fps: number;
  drawCalls: number;
  timeOfDay: number;
  day: number;
  season: string;
  weather: string;
  cameraMode: string;
  prompt: string | null;
  characterGender: 'female' | 'male';
}>()

const emit = defineEmits<{
  toggleCamera: [];
  togglePause: [];
  openSettings: [];
  openInventory: [];
  openMap: [];
  returnToMenu: [];
}>()

const formattedTime = computed(() => {
  const totalMinutes = Math.floor(props.timeOfDay * 24 * 60)
  let hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${hours}:${minutes < 10 ? `0${minutes}` : minutes} ${ampm}`
})

const isDay = computed(() => props.timeOfDay >= 0.25 && props.timeOfDay < 0.7)
const isDusk = computed(() => props.timeOfDay >= 0.7 && props.timeOfDay < 0.82)

const seasonLabel = computed(() => props.season.charAt(0).toUpperCase() + props.season.slice(1))

const weatherLabel = computed(() => {
  const w = props.weather
  if (w === 'clear') return 'Sunny Day'
  if (w === 'lightRain' || w === 'heavyRain') return 'Rainy Day'
  if (w === 'mist') return 'Misty'
  return 'Cloudy'
})

const hotbar: { kind: InventoryIcon; label: string }[] = [
  { kind: 'wood', label: 'Firewood' },
  { kind: 'lantern', label: 'Lantern' },
  { kind: 'flower', label: 'Blossom' },
  { kind: 'pickaxe', label: 'Pickaxe' },
]
</script>

<template>
  <div class="gameplay-hud-root">
    <!-- 1. Top left: portrait + vitals -->
    <div class="player-status-card">
      <div class="avatar-circle">
        <CharacterPortrait :kind="characterGender === 'female' ? 'mika' : 'traveler'" class="avatar-art" />
        <div class="level-badge">Lv. 1</div>
      </div>
      <div class="vitals-column">
        <div class="vital-row">
          <span class="vital-mark hp-mark" aria-hidden="true"></span>
          <div class="vital-bar-track"><div class="vital-bar-fill hp-fill" style="width: 100%;"></div></div>
        </div>
        <div class="vital-row">
          <span class="vital-mark sp-mark" aria-hidden="true"></span>
          <div class="vital-bar-track"><div class="vital-bar-fill sp-fill" style="width: 85%;"></div></div>
        </div>
      </div>
    </div>

    <!-- 2. Top right: clock, weather, compass -->
    <div class="top-right-group">
      <div class="time-weather-box">
        <svg v-if="isDay" class="time-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" fill="#f2c25c" />
          <g stroke="#f2c25c" stroke-width="1.6" stroke-linecap="round">
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
          </g>
        </svg>
        <svg v-else-if="isDusk" class="time-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 17h18" stroke="#e9a45a" stroke-width="1.8" stroke-linecap="round" />
          <path d="M6 17a6 6 0 0 1 12 0" fill="#e9a45a" opacity="0.8" />
          <path d="M12 4v2M4.5 8l1.6 1.4M19.5 8l-1.6 1.4" stroke="#e9a45a" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <svg v-else class="time-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" fill="#cfd8e8" />
        </svg>
        <div class="time-details">
          <span class="clock-text">{{ formattedTime }}</span>
          <span class="weather-text">{{ weatherLabel }} · {{ seasonLabel }}</span>
          <span class="day-text">Day {{ day }}</span>
        </div>
      </div>

      <!-- Circular compass minimap -->
      <div class="circular-minimap" title="Open world map" @click="emit('openMap')">
        <span class="compass compass-n">N</span>
        <span class="compass compass-e">E</span>
        <span class="compass compass-s">S</span>
        <span class="compass compass-w">W</span>
        <svg class="minimap-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#8aa870" />
          <path d="M0 34 Q30 54 50 47 T100 64" stroke="#6b9fb8" stroke-width="13" fill="none" />
          <path d="M50 8 L50 92" stroke="#dcc6a2" stroke-width="4" stroke-dasharray="3 3" />
          <path d="M12 50 L88 50" stroke="#dcc6a2" stroke-width="4" stroke-dasharray="3 3" />
          <circle cx="28" cy="24" r="5" fill="#4a7a42" />
          <circle cx="72" cy="27" r="6" fill="#f2aac4" />
          <circle cx="24" cy="74" r="6" fill="#3d6c36" />
          <rect x="61" y="60" width="10" height="9" rx="2" fill="#6b4c34" />
          <rect x="44" y="44" width="12" height="6" fill="#9a724c" />
          <circle cx="50" cy="50" r="5" fill="#fffaf0" stroke="#b75e4b" stroke-width="2.5" />
          <polygon points="50,40 46,47 54,47" fill="#b75e4b" />
        </svg>
      </div>
    </div>

    <!-- 3. Bottom left: interaction prompt -->
    <div v-if="prompt" class="interaction-bubble">
      <kbd class="key-badge">F</kbd>
      <span class="prompt-text">{{ prompt }}</span>
    </div>

    <!-- 4. Bottom center: hotbar -->
    <div class="hotbar-tray">
      <div
        v-for="(slot, index) in hotbar"
        :key="slot.kind"
        :class="['hotbar-slot', { active: index === 0 }]"
        :title="slot.label"
      >
        <ItemGlyph :kind="slot.kind" class="hotbar-icon" />
        <span class="slot-num">{{ index + 1 }}</span>
      </div>
    </div>

    <!-- 5. Bottom right: navigation actions -->
    <div class="quick-actions">
      <button class="action-btn" type="button" title="World Map (M)" @click="emit('openMap')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="m15 9-2 4-4 2 2-4 4-2Z" />
        </svg>
        <span>Journal</span>
      </button>
      <button class="action-btn" type="button" title="Inventory (Tab)" @click="emit('openInventory')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 8h14l-1 12H6L5 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
        <span>Inventory</span>
      </button>
      <button class="action-btn" type="button" title="Settings (Esc)" @click="emit('openSettings')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <span>Menu</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.gameplay-hud-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  font-family: 'Zen Kaku Gothic New', system-ui, sans-serif;
  color: #f8edda;
  user-select: none;
}

/* Shared warm, contrast-safe chip */
.player-status-card,
.time-weather-box,
.interaction-bubble,
.hotbar-tray,
.action-btn {
  background: rgba(32, 24, 19, 0.78);
  border: 1px solid rgba(246, 232, 208, 0.26);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 244, 222, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.player-status-card {
  pointer-events: auto;
  position: absolute;
  top: 20px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 12px;
  padding: 7px 16px 7px 7px;
}

.avatar-circle {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid #ecdcc8;
  overflow: hidden;
  background: #efd9bb;
  flex-shrink: 0;
}

.avatar-art {
  width: 100%;
  height: 148%;
  transform: translateY(-16%);
}

.level-badge {
  position: absolute;
  bottom: 0;
  right: -2px;
  background: #3b2c20;
  border: 1px solid #ecdcc8;
  color: #fbf1df;
  font-size: 10px;
  font-weight: 700;
  border-radius: 6px;
  padding: 1px 5px;
}

.vitals-column {
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 116px;
}

.vital-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.vital-mark {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.hp-mark { background: #7baa70; }
.sp-mark { background: #d6923e; }

.vital-bar-track {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  overflow: hidden;
}

.hp-fill, .sp-fill { height: 100%; }
.hp-fill { background: #6f9a6a; }
.sp-fill { background: #d6923e; }

.top-right-group {
  position: absolute;
  top: 20px;
  right: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  pointer-events: auto;
}

.time-weather-box {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  padding: 8px 14px;
}

.time-icon {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}

.time-details { display: flex; flex-direction: column; }

.clock-text {
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.3px;
}

.weather-text {
  font-size: 11px;
  color: #d7c3a2;
  margin-top: 2px;
}

.day-text {
  font-size: 10.5px;
  color: #d6923e;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  margin-top: 1px;
}

.circular-minimap {
  position: relative;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  border: 3px solid #f2e7d2;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.circular-minimap:hover { transform: scale(1.05); }

.compass {
  position: absolute;
  z-index: 2;
  font-size: 9px;
  font-weight: 700;
  color: #fffaf0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
}

.compass-n { top: 3px; left: 50%; transform: translateX(-50%); }
.compass-s { bottom: 3px; left: 50%; transform: translateX(-50%); }
.compass-e { right: 4px; top: 50%; transform: translateY(-50%); }
.compass-w { left: 4px; top: 50%; transform: translateY(-50%); }

.minimap-svg { width: 100%; height: 100%; display: block; }

.interaction-bubble {
  pointer-events: auto;
  position: absolute;
  left: 24px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 500;
}

.key-badge {
  background: #f7eee2;
  color: #2b211a;
  font-weight: 700;
  font-size: 12px;
  border-radius: 5px;
  padding: 2px 7px;
  font-family: inherit;
}

.hotbar-tray {
  pointer-events: auto;
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  border-radius: 12px;
  padding: 6px;
}

.hotbar-slot {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: rgba(255, 248, 232, 0.08);
  border: 1px solid rgba(246, 232, 208, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0dcbb;
  transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.hotbar-slot:hover,
.hotbar-slot.active {
  background: rgba(214, 146, 62, 0.32);
  border-color: #d6923e;
  transform: translateY(-2px);
  color: #fff2d9;
}

.hotbar-icon { width: 24px; height: 24px; }

.slot-num {
  position: absolute;
  bottom: 1px;
  right: 4px;
  font-size: 9px;
  font-weight: 700;
  color: rgba(248, 237, 218, 0.7);
  font-variant-numeric: tabular-nums;
}

.quick-actions {
  pointer-events: auto;
  position: absolute;
  right: 24px;
  bottom: 20px;
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  padding: 9px 11px;
  color: #f4e7d2;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.action-btn:hover {
  background: rgba(60, 44, 33, 0.92);
  color: #fff6e6;
}

.action-btn svg { width: 16px; height: 16px; }

@media (max-width: 768px) {
  .player-status-card { top: 12px; left: 12px; }
  .top-right-group { top: 12px; right: 12px; transform: scale(0.86); transform-origin: top right; }
  .hotbar-tray { bottom: 12px; padding: 4px; }
  .hotbar-slot { width: 38px; height: 38px; }
  .quick-actions { right: 12px; bottom: 12px; }
  .action-btn span { display: none; }
  .action-btn { padding: 10px; }
}
</style>
