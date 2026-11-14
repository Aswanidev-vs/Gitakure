/* Gitakure — landing: interface.
   Hero entrance, scroll reveals, and the copy button.
   Nothing here calls an API. The keepsake ledger in the markup is example data
   and is labelled as such, so no visitor is shown a fabricated account. */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── hero entrance ──────────────────────────────────────── */

  function heroEntrance() {
    var body = document.querySelector('.hero-body');
    if (!body || reduce.matches) return;

    var items = [
      body.querySelector('.hero-place'),
      body.querySelector('h1'),
      body.querySelector('.hero-sub'),
      body.querySelector('.hero-actions'),
      body.querySelector('.hero-meta')
    ].filter(Boolean);

    items.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = 80 + i * 90 + 'ms';
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        items.forEach(function (el) {
          el.classList.add('in');
        });
      });
    });
  }

  /* ── scroll reveals ─────────────────────────────────────── */

  function reveals() {
    /* Blocks that simply fade up as a whole. */
    var blocks = document.querySelectorAll(
      '.band-head, .creed-note, .workshop-note, .run-grid'
    );
    /* Blocks whose children should arrive one after another. */
    var groups = document.querySelectorAll('.creed-list, .specs, .privacy-grid, .ledger');
    var targets = blocks;

    if (!targets.length && !groups.length) return;

    if (reduce.matches || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) {
        el.classList.add('in');
      });
      groups.forEach(function (el) {
        el.classList.add('in');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );

    targets.forEach(function (el) {
      if (el.classList.contains('ledger')) return;
      el.classList.add('reveal');
      io.observe(el);
    });

    groups.forEach(function (el) {
      if (!el.classList.contains('stagger') && !el.classList.contains('ledger')) {
        el.classList.add('stagger');
      }
      io.observe(el);
    });
  }

  /* ── copy ───────────────────────────────────────────────── */

  function copyBlock() {
    var btn = document.getElementById('copy');
    var block = document.getElementById('commands');
    if (!btn || !block) return;

    // The clipboard API needs a secure context, so it is absent over file://.
    // Remove the control rather than leave a button that does nothing.
    if (!navigator.clipboard || !window.isSecureContext) {
      btn.hidden = true;
      return;
    }

    var reset;
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(block.textContent.trim()).then(
        function () {
          btn.textContent = 'Copied';
          clearTimeout(reset);
          reset = setTimeout(function () {
            btn.textContent = 'Copy';
          }, 1600);
        },
        function () {
          btn.textContent = 'Press Ctrl+C';
          clearTimeout(reset);
          reset = setTimeout(function () {
            btn.textContent = 'Copy';
          }, 2200);
        }
      );
    });
  }

  function init() {
    heroEntrance();
    reveals();
    copyBlock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();