# Gitakure Architecture

## Module boundaries

- `src/core/` — Phaser bootstrap, config, typed event bus. No game logic.
- `src/shared/` — pure domain types shared by all modules (no Phaser, no DOM).
- `src/art/` — procedural pixel painters and texture registry. Deterministic, reproducible.
- `src/data/` — static game data (NPCs, schedules).
- `src/entities/` — Phaser game objects (Player, NPC).
- `src/systems/` — pure-ish simulation systems (time, weather, interaction, dialogue, inventory, farming, journal).
- `src/github/` — GitHub API client, auth, contribution service, normalizer, world mapper.
- `src/persistence/` — IndexedDB save system.
- `src/scenes/` — Phaser scenes (Boot, Loading, Menu, Village, Forest).
- `src/ui/` — HTML/CSS overlays and mobile controls.

## Data flow

1. BootScene paints all textures in-process and registers them.
2. VillageScene creates the world, player, NPCs, interaction system, dialogue system, time system, weather system, journal, save system.
3. Each frame: time ticks → NPC schedules resolve → weather overlays update → interaction resolves nearest interactable → HUD updates.
4. E key triggers interaction → dialogue opens → Space/Enter advances → Esc closes.
5. Sync GitHub button → ContributionService fetches → ActivityNormalizer → WorldMapper → landmarks placed + journal entries.
6. F5 → SaveSystem persists SaveGame to IndexedDB.

## Contracts

- All cross-module communication goes through the typed event bus (`src/core/EventBus.ts`).
- Domain types in `src/shared/types.ts` are framework-agnostic for reuse by a future native client.
- Texture keys are centralized in `TEX` (src/art/registry.ts); scenes never invent keys.

## Idempotency

- World progression uses an `appliedEvents` Set of GitHub event ids; repeated syncs never duplicate landmarks.
- Crop growth is a pure function of (plantedDay, nowMinutes), so re-running ticks never double-counts.