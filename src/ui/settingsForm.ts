/**
 * Settings form markup shared by the in-game pause sheet and the title screen.
 *
 * The controls are plain DOM so the browser handles range, select and checkbox
 * behaviour and keyboard access; this module only owns the markup and wiring.
 */

import { device } from '@/core/Device';
import { settings, type TextSpeed } from '@/core/Settings';

export function settingsFormHtml(): string {
  const s = settings.get();
  const pref = device.getPreference();
  return `
    <div class="settings">
      <label class="toggle">
        <input type="checkbox" id="set-muted" ${s.muted ? 'checked' : ''} />
        <span>Mute all sound</span>
      </label>
      <label class="field">
        <span>Master volume <em id="vol-out">${Math.round(s.master * 100)}</em></span>
        <input type="range" id="set-volume" min="0" max="100" value="${Math.round(s.master * 100)}" />
      </label>
      <label class="toggle">
        <input type="checkbox" id="set-motion" ${s.reducedMotion ? 'checked' : ''} />
        <span>Reduce motion</span>
      </label>
      <label class="field">
        <span>Text speed</span>
        <select id="set-text">
          <option value="slow" ${s.textSpeed === 'slow' ? 'selected' : ''}>Slow</option>
          <option value="normal" ${s.textSpeed === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="fast" ${s.textSpeed === 'fast' ? 'selected' : ''}>Fast</option>
        </select>
      </label>
      <label class="field">
        <span>Controls</span>
        <select id="set-input">
          <option value="auto" ${pref === 'auto' ? 'selected' : ''}>Automatic (${device.get().mode})</option>
          <option value="desktop" ${pref === 'desktop' ? 'selected' : ''}>Desktop</option>
          <option value="touch" ${pref === 'touch' ? 'selected' : ''}>Touch</option>
        </select>
      </label>
      <p class="hint" id="input-reason">${device.get().reason}</p>
    </div>`;
}

export function bindSettingsForm(root: HTMLElement, onChange: () => void): void {
  const update = (): void => {
    const volume = root.querySelector<HTMLInputElement>('#set-volume');
    settings.set({
      muted: root.querySelector<HTMLInputElement>('#set-muted')?.checked ?? false,
      reducedMotion: root.querySelector<HTMLInputElement>('#set-motion')?.checked ?? false,
      textSpeed: (root.querySelector<HTMLSelectElement>('#set-text')?.value ?? 'normal') as TextSpeed,
      master: volume ? Number(volume.value) / 100 : settings.get().master,
    });
    onChange();
  };

  root.querySelector('#set-muted')?.addEventListener('change', update);
  root.querySelector('#set-motion')?.addEventListener('change', update);
  root.querySelector('#set-text')?.addEventListener('change', update);
  const volume = root.querySelector<HTMLInputElement>('#set-volume');
  volume?.addEventListener('input', () => {
    const out = root.querySelector('#vol-out');
    if (out) out.textContent = volume.value;
    update();
  });
  root.querySelector<HTMLSelectElement>('#set-input')?.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value as 'auto' | 'desktop' | 'touch';
    settings.setInputPreference(value);
    const reason = root.querySelector('#input-reason');
    if (reason) reason.textContent = device.get().reason;
    onChange();
  });
}