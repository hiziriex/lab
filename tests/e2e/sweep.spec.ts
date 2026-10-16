import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('tools/voltage-divider/');
  await expect(page.locator('astro-island[component-url*="VoltageDivider"]')).not.toHaveAttribute(
    'ssr',
  );
});
test('グラフは操作時だけ読み込み、候補・範囲・基準値と連動する', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  const loaded = () =>
    page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((r) => r.name)
        .filter((url) => /DividerSweepChart.*\.js/.test(url)),
    );
  expect(await loaded()).toEqual([]);
  await page.getByRole('button', { name: 'グラフを表示' }).click();
  const graph = page.getByRole('img', { name: '選択した抵抗候補のVin–Voutグラフ' });
  await expect(graph.locator('svg')).toBeVisible();
  expect((await loaded()).length).toBeGreaterThan(0);
  await expect(page.getByRole('textbox', { name: 'Vin min' })).toHaveValue('4');
  await expect(page.getByRole('textbox', { name: 'Vin max' })).toHaveValue('6');
  await expect(graph.locator('svg')).toContainText('Vin (V)');
  await expect(graph.locator('svg')).toContainText('Vout (V)');
  await expect(page.locator('#sweep-references')).toContainText('3.3 V');
  await page.getByRole('checkbox', { name: '候補 2 を比較' }).check();
  await expect(page.getByRole('list', { name: 'グラフの候補' }).getByRole('listitem')).toHaveCount(
    2,
  );
  for (const color of ['#145fa0', '#b42332'])
    await expect(graph.locator(`path[stroke="${color}"]`)).toBeVisible();
  await page.getByRole('textbox', { name: 'Vin min' }).fill('0');
  await page.getByRole('textbox', { name: 'Vin max' }).fill('10');
  await page.getByText('グラフの数値', { exact: true }).click();
  const numbers = page.getByRole('region', { name: 'グラフの数値表（横スクロール可能）' });
  await expect(numbers.getByRole('columnheader', { name: 'Vin 0 V' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Vin max' }).fill('bad');
  await page.getByRole('textbox', { name: 'Vin max' }).press('Tab');
  await expect(page.getByRole('textbox', { name: 'Vin max' })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(graph).toHaveCount(0);
  await expect(page.getByRole('button', { name: '計算', exact: true })).toBeEnabled();
  await page.getByRole('textbox', { name: 'Vin max' }).fill('10');
  await page.getByRole('button', { name: 'グラフを閉じる' }).click();
  await expect(graph).toHaveCount(0);
  await page.getByRole('button', { name: 'グラフを表示' }).click();
  await expect(page.getByRole('textbox', { name: 'Vin max' })).toHaveValue('10');
  await page.getByRole('textbox', { name: '入力電圧 Vin' }).fill('12');
  await expect(page.locator('#sweep-references')).toContainText('12 V');
  await expect(page.getByText('現在のVinはグラフの範囲外です。')).toBeVisible();
  await page.getByRole('textbox', { name: '目標電圧 Vout' }).fill('4');
  await expect(page.locator('#sweep-references')).toContainText('4 V');
  await page.getByRole('button', { name: '計算', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Vin min' })).toHaveValue('9.6');
  await expect(page.getByRole('list', { name: 'グラフの候補' }).getByRole('listitem')).toHaveCount(
    1,
  );
  await page.getByRole('button', { name: 'リセット' }).click();
  await expect(page.getByRole('textbox', { name: 'Vin min' })).toHaveValue('4');
  await page.getByRole('checkbox', { name: '候補 1 を比較' }).uncheck();
  await expect(page.getByText(/候補表で比較する抵抗候補を選択/)).toBeVisible();
  expect(errors).toEqual([]);
});
test('@a11y グラフのlight / dark・範囲エラー・狭い画面とreview画像', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: 'グラフを表示' }).click();
  await page.getByRole('checkbox', { name: '候補 2 を比較' }).check();
  await page.getByRole('checkbox', { name: '候補 3 を比較' }).check();
  const graph = page.getByRole('img', { name: '選択した抵抗候補のVin–Voutグラフ' });
  await expect(graph.locator('svg')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#graph').scrollIntoViewIfNeeded();
  await mkdir('review-artifacts', { recursive: true });
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    // axeは各OS themeで初回読み込みを検証し、offscreen数式のmedia切替と計測を競合させない。
    await page.reload();
    await expect(page.locator('astro-island[component-url*="VoltageDivider"]')).not.toHaveAttribute(
      'ssr',
    );
    await page.getByRole('button', { name: 'グラフを表示' }).click();
    await page.getByRole('checkbox', { name: '候補 2 を比較' }).check();
    await page.getByRole('checkbox', { name: '候補 3 を比較' }).check();
    await expect(graph.locator('svg')).toBeVisible();
    await expect(page.locator('.radix-themes')).toHaveClass(new RegExp(colorScheme));
    await expect(page.locator('.radix-themes')).toHaveCSS(
      'color',
      colorScheme === 'dark' ? 'rgb(237, 238, 240)' : 'rgb(28, 32, 36)',
    );
    await expect(
      graph.locator(`path[stroke="${colorScheme === 'dark' ? '#1968ad' : '#145fa0'}"]`),
    ).toBeVisible();
    // media変更のstyleが子要素とSVGへ反映され、次のpaintを終えてからaxeを実行する。
    await expect(page.locator('#graph label').first()).toHaveCSS(
      'color',
      colorScheme === 'dark' ? 'rgb(237, 238, 240)' : 'rgb(28, 32, 36)',
    );
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    if (['chromium', 'android'].includes(testInfo.project.name)) {
      await graph.scrollIntoViewIfNeeded();
      await page.locator('#graph').screenshot({
        path: `review-artifacts/sweep-${testInfo.project.name}-${colorScheme}.png`,
        animations: 'disabled',
        scale: 'device',
      });
    }
  }
  await page.getByRole('textbox', { name: 'Vin min' }).fill('-1');
  await page.getByRole('textbox', { name: 'Vin min' }).press('Tab');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('textbox', { name: 'Vin min' }).fill('4');
  if (['chromium', 'android'].includes(testInfo.project.name)) {
    await page.setViewportSize({ width: 320, height: 915 });
    await expect(graph.locator('svg')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('#graph').screenshot({
      path: `review-artifacts/sweep-${testInfo.project.name}-320.png`,
      animations: 'disabled',
      scale: 'device',
    });
  }
});
