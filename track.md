# Gitakure — Build Track

## Phase 0 — Foundation (completed)

- Project scaffold: Vite + TypeScript + Phaser 3, lockfile committed.
- Shared types (`src/shared/types.ts`): world clock, inventory, crops, landmarks, journal, NPCs, save game, appearance, sync summary.
- Event bus (`src/core/EventBus.ts`): typed, synchronous, fire-and-forget.
- Config (`src/core/Config.ts`): resolution, speeds, scene keys, save version.
- Art pipeline: procedural pixel painter (`src/art/PixelCanvas.ts`) + palette derived from the supplied reference posters.
- Terrain tiles (`src/art/tiles/terrain.ts`): 21 terrain ids, deterministic noise, walkability sets.
- Flora (`src/art/flora.ts`): 12 plant types × 4 seasons.
- Props/buildings (`src/art/props.ts`): 33 props including houses, shrine, bridge, noticeboard, well, lantern, desk, bookshelf, computer, observatory, ruin pillar, market stall.
- Crops (`src/art/crops.ts`): 10 crops × 5 growth stages + watered variant.
- Animals (`src/art/animals.ts`): 14 animals, 2-frame idle strips.
- Effects (`src/art/effects.ts`): 13 particle types, light mask, vignette, sky.
- UI (`src/art/ui.ts`): 40 icons, parchment panel, plate.
- Characters (`src/art/characters.ts`): player skins A/B, 11 poses × 4 directions, portraits.
- NPCs (`src/data/npcs.ts`): 15 villagers with skins, schedules, dialogue.
- Texture registry (`src/art/registry.ts`): all textures painted in-process at boot.
- Boot + Loading scenes wired and building.

## Notes on the supplied `assests/` folder

The 12 files in `assests/` are composite AI-generated reference posters (1536×1024), not production atlases: irregular placement, labels, no uniform frame grid. Per the spec's asset-production rule they were used as **palette and style reference only** (their dominant hues drove `src/art/palette.ts`), and all in-game art is regenerated as individual, collision-mapped, frame-consistent sprites. A vision pass to verify extractable grids was attempted and could not be completed in this environment; extraction is therefore deferred rather than risk mixing unverified slices into the atlas.

## Phase 1 — Playable prototype (completed)

- BootScene registers all painted textures (spritesheets for characters/animals).
- LoadingScene splash.
- MainMenuScene with a working "New world" button.
- VillageScene: 40×30 terrain grid, pond, paths, houses, shop, noticeboard, well, benches, lanterns, flora.
- Player entity: 4-direction movement, walk/run, facing-driven animation frames, collision with water/cliffs/props.
- Camera follows player with bounds; world bounds enforced.
- Keyboard input: WASD + arrows + Shift to run.

### Verified
- `bun run typecheck` passes.
- `bun run build` passes (Vite production build).
- `bun run dev` starts and serves on :5173.

## Phase 2 — Living world (in progress)

Completed so far:
- NPC entity (`src/entities/NPC.ts`) with daily schedule resolution, movement toward schedule anchor, met/small-talk dialogue lines.
- 15 villagers spawned in VillageScene (those whose home is the village), with player collision.
- Placeholder in-game clock (8:00) driving schedules.

Remaining for Phase 2:
- Interaction system (E key) and dialogue UI overlay.
- Inventory system and hotbar.
- Farming system (plant/water/harvest) with in-game-time growth.
- Weather + day/night cycle visuals.
- Audio.