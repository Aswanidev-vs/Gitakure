import { test, expect } from '@playwright/test';

type Errors = string[];

function watch(page: import('@playwright/test').Page, errors: Errors): void {
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(`console: ${m.text()}`);
  });
}

test.describe('desktop', () => {
  test('boots to the title and starts a world without touch controls', async ({ page }) => {
    const errors: Errors = [];
    watch(page, errors);
    await page.goto('/');
    await page.locator('.menu__item', { hasText: 'New world' }).waitFor({ timeout: 15000 });
    await page.locator('.menu__item', { hasText: 'New world' }).click();
    await page.locator('.hud').waitFor({ timeout: 15000 });
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.locator('.mc')).toHaveCount(0);
    await expect(page.locator('#screen-layer')).toHaveClass(/is-hidden/);
    expect(errors, errors.join('\n')).toHaveLength(0);
  });
});

test.describe('touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('mounts the stick and action button only on touch', async ({ page }) => {
    const errors: Errors = [];
    watch(page, errors);
    await page.goto('/');
    await page.locator('.menu__item', { hasText: 'New world' }).waitFor({ timeout: 15000 });
    await page.locator('.menu__item', { hasText: 'New world' }).click();
    await page.locator('.hud').waitFor({ timeout: 15000 });
    await expect(page.locator('.mc')).toBeVisible();
    await expect(page.locator('.mc-stick')).toBeVisible();
    await expect(page.locator('.mc-btn--interact')).toBeVisible();
    expect(errors, errors.join('\n')).toHaveLength(0);
  });
});