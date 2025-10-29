/**
 * Unit Tests: Evaluation Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchEvaluations } from '../evaluationService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('evaluationService', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_N8N_BASE_URL', 'https://n8n.test.com');
    vi.stubEnv('VITE_N8N_EVALUATION_ENDPOINT', '/comm-ai/evaluation');
    mockFetch.mockClear();
    vi.clearAllTimers();
  });

  describe('fetchEvaluations', () => {
    it('should return evaluations on successful fetch', async () => {
      const mockEvaluations = [
        {
          id: '1',
          created_at: '2025-10-28T10:00:00Z',
          input: 'test input',
          output: 'test output',
          startSlide: '1',
          endSlide: '5',
          audience: 'team',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockEvaluations }),
      });

      const result = await fetchEvaluations();
      expect(result).toEqual(mockEvaluations);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.test.com/comm-ai/evaluation',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return empty array when results is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await fetchEvaluations();
      expect(result).toEqual([]);
    });

    it('should return empty array when results is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await fetchEvaluations();
      expect(result).toEqual([]);
    });

    it('should throw error when base URL is missing', async () => {
      vi.stubEnv('VITE_N8N_BASE_URL', '');

      await expect(fetchEvaluations()).rejects.toThrow('n8n configuration missing');
    });

    it('should throw error when endpoint is missing', async () => {
      vi.stubEnv('VITE_N8N_EVALUATION_ENDPOINT', '');

      await expect(fetchEvaluations()).rejects.toThrow('n8n configuration missing');
    });

    it('should retry on failure with exponential backoff', async () => {
      vi.useFakeTimers();

      // First two attempts fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        });

      const promise = fetchEvaluations(3);

      // Fast-forward through backoff delays
      await vi.advanceTimersByTimeAsync(1000); // First retry after 1s
      await vi.advanceTimersByTimeAsync(2000); // Second retry after 2s

      const result = await promise;
      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should throw error after max retries exceeded', async () => {
      vi.useFakeTimers();

      mockFetch.mockRejectedValue(new Error('Network error'));

      const promise = fetchEvaluations(2);

      // Fast-forward through both retry attempts
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry (final)

      await expect(promise).rejects.toThrow(
        'Failed to fetch evaluations after 2 attempts: Network error'
      );
      expect(mockFetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchEvaluations(1)).rejects.toThrow(
        'Failed to fetch evaluations after 1 attempts: HTTP 500: Internal Server Error'
      );
    });

    it('should handle unknown errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce('unknown error');

      await expect(fetchEvaluations(1)).rejects.toThrow(
        'Failed to fetch evaluations after 1 attempts: Unknown error'
      );
    });
  });
});
