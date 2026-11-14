import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

// Cached GLB loader. Loads models from /glb/ (served by Vite from public/).
// Computes bounds and polygon counts on first load for the registry.

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  bounds: THREE.Box3;
  size: THREE.Vector3;
  triangleCount: number;
}

const cache = new Map<string, Promise<LoadedModel>>();
const loader = new GLTFLoader();

export function loadModel(url: string): Promise<LoadedModel> {
  const cached = cache.get(url);
  if (cached) return cached;
  const promise = new Promise<LoadedModel>((resolve, reject) => {
    loader.load(
      url,
      (gltf: GLTF) => resolve(measure(gltf)),
      undefined,
      (err) => reject(err),
    );
  });
  cache.set(url, promise);
  return promise;
}

function measure(gltf: GLTF): LoadedModel {
  const scene = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(scene);
  const size = bounds.getSize(new THREE.Vector3());
  let triangleCount = 0;
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const g = obj.geometry;
      if (g.index) triangleCount += g.index.count / 3;
      else if (g.attributes.position) triangleCount += g.attributes.position.count / 3;
    }
  });
  return {
    scene,
    animations: gltf.animations ?? [],
    bounds,
    size,
    triangleCount: Math.round(triangleCount),
  };
}

/** Create a deep, independent clone of a loaded model (shared geometry/materials). */
export function instantiate(model: LoadedModel): THREE.Group {
  return model.scene.clone(true);
}

export function disposeAssetCache(): void {
  for (const promise of cache.values()) {
    promise.then((m) => {
      m.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if (!mat) continue;
            for (const key of Object.keys(mat)) {
              const val = (mat as unknown as Record<string, unknown>)[key];
              if (val instanceof THREE.Texture) val.dispose();
            }
            mat.dispose?.();
          }
        }
      });
    });
  }
  cache.clear();
}