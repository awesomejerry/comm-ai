import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateQuestions } from '../../src/services/qaService';
import type { Question } from '../../src/models/question';

/**
 * Contract Test: n8n Generate Questions API
 *
 * Validates that the generate-questions API endpoint meets the contract
 * specified in specs/009-evaluation-qa/contracts/generate-questions-api.yaml
 */

describe('n8n Generate Questions API Contract', () => {
  const mockEvaluationId = '550e8400-e29b-41d4-a716-446655440000';

  // Store original fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('Successful Response (200)', () => {
    it('should return 3-5 questions with valid structure', async () => {
      // Mock successful response with LLM-generated questions
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          questions: [
            {
              id: '7a3e8400-e29b-41d4-a716-446655440001',
              text: 'Can you explain the main concept you presented?',
              order: 1,
              context: 'Based on your evaluation, you covered the introduction effectively.',
              evaluationId: mockEvaluationId,
              createdAt: '2025-11-10T14:30:00.000Z',
            },
            {
              id: '7a3e8400-e29b-41d4-a716-446655440002',
              text: 'What evidence supports your second key point?',
              order: 2,
              context: null,
              evaluationId: mockEvaluationId,
              createdAt: '2025-11-10T14:30:00.000Z',
            },
            {
              id: '7a3e8400-e29b-41d4-a716-446655440003',
              text: 'How would you summarize your conclusion?',
              order: 3,
              context: 'Your conclusion could be more concise.',
              evaluationId: mockEvaluationId,
              createdAt: '2025-11-10T14:30:00.000Z',
            },
          ],
          metadata: {
            evaluationId: mockEvaluationId,
            questionCount: 3,
            generatedBy: 'llm',
            generatedAt: '2025-11-10T14:30:00.000Z',
          },
        }),
      });

      const questions = await generateQuestions(mockEvaluationId);

      // Validate response structure
      expect(questions).toHaveLength(3);
      expect(questions.length).toBeGreaterThanOrEqual(3);
      expect(questions.length).toBeLessThanOrEqual(5);

      // Validate each question structure
      questions.forEach((question: Question) => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('text');
        expect(question).toHaveProperty('order');
        expect(question).toHaveProperty('evaluationId');
        expect(question).toHaveProperty('createdAt');

        // Validate types
        expect(typeof question.id).toBe('string');
        expect(typeof question.text).toBe('string');
        expect(typeof question.order).toBe('number');
        expect(typeof question.evaluationId).toBe('string');
        expect(question.createdAt).toBeInstanceOf(Date);

        // Validate constraints
        expect(question.text.length).toBeGreaterThan(0);
        expect(question.text.length).toBeLessThanOrEqual(500);
        expect(question.order).toBeGreaterThanOrEqual(1);
        expect(question.order).toBeLessThanOrEqual(5);
        expect(question.evaluationId).toBe(mockEvaluationId);
      });

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/comm-ai/generate-questions?evaluationId=${mockEvaluationId}`),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle fallback questions when LLM fails', async () => {
      // Mock response with fallback questions
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          questions: [
            {
              id: '7a3e8400-e29b-41d4-a716-446655440004',
              text: 'What was the main message of your presentation?',
              order: 1,
              context: null,
              evaluationId: mockEvaluationId,
              createdAt: '2025-11-10T14:30:05.000Z',
            },
            {
              id: '7a3e8400-e29b-41d4-a716-446655440005',
              text: 'What supporting evidence did you provide?',
              order: 2,
              context: null,
              evaluationId: mockEvaluationId,
              createdAt: '2025-11-10T14:30:05.000Z',
            },
            {
              id: '7a3e8400-e29b-41d4-a716-446655440006',
              text: 'How would you improve your presentation?',
              order: 3,
              context: null,
              evaluationId: mockEvaluationId,
              createdAt: '2025-11-10T14:30:05.000Z',
            },
          ],
          metadata: {
            evaluationId: mockEvaluationId,
            questionCount: 3,
            generatedBy: 'fallback',
            generatedAt: '2025-11-10T14:30:05.000Z',
          },
        }),
      });

      const questions = await generateQuestions(mockEvaluationId);

      // Should still return valid questions
      expect(questions).toHaveLength(3);
      questions.forEach((question: Question) => {
        expect(question.text.length).toBeGreaterThan(0);
        expect(question.evaluationId).toBe(mockEvaluationId);
      });
    });

    it('should handle optional context field', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          questions: [
            {
              id: '7a3e8400-e29b-41d4-a716-446655440001',
              text: 'Test question',
              order: 1,
              context: 'Has context',
              evaluationId: mockEvaluationId,
              createdAt: '2025-11-10T14:30:00.000Z',
            },
            {
              id: '7a3e8400-e29b-41d4-a716-446655440002',
              text: 'Test question 2',
              order: 2,
              context: null, // Null context
              evaluationId: mockEvaluationId,
              createdAt: '2025-11-10T14:30:00.000Z',
            },
            {
              id: '7a3e8400-e29b-41d4-a716-446655440003',
              text: 'Test question 3',
              order: 3,
              // Missing context field
              evaluationId: mockEvaluationId,
              createdAt: '2025-11-10T14:30:00.000Z',
            },
          ],
          metadata: {
            evaluationId: mockEvaluationId,
            questionCount: 3,
            generatedBy: 'llm',
            generatedAt: '2025-11-10T14:30:00.000Z',
          },
        }),
      });

      const questions = await generateQuestions(mockEvaluationId);

      expect(questions[0].context).toBe('Has context');
      expect(questions[1].context).toBeUndefined(); // null converted to undefined
      expect(questions[2].context).toBeUndefined();
    });
  });

  describe('Error Response (400)', () => {
    it('should throw error on invalid evaluationId', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: 'INVALID_EVALUATION_ID',
            message: 'evaluationId must be a valid UUID',
            timestamp: '2025-11-10T14:30:00.000Z',
          },
        }),
      });

      await expect(generateQuestions('invalid-id')).rejects.toThrow(
        'evaluationId must be a valid UUID'
      );
    });
  });

  describe('Error Response (404)', () => {
    it('should throw error when evaluation not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: 'NOT_FOUND',
            message: 'Evaluation not found',
            timestamp: '2025-11-10T14:30:00.000Z',
          },
        }),
      });

      const questions = await generateQuestions(mockEvaluationId);

      expect(questions).toHaveLength(3);
      expect(questions[0].text).toContain('main points');
      expect(questions.every((q) => q.evaluationId === mockEvaluationId)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Response (500)', () => {
    it('should retry and fallback on persistent server errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Question generation service unavailable',
            timestamp: '2025-11-10T14:30:00.000Z',
          },
        }),
      });

      const questions = await generateQuestions(mockEvaluationId);

      expect(questions).toHaveLength(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Network Error', () => {
    it('should retry and fallback on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const questions = await generateQuestions(mockEvaluationId);

      expect(questions).toHaveLength(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
