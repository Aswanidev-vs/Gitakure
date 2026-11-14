import * as THREE from 'three';
import { GameLoop } from './GameLoop';
import { GameBridge, gameBridge, type GameCommand } from './GameBridge';
import { resolveGraphics } from './GameConfig';
import { Renderer } from '@/game/rendering/Renderer';
import { SceneManager } from '@/game/rendering/SceneManager';
import { CameraController } from '@/game/rendering/CameraController';
import { Lighting } from '@/game/rendering/Lighting';
import { WorldManager } from '@/game/world/WorldManager';
import { Player } from '@/game/entities/Player';
import { Campfire } from '@/game/entities/Campfire';
import { NPC } from '@/game/entities/NPC';
import { MovementSystem } from '@/game/systems/MovementSystem';
import { InteractionSystem } from '@/game/systems/InteractionSystem';
import { TimeSystem } from '@/game/systems/TimeSystem';
import { WeatherSystem } from '@/game/systems/WeatherSystem';
import { SeasonSystem } from '@/game/systems/SeasonSystem';
import { AudioSystem } from '@/game/systems/AudioSystem';
import { Rng } from '@/utils/rng';
import { DEFAULT_SETTINGS, type GameSettings, type PlayerState, type WorldState } from '@/types';

/**
 * Game — top-level Three.js orchestrator. Owns the renderer, scene, camera,
 * lighting, loop, and the world systems. Communicates with Vue only through
 * the typed GameBridge. No Three.js objects are exposed to Pinia.
 */
export class Game {
  private readonly bridge: GameBridge;
  private readonly container: HTMLElement;
  private readonly loop: GameLoop;
  private readonly renderer: Renderer;
  private readonly sceneManager: SceneManager;
  private readonly camera: CameraController;
  private readonly lighting: Lighting;
  private readonly worldManager: WorldManager;
  private player: Player | null = null;
  private campfire: Campfire | null = null;
  private movement: MovementSystem | null = null;
  private interactions: InteractionSystem | null = null;
  private timeSystem: TimeSystem;
  private weatherSystem: WeatherSystem;
  private seasonSystem: SeasonSystem;
  private audioSystem: AudioSystem;
  private npcs: NPC[] = [];

  private settings: GameSettings;
  private playerState: PlayerState;
  private world: WorldState;
  private running = false;
  private lastInteraction: string | null = null;
  private lastSentPrompt: string | null = null;
  private fpsAccum = 0;
  private fpsFrames = 0;
  private fps = 0;
  private snapshotTimer = 0;

  constructor(container: HTMLElement, settings: GameSettings) {
    this.container = container;
    this.bridge = gameBridge;
    this.settings = settings;
    this.bridge.onCommand((cmd) => this.handleCommand(cmd));

    this.loop = new GameLoop();
    this.renderer = new Renderer(container, resolveGraphics(settings.graphics.quality));
    this.sceneManager = new SceneManager();
    this.camera = new CameraController(
      container.clientWidth / Math.max(1, container.clientHeight),
      {
        mode: settings.camera.mode,
        followDistance: settings.camera.followDistance,
        fov: settings.camera.fov,
      },
    );
    this.lighting = new Lighting(this.sceneManager.scene);
    this.worldManager = new WorldManager(1);
    this.sceneManager.scene.add(this.worldManager.group);

    // Living-world systems.
    this.timeSystem = new TimeSystem();
    this.weatherSystem = new WeatherSystem(this.sceneManager.scene);
    this.seasonSystem = new SeasonSystem();
    this.audioSystem = new AudioSystem(settings.audio);
    this.weatherSystem.onWeatherChange((w) => {
      this.world.weather = w;
      this.bridge.send({ type: 'snapshot', snapshot: this.buildSnapshot() });
    });
    this.seasonSystem.onSeasonChange((s) => {
      this.world.season = s;
    });
    this.weatherSystem.setReducedMotion(settings.reducedMotion);

    this.playerState = { position: [0, 0, 0], rotation: 0 };
    this.world = { time: 0.35, day: 1, season: 'spring', weather: 'clear' };

    this.loop.onRender(() => this.render(this.dtSeconds()));
    this.loop.onTick((dt) => this.update(dt));

    window.addEventListener('resize', this.onResize);
    this.bridge.send({ type: 'ready' });
  }

  async start(): Promise<void> {
    await this.buildWorld();
    this.running = true;
    this.loop.start();
    this.bridge.send({ type: 'ready' });
  }

  stop(): void {
    this.running = false;
    this.loop.stop();
  }

  get isRunning(): boolean {
    return this.running;
  }

  /** Phase 1 placeholder: ground + one pine to prove the GLB pipeline + camera toggle. */
  private async buildWorld(): Promise<void> {
    const scene = this.sceneManager.scene;

    // Build the async vegetation layer (loads GLB prototypes).
    await this.worldManager.build();

    // Player entity (stylized low-poly humanoid).
    this.player = new Player();
    scene.add(this.player.group);

    // Place the player on the terrain near the village bench.
    const start = this.worldManager.benchPosition;
    this.playerState.position = [
      start.x + 2,
      this.worldManager.heightAt(start.x + 2, start.z + 2),
      start.z + 2,
    ];
    this.player.group.position.set(...this.playerState.position);

    // Movement system (WASD + collision + terrain-aware).
    this.movement = new MovementSystem(this.worldManager.terrain);
    this.movement.enable();

    // Campfire experience at the village campfire spot.
    this.campfire = new Campfire(this.worldManager.campfirePosition);
    this.campfire.setReducedMotion(this.settings.reducedMotion);
    scene.add(this.campfire.group);

    // Interaction system: sit by the campfire / bench.
    this.interactions = new InteractionSystem(this.player, this.movement);
    this.interactions.setPromptListener((prompt) => {
      this.lastInteraction = prompt;
      this.bridge.send({ type: 'interaction', prompt });
    });
    this.interactions.add({
      id: 'campfire',
      label: 'Rest by the campfire',
      position: this.worldManager.campfirePosition.clone().add(new THREE.Vector3(0, 0.5, 0)),
      radius: 2.5,
      sit: true,
    });
    this.interactions.add({
      id: 'bench',
      label: 'Sit on the bench',
      position: this.worldManager.benchPosition.clone().add(new THREE.Vector3(0, 0.5, 0)),
      radius: 2,
      sit: true,
    });

    // Peaceful NPCs: a villager walking a path, someone by the river,
    // someone tending a garden near the houses.
    const npcRng = new Rng(4242);
    const villageCenter = this.worldManager.village.group.position;
    const npcDefs = [
      { name: 'Ren', shirt: 0x6a8fbf, pants: 0x3a4a5a, at: new THREE.Vector3(villageCenter.x + 4, 0, villageCenter.z + 6) },
      { name: 'Amma', shirt: 0xc86a8a, pants: 0x5a3a4a, at: new THREE.Vector3(villageCenter.x - 3, 0, villageCenter.z + 2) },
      { name: 'Appu', shirt: 0x6abf8a, pants: 0x3a5a4a, at: new THREE.Vector3(villageCenter.x - 10, 0, villageCenter.z + 8) },
    ];
    for (const def of npcDefs) {
      const y = this.worldManager.heightAt(def.at.x, def.at.z);
      const npc = new NPC(
        { name: def.name, shirtColor: def.shirt, pantsColor: def.pants, wanderRadius: 5, seed: npcRng.int(0, 9999) },
        new THREE.Vector3(def.at.x, y, def.at.z),
      );
      this.npcs.push(npc);
      scene.add(npc.group);
    }

    // E key interacts.
    window.addEventListener('keydown', this.onInteractKey);
    // Audio must start on a user gesture (browser autoplay policy).
    window.addEventListener('pointerdown', this.onFirstGesture);
    window.addEventListener('keydown', this.onFirstGesture);

    this.lighting.setTimeOfDay(this.world.time);
    const p = new THREE.Vector3(...this.playerState.position);
    this.camera.snap(p, this.playerState.rotation);
  }

  private onInteractKey = (e: KeyboardEvent): void => {
    if (e.code === 'KeyE' && !e.repeat) {
      this.interactions?.interact();
    }
  };

  private onFirstGesture = (): void => {
    this.audioSystem.start();
    window.removeEventListener('pointerdown', this.onFirstGesture);
    window.removeEventListener('keydown', this.onFirstGesture);
  };

  private elapsedTime = 0;
  private update(dt: number): void {
    if (!this.running) return;
    this.elapsedTime += dt;

    // Time of day (drives lighting + audio + snapshot).
    this.timeSystem.update(dt);
    this.lighting.setTimeOfDay(this.timeSystem.time);
    this.world.time = this.timeSystem.time;
    this.world.day = this.timeSystem.day;
    this.world.season = this.seasonSystem.season;
    this.world.weather = this.weatherSystem.current;

    // World ambience (water shader).
    this.worldManager.update(this.elapsedTime);

    // Season + weather.
    this.seasonSystem.update(dt);
    const camPos = this.camera.camera.position;
    this.weatherSystem.update(dt, camPos);
    this.sceneManager.setFogDensity(this.weatherSystem.fogDensity());

    if (this.player && this.movement) {
      // Movement + terrain-aware height.
      this.movement.update(dt, this.player.group.position);
      this.playerState.position = [this.player.group.position.x, this.player.group.position.y, this.player.group.position.z];
      this.playerState.rotation = this.movement.facingYaw;
      this.player.setFacing(this.playerState.rotation);

      // Animation state.
      const speed = this.movement.speed;
      if (this.movement.isSitting) {
        this.player.setAnim('sit');
      } else if (speed > 0.1) {
        this.player.setAnim('walk');
      } else {
        this.player.setAnim('idle');
      }
      this.player.update(dt, speed);

      // Interaction proximity.
      this.interactions?.update(this.player.group.position);

      // Camera follow.
      const playerVec = this.player.group.position;
      this.camera.update(playerVec, this.playerState.rotation, dt, [this.player.group]);
      this.lighting.setFollowTarget(this.player.group);
    }

    // NPCs wander.
    for (const npc of this.npcs) npc.update(dt);

    // Campfire flame/smoke animation.
    this.campfire?.update(dt, this.elapsedTime);

    // Audio responds to time + weather.
    this.audioSystem.update(dt, this.timeSystem.phase, this.weatherSystem.current);
  }

  private lastTime = performance.now();
  private dtSeconds(): number {
    const now = performance.now();
    const dt = Math.min(0.25, (now - this.lastTime) / 1000);
    this.lastTime = now;
    return dt;
  }

  private buildSnapshot() {
    return {
      player: {
        x: this.playerState.position[0],
        y: this.playerState.position[1],
        z: this.playerState.position[2],
        rotation: this.playerState.rotation,
      },
      time: this.world.time,
      day: this.world.day,
      season: this.world.season,
      weather: this.world.weather,
      cameraMode: this.camera.cameraMode,
      fps: this.fps,
      drawCalls: this.renderer.instance.info.render.calls,
    };
  }

  private render(dt: number): void {
    // FPS sampling.
    this.fpsAccum += dt;
    this.fpsFrames++;
    this.snapshotTimer += dt;
    if (this.fpsAccum >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsAccum);
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }

    this.renderer.instance.render(this.sceneManager.scene, this.camera.camera);

    if (this.snapshotTimer >= 0.25) {
      this.snapshotTimer = 0;
      this.bridge.send({ type: 'snapshot', snapshot: this.buildSnapshot() });
    }

    // Emit interaction prompt changes.
    const prompt = this.lastInteraction;
    if (prompt !== this.lastSentPrompt) {
      this.lastSentPrompt = prompt;
      this.bridge.send({ type: 'interaction', prompt });
    }
  }

  private handleCommand(cmd: GameCommand): void {
    switch (cmd.type) {
      case 'setCameraMode':
        this.camera.setMode(cmd.mode);
        this.settings.camera.mode = cmd.mode;
        break;
      case 'setFollowDistance':
        this.camera.setFollowDistance(cmd.distance);
        this.settings.camera.followDistance = cmd.distance;
        break;
      case 'setQuality':
        this.settings.graphics = cmd.settings;
        this.renderer.applySettings(cmd.settings);
        this.lighting.setShadows(cmd.settings.shadows);
        break;
      case 'setAudio':
        this.settings.audio = cmd.settings;
        this.audioSystem.setSettings(cmd.settings);
        break;
      case 'setPaused':
        if (cmd.paused) this.loop.stop();
        else if (this.running) this.loop.start();
        break;
      case 'setReducedMotion':
        this.settings.reducedMotion = cmd.value;
        this.campfire?.setReducedMotion(cmd.value);
        this.weatherSystem.setReducedMotion(cmd.value);
        break;
      case 'setTimeOfDay':
        this.timeSystem.setTime(cmd.time);
        this.lighting.setTimeOfDay(cmd.time);
        break;
      case 'setSeason':
        this.seasonSystem.setSeason(cmd.season as WorldState['season']);
        this.world.season = cmd.season as WorldState['season'];
        break;
      case 'setWeather':
        // Weather cycles automatically; setting is a debug override for now.
        this.world.weather = cmd.weather as WorldState['weather'];
        break;
      case 'teleport':
        this.playerState.position = [cmd.x, cmd.y, cmd.z];
        break;
      case 'saveState':
        // Dexie persistence wired in Phase 6.
        break;
    }
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h);
    this.camera.setAspect(w / h);
  };

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onInteractKey);
    window.removeEventListener('pointerdown', this.onFirstGesture);
    window.removeEventListener('keydown', this.onFirstGesture);
    this.movement?.dispose();
    this.interactions?.dispose();
    this.campfire?.dispose();
    for (const npc of this.npcs) npc.dispose();
    this.npcs.length = 0;
    this.weatherSystem.dispose();
    this.audioSystem.dispose();
    this.worldManager.dispose();
    this.renderer.dispose();
    this.sceneManager.dispose();
    this.lighting.dispose();
    this.bridge.onCommand(() => {});
  }
}

export { gameBridge };
export type { GameCommand };
export const GAME_DEFAULT_SETTINGS = DEFAULT_SETTINGS;