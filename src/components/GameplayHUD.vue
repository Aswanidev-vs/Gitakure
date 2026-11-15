<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  fps: number;
  drawCalls: number;
  timeOfDay: number;
  season: string;
  weather: string;
  cameraMode: string;
  prompt: string | null;
  characterGender: 'female' | 'male';
}>();

const emit = defineEmits<{
  toggleCamera: [];
  togglePause: [];
  openSettings: [];
  openInventory: [];
  openMap: [];
  returnToMenu: [];
}>();

// Formats 0..1 day fraction to 12-hour clock (e.g. 5:42 PM)
const formattedTime = computed(() => {
  const totalMinutes = Math.floor(props.timeOfDay * 24 * 60);
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const padMin = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${padMin} ${ampm}`;
});

const timeIcon = computed(() => {
  const t = props.timeOfDay;
  if (t >= 0.25 && t < 0.7) return '☀️';
  if (t >= 0.7 && t < 0.82) return '🌅';
  return '🌙';
});

const seasonLabel = computed(() => {
  const s = props.season;
  return s.charAt(0).toUpperCase() + s.slice(1);
});

const weatherLabel = computed(() => {
  const w = props.weather;
  if (w === 'clear') return 'Clear';
  if (w === 'lightRain' || w === 'heavyRain') return 'Rain';
  if (w === 'mist') return 'Mist';
  return 'Cloudy';
});
</script>

<template>
  <div class="gameplay-hud-root">
    <!-- ── 1. Top Left: Player Status Portrait & Vitals ───── -->
    <div class="player-status-card">
      <!-- Circular Avatar Frame -->
      <div class="avatar-circle">
        <!-- SVG Character Portrait matching Image 5 & 6 -->
        <svg v-if="characterGender === 'female'" class="avatar-art" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="38" fill="#fce4c8"/>
          <!-- Hair & Ponytail -->
          <circle cx="40" cy="38" r="28" fill="#2e2320"/>
          <ellipse cx="60" cy="32" rx="12" ry="16" fill="#2e2320"/>
          <!-- Face -->
          <circle cx="38" cy="42" r="20" fill="#fce4c8"/>
          <!-- Cheeks -->
          <circle cx="30" cy="48" r="4" fill="#f87171" opacity="0.4"/>
          <circle cx="46" cy="48" r="4" fill="#f87171" opacity="0.4"/>
          <!-- Eyes -->
          <circle cx="32" cy="42" r="3" fill="#271f1b"/>
          <circle cx="44" cy="42" r="3" fill="#271f1b"/>
          <!-- Smile -->
          <path d="M36 50 Q38 53 40 50" stroke="#b91c1c" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <!-- Sakura Clip -->
          <circle cx="54" cy="24" r="5" fill="#f472b6"/>
          <circle cx="54" cy="24" r="2" fill="#fde047"/>
        </svg>

        <svg v-else class="avatar-art" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="38" fill="#fce4c8"/>
          <!-- Spiky Hair -->
          <circle cx="40" cy="36" r="28" fill="#201c1c"/>
          <polygon points="20,24 30,12 36,26" fill="#201c1c"/>
          <polygon points="36,12 44,8 48,22" fill="#201c1c"/>
          <polygon points="46,12 56,16 54,28" fill="#201c1c"/>
          <!-- Face -->
          <circle cx="40" cy="44" r="21" fill="#fce4c8"/>
          <!-- Eyes -->
          <circle cx="34" cy="43" r="3.2" fill="#201c1c"/>
          <circle cx="46" cy="43" r="3.2" fill="#201c1c"/>
          <!-- Smile -->
          <path d="M37 51 Q40 54 43 51" stroke="#372f2a" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>

        <div class="level-badge">Lv. 1</div>
      </div>

      <!-- Health & Stamina Bars (Image 5 & 6) -->
      <div class="vitals-column">
        <!-- Health Bar -->
        <div class="vital-bar-track hp-track">
          <div class="vital-bar-fill hp-fill" style="width: 100%;"></div>
        </div>
        <!-- Stamina Bar -->
        <div class="vital-bar-track sp-track">
          <div class="vital-bar-fill sp-fill" style="width: 85%;"></div>
        </div>
      </div>
    </div>

    <!-- ── 2. Top Right: Time, Season & Circular Minimap ─── -->
    <div class="top-right-group">
      <!-- Time & Weather Widget (Image 6 & 7) -->
      <div class="time-weather-box">
        <span class="time-sun-icon">{{ timeIcon }}</span>
        <div class="time-details">
          <span class="clock-text">{{ formattedTime }}</span>
          <span class="season-text">🌸 {{ seasonLabel }} • {{ weatherLabel }}</span>
        </div>
      </div>

      <!-- Circular Minimap (Image 5, 6, 7) -->
      <div class="circular-minimap" @click="emit('openMap')">
        <!-- Minimap Compass N -->
        <span class="compass-n">N</span>
        <svg class="minimap-svg" viewBox="0 0 100 100">
          <!-- Green meadow terrain -->
          <circle cx="50" cy="50" r="48" fill="#7ba368"/>
          <!-- Winding River -->
          <path d="M 0 35 Q 30 55 50 48 T 100 65" stroke="#5b92b6" stroke-width="14" fill="none"/>
          <!-- Paths -->
          <path d="M 50 10 L 50 90" stroke="#d5be9b" stroke-width="5" stroke-dasharray="3 3"/>
          <path d="M 10 50 L 90 50" stroke="#d5be9b" stroke-width="5" stroke-dasharray="3 3"/>
          <!-- Trees -->
          <circle cx="28" cy="24" r="5" fill="#3b6933"/>
          <circle cx="72" cy="28" r="6" fill="#f472b6" opacity="0.9"/>
          <circle cx="25" cy="74" r="6" fill="#2d5828"/>
          <!-- Village cottage dots -->
          <rect x="62" y="60" width="10" height="9" rx="2" fill="#5c4431"/>
          <!-- Bridge icon -->
          <rect x="44" y="44" width="12" height="6" fill="#8c6442"/>
          <!-- Player center pin -->
          <circle cx="50" cy="50" r="5" fill="#ffffff" stroke="#e11d48" stroke-width="2.5"/>
          <polygon points="50,40 46,47 54,47" fill="#e11d48"/>
        </svg>
      </div>

      <!-- Objective Card (Image 6) -->
      <div class="objective-card">
        <span class="objective-title">🌸 A Peaceful Day</span>
        <span class="objective-desc">✦ Just enjoy the world...</span>
      </div>
    </div>

    <!-- ── 3. Bottom Center: Interaction Prompt ──────────── -->
    <div v-if="prompt" class="interaction-bubble">
      <kbd class="key-badge">E</kbd>
      <span class="prompt-text">{{ prompt }}</span>
    </div>

    <!-- ── 4. Bottom Right: Quick Item Hotbar & Navigation Buttons ── -->
    <div class="bottom-right-container">
      <!-- Hotbar (Image 5) -->
      <div class="hotbar-tray">
        <div class="hotbar-slot active">
          <span class="hotbar-icon">🪵</span>
          <span class="slot-num">1</span>
        </div>
        <div class="hotbar-slot">
          <span class="hotbar-icon">🏮</span>
          <span class="slot-num">2</span>
        </div>
        <div class="hotbar-slot">
          <span class="hotbar-icon">🌸</span>
          <span class="slot-num">3</span>
        </div>
        <div class="hotbar-slot">
          <span class="hotbar-icon">⛏️</span>
          <span class="slot-num">4</span>
        </div>
      </div>

      <!-- Quick Action Pills (Backpack / Map / Menu) -->
      <div class="quick-action-pills">
        <button class="circle-btn" type="button" title="Inventory (Tab)" @click="emit('openInventory')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </button>

        <button class="circle-btn" type="button" title="World Map (M)" @click="emit('openMap')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
            <line x1="9" x2="9" y1="3" y2="18"/>
            <line x1="15" x2="15" y1="6" y2="21"/>
          </svg>
        </button>

        <button class="circle-btn" type="button" title="Settings (Esc)" @click="emit('openSettings')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" x2="20" y1="12" y2="12"/>
            <line x1="4" x2="20" y1="6" y2="6"/>
            <line x1="4" x2="20" y1="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ── 5. Bottom Left: Control Hints ─────────────────── -->
    <div class="bottom-control-hints">
      <div class="hint-chip"><kbd>E</kbd> Interact</div>
      <div class="hint-chip" @click="emit('openInventory')"><kbd>Tab</kbd> Inventory</div>
      <div class="hint-chip" @click="emit('openMap')"><kbd>M</kbd> Map</div>
      <div class="hint-chip" @click="emit('toggleCamera')"><kbd>V</kbd> Camera</div>
      <div class="hint-chip" @click="emit('returnToMenu')"><kbd>Esc</kbd> Menu</div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

.gameplay-hud-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 24px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  user-select: none;
}

/* 1. Player Status Portrait & Vitals */
.player-status-card {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(22, 33, 29, 0.65);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  padding: 6px 18px 6px 6px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  width: fit-content;
}

.avatar-circle {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid #ecdcc8;
  overflow: visible;
}

.avatar-art {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
  background: #fce4c8;
}

.level-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #2e3b34;
  border: 1.5px solid #ecdcc8;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 700;
  border-radius: 9999px;
  padding: 1px 6px;
}

.vitals-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 110px;
}

.vital-bar-track {
  height: 9px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
}

.sp-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
}

/* 2. Top Right: Time, Minimap, Quest */
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
  background: rgba(22, 33, 29, 0.72);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 8px 16px;
  backdrop-filter: blur(10px);
  color: #ffffff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.time-sun-icon {
  font-size: 24px;
  line-height: 1;
}

.time-details {
  display: flex;
  flex-direction: column;
}

.clock-text {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.season-text {
  font-size: 11.5px;
  color: #d1fae5;
  font-weight: 500;
}

/* Minimap */
.circular-minimap {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 3px solid #f6eee3;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.circular-minimap:hover {
  transform: scale(1.06);
}

.compass-n {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10.5px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
  z-index: 2;
}

.minimap-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Objective Card (Image 6) */
.objective-card {
  background: rgba(22, 33, 29, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  padding: 8px 14px;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  text-align: right;
  color: #ffffff;
}

.objective-title {
  font-size: 13px;
  font-weight: 700;
  color: #fce7f3;
}

.objective-desc {
  font-size: 11.5px;
  color: #d1d5db;
  font-style: italic;
}

/* 3. Interaction Prompt */
.interaction-bubble {
  position: absolute;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  background: rgba(18, 28, 25, 0.85);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  backdrop-filter: blur(10px);
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  animation: pulseBubble 2s infinite ease-in-out;
}

@keyframes pulseBubble {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-3px); }
}

.key-badge {
  background: #f7eee2;
  color: #172328;
  font-weight: 800;
  font-size: 12px;
  border-radius: 6px;
  padding: 2px 7px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
}

/* 4. Bottom Right Hotbar & Quick Actions */
.bottom-right-container {
  position: absolute;
  right: 24px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  pointer-events: auto;
}

.hotbar-tray {
  display: flex;
  gap: 8px;
  background: rgba(22, 33, 29, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  padding: 6px 8px;
  backdrop-filter: blur(8px);
}

.hotbar-slot {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.hotbar-slot:hover, .hotbar-slot.active {
  background: rgba(255, 255, 255, 0.22);
  border-color: #f7eee2;
  transform: translateY(-2px);
}

.hotbar-icon {
  font-size: 20px;
}

.slot-num {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 9.5px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.75);
}

.quick-action-pills {
  display: flex;
  gap: 8px;
}

.circle-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(22, 33, 29, 0.75);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  color: #f7eee2;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.circle-btn:hover {
  background: rgba(38, 54, 48, 0.9);
  border-color: #ffffff;
  transform: translateY(-2px);
}

.circle-btn svg {
  width: 20px;
  height: 20px;
}

/* 5. Bottom Left Control Hints */
.bottom-control-hints {
  position: absolute;
  left: 24px;
  bottom: 24px;
  display: flex;
  gap: 8px;
  pointer-events: auto;
  flex-wrap: wrap;
}

.hint-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(22, 33, 29, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  color: #e5e7eb;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background 0.2s;
}

.hint-chip:hover {
  background: rgba(38, 54, 48, 0.85);
}

.hint-chip kbd {
  background: #ffffff;
  color: #172328;
  font-weight: 700;
  font-size: 10px;
  border-radius: 4px;
  padding: 1px 5px;
}

@media (max-width: 768px) {
  .top-right-group {
    scale: 0.85;
    transform-origin: top right;
  }
  .hotbar-tray {
    display: none;
  }
}
</style>
