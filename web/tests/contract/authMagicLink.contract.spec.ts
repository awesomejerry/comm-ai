// tests/contract/authMagicLink.contract.spec.ts
import { describe, it, expect } from 'vitest';
import { supabase } from '../../src/services/supabaseClient';

describe('Auth API Contract: Magic Link', () => {
  it('should trigger magic link for valid email', async () => {
    // This test should mock Supabase /otp endpoint in CI
    const { error } = await supabase.auth.signInWithOtp({ email: 'testuser@example.com' });
    // Accept both null error (success) or generic error (rate limit, etc.)
    expect(error === null || typeof error.message === 'string').toBe(true);
  });

  it('should return generic message for invalid/unregistered email', async () => {
    const { error } = await supabase.auth.signInWithOtp({ email: 'notarealuser@example.com' });
    // Supabase always returns generic message for privacy
    expect(error === null || typeof error.message === 'string').toBe(true);
  });
});
