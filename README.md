# Gitakure

A peaceful countryside RPG that runs in the browser. You live in a secluded
valley — a village, a river, a forest, rice fields, a forgotten shrine, and a
small hideaway. The valley quietly grows in step with your real GitHub history.

Gitakure is a game first. GitHub activity is not a dashboard; it is the reason
the orchard behind the shrine exists, why a particular villager moved here, and
which paths are open.

---

## Quick start

Requires [Bun](https://bun.sh) 1.4+.

```bash
bun install
bun run assets     # measure the sprite boards and emit the manifest
bun run dev        # http://localhost:5173
```

Production build:

```bash
bun run build
bun run preview
```

Other commands:

| Command | What it does |
| --- | --- |
| `bun run assets` | Rebuild `public/assets/atlases/` and `src/generated/asset-manifest.ts` from `sprites/` |
| `bun run typecheck` | TypeScript, no emit |
| `bun run test` | Vitest suite (asset geometry, world logic, progression) |
| `bun run preview` | Serve the production build |

---

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD / arrows | D-pad |
| Run | Shift | Run toggle |
| Interact | E | A button |
| Inventory | I | Bag button |
| Journal | J | Book button |
| World map | M | Map button |
| Pause | Esc | Menu button |

---

## How the world is built

### Assets

The supplied packs in `sprites/` are AI-generated concept boards, not
grid-aligned tilesets — every sprite was cropped by connected components and
sits at its own size on an irregular grid. So nothing is assumed: a build step
decodes each board, measures every frame (bounds, opacity density, mean colour,
saturation, aspect), classifies it by shape and colour, and emits:

- `public/assets/atlases/<board>.png` — the atlas
- `public/assets/atlases/<board>.json` — frame rects for Phaser
- `public/assets/atlases/frames/` — tight per-frame PNGs for tiles and effects
- `src/generated/asset-manifest.ts` — typed catalog
- `docs/asset-report.md` — what is in each board, measured

2581 frames across 11 boards, plus 18 NPCs on a true 24×28 twelve-column grid
(down/left/right/up; idle, walk, interact) with dialogue portraits.

Rendering uses `pixelArt: true` and nearest-neighbour filtering throughout, so
the art stays crisp at any integer zoom.

### Project layout

```
scripts/           asset build step and dev preview tool
src/
  main.ts          entry point
  generated/       measured asset manifest (do not edit by hand)
  core/            config, state, RNG, input, save system
  world/           map definitions and world generation
  render/          tiles, depth sorting, weather and season overlays
  entities/        player, NPCs, animals
  systems/         farming, fishing, inventory, dialogue, time, weather
  github/          API client, normaliser, progression rules
  ui/              menus, HUD, journal, map, mobile controls
  audio/           procedural audio (no audio assets were supplied)
tests/             vitest suites
```

### Determinism

World generation is a pure function of `(seed, world state)`. The seed is fixed
for the valley, so the same save always rebuilds the same village. GitHub
activity only ever *adds* to that world through an explicit, idempotent
progression step — replaying a sync cannot double-apply it.

---

## GitHub integration

Three connection methods, in increasing order of access:

1. **Public username** — no token, reads only public contribution data.
2. **Personal access token** — supplied by the player, held in memory for the
   session only, never written to `localStorage`, IndexedDB, or logs.
3. **GitHub App / OAuth** — authorisation-code flow, handled by a backend the
   player runs themselves. No client secret is ever embedded in the bundle.

Gitakure never requests repository write scope. If the API is unreachable or
rate-limited, the game keeps running on cached or empty data and says so
plainly rather than fabricating activity.

---

## License and asset provenance

The sprite boards in `sprites/` were supplied with this project. Code in this
repository is original.