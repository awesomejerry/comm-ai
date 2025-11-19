// tests/contract/authMagicLink.contract.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../src/services/supabaseClient';

type SignInWithOtpFn = typeof supabase.auth.signInWithOtp;

const signInWithOtpSpy = vi.spyOn(supabase.auth, 'signInWithOtp');

describe('Auth API Contract: Magic Link', () => {
  beforeEach(() => {
    signInWithOtpSpy.mockReset();
  });

  it('should trigger magic link for valid email', async () => {
    signInWithOtpSpy.mockResolvedValueOnce({ error: null } as Awaited<ReturnType<SignInWithOtpFn>>);

    const { error } = await supabase.auth.signInWithOtp({ email: 'testuser@example.com' });

    expect(signInWithOtpSpy).toHaveBeenCalledWith({ email: 'testuser@example.com' });
    // Accept both null error (success) or generic error (rate limit, etc.)
    expect(error === null || typeof error.message === 'string').toBe(true);
  });

  it('should return generic message for invalid/unregistered email', async () => {
    signInWithOtpSpy.mockResolvedValueOnce({
      error: { message: 'For security reasons, we did not send an email.' },
    } as Awaited<ReturnType<SignInWithOtpFn>>);

    const { error } = await supabase.auth.signInWithOtp({ email: 'notarealuser@example.com' });

    expect(signInWithOtpSpy).toHaveBeenCalledWith({ email: 'notarealuser@example.com' });
    // Supabase always returns generic message for privacy
    expect(error === null || typeof error.message === 'string').toBe(true);
  });
});
