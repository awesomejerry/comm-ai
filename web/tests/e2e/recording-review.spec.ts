import { test, expect } from '@playwright/test';

test.describe('Audio Recording Review', () => {
  test.beforeEach(async ({ page }) => {
    // Mock MediaRecorder and related APIs before page load
    await page.addInitScript(() => {
      // @ts-ignore - Mock for testing
      const MockMediaRecorder = function (stream, options) {
        // @ts-ignore
        this.stream = stream;
        // @ts-ignore
        this.options = options;
        // @ts-ignore
        this.state = 'inactive';
        // @ts-ignore
        this.ondataavailable = null;
        // @ts-ignore
        this.onstop = null;
      };

      // @ts-ignore
      MockMediaRecorder.prototype.start = function (timeslice) {
        // @ts-ignore
        this.state = 'recording';
        setTimeout(() => {
          // @ts-ignore
          if (this.ondataavailable) {
            // Create a mock blob with some data
            const blob = new Blob(['mock audio data'], { type: 'audio/webm' });
            // @ts-ignore
            this.ondataavailable({ data: blob });
          }
        }, 100);
      };

      // @ts-ignore
      MockMediaRecorder.prototype.stop = function () {
        // @ts-ignore
        this.state = 'inactive';
        // @ts-ignore
        if (this.onstop) {
          // @ts-ignore
          this.onstop();
        }
      };

      // @ts-ignore
      MockMediaRecorder.isTypeSupported = function (type) {
        return true;
      };

      // Mock getUserMedia
      const mockGetUserMedia = async () => ({
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
        active: true,
        id: 'mock-stream',
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
        onaddtrack: null,
        onremovetrack: null,
      });

      // Override navigator.mediaDevices
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
          enumerateDevices: async () => [],
          getDisplayMedia: mockGetUserMedia,
          getSupportedConstraints: () => ({}),
        },
        writable: true,
      });

      // Replace MediaRecorder with mock
      // @ts-ignore
      window.MediaRecorder = MockMediaRecorder;

      // Mock URL.createObjectURL and revokeObjectURL
      // @ts-ignore
      window.URL.createObjectURL = () => 'blob:mock-audio-url';
      // @ts-ignore
      window.URL.revokeObjectURL = () => {};
    });

    // Mock the upload webhook
    await page.route('https://n8n.awesomejerry.space/webhook/comm-ai/upload-pitch', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ evaluation: 'mock result' }),
      });
    });

    await page.goto('/');
  });

  test('pause recording and review audio', async ({ page }) => {
    // Load a PDF presentation
    await page.locator('input[type="file"]').setInputFiles('tests/e2e/test-data/sample.pdf');

    // Start recording
    await page.locator('button:has-text("Start Recording")').click();

    // Wait for recording to start
    await expect(page.locator('text=Recording Active')).toBeVisible();

    // Pause recording
    await page.locator('button:has-text("Stop Recording")').click();
    await page.waitForTimeout(1000); // Wait for recording data to be available

    // Check review controls appear
    await expect(page.locator('h2:has-text("Review Recording")')).toBeVisible();

    // Check audio player is present
    const audioElement = page.locator('audio');
    await expect(audioElement).toHaveCount(1);

    // Click play on review
    await page.locator('button:has-text("Play")').click();

    // Audio should be playable (check if it has src attribute)
    await expect(audioElement).toHaveAttribute('src', /.+/);
  });

  test('confirm upload after review', async ({ page }) => {
    // Load PDF and start recording
    await page.locator('input[type="file"]').setInputFiles('tests/e2e/test-data/sample.pdf');
    await page.locator('button:has-text("Start Recording")').click();
    await expect(page.locator('text=Recording Active')).toBeVisible();

    // Pause and review
    await page.locator('button:has-text("Stop Recording")').click();
    await page.waitForTimeout(1000); // Wait for recording data to be available
    await expect(page.locator('h2:has-text("Review Recording")')).toBeVisible();

    // Check that confirm button exists and can be clicked
    const confirmButton = page.locator('button').filter({ hasText: 'Confirm & Upload' });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Just verify the button was clicked successfully (no errors thrown)
    // Note: The full upload workflow is tested in unit tests
  });

  test('delete recording after review', async ({ page }) => {
    // Load PDF and start recording
    await page.locator('input[type="file"]').setInputFiles('tests/e2e/test-data/sample.pdf');
    await page.locator('button:has-text("Start Recording")').click();
    await expect(page.locator('text=Recording Active')).toBeVisible();

    // Pause and review
    await page.locator('button:has-text("Stop Recording")').click();
    await page.waitForTimeout(1000); // Wait for recording data to be available
    await expect(page.locator('h2:has-text("Review Recording")')).toBeVisible();

    // Delete recording
    await page.locator('button:has-text("Delete Recording")').click();

    // Check that no segment was created (recording discarded)
    await expect(page.locator('text=No segments recorded yet')).toBeVisible();
  });
});
