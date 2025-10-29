/**
 * Contract Test: n8n Evaluation API
 *
 * Verifies that the n8n evaluation webhook returns data in the expected format.
 * This test ensures the API contract is maintained between the frontend and n8n.
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('n8n Evaluation API Contract', () => {
  const baseUrl = process.env.VITE_N8N_BASE_URL || 'http://localhost:5678';
  const endpoint = process.env.VITE_N8N_EVALUATION_ENDPOINT || '/comm-ai/evaluation';
  const url = `${baseUrl}${endpoint}`;

  // Skip tests if n8n is not configured
  const isConfigured = process.env.VITE_N8N_BASE_URL && process.env.VITE_N8N_EVALUATION_ENDPOINT;

  beforeAll(() => {
    if (!isConfigured) {
      console.warn('⚠️  n8n not configured - skipping contract tests');
    }
  });

  it.skipIf(!isConfigured)('should return 200 OK', async () => {
    const response = await fetch(url);
    expect(response.status).toBe(200);
  });

  it.skipIf(!isConfigured)('should return JSON content type', async () => {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');
  });

  it.skipIf(!isConfigured)('should return response with results array', async () => {
    const response = await fetch(url);
    const data = await response.json();

    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it.skipIf(!isConfigured)('should return evaluation results with correct structure', async () => {
    const response = await fetch(url);
    const data = await response.json();

    if (data.results.length > 0) {
      const evaluation = data.results[0];

      // Required fields
      expect(evaluation).toHaveProperty('id');
      expect(evaluation).toHaveProperty('created_at');
      expect(typeof evaluation.id).toBe('string');
      expect(typeof evaluation.created_at).toBe('string');

      // Optional fields (can be null)
      expect('input' in evaluation).toBe(true);
      expect('output' in evaluation).toBe(true);
      expect('startSlide' in evaluation).toBe(true);
      expect('endSlide' in evaluation).toBe(true);
      expect('audience' in evaluation).toBe(true);

      // Validate created_at is valid ISO 8601 date
      const date = new Date(evaluation.created_at);
      expect(date.toString()).not.toBe('Invalid Date');
    }
  });

  it.skipIf(!isConfigured)('should handle null values in evaluation fields', async () => {
    const response = await fetch(url);
    const data = await response.json();

    if (data.results.length > 0) {
      const evaluation = data.results[0];

      // These fields can be null
      if (evaluation.input !== null) {
        expect(typeof evaluation.input).toBe('string');
      }
      if (evaluation.output !== null) {
        expect(typeof evaluation.output).toBe('string');
      }
      if (evaluation.startSlide !== null) {
        expect(typeof evaluation.startSlide).toBe('string');
      }
      if (evaluation.endSlide !== null) {
        expect(typeof evaluation.endSlide).toBe('string');
      }
      if (evaluation.audience !== null) {
        expect(typeof evaluation.audience).toBe('string');
      }
    }
  });
});
