import type { WorldDiscovery } from '@/storage/db';

export type BridgeEventType =
  | 'player_sit'
  | 'player_stand'
  | 'campfire_toggle'
  | 'discovery_unlocked'
  | 'time_tick'
  | 'weather_change'
  | 'dialogue_open'
  | 'dialogue_close'
  | 'request_journal'
  | 'request_shrine'
  | 'request_settings'
  | 'camera_zoom'
  | 'settings_updated'
  | 'fishing_start'
  | 'fishing_catch'
  | 'fishing_end'
  | 'interaction_prompt';

export type BridgeListener<T = unknown> = (payload: T) => void;

class GameBridgeService {
  private listeners: Map<BridgeEventType, Set<BridgeListener<any>>> = new Map();

  public on<T = unknown>(event: BridgeEventType, listener: BridgeListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(listener as BridgeListener<any>);
    return () => set.delete(listener as BridgeListener<any>);
  }

  public emit<T = unknown>(event: BridgeEventType, payload?: T): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[GameBridge] Error executing handler for ${event}:`, err);
      }
    });
  }

  // Helper convenience methods
  public notifySitting(isSitting: boolean, locationName?: string): void {
    if (isSitting) {
      this.emit('player_sit', { locationName: locationName || 'Peaceful Seat' });
    } else {
      this.emit('player_stand');
    }
  }

  public notifyDiscovery(discovery: WorldDiscovery): void {
    this.emit('discovery_unlocked', discovery);
  }

  public notifyCampfire(isLit: boolean): void {
    this.emit('campfire_toggle', { isLit });
  }

  public requestSettings(): void {
    this.emit('request_settings');
  }

  public requestJournal(): void {
    this.emit('request_journal');
  }

  public requestShrine(): void {
    this.emit('request_shrine');
  }
}

export const gameBridge = new GameBridgeService();
