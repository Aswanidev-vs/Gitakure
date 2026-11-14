import * as THREE from 'three';
import { GameLoop } from './GameLoop';
import { GameBridge, gameBridge, type GameCommand } from './GameBridge';
import { resolveGraphics } from './GameConfig';
import { Renderer } from '@/game/rendering/Renderer';
import { SceneManager } from '@/game/rendering/SceneManager';
import { CameraController } from '@/game/rendering/CameraController';
import { Lighting } from '@/game/rendering/Lighting';
import { WorldManager } from '@/game/world/WorldManager';
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
  private playerMesh: THREE.Mesh | null = null;

  private settings: GameSettings;
  private player: PlayerState;
  private world: WorldState;
  private running = false;
  private lastInteraction: string | null = null;
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

    this.player = { position: [0, 0, 0], rotation: 0 };
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

    // Place the player capsule at the village center on the terrain.
    const playerMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 1.1, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.7 }),
    );
    playerMesh.castShadow = true;
    playerMesh.name = 'player';
    scene.add(playerMesh);
    this.playerMesh = playerMesh;

    // Build the async vegetation layer (loads GLB prototypes).
    await this.worldManager.build();

    // Place the player on the terrain near the campfire/village.
    const start = this.worldManager.benchPosition;
    this.player.position = [start.x + 2, this.worldManager.heightAt(start.x + 2, start.z + 2), start.z + 2];
    playerMesh.position.set(...this.player.position);

    this.lighting.setTimeOfDay(this.world.time);
    const p = new THREE.Vector3(...this.player.position);
    this.camera.snap(p, this.player.rotation);
  }

  private update(dt: number): void {
    if (!this.running) return;

    // Time of day advances slowly (full cycle ~10 min).
    this.world.time = (this.world.time + dt / 600) % 1;
    this.lighting.setTimeOfDay(this.world.time);

    // World ambience (water shader).
    this.worldManager.update(this.elapsedTime);

    // Player movement (Phase 4 replaces the placeholder).
    this.updateMovement(dt);

    // Keep the player capsule glued to the terrain height.
    if (this.playerMesh) {
      const groundY = this.worldManager.heightAt(this.player.position[0], this.player.position[2]);
      this.player.position[1] = groundY;
      this.playerMesh.position.set(
        this.player.position[0],
        this.player.position[1] + 0.95,
        this.player.position[2],
      );
      this.playerMesh.rotation.y = this.player.rotation;
    }

    const playerVec = new THREE.Vector3(...this.player.position);
    this.camera.update(playerVec, this.player.rotation, dt, this.playerMesh ? [this.playerMesh] : []);
    if (this.playerMesh) this.lighting.setFollowTarget(this.playerMesh);
  }

  private elapsedTime = 0;
  private updateMovement(dt: number): void {
    // Phase 4: WASD movement, acceleration, collision, terrain-aware.
    this.elapsedTime += dt;
  }

  private lastTime = performance.now();
  private dtSeconds(): number {
    const now = performance.now();
    const dt = Math.min(0.25, (now - this.lastTime) / 1000);
    this.lastTime = now;
    return dt;
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
      this.bridge.send({
        type: 'snapshot',
        snapshot: {
          player: {
            x: this.player.position[0],
            y: this.player.position[1],
            z: this.player.position[2],
            rotation: this.player.rotation,
          },
          time: this.world.time,
          day: this.world.day,
          season: this.world.season,
          weather: this.world.weather,
          cameraMode: this.camera.cameraMode,
          fps: this.fps,
          drawCalls: this.renderer.instance.info.render.calls,
        },
      });
    }

    // Emit interaction prompt changes.
    const prompt = this.lastInteraction;
    if (prompt !== this.lastInteraction) {
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
        // AudioSystem wired in Phase 5.
        break;
      case 'setPaused':
        if (cmd.paused) this.loop.stop();
        else if (this.running) this.loop.start();
        break;
      case 'setReducedMotion':
        this.settings.reducedMotion = cmd.value;
        break;
      case 'setTimeOfDay':
        this.world.time = cmd.time;
        this.lighting.setTimeOfDay(cmd.time);
        break;
      case 'setSeason':
        this.world.season = cmd.season as WorldState['season'];
        break;
      case 'setWeather':
        this.world.weather = cmd.weather as WorldState['weather'];
        break;
      case 'teleport':
        this.player.position = [cmd.x, cmd.y, cmd.z];
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