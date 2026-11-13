# Gitakure Asset Catalog

All assets are generated in-process by `src/art/*` painters and registered through `src/art/registry.ts`. There are no binary sprite files; the source of truth is code.

## Texture keys

| Key pattern | Source painter | Frame size | Notes |
|---|---|---|---|
| `terrain:<id>` | `paintTerrain` | 32×32 | 21 terrain ids |
| `flora:<id>` | `paintFlora` | varies | 12 plant types × 4 seasons (spring default at boot) |
| `prop:<id>:lit` / `:dim` | `paintProp` | varies | 33 props |
| `crop:<id>:<stage>` | `paintCrop` | 32×32 | 10 crops × 5 stages + watered variant |
| `animal:<id>` | `paintAnimal` strip | w×2 × h | 14 animals, 2 frames |
| `effect:<id>:<v>` | `paintEffect` | varies | 13 particle types × 3 variants |
| `icon:<id>` | `paintIcon` | 16×16 | 40 icons |
| `char:player` / `char:player-alt` | `paintCharacterSheet` | 32×48 (4×11 grid) | skins A/B |
| `char:npc:<id>` | `paintCharacterSheet` | 32×48 | 15 villagers |
| `portrait:<id>` | `paintPortrait` | 48×48 | dialogue busts |
| `ui:panel` | `paintPanel` | 48×48 | 9-slice parchment |
| `fx:shadow` | `paintShadow` | 32×12 | drop shadow blob |
| `fx:light` | `paintLightMask` | 96×96 | radial falloff |
| `fx:vignette` | `paintVignette` | 640×360 | screen-edge darkening |
| `fx:white` | 1×1 white | 1×1 | tinting primitive |

## Supplied reference posters (`assests/`)

12 composite AI-generated posters (1536×1024). Used as **palette and style reference only** — they are not production atlases (irregular placement, labels, no uniform frame grid). Per the spec's asset-production rule, extraction was deferred rather than risk mixing unverified slices. Their dominant hues drove `src/art/palette.ts`.

## License

All generated art is original to this project. No copyrighted or copied game assets are used.