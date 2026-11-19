import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sunDirection } from './sunMath';

// One main directional (sun) light + hemisphere ambient, per spec §18.
// Shadows are optional and toggled by graphics quality.
// IBL from a procedural RoomEnvironment gives soft, painterly reflections
// that read as Ghibli-esque without loading an external HDRI.

export class Lighting {
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly fill: THREE.DirectionalLight;
  private target: THREE.Object3D;
  private envTarget: THREE.WebGLRenderTarget | null = null;
  private readonly sunDirScratch = new THREE.Vector3();

  constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    this.hemi = new THREE.HemisphereLight(0xbfd8e0, 0x4a6b3a, 0.9);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff1d0, 2.2);
    this.sun.position.set(20, 30, 10);
    this.target = new THREE.Object3D();
    scene.add(this.target);
    this.sun.target = this.target;

    // Camera-side bounce light: keeps facades readable when the low sun is
    // behind the village. No shadows, so it is cheap and purely painterly.
    this.fill = new THREE.DirectionalLight(0xffd2ae, 0.55);
    this.fill.position.set(-18, 22, 34);
    this.fill.target = this.target;
    this.fill.castShadow = false;
    scene.add(this.fill);

    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 120;
    const s = 34;
    this.sun.shadow.camera.left = -s;
    this.sun.shadow.camera.right = s;
    this.sun.shadow.camera.top = s;
    this.sun.shadow.camera.bottom = -s;
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.035;
    scene.add(this.sun);

    if (renderer) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new RoomEnvironment();
      this.envTarget = pmrem.fromScene(envScene, 0.04);
      scene.environment = this.envTarget.texture;
      // The neutral studio environment is only here for a touch of soft
      // bounce; at full strength it flattens the whole scene into pastel.
      scene.environmentIntensity = 0.28;
      pmrem.dispose();
      envScene.clear?.();
    }
  }

  setShadows(enabled: boolean): void {
    this.sun.castShadow = enabled;
  }

  /** Update sun position/color/intensity for a time-of-day fraction (0..1). */
  setTimeOfDay(t: number): void {
    // Match the sky dome: same sun direction drives light and visible disc.
    const angle = t * Math.PI * 2 - Math.PI / 2;
    const height = Math.sin(angle);
    const dir = sunDirection(t, this.sunDirScratch);
    this.sun.position.set(dir.x * 45, Math.max(dir.y, -0.2) * 45, dir.z * 45);

    if (height > 0.2) {
      // Day: bright warm white sunlight + clear blue sky ambient
      this.sun.color.setHex(0xfff5dd);
      this.sun.intensity = 2.15;
      this.hemi.intensity = 0.92;
      this.hemi.color.setHex(0xc8e4ff);
      this.hemi.groundColor.setHex(0x6d8a52);
      this.fill.color.setHex(0xffe4c8);
      this.fill.intensity = 0.36;
    } else if (height > -0.05) {
      // Golden hour: honey-amber sun, rose-lavender sky, warm soil bounce.
      this.sun.color.setHex(0xffbc74);
      this.sun.intensity = 1.78;
      this.hemi.intensity = 0.64;
      this.hemi.color.setHex(0xffd4ba);
      this.hemi.groundColor.setHex(0x775b42);
      this.fill.color.setHex(0xffdfc6);
      this.fill.intensity = 0.32;
    } else if (height > -0.2) {
      // Twilight / Dusk: deep violet ambient
      this.sun.color.setHex(0xcc6655);
      this.sun.intensity = 0.7;
      this.hemi.intensity = 0.55;
      this.hemi.color.setHex(0x755885);
      this.hemi.groundColor.setHex(0x2a2536);
      this.fill.color.setHex(0x8a6f9a);
      this.fill.intensity = 0.3;
    } else {
      // Night: serene moonlight
      this.sun.color.setHex(0x7da4e8);
      this.sun.intensity = 0.4;
      this.hemi.intensity = 0.35;
      this.hemi.color.setHex(0x223355);
      this.hemi.groundColor.setHex(0x111c22);
      this.fill.color.setHex(0x4a6a9a);
      this.fill.intensity = 0.18;
    }
  }

  setFollowTarget(target: THREE.Object3D): void {
    this.target = target;
    this.sun.target = target;
    this.fill.target = target;
  }

  dispose(): void {
    this.sun.removeFromParent();
    this.fill.removeFromParent();
    this.hemi.removeFromParent();
    this.target.removeFromParent();
    this.envTarget?.dispose();
  }
}