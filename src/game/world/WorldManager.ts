import * as THREE from 'three';
import { TerrainSystem } from './TerrainSystem';
import { WaterSystem } from './WaterSystem';
import { VegetationSystem } from './VegetationSystem';
import { VillageGenerator } from './VillageGenerator';

// Coordinates the procedural world: terrain, river water, vegetation, and
// the village. Owns the height sampler used by the player and camera.

export class WorldManager {
  readonly group = new THREE.Group();
  readonly terrain: TerrainSystem;
  readonly water: WaterSystem;
  readonly vegetation: VegetationSystem;
  readonly village: VillageGenerator;
  readonly campfirePosition: THREE.Vector3;
  readonly benchPosition: THREE.Vector3;

  constructor(seed = 1) {
    this.group.name = 'world';
    this.terrain = new TerrainSystem({ seed });
    this.group.add(this.terrain.mesh);

    // River water: a wide strip running roughly along Z through the channel.
    this.water = new WaterSystem(22, 140, -0.55);
    this.group.add(this.water.mesh);

    this.vegetation = new VegetationSystem(this.terrain);
    this.village = new VillageGenerator(this.terrain);

    this.group.add(this.vegetation.group);
    this.group.add(this.village.group);

    const village = this.village.build();
    this.campfirePosition = village.campfirePosition;
    this.benchPosition = village.benchPosition;
  }

  /** Build the async vegetation layer (loads GLB prototypes). */
  async build(): Promise<void> {
    await this.vegetation.build();
  }

  heightAt(x: number, z: number): number {
    return this.terrain.heightAt(x, z);
  }

  update(elapsed: number): void {
    this.water.update(elapsed);
  }

  dispose(): void {
    this.terrain.dispose();
    this.water.dispose();
    this.vegetation.dispose();
    this.village.dispose();
    this.group.clear();
  }
}