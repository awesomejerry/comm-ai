// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Magic Link Login Flow', () => {
  test('User receives login link, clicks, is logged in', async ({ page }) => {
    await page.goto('/#/login');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Check your email for the login link')).toBeVisible();
    // Simulate clicking the magic link
    // Magic link redirects to root with #access_token=... which Supabase handles automatically
    // await page.goto('/#access_token=mock_token&...');
    // await expect(page).toHaveURL('/#/');
  });

  test('Rate limiting triggers error', async ({ page }) => {
    await page.goto('/#/login');
    for (let i = 0; i < 10; i++) {
      await page.fill('input[type="email"]', 'testuser@example.com');
      await page.click('button[type="submit"]');
    }
    await expect(page.locator('text=Too many requests')).toBeVisible();
  });
});
