import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const state of ['normal', 'focus', 'error', 'disabled', 'current']) {
  test(`EngineeringValueInput: ${state}`, async ({ page }) => {
    const response = await page.request.get('/index.json');
    const index = (await response.json()) as {
      entries: Record<string, { id: string; exportName: string }>;
    };
    const story = Object.values(index.entries).find(
      (entry) => entry.exportName.toLowerCase() === state,
    );
    expect(story).toBeDefined();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/iframe.html?id=${story!.id}&viewMode=story`);
    const input = page.getByRole('textbox');
    await expect(input).toBeVisible();
    if (state === 'disabled') await expect(input).toBeDisabled();
    else if (state === 'focus') await expect(input).toBeFocused();
    else if (state === 'error') {
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByText('⚠ 0 Ωより大きい値を入力してください')).toBeVisible();
    } else {
      await input.fill('2.2');
      await expect(input).toHaveValue('2.2');
    }
    expect(errors).toEqual([]);
    expect(
      (await new AxeBuilder({ page }).include('#storybook-root').analyze()).violations,
    ).toEqual([]);
  });
}
