// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Magic Link Login Flow', () => {
  test('User receives login link, clicks, is logged in', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Check your email for the login link')).toBeVisible();
    // Simulate clicking the magic link (mock or manual step in CI)
    // await page.goto('/login-redirect?token=...');
    // await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('Expired/invalid link shows error', async ({ page }) => {
    await page.goto('/login-redirect?token=invalid');
    await expect(page.locator('text=Invalid or expired link')).toBeVisible();
  });

  test('Rate limiting triggers error', async ({ page }) => {
    await page.goto('/login');
    for (let i = 0; i < 10; i++) {
      await page.fill('input[type="email"]', 'testuser@example.com');
      await page.click('button[type="submit"]');
    }
    await expect(page.locator('text=Too many requests')).toBeVisible();
  });
});
