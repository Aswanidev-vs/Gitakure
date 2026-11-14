import * as THREE from 'three';
import type { Weather } from '@/types';

// Weather system: clear/cloudy/lightRain/heavyRain/mist. Drives a rain
// particle system (Points), fog density, and a wet-ground tint. Cycles
// every few minutes. Lightweight (spec §14, §18).

const WEATHER_CYCLE: Array<{ weather: Weather; duration: number }> = [
  { weather: 'clear', duration: 180 },
  { weather: 'cloudy', duration: 90 },
  { weather: 'lightRain', duration: 70 },
  { weather: 'mist', duration: 60 },
  { weather: 'clear', duration: 120 },
  { weather: 'heavyRain', duration: 50 },
];

const FOG_DENSITY: Record<Weather, number> = {
  clear: 0.006,
  cloudy: 0.012,
  lightRain: 0.02,
  heavyRain: 0.03,
  mist: 0.045,
};

export class WeatherSystem {
  private weather: Weather = 'clear';
  private elapsed = 0;
  private cycleIndex = 0;
  private rain: THREE.Points;
  private rainVelocities: Float32Array;
  private rainIntensity = 0; // 0..1 eased
  private reducedMotion = false;
  private listener: ((w: Weather) => void) | null = null;

  constructor(scene: THREE.Scene) {
    // Rain: a cylinder of points around the camera that falls and resets.
    const count = 900;
    const positions = new Float32Array(count * 3);
    this.rainVelocities = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.resetRainDrop(positions, i, true);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xaaccee,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.rain = new THREE.Points(geo, mat);
    this.rain.visible = false;
    this.rain.name = 'rain';
    scene.add(this.rain);
  }

  setReducedMotion(v: boolean): void {
    this.reducedMotion = v;
    this.rain.visible = false;
  }

  onWeatherChange(fn: (w: Weather) => void): void {
    this.listener = fn;
  }

  get current(): Weather {
    return this.weather;
  }

  update(dt: number, cameraPos: THREE.Vector3): void {
    this.elapsed += dt;
    const entry = WEATHER_CYCLE[this.cycleIndex]!;
    if (this.elapsed >= entry.duration) {
      this.elapsed = 0;
      this.cycleIndex = (this.cycleIndex + 1) % WEATHER_CYCLE.length;
      const next = WEATHER_CYCLE[this.cycleIndex]!.weather;
      if (next !== this.weather) {
        this.weather = next;
        this.listener?.(next);
      }
    }

    // Ease rain intensity toward the target.
    const raining = this.weather === 'lightRain' || this.weather === 'heavyRain';
    const target = raining ? (this.weather === 'heavyRain' ? 1 : 0.5) : 0;
    this.rainIntensity += (target - this.rainIntensity) * Math.min(1, dt * 0.5);

    if (this.reducedMotion) {
      this.rain.visible = false;
      return;
    }

    this.rain.visible = this.rainIntensity > 0.02;
    if (!this.rain.visible) return;

    // Follow camera so rain surrounds the player.
    this.rain.position.set(cameraPos.x, cameraPos.y + 8, cameraPos.z);

    // Fall animation.
    const pos = this.rain.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const speed = 12 + this.rainIntensity * 14;
    for (let i = 0; i < this.rainVelocities.length; i++) {
      arr[i * 3 + 1]! -= speed * dt;
      if (arr[i * 3 + 1]! < -8) {
        this.resetRainDrop(arr, i);
      }
    }
    pos.needsUpdate = true;
    (this.rain.material as THREE.PointsMaterial).opacity = 0.6 * this.rainIntensity;
  }

  private resetRainDrop(arr: Float32Array, i: number, randomY = false): void {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 14;
    arr[i * 3] = Math.cos(a) * r;
    arr[i * 3 + 1] = randomY ? Math.random() * 16 - 8 : 8;
    arr[i * 3 + 2] = Math.sin(a) * r;
    this.rainVelocities[i] = 0.8 + Math.random() * 0.4;
  }

  fogDensity(): number {
    return FOG_DENSITY[this.weather];
  }

  dispose(): void {
    this.rain.geometry.dispose();
    (this.rain.material as THREE.Material).dispose();
    this.rain.removeFromParent();
  }
}