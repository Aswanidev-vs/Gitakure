import * as THREE from 'three';

// Owns the scene graph lifecycle, background, and fog.

export class SceneManager {
  readonly scene: THREE.Scene;
  private fog: THREE.FogExp2;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcfe7e0);
    this.fog = new THREE.FogExp2(0xd8e6e2, 0.008);
    this.scene.fog = this.fog;
  }

  setBackground(color: number): void {
    (this.scene.background as THREE.Color).setHex(color);
  }

  setFog(color: number, density: number): void {
    this.fog.color.setHex(color);
    this.fog.density = density;
  }

  setFogDensity(density: number): void {
    this.fog.density = density;
  }

  dispose(): void {
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (!m) continue;
          for (const key of Object.keys(m)) {
            const val = (m as unknown as Record<string, unknown>)[key];
            if (val instanceof THREE.Texture) val.dispose();
          }
          m.dispose?.();
        }
      }
    });
    this.scene.clear();
  }
}