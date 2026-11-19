<script setup lang="ts">
export type InventoryIcon = 'wood' | 'stone' | 'flower' | 'orange' | 'book' | 'mushroom' | 'tea' | 'bamboo' | 'scroll' | 'pot' | 'lantern' | 'pickaxe';

defineProps<{ kind: InventoryIcon }>();
</script>

<template>
  <svg class="item-glyph" viewBox="0 0 24 24" aria-hidden="true">
    <path v-if="kind === 'wood'" d="M5 18 16 7M7 20 18 9M5 18l3 2M16 7l3 1" />
    <path v-else-if="kind === 'stone'" d="m5 16 3-8 8-3 4 6-4 7-8 2-3-4Z" />
    <path v-else-if="kind === 'flower'" d="M12 10c-4-7 4-7 0 0Zm2 2c7-4 7 4 0 0Zm-2 2c4 7-4 7 0 0Zm-2-2c-7 4-7-4 0 0Z" />
    <path v-else-if="kind === 'orange'" d="M7 13a5 5 0 1 0 10 0 5 5 0 0 0-10 0ZM12 8c0-2 1-3 3-4M13 6c-2-1-3-1-4 0" />
    <path v-else-if="kind === 'book'" d="M5 5h7v14H6a1 1 0 0 1-1-1V5Zm7 0h7v13a1 1 0 0 1-1 1h-6V5Z" />
    <path v-else-if="kind === 'mushroom'" d="M4 12a8 6 0 0 1 16 0H4Zm5 0v4a3 3 0 0 0 6 0v-4" />
    <path v-else-if="kind === 'tea'" d="M6 8h10v7a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V8Zm10 2h2a2 2 0 0 1 0 4h-2M8 5c0-1 1-2 2-2M12 5c0-1 1-2 2-2" />
    <path v-else-if="kind === 'bamboo'" d="M8 21V3M13 21V3M18 21V3M6 8h4M11 14h4M16 9h4M6 16h4" />
    <path v-else-if="kind === 'scroll'" d="M7 5h10v14H7a2 2 0 0 1 0-4h10M7 15a2 2 0 0 0 0 4M10 8h4M10 11h4" />
    <path v-else-if="kind === 'lantern'" d="M9 3h6M12 3v2M8 6h8l1 3-1 8H8L7 9l1-3ZM9 17v3h6v-3M9 11h6M12 8v6" />
    <path v-else-if="kind === 'pickaxe'" d="M12 8v13M4 7c3-3 13-3 16 0M4 7l3 3M20 7l-3 3M10 21h4" />
    <path v-else d="M6 8h12v9H6zM8 8V5h8v3M9 12h6M10 17v2h4v-2" />
  </svg>
</template>

<style scoped>
.item-glyph {
  width: 30px;
  height: 30px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
