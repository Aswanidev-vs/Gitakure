import * as THREE from 'three';
import type { Player } from '@/game/entities/Player';
import type { MovementSystem } from '@/game/systems/MovementSystem';

// Proximity-based interaction: detects when the player is near an
// interactable (campfire, bench, landmark) and exposes a prompt; sitting
// toggles the player's sit animation + disables movement.

export interface Interactable {
  id: string;
  label: string;
  position: THREE.Vector3;
  radius: number;
  sit?: boolean;
  onInteract?: () => void;
}

export class InteractionSystem {
  private interactables: Interactable[] = [];
  private current: Interactable | null = null;
  private onPromptChange: ((prompt: string | null) => void) | null = null;

  constructor(
    private player: Player,
    private movement: MovementSystem,
  ) {}

  setPromptListener(fn: (prompt: string | null) => void): void {
    this.onPromptChange = fn;
  }

  add(interactable: Interactable): void {
    this.interactables.push(interactable);
  }

  clear(): void {
    this.interactables.length = 0;
    this.current = null;
  }

  get active(): Interactable | null {
    return this.current;
  }

  /** Update proximity detection; call each tick with player position. */
  update(playerPos: THREE.Vector3): void {
    let nearest: Interactable | null = null;
    let nearestDist = Infinity;
    for (const it of this.interactables) {
      const d = it.position.distanceTo(playerPos);
      if (d <= it.radius && d < nearestDist) {
        nearest = it;
        nearestDist = d;
      }
    }
    if (nearest !== this.current) {
      this.current = nearest;
      const prompt = nearest ? `[E] ${nearest.label}` : null;
      this.onPromptChange?.(prompt);
    }
  }

  /** Trigger the current interactable (E key). */
  interact(): void {
    const it = this.current;
    if (!it) return;
    if (it.sit) {
      const sitting = !this.movement.isSitting;
      this.movement.setSitting(sitting);
      if (sitting) {
        this.player.setAnim('sit');
      } else {
        this.player.setAnim('idle');
        this.player.stand();
      }
    }
    it.onInteract?.();
  }

  dispose(): void {
    this.clear();
  }
}