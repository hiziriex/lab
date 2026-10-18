import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { E_SERIES, formatSeriesForCopy, type ESeriesName } from '../../src/lib/e-series';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('全標準値の昇順配置、コピー成功・失敗・再試行', async ({ page }) => {
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
    name: 'E3〜E96の標準値。E24を基準とする24行の比較表。',
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
  expect((await row.locator('[data-series="E96"]').allTextContents()).map(Number)).toEqual([
    133, 137, 140, 143,
  ]);
  const e192 = page.getByRole('table', { name: 'E192の全192標準値' });
  await expect(e192.locator('td')).toHaveCount(192);
  const values = await e192.locator('td').allTextContents();
  expect(values.map(Number)).toEqual(E_SERIES.E192.values);
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

test('24基準行・固定列数・rowspanと実際のセル境界', async ({ page }) => {
  await page.goto('tools/e-series/');
  await page.evaluate(() => document.fonts.ready);
  const main = page.getByRole('table').first();
  const rows = main.locator('tbody tr');
  await expect(rows).toHaveCount(24);
  for (const [name, span, count] of [
    ['E3', 8, 3],
    ['E6', 4, 6],
    ['E12', 2, 12],
  ] as const) {
    const cells = main.locator(`td[data-series="${name}"]`);
    await expect(cells).toHaveCount(count);
    for (let index = 0; index < count; index++) {
      const cell = cells.nth(index);
      await expect(cell).toHaveAttribute('rowspan', String(span));
      const box = (await cell.boundingBox())!;
      const first = (await rows.nth(index * span).boundingBox())!;
      const last = (await rows.nth(index * span + span - 1).boundingBox())!;
      expect(box.y).toBeCloseTo(first.y, 0);
      expect(box.y + box.height).toBeCloseTo(last.y + last.height, 0);
    }
  }
  await expect(main.locator('[data-series="E24"][rowspan]')).toHaveCount(0);
  await expect(main.locator('#heading-E48')).toHaveAttribute('colspan', '2');
  await expect(main.locator('#heading-E96')).toHaveAttribute('colspan', '4');
  for (const row of await rows.all()) {
    await expect(row.locator('[data-series="E24"]')).toHaveCount(1);
    await expect(row.locator('[data-series="E48"]')).toHaveCount(2);
    await expect(row.locator('[data-series="E96"]')).toHaveCount(4);
  }
  const grids = await rows.evaluateAll((elements) =>
    elements.map((row) =>
      [
        ...row.querySelectorAll('[data-series="E24"], [data-series="E48"], [data-series="E96"]'),
      ].map((cell) => ({
        x: cell.getBoundingClientRect().x,
        width: cell.getBoundingClientRect().width,
      })),
    ),
  );
  for (const grid of grids) expect(grid).toEqual(grids[0]);
  const e192Rows = page.getByRole('table').last().locator('tbody tr');
  await expect(e192Rows).toHaveCount(24);
  for (const row of await e192Rows.all()) await expect(row.locator('td')).toHaveCount(8);
  await expect(page.getByRole('table').last().locator('thead th')).toHaveCount(8);
});

test('表は自然な高さ・Mobile横scroll・keyboard・ページのoverflow', async ({ page }) => {
  await page.goto('tools/e-series/');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 412, 768, 1440]) {
    await page.setViewportSize({ width, height: 600 });
    for (const region of await page.getByRole('region', { name: /スクロール領域/ }).all()) {
      await region.evaluate((element) => {
        element.scrollLeft = 0;
      });
      await region.focus();
      if (width < 768) {
        await page.keyboard.press('ArrowRight');
        await expect
          .poll(() => region.evaluate((element) => element.scrollLeft))
          .toBeGreaterThan(0);
      }
      const metrics = await region.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
        element.scrollTop = 200;
        return {
          top: element.scrollTop,
          height: element.clientHeight,
          contentHeight: element.scrollHeight,
          tableHeight: element.querySelector('table')!.getBoundingClientRect().height,
          maxHeight: getComputedStyle(element).maxHeight,
        };
      });
      expect(metrics.top).toBe(0);
      expect(metrics.contentHeight).toBe(metrics.height);
      expect(metrics.height).toBeGreaterThanOrEqual(Math.floor(metrics.tableHeight));
      expect(metrics.maxHeight).toBe('none');
      expect(
        await region
          .locator('th')
          .first()
          .evaluate((element) => getComputedStyle(element).position),
      ).toBe('static');
      expect(
        await page.evaluate(
          (viewportWidth) => document.documentElement.scrollWidth <= viewportWidth,
          width,
        ),
      ).toBe(true);
    }
    expect(
      await page
        .locator('main *')
        .evaluateAll(
          (elements) =>
            elements.filter(
              (element) =>
                /^(auto|scroll)$/.test(getComputedStyle(element).overflowY) &&
                element.scrollHeight > element.clientHeight + 1,
            ).length,
        ),
    ).toBe(0);
  }
  const region = page.getByRole('region', { name: 'E3からE96の比較表・スクロール領域' });
  await region.focus();
  await page.evaluate(() => scrollTo(0, 0));
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  expect(await region.evaluate((element) => element.scrollTop)).toBe(0);
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
