/* Gitakure — the valley, drawn in pixels.
   A dawn scene: a waterfall feeding a pond, conifers on the ridge, reeds on the
   bank, mist drifting, and fireflies. Rendered at a low internal resolution and
   scaled up with nearest-neighbour so every block stays crisp. */

(function () {
  'use strict';

  var canvas = document.getElementById('valley');
  if (!canvas) return;

  var ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Internal (pixel) resolution. */
  var PW = 320;
  var PH = 180;

  canvas.width = PW;
  canvas.height = PH;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.imageRendering = 'pixelated';

  ctx.imageSmoothingEnabled = false;

  /* Palette */
  var C = {
    sky0: '#1a2740',
    sky1: '#2a3f5f',
    sky2: '#4a6b7a',
    sun: '#f2b36b',
    mist: 'rgba(180,200,220,0.35)',

    ridgeFar: '#24334a',
    ridgeMid: '#1d2a3e',
    ridgeNear: '#16202e',

    treeDark: '#0f1a14',
    treeMid: '#1c2f22',
    treeLight: '#2a4a32',

    water: '#1f4a6b',
    waterLight: '#4aa3df',
    waterDeep: '#0f2a3f',
    pond: '#1a3a55',

    bank: '#2a3322',
    bankLight: '#3a4a2e',
    reed: '#4a6b3a',

    fall: '#9fd6ff',
    fallMist: '#cfe8ff',

    firefly: '#ffe9a8'
  };

  var t = 0;
  var last = 0;
  var raf = 0;
  var running = false;
  var onScreen = true;

  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /* Seeded rng */
  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t2 = seed;
      t2 = Math.imul(t2 ^ (t2 >>> 15), t2 | 1);
      t2 ^= t2 + Math.imul(t2 ^ (t2 >>> 7), t2 | 61);
      return ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Precomputed trees */
  var trees = [];
  (function () {
    var r = rng(7717);
    for (var i = 0; i < 18; i++) {
      trees.push({
        x: 20 + r() * (PW - 40),
        y: 96 + r() * 12,
        h: 14 + Math.floor(r() * 14),
        w: 6 + Math.floor(r() * 6),
        shade: r() < 0.5 ? C.treeMid : C.treeLight
      });
    }
    trees.sort(function (a, b) { return a.y - b.y; });
  })();

  var reeds = [];
  (function () {
    var r = rng(6121);
    for (var i = 0; i < 26; i++) {
      reeds.push({
        x: 10 + r() * (PW - 20),
        h: 6 + Math.floor(r() * 10),
        phase: r() * Math.PI * 2,
        speed: 0.6 + r() * 0.8
      });
    }
  })();

  var flies = [];
  (function () {
    var r = rng(8819);
    for (var i = 0; i < 14; i++) {
      flies.push({
        x: r() * PW,
        y: 40 + r() * 80,
        phase: r() * Math.PI * 2,
        speed: 0.4 + r() * 0.6,
        amp: 6 + r() * 10
      });
    }
  })();

  /* Waterfall location */
  var FX = 62;
  var FTOP = 38;
  var FBOT = 108;

  function drawSky() {
    /* gradient bands */
    for (var y = 0; y < 70; y++) {
      var c = y < 24 ? C.sky0 : y < 46 ? C.sky1 : C.sky2;
      px(0, y, PW, 1, c);
    }
    /* sun */
    px(PW - 46, 18, 8, 8, C.sun);
    px(PW - 44, 16, 4, 2, C.sun);
    px(PW - 48, 20, 2, 4, C.sun);
  }

  function drawRidges() {
    /* far ridge */
    for (var x = 0; x < PW; x++) {
      var y = 78 + Math.sin(x * 0.05) * 6 + Math.sin(x * 0.13) * 3;
      px(x, y, 1, PH - y, C.ridgeFar);
    }
    /* mid ridge */
    for (var x = 0; x < PW; x++) {
      var y = 92 + Math.sin(x * 0.07 + 1.2) * 5 + Math.sin(x * 0.19) * 2;
      px(x, y, 1, PH - y, C.ridgeMid);
    }
    /* near bank baseline */
    for (var x = 0; x < PW; x++) {
      var y = 128 + Math.sin(x * 0.04) * 4;
      px(x, y, 1, PH - y, C.ridgeNear);
    }
  }

  function drawWaterfall() {
    /* ribbon */
    for (var y = FTOP; y <= FBOT; y++) {
      var w = 4 + Math.sin((y - FTOP) * 0.3) * 1;
      px(FX - Math.floor(w / 2), y, w, 1, C.fall);
    }
    /* streaks */
    if (!reduce.matches) {
      for (var i = 0; i < 6; i++) {
        var sy = FTOP + ((i * 17 + Math.floor(t * 60)) % (FBOT - FTOP));
        px(FX - 1 + (i % 3) - 1, sy, 1, 3, '#ffffff');
      }
    }
    /* mist at bottom */
    px(FX - 8, FBOT - 2, 16, 6, C.fallMist);
    px(FX - 12, FBOT, 24, 4, 'rgba(207,232,255,0.6)');
  }

  function drawPond() {
    /* pond area lower right */
    var px0 = 150, py0 = 118, pw = 150, ph = 46;
    for (var y = 0; y < ph; y++) {
      for (var x = 0; x < pw; x++) {
        var d = Math.sqrt(Math.pow((x - pw / 2) / (pw / 2), 2) + Math.pow((y - ph / 2) / (ph / 2), 2));
        if (d <= 1) {
          var col = y < ph * 0.4 ? C.waterLight : C.pond;
          px(px0 + x, py0 + y, 1, 1, col);
        }
      }
    }
    /* shimmer */
    if (!reduce.matches) {
      for (var i = 0; i < 8; i++) {
        var sx = px0 + 20 + (i * 17 + Math.floor(t * 20)) % (pw - 40);
        var sy = py0 + 6 + (i * 5) % (ph - 12);
        px(sx, sy, 3, 1, '#cfe8ff');
      }
    }
    /* ripples from waterfall landing */
    if (!reduce.matches) {
      for (var r = 0; r < 3; r++) {
        var p = (t * 0.4 + r / 3) % 1;
        var rx = FX + 8;
        var ry = FBOT + 2;
        var rw = 2 + Math.floor(p * 18);
        /* draw ring as horizontal dashes */
        px(rx - rw, ry, rw * 2, 1, 'rgba(207,232,255,' + (0.5 * (1 - p)).toFixed(2) + ')');
      }
    }
  }

  function drawTrees() {
    for (var i = 0; i < trees.length; i++) {
      var tr = trees[i];
      /* trunk */
      px(tr.x - 1, tr.y - tr.h, 3, tr.h, C.treeDark);
      /* canopy as stacked blocks */
      for (var k = 0; k < 3; k++) {
        var cw = tr.w - k * 2;
        var cy = tr.y - tr.h - k * 3;
        px(tr.x - Math.floor(cw / 2), cy, cw, 3, tr.shade);
      }
      /* sway hint */
      if (!reduce.matches) {
        var sway = Math.sin(t * 0.8 + tr.x * 0.3) * 0.5;
        if (sway > 0.2) px(tr.x + Math.floor(tr.w / 2), tr.y - tr.h - 1, 1, 1, C.treeLight);
      }
    }
  }

  function drawBank() {
    /* ground strip */
    for (var x = 0; x < PW; x++) {
      px(x, 132, 1, 4, C.bank);
    }
    for (var x = 0; x < PW; x++) {
      if (x % 7 === 0) px(x, 130, 2, 2, C.bankLight);
    }
  }

  function drawReeds() {
    for (var i = 0; i < reeds.length; i++) {
      var r = reeds[i];
      var sway = reduce.matches ? 0 : Math.sin(t * r.speed + r.phase) * 2;
      for (var b = 0; b < 3; b++) {
        var x = r.x + b * 2 - 2;
        var h = r.h - b;
        px(x, 132 - h, 1, h, C.reed);
        if (!reduce.matches) px(x + Math.round(sway), 132 - h - 1, 1, 1, '#6b8f4a');
      }
    }
  }

  function drawFireflies() {
    if (reduce.matches) return;
    for (var i = 0; i < flies.length; i++) {
      var f = flies[i];
      var x = f.x + Math.sin(t * f.speed + f.phase) * f.amp;
      var y = f.y + Math.cos(t * f.speed * 0.7 + f.phase) * (f.amp * 0.5);
      var blink = 0.4 + Math.sin(t * 3 + f.phase) * 0.6;
      if (blink < 0.2) continue;
      px(Math.round(x), Math.round(y), 2, 2, C.firefly);
      /* glow */
      px(Math.round(x) - 1, Math.round(y) - 1, 4, 4, 'rgba(255,233,168,0.15)');
    }
  }


  function drawCampfire() {
    var cx = 45;
    var cy = 150;
    /* logs */
    px(cx - 6, cy, 12, 2, '#4a3526');
    px(cx - 4, cy - 2, 8, 2, '#5a4030');
    /* flame */
    if (!reduce.matches) {
      var f = Math.sin(t * 8) * 1.5;
      px(cx - 2, cy - 6 - Math.round(f), 4, 6 + Math.round(f), '#f2b36b');
      px(cx - 1, cy - 9 - Math.round(f), 2, 4, '#ffe9a8');
      /* smoke */
      var sy = cy - 12 - ((t * 12) % 14);
      px(cx + 1, Math.round(sy), 1, 2, 'rgba(180,200,220,0.35)');
    } else {
      px(cx - 2, cy - 6, 4, 6, '#f2b36b');
    }
    /* glow */
    px(cx - 8, cy - 4, 16, 8, 'rgba(242,179,107,0.12)');
  }

  function drawMist() {
    /* horizontal mist bands */
    for (var b = 0; b < 2; b++) {
      var y = 70 + b * 18;
      var drift = reduce.matches ? 0 : (t * (6 + b * 4)) % PW;
      for (var x = 0; x < PW; x += 4) {
        var yy = y + Math.sin((x + drift) * 0.05) * 3;
        px((x + Math.floor(drift)) % PW, Math.round(yy), 4, 2, 'rgba(180,200,220,0.25)');
      }
    }
  }

  function draw() {
    drawSky();
    drawRidges();
    drawWaterfall();
    drawPond();
    drawTrees();
    drawBank();
    drawReeds();
    drawCampfire();
    drawMist();
    drawFireflies();
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    t += dt;
    draw();
  }

  function start() {
    if (running || reduce.matches || !onScreen) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function sync() {
    if (reduce.matches) {
      stop();
      t = 0;
      draw();
    } else if (onScreen) {
      start();
    } else {
      stop();
    }
  }

  /* Intersection observer */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      sync();
    }, { threshold: 0 }).observe(canvas);
  }

  if (reduce.addEventListener) reduce.addEventListener('change', sync);

  draw();
  sync();
})();
