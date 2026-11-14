/**
 * Gitakure — Landing Page Interactions & Atmospheric Soundscape
 */

(function () {
  'use strict';

  // ── 1. Lucide Icons ──────────────────────────────────────────────
  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // ── 2. Sakura Petals Canvas Animation ─────────────────────────────
  let petalsEnabled = true;
  let canvas, ctx, animFrameId;
  const petals = [];
  const PETAL_COUNT = 38;

  class SakuraPetal {
    constructor(w, h, randomY = true) {
      this.reset(w, h, randomY);
    }

    reset(w, h, randomY = false) {
      this.x = Math.random() * (w + 200) - 100;
      this.y = randomY ? Math.random() * h : -20 - Math.random() * 30;
      this.size = 9 + Math.random() * 10;
      this.speedY = 0.8 + Math.random() * 1.4;
      this.speedX = 0.6 + Math.random() * 1.1;
      this.swaySpeed = 0.015 + Math.random() * 0.025;
      this.swayAngle = Math.random() * Math.PI * 2;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.04;
      this.flip = Math.random() * Math.PI;
      this.flipSpeed = 0.02 + Math.random() * 0.03;
      this.opacity = 0.65 + Math.random() * 0.3;
      // Soft petal color variation (petal pink, coral, soft blush)
      const colors = ['#f472b6', '#f9a8d4', '#fb7185', '#fbcfe8'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update(w, h) {
      this.swayAngle += this.swaySpeed;
      this.rotation += this.rotationSpeed;
      this.flip += this.flipSpeed;

      this.x += this.speedX + Math.sin(this.swayAngle) * 0.9;
      this.y += this.speedY;

      if (this.y > h + 30 || this.x > w + 100) {
        this.reset(w, h, false);
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(Math.cos(this.flip), 1);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;

      // Draw graceful cherry blossom petal shape
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size * 0.6, -this.size * 0.6, this.size * 0.8, this.size * 0.3, 0, this.size);
      ctx.bezierCurveTo(-this.size * 0.8, this.size * 0.3, -this.size * 0.6, -this.size * 0.6, 0, -this.size);
      ctx.fill();

      ctx.restore();
    }
  }

  function initPetalsCanvas() {
    canvas = document.getElementById('petals-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    petals.length = 0;
    for (let i = 0; i < PETAL_COUNT; i++) {
      petals.push(new SakuraPetal(canvas.width, canvas.height, true));
    }

    function loop() {
      if (!petalsEnabled) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animFrameId = requestAnimationFrame(loop);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < petals.length; i++) {
        petals[i].update(canvas.width, canvas.height);
        petals[i].draw(ctx);
      }
      animFrameId = requestAnimationFrame(loop);
    }
    loop();
  }

  // ── 3. Countryside Ambient Soundscape ──────────────────────────────
  // Fully generative Web Audio soundscape. Every layer is synthesized live:
  // wind, breeze, river water, stream water, birdsong, and crickets.
  // No audio files required — keeps the page light and lets each layer be mixed
  // independently and saved as a user preference.

  const AMBIENT_STORAGE_KEY = 'gitakure:ambient-sound';
  const MIXER_STORAGE_KEY = 'gitakure:ambient-mixer';
  const MASTER_STORAGE_KEY = 'gitakure:ambient-master';
  const MUTE_STORAGE_KEY = 'gitakure:ambient-muted';

  // Canonical layer definitions: id, display name, default 0..1 level.
  const LAYER_DEFS = [
    { id: 'wind', name: 'Wind', default: 0.7 },
    { id: 'breeze', name: 'Breeze', default: 0.45 },
    { id: 'river', name: 'Flowing River', default: 0.65 },
    { id: 'stream', name: 'Stream Water', default: 0.5 },
    { id: 'birds', name: 'Birdsong', default: 0.5 },
    { id: 'crickets', name: 'Crickets', default: 0.35 }
  ];

  let audioCtx = null;
  let masterGain = null;
  let isAudioPlaying = false;
  let hasUserSetPreference = false;
  let hasUnlockedAudio = false;
  let masterVolume = 0.7;
  let masterMuted = false;
  let layerLevels = {};
  let layerNodes = {};
  let activeTimers = {};
  let engineSources = [];
  let currentPreset = 'cozy';
  let meters = null;

  function clamp01(n, fallback) {
    const v = typeof n === 'number' && !Number.isNaN(n) ? n : fallback;
    return Math.min(1, Math.max(0, v));
  }

  function readNumber(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = parseFloat(raw);
      return Number.isNaN(parsed) ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function readStoredMixer() {
    const stored = {};
    try {
      const raw = window.localStorage.getItem(MIXER_STORAGE_KEY);
      if (raw) Object.assign(stored, JSON.parse(raw) || {});
    } catch (e) {}
    LAYER_DEFS.forEach(function (def) {
      stored[def.id] = clamp01(
        typeof stored[def.id] === 'number' ? stored[def.id] : readNumber('gitakure:layer:' + def.id, def.default),
        def.default
      );
    });
    return stored;
  }

  function readStoredSoundOn() {
    try {
      const raw = window.localStorage.getItem(AMBIENT_STORAGE_KEY);
      if (raw === 'off') return false;
      if (raw === 'on') return true;
    } catch (e) {}
    return true;
  }

  function layerGain(id) {
    if (!layerNodes[id]) return null;
    return layerNodes[id].gain;
  }

  function ensureAudioContext() {
    if (audioCtx) return true;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return false;
    try {
      audioCtx = new AudioCtor();
    } catch (e) {
      return false;
    }

    masterGain = audioCtx.createGain();
    masterGain.gain.value = masterMuted ? 0.0001 : masterVolume * 0.9;
    masterGain.connect(audioCtx.destination);

    meters = audioCtx.createAnalyser();
    meters.fftSize = 256;
    meters.smoothingTimeConstant = 0.85;
    masterGain.connect(meters);

    return true;
  }

  // Shared helper: create a looping noise buffer source.
  function makeNoiseSource(buffer) {
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  // Build cached noise buffers (1s stereo-ish mono buffers are enough).
  const noiseBuffers = {};
  function getNoiseBuffer(kind) {
    if (noiseBuffers[kind]) return noiseBuffers[kind];
    const seconds = 3;
    const length = Math.floor(audioCtx.sampleRate * seconds);
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let brown = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === 'brown') {
        brown = (brown + 0.02 * white) / 1.02;
        data[i] = brown * 3.2;
      } else if (kind === 'pink') {
        // Paul Kellet's economy pink noise
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        data[i] = white * 0.6;
      }
    }
    noiseBuffers[kind] = buffer;
    return buffer;
  }

  // Small reverb-ish impulse for placing sounds in a space.
  function makeImpulse(seconds, decay) {
    const rate = audioCtx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = audioCtx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const channel = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  let reverbNode = null;
  function getReverb() {
    if (reverbNode) return reverbNode;
    const convolver = audioCtx.createConvolver();
    convolver.buffer = makeImpulse(2.6, 2.4);
    const wet = audioCtx.createGain();
    wet.gain.value = 0.5;
    convolver.connect(wet);
    wet.connect(masterGain);
    reverbNode = { input: convolver, wet: wet };
    return reverbNode;
  }

  // ── Layer builders ──────────────────────────────────────────────────

  function buildWindLayer() {
    const out = audioCtx.createGain();
    out.gain.value = 0;
    out.connect(masterGain);
    const reverb = getReverb();

    // Deep body: low-passed brown noise with a very slow swell.
    const body = makeNoiseSource(getNoiseBuffer('brown'));
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 0.6;

    const bodyGain = audioCtx.createGain();
    bodyGain.gain.value = 0.9;

    // Slow gust modulation.
    const gust = audioCtx.createOscillator();
    gust.type = 'sine';
    gust.frequency.value = 0.055;
    const gustAmt = audioCtx.createGain();
    gustAmt.gain.value = 0.35;
    const gustOffset = audioCtx.createConstantSource();
    gustOffset.offset.value = 0.75;
    gust.connect(gustAmt);
    gustAmt.connect(bodyGain.gain);
    gustOffset.connect(bodyGain.gain);

    // Mid whistle: band-passed pink noise that sweeps slowly.
    const whistle = makeNoiseSource(getNoiseBuffer('pink'));
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 1.4;

    const whistleGain = audioCtx.createGain();
    whistleGain.gain.value = 0.18;

    const sweep = audioCtx.createOscillator();
    sweep.type = 'sine';
    sweep.frequency.value = 0.037;
    const sweepAmt = audioCtx.createGain();
    sweepAmt.gain.value = 380;
    sweep.connect(sweepAmt);
    sweepAmt.connect(bp.frequency);

    body.connect(lp);
    lp.connect(bodyGain);
    bodyGain.connect(out);
    whistle.connect(bp);
    bp.connect(whistleGain);
    whistleGain.connect(out);
    whistleGain.connect(reverb.input);

    const sources = [body, gust, gustOffset, whistle, sweep];
    sources.forEach(function (n) { n.start(); engineSources.push(n); });
    return { out: out, sources: sources };
  }

  function buildBreezeLayer() {
    const out = audioCtx.createGain();
    out.gain.value = 0;
    out.connect(masterGain);

    const src = makeNoiseSource(getNoiseBuffer('pink'));
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1100;
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5200;

    const bodyGain = audioCtx.createGain();
    bodyGain.gain.value = 0.0;

    // Rustle flutter: a couple of detuned slow oscillators.
    const flutter = audioCtx.createOscillator();
    flutter.type = 'sine';
    flutter.frequency.value = 0.62;
    const flutterAmt = audioCtx.createGain();
    flutterAmt.gain.value = 0.12;
    const flutterOffset = audioCtx.createConstantSource();
    flutterOffset.offset.value = 0.2;
    flutter.connect(flutterAmt);
    flutterAmt.connect(bodyGain.gain);
    flutterOffset.connect(bodyGain.gain);

    const flutter2 = audioCtx.createOscillator();
    flutter2.type = 'sine';
    flutter2.frequency.value = 0.23;
    const flutter2Amt = audioCtx.createGain();
    flutter2Amt.gain.value = 0.08;
    flutter2.connect(flutter2Amt);
    flutter2Amt.connect(bodyGain.gain);

    src.connect(hp);
    hp.connect(lp);
    lp.connect(bodyGain);
    bodyGain.connect(out);

    const sources = [src, flutter, flutterOffset, flutter2];
    sources.forEach(function (n) { n.start(); engineSources.push(n); });
    return { out: out, sources: sources };
  }

  function buildRiverLayer() {
    const out = audioCtx.createGain();
    out.gain.value = 0;
    out.connect(masterGain);
    const reverb = getReverb();

    const src = makeNoiseSource(getNoiseBuffer('brown'));
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 620;
    bp.Q.value = 0.55;

    const bodyGain = audioCtx.createGain();
    bodyGain.gain.value = 0.85;

    // Gentle flow swell — like a wide river breathing.
    const swell = audioCtx.createOscillator();
    swell.type = 'sine';
    swell.frequency.value = 0.085;
    const swellAmt = audioCtx.createGain();
    swellAmt.gain.value = 0.25;
    const swellOffset = audioCtx.createConstantSource();
    swellOffset.offset.value = 0.72;
    swell.connect(swellAmt);
    swellAmt.connect(bodyGain.gain);
    swellOffset.connect(bodyGain.gain);

    src.connect(bp);
    bp.connect(bodyGain);
    bodyGain.connect(out);
    bodyGain.connect(reverb.input);

    const sources = [src, swell, swellOffset];
    sources.forEach(function (n) { n.start(); engineSources.push(n); });
    return { out: out, sources: sources };
  }

  function buildStreamLayer() {
    const out = audioCtx.createGain();
    out.gain.value = 0;
    out.connect(masterGain);

    const src = makeNoiseSource(getNoiseBuffer('white'));
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1500;
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 6800;

    const bodyGain = audioCtx.createGain();
    bodyGain.gain.value = 0.16;

    // Tiny bubbling modulation so the stream feels alive, not static.
    const bubble = audioCtx.createOscillator();
    bubble.type = 'sine';
    bubble.frequency.value = 1.7;
    const bubbleAmt = audioCtx.createGain();
    bubbleAmt.gain.value = 0.05;
    const bubbleOffset = audioCtx.createConstantSource();
    bubbleOffset.offset.value = 0.15;
    bubble.connect(bubbleAmt);
    bubbleAmt.connect(bodyGain.gain);
    bubbleOffset.connect(bodyGain.gain);

    src.connect(hp);
    hp.connect(lp);
    lp.connect(bodyGain);
    bodyGain.connect(out);

    const sources = [src, bubble, bubbleOffset];
    sources.forEach(function (n) { n.start(); engineSources.push(n); });
    return { out: out, sources: sources };
  }

  // ── Bird & cricket scheduling ───────────────────────────────────────

  function chirp(freqStart, freqEnd, duration, level, pan) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const panner = audioCtx.createStereoPanner();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, freqEnd), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), now + duration * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    panner.pan.setValueAtTime(pan, now);

    const reverb = getReverb();
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(masterGain);
    panner.connect(reverb.input);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function scheduleBirdPhrase() {
    if (!audioCtx || !isAudioPlaying || layerLevels.birds <= 0.001) return;
    const base = 2100 + Math.random() * 1400;
    const notes = 2 + Math.floor(Math.random() * 3);
    const pan = Math.random() * 1.6 - 0.8;
    let offset = 0;
    for (let i = 0; i < notes; i++) {
      (function (delay, idx) {
        const t = setTimeout(function () {
          const up = Math.random() > 0.4;
          const f = base + Math.random() * 500;
          chirp(
            up ? f : f + 320,
            up ? f + 480 : f - 260,
            0.07 + Math.random() * 0.06,
            0.09 + Math.random() * 0.05,
            Math.max(-0.9, Math.min(0.9, pan + (Math.random() - 0.5) * 0.4))
          );
        }, delay);
        activeTimers['bird' + idx + '_' + Math.random()] = t;
      })(offset, i);
      offset += 90 + Math.random() * 130;
    }
    scheduleNext('birds', 1800 + Math.random() * 4200);
  }

  function scheduleCricketPhrase() {
    if (!audioCtx || !isAudioPlaying || layerLevels.crickets <= 0.001) return;
    const pulses = 2 + Math.floor(Math.random() * 3);
    const pan = Math.random() * 1.6 - 0.8;
    const f = 4200 + Math.random() * 900;
    for (let i = 0; i < pulses; i++) {
      (function (idx) {
        const t = setTimeout(function () {
          const now = audioCtx.currentTime;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const panner = audioCtx.createStereoPanner();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.03, now + 0.006);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
          panner.pan.setValueAtTime(pan, now);
          osc.connect(gain);
          gain.connect(panner);
          panner.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.07);
        }, i * 75);
        activeTimers['crk' + idx + '_' + Math.random()] = t;
      })(i);
    }
    scheduleNext('crickets', 900 + Math.random() * 2200);
  }

  function scheduleNext(kind, delay) {
    const key = kind + '-loop';
    if (activeTimers[key]) clearTimeout(activeTimers[key]);
    const tick = function () {
      if (!isAudioPlaying) return;
      if (kind === 'birds') scheduleBirdPhrase();
      else scheduleCricketPhrase();
    };
    activeTimers[key] = setTimeout(tick, delay);
  }

  function startBirdAndCrickets() {
    scheduleNext('birds', 1200 + Math.random() * 1500);
    scheduleNext('crickets', 800 + Math.random() * 1200);
  }

  function stopBirdAndCrickets() {
    Object.keys(activeTimers).forEach(function (k) {
      clearTimeout(activeTimers[k]);
      delete activeTimers[k];
    });
  }

  // ── Engine lifecycle ────────────────────────────────────────────────

  function buildAllLayers() {
    if (!audioCtx) return;
    layerNodes.wind = buildWindLayer();
    layerNodes.breeze = buildBreezeLayer();
    layerNodes.river = buildRiverLayer();
    layerNodes.stream = buildStreamLayer();
    // Birds and crickets are event-driven, but we keep a gain node so the
    // mixer slider can attenuate them in real time.
    layerNodes.birds = { gain: audioCtx.createGain(), out: null };
    layerNodes.birds.gain.gain.value = 1;
    layerNodes.birds.gain.connect(masterGain);
    layerNodes.crickets = { gain: audioCtx.createGain(), out: null };
    layerNodes.crickets.gain.gain.value = 1;
    layerNodes.crickets.gain.connect(masterGain);
    applyAllLayerGains();
  }

  function applyAllLayerGains() {
    if (!audioCtx) return;
    LAYER_DEFS.forEach(function (def) {
      const g = layerGain(def.id);
      if (g) {
        const target = Math.pow(layerLevels[def.id], 1.35);
        g.gain.setTargetAtTime(target, audioCtx.currentTime, 0.25);
      }
    });
  }

  function applyMasterGain() {
    if (!audioCtx || !masterGain) return;
    const target = masterMuted ? 0.0001 : Math.max(0.0001, masterVolume * 0.9);
    masterGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.2);
  }

  function stopEngine() {
    stopBirdAndCrickets();
    engineSources.forEach(function (node) {
      try { node.stop(); } catch (e) {}
      try { node.disconnect(); } catch (e) {}
    });
    engineSources = [];
    Object.keys(layerNodes).forEach(function (k) {
      const layer = layerNodes[k];
      const g = layer && layer.gain;
      if (g) {
        try { g.disconnect(); } catch (e) {}
      }
    });
    if (meters) meters = null;
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
      audioCtx = null;
    }
    masterGain = null;
    reverbNode = null;
    Object.keys(noiseBuffers).forEach(function (k) { delete noiseBuffers[k]; });
  }

  function applyStoredMixer() {
    LAYER_DEFS.forEach(function (def) {
      const input = document.getElementById('layer-' + def.id);
      const out = document.getElementById('layer-' + def.id + '-value');
      const pct = Math.round(layerLevels[def.id] * 100);
      if (input && document.activeElement !== input) input.value = String(pct);
      if (out) out.textContent = pct + '%';
      const row = input ? input.closest('.mixer-row') : null;
      if (row) row.classList.toggle('is-muted', layerLevels[def.id] <= 0.001);
    });

    const masterInput = document.getElementById('ambient-volume');
    const masterOut = document.getElementById('volume-value');
    if (masterInput && document.activeElement !== masterInput) {
      masterInput.value = String(Math.round(masterVolume * 100));
    }
    if (masterOut) masterOut.textContent = Math.round(masterVolume * 100) + '%';

    document.querySelectorAll('.preset-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-preset') === currentPreset);
    });
  }

  function syncSoundUi() {
    const fab = document.getElementById('sound-fab');
    const footerBtn = document.getElementById('audio-toggle-btn');
    const footerLabel = document.getElementById('audio-label');
    const modalBtn = document.getElementById('modal-audio-toggle');

    const audible = isAudioPlaying && !masterMuted;

    if (fab) {
      fab.classList.toggle('playing', audible);
      fab.setAttribute('aria-pressed', String(audible));
      fab.setAttribute('aria-label', audible ? 'Turn ambient sound off' : 'Turn ambient sound on');
      fab.title = audible ? 'Ambient sound on' : 'Ambient sound off';
      const label = fab.querySelector('.sound-fab-label');
      if (label) label.textContent = audible ? 'Sound On' : 'Sound Off';
    }

    if (footerBtn) footerBtn.classList.toggle('playing', audible);
    if (footerLabel) footerLabel.textContent = audible ? 'Ambient Sound: On' : 'Ambient Sound: Off';

    if (modalBtn) {
      modalBtn.classList.toggle('active', audible);
      modalBtn.textContent = audible ? 'Sound: On' : 'Sound: Off';
      modalBtn.setAttribute('aria-pressed', String(audible));
    }
  }

  function persistMixer() {
    try {
      window.localStorage.setItem(MIXER_STORAGE_KEY, JSON.stringify(layerLevels));
      LAYER_DEFS.forEach(function (def) {
        window.localStorage.setItem('gitakure:layer:' + def.id, String(layerLevels[def.id]));
      });
    } catch (e) {}
  }

  function persistMaster() {
    try {
      window.localStorage.setItem(MASTER_STORAGE_KEY, String(masterVolume));
      window.localStorage.setItem(MUTE_STORAGE_KEY, masterMuted ? '1' : '0');
    } catch (e) {}
  }

  function startEngine() {
    if (!ensureAudioContext()) return false;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!Object.keys(layerNodes).length) buildAllLayers();
    isAudioPlaying = true;
    hasUnlockedAudio = true;
    applyMasterGain();
    applyAllLayerGains();
    startBirdAndCrickets();
    syncSoundUi();
    return audioCtx.state === 'running';
  }

  function pauseEngine() {
    isAudioPlaying = false;
    stopEngine();
    syncSoundUi();
  }

  function setAmbientSound(on, persist) {
    if (on) {
      startEngine();
    } else {
      pauseEngine();
    }
    if (persist) {
      try { window.localStorage.setItem(AMBIENT_STORAGE_KEY, isAudioPlaying ? 'on' : 'off'); } catch (e) {}
    }
    syncSoundUi();
  }

  function toggleAmbientSound() {
    hasUserSetPreference = true;
    if (isAudioPlaying) {
      setAmbientSound(false, true);
    } else {
      masterMuted = false;
      persistMaster();
      setAmbientSound(true, true);
    }
  }

  const PRESETS = {
    cozy: { wind: 0.7, breeze: 0.45, river: 0.65, stream: 0.5, birds: 0.5, crickets: 0.35 },
    riverside: { wind: 0.4, breeze: 0.3, river: 0.95, stream: 0.75, birds: 0.45, crickets: 0.15 },
    forest: { wind: 0.5, breeze: 0.7, river: 0.2, stream: 0.35, birds: 0.9, crickets: 0.25 },
    night: { wind: 0.35, breeze: 0.15, river: 0.45, stream: 0.3, birds: 0.12, crickets: 0.9 }
  };

  function applyPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;
    currentPreset = name;
    LAYER_DEFS.forEach(function (def) {
      layerLevels[def.id] = clamp01(preset[def.id], def.default);
    });
    applyAllLayerGains();
    persistMixer();
    applyStoredMixer();
  }

  function initAmbientSound() {
    layerLevels = readStoredMixer();
    masterVolume = clamp01(readNumber(MASTER_STORAGE_KEY, 0.7), 0.7);
    masterMuted = false;
    try {
      const m = window.localStorage.getItem(MUTE_STORAGE_KEY);
      if (m === '1') masterMuted = true;
    } catch (e) {}

    const fab = document.getElementById('sound-fab');
    const footerBtn = document.getElementById('audio-toggle-btn');
    const modalBtn = document.getElementById('modal-audio-toggle');
    const masterInput = document.getElementById('ambient-volume');
    const muteBtn = document.getElementById('ambient-mute-btn');

    if (fab) fab.addEventListener('click', toggleAmbientSound);
    if (footerBtn) footerBtn.addEventListener('click', toggleAmbientSound);
    if (modalBtn) modalBtn.addEventListener('click', toggleAmbientSound);

    if (masterInput) {
      const onInput = function () {
        masterVolume = clamp01((parseFloat(masterInput.value) || 0) / 100, 0.7);
        if (masterVolume > 0 && masterMuted) {
          masterMuted = false;
          persistMaster();
        }
        applyMasterGain();
        const out = document.getElementById('volume-value');
        if (out) out.textContent = Math.round(masterVolume * 100) + '%';
        persistMaster();
        syncSoundUi();
        if (!isAudioPlaying && !hasUserSetPreference) setAmbientSound(true, false);
      };
      masterInput.addEventListener('input', onInput);
      masterInput.addEventListener('change', onInput);
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        masterMuted = !masterMuted;
        persistMaster();
        applyMasterGain();
        muteBtn.classList.toggle('active', masterMuted);
        muteBtn.textContent = masterMuted ? 'Muted' : 'Mute';
        syncSoundUi();
      });
    }

    LAYER_DEFS.forEach(function (def) {
      const input = document.getElementById('layer-' + def.id);
      if (!input) return;
      const onInput = function () {
        layerLevels[def.id] = clamp01((parseFloat(input.value) || 0) / 100, def.default);
        currentPreset = 'custom';
        applyAllLayerGains();
        persistMixer();
        applyStoredMixer();
        if (!isAudioPlaying && !hasUserSetPreference) setAmbientSound(true, false);
      };
      input.addEventListener('input', onInput);
      input.addEventListener('change', onInput);
    });

    document.querySelectorAll('.preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const name = btn.getAttribute('data-preset');
        applyPreset(name);
        if (!isAudioPlaying) setAmbientSound(true, false);
      });
    });

    applyStoredMixer();
    syncSoundUi();

    const storedOn = readStoredSoundOn();
    const shouldAutoplay = storedOn && !masterMuted && masterVolume > 0;

    if (!shouldAutoplay) {
      isAudioPlaying = false;
      syncSoundUi();
    } else {
      // Browsers block Web Audio until a gesture, so we arm one-shot listeners
      // that unlock on the first interaction. We never construct the
      // AudioContext up-front — that would waste resources and log autoplay warnings.
      const unlockEvents = ['pointerdown', 'keydown', 'touchstart'];
      let armed = true;

      const removeUnlockListeners = function () {
        unlockEvents.forEach(function (evt) {
          window.removeEventListener(evt, onFirstInteract, true);
        });
      };

      const onFirstInteract = function () {
        if (!armed) return;
        armed = false;
        removeUnlockListeners();
        if (hasUserSetPreference) return;
        if (!startEngine()) {
          setTimeout(function () {
            if (!isAudioPlaying && !hasUserSetPreference) startEngine();
          }, 250);
        }
      };

      unlockEvents.forEach(function (evt) {
        window.addEventListener(evt, onFirstInteract, { capture: true, passive: true });
      });
    }

    // Pause when the tab is hidden to avoid draining CPU/battery, then resume.
    let pausedForVisibility = false;
    document.addEventListener('visibilitychange', function () {
      if (!audioCtx) return;
      if (document.hidden) {
        if (isAudioPlaying) {
          pausedForVisibility = true;
          audioCtx.suspend();
        }
      } else if (pausedForVisibility) {
        pausedForVisibility = false;
        audioCtx.resume();
      }
    });

    // Keep mute button label in sync on load.
    if (muteBtn) {
      muteBtn.classList.toggle('active', masterMuted);
      muteBtn.textContent = masterMuted ? 'Muted' : 'Mute';
    }
  }

  // ── 4. Settings Modal ─────────────────────────────────────────────
  function initSettingsModal() {
    const openBtn = document.getElementById('open-settings-btn');
    const closeBtn = document.getElementById('close-settings-btn');
    const modal = document.getElementById('settings-modal');
    const modalPetalsToggle = document.getElementById('modal-petals-toggle');
    const themeButtons = document.querySelectorAll('.theme-btn');

    if (!modal) return;

    function openModal() {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // Theme preset switcher
    themeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        document.body.className = '';
        if (filter !== 'sunset') {
          document.body.classList.add('filter-' + filter);
        }
      });
    });

    // Audio toggle is wired in initAmbientSound (shared with the floating button and footer button).

    // Petals toggle in modal
    if (modalPetalsToggle) {
      modalPetalsToggle.addEventListener('click', function () {
        petalsEnabled = !petalsEnabled;
        if (petalsEnabled) {
          modalPetalsToggle.classList.add('active');
          modalPetalsToggle.textContent = 'Enabled';
        } else {
          modalPetalsToggle.classList.remove('active');
          modalPetalsToggle.textContent = 'Disabled';
        }
      });
    }
  }

  // ── 5. Polaroid Lightbox Modal ────────────────────────────────────
  function initLightbox() {
    const cards = document.querySelectorAll('.polaroid-card');
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDesc = document.getElementById('lightbox-desc');
    const closeBtn = document.getElementById('lightbox-close-btn');

    if (!lightbox || !lightboxImg) return;

    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        const img = card.querySelector('img');
        if (!img) return;
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxTitle.textContent = card.getAttribute('data-title') || 'Gitakure Scenery';
        lightboxDesc.textContent = card.getAttribute('data-desc') || '';
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // ── 6. Scroll Cue & Smooth Navigation ─────────────────────────────
  function initScrollBehavior() {
    const cue = document.getElementById('scroll-cue');
    if (cue) {
      cue.addEventListener('click', function () {
        const about = document.getElementById('about');
        if (about) {
          about.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Update active nav link on scroll
    const navItems = document.querySelectorAll('.nav-item');
    window.addEventListener('scroll', function () {
      const scrollPos = window.scrollY + 200;
      const about = document.getElementById('about');
      if (!about) return;

      if (scrollPos >= about.offsetTop) {
        navItems.forEach(item => item.classList.remove('active'));
        const aboutLink = document.querySelector('a.nav-item[href="#about"]');
        if (aboutLink) aboutLink.classList.add('active');
      } else {
        navItems.forEach(item => item.classList.remove('active'));
        const homeLink = document.querySelector('a.nav-item[href="#home"]');
        if (homeLink) homeLink.classList.add('active');
      }
    });
  }

  // ── 7. GSAP Entrance Animations ───────────────────────────────────
  function initEntrance() {
    if (!window.gsap) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const tl = window.gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.navbar', { opacity: 0, y: -20, duration: 0.8 })
      .from('.hero-title-container', { opacity: 0, y: 30, duration: 0.9 }, '-=0.4')
      .from('.hero-tagline', { opacity: 0, y: 20, duration: 0.7 }, '-=0.6')
      .from('.hero-description', { opacity: 0, y: 16, duration: 0.7 }, '-=0.5')
      .from('.hero-button-group a', { opacity: 0, y: 14, stagger: 0.15, duration: 0.6 }, '-=0.4')
      .from('.hero-scroll-cue', { opacity: 0, y: 10, duration: 0.6 }, '-=0.3')
      .from('.polaroid-card', { opacity: 0, scale: 0.9, stagger: 0.12, duration: 0.8 }, '-=0.3');
  }

  // ── DOM Initialization ───────────────────────────────────────────
  function init() {
    initIcons();
    initPetalsCanvas();
    initAmbientSound();
    initSettingsModal();
    initLightbox();
    initScrollBehavior();
    initEntrance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
