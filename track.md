# Gitakure — build tracker

Live record of what is built, how it was verified, and what remains.
Phases map to the build order in the brief: foundation → living world →
GitHub progression → complete experience.

Status legend: `[x]` done and verified · `[~]` in progress · `[ ]` not started · `[!]` blocked

---

## Phase 0 — Asset pipeline `[x]`

The supplied packs are AI-generated concept boards, not grid-aligned tilesets.
Every frame is cropped by connected components, so the pipeline *measures* the
boards instead of trusting them.

| Item | State | Evidence |
| --- | --- | --- |
| Index every frame on all 11 boards | `[x]` | 2581 frames, `docs/asset-report.md` |
| Classify by shape/colour (tile, plant, structure, creature, effect, prop, ui) | `[x]` | per-sheet counts in report |
| Copy atlases into `public/assets/atlases/` | `[x]` | 11 png + 11 json |
| Tight per-frame exports for tiles and effects | `[x]` | `public/assets/atlases/frames/` (506 files) |
| NPC sheets on a real 12x4 grid + portraits | `[x]` | 18 characters, 18 portraits |
| Typed manifest for the engine | `[x]` | `src/generated/asset-manifest.ts` |
| Tests pinning geometry and transparency invariants | `[x]` | `bun run test` → 12 passed |

**Key finding:** the boards are *not* pixel-grid aligned (README confirms
16–25 px sprites on an irregular grid). The renderer therefore blits measured
frame rects rather than assuming uniform tile sizes.

**Known gap:** the atlas JSON has no per-pixel opacity index, so the engine
cannot auto-trim at runtime. Frames are used as measured.

---

## Phase 1 — Playable foundation `[ ]`

- [ ] Project scaffold, Vite + Phaser + TypeScript
- [ ] Boot/load scene, nearest-neighbour scaling
- [ ] Player four-directional movement, run, camera follow
- [ ] Collision against a tilemap layer
- [ ] One complete village map
- [ ] Basic interaction + interaction prompt
- [ ] Game boots to a playable village

## Phase 2 — Living world `[ ]`

- [ ] NPCs with names, personalities, dialogue, schedules
- [ ] Animals with idle/wander behaviour
- [ ] Building interiors
- [ ] Farming: till → sow → water → grow → harvest
- [ ] Inventory and item pickup
- [ ] Time of day (morning/afternoon/evening/night)
- [ ] Weather (sun, cloud, rain, storm, fog, snow)
- [ ] Day/night tinting and lighting

## Phase 3 — GitHub-powered world `[ ]`

- [ ] Connection flow: public username / PAT / OAuth device flow
- [ ] Contribution calendar + repository retrieval
- [ ] Normalisation into a progression model
- [ ] Deterministic world deltas (no fabricated history)
- [ ] Landmarks, vegetation, reputation, unlocks from real activity
- [ ] Manual sync, caching, rate-limit handling, duplicate prevention

## Phase 4 — Complete experience `[ ]`

- [ ] Remaining locations: riverside, forest, farmland, shrine, hideaway
- [ ] Seasons affecting farming and scenery
- [ ] Journal, world map, achievements, GitHub activity journal
- [ ] Persistent IndexedDB saves with version handling
- [ ] Mobile touch controls + responsive layout
- [ ] Performance pass

## Phase 5 — Audio `[ ]`

No audio assets were supplied (only sprites), so audio is synthesised with the
Web Audio API: procedural ambience, footsteps, and interaction cues. See
`src/audio/`.

- [ ] Location- and time-aware ambience beds
- [ ] Surface-aware footsteps
- [ ] Separate music/ambient/SFX volume + mute, persisted
- [ ] Respects browser autoplay policy; cleans up on scene unload

---

## Verification log

| Date | Check | Result |
| --- | --- | --- |
| 2025-11-13 | `bun run scripts/build-assets.ts` | 2581 frames, 11 boards, 18 npcs |
| 2025-11-13 | `bun run typecheck` | clean |
| 2025-11-13 | `bun run test` | 12/12 passed |