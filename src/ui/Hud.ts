/**
 * The HTML interface layer: HUD, prompts, dialogue, journal, map, pause,
 * settings and sync.
 *
 * The world is rendered by Phaser at 640x360 and scaled up; text rendered
 * there would be chunky. Everything a player reads is therefore plain DOM with
 * the same palette and the same two typefaces, which keeps it crisp at any
 * size and lets the browser handle focus, selection and screen readers.
 */

import { device, keyHint } from '@/core/Device';
import { formatClock } from '@/data/npcs';
import { LOCATIONS } from '@/data/locations';
import type { DialogueLine } from '@/systems/DialogueSystem';
import { weatherLabel } from '@/systems/WeatherSystem';
import type { JournalEntry, LocationId, SyncSummary, WorldClock } from '@/shared/types';
import { iconUrl, portraitUrl } from './icons';
import { bindSettingsForm, settingsFormHtml } from './settingsForm';

export interface HudCallbacks {
  onInteract: () => void;
  onAdvanceDialogue: () => void;
  onJournal: () => void;
  onMap: () => void;
  onPause: () => void;
  onModalClosed: () => void;
  onSave: () => void;
  onQuit: () => void;
  onTravel: (id: LocationId) => void;
  onSync: (username: string, token: string) => Promise<SyncSummary | null>;
  onSettingsChanged: () => void;
}

export interface PromptItem {
  verb: string;
  label: string;
}

const WEATHER_ICON = {
  sunny: 'sun',
  cloudy: 'cloud',
  rain: 'rain',
  downpour: 'rain',
  fog: 'fog',
  snow: 'snow',
} as const;

const PHASE_LABEL: Record<string, string> = {
  dawn: 'Dawn',
  morning: 'Morning',
  afternoon: 'Afternoon',
  dusk: 'Dusk',
  night: 'Night',
};

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export class Hud {
  private readonly root: HTMLElement;
  private readonly cb: HudCallbacks;
  private readonly time: HTMLElement;
  private readonly day: HTMLElement;
  private readonly weatherIcon: HTMLImageElement;
  private readonly weatherText: HTMLElement;
  private readonly phase: HTMLImageElement;
  private readonly prompt: HTMLElement;
  private readonly promptKey: HTMLElement;
  private readonly promptVerb: HTMLElement;
  private readonly promptLabel: HTMLElement;
  private readonly dialogue: HTMLElement;
  private readonly dialoguePortrait: HTMLImageElement;
  private readonly dialogueName: HTMLElement;
  private readonly dialogueText: HTMLElement;
  private readonly dialogueHint: HTMLElement;
  private readonly toastEl: HTMLElement;
  private readonly layer: HTMLElement;
  private readonly sheetTitle: HTMLElement;
  private readonly sheetEyebrow: HTMLElement;
  private readonly sheetBody: HTMLElement;
  private readonly sheetFoot: HTMLElement;
  private toastTimer = 0;
  private lastTime = '';
  private lastDay = '';
  private lastWeather = '';
  private promptItem: PromptItem | null = null;
  private syncSummary: SyncSummary | null = null;
  private onCloseSheet: (() => void) | null = null;
  private unsubscribeDevice: (() => void) | null = null;

  constructor(root: HTMLElement, cb: HudCallbacks) {
    this.root = root;
    this.cb = cb;
    root.innerHTML = `
      <div class="hud" id="hud">
        <div class="hud__cluster hud__cluster--left">
          <div class="hud-plate hud-clock">
            <img class="hud-icon" id="hud-phase-icon" alt="" />
            <span class="hud-clock__time" id="hud-time">8:00</span>
            <span class="hud-clock__meta" id="hud-day">Day 1 · Spring</span>
          </div>
          <div class="hud-plate hud-weather" id="hud-weather">
            <img class="hud-icon" id="hud-weather-icon" alt="" />
            <span id="hud-weather-text">Clear</span>
          </div>
        </div>
        <div class="hud__cluster hud__cluster--right">
          <button class="hud-btn" type="button" data-act="journal" aria-label="Journal" title="Journal (J)">
            <img alt="" id="btn-journal" />
          </button>
          <button class="hud-btn" type="button" data-act="map" aria-label="World map" title="World map (M)">
            <img alt="" id="btn-map" />
          </button>
          <button class="hud-btn" type="button" data-act="sync" aria-label="Sync GitHub" title="Sync GitHub">
            <img alt="" id="btn-sync" />
          </button>
          <button class="hud-btn" type="button" data-act="pause" aria-label="Menu" title="Menu (Esc)">
            <img alt="" id="btn-menu" />
          </button>
        </div>
      </div>
      <div class="prompt" id="prompt" hidden>
        <span class="prompt__key" id="prompt-key">E</span>
        <span class="prompt__verb" id="prompt-verb">Talk</span>
        <span class="prompt__label" id="prompt-label">Ilaya</span>
      </div>
      <div class="dialogue" id="dialogue" hidden>
        <div class="dialogue__portrait"><img id="dialogue-portrait" alt="" /></div>
        <div class="dialogue__main">
          <div class="dialogue__name" id="dialogue-name"></div>
          <p class="dialogue__text" id="dialogue-text"></p>
          <div class="dialogue__hint" id="dialogue-hint">Space to continue</div>
        </div>
      </div>
      <div class="toast" id="toast" hidden></div>
      <div class="sheet-layer" id="sheet-layer" hidden>
        <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <header class="sheet__head">
            <div>
              <div class="sheet__eyebrow" id="sheet-eyebrow">Gitakure</div>
              <h2 class="sheet__title" id="sheet-title">Journal</h2>
            </div>
            <button class="sheet__close" id="sheet-close" type="button" aria-label="Close">×</button>
          </header>
          <div class="sheet__body" id="sheet-body"></div>
          <footer class="sheet__foot" id="sheet-foot"></footer>
        </section>
      </div>
    `;

    this.time = root.querySelector('#hud-time')!;
    this.day = root.querySelector('#hud-day')!;
    this.weatherIcon = root.querySelector<HTMLImageElement>('#hud-weather-icon')!;
    this.weatherText = root.querySelector('#hud-weather-text')!;
    this.phase = root.querySelector<HTMLImageElement>('#hud-phase-icon')!;
    this.prompt = root.querySelector('#prompt')!;
    this.promptKey = root.querySelector('#prompt-key')!;
    this.promptVerb = root.querySelector('#prompt-verb')!;
    this.promptLabel = root.querySelector('#prompt-label')!;
    this.dialogue = root.querySelector('#dialogue')!;
    this.dialoguePortrait = root.querySelector<HTMLImageElement>('#dialogue-portrait')!;
    this.dialogueName = root.querySelector('#dialogue-name')!;
    this.dialogueText = root.querySelector('#dialogue-text')!;
    this.dialogueHint = root.querySelector('#dialogue-hint')!;
    this.toastEl = root.querySelector('#toast')!;
    this.layer = root.querySelector('#sheet-layer')!;
    this.sheetTitle = root.querySelector('#sheet-title')!;
    this.sheetEyebrow = root.querySelector('#sheet-eyebrow')!;
    this.sheetBody = root.querySelector('#sheet-body')!;
    this.sheetFoot = root.querySelector('#sheet-foot')!;

    this.phase.src = iconUrl('sun');
    this.weatherIcon.src = iconUrl('sun');
    root.querySelector('#btn-journal')!.setAttribute('src', iconUrl('book'));
    root.querySelector('#btn-map')!.setAttribute('src', iconUrl('map'));
    root.querySelector('#btn-sync')!.setAttribute('src', iconUrl('star'));
    root.querySelector('#btn-menu')!.setAttribute('src', iconUrl('person'));

    root.querySelector('[data-act="journal"]')!.addEventListener('click', () => this.cb.onJournal());
    root.querySelector('[data-act="map"]')!.addEventListener('click', () => this.cb.onMap());
    root.querySelector('[data-act="sync"]')!.addEventListener('click', () => this.openSync());
    root.querySelector('[data-act="pause"]')!.addEventListener('click', () => this.cb.onPause());

    root.querySelector('#sheet-close')!.addEventListener('click', () => this.closeSheet());
    this.dialogue.addEventListener('click', () => this.cb.onAdvanceDialogue());
    this.dialogue.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') this.cb.onAdvanceDialogue();
    });

    this.unsubscribeDevice = device.subscribe(() => {
      this.renderPrompt();
      if (!this.dialogue.hidden) {
        this.dialogueHint.textContent = device.isTouch() ? 'Tap to continue' : 'Space to continue';
      }
    });
  }

  setClock(clock: WorldClock): void {
    const time = formatClock(clock.minutes);
    if (time !== this.lastTime) {
      this.time.textContent = time;
      this.lastTime = time;
    }
    const day = `Day ${clock.day + 1} · ${cap(clock.season)}`;
    if (day !== this.lastDay) {
      this.day.textContent = day;
      this.lastDay = day;
    }
    const weather = weatherLabel(clock.weather);
    if (weather !== this.lastWeather) {
      this.weatherText.textContent = weather;
      this.weatherIcon.src = iconUrl(WEATHER_ICON[clock.weather] ?? 'sun');
      this.lastWeather = weather;
    }
    this.phase.src = iconUrl(clock.phase === 'night' ? 'moon' : 'sun');
    this.phase.alt = PHASE_LABEL[clock.phase] ?? clock.phase;
  }

  setPrompt(item: PromptItem | null): void {
    const changed =
      (item?.verb ?? '') !== (this.promptItem?.verb ?? '') ||
      (item?.label ?? '') !== (this.promptItem?.label ?? '');
    this.promptItem = item;
    if (!changed) return;
    this.renderPrompt();
  }

  private renderPrompt(): void {
    const item = this.promptItem;
    if (!item) {
      this.prompt.hidden = true;
      return;
    }
    this.prompt.hidden = false;
    this.promptVerb.textContent = item.verb;
    this.promptLabel.textContent = item.label;
    const hint = keyHint('interact');
    this.promptKey.hidden = !hint;
    if (hint) this.promptKey.textContent = hint;
  }

  showLine(line: DialogueLine): void {
    this.dialogueName.textContent = line.speaker;
    this.dialogueText.textContent = line.text;
    const hasPortrait = Boolean(line.portraitKey);
    this.dialoguePortrait.hidden = !hasPortrait;
    this.dialoguePortrait.src = hasPortrait ? portraitUrl(line.portraitKey!) : '';
    this.dialoguePortrait.alt = hasPortrait ? line.speaker : '';
    this.dialogueHint.textContent = device.isTouch() ? 'Tap to continue' : 'Space to continue';
    this.dialogue.hidden = false;
    this.dialogueText.classList.remove('is-new');
    // Restart the line's entrance animation.
    void this.dialogueText.offsetWidth;
    this.dialogueText.classList.add('is-new');
  }

  hideDialogue(): void {
    this.dialogue.hidden = true;
  }

  isDialogueOpen(): boolean {
    return !this.dialogue.hidden;
  }

  toast(message: string, ms = 2200): void {
    this.toastEl.textContent = message;
    this.toastEl.hidden = false;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastEl.hidden = true;
    }, ms);
  }

  openJournal(entries: JournalEntry[]): void {
    const sorted = [...entries].sort((a, b) => b.day - a.day);
    let html = '';
    if (sorted.length === 0) {
      html =
        '<p class="empty">No pages yet. Sync GitHub, or walk somewhere new, and the journal will start filling itself.</p>';
    } else {
      let day = Number.NaN;
      for (const entry of sorted) {
        if (entry.day !== day) {
          day = entry.day;
          html += `<div class="journal__day"><span>Day ${day + 1}</span><i></i></div>`;
        }
        html += `<article class="entry entry--${esc(entry.kind)}">
          <div class="entry__kind">${esc(entry.kind)}</div>
          <h3 class="entry__title">${esc(entry.title)}</h3>
          <p class="entry__body">${esc(entry.body)}</p>
        </article>`;
      }
    }
    this.openSheet('Journal', 'The world so far', html, '');
  }

  openMap(current: LocationId, discovered: LocationId[]): void {
    const nodes: Record<LocationId, { x: number; y: number }> = {
      village: { x: 160, y: 112 },
      riverside: { x: 252, y: 136 },
      forest: { x: 66, y: 72 },
      farmland: { x: 96, y: 158 },
      shrine: { x: 160, y: 34 },
      hideaway: { x: 238, y: 66 },
    };
    const edges: [LocationId, LocationId][] = [
      ['village', 'forest'],
      ['village', 'farmland'],
      ['village', 'riverside'],
      ['village', 'shrine'],
      ['forest', 'shrine'],
      ['riverside', 'hideaway'],
      ['village', 'hideaway'],
    ];
    const isKnown = (id: LocationId): boolean => discovered.includes(id);
    const paths = edges
      .map(([a, b]) => {
        const p = nodes[a];
        const q = nodes[b];
        const known = isKnown(a) && isKnown(b);
        return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" class="map__path${known ? ' is-known' : ''}" />`;
      })
      .join('');
    const marks = LOCATIONS.map((loc) => {
      const p = nodes[loc.id];
      const known = isKnown(loc.id);
      const here = loc.id === current;
      const roleAttr = known ? ' role="button"' : '';
      return `<g class="map__node${known ? ' is-known' : ''}${here ? ' is-here' : ''}"
        data-loc="${loc.id}"${roleAttr} tabindex="${known ? '0' : '-1'}"
        aria-label="${esc(loc.name)}${known ? '' : ' (unvisited)'}">
        <title>${esc(loc.name)} — ${esc(loc.subtitle)}</title>
        ${here ? `<circle cx="${p.x}" cy="${p.y}" r="13" class="map__halo" />` : ''}
        <circle cx="${p.x}" cy="${p.y}" r="7" class="map__dot" />
        <text x="${p.x}" y="${p.y + 22}" class="map__label">${esc(loc.name)}</text>
      </g>`;
    }).join('');
    const svg = `<svg class="map" viewBox="0 0 320 200" role="group" aria-label="World map">
      <rect class="map__sea" x="0" y="0" width="320" height="200" rx="6" />
      <path class="map__river" d="M4 150 C 60 138, 96 168, 150 152 S 250 118, 316 140" />
      <path class="map__river" d="M6 158 C 62 146, 98 176, 152 160 S 252 126, 314 148" />
      ${paths}
      ${marks}
    </svg>`;
    const list = LOCATIONS.map((loc) => {
      const known = isKnown(loc.id);
      const here = loc.id === current;
      return `<button type="button" class="map__row" data-loc="${loc.id}" ${known && !here ? '' : 'disabled'}>
        <span class="map__row-name">${esc(loc.name)}${here ? ' · you are here' : ''}</span>
        <span class="map__row-sub">${known ? esc(loc.subtitle) : 'Unvisited'}</span>
      </button>`;
    }).join('');
    const html = `${svg}<p class="map__hint">Only places you have walked can be travelled to.</p><div class="map__list">${list}</div>`;
    this.openSheet('World map', 'Six places in one valley', html, '');
    this.layer.querySelectorAll<HTMLElement>('[data-loc]').forEach((el) => {
      const id = el.getAttribute('data-loc') as LocationId | null;
      if (!id) return;
      if (!isKnown(id) || id === current) return;
      const go = () => {
        this.closeSheet();
        this.cb.onTravel(id);
      };
      el.addEventListener('click', go);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      });
    });
  }

  openSync(): void {
    const s = this.syncSummary;
    const summary = s
      ? `<div class="sync-summary">
          <div><span>Source</span><strong>${esc(s.source === 'github' ? s.username ?? 'GitHub' : 'Sample data')}</strong></div>
          <div><span>Contributions</span><strong>${s.totalContributions.toLocaleString()}</strong></div>
          <div><span>Repositories</span><strong>${s.repositories}</strong></div>
          <div><span>Active days</span><strong>${s.activeDays}</strong></div>
          <div><span>Last sync</span><strong>${s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString() : 'never'}</strong></div>
        </div>`
      : '';
    const html = `
      <form class="sync" id="sync-form">
        <label class="field">
          <span>GitHub username</span>
          <input name="username" type="text" autocomplete="off" spellcheck="false" placeholder="octocat" />
        </label>
        <label class="field">
          <span>Access token <em>optional</em></span>
          <input name="token" type="password" autocomplete="off" spellcheck="false" placeholder="ghp_…" />
        </label>
        <p class="hint">A token stays in memory for this session and is never written to storage. Without one, public contribution data is used.</p>
        <button class="btn btn--primary" type="submit" id="sync-submit">Sync the world</button>
        <p class="sync__status" id="sync-status" role="status"></p>
      </form>
      ${summary}`;
    this.openSheet('GitHub', 'What the valley remembers', html, '');
    const form = this.layer.querySelector<HTMLFormElement>('#sync-form')!;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const username = String(data.get('username') ?? '').trim();
      const token = String(data.get('token') ?? '').trim();
      const submit = this.layer.querySelector<HTMLButtonElement>('#sync-submit')!;
      const status = this.layer.querySelector<HTMLElement>('#sync-status')!;
      if (!username) {
        status.textContent = 'Enter a GitHub username, or leave it blank to use octocat.';
        status.className = 'sync__status is-error';
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Syncing…';
      status.textContent = 'Reading contributions…';
      status.className = 'sync__status';
      try {
        const result = await this.cb.onSync(username, token);
        if (result) {
          this.syncSummary = result;
          this.openSync();
          this.toast('World synced');
        } else {
          status.textContent = 'Nothing new to apply.';
          submit.disabled = false;
          submit.textContent = 'Sync the world';
        }
      } catch (err) {
        status.textContent = err instanceof Error ? err.message : 'Sync failed.';
        status.className = 'sync__status is-error';
        submit.disabled = false;
        submit.textContent = 'Try again';
      }
    });
  }

  setSyncSummary(summary: SyncSummary): void {
    this.syncSummary = summary;
  }

  openPause(): void {
    const touch = device.isTouch();
    const controls = touch
      ? '<li><b>Stick</b> walk</li><li><b>Run</b> toggle running</li><li><b>Action</b> interact</li><li><b>Journal, map, menu</b> along the top</li>'
      : '<li><b>WASD / arrows</b> walk</li><li><b>Shift</b> run</li><li><b>E</b> interact</li><li><b>J</b> journal</li><li><b>M</b> map</li><li><b>Esc</b> pause</li>';
    const html = `
      <div class="pause">
        <div class="pause__grid">
          <button type="button" class="btn btn--primary" id="pause-resume">Resume</button>
          <button type="button" class="btn" id="pause-save">Save now</button>
          <button type="button" class="btn" id="pause-settings">Settings</button>
          <button type="button" class="btn btn--quiet" id="pause-quit">Return to title</button>
        </div>
        <div class="pause__help">
          <h3>Controls</h3>
          <ul>${controls}</ul>
        </div>
      </div>`;
    this.openSheet('Paused', 'The valley waits', html, '<span class="foot-note">Progress saves automatically every few minutes.</span>');
    this.layer.querySelector('#pause-resume')!.addEventListener('click', () => this.closeSheet());
    this.layer.querySelector('#pause-save')!.addEventListener('click', () => {
      this.cb.onSave();
      this.toast('Saved');
    });
    this.layer.querySelector('#pause-settings')!.addEventListener('click', () => this.openSettings());
    this.layer.querySelector('#pause-quit')!.addEventListener('click', () => {
      this.closeSheet();
      this.cb.onQuit();
    });
    this.onCloseSheet = null;
  }

  openSettings(): void {
    this.openSheet('Settings', 'Make it yours', settingsFormHtml(), '');
    bindSettingsForm(this.sheetBody, () => this.cb.onSettingsChanged());
    this.onCloseSheet = null;
  }

  openAbout(): void {
    const html = `
      <div class="about">
        <p><b>Gitakure</b> is a quiet countryside RPG whose valley grows from a real GitHub history.</p>
        <p>Contributions become paths and plantings. Active stretches become blossom and full paddy. New repositories become project stones at the edge of the village. Nothing is destroyed by a quiet month.</p>
        <p>The world is drawn in code — every tile, tree, roof and face is generated at boot from one palette, so the game works offline and every pixel is reproducible.</p>
        <p class="about__meta">Made with Phaser, TypeScript and the GitHub API.</p>
      </div>`;
    this.openSheet('About', 'A valley that remembers', html, '');
    this.onCloseSheet = null;
  }

  closeSheet(): void {
    if (this.layer.hidden) return;
    this.layer.hidden = true;
    this.sheetBody.innerHTML = '';
    this.sheetFoot.innerHTML = '';
    const cb = this.onCloseSheet;
    this.onCloseSheet = null;
    cb?.();
    this.cb.onModalClosed();
  }

  isModalOpen(): boolean {
    return !this.layer.hidden;
  }

  private openSheet(eyebrow: string, title: string, body: string, foot: string): void {
    this.sheetEyebrow.textContent = eyebrow;
    this.sheetTitle.textContent = title;
    this.sheetBody.innerHTML = body;
    this.sheetFoot.innerHTML = foot;
    this.layer.hidden = false;
    const close = this.layer.querySelector<HTMLButtonElement>('#sheet-close');
    close?.focus();
  }

  destroy(): void {
    window.clearTimeout(this.toastTimer);
    this.unsubscribeDevice?.();
    this.unsubscribeDevice = null;
    this.root.innerHTML = '';
  }
}