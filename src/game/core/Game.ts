import * as THREE from 'three';
import { GameLoop } from './GameLoop';
import { GameBridge, gameBridge, type GameCommand } from './GameBridge';
import { resolveGraphics } from './GameConfig';
import { Renderer } from '@/game/rendering/Renderer';
import { SceneManager } from '@/game/rendering/SceneManager';
import { CameraController } from '@/game/rendering/CameraController';
import { Lighting } from '@/game/rendering/Lighting';
import { loadModel } from '@/game/assets/AssetManager';
import { createCoconutPalm } from '@/game/procedural/vegetation/palm';
import { createBamboo } from '@/game/procedural/vegetation/bamboo';
import { createSakura } from '@/game/procedural/vegetation/sakura';
import { createPine } from '@/game/procedural/vegetation/pine';
import { createRock, createGrassTuft, createFlowerCluster, createBush } from '@/game/procedural/props';
import { createHouse } from '@/game/procedural/buildings/house';
import { createTorii } from '@/game/procedural/buildings/torii';
import { createBridge } from '@/game/procedural/buildings/bridge';
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

    this.player = { position: [0, 0, 0], rotation: 0 };
    this.world = { time: 0.35, day: 1, season: 'spring', weather: 'clear' };

    this.loop.onRender(() => this.render(this.dtSeconds()));
    this.loop.onTick((dt) => this.update(dt));

    window.addEventListener('resize', this.onResize);
    this.bridge.send({ type: 'ready' });
  }

  async start(): Promise<void> {
    await this.buildPlaceholderScene();
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
  private async buildPlaceholderScene(): Promise<void> {
    const scene = this.sceneManager.scene;

    const groundGeo = new THREE.CircleGeometry(40, 48);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x6a8f5b, roughness: 1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // A simple procedural "player" capsule placeholder so the camera has a target.
    const playerMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 1.1, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.7 }),
    );
    playerMesh.position.set(0, 0.95, 0);
    playerMesh.castShadow = true;
    playerMesh.name = 'player';
    scene.add(playerMesh);

    try {
      const pine = await loadModel('/glb/Pine%20Trees.glb');
      const inst = pine.scene;
      inst.position.set(6, 0, -4);
      inst.scale.setScalar(0.5);
      scene.add(inst);

      const palm = await loadModel('/glb/Palm%20Trees.glb');
      const palmInst = palm.scene;
      palmInst.position.set(-7, 0, 3);
      palmInst.scale.setScalar(0.5);
      scene.add(palmInst);
    } catch {
      // Non-fatal in Phase 1; logged so the missing file is visible.
      console.warn('Phase 1: placeholder GLB failed to load; ground-only scene.');
    }

    // Phase 2: scatter procedural vegetation to prove the generators.
    const rng = new Rng(12345);
    for (let i = 0; i < 6; i++) {
      const a = rng.range(0, Math.PI * 2);
      const d = rng.range(5, 18);
      const palm = createCoconutPalm({ seed: 100 + i, curvature: rng.range(0.1, 0.5) });
      palm.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
      scene.add(palm);
    }
    for (let i = 0; i < 4; i++) {
      const a = rng.range(0, Math.PI * 2);
      const d = rng.range(6, 16);
      const bamboo = createBamboo({ seed: 200 + i });
      bamboo.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
      scene.add(bamboo);
    }
    const sakura = createSakura({ seed: 300 });
    sakura.position.set(4, 0, 6);
    scene.add(sakura);
    const pine = createPine({ seed: 400 });
    pine.position.set(-5, 0, -6);
    scene.add(pine);

    for (let i = 0; i < 10; i++) {
      const a = rng.range(0, Math.PI * 2);
      const d = rng.range(3, 20);
      const rock = createRock({ seed: 500 + i, radius: rng.range(0.3, 0.9) });
      rock.position.set(Math.cos(a) * d, 0.1, Math.sin(a) * d);
      scene.add(rock);
    }
    for (let i = 0; i < 30; i++) {
      const a = rng.range(0, Math.PI * 2);
      const d = rng.range(2, 22);
      const tuft = createGrassTuft({ seed: 600 + i });
      tuft.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
      scene.add(tuft);
    }
    for (let i = 0; i < 8; i++) {
      const a = rng.range(0, Math.PI * 2);
      const d = rng.range(4, 18);
      const flowers = createFlowerCluster({ seed: 700 + i, color: i % 2 === 0 ? 'flowerPink' : 'flowerYellow' });
      flowers.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
      scene.add(flowers);
    }
    for (let i = 0; i < 5; i++) {
      const a = rng.range(0, Math.PI * 2);
      const d = rng.range(5, 16);
      const bush = createBush({ seed: 800 + i });
      bush.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
      scene.add(bush);
    }

    // A tiny village cluster: two houses, a torii, a bridge.
    const houseA = createHouse({ style: 'japanese', seed: 901 });
    houseA.position.set(9, 0, -2);
    scene.add(houseA);
    const houseB = createHouse({ style: 'kerala', seed: 902 });
    houseB.position.set(-9, 0, -6);
    scene.add(houseB);
    const torii = createTorii({ seed: 903 });
    torii.position.set(0, 0, -14);
    scene.add(torii);
    const bridge = createBridge({ seed: 904 });
    bridge.position.set(-2, 0.1, 10);
    bridge.rotation.y = Math.PI / 2;
    scene.add(bridge);

    this.lighting.setTimeOfDay(this.world.time);
    const p = new THREE.Vector3(...this.player.position);
    this.camera.snap(p, this.player.rotation);
  }

  private update(dt: number): void {
    if (!this.running) return;

    // Time of day advances slowly (full cycle ~10 min).
    this.world.time = (this.world.time + dt / 600) % 1;
    this.lighting.setTimeOfDay(this.world.time);

    // Simple WASD movement for the player placeholder (Phase 4 replaces this).
    this.updateMovement(dt);

    const playerObj = this.sceneManager.scene.getObjectByName('player');
    const playerVec = new THREE.Vector3(...this.player.position);
    this.camera.update(playerVec, this.player.rotation, dt, [this.sceneManager.scene]);
    this.lighting.setFollowTarget(playerObj ?? this.lighting.sun.target);
  }

  private readonly keys = new Set<string>();
  private updateMovement(dt: number): void {
    // Movement handled by MovementSystem in Phase 4; placeholder no-op.
    void this.keys;
    void dt;
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
    this.renderer.dispose();
    this.sceneManager.dispose();
    this.lighting.dispose();
    this.bridge.onCommand(() => {});
  }
}

export { gameBridge };
export type { GameCommand };
export const GAME_DEFAULT_SETTINGS = DEFAULT_SETTINGS;