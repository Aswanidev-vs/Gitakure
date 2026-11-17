# Gitakure — Changes Log

## Phase 11 — Ghibli Visual Foundation
- Materials: switched procedural palette from `MeshStandardMaterial` to `MeshToonMaterial` with a shared 4-band cel gradient map.
- Lighting/IBL: `Lighting` now accepts the renderer and generates a `RoomEnvironment` PMREM env map for soft painterly reflections.
- Scene: `SceneManager` background/fog shifted to warm sky tones (`0xcfe7c0` / `0xd8e6e2`, density `0.008`).
- Post-processing: `Game` renders through an `EffectComposer` (RenderPass + subtle UnrealBloom + FXAA) instead of a direct renderer pass; composer resized/disposed with the canvas.
- Assets: added `createPaddyPlot` and `createRiverBoat` to `src/game/procedural/props.ts`; `VillageGenerator` now places both near the village/bridge.
- Verification: `bun run typecheck` clean, `bun run build` clean, `bun run test` 28/28 pass.

## Phase 12 — Interaction Expansion
- Fishing: river interaction casts a line and resolves a catch via timed dialogue.
- Foraging: campfire-side herb gathering interaction.
- House entry: cottage interaction with a warm interior beat.
- Verification: `bun run typecheck` clean, `bun run build` clean, `bun run test` 28/28 pass.

## Phase 13 — Character Toon Shading
- Characters: `CharacterFactory`, `NPC`, and `Player` materials converted from `MeshStandardMaterial` to `MeshToonMaterial` for cel-shaded Ghibli styling.
- Verification: `bun run typecheck` clean, `bun run build` clean, `bun run test` 28/28 pass.

## Phase 14 — Character Proportion Reinvention
- Player/NPC head: enlarged head and hair volumes, larger face quad for a softer Ghibli silhouette.
- Verification: `bun run typecheck` clean, `bun run build` clean, `bun run test` 28/28 pass.

## Phase 15 — Environment Asset Reinvention
- Ghibli tree: new round-canopy procedural tree generator (`createGhibliTree`).
- Ghibli cottage: new thatched-roof cottage generator (`createGhibliCottage`).
- Integration: cottage + ghibli trees placed near the village in `VillageGenerator`.
- Verification: `bun run typecheck` clean, `bun run build` clean, `bun run test` 28/28 pass.

## Phase 16 — GitHub Memory Journal + NPC Dialogue Hooks (planned)
- Memory journal: parchment UI listing discovered GitHub milestones with repo name, commit message, date.
- NPC dialogue hooks: villager lines reference repos/languages; seasonal world changes tied to GitHub streaks.
- Gradual discovery: top 3 milestones spawned as keepsakes; cache in Dexie; private repo opt-in.

## Phase 17 — UI/UX Interaction Overhaul + Polish (planned)
- Memory book, fishing UI, house interior screen, improved HUD prompts.
- Audio responsiveness, reduced-motion, performance pass, offline verification.
EOF