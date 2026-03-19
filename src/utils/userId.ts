/**
 * User ID Utility
 *
 * Gets userId from Supabase Auth (auth store). Returns Supabase user id (UUID) when signed in, null otherwise.
 * All UUID generation logic has been removed - app now requires authentication.
 */

import { useAuthStore } from '../state/authStore';
import { logger } from './logger';

/**
 * Get userId from Supabase Auth
 * Returns the user's UUID when signed in, null otherwise
 *
 * This function can be called from services (outside React components)
 * by reading from the Zustand store updated by the auth subscription in App.
 */
export async function getUserId(): Promise<string | null> {
  try {
    const userId = useAuthStore.getState().userId;

    if (!userId) {
      logger.debug('No user ID available - user not signed in');
      return null;
    }

    return userId;
  } catch (error) {
    logger.error('Error getting user ID', error);
    return null;
  }
}

/**
 * Get current access token synchronously from auth store.
 * Used by services that need to pass the token to edge function calls.
 */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
