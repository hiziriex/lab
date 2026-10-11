import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

test('静的ページ、公開パス、メタデータ', async ({ page }) => {
  for (const [route, title] of [
    ['', 'Hiziriex Lab'],
    ['about/', 'About | Hiziriex Lab'],
    ['404.html', 'ページが見つかりません | Hiziriex Lab'],
  ]) {
    await page.goto(route!);
    await expect(page).toHaveTitle(title!);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://hiziriex.github.io/lab/${route}`,
    );
    await expect(page.getByRole('link', { name: 'hiziriex/lab', exact: true })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  }
  for (const asset of ['favicon.svg', 'site.webmanifest', 'robots.txt', 'sitemap-index.xml']) {
    const response = await page.request.get(asset);
    expect(response.ok()).toBe(true);
  }
});

test('@a11y ホーム・About・404', async ({ page }) => {
  for (const route of ['', 'about/', '404.html']) {
    await page.goto(route);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});

test('tablet drawer とキーボードによる復帰', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('tools/voltage-divider/');
  const toggle = page.getByRole('button', { name: 'ナビゲーションを開閉' });
  await expect(page.locator('#desktop-navigation')).not.toBeVisible();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('候補表を横スクロールしても順位と抵抗を表示', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('tools/voltage-divider/');
  await expect(page.getByRole('checkbox', { name: '候補 1 を比較' })).toBeChecked();
  const table = page.getByRole('region', { name: '抵抗候補表（横スクロール可能）' });
  await table.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  const viewport = await table.boundingBox();
  for (const column of [3, 4, 5]) {
    const cell = await page.locator(`tbody tr:first-child > :nth-child(${column})`).boundingBox();
    expect(cell!.x).toBeGreaterThanOrEqual(viewport!.x);
    expect(cell!.x + cell!.width).toBeLessThanOrEqual(viewport!.x + viewport!.width);
  }
});

test('@review 承認用画像（baseline は変更しない）', async ({ page, browserName }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('tools/voltage-divider/');
  await expect(page.getByRole('checkbox', { name: '候補 1 を比較' })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  for (const target of [page.locator('h1'), page.getByRole('textbox', { name: '分圧電流 Idiv' })])
    expect(await target.evaluate((element) => getComputedStyle(element).fontFamily)).toContain(
      'Noto Sans CJK JP',
    );
  await page.evaluate(() => document.fonts.ready);
  await mkdir('review-artifacts', { recursive: true });
  if (browserName === 'chromium' && process.platform === 'linux') {
    const session = await page.context().newCDPSession(page);
    await session.send('DOM.enable');
    await session.send('CSS.enable');
    const { root } = await session.send('DOM.getDocument');
    for (const selector of ['h1', 'label']) {
      const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
      const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
      expect(
        fonts.some(
          (font) =>
            font.familyName === 'Noto Sans CJK JP' && !font.isCustomFont && font.glyphCount > 0,
        ),
      ).toBe(true);
      await writeFile(
        `review-artifacts/divider-${testInfo.project.name}-${selector}-fonts.json`,
        JSON.stringify(fonts, null, 2) + '\n',
      );
      await testInfo.attach(`system-font-${selector}`, {
        body: JSON.stringify(fonts, null, 2),
        contentType: 'application/json',
      });
    }
    await session.detach();
  }
  await testInfo.attach('divider-review', {
    body: await page.screenshot({
      path: `review-artifacts/divider-${testInfo.project.name}.png`,
      fullPage: true,
      animations: 'disabled',
      scale: 'device',
    }),
    contentType: 'image/png',
  });
});
