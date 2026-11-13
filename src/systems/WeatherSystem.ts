/**
 * Weather system: owns the current weather and applies visual overlays
 * (rain particles, fog tint, snow). Listens to season changes to pick
 * appropriate weather.
 */

import { bus } from '@/core/EventBus';
import type { Season, Weather } from '@/shared/types';
import { mulberry32 } from '@/art/PixelCanvas';

export class WeatherSystem {
  private weather: Weather = 'sunny';
  private scene: Phaser.Scene;
  private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private overlay: Phaser.GameObjects.Rectangle | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setWeather(w: Weather): void {
    if (w === this.weather) return;
    this.weather = w;
    this.applyVisuals();
    bus.emit('weather:change', { weather: w, clock: { minutes: 0, day: 0, season: 'spring', weather: w, phase: 'morning' } });
  }

  getWeather(): Weather {
    return this.weather;
  }

  /** Pick a weather appropriate for the season, deterministically by day. */
  pickForSeason(season: Season, day: number): Weather {
    const rnd = mulberry32(day * 97 + season.length);
    const r = rnd();
    if (season === 'winter') {
      if (r < 0.3) return 'snow';
      if (r < 0.55) return 'fog';
      if (r < 0.75) return 'cloudy';
      return 'sunny';
    }
    if (season === 'spring') {
      if (r < 0.25) return 'rain';
      if (r < 0.45) return 'cloudy';
      if (r < 0.55) return 'fog';
      return 'sunny';
    }
    if (season === 'summer') {
      if (r < 0.15) return 'rain';
      if (r < 0.3) return 'cloudy';
      return 'sunny';
    }
    // autumn
    if (r < 0.2) return 'rain';
    if (r < 0.4) return 'fog';
    if (r < 0.6) return 'cloudy';
    return 'sunny';
  }

  private applyVisuals(): void {
    // Clear previous emitters.
    for (const e of this.emitters) e.destroy();
    this.emitters = [];
    if (this.overlay) { this.overlay.destroy(); this.overlay = null; }

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    if (this.weather === 'rain' || this.weather === 'downpour') {
      const tex = this.scene.textures.get('effect:rain_drop:0');
      if (tex) {
        const em = this.scene.add.particles(0, 0, 'effect:rain_drop:0', {
          x: { min: 0, max: w },
          y: -10,
          lifespan: 800,
          speedY: { min: 200, max: 320 },
          speedX: { min: -20, max: 20 },
          quantity: this.weather === 'downpour' ? 6 : 3,
          frequency: 40,
          alpha: { start: 0.8, end: 0.2 },
        });
        this.emitters.push(em);
      }
      this.overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x1a2a3a, 0.15);
      this.overlay.setDepth(1000);
    } else if (this.weather === 'fog') {
      this.overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0xc9c9d1, 0.25);
      this.overlay.setDepth(1000);
    } else if (this.weather === 'snow') {
      const em = this.scene.add.particles(0, 0, 'effect:snow_flake:0', {
        x: { min: 0, max: w },
        y: -5,
        lifespan: 3000,
        speedY: { min: 20, max: 50 },
        speedX: { min: -15, max: 15 },
        quantity: 2,
        frequency: 120,
        alpha: { start: 0.9, end: 0.3 },
      });
      this.emitters.push(em);
      this.overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0xd0d8e0, 0.1);
      this.overlay.setDepth(1000);
    }
  }

  destroy(): void {
    for (const e of this.emitters) e.destroy();
    if (this.overlay) this.overlay.destroy();
  }
}