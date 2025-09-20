import { test, expect } from '@playwright/test'

test('record and upload flow (mocked)', async ({ page }) => {
  // Intercept the webhook and return a mock response
  await page.route('https://n8n.awesomejerry.space/webhook/commoon/upload-audio', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ input: 'ok', output: 'nice' }) })
  })

  await page.goto('/')
  // interactions would go here; for now just assert page loads
  await expect(page.locator('text=Presenter')).toBeVisible()
})
