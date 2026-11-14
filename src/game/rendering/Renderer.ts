import * as THREE from 'three';
import type { GraphicsSettings } from '@/types';

// Owns the WebGLRenderer. Caps pixel ratio and internal resolution for
// low-end hardware per spec §18.

export class Renderer {
  readonly instance: THREE.WebGLRenderer;
  private readonly container: HTMLElement;
  private settings: GraphicsSettings;
  private maxPixelCount: number;

  constructor(container: HTMLElement, settings: GraphicsSettings) {
    this.container = container;
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
    // updateStyle must stay true: with `false` the canvas never gets a CSS size
    // and collapses to 0x0 inside a sized container.
    this.instance.setSize(clientWidth, clientHeight);
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
    this.instance.setSize(width, height);
    this.applyPixelCap();
  }

  /**
   * Cap the drawing buffer so total pixels stay within budget.
   *
   * Three.js owns the pixel ratio and the canvas CSS size; this only lowers the
   * ratio when the buffer would exceed the budget, so the canvas keeps filling
   * its container instead of being sized in device pixels.
   */
  private applyPixelCap(): void {
    const canvas = this.instance.domElement;
    const cssW = canvas.clientWidth || this.container.clientWidth;
    const cssH = canvas.clientHeight || this.container.clientHeight;
    const wanted = Math.min(window.devicePixelRatio, this.settings.pixelRatioCap);
    if (cssW > 0 && cssH > 0) {
      const count = cssW * cssH * wanted * wanted;
      if (count > this.maxPixelCount) {
        const scale = Math.sqrt(this.maxPixelCount / count);
        this.instance.setPixelRatio(Math.max(1, wanted * scale));
        return;
      }
    }
    this.instance.setPixelRatio(wanted);
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