import * as THREE from 'three';

// One main directional (sun) light + hemisphere ambient, per spec §18.
// Shadows are optional and toggled by graphics quality.

export class Lighting {
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  private target: THREE.Object3D;

  constructor(scene: THREE.Scene) {
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

    if (height > 0.15) {
      // Day: warm white
      this.sun.color.setHex(0xfff1d0);
      this.sun.intensity = 2.2;
      this.hemi.intensity = 0.9;
      this.hemi.color.setHex(0xbfd8e0);
    } else if (height > -0.1) {
      // Sunrise/sunset: golden
      this.sun.color.setHex(0xff9a4d);
      this.sun.intensity = 1.4;
      this.hemi.intensity = 0.5;
      this.hemi.color.setHex(0xe8a06a);
    } else {
      // Night: cool blue
      this.sun.color.setHex(0x6688cc);
      this.sun.intensity = 0.25;
      this.hemi.intensity = 0.25;
      this.hemi.color.setHex(0x223355);
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
  }
}