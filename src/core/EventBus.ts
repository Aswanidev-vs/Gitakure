/**
 * The one event bus for the game. Rendering never imports simulation and the
 * other way round; they meet here. Everything is synchronous, strongly typed,
 * and fire-and-forget — listeners must not assume they are the only subscriber.
 */

import type {
  CropStage,
  DayPhase,
  Direction,
  Inventory,
  ItemId,
  Landmark,
  LocationId,
  Season,
  Settings,
  SyncSummary,
  Weather,
  WorldClock,
} from '@/shared/types';

export interface GameEventMap {
  'clock:tick': { clock: WorldClock; minutesPerSecond: number };
  'clock:phase': { phase: DayPhase; clock: WorldClock };
  'weather:change': { weather: Weather; clock: WorldClock };
  'season:change': { season: Season; clock: WorldClock };

  'world:ready': { saveLoaded: boolean };
  'world:save': { reason: 'auto' | 'manual' | 'scene' | 'sync' };

  'player:moved': { x: number; y: number; direction: Direction };
  'player:region': { location: LocationId };
  'player:interact': { targetUid: string; verb: string };
  'player:inventory': { inventory: Inventory };

  'scene:change': { from: LocationId | null; to: LocationId };

  'crop:planted': { uid: string; crop: ItemId };
  'crop:growth': { uid: string; stage: CropStage };
  'crop:harvested': { uid: string; crop: ItemId; amount: number };

  'landmark:built': { landmark: Landmark };
  'journal:add': { uid: string; title: string };

  'sync:started': { username: string };
  'sync:complete': { summary: SyncSummary };
  'sync:error': { message: string };

  'npc:talk': { npcId: string; lines: string[] };
  'npc:met': { npcId: string };

  'dialogue:open': { speaker: string; lines: string[] };
  'dialogue:close': undefined;

  'ui:toast': { text: string; tone: 'plain' | 'warm' | 'warn' };
  'settings:change': { settings: Settings };
}

type Handler<K extends keyof GameEventMap> = (payload: GameEventMap[K]) => void;

type AnyHandler = (payload: never) => void;

class EventBus {
  private readonly handlers = new Map<keyof GameEventMap, Set<AnyHandler>>();

  on<K extends keyof GameEventMap>(event: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as AnyHandler);
    return () => {
      set?.delete(handler as AnyHandler);
    };
  }

  once<K extends keyof GameEventMap>(event: K, handler: Handler<K>): () => void {
    const off = this.on(event, (payload) => {
      off();
      (handler as Handler<K>)(payload);
    });
    return off;
  }

  off<K extends keyof GameEventMap>(event: K, handler: Handler<K>): void {
    this.handlers.get(event)?.delete(handler as AnyHandler);
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // Copy before iterating so a listener unsubscribing mid-emit is safe.
    for (const handler of [...set]) {
      (handler as Handler<K>)(payload);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const bus = new EventBus();