/**
 * Forest scene: a dense, darker map with bamboo groves, mushrooms, and a
 * hidden path to the hermit's clearing. Shares the same movement/collision
 * model as the village.
 */

import Phaser from 'phaser';
import { META, TEX } from '@/art/registry';
import { Player } from '@/entities/Player';

const MAP_W = 32;
const MAP_H = 24;

const G = 'grass';
const GT = 'grass_tall';
const D = 'dirt';
const P = 'path';
const W = 'water';

const GRID: string[][] = [];
for (let y = 0; y < MAP_H; y++) {
  const row: string[] = [];
  for (let x = 0; x < MAP_W; x++) {
    if (x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1) row.push(GT);
    else if (x > 14 && x < 18 && y > 8 && y < 14) row.push(D);
    else row.push(Math.random() < 0.35 ? GT : G);
  }
  GRID.push(row);
}
// A winding path from west to east.
for (let x = 2; x < MAP_W - 2; x++) {
  const y = 12 + Math.round(Math.sin(x / 3) * 2);
  GRID[y]![x] = P;
  if (y + 1 < MAP_H) GRID[y + 1]![x] = P;
}
// A small pond.
for (let y = 4; y < 8; y++) for (let x = 24; x < 29; x++) GRID[y]![x] = W;

export class ForestScene extends Phaser.Scene {
  private player!: Player;

  constructor() { super({ key: 'ForestScene' }); }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f1310');
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const id = GRID[y]![x]! as any;
        this.add.image(x * 32 + 16, y * 32 + 16, TEX.terrain(id)).setDepth(0);
      }
    }
    this.physics.world.setBounds(0, 0, MAP_W * 32, MAP_H * 32);
    this.player = new Player(this, 3 * 32, 12 * 32);
    this.player.setDepth(10);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, MAP_W * 32, MAP_H * 32);

    const solids = this.physics.add.staticGroup();
    const blocked = new Set(['water', 'water_deep', 'cliff', 'void', 'grass_tall']);
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      if (blocked.has(GRID[y]![x]!)) {
        const r = this.add.rectangle(x * 32 + 16, y * 32 + 16, 32, 32);
        r.setVisible(false);
        solids.add(r);
      }
    }
    this.physics.add.collider(this.player, solids);

    // Flora
    this.placeFlora(6, 6, 'bamboo');
    this.placeFlora(10, 18, 'pine');
    this.placeFlora(20, 6, 'maple');
    this.placeFlora(26, 18, 'cherry');

    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    const shift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.events.on('update', (_t: number, delta: number) => {
      const keys = {
        up: (cursors.up.isDown ? wasd.up : wasd.up) as Phaser.Input.Keyboard.Key,
        down: wasd.down as Phaser.Input.Keyboard.Key,
        left: wasd.left as Phaser.Input.Keyboard.Key,
        right: wasd.right as Phaser.Input.Keyboard.Key,
        run: shift,
      };
      this.player.updateControls(keys);
      this.player.update(delta);
    });
  }

  private placeFlora(tx: number, ty: number, id: string): void {
    const spec = META.FLORA[id as keyof typeof META.FLORA];
    if (!spec) return;
    const x = tx * 32 + spec.w / 2;
    const y = ty * 32 + spec.h;
    this.add.image(x, y, `flora:${id}`).setDepth(y);
  }
}