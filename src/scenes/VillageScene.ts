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
import { NPCS, formatClock } from '@/data/npcs';
import { Npc, buildNpcStates } from '@/entities/NPC';
import { InteractionSystem } from '@/systems/InteractionSystem';
import { DialogueSystem } from '@/systems/DialogueSystem';
import { createMobileControls } from '@/ui/MobileControls';
import { TimeSystem } from '@/systems/TimeSystem';
import { WeatherSystem } from '@/systems/WeatherSystem';
import { SaveSystem } from '@/persistence/SaveSystem';
import { JournalSystem } from '@/systems/JournalSystem';
import { Authentication } from '@/github/Authentication';
import { SyncService } from '@/github/SyncService';

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
  private interactions = new InteractionSystem();
  private dialogue = new DialogueSystem();
  private clock_ = new TimeSystem({ minutes: 8*60, day: 0, season: 'spring', weather: 'sunny', phase: 'morning' });
  private weather = new WeatherSystem(this);
  private saves = new SaveSystem();
  private journal = new JournalSystem();
  private auth = new Authentication();
  private syncService = new SyncService(this.auth);
  private appliedEvents = new Set<string>();
  private landmarks: { uid: string; tx: number; ty: number; name: string }[] = [];
  private mobile = createMobileControls(document.getElementById('ui-root')!);
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
    this.loadGame();

    // HUD
    const ui2 = document.getElementById('ui-root')!;
    const hud = document.createElement('div');
    void ui2;
    hud.className = 'hud';
    hud.innerHTML = '<div class="chip" id="hud-time">8:00 am</div><div class="chip" id="hud-weather">Sunny · Spring</div><button id="journal-btn" style="pointer-events:auto;background:#241f2c;color:#e8dcc0;border:1px solid #3a3240;padding:4px 8px;font-family:inherit;cursor:pointer;">Journal</button><button id="sync-btn" style="pointer-events:auto;background:#241f2c;color:#e8dcc0;border:1px solid #3a3240;padding:4px 8px;font-family:inherit;cursor:pointer;">Sync GitHub</button>';
    document.getElementById('ui-root')!.appendChild(hud);
    this.weather.setWeather('sunny');
    const journalBtn = document.getElementById('journal-btn') as HTMLButtonElement;
    const journalModal = document.createElement('div');
    journalModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:none;align-items:center;justify-content:center;z-index:20;pointer-events:auto;';
    journalModal.innerHTML = '<div style="background:#241f2c;border:2px solid #5a4a44;padding:16px;max-width:480px;width:90%;max-height:70vh;overflow:auto;color:#e8dcc0;font-family:Georgia,serif;"><h3 style="margin:0 0 8px;color:#c9a227;">Journal</h3><div id="journal-list"></div><button id="journal-close" style="margin-top:8px;background:#241f2c;color:#e8dcc0;border:1px solid #3a3240;padding:4px 8px;cursor:pointer;">Close</button></div>';
    document.getElementById('ui-root')!.appendChild(journalModal);
    const renderJournal = () => {
      const list = journalModal.querySelector('#journal-list') as HTMLElement;
      const entries = this.journal.getEntries();
      list.innerHTML = entries.length === 0 ? '<p style="color:#c9bc9f;font-style:italic;">No entries yet. Sync GitHub or discover places.</p>' : entries.map((e) => `<div style="margin-bottom:8px;"><strong style="color:#c9a227;">${e.title}</strong><div style="font-size:12px;color:#c9bc9f;">${e.body}</div></div>`).join('');
    };
    const openJournal = () => { renderJournal(); journalModal.style.display = 'flex'; };
    const closeJournal = () => { journalModal.style.display = 'none'; };
    journalBtn.addEventListener('click', openJournal);
    journalModal.querySelector('#journal-close')!.addEventListener('click', closeJournal);
    const jKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    jKey.on('down', () => { if (journalModal.style.display === 'flex') closeJournal(); else openJournal(); });

    // World map modal.
    const mapModal = document.createElement('div');
    mapModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:none;align-items:center;justify-content:center;z-index:20;pointer-events:auto;';
    mapModal.innerHTML = '<div style="background:#241f2c;border:2px solid #5a4a44;padding:16px;max-width:480px;width:90%;color:#e8dcc0;font-family:Georgia,serif;"><h3 style="margin:0 0 8px;color:#c9a227;">World Map</h3><div id="map-list"></div><button id="map-close" style="margin-top:8px;background:#241f2c;color:#e8dcc0;border:1px solid #3a3240;padding:4px 8px;cursor:pointer;">Close</button></div>';
    document.getElementById('ui-root')!.appendChild(mapModal);
    const renderMap = () => {
      const list = mapModal.querySelector('#map-list') as HTMLElement;
      const locs = ['village','forest','riverside','farmland','shrine','hideaway'];
      list.innerHTML = locs.map((l) => `<button data-loc="${l}" style="display:block;margin:4px 0;background:#332c3c;color:#e8dcc0;border:1px solid #3a3240;padding:6px 10px;width:100%;cursor:pointer;text-align:left;">${l.charAt(0).toUpperCase()+l.slice(1)}</button>`).join('');
      list.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          const loc = b.getAttribute('data-loc')!;
          const key = loc === 'village' ? 'VillageScene' : loc === 'forest' ? 'ForestScene' : loc === 'riverside' ? 'RiversideScene' : loc === 'farmland' ? 'FarmlandScene' : loc === 'shrine' ? 'ShrineScene' : 'HideawayScene';
          mapModal.style.display = 'none';
          this.scene.start(key);
        });
      });
    };
    const openMap = () => { renderMap(); mapModal.style.display = 'flex'; };
    const closeMap = () => { mapModal.style.display = 'none'; };
    mapModal.querySelector('#map-close')!.addEventListener('click', closeMap);
    const mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    mKey.on('down', () => { if (mapModal.style.display === 'flex') closeMap(); else openMap(); });

    const syncBtn = document.getElementById('sync-btn') as HTMLButtonElement;
    syncBtn.addEventListener('click', async () => {
      const username = window.prompt('GitHub username to sync (leave blank for sample mode):');
      if (username === null) return;
      const pat = window.prompt('Optional: personal access token (stored in memory only this session). Leave blank for public data.');
      if (pat) this.auth.setPat(pat, username);
      syncBtn.disabled = true;
      syncBtn.textContent = 'Syncing…';
      try {
        const res = await this.syncService.sync(username || 'octocat', this.appliedEvents, []);
        for (const id of res.appliedIds) this.appliedEvents.add(id);
        for (const lm of res.landmarks) {
          this.landmarks.push({ uid: lm.uid, tx: lm.tx, ty: lm.ty, name: lm.name });
          this.placeProp(lm.tx, lm.ty, 'project_stone');
          this.journal.add({ day: this.clock_.getClock().day, kind: 'github', title: lm.name, body: lm.blurb });
        }
        this.journal.add({ day: this.clock_.getClock().day, kind: 'milestone', title: 'GitHub sync', body: `${res.summary.totalContributions} contributions, ${res.summary.repositories} repositories imported.` });
        syncBtn.textContent = `Synced: ${res.summary.totalContributions} contribs`;
      } catch (e) {
        syncBtn.textContent = 'Sync failed';
        console.error(e);
      }
      setTimeout(() => { syncBtn.disabled = false; syncBtn.textContent = 'Sync GitHub'; }, 2500);
    });

    // Dialogue + interaction prompt UI.
    const ui = document.getElementById('ui-root')!;
    const prompt = document.createElement('div');
    prompt.className = 'prompt';
    prompt.id = 'interact-prompt';
    prompt.style.display = 'none';
    ui.appendChild(prompt);
    const dlg = document.createElement('div');
    dlg.className = 'dialogue';
    dlg.id = 'dialogue-box';
    dlg.innerHTML = '<div class="speaker"></div><div class="text"></div><div class="advance">Space / Enter to continue · Esc to close</div>';
    ui.appendChild(dlg);
    const speakerEl = dlg.querySelector('.speaker') as HTMLElement;
    const textEl = dlg.querySelector('.text') as HTMLElement;
    this.dialogue.onLine((line) => {
      if (!line) { dlg.classList.remove('open'); return; }
      speakerEl.textContent = line.speaker;
      textEl.textContent = line.text;
      dlg.classList.add('open');
    });

    // Interaction key.
    const eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    eKey.on('down', () => {
      if (this.dialogue.isOpen()) return;
      this.interactions.trigger();
    });
    const spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey.on('down', () => {
      if (this.dialogue.isOpen()) this.dialogue.advance();
    });
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => this.dialogue.close());
    const f5 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F5);
    f5.on('down', () => this.saveGame());

    // Spawn villagers whose home is the village.
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

  private async loadGame(): Promise<void> {
    try {
      const save = await this.saves.load();
      if (save) {
        this.player.setPosition(save.player.x, save.player.y);
        this.clock_ = new (await import('@/systems/TimeSystem')).TimeSystem(save.clock);
        if (save.appliedEvents) for (const id of save.appliedEvents) this.appliedEvents.add(id);
        console.log('loaded save');
      }
    } catch (e) { console.warn('load failed', e); }
  }

  private async saveGame(): Promise<void> {
    const game: any = {
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      player: { name: 'Player', appearance: { body: 'a', hair: 'crop', outfit: 'field', accessory: 'none' }, location: 'village', x: this.player.x, y: this.player.y, direction: this.player.getFacing() },
      clock: this.clock_.getClock(),
      inventory: { slots: [], hotbar: 0, capacity: 24 },
      crops: [],
      landmarks: [],
      journal: [],
      npcs: {},
      discovered: ['village'],
      sync: { lastSyncAt: null, source: 'none', username: null, totalContributions: 0, activeDays: 0, longestStreak: 0, repositories: 0, stars: 0, importedDays: 0, earliestDay: null, latestDay: null, notes: [] },
      appliedEvents: [...this.appliedEvents],
      flags: {},
    };
    try { await this.saves.save(game); console.log('saved'); } catch (e) { console.error('save failed', e); }
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
    // Mobile overrides
    if (this.mobile.isDown('up')) keys.up = this.wasd.up as Phaser.Input.Keyboard.Key;
    if (this.mobile.isDown('down')) keys.down = this.wasd.down as Phaser.Input.Keyboard.Key;
    if (this.mobile.isDown('left')) keys.left = this.wasd.left as Phaser.Input.Keyboard.Key;
    if (this.mobile.isDown('right')) keys.right = this.wasd.right as Phaser.Input.Keyboard.Key;
    if (this.mobile.isDown('run')) keys.run = this.shiftKey;

    this.player.updateControls(keys);
    this.player.update(delta);
    const clock = this.clock_.tick(delta, 6); // 6 in-game minutes per real second
    const minutes = clock.minutes % 1440;
    for (const npc of this.npcs) npc.update(delta, minutes);
    const timeEl = document.getElementById('hud-time');
    const weatherEl = document.getElementById('hud-weather');
    if (timeEl) timeEl.textContent = formatClock(minutes);
    if (weatherEl) weatherEl.textContent = clock.weather.charAt(0).toUpperCase()+clock.weather.slice(1) + ' · ' + clock.season.charAt(0).toUpperCase()+clock.season.slice(1);
    // Keep interactable anchors in sync with NPC positions.
    for (const npc of this.npcs) {
      this.interactions.setPosition('npc:' + npc.def.id, Math.round(npc.x / CONFIG.tileSize), Math.round(npc.y / CONFIG.tileSize));
    }
    const ptx = Math.round(this.player.x / CONFIG.tileSize);
    const pty = Math.round(this.player.y / CONFIG.tileSize);
    const active = this.interactions.resolve(ptx, pty);
    const promptEl = document.getElementById('interact-prompt');
    if (promptEl) {
      if (active && !this.dialogue.isOpen()) {
        promptEl.textContent = 'E · ' + active.verb + ' ' + active.label;
        promptEl.style.display = 'block';
      } else {
        promptEl.style.display = 'none';
      }
    }
  }
}