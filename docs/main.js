/* Gitakure — landing: interface.
   Reveals, the contribution paddy, the villager grid, the copy button.
   The paddy is example data and is labelled as such; nothing here calls the GitHub API. */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var NS = 'http://www.w3.org/2000/svg';

  var VILLAGERS = [
    'aiko', 'daichi', 'ema', 'fuyu', 'haru', 'hina',
    'kei', 'kohana', 'kuro', 'mika', 'natsu', 'ren',
    'riku', 'sakura', 'shiro', 'souta', 'tomo', 'yuki'
  ];

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /* ── hero entrance ──────────────────────────────────────── */

  function heroEntrance() {
    var hero = document.querySelector('.hero-body');
    if (!hero) return;
    var items = [hero.querySelector('h1'), hero.querySelector('.hero-sub'),
                 hero.querySelector('.hero-actions'), hero.querySelector('.hero-meta')];
    if (reduce.matches) return;

    items.forEach(function (el, i) {
      if (!el) return;
      el.classList.add('reveal');
      el.style.transitionDelay = 120 + i * 80 + 'ms';
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        items.forEach(function (el) {
          if (el) el.classList.add('in');
        });
      });
    });
  }

  /* ── scroll reveals ─────────────────────────────────────── */

  function reveals() {
    var targets = document.querySelectorAll(
      '.band .num, .band h2, .band .lede, .split-text p, .shoji, .paddy, .note, .term, .cast'
    );
    if (reduce.matches || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) {
        el.classList.add('in');
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* ── villager grid ──────────────────────────────────────── */

  function buildCast() {
    var list = document.getElementById('cast');
    if (!list) return;

    VILLAGERS.forEach(function (name) {
      var li = document.createElement('li');

      var frame = document.createElement('div');
      frame.className = 'cast-frame';

      var img = document.createElement('img');
      img.src = '../sprites/npc/portraits/' + name + '.png';
      img.alt = 'Portrait of ' + name;
      img.width = 102;
      img.height = 88;
      img.loading = 'lazy';
      img.decoding = 'async';
      frame.appendChild(img);

      var label = document.createElement('span');
      label.className = 'cast-name';
      label.textContent = name;

      li.appendChild(frame);
      li.appendChild(label);
      list.appendChild(li);
    });
  }

  /* ── the paddy ──────────────────────────────────────────── */

  function mulberry32(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // An example year: a plausible rhythm, not a real account. Fixed seed so every
  // visitor sees the same field and the page stays deterministic.
  function exampleYear() {
    var rand = mulberry32(20261104);
    var weeks = 52;
    var grid = [];
    for (var w = 0; w < weeks; w++) {
      var col = [];
      // A slow seasonal swell across the year, plus a couple of quiet stretches.
      var season = 0.55 + 0.45 * Math.sin((w / weeks) * Math.PI * 2 - 1.1);
      var lull = (w > 17 && w < 23) || (w > 40 && w < 44) ? 0.18 : 1;
      for (var d = 0; d < 7; d++) {
        var weekend = d === 0 || d === 6;
        var base = (weekend ? 0.35 : 1) * season * lull;
        var roll = rand();
        var count;
        if (roll < 0.16 * lull) count = 0;
        else if (roll < 0.46) count = 1 + Math.floor(rand() * 2);
        else if (roll < 0.8) count = 3 + Math.floor(rand() * 4);
        else if (roll < 0.96) count = 7 + Math.floor(rand() * 6);
        else count = 14 + Math.floor(rand() * 9);
        col.push(Math.max(0, Math.round(count * base + (base > 0.5 ? 1 : 0))));
      }
      grid.push(col);
    }
    return grid;
  }

  var CELL = 11;
  var GAP = 4;
  var STEP = CELL + GAP;
  var LEVEL_COLOUR = ['', '#3c600c', '#6d9016', '#9aa832', '#c0a844'];

  function levelOf(n) {
    if (n <= 0) return 0;
    if (n <= 2) return 1;
    if (n <= 5) return 2;
    if (n <= 9) return 3;
    return 4;
  }

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) node.setAttribute(k, attrs[k]);
    }
    return node;
  }

  function buildPaddy() {
    var svg = document.getElementById('paddy-svg');
    var readout = document.getElementById('paddy-readout');
    if (!svg) return;

    var grid = exampleYear();
    var weeks = grid.length;
    var days = 7;

    svg.setAttribute('viewBox', '0 0 ' + weeks * STEP + ' ' + days * STEP);
    svg.setAttribute('aria-rowcount', String(days));
    svg.setAttribute('aria-colcount', String(weeks));

    var cells = [];
    var frag = document.createDocumentFragment();

    for (var d = 0; d < days; d++) {
      var row = el('g', { role: 'row', 'aria-rowindex': String(d + 1) });
      for (var w = 0; w < weeks; w++) {
        var count = grid[w][d];
        var level = levelOf(count);
        var x = w * STEP;
        var y = d * STEP;

        var cell = el('g', {
          role: 'gridcell',
          'aria-colindex': String(w + 1),
          'aria-label': 'Week ' + (w + 1) + ', ' + DAYS[d] + ': ' +
            count + (count === 1 ? ' contribution' : ' contributions'),
          tabindex: w === 0 && d === 0 ? '0' : '-1',
          class: 'cell'
        });
        cell.dataset.week = String(w);
        cell.dataset.day = String(d);
        cell.dataset.count = String(count);

        // Bare soil, so an empty day is still visible as a planting place.
        var soil = el('rect', {
          x: String(x + 2), y: String(y + STEP - 4), width: String(CELL - 4), height: '2',
          rx: '1', fill: '#2b3a3a', opacity: '0.75'
        });
        cell.appendChild(soil);

        if (level > 0) {
          var stemH = 2 + level * 1.6;
          var stem = el('rect', {
            x: String(x + CELL / 2 - 0.75), y: String(y + STEP - 3 - stemH),
            width: '1.5', height: String(stemH), fill: LEVEL_COLOUR[level], opacity: '0.9'
          });
          cell.appendChild(stem);

          for (var l = 0; l < level; l++) {
            var ly = y + STEP - 4 - (l + 1) * 1.7;
            var wide = 2.4 + l * 0.5;
            cell.appendChild(el('rect', {
              x: String(x + CELL / 2 - wide - 0.4), y: String(ly),
              width: String(wide), height: '1.4', fill: LEVEL_COLOUR[level], opacity: '0.85'
            }));
            cell.appendChild(el('rect', {
              x: String(x + CELL / 2 + 0.4), y: String(ly),
              width: String(wide), height: '1.4', fill: LEVEL_COLOUR[level], opacity: '0.85'
            }));
          }
        }

        row.appendChild(cell);
        cells.push(cell);
      }
      frag.appendChild(row);
    }

    var ring = el('rect', {
      class: 'focus-ring', width: String(CELL + 2), height: String(CELL + 2),
      x: '-1', y: '-1', rx: '2'
    });

    svg.appendChild(frag);
    svg.appendChild(ring);

    var weekEl = readout ? readout.querySelector('.paddy-week') : null;
    var countEl = readout ? readout.querySelector('.paddy-count') : null;

    function describe(cell) {
      var count = Number(cell.dataset.count);
      if (weekEl) weekEl.textContent = 'Week ' + (Number(cell.dataset.week) + 1) + ', ' + DAYS[Number(cell.dataset.day)];
      if (countEl) countEl.textContent = count === 0 ? 'Bare soil' : count + (count === 1 ? ' planting' : ' plantings');
    }

    function move(cell, dw, dd) {
      var w = Number(cell.dataset.week) + dw;
      var d = Number(cell.dataset.day) + dd;
      w = Math.max(0, Math.min(weeks - 1, w));
      d = Math.max(0, Math.min(days - 1, d));
      var next = cells[d * weeks + w];
      if (!next) return;
      cell.setAttribute('tabindex', '-1');
      next.setAttribute('tabindex', '0');
      next.focus();
      describe(next);
      placeRing(next);
    }

    function placeRing(cell) {
      ring.setAttribute('x', String(Number(cell.dataset.week) * STEP - 1));
      ring.setAttribute('y', String(Number(cell.dataset.day) * STEP - 1));
      ring.classList.add('on');
    }

    svg.addEventListener('keydown', function (e) {
      var cell = document.activeElement;
      if (!cell || !cell.dataset || cell.dataset.week === undefined) return;
      var handled = true;
      switch (e.key) {
        case 'ArrowRight': move(cell, 1, 0); break;
        case 'ArrowLeft': move(cell, -1, 0); break;
        case 'ArrowDown': move(cell, 0, 1); break;
        case 'ArrowUp': move(cell, 0, -1); break;
        case 'Home': move(cell, -Number(cell.dataset.week), 0); break;
        case 'End': move(cell, weeks, 0); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    });

    svg.addEventListener('focusin', function (e) {
      var cell = e.target;
      if (cell && cell.dataset && cell.dataset.week !== undefined) {
        describe(cell);
        placeRing(cell);
      }
    });

    svg.addEventListener('focusout', function () {
      ring.classList.remove('on');
    });

    svg.addEventListener('pointerover', function (e) {
      var cell = e.target.closest ? e.target.closest('.cell') : null;
      if (!cell) return;
      describe(cell);
      placeRing(cell);
    });

    svg.addEventListener('pointerleave', function () {
      ring.classList.remove('on');
    });

    if (readout) {
      var first = cells[0];
      if (first) describe(first);
    }
  }

  /* ── copy ───────────────────────────────────────────────── */

  function copyBlock() {
    var btn = document.getElementById('copy');
    var block = document.getElementById('commands');
    if (!btn || !block) return;

    // The clipboard API needs a secure context, so it is absent from file://.
    // Hide the control rather than leaving a button that does nothing.
    if (!navigator.clipboard) {
      btn.hidden = true;
      return;
    }

    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(block.textContent.trim()).then(function () {
        btn.textContent = 'Copied';
        setTimeout(function () {
          btn.textContent = 'Copy';
        }, 1600);
      }, function () {
        btn.textContent = 'Press Ctrl+C';
      });
    });
  }

  function init() {
    heroEntrance();
    reveals();
    buildCast();
    buildPaddy();
    copyBlock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();