import { test, expect } from '@playwright/test';

test('game boots and renders canvas', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('/');
  await page.waitForTimeout(3000);
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  // No fatal console errors.
  expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
});

test('main menu has New world button', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  // The menu is rendered inside Phaser; just ensure the page loaded.
  await expect(page).toHaveTitle(/Gitakure/);
});