import * as THREE from 'three';
import { fbm2, clamp, lerp } from '@/utils/math';
import { Rng } from '@/utils/rng';

// Procedural terrain heightfield: gentle hills, a river channel carved
// through the middle, and a raised village plateau. Provides a
// `heightAt(x,z)` sampler used by every world system to place objects
// on the ground (spec §8, §10, §18).

export interface TerrainOptions {
  size: number; // world size (square, centered on origin)
  segments: number; // resolution
  seed: number;
  riverHalfWidth: number; // river channel half-width
  riverDepth: number; // how deep the channel is
  hillHeight: number;
}

export const DEFAULT_TERRAIN: TerrainOptions = {
  size: 120,
  segments: 96,
  seed: 1,
  riverHalfWidth: 6,
  riverDepth: 2.5,
  hillHeight: 6,
};

export class TerrainSystem {
  readonly mesh: THREE.Mesh;
  readonly opts: TerrainOptions;
  private heights: Float32Array; // (segments+1)^2 grid of heights

  constructor(opts: Partial<TerrainOptions> = {}) {
    this.opts = { ...DEFAULT_TERRAIN, ...opts };
    const { size, segments } = this.opts;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2); // XZ plane, Y up

    const count = (segments + 1) * (segments + 1);
    this.heights = new Float32Array(count);
    const pos = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = this.sampleHeight(x, z);
      this.heights[i] = h;
      pos.setY(i, h);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      metalness: 0,
      flatShading: false,
    });
    this.paintVertexColors(geo);
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.mesh.name = 'terrain';
  }

  /** Height of the ground at world (x,z). */
  heightAt(x: number, z: number): number {
    const { size, segments } = this.opts;
    // Convert world coords to grid coords.
    const gx = clamp(((x + size / 2) / size) * segments, 0, segments);
    const gz = clamp(((z + size / 2) / size) * segments, 0, segments);
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const x1 = Math.min(x0 + 1, segments);
    const z1 = Math.min(z0 + 1, segments);
    const tx = gx - x0;
    const tz = gz - z0;
    const row = segments + 1;
    const h00 = this.heights[z0 * row + x0]!;
    const h10 = this.heights[z0 * row + x1]!;
    const h01 = this.heights[z1 * row + x0]!;
    const h11 = this.heights[z1 * row + x1]!;
    return lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), tz);
  }

  private sampleHeight(x: number, z: number): number {
    const { size, hillHeight, riverHalfWidth, riverDepth } = this.opts;
    // Base rolling hills.
    const nx = x / size;
    const nz = z / size;
    let h = (fbm2(nx * 3 + 10, nz * 3 + 10, 4, this.opts.seed) - 0.5) * 2 * hillHeight;

    // Flatten toward a gentle valley floor near the center.
    const distFromCenter = Math.sqrt(x * x + z * z);
    h *= clamp(distFromCenter / (size * 0.5), 0.15, 1);

    // River channel: a sine-winding band running roughly along Z.
    const riverCenter = Math.sin(z * 0.05) * 6;
    const dRiver = Math.abs(x - riverCenter);
    if (dRiver < riverHalfWidth) {
      const t = 1 - dRiver / riverHalfWidth; // 1 at center, 0 at bank
      const carve = t * t * riverDepth;
      h -= carve;
    }

    // Raise a plateau where the village sits (off-center).
    const vx = x - 18;
    const vz = z + 10;
    const dVillage = Math.sqrt(vx * vx + vz * vz);
    const plateau = clamp(1 - dVillage / 22, 0, 1);
    h = lerp(h, Math.max(h, 1.2), plateau * 0.7);

    return h;
  }

  private paintVertexColors(geo: THREE.PlaneGeometry): void {
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const grass = new THREE.Color(0x6a8f5b);
    const dirt = new THREE.Color(0x8a6a44);
    const sand = new THREE.Color(0xd9c79a);
    const rock = new THREE.Color(0x7a7f84);
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = pos.getY(i);
      const slope = this.slopeAt(x, z);

      if (h < -0.5) {
        tmp.copy(sand); // riverbed
      } else if (slope > 0.7) {
        tmp.copy(rock); // steep slopes
      } else if (h < 0.2) {
        tmp.copy(sand); // lowland near water
      } else if (this.nearRiver(x, z, 8)) {
        tmp.copy(dirt); // red-earth paths near river
      } else {
        tmp.copy(grass);
      }
      // Subtle per-vertex variation.
      const v = 0.9 + Math.random() * 0.2;
      colors[i * 3] = tmp.r * v;
      colors[i * 3 + 1] = tmp.g * v;
      colors[i * 3 + 2] = tmp.b * v;
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }

  private nearRiver(x: number, z: number, pad: number): boolean {
    const riverCenter = Math.sin(z * 0.05) * 6;
    return Math.abs(x - riverCenter) < this.opts.riverHalfWidth + pad;
  }

  private slopeAt(x: number, z: number): number {
    const e = 0.5;
    const hL = this.sampleHeight(x - e, z);
    const hR = this.sampleHeight(x + e, z);
    const hD = this.sampleHeight(x, z - e);
    const hU = this.sampleHeight(x, z + e);
    return Math.sqrt((hR - hL) ** 2 + (hU - hD) ** 2) / (2 * e);
  }

  /** Scatter points on the terrain within a radius, avoiding the river. */
  scatter(rng: Rng, count: number, minR: number, maxR: number, avoidRiver = true): Array<{ x: number; y: number; z: number }> {
    const pts: Array<{ x: number; y: number; z: number }> = [];
    let attempts = 0;
    while (pts.length < count && attempts < count * 10) {
      attempts++;
      const a = rng.range(0, Math.PI * 2);
      const d = rng.range(minR, maxR);
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (avoidRiver && this.nearRiver(x, z, 1.5)) continue;
      pts.push({ x, y: this.heightAt(x, z), z });
    }
    return pts;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}