/* Gitakure — the valley, drawn in code.
   Late afternoon in a river valley: layered ridgelines, a conifer and broadleaf
   treeline, a waterfall off the far ridge, the river catching low sun, reeds on
   the near bank, and pollen drifting up through the light.

   Everything is generated from fixed seeds, so the valley is the same on every
   visit — the same promise the game makes about a save. Canvas 2D on purpose:
   cheap enough for integrated graphics, and it stops the moment it scrolls away. */

(function () {
  'use strict';

  var canvas = document.getElementById('valley');
  if (!canvas) return;

  var ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Seeded RNG — mulberry32. Fixed seed, fixed valley. */
  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Palette: late afternoon. Green-dominant, warm gold light, cool water. */
  var C = {
    skyHigh: '#5c8f8a',
    skyMid: '#9dc0a8',
    skyLow: '#e6cf95',
    sun: '#f2c86a',
    haze: '#c8d4b0',

    ridgeFar: '#7d9b7a',
    ridgeMid: '#4f7355',
    ridgeNear: '#33523a',

    treeFar: '#3f6349',
    treeNear: '#22392a',

    water: '#3f7a72',
    waterLit: '#cfe0c4',
    waterDeep: '#28564f',

    bank: '#2b4432',
    bankLit: '#3d5c3f',
    reed: '#1b2c20',

    fall: '#e8f2ea',
    fallMist: 'rgba(226, 238, 226,',

    pollen: '#f6dfa0'
  };

  var W = 0;
  var H = 0;
  var dpr = 1;

  /* Scroll drives the walk north: 0 at the top of the page, 1 once the hero is
     behind you. Feeds the parallax so the valley feels deep, not painted on. */
  var walk = 0;
  var targetWalk = 0;
  var pointerX = 0;
  var targetPointerX = 0;

  var t = 0;
  var raf = 0;
  var running = false;
  var onScreen = true;
  var last = 0;

  /* ── generated geometry (fractions of canvas height) ─────── */

  function ridge(seed, roughness, baseY, amplitude) {
    var rand = rng(seed);
    var pts = [];
    var steps = 28;
    var y = baseY;
    var amp = amplitude / 1000;
    for (var i = 0; i <= steps; i++) {
      y += (rand() - 0.5) * amp;
      y = y * 0.74 + baseY * 0.26;
      pts.push({ x: i / steps, y: y + (rand() - 0.5) * amp * roughness });
    }
    return pts;
  }

  /* kind: 0 = conifer, 1 = broadleaf. Mixing them keeps the treeline from
     reading as a row of identical triangles. */
  function treeline(seed, count, baseY, minH, maxH) {
    var rand = rng(seed);
    var trees = [];
    for (var i = 0; i < count; i++) {
      var h = (minH + rand() * (maxH - minH)) / 1000;
      trees.push({
        x: (i + rand() * 0.8) / count,
        h: h,
        w: h * (0.3 + rand() * 0.16),
        y: baseY + (rand() - 0.5) * 0.008,
        kind: rand() < 0.68 ? 0 : 1,
        lean: (rand() - 0.5) * 0.1
      });
    }
    return trees.sort(function (a, b) { return a.y - b.y; });
  }

  function reeds(seed, count) {
    var rand = rng(seed);
    var out = [];
    for (var i = 0; i < count; i++) {
      out.push({
        x: rand(),
        h: (26 + rand() * 66) / 900,
        lean: (rand() - 0.5) * 0.02,
        phase: rand() * Math.PI * 2,
        speed: 0.5 + rand() * 0.5,
        blades: 2 + Math.floor(rand() * 3)
      });
    }
    return out;
  }

  /* Pollen motes: they drift up and sideways, catching the low sun. */
  function pollenField(seed, count) {
    var rand = rng(seed);
    var out = [];
    for (var i = 0; i < count; i++) {
      out.push({
        x: rand(),
        y: rand(),
        r: 0.7 + rand() * 1.7,
        phase: rand() * Math.PI * 2,
        rise: 0.006 + rand() * 0.014,
        sway: 0.4 + rand() * 0.9,
        glow: 0.25 + rand() * 0.55
      });
    }
    return out;
  }

  var FAR = ridge(1201, 1.0, 0.395, 26);
  var MID = ridge(4507, 0.85, 0.492, 20);
  var NEAR = ridge(9013, 0.6, 0.608, 12);
  var TREES_FAR = treeline(3301, 40, 0.542, 14, 30);
  var TREES_NEAR = treeline(7717, 17, 0.598, 26, 54);
  var REEDS = reeds(6121, 52);
  var MOTES = pollenField(8819, 46);

  /* The waterfall drops off the far ridge into the river. */
  var FALL = { x: 0.655, top: 0.40, bottom: 0.664, w: 0.016 };

  /* ── sizing ─────────────────────────────────────────────── */

  /* Gradients are expensive to construct and most of them never change, so they
     are built once per resize rather than every frame. Rebuilding eleven of them
     at 60fps was the single largest cost in this scene. */
  var G = {};

  function buildGradients() {
    var sky = ctx.createLinearGradient(0, 0, 0, H * 0.76);
    sky.addColorStop(0, C.skyHigh);
    sky.addColorStop(0.4, C.skyMid);
    sky.addColorStop(0.78, C.skyLow);
    sky.addColorStop(1, '#f0dca8');
    G.sky = sky;

    var water = ctx.createLinearGradient(0, H * 0.655, 0, H * 0.92);
    water.addColorStop(0, C.waterLit);
    water.addColorStop(0.18, C.water);
    water.addColorStop(1, C.waterDeep);
    G.water = water;

    var left = ctx.createLinearGradient(0, 0, W * 0.74, 0);
    left.addColorStop(0, 'rgba(18, 32, 24, 0.90)');
    left.addColorStop(0.32, 'rgba(18, 32, 24, 0.70)');
    left.addColorStop(0.60, 'rgba(18, 32, 24, 0.18)');
    left.addColorStop(1, 'rgba(18, 32, 24, 0)');
    G.scrimLeft = left;

    var low = ctx.createLinearGradient(0, H * 0.58, 0, H);
    low.addColorStop(0, 'rgba(18, 32, 24, 0)');
    low.addColorStop(1, 'rgba(18, 32, 24, 0.86)');
    G.scrimLow = low;

    /* The mote sprite: one small radial gradient, reused for every particle. */
    var mote = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
    mote.addColorStop(0, 'rgba(248, 224, 158, 0.9)');
    mote.addColorStop(1, 'rgba(248, 224, 158, 0)');
    G.mote = mote;

    buildShafts();
    buildMist();
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    buildGradients();
    draw();
  }

  /* ── static layer cache ─────────────────────────────────── */

  /* Most of the scene never changes: sky, ridgelines, treelines, the river base,
     the near bank. Repainting thousands of paths every frame for a scene that is
     90% still is the obvious waste, so the still part is rendered once into an
     offscreen canvas and blitted each frame. Only the waterfall, water shimmer,
     mist, reeds, motes and shafts are drawn live on top. */
  var plate = document.createElement('canvas');
  var plateCtx = plate.getContext('2d');
  var plateW = 0;
  var plateH = 0;
  var plateWalk = -1;

  /* The parallax layers shift with `walk`, so the plate is only valid while walk
     is unchanged. Quantise it so slow scrolling still reuses the cache. */
  var WALK_STEP = 0.004;

  function renderPlate() {
    plate.width = canvas.width;
    plate.height = canvas.height;
    plateW = W;
    plateH = H;
    plateCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    plateCtx.lineCap = 'round';

    /* Swap the drawing target to the plate for the duration. */
    var live = ctx;
    ctx = plateCtx;
    drawSky();
    fillRidge(FAR, C.ridgeFar, walk * 14);
    fillRidge(MID, C.ridgeMid, walk * 30);
    drawTreeline(TREES_FAR, walk * 46, C.treeFar, 0.6);
    fillRidge(NEAR, C.ridgeNear, walk * 62);
    /* Waterfall body is static apart from its streaks. */
    drawWaterfallBody();
    drawWaterBase();
    drawBank();
    ctx = live;
  }

  /* ── painting ───────────────────────────────────────────── */

  /* Points carry y as a fraction of canvas height; scale once, here. */
  function fillRidge(pts, colour, shift) {
    ctx.beginPath();
    ctx.moveTo(-40, H);
    for (var i = 0; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * (W + 80) - 40 - shift, pts[i].y * H);
    }
    ctx.lineTo(W + 40, H);
    ctx.closePath();
    ctx.fillStyle = colour;
    ctx.fill();
  }

  function drawSky() {
    ctx.fillStyle = G.sky;
    ctx.fillRect(0, 0, W, H);

    /* A low, warm sun with a soft bloom — the source of every warm edge.
       Position tracks the pointer, so the gradient is rebuilt only while the
       pointer is actually moving. */
    var sunX = W * 0.76 - pointerX * 6;
    var sunY = H * 0.34;
    var bloom = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, Math.max(W, H) * 0.5);
    bloom.addColorStop(0, 'rgba(248, 220, 140, 0.55)');
    bloom.addColorStop(0.14, 'rgba(240, 200, 110, 0.26)');
    bloom.addColorStop(0.42, 'rgba(226, 180, 100, 0.08)');
    bloom.addColorStop(1, 'rgba(226, 180, 100, 0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);
  }

  /* Soft shafts raking down through the treeline. Each shaft's gradient is built
     once in a canonical local space, then positioned with a transform and faded
     with globalAlpha — that avoids four gradient allocations every frame. */
  var SHAFTS = [];

  function buildShafts() {
    SHAFTS.length = 0;
    for (var i = 0; i < 4; i++) {
      var spread = W * (0.03 + i * 0.008);
      var g = ctx.createLinearGradient(0, 0, 0, H * 0.56);
      g.addColorStop(0, 'rgba(250, 226, 158, 1)');
      g.addColorStop(1, 'rgba(250, 226, 158, 0)');
      SHAFTS.push({ spread: spread, grad: g, phase: i * 1.3, depth: 4 + i * 2 });
    }
  }

  function drawShafts() {
    if (reduce.matches) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < SHAFTS.length; i++) {
      var s = SHAFTS[i];
      var sway = Math.sin(t * 0.16 + s.phase) * 0.012;
      var x = W * (0.58 + i * 0.085 + sway) - pointerX * s.depth;
      var pulse = 0.05 + Math.sin(t * 0.4 + s.phase) * 0.018;

      ctx.save();
      ctx.globalAlpha = Math.max(0, pulse);
      ctx.translate(x, H * 0.20);
      ctx.fillStyle = s.grad;
      ctx.beginPath();
      ctx.moveTo(-s.spread * 0.24, 0);
      ctx.lineTo(s.spread * 0.24, 0);
      ctx.lineTo(-s.spread * 1.3, H * 0.56);
      ctx.lineTo(-s.spread * 2.1, H * 0.56);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  /* Two cached mist bands, positioned by transform. */
  var MIST = [];

  function buildMist() {
    MIST.length = 0;
    for (var b = 0; b < 2; b++) {
      var g = ctx.createLinearGradient(0, -26, 0, 26);
      g.addColorStop(0, 'rgba(200, 212, 176, 0)');
      g.addColorStop(0.5, 'rgba(200, 212, 176, ' + (0.16 - b * 0.05).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(200, 212, 176, 0)');
      MIST.push({ grad: g, y: H * (0.505 + b * 0.052), speed: 4 + b * 3, depth: 2 + b });
    }
  }

  function drawMist() {
    for (var b = 0; b < MIST.length; b++) {
      var m = MIST[b];
      var drift = ((t * m.speed) % (W + 300)) - 150;
      ctx.save();
      ctx.translate(drift * 0.05 - pointerX * m.depth, m.y);
      ctx.fillStyle = m.grad;
      ctx.fillRect(-160, -26, W + 320, 52);
      ctx.restore();
    }
  }

  /* The waterfall: a pale ribbon with falling streaks and a mist bloom where
     it meets the river. This is the signature moment of the scene. */
  function fallX() {
    return FALL.x * (W + 80) - 40 - walk * 30 - pointerX * 8;
  }

  /* The ribbon itself: static, so it belongs on the plate. */
  function drawWaterfallBody() {
    var x = fallX();
    var top = FALL.top * H;
    var bottom = FALL.bottom * H;
    var w = Math.max(5, FALL.w * W);
    if (x < -60 || x > W + 60) return;

    var body = ctx.createLinearGradient(x - w, 0, x + w, 0);
    body.addColorStop(0, 'rgba(232, 242, 234, 0)');
    body.addColorStop(0.5, 'rgba(240, 248, 242, 0.72)');
    body.addColorStop(1, 'rgba(232, 242, 234, 0)');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.55, top);
    ctx.lineTo(x + w * 0.55, top);
    ctx.lineTo(x + w * 1.15, bottom);
    ctx.lineTo(x - w * 1.15, bottom);
    ctx.closePath();
    ctx.fill();
  }

  /* Only the moving parts: falling streaks and the landing mist. */
  function drawWaterfallStreaks() {
    var x = fallX();
    var top = FALL.top * H;
    var bottom = FALL.bottom * H;
    var w = Math.max(5, FALL.w * W);
    if (x < -60 || x > W + 60) return;

    if (!reduce.matches) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - w * 1.4, top, w * 2.8, bottom - top);
      ctx.clip();
      var rand = rng(3313);
      for (var i = 0; i < 16; i++) {
        var lane = (rand() - 0.5) * 1.7;
        var speed = 130 + rand() * 190;
        var len = 10 + rand() * 26;
        var y = top + ((rand() * (bottom - top)) + t * speed) % (bottom - top);
        var fade = 0.22 + rand() * 0.4;
        ctx.fillStyle = 'rgba(255, 255, 252, ' + fade.toFixed(3) + ')';
        ctx.fillRect(x + lane * w - 0.7, y, 1.5, len);
      }
      ctx.restore();
    }

    /* Mist where it lands. */
    var puff = reduce.matches ? 0.3 : 0.3 + Math.sin(t * 1.6) * 0.06;
    var mg = ctx.createRadialGradient(x, bottom, 0, x, bottom, w * 5.5);
    mg.addColorStop(0, C.fallMist + puff.toFixed(3) + ')');
    mg.addColorStop(1, C.fallMist + '0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.ellipse(x, bottom, w * 5.5, w * 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function waterTop() {
    return H * 0.655;
  }
  function waterBottom() {
    return H * 0.92;
  }

  /* Still water body — plate. */
  function drawWaterBase() {
    var top = waterTop();
    var bottom = waterBottom();
    ctx.fillStyle = G.water;
    ctx.fillRect(0, top, W, bottom - top);
  }

  /* Moving light on the surface — live. */
  function drawWaterShimmer() {
    var top = waterTop();
    var bottom = waterBottom();
    if (bottom <= top) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, W, bottom - top);
    ctx.clip();

    var rand = rng(551);
    for (var i = 0; i < 110; i++) {
      var ry = top + rand() * (bottom - top);
      var depth = (ry - top) / (bottom - top);
      var len = 5 + rand() * 24 * (0.4 + depth);
      var speed = 5 + depth * 15;
      var x = (rand() * W + t * speed) % (W + 60) - 30;
      var fade = (0.07 + rand() * 0.22) * (1 - depth * 0.5);
      ctx.fillStyle = 'rgba(232, 244, 236, ' + fade.toFixed(3) + ')';
      ctx.fillRect(x, ry, len, 1);
    }

    /* Expanding rings from the waterfall's landing point. */
    if (!reduce.matches) {
      var fx = fallX();
      for (var r = 0; r < 3; r++) {
        var p = ((t * 0.34) + r / 3) % 1;
        var ry2 = top + p * (bottom - top) * 0.55;
        var rw = 6 + p * 62;
        ctx.strokeStyle = 'rgba(236, 246, 238, ' + ((1 - p) * 0.3).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(fx, ry2, rw, rw * 0.26, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* Near bank — plate. */
  function drawBank() {
    ctx.fillStyle = C.bank;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, H * 0.932);
    ctx.quadraticCurveTo(W * 0.42, H * 0.878, W, H * 0.948);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    /* A lit lip along the bank edge. */
    ctx.strokeStyle = C.bankLit;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.932);
    ctx.quadraticCurveTo(W * 0.42, H * 0.878, W, H * 0.948);
    ctx.stroke();
  }

  /* Trees are drawn with explicit coordinates rather than save/translate/rotate.
     Two transforms per tree across ~57 trees per frame was measurable, and the
     sway is small enough that an offset apex reads the same. */
  function drawConifer(x, baseY, h, w, colour, sway) {
    var lean = sway * h;
    ctx.fillStyle = colour;
    /* trunk */
    ctx.fillRect(x - w * 0.06, baseY - h * 0.16, w * 0.12, h * 0.18);
    /* three stacked skirts */
    for (var tier = 0; tier < 3; tier++) {
      var ty = baseY - h * (0.14 + tier * 0.27);
      var tw = w * (1 - tier * 0.24);
      var th = h * 0.44;
      ctx.beginPath();
      ctx.moveTo(x + lean, ty - th);
      ctx.lineTo(x - tw / 2, ty);
      ctx.lineTo(x + tw / 2, ty);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawBroadleaf(x, baseY, h, w, colour, sway) {
    var lean = sway * h;
    ctx.fillStyle = colour;
    ctx.fillRect(x - w * 0.07, baseY - h * 0.52, w * 0.14, h * 0.54);
    /* three overlapping lobes read as a soft canopy */
    var lobes = [[0, -0.66, 0.62], [-0.28, -0.52, 0.46], [0.29, -0.55, 0.44]];
    for (var i = 0; i < lobes.length; i++) {
      var lx = x + lobes[i][0] * w + lean;
      var ly = baseY + lobes[i][1] * h;
      var lr = lobes[i][2] * w;
      ctx.beginPath();
      ctx.ellipse(lx, ly, lr, lr * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTreeline(trees, shift, colour, swayScale) {
    for (var i = 0; i < trees.length; i++) {
      var tr = trees[i];
      var x = tr.x * (W + 120) - 60 - shift;
      if (x < -70 || x > W + 70) continue;
      var sway = reduce.matches ? 0 : Math.sin(t * 0.8 + tr.x * 9) * 0.012 * swayScale;
      sway += tr.lean * 0.1;
      if (tr.kind === 0) {
        drawConifer(x, tr.y * H, tr.h * H, tr.w * H, colour, sway);
      } else {
        drawBroadleaf(x, tr.y * H, tr.h * H, tr.w * H, colour, sway);
      }
    }
  }

  /* Pollen motes drifting up through the light. */
  function drawMotes() {
    if (reduce.matches) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = G.mote;

    for (var i = 0; i < MOTES.length; i++) {
      var m = MOTES[i];
      var y = m.y - ((t * m.rise) % 1.1);
      if (y < -0.05) y += 1.1;
      var x = m.x + Math.sin(t * m.sway + m.phase) * 0.016;
      var px = x * W - pointerX * 10;
      var py = y * H;
      var flicker = m.glow * (0.6 + Math.sin(t * 2.2 + m.phase) * 0.4);
      if (flicker <= 0.01) continue;

      ctx.globalAlpha = flicker;
      ctx.beginPath();
      ctx.arc(px, py, m.r * 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawReeds() {
    var baseY = H * 1.03;
    ctx.strokeStyle = C.reed;
    for (var i = 0; i < REEDS.length; i++) {
      var r = REEDS[i];
      var x = r.x * (W + 40) - 20 - walk * 100 - pointerX * 14;
      if (x < -30 || x > W + 30) continue;
      var sway = reduce.matches ? 0 : Math.sin(t * r.speed + r.phase) * 3.4;
      for (var b = 0; b < r.blades; b++) {
        var off = (b - (r.blades - 1) / 2) * 3.4;
        var hh = r.h * H * (0.82 + b * 0.09);
        ctx.lineWidth = 1.7 - b * 0.2;
        ctx.beginPath();
        ctx.moveTo(x + off, baseY);
        ctx.quadraticCurveTo(
          x + off + r.lean * W * 0.4 + sway * 0.5,
          baseY - hh * 0.6,
          x + off + r.lean * W + sway,
          baseY - hh
        );
        ctx.stroke();
      }
    }
  }

  function drawScrims() {
    /* Keeps the headline legible without flattening the whole scene. */
    ctx.fillStyle = G.scrimLeft;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = G.scrimLow;
    ctx.fillRect(0, H * 0.58, W, H * 0.42);
  }

  function draw() {
    if (!W || !H) return;

    /* Rebuild the still plate only when its size changes or the parallax has
       moved far enough to matter. */
    var bucket = Math.round(walk / WALK_STEP);
    if (plateW !== W || plateH !== H || bucket !== plateWalk) {
      plateWalk = bucket;
      renderPlate();
    }

    /* Blit the still world in one operation. */
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(plate, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* Everything below is actually moving. */
    drawShafts();
    drawMist();
    drawWaterfallStreaks();
    drawWaterShimmer();
    drawTreeline(TREES_NEAR, walk * 88, C.treeNear, 1);
    drawReeds();
    drawMotes();
    drawScrims();
  }

  /* ── loop ───────────────────────────────────────────────── */

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);

    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    t += dt;

    walk += (targetWalk - walk) * Math.min(1, dt * 5);
    pointerX += (targetPointerX - pointerX) * Math.min(1, dt * 3);

    draw();
  }

  function start() {
    if (running || reduce.matches || !onScreen) return;
    if (!raf) last = 0;
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
      walk = targetWalk;
      draw();
    } else if (onScreen) {
      start();
    } else {
      stop();
    }
  }

  /* ── wiring ─────────────────────────────────────────────── */

  function onScroll() {
    var rect = canvas.getBoundingClientRect();
    var span = Math.max(1, rect.height);
    targetWalk = Math.max(0, Math.min(1, -rect.top / span));
    if (reduce.matches) {
      walk = targetWalk;
      draw();
    }
  }

  function onPointer(e) {
    if (reduce.matches) return;
    targetPointerX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
  }

  function onLeave() {
    targetPointerX = 0;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerleave', onLeave);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      function (entries) {
        onScreen = entries[0].isIntersecting;
        sync();
      },
      { threshold: 0 }
    ).observe(canvas);
  }

  if (reduce.addEventListener) reduce.addEventListener('change', sync);

  resize();
  onScroll();
  sync();
})();