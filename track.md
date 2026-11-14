# Gitakure — Master Build Tracker

Live record of what is built, how it was verified, and architecture status according to the Master Game Development Prompt.

Status legend: `[x]` done and verified · `[~]` in progress · `[ ]` not started · `[!]` blocked

---

## Architecture & Technology Stack `[x]`

| Requirement | Implementation | Evidence |
|---|---|---|
| **Frontend Framework** | Vue 3 | `src/ui/App.vue`, `src/main.ts` |
| **State Management** | Pinia | `src/state/pinia-store.ts` |
| **Game Engine** | Phaser 4 (v4.2.1) | `src/game/phaser-game.ts`, `src/game/scenes/IsoValleyScene.ts` |
| **Language & Bundler** | TypeScript + Vite + Bun | `tsconfig.json`, `vite.config.ts`, `bun.lock` |
| **Local Persistence** | IndexedDB via Dexie.js | `src/storage/db.ts` |
| **Decoupled Bridge** | `gameBridge` | `src/bridge/game-bridge.ts` |

---

## 1. Core Philosophy & Barakamon Emotional Resonance `[x]`

- `[x]` **Zero Pressure Oath**: No energy meters, no forced farming, no crop death, no streaks.
- `[x]` **Peaceful Sitting Experience**: Player can sit on river logs, veranda benches, or grass (`C` key or button) with idle breathing and sound.
- `[x]` **Atmospheric Campfire**: Riverside campfire with animated flame flicker, warm light aura, and procedural crackle audio.
- `[x]` **Barakamon Rural Warmth**: NPCs with unhurried routines (Master Ren the calligrapher, Devaki Amma on the porch, Appu watching kingfishers).

---

## 2. World Concept — Cohesive Japanese & Kerala Countryside `[x]`

- `[x]` **Japanese Architecture & Flora**:
  - Traditional wooden tea house with tiled roof
  - Sacred Shinto Torii shrine gate
  - Bamboo forest grove & pink Sakura cherry blossom trees
  - Stepping stone garden pathways
- `[x]` **Kerala Countryside & Backwaters**:
  - Traditional clay-tiled *Tharavadu / Nalukettu* house
  - Coconut palm trees & broadleaf banana plants
  - Flowing backwater canal with stepped ghats
  - Moored wooden country boat (*Kettuvallam / Vallam*) with rocking water animation
  - Paddy field terraces along the canal

---

## 3. Isometric Pixel Art Projection `[x]`

- `[x]` **Fixed 2:1 Isometric Projection**: `src/game/camera/isometric.ts` (64×32 diamond grid).
- `[x]` **Isometric Depth Sorting**: Objects sorted by `(gridX + gridY) * 10 + layer` so nearer elements occlude further ones.
- `[x]` **Smooth Isometric Movement**: WASD / Arrow keys 4-way diagonal traversal, Shift for calm run.
- `[x]` **Crisp Nearest-Neighbour Scaling**: `pixelArt: true`, `roundPixels: true`.

---

## 4. Seasonal System & Local Real-Time Synchronization `[x]`

- `[x]` **Hybrid Seasons**: Spring, Monsoon (Kerala rainy season), Autumn, Cool Winter.
- `[x]` **Local Real-Time Sync**: Sunlight, golden dusk, and night starry ambient overlays track player's local clock automatically.
- `[x]` **Atmospheric Weather**: Falling cherry blossoms, monsoon rain drifts, and evening canal fireflies.

---

## 5. GitHub History Interpreter — Gradual & Pressure-Free `[x]`

- `[x]` **Interpreter System**: `src/github/interpreter/github-interpreter.ts`.
- `[x]` **Gradual Discovery**: Normalizes history into 2-3 meaningful keepsakes (First Seed, River Lantern, Language Scrolls) rather than dumping 100 buildings.
- `[x]` **Zero-Commit Celebration**: 0 commits / resting periods rewarded with "Quiet Solitude" journal entry.
- `[x]` **Offline Tranquility Presets**: Full offline mode with instant peaceful presets.
- `[x]` **Privacy Guarantee**: 100% client-side, read-only public data, no tokens stored, disconnect & clear button in Settings.

---

## 6. Procedural Web Audio Soundscapes `[x]`

- `[x]` **Layered Soundscapes**: `src/game/audio/soundscapes.ts`.
- `[x]` **Channel 1 (Ambience)**: Flowing canal water, wind through palms, rain, night crickets.
- `[x]` **Channel 2 (Campfire)**: Crackling timber pops and embers.
- `[x]` **Channel 3 (Peaceful Chimes)**: Procedural Japanese Koto (Hirajoshi) & Kerala temple (Mohanam) pentatonic bells.
- `[x]` **Channel 4 (SFX)**: Footsteps varied by terrain (grass, stone, wood, water), sitting rustle.
- `[x]` **Volume Sliders**: Independent controls for Master, Ambience, and SFX in Settings.

---

## 7. Phase 2: World Polish `[x]`

- `[x]` **True Isometric NPC Wandering**: Master Ren, Devaki Amma, Appu, Kuro the Cat, and White Heron stroll within wander radius and pause.
- `[x]` **Seasonal & Dynamic Weather Particle System**: Reacts to weather/season with cherry blossoms, rain, winter snow, and night fireflies.
- `[x]` **Terrain-Aware Footsteps**: Differentiated acoustic response for wood bridge, veranda, stone shrine path, water splash, and grass.
- `[x]` **Campfire Embers & Sitting Glow**: Rising spark particles, warm ambient tint on player when resting by the fire.
- `[x]` **Gentle Wind Through Trees**: Organic swaying sinusoidal tweens across all coconut palms, sakura, bamboo, and banana plants.
- `[x]` **Canal Water Shimmer & Expanding Ripples**: Shimmering water tiles and gentle expanding water ring animations.
