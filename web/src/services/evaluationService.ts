/**
 * Evaluation Service
 *
 * Fetches evaluation results from the n8n webhook with retry logic.
 */

import { EvaluationResult } from '../models/evaluation';

interface N8nEvaluationResponse {
  results: EvaluationResult[];
}

/**
 * Sleep utility for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch evaluations with retry logic and exponential backoff
 *
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise<EvaluationResult[]> - Array of evaluation results
 * @throws Error if fetch fails after all retries
 */
export async function fetchEvaluations(maxRetries = 3): Promise<EvaluationResult[]> {
  const baseUrl = import.meta.env.VITE_N8N_BASE_URL;
  const endpoint = import.meta.env.VITE_N8N_EVALUATION_ENDPOINT;

  if (!baseUrl || !endpoint) {
    throw new Error(
      'n8n configuration missing: VITE_N8N_BASE_URL or VITE_N8N_EVALUATION_ENDPOINT not set'
    );
  }

  const url = `${baseUrl}${endpoint}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: N8nEvaluationResponse = await response.json();
      return data.results || [];
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        if (error instanceof Error) {
          throw new Error(
            `Failed to fetch evaluations after ${maxRetries} attempts: ${error.message}`
          );
        }
        throw new Error(`Failed to fetch evaluations after ${maxRetries} attempts: Unknown error`);
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoffMs = Math.pow(2, attempt) * 1000;
      await sleep(backoffMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  return [];
}
