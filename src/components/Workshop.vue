<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive, computed } from 'vue';
import { AssetWorkshop, type AssetKind } from '@/game/tools/AssetWorkshop';

const container = ref<HTMLDivElement | null>(null);
const workshop = ref<AssetWorkshop | null>(null);
const kind = ref<AssetKind>('palm');

const palm = reactive({ height: 6, trunkThickness: 0.35, frondCount: 9, frondLength: 3.2, frondWidth: 0.6, coconutCount: 3, curvature: 0.25, seed: 1 });
const bamboo = reactive({ stalkCount: 7, stalkHeight: 7, stalkRadius: 0.12, nodeSegments: 8, spread: 1.2, seed: 2 });
const sakura = reactive({ height: 5.5, trunkThickness: 0.4, canopyClusters: 8, canopyRadius: 1.1, seed: 3 });
const pine = reactive({ height: 7, trunkThickness: 0.35, layerCount: 5, layerRadius: 1.8, seed: 4 });
const house = reactive({ width: 5, depth: 4, wallHeight: 2.8, roofHeight: 2.2, roofOverhang: 0.6, style: 'japanese' as 'japanese' | 'kerala', seed: 9 });

const paramDefs = computed(() => {
  switch (kind.value) {
    case 'palm': return [
      { key: 'height', label: 'Height', min: 3, max: 10, step: 0.5 },
      { key: 'trunkThickness', label: 'Trunk thickness', min: 0.1, max: 0.8, step: 0.05 },
      { key: 'frondCount', label: 'Fronds', min: 3, max: 16, step: 1 },
      { key: 'frondLength', label: 'Frond length', min: 1, max: 6, step: 0.2 },
      { key: 'frondWidth', label: 'Frond width', min: 0.2, max: 1.5, step: 0.1 },
      { key: 'coconutCount', label: 'Coconuts', min: 0, max: 8, step: 1 },
      { key: 'curvature', label: 'Curvature', min: 0, max: 1, step: 0.05 },
      { key: 'seed', label: 'Seed', min: 0, max: 999, step: 1 },
    ];
    case 'bamboo': return [
      { key: 'stalkCount', label: 'Stalks', min: 3, max: 15, step: 1 },
      { key: 'stalkHeight', label: 'Stalk height', min: 3, max: 12, step: 0.5 },
      { key: 'stalkRadius', label: 'Stalk radius', min: 0.05, max: 0.3, step: 0.02 },
      { key: 'nodeSegments', label: 'Nodes', min: 3, max: 14, step: 1 },
      { key: 'spread', label: 'Spread', min: 0.3, max: 3, step: 0.1 },
      { key: 'seed', label: 'Seed', min: 0, max: 999, step: 1 },
    ];
    case 'sakura': return [
      { key: 'height', label: 'Height', min: 3, max: 9, step: 0.5 },
      { key: 'trunkThickness', label: 'Trunk', min: 0.1, max: 0.8, step: 0.05 },
      { key: 'canopyClusters', label: 'Clusters', min: 3, max: 16, step: 1 },
      { key: 'canopyRadius', label: 'Canopy radius', min: 0.4, max: 2.5, step: 0.1 },
      { key: 'seed', label: 'Seed', min: 0, max: 999, step: 1 },
    ];
    case 'pine': return [
      { key: 'height', label: 'Height', min: 3, max: 12, step: 0.5 },
      { key: 'trunkThickness', label: 'Trunk', min: 0.1, max: 0.7, step: 0.05 },
      { key: 'layerCount', label: 'Layers', min: 2, max: 10, step: 1 },
      { key: 'layerRadius', label: 'Layer radius', min: 0.5, max: 3.5, step: 0.1 },
      { key: 'seed', label: 'Seed', min: 0, max: 999, step: 1 },
    ];
    case 'house': return [
      { key: 'width', label: 'Width', min: 3, max: 10, step: 0.5 },
      { key: 'depth', label: 'Depth', min: 3, max: 10, step: 0.5 },
      { key: 'wallHeight', label: 'Wall height', min: 1.5, max: 5, step: 0.2 },
      { key: 'roofHeight', label: 'Roof height', min: 0.5, max: 4, step: 0.1 },
      { key: 'roofOverhang', label: 'Overhang', min: 0, max: 1.5, step: 0.1 },
      { key: 'seed', label: 'Seed', min: 0, max: 999, step: 1 },
    ];
  }
});

function applyParam(key: string, value: number) {
  if (!workshop.value) return;
  if (kind.value === 'palm') (palm as Record<string, number>)[key] = value;
  else if (kind.value === 'bamboo') (bamboo as Record<string, number>)[key] = value;
  else if (kind.value === 'sakura') (sakura as Record<string, number>)[key] = value;
  else if (kind.value === 'pine') (pine as Record<string, number>)[key] = value;
  else (house as unknown as Record<string, number>)[key] = value;
  workshop.value.setParam(kind.value, { [key]: value } as never);
}

function currentParams(): Record<string, number> {
  const p = kind.value === 'palm' ? palm : kind.value === 'bamboo' ? bamboo : kind.value === 'sakura' ? sakura : kind.value === 'pine' ? pine : house;
  return p as unknown as Record<string, number>;
}

function regenerate() {
  workshop.value?.regenerate(kind.value);
}

function exportGlb() {
  void workshop.value?.exportGLB();
}

function setKind(k: AssetKind) {
  kind.value = k;
  workshop.value?.regenerate(k);
}

onMounted(() => {
  if (!container.value) return;
  workshop.value = new AssetWorkshop(container.value);
  workshop.value.regenerate('palm');
});

onBeforeUnmount(() => {
  workshop.value?.dispose();
});
</script>

<template>
  <div class="workshop">
    <div class="panel">
      <h1>Asset Workshop</h1>
      <div class="kinds">
        <button v-for="k in ['palm','bamboo','sakura','pine','house']" :key="k" :class="{ active: kind === k }" @click="setKind(k as AssetKind)">{{ k }}</button>
      </div>
      <div class="params">
        <div v-for="def in paramDefs" :key="def.key" class="param">
          <label>{{ def.label }}: {{ currentParams()[def.key] }}</label>
          <input
            type="range"
            :min="def.min"
            :max="def.max"
            :step="def.step"
            :value="currentParams()[def.key]"
            @input="applyParam(def.key, Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>
      <div class="actions">
        <button @click="regenerate">Regenerate</button>
        <button @click="exportGlb" class="export">Export GLB</button>
      </div>
    </div>
    <div ref="container" class="viewport"></div>
  </div>
</template>

<style scoped>
.workshop {
  position: fixed;
  inset: 0;
  display: flex;
  background: #0f1a17;
  color: #e8f0ea;
  font-family: system-ui, sans-serif;
}
.panel {
  width: 320px;
  padding: 1rem;
  overflow-y: auto;
  border-right: 1px solid rgba(180, 200, 190, 0.2);
  background: rgba(15, 26, 23, 0.9);
}
.panel h1 {
  font-size: 1.2rem;
  margin: 0 0 1rem;
}
.kinds {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}
.kinds button {
  padding: 0.4rem 0.7rem;
  border: 1px solid rgba(180, 200, 190, 0.3);
  background: transparent;
  color: #e8f0ea;
  border-radius: 6px;
  cursor: pointer;
  text-transform: capitalize;
}
.kinds button.active {
  background: #8fb3a0;
  color: #0f1a17;
}
.param {
  margin-bottom: 0.8rem;
}
.param label {
  display: block;
  font-size: 0.8rem;
  opacity: 0.85;
  margin-bottom: 0.2rem;
}
.param input {
  width: 100%;
}
.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.actions button {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid rgba(180, 200, 190, 0.3);
  background: transparent;
  color: #e8f0ea;
  border-radius: 6px;
  cursor: pointer;
}
.actions .export {
  background: #8fb3a0;
  color: #0f1a17;
}
.viewport {
  flex: 1;
  position: relative;
}
</style>