/**
 * Interaction system.
 *
 * Each interactable registers itself with a tile position, a verb and a
 * callback. The system resolves the nearest interactable within a small radius
 * of the player and exposes it to the HUD as a prompt ("E · Talk"). Pressing E
 * fires the callback. New interactables can be added without touching the
 * game loop.
 */

export interface Interactable {
  uid: string;
  tx: number;
  ty: number;
  verb: string;
  label: string;
  /** Returns true if the interaction should be allowed right now. */
  canInteract?: () => boolean;
  onInteract: () => void;
}

export class InteractionSystem {
  private items = new Map<string, Interactable>();
  private active: Interactable | null = null;
  private listeners = new Set<(item: Interactable | null) => void>();

  register(item: Interactable): void {
    this.items.set(item.uid, item);
  }

  setPosition(uid: string, tx: number, ty: number): void {
    const it = this.items.get(uid);
    if (it) { it.tx = tx; it.ty = ty; }
  }

  unregister(uid: string): void {
    this.items.delete(uid);
    if (this.active?.uid === uid) this.active = null;
  }

  /** Resolve the nearest interactable within `radius` tiles of the player. */
  resolve(playerTx: number, playerTy: number, radius = 1.4): Interactable | null {
    let best: { item: Interactable; dist: number } | null = null;
    for (const item of this.items.values()) {
      if (item.canInteract && !item.canInteract()) continue;
      const d = Math.hypot(item.tx - playerTx, item.ty - playerTy);
      if (d <= radius && (!best || d < best.dist)) {
        best = { item, dist: d };
      }
    }
    const next = best?.item ?? null;
    if (next?.uid !== this.active?.uid) {
      this.active = next;
      for (const l of this.listeners) l(this.active);
    }
    return this.active;
  }

  getActive(): Interactable | null {
    return this.active;
  }

  onActiveChange(cb: (item: Interactable | null) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  trigger(): boolean {
    if (!this.active) return false;
    this.active.onInteract();
    return true;
  }

  clear(): void {
    this.items.clear();
    this.active = null;
  }
}