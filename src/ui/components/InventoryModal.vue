<template>
  <div v-if="isOpen" class="modal-backdrop interactive" @click.self="actions.closeModal()">
    <div class="modal-card washi-panel">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-title-group">
          <h2 class="modal-title">Satchel & Backpack</h2>
          <span class="modal-subtitle">旅人の袋 · Current Goods</span>
        </div>
        <button class="close-btn" title="Close (Esc)" @click="actions.closeModal()">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>

      <!-- Content Area -->
      <div class="modal-content">
        <!-- Left: Inventory Grid -->
        <div class="inventory-section">
          <!-- Category Tabs -->
          <div class="category-tabs">
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="cat-tab"
              :class="{ active: activeCategory === cat.id }"
              @click="activeCategory = cat.id"
            >
              {{ cat.label }}
            </button>
          </div>

          <!-- Grid -->
          <div class="item-grid">
            <button
              v-for="item in filteredItems"
              :key="item.id"
              class="item-card"
              :class="{ selected: selectedItem?.id === item.id }"
              @click="selectedItem = item"
            >
              <span class="item-icon" v-html="catIcon(item.category)"></span>
              <div class="item-card-info">
                <div class="item-card-name">{{ item.name }}</div>
                <div class="item-card-jp">{{ item.japaneseName }}</div>
              </div>
              <div class="item-card-count">×{{ item.count }}</div>
            </button>

            <div v-if="filteredItems.length === 0" class="empty-state">
              <span>This section of your satchel is empty.</span>
            </div>
          </div>
        </div>

        <!-- Right: Item Detail -->
        <div class="detail-section">
          <div v-if="selectedItem" class="detail-card">
            <span class="detail-icon" v-html="catIcon(selectedItem.category)"></span>
            <h3 class="detail-name">{{ selectedItem.name }}</h3>
            <span class="detail-jp">{{ selectedItem.japaneseName }}</span>
            <div class="detail-badge">{{ selectedItem.category.toUpperCase() }}</div>
            <p class="detail-desc">{{ selectedItem.description }}</p>
            <div class="detail-count-row">
              <span>In Possession:</span>
              <strong>{{ selectedItem.count }} units</strong>
            </div>
          </div>
          <div v-else class="detail-placeholder">
            <span>Select any item to inspect its origin and uses.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { gameStore as store, gameActions as actions } from '@/state/game-store';
import type { InventoryItem } from '@/types';

const isOpen = computed(() => store.activeModal === 'inventory');
const activeCategory = ref<'all' | 'crop' | 'seed' | 'tool'>('all');
const selectedItem = ref<InventoryItem | null>(store.inventory[0] || null);

const categories: { id: 'all' | 'crop' | 'seed' | 'tool'; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'crop', label: 'Harvested Crops' },
  { id: 'seed', label: 'Seeds & Spores' },
  { id: 'tool', label: 'Valley Tools' },
];

const filteredItems = computed(() => {
  if (activeCategory.value === 'all') return store.inventory;
  return store.inventory.filter((i) => i.category === activeCategory.value);
});

const ic = (paths: string, size = 22) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

function catIcon(category: string): string {
  if (category === 'crop') return ic('<path d="M12 21V9M12 9c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 9c3 0 5-2 5-5-3 0-5 2-5 5Z"/>');
  if (category === 'seed') return ic('<path d="M12 21c-4-3-6-7-6-11a6 6 0 0 1 12 0c0 4-2 8-6 11Z"/><path d="M12 10v5"/>');
  if (category === 'tool') return ic('<path d="M4 20 14 6M14 6l3-2 3 3-2 3-4-1"/>');
  return ic('<path d="M4 7h16v13H4z"/><path d="M4 7l2-3h12l2 3"/>');
}
</script>

<style scoped>
.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(14, 20, 17, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  z-index: 100;
}

.modal-card {
  width: 90%;
  max-width: 760px;
  height: 480px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-washi);
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.modal-title {
  font-family: var(--font-serif);
  font-size: 20px;
  color: var(--text-dark);
}

.modal-subtitle {
  font-size: 12px;
  color: var(--text-dark-muted);
}

.close-btn {
  display: flex;
  color: var(--text-dark-muted);
  padding: 4px;
}

.close-btn:hover {
  color: var(--accent-vermilion);
}

.modal-content {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

.inventory-section {
  flex: 1.4;
  display: flex;
  flex-direction: column;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.cat-tab {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-dark-muted);
}

.cat-tab.active {
  background: var(--text-dark);
  color: var(--bg-washi);
}

.item-grid {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 6px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--border-washi);
  border-radius: 5px;
  text-align: left;
}

.item-card:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--accent-gold);
}

.item-card.selected {
  background: #fff;
  border-color: var(--accent-vermilion);
  box-shadow: 0 2px 8px rgba(211, 78, 54, 0.15);
}

.item-icon {
  display: flex;
  color: var(--accent-bamboo);
  flex-shrink: 0;
}

.item-card-info {
  flex: 1;
}

.item-card-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-dark);
}

.item-card-jp {
  font-size: 11px;
  color: var(--text-dark-muted);
}

.item-card-count {
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-gold);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  font-size: 13px;
  color: var(--text-dark-muted);
}

.detail-section {
  flex: 1;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--border-washi);
  border-radius: 5px;
  padding: 18px;
}

.detail-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.detail-icon {
  display: flex;
  width: 56px;
  height: 56px;
  background: var(--bg-washi);
  border: 1px solid var(--border-washi);
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: var(--accent-bamboo);
}

.detail-name {
  font-family: var(--font-serif);
  font-size: 17px;
  color: var(--text-dark);
}

.detail-jp {
  font-size: 12px;
  color: var(--text-dark-muted);
  margin-bottom: 6px;
}

.detail-badge {
  font-size: 10px;
  background: rgba(91, 138, 85, 0.12);
  color: var(--accent-bamboo);
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.detail-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-dark);
  margin-bottom: 16px;
}

.detail-count-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 12px;
  border-top: 1px solid var(--border-washi);
  padding-top: 10px;
  color: var(--text-dark-muted);
}

.detail-count-row strong {
  font-variant-numeric: tabular-nums;
  color: var(--text-dark);
}

.detail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
  color: var(--text-dark-muted);
  text-align: center;
}
</style>