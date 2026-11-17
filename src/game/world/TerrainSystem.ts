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
  size: 140,
  segments: 128,
  seed: 1,
  riverHalfWidth: 7,
  riverDepth: 2.8,
  hillHeight: 6.5,
};

export class TerrainSystem {
  readonly mesh: THREE.Mesh;
  readonly mountainsMesh: THREE.Mesh;
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
      roughness: 0.95,
      metalness: 0.05,
      flatShading: false,
    });
    this.paintVertexColors(geo);
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.mesh.name = 'terrain';

    // Distant mountain backdrop for Studio Ghibli countryside silhouette
    this.mountainsMesh = this.createMountainBackdrop();
    this.mesh.add(this.mountainsMesh);
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
    // Base rolling hills with multi-octave FBM.
    const nx = x / size;
    const nz = z / size;
    let h = (fbm2(nx * 3.2 + 10, nz * 3.2 + 10, 4, this.opts.seed) - 0.48) * 2 * hillHeight;

    // Distant perimeter rises into dramatic hills.
    const distFromCenter = Math.sqrt(x * x + z * z);
    const perimeterLift = Math.max(0, (distFromCenter - size * 0.35) / (size * 0.25));
    h += perimeterLift * perimeterLift * 9;

    // Flatten toward a gentle valley floor near the river and village.
    h *= clamp(distFromCenter / (size * 0.45), 0.2, 1);

    // River channel: a gentle sine-winding curve running along Z.
    const riverCenter = Math.sin(z * 0.045) * 7.5;
    const dRiver = Math.abs(x - riverCenter);
    if (dRiver < riverHalfWidth) {
      const t = 1 - dRiver / riverHalfWidth; // 1 at center, 0 at bank
      const carve = t * t * riverDepth;
      h -= carve;
    }

    // Terraced stepped hillsides for rice paddies on the southwest flank.
    if (x < -10 && z > -15 && z < 45) {
      const terraceHeight = 0.85;
      const stepped = Math.floor(h / terraceHeight) * terraceHeight;
      const blend = clamp((h - stepped) / terraceHeight, 0, 1);
      h = lerp(stepped, stepped + terraceHeight, Math.pow(blend, 4) * 0.15);
    }

    // Village plateau: raised, gently leveled ground where houses and plaza reside.
    const vx = x - 18;
    const vz = z + 10;
    const dVillage = Math.sqrt(vx * vx + vz * vz);
    const plateau = clamp(1 - dVillage / 24, 0, 1);
    h = lerp(h, Math.max(h, 1.4), plateau * 0.75);

    // Village road leveling: slightly flatten along the village thoroughfare.
    const roadDist = this.villageRoadDistance(x, z);
    if (roadDist < 2.5) {
      const roadBlend = 1 - roadDist / 2.5;
      h = lerp(h, 0.45 + (z * 0.01), roadBlend * 0.25);
    }

    return h;
  }

  /** Distance to the winding village dirt road. */
  private villageRoadDistance(x: number, z: number): number {
    // Road segments: Bridge (0, 0) -> Village Gate (14, 6) -> Village Center (18, -10) -> Shrine (14, -22)
    const seg1 = this.distToSegment(x, z, 0, 0, 14, 6);
    const seg2 = this.distToSegment(x, z, 14, 6, 18, -10);
    const seg3 = this.distToSegment(x, z, 18, -10, 14, -22);
    const seg4 = this.distToSegment(x, z, 14, 6, 6, -2); // Path to campfire
    return Math.min(seg1, seg2, seg3, seg4);
  }

  private distToSegment(px: number, pz: number, x1: number, z1: number, x2: number, z2: number): number {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const lenSq = dx * dx + dz * dz;
    if (lenSq === 0) return Math.hypot(px - x1, pz - z1);
    const t = clamp(((px - x1) * dx + (pz - z1) * dz) / lenSq, 0, 1);
    const projX = x1 + t * dx;
    const projZ = z1 + t * dz;
    return Math.hypot(px - projX, pz - projZ);
  }

  private paintVertexColors(geo: THREE.PlaneGeometry): void {
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    // Studio Ghibli lush color palette
    const grassSun = new THREE.Color(0x82c24f);   // vibrant sunlit warm green
    const grassMid = new THREE.Color(0x619e42);   // balanced meadow green
    const grassShade = new THREE.Color(0x406d33); // deep emerald shadow
    const pathDirt = new THREE.Color(0xbfa071);   // warm packed village road earth
    const pathPebble = new THREE.Color(0x9a8563); // darker road rut / stone edge
    const paddyShoot = new THREE.Color(0x8bd453); // bright rice paddy sprout green
    const paddyMud = new THREE.Color(0x54402a);   // dark terraced clay bund
    const sand = new THREE.Color(0xe6dab8);       // golden river sand
    const rock = new THREE.Color(0x767d84);       // cliff slate rock
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = pos.getY(i);
      const slope = this.slopeAt(x, z);
      const roadDist = this.villageRoadDistance(x, z);

      if (h < -0.6) {
        // Submerged riverbed
        tmp.copy(sand).lerp(pathPebble, 0.3);
      } else if (slope > 0.72) {
        // Steep rocky bluffs
        tmp.copy(rock);
      } else if (roadDist < 2.0) {
        // Village dirt road with soft blend at edges
        const edge = roadDist / 2.0;
        tmp.copy(pathDirt).lerp(pathPebble, (Math.sin(x * 2 + z * 2) + 1) * 0.2);
        if (edge > 0.6) {
          tmp.lerp(grassMid, (edge - 0.6) / 0.4);
        }
      } else if (x < -10 && z > -15 && z < 45 && h > 0.2 && h < 6.5) {
        // Rice terrace area: step floors are bright green, rims are darker mud
        const stepFrac = (h % 0.85) / 0.85;
        if (stepFrac < 0.2 || stepFrac > 0.85) {
          tmp.copy(paddyMud);
        } else {
          tmp.copy(paddyShoot);
        }
      } else if (h < 0.35) {
        // Shoreline sandy beach
        tmp.copy(sand);
      } else if (this.nearRiver(x, z, 7)) {
        // Riverbank loam
        tmp.copy(grassMid).lerp(pathDirt, 0.35);
      } else {
        // Rolling grassy meadows with subtle noise modulation
        const n = fbm2(x * 0.08, z * 0.08, 2, this.opts.seed);
        if (n > 0.6) {
          tmp.copy(grassSun);
        } else if (n < 0.4) {
          tmp.copy(grassShade);
        } else {
          tmp.copy(grassMid);
        }
      }

      // Micro-contrast variation for painterly feel
      const v = 0.94 + ((Math.sin(x * 12.3 + z * 7.1) + 1) * 0.05);
      colors[i * 3] = tmp.r * v;
      colors[i * 3 + 1] = tmp.g * v;
      colors[i * 3 + 2] = tmp.b * v;
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }

  /** Generate distant mountain ridge silhouettes for Ghibli background depth */
  private createMountainBackdrop(): THREE.Mesh {
    const segments = 64;
    const radius = 150;
    const geo = new THREE.CylinderGeometry(radius, radius + 20, 50, segments, 4, true);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const mountainTop = new THREE.Color(0x65858f);  // misty slate blue
    const mountainBase = new THREE.Color(0x4a695b); // rich mountain pine green
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const angle = Math.atan2(z, x);

      // Multi-frequency jagged mountain peaks
      const peakNoise = Math.sin(angle * 5) * 12 + Math.sin(angle * 13) * 6 + Math.cos(angle * 3) * 16;
      if (y > 0) {
        pos.setY(i, y + peakNoise);
        tmp.copy(mountainTop);
      } else {
        pos.setY(i, -10);
        tmp.copy(mountainBase);
      }

      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      fog: true,
      side: THREE.BackSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 8;
    mesh.name = 'mountain-backdrop';
    return mesh;
  }

  private nearRiver(x: number, z: number, pad: number): boolean {
    const riverCenter = Math.sin(z * 0.045) * 7.5;
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
    this.mountainsMesh.geometry.dispose();
    (this.mountainsMesh.material as THREE.Material).dispose();
  }
}