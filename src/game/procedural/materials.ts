import * as THREE from 'three';

// Reusable stylized Ghibli-ish toon material palette. Shared across procedural
// assets to keep draw calls down and the look cohesive (spec §8, §18).
// MeshToonMaterial gives cel-shaded bands; a shared gradient map keeps the
// bands consistent across all materials.

const gradientMap = (() => {
  const data = new Uint8Array([0, 0, 0, 255, 96, 96, 96, 255, 192, 192, 192, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
})();

const palette: Record<string, THREE.MeshToonMaterial> = {};

function mat(color: number, opts: { roughness?: number; flat?: boolean; emissive?: number; emissiveIntensity?: number } = {}): THREE.MeshToonMaterial {
  const key = `${color}-${opts.roughness ?? 0.9}-${opts.flat ?? true}-${opts.emissive ?? 0}-${opts.emissiveIntensity ?? 0}`;
  const existing = palette[key];
  if (existing) return existing;
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap,
  });
  if (opts.emissive !== undefined) {
    m.emissive = new THREE.Color(opts.emissive);
    m.emissiveIntensity = opts.emissiveIntensity ?? 1;
  }
  palette[key] = m;
  return m;
}

export const MAT = {
  // Foliage
  leafDark: () => mat(0x3a6b3a),
  leafMid: () => mat(0x4f8f4f),
  leafLight: () => mat(0x6fb56a),
  leafAutumn: () => mat(0xd2743a),
  leafSakura: () => mat(0xf2b6d0),
  palmFrond: () => mat(0x3f8f5a),
  bamboo: () => mat(0x8fb34a),
  bambooNode: () => mat(0x6b8f3a),

  // Wood / bark
  bark: () => mat(0x6b4a2f, { roughness: 1 }),
  barkDark: () => mat(0x4a3320, { roughness: 1 }),
  woodPlank: () => mat(0x8a6a44, { roughness: 0.85 }),
  woodDark: () => mat(0x5a4028, { roughness: 0.9 }),

  // Stone / ground
  stone: () => mat(0x8a8f94, { roughness: 1 }),
  stoneDark: () => mat(0x5d6266, { roughness: 1 }),
  groundGrass: () => mat(0x6a8f5b, { roughness: 1 }),
  dirt: () => mat(0x8a6a44, { roughness: 1 }),
  sand: () => mat(0xd9c79a, { roughness: 1 }),

  // Roof tiles
  roofDark: () => mat(0x3a3f4a, { roughness: 0.8 }),
  roofTerracotta: () => mat(0xa85a3a, { roughness: 0.85 }),

  // Water
  water: () => mat(0x3a7fb5, { roughness: 0.15, flat: false }),

  // Fire
  flame: () => mat(0xff8a2a, { emissive: 0xff5a1a, emissiveIntensity: 1.4, flat: false }),

  // Flowers
  flowerPink: () => mat(0xf2a0c0),
  flowerYellow: () => mat(0xf2d44a),
  flowerWhite: () => mat(0xf0f0f0),
} as const;

export function disposePalette(): void {
  for (const m of Object.values(palette)) m.dispose();
  for (const k of Object.keys(palette)) delete palette[k];
}