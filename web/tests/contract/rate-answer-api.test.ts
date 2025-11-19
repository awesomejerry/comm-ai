import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitAnswerForRating } from '../../src/services/qaService';
import type { AudioAnswer } from '../../src/models/audioAnswer';

/**
 * Contract Test: n8n Rate Answer API
 *
 * Validates that the rate-answer API endpoint meets the contract
 * specified in specs/009-evaluation-qa/contracts/rate-answer-api.yaml
 */

describe('n8n Rate Answer API Contract', () => {
  const mockEvaluationId = '550e8400-e29b-41d4-a716-446655440000';
  const mockQuestionId = '7a3e8400-e29b-41d4-a716-446655440001';
  const mockAnswerId = '9b3e8400-e29b-41d4-a716-446655440010';

  // Store original fetch
  const originalFetch = global.fetch;

  // Create mock audio blob
  const createMockAudioAnswer = (): AudioAnswer => ({
    id: 'local-answer-id',
    questionId: mockQuestionId,
    audioBlob: new Blob(['fake audio data'], { type: 'audio/webm' }),
    audioFormat: 'webm',
    duration: 45,
    uploadStatus: 'pending',
    submittedAt: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('POST /comm-ai/rate-answer', () => {
    describe('Successful Response (200)', () => {
      it('should submit audio and return answer rating payload', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            id: mockAnswerId,
            created_at: '2025-11-10T14:35:02.000Z',
            questionId: mockQuestionId,
            score: '85',
            feedback: 'Good explanation with clear examples.',
            text: 'Thank you.',
          }),
        });

        const answer = createMockAudioAnswer();
        const result = await submitAnswerForRating(answer, mockEvaluationId);

        expect(result.answerId).toBe(mockAnswerId);
        expect(result.rating.score).toBe(85);
        expect(result.rating.feedback).toBe('Good explanation with clear examples.');
        expect(result.rating.ratedAt).toBeInstanceOf(Date);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/comm-ai/rate-answer'),
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData),
          })
        );

        const call = (global.fetch as any).mock.calls[0];
        const formData = call[1].body as FormData;
        expect(formData.get('questionId')).toBe(mockQuestionId);
        expect(formData.get('evaluationId')).toBe(mockEvaluationId);
        expect(formData.get('audioFormat')).toBe('webm');
        expect(formData.get('duration')).toBe('45');
        expect(formData.get('audioFile')).toBeInstanceOf(Blob);
      });
    });

    describe('Error Response (400)', () => {
      it('should throw error on invalid audio format', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({
            error: {
              code: 'INVALID_FORMAT',
              message: "audioFormat must be 'webm' or 'mp4'",
              timestamp: '2025-11-10T14:35:00.000Z',
            },
          }),
        });

        const answer = createMockAudioAnswer();
        await expect(submitAnswerForRating(answer, mockEvaluationId)).rejects.toThrow(
          "audioFormat must be 'webm' or 'mp4'"
        );
      });

      it('should throw error on file too large', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'Audio file must be under 50MB',
              timestamp: '2025-11-10T14:35:00.000Z',
            },
          }),
        });

        const answer = createMockAudioAnswer();
        await expect(submitAnswerForRating(answer, mockEvaluationId)).rejects.toThrow(
          'Audio file must be under 50MB'
        );
      });

      it('should throw error on missing required field', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({
            error: {
              code: 'MISSING_FIELD',
              message: 'questionId is required',
              timestamp: '2025-11-10T14:35:00.000Z',
            },
          }),
        });

        const answer = createMockAudioAnswer();
        await expect(submitAnswerForRating(answer, mockEvaluationId)).rejects.toThrow(
          'questionId is required'
        );
      });
    });

    describe('Error Response (404)', () => {
      it('should throw error when question not found', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          json: async () => ({
            error: {
              code: 'NOT_FOUND',
              message: `Question with id ${mockQuestionId} not found`,
              timestamp: '2025-11-10T14:35:00.000Z',
            },
          }),
        });

        const answer = createMockAudioAnswer();
        await expect(submitAnswerForRating(answer, mockEvaluationId)).rejects.toThrow('not found');
      });
    });

    describe('Error Response (500)', () => {
      it('should retry and throw on server error', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => ({
            error: {
              code: 'RATING_SERVICE_ERROR',
              message: 'Rating service is currently unavailable.',
              timestamp: '2025-11-10T14:35:00.000Z',
            },
          }),
        });

        const answer = createMockAudioAnswer();
        await expect(submitAnswerForRating(answer, mockEvaluationId)).rejects.toThrow();

        // Should have retried up to configured max attempts (3)
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });
    });
  });
});
