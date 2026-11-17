import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// One main directional (sun) light + hemisphere ambient, per spec §18.
// Shadows are optional and toggled by graphics quality.
// IBL from a procedural RoomEnvironment gives soft, painterly reflections
// that read as Ghibli-esque without loading an external HDRI.

export class Lighting {
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  private target: THREE.Object3D;
  private envTarget: THREE.WebGLRenderTarget | null = null;

  constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    this.hemi = new THREE.HemisphereLight(0xbfd8e0, 0x4a6b3a, 0.9);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff1d0, 2.2);
    this.sun.position.set(20, 30, 10);
    this.target = new THREE.Object3D();
    scene.add(this.target);
    this.sun.target = this.target;

    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 120;
    const s = 40;
    this.sun.shadow.camera.left = -s;
    this.sun.shadow.camera.right = s;
    this.sun.shadow.camera.top = s;
    this.sun.shadow.camera.bottom = -s;
    this.sun.shadow.bias = -0.0005;
    scene.add(this.sun);

    if (renderer) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new RoomEnvironment();
      this.envTarget = pmrem.fromScene(envScene, 0.04);
      scene.environment = this.envTarget.texture;
      pmrem.dispose();
      envScene.clear?.();
    }
  }

  setShadows(enabled: boolean): void {
    this.sun.castShadow = enabled;
  }

  /** Update sun position/color/intensity for a time-of-day fraction (0..1). */
  setTimeOfDay(t: number): void {
    // Sun arcs east->west over the day; below horizon at night.
    const angle = t * Math.PI * 2 - Math.PI / 2;
    const height = Math.sin(angle);
    const x = Math.cos(angle) * 30;
    this.sun.position.set(x, Math.max(height, -0.2) * 35, 14);

    if (height > 0.2) {
      // Day: bright warm white sunlight + clear blue sky ambient
      this.sun.color.setHex(0xfff5dd);
      this.sun.intensity = 2.4;
      this.hemi.intensity = 0.95;
      this.hemi.color.setHex(0xc8e4ff);
      this.hemi.groundColor.setHex(0x5a7a44);
    } else if (height > -0.05) {
      // Golden Hour / Sunset (Images 1, 5, 6, 7): rich honey-amber sunlight + rose-lavender sky + warm soil ambient
      this.sun.color.setHex(0xff9e4a);
      this.sun.intensity = 2.8;
      this.hemi.intensity = 0.85;
      this.hemi.color.setHex(0xf4ad8e);
      this.hemi.groundColor.setHex(0x6b4a3a);
    } else if (height > -0.2) {
      // Twilight / Dusk: deep violet ambient
      this.sun.color.setHex(0xcc6655);
      this.sun.intensity = 0.6;
      this.hemi.intensity = 0.45;
      this.hemi.color.setHex(0x755885);
      this.hemi.groundColor.setHex(0x2a2536);
    } else {
      // Night: serene moonlight
      this.sun.color.setHex(0x7da4e8);
      this.sun.intensity = 0.35;
      this.hemi.intensity = 0.3;
      this.hemi.color.setHex(0x223355);
      this.hemi.groundColor.setHex(0x111c22);
    }
  }

  setFollowTarget(target: THREE.Object3D): void {
    this.target = target;
    this.sun.target = target;
  }

  dispose(): void {
    this.sun.removeFromParent();
    this.hemi.removeFromParent();
    this.target.removeFromParent();
    this.envTarget?.dispose();
  }
}