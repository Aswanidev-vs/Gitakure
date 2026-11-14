import * as THREE from 'three';
import { loadModel, type LoadedModel } from './AssetManager';

// Central asset registry. Inventories the Quaternius GLB packs in /glb/
// (Ultimate Stylized Nature Pack + Stylized Nature MegaKit, both extracted
// into glb/). Each entry records name, source pack, path, format, intended
// usage, and — once measured at runtime — dimensions, polygon count, and
// texture status. License: Quaternius assets are CC0.

export type Biome = 'japanese' | 'kerala' | 'both';

export interface AssetEntry {
  name: string;
  sourcePack: 'Ultimate Stylized Nature Pack' | 'Stylized Nature MegaKit';
  path: string; // served path under /glb/
  format: 'GLB';
  license: string;
  intendedUsage: string;
  biome: Biome;
  /** Filled at runtime by `measureRegistry()`. */
  measured?: {
    size: [number, number, number];
    triangleCount: number;
    hasEmbeddedTextures: boolean;
    hasAnimations: boolean;
  };
}

export type AssetCategory = 'trees' | 'bushes' | 'rocks' | 'plants' | 'flowers' | 'grass' | 'mushrooms' | 'paths';

// Base (canonical) entries. Duplicate-suffixed variants (e.g. `-u5SOgBFiut`)
// are alternate geometry variants of the same asset and resolved by `variantsOf`.
const CANONICAL: AssetEntry[] = [
  // Trees
  { name: 'Pine Trees', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Pine%20Trees.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Japanese forest / hillside evergreen', biome: 'japanese' },
  { name: 'Pine', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Pine.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Single pine tree', biome: 'japanese' },
  { name: 'Maple Trees', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Maple%20Trees.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Autumn maple cluster', biome: 'japanese' },
  { name: 'Birch Trees', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Birch%20Trees.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Slender birch grove', biome: 'both' },
  { name: 'Palm Trees', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Palm%20Trees.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Kerala coconut palms along backwaters', biome: 'kerala' },
  { name: 'Tree', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Tree.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Generic broadleaf tree', biome: 'both' },
  { name: 'Trees', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Trees.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Mixed tree stand', biome: 'both' },
  { name: 'Twisted Tree', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Twisted%20Tree.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Characterful gnarled tree', biome: 'both' },
  { name: 'Dead Tree', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Dead%20Tree.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Bare / spooky accent', biome: 'both' },
  { name: 'Dead Trees', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Dead%20Trees.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Bare tree cluster', biome: 'both' },

  // Bushes
  { name: 'Bush', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Bush.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Low shrub', biome: 'both' },
  { name: 'Bushes', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Bushes.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Shrub cluster', biome: 'both' },
  { name: 'Bush with Flowers', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Bush%20with%20Flowers.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Flowering shrub', biome: 'both' },
  { name: 'Flower Bushes', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Flower%20Bushes.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Flowering bush cluster', biome: 'both' },

  // Rocks
  { name: 'Rock Medium', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Rock%20Medium.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Medium boulder', biome: 'both' },
  { name: 'Rocks', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Rocks.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Rock cluster', biome: 'both' },
  { name: 'Pebble Round', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Pebble%20Round.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Small round pebble', biome: 'both' },
  { name: 'Pebble Square', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Pebble%20Square.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Cut stone pebble', biome: 'both' },

  // Plants
  { name: 'Fern', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Fern.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Forest undergrowth fern', biome: 'both' },
  { name: 'Plant', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Plant.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Small leafy plant', biome: 'both' },
  { name: 'Plant Big', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Plant%20Big.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Large tropical plant', biome: 'kerala' },
  { name: 'Tall Grass', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Tall%20Grass.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Tall grass clump', biome: 'both' },
  { name: 'Clover', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Clover.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Clover patch', biome: 'both' },

  // Flowers
  { name: 'Flowers', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Flowers.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Mixed wildflowers', biome: 'both' },
  { name: 'Flower Group', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Flower%20Group.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Flower cluster', biome: 'both' },
  { name: 'Flower Single', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Flower%20Single.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Single flower', biome: 'both' },
  { name: 'Flower Petal', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Flower%20Petal.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Falling petal accent', biome: 'japanese' },

  // Grass
  { name: 'Grass', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Grass.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Grass tuft', biome: 'both' },
  { name: 'Grass Wispy', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Grass%20Wispy.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Wispy grass', biome: 'both' },
  { name: 'Grass (1)', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Grass%20(1).glb', format: 'GLB', license: 'CC0', intendedUsage: 'Grass variant', biome: 'both' },

  // Mushrooms
  { name: 'Mushroom', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Mushroom.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Forest mushroom', biome: 'both' },
  { name: 'Mushroom Laetiporus', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Mushroom%20Laetiporus.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Shelf fungus accent', biome: 'both' },

  // Paths / ground cover
  { name: 'Rock Path Round Small', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Rock%20Path%20Round%20Small.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Stepping stone path', biome: 'both' },
  { name: 'Rock Path Round Thin', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Rock%20Path%20Round%20Thin.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Stepping stone path', biome: 'both' },
  { name: 'Rock Path Round Wide', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Rock%20Path%20Round%20Wide.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Stepping stone path', biome: 'both' },
  { name: 'Rock Path Square Smal', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Rock%20Path%20Square%20Smal.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Cut stone path', biome: 'both' },
  { name: 'Rock Path Square Thin', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Rock%20Path%20Square%20Thin.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Cut stone path', biome: 'both' },
  { name: 'Rock Path Square Wide', sourcePack: 'Ultimate Stylized Nature Pack', path: '/glb/Rock%20Path%20Square%20Wide.glb', format: 'GLB', license: 'CC0', intendedUsage: 'Cut stone path', biome: 'both' },
];

const CATEGORY: Record<string, AssetCategory> = {
  'Pine Trees': 'trees', 'Pine': 'trees', 'Maple Trees': 'trees', 'Birch Trees': 'trees',
  'Palm Trees': 'trees', 'Tree': 'trees', 'Trees': 'trees', 'Twisted Tree': 'trees',
  'Dead Tree': 'trees', 'Dead Trees': 'trees',
  'Bush': 'bushes', 'Bushes': 'bushes', 'Bush with Flowers': 'bushes', 'Flower Bushes': 'bushes',
  'Rock Medium': 'rocks', 'Rocks': 'rocks', 'Pebble Round': 'rocks', 'Pebble Square': 'rocks',
  'Fern': 'plants', 'Plant': 'plants', 'Plant Big': 'plants', 'Tall Grass': 'grass',
  'Clover': 'plants',
  'Flowers': 'flowers', 'Flower Group': 'flowers', 'Flower Single': 'flowers', 'Flower Petal': 'flowers',
  'Grass': 'grass', 'Grass Wispy': 'grass', 'Grass (1)': 'grass',
  'Mushroom': 'mushrooms', 'Mushroom Laetiporus': 'mushrooms',
  'Rock Path Round Small': 'paths', 'Rock Path Round Thin': 'paths', 'Rock Path Round Wide': 'paths',
  'Rock Path Square Smal': 'paths', 'Rock Path Square Thin': 'paths', 'Rock Path Square Wide': 'paths',
};

export const REGISTRY: AssetEntry[] = CANONICAL.map((e) => ({ ...e }));

export function getEntry(name: string): AssetEntry | undefined {
  return REGISTRY.find((e) => e.name === name);
}

export function entriesByCategory(cat: AssetCategory): AssetEntry[] {
  return REGISTRY.filter((e) => CATEGORY[e.name] === cat);
}

export function entriesByBiome(biome: Biome): AssetEntry[] {
  return REGISTRY.filter((e) => e.biome === biome || e.biome === 'both');
}

/** Load and measure every registered asset, populating `measured` in place. */
export async function measureRegistry(onProgress?: (done: number, total: number) => void): Promise<void> {
  let done = 0;
  await Promise.all(
    REGISTRY.map(async (entry) => {
      try {
        const m: LoadedModel = await loadModel(entry.path);
        entry.measured = {
          size: [m.size.x, m.size.y, m.size.z],
          triangleCount: m.triangleCount,
          hasEmbeddedTextures: hasEmbeddedTexture(m.scene),
          hasAnimations: m.animations.length > 0,
        };
      } catch {
        entry.measured = undefined;
      } finally {
        done++;
        onProgress?.(done, REGISTRY.length);
      }
    }),
  );
}

function hasEmbeddedTexture(root: THREE.Object3D): boolean {
  let found = false;
  root.traverse((obj) => {
    if (found) return;
    if (obj instanceof THREE.Mesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        const map = (m as THREE.MeshStandardMaterial)?.map;
        if (map && map.image === undefined) found = true; // embedded (no URL)
      }
    }
  });
  return found;
}