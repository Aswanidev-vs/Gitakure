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

---

## 8. Phase 3: Life & Interaction `[x]`

- `[x]` **Peaceful Canal Fishing Mechanic**: Cast line near backwater canal (`F` key or dock button), bobber water ripples, catch tranquil keepsakes (Silver Mussel, Canal Jade, Golden Carp, Blue Lotus) stored to Dexie.
- `[x]` **Forageable Valley Keepsakes**: Floating collectible nodes across the valley (Wild Bamboo Shoot, Sacred Torii Ribbon, Golden Nendran Banana, Fragrant Jasmine) with proximity prompts and journal recording.
- `[x]` **Living Wildlife Simulation**: Sinuous swimming fish in backwater canal, fluttering swallowtail butterflies over gardens, calm white heron fishing.
- `[x]` **Time-of-Day Contextual NPC Dialogue**: Dialogue text for Master Ren, Devaki Amma, and Appu dynamically adapts to Dawn, Morning, Noon, Dusk, and Night.
- `[x]` **Dynamic Interaction Prompts & Tranquility Dock**: Floating visual prompt pills (`[E] Collect Jasmine`, `[E] Talk with Devaki Amma`, `[F] Cast Line`) and bottom dock for Sit, Fish, Journal, and Shrine.

---

## 9. Phase 4: GitHub Integration Enhancement `[x]`

- `[x]` **IndexedDB GameState Persistence**: Persistent retention of connected GitHub account across browser sessions in Dexie `gameState`.
- `[x]` **Incremental Discovery Logic**: Re-connecting only unlocks and notifies genuinely new discoveries, preserving existing ones with quiet harmony.
- `[x]` **Graceful Rate-Limit & Network Resilience**: Friendly fallback if GitHub API rate limit is reached, gracefully switching to peaceful offline honors.
- `[x]` **Poetic Language Artifacts**: Custom poetic artifacts for Rust (Iron Lantern), Python (Bamboo Inkwell), TypeScript (Stone Path), JavaScript (Firefly), Go (Courier Boat), C/C++ (Granite Pillar), HTML/CSS (Shoji Screen).
- `[x]` **Effortless Unlink / Solitude Option**: One-click "Return to Solitude" action in the Shrine to disconnect cleanly.

---

## 10. Phase 5: Polish & Deployment Readiness `[x]`

- `[x]` **Atmospheric Title / Welcome Screen**: Opening modal with Barakamon philosophy and Japanese/Malayalam typography, guaranteeing seamless user-gesture unlock for Web Audio API.
- `[x]` **Mobile Touch D-Pad**: Automatic touch detection with responsive on-screen directional controls emitting bridge events.
- `[x]` **Camera Perspective Zoom Slider**: Smooth real-time isometric camera zoom control (1.0x to 1.8x) wired from Settings modal to Phaser scene.
- `[x]` **Reduced Motion Accessibility**: Particle emitter pause/resume honoring `prefers-reduced-motion` and user settings.
- `[x]` **Universal Static Deployment**: Configured `base: './'` in `vite.config.ts` for instant GitHub Pages / static host readiness.
- `[x]` **Full Verification**: 0 TypeScript errors on `vue-tsc`, clean production Vite build in 5.26s.
