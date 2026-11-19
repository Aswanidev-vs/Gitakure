<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  open: boolean;
  playerX?: number;
  playerZ?: number;
}>();

const emit = defineEmits<{ close: [] }>();

const zoomLevel = ref(1);

function toggleZoom() {
  zoomLevel.value = zoomLevel.value === 1 ? 1.35 : 1;
}
</script>

<template>
  <div v-if="open" class="map-backdrop" @click.self="emit('close')">
    <div class="parchment-map-card" role="dialog" aria-modal="true" aria-label="World Map">
      <!-- Top Left Tag (Image 9) -->
      <div class="map-badge">
        <span>World Map</span>
      </div>

      <!-- Close Button -->
      <button class="close-map-btn" type="button" aria-label="Close Map" @click="emit('close')">✕</button>

      <!-- Location Info Card Top Right (Image 9) -->
      <div class="location-card">
        <div class="loc-header">
          <span class="loc-icon">📷</span>
          <span class="loc-title">Your Village</span>
        </div>
        <p class="loc-desc">🚶 A peaceful place to rest.</p>
      </div>

      <!-- Illustrated Map Canvas / Vector Art matching Image 9 -->
      <div class="map-viewport" :style="{ transform: `scale(${zoomLevel})` }">
        <svg class="illustrated-map" viewBox="0 0 800 520" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Meadow Base Texture -->
          <rect width="800" height="520" fill="#99b87b"/>

          <!-- Distant Hills & Contours -->
          <path d="M0 80 Q 200 30 400 90 T 800 60 L 800 0 L 0 0 Z" fill="#759c5d" opacity="0.6"/>
          <path d="M0 130 Q 300 70 550 140 T 800 110 L 800 0 L 0 0 Z" fill="#84aa68" opacity="0.5"/>

          <!-- Rice Paddies / Farmland in Lower Left (Image 9) -->
          <g class="rice-paddies" fill="#d2b86f" stroke="#a38843" stroke-width="2">
            <polygon points="60,420 180,400 240,460 110,500"/>
            <polygon points="190,395 300,380 340,440 250,455"/>
            <polygon points="255,465 345,450 375,510 270,515"/>
            <!-- Paddy gridlines -->
            <line x1="80" y1="450" x2="220" y2="430" stroke="#bfa353" stroke-dasharray="4 4"/>
            <line x1="130" y1="415" x2="160" y2="485" stroke="#bfa353" stroke-dasharray="4 4"/>
            <line x1="210" y1="400" x2="290" y2="445" stroke="#bfa353" stroke-dasharray="4 4"/>
          </g>

          <!-- Rice Paddies in Lower Right -->
          <g class="rice-paddies-right" fill="#cbb269" stroke="#9a813d" stroke-width="2">
            <polygon points="500,430 640,410 680,480 530,500"/>
            <polygon points="650,415 760,400 790,470 690,480"/>
            <line x1="520" y1="465" x2="660" y2="445" stroke="#b99e4b" stroke-dasharray="4 4"/>
          </g>

          <!-- Winding River System (Image 9) -->
          <!-- Main river winding from upper center into lower left & right -->
          <path
            d="M 440 0 C 430 70 380 110 320 130 C 230 160 170 210 210 280 C 240 330 200 400 120 420 L 0 450 L 0 490 L 150 460 C 250 430 300 370 260 300 C 240 260 280 220 360 200 C 440 180 500 240 560 290 C 620 340 710 370 800 380 L 800 340 C 720 330 650 300 590 260 C 530 210 490 140 480 0 Z"
            fill="#579bb8"
            stroke="#3f7e9a"
            stroke-width="3"
          />

          <!-- River Shimmer Ripples -->
          <path d="M 230 170 Q 250 165 270 170" stroke="#a3d5ec" stroke-width="2" stroke-linecap="round"/>
          <path d="M 190 240 Q 210 235 220 242" stroke="#a3d5ec" stroke-width="2" stroke-linecap="round"/>
          <path d="M 330 220 Q 360 215 380 220" stroke="#a3d5ec" stroke-width="2" stroke-linecap="round"/>
          <path d="M 620 320 Q 650 315 670 322" stroke="#a3d5ec" stroke-width="2" stroke-linecap="round"/>

          <!-- Village Dirt Paths (Image 9) -->
          <g stroke="#dfcbb0" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
            <!-- Road from river across bridge to village -->
            <path d="M 290 230 L 370 240 L 440 280 L 520 290 L 630 320 L 740 340"/>
            <path d="M 370 240 L 410 190 L 460 180 L 520 210"/>
            <path d="M 440 280 L 430 350 L 480 390 L 580 410"/>
            <path d="M 460 180 L 530 140 L 610 150"/>
            <path d="M 520 290 L 550 340 L 640 360"/>
          </g>

          <!-- Bridges over the river (Image 9) -->
          <g class="bridges">
            <!-- Main arched bridge -->
            <rect x="330" y="210" width="36" height="16" rx="3" fill="#6d472c" stroke="#3b2313" stroke-width="2" transform="rotate(-15 330 210)"/>
            <line x1="332" y1="214" x2="364" y2="206" stroke="#b88358" stroke-width="2"/>
            <!-- Lower river bridge -->
            <rect x="520" y="390" width="34" height="14" rx="3" fill="#6d472c" stroke="#3b2313" stroke-width="2" transform="rotate(35 520 390)"/>
          </g>

          <!-- Forest Tree Clusters (Pines, Palms, Sakuras) -->
          <!-- Upper forest -->
          <g class="forest-trees">
            <circle cx="140" cy="110" r="18" fill="#3e6b36"/>
            <circle cx="165" cy="95" r="22" fill="#2d5227"/>
            <circle cx="195" cy="120" r="16" fill="#3e6b36"/>
            <circle cx="230" cy="85" r="20" fill="#2d5227"/>

            <!-- Sakura cherry blossoms (pink blobs) -->
            <circle cx="310" cy="90" r="18" fill="#f472b6" opacity="0.95"/>
            <circle cx="330" cy="80" r="14" fill="#fbcfe8"/>
            <circle cx="680" cy="140" r="22" fill="#f472b6" opacity="0.95"/>
            <circle cx="700" cy="125" r="16" fill="#fbcfe8"/>

            <!-- Palms & lush trees -->
            <circle cx="380" cy="330" r="19" fill="#3b6b33"/>
            <circle cx="410" cy="345" r="23" fill="#2a5024"/>
            <circle cx="580" cy="230" r="22" fill="#335f2c"/>
            <circle cx="610" cy="250" r="18" fill="#447a3a"/>
            <circle cx="640" cy="225" r="24" fill="#284e23"/>
            <circle cx="690" cy="260" r="20" fill="#3b6b33"/>

            <!-- Riverbank trees -->
            <circle cx="90" cy="340" r="20" fill="#2c5325"/>
            <circle cx="130" cy="360" r="17" fill="#3e6c35"/>
          </g>

          <!-- Points of Interest Icons (Image 9) -->
          <!-- 1. Village Houses (Icons) -->
          <!-- Central large house / hall -->
          <g transform="translate(440, 160)">
            <rect x="-18" y="-12" width="36" height="24" rx="4" fill="#5c432d" stroke="#2a1d13" stroke-width="2"/>
            <path d="M-24 -10 L0 -24 L24 -10 Z" fill="#3f2e21"/>
            <rect x="-6" y="-4" width="12" height="14" fill="#fde047" opacity="0.9"/>
          </g>

          <!-- Village House 2 -->
          <g transform="translate(510, 275)">
            <rect x="-14" y="-10" width="28" height="20" rx="3" fill="#5c432d" stroke="#2a1d13" stroke-width="2"/>
            <path d="M-18 -8 L0 -20 L18 -8 Z" fill="#3f2e21"/>
            <rect x="-4" y="-2" width="8" height="10" fill="#fde047" opacity="0.9"/>
          </g>

          <!-- Village House 3 (Left) -->
          <g transform="translate(170, 310)">
            <rect x="-14" y="-10" width="28" height="20" rx="3" fill="#5c432d" stroke="#2a1d13" stroke-width="2"/>
            <path d="M-18 -8 L0 -20 L18 -8 Z" fill="#3f2e21"/>
            <rect x="-4" y="-2" width="8" height="10" fill="#fde047" opacity="0.9"/>
          </g>

          <!-- 2. Shrine Torii Gate (Icon) -->
          <g transform="translate(730, 360)">
            <circle cx="0" cy="0" r="14" fill="#2e2722" stroke="#ecdcc8" stroke-width="1.5"/>
            <path d="M-8 -6 H8 M-7 -2 H7 M-4 -6 V7 M4 -6 V7" stroke="#e11d48" stroke-width="2" stroke-linecap="round"/>
          </g>

          <!-- 3. Campfire Spot (Icon) -->
          <g transform="translate(350, 130)">
            <circle cx="0" cy="0" r="14" fill="#2e2722" stroke="#ecdcc8" stroke-width="1.5"/>
            <path d="M-6 4 L6 4 M-4 6 L4 2" stroke="#a16207" stroke-width="2.5"/>
            <path d="M0 -6 Q 5 0 0 3 Q -5 0 0 -6 Z" fill="#ea580c"/>
          </g>

          <!-- 4. Player Marker Pin (Active Position) -->
          <g transform="translate(460, 240)" class="player-map-pin">
            <!-- Pulsing outer circle -->
            <circle cx="0" cy="0" r="16" fill="rgba(225, 29, 72, 0.25)" class="pin-pulse"/>
            <!-- White pill badge with red navigation arrow -->
            <circle cx="0" cy="0" r="9" fill="#ffffff" stroke="#be123c" stroke-width="2.5"/>
            <polygon points="0,-6 -4,3 4,3" fill="#be123c"/>
          </g>
        </svg>
      </div>

      <!-- Bottom Control Actions (Image 9) -->
      <div class="map-actions-bar">
        <button class="map-action-btn" type="button" @click="toggleZoom">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          <span>{{ zoomLevel === 1 ? 'Zoom In' : 'Reset Zoom' }}</span>
        </button>

        <button class="map-action-btn" type="button" @click="emit('close')">
          <kbd>Esc</kbd>
          <span>Close</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 16, 14, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 480;
  padding: 20px;
  user-select: none;
  font-family: 'Zen Kaku Gothic New', system-ui, sans-serif;
}

/* Parchment Map Card Container (Image 9) */
.parchment-map-card {
  position: relative;
  width: min(860px, 94vw);
  background: #f4ecdc;
  border: 4px solid #ddcca8;
  border-radius: 22px;
  overflow: hidden;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.65),
    inset 0 0 32px rgba(214, 188, 150, 0.4);
  animation: popIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Header Tag (Image 9: "World Map" in top left dark pill) */
.map-badge {
  position: absolute;
  top: 18px;
  left: 20px;
  z-index: 10;
  background: rgba(26, 36, 31, 0.85);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  border-radius: 9999px;
  padding: 6px 18px;
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.close-map-btn {
  position: absolute;
  top: 18px;
  right: 20px;
  z-index: 10;
  background: rgba(26, 36, 31, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 34px;
  height: 34px;
  color: #ffffff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-map-btn:hover {
  background: rgba(26, 36, 31, 1);
  transform: scale(1.08);
}

/* Location Card Top Right (Image 9) */
.location-card {
  position: absolute;
  top: 18px;
  right: 68px;
  z-index: 10;
  background: #fcf6eb;
  border: 2px solid #dfcfb8;
  border-radius: 14px;
  padding: 10px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.loc-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loc-icon {
  font-size: 16px;
}

.loc-title {
  font-size: 14px;
  font-weight: 700;
  color: #271e17;
}

.loc-desc {
  font-size: 11.5px;
  color: #635343;
  margin: 2px 0 0 24px;
}

/* Map Viewport & SVG */
.map-viewport {
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.illustrated-map {
  width: 100%;
  height: 100%;
  display: block;
}

.player-map-pin .pin-pulse {
  animation: pulsePin 1.8s infinite ease-out;
}

@keyframes pulsePin {
  0% { r: 9; opacity: 0.8; }
  100% { r: 24; opacity: 0; }
}

/* Bottom Action Bar (Image 9) */
.map-actions-bar {
  position: absolute;
  bottom: 18px;
  right: 20px;
  z-index: 10;
  display: flex;
  gap: 10px;
}

.map-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(30, 40, 35, 0.85);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  padding: 6px 14px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.map-action-btn:hover {
  background: rgba(45, 60, 52, 0.95);
  transform: translateY(-1px);
}

.map-action-btn svg {
  width: 15px;
  height: 15px;
}

.map-action-btn kbd {
  background: #ffffff;
  color: #172328;
  font-size: 10px;
  font-weight: 800;
  border-radius: 4px;
  padding: 1px 5px;
}
</style>
