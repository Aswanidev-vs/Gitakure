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

## Phase 3: First Environment `[~]`

- `[ ]` Terrain (procedural heightfield, hills, riverbank carve).
- `[ ]` Water (river/canal, custom shader).
- `[ ]` Vegetation (instanced GLB placement by biome).
- `[ ]` Village (procedural buildings + GLB props).
- `[ ]` Paths, campfire spot, scenic viewpoints.
- `[ ]` Lighting/camera established for the scene.

---

## Phase 4: Player & Interaction `[ ]`

- `[ ]` Stylized 3D player (procedural low-poly humanoid; no rigged GLB in pack).
- `[ ]` Movement (WASD/arrows, accel/decel, terrain-aware, collision).
- `[ ]` Camera polish (1P↔3P toggle, follow distance, sit camera).
- `[ ]` Interactions (sit on bench, sit by campfire).
- `[ ]` Campfire experience (flames, smoke, warm light, crackle, sit anim).

---

## Phase 5: Living World `[ ]`

- `[ ]` Time system (sunrise→night, sun/ambient shifts).
- `[ ]` Weather (clear/cloudy/rain/mist; rain particles, fog, wet look).
- `[ ]` Seasons (spring/summer/monsoon/autumn/winter; palette + particles).
- `[ ]` NPCs (3-4 peaceful villagers with routines + idle/walk).
- `[ ]` Audio (procedural Web Audio: birds, water, wind, rain, campfire, crickets; volume sliders).

---

## Phase 6: Persistence & GitHub `[ ]`

- `[ ]` Dexie schema + repositories.
- `[ ]` Player/world/settings persistence.
- `[ ]` GitHub interpreter (gradual discovery, milestones → keepsakes).
- `[ ]` Offline mode.

---

## Phase 7: Asset Workshop (dev-only) `[ ]`

- `[ ]` Live Three.js preview (category, params, seed, lighting).
- `[ ]` GLB export via GLTFExporter (fallback JSON).

---

## Phase 8: UI (Vue 3) & HUD `[ ]`

- `[ ]` Main menu, settings, pause, GitHub connection, about.
- `[ ]` Settings (graphics/audio/controls/accessibility/camera).
- `[ ]` Pinia stores (game/settings/player/world/github).

---

## Phase 9: Optimization, Build, Deploy `[ ]`

- `[ ]` Instanced meshes, LOD, frustum culling, lazy loading, disposal audit.
- `[ ]` Offline test, production build, subpath deploy (GitHub Pages/Cloudflare Pages/Netlify).