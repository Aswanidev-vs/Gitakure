/**
 * Gitakure Immersive Layered Audio System
 * Pure Web Audio API — Procedural Soundscapes
 * Independent channels: Ambient (Rain/Water/Wind/Crickets), Campfire, Melodic Peace, SFX.
 */

export class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;

  // Master & Channel Gains
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private campfireGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Active generators
  private timerHandles: number[] = [];

  // Japanese (Hirajoshi) & Kerala (Mohanam / Bhupali) calming pentatonic notes
  // C, D, E, G, A & D, Eb, G, A, Bb
  private readonly peacefulScale = [
    261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0,
  ];

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Ambient channel
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // Campfire channel
      this.campfireGain = this.ctx.createGain();
      this.campfireGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.campfireGain.connect(this.masterGain);

      // Music / peaceful chimes channel
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // SFX channel
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.startContinuousAmbience();
    } catch {
      // AudioContext unavailable
    }
  }

  private ensureRunning(): boolean {
    if (!this.ctx) this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  public setVolumes(volumes: { master?: number; ambient?: number; music?: number; sfx?: number; isMuted?: boolean }) {
    if (!this.ensureRunning() || !this.ctx) return;
    const t = this.ctx.currentTime;

    if (volumes.isMuted !== undefined) {
      this.isMuted = volumes.isMuted;
    }

    const mult = this.isMuted ? 0 : 1;

    if (volumes.master !== undefined && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(volumes.master * mult, t, 0.05);
    }
    if (volumes.ambient !== undefined && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(volumes.ambient * mult, t, 0.05);
    }
    if (volumes.music !== undefined && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(volumes.music * mult, t, 0.05);
    }
    if (volumes.sfx !== undefined && this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(volumes.sfx * mult, t, 0.05);
    }
  }

  /**
   * Continuous river & gentle wind stream noise
   */
  private startContinuousAmbience(): void {
    if (!this.ctx || !this.ambientGain) return;

    // Pink noise buffer generator for river stream
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    const whiteNoiseSource = this.ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    // Filter to sound like flowing canal water
    const waterFilter = this.ctx.createBiquadFilter();
    waterFilter.type = 'lowpass';
    waterFilter.frequency.setValueAtTime(420, this.ctx.currentTime);

    whiteNoiseSource.connect(waterFilter);
    waterFilter.connect(this.ambientGain);
    whiteNoiseSource.start(0);

    // Periodic calm folk chimes (every 8 to 15s)
    this.timerHandles.push(
      window.setInterval(() => {
        if (Math.random() > 0.35) {
          this.playGentleChime();
        }
      }, 9000)
    );

    // Periodic campfire crackle bursts
    this.timerHandles.push(
      window.setInterval(() => {
        this.playCampfirePop();
      }, 1800)
    );

    // Night crickets
    this.timerHandles.push(
      window.setInterval(() => {
        this.playCricketTrill();
      }, 6000)
    );
  }

  /**
   * Gentle resonant plucked chime (Japanese Koto / Kerala Mohanam temple bell)
   */
  public playGentleChime(noteIdx?: number): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const idx = noteIdx ?? Math.floor(Math.random() * this.peacefulScale.length);
    const freq = this.peacefulScale[idx];

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(320, t + 1.8);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 2.2);
  }

  /**
   * Campfire ember pop & crackle
   */
  public playCampfirePop(): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx || !this.campfireGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160 + Math.random() * 240, t);

    gain.gain.setValueAtTime(0.06 + Math.random() * 0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.campfireGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Evening cricket trill
   */
  public playCricketTrill(): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx || !this.ambientGain) return;
    const t = this.ctx.currentTime;

    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const chirpTime = t + i * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(4500, chirpTime);

      gain.gain.setValueAtTime(0.018, chirpTime);
      gain.gain.exponentialRampToValueAtTime(0.001, chirpTime + 0.035);

      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(chirpTime);
      osc.stop(chirpTime + 0.04);
    }
  }

  /**
   * Footstep rustle on grass/stone
   */
  public playFootstep(): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65 + Math.random() * 18, t);
    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  /**
   * Sit down / stand up soft rustle
   */
  public playSitSound(): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    this.playGentleChime(3);
  }
}

export const soundscapes = new SoundscapeEngine();
