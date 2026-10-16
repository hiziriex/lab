import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function waitForTool(page: Page) {
  // SSR の初期表示と Island の操作可能な状態を区別する。
  await expect(page.locator('astro-island[component-url*="VoltageDivider"]')).not.toHaveAttribute(
    'ssr',
  );
}
test.beforeEach(async ({ page }, testInfo) => {
  // review と同じく初回読み込み前に motion 設定を適用する。
  if (testInfo.title.includes('@visual')) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('tools/voltage-divider/');
  await waitForTool(page);
  await expect(page.getByRole('checkbox', { name: '候補 1 を比較' })).toBeChecked();
});
test('計算、未更新、単位、選択、リセット', async ({ page }) => {
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(5);
  const previous = await rows.first().innerText();
  await page.getByLabel('抵抗系列').selectOption('E24');
  await expect(page.getByText('未更新', { exact: true })).toBeVisible();
  expect(await rows.first().innerText()).toBe(previous);
  await page.getByRole('button', { name: '計算', exact: true }).click();
  await expect(page.getByText('未更新', { exact: true })).toHaveCount(0);
  await page.getByRole('checkbox', { name: '候補 2 を比較' }).click();
  await expect(page.getByRole('checkbox', { name: '候補 1 を比較' })).toBeChecked();
  await page.getByLabel('分圧電流 Idiv の単位').selectOption('');
  await expect(page.getByRole('textbox', { name: '分圧電流 Idiv を指定' })).toHaveValue('1');
  await page.getByRole('button', { name: 'リセット' }).click();
  await expect(page.getByLabel('抵抗系列')).toHaveValue('E12');
  await expect(page.getByLabel('分圧電流 Idiv の単位')).toHaveValue('m');
});
test('無効値は Enter でも計算しない、電流 OFF', async ({ page }) => {
  const vin = page.getByRole('textbox', { name: '入力電圧 Vin' });
  const before = await page.locator('tbody').innerText();
  await vin.fill('0');
  await vin.press('Enter');
  await expect(page.getByRole('button', { name: '計算', exact: true })).toBeDisabled();
  expect(await page.locator('tbody').innerText()).toBe(before);
  await vin.fill('5e0');
  await vin.press('Enter');
  await expect(page.getByText('未更新', { exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: '分圧電流 Idiv を指定' }).fill('invalid');
  await page.getByRole('checkbox', { name: '分圧電流 Idiv を指定' }).click();
  await expect(page.getByRole('button', { name: '計算', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '計算', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '分圧電流 Idiv を指定' })).toBeDisabled();
});
test('CSP と runtime error、ページ幅、ナビゲーション', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.reload();
  await waitForTool(page);
  await expect(page.getByRole('checkbox', { name: '候補 1 を比較' })).toBeChecked();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const results = await page.locator('#results').boundingBox();
  const graph = await page.locator('#graph').boundingBox();
  const formula = await page.locator('#formula').boundingBox();
  expect(graph!.y - (results!.y + results!.height)).toBeLessThan(100);
  expect(formula!.y - (graph!.y + graph!.height)).toBeLessThan(100);
  await page.getByRole('button', { name: 'ナビゲーションを開閉' }).click();
  if (isMobile) {
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'ナビゲーションを閉じる' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  } else await expect(page.locator('#desktop-navigation')).not.toBeVisible();
});
test('section nav はクリック時だけ hash を変更', async ({ page }) => {
  await page.locator('#formula').scrollIntoViewIfNeeded();
  expect(new URL(page.url()).hash).toBe('');
  const details = page.locator('.section-nav details');
  if ((await details.getAttribute('open')) === null)
    await page.locator('.section-nav summary').click();
  await page.getByRole('link', { name: '01 回路と入力' }).click();
  await expect(page).toHaveURL(/#input$/);
});
test('@a11y 入力・結果・dark・エラー', async ({ page }) => {
  // 初期結果の fade 中に一時的な opacity を contrast として測らない。
  await page.locator('table').evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  for (let rank = 2; rank <= 5; rank++) {
    const checkbox = page.getByRole('checkbox', { name: `候補 ${rank} を比較` });
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  }
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator('.radix-themes')).toHaveClass(new RegExp(colorScheme));
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  await page.getByRole('textbox', { name: '入力電圧 Vin' }).fill('0');
  await page.getByRole('textbox', { name: '入力電圧 Vin' }).blur();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test('@visual 初期状態', async ({ page }) => {
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('divider.png', {
    fullPage: true,
    animations: 'disabled',
    scale: 'device',
  });
});

test('mobile section nav は入力を遮らず、展開後も操作できる', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  const nav = page.getByRole('navigation', { name: 'ページ内ナビゲーション' });
  const unit = page.getByLabel('分圧電流 Idiv の単位');
  for (const expanded of [false, true]) {
    if (expanded) await nav.locator('summary').click();
    await unit.scrollIntoViewIfNeeded();
    await unit.focus();
    const box = await unit.boundingBox();
    const navBox = await nav.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(navBox!.y + navBox!.height);
    expect(
      await unit.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return element.contains(
          document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
        );
      }),
    ).toBe(true);
    await unit.selectOption(expanded ? 'm' : '');
    await expect(unit).toHaveValue(expanded ? 'm' : '');
  }
  await page.getByRole('link', { name: '01 回路と入力' }).click();
  await expect(nav.locator('details')).not.toHaveAttribute('open');
  await expect(page.getByRole('textbox', { name: '入力電圧 Vin' })).toBeInViewport();
});

test('mobile overlay の開閉で本文が移動せず、狭い viewport と scroll に追従する', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const nav = page.getByRole('navigation', { name: 'ページ内ナビゲーション' });
  const details = nav.locator('details');
  const summary = nav.locator('summary');
  const positions = () =>
    page
      .locator('h1, #input, #results, #formula')
      .evaluateAll((elements) =>
        elements.map(
          (element) =>
            Math.round((element.getBoundingClientRect().top + window.scrollY) * 100) / 100,
        ),
      );
  for (const width of [320, 412, 768]) {
    await page.setViewportSize({ width, height: 915 });
    await page.goto('tools/voltage-divider/');
    await waitForTool(page);
    await expect(page.getByRole('checkbox', { name: '候補 1 を比較' })).toBeChecked();
    // font / 回路画像の読み込みによる変化と、overlay 開閉の影響を分離する。
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (image) => image.decode()));
    });
    await expect(details).not.toHaveAttribute('open');
    const before = await positions();
    const collapsed = await nav.boundingBox();
    expect(await nav.evaluate((element) => getComputedStyle(element).position)).toBe('fixed');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    expect(await positions()).toEqual(before);
    const expanded = await nav.boundingBox();
    expect(expanded!.height).toBeGreaterThan(collapsed!.height);
    expect(expanded!.x).toBeGreaterThanOrEqual(0);
    expect(expanded!.x + expanded!.width).toBeLessThanOrEqual(width);
    expect(expanded!.y).toBeGreaterThanOrEqual(56);
    expect(expanded!.y + expanded!.height).toBeLessThanOrEqual(915);
    await page.keyboard.press('Tab');
    await expect(nav.getByRole('link').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(details).not.toHaveAttribute('open');
    await expect(summary).toBeFocused();
    expect(await positions()).toEqual(before);
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect.poll(async () => (await nav.boundingBox())!.y).toBe(collapsed!.y);
    await summary.press('Enter');
    expect(await positions()).toEqual(before);
    await nav.getByRole('link', { name: '01 回路と入力' }).click();
    await expect(details).not.toHaveAttribute('open');
    expect(
      await nav
        .locator('details > div')
        .evaluate((element) => element.contains(document.activeElement)),
    ).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test('desktop overlay は sidebar 開閉と scroll 後も fixed、本文に余白を作らない', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await waitForTool(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode()));
  });
  const nav = page.locator('.section-nav');
  const toggle = page.getByRole('button', { name: 'ナビゲーションを開閉' });
  const top = await page.locator('h1').evaluate((e) => e.getBoundingClientRect().top);
  const fixedPosition = await nav.boundingBox();
  for (const collapsed of [false, true, false]) {
    if (collapsed !== ((await page.locator('body').getAttribute('data-nav-collapsed')) === 'true'))
      await toggle.click();
    expect(await page.locator('h1').evaluate((e) => e.getBoundingClientRect().top + scrollY)).toBe(
      top,
    );
    expect(await nav.evaluate((e) => getComputedStyle(e).position)).toBe('fixed');
    const before = await nav.boundingBox();
    expect(before).toEqual(fixedPosition);
    // overlay の有無自体が全ての section 座標へ影響しない。
    const positions = () =>
      page
        .locator('h1, #input, #results, #formula')
        .evaluateAll((elements) => elements.map((e) => e.getBoundingClientRect().top + scrollY));
    const visible = await positions();
    await nav.evaluate((e) => {
      e.style.display = 'none';
    });
    expect(await positions()).toEqual(visible);
    await nav.evaluate((e) => {
      e.style.removeProperty('display');
    });
    await nav.getByRole('link').first().focus();
    await expect(nav.getByRole('link').first()).toBeFocused();
    await page.evaluate(() => window.scrollTo(0, 400));
    expect(await nav.boundingBox()).toEqual(before);
    expect(before!.x).toBeGreaterThanOrEqual(0);
    expect(before!.x + before!.width).toBeLessThanOrEqual(1440);
    expect(before!.y).toBeGreaterThanOrEqual(56);
    expect(before!.y + before!.height).toBeLessThanOrEqual(1000);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  for (const height of [180, 160, 180]) {
    await page.setViewportSize({ width: 1024, height });
    // setViewportSize 完了時にも dvh の再計算は未完了の場合がある。
    // 固定時間ではなく、現在の viewport に高さ制限が反映されたことを待つ。
    const header = await page.locator('header').boundingBox();
    await expect
      .poll(() => nav.evaluate((element) => getComputedStyle(element).maxHeight))
      .toBe(`${height - header!.height - 24}px`);
    const small = await nav.boundingBox();
    expect(small!.y).toBeGreaterThanOrEqual(56);
    expect(small!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
    expect(small!.y + small!.height).toBeLessThanOrEqual(height);
    expect(small!.x).toBe(fixedPosition!.x);
    expect(small!.x + small!.width).toBeLessThanOrEqual(1024);
    expect(await nav.evaluate((element) => getComputedStyle(element).position)).toBe('fixed');
    expect(await nav.evaluate((element) => getComputedStyle(element).overflowY)).toBe('auto');
    expect(await nav.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await nav.getByRole('link').first().focus();
    for (let index = 1; index < (await nav.getByRole('link').count()); index++)
      await page.keyboard.press('Tab');
    await expect(nav.getByRole('link').last()).toBeFocused();
    // Firefoxのfocusによる内部scrollも完了を待ち、表示範囲の閾値は維持する。
    await expect
      .poll(() =>
        nav
          .getByRole('link')
          .last()
          .evaluate((element) => element.getBoundingClientRect().bottom),
      )
      .toBeLessThanOrEqual(small!.y + small!.height);
    const lastLink = await nav.getByRole('link').last().boundingBox();
    expect(lastLink!.y).toBeGreaterThanOrEqual(small!.y);
    expect(lastLink!.y + lastLink!.height).toBeLessThanOrEqual(small!.y + small!.height);
    expect(await nav.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await nav.boundingBox()).toEqual(small);
  }
  await testInfo.attach('short-viewport-overlay', {
    body: await page.screenshot({ scale: 'css' }),
    contentType: 'image/png',
  });
});

test('候補列、誤差表示、control 高さ、比較色を desktop / mobile で確認', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 412, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.reload();
    await waitForTool(page);
    await expect(page.getByRole('checkbox', { name: '候補 1 を比較' })).toBeChecked();
    await expect(page.locator('thead th')).toHaveText([
      '候補を比較',
      'R1',
      'R2',
      '実際の Vout',
      '電圧誤差',
      '誤差率',
      '実際の Idiv',
      'R1 電力',
      'R2 電力',
    ]);
    const heights = await page
      .locator('fieldset .rt-TextFieldRoot, fieldset select')
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    expect(heights).toEqual([40, 40, 40, 40, 40, 40, 40]);
    const checkLabel = page.getByRole('checkbox', { name: '分圧電流 Idiv を指定' }).locator('..');
    expect(await checkLabel.evaluate((e) => getComputedStyle(e).whiteSpace)).toBe('nowrap');
    for (const header of await page.locator('thead th').all())
      expect(await header.evaluate((e) => getComputedStyle(e).textAlign)).toBe('center');
    const firstCheck = page.getByRole('checkbox', { name: '候補 1 を比較' });
    const firstColor = await firstCheck.evaluate(
      (e) => getComputedStyle(e, '::before').backgroundColor,
    );
    expect(firstColor).toBe('rgb(20, 95, 160)');
    const secondCheck = page.getByRole('checkbox', { name: '候補 2 を比較' });
    await secondCheck.click();
    await expect(secondCheck).toBeChecked();
    expect(
      await secondCheck.evaluate((e) => getComputedStyle(e, '::before').backgroundColor),
    ).not.toBe(firstColor);
    await firstCheck.click();
    await expect(firstCheck).not.toBeChecked();
    await firstCheck.click();
    await expect(firstCheck).toBeChecked();
    await expect
      .poll(() => firstCheck.evaluate((e) => getComputedStyle(e, '::before').backgroundColor))
      .toBe(firstColor);
    await page.getByRole('textbox', { name: '入力電圧 Vin' }).fill('6');
    await page.getByRole('button', { name: '計算', exact: true }).click();
    await expect(page.locator('tbody tr:first-child td').nth(4)).toHaveText('0 V');
    await expect(page.locator('tbody tr:first-child td').nth(5)).toHaveText('0 %');
    // 未更新でも表示分解能は直前の計算条件を使う。
    await page.getByRole('textbox', { name: '目標電圧 Vout' }).fill('3.300005');
    await page.getByRole('button', { name: '計算', exact: true }).click();
    await expect(page.locator('tbody tr:first-child td').nth(4)).toHaveText('<10 µV');
    await expect(page.locator('tbody tr:first-child td').nth(5)).toHaveText('<0.001 %');
    await page.getByRole('textbox', { name: '目標電圧 Vout' }).fill('1');
    await expect(page.locator('tbody tr:first-child td').nth(4)).toHaveText('<10 µV');
  }
});

test('option 入力は label 行と値行の2行で、label click / keyboard と有効状態を維持', async ({
  page,
}) => {
  for (const width of [1440, 412, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('tools/voltage-divider/');
    await waitForTool(page);
    const name = '分圧電流 Idiv を指定';
    const option = page.getByRole('group', { name });
    const checkbox = option.getByRole('checkbox', { name });
    const input = option.getByRole('textbox', { name });
    const unit = option.getByRole('combobox', { name: '分圧電流 Idiv の単位' });
    const label = option.locator('label');
    await expect(checkbox).toBeChecked();
    await expect(input).toBeEnabled();
    await expect(unit).toBeEnabled();
    await expect(option.locator('label')).toHaveCount(1);
    await expect(input).toHaveValue('1');
    await input.fill('2');
    await expect(page.getByText('未更新', { exact: true })).toBeVisible();
    await expect(input).toHaveValue('2');
    await unit.selectOption('µ');
    const labelBox = await label.boundingBox();
    const checkboxBox = await checkbox.boundingBox();
    const textBox = await label.locator('span').boundingBox();
    const valueBox = await option.locator('.rt-TextFieldRoot').boundingBox();
    const unitBox = await unit.boundingBox();
    expect(
      Math.abs(checkboxBox!.y + checkboxBox!.height / 2 - (textBox!.y + textBox!.height / 2)),
    ).toBeLessThan(1);
    expect(valueBox!.y).toBeGreaterThanOrEqual(labelBox!.y + labelBox!.height);
    expect(valueBox!.y).toBe(unitBox!.y);
    expect(valueBox!.height).toBe(40);
    expect(unitBox!.height).toBe(40);
    expect(unitBox!.x).toBeGreaterThanOrEqual(valueBox!.x + valueBox!.width);
    expect(unitBox!.x + unitBox!.width).toBeLessThanOrEqual(width);
    await label.locator('span').click();
    await expect(checkbox).not.toBeChecked();
    await expect(input).toBeDisabled();
    await expect(unit).toBeDisabled();
    await checkbox.focus();
    await checkbox.press('Space');
    await expect(checkbox).toBeChecked();
    await expect(input).toBeEnabled();
    await expect(unit).toBeEnabled();
    await expect(input).toHaveValue('2');
    await expect(unit).toHaveValue('µ');
  }
});

test('比較列は視覚的に空のheaderと32pxの操作領域を持ち、横scroll後も操作できる', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 412, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('tools/voltage-divider/');
    await waitForTool(page);
    const header = page.getByRole('columnheader', { name: '候補を比較', exact: true });
    await expect(header).toHaveText('候補を比較');
    expect(
      await header.locator('span').evaluate((e) => ({
        width: e.getBoundingClientRect().width,
        height: e.getBoundingClientRect().height,
        clipPath: getComputedStyle(e).clipPath,
      })),
    ).toEqual({ width: 1, height: 1, clipPath: 'inset(50%)' });
    const region = page.getByRole('region', { name: '抵抗候補表（横スクロール可能）' });
    await region.evaluate((e) => {
      e.scrollLeft = e.scrollWidth;
    });
    const cell = page.locator('tbody tr:first-child td:first-child');
    const checkbox = cell.getByRole('checkbox', { name: '候補 1 を比較' });
    const box = await checkbox.boundingBox();
    const cellBox = await cell.boundingBox();
    const regionBox = await region.boundingBox();
    expect(cellBox!.width).toBeCloseTo(32, 2);
    expect(box!.width).toBeCloseTo(32, 2);
    expect(box!.height).toBeCloseTo(32, 2);
    expect(box!.x).toBeGreaterThanOrEqual(regionBox!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(regionBox!.x + regionBox!.width);
    for (const column of [2, 3]) {
      const current = await page
        .locator(`tbody tr:first-child td:nth-child(${column})`)
        .boundingBox();
      const previous = await page
        .locator(`tbody tr:first-child td:nth-child(${column - 1})`)
        .boundingBox();
      expect(current!.x).toBeCloseTo(previous!.x + previous!.width, 1);
      expect(current!.x + current!.width).toBeLessThanOrEqual(regionBox!.x + regionBox!.width);
    }
    // 見えるcheckboxより外側の角もtouch targetとして機能する。
    await checkbox.click({ position: { x: 2, y: 2 } });
    await expect(checkbox).not.toBeChecked();
    await checkbox.focus();
    await checkbox.press('Space');
    await expect(checkbox).toBeChecked();
    await expect(checkbox).toBeFocused();
  }
});
