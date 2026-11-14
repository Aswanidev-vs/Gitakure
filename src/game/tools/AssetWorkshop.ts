import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCoconutPalm, type PalmParams } from '@/game/procedural/vegetation/palm';
import { createBamboo, type BambooParams } from '@/game/procedural/vegetation/bamboo';
import { createSakura, type SakuraParams } from '@/game/procedural/vegetation/sakura';
import { createPine, type PineParams } from '@/game/procedural/vegetation/pine';
import { createHouse, type HouseParams } from '@/game/procedural/buildings/house';

// Developer-only 3D asset workshop (spec §9). Live Three.js preview with
// OrbitControls, param sliders, seed, lighting preview, and GLB export via
// GLTFExporter. NOT loaded in the player build — only via ?dev=workshop.

export type AssetKind = 'palm' | 'bamboo' | 'sakura' | 'pine' | 'house';

export interface WorkshopParams {
  palm: PalmParams;
  bamboo: BambooParams;
  sakura: SakuraParams;
  pine: PineParams;
  house: HouseParams;
}

const DEFAULTS: WorkshopParams = {
  palm: { height: 6, trunkThickness: 0.35, frondCount: 9, frondLength: 3.2, frondWidth: 0.6, coconutCount: 3, curvature: 0.25, seed: 1 },
  bamboo: { stalkCount: 7, stalkHeight: 7, stalkRadius: 0.12, nodeSegments: 8, spread: 1.2, seed: 2 },
  sakura: { height: 5.5, trunkThickness: 0.4, canopyClusters: 8, canopyRadius: 1.1, seed: 3 },
  pine: { height: 7, trunkThickness: 0.35, layerCount: 5, layerRadius: 1.8, seed: 4 },
  house: { width: 5, depth: 4, wallHeight: 2.8, roofHeight: 2.2, roofOverhang: 0.6, style: 'japanese', seed: 9 },
};

export class AssetWorkshop {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private current: THREE.Object3D | null = null;
  private container: HTMLElement;
  private raf = 0;
  private params: WorkshopParams = structuredClone(DEFAULTS);

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a3a36);

    this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
    this.camera.position.set(6, 5, 9);
    this.camera.lookAt(0, 1, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0);
    this.controls.enableDamping = true;

    const hemi = new THREE.HemisphereLight(0xbfd8e0, 0x4a6b3a, 0.9);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1d0, 2);
    sun.position.set(5, 10, 7);
    this.scene.add(sun);
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(8, 32),
      new THREE.MeshStandardMaterial({ color: 0x6a8f5b, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  getParams(): WorkshopParams {
    return this.params;
  }

  setParam<K extends AssetKind>(kind: K, patch: Partial<WorkshopParams[K]>): void {
    this.params[kind] = { ...this.params[kind], ...patch } as WorkshopParams[K];
    this.regenerate(kind);
  }

  regenerate(kind: AssetKind): void {
    if (this.current) {
      this.scene.remove(this.current);
      this.current.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry?.dispose();
      });
      this.current = null;
    }
    let obj: THREE.Object3D;
    switch (kind) {
      case 'palm': obj = createCoconutPalm(this.params.palm); break;
      case 'bamboo': obj = createBamboo(this.params.bamboo); break;
      case 'sakura': obj = createSakura(this.params.sakura); break;
      case 'pine': obj = createPine(this.params.pine); break;
      case 'house': obj = createHouse(this.params.house); break;
    }
    this.current = obj;
    this.scene.add(obj);
  }

  async exportGLB(): Promise<void> {
    if (!this.current) return;
    const exporter = new GLTFExporter();
    const result = await exporter.parseAsync(this.current, { binary: true });
    const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workshop-export-${Date.now()}.glb`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private animate = (): void => {
    this.raf = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}