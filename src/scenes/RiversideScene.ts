import Phaser from 'phaser';
import { META, TEX } from '@/art/registry';
import { Player } from '@/entities/Player';

export class RiversideScene extends Phaser.Scene {
  constructor() { super({ key: 'RiversideScene' }); }
  create(): void {
    this.cameras.main.setBackgroundColor('#0e1a1f');
    const W = 32, H = 22;
    const G = 'grass', P = 'path', Wt = 'water', WE = 'water_edge', GT = 'grass_tall';
    const grid: string[][] = [];
    for (let y = 0; y < H; y++) {
      const row: string[] = [];
      for (let x = 0; x < W; x++) {
        if (y < 3 || y > H - 2 || x === 0 || x === W - 1) row.push(GT);
        else if (y >= 9 && y <= 13) row.push(Wt);
        else if (y === 8 || y === 14) row.push(WE);
        else row.push(Math.random() < 0.2 ? GT : G);
      }
      grid.push(row);
    }
    // Bridge across the river.
    for (let x = 12; x < 20; x++) { grid[10]![x] = P; grid[11]![x] = P; }
    // Path along the bank.
    for (let x = 2; x < W - 2; x++) grid[16]![x] = P;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      this.add.image(x * 32 + 16, y * 32 + 16, TEX.terrain(grid[y]![x] as any)).setDepth(0);
    }
    this.physics.world.setBounds(0, 0, W * 32, H * 32);
    const player = new Player(this, 4 * 32, 16 * 32);
    this.cameras.main.startFollow(player, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, W * 32, H * 32);
    const solids = this.physics.add.staticGroup();
    const blocked = new Set(['water', 'water_deep', 'cliff', 'void', 'grass_tall']);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (blocked.has(grid[y]![x]!)) {
        const r = this.add.rectangle(x * 32 + 16, y * 32 + 16, 32, 32); r.setVisible(false); solids.add(r);
      }
    }
    this.physics.add.collider(player, solids);
    this.placeProp(14, 9, 'bridge_h');
    this.placeFlora(6, 4, 'bamboo');
    this.placeFlora(26, 4, 'coconut');
    this.placeProp(22, 16, 'well');
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