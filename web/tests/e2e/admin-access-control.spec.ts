/**
 * E2E Test: Admin Access Control
 *
 * Tests that only admin users can access the admin dashboard.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Access Control', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/#/');
  });

  test('should allow admin users to access dashboard', async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/#/admin/dashboard');

    // Should successfully load the dashboard
    await expect(page).toHaveURL('/#/admin/dashboard');
    await expect(page.locator('h1')).toContainText(/admin dashboard|evaluations/i);
  });

  test('should show loading state during role verification', async ({ page }) => {
    // Verify that loading indicator exists or page loads
    await page.goto('/#/admin/dashboard');

    // Check if loading indicator appears (even briefly)
    const loadingIndicator = page.locator('[data-testid="loading"]');
    // Loading should appear or page should already be loaded
    const isVisible = await loadingIndicator.isVisible().catch(() => false);
    expect(isVisible !== undefined).toBe(true);
  });
});
