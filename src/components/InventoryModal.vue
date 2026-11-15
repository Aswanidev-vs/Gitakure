<script setup lang="ts">
import { ref, computed } from 'vue';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'resources' | 'tools' | 'decor' | 'other';
  count: number;
  icon: string;
  description: string;
}

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; useItem: [item: InventoryItem] }>();

const activeCategory = ref<'all' | 'resources' | 'tools' | 'decor' | 'other'>('all');

const items = ref<InventoryItem[]>([
  { id: 'wood', name: 'Wood Log', category: 'resources', count: 12, icon: '🪵', description: 'Sturdy timber harvested from countryside trees. Useful for crafting.' },
  { id: 'stone', name: 'River Stone', category: 'resources', count: 8, icon: '🪨', description: 'Smooth pebbles gathered from the riverbanks.' },
  { id: 'flower', name: 'Chamomile Flower', category: 'resources', count: 25, icon: '🌼', description: 'Delicate fragrant blossoms blooming across the meadows.' },
  { id: 'orange', name: 'Citrus Fruit', category: 'resources', count: 6, icon: '🍊', description: 'Sweet, juicy countryside fruit grown in Kerala orchards.' },
  { id: 'book', name: 'Traveler Diary', category: 'tools', count: 1, icon: '📘', description: 'A handwritten journal of quiet memories, discoveries, and sketches.' },
  { id: 'mushroom', name: 'Forest Mushroom', category: 'resources', count: 8, icon: '🍄', description: 'Earthy edible mushrooms found in damp mossy clearings.' },
  { id: 'tea', name: 'Green Tea Leaves', category: 'resources', count: 14, icon: '🍃', description: 'Freshly plucked tender tea leaves from hillside slopes.' },
  { id: 'bamboo', name: 'Bamboo', category: 'resources', count: 3, icon: '🎋', description: 'A versatile, lightweight material found in tranquil forest groves.' },
  { id: 'scroll', name: 'Ancient Scroll', category: 'other', count: 2, icon: '📜', description: 'Parchment inscribed with old folk melodies and village tales.' },
  { id: 'pot', name: 'Clay Pot', category: 'decor', count: 1, icon: '🏺', description: 'Handcrafted ceramic pot made by the village artisan.' },
]);

const selectedItemId = ref<string>('bamboo');

const filteredItems = computed(() => {
  if (activeCategory.value === 'all') return items.value;
  return items.value.filter((i) => i.category === activeCategory.value);
});

const selectedItem = computed(() => {
  return items.value.find((i) => i.id === selectedItemId.value) || items.value[0];
});

function selectItem(id: string) {
  selectedItemId.value = id;
}

function handleUse() {
  if (selectedItem.value) {
    emit('useItem', selectedItem.value);
  }
}

function handleDrop() {
  if (selectedItem.value && selectedItem.value.count > 0) {
    selectedItem.value.count--;
  }
}
</script>

<template>
  <div v-if="open" class="inventory-backdrop" @click.self="emit('close')">
    <div class="parchment-inventory" role="dialog" aria-modal="true" aria-label="Inventory">
      <!-- Header -->
      <div class="inventory-header">
        <div class="header-title-wrap">
          <svg class="bag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <h2 class="inventory-title">Inventory</h2>
        </div>
        <button class="close-x-btn" type="button" aria-label="Close" @click="emit('close')">✕</button>
      </div>

      <!-- Main Layout: Grid on left, Item details on right -->
      <div class="inventory-layout">
        <!-- Left: Category tabs + Item Slots -->
        <div class="inventory-main">
          <!-- Category Tabs -->
          <div class="category-tabs">
            <button
              :class="['tab-pill', { active: activeCategory === 'all' }]"
              type="button"
              @click="activeCategory = 'all'"
            >
              All
            </button>
            <button
              :class="['tab-pill', { active: activeCategory === 'resources' }]"
              type="button"
              @click="activeCategory = 'resources'"
            >
              Resources
            </button>
            <button
              :class="['tab-pill', { active: activeCategory === 'tools' }]"
              type="button"
              @click="activeCategory = 'tools'"
            >
              Tools
            </button>
            <button
              :class="['tab-pill', { active: activeCategory === 'decor' }]"
              type="button"
              @click="activeCategory = 'decor'"
            >
              Decor
            </button>
            <button
              :class="['tab-pill', { active: activeCategory === 'other' }]"
              type="button"
              @click="activeCategory = 'other'"
            >
              Other
            </button>
          </div>

          <!-- 5x2 Item Slots Grid -->
          <div class="item-grid">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              :class="['item-slot', { selected: selectedItem?.id === item.id }]"
              @click="selectItem(item.id)"
            >
              <div class="slot-icon">{{ item.icon }}</div>
              <span class="slot-count">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <!-- Right: Selected Item Details Card -->
        <div v-if="selectedItem" class="item-details-card">
          <div class="detail-icon-box">
            <span class="detail-large-icon">{{ selectedItem.icon }}</span>
          </div>

          <h3 class="detail-name">{{ selectedItem.name }}</h3>
          <p class="detail-desc">{{ selectedItem.description }}</p>

          <div class="detail-actions">
            <button class="btn-drop" type="button" @click="handleDrop">
              <span>🗑 Drop</span>
            </button>
            <button class="btn-use" type="button" @click="handleUse">
              <span>Use</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

.inventory-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 16, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
  padding: 16px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  user-select: none;
}

/* Parchment Modal Container (Image 3) */
.parchment-inventory {
  width: min(780px, 94vw);
  background: #f6eee2;
  border: 3px solid #e2d2ba;
  border-radius: 22px;
  padding: 24px 28px 28px;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.55),
    inset 0 0 32px rgba(214, 188, 150, 0.35);
  color: #2b231d;
  animation: popIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.95) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.inventory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  border-bottom: 2px solid #ecdcc8;
  padding-bottom: 12px;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bag-icon {
  width: 24px;
  height: 24px;
  color: #43362a;
}

.inventory-title {
  font-family: 'Caveat', cursive, sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #2b221a;
  line-height: 1;
}

.close-x-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  color: #6a5747;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-x-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1a1410;
}

/* Layout */
.inventory-layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 28px;
  align-items: start;
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.tab-pill {
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1px solid #d8c6ac;
  background: #ede1ce;
  font-size: 13.5px;
  font-weight: 600;
  color: #554435;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-pill:hover {
  background: #e3d3bd;
}

.tab-pill.active {
  background: #fbf5ed;
  border-color: #ba9e7a;
  color: #1a140f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Item Grid (5x2 slots) */
.item-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.item-slot {
  position: relative;
  aspect-ratio: 1;
  background: #ece0cd;
  border: 2px solid #dac6ab;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.item-slot:hover {
  background: #f2e9dc;
  border-color: #bd9b70;
  transform: translateY(-2px);
}

.item-slot.selected {
  background: #fbf5ed;
  border-color: #8c673b;
  box-shadow: 0 0 0 3px rgba(186, 142, 88, 0.35);
}

.slot-icon {
  font-size: 28px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

.slot-count {
  position: absolute;
  right: 6px;
  bottom: 4px;
  font-size: 11.5px;
  font-weight: 700;
  color: #4b3e32;
}

/* Detail Card (Right side) */
.item-details-card {
  background: #f0e4d0;
  border: 2px solid #dac7ad;
  border-radius: 18px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: inset 0 1px 4px rgba(255, 255, 255, 0.5);
}

.detail-icon-box {
  width: 96px;
  height: 96px;
  border-radius: 20px;
  background: #f8f1e5;
  border: 2px solid #dfcfb6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.detail-large-icon {
  font-size: 48px;
  line-height: 1;
}

.detail-name {
  font-family: 'Caveat', cursive, sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #271f18;
  margin-bottom: 8px;
}

.detail-desc {
  font-size: 13.5px;
  line-height: 1.55;
  color: #5a4b3d;
  margin-bottom: 24px;
  min-height: 48px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.btn-drop {
  flex: 1;
  padding: 10px;
  border: 1px solid #c9b497;
  border-radius: 10px;
  background: #e2d2bb;
  color: #3b2f24;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-drop:hover {
  background: #d5c3aa;
}

.btn-use {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: #5d8b58;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(93, 139, 88, 0.35);
  transition: all 0.2s;
}

.btn-use:hover {
  background: #4c7747;
  transform: translateY(-1px);
}

@media (max-width: 680px) {
  .inventory-layout {
    grid-template-columns: 1fr;
  }
}
</style>
