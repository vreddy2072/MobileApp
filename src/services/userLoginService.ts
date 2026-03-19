import { logger } from '../utils/logger';
import { getAppName } from './envService';
import { callEdgeFunction } from './supabaseApi';
import { getAccessToken } from '../utils/userId';

let lastLoggedUserId: string | null = null;

/**
 * Call Supabase ai-user-login-function when a user logs in.
 * Should be fire-and-forget; errors are logged and do not block the UI.
 */
export async function logUserLogin(userId: string | null): Promise<void> {
  if (!userId) {
    return;
  }

  if (lastLoggedUserId === userId) {
    return;
  }

  lastLoggedUserId = userId;

  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      logger.warn('logUserLogin: access token not available');
      return;
    }

    const appName = getAppName();
    logger.debug('Calling ai-user-login-function', { userId, appName });

    const { error } = await callEdgeFunction('ai-user-login-function', {
      user_id: userId,
      app_name: appName,
    }, accessToken);

    if (error) {
      logger.error('ai-user-login-function failed', error);
    } else {
      logger.debug('ai-user-login-function succeeded');
    }
  } catch (error) {
    logger.error('Error calling ai-user-login-function', error);
  }
}

