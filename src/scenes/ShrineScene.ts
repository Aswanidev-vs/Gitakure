import Phaser from 'phaser';
import { META, TEX } from '@/art/registry';
import { Player } from '@/entities/Player';

export class ShrineScene extends Phaser.Scene {
  constructor() { super({ key: 'ShrineScene' }); }
  create(): void {
    this.cameras.main.setBackgroundColor('#12101a');
    const W = 24, H = 20;
    const G = 'grass', P = 'path', C = 'cobble', GT = 'grass_tall', SF = 'stone_floor';
    const grid: string[][] = [];
    for (let y = 0; y < H; y++) {
      const row: string[] = [];
      for (let x = 0; x < W; x++) {
        if (y < 2 || y > H - 2 || x < 2 || x > W - 2) row.push(GT);
        else if (x >= 9 && x <= 14 && y >= 3 && y <= 8) row.push(SF);
        else if (x >= 10 && x <= 13 && y >= 9 && y <= 12) row.push(C);
        else row.push(Math.random() < 0.3 ? GT : G);
      }
      grid.push(row);
    }
    // Stone path from entrance to shrine.
    for (let y = 10; y < H - 2; y++) { grid[y]![11] = P; grid[y]![12] = P; }
    for (let x = 6; x < 18; x++) grid[10]![x] = P;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      this.add.image(x * 32 + 16, y * 32 + 16, TEX.terrain(grid[y]![x] as any)).setDepth(0);
    }
    this.physics.world.setBounds(0, 0, W * 32, H * 32);
    const player = new Player(this, 11 * 32, (H - 3) * 32);
    this.cameras.main.startFollow(player, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, W * 32, H * 32);
    const solids = this.physics.add.staticGroup();
    const blocked = new Set(['water', 'water_deep', 'cliff', 'void', 'grass_tall']);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (blocked.has(grid[y]![x]!)) { const r = this.add.rectangle(x * 32 + 16, y * 32 + 16, 32, 32); r.setVisible(false); solids.add(r); }
    }
    this.physics.add.collider(player, solids);
    this.placeProp(11, 4, 'torii');
    this.placeProp(11, 6, 'shrine');
    this.placeProp(6, 10, 'stone_lantern');
    this.placeProp(16, 10, 'stone_lantern');
    this.placeFlora(4, 4, 'cherry');
    this.placeFlora(19, 4, 'cherry');
    this.placeProp(11, 14, 'ruin_pillar');
    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = { up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W), down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S), left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A), right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D) };
    const shift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.events.on('update', (_t: number, delta: number) => {
      const keys = { up: (cursors.up.isDown ? wasd.up : wasd.up) as Phaser.Input.Keyboard.Key, down: wasd.down as Phaser.Input.Keyboard.Key, left: wasd.left as Phaser.Input.Keyboard.Key, right: wasd.right as Phaser.Input.Keyboard.Key, run: shift };
      player.updateControls(keys); player.update(delta);
    });
  }
  private placeProp(tx: number, ty: number, id: string) {
    const spec = META.PROPS[id as keyof typeof META.PROPS]; if (!spec) return;
    this.add.image(tx * 32 + spec.w / 2, ty * 32 + spec.h, `prop:${id}:lit`).setDepth(ty * 32 + spec.h);
  }
  private placeFlora(tx: number, ty: number, id: string) {
    const spec = META.FLORA[id as keyof typeof META.FLORA]; if (!spec) return;
    this.add.image(tx * 32 + spec.w / 2, ty * 32 + spec.h, `flora:${id}`).setDepth(ty * 32 + spec.h);
  }
}