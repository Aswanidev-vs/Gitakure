/**
 * Touch controls.
 *
 * A floating stick for movement (analog, not four buttons), a run toggle, and
 * one context button whose label changes with what the player is standing next
 * to. Mounted only when the device manager says the player is on a touch
 * screen; the desktop path never creates this DOM.
 */

import { touchVerb } from '@/core/Device';

export interface MobileControlsOptions {
  onInteract: () => void;
  onRunChange?: (running: boolean) => void;
}

export interface MobileControls {
  destroy(): void;
  /** Analog movement vector, each axis in [-1, 1]. */
  getVector(): { x: number; y: number };
  isRunning(): boolean;
  setRunning(running: boolean): void;
  /** `null` hides the action button; a string sets its label. */
  setInteractLabel(label: string | null): void;
  setVisible(visible: boolean): void;
}

const STICK_RADIUS = 42;
const DEAD_ZONE = 0.16;

export function createMobileControls(
  container: HTMLElement,
  opts: MobileControlsOptions,
): MobileControls {
  const wrap = document.createElement('div');
  wrap.className = 'mc';
  wrap.setAttribute('aria-label', 'Touch controls');

  const stick = document.createElement('div');
  stick.className = 'mc-stick';
  stick.innerHTML = '<span class="mc-stick__ring"></span><span class="mc-stick__knob"></span>';
  const knob = stick.querySelector<HTMLElement>('.mc-stick__knob')!;

  const actions = document.createElement('div');
  actions.className = 'mc-actions';

  const runBtn = document.createElement('button');
  runBtn.type = 'button';
  runBtn.className = 'mc-btn mc-btn--run';
  runBtn.textContent = 'Run';
  runBtn.setAttribute('aria-pressed', 'false');

  const interactBtn = document.createElement('button');
  interactBtn.type = 'button';
  interactBtn.className = 'mc-btn mc-btn--interact';
  interactBtn.innerHTML = '<span class="mc-btn__label">Use</span>';
  interactBtn.disabled = true;

  actions.append(runBtn, interactBtn);
  wrap.append(stick, actions);
  container.appendChild(wrap);

  let pointerId: number | null = null;
  let centerX = 0;
  let centerY = 0;
  let vecX = 0;
  let vecY = 0;
  let running = false;
  let visible = true;

  const setKnob = (dx: number, dy: number): void => {
    const dist = Math.hypot(dx, dy);
    const scale = dist > STICK_RADIUS ? STICK_RADIUS / dist : 1;
    const x = dx * scale;
    const y = dy * scale;
    knob.style.transform = `translate(${x}px, ${y}px)`;
    const nx = x / STICK_RADIUS;
    const ny = y / STICK_RADIUS;
    const mag = Math.hypot(nx, ny);
    if (mag < DEAD_ZONE) {
      vecX = 0;
      vecY = 0;
    } else {
      // Rescale so the first usable pixel is not a jump.
      const norm = (mag - DEAD_ZONE) / (1 - DEAD_ZONE) / mag;
      vecX = nx * norm;
      vecY = ny * norm;
    }
    wrap.classList.toggle('is-walking', mag >= DEAD_ZONE);
  };

  const resetStick = (): void => {
    pointerId = null;
    vecX = 0;
    vecY = 0;
    knob.style.transform = 'translate(0px, 0px)';
    wrap.classList.remove('is-walking');
  };

  const onStickDown = (e: PointerEvent): void => {
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    const rect = stick.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    stick.setPointerCapture(e.pointerId);
    setKnob(e.clientX - centerX, e.clientY - centerY);
    e.preventDefault();
  };

  const onStickMove = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return;
    setKnob(e.clientX - centerX, e.clientY - centerY);
    e.preventDefault();
  };

  const onStickUp = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return;
    resetStick();
    e.preventDefault();
  };

  stick.addEventListener('pointerdown', onStickDown);
  stick.addEventListener('pointermove', onStickMove);
  stick.addEventListener('pointerup', onStickUp);
  stick.addEventListener('pointercancel', onStickUp);
  stick.addEventListener('lostpointercapture', resetStick);

  const setRunning = (next: boolean): void => {
    if (running === next) return;
    running = next;
    runBtn.classList.toggle('is-on', running);
    runBtn.setAttribute('aria-pressed', String(running));
    opts.onRunChange?.(running);
  };

  runBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setRunning(!running);
  });

  const fireInteract = (e: PointerEvent): void => {
    e.preventDefault();
    if (interactBtn.disabled) return;
    interactBtn.classList.add('is-pressed');
    window.setTimeout(() => interactBtn.classList.remove('is-pressed'), 140);
    opts.onInteract();
  };
  interactBtn.addEventListener('pointerdown', fireInteract);

  // Keep the page from scrolling or zooming while the stick is in use.
  const prevent = (e: TouchEvent): void => {
    if (e.cancelable) e.preventDefault();
  };
  wrap.addEventListener('touchmove', prevent, { passive: false });

  const setVisible = (next: boolean): void => {
    visible = next;
    wrap.classList.toggle('is-hidden', !visible);
    wrap.setAttribute('aria-hidden', String(!visible));
    if (!visible) resetStick();
  };

  return {
    destroy: () => {
      wrap.removeEventListener('touchmove', prevent);
      wrap.remove();
    },
    getVector: () => (visible ? { x: vecX, y: vecY } : { x: 0, y: 0 }),
    isRunning: () => running,
    setRunning,
    setInteractLabel: (label) => {
      if (!label) {
        interactBtn.disabled = true;
        interactBtn.querySelector('.mc-btn__label')!.textContent = 'Use';
        return;
      }
      interactBtn.disabled = false;
      interactBtn.querySelector('.mc-btn__label')!.textContent = touchVerb(label);
    },
    setVisible,
  };
}