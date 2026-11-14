import * as THREE from 'three';
import type { GraphicsSettings } from '@/types';

// Owns the WebGLRenderer. Caps pixel ratio and internal resolution for
// low-end hardware per spec §18.

export class Renderer {
  readonly instance: THREE.WebGLRenderer;
  private settings: GraphicsSettings;
  private maxPixelCount: number;

  constructor(container: HTMLElement, settings: GraphicsSettings) {
    this.settings = settings;
    this.maxPixelCount = settings.maxPixelCount;

    this.instance = new THREE.WebGLRenderer({
      antialias: settings.antialias,
      powerPreference: 'high-performance',
    });
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatioCap));
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 1.05;
    this.instance.shadowMap.enabled = settings.shadows;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;

    const { clientWidth, clientHeight } = container;
    this.instance.setSize(clientWidth, clientHeight, false);
    this.applyPixelCap();
    container.appendChild(this.instance.domElement);
  }

  get domElement(): HTMLCanvasElement {
    return this.instance.domElement;
  }

  get renderer(): THREE.WebGLRenderer {
    return this.instance;
  }

  setSize(width: number, height: number): void {
    this.instance.setSize(width, height, false);
    this.applyPixelCap();
  }

  /** Cap the drawing buffer so total pixel count stays within budget. */
  private applyPixelCap(): void {
    const canvas = this.instance.domElement;
    const ratio = Math.min(window.devicePixelRatio, this.settings.pixelRatioCap);
    let w = Math.floor(canvas.clientWidth * ratio);
    let h = Math.floor(canvas.clientHeight * ratio);
    const count = w * h;
    if (count > this.maxPixelCount) {
      const scale = Math.sqrt(this.maxPixelCount / count);
      w = Math.floor(w * scale);
      h = Math.floor(h * scale);
    }
    this.instance.setPixelRatio(1);
    this.instance.setSize(w, h, false);
  }

  applySettings(settings: GraphicsSettings): void {
    this.settings = settings;
    this.maxPixelCount = settings.maxPixelCount;
    this.instance.shadowMap.enabled = settings.shadows;
    this.applyPixelCap();
  }

  dispose(): void {
    this.instance.dispose();
    this.instance.domElement.remove();
  }
}