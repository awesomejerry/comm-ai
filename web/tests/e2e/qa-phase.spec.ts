import { test, expect } from '@playwright/test';

test.describe('Q&A Phase E2E', () => {
  const TEST_EVALUATION_ID = '550e8400-e29b-41d4-a716-446655440000';

  test.beforeEach(async ({ page }) => {
    // Setup: Mock n8n API responses
    await page.route('**/comm-ai/generate-questions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            {
              id: 'question-1',
              text: 'Can you explain the main concept you presented?',
              order: 1,
              context: 'Based on your evaluation, you covered the introduction well.',
              evaluationId: TEST_EVALUATION_ID,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'question-2',
              text: 'How would you improve this presentation?',
              order: 2,
              evaluationId: TEST_EVALUATION_ID,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'question-3',
              text: 'What are the key takeaways?',
              order: 3,
              evaluationId: TEST_EVALUATION_ID,
              createdAt: new Date().toISOString(),
            },
          ],
          metadata: {
            evaluationId: TEST_EVALUATION_ID,
            questionCount: 3,
            generatedBy: 'llm',
            generatedAt: new Date().toISOString(),
          },
        }),
      });
    });

    // Mock authentication
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should navigate to Q&A phase from evaluation results', async ({ page }) => {
    // Navigate to evaluation detail page (mock route if needed)
    await page.goto(`/evaluation/${TEST_EVALUATION_ID}`);

    // Find and click "Start Q&A Phase" button
    const qaButton = page.locator('button:has-text("Start Q&A Phase")');
    await expect(qaButton).toBeVisible();
    await expect(qaButton).toBeEnabled();

    await qaButton.click();

    // Verify navigation to Q&A page
    await expect(page).toHaveURL(`/qa/${TEST_EVALUATION_ID}`);
  });

  test('should load and display generated questions', async ({ page }) => {
    await page.goto(`/qa/${TEST_EVALUATION_ID}`);

    // Wait for loading state to complete
    await expect(page.locator('text=Loading questions...')).toBeVisible();
    await expect(page.locator('text=Loading questions...')).not.toBeVisible({ timeout: 5000 });

    // Verify questions are displayed
    await expect(page.locator('text=Can you explain the main concept')).toBeVisible();
    await expect(page.locator('text=How would you improve this presentation')).toBeVisible();
    await expect(page.locator('text=What are the key takeaways')).toBeVisible();

    // Verify question count in header
    await expect(page.locator('text=3 Questions')).toBeVisible();
  });

  test('should display question numbers and context', async ({ page }) => {
    await page.goto(`/qa/${TEST_EVALUATION_ID}`);

    await expect(page.locator('text=Loading questions...')).not.toBeVisible({ timeout: 5000 });

    // Verify question numbers (numbered badges)
    const badge1 = page.locator('[aria-label="Question 1"]');
    await expect(badge1).toBeVisible();
    await expect(badge1).toHaveText('1');

    // Verify context display
    await expect(page.locator('text=Context:')).toBeVisible();
    await expect(page.locator('text=Based on your evaluation')).toBeVisible();
  });

  test('should show loading state during question generation', async ({ page }) => {
    // Delay API response to test loading state
    await page.route('**/comm-ai/generate-questions*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [],
          metadata: {
            evaluationId: TEST_EVALUATION_ID,
            questionCount: 0,
            generatedBy: 'llm',
            generatedAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto(`/qa/${TEST_EVALUATION_ID}`);

    // Verify loading indicator
    const loadingIndicator = page.locator('[role="status"]');
    await expect(loadingIndicator).toBeVisible();
    await expect(page.locator('text=Loading questions...')).toBeVisible();

    // Verify spinner animation
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should show error state with retry on API failure', async ({ page }) => {
    let callCount = 0;

    await page.route('**/comm-ai/generate-questions*', async (route) => {
      callCount++;

      if (callCount <= 2) {
        // First 2 attempts fail with 500
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Internal server error' } }),
        });
      } else {
        // Third attempt succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            questions: [
              {
                id: 'question-1',
                text: 'Test question',
                order: 1,
                evaluationId: TEST_EVALUATION_ID,
                createdAt: new Date().toISOString(),
              },
            ],
            metadata: {
              evaluationId: TEST_EVALUATION_ID,
              questionCount: 1,
              generatedBy: 'llm',
              generatedAt: new Date().toISOString(),
            },
          }),
        });
      }
    });

    await page.goto(`/qa/${TEST_EVALUATION_ID}`);

    // Wait for retry logic to complete (exponential backoff: 1s, 2s)
    await page.waitForTimeout(4000);

    // Verify successful load after retries
    await expect(page.locator('text=Test question')).toBeVisible();

    // Verify 3 API calls were made
    expect(callCount).toBe(3);
  });

  test('should show error with retry button after max retries', async ({ page }) => {
    await page.route('**/comm-ai/generate-questions*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Server unavailable' } }),
      });
    });

    await page.goto(`/qa/${TEST_EVALUATION_ID}`);

    // Wait for all retries to complete
    await page.waitForTimeout(8000);

    // Verify error message
    await expect(page.locator('text=Failed to generate questions')).toBeVisible();
    await expect(page.locator('text=Attempt 3 of 3')).toBeVisible();

    // Verify retry button
    const retryButton = page.locator('button:has-text("Try Again")');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Click retry and verify new attempt
    await retryButton.click();
    await expect(page.locator('text=Loading questions...')).toBeVisible();
  });

  test('should allow navigation back to evaluation', async ({ page }) => {
    await page.goto(`/qa/${TEST_EVALUATION_ID}`);

    await expect(page.locator('text=Loading questions...')).not.toBeVisible({ timeout: 5000 });

    // Find and click back button
    const backButton = page.locator('button:has-text("← Back")');
    await expect(backButton).toBeVisible();
    await expect(backButton).toBeEnabled();

    await backButton.click();

    // Verify navigation back
    await expect(page).toHaveURL(`/evaluation/${TEST_EVALUATION_ID}`);
  });

  test('should persist session to IndexedDB', async ({ page }) => {
    await page.goto(`/qa/${TEST_EVALUATION_ID}`);

    await expect(page.locator('text=Loading questions...')).not.toBeVisible({ timeout: 5000 });

    // Verify questions loaded
    await expect(page.locator('text=Can you explain the main concept')).toBeVisible();

    // Reload page
    await page.reload();

    // Verify questions still present (loaded from IndexedDB)
    await expect(page.locator('text=Can you explain the main concept')).toBeVisible();
    await expect(page.locator('text=How would you improve this presentation')).toBeVisible();
  });

  test('should show empty state if no questions generated', async ({ page }) => {
    await page.route('**/comm-ai/generate-questions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [],
          metadata: {
            evaluationId: TEST_EVALUATION_ID,
            questionCount: 0,
            generatedBy: 'llm',
            generatedAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto(`/qa/${TEST_EVALUATION_ID}`);

    await expect(page.locator('text=Loading questions...')).not.toBeVisible({ timeout: 5000 });

    // Verify empty state (will show error due to validation)
    await expect(page.locator('text=Invalid question count')).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    await page.goto(`/qa/${TEST_EVALUATION_ID}`);

    await expect(page.locator('text=Loading questions...')).not.toBeVisible({ timeout: 5000 });

    // Check for proper ARIA roles
    await expect(page.locator('[role="feed"]')).toBeVisible();
    await expect(page.locator('[role="article"]').first()).toBeVisible();

    // Verify keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus indicators
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    await expect(focusedElement).toBeTruthy();
  });

  test.describe('Audio Recording', () => {
    test.beforeEach(async ({ page, context }) => {
      // Grant microphone permissions for audio recording tests
      await context.grantPermissions(['microphone']);

      await page.goto(`/qa/${TEST_EVALUATION_ID}`);
      await expect(page.locator('text=Loading questions...')).not.toBeVisible({ timeout: 5000 });
    });

    test('should show recording controls for current unanswered question', async ({ page }) => {
      // Wait for questions to load
      await expect(page.locator('[role="article"]').first()).toBeVisible();

      // Verify Start Recording button is visible for first question
      await expect(page.locator('button:has-text("Start Recording")')).toBeVisible();

      // Verify recording instructions are shown
      await expect(page.locator('text=/Record your audio answer/i')).toBeVisible();
    });

    test('should start recording and display recording indicator', async ({ page }) => {
      // Mock MediaRecorder in browser context
      await page.evaluate(() => {
        class MockMediaRecorder {
          state = 'inactive';
          ondataavailable: ((e: any) => void) | null = null;
          onstop: (() => void) | null = null;

          start() {
            this.state = 'recording';
          }

          stop() {
            this.state = 'inactive';
            if (this.ondataavailable) {
              this.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
            }
            if (this.onstop) {
              this.onstop();
            }
          }

          pause() {
            this.state = 'paused';
          }
          resume() {
            this.state = 'recording';
          }

          static isTypeSupported() {
            return true;
          }
        }

        (window as any).MediaRecorder = MockMediaRecorder;

        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () =>
              Promise.resolve({
                getTracks: () => [{ stop: () => {} }],
                getAudioTracks: () => [{ stop: () => {} }],
              }),
          },
          writable: true,
          configurable: true,
        });
      });

      // Wait for questions to load
      await expect(page.locator('[role="article"]').first()).toBeVisible();

      // Click Start Recording button
      await page.locator('button:has-text("Start Recording")').click();

      // Wait for recording to start
      await page.waitForTimeout(500);

      // Verify recording indicator is visible
      await expect(page.locator('text=/Recording/i')).toBeVisible();

      // Verify timer is running
      await expect(page.locator('text=/00:/i')).toBeVisible();

      // Verify Pause button appears
      await expect(page.locator('button:has-text("Pause")')).toBeVisible();
    });

    test('should pause and resume recording', async ({ page }) => {
      // Mock MediaRecorder
      await page.evaluate(() => {
        class MockMediaRecorder {
          state = 'inactive';
          ondataavailable: ((e: any) => void) | null = null;
          onstop: (() => void) | null = null;

          start() {
            this.state = 'recording';
          }
          stop() {
            this.state = 'inactive';
            if (this.ondataavailable) {
              this.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
            }
            if (this.onstop) {
              this.onstop();
            }
          }
          pause() {
            this.state = 'paused';
          }
          resume() {
            this.state = 'recording';
          }

          static isTypeSupported() {
            return true;
          }
        }

        (window as any).MediaRecorder = MockMediaRecorder;

        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () =>
              Promise.resolve({
                getTracks: () => [{ stop: () => {} }],
                getAudioTracks: () => [{ stop: () => {} }],
              }),
          },
          writable: true,
          configurable: true,
        });
      });

      await expect(page.locator('[role="article"]').first()).toBeVisible();

      // Start recording
      await page.locator('button:has-text("Start Recording")').click();
      await page.waitForTimeout(500);

      // Pause recording
      await page.locator('button:has-text("Pause")').click();
      await page.waitForTimeout(300);

      // Verify Paused state
      await expect(page.locator('text=/Paused/i')).toBeVisible();
      await expect(page.locator('button:has-text("Resume")')).toBeVisible();

      // Resume recording
      await page.locator('button:has-text("Resume")').click();
      await page.waitForTimeout(300);

      // Verify Recording state restored
      await expect(page.locator('text=/Recording/i')).toBeVisible();
      await expect(page.locator('button:has-text("Pause")')).toBeVisible();
    });

    test('should stop recording and display answer bubble', async ({ page }) => {
      // Mock MediaRecorder and IndexedDB
      await page.evaluate(() => {
        class MockMediaRecorder {
          state = 'inactive';
          ondataavailable: ((e: any) => void) | null = null;
          onstop: (() => void) | null = null;

          start() {
            this.state = 'recording';
          }
          stop() {
            this.state = 'inactive';
            setTimeout(() => {
              if (this.ondataavailable) {
                this.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
              }
              if (this.onstop) {
                this.onstop();
              }
            }, 100);
          }
          pause() {
            this.state = 'paused';
          }
          resume() {
            this.state = 'recording';
          }

          static isTypeSupported() {
            return true;
          }
        }

        (window as any).MediaRecorder = MockMediaRecorder;

        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () =>
              Promise.resolve({
                getTracks: () => [{ stop: () => {} }],
                getAudioTracks: () => [{ stop: () => {} }],
              }),
          },
          writable: true,
          configurable: true,
        });
      });

      await expect(page.locator('[role="article"]').first()).toBeVisible();

      // Start recording
      await page.locator('button:has-text("Start Recording")').click();
      await page.waitForTimeout(500);

      // Stop recording
      await page.locator('button:has-text("Stop")').click();

      // Wait for completion
      await page.waitForTimeout(1000);

      // Verify answer bubble appears (right-aligned, green background)
      await expect(page.locator('[role="article"].justify-end').first()).toBeVisible();
      await expect(page.locator('.bg-green-50').first()).toBeVisible();

      // Verify play button is present
      await expect(page.locator('button[aria-label*="Play"]').first()).toBeVisible();

      // Verify upload status indicator
      await expect(
        page.locator('text=/Pending upload/i').or(page.locator('text=/Not uploaded/i')).first()
      ).toBeVisible();
    });

    test('should play recorded audio answer', async ({ page }) => {
      // Mock MediaRecorder and Audio element
      await page.evaluate(() => {
        class MockMediaRecorder {
          state = 'inactive';
          ondataavailable: ((e: any) => void) | null = null;
          onstop: (() => void) | null = null;

          start() {
            this.state = 'recording';
          }
          stop() {
            this.state = 'inactive';
            setTimeout(() => {
              if (this.ondataavailable) {
                this.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
              }
              if (this.onstop) {
                this.onstop();
              }
            }, 100);
          }
          pause() {
            this.state = 'paused';
          }
          resume() {
            this.state = 'recording';
          }

          static isTypeSupported() {
            return true;
          }
        }

        (window as any).MediaRecorder = MockMediaRecorder;

        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () =>
              Promise.resolve({
                getTracks: () => [{ stop: () => {} }],
                getAudioTracks: () => [{ stop: () => {} }],
              }),
          },
          writable: true,
          configurable: true,
        });

        // Mock Audio element
        class MockAudio {
          currentTime = 0;
          duration = 10;
          paused = true;

          async play() {
            this.paused = false;
            return Promise.resolve();
          }

          pause() {
            this.paused = true;
          }

          addEventListener() {}
          removeEventListener() {}
        }

        (window as any).Audio = MockAudio;
        (window as any).HTMLAudioElement = MockAudio;
      });

      await expect(page.locator('[role="article"]').first()).toBeVisible();

      // Record an answer
      await page.locator('button:has-text("Start Recording")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Stop")').click();
      await page.waitForTimeout(1000);

      // Verify play button exists
      const playButton = page.locator('button[aria-label*="Play"]').first();
      await expect(playButton).toBeVisible();

      // Click play
      await playButton.click();
      await page.waitForTimeout(300);

      // Verify button changes to pause (or shows playing state)
      await expect(page.locator('button[aria-label*="Pause"]').first()).toBeVisible();
    });

    test('should cancel recording without saving', async ({ page }) => {
      // Mock MediaRecorder
      await page.evaluate(() => {
        class MockMediaRecorder {
          state = 'inactive';
          ondataavailable: ((e: any) => void) | null = null;
          onstop: (() => void) | null = null;

          start() {
            this.state = 'recording';
          }
          stop() {
            this.state = 'inactive';
            if (this.ondataavailable) {
              this.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
            }
            if (this.onstop) {
              this.onstop();
            }
          }
          pause() {
            this.state = 'paused';
          }
          resume() {
            this.state = 'recording';
          }

          static isTypeSupported() {
            return true;
          }
        }

        (window as any).MediaRecorder = MockMediaRecorder;

        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () =>
              Promise.resolve({
                getTracks: () => [{ stop: () => {} }],
                getAudioTracks: () => [{ stop: () => {} }],
              }),
          },
          writable: true,
          configurable: true,
        });
      });

      await expect(page.locator('[role="article"]').first()).toBeVisible();

      // Start recording
      await page.locator('button:has-text("Start Recording")').click();
      await page.waitForTimeout(500);

      // Cancel recording
      await page.locator('button:has-text("Cancel")').click();
      await page.waitForTimeout(300);

      // Verify recording UI is reset
      await expect(page.locator('button:has-text("Start Recording")')).toBeVisible();

      // Verify no answer bubble appears
      await expect(page.locator('[role="article"].justify-end')).not.toBeVisible();
    });
  });

  test.describe('Submit and Rating', () => {
    test.beforeEach(async ({ page, context }) => {
      // Grant microphone permissions
      await context.grantPermissions(['microphone']);

      // Mock MediaRecorder for all submission tests
      await page.addInitScript(() => {
        class MockMediaRecorder {
          state = 'inactive';
          ondataavailable: ((e: any) => void) | null = null;
          onstop: (() => void) | null = null;

          start() {
            this.state = 'recording';
          }
          stop() {
            this.state = 'inactive';
            setTimeout(() => {
              if (this.ondataavailable) {
                this.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
              }
              if (this.onstop) {
                this.onstop();
              }
            }, 100);
          }
          pause() {
            this.state = 'paused';
          }
          resume() {
            this.state = 'recording';
          }

          static isTypeSupported() {
            return true;
          }
        }

        (window as any).MediaRecorder = MockMediaRecorder;

        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () =>
              Promise.resolve({
                getTracks: () => [{ stop: () => {} }],
                getAudioTracks: () => [{ stop: () => {} }],
              }),
          },
          writable: true,
          configurable: true,
        });
      });

      await page.goto(`/qa/${TEST_EVALUATION_ID}`);
      await expect(page.locator('text=Loading questions...')).not.toBeVisible({ timeout: 5000 });
    });

    test('should show submit button after recording', async ({ page }) => {
      await expect(page.locator('[role="article"]').first()).toBeVisible();

      // Record an answer
      await page.locator('button:has-text("Start Recording")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Stop")').click();
      await page.waitForTimeout(1000);

      // Verify submit button appears
      await expect(page.locator('button:has-text("Submit for Rating")')).toBeVisible();
      await expect(page.locator('button:has-text("Submit for Rating")')).toBeEnabled();
    });

    test('should submit answer and show uploading state', async ({ page }) => {
      // Mock rate-answer API
      await page.route('**/comm-ai/rate-answer', async (route) => {
        // Delay to show uploading state
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({
            answerId: '9b3e8400-e29b-41d4-a716-446655440010',
            status: 'processing',
            message: 'Answer submitted successfully',
            submittedAt: new Date().toISOString(),
          }),
        });
      });

      // Mock rating polling API
      await page.route('**/comm-ai/rating/*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            answerId: '9b3e8400-e29b-41d4-a716-446655440010',
            status: 'processing',
            message: 'Rating in progress',
          }),
        });
      });

      await expect(page.locator('[role="article"]').first()).toBeVisible();

      // Record and submit
      await page.locator('button:has-text("Start Recording")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Stop")').click();
      await page.waitForTimeout(1000);

      // Click submit
      await page.locator('button:has-text("Submit for Rating")').click();

      // Verify uploading state
      await expect(page.locator('text=/Uploading/i')).toBeVisible();
      await expect(page.locator('button:has-text("Submitting...")')).toBeDisabled();

      // Wait for upload complete
      await page.waitForTimeout(1500);

      // Verify submitted state
      await expect(page.locator('text=/Submitted/i')).toBeVisible();
    });

    test('should poll for rating and display when available', async ({ page }) => {
      let pollCount = 0;

      // Mock rate-answer API
      await page.route('**/comm-ai/rate-answer', async (route) => {
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({
            answerId: '9b3e8400-e29b-41d4-a716-446655440010',
            status: 'processing',
            message: 'Answer submitted successfully',
            submittedAt: new Date().toISOString(),
          }),
        });
      });

      // Mock rating polling API - return processing twice, then completed
      await page.route('**/comm-ai/rating/*', async (route) => {
        pollCount++;

        if (pollCount < 3) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              answerId: '9b3e8400-e29b-41d4-a716-446655440010',
              status: 'processing',
              message: 'Rating in progress',
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              answerId: '9b3e8400-e29b-41d4-a716-446655440010',
              questionId: '7a3e8400-e29b-41d4-a716-446655440001',
              status: 'completed',
              rating: {
                score: 85,
                feedback: 'Great answer! You covered all the key points with clear examples.',
              },
              submittedAt: new Date().toISOString(),
              ratedAt: new Date().toISOString(),
            }),
          });
        }
      });

      await expect(page.locator('[role="article"]').first()).toBeVisible();

      // Record and submit
      await page.locator('button:has-text("Start Recording")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Stop")').click();
      await page.waitForTimeout(1000);
      await page.locator('button:has-text("Submit for Rating")').click();

      // Wait for polling to complete (2s intervals * 3 = 6s + buffer)
      await page.waitForTimeout(8000);

      // Verify rating is displayed
      await expect(page.locator('text=/Rating:/i')).toBeVisible();
      await expect(page.locator('text=/85\/100/i')).toBeVisible();
      await expect(page.locator('text=/Great answer/i')).toBeVisible();
    });

    test('should handle upload errors with retry option', async ({ page }) => {
      // Mock rate-answer API to fail first, then succeed
      let uploadAttempt = 0;
      await page.route('**/comm-ai/rate-answer', async (route) => {
        uploadAttempt++;

        if (uploadAttempt === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'UPLOAD_ERROR',
                message: 'Failed to upload audio',
                timestamp: new Date().toISOString(),
              },
            }),
          });
        } else {
          await route.fulfill({
            status: 202,
            contentType: 'application/json',
            body: JSON.stringify({
              answerId: '9b3e8400-e29b-41d4-a716-446655440010',
              status: 'processing',
              message: 'Answer submitted successfully',
              submittedAt: new Date().toISOString(),
            }),
          });
        }
      });

      await expect(page.locator('[role="article"]').first()).toBeVisible();

      // Record and submit
      await page.locator('button:has-text("Start Recording")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Stop")').click();
      await page.waitForTimeout(1000);
      await page.locator('button:has-text("Submit for Rating")').click();

      // Wait for error
      await page.waitForTimeout(1000);

      // Verify error state
      await expect(page.locator('text=/Upload failed/i')).toBeVisible();
      await expect(page.locator('button:has-text("Retry Submit")')).toBeVisible();

      // Click retry
      await page.locator('button:has-text("Retry Submit")').click();

      // Wait for retry
      await page.waitForTimeout(1000);

      // Verify success
      await expect(page.locator('text=/Submitted/i')).toBeVisible();
    });

    test('should allow answering next question while rating is processing', async ({ page }) => {
      // Mock rate-answer API
      await page.route('**/comm-ai/rate-answer', async (route) => {
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({
            answerId: '9b3e8400-e29b-41d4-a716-446655440010',
            status: 'processing',
            message: 'Answer submitted successfully',
            submittedAt: new Date().toISOString(),
          }),
        });
      });

      // Mock rating polling API - always return processing
      await page.route('**/comm-ai/rating/*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            answerId: '9b3e8400-e29b-41d4-a716-446655440010',
            status: 'processing',
            message: 'Rating in progress',
          }),
        });
      });

      await expect(page.locator('[role="article"]').first()).toBeVisible();

      // Record and submit first answer
      await page.locator('button:has-text("Start Recording")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Stop")').click();
      await page.waitForTimeout(1000);
      await page.locator('button:has-text("Submit for Rating")').click();

      // Wait for submission to complete
      await page.waitForTimeout(2000);

      // Verify first answer shows "Submitted" status
      await expect(page.locator('text=/Submitted/i').first()).toBeVisible();

      // Verify recording controls appear for next question (non-blocking)
      // Note: This depends on having multiple questions in the test data
      await expect(page.locator('text=/Recording answer for Question/i')).toBeVisible();
    });

    test('should display color-coded rating scores', async ({ page }) => {
      // Mock APIs for different score levels
      const testScores = [
        { score: 90, color: 'green' },
        { score: 70, color: 'yellow' },
        { score: 50, color: 'orange' },
        { score: 30, color: 'red' },
      ];

      for (const testCase of testScores) {
        await page.route('**/comm-ai/rate-answer', async (route) => {
          await route.fulfill({
            status: 202,
            contentType: 'application/json',
            body: JSON.stringify({
              answerId: crypto.randomUUID(),
              status: 'processing',
              message: 'Answer submitted successfully',
              submittedAt: new Date().toISOString(),
            }),
          });
        });

        await page.route('**/comm-ai/rating/*', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              answerId: crypto.randomUUID(),
              questionId: '7a3e8400-e29b-41d4-a716-446655440001',
              status: 'completed',
              rating: {
                score: testCase.score,
                feedback: `Score ${testCase.score} feedback`,
              },
              ratedAt: new Date().toISOString(),
            }),
          });
        });

        // Record, submit, and verify color
        await page.locator('button:has-text("Start Recording")').click();
        await page.waitForTimeout(300);
        await page.locator('button:has-text("Stop")').click();
        await page.waitForTimeout(800);
        await page.locator('button:has-text("Submit for Rating")').click();
        await page.waitForTimeout(2000);

        // Verify score badge has correct color class
        const scoreBadge = page.locator(`text=/${testCase.score}\\/100/i`).first();
        await expect(scoreBadge).toBeVisible();

        // Note: Color verification would require checking computed styles or classes
        // This is a simplified check that the score is displayed
      }
    });
  });

  test.describe('Navigation and Progress', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/qa/${TEST_EVALUATION_ID}`);
      await expect(page.locator('text=Loading questions...')).not.toBeVisible({ timeout: 5000 });
    });

    test('should display progress tracker with correct counts', async ({ page }) => {
      // Verify progress tracker is visible
      await expect(page.locator('text=Question Progress')).toBeVisible();
      await expect(page.locator('text=0 of 3 answered')).toBeVisible();

      // Verify progress bar
      await expect(page.locator('[role="progressbar"]')).toBeVisible();
    });

    test('should show question indicator dots for all questions', async ({ page }) => {
      // Verify 3 indicator dots are present
      const indicators = page.locator('[role="listitem"]');
      await expect(indicators).toHaveCount(3);

      // Verify they show question numbers
      await expect(page.locator('[aria-label="Question 1 - not answered"]')).toBeVisible();
      await expect(page.locator('[aria-label="Question 2 - not answered"]')).toBeVisible();
      await expect(page.locator('[aria-label="Question 3 - not answered"]')).toBeVisible();
    });

    test('should navigate between questions using next/previous buttons', async ({ page }) => {
      // Verify initial state (Question 1)
      await expect(page.locator('text=Question 1 of 3')).toBeVisible();

      // Click next
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      // Verify Question 2
      await expect(page.locator('text=Question 2 of 3')).toBeVisible();

      // Click next again
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      // Verify Question 3
      await expect(page.locator('text=Question 3 of 3')).toBeVisible();

      // Click previous
      await page.locator('button:has-text("Previous")').click();
      await page.waitForTimeout(500);

      // Verify back to Question 2
      await expect(page.locator('text=Question 2 of 3')).toBeVisible();
    });

    test('should disable previous button on first question', async ({ page }) => {
      await expect(page.locator('text=Question 1 of 3')).toBeVisible();

      const prevButton = page.locator('button:has-text("Previous")');
      await expect(prevButton).toBeDisabled();
    });

    test('should disable next button on last question', async ({ page }) => {
      // Navigate to last question
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(300);
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(300);

      await expect(page.locator('text=Question 3 of 3')).toBeVisible();

      const nextButton = page.locator('button:has-text("Next")');
      await expect(nextButton).toBeDisabled();
    });

    test('should update progress tracker when questions are answered', async ({
      page,
      context,
    }) => {
      // Grant microphone permissions
      await context.grantPermissions(['microphone']);

      // Mock MediaRecorder
      await page.addInitScript(() => {
        class MockMediaRecorder {
          state = 'inactive';
          ondataavailable: ((e: any) => void) | null = null;
          onstop: (() => void) | null = null;

          start() {
            this.state = 'recording';
          }
          stop() {
            this.state = 'inactive';
            setTimeout(() => {
              if (this.ondataavailable) {
                this.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
              }
              if (this.onstop) {
                this.onstop();
              }
            }, 100);
          }
          pause() {
            this.state = 'paused';
          }
          resume() {
            this.state = 'recording';
          }

          static isTypeSupported() {
            return true;
          }
        }

        (window as any).MediaRecorder = MockMediaRecorder;

        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () =>
              Promise.resolve({
                getTracks: () => [{ stop: () => {} }],
                getAudioTracks: () => [{ stop: () => {} }],
              }),
          },
          writable: true,
          configurable: true,
        });
      });

      // Verify initial progress
      await expect(page.locator('text=0 of 3 answered')).toBeVisible();

      // Record answer for Question 1
      await page.locator('button:has-text("Start Recording")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Stop")').click();
      await page.waitForTimeout(1000);

      // Verify progress updated
      await expect(page.locator('text=1 of 3 answered')).toBeVisible();

      // Verify indicator dot shows answered (checkmark)
      await expect(page.locator('[aria-label="Question 1 - answered"]')).toBeVisible();
    });

    test('should show completion message when all questions answered', async ({
      page,
      context,
    }) => {
      // Grant microphone permissions
      await context.grantPermissions(['microphone']);

      // Mock MediaRecorder
      await page.addInitScript(() => {
        class MockMediaRecorder {
          state = 'inactive';
          ondataavailable: ((e: any) => void) | null = null;
          onstop: (() => void) | null = null;

          start() {
            this.state = 'recording';
          }
          stop() {
            this.state = 'inactive';
            setTimeout(() => {
              if (this.ondataavailable) {
                this.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
              }
              if (this.onstop) {
                this.onstop();
              }
            }, 100);
          }
          pause() {
            this.state = 'paused';
          }
          resume() {
            this.state = 'recording';
          }

          static isTypeSupported() {
            return true;
          }
        }

        (window as any).MediaRecorder = MockMediaRecorder;

        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () =>
              Promise.resolve({
                getTracks: () => [{ stop: () => {} }],
                getAudioTracks: () => [{ stop: () => {} }],
              }),
          },
          writable: true,
          configurable: true,
        });
      });

      // Answer all 3 questions
      for (let i = 0; i < 3; i++) {
        await page.locator('button:has-text("Start Recording")').click();
        await page.waitForTimeout(300);
        await page.locator('button:has-text("Stop")').click();
        await page.waitForTimeout(800);

        // Navigate to next question if not last
        if (i < 2) {
          await page.locator('button:has-text("Next")').click();
          await page.waitForTimeout(300);
        }
      }

      // Verify completion message
      await expect(page.locator('text=All questions answered!')).toBeVisible();
      await expect(page.locator('text=Great work completing the Q&A session.')).toBeVisible();
      await expect(page.locator('text=3 of 3 answered')).toBeVisible();
    });

    test('should persist navigation state across page reload', async ({ page }) => {
      // Navigate to Question 2
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      await expect(page.locator('text=Question 2 of 3')).toBeVisible();

      // Reload page
      await page.reload();
      await expect(page.locator('text=Loading questions...')).not.toBeVisible({ timeout: 5000 });

      // Verify still on Question 2 (restored from IndexedDB)
      await expect(page.locator('text=Question 2 of 3')).toBeVisible();
    });
  });
});
