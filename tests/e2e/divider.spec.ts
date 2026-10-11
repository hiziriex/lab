import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.beforeEach(async ({ page }) => {
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
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page).toHaveScreenshot('divider.png', { fullPage: true, animations: 'disabled' });
});
