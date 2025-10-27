// src/services/authApiContract.ts
/**
 * API contract for Supabase Auth (email magic link)
 * Based on OpenAPI spec in contracts/auth-api.yaml
 */

export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkResponse {
  status: 200 | 400 | 404;
  message: string;
}

export interface UserSession {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  role: 'user';
}
