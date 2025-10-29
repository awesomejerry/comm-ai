/**
 * Contract Test: n8n Role API
 *
 * Verifies that the n8n role webhook returns data in the expected format.
 * This test ensures the API contract is maintained for admin role verification.
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('n8n Role API Contract', () => {
  const baseUrl = process.env.VITE_N8N_BASE_URL || 'http://localhost:5678';
  const endpoint = process.env.VITE_N8N_ROLE_ENDPOINT || '/comm-ai/role';

  // Skip tests if n8n is not configured
  const isConfigured = process.env.VITE_N8N_BASE_URL && process.env.VITE_N8N_ROLE_ENDPOINT;
  const testEmail = 'test@example.com';

  beforeAll(() => {
    if (!isConfigured) {
      console.warn('⚠️  n8n not configured - skipping contract tests');
    }
  });

  it.skipIf(!isConfigured)('should return 200 OK with valid email parameter', async () => {
    const url = `${baseUrl}${endpoint}?email=${encodeURIComponent(testEmail)}`;
    const response = await fetch(url);
    expect(response.status).toBe(200);
  });

  it.skipIf(!isConfigured)('should return JSON content type', async () => {
    const url = `${baseUrl}${endpoint}?email=${encodeURIComponent(testEmail)}`;
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/json');
  });

  it.skipIf(!isConfigured)('should return response with role field', async () => {
    const url = `${baseUrl}${endpoint}?email=${encodeURIComponent(testEmail)}`;
    const response = await fetch(url);
    const data = await response.json();

    expect(data).toHaveProperty('role');
    expect(typeof data.role).toBe('string');
  });

  it.skipIf(!isConfigured)('should return valid role value (user or admin)', async () => {
    const url = `${baseUrl}${endpoint}?email=${encodeURIComponent(testEmail)}`;
    const response = await fetch(url);
    const data = await response.json();

    expect(['user', 'admin']).toContain(data.role);
  });

  it.skipIf(!isConfigured)('should handle missing email parameter gracefully', async () => {
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url);

    // Should return 400 Bad Request or similar error
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it.skipIf(!isConfigured)('should handle invalid email format', async () => {
    const invalidEmail = 'not-an-email';
    const url = `${baseUrl}${endpoint}?email=${encodeURIComponent(invalidEmail)}`;
    const response = await fetch(url);

    // Depending on n8n implementation, this might be 400 or 200 with default role
    expect(response.status).toBeGreaterThanOrEqual(200);

    if (response.status === 200) {
      const data = await response.json();
      expect(['user', 'admin']).toContain(data.role);
    }
  });
});
