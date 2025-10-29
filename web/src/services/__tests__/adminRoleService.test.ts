/**
 * Unit Tests: Admin Role Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkIsAdmin } from '../adminRoleService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('adminRoleService', () => {
  beforeEach(() => {
    // Set up mock environment variables using vi.stubEnv
    vi.stubEnv('VITE_N8N_BASE_URL', 'https://n8n.test.com');
    vi.stubEnv('VITE_N8N_ROLE_ENDPOINT', '/comm-ai/role');
    mockFetch.mockClear();
  });

  describe('checkIsAdmin', () => {
    it('should return true for admin role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'admin' }),
      });

      const result = await checkIsAdmin('admin@test.com');
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.test.com/comm-ai/role?email=admin%40test.com',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return false for user role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'user' }),
      });

      const result = await checkIsAdmin('user@test.com');
      expect(result).toBe(false);
    });

    it('should properly encode email addresses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'user' }),
      });

      await checkIsAdmin('test+tag@example.com');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('email=test%2Btag%40example.com'),
        expect.any(Object)
      );
    });

    it('should throw error when base URL is missing', async () => {
      vi.stubEnv('VITE_N8N_BASE_URL', '');

      await expect(checkIsAdmin('test@test.com')).rejects.toThrow('n8n configuration missing');
    });

    it('should throw error when endpoint is missing', async () => {
      vi.stubEnv('VITE_N8N_ROLE_ENDPOINT', '');

      await expect(checkIsAdmin('test@test.com')).rejects.toThrow('n8n configuration missing');
    });

    it('should throw error when API returns non-OK status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(checkIsAdmin('test@test.com')).rejects.toThrow(
        'Role check failed: 404 Not Found'
      );
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(checkIsAdmin('test@test.com')).rejects.toThrow(
        'Failed to check admin role: Network error'
      );
    });

    it('should handle unknown errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce('unknown error');

      await expect(checkIsAdmin('test@test.com')).rejects.toThrow(
        'Failed to check admin role: Unknown error'
      );
    });
  });
});
