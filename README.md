# Gitakure

A peaceful low-poly 3D countryside that runs in the browser. Explore a village,
sit beside a river, watch the rain, visit a shrine, or spend time by a campfire.
The world blends Japanese and Kerala countryside influences into one cohesive,
fictional environment.

**Gitakure is not a game about getting more work done. It is a place where you can forget about work for a while.**

---

## Quick start

Requires [Bun](https://bun.sh) 1.4+.

```bash
bun install
bun run dev        # http://localhost:5173
```

Production build:

```bash
bun run build
bun run preview    # http://localhost:4173
```

Other commands:

```bash
bun run typecheck  # vue-tsc --noEmit
bun run test       # vitest
```

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Language | TypeScript |
| Build | Vite |
| UI | Vue 3 (Composition API) |
| State | Pinia |
| 3D engine | Three.js (WebGL) |
| Persistence | Dexie.js (IndexedDB) |
| Testing | Vitest |

No backend, no React/Next, no Phaser, no Blender, no external CDNs.

---

## Controls

| Input | Action |
|---|---|
| `WASD` / arrows | Move |
| `Shift` | Run |
| `E` | Interact (sit by campfire / bench) |
| `V` | Toggle first-person / third-person camera |
| `Shift+Space` | Pause |

---

## Architecture

```
src/
  app/            Vue entry (main.ts, App.vue, workshop.ts)
  components/     MainMenu, SettingsModal, GithubModal, Workshop (dev)
  game/
    core/         Game, GameLoop, GameBridge, GameConfig
    rendering/    Renderer, SceneManager, CameraController, Lighting
    world/        TerrainSystem, WaterSystem, VegetationSystem, VillageGenerator, WorldManager
    entities/     Player, NPC, Campfire
    systems/      Movement, Interaction, Time, Weather, Season, Audio, GitHubWorld
    procedural/   materials, geometry helpers, vegetation/buildings/props generators
    assets/       AssetManager (GLTFLoader), AssetRegistry
    tools/        AssetWorkshop (dev-only)
  stores/         settingsStore, githubStore
  database/       Dexie schema + repositories
  services/github/  GitHub data fetch
  github/interpreter/  history → milestones → keepsakes
  types/  utils/  styles/
```

Three.js owns the world and rendering. Vue owns menus/HUD/settings. Pinia
coordinates app state. Dexie persists player/world/settings/memories. The
typed `GameBridge` connects them — **no Three.js objects in Pinia**.

---

## Assets

The Quaternius stylized nature packs (80 GLB files) live in `glb/` and are
served from `/glb/`. See `src/game/assets/AssetRegistry.ts` for the full
catalog (name, source pack, license CC0, biome, intended usage).

Procedural generators (TypeScript + Three.js) build coconut palms, bamboo,
sakura, pine, houses, torii, bridges, rocks, grass, flowers — see
`src/game/procedural/`.

---

## Asset workshop (dev-only)

A developer tool for previewing and exporting procedural assets. Not part of
the player build.

```bash
bun run dev
# open http://localhost:5173/workshop.html
```

Select a category, tweak parameters, regenerate, export as GLB.

---

## Deployment

Static hosting (GitHub Pages, Cloudflare Pages, Netlify). `vite.config.ts`
sets `base: './'` so production assets load from any subpath. No runtime
dependency on external CDNs.

---

**Gitakure is not a game about getting more work done. It is a place where you can forget about work for a while.**