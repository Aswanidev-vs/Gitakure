# GITAKURE — Complete 3D Game Architecture, Asset Pipeline and Implementation Prompt

## 1. Your Role

Act as a senior 3D game architect, Three.js developer, TypeScript engineer, procedural 3D artist, technical artist, and Vue developer.

Completely redesign and implement Gitakure as a beautiful, peaceful, low-poly 3D countryside simulation.

You must build the actual game, not just produce an architecture document.

You have permission to create custom 3D objects, environmental assets, procedural geometry, shaders, animations, and visual effects directly through code.

The developer does not have Blender and has limited computer hardware. Therefore, the entire development process must work using the coding harness, TypeScript, browser-based tools, and lightweight asset libraries.

Do not make Blender, Unity, Unreal Engine, or other heavy 3D modeling applications mandatory.

---

# 2. Game Identity

**Name:** Gitakure

**Tagline:** A little world, shaped by your journey.

Gitakure is a peaceful countryside life simulation designed to help people step away from their busy digital lives.

It is a place to explore, sit beside a river, watch the rain, listen to birds, visit a village, or spend time beside a campfire.

The world combines Japanese and Kerala countryside influences into one cohesive fictional environment.

Core philosophy:

- Relaxation over productivity.
- Exploration over achievement.
- Atmosphere over objectives.
- Personal memories over competition.
- Freedom over progression systems.

The player must always be free to do nothing.

Do not copy copyrighted characters, locations, designs, or storylines from existing games or anime.

---

# 3. Technology Stack

Use the following architecture.

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Language | TypeScript |
| Build tool | Vite |
| UI | Vue 3 Composition API |
| Primary 3D engine | Three.js |
| State management | Pinia |
| Local database | Dexie.js |
| Storage | IndexedDB |
| Physics | Rapier 3D, if required |
| Asset format | GLB / glTF |
| Rendering | WebGL |
| Testing | Vitest |
| Deployment | Static hosting |

Important restrictions:

- Do not use React.
- Do not use Next.js.
- Do not use Phaser.
- Do not require a backend.
- Do not require Blender.
- Do not require a dedicated GPU.
- Do not introduce unnecessary frameworks.

Use Bun for dependency management, scripts, development, and building the application.

Use Vite for the frontend development and production build pipeline.

Prefer Bun-compatible packages and verify their compatibility before introducing them.

Typical commands should use:

- `bun install`
- `bun run dev`
- `bun run build`
- `bun run test`

---

# 4. 3D Engine Architecture

Three.js must be the primary rendering engine.

The game should use a real 3D environment rather than a collection of 2D sprites.

## Important distinction about other 3D libraries

Investigate and use suitable libraries from the Three.js ecosystem and other compatible JavaScript libraries.

However, do not combine multiple complete rendering engines unnecessarily.

Babylon.js and Three.js are alternative 3D engines. Do not run Babylon.js and Three.js as competing renderers for the same game world.

Three.js remains responsible for the main scene, camera, rendering, models, lighting, and environmental effects.

You may investigate other libraries for specialized functionality.

Potential libraries include:

### Three.js ecosystem

- Three.js addons.
- GLTFLoader.
- GLTFExporter.
- OrbitControls, only for development tools if needed.
- EffectComposer, when post-processing is justified.

### Physics

- Rapier 3D (`@dimforge/rapier3d`).

Use lightweight collision detection where full physics is unnecessary.

### Geometry and optimization

- `three-mesh-bvh` for accelerated spatial queries and raycasting.
- `meshoptimizer` for geometry optimization.
- `@gltf-transform/core` and related tools for processing glTF assets where compatible with Bun.

### Text and visual effects

- `troika-three-text` for 3D text.
- `postprocessing` for optional visual effects.
- Custom Three.js shaders for water, fog, and environmental effects.

These are candidates, not mandatory dependencies. Evaluate whether each one genuinely improves the game before installing it.

Avoid introducing libraries just because they exist.

---

# 5. CDN and Dependency Strategy

Do not assume that every library must be manually loaded from a CDN.

Use Bun-managed npm dependencies as the primary approach.

Import packages through TypeScript modules and let Vite bundle and optimize them.

For example:

- Three.js should be installed as a project dependency.
- Three.js addons should use the same compatible Three.js version.
- Physics libraries should be imported through their supported package interfaces.
- Asset loading should use local GLB files.

CDNs may be used for optional experiments, external hosted assets, or services when appropriate.

However:

- Do not make core gameplay dependent on an external CDN.
- Do not load different Three.js versions from multiple sources.
- Do not mix CDN-loaded libraries with bundled copies of the same library.
- Do not load huge dependencies unnecessarily.
- Prefer local assets and bundled dependencies for reliable deployment.

The game must be capable of running after deployment without relying on external JavaScript CDNs.

---

# 6. Project Architecture

Use a modular architecture.

Suggested structure:

src/
  app/
    App.vue
    main.ts

  components/
    ui/
    menus/
    hud/
    dialogs/

  game/
    core/
      Game.ts
      GameLoop.ts
      GameBridge.ts
      GameConfig.ts

    rendering/
      Renderer.ts
      SceneManager.ts
      CameraController.ts
      Lighting.ts

    world/
      WorldManager.ts
      TerrainSystem.ts
      VillageGenerator.ts
      WaterSystem.ts
      VegetationSystem.ts
      EnvironmentManager.ts

    entities/
      Player.ts
      NPC.ts
      Interactable.ts

    systems/
      MovementSystem.ts
      InteractionSystem.ts
      TimeSystem.ts
      WeatherSystem.ts
      SeasonSystem.ts
      AudioSystem.ts
      GitHubWorldSystem.ts

    procedural/
      geometry/
      vegetation/
      buildings/
      props/
      materials/
      shaders/
      generators/

    assets/
      AssetManager.ts
      ModelLoader.ts
      AssetRegistry.ts

    tools/
      AssetWorkshop.ts
      AssetPreview.ts
      AssetExporter.ts

  stores/
    gameStore.ts
    settingsStore.ts
    playerStore.ts
    worldStore.ts
    githubStore.ts

  database/
    db.ts
    repositories/

  services/
    github/
    weather/

  types/
  utils/
  styles/

public/
  assets/
    quaternius/
    models/
    textures/
    audio/
    environments/

Do not create unnecessary abstractions. Keep modules small, maintainable, and independent.

## Engine and UI separation

Three.js owns the game world and rendering.

Vue owns menus, HUD, settings, and interface elements.

Pinia coordinates application state.

Dexie stores persistent player data.

Use a typed GameBridge to communicate between Vue and the game engine.

Do not place Three.js scene objects, meshes, cameras, or materials directly into Pinia state.

---

# 7. Mandatory Downloaded Assets

The developer has already downloaded two Quaternius asset packs.

These must be treated as the primary environmental asset foundation.

## Pack A: Ultimate Stylized Nature Pack

Use this for:

- Trees.
- Bushes.
- Rocks.
- Plants.
- Natural decorations.
- Environmental variety.

## Pack B: Stylized Nature MegaKit

Use this for:

- Larger environmental collections.
- Forests.
- Hillsides.
- Nature scenery.
- Additional vegetation and environmental objects.

These packs are already available locally.

### First task: inspect the downloaded assets

Before creating replacement models:

1. Inspect the project directory.
2. Find the two downloaded asset packs.
3. Identify their actual folder structures.
4. Identify available GLB, GLTF, FBX, OBJ, texture, and other files.
5. Inspect their included documentation and licenses.
6. Identify their models and animations.
7. Check their dimensions and polygon counts.
8. Determine whether textures are embedded or external.
9. Identify which models are appropriate for the game.

Do not assume the downloaded files are located in a particular folder.

Do not download duplicate copies of assets that already exist locally.

Do not replace these packs with unrelated placeholder assets.

### Create an asset registry

Build a centralized asset registry.

For each asset, record:

- Asset name.
- Source pack.
- Local file path.
- Model format.
- Approximate dimensions.
- Polygon count where available.
- Texture references.
- License information.
- Intended game usage.

Use consistent scaling and positioning when importing models.

If a model is too large or too detailed, optimize it using appropriate lightweight tools or select a simpler alternative.

Do not require Blender to make imported assets usable.

---

# 8. Procedural 3D Asset Creation

This is a major requirement.

The coding harness and the AI coding model should actively create custom 3D assets through code wherever practical.

Do not depend entirely on downloaded asset packs.

Create reusable procedural geometry generators using TypeScript and Three.js.

The developer should be able to ask the coding harness to create additional buildings, vegetation, environmental props, and scenery without opening a modeling application.

## Procedural vegetation

Create custom generators for:

- Coconut palm trees.
- Banana plants.
- Bamboo clusters.
- Sakura trees.
- Pine trees.
- Tropical trees.
- Bushes.
- Grass patches.
- Small flowers.
- Ferns.
- Fallen leaves.

Use appropriate geometry, simple materials, and stylized shapes.

For example, a coconut palm generator should create:

- A curved or slightly leaning trunk.
- Multiple curved palm fronds.
- Individual leaf geometry or grouped leaf meshes.
- Optional coconuts.
- Natural variation between instances.

A bamboo generator should create:

- Multiple vertical stalks.
- Visible segmented nodes.
- Different heights.
- Slightly varied orientations.
- Stylized green materials.

Avoid making every generated tree identical.

Introduce controlled procedural variation using deterministic seeds.

## Procedural buildings

Create reusable generators for:

- Japanese countryside houses.
- Kerala traditional tiled-roof houses.
- Small village huts.
- Wooden sheds.
- Village shops.
- Small shrines.
- Riverside structures.
- Boat shelters.

Generate geometry for:

- Walls.
- Roofs.
- Doors.
- Windows.
- Wooden beams.
- Roof tiles.
- Foundations.
- Porches.
- Steps.
- Decorative elements.

The Japanese and Kerala architectural influences should blend naturally.

Do not create generic cubes with flat roofs and call them finished houses.

Focus on recognizable silhouettes, roof shapes, proportions, and visual details.

## Procedural environmental props

Generate:

- Benches.
- Wooden fences.
- Stone lanterns.
- Wooden bridges.
- Small boats.
- Campfires.
- Firewood.
- Street lamps.
- Signboards.
- Pots.
- Small garden objects.
- Stone pathways.
- Wooden platforms.

## Procedural terrain

Create:

- Small hills.
- Gentle slopes.
- Riverbanks.
- Grass-covered ground.
- Dirt paths.
- Stone paths.
- Small cliffs.
- Pond edges.

Avoid making the entire environment a perfectly flat plane.

## Asset quality

Procedural objects must have deliberate visual design.

Use:

- Consistent proportions.
- Cohesive color palettes.
- Reusable materials.
- Proper geometry.
- Natural variation.
- Appropriate lighting.
- Correct object pivots.
- Efficient polygon counts.

Do not generate visually crude objects just to satisfy an asset count.

Quality matters more than quantity.

---

# 9. In-Project 3D Asset Workshop

Create a developer-only asset workshop.

This should be accessible during development and must not appear in the normal player's game interface.

The workshop should allow the developer to preview and test procedural assets.

Features:

- Select an asset category.
- Generate an asset.
- Adjust its dimensions.
- Adjust colors.
- Change geometry parameters.
- Change the random seed.
- Rotate the preview.
- Inspect the asset from different angles.
- Preview lighting.
- Preview materials.
- Regenerate variations.
- Export supported assets.

For example, the developer should be able to select:

Coconut Palm Tree

Then adjust:

- Tree height.
- Trunk thickness.
- Number of palm fronds.
- Leaf length.
- Leaf width.
- Leaf color.
- Coconut count.
- Curvature.

The workshop should display a live Three.js preview.

Where practical, allow exporting generated assets as GLB using Three.js GLTFExporter.

If a particular export operation is not supported in the current runtime, provide an alternative JSON or source-based export workflow.

Do not make the game runtime depend on the asset workshop.

The workshop is a development tool, not a player feature.

---

# 10. World and Visual Design

Create one cohesive fictional countryside combining Japanese and Kerala rural influences.

Japanese elements:

- Wooden houses.
- Dark tiled roofs.
- Bamboo.
- Sakura trees.
- Stone lanterns.
- Small bridges.
- Forests.
- Rice-growing landscapes.

Kerala elements:

- Coconut trees.
- Banana plants.
- Paddy fields.
- Backwaters.
- Wooden boats.
- Tropical vegetation.
- Traditional tiled-roof houses.
- Red-earth pathways.
- Monsoon scenery.

Create a natural transition between these elements.

The world should feel handcrafted, peaceful, and alive.

Use genuine 3D geometry and terrain elevation.

Avoid the appearance of a flat board or generic low-poly demo.

---

# 11. Camera and Player

Use an elevated third-person perspective with a controlled camera.

Initial camera requirements:

- Fixed camera orientation.
- Smooth player following.
- Slight downward angle.
- No uncontrolled rotation.
- Adjustable follow distance.
- Smooth damping.
- Good environmental visibility.

The world itself must remain fully 3D.

Player requirements:

- Stylized 3D character.
- WASD and arrow-key movement.
- Smooth acceleration and deceleration.
- Proper turning.
- Idle animation.
- Walking animation.
- Collision with obstacles.
- Terrain-aware movement.
- Optional sitting animation.

Avoid complicated RPG mechanics.

---

# 12. Environment and Interactions

Create a small but polished initial world containing:

- A village.
- A river or canal.
- A wooden bridge.
- Paddy fields.
- A bamboo grove.
- Coconut trees.
- A forest.
- A campfire location.
- A lake or pond.
- Scenic viewpoints.
- Village pathways.

Add optional interactions:

- Sit on a bench.
- Sit beside a campfire.
- Look at the river.
- Rest under a tree.
- Inspect landmarks.
- Interact with boats.
- Explore village structures.

### Campfire

Implement a particularly immersive campfire experience.

Include:

- Animated flames.
- Smoke particles.
- Warm surrounding illumination.
- Fire crackling audio.
- Sitting animation.
- Comfortable camera positioning.
- No time limit.
- No mandatory reward.

---

# 13. NPCs and Living World

Add a small number of peaceful NPCs.

Examples:

- A villager walking along a path.
- Someone sitting outside a house.
- Someone near the river.
- A person crossing a bridge.
- Someone tending to a garden.

Implement simple routines and idle animations.

NPCs should feel like part of the countryside, not quest dispensers.

---

# 14. Weather, Time, and Seasons

Implement:

- Sunrise.
- Morning.
- Afternoon.
- Sunset.
- Evening.
- Night.

Add a fictional seasonal cycle:

- Spring.
- Summer.
- Monsoon.
- Autumn.
- Winter.

Weather conditions:

- Clear skies.
- Cloudy.
- Light rain.
- Heavy rain.
- Mist.

Add environmental effects:

- Rain particles.
- Fog.
- Wet surfaces.
- Puddles.
- Fireflies.
- Falling leaves.
- Gentle water movement.

Use lightweight shaders and particles.

Weather must work without external APIs.

---

# 15. Audio

Implement layered environmental audio.

Include:

- Birds.
- Crickets.
- Wind.
- Flowing water.
- Rustling leaves.
- Rain.
- Rain hitting rooftops.
- Campfire crackling.
- Village ambience.

Audio should respond to location, time, weather, and interactions.

Provide separate volume controls.

Music must be optional.

---

# 16. GitHub Integration

GitHub integration is optional.

GitHub history should become personal memories in the world.

Core principle:

GitHub provides the memories; exploration gives the player time to discover them.

Support existing GitHub accounts with:

- Many repositories.
- Years of commits.
- Large contribution histories.
- Multiple projects.
- New repositories.

Do not generate one building per repository or one object per commit.

Create a GitHub interpreter that:

1. Retrieves authorized data.
2. Normalizes history.
3. Groups related repositories.
4. Identifies meaningful milestones.
5. Prioritizes discoveries.
6. Converts selected milestones into environmental memories.
7. Tracks discovered and undiscovered memories.
8. Prevents duplicate objects.

Use gradual discovery.

Do not overwhelm the player with their entire history immediately.

No productivity rankings or penalties.

Use browser-safe authorization, never expose client secrets, and request private repository permissions only with explicit authorization.

---

# 17. Persistence

Use Dexie.js and IndexedDB.

Persist:

- Player position.
- World state.
- Discovered memories.
- Settings.
- Audio preferences.
- Environmental preferences.
- Time and season.
- GitHub synchronization metadata.

Use versioned database schemas.

The game must work without internet after required assets have loaded.

---

# 18. Hardware and Performance Restrictions

The developer's computer has limited hardware resources.

Performance must be a core architectural consideration from the beginning.

Target ordinary desktop and laptop hardware.

Implement:

- Instanced meshes.
- Shared materials.
- Frustum culling.
- LOD.
- Lightweight collision detection.
- Limited dynamic lights.
- Efficient particles.
- Optimized GLB models.
- Efficient texture sizes.
- Lazy loading.
- Proper resource disposal.

Initial graphics defaults:

- WebGL.
- Pixel ratio capped at 1.5.
- Shadows disabled by default.
- One main directional light.
- Hemisphere lighting.
- Limited dynamic lighting.
- No mandatory post-processing.
- Small initial map.

Provide Low, Medium, and High graphics settings.

Low settings must remain attractive and playable.

Do not optimize only after building a huge world. Design for performance from the beginning.

---

# 19. UI

Use Vue 3 for the user interface.

Create:

Main menu:
- Continue.
- New Journey.
- Settings.
- GitHub Connection.
- About.

In-game HUD:
- Minimal interaction prompts.
- Optional time display.
- Optional weather indicator.
- Pause menu.

Settings:
- Graphics.
- Audio.
- Controls.
- Accessibility.
- Camera.
- GitHub connection.

Keep the interface minimal and visually consistent with the world.

---

# 20. Deployment

The game must be deployable as a static application.

Support:

- GitHub Pages.
- Cloudflare Pages.
- Netlify.

Use Bun and Vite.

No backend is required.

Ensure production assets load correctly from deployment subpaths.

Avoid runtime dependence on external CDN libraries.

---

# 21. Implementation Phases

Do not build the entire game at once.

### Phase 1: Inspect and establish the foundation

- Inspect existing project.
- Identify downloaded Quaternius packs.
- Inspect available asset formats.
- Establish Bun and Vite configuration.
- Set up Vue 3, TypeScript, Pinia, Dexie, and Three.js.
- Establish the GameBridge.
- Create the first 3D scene.

### Phase 2: Asset pipeline

- Import both downloaded Quaternius packs.
- Create an asset registry.
- Test GLB loading.
- Build procedural geometry utilities.
- Create initial trees, rocks, grass, and paths.
- Build the developer asset workshop.

### Phase 3: First environment

- Build terrain.
- Add vegetation.
- Add houses.
- Add water.
- Add paths.
- Add the first village.
- Establish lighting and camera.

### Phase 4: Player and interaction

- Implement player.
- Implement movement.
- Implement collisions.
- Add animations.
- Add interactions.
- Build the campfire experience.

### Phase 5: Living world

- NPCs.
- Day and night.
- Weather.
- Seasons.
- Environmental audio.

### Phase 6: Persistence and GitHub

- Dexie.
- Player persistence.
- GitHub authorization.
- History interpretation.
- Gradual discovery.

### Phase 7: Optimization and polish

- Rendering optimization.
- Asset optimization.
- Performance testing.
- Offline testing.
- Production build.
- Deployment testing.

---

# 22. Critical Development Instructions

Before implementing:

1. Inspect the existing repository.
2. Inspect the two downloaded Quaternius packs.
3. Understand the available model files.
4. Identify suitable Three.js-compatible libraries.
5. Evaluate dependency size and Bun compatibility.
6. Establish a practical architecture.
7. Start building.

Do not stop after creating a plan.

Implement actual working features.

After each phase:

- Run TypeScript checks.
- Run the production build.
- Run relevant tests.
- Fix errors.
- Verify the game still launches.

Do not invent assets or pretend they exist.

Do not create buttons that do nothing.

Do not introduce heavy tools that the developer cannot reasonably run.

The AI coding model should actively create procedural 3D assets through TypeScript and Three.js wherever appropriate, instead of relying entirely on downloaded assets.

Use the downloaded Quaternius collections as the primary visual foundation and supplement them with custom procedural Japanese and Kerala countryside assets.

Keep the first playable environment small, polished, and optimized.

The final experience should feel like a beautiful little living countryside.

**Gitakure is not a game about getting more work done. It is a place where you can forget about work for a while.**