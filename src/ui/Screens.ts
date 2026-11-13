/**
 * Full-screen DOM screens: loading and title.
 *
 * The pixel backdrop is drawn by Phaser underneath; this layer supplies the
 * typography and the menu, which need to stay crisp at any window size.
 */

import { device } from '@/core/Device';
import { bindSettingsForm, settingsFormHtml } from './settingsForm';

export interface MenuState {
  hasSave: boolean;
  saveLabel: string;
}

export interface MenuActions {
  onContinue: () => void;
  onNew: () => void;
  onSettings: () => void;
  onAbout: () => void;
}

const HINTS = {
  desktop: 'WASD or arrows to walk · E to interact · Esc for menu',
  touch: 'Stick to walk · Run to hurry · Action to interact',
};

export class Screens {
  private readonly root: HTMLElement;
  private unsubscribe: (() => void) | null = null;
  private sheetOpen = false;
  private actions: MenuActions | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  showLoading(): void {
    this.sheetOpen = false;
    this.root.innerHTML = `
      <div class="screen screen--loading">
        <div class="brand">
          <div class="brand__rule"></div>
          <h1 class="brand__title">Gitakure</h1>
          <p class="brand__sub">A countryside that remembers your code</p>
        </div>
        <div class="loader">
          <div class="loader__track"><span class="loader__fill" id="load-fill" style="width:4%"></span></div>
          <div class="loader__status" id="load-status">Reading the seed</div>
        </div>
      </div>`;
    this.root.classList.remove('is-hidden');
  }

  setLoading(progress: number, label: string): void {
    const fill = this.root.querySelector<HTMLElement>('#load-fill');
    const status = this.root.querySelector<HTMLElement>('#load-status');
    if (fill) fill.style.width = `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`;
    if (status && label) status.textContent = label;
  }

  showMenu(state: MenuState, actions: MenuActions): void {
    this.actions = actions;
    this.sheetOpen = false;
    this.root.innerHTML = `
      <div class="screen screen--menu">
        <div class="brand">
          <div class="brand__rule"></div>
          <h1 class="brand__title">Gitakure</h1>
          <p class="brand__sub">A countryside that remembers your code</p>
        </div>
        <nav class="menu" aria-label="Main menu">
          <button type="button" class="menu__item" data-act="continue" ${state.hasSave ? '' : 'disabled'}>
            <span class="menu__label">Continue</span>
            <span class="menu__meta">${state.hasSave ? state.saveLabel : 'No world yet'}</span>
          </button>
          <button type="button" class="menu__item" data-act="new">
            <span class="menu__label">New world</span>
            <span class="menu__meta">Begin at the village gate</span>
          </button>
          <button type="button" class="menu__item" data-act="settings">
            <span class="menu__label">Settings</span>
            <span class="menu__meta">Sound, motion, controls</span>
          </button>
          <button type="button" class="menu__item" data-act="about">
            <span class="menu__label">About</span>
            <span class="menu__meta">What this valley is</span>
          </button>
        </nav>
        <footer class="screen__foot">
          <span class="hint" id="menu-hint">${device.isTouch() ? HINTS.touch : HINTS.desktop}</span>
          <span class="hint hint--dim">v0.3 · an offline world</span>
        </footer>
      </div>`;
    this.root.classList.remove('is-hidden');

    const click = (act: string): void => {
      if (!this.actions) return;
      if (act === 'continue') this.actions.onContinue();
      else if (act === 'new') this.actions.onNew();
      else if (act === 'settings') this.showSettings();
      else if (act === 'about') this.showAbout();
    };
    this.root.querySelectorAll<HTMLButtonElement>('.menu__item').forEach((btn) => {
      btn.addEventListener('click', () => click(btn.dataset.act ?? ''));
    });

    this.unsubscribe = device.subscribe(() => {
      const hint = this.root.querySelector('#menu-hint');
      if (hint) hint.textContent = device.isTouch() ? HINTS.touch : HINTS.desktop;
    });

    const first = this.root.querySelector<HTMLButtonElement>('.menu__item:not([disabled])');
    first?.focus();
  }

  private openSheet(eyebrow: string, title: string, body: string): void {
    const existing = this.root.querySelector('.sheet-layer');
    if (existing) existing.remove();
    const layer = document.createElement('div');
    layer.className = 'sheet-layer';
    layer.innerHTML = `
      <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="screen-sheet-title">
        <header class="sheet__head">
          <div>
            <div class="sheet__eyebrow">${eyebrow}</div>
            <h2 class="sheet__title" id="screen-sheet-title">${title}</h2>
          </div>
          <button class="sheet__close" type="button" aria-label="Close">×</button>
        </header>
        <div class="sheet__body">${body}</div>
        <footer class="sheet__foot"></footer>
      </section>`;
    this.root.appendChild(layer);
    this.sheetOpen = true;
    const close = (): void => {
      layer.remove();
      this.sheetOpen = false;
      this.root.querySelector<HTMLButtonElement>('.menu__item:not([disabled])')?.focus();
    };
    layer.querySelector('.sheet__close')!.addEventListener('click', close);
    layer.addEventListener('pointerdown', (e) => {
      if (e.target === layer) close();
    });
    layer.querySelector<HTMLElement>('.sheet__close')?.focus();
  }

  showSettings(): void {
    this.openSheet('Settings', 'Make it yours', settingsFormHtml());
    bindSettingsForm(this.root, () => undefined);
  }

  showAbout(): void {
    this.openSheet(
      'About',
      'A valley that remembers',
      `<div class="about">
        <p><b>Gitakure</b> is a quiet countryside RPG whose valley grows from a real GitHub history.</p>
        <p>Contributions become paths and plantings. Active stretches become blossom and full paddy. New repositories become project stones at the edge of the village. Nothing is destroyed by a quiet month.</p>
        <p>Every tile, tree, roof and face is drawn in code from one palette, so the game works offline and every pixel is reproducible.</p>
        <p class="about__meta">Phaser · TypeScript · the GitHub API</p>
      </div>`,
    );
  }

  hide(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.root.innerHTML = '';
    this.root.classList.add('is-hidden');
    this.sheetOpen = false;
  }

  isVisible(): boolean {
    return !this.root.classList.contains('is-hidden');
  }

  handleKey(event: KeyboardEvent): boolean {
    if (event.key === 'Escape' && this.sheetOpen) {
      const close = this.root.querySelector<HTMLButtonElement>('.sheet-layer .sheet__close');
      close?.click();
      return true;
    }
    return false;
  }
}