import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
// Panel画像にsticky headerが写り込まないよう、撮影中だけinline属性で透明化する。
// CSPのstyle-src-elemを維持し、通常表示とaxeの検証には影響させない。
async function capturePanel(page: Page, path: string) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  const viewport = page.viewportSize();
  const bounds = await page.locator('#graph').boundingBox();
  const expanded = !!(viewport && bounds && bounds.height > viewport.height - 64);
  // Mobileのelement撮影はviewport外を未描画にする場合があるため、高さだけ一時確保する。
  if (expanded && viewport && bounds)
    await page.setViewportSize({ width: viewport.width, height: Math.ceil(bounds.height) + 64 });
  await page.locator('#graph').evaluate((element) =>
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top - 56,
      behavior: 'instant',
    }),
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const selector = '[class*="topbar"], body > a[href="#main"]';
  const originals = await page.evaluate(
    (selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector), (element) => {
        const original = element.getAttribute('style');
        element.style.opacity = '0';
        return original;
      }),
    selector,
  );
  try {
    await page.locator('#graph').screenshot({ path, animations: 'disabled', scale: 'device' });
  } finally {
    await page.evaluate(
      ({ selector, originals }) => {
        document.querySelectorAll<HTMLElement>(selector).forEach((element, i) => {
          const original = originals[i];
          if (original == null) element.removeAttribute('style');
          else element.setAttribute('style', original);
        });
      },
      { selector, originals },
    );
    if (expanded && viewport) await page.setViewportSize(viewport);
    await page.locator('#graph').evaluate((element) =>
      window.scrollTo({
        top: window.scrollY + element.getBoundingClientRect().top - 56,
        behavior: 'instant',
      }),
    );
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  }
}
async function showPanel(page: Page) {
  await page.locator('#graph').evaluate((element) =>
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top - 64,
      behavior: 'instant',
    }),
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}
const graphName = /注目候補のVin–Voutグラフ|比較候補のVin–Vout誤差グラフ/;
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('tools/voltage-divider/');
  await expect(page.locator('astro-island[component-url*="VoltageDivider"]')).not.toHaveAttribute(
    'ssr',
  );
  await mkdir('review-artifacts/pr16-drag', { recursive: true });
});
async function setVin(page: Page, key: 'A' | 'B', text: string) {
  const input = page.getByRole('spinbutton', { name: `${key}のVin (V)` });
  await input.fill(text);
  await input.press('Enter');
}
async function plotClick(page: Page, fraction: number, touch: boolean) {
  const svg = page.getByRole('img', { name: graphName }).locator('svg');
  const box = (await svg.boundingBox())!;
  const position = { x: 60 + (box.width - 80) * fraction, y: 110 };
  await showPanel(page);
  const current = (await svg.boundingBox())!;
  if (touch) await page.touchscreen.tap(current.x + position.x, current.y + position.y);
  else await page.mouse.click(current.x + position.x, current.y + position.y);
}
test('グラフは操作時だけ読み込み、候補・範囲・基準値と連動する', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  const loaded = () =>
    page.evaluate(
      () =>
        performance
          .getEntriesByType('resource')
          .filter((r) => /DividerSweepChart.*\.js/.test(r.name)).length,
    );
  expect(await loaded()).toBe(0);
  await page.getByRole('button', { name: 'グラフを表示' }).click();
  const graph = page.getByRole('img', { name: graphName });
  await expect(graph.locator('svg')).toBeVisible();
  expect(await loaded()).toBeGreaterThan(0);
  await expect(page.locator('#graph-heading')).toHaveText('グラフ閉じる −');
  await expect(page.getByRole('textbox', { name: 'Vin min' })).toHaveValue('4');
  await expect(page.getByRole('textbox', { name: 'Vin max' })).toHaveValue('6');
  await expect(graph.locator('svg')).toContainText('Target 3.3 V');
  await expect(graph.locator('svg')).toContainText('5 V');
  await expect(page.getByRole('list', { name: 'グラフの候補' })).toHaveCount(0);
  await expect(page.getByText('グラフの数値', { exact: true })).toHaveCount(0);
  await page.getByRole('checkbox', { name: '候補 2 を比較' }).check();
  await expect(page.getByRole('combobox', { name: '表示候補', exact: true })).toHaveValue('1');
  await page.getByRole('radio', { name: '候補比較', exact: true }).check();
  await expect(page.getByRole('combobox', { name: '表示候補', exact: true })).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'グラフの候補' }).getByRole('listitem')).toHaveCount(
    2,
  );
  await expect(graph.locator('svg')).toContainText('0 mV');
  await page.getByRole('textbox', { name: 'Vin min' }).fill('0');
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
  await expect(page.getByText('現在のVinはグラフの範囲外です。')).toBeVisible();
  await page.getByRole('textbox', { name: '目標電圧 Vout' }).fill('4');
  await page.getByRole('button', { name: '計算', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Vin min' })).toHaveValue('9.6');
  await expect(graph.locator('svg')).toContainText('Target 4 V');
  await page.getByRole('button', { name: 'リセット' }).click();
  await expect(page.getByRole('textbox', { name: 'Vin min' })).toHaveValue('4');
  await page.getByRole('radio', { name: '候補比較', exact: true }).check();
  await page.getByRole('checkbox', { name: '候補 1 を比較' }).uncheck();
  await expect(page.getByText(/候補表で比較する抵抗候補を選択/)).toBeVisible();
  expect(errors).toEqual([]);
});
test('cursor単独・連動・範囲制限・keyboard・direct input・削除と同時表示', async ({
  page,
}, testInfo) => {
  const toggle = page.getByRole('button', { name: 'グラフを表示' });
  await toggle.focus();
  await toggle.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(toggle).toHaveCSS('outline-offset', '-4px');
  await toggle.press('Enter');
  const graph = page.getByRole('img', { name: graphName });
  await expect(graph.locator('svg')).toBeVisible();
  const select = page.getByRole('combobox', { name: '表示候補', exact: true });
  await page
    .getByRole('checkbox', { name: '候補 3 を比較' })
    .locator('..')
    .locator('..')
    .locator('td')
    .nth(1)
    .click();
  await expect(select).toHaveValue('3');
  await expect(page.getByRole('checkbox', { name: '候補 3 を比較' })).not.toBeChecked();
  await select.selectOption('2');
  const aToggle = page.getByRole('button', { name: 'Aカーソルを選択' });
  const bToggle = page.getByRole('button', { name: 'Bカーソルを選択' });
  const a = page.getByRole('spinbutton', { name: 'AのVin (V)' });
  const b = page.getByRole('spinbutton', { name: 'BのVin (V)' });
  await plotClick(page, 0.8, !!testInfo.project.use.hasTouch);
  if (testInfo.project.use.hasTouch) await expect(page.getByLabel('hover情報')).toHaveCount(0);
  expect(Number(await a.inputValue())).toBeCloseTo(5.6, 1);
  await expect(aToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(bToggle).toHaveAttribute('aria-pressed', 'true');
  await plotClick(page, 0.2, !!testInfo.project.use.hasTouch);
  expect(Number(await b.inputValue())).toBeCloseTo(4.4, 1);
  expect(Number(await a.inputValue())).toBeCloseTo(5.6, 1);
  await aToggle.click();
  const delta = Number(await b.inputValue()) - Number(await a.inputValue());
  await plotClick(page, 0.6, !!testInfo.project.use.hasTouch);
  expect(Number(await b.inputValue()) - Number(await a.inputValue())).toBeCloseTo(delta, 3);
  await plotClick(page, 0.02, !!testInfo.project.use.hasTouch);
  expect(Number(await b.inputValue())).toBeCloseTo(4, 3);
  await graph.focus();
  await graph.press('ArrowLeft');
  expect(Number(await b.inputValue())).toBeCloseTo(4, 3);
  await setVin(page, 'A', '5.600877192982456');
  await setVin(page, 'B', '4.4');
  await expect(a).toHaveValue('5.6009');
  await a.focus();
  await a.press('Tab');
  await expect(a).toHaveValue('5.6009');
  await aToggle.click();
  await bToggle.click();
  const previous = await a.inputValue();
  await graph.focus();
  await graph.press('ArrowRight');
  await expect(a).toHaveValue(previous);
  await aToggle.click();
  await graph.focus();
  await graph.press('ArrowRight');
  await expect(a).toHaveValue('5.6209');
  await expect(b).toHaveValue('4.4000');
  await setVin(page, 'A', '5.600877192982456');
  if (!testInfo.project.use.hasTouch) {
    await showPanel(page);
    const box = (await graph.locator('svg').boundingBox())!;
    await page.mouse.move(box.x + 60 + (box.width - 80) * 0.333, box.y + 110);
    await expect(page.getByLabel('hover情報')).toContainText('Vin');
    await expect(page.getByLabel('hover情報')).toContainText('Vout');
  }
  const results = page.getByRole('complementary', { name: 'カーソルと測定結果' });
  await page.locator('#graph').scrollIntoViewIfNeeded();
  const graphBox = (await graph.boundingBox())!;
  const resultBox = (await results.boundingBox())!;
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    expect(resultBox.x).toBeGreaterThan(graphBox.x + graphBox.width);
    expect(graphBox.width / graphBox.height).toBeLessThan(1.6);
    expect(graphBox.width).toBeLessThan(650);
    expect(graphBox.y).toBeGreaterThanOrEqual(0);
    expect(
      Math.max(graphBox.y + graphBox.height, resultBox.y + resultBox.height),
    ).toBeLessThanOrEqual(page.viewportSize()!.height);
  } else {
    expect(resultBox.y).toBeGreaterThanOrEqual(graphBox.y + graphBox.height);
    expect(resultBox.height).toBeLessThan(420);
  }
  if (['chromium', 'android'].includes(testInfo.project.name)) {
    const device = testInfo.project.name === 'chromium' ? 'desktop' : 'pixel7';
    await capturePanel(page, `review-artifacts/pr16-drag/${device}-output-ab.png`);
    await page.screenshot({
      path: `review-artifacts/pr16-drag/${device}-output-viewport.png`,
      animations: 'disabled',
      scale: 'device',
    });
  }
  await page.getByRole('checkbox', { name: '候補 2 を比較' }).check();
  await page.getByRole('radio', { name: '候補比較', exact: true }).check();
  await expect(select).toHaveCount(0);
  await expect(page.getByRole('table', { name: '候補比較の測定結果' })).toContainText(
    'ΔError / ΔVin',
  );
  await expect(page.locator('#graph')).not.toContainText('ΔVout');
  if (!testInfo.project.use.hasTouch) {
    await showPanel(page);
    const box = (await graph.locator('svg').boundingBox())!;
    await page.mouse.move(box.x + 60 + (box.width - 80) * 0.4, box.y + 110);
    await expect(page.getByLabel('hover情報')).toContainText('#1 Vout誤差');
    await expect(page.getByLabel('hover情報')).toContainText('#2 Vout誤差');
  }
  if (['chromium', 'android'].includes(testInfo.project.name)) {
    const device = testInfo.project.name === 'chromium' ? 'desktop' : 'pixel7';
    await capturePanel(page, `review-artifacts/pr16-drag/${device}-comparison-ab.png`);
  }
  await setVin(page, 'B', '5.600877192982456');
  await expect(
    page.getByRole('table', { name: '候補比較の測定結果' }).getByRole('row').nth(1),
  ).toContainText('—');
  await page.getByRole('button', { name: 'Aカーソルを削除' }).click();
  await expect(a).toHaveValue('');
  await expect(b).not.toHaveValue('');
  await page.getByRole('button', { name: 'Bカーソルを削除' }).click();
  await expect(b).toHaveValue('');
  await page.getByRole('button', { name: 'グラフを閉じる' }).click();
  await expect(page.locator('#sweep-content')).toBeHidden();
});
test('@a11y compact graph light / dark・全候補・320px・範囲エラー', async ({ page }, testInfo) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.reload();
    await expect(page.locator('astro-island[component-url*="VoltageDivider"]')).not.toHaveAttribute(
      'ssr',
    );
    await page.getByRole('button', { name: 'グラフを表示' }).click();
    await expect(page.getByRole('img', { name: graphName }).locator('svg')).toBeVisible();
    await expect(page.locator('[class*=plot]').first()).toHaveCSS(
      'background-color',
      colorScheme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(16, 18, 20)',
    );
    for (const mode of ['出力特性', '候補比較']) {
      await page.getByRole('radio', { name: mode, exact: true }).check();
      if (mode === '候補比較')
        for (const rank of [2, 3, 4, 5])
          await page.getByRole('checkbox', { name: `候補 ${rank} を比較` }).check();
      await setVin(page, 'A', '5.6');
      await setVin(page, 'B', '4.4');
      await page.getByRole('button', { name: 'Bカーソルを選択' }).click();
      await showPanel(page);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      if (['chromium', 'android'].includes(testInfo.project.name))
        await capturePanel(
          page,
          `review-artifacts/pr16-drag/${testInfo.project.name}-${colorScheme}-${mode === '出力特性' ? 'output' : 'comparison'}.png`,
        );
    }
  }
  await page.getByRole('textbox', { name: 'Vin min' }).fill('-1');
  await page.getByRole('textbox', { name: 'Vin min' }).press('Tab');
  await showPanel(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('textbox', { name: 'Vin min' }).fill('4');
  if (['chromium', 'android'].includes(testInfo.project.name)) {
    await page.setViewportSize({ width: 320, height: 915 });
    await expect(page.getByRole('img', { name: graphName }).locator('svg')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await capturePanel(page, `review-artifacts/pr16-drag/${testInfo.project.name}-320.png`);
  }
});

test('mouse / touch cursor dragはlive更新し、連動・端・direct inputと共存する', async ({
  page,
  context,
}, testInfo) => {
  await page.getByRole('button', { name: 'グラフを表示' }).click();
  const graph = page.getByRole('img', { name: graphName });
  await expect(graph.locator('svg')).toBeVisible();
  await setVin(page, 'A', '5.6');
  await setVin(page, 'B', '4.4');
  await showPanel(page);
  const a = page.getByRole('spinbutton', { name: 'AのVin (V)' });
  const b = page.getByRole('spinbutton', { name: 'BのVin (V)' });
  const cdp = testInfo.project.name === 'android' ? await context.newCDPSession(page) : null;
  async function drag(key: 'a' | 'b', dx: number, live?: () => Promise<void>) {
    await showPanel(page);
    const handle = page.locator(`[data-cursor-handle="${key}"]`);
    const box = (await handle.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(24);
    await expect(handle).toHaveCSS('touch-action', 'none');
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    if (cdp) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + dx, y }],
      });
      await live?.();
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y, { steps: 5 });
      await live?.();
      await page.mouse.up();
    }
  }
  await drag('a', -12, async () => {
    await expect.poll(async () => Number(await a.inputValue())).toBeLessThan(5.6);
    await expect(b).toHaveValue('4.4000');
    await expect(page.getByRole('table', { name: '出力特性の測定結果' })).toContainText('ΔVout');
  });
  await expect(page.getByRole('button', { name: 'Aカーソルを選択' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await drag('b', 12, async () => {
    await expect.poll(async () => Number(await b.inputValue())).toBeGreaterThan(4.4);
  });
  await expect(page.getByRole('button', { name: 'Aカーソルを選択' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.getByRole('button', { name: 'Aカーソルを選択' }).click();
  await setVin(page, 'A', '5.6');
  await setVin(page, 'B', '4.4');
  await drag('b', -10, async () => {
    await expect.poll(async () => Number(await a.inputValue())).toBeLessThan(5.6);
    expect(Number(await b.inputValue()) - Number(await a.inputValue())).toBeCloseTo(-1.2, 3);
  });
  await drag('a', 400);
  await expect(a).toHaveValue('6.0000');
  await expect(b).toHaveValue('4.8000');
  await drag('b', -400);
  await expect(a).toHaveValue('5.2000');
  await expect(b).toHaveValue('4.0000');
  await setVin(page, 'A', '5.123456789');
  await expect(a).toHaveValue('5.1235');
  await setVin(page, 'B', '5.123456789');
  await expect(b).toHaveValue('5.1235');
  const boxes = await Promise.all(
    ['a', 'b'].map((key) => page.locator(`[data-cursor-handle="${key}"]`).boundingBox()),
  );
  expect(boxes[0]!.width).toBeGreaterThanOrEqual(24);
  expect(boxes[1]!.width).toBeGreaterThanOrEqual(24);
  expect(boxes[0]!.x + boxes[0]!.width).toBeCloseTo(boxes[1]!.x, 1);
  await page.getByRole('button', { name: 'Aカーソルを削除' }).click();
  await expect(page.locator('[data-cursor-handle="a"]')).toHaveCount(0);
  await expect(b).toHaveValue('5.1235');
  await cdp?.detach();
});
