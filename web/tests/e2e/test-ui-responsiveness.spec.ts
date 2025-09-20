import { test, expect } from '@playwright/test'

test('UI responsiveness test', async ({ page }) => {
  await page.goto('/')

  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 })
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('input[type="file"]')).toBeVisible()

  // Test tablet viewport
  await page.setViewportSize({ width: 768, height: 1024 })
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('input[type="file"]')).toBeVisible()

  // Test desktop viewport
  await page.setViewportSize({ width: 1920, height: 1080 })
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('input[type="file"]')).toBeVisible()
})