/**
 * Painted Village scene: uses the cropped reference art as large decorative
 * backdrops and billboards, layered with the procedural collision grid.
 */

import Phaser from 'phaser';
import { CONFIG } from '@/core/Config';
import { Player } from '@/entities/Player';
import { Npc, buildNpcStates } from '@/entities/NPC';
import { NPCS } from '@/data/npcs';
import { InteractionSystem } from '@/systems/InteractionSystem';
import { DialogueSystem } from '@/systems/DialogueSystem';
import { TimeSystem } from '@/systems/TimeSystem';
import { WeatherSystem } from '@/systems/WeatherSystem';
import { SaveSystem } from '@/persistence/SaveSystem';
import { formatClock } from '@/data/npcs';

const MAP_W = 40;
const MAP_H = 30;
const TILE = 32;

export class VillageScene extends Phaser.Scene {
  private player!: Player;
  private npcs: Npc[] = [];
  private interactions = new InteractionSystem();
  private dialogue = new DialogueSystem();
  private clock_ = new TimeSystem({ minutes: 8 * 60, day: 0, season: 'spring', weather: 'sunny', phase: 'morning' });
  private weather = new WeatherSystem(this);
  private saves = new SaveSystem();
  private appliedEvents = new Set<string>();
  private mobile = (window as any).__mobile as { isDown: (k: string) => boolean } | null;

  constructor() { super({ key: CONFIG.scenes.village }); }

  create(): void {
    this.cameras.main.setBackgroundColor('#141019');

    // Painted backdrop: use terrain crops as a large base layer.
    const terrainKeys = ['crop:terrain_00','crop:terrain_03','crop:terrain_04','crop:terrain_05','crop:terrain_08','crop:terrain_10','crop:terrain_12','crop:terrain_14'];
    const backdrop = this.add.image(0, 0, terrainKeys[0]!).setOrigin(0).setDisplaySize(MAP_W * TILE, MAP_H * TILE).setDepth(-10).setAlpha(0.55);
    // Tile a few crops across the map for variety.
    for (let i = 1; i < 8; i++) {
      const k = terrainKeys[i % terrainKeys.length]!;
      const x = (i % 4) * (MAP_W * TILE / 4);
      const y = Math.floor(i / 4) * (MAP_H * TILE / 2);
      this.add.image(x, y, k).setOrigin(0).setDisplaySize(MAP_W * TILE / 4, MAP_H * TILE / 2).setDepth(-9).setAlpha(0.25);
    }
    void backdrop;

    // Painted building billboards.
    this.placeBuilding(18, 14, 'crop:buildings_00', 3 * TILE, 3 * TILE);
    this.placeBuilding(12, 14, 'crop:buildings_01', 2.5 * TILE, 2.5 * TILE);
    this.placeBuilding(24, 14, 'crop:buildings_02', 3 * TILE, 3 * TILE);
    this.placeBuilding(20, 8, 'crop:buildings_03', 2 * TILE, 2 * TILE);
    this.placeBuilding(16, 20, 'crop:buildings_04', 2.5 * TILE, 2 * TILE);
    this.placeBuilding(22, 20, 'crop:buildings_05', 2.5 * TILE, 2 * TILE);
    this.placeBuilding(20, 22, 'crop:buildings_06', 2 * TILE, 2 * TILE);

    // Painted trees and vegetation.
    const treeKeys = ['crop:trees_00','crop:trees_02','crop:trees_04','crop:trees_06','crop:trees_08','crop:trees_10','crop:trees_12','crop:trees_14'];
    const treePositions = [[5,5],[8,22],[34,20],[28,26],[3,12],[36,8],[10,3],[30,3]];
    treePositions.forEach((p, i) => {
      const k = treeKeys[i % treeKeys.length]!;
      const w = 2.5 * TILE, h = 3 * TILE;
      this.add.image((p[0] as number) * TILE, (p[1] as number) * TILE, k).setDisplaySize(w, h).setOrigin(0.5, 1).setDepth((p[1] as number) * TILE);
    });

    // Painted water for the pond.
    this.placeWater(30, 10, 8, 5);

    // Collision grid (invisible).
    const solids = this.physics.add.staticGroup();
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const isWater = x >= 30 && x < 38 && y >= 8 && y < 16;
        const isBuilding = (x >= 16 && x < 22 && y >= 12 && y < 16) || (x >= 10 && x < 15 && y >= 12 && y < 16) || (x >= 22 && x < 27 && y >= 12 && y < 16);
        if (isWater || isBuilding) {
          const r = this.add.rectangle(x * TILE + 16, y * TILE + 16, TILE, TILE);
          r.setVisible(false); solids.add(r);
        }
      }
    }

    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.player = new Player(this, 20 * TILE, 15 * TILE);
    this.player.setDepth(10);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.physics.add.collider(this.player, solids);

    // NPCs.
    const states = buildNpcStates();
    for (const def of NPCS) {
      if (def.home !== 'village') continue;
      const npc = new Npc(this, def, states[def.id]!);
      this.npcs.push(npc);
      this.physics.add.collider(this.player, npc);
      this.interactions.register({
        uid: 'npc:' + def.id,
        tx: def.schedule[0]?.tx ?? 20,
        ty: def.schedule[0]?.ty ?? 20,
        verb: 'Talk',
        label: def.name,
        onInteract: () => {
          const lines = npc.talk();
          this.dialogue.open(def.name, lines);
        },
      });
    }

    // UI + dialogue + HUD + weather + journal + sync + save.
    this.setupUI();
    this.weather.setWeather('sunny');
    this.loadGame();

    // Input.
    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    const shift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    const eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    eKey.on('down', () => { if (!this.dialogue.isOpen()) this.interactions.trigger(); });
    const spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey.on('down', () => { if (this.dialogue.isOpen()) this.dialogue.advance(); });
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => this.dialogue.close());
    const f5 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F5);
    f5.on('down', () => this.saveGame());

    this.events.on('update', (_t: number, delta: number) => {
      const keys = {
        up: wasd.up as Phaser.Input.Keyboard.Key,
        down: wasd.down as Phaser.Input.Keyboard.Key,
        left: wasd.left as Phaser.Input.Keyboard.Key,
        right: wasd.right as Phaser.Input.Keyboard.Key,
        run: shift,
      };
      if (cursors.up.isDown) keys.up = wasd.up;
      if (cursors.down.isDown) keys.down = wasd.down;
      if (cursors.left.isDown) keys.left = wasd.left;
      if (cursors.right.isDown) keys.right = wasd.right;
      if (this.mobile) {
        if (this.mobile.isDown('up')) keys.up = wasd.up;
        if (this.mobile.isDown('down')) keys.down = wasd.down;
        if (this.mobile.isDown('left')) keys.left = wasd.left;
        if (this.mobile.isDown('right')) keys.right = wasd.right;
      }
      this.player.updateControls(keys);
      this.player.update(delta);
      const clock = this.clock_.tick(delta, 6);
      const minutes = clock.minutes % 1440;
      for (const npc of this.npcs) npc.update(delta, minutes);
      for (const npc of this.npcs) {
        this.interactions.setPosition('npc:' + npc.def.id, Math.round(npc.x / TILE), Math.round(npc.y / TILE));
      }
      const ptx = Math.round(this.player.x / TILE);
      const pty = Math.round(this.player.y / TILE);
      const active = this.interactions.resolve(ptx, pty);
      const promptEl = document.getElementById('interact-prompt');
      if (promptEl) {
        if (active && !this.dialogue.isOpen()) { promptEl.textContent = 'E · ' + active.verb + ' ' + active.label; promptEl.style.display = 'block'; }
        else promptEl.style.display = 'none';
      }
      const timeEl = document.getElementById('hud-time');
      const weatherEl = document.getElementById('hud-weather');
      if (timeEl) timeEl.textContent = formatClock(minutes);
      if (weatherEl) weatherEl.textContent = clock.weather.charAt(0).toUpperCase()+clock.weather.slice(1) + ' · ' + clock.season.charAt(0).toUpperCase()+clock.season.slice(1);
    });
  }

  private placeBuilding(tx: number, ty: number, key: string, w: number, h: number): void {
    const spr = this.add.image(tx * TILE, ty * TILE, key).setDisplaySize(w, h).setOrigin(0.5, 1);
    spr.setDepth(ty * TILE + h);
  }

  private placeWater(tx: number, ty: number, w: number, h: number): void {
    const waterKeys = ['crop:water_00','crop:water_02','crop:water_04','crop:water_06'];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = waterKeys[(x + y) % waterKeys.length]!;
      this.add.image((tx + x) * TILE + 16, (ty + y) * TILE + 16, k).setDisplaySize(TILE, TILE).setDepth(0);
    }
  }

  private setupUI(): void {
    const ui = document.getElementById('ui-root')!;
    const prompt = document.createElement('div');
    prompt.className = 'prompt'; prompt.id = 'interact-prompt'; prompt.style.display = 'none'; ui.appendChild(prompt);
    const dlg = document.createElement('div');
    dlg.className = 'dialogue'; dlg.id = 'dialogue-box';
    dlg.innerHTML = '<div class="speaker"></div><div class="text"></div><div class="advance">Space / Enter · Esc</div>';
    ui.appendChild(dlg);
    const speakerEl = dlg.querySelector('.speaker') as HTMLElement;
    const textEl = dlg.querySelector('.text') as HTMLElement;
    this.dialogue.onLine((line) => {
      if (!line) { dlg.classList.remove('open'); return; }
      speakerEl.textContent = line.speaker; textEl.textContent = line.text; dlg.classList.add('open');
    });
    const hud = document.createElement('div');
    hud.className = 'hud';
    hud.innerHTML = '<div class="chip" id="hud-time">8:00 am</div><div class="chip" id="hud-weather">Sunny · Spring</div><button id="journal-btn" style="pointer-events:auto;background:#241f2c;color:#e8dcc0;border:1px solid #3a3240;padding:4px 8px;font-family:inherit;cursor:pointer;">Journal</button><button id="map-btn" style="pointer-events:auto;background:#241f2c;color:#e8dcc0;border:1px solid #3a3240;padding:4px 8px;font-family:inherit;cursor:pointer;">Map</button><button id="sync-btn" style="pointer-events:auto;background:#241f2c;color:#e8dcc0;border:1px solid #3a3240;padding:4px 8px;font-family:inherit;cursor:pointer;">Sync</button>';
    ui.appendChild(hud);
    void hud;
  }

  private async saveGame(): Promise<void> {
    try { await this.saves.save({ version: 1, createdAt: Date.now(), updatedAt: Date.now(), player: { name: 'P', appearance: { body: 'a', hair: 'crop', outfit: 'field', accessory: 'none' }, location: 'village', x: this.player.x, y: this.player.y, direction: this.player.getFacing() }, clock: this.clock_.getClock(), inventory: { slots: [], hotbar: 0, capacity: 24 }, crops: [], landmarks: [], journal: [], npcs: {}, discovered: ['village'], sync: { lastSyncAt: null, source: 'none', username: null, totalContributions: 0, activeDays: 0, longestStreak: 0, repositories: 0, stars: 0, importedDays: 0, earliestDay: null, latestDay: null, notes: [] }, appliedEvents: [...this.appliedEvents], flags: {} }); } catch (e) { console.error(e); }
  }

  private async loadGame(): Promise<void> {
    try {
      const save = await this.saves.load();
      if (save) {
        this.player.setPosition(save.player.x, save.player.y);
        if (save.appliedEvents) for (const id of save.appliedEvents) this.appliedEvents.add(id);
      }
    } catch {}
  }
}