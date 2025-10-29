/**
 * Admin Role Service
 *
 * Verifies if a user has admin privileges by calling the n8n role webhook.
 */

interface RoleResponse {
  role: 'user' | 'admin';
}

/**
 * Check if a user is an admin based on their email address
 *
 * @param email - The user's email address
 * @returns Promise<boolean> - true if user has admin role, false otherwise
 * @throws Error if the role check fails or API is unavailable
 */
export async function checkIsAdmin(email: string): Promise<boolean> {
  const baseUrl = import.meta.env.VITE_N8N_BASE_URL;
  const endpoint = import.meta.env.VITE_N8N_ROLE_ENDPOINT;

  if (!baseUrl || !endpoint) {
    throw new Error(
      'n8n configuration missing: VITE_N8N_BASE_URL or VITE_N8N_ROLE_ENDPOINT not set'
    );
  }

  const url = `${baseUrl}${endpoint}?email=${encodeURIComponent(email)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Role check failed: ${response.status} ${response.statusText}`);
    }

    const data: RoleResponse = await response.json();
    return data.role === 'admin';
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to check admin role: ${error.message}`);
    }
    throw new Error('Failed to check admin role: Unknown error');
  }
}
