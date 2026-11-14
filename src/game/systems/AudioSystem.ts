import type { AudioSettings } from '@/types';
import type { TimeOfDay } from '@/types';
import type { Weather } from '@/types';

// Procedural layered environmental audio via Web Audio (no audio files).
// Layers: wind (filtered noise), water (filtered noise + LFO), birds (daytime
// chirps), crickets (night chirps), rain (high-passed noise). Responds to
// time-of-day and weather. Separate master/ambience/sfx volume controls.
// Music is optional (not implemented here — a simple pad could be added).

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: GainNode | null = null;
  private sfx: GainNode | null = null;
  private settings: AudioSettings;
  private started = false;
  private layers: Record<string, { gain: GainNode; nodes: AudioNode[] }> = {};
  private birdTimer = 0;
  private cricketTimer = 0;

  constructor(settings: AudioSettings) {
    this.settings = settings;
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  start(): void {
    if (this.started) return;
    try {
      this.ctx = new AudioContext();
    } catch {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.settings.master;
    this.master.connect(this.ctx.destination);
    this.ambience = this.ctx.createGain();
    this.ambience.gain.value = this.settings.ambience;
    this.ambience.connect(this.master);
    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = this.settings.sfx;
    this.sfx.connect(this.master);

    this.buildWind();
    this.buildWater();
    this.buildRain();
    this.started = true;
  }

  private noiseBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private buildWind(): void {
    if (!this.ctx || !this.ambience) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.18;
    // Slow LFO on filter frequency for gusts.
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambience);
    src.start();
    this.layers.wind = { gain, nodes: [src, filter, gain, lfo, lfoGain] };
  }

  private buildWater(): void {
    if (!this.ctx || !this.ambience) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.12;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambience);
    src.start();
    this.layers.water = { gain, nodes: [src, filter, gain] };
  }

  private buildRain(): void {
    if (!this.ctx || !this.sfx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx);
    src.start();
    this.layers.rain = { gain, nodes: [src, filter, gain] };
  }

  private chirp(freq: number, duration: number, gainValue: number): void {
    if (!this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + duration * 0.5);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, t + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainValue, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.sfx);
    osc.start(t);
    osc.stop(t + duration);
  }

  update(dt: number, timeOfDay: TimeOfDay, weather: Weather): void {
    if (!this.started || !this.ctx) return;

    // Rain layer gain follows weather.
    const rainTarget = weather === 'heavyRain' ? 0.4 : weather === 'lightRain' ? 0.2 : 0;
    const rainGain = this.layers.rain?.gain;
    if (rainGain) rainGain.gain.value += (rainTarget - rainGain.gain.value) * Math.min(1, dt * 2);

    // Birds by day, crickets by night.
    const isDay = timeOfDay === 'morning' || timeOfDay === 'afternoon' || timeOfDay === 'sunrise';
    const isNight = timeOfDay === 'night' || timeOfDay === 'evening';
    if (isDay && weather === 'clear') {
      this.birdTimer -= dt;
      if (this.birdTimer <= 0) {
        this.birdTimer = 2 + Math.random() * 4;
        this.chirp(1800 + Math.random() * 800, 0.15, 0.15);
      }
    }
    if (isNight) {
      this.cricketTimer -= dt;
      if (this.cricketTimer <= 0) {
        this.cricketTimer = 0.5 + Math.random();
        this.chirp(4200 + Math.random() * 400, 0.05, 0.08);
      }
    }
  }

  setSettings(settings: AudioSettings): void {
    this.settings = settings;
    if (this.master) this.master.gain.value = settings.master;
    if (this.ambience) this.ambience.gain.value = settings.ambience;
    if (this.sfx) this.sfx.gain.value = settings.sfx;
  }

  /** Resume the AudioContext after a user gesture. */
  resume(): void {
    void this.ctx?.resume();
  }

  dispose(): void {
    void this.ctx?.close();
    this.ctx = null;
    this.started = false;
    this.layers = {};
  }
}