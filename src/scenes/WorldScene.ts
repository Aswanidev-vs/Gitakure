/**
 * Shared world scene.
 *
 * Every explorable location has the same skeleton: batched scenery, a player
 * with a contact shadow, collision, a camera, keyboard and touch input, a day
 * clock, weather, the HTML HUD, interaction and dialogue, saving, and travel.
 * Subclasses provide a map description and, if they need it, extra actors.
 */

import Phaser from 'phaser';
import { CONFIG } from '@/core/Config';
import { META, TEX } from '@/art/registry';
import { Player } from '@/entities/Player';
import { Npc, buildNpcStates } from '@/entities/NPC';
import { NPCS } from '@/data/npcs';
import { InteractionSystem } from '@/systems/InteractionSystem';
import { DialogueSystem } from '@/systems/DialogueSystem';
import { TimeSystem } from '@/systems/TimeSystem';
import { InventorySystem } from '@/systems/InventorySystem';
import { FarmingSystem } from '@/systems/FarmingSystem';
import { JournalSystem } from '@/systems/JournalSystem';
import { SaveSystem } from '@/persistence/SaveSystem';
import { Authentication } from '@/github/Authentication';
import { SyncService } from '@/github/SyncService';
import { Scenery, type WorldSpec } from '@/world/Scenery';
import { Hud } from '@/ui/Hud';
import { createMobileControls, type MobileControls } from '@/ui/MobileControls';
import { device } from '@/core/Device';
import { settings } from '@/core/Settings';
import { AudioSystem } from '@/audio/AudioSystem';
import { LOCATION_BY_ID } from '@/data/locations';
import type {
  Direction,
  Inventory,
  Landmark,
  LocationId,
  NpcState,
  SaveGame,
  SyncSummary,
  WorldClock,
} from '@/shared/types';

/** In-game minutes per real second: one full day every twelve minutes. */
export const MINUTES_PER_SECOND = 2;
const SAVE_EVERY_MS = 20000;
const TILE = CONFIG.tileSize;

export interface WorldOptions extends WorldSpec {
  location: LocationId;
  music?: 'village' | 'forest' | 'riverside' | 'farmland' | 'shrine';
  /** Spawn villagers whose home is this location. */
  npcs?: boolean;
  /** Allow the GitHub sync sheet. */
  sync?: boolean;
  /** Allow persistence; interiors may opt out. */
  save?: boolean;
}

const EMPTY_SYNC: SyncSummary = {
  lastSyncAt: null,
  source: 'none',
  username: null,
  totalContributions: 0,
  activeDays: 0,
  longestStreak: 0,
  repositories: 0,
  stars: 0,
  importedDays: 0,
  earliestDay: null,
  latestDay: null,
  notes: [],
};

export abstract class WorldScene extends Phaser.Scene {
  protected readonly spec: WorldOptions;
  protected player!: Player;
  protected scenery!: Scenery;
  protected hud!: Hud;
  protected mobile: MobileControls | null = null;
  protected clock_!: TimeSystem;
  protected readonly interactions = new InteractionSystem();
  protected readonly dialogue = new DialogueSystem();
  protected readonly journal = new JournalSystem();
  protected readonly saves = new SaveSystem();
  protected readonly auth = new Authentication();
  protected readonly syncService: SyncService;
  protected readonly inventory = new InventorySystem();
  protected readonly farming = new FarmingSystem();
  protected readonly audio = new AudioSystem();
  protected npcs: Npc[] = [];
  protected npcStates: Record<string, NpcState> = buildNpcStates();
  protected appliedEvents = new Set<string>();
  protected landmarks: Landmark[] = [];
  protected discovered = new Set<LocationId>(['village']);
  protected syncSummary: SyncSummary = { ...EMPTY_SYNC };
  protected createdAt = Date.now();
  protected playerShadow!: Phaser.GameObjects.Image;
  protected travelLock = false;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private saveAccumulator = 0;
  private settingsUnsub: (() => void) | null = null;
  private cleanups: (() => void)[] = [];

  constructor(spec: WorldOptions) {
    super(spec.key);
    this.spec = spec;
    this.syncService = new SyncService(this.auth);
  }

  create(): void {
    const spawn = this.spec.spawn;
    this.cameras.main.setBackgroundColor('#141019');
    this.cameras.main.fadeIn(420, 10, 8, 16);

    this.scenery = new Scenery(this, this.spec);
    this.physics.world.setBounds(0, 0, this.spec.width * TILE, this.spec.height * TILE);

    const spot = this.scenery.nearestWalkable(spawn.tx, spawn.ty);
    this.player = new Player(this, spot.tx * TILE + TILE / 2, spot.ty * TILE + TILE - 4);
    this.player.setDepth(this.player.y);
    this.playerShadow = this.add
      .image(this.player.x, this.player.y + 20, TEX.shadow)
      .setDisplaySize(20, 7)
      .setAlpha(0.4)
      .setDepth(this.player.y - 1);
    this.physics.add.collider(this.player, this.scenery.solids);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(48, 32);
    this.cameras.main.setBounds(0, 0, this.spec.width * TILE, this.spec.height * TILE);
    this.cameras.main.setZoom(this.spec.zoom ?? 1);

    this.clock_ = new TimeSystem({
      minutes: this.spec.startMinutes ?? 8 * 60,
      day: 0,
      season: 'spring',
      weather: 'sunny',
      phase: 'morning',
    });
    this.registry.set('clock', this.clock_.getClock());
    this.discovered.add(this.spec.location);

    this.setupHud();
    this.setupInput();
    this.setupDialogue();
    this.spawnNpcs();
    this.registerPropInteractions();
    this.build();
    void this.loadGame();

    this.settingsUnsub = settings.subscribe(() => this.applySettings());
    this.applySettings();
    this.armAudio();
    this.events.once('shutdown', () => this.cleanup());
  }

  /** Subclass hook for extra actors, landmarks or interactions. */
  protected build(): void {}

  /** Subclass hook for per-frame logic. */
  protected updateWorld(_delta: number, _clock: WorldClock): void {}

  update(_time: number, delta: number): void {
    if (!this.player) return;
    const modal = this.hud.isModalOpen();
    const talking = this.dialogue.isOpen();
    const frozen = modal || talking || this.travelLock;

    const move = frozen ? { x: 0, y: 0, run: false } : this.readMove();
    this.player.updateVector(move.x, move.y, move.run);
    this.player.update(delta);
    this.playerShadow.setPosition(this.player.x, this.player.y + 20);
    this.playerShadow.setDepth(this.player.y - 1);

    const clock = modal ? this.clock_.getClock() : this.clock_.tick(delta, MINUTES_PER_SECOND);
    this.registry.set('clock', clock);
    this.scenery.update(delta, clock);
    this.hud.setClock(clock);

    if (!modal) {
      this.updateNpcs(delta, clock.minutes % 1440);
      this.updatePrompt();
      this.updateWorld(delta, clock);
      this.saveAccumulator += delta;
      if (this.spec.save !== false && this.saveAccumulator >= SAVE_EVERY_MS) {
        this.saveAccumulator = 0;
        void this.saveNow(true);
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Input                                                            */
  /* ---------------------------------------------------------------- */

  private setupInput(): void {
    const kb = this.input.keyboard;
    if (kb) {
      this.cursors = kb.createCursorKeys();
      this.wasd = {
        up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.shiftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.E).on('down', () => this.interact());
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => this.interact());
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => this.interact());
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.onEscape());
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.J).on('down', () => this.openJournal());
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => this.openMap());
    }

    if (device.isTouch()) {
      this.mobile = createMobileControls(document.getElementById('ui-root')!, {
        onInteract: () => this.interact(),
        onRunChange: () => undefined,
      });
    }
  }

  private readMove(): { x: number; y: number; run: boolean } {
    let x = 0;
    let y = 0;
    let run = false;
    if (this.cursors && this.wasd) {
      x = (this.cursors.right.isDown || this.wasd.right.isDown ? 1 : 0) - (this.cursors.left.isDown || this.wasd.left.isDown ? 1 : 0);
      y = (this.cursors.down.isDown || this.wasd.down.isDown ? 1 : 0) - (this.cursors.up.isDown || this.wasd.up.isDown ? 1 : 0);
      run = this.shiftKey.isDown;
    }
    if (this.mobile) {
      const v = this.mobile.getVector();
      if (Math.hypot(v.x, v.y) > 0.08) {
        x = v.x;
        y = v.y;
        run = this.mobile.isRunning();
      }
    }
    return { x, y, run };
  }

  private onEscape(): void {
    if (this.hud.isModalOpen()) {
      this.hud.closeSheet();
      return;
    }
    if (this.dialogue.isOpen()) {
      this.dialogue.close();
      return;
    }
    this.openPause();
  }

  private interact(): void {
    if (this.hud.isModalOpen()) return;
    if (this.dialogue.isOpen()) {
      this.advanceDialogue();
      return;
    }
    this.interactions.trigger();
  }

  private advanceDialogue(): void {
    this.dialogue.advance();
  }

  /* ---------------------------------------------------------------- */
  /* HUD and dialogue                                                 */
  /* ---------------------------------------------------------------- */

  private setupHud(): void {
    this.hud = new Hud(document.getElementById('ui-root')!, {
      onInteract: () => this.interact(),
      onAdvanceDialogue: () => this.advanceDialogue(),
      onJournal: () => this.openJournal(),
      onMap: () => this.openMap(),
      onPause: () => this.openPause(),
      onModalClosed: () => {
        if (this.dialogue.isOpen()) return;
        this.mobile?.setVisible(true);
      },
      onSave: () => void this.saveNow(false),
      onQuit: () => void this.quitToTitle(),
      onTravel: (id) => this.travel(id),
      onSync: (username, token) => this.sync(username, token),
      onSettingsChanged: () => this.applySettings(),
    });
    this.hud.setSyncSummary(this.syncSummary);
    this.hud.setClock(this.clock_.getClock());
  }

  private setupDialogue(): void {
    this.dialogue.onLine((line) => {
      if (!line) {
        this.hud.setPrompt(null);
        this.hud.hideDialogue();
        if (!this.hud.isModalOpen()) this.mobile?.setVisible(true);
        return;
      }
      this.hud.setPrompt(null);
      this.hud.showLine(line);
      this.mobile?.setVisible(false);
    });
  }

  private openJournal(): void {
    if (this.hud.isModalOpen()) return;
    this.hud.openJournal(this.journal.getEntries());
    this.mobile?.setVisible(false);
  }

  private openMap(): void {
    if (this.hud.isModalOpen()) return;
    this.hud.openMap(this.spec.location, [...this.discovered]);
    this.mobile?.setVisible(false);
  }

  private openPause(): void {
    this.player?.setVelocity(0, 0);
    this.mobile?.setVisible(false);
    this.hud.openPause();
  }

  private updatePrompt(): void {
    const ptx = Math.round(this.player.x / TILE);
    const pty = Math.round((this.player.y + 20) / TILE);
    const active = this.interactions.resolve(ptx, pty, 1.7);
    const item = active ? { verb: active.verb, label: active.label } : null;
    this.hud.setPrompt(item);
    this.mobile?.setInteractLabel(item ? item.verb : null);
  }

  /* ---------------------------------------------------------------- */
  /* Actors                                                           */
  /* ---------------------------------------------------------------- */

  private spawnNpcs(): void {
    if (this.spec.npcs !== true) return;
    for (const def of NPCS) {
      if (def.home !== this.spec.location) continue;
      const state = this.npcStates[def.id] ?? {
        id: def.id,
        location: def.home,
        tx: def.schedule[0]?.tx ?? this.spec.spawn.tx,
        ty: def.schedule[0]?.ty ?? this.spec.spawn.ty,
        lastSeen: 0,
        met: false,
        affinity: 0,
        talkedToday: 0,
        lastTalkDay: -1,
      };
      const npc = new Npc(this, def, state);
      this.npcs.push(npc);
      this.physics.add.collider(this.player, npc);
      this.physics.add.collider(npc, this.scenery.solids);
      this.interactions.register({
        uid: `npc:${def.id}`,
        tx: state.tx,
        ty: state.ty,
        verb: 'Talk',
        label: def.name,
        onInteract: () => {
          const lines = npc.talk();
          this.dialogue.open(def.name, lines, def.id);
        },
      });
    }
  }

  private updateNpcs(delta: number, minutes: number): void {
    for (const npc of this.npcs) {
      npc.update(delta, minutes, (tx, ty) => this.scenery.nearestWalkable(tx, ty));
      this.interactions.setPosition(
        `npc:${npc.def.id}`,
        Math.round(npc.x / TILE),
        Math.round((npc.y + 20) / TILE),
      );
    }
  }

  private registerPropInteractions(): void {
    for (const p of this.spec.props ?? []) {
      if (!p.verb) continue;
      const spec = META.PROPS[p.id];
      if (!spec) continue;
      const tx = p.tx + Math.floor(spec.w / TILE / 2);
      const ty = p.ty + Math.ceil(spec.h / TILE);
      const label = p.label ?? spec.verb ?? 'Examine';
      const lines = p.lines ?? [`${label}. Nothing more to do here yet.`];
      this.interactions.register({
        uid: `prop:${p.id}:${p.tx}:${p.ty}`,
        tx,
        ty,
        verb: p.verb,
        label,
        onInteract: () => this.dialogue.open(label, lines),
      });
    }
  }

  protected registerLandmark(lm: Landmark): void {
    const spot = this.scenery.addLandmark(lm);
    this.interactions.register({
      uid: `landmark:${lm.uid}`,
      tx: spot.tx,
      ty: spot.ty,
      verb: 'Examine',
      label: lm.name,
      onInteract: () => this.dialogue.open(lm.name, [lm.blurb]),
    });
  }

  /* ---------------------------------------------------------------- */
  /* GitHub                                                           */
  /* ---------------------------------------------------------------- */

  private async sync(username: string, token: string): Promise<SyncSummary> {
    if (token) this.auth.setPat(token, username);
    else this.auth.clear();
    const result = await this.syncService.sync(username, this.appliedEvents, this.landmarks);
    for (const id of result.appliedIds) this.appliedEvents.add(id);
    for (const lm of result.landmarks) {
      this.landmarks.push(lm);
      if (lm.location === this.spec.location) this.registerLandmark(lm);
      this.journal.add({ day: this.clock_.getClock().day, kind: 'github', title: lm.name, body: lm.blurb });
    }
    this.syncSummary = result.summary;
    this.hud.setSyncSummary(result.summary);
    this.journal.add({
      day: this.clock_.getClock().day,
      kind: 'milestone',
      title: 'GitHub sync',
      body: `${result.summary.totalContributions} contributions and ${result.summary.repositories} repositories imported.`,
    });
    void this.saveNow(true);
    return result.summary;
  }

  /* ---------------------------------------------------------------- */
  /* Persistence                                                      */
  /* ---------------------------------------------------------------- */

  private async loadGame(): Promise<void> {
    if (this.spec.save === false) return;
    try {
      const save = await this.saves.load();
      if (!save) return;
      this.applySave(save);
    } catch (err) {
      console.warn('Gitakure: could not load save', err);
    }
  }

  protected applySave(save: SaveGame): void {
    if (save.player.location === this.spec.location) {
      const spot = this.scenery.nearestWalkable(
        Math.round(save.player.x / TILE),
        Math.round(save.player.y / TILE),
      );
      const moved = Math.abs(spot.tx * TILE + TILE / 2 - save.player.x) > 2 || Math.abs(spot.ty * TILE + TILE - 4 - save.player.y) > 2;
      this.player.setPosition(moved ? spot.tx * TILE + TILE / 2 : save.player.x, moved ? spot.ty * TILE + TILE - 4 : save.player.y);
    }
    this.clock_ = new TimeSystem(save.clock);
    this.createdAt = save.createdAt || this.createdAt;
    for (const id of save.appliedEvents) this.appliedEvents.add(id);
    this.landmarks = [...save.landmarks];
    for (const lm of save.landmarks) {
      if (lm.location === this.spec.location) this.registerLandmark(lm);
    }
    this.journal.set(save.journal);
    this.npcStates = { ...this.npcStates, ...save.npcs };
    for (const npc of this.npcs) {
      const state = this.npcStates[npc.def.id];
      if (state) npc.npcState = state;
    }
    this.discovered = new Set([...save.discovered, this.spec.location]);
    this.inventory.set(save.inventory);
    this.farming.set(save.crops);
    this.syncSummary = save.sync;
    this.hud.setSyncSummary(save.sync);
    this.hud.setClock(this.clock_.getClock());
  }

  protected buildSave(location: LocationId = this.spec.location): SaveGame {
    const npcs: Record<string, NpcState> = { ...this.npcStates };
    for (const npc of this.npcs) npcs[npc.def.id] = npc.npcState;
    const inventory: Inventory = this.inventory.get();
    return {
      version: CONFIG.saveVersion,
      createdAt: this.createdAt,
      updatedAt: Date.now(),
      player: {
        name: 'Player',
        appearance: { body: 'a', hair: 'crop', outfit: 'field', accessory: 'none' },
        location,
        x: this.player ? this.player.x : this.spec.spawn.tx * TILE,
        y: this.player ? this.player.y : this.spec.spawn.ty * TILE,
        direction: (this.player?.getFacing() ?? 'down') as Direction,
      },
      clock: this.clock_.getClock(),
      inventory,
      crops: this.farming.getCrops(),
      landmarks: this.landmarks,
      journal: this.journal.getEntries(),
      npcs,
      discovered: [...this.discovered],
      sync: this.syncSummary,
      appliedEvents: [...this.appliedEvents],
      flags: {},
    };
  }

  protected async saveNow(silent: boolean): Promise<void> {
    if (this.spec.save === false || !this.player) return;
    try {
      await this.saves.save(this.buildSave());
      if (!silent) this.hud.toast('Saved');
    } catch (err) {
      console.warn('Gitakure: save failed', err);
      if (!silent) this.hud.toast('Could not save');
    }
  }

  private async quitToTitle(): Promise<void> {
    await this.saveNow(true);
    this.travelLock = true;
    this.screensOut(() => this.scene.start('AttractScene'));
  }

  protected travel(id: LocationId): void {
    if (this.travelLock) return;
    const loc = LOCATION_BY_ID[id];
    if (!loc || id === this.spec.location) return;
    this.travelLock = true;
    this.discovered.add(id);
    void this.saveNow(true).then(() => {
      this.screensOut(() => this.scene.start(loc.scene));
    });
  }

  private screensOut(then: () => void): void {
    this.cameras.main.fadeOut(300, 10, 8, 16);
    this.cameras.main.once('camerafadeoutcomplete', then);
  }

  /* ---------------------------------------------------------------- */
  /* Audio and settings                                               */
  /* ---------------------------------------------------------------- */

  private armAudio(): void {
    let armed = false;
    const start = (): void => {
      if (armed) return;
      armed = true;
      this.audio.init();
      this.applySettings();
      this.audio.startAmbient(this.spec.music ?? 'village');
    };
    this.input.once('pointerdown', start);
    this.input.keyboard?.once('keydown', start);
    this.cleanups.push(() => this.audio.stopAmbient());
  }

  private applySettings(): void {
    const s = settings.get();
    this.audio.setMuted(s.muted);
    this.audio.setVolumes({ master: s.master, music: s.music, sfx: s.sfx });
  }

  /* ---------------------------------------------------------------- */
  /* Teardown                                                         */
  /* ---------------------------------------------------------------- */

  private cleanup(): void {
    this.settingsUnsub?.();
    this.settingsUnsub = null;
    for (const fn of this.cleanups) fn();
    this.cleanups = [];
    this.hud?.destroy();
    this.mobile?.destroy();
    this.mobile = null;
    this.audio.stopAmbient();
    this.scenery?.destroy();
    this.interactions.clear();
    this.dialogue.close();
  }
}