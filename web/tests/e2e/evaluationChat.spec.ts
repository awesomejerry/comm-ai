import { test, expect } from '@playwright/test';

test.describe('Evaluation Chat Display', () => {
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
  });

  test('should display evaluation result in chat format', async ({ page }) => {
    // Mock the upload webhook to return evaluation data
    await page.route('https://n8n.awesomejerry.space/webhook/comm-ai/upload-pitch', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-segment',
          input: '1\n00:00:01,000 --> 00:00:05,000\nHello, this is a test transcript.',
          output: 'This is a sample AI response.',
        }),
      });
    });

    await page.goto('http://localhost:5173');

    // Upload a PDF file first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/e2e/test-data/sample.pdf');

    // Set audience
    await page.locator('input[id="audience-input"]').fill('investors');

    // Start recording
    await page.locator('button', { hasText: 'Start Recording' }).click();

    // Wait a bit for recording to start
    await page.waitForTimeout(500);

    // Stop recording
    await page.locator('button', { hasText: 'Stop Recording' }).click();

    // Wait for the review section to appear
    await page.waitForSelector('text=Review Recording');

    // Confirm upload
    await page.locator('button', { hasText: '✅ Confirm & Upload' }).click();

    // Wait for segment to appear in the list (look for any evaluated segment)
    await page.waitForSelector('[data-testid^="segment-"]');
    const evaluatedSegments = page.locator('[data-testid^="segment-"]:has-text("✅ Evaluated")');
    await expect(evaluatedSegments.first()).toBeVisible();

    const segmentElement = evaluatedSegments.first();

    // Input message displayed as user message
    const userMessage = segmentElement.locator('[data-testid="user-message"]');
    await expect(userMessage).toContainText('Hello, this is a test transcript');

    // Output message displayed as AI message
    const aiMessage = segmentElement.locator('[data-testid="ai-message"]');
    await expect(aiMessage).toContainText('This is a sample AI response');
  });

  test('should handle missing evaluation data', async ({ page }) => {
    // Mock the upload webhook to return malformed evaluation data
    await page.route('https://n8n.awesomejerry.space/webhook/comm-ai/upload-pitch', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'malformed-segment',
          input: null, // malformed
          output: null,
        }),
      });
    });

    await page.goto('http://localhost:5173');

    // Upload a PDF file first
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/e2e/test-data/sample.pdf');

    // Set audience
    await page.locator('input[id="audience-input"]').fill('investors');

    // Start recording
    await page.locator('button', { hasText: 'Start Recording' }).click();
    await page.waitForTimeout(500);

    // Stop recording
    await page.locator('button', { hasText: 'Stop Recording' }).click();

    // Wait for review section
    await page.waitForSelector('text=Review Recording');

    // Confirm upload
    await page.locator('button', { hasText: '✅ Confirm & Upload' }).click();

    // Wait for segment to appear
    await page.waitForSelector('[data-testid^="segment-"]');
    const failedSegments = page.locator('[data-testid^="segment-"]:has-text("❌ Failed")');
    await expect(failedSegments.first()).toBeVisible();

    const segmentElement = failedSegments.first();

    // Then show error message in the segment
    await expect(segmentElement).toContainText('Failed after 3 retries');
  });

  test('should be read-only with no interaction', async ({ page }) => {
    // Mock successful evaluation
    await page.route('https://n8n.awesomejerry.space/webhook/comm-ai/upload-pitch', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'readonly-segment',
          input: '1\n00:00:01,000 --> 00:00:05,000\nTest message.',
          output: 'Test response.',
        }),
      });
    });

    await page.goto('http://localhost:5173');

    // Upload PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/e2e/test-data/sample.pdf');

    // Start and stop recording
    await page.locator('button', { hasText: 'Start Recording' }).click();
    await page.waitForTimeout(500);
    await page.locator('button', { hasText: 'Stop Recording' }).click();
    await page.waitForSelector('text=Review Recording');

    await page.locator('button', { hasText: '✅ Confirm & Upload' }).click();

    // Wait for segment
    await page.waitForSelector('[data-testid^="segment-"]');
    const evaluatedSegments = page.locator('[data-testid^="segment-"]:has-text("✅ Evaluated")');
    await expect(evaluatedSegments.first()).toBeVisible();

    const segmentElement = evaluatedSegments.first();

    // Verify chat is displayed but no input fields (read-only)
    const chatContainer = segmentElement.locator('[data-testid="evaluation-chat"]');
    await expect(chatContainer).toBeVisible();

    // Should not have any input elements
    const inputs = chatContainer.locator('input, textarea, button:not([data-testid])');
    await expect(inputs).toHaveCount(0);
  });
});
