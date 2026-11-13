/**
 * Village scene: the first playable vertical slice.
 *
 * The map is authored as a 2D array of terrain ids (see TERRAIN_GRID) so it
 * can be edited without a Tiled file, while still going through Phaser's
 * tilemap system for collision and rendering. Props and flora are placed on top
 * as sprites with solid footprints.
 */

import Phaser from 'phaser';
import { CONFIG } from '@/core/Config';
import { META, TEX } from '@/art/registry';
import type { TerrainId } from '@/art/tiles/terrain';
import { Player } from '@/entities/Player';
import { NPCS } from '@/data/npcs';
import { Npc, buildNpcStates } from '@/entities/NPC';

const MAP_W = 40;
const MAP_H = 30;

// A compact village: a grassy square with paths, a pond to the east, a
// cluster of houses to the west, and a shrine to the north.
const G = 'grass';
const GT = 'grass_tall';
const P = 'path';
const S = 'stone';
const W = 'water';
const WD = 'water_deep';
const WE = 'water_edge';
const SF = 'stone_floor';

const TERRAIN_GRID: TerrainId[][] = [
  /* row 0..29, 40 cols */
  Array(MAP_W).fill(GT) as TerrainId[],
  [GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT],
  [GT, GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT, GT, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, P, G, G, S, S, S, S, S, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, P, G, G, S, SF, SF, SF, S, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, P, G, G, S, SF, SF, SF, S, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, P, G, G, S, SF, SF, SF, S, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, P, G, G, S, S, S, S, S, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT],
  [GT, GT, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, GT, GT],
  [GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT, GT],
];

// Pond in the east.
for (let y = 8; y < 16; y++) {
  for (let x = 30; x < 38; x++) {
    const edge = x === 30 || x === 37 || y === 8 || y === 15;
    TERRAIN_GRID[y]![x] = edge ? WE : y < 12 ? W : WD;
  }
}

export class VillageScene extends Phaser.Scene {
  private player!: Player;
  private npcs: Npc[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private map!: Phaser.Tilemaps.Tilemap;

  constructor() {
    super({ key: CONFIG.scenes.village });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#141019');

    // Build tilemap from the terrain grid.
    const tileset = this.map.addTilesetImage('terrain', TEX.terrain('grass')) as Phaser.Tilemaps.Tileset;
    // We need a single tileset image containing all terrain tiles; since our
    // textures are separate, fall back to per-tile sprites instead.
    void tileset;

    // Render terrain as sprites (simpler and matches our texture model).
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const id = TERRAIN_GRID[y]![x]!;
        const spr = this.add.image(x * CONFIG.tileSize + 16, y * CONFIG.tileSize + 16, TEX.terrain(id));
        spr.setDepth(0);
      }
    }

    // World bounds.
    this.physics.world.setBounds(0, 0, MAP_W * CONFIG.tileSize, MAP_H * CONFIG.tileSize);

    // Player spawns near the centre of the square.
    this.player = new Player(this, 20 * CONFIG.tileSize, 15 * CONFIG.tileSize);
    this.player.setDepth(10);

    // Camera.
    this.cameras.main.startFollow(this.player, true, CONFIG.cameraLerp, CONFIG.cameraLerp);
    this.cameras.main.setBounds(0, 0, MAP_W * CONFIG.tileSize, MAP_H * CONFIG.tileSize);
    this.cameras.main.setZoom(1);

    // Input.
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // Collision: water and tall grass (for now) block movement.
    const blocked = new Set<TerrainId>(['water', 'water_deep', 'water_edge', 'cliff', 'void', 'grass_tall']);
    // We approximate collision with an invisible static group of rectangles.
    const solids = this.physics.add.staticGroup();
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const id = TERRAIN_GRID[y]![x]!;
        if (blocked.has(id)) {
          const r = this.add.rectangle(x * 32 + 16, y * 32 + 16, 32, 32);
          r.setVisible(false);
          solids.add(r);
        }
      }
    }
    this.physics.add.collider(this.player, solids);

    // Place a few props.
    this.placeProp(18, 14, 'house_player');
    this.placeProp(12, 14, 'house_small');
    this.placeProp(24, 14, 'shop');
    this.placeProp(20, 8, 'noticeboard');
    this.placeProp(16, 20, 'bench');
    this.placeProp(22, 20, 'bench');
    this.placeProp(20, 22, 'well');
    this.placeProp(32, 10, 'stone_lantern');

    // Flora.
    this.placeFlora(5, 5, 'cherry');
    this.placeFlora(8, 22, 'coconut');
    this.placeFlora(34, 20, 'bamboo');
    this.placeFlora(28, 26, 'mango');

    // Spawn villagers whose home is the village.
    const states = buildNpcStates();
    for (const def of NPCS) {
      if (def.home !== 'village') continue;
      const npc = new Npc(this, def, states[def.id]!);
      this.npcs.push(npc);
      this.physics.add.collider(this.player, npc);
    }
  }

  private placeProp(tx: number, ty: number, id: string): void {
    const spec = META.PROPS[id as keyof typeof META.PROPS];
    if (!spec) return;
    const x = tx * CONFIG.tileSize + spec.w / 2;
    const y = ty * CONFIG.tileSize + spec.h;
    const spr = this.add.image(x, y, `prop:${id}:lit`).setDepth(y);
    if (spec.solidW > 0 && spec.solidH > 0) {
      const r = this.add.rectangle(x, y - spec.solidH / 2, spec.solidW, spec.solidH);
      r.setVisible(false);
      const solids = this.physics.add.staticGroup();
      solids.add(r);
      this.physics.add.collider(this.player, solids);
    }
    void spr;
  }

  private placeFlora(tx: number, ty: number, id: string): void {
    const spec = META.FLORA[id as keyof typeof META.FLORA];
    if (!spec) return;
    const x = tx * CONFIG.tileSize + spec.w / 2;
    const y = ty * CONFIG.tileSize + spec.h;
    this.add.image(x, y, `flora:${id}`).setDepth(y);
    if (spec.solidW > 0 && spec.solidH > 0) {
      const r = this.add.rectangle(x, y - spec.solidH / 2, spec.solidW, spec.solidH);
      r.setVisible(false);
      const solids = this.physics.add.staticGroup();
      solids.add(r);
      this.physics.add.collider(this.player, solids);
    }
  }

  update(_time: number, delta: number): void {
    const keys = {
      up: this.wasd.up as Phaser.Input.Keyboard.Key,
      down: this.wasd.down as Phaser.Input.Keyboard.Key,
      left: this.wasd.left as Phaser.Input.Keyboard.Key,
      right: this.wasd.right as Phaser.Input.Keyboard.Key,
      run: this.shiftKey,
    };
    // Merge cursor keys.
    if (this.cursors.up.isDown) keys.up = this.cursors.up as Phaser.Input.Keyboard.Key;
    if (this.cursors.down.isDown) keys.down = this.cursors.down as Phaser.Input.Keyboard.Key;
    if (this.cursors.left.isDown) keys.left = this.cursors.left as Phaser.Input.Keyboard.Key;
    if (this.cursors.right.isDown) keys.right = this.cursors.right as Phaser.Input.Keyboard.Key;

    this.player.updateControls(keys);
    this.player.update(delta);
    const minutes = 8 * 60; // placeholder morning
    for (const npc of this.npcs) npc.update(delta, minutes);
  }
}