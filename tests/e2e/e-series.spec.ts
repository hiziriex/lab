import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { E_SERIES, formatSeriesForCopy, type ESeriesName } from '../../src/lib/e-series';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('全標準値、共通値の行、コピー成功・失敗・再試行', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          document.documentElement.dataset.copied = text;
          return Promise.resolve();
        },
      },
    });
  });
  await page.goto('tools/e-series/');
  const main = page.getByRole('table', {
    name: 'E3〜E96の標準値。各行はE24に近い値のグループです。',
  });
  await expect(main.locator('tbody tr')).toHaveCount(24);
  for (const name of Object.keys(E_SERIES) as ESeriesName[]) {
    if (name !== 'E192') {
      const values = await main.locator(`td[data-series="${name}"]`).allTextContents();
      expect(values.filter((v) => v.trim()).map(Number)).toEqual(E_SERIES[name].values);
    }
    await page.getByRole('button', { name: `${name}をカンマ区切りでコピー` }).click();
    await expect(page.locator('html')).toHaveAttribute('data-copied', formatSeriesForCopy(name));
    await expect(
      page.getByRole('status').filter({ hasText: `${name}をコピーしました` }),
    ).toBeVisible();
  }
  const row = main.locator('tbody tr').nth(3);
  await expect(row.locator('[data-series="E24"]')).toHaveText('13');
  await expect(row.locator('[data-series="E96"]', { hasText: /^130$/ })).toHaveCount(1);
  const e192 = page.getByRole('table', { name: 'E192の全192標準値' });
  await expect(e192.locator('td')).toHaveCount(192);
  const values = await e192.locator('td').allTextContents();
  expect(values.map(Number).sort((a, b) => a - b)).toEqual(E_SERIES.E192.values);
  await page.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error('denied'));
  });
  const copy = page.getByRole('button', { name: 'E24をカンマ区切りでコピー' });
  await copy.click();
  await expect(
    page.getByRole('status').filter({ hasText: 'E24をコピーできませんでした' }),
  ).toBeVisible();
  await page.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.resolve();
  });
  await copy.click();
  await expect(page.getByRole('status').filter({ hasText: 'E24をコピーしました' })).toBeVisible();
  await expect(copy.locator('.lucide-check')).toBeVisible();
  await expect(copy.locator('.lucide-copy')).toBeVisible({ timeout: 4000 });
});

test('表内scroll・sticky header・keyboard・ページのoverflow', async ({ page }) => {
  await page.goto('tools/e-series/');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 412, 768, 1440]) {
    await page.setViewportSize({ width, height: 915 });
    for (const region of await page.getByRole('region', { name: /スクロール領域/ }).all()) {
      await region.evaluate((element) => {
        element.scrollLeft = 0;
        element.scrollTop = 0;
      });
      await region.focus();
      if (width < 768) {
        await page.keyboard.press('ArrowRight');
        await expect
          .poll(() => region.evaluate((element) => element.scrollLeft))
          .toBeGreaterThan(0);
      }
      await region.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
        element.scrollTop = 200;
      });
      const top = await region.evaluate((element) => element.getBoundingClientRect().top);
      const header = await region.locator('th').last().boundingBox();
      expect(header!.y).toBeCloseTo(top + 1, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`@a11y E系列 ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('tools/e-series/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('button', { name: 'E24をカンマ区切りでコピー' })).toBeEnabled();
    // OS themeのReact反映完了を待ってからcontrastを測る。
    await expect(page.locator('.radix-themes')).toHaveClass(new RegExp(colorScheme));
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('JavaScript無効でも全系列を参照できる', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}tools/e-series/`);
  await expect(page.getByRole('table')).toHaveCount(2);
  await expect(page.getByRole('table').last().locator('td')).toHaveCount(192);
  await context.close();
});
