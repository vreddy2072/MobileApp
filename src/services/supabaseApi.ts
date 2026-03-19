/**
 * Supabase API Wrapper
 *
 * Unified wrapper for calling Supabase Edge Functions.
 * Automatically adds x-app-name header to all requests.
 * On 401 or "JWT expired", refreshes the session and retries once.
 */

import { getAppName, getSupabaseUrl, getSupabaseAnonKey } from './envService';
import { getFreshAccessToken } from '../../lib/supabase';
import { logger } from '../utils/logger';

/**
 * Call a Supabase Edge Function with automatic header injection
 *
 * @param name - Edge function name (e.g., 'ai-call-function')
 * @param payload - Request payload to send to the edge function
 * @param accessToken - Optional Supabase Auth access token. If provided, used as Bearer token; otherwise anon key.
 * @returns Promise with { data, error } format matching supabase.functions.invoke()
 */
export async function callEdgeFunction(
  name: string,
  payload: any,
  accessToken?: string | null
): Promise<{ data: any; error: any }> {
  try {
    const appName = getAppName();

    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();

    if (!supabaseUrl || !supabaseAnonKey) {
      const errorMsg = 'Supabase configuration missing';
      logger.error(errorMsg);
      return {
        data: null,
        error: {
          message: errorMsg,
          context: null,
        },
      };
    }

    const normalizedPayload =
      payload && typeof payload === 'object'
        ? { ...payload }
        : payload === undefined || payload === null
        ? {}
        : { value: payload };

    const payloadWithAppName = {
      ...normalizedPayload,
      app_name: appName,
    };

    logger.debug('Calling edge function', {
      functionName: name,
      appName,
      payloadKeys: Object.keys(payloadWithAppName),
      hasAccessToken: !!accessToken,
    });

    const functionUrl = `${supabaseUrl}/functions/v1/${name}`;

    if (accessToken !== undefined && accessToken !== null) {
      if (typeof accessToken !== 'string' || accessToken.trim() === '') {
        const errorMsg = 'Invalid access token: must be a non-empty string';
        logger.error(errorMsg);
        return {
          data: null,
          error: { message: errorMsg, context: null },
        };
      }
    }

    const authToken = accessToken || supabaseAnonKey;

    if (!accessToken) {
      logger.warn('No access token provided, falling back to supabaseAnonKey', { functionName: name });
    }

    let response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-app-name': appName,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(payloadWithAppName),
    });

    let data: any = null;
    let error: any = null;
    let responseText = await response.text();

    const isJwtExpired =
      response.status === 401 ||
      (typeof responseText === 'string' &&
        (responseText.includes('JWT expired') || responseText.includes('jwt expired')));
    if (isJwtExpired && accessToken) {
      const freshToken = await getFreshAccessToken();
      if (freshToken) {
        logger.debug('Retrying edge function with refreshed token', { functionName: name });
        response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${freshToken}`,
            'x-app-name': appName,
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify(payloadWithAppName),
        });
        responseText = await response.text();
      }
    }

    if (!response.ok) {
      // Error response
      try {
        const errorData = JSON.parse(responseText);
        error = {
          message: errorData.error || errorData.message || `Edge Function returned a non-2xx status code`,
          context: {
            status: response.status,
            statusText: response.statusText,
            _bodyBlob: {
              status: response.status,
              _data: responseText,
            },
          },
        };
      } catch {
        error = {
          message: `Edge Function returned a non-2xx status code`,
          context: {
            status: response.status,
            statusText: response.statusText,
            _bodyBlob: {
              status: response.status,
              _data: responseText,
            },
          },
        };
      }
    } else {
      // Success response
      try {
        data = JSON.parse(responseText);
      } catch {
        // If parsing fails, treat as plain text
        data = responseText;
      }
    }

    if (error) {
      logger.error('Edge function call failed', {
        functionName: name,
        error: error.message,
        errorContext: error.context,
        statusCode: response.status,
        statusText: response.statusText,
      });
    } else {
      logger.debug('Edge function call successful', {
        functionName: name,
        statusCode: response.status,
        statusText: response.statusText,
        hasData: !!data,
      });
    }

    return { data, error };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error calling edge function', {
      functionName: name,
      error: errorMessage,
    });

    // Return error in the same format as supabase.functions.invoke()
    return {
      data: null,
      error: {
        message: errorMessage,
        context: error,
      },
    };
  }
}


