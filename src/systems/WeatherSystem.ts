/**
 * Weather.
 *
 * Weather is a world fact, not a filter: it changes the light, hides distance,
 * feeds the crops and keeps villagers indoors. Visuals are screen-space
 * particles so rain reads at the same density on a phone as on a monitor, and
 * the schedule advances one roll per in-game day so a storm is an event rather
 * than a flicker.
 */

import Phaser from 'phaser';
import { bus } from '@/core/EventBus';
import type { Season, Weather, WorldClock } from '@/shared/types';
import { mulberry32 } from '@/art/PixelCanvas';

const WEATHER_LABEL: Record<Weather, string> = {
  sunny: 'Clear',
  cloudy: 'Overcast',
  rain: 'Rain',
  downpour: 'Heavy rain',
  fog: 'Fog',
  snow: 'Snow',
};

export function weatherLabel(w: Weather): string {
  return WEATHER_LABEL[w] ?? w;
}

export class WeatherSystem {
  private scene: Phaser.Scene;
  private weather: Weather = 'sunny';
  private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private extras: Phaser.GameObjects.GameObject[] = [];
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private lastDay = -1;
  private started = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  getWeather(): Weather {
    return this.weather;
  }

  setWeather(w: Weather, force = false): void {
    if (!force && w === this.weather) return;
    this.weather = w;
    this.applyVisuals();
    bus.emit('weather:change', {
      weather: w,
      clock: { minutes: 0, day: 0, season: 'spring', weather: w, phase: 'morning' },
    });
  }

  /** Advance the day's weather roll. Called from the world update. */
  update(clock: WorldClock): void {
    if (!this.started) {
      this.started = true;
      this.lastDay = clock.day;
      const initial = this.pickForSeason(clock.season, clock.day);
      if (initial !== this.weather) this.setWeather(initial, true);
      return;
    }
    if (clock.day === this.lastDay) return;
    this.lastDay = clock.day;
    const next = this.pickForSeason(clock.season, clock.day);
    if (next !== this.weather) this.setWeather(next, true);
  }

  /** Deterministic per-day roll so a reload does not reroll the sky. */
  pickForSeason(season: Season, day: number): Weather {
    const rnd = mulberry32(day * 97 + season.length * 13 + 5);
    const r = rnd();
    if (season === 'winter') {
      if (r < 0.3) return 'snow';
      if (r < 0.55) return 'fog';
      if (r < 0.78) return 'cloudy';
      return 'sunny';
    }
    if (season === 'spring') {
      if (r < 0.22) return 'rain';
      if (r < 0.34) return 'downpour';
      if (r < 0.52) return 'cloudy';
      if (r < 0.62) return 'fog';
      return 'sunny';
    }
    if (season === 'summer') {
      if (r < 0.12) return 'rain';
      if (r < 0.34) return 'cloudy';
      return 'sunny';
    }
    if (r < 0.18) return 'rain';
    if (r < 0.4) return 'fog';
    if (r < 0.62) return 'cloudy';
    return 'sunny';
  }

  private applyVisuals(): void {
    for (const e of this.emitters) e.destroy();
    this.emitters = [];
    for (const e of this.extras) e.destroy();
    this.extras = [];
    this.overlay?.destroy();
    this.overlay = null;

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const rain = this.weather === 'rain' || this.weather === 'downpour';
    const heavy = this.weather === 'downpour';

    if (rain) {
      this.emitters.push(
        this.makeRain(w, {
          lifespan: 900,
          speedY: { min: 420, max: 620 },
          speedX: { min: -70, max: -24 },
          quantity: heavy ? 5 : 2,
          frequency: heavy ? 16 : 40,
          alpha: heavy ? 0.6 : 0.45,
          scale: heavy ? 1.25 : 0.9,
        },
        ),
      );
      this.overlay = this.scene.add
        .rectangle(0, 0, w, h, 0x1a2a3a, heavy ? 0.24 : 0.14)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(840);
    } else if (this.weather === 'fog') {
      this.overlay = this.scene.add
        .rectangle(0, 0, w, h, 0xc9c9d1, 0.28)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(840);
      for (let i = 0; i < 3; i++) {
        const band = this.scene.add
          .rectangle(0, h * (0.25 + i * 0.22), w, 42, 0xd8d8de, 0.1)
          .setOrigin(0, 0.5)
          .setScrollFactor(0)
          .setDepth(841);
        this.scene.tweens.add({
          targets: band,
          x: { from: -40, to: 40 },
          duration: 14000 + i * 3000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.extras.push(band);
      }
    } else if (this.weather === 'snow') {
      const em = this.scene.add.particles(0, 0, 'effect:snow_flake:0', {
        x: { min: 0, max: w },
        y: -8,
        lifespan: 6000,
        speedY: { min: 18, max: 44 },
        speedX: { min: -16, max: 16 },
        scale: { min: 0.6, max: 1.2 },
        alpha: { start: 0.9, end: 0.25 },
        quantity: 1,
        frequency: 110,
      });
      em.setScrollFactor(0).setDepth(850);
      this.emitters.push(em);
      this.overlay = this.scene.add
        .rectangle(0, 0, w, h, 0xd0d8e0, 0.1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(840);
    } else if (this.weather === 'cloudy') {
      this.overlay = this.scene.add
        .rectangle(0, 0, w, h, 0x5a6a7a, 0.08)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(840);
    }
  }

  private makeRain(
    w: number,
    cfg: {
      lifespan: number;
      speedY: { min: number; max: number };
      speedX: { min: number; max: number };
      quantity: number;
      frequency: number;
      alpha: number;
      scale: number;
    },
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    const em = this.scene.add.particles(0, 0, 'effect:rain_drop_heavy:0', {
      x: { min: -20, max: w + 20 },
      y: -16,
      lifespan: cfg.lifespan,
      speedY: cfg.speedY,
      speedX: cfg.speedX,
      scale: { min: cfg.scale * 0.8, max: cfg.scale * 1.3 },
      alpha: { start: cfg.alpha, end: 0.08 },
      quantity: cfg.quantity,
      frequency: cfg.frequency,
    });
    em.setScrollFactor(0).setDepth(850);
    return em;
  }

  destroy(): void {
    for (const e of this.emitters) e.destroy();
    this.emitters = [];
    for (const e of this.extras) e.destroy();
    this.extras = [];
    this.overlay?.destroy();
    this.overlay = null;
  }
}