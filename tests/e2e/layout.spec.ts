import { expect, test } from '@playwright/test';

const routes = [
  '/home',
  '/learn',
  '/ai-tutor',
  '/vocab-book',
  '/social',
  '/shop',
  '/analytics',
] as const;

test('every main screen stays above the bottom navigation', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);

    const layout = await page.evaluate(() => {
      const main = document.querySelector('main');
      const nav = document.querySelector('nav');
      const mainBox = main?.getBoundingClientRect();
      const navBox = nav?.getBoundingClientRect();

      return {
        mainBottom: mainBox?.bottom ?? 0,
        navTop: navBox?.top ?? 0,
        horizontalOverflow:
          document.documentElement.scrollWidth - window.innerWidth,
      };
    });

    expect(layout.mainBottom, route).toBeLessThanOrEqual(layout.navTop + 1);
    expect(layout.horizontalOverflow, route).toBeLessThanOrEqual(0);
  }
});

test('dungeon start button is visible and clickable above navigation', async ({ page }) => {
  await page.goto('/learn');

  const startButton = page.getByTestId('start-dungeon');
  await startButton.scrollIntoViewIfNeeded();

  const buttonBox = await startButton.boundingBox();
  const navBox = await page.locator('nav').boundingBox();
  expect(buttonBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(navBox!.y);

  await startButton.click();
  await expect(startButton).toBeHidden();
});
