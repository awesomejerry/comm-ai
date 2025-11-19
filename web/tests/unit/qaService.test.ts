import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateQuestions, submitAnswerForRating } from '../../src/services/qaService';
import type { Question } from '../../src/models/question';
import type { AudioAnswer } from '../../src/models/audioAnswer';

describe('qaService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockAudioAnswer = (
    questionId: string,
    overrides?: Partial<AudioAnswer>
  ): AudioAnswer => ({
    id: 'answer-client-id',
    questionId,
    audioBlob: new Blob(['fake audio data'], { type: 'audio/webm' }),
    audioFormat: 'webm' as const,
    duration: 30,
    uploadStatus: 'pending' as const,
    submittedAt: new Date('2025-11-10T14:30:00.000Z'),
    ...overrides,
  });

  describe('generateQuestions', () => {
    const evaluationId = '550e8400-e29b-41d4-a716-446655440000';
    const mockQuestions: Question[] = [
      {
        id: '7a3e8400-e29b-41d4-a716-446655440001',
        text: 'Can you explain the main concept?',
        order: 1,
        evaluationId,
        createdAt: new Date('2025-11-10T14:30:00.000Z'),
      },
      {
        id: '7a3e8400-e29b-41d4-a716-446655440002',
        text: 'How would you improve this presentation?',
        order: 2,
        evaluationId,
        createdAt: new Date('2025-11-10T14:31:00.000Z'),
      },
      {
        id: '7a3e8400-e29b-41d4-a716-446655440003',
        text: 'What are the key takeaways?',
        order: 3,
        evaluationId,
        createdAt: new Date('2025-11-10T14:32:00.000Z'),
      },
    ];

    it('should successfully generate questions on first attempt', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ questions: mockQuestions }),
      });

      const result = await generateQuestions(evaluationId);

      expect(result).toEqual(mockQuestions);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/comm-ai/generate-questions?evaluationId=${evaluationId}`),
        expect.any(Object)
      );
    });

    it('should return fallback questions on 404', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await generateQuestions(evaluationId);

      expect(result).toHaveLength(3);
      expect(result[0].text).toContain('What were the main points');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 5xx errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ questions: mockQuestions }),
        });

      const result = await generateQuestions(evaluationId);

      expect(result).toEqual(mockQuestions);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should return fallback questions after 3 failed attempts', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await generateQuestions(evaluationId);

      expect(result).toHaveLength(3);
      expect(result[0].text).toContain('What were the main points');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      const result = await generateQuestions(evaluationId);

      expect(result).toHaveLength(3);
      expect(result[0].text).toContain('What were the main points');
    });

    it('should validate question count (3-5)', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ questions: [mockQuestions[0], mockQuestions[1]] }), // Only 2
      });

      await expect(generateQuestions(evaluationId)).rejects.toThrow('Invalid question count');
    });

    it('should handle malformed response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'response' }),
      });

      await expect(generateQuestions(evaluationId)).rejects.toThrow();
    });
  });

  describe('submitAnswerForRating', () => {
    const questionId = '7a3e8400-e29b-41d4-a716-446655440001';
    const evaluationId = '550e8400-e29b-41d4-a716-446655440000';
    const mockAnswerId = 'answer-12345';
    const mockScore = 87;
    const mockFeedback = 'Thorough explanation with clear structure.';

    it('should successfully submit audio answer', async () => {
      const mockAnswer = createMockAudioAnswer(questionId);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: mockAnswerId,
          created_at: '2025-11-10T14:35:00.000Z',
          questionId,
          score: mockScore.toString(),
          feedback: mockFeedback,
          text: 'Thank you.',
        }),
      });

      const result = await submitAnswerForRating(mockAnswer, evaluationId);

      expect(result.answerId).toBe(mockAnswerId);
      expect(result.rating.score).toBe(mockScore);
      expect(result.rating.feedback).toBe(mockFeedback);
      expect(result.rating.ratedAt).toBeInstanceOf(Date);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/comm-ai/rate-answer'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should handle FormData correctly', async () => {
      const mockAnswer = createMockAudioAnswer(questionId);
      let capturedFormData: FormData | undefined;

      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (_url, options) => {
        capturedFormData = options?.body as FormData;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: mockAnswerId,
            created_at: '2025-11-10T14:35:00.000Z',
            questionId,
            score: mockScore,
            feedback: mockFeedback,
          }),
        };
      });

      await submitAnswerForRating(mockAnswer, evaluationId);

      expect(capturedFormData).toBeInstanceOf(FormData);
      expect(capturedFormData?.get('questionId')).toBe(questionId);
      expect(capturedFormData?.get('evaluationId')).toBe(evaluationId);
      expect(capturedFormData?.get('audioFile')).toBeInstanceOf(Blob);
    });

    it('should throw on 400 error', async () => {
      const mockAnswer = createMockAudioAnswer(questionId);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid audio format' } }),
      });

      await expect(submitAnswerForRating(mockAnswer, evaluationId)).rejects.toThrow(
        'Invalid audio format'
      );
    });

    it('should throw on 404 error', async () => {
      const mockAnswer = createMockAudioAnswer(questionId);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Question not found' } }),
      });

      await expect(submitAnswerForRating(mockAnswer, evaluationId)).rejects.toThrow(
        'Question not found'
      );
    });

    it('should throw on 500 error', async () => {
      const mockAnswer = createMockAudioAnswer(questionId);

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'Internal server error' } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: 'Internal server error' } }),
        });

      await expect(submitAnswerForRating(mockAnswer, evaluationId)).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should handle network errors', async () => {
      const mockAnswer = createMockAudioAnswer(questionId);

      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      await expect(submitAnswerForRating(mockAnswer, evaluationId)).rejects.toThrow(
        'Network error'
      );
    });

    it('should throw when score cannot be converted to number', async () => {
      const mockAnswer = createMockAudioAnswer(questionId);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: mockAnswerId,
          created_at: '2025-11-10T14:35:00.000Z',
          questionId,
          score: 'not-a-number',
          feedback: mockFeedback,
        }),
      });

      await expect(submitAnswerForRating(mockAnswer, evaluationId)).rejects.toThrow(
        'Invalid score returned from rating service'
      );
    });
  });
});
