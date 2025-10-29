// src/services/authService.ts
import { supabase } from './supabaseClient';

export async function requestMagicLink(
  email: string,
  redirectTo?: string
): Promise<{ success: boolean; rateLimited?: boolean }> {
  try {
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const options = redirectTo
      ? {
          emailRedirectTo: `${baseUrl}/#/login-redirect?redirectTo=${encodeURIComponent(redirectTo)}`,
        }
      : undefined;
    const { error } = await supabase.auth.signInWithOtp({ email, options });
    if (!error) return { success: true };
    if (error.status === 400 && error.message.toLowerCase().includes('rate')) {
      return { success: false, rateLimited: true };
    }
    // Supabase returns generic error for privacy
    return { success: false };
  } catch {
    return { success: false };
  }
}

/**
 * Get the current authentication session (if any).
 */
export async function getSession() {
  return supabase.auth.getSession();
}
