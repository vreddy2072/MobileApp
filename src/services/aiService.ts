/**
 * AI Service
 * 
 * Service layer for calling AI APIs hosted on Supabase Edge Functions.
 * Provides a clean interface for making AI API calls with error handling.
 * 
 * TODO: Update 'ai-call-function' to your actual AI edge function name
 */

import { logger } from '../utils/logger';
import { useTokenStore } from './tokenService';
import { getUserId, getAccessToken } from '../utils/userId';
import { callEdgeFunction } from './supabaseApi';

export interface AICallOptions {
  functionName?: string;
  [key: string]: unknown; // Allow additional options to pass through to Edge Function
}

export interface AIResponse {
  data: unknown | null;
  error: string | null;
}

export interface SendPromptResponse {
  success: boolean;
  output?: string;
  error?: {
    type: 'moderation' | 'no_tokens' | 'server' | 'unknown';
    message: string;
  };
}

/**
 * Get the default AI function name
 * Returns the hard-coded edge function name 'ai-call-function'
 */
function getDefaultFunctionName(): string {
  return 'ai-call-function';
}

/**
 * Parse error from edge function response to identify error type
 */
function parseErrorType(error: any): 'moderation' | 'no_tokens' | 'server' | 'unknown' {
  const errorMessage = error?.message || error?.error || String(error || '').toLowerCase();
  const errorCode = error?.code || error?.status || '';

  // Check for moderation/content policy errors
  if (
    errorMessage.includes('moderation') ||
    errorMessage.includes('content policy') ||
    errorMessage.includes('inappropriate') ||
    errorMessage.includes('violates') ||
    errorCode === 'MODERATION_ERROR' ||
    errorCode === 'CONTENT_POLICY_VIOLATION'
  ) {
    return 'moderation';
  }

  // Check for token/balance errors
  if (
    errorMessage.includes('token') ||
    errorMessage.includes('balance') ||
    errorMessage.includes('insufficient') ||
    errorMessage.includes('not enough') ||
    errorCode === 'INSUFFICIENT_TOKENS' ||
    errorCode === 'NO_TOKENS' ||
    errorCode === 'BALANCE_TOO_LOW'
  ) {
    return 'no_tokens';
  }

  // Check for server errors
  if (
    errorCode >= 500 ||
    errorMessage.includes('server') ||
    errorMessage.includes('internal') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('network')
  ) {
    return 'server';
  }

  return 'unknown';
}

/**
 * Get user-friendly error message based on error type
 */
function getErrorMessage(type: 'moderation' | 'no_tokens' | 'server' | 'unknown'): string {
  switch (type) {
    case 'moderation':
      return 'This content violates our content policy. Please revise your message.';
    case 'no_tokens':
      return "You don't have enough tokens. Please purchase more tokens to continue.";
    case 'server':
      return 'A server error occurred. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}

/**
 * Call the AI API hosted on Supabase Edge Function
 * 
 * @param prompt - The prompt to send to the AI
 * @param options - Additional options for the API call (functionName, model, temperature, etc.)
 * @returns Promise with response data or error
 */
export async function callAIAPI(
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  try {
    // Get function name from options or environment
    const functionName = options.functionName || getDefaultFunctionName();

    // Get userId for the edge function
    const userId = await getUserId();
    if (!userId) {
      logger.error('Cannot call AI API: user ID not available');
      return {
        data: null,
        error: 'User ID not available',
      };
    }

    logger.debug('Calling AI API', { functionName, promptLength: prompt.length, userId });

    // Extract functionName from options to avoid passing it in the body
    const { functionName: _, ...bodyOptions } = options;

    // Call Supabase Edge Function via wrapper
    // Edge function expects user_id (snake_case), not userId (camelCase)
    const accessToken = getAccessToken();
    const { data, error } = await callEdgeFunction(functionName, {
      user_id: userId,
      prompt,
      ...bodyOptions,
    }, accessToken);

    if (error) {
      logger.error('AI API call failed', error);
      return {
        data: null,
        error: error.message || 'Failed to call AI API',
      };
    }

    logger.debug('AI API call successful', { hasData: !!data });
    
    // Refresh token balance after successful AI call
    // Token deduction happens automatically in the backend
    useTokenStore.getState().refresh().catch((error) => {
      logger.warn('Failed to refresh token balance after AI call', error);
    });
    
    return { data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error calling AI API', error);
    return {
      data: null,
      error: errorMessage,
    };
  }
}

/**
 * Send prompt to AI and get response with enhanced error handling
 * 
 * @param userId - User ID for the request
 * @param prompt - The prompt to send to the AI
 * @returns Promise with structured response including output or specific error type
 */
export async function sendPrompt(
  userId: string,
  prompt: string
): Promise<SendPromptResponse> {
  try {
    if (!userId) {
      logger.error('Cannot send prompt: user ID not provided');
      return {
        success: false,
        error: {
          type: 'server',
          message: 'User ID not available',
        },
      };
    }

    if (!prompt || prompt.trim().length === 0) {
      logger.error('Cannot send prompt: prompt is empty');
      return {
        success: false,
        error: {
          type: 'unknown',
          message: 'Prompt cannot be empty',
        },
      };
    }

    const functionName = getDefaultFunctionName();
    logger.debug('Sending prompt to AI', { functionName, promptLength: prompt.length, userId });

    // Call Supabase Edge Function via wrapper
    // Edge function expects user_id (snake_case), not userId (camelCase)
    const accessToken = getAccessToken();
    const { data, error } = await callEdgeFunction(functionName, {
      user_id: userId,
      prompt,
    }, accessToken);

    // Always refresh token balance to ensure UI shows current balance
    useTokenStore.getState().refresh().catch((refreshError) => {
      logger.warn('Failed to refresh token balance after AI call', refreshError);
    });

    // Handle error response
    if (error) {
      // Log detailed error information
      const errorContext = error.context as any;
      const status = errorContext?._bodyBlob?.status || errorContext?.status || (error as any).status;
      
      logger.error('AI API call failed', {
        error,
        errorMessage: error.message,
        errorContext,
        errorStatus: status,
        responseData: data,
      });
      
      // Try to extract error message from response data
      let errorMsg = error.message || 'Failed to call AI API';
      
      // Handle both object and JSON string responses from data
      let parsedData = data;
      if (data && typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
          logger.debug('Parsed error response data', { parsedData });
        } catch (parseError) {
          logger.warn('Failed to parse error response data', parseError);
        }
      }
      
      if (parsedData && typeof parsedData === 'object') {
        const errorData = parsedData as any;
        if (errorData.error || errorData.message) {
          errorMsg = errorData.error || errorData.message || errorMsg;
          logger.debug('Extracted error message from response', { errorMsg });
        }
      }
      
      const errorType = parseErrorType({ message: errorMsg, status });
      const errorMessage = getErrorMessage(errorType);

      return {
        success: false,
        error: {
          type: errorType,
          message: errorMessage,
        },
      };
    }

    // Handle successful response - may need to parse JSON string
    let parsedData = data;
    if (data && typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
        logger.debug('Parsed success response data', { parsedData });
      } catch (parseError) {
        logger.warn('Failed to parse success response data', parseError);
      }
    }

    // Handle error in response data (edge function may return error in data)
    if (parsedData && typeof parsedData === 'object' && 'error' in parsedData) {
      const errorData = parsedData as { error?: any; errorCode?: string; errorMessage?: string };
      logger.error('AI API returned error in response', errorData);

      const errorType = parseErrorType(errorData.error || errorData.errorMessage || errorData);
      const errorMessage = getErrorMessage(errorType);

      return {
        success: false,
        error: {
          type: errorType,
          message: errorMessage,
        },
      };
    }

    // Extract output from response
    // Edge function returns: { model, text, tokens_used, usage }
    let output = '';
    if (parsedData) {
      if (typeof parsedData === 'string') {
        output = parsedData;
      } else if (typeof parsedData === 'object' && parsedData !== null) {
        const responseData = parsedData as any;
        // Edge function returns 'text' field, not 'output'
        output =
          responseData.text ||
          responseData.output ||
          responseData.response ||
          responseData.content ||
          responseData.message ||
          JSON.stringify(parsedData, null, 2);
      }
    }

    if (!output) {
      logger.warn('AI API returned empty output', { data });
      return {
        success: false,
        error: {
          type: 'server',
          message: 'No response received from AI',
        },
      };
    }

    logger.debug('AI prompt sent successfully', { outputLength: output.length });
    
    return {
      success: true,
      output,
    };
  } catch (error) {
    logger.error('Error sending prompt', error);
    
    // Always refresh token balance even on error
    useTokenStore.getState().refresh().catch((refreshError) => {
      logger.warn('Failed to refresh token balance after error', refreshError);
    });

    const errorType = parseErrorType(error);
    const errorMessage = getErrorMessage(errorType);

    return {
      success: false,
      error: {
        type: errorType,
        message: errorMessage,
      },
    };
  }
}

