/**
 * Mobile controls: a virtual joystick and action buttons overlaid on the
 * screen. Only shown on touch devices or when forced via settings.
 */

export interface MobileControls {
  destroy: () => void;
  isDown: (key: 'up' | 'down' | 'left' | 'right' | 'run' | 'interact') => boolean;
}

export function createMobileControls(container: HTMLElement): MobileControls {
  const state = { up: false, down: false, left: false, right: false, run: false, interact: false };

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:10;';

  // Joystick
  const joy = document.createElement('div');
  joy.style.cssText = 'position:absolute;left:16px;bottom:16px;width:96px;height:96px;border-radius:50%;background:rgba(36,31,44,0.6);border:2px solid #3a3240;pointer-events:auto;touch-action:none;';
  wrap.appendChild(joy);

  const knob = document.createElement('div');
  knob.style.cssText = 'position:absolute;left:32px;top:32px;width:32px;height:32px;border-radius:50%;background:#c9a227;';
  joy.appendChild(knob);

  let activeTouch: number | null = null;
  let originX = 0, originY = 0;

  const updateKnob = (dx: number, dy: number) => {
    const dist = Math.hypot(dx, dy);
    const max = 32;
    const clamped = Math.min(dist, max);
    const scale = dist > 0 ? clamped / dist : 0;
    knob.style.left = `${32 + dx * scale}px`;
    knob.style.top = `${32 + dy * scale}px`;
    const threshold = 8;
    state.up = dy < -threshold;
    state.down = dy > threshold;
    state.left = dx < -threshold;
    state.right = dx > threshold;
  };

  joy.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0]!;
    activeTouch = t.identifier;
    const rect = joy.getBoundingClientRect();
    originX = t.clientX - rect.left - 48;
    originY = t.clientY - rect.top - 48;
    updateKnob(originX, originY);
    e.preventDefault();
  });
  joy.addEventListener('touchmove', (e) => {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === activeTouch) {
        const rect = joy.getBoundingClientRect();
        const dx = t.clientX - rect.left - 48;
        const dy = t.clientY - rect.top - 48;
        updateKnob(dx, dy);
      }
    }
    e.preventDefault();
  });
  const endTouch = () => {
    activeTouch = null;
    knob.style.left = '32px';
    knob.style.top = '32px';
    state.up = state.down = state.left = state.right = false;
  };
  joy.addEventListener('touchend', endTouch);
  joy.addEventListener('touchcancel', endTouch);

  // Action buttons
  const makeBtn = (label: string, key: 'interact' | 'run', bottom: string, right: string) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = `position:absolute;right:${right};bottom:${bottom};width:56px;height:56px;border-radius:50%;background:rgba(36,31,44,0.7);color:#e8dcc0;border:2px solid #3a3240;font-size:12px;pointer-events:auto;`;
    b.addEventListener('touchstart', (e) => { state[key] = true; e.preventDefault(); });
    b.addEventListener('touchend', () => { state[key] = false; });
    wrap.appendChild(b);
  };
  makeBtn('E', 'interact', '80px', '16px');
  makeBtn('Run', 'run', '16px', '16px');

  container.appendChild(wrap);

  return {
    destroy: () => wrap.remove(),
    isDown: (k) => state[k],
  };
}