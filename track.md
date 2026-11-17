# Gitakure — Master Build Tracker

Live record of what is built, how it was verified, and architecture status according to the Master Game Development Prompt.

Status legend: `[x]` done and verified · `[~]` in progress · `[ ]` not started · `[!]` blocked

---

## Architecture & Technology Stack `[x]`

| Requirement | Implementation | Evidence |
|---|---|---|
| **Runtime** | Bun | `bun.lock`, `bun install` |
| **Language** | TypeScript (strict) | `tsconfig.json` |
| **Build tool** | Vite | `vite.config.ts` |
| **UI** | Vue 3 Composition API | `src/app/App.vue`, `src/app/main.ts` |
| **State management** | Pinia | `src/stores/settingsStore.ts` |
| **Primary 3D engine** | Three.js (r0.187) | `src/game/core/Game.ts`, `src/game/rendering/*` |
| **Local database** | Dexie.js (IndexedDB) | Phase 6 (pending) |
| **Asset format** | GLB / glTF | `glb/` (80 Quaternius assets) |
| **Rendering** | WebGL | `src/game/rendering/Renderer.ts` |
| **Testing** | Vitest | `vitest.config.ts` |
| **Typed Bridge** | `gameBridge` (no Three.js objects in Pinia) | `src/game/core/GameBridge.ts` |

---

## Phase 0: Cleanup & Foundation Reset `[x]`

- `[x]` Removed old Phaser 4 / 2D isometric pixel-art iteration (all Phaser scenes, pixel-art factory, isometric camera, procedural-audio, Phaser-coupled Vue components, old GitHub/storage/state modules, old `src/main.ts`).
- `[x]` Removed old pixel-art sprite assets (`public/sprites/`, `sprites/`, `summary.json`) and the two asset-pack zip bundles.
- `[x]` Preserved `track.md`, `README.md`, `docs/`, `.gitignore`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `glb/`.
- `[x]` Added Quaternius GLB packs to `public/glb/` (Vite serves `/glb/*`) as the environmental foundation.
- `[x]` Rewrote `package.json` for the new stack (three, vue, pinia, dexie; dropped phaser).
- `[x]` Rewrote `index.html` for the `src/app/main.ts` entry.
- `[x]` Dropped phaser `manualChunks` from `vite.config.ts`.
- `[x]` `bun install` clean, lockfile regenerated. Committed `cc2cecc`.

---

## Phase 1: Core Architecture, GameBridge, Dual Camera, First 3D Scene `[x]`

- `[x]` **Typed GameBridge** — `src/game/core/GameBridge.ts`. Serializable events (Vue→Game) and commands (Game→Vue) only; **no Three.js objects in Pinia**.
- `[x]` **GameLoop** — `src/game/core/GameLoop.ts`. Fixed-timestep (1/60) accumulator with 0.25s frame clamp (no spiral of death); `onTick` + `onRender` handlers.
- `[x]` **GameConfig** — `src/game/core/GameConfig.ts`. Low/Medium/High presets per spec §18 (pixelRatio cap 1.5, shadows off on Low, antialias on, maxPixelCount scaling).
- `[x]` **Renderer** — `src/game/rendering/Renderer.ts`. WebGLRenderer, ACESFilmic tone mapping, pixel-ratio cap + internal resolution cap, resize handling, dispose.
- `[x]` **SceneManager** — `src/game/rendering/SceneManager.ts`. Scene lifecycle, background, FogExp2, deep dispose.
- `[x]` **CameraController** — `src/game/rendering/CameraController.ts`. **Dual-mode**: first-person (eye-level, look-ahead) + third-person (elevated fixed-orientation follow, smooth damping, adjustable distance, camera collision raycast). `V` key / UI button toggles. Mode persisted in settings.
- `[x]` **Lighting** — `src/game/rendering/Lighting.ts`. One directional sun + hemisphere ambient; time-of-day sun arc/color/intensity; optional shadows.
- `[x]` **AssetManager** — `src/game/assets/AssetManager.ts`. Cached GLTFLoader, bounds/poly-count measurement, instantiate clone, dispose.
- `[x]` **AssetRegistry** — `src/game/assets/AssetRegistry.ts`. Central catalog of all 80 Quaternius GLBs with name, source pack, path, format, license (CC0), intended usage, biome (japanese/kerala/both), category; runtime `measureRegistry()` fills dimensions, triangle count, embedded-texture/animations status.
- `[x]` **Game** — `src/game/core/Game.ts`. Top-level orchestrator wiring renderer/scene/camera/lighting/loop/bridge; command handler; snapshot emission (player, time, day, season, weather, cameraMode, fps, drawCalls).
- `[x]` **Vue app** — `src/app/App.vue`. Mounts game canvas, HUD (camera toggle, pause, fps/draw-call stats, interaction pill), keyboard `V` toggle, `Shift+Space` pause.
- `[x]` **Placeholder scene** — ground disc + procedural player capsule + Pine Trees GLB + Palm Trees GLB; proves GLB pipeline + camera toggle.
- `[x]` **Utils** — `src/utils/rng.ts` (mulberry32 seeded RNG + hashSeed), `src/utils/math.ts` (clamp/lerp/damp/valueNoise2/fbm2).
- `[x]` **Verification**: `bun run typecheck` clean, `bun run build` clean (38 modules, three chunk 144KB gzip), dev server launches on :5173, GLB served at `/glb/`.

---

## Phase 2: Asset Pipeline & Registry `[x]`

- `[x]` Asset registry catalog (all 80 GLBs) — done in Phase 1.
- `[x]` GLTFLoader pipeline + caching — done in Phase 1.
- `[x]` Runtime `measureRegistry()` (fills dimensions, poly count, embedded-texture/animations status on load).
- `[x]` Registry + utils unit tests (16 tests passing).
- `[x]` **Procedural materials palette** — `src/game/procedural/materials.ts` (shared low-poly `MeshStandardMaterial`s; cohesive palette).
- `[x]` **Geometry helpers** — `src/game/procedural/geometry.ts` (taperedCylinder, box, icoRock, cone, blob, transform, mergeColored, shared vertex-color material).
- `[x]` **Vegetation generators** — `src/game/procedural/vegetation/`: coconut palm (curved trunk, radial drooping fronds, coconuts), bamboo (segmented stalks + nodes), sakura (pink canopy blobs + branches), pine (stacked conical layers).
- `[x]` **Props generators** — `src/game/procedural/props.ts`: rock (jittered icosahedron), grass tuft, flower cluster, bush.
- `[x]` **Building generators** — `src/game/procedural/buildings/`: house (Japanese/Kerala gabled roof + veranda + posts), torii (Shinto gate), bridge (arched plank deck + rails).
- `[x]` All generators wired into the placeholder scene (palms, bamboo, sakura, pine, rocks, grass, flowers, bushes, 2 houses, torii, bridge) to prove the pipeline.
- `[x]` **Verification**: `bun run typecheck` clean, `bun run build` clean (49 modules), `bun run test` 16/16 pass, dev server launches, scene renders.

---

## Phase 3: First Environment `[x]`

- `[x]` **TerrainSystem** — `src/game/world/TerrainSystem.ts`. Procedural fbm heightfield with gentle hills, a sine-winding river channel carved through the middle, and a raised village plateau. Vertex-colored (grass/dirt/sand/rock by height + slope). Provides `heightAt(x,z)` bilinear sampler for object placement, `scatter()` for biome placement, `slopeAt()`.
- `[x]` **WaterSystem** — `src/game/world/WaterSystem.ts`. Custom GLSL shader river/canal: scrolling noise-based ripples, fresnel sky reflection tint, shallow→deep color gradient, gentle vertex bob. Lightweight (no post-processing).
- `[x]` **VegetationSystem** — `src/game/world/VegetationSystem.ts`. Scatters ground-cover (grass tufts, flower clusters), hero trees (coconut palms near river/Kerala, sakura + pine near village/Japanese), bamboo clusters, rocks near riverbanks, bushes — all on terrain height via the scatter sampler.
- `[x]` **VillageGenerator** — `src/game/world/VillageGenerator.ts`. Places 4 houses (Japanese/Kerala mix) on the plateau, a torii shrine gate, an arched bridge over the river, a campfire clearing (stone ring + logs), and a bench.
- `[x]` **WorldManager** — `src/game/world/WorldManager.ts`. Ties terrain + water + vegetation + village together; exposes `heightAt`, `campfirePosition`, `benchPosition`; `update()` drives water shader.
- `[x]` Game wired to WorldManager: player capsule placed on terrain at the village bench, glued to terrain height each frame, camera + lighting follow player.
- `[x]` **Verification**: `bun run typecheck` clean, `bun run build` clean, 16/16 tests pass, dev server launches, full 3D scene (terrain + river + village + vegetation) renders.

---

## Phase 4: Player & Interaction `[x]`

- `[x]` **Player entity** — `src/game/entities/Player.ts`. Stylized low-poly humanoid (head, torso, arms, legs, hair) built from primitives; procedural walk/idle/sit animation via `update(dt, speed)`; facing rotation. No rigged GLB in the pack, so this is the player.
- `[x]` **MovementSystem** — `src/game/systems/MovementSystem.ts`. WASD/arrows with smooth acceleration + deceleration (damp), terrain-aware height following, sphere-vs-AABB collision resolution against registered colliders, turn-speed-limited facing. Walk/run via Shift.
- `[x]` **Campfire experience** — `src/game/entities/Campfire.ts`. Layered additive flame cones with flicker, warm flickering point light, rising smoke particle column (Points). No time limit, no reward. Honors `prefers-reduced-motion`/setting.
- `[x]` **InteractionSystem** — `src/game/systems/InteractionSystem.ts`. Proximity detection with `[E] <label>` prompt emission; `sit` toggles player sit animation + disables movement; interactable registry.
- `[x]` Game wired: Player + Movement + Campfire + Interactions all instantiated; `E` interacts; `V` toggles camera; sit by campfire or bench.
- `[x]` **Verification**: `bun run typecheck` clean, `bun run build` clean, 16/16 tests pass, dev server launches.

---

## Phase 5: Living World `[x]`

- `[x]` **TimeSystem** — `src/game/systems/TimeSystem.ts`. Normalized day fraction advancing over a configurable cycle (default 10 min), derives named time-of-day phase (sunrise/morning/afternoon/sunset/evening/night), day counter, `setTime`.
- `[x]` **WeatherSystem** — `src/game/systems/WeatherSystem.ts`. Cycles clear→cloudy→lightRain→mist→heavyRain; rain particle column (Points) that follows the camera; fog density per weather; reduced-motion support; `onWeatherChange` listener.
- `[x]` **SeasonSystem** — `src/game/systems/SeasonSystem.ts`. Cycles spring/summer/monsoon/autumn/winter (4 min each); exposes foliage tint color + season-change listener.
- `[x]` **NPC entity** — `src/game/entities/NPC.ts`. Peaceful low-poly villager that wanders within a radius of home, pauses, breathes when idle. 3 villagers spawned (Ren, Amma, Appu) near the village/river.
- `[x]` **AudioSystem** — `src/game/systems/AudioSystem.ts`. Procedural Web Audio (no files): wind (filtered noise + gust LFO), water (bandpass noise), rain (highpass noise, weather-driven), birds (day chirps), crickets (night chirps). Separate master/ambience/sfx gains. Starts on first user gesture (autoplay policy).
- `[x]` Game wired: TimeSystem drives lighting + snapshot; WeatherSystem drives rain + fog; SeasonSystem exposes season; NPCs update each tick; AudioSystem responds to time + weather.
- `[x]` Command handlers updated: `setAudio` → AudioSystem, `setReducedMotion` → campfire + weather, `setTimeOfDay` → TimeSystem, `setSeason` → SeasonSystem.
- `[x]` **Verification**: `bun run typecheck` clean, `bun run build` clean, 16/16 tests pass, dev server launches.

---

## Phase 6: Persistence & GitHub `[x]`

- `[x]` **Dexie schema** — `src/database/db.ts`. Versioned IndexedDB (v1): `gameState`, `settings`, `memories` (discovered + undiscovered keepsakes), `githubMeta`.
- `[x]` **Repositories** — `src/database/repositories/index.ts`. Typed accessors: `gameStateRepo` (load/save player+world), `settingsRepo` (load/save), `memoriesRepo` (list/undiscovered/put/markDiscovered/has/clear), `githubMetaRepo` (get/upsert/clear).
- `[x]` **GitHub service** — `src/services/github/github-service.ts`. Browser-safe public-data fetch (no token stored); optional PAT for private repos with opt-in; rate-limit-friendly error handling.
- `[x]` **GitHub interpreter** — `src/github/interpreter/github-interpreter.ts`. Normalizes history (user, repos, sampled commits), groups repos by activity, collects languages, computes longest streak, builds milestones (first-seed, river-lantern, language-scroll, constellation, quiet-solitude) with weights; **gradual discovery** picks top 3.
- `[x]` **GitHubWorldSystem** — `src/game/systems/GitHubWorldSystem.ts`. Converts milestones into procedural keepsakes (sapling, stone lantern with glow, scroll slab, obelisk, pebble); spawns them near the village as the player explores; `spawnNext()` for gradual discovery.
- `[x]` **Persistence wired into Game** — loads saved settings + player/world on `start()`; auto-saves every 15s + on `saveState` command; `connectGithub`/`disconnectGithub`/`spawnGithubKeepsake` commands.
- `[x]` **GitHub store** — `src/stores/githubStore.ts`. Connects the interpreter + Dexie + Vue; tracks connected state, pending discoveries, discovered list; `markDiscovered`/`disconnect`.
- `[x]` **Offline mode** — if Dexie/GitHub unavailable, the game starts fresh; GitHub is optional (spec §16).
- `[x]` **Verification**: `bun run typecheck` clean, `bun run build` clean (Dexie code-split into its own chunk), 16/16 tests pass, dev server launches.

---

## Phase 7: Asset Workshop (dev-only) `[x]`

- `[x]` **AssetWorkshop** — `src/game/tools/AssetWorkshop.ts`. Live Three.js preview with OrbitControls, param sliders, seed, lighting preview (hemisphere + sun + ground), GLB export via GLTFExporter (binary download). Categories: palm, bamboo, sakura, pine, house.
- `[x]` **Workshop UI** — `src/components/Workshop.vue`. Control panel with category selector, per-asset param sliders, regenerate, export GLB.
- `[x]` **Workshop entry** — `src/app/workshop.ts` + `workshop.html`. Separate multi-page build entry; NOT loaded in the player build. Access via `/workshop.html` in dev.
- `[x]` **Settings modal** — `src/components/SettingsModal.vue`. Graphics (quality, shadows), camera (mode, follow distance), audio (master/ambience/sfx/music), accessibility (reduced motion, show time/weather). Wired to Game via bridge; wired into App.vue HUD.
- `[x]` **Vite multi-page build** — `vite.config.ts` rollup input for `index.html` + `workshop.html`.
- `[x]` **Verification**: `bun run typecheck` clean, `bun run build` clean (both entries emitted), 16/16 tests pass, dev server launches.

---

## Phase 8: Polish & Optimization `[x]`

- `[x]` **MainMenu** — `src/components/MainMenu.vue`. Atmospheric title screen (Continue / New Journey / GitHub Connection / Settings / About) with tagline + control hints.
- `[x]` **GithubModal** — `src/components/GithubModal.vue`. Connect UI: username + optional PAT, privacy note ("public data only, no token stored, no rankings"), connect/disconnect, pending keepsake count. Wired to `githubStore` + bridge.
- `[x]` **App flow** — main menu → game transition; `startGame(fresh)` loads/creates save; settings persist via Dexie on mount.
- `[x]` **Performance: merged grass geometry** — `createGrassTuft` now merges all blades into one vertex-colored `BufferGeometry` (1 draw call per tuft, was 7). Reduced grass scatter 120→80. Three.js per-mesh frustum culling active.
- `[x]` **Settings modal** — graphics/camera/audio/accessibility wired to Game via bridge.
- `[x]` **Pinia stores** — `settingsStore` + `githubStore` (game/player/world state lives in the engine + Dexie).
- `[x]` **Verification**: `bun run typecheck` clean, `bun run build` clean (both entries), 16/16 tests pass, dev server launches.

---

## Phase 9: Final Optimization & Deployment `[x]`

- `[x]` **Production build** — `bun run build` clean; `vite.config.ts` `base: './'` for subpath deploy (GitHub Pages / Cloudflare Pages / Netlify).
- `[x]` **Offline** — all dependencies bundled via Bun/npm; no runtime CDN dependence; assets served from `/glb/`.
- `[x]` **Disposal audit** — Game disposes renderer, scene, lighting, world (terrain/water/vegetation/village), player, campfire, NPCs, weather, audio, github keepsakes, and removes all window listeners.
- `[x]` **Pixel ratio + resolution cap** — `Renderer.applyPixelCap` enforces `maxPixelCount` per quality preset.
- `[x]` **Low/Medium/High presets** — Low (no shadows, 1080p cap), Medium (shadows, 1440p), High (shadows, 4K).
- `[x]` **Multi-page build** — `index.html` (player) + `workshop.html` (dev tool, not in player build).
- `[x]` **Verification**: full `typecheck + build + test` green; dev server launches; production dist emits both entries.

---

## Phase 10: Reference Image Visual Replica & Dynamic Asset System `[x]`

Complete code-driven programmatic recreation of 10 reference images (Three.js WebGL + Vue 3 UI, zero static image generation):

### 1. Main Menu & 3D Environment (Image 1) `[x]` — Commit `0fbf4d3`
- `[x]` **Immediate Engine Mount**: Three.js engine boots immediately in `'menu'` cinematic camera mode; transparent overlay for Vue HUD.
- `[x]` **Procedural Companion Cat**: `src/game/entities/Cat.ts` with breathing spine, tail twitch, and calico patch coloring.
- `[x]` **Stone Lantern Prop**: `src/game/procedural/props.ts` (`createStoneLantern`) with interior glowing `PointLight`.
- `[x]` **Parchment Pill Navigation**: `src/components/MainMenu.vue` replicating Image 1 (Continue, New Journey, Settings, GitHub Memories, About).

### 2. Dynamic Character Models & Expressions (Image 2) `[x]` — Commit `087a9e9`
- `[x]` **Character Factory**: `src/game/entities/CharacterFactory.ts` with canvas-drawn anime eye, blush, and mouth textures.
- `[x]` **Female Archetype**: Red kimono tunic, side ponytail, sakura flower clip, cream skirt, dark sash.
- `[x]` **Male Archetype**: Open beige collar shirt, spiky hair, sash belt, dark trousers.
- `[x]` **Player Postures & Animations**: `src/game/entities/Player.ts` runtime swapping, walk bob, idle breathing, and sitting poses.

### 3. Settings HUD, Inventory & Gameplay HUD (Images 3, 10, 5, 6, 7) `[x]` — Commit `e21f741`
- `[x]` **Parchment Settings Modal**: `src/components/SettingsModal.vue` with Graphics pills, model selector, audio/controls tabs.
- `[x]` **10-Slot Inventory System**: `src/components/InventoryModal.vue` with 5 categories (All, Resources, Tools, Decor, Other), SVG item icons, detail pane, Drop/Use actions. Hotkey: `Tab` / `I`.
- `[x]` **Gameplay HUD**: `src/components/GameplayHUD.vue` with anime avatar vitals, sun clock widget, rotating minimap, quest log card, bottom hotbar, and action hints.

### 4. NPC Archetypes & Dialogue System (Images 4, 8) `[x]` — Commit `6d14d16`
- `[x]` **5 Villager Archetypes**: `src/game/entities/NPC.ts` (`elder-man`, `elder-woman`, `child`, `maiden`, `farmer`) with unique conical hats, hoe, beard, gray bun, and aprons.
- `[x]` **Parchment Dialogue UI**: `src/components/DialogueBox.vue` with amber speaker badge, smooth typing text, and `[E] Interact` proximity triggering.

### 5. Illustrated World Map & Atmospheric Lighting (Images 9, 5, 6, 7) `[x]` — Commit `0a321ac`
- `[x]` **Illustrated World Map**: `src/components/WorldMapModal.vue` with SVG rice paddies, winding river, wooden bridges, POI markers, and player pulse indicator. Hotkey: `M`.
- `[x]` **Ghibli Golden-Hour Lighting**: `src/game/rendering/Lighting.ts` updated with honey-amber sunlight (`0xff9e4a`) and rose-lavender sky ambient (`0xf4ad8e`).
- `[x]` **Verification**: `bun run typecheck` clean (0 errors), `bun test` 16/16 pass, `bun run build` clean in 6.34s.
---

## Phase 11: Ghibli Visual Foundation (toon + IBL + fog + post-processing) `[x]`

- `[x]` **Materials** — `src/game/procedural/materials.ts` switched from `MeshStandardMaterial` to `MeshToonMaterial` with a shared 4-band gradient map for cel-shaded silhouettes.
- `[x]` **Lighting / IBL** — `src/game/rendering/Lighting.ts` now takes the renderer and generates a `RoomEnvironment` PMREM env map for soft painterly reflections; warm Ghibli sun/hemi palette retained.
- `[x]` **Scene** — `SceneManager` background/fog shifted to warm sky tones (`0xcfe7e0` / `0xd8e6e2`, density `0.008`).
- `[x]` **Post-processing** — `Game` now renders through an `EffectComposer` (RenderPass + subtle UnrealBloom + FXAA) instead of a direct renderer pass; composer resized/disposed with the canvas.
- `[x]` **Assets** — added `createPaddyPlot` and `createRiverBoat` to `src/game/procedural/props.ts`; `VillageGenerator` now places both near the village/bridge.
- `[x]` **Verification** — `bun run typecheck` clean, `bun run build` clean, `bun run test` 28/28 pass.

---

## Phase 12: Interaction Expansion (fishing, foraging, house entry) `[x]`

- `[x]` **Fishing** — river interaction casts a line and resolves a catch via timed dialogue.
- `[x]` **Foraging** — campfire-side herb gathering interaction.
- `[x]` **House entry** — cottage interaction with a warm interior beat.
- `[x]` **Verification** — `bun run typecheck` clean, `bun run build` clean, `bun run test` 28/28 pass.

---

## Phase 13: Character Toon Shading `[x]`

- `[x]` **Characters** — `CharacterFactory`, `NPC`, and `Player` materials converted from `MeshStandardMaterial` to `MeshToonMaterial` for cel-shaded Ghibli styling.
- `[x]` **Verification** — `bun run typecheck` clean, `bun run build` clean, `bun run test` 28/28 pass.
