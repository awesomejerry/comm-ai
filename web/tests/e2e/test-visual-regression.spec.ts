import { test, expect } from '@playwright/test'

test('visual regression test for redesigned components', async ({ page }) => {
  await page.goto('/')

  // Take screenshot of the main page
  await expect(page).toHaveScreenshot('main-page.png', { fullPage: true })
})