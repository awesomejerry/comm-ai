import { test, expect } from '@playwright/test';

test('Q&A Learning Cards page loads', async ({ page }) => {
  // Assuming logged in, navigate to learning cards
  await page.goto('/#/learning-cards');
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  // Check if the page has loaded by looking for the title
  await expect(page.locator('text=Q&A Learning Cards')).toBeVisible();
  // Check that the page has loaded the questions
  await expect(page.locator('text=Question')).toBeVisible();
});
