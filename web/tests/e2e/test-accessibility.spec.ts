import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test('accessibility test for main page', async ({ page }) => {
  await page.goto('/');
  const axe = new AxeBuilder({ page });
  const results = await axe.analyze();
  expect(results.violations).toEqual([]);
});
