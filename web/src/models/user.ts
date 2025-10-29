// src/models/user.ts
export interface User {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  role: 'user' | 'admin';
}
