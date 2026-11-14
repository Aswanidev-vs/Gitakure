/**
 * Gitakure Calm Procedural Sound Synthesizer
 * Pure Web Audio API — zero external assets, instant loading.
 * Tuning: Traditional Japanese pentatonic scale (Insen / Yo mode).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isAmbienceRunning: boolean = false;

  // Pentatonic notes in Hz (calm Insen / Hirajoshi scale)
  private readonly notes = [293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable or blocked
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

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : 0.22, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Play a gentle plucked koto note
   */
  public playPluck(noteIndex = 0): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = this.notes[noteIndex % this.notes.length];
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    // Filter to soften the pluck
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(220, t + 0.8);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.2);
  }

  /**
   * Hoe till ground sound (soft dirt thud)
   */
  public playTill(): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Water droplets / splash sound
   */
  public playWater(): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const dropTime = t + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650 + i * 180, dropTime);
      osc.frequency.exponentialRampToValueAtTime(320, dropTime + 0.08);

      gain.gain.setValueAtTime(0.18, dropTime);
      gain.gain.exponentialRampToValueAtTime(0.005, dropTime + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(dropTime);
      osc.stop(dropTime + 0.1);
    }
  }

  /**
   * Seed planting sound (soft rustle)
   */
  public playPlant(): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    this.playPluck(3);
  }

  /**
   * Crop harvest chime (ascending pentatonic sparkle)
   */
  public playHarvest(): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx) return;
    [2, 4, 6].forEach((noteIdx, i) => {
      setTimeout(() => {
        this.playPluck(noteIdx);
      }, i * 90);
    });
  }

  /**
   * Footstep rustle
   */
  public playStep(): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(70 + Math.random() * 20, t);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  /**
   * Dialogue typewriter beep
   */
  public playDialogueBlip(): void {
    if (this.isMuted || !this.ensureRunning() || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380 + Math.random() * 40, t);
    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  /**
   * Gentle ambient loop (breeze + periodic wind chimes)
   */
  public startAmbientValley(): void {
    if (this.isAmbienceRunning || !this.ensureRunning() || !this.ctx || !this.ambientGain) return;
    this.isAmbienceRunning = true;

    // Periodic calm koto notes every 6 to 14 seconds
    const scheduleNextChime = () => {
      if (!this.isAmbienceRunning) return;
      const delay = 6000 + Math.random() * 7000;
      setTimeout(() => {
        if (this.isAmbienceRunning && !this.isMuted) {
          const randomNote = Math.floor(Math.random() * this.notes.length);
          this.playPluck(randomNote);
          // Sometimes play a second harmonic
          if (Math.random() > 0.5) {
            setTimeout(() => {
              this.playPluck((randomNote + 2) % this.notes.length);
            }, 260);
          }
        }
        scheduleNextChime();
      }, delay);
    };

    scheduleNextChime();
  }
}

export const soundEngine = new SoundEngine();
