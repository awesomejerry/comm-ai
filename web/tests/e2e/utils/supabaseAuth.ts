import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Generates a Supabase magic link for the given email using the Supabase JS Admin API.
 * @param email The email address to generate a magic link for.
 * @returns The magic link URL.
 */
export async function generateMagicLink(email: string): Promise<string> {
  // Use the dev server URL for redirect
  const redirectTo = 'http://localhost:5173/';
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo,
    },
  });
  if (error) {
    throw new Error(`Failed to generate magic link: ${error.message}`);
  }
  if (!data?.properties?.action_link) {
    throw new Error('No action_link returned from Supabase');
  }
  return data.properties.action_link;
}

/**
 * Logs in a user via magic link in a Playwright test.
 * @param page Playwright Page object
 * @param email Email to login with
 */
export async function loginWithMagicLink(page: import('@playwright/test').Page, email: string) {
  const magicLink = await generateMagicLink(email);
  await page.goto(magicLink);
  // Optionally, wait for redirect or some UI element that indicates login success
}
