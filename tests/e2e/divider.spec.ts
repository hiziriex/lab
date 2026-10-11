import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.beforeEach(async ({ page }, testInfo) => {
  // review と同じく初回読み込み前に motion 設定を適用する。
  if (testInfo.title.includes('@visual')) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('tools/voltage-divider/');
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
  await expect(page.getByRole('textbox', { name: '分圧電流 Idiv' })).toHaveValue('1');
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
  await page.getByRole('textbox', { name: '分圧電流 Idiv' }).fill('invalid');
  await page.getByRole('checkbox', { name: '分圧電流を指定' }).click();
  await expect(page.getByRole('button', { name: '計算', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '計算', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '分圧電流 Idiv' })).toBeDisabled();
});
test('CSP と runtime error、ページ幅、ナビゲーション', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.reload();
  await expect(page.getByRole('checkbox', { name: '候補 1 を比較' })).toBeChecked();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const results = await page.locator('#results').boundingBox();
  const formula = await page.locator('#formula').boundingBox();
  expect(formula!.y - (results!.y + results!.height)).toBeLessThan(100);
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
