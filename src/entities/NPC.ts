/**
 * NPC entity: a villager that follows a daily schedule and can be talked to.
 * The schedule is resolved from the world clock (minutes since midnight), so
 * villagers move around without any per-frame scripting.
 */

import Phaser from 'phaser';
import { CONFIG } from '@/core/Config';
import { TEX } from '@/art/registry';
import { NPCS, scheduleAt, type NpcDef } from '@/data/npcs';
import type { NpcState } from '@/shared/types';

export class Npc extends Phaser.Physics.Arcade.Sprite {
  readonly def: NpcDef;
  npcState: NpcState;
  private targetX = 0;
  private targetY = 0;
  private animFrame = 0;
  private animTimer = 0;
  private shadow?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, def: NpcDef, state: NpcState) {
    super(scene, state.tx * CONFIG.tileSize + 16, state.ty * CONFIG.tileSize + 24, TEX.npc(def.id), 0);
    this.def = def;
    this.npcState = state;
    scene.add.existing(this as unknown as Phaser.GameObjects.Sprite);
    scene.physics.add.existing(this as unknown as Phaser.Physics.Arcade.Sprite);
    this.setCollideWorldBounds(true);
    this.setSize(14, 10);
    this.setOffset(9, 34);
    this.setDepth(10);
    this.targetX = this.x;
    this.targetY = this.y;
    this.shadow = scene.add
      .image(this.x, this.y + 20, TEX.shadow)
      .setDisplaySize(18, 6)
      .setAlpha(0.34)
      .setDepth(this.y - 1);
  }

  resolveSchedule(minutesSinceMidnight: number, clamp?: (tx: number, ty: number) => { tx: number; ty: number }): void {
    const block = scheduleAt(this.def, minutesSinceMidnight);
    const anchor = clamp ? clamp(block.tx, block.ty) : { tx: block.tx, ty: block.ty };
    const targetTx = anchor.tx;
    const targetTy = anchor.ty;
    this.targetX = targetTx * CONFIG.tileSize + 16;
    this.targetY = targetTy * CONFIG.tileSize + 24;
    if (block.location !== this.npcState.location) {
      // Villagers keep to their home map; schedules that point elsewhere are
      // treated as "around the village" rather than teleporting them.
      if (block.location === this.def.home) this.npcState.location = block.location;
    }
    this.npcState.tx = targetTx;
    this.npcState.ty = targetTy;
  }

  update(delta: number, minutesSinceMidnight: number, clamp?: (tx: number, ty: number) => { tx: number; ty: number }): void {
    this.resolveSchedule(minutesSinceMidnight, clamp);
    this.setDepth(this.y);
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + 20);
      this.shadow.setDepth(this.y - 1);
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 2) {
      const speed = 40;
      this.setVelocity((dx / dist) * speed, (dy / dist) * speed);
      this.animTimer += delta;
      if (this.animTimer > 200) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
      const dirIndex = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
      const poseIndex = 1 + (this.animFrame % 4); // walk1..walk4
      this.setFrame(poseIndex * 4 + dirIndex);
    } else {
      this.setVelocity(0, 0);
      const dirIndex = 0;
      this.setFrame(0 * 4 + dirIndex);
    }
    this.npcState.lastSeen = minutesSinceMidnight;
  }

  talk(): string[] {
    const lines: string[] = [];
    if (!this.npcState.met) {
      this.npcState.met = true;
      lines.push(this.def.greeting);
    } else {
      const pool = this.def.smallTalk;
      const idx = Math.floor(this.npcState.talkedToday) % pool.length;
      lines.push(pool[idx]!);
      if (this.def.lateLine && this.npcState.affinity >= this.def.lateLine.minLandmarks) {
        lines.push(this.def.lateLine.text);
      }
    }
    this.npcState.talkedToday += 1;
    this.npcState.lastTalkDay = Math.floor(this.npcState.lastSeen / 1440);
    return lines;
  }
}

export function buildNpcStates(): Record<string, NpcState> {
  const out: Record<string, NpcState> = {};
  for (const def of NPCS) {
    out[def.id] = {
      id: def.id,
      location: def.home,
      tx: def.schedule[0]?.tx ?? 20,
      ty: def.schedule[0]?.ty ?? 20,
      lastSeen: 0,
      met: false,
      affinity: 0,
      talkedToday: 0,
      lastTalkDay: -1,
    };
  }
  return out;
}

