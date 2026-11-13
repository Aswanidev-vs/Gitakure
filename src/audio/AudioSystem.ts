/**
 * Audio system: synthesized ambient sounds via Web Audio API.
 * No external audio files required; everything is generated procedurally so
 * the game works fully offline.
 */

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private muted = false;
  private volumes = { master: 0.6, music: 0.4, sfx: 0.7 };

  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volumes.master;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio unavailable', e);
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : this.volumes.master;
  }

  setVolumes(v: { master?: number; music?: number; sfx?: number }): void {
    if (v.master !== undefined) this.volumes.master = v.master;
    if (v.music !== undefined) this.volumes.music = v.music;
    if (v.sfx !== undefined) this.volumes.sfx = v.sfx;
    if (this.masterGain && !this.muted) this.masterGain.gain.value = this.volumes.master;
  }

  /** Start a gentle ambient drone for the given scene. */
  startAmbient(scene: 'village' | 'forest' | 'riverside' | 'farmland' | 'shrine'): void {
    if (!this.ctx || !this.masterGain) return;
    this.stopAmbient();
    const baseFreq = scene === 'forest' ? 110 : scene === 'riverside' ? 130 : scene === 'shrine' ? 98 : 120;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = baseFreq;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.04 * this.volumes.music;
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.ambientOsc = osc;

    // Add a slow LFO for movement.
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 4;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
  }

  stopAmbient(): void {
    if (this.ambientOsc) {
      try { this.ambientOsc.stop(); } catch {}
      this.ambientOsc = null;
    }
  }

  /** Play a short SFX. */
  sfx(kind: 'step' | 'interact' | 'harvest' | 'water' | 'ui'): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const freqs: Record<string, number> = { step: 220, interact: 440, harvest: 660, water: 330, ui: 520 };
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freqs[kind] ?? 440;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08 * this.volumes.sfx, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
}