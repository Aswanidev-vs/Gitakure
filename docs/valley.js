/* Gitakure — landing: the valley scenes.
   Two canvases. The hero runs a fixed-timestep loop; the vignette is drawn once.
   Sprites come from the real atlases in ../sprites/. Frame rects are measured, not guessed:
   the boards are irregular concept sheets, so every rect below was read off the atlas JSON. */

(function () {
  'use strict';

  var SPRITES = '../sprites/';

  // Atlas rects, measured from each board's JSON.
  var RECT = {
    treeA: { sheet: 'trees_and_vegetation', x: 113, y: 0, w: 116, h: 119 },
    treeB: { sheet: 'trees_and_vegetation', x: 0, y: 0, w: 111, h: 124 },
    treeC: { sheet: 'trees_and_vegetation', x: 876, y: 0, w: 106, h: 108 },
    rockA: { sheet: 'rpg_terrain', x: 1093, y: 235, w: 63, h: 69 },
    rockB: { sheet: 'rpg_terrain', x: 385, y: 308, w: 68, h: 63 },
    water: { sheet: 'water_environmental', x: 0, y: 109, w: 236, h: 73 }
  };

  // One villager, walking. Cell size is derived from the loaded sheet because the boards
  // disagree: haru is 23x27, aiko 24x28, hina 23x28. Trusting the JSON would clip a column.
  var WALKER = { sheet: 'npc', name: 'haru', row: 2, frames: [4, 5, 6, 7], fps: 8 };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var C = {
    skyTop: '#16242e',
    skyMid: '#22394a',
    skyLow: '#6d5c42',
    glow: '#a87c4a',
    ridge: '#1a2a33',
    ridgeNear: '#20323a',
    water: '#1d4152',
    waterLit: '#4a8ba4',
    earth: '#2e2318',
    earthLit: '#3d2f20',
    grass: '#3f5a17',
    wash: 'rgba(18, 26, 31, 0.3)',
    fly: '#e8c27a'
  };

  var images = {};
  var pending = 0;

  function load(key, file) {
    pending++;
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      images[key] = img;
      pending--;
      if (pending === 0) start();
    };
    img.onerror = function () {
      pending--;
      if (pending === 0) start();
    };
    img.src = SPRITES + file;
  }

  function sheetFile(name) {
    return name + '/' + name + '_atlas.png';
  }

  function init() {
    var sheets = {};
    Object.keys(RECT).forEach(function (k) {
      sheets[RECT[k].sheet] = true;
    });
    Object.keys(sheets).forEach(function (s) {
      load(s, sheetFile(s));
    });
    load(WALKER.sheet, WALKER.sheet + '/grid/' + WALKER.name + '_sheet.png');
  }

  function start() {
    if (pending > 0) return;
    if (!images.trees_and_vegetation || !images.rpg_terrain || !images.water_environmental) {
      // Without the atlases there is nothing honest to draw; the CSS background stands in.
      return;
    }
    buildHero();
    buildVignette();
  }

  /* ── shared sprite blit ─────────────────────────────────── */

  function blit(ctx, key, dx, dy, scale) {
    var r = RECT[key];
    var img = images[r.sheet];
    if (!img) return;
    var w = r.w * scale;
    var h = r.h * scale;
    ctx.drawImage(img, r.x, r.y, r.w, r.h, Math.round(dx), Math.round(dy - h), Math.round(w), Math.round(h));
  }

  function blitSheetFrame(ctx, img, sx, sy, sw, sh, dx, dy, scale) {
    ctx.drawImage(
      img,
      sx, sy, sw, sh,
      Math.round(dx), Math.round(dy - sh * scale),
      Math.round(sw * scale), Math.round(sh * scale)
    );
  }

  /* ── hero ───────────────────────────────────────────────── */

  function buildHero() {
    var canvas = document.getElementById('valley-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    var VH = 360;
    var vw = 640;
    var vh = VH;
    var dpr = 1;
    var sky = null;
    var mistPuff = makeMistPuff();
    var walker = images[WALKER.sheet];
    var cellW = walker ? walker.naturalWidth / 12 : 23;
    var cellH = walker ? walker.naturalHeight / 4 : 27;

    var flies = [];
    for (var i = 0; i < 24; i++) {
      flies.push({
        x: Math.random(),
        y: 0.58 + Math.random() * 0.3,
        p: Math.random() * Math.PI * 2,
        s: 0.5 + Math.random() * 0.9,
        r: 0.7 + Math.random() * 1.1
      });
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var cssW = Math.max(1, Math.round(rect.width));
      var cssH = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Cap the drawing buffer, not just the ratio. A 4K screen at DPR 2 wants 33 megapixels.
      var maxPixels = 2600 * 1500;
      var scale = Math.min(dpr, Math.sqrt(maxPixels / (cssW * cssH)));
      scale = Math.max(scale, 0.75);

      canvas.width = Math.round(cssW * scale);
      canvas.height = Math.round(cssH * scale);
      vw = Math.max(360, Math.round(VH * (cssW / cssH)));
      vh = VH;

      sky = ctx.createLinearGradient(0, 0, 0, vh);
      sky.addColorStop(0, C.skyTop);
      sky.addColorStop(0.34, C.skyMid);
      sky.addColorStop(0.52, C.skyLow);
      sky.addColorStop(0.72, C.earth);
      sky.addColorStop(1, C.earth);
    }

    function drawScene(t) {
      var sx = canvas.width / vw;
      var sy = canvas.height / vh;
      ctx.setTransform(sx, 0, 0, sy, 0, 0);
      ctx.imageSmoothingEnabled = false;

      var horizon = vh * 0.38;
      var waterTop = vh * 0.41;
      var bankTop = vh * 0.66;

      // sky
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, vw, vh);

      // low sun haze on the right, where the text is not. Stepped, so it stays on the pixel grid.
      var hazeTop = horizon - vh * 0.19;
      var hazeH = vh * 0.21;
      var hazeRows = 9;
      for (var hz = 0; hz < hazeRows; hz++) {
        var hzT = hz / (hazeRows - 1);
        var hzY = hazeTop + hzT * hazeH;
        var hzW = vw * (0.16 + hzT * 0.34);
        ctx.globalAlpha = 0.05 + hzT * 0.05;
        ctx.fillStyle = C.glow;
        ctx.fillRect(Math.round(vw * 0.78 - hzW / 2), Math.round(hzY), Math.round(hzW), Math.ceil(hazeH / hazeRows) + 1);
      }
      ctx.globalAlpha = 1;

      // far ridge, stepped so it reads as pixel art
      var step = 8;
      ctx.fillStyle = C.ridge;
      for (var x = 0; x < vw; x += step) {
        var n = Math.sin(x * 0.011) * 0.5 + Math.sin(x * 0.031 + 1.7) * 0.3 + Math.sin(x * 0.07) * 0.2;
        var h = vh * 0.1 + n * vh * 0.05;
        ctx.fillRect(x, horizon - h, step, h + 2);
      }

      // far tree line, small and low contrast
      ctx.globalAlpha = 0.85;
      for (var fx = -10; fx < vw + 40; fx += 34) {
        var key = fx % 3 === 0 ? 'treeA' : fx % 3 === 1 ? 'treeC' : 'treeB';
        blit(ctx, key, fx, horizon + 4, 0.3);
      }
      ctx.globalAlpha = 1;

      // near ridge
      ctx.fillStyle = C.ridgeNear;
      for (var x2 = 0; x2 < vw; x2 += step) {
        var n2 = Math.sin(x2 * 0.017 + 2.2) * 0.5 + Math.sin(x2 * 0.045) * 0.3;
        var h2 = vh * 0.05 + n2 * vh * 0.028;
        ctx.fillRect(x2, waterTop - h2, step, h2 + 2);
      }

      // water
      ctx.fillStyle = C.water;
      ctx.fillRect(0, waterTop, vw, bankTop - waterTop);
      ctx.globalAlpha = 0.5;
      var wimg = images.water_environmental;
      if (wimg) {
        var off = (t * 0.012) % RECT.water.w;
        for (var wx = -RECT.water.w; wx < vw + RECT.water.w; wx += RECT.water.w) {
          ctx.drawImage(
            wimg,
            RECT.water.x, RECT.water.y, RECT.water.w, RECT.water.h,
            Math.round(wx + off), Math.round(waterTop),
            RECT.water.w, Math.round((bankTop - waterTop) * 0.9)
          );
        }
      }
      ctx.globalAlpha = 1;

      // shimmer row, one line of moving highlights
      ctx.fillStyle = C.waterLit;
      for (var i = 0; i < 26; i++) {
        var px = ((i * 53 + t * 0.02 * (1 + (i % 4))) % (vw + 40)) - 20;
        var py = waterTop + 6 + ((i * 7) % Math.max(8, bankTop - waterTop - 12));
        ctx.globalAlpha = 0.14 + 0.1 * Math.sin(t * 0.002 + i);
        ctx.fillRect(Math.round(px), Math.round(py), 6 + (i % 5) * 3, 1);
      }
      ctx.globalAlpha = 1;

      // near bank
      ctx.fillStyle = C.earth;
      ctx.fillRect(0, bankTop, vw, vh - bankTop);
      ctx.fillStyle = C.earthLit;
      ctx.fillRect(0, bankTop, vw, 3);
      ctx.fillStyle = C.grass;
      for (var gx = 0; gx < vw; gx += 4) {
        var gh = 2 + ((gx * 7) % 3);
        ctx.fillRect(gx, bankTop - gh, 2, gh);
      }

      // near trees: kept off the left third so the headline sits on calm ground
      var spots = [
        { k: 'treeB', x: vw * 0.62, s: 0.78 },
        { k: 'treeA', x: vw * 0.83, s: 0.95 },
        { k: 'treeC', x: vw * 0.95, s: 0.7 },
        { k: 'treeA', x: vw * 0.44, s: 0.5 }
      ];
      for (var s = 0; s < spots.length; s++) {
        blit(ctx, spots[s].k, spots[s].x, bankTop + 14, spots[s].s);
      }

      // rocks on the bank
      blit(ctx, 'rockA', vw * 0.55, bankTop + 26, 0.55);
      blit(ctx, 'rockB', vw * 0.72, bankTop + 30, 0.5);

      // the villager walks a slow circuit of the near bank
      if (walker) {
        var span = vw * 0.36;
        var cycle = (t * 0.000018) % 2;
        var dir = cycle < 1 ? 1 : -1;
        var prog = cycle < 1 ? cycle : cycle - 1;
        var wxp = vw * 0.34 + prog * span * dir;
        var frame = WALKER.frames[Math.floor(t / (1000 / WALKER.fps)) % WALKER.frames.length];
        var bob = Math.round(Math.sin(t * 0.012) * 0.5);
        blitSheetFrame(
          ctx, walker,
          (frame % 12) * cellW, WALKER.row * cellH, cellW, cellH,
          wxp, bankTop + 22 + bob, 1.15
        );
      }

      // one unifying dusk wash, so daylight sprites sit in a dusk world
      ctx.fillStyle = C.wash;
      ctx.fillRect(0, 0, vw, vh);

      // mist: two soft bands drifting at different rates
      ctx.globalCompositeOperation = 'screen';
      for (var m = 0; m < 2; m++) {
        var my = waterTop - 10 + m * 34;
        var drift = (t * (0.008 + m * 0.005)) % (vw + 240);
        ctx.globalAlpha = 0.1 + m * 0.03;
        for (var mx = -240; mx < vw + 240; mx += 200) {
          ctx.drawImage(mistPuff, Math.round(mx + drift), Math.round(my), 220, 52);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      // fireflies, only above the bank
      for (var f = 0; f < flies.length; f++) {
        var fl = flies[f];
        var fxp = (fl.x * vw + Math.sin(t * 0.0004 * fl.s + fl.p) * 22 + vw) % vw;
        var fyp = fl.y * vh + Math.cos(t * 0.00055 * fl.s + fl.p) * 9;
        var a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.0016 * fl.s + fl.p));
        ctx.globalAlpha = a * 0.55;
        ctx.fillStyle = C.fly;
        var r = fl.r;
        ctx.fillRect(Math.round(fxp), Math.round(fyp), r, r);
        ctx.globalAlpha = a * 0.12;
        ctx.fillRect(Math.round(fxp) - 2, Math.round(fyp) - 2, r + 4, r + 4);
      }
      ctx.globalAlpha = 1;
    }

    var raf = 0;
    var last = 0;
    var acc = 0;
    var t = 0;
    var running = false;
    var visible = true;
    var STEP = 1000 / 60;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      var dt = now - last;
      last = now;
      // Clamp so a backgrounded tab does not fast-forward the world on return.
      if (dt > 120) dt = STEP;
      acc += dt;
      var guard = 0;
      while (acc >= STEP && guard < 5) {
        t += STEP;
        acc -= STEP;
        guard++;
      }
      if (guard === 0) return;
      drawScene(t);
    }

    function renderStill() {
      drawScene(0);
    }

    function play() {
      if (running || reduce.matches) return;
      running = true;
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    }

    resize();
    renderStill();

    if (!reduce.matches) {
      play();
    }

    window.addEventListener('resize', function () {
      resize();
      if (!running) renderStill();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) play();
        else stop();
      }, { rootMargin: '80px' }).observe(canvas);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (visible) play();
    });

    if (reduce.addEventListener) {
      reduce.addEventListener('change', function () {
        if (reduce.matches) {
          stop();
          renderStill();
        } else {
          play();
        }
      });
    }
  }

  /* ── vignette: one still frame on paper ─────────────────── */

  function buildVignette() {
    var canvas = document.getElementById('vignette');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var W = 180;
    var H = 150;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#e8e2d0';
    ctx.fillRect(0, 0, W, H);

    // a soft ground band, stepped
    ctx.fillStyle = '#cfc9b2';
    ctx.fillRect(0, H * 0.68, W, H * 0.32);
    ctx.fillStyle = '#6f8a3a';
    for (var gx = 0; gx < W; gx += 3) {
      var gh = 1 + ((gx * 5) % 3);
      ctx.fillRect(gx, H * 0.68 - gh, 2, gh);
    }

    blit(ctx, 'treeC', W * 0.06, H * 0.7, 0.55);
    blit(ctx, 'treeB', W * 0.3, H * 0.72, 0.72);
    blit(ctx, 'rockB', W * 0.66, H * 0.76, 0.42);

    var walker = images[WALKER.sheet];
    if (walker) {
      var cellW = walker.naturalWidth / 12;
      var cellH = walker.naturalHeight / 4;
      blitSheetFrame(ctx, walker, 4 * cellW, WALKER.row * cellH, cellW, cellH, W * 0.8, H * 0.78, 1.25);
    }
  }

  function makeMistPuff() {
    var c = document.createElement('canvas');
    c.width = 128;
    c.height = 32;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(64, 16, 0, 64, 16, 62);
    grd.addColorStop(0, 'rgba(206,220,214,0.5)');
    grd.addColorStop(0.55, 'rgba(206,220,214,0.18)');
    grd.addColorStop(1, 'rgba(206,220,214,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 32);
    return c;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();