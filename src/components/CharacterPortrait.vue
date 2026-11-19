<script setup lang="ts">
/**
 * Code-drawn bust portraits for the storybook UI. Built from layered SVG shapes
 * so the game ships no external illustration assets, matching DESIGN.md §6.
 */
import { computed } from 'vue'

type PortraitKind = 'traveler' | 'mika' | 'elder' | 'elderWoman' | 'child' | 'maiden' | 'farmer'

const props = withDefaults(defineProps<{ kind?: PortraitKind }>(), { kind: 'traveler' })

const palette = computed(() => {
  switch (props.kind) {
    case 'mika':
      return { skin: '#f0c39c', skinShade: '#dca77f', hair: '#33262a', hairLight: '#52404a', cloth: '#a63f4d', clothDark: '#7d2d3a', trim: '#f6ead2', accent: '#f2a3b8', eye: '#4a2f2a' }
    case 'elder':
      return { skin: '#e6b994', skinShade: '#c99874', hair: '#d8d3c9', hairLight: '#f4f0e6', cloth: '#3d4a42', clothDark: '#28332d', trim: '#4f7391', accent: '#b9c3b5', eye: '#4a3a2e' }
    case 'elderWoman':
      return { skin: '#e8bd99', skinShade: '#c99a76', hair: '#cfc9c2', hairLight: '#efeae2', cloth: '#6b4a70', clothDark: '#4b324f', trim: '#d9c3d6', accent: '#e7b6c6', eye: '#4a332e' }
    case 'child':
      return { skin: '#f1c7a6', skinShade: '#dcaa86', hair: '#3b2c27', hairLight: '#5b453b', cloth: '#3f8c80', clothDark: '#2c665d', trim: '#f2e4c8', accent: '#f4cf7a', eye: '#3f2b25' }
    case 'maiden':
      return { skin: '#efc3a1', skinShade: '#d9a582', hair: '#2e2523', hairLight: '#4d3b36', cloth: '#5f8652', clothDark: '#405f38', trim: '#f4ecd6', accent: '#f0a6bb', eye: '#402c26' }
    case 'farmer':
      return { skin: '#dfae87', skinShade: '#bf906d', hair: '#4a382c', hairLight: '#6b5240', cloth: '#8a6a42', clothDark: '#5e462b', trim: '#5a7c9a', accent: '#e3c27e', eye: '#433026' }
    default:
      return { skin: '#edc09a', skinShade: '#d3a077', hair: '#3a2b26', hairLight: '#5c463b', cloth: '#e6d4ac', clothDark: '#c3a97c', trim: '#8a5a3b', accent: '#f2a3b8', eye: '#4a332a' }
  }
})

const uid = `portrait-${props.kind}`
</script>

<template>
  <svg class="character-portrait" viewBox="0 0 240 290" preserveAspectRatio="xMidYMid slice" role="img" :aria-label="`Portrait of ${kind}`">
    <defs>
      <linearGradient :id="`${uid}-skin`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="palette.skin" />
        <stop offset="100%" :stop-color="palette.skinShade" />
      </linearGradient>
      <linearGradient :id="`${uid}-hair`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" :stop-color="palette.hairLight" />
        <stop offset="100%" :stop-color="palette.hair" />
      </linearGradient>
      <linearGradient :id="`${uid}-cloth`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="palette.cloth" />
        <stop offset="100%" :stop-color="palette.clothDark" />
      </linearGradient>
      <radialGradient :id="`${uid}-glow`" cx="50%" cy="42%" r="62%">
        <stop offset="0%" stop-color="#fff8e8" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#fff8e8" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- warm storybook halo -->
    <circle cx="120" cy="120" r="118" :fill="`url(#${uid}-glow)`" />

    <!-- shoulders / garment -->
    <path
      d="M24 290 C24 226 62 196 100 188 L140 188 C178 196 216 226 216 290 Z"
      :fill="`url(#${uid}-cloth)`"
    />

    <!-- traveler tunic lacing / kimono collar -->
    <template v-if="kind === 'mika' || kind === 'elderWoman' || kind === 'maiden'">
      <path d="M100 188 L120 226 L89 268 L70 240 Z" :fill="palette.trim" />
      <path d="M140 188 L120 226 L151 268 L170 240 Z" :fill="palette.trim" />
      <path d="M120 226 L120 290" :stroke="palette.clothDark" stroke-width="3" />
      <circle cx="160" cy="252" r="4" :fill="palette.accent" opacity="0.8" />
      <circle cx="176" cy="268" r="3" :fill="palette.accent" opacity="0.7" />
      <circle cx="70" cy="262" r="3.5" :fill="palette.accent" opacity="0.7" />
    </template>
    <template v-else-if="kind === 'traveler'">
      <path d="M98 188 L120 232 L102 290 L82 290 L86 220 Z" :fill="palette.trim" opacity="0.55" />
      <path d="M142 188 L120 232 L138 290 L158 290 L154 220 Z" :fill="palette.trim" opacity="0.55" />
      <rect x="86" y="238" width="68" height="14" rx="7" :fill="palette.trim" />
    </template>
    <template v-else>
      <path d="M98 188 L120 226 L142 188 L134 290 L106 290 Z" :fill="palette.trim" opacity="0.5" />
    </template>

    <!-- neck -->
    <path d="M104 164 L136 164 L136 200 L104 200 Z" :fill="palette.skinShade" />

    <!-- back hair -->
    <path
      d="M56 108 C56 46 88 26 120 26 C152 26 184 46 184 108 L184 158 C184 182 168 196 150 196 L90 196 C72 196 56 182 56 158 Z"
      :fill="`url(#${uid}-hair)`"
    />

    <!-- face -->
    <path
      d="M120 52 C156 52 174 74 174 108 C174 146 152 178 120 178 C88 178 66 146 66 108 C66 74 84 52 120 52 Z"
      :fill="`url(#${uid}-skin)`"
    />
    <ellipse cx="64" cy="118" rx="9" ry="14" :fill="palette.skinShade" />
    <ellipse cx="176" cy="118" rx="9" ry="14" :fill="palette.skinShade" />

    <!-- cheeks -->
    <ellipse cx="88" cy="142" rx="14" ry="8" :fill="palette.accent" opacity="0.32" />
    <ellipse cx="152" cy="142" rx="14" ry="8" :fill="palette.accent" opacity="0.32" />

    <!-- eyes -->
    <g :fill="palette.eye">
      <path d="M82 116 Q94 104 108 116 Q94 126 82 116 Z" fill="#fffaf0" />
      <path d="M132 116 Q146 104 158 116 Q146 126 132 116 Z" fill="#fffaf0" />
      <ellipse cx="95" cy="116" rx="6.5" ry="7.5" />
      <ellipse cx="145" cy="116" rx="6.5" ry="7.5" />
    </g>
    <circle cx="97" cy="113" r="2.4" fill="#fff" />
    <circle cx="147" cy="113" r="2.4" fill="#fff" />
    <path d="M80 106 Q94 98 110 106" :stroke="palette.hair" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <path d="M130 106 Q146 98 160 106" :stroke="palette.hair" stroke-width="3.5" fill="none" stroke-linecap="round" />

    <!-- nose + smile -->
    <path d="M120 130 L117 140 L122 140" :stroke="palette.skinShade" stroke-width="2" fill="none" stroke-linecap="round" />
    <path d="M108 154 Q120 164 132 154" stroke="#9a5a52" stroke-width="2.5" fill="none" stroke-linecap="round" />

    <!-- front hair: variant silhouettes -->
    <template v-if="kind === 'mika' || kind === 'maiden' || kind === 'elderWoman'">
      <path
        :d="kind === 'elderWoman'
          ? 'M62 104 C60 50 92 34 120 34 C148 34 180 50 178 104 C166 82 150 70 134 68 C120 90 96 96 62 104 Z'
          : 'M62 108 C58 48 92 32 120 32 C150 32 182 50 178 108 C168 80 152 66 138 64 C124 92 96 100 62 108 Z'"
        :fill="`url(#${uid}-hair)`"
      />
      <path d="M150 60 C170 70 180 92 176 124 L166 116 C168 88 160 74 150 60 Z" :fill="palette.hair" />
    </template>
    <template v-else-if="kind === 'farmer'">
      <path d="M62 100 C62 58 90 42 120 42 C150 42 178 58 178 100 C162 78 140 70 120 70 C96 70 78 82 62 100 Z" :fill="`url(#${uid}-hair)`" />
    </template>
    <template v-else-if="kind === 'child'">
      <path d="M60 110 C56 52 90 34 120 34 C150 34 184 52 180 110 C170 80 152 62 138 60 C118 84 92 96 60 110 Z" :fill="`url(#${uid}-hair)`" />
      <circle cx="66" cy="78" r="16" :fill="palette.hair" />
      <circle cx="174" cy="78" r="16" :fill="palette.hair" />
    </template>
    <template v-else>
      <path
        d="M60 112 C56 48 92 30 120 30 C150 30 184 48 180 112 C170 86 154 72 138 70 C132 88 112 98 92 96 C78 94 68 100 60 112 Z"
        :fill="`url(#${uid}-hair)`"
      />
      <path d="M140 66 C162 72 176 92 172 126 L162 118 C164 92 156 76 140 66 Z" :fill="palette.hair" />
    </template>

    <!-- signature accessories -->
    <g v-if="kind === 'mika'" transform="translate(158 66)">
      <ellipse cx="0" cy="-9" rx="5" ry="9" :fill="palette.accent" />
      <ellipse cx="9" cy="0" rx="9" ry="5" :fill="palette.accent" />
      <ellipse cx="0" cy="9" rx="5" ry="9" :fill="palette.accent" />
      <ellipse cx="-9" cy="0" rx="9" ry="5" :fill="palette.accent" />
      <circle cx="0" cy="0" r="4" fill="#f6d27a" />
    </g>
    <g v-if="kind === 'farmer'">
      <ellipse cx="120" cy="62" rx="92" ry="20" :fill="palette.accent" />
      <path d="M78 60 Q120 20 162 60 Z" :fill="palette.accent" />
      <path d="M78 60 Q120 46 162 60" :stroke="palette.clothDark" stroke-width="4" fill="none" />
    </g>
    <g v-if="kind === 'maiden'">
      <path d="M62 108 Q70 132 78 150" :stroke="palette.hair" stroke-width="10" fill="none" stroke-linecap="round" />
    </g>
  </svg>
</template>

<style scoped>
.character-portrait {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>
