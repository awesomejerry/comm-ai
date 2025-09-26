import { test, expect } from '@playwright/test';

test('UI responsiveness test', async ({ page }) => {
  await page.goto('/');

  // Test mobile viewport (375px) - should stack vertically
  await page.setViewportSize({ width: 375, height: 667 });

  // Check basic elements are visible
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('input[type="file"]')).toBeVisible();

  // On mobile, columns should stack (no horizontal layout)
  const mainGrid = page.locator('.grid');
  await expect(mainGrid).toHaveClass(/grid-cols-1/);

  // Upload a PDF to test layout with content
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('./tests/e2e/test-data/sample.pdf');

  // PDF viewer should appear
  await expect(page.locator('text=Presentation Preview')).toBeVisible();

  // On mobile, PDF viewer should appear below controls (stacked layout)
  const controlsCard = page.locator('text=Recording Controls').locator('..').locator('..');
  const pdfCard = page.locator('.grid > div').nth(1); // Second child of grid

  // Check that controls come before PDF in the DOM (stacked vertically)
  const controlsRect = await controlsCard.boundingBox();
  const pdfRect = await pdfCard.boundingBox();

  if (controlsRect && pdfRect) {
    expect(controlsRect.y).toBeLessThan(pdfRect.y); // Controls should be above PDF
  }

  // Test tablet viewport (768px) - should still stack
  await page.setViewportSize({ width: 768, height: 1024 });

  // Still should be stacked on tablet
  await expect(mainGrid).toHaveClass(/grid-cols-1/);

  // PDF should still be below controls
  const controlsRectTablet = await controlsCard.boundingBox();
  const pdfRectTablet = await pdfCard.boundingBox();

  if (controlsRectTablet && pdfRectTablet) {
    expect(controlsRectTablet.y).toBeLessThan(pdfRectTablet.y);
  }

  // Test desktop viewport (1024px+) - should be side by side
  await page.setViewportSize({ width: 1024, height: 768 });

  // Should now be horizontal layout
  await expect(mainGrid).toHaveClass(/grid-cols-\[auto,1fr\]/);

  // On desktop, controls should be on the left, PDF on the right
  const controlsRectDesktop = await controlsCard.boundingBox();
  const pdfRectDesktop = await pdfCard.boundingBox();

  if (controlsRectDesktop && pdfRectDesktop) {
    expect(controlsRectDesktop.x).toBeLessThan(pdfRectDesktop.x); // Controls should be left of PDF
    expect(Math.abs(controlsRectDesktop.y - pdfRectDesktop.y)).toBeLessThan(50); // Should be roughly aligned vertically
  }

  // Test larger desktop viewport (1920px)
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Should maintain horizontal layout
  await expect(mainGrid).toHaveClass(/grid-cols-\[auto,1fr\]/);

  // Verify 80% width container
  const container = page.locator('.w-4\\/5');
  await expect(container).toBeVisible();

  const containerBox = await container.boundingBox();
  const viewportSize = page.viewportSize();

  // Container is 80% of available width after horizontal padding (px-4 = 16px * 2 = 32px)
  const expectedWidth = (viewportSize!.width - 32) * 0.8;

  if (containerBox && viewportSize) {
    expect(containerBox.width).toBeCloseTo(expectedWidth, -1); // Allow small rounding differences
  }
});
