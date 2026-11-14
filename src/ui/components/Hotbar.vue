<template>
  <div class="hotbar-wrapper interactive">
    <div class="hotbar-shelf hud-panel">
      <button
        v-for="(slot, index) in toolSlots"
        :key="slot.tool"
        class="tool-slot"
        :class="{ active: store.activeTool === slot.tool }"
        :title="`${slot.name} (${index + 1})`"
        @click="actions.setActiveTool(slot.tool)"
      >
        <span class="slot-num">{{ index + 1 }}</span>
        <svg class="tool-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" v-html="slot.icon"></svg>
        <span class="tool-name">{{ slot.shortName }}</span>
        <span v-if="slot.count !== undefined" class="tool-count">{{ slot.count }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { gameStore as store, gameActions as actions } from '@/state/game-store';
import type { ToolType } from '@/types';

interface SlotDef {
  tool: ToolType;
  name: string;
  shortName: string;
  icon: string;
  count?: number;
}

const ic = (paths: string) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const toolSlots = computed<SlotDef[]>(() => {
  const getSeedCount = (id: string) => {
    return store.inventory.find((i) => i.id === id)?.count || 0;
  };

  return [
    {
      tool: 'hoe',
      name: 'Iron Hoe',
      shortName: 'Hoe',
      icon: ic('<path d="M4 20 14 6M14 6l3-2 3 3-2 3-4-1"/>'),
    },
    {
      tool: 'watering_can',
      name: 'Water Pitcher',
      shortName: 'Water',
      icon: ic('<path d="M4 9h10l3 4v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z"/><path d="M17 13h2a2 2 0 0 0 2-2V8M7 9V6h4"/>'),
    },
    {
      tool: 'seeds_radish',
      name: 'Daikon Seeds',
      shortName: 'Radish',
      icon: ic('<path d="M12 21c-4-3-6-7-6-11a6 6 0 0 1 12 0c0 4-2 8-6 11Z"/><path d="M12 10v5"/>'),
      count: getSeedCount('seed_radish'),
    },
    {
      tool: 'seeds_rice',
      name: 'Rice Seeds',
      shortName: 'Rice',
      icon: ic('<path d="M12 21V9M12 9c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 9c3 0 5-2 5-5-3 0-5 2-5 5ZM12 15c-3 0-5-2-5-5M12 15c3 0 5-2 5-5"/>'),
      count: getSeedCount('seed_rice'),
    },
    {
      tool: 'seeds_tea',
      name: 'Tea Seeds',
      shortName: 'Tea',
      icon: ic('<path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9ZM16 10h2a2 2 0 0 1 0 4h-2M7 6c1-1 1-2 0-3M11 6c1-1 1-2 0-3"/>'),
      count: getSeedCount('seed_tea'),
    },
    {
      tool: 'seeds_starlight',
      name: 'Starlight Spore',
      shortName: 'Spore',
      icon: ic('<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>'),
      count: getSeedCount('seed_starlight'),
    },
    {
      tool: 'basket',
      name: 'Harvest Basket',
      shortName: 'Basket',
      icon: ic('<path d="M4 9h16l-2 10H6L4 9Z"/><path d="M8 9 7 5M16 9l1-4M12 9V5"/>'),
    },
    {
      tool: 'lantern',
      name: 'Paper Lantern',
      shortName: 'Lantern',
      icon: ic('<path d="M8 5h8l2 4v8l-2 4H8l-2-4V9l2-4Z"/><path d="M9 5V3M15 5V3M9 21v-2M15 21v-2M12 9v8"/>'),
    },
  ];
});

function handleKeydown(e: KeyboardEvent) {
  // If typing in input, ignore
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

  const num = parseInt(e.key, 10);
  if (!isNaN(num) && num >= 1 && num <= toolSlots.value.length) {
    const target = toolSlots.value[num - 1];
    if (target) {
      actions.setActiveTool(target.tool);
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.hotbar-wrapper {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
}

.hotbar-shelf {
  display: flex;
  gap: 4px;
  padding: 6px;
  border-radius: 8px;
}

.tool-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 56px;
  height: 60px;
  background: rgba(30, 42, 35, 0.55);
  border: 1px solid var(--border-subtle);
  border-radius: 5px;
  color: var(--text-secondary);
}

.tool-slot:hover {
  background: var(--bg-surface-elevated);
  border-color: var(--border-prominent);
  color: var(--text-main);
}

.tool-slot.active {
  background: rgba(230, 161, 71, 0.14);
  border-color: var(--accent-gold);
  color: var(--text-main);
}

.slot-num {
  position: absolute;
  top: 3px;
  left: 5px;
  font-variant-numeric: tabular-nums;
  font-size: 10px;
  color: var(--text-muted);
}

.tool-icon {
  display: block;
}

.tool-name {
  font-size: 10px;
  font-family: var(--font-sans);
  color: inherit;
}

.tool-count {
  position: absolute;
  bottom: 3px;
  right: 5px;
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-gold);
}
</style>