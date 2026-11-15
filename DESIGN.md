# DESIGN.md — Gitakure

## 1. Objective

Gitakure should feel like a quiet playable storybook: a real place with readable silhouettes, warm evening light, and enough tactile detail that the player wants to wander before being told what to do. The interface should feel like field notes brought into the world, not a generic game overlay. Quality bar: every screen must be legible at a glance, every scene must preserve the low-poly countryside identity, and every animation must earn its frame time.

## 2. Product Context

- **What the product does:** Gitakure is a peaceful low-poly 3D countryside game where the player explores a riverside village, meets its people, and leaves a personal trail of discoveries.
- **Who it's for:** Players who enjoy slow exploration, characterful villages, small rituals, and gentle progression more than combat or achievement pressure.
- **Adjacent brands (feel like these):** Animal Crossing for readable village warmth; Spiritfarer for humane character moments; Ni no Kuni for storybook color and silhouette.
- **Distant brand (do not feel like this):** Fortnite, because the interface should never feel competitive, weaponized, or neon-first.
- **Cultural register:** Warm, observant, lightly playful. The writing is plain and intimate; the world carries the richness.

## 3. Visual Foundations

### 3a. Color

- **Neutral scale:** `--n-950: #1b211d, --n-800: #30382f, --n-600: #5e665a, --n-400: #959689, --n-200: #d8d2bd, --n-100: #eee7d2, --n-50: #faf6e9`
- **Accent(s):** `--accent-primary: #d6923e` (lantern amber), `--accent-secondary: #5d7f67` (leaf green)
- **Semantic:** `--success: #6f9a6a, --warning: #c58a43, --error: #b75e4b, --info: #6f94a7`
- **Usage rules:** Amber marks the current action, selected tab, and important interaction prompt. Green is reserved for world-state confirmation and healthy bars. Parchment surfaces stay neutral; no hue-to-hue gradients or decorative glows on interface chrome.

### 3b. Typography

- **Display face:** `Georgia, 600` for the title mark and scene-facing headings; it gives the menu the storybook warmth visible in the references without introducing a new font dependency.
- **Body face:** `'Zen Kaku Gothic New', 'Noto Sans', system-ui, sans-serif`, weights 400–700 for readable controls and captions.
- **Fallback stack:** `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.
- **Type scale:** `12 / 14 / 16 / 18 / 24 / 32 / 48`; UI labels stay at 12–14px, dialogue body at 16–18px, title at 48px max on desktop.
- **Weight discipline:** 400 for supporting copy, 500 for labels, 600 for headings and selected states, 700 only for the game title or high-priority action.

### 3c. Spacing & rhythm

- **Base unit:** 4px.
- **Spacing scale:** `4, 8, 12, 16, 24, 32, 48, 64`.
- **What “generous” whitespace means in numbers:** desktop menu groups use at least 24px between sections; dialogue and settings panels use 16px internal padding minimum; touch targets are at least 44px.

### 3d. Component seeds

- **Button:** two variants: filled amber primary for the one next action, and ink-outline secondary for navigation or dismissal. Buttons use a 6px radius, not pills.
- **Card / container:** parchment panels use a thin warm border and one inset rule; avoid repeated floating cards and drop shadows. The inventory is a grid because items are spatial; settings are a list because settings are sequential.
- **Iconography:** CSS-drawn or text labels for current controls; no emoji icons. Use one consistent 1px line weight for any future SVG icons.
- **Signature detail:** selected states carry a small amber brush-stroke bar and a tiny leaf notch, echoing the title mark and village foliage.

## 4. Accessibility

- **Text contrast:** body text against panel surfaces is at least 4.5:1; large headings and UI boundaries are at least 3:1.
- **Motion:** ambient scene motion is allowed, but menu transitions honor `prefers-reduced-motion`; reduced motion removes drift and shimmer, not access to gameplay.
- **Focus indicators:** a 2px amber outline with 2px offset, plus the existing panel border remains visible.
- **Alt text policy:** decorative scene art is not repeated in DOM; informational imagery gets a concise description of the place or character, not a visual inventory of every object.
- All gameplay information that matters visually is also exposed through text labels, captions, or a focusable control.

## 5. Voice & Tone

- **Register:** conversational, observant, lightly playful.
- **Sentence rhythm:** short to medium sentences; use pauses and concrete nouns rather than slogans.
- **Words this brand uses:** wander, riverbank, village, lantern.
- **Words this brand refuses:** seamless, unlock, elevate, journey, delight.
- **Address:** “you” for player-facing instructions; named NPCs speak in first person.

## 6. Implementation Practices

- **Token format:** CSS custom properties in `src/styles.css`; scene palette stays in `src/game/procedural/materials.ts` and lighting code.
- **Component library convention:** bespoke Vue 3 components with typed props/events; no additional UI framework.
- **Image treatment rules:** references are art direction only. The final world and character assets are programmatic Three.js meshes or existing GLB assets; no reference image is shipped as a background.
- **Grid system:** asymmetric DOM composition over a full-bleed Three.js canvas. The menu anchors left to preserve the open world view on the right; gameplay HUD uses edge zones and a centered interaction prompt.
- **Motion rules:** fixed simulation at 60Hz, render at display rate, damped camera movement, and 150–240ms DOM transitions on color/opacity/transform only. No animated width/height or decorative interface glow.
- **Library decision:** keep Three.js `0.187.0` for the imperative 3D scene and GLB pipeline, Vue 3 for DOM UI, and the existing fixed-timestep loop. Do not add Babylon.js or a second renderer; the repo already has the right ownership split.

## 7. Anti-Patterns

- **No purple/teal gradient hero.** The memorable visual is the living village scene and its amber light, not a generic web gradient.
- **No emoji UI icons.** Controls must remain legible and consistent with the field-note tone.
- **No 3×N SaaS card grid.** Inventory may use spatial cells; settings and dialogue should use hierarchy and rules instead of repeated cards.
- **No glowing HUD chrome.** Lanterns and fire may emit light in the scene; the DOM layer needs contrast-safe backing, not bloom.
- **No vague fantasy copy.** Buttons and prompts name the action: `Continue`, `New journey`, `Talk to Mika`, `Rest by the campfire`.
- **No hue-only state changes.** Selected, disabled, weather, and interaction states also use text, shape, position, or an icon treatment.

## 8. Decision-Making

1. **Readability before atmosphere.** If text, silhouettes, or a prompt is unclear over the live scene, add backing or change placement before changing the palette.
2. **The world earns the detail.** Spend geometry, lighting, and richer color on the village, characters, and props; keep interface chrome quiet.
3. **Use the native metaphor.** Menu and settings behave like a notebook index; inventory behaves like a laid-out field kit; dialogue behaves like a caption card.
4. **Preserve the silhouette contract.** Player, NPC, interactable, and terrain must remain distinguishable in greyscale before hue refinements.
5. **Prefer the smallest working system.** Extend the existing Three.js/Vue architecture before adding a library or a second rendering path.

## 9. Workflow

1. Read this spec and inspect all references before touching visual code.
2. Identify the screen’s primary action and its brightest/most complex background case.
3. Build the scene or component from typed data and shared tokens; keep assets code-driven.
4. Verify keyboard, pointer, touch target size, focus, and reduced-motion behavior.
5. Test movement and camera conventions against explicit W/A/S/D expectations, not only screenshots.
6. Run typecheck, build, and relevant tests; inspect the changed diff for scope creep.
7. Record phase notes and commit only the completed phase before starting the next one.
