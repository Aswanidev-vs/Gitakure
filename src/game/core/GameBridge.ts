import type { CameraMode, GameSettings } from '@/types';

// Typed message contract between the Vue/Pinia UI layer and the Three.js game.
// Only serializable data crosses this boundary — never scene objects, meshes,
// cameras, or materials.

export interface GameSnapshot {
  player: { x: number; y: number; z: number; rotation: number };
  time: number; // 0..1 day fraction
  day: number;
  season: string;
  weather: string;
  cameraMode: CameraMode;
  fps: number;
  drawCalls: number;
}

export type GameEvent =
  | { type: 'ready' }
  | { type: 'snapshot'; snapshot: GameSnapshot }
  | { type: 'error'; message: string }
  | { type: 'interaction'; prompt: string | null }
  | { type: 'dialogue'; speaker: string; text: string }
  | { type: 'pause' }
  | { type: 'resume' };

export type GameCommand =
  | { type: 'setMenuMode'; isMenu: boolean }
  | { type: 'setCharacterModel'; model: 'female' | 'male' }
  | { type: 'setCameraMode'; mode: CameraMode }
  | { type: 'setFollowDistance'; distance: number }
  | { type: 'setQuality'; settings: GameSettings['graphics'] }
  | { type: 'setAudio'; settings: GameSettings['audio'] }
  | { type: 'setPaused'; paused: boolean }
  | { type: 'setReducedMotion'; value: boolean }
  | { type: 'setTimeOfDay'; time: number }
  | { type: 'setSeason'; season: string }
  | { type: 'setWeather'; weather: string }
  | { type: 'saveState' }
  | { type: 'teleport'; x: number; y: number; z: number }
  | { type: 'connectGithub'; username: string; token?: string }
  | { type: 'disconnectGithub' }
  | { type: 'spawnGithubKeepsake' };

type Handler<T> = (payload: T) => void;

export class GameBridge {
  private eventHandlers = new Map<GameEvent['type'], Set<Handler<never>>>();
  private commandQueue: GameCommand[] = [];
  private commandHandler: ((cmd: GameCommand) => void) | null = null;

  // --- Vue -> Game ---
  emit(cmd: GameCommand): void {
    if (this.commandHandler) {
      this.commandHandler(cmd);
    } else {
      this.commandQueue.push(cmd);
    }
  }

  /** The game engine registers its command consumer here on boot. */
  onCommand(handler: (cmd: GameCommand) => void): void {
    this.commandHandler = handler;
    // Flush anything queued before the engine was ready.
    for (const cmd of this.commandQueue) handler(cmd);
    this.commandQueue.length = 0;
  }

  // --- Game -> Vue ---
  on<K extends GameEvent['type']>(type: K, handler: Handler<Extract<GameEvent, { type: K }>>): () => void {
    let set = this.eventHandlers.get(type);
    if (!set) {
      set = new Set();
      this.eventHandlers.set(type, set);
    }
    set.add(handler as Handler<never>);
    return () => set!.delete(handler as Handler<never>);
  }

  send(event: GameEvent): void {
    const set = this.eventHandlers.get(event.type);
    if (!set) return;
    for (const h of set) (h as Handler<typeof event>)(event);
  }
}

/** Shared singleton instance. */
export const gameBridge = new GameBridge();