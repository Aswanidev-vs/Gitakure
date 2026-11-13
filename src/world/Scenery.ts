/**
 * Scenery: everything that makes a map feel like a place rather than a grid.
 *
 * A world scene describes its terrain, props, flora, animals and lights; this
 * module turns that description into a rendered, lit, breathing environment:
 * one batched ground texture, depth-sorted props with contact shadows, a day
 * and night grade with lantern pools, weather, and ambient life.
 */

import Phaser from 'phaser';
import { META, TEX } from '@/art/registry';
import { PAL, hex } from '@/art/palette';
import { SOLID_TERRAIN, type TerrainId } from '@/art/tiles/terrain';
import type { AnimalId } from '@/art/animals';
import type { CropId } from '@/art/crops';
import type { FloraId, PropId } from '@/art/registry';
import { mulberry32 } from '@/art/PixelCanvas';
import type { TilePos, WorldClock } from '@/shared/types';
import { Animal } from '@/entities/Animal';
import { WeatherSystem } from '@/systems/WeatherSystem';

export interface PropPlacement {
  tx: number;
  ty: number;
  id: PropId;
  /** Override the painted footprint. */
  solid?: boolean;
  verb?: string;
  label?: string;
  lines?: string[];
  /** Small depth nudge for overlapping pieces (fences, bridges). */
  bias?: number;
  /** Hide the contact shadow for flat pieces. */
  noShadow?: boolean;
}

export interface FloraPlacement {
  tx: number;
  ty: number;
  id: FloraId;
  solid?: boolean;
  noShadow?: boolean;
}

export interface AnimalPlacement {
  tx: number;
  ty: number;
  id: AnimalId;
  /** Wander radius in tiles. */
  radius?: number;
  /** Ambient creatures drift on a fixed loop rather than walking. */
  ambient?: boolean;
}

export interface LightPlacement {
  tx: number;
  ty: number;
  /** Glow radius in pixels. */
  radius?: number;
  color?: string;
  intensity?: number;
}

export interface CropPlacement {
  tx: number;
  ty: number;
  crop: CropId;
  stage: number;
}

export type Ambience = 'village' | 'forest' | 'water' | 'farm' | 'shrine' | 'indoor';

export interface WorldSpec {
  key: string;
  width: number;
  height: number;
  tiles: TerrainId[][];
  spawn: TilePos;
  props?: PropPlacement[];
  flora?: FloraPlacement[];
  animals?: AnimalPlacement[];
  lights?: LightPlacement[];
  crops?: CropPlacement[];
  /** Extra solid terrain ids on top of water, cliffs and tall grass. */
  blocked?: TerrainId[];
  zoom?: number;
  ambience?: Ambience;
  /** Draw the day/night grade and lantern pools. Interiors turn this off. */
  dayNight?: boolean;
  /** Allow weather particles and auto weather changes. */
  weather?: boolean;
  /** Starting minute of day. */
  startMinutes?: number;
}

const TILE = 32;

export class Scenery {
  readonly solids: Phaser.Physics.Arcade.StaticGroup;
  readonly blocked: Set<TerrainId>;
  readonly dayNight: DayNight | null;
  readonly weather: WeatherSystem | null;
  private readonly ambient: AmbientLife;
  private readonly water: { x: number; y: number }[] = [];
  private readonly animals: Animal[] = [];
  private readonly ripples: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly rippleTimer: Phaser.Time.TimerEvent;
  private readonly scene: Phaser.Scene;
  private readonly spec: WorldSpec;

  constructor(scene: Phaser.Scene, spec: WorldSpec) {
    this.scene = scene;
    this.spec = spec;
    this.blocked = new Set<TerrainId>([
      ...SOLID_TERRAIN,
      'grass_tall',
      ...(spec.blocked ?? []),
    ]);
    this.solids = scene.physics.add.staticGroup();

    this.paintGround();
    this.buildCollision();
    for (const prop of spec.props ?? []) this.placeProp(prop);
    for (const f of spec.flora ?? []) this.placeFlora(f);
    for (const crop of spec.crops ?? []) this.placeCrop(crop);

    this.dayNight =
      spec.dayNight === false
        ? null
        : new DayNight(scene, spec.lights ?? [], spec.width * TILE, spec.height * TILE);
    this.weather = spec.weather === false ? null : new WeatherSystem(scene);
    this.ambient = new AmbientLife(scene, spec.ambience ?? 'village');

    this.ripples = scene.add.particles(0, 0, TEX.effect('ripple', 0), {
      lifespan: 1400,
      speedX: 0,
      speedY: 0,
      scale: { start: 0.5, end: 1.15 },
      alpha: { start: 0.55, end: 0 },
      quantity: 1,
      emitting: false,
    });
    this.ripples.setDepth(2);
    this.rippleTimer = scene.time.addEvent({
      delay: 620,
      loop: true,
      callback: () => {
        if (this.water.length === 0) return;
        const spot = this.water[Math.floor(Math.random() * this.water.length)]!;
        this.ripples.emitParticleAt(spot.x, spot.y, 1);
      },
    });

    for (const animal of spec.animals ?? []) this.placeAnimal(animal);
  }

  /** Nearest walkable tile to a target, searched in rings. */
  nearestWalkable(tx: number, ty: number): TilePos {
    const inside = (x: number, y: number): boolean =>
      x >= 0 && y >= 0 && x < this.spec.width && y < this.spec.height;
    if (inside(tx, ty) && this.isWalkable(tx, ty)) return { tx, ty };
    for (let r = 1; r < Math.max(this.spec.width, this.spec.height); r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = tx + dx;
          const y = ty + dy;
          if (inside(x, y) && this.isWalkable(x, y)) return { tx: x, ty: y };
        }
      }
    }
    return { tx: this.spec.spawn.tx, ty: this.spec.spawn.ty };
  }

  isWalkable(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.spec.width || ty >= this.spec.height) return false;
    const row = this.spec.tiles[ty];
    if (!row) return false;
    const id = row[tx];
    return id !== undefined && !this.blocked.has(id);
  }

  tileAt(tx: number, ty: number): TerrainId | undefined {
    return this.spec.tiles[ty]?.[tx];
  }

  /** Place a GitHub landmark on the nearest open ground. Returns the tile used. */
  addLandmark(lm: { tx: number; ty: number; name: string; blurb: string }): TilePos {
    const spot = this.nearestWalkable(lm.tx, lm.ty);
    this.placeProp({
      tx: spot.tx,
      ty: spot.ty,
      id: 'project_stone',
      label: lm.name,
      verb: 'Examine',
      lines: [lm.blurb],
    });
    return spot;
  }

  update(delta: number, clock: WorldClock): void {
    this.dayNight?.update(clock);
    const weather = this.weather?.getWeather() ?? clock.weather;
    this.ambient.update(delta, clock, weather);
    this.weather?.update(clock);
    this.dayNight?.setWeatherDim(
      weather === 'downpour' ? 1 : weather === 'rain' ? 0.7 : weather === 'fog' ? 0.5 : weather === 'cloudy' ? 0.3 : 0,
    );
    for (const animal of this.animals) animal.update(delta, clock.minutes % 1440);
  }

  destroy(): void {
    this.rippleTimer.remove();
    this.ripples.destroy();
    this.ambient.destroy();
    this.dayNight?.destroy();
    this.weather?.destroy();
    this.solids.clear(true, true);
  }

  private paintGround(): void {
    const { width, height, tiles } = this.spec;
    const rt = this.scene.add.renderTexture(0, 0, width * TILE, height * TILE);
    rt.setOrigin(0, 0).setDepth(0);
    for (let y = 0; y < height; y++) {
      const row = tiles[y];
      if (!row) continue;
      for (let x = 0; x < width; x++) {
        const id = row[x];
        if (!id) continue;
        rt.draw(TEX.terrain(id), x * TILE, y * TILE);
        if (id === 'water' || id === 'water_deep' || id === 'water_edge' || id === 'paddy_water') {
          this.water.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
        }
      }
    }
  }

  /** Merge horizontal runs of blocked tiles into as few static bodies as possible. */
  private buildCollision(): void {
    for (let y = 0; y < this.spec.height; y++) {
      const row = this.spec.tiles[y];
      if (!row) continue;
      let run = 0;
      for (let x = 0; x <= this.spec.width; x++) {
        const solid = x < this.spec.width && row[x] !== undefined && this.blocked.has(row[x]!);
        if (solid) {
          run++;
          continue;
        }
        if (run > 0) {
          const w = run * TILE;
          const r = this.scene.add.rectangle((x - run) * TILE + w / 2, y * TILE + TILE / 2, w, TILE);
          r.setVisible(false);
          this.solids.add(r);
          run = 0;
        }
      }
    }
  }

  private addSolid(x: number, y: number, w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    const r = this.scene.add.rectangle(x, y, w, h);
    r.setVisible(false);
    this.solids.add(r);
  }

  private addShadow(x: number, y: number, width: number, alpha = 0.45): void {
    const shadow = this.scene.add.image(x, y - 1, TEX.shadow);
    shadow.setDisplaySize(width, Math.max(8, width * 0.34));
    shadow.setAlpha(alpha).setDepth(1);
  }

  private placeProp(p: PropPlacement): void {
    const spec = META.PROPS[p.id];
    if (!spec) return;
    const x = p.tx * TILE + spec.w / 2;
    const y = p.ty * TILE + spec.h;
    if (!p.noShadow) {
      this.addShadow(x, y, Math.max(24, spec.w * 0.72), 0.42);
    }
    this.scene.add
      .image(x, y, TEX.prop(p.id, true))
      .setOrigin(0.5, 1)
      .setDepth(y + (p.bias ?? 0));
    const solid = p.solid ?? spec.solidW > 0;
    if (solid) {
      // Buildings block their lower half, not just a thin strip at the base, so
      // the player cannot walk up through a wall. The roof stays background.
      const sh = Math.max(spec.solidH, Math.min(spec.h * 0.5, spec.solidW));
      this.addSolid(x, y - sh / 2, spec.solidW, sh);
    }
  }

  private placeFlora(f: FloraPlacement): void {
    const spec = META.FLORA[f.id];
    if (!spec) return;
    const x = f.tx * TILE + spec.w / 2;
    const y = f.ty * TILE + spec.h;
    if (!f.noShadow && spec.solidW > 0) {
      this.addShadow(x, y, Math.max(18, spec.solidW * 2.2), 0.38);
    }
    this.scene.add
      .image(x, y, TEX.flora(f.id))
      .setOrigin(0.5, 1)
      .setDepth(y);
    const solid = f.solid ?? spec.solidW > 0;
    if (solid) {
      const sh = Math.max(spec.solidH, Math.min(spec.h * 0.3, spec.solidW * 1.5));
      this.addSolid(x, y - sh / 2, spec.solidW, sh);
    }
  }

  private placeCrop(c: CropPlacement): void {
    const x = c.tx * TILE + TILE / 2;
    const y = c.ty * TILE + TILE;
    this.scene.add
      .image(x, y, TEX.crop(c.crop, c.stage))
      .setOrigin(0.5, 1)
      .setDepth(y - 4);
  }

  private placeAnimal(a: AnimalPlacement): void {
    const x = a.tx * TILE + TILE / 2;
    const y = a.ty * TILE + TILE;
    const animal = new Animal(this.scene, x, y, a.id, {
      radius: (a.radius ?? 3) * TILE,
      ambient: a.ambient ?? false,
      canWalk: (px, py) => this.isWalkable(Math.floor(px / TILE), Math.floor(py / TILE)),
    });
    animal.setDepth(y);
    this.animals.push(animal);
  }
}

/* ------------------------------------------------------------------ */
/* Day and night                                                       */
/* ------------------------------------------------------------------ */

interface Glow {
  image: Phaser.GameObjects.Image;
  base: number;
  phase: number;
}

const DAY_KEYS: { m: number; v: number }[] = [
  { m: 0, v: 0 },
  { m: 270, v: 0 },
  { m: 330, v: 0.35 },
  { m: 420, v: 0.85 },
  { m: 510, v: 1 },
  { m: 990, v: 1 },
  { m: 1080, v: 0.7 },
  { m: 1140, v: 0.25 },
  { m: 1200, v: 0 },
  { m: 1440, v: 0 },
];

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** 0 in the middle of the night, 1 at midday. */
export function daylightAt(minutes: number): number {
  const m = ((minutes % 1440) + 1440) % 1440;
  for (let i = 0; i < DAY_KEYS.length - 1; i++) {
    const a = DAY_KEYS[i]!;
    const b = DAY_KEYS[i + 1]!;
    if (m >= a.m && m <= b.m) {
      const t = b.m === a.m ? 0 : (m - a.m) / (b.m - a.m);
      return a.v + (b.v - a.v) * smoothstep(t);
    }
  }
  return 1;
}

export class DayNight {
  private readonly tint: Phaser.GameObjects.Rectangle;
  private readonly shade: Phaser.GameObjects.Rectangle;
  private readonly glows: Glow[] = [];
  private weatherDim = 0;

  constructor(
    scene: Phaser.Scene,
    lights: LightPlacement[],
    worldW: number,
    worldH: number,
  ) {
    this.tint = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x2a2f5a, 0.4)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(800)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.shade = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x0b0d20, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(801);

    for (const light of lights) {
      const x = light.tx * TILE + TILE / 2;
      const y = light.ty * TILE + TILE / 2;
      const radius = light.radius ?? 54;
      const img = scene.add
        .image(x, y, TEX.light)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(hex(light.color ?? PAL.lamp))
        .setDisplaySize(radius * 2, radius * 2)
        .setAlpha(0)
        .setDepth(790);
      this.glows.push({ image: img, base: light.intensity ?? 0.5, phase: (x + y) * 0.013 });
    }

    // Keep the overlay sized to the camera, not the world.
    scene.scale.on('resize', this.layout, this);
    this.layout();
    void worldW;
    void worldH;
  }

  private layout(): void {
    const w = this.tint.scene.scale.width;
    const h = this.tint.scene.scale.height;
    this.tint.setSize(w, h);
    this.shade.setSize(w, h);
  }

  setWeatherDim(amount: number): void {
    this.weatherDim = amount;
  }

  update(clock: WorldClock): void {
    const day = daylightAt(clock.minutes);
    const night = 1 - day;
    const tintColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x2a2f5a),
      Phaser.Display.Color.ValueToColor(0xfff4dc),
      100,
      Math.round(day * 100),
    );
    const color = Phaser.Display.Color.GetColor(tintColor.r, tintColor.g, tintColor.b);
    this.tint.setFillStyle(color, 0.18 + night * 0.42 + this.weatherDim * 0.18);
    this.shade.setFillStyle(0x0b0d20, night * 0.24 + this.weatherDim * 0.12);

    const t = this.tint.scene.time.now / 1000;
    for (const g of this.glows) {
      const flicker = 0.9 + Math.sin(t * 2.1 + g.phase) * 0.06 + Math.sin(t * 5.7 + g.phase * 2) * 0.03;
      g.image.setAlpha(Math.min(1, night * g.base * flicker));
    }
  }

  destroy(): void {
    this.tint.destroy();
    this.shade.destroy();
    for (const g of this.glows) g.image.destroy();
    this.tint.scene.scale.off('resize', this.layout, this);
  }
}

/* ------------------------------------------------------------------ */
/* Ambient life                                                        */
/* ------------------------------------------------------------------ */

export class AmbientLife {
  private readonly scene: Phaser.Scene;
  private readonly kind: Ambience;
  private petals: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private fireflies: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private dust: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private leaves: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private birdTimer: Phaser.Time.TimerEvent | null = null;
  private lastSeason = '';
  private reduced = false;

  constructor(scene: Phaser.Scene, kind: Ambience) {
    this.scene = scene;
    this.kind = kind;
    this.reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.build();
  }

  private build(): void {
    const { width, height } = this.scene.scale;
    const outdoor = this.kind !== 'indoor';
    const blossoms = this.kind === 'village' || this.kind === 'shrine' || this.kind === 'forest';

    if (outdoor && blossoms) {
      this.petals = this.scene.add.particles(0, 0, TEX.effect('petal', 0), {
        x: { min: -20, max: width + 20 },
        y: -12,
        lifespan: 14000,
        speedX: { min: -16, max: 8 },
        speedY: { min: 12, max: 26 },
        scale: { min: 0.5, max: 1.05 },
        alpha: { start: 0.8, end: 0.1 },
        rotate: { min: 0, max: 360 },
        frequency: 1100,
        quantity: 1,
        emitting: false,
      });
      this.petals.setScrollFactor(0).setDepth(700);
    }

    if (outdoor) {
      this.fireflies = this.scene.add.particles(0, 0, TEX.effect('firefly', 0), {
        x: { min: 0, max: width },
        y: { min: height * 0.35, max: height },
        lifespan: { min: 1400, max: 2600 },
        speedX: { min: -8, max: 8 },
        speedY: { min: -10, max: 4 },
        scale: { min: 0.7, max: 1.3 },
        alpha: { start: 0.95, end: 0 },
        frequency: 260,
        quantity: 1,
        blendMode: 'ADD',
        emitting: false,
      });
      this.fireflies.setScrollFactor(0).setDepth(705);
    }

    if (this.kind === 'forest' || this.kind === 'village') {
      this.leaves = this.scene.add.particles(0, 0, TEX.effect('leaf', 0), {
        x: { min: -20, max: width + 20 },
        y: -10,
        lifespan: 12000,
        speedX: { min: -22, max: -4 },
        speedY: { min: 14, max: 24 },
        scale: { min: 0.6, max: 1 },
        alpha: { start: 0.85, end: 0.1 },
        rotate: { min: 0, max: 360 },
        frequency: 900,
        quantity: 1,
        emitting: false,
      });
      this.leaves.setScrollFactor(0).setDepth(700);
    }

    if (this.kind === 'indoor') {
      this.dust = this.scene.add.particles(0, 0, TEX.effect('dust', 0), {
        x: { min: 0, max: width },
        y: { min: 0, max: height },
        lifespan: { min: 5000, max: 9000 },
        speedX: { min: -3, max: 3 },
        speedY: { min: -6, max: -1 },
        scale: { min: 0.6, max: 1.2 },
        alpha: { start: 0.35, end: 0 },
        frequency: 420,
        quantity: 1,
        emitting: true,
      });
      this.dust.setScrollFactor(0).setDepth(700);
    }

    if (outdoor) {
      this.birdTimer = this.scene.time.addEvent({
        delay: 16000,
        loop: true,
        callback: () => this.maybeBird(),
      });
    }
  }

  private maybeBird(): void {
    const clock = this.scene.registry.get('clock') as WorldClock | undefined;
    if (!clock) return;
    if (clock.phase === 'night' || clock.weather === 'rain' || clock.weather === 'downpour') return;
    if (Math.random() > 0.55) return;
    const { width } = this.scene.scale;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const y = 24 + Math.random() * 70;
    const bird = this.scene.add
      .image(dir > 0 ? -20 : width + 20, y, TEX.effect('bird', 0))
      .setScrollFactor(0)
      .setDepth(690)
      .setAlpha(0.65)
      .setScale(dir > 0 ? 1 : -1, 1);
    const duration = 9000 + Math.random() * 5000;
    this.scene.tweens.add({
      targets: bird,
      x: dir > 0 ? width + 30 : -30,
      y: y + 12,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => bird.destroy(),
    });
    this.scene.tweens.add({
      targets: bird,
      y: y - 6,
      duration: 900,
      yoyo: true,
      repeat: Math.floor(duration / 1800),
      ease: 'Sine.easeInOut',
    });
  }

  update(delta: number, clock: WorldClock, weather: string): void {
    void delta;
    const day = clock.phase !== 'night';
    const season = clock.season;
    if (season !== this.lastSeason) this.lastSeason = season;

    if (this.petals) {
      const on = day && (season === 'spring' || season === 'summer') && !this.reduced && weather !== 'rain' && weather !== 'downpour';
      this.petals.emitting = on;
    }
    if (this.leaves) {
      const on = day && season === 'autumn' && !this.reduced && weather !== 'rain' && weather !== 'downpour';
      this.leaves.emitting = on;
    }
    if (this.fireflies) {
      const on = !day && !this.reduced && weather !== 'rain' && weather !== 'downpour';
      this.fireflies.emitting = on;
    }
    if (this.dust) {
      this.dust.emitting = !this.reduced;
    }
  }

  destroy(): void {
    this.birdTimer?.remove();
    this.petals?.destroy();
    this.fireflies?.destroy();
    this.dust?.destroy();
    this.leaves?.destroy();
  }
}

/** Deterministic scatter helper used by maps to place ground cover. */
export function scatter(
  seed: number,
  count: number,
  width: number,
  height: number,
  accept: (x: number, y: number) => boolean,
): TilePos[] {
  const rnd = mulberry32(seed);
  const out: TilePos[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 40) {
    guard++;
    const x = 1 + Math.floor(rnd() * (width - 2));
    const y = 1 + Math.floor(rnd() * (height - 2));
    if (!accept(x, y)) continue;
    out.push({ tx: x, ty: y });
  }
  return out;
}