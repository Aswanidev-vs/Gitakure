/**
 * Inventory system: a fixed-capacity slot array with a hotbar selection.
 * Stacks identical items; emits changes through the event bus.
 */

import { bus } from '@/core/EventBus';
import type { Inventory, ItemStack } from '@/shared/types';

export const ITEM_DEFS: Record<string, { name: string; stackable: boolean; icon: string }> = {
  seed_rice: { name: 'Rice seed', stackable: true, icon: 'seed_rice' },
  seed_wheat: { name: 'Wheat seed', stackable: true, icon: 'seed_wheat' },
  seed_tomato: { name: 'Tomato seed', stackable: true, icon: 'seed_tomato' },
  seed_carrot: { name: 'Carrot seed', stackable: true, icon: 'seed_carrot' },
  seed_potato: { name: 'Potato seed', stackable: true, icon: 'seed_potato' },
  seed_pumpkin: { name: 'Pumpkin seed', stackable: true, icon: 'seed_pumpkin' },
  seed_strawberry: { name: 'Strawberry seed', stackable: true, icon: 'seed_strawberry' },
  seed_corn: { name: 'Corn seed', stackable: true, icon: 'seed_corn' },
  seed_cabbage: { name: 'Cabbage seed', stackable: true, icon: 'seed_cabbage' },
  seed_flower: { name: 'Flower seed', stackable: true, icon: 'seed_flower' },
  rice: { name: 'Rice', stackable: true, icon: 'rice' },
  wheat: { name: 'Wheat', stackable: true, icon: 'wheat' },
  tomato: { name: 'Tomato', stackable: true, icon: 'tomato' },
  carrot: { name: 'Carrot', stackable: true, icon: 'carrot' },
  potato: { name: 'Potato', stackable: true, icon: 'potato' },
  pumpkin: { name: 'Pumpkin', stackable: true, icon: 'pumpkin' },
  strawberry: { name: 'Strawberry', stackable: true, icon: 'strawberry' },
  corn: { name: 'Corn', stackable: true, icon: 'corn' },
  cabbage: { name: 'Cabbage', stackable: true, icon: 'cabbage' },
  flower: { name: 'Flower', stackable: true, icon: 'flower' },
  fish: { name: 'Fish', stackable: true, icon: 'fish' },
  water: { name: 'Water', stackable: true, icon: 'watering_can' },
};

export class InventorySystem {
  private inv: Inventory;

  constructor(capacity = 24) {
    this.inv = { slots: Array(capacity).fill(null), hotbar: 0, capacity };
  }

  get(): Inventory {
    return this.inv;
  }

  set(inv: Inventory): void {
    this.inv = inv;
    this.emit();
  }

  /** Add items, stacking where possible. Returns leftover count that didn't fit. */
  add(id: string, count = 1): number {
    let remaining = count;
    // Stack into existing slots first.
    for (const slot of this.inv.slots) {
      if (remaining <= 0) break;
      if (slot && slot.id === id) {
        const def = ITEM_DEFS[id];
        if (def?.stackable !== false) {
          slot.count += remaining;
          remaining = 0;
        }
      }
    }
    // Then empty slots.
    for (let i = 0; i < this.inv.slots.length && remaining > 0; i++) {
      if (!this.inv.slots[i]) {
        this.inv.slots[i] = { id, count: remaining };
        remaining = 0;
      }
    }
    this.emit();
    return remaining;
  }

  /** Remove up to `count` of an item. Returns amount actually removed. */
  remove(id: string, count = 1): number {
    let remaining = count;
    let removed = 0;
    for (const slot of this.inv.slots) {
      if (remaining <= 0) break;
      if (slot && slot.id === id) {
        const take = Math.min(slot.count, remaining);
        slot.count -= take;
        removed += take;
        remaining -= take;
        if (slot.count <= 0) {
          const idx = this.inv.slots.indexOf(slot);
          this.inv.slots[idx] = null;
        }
      }
    }
    this.emit();
    return removed;
  }

  count(id: string): number {
    return this.inv.slots.reduce((acc, s) => (s && s.id === id ? acc + s.count : acc), 0);
  }

  has(id: string, count = 1): boolean {
    return this.count(id) >= count;
  }

  selectHotbar(index: number): void {
    if (index < 0 || index >= this.inv.capacity) return;
    this.inv.hotbar = index;
    this.emit();
  }

  selectedItem(): ItemStack | null {
    return this.inv.slots[this.inv.hotbar] ?? null;
  }

  private emit(): void {
    bus.emit('player:inventory', { inventory: this.inv });
  }
}