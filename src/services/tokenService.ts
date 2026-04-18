/**
 * Token Service
 * 
 * Service layer for managing token balance and wallet operations.
 * Integrates with Supabase edge functions to fetch and manage tokens.
 * 
 * TODO: Update edge function names to match your Supabase edge functions:
 * - 'get-balance-function' → Update to your balance edge function name
 * - 'credit-tokens-from-expogo' → Update to your add tokens edge function name
 * - 'ai-delete-user-account-function' → Account deletion (see `Supabase/edge-functions/ai-delete-user-account-function.ts`)
 */

import { create } from 'zustand';
import { logger } from '../utils/logger';
import { getUserId, getAccessToken } from '../utils/userId';
import { purchaseProduct } from './revenueCatService';
import { callEdgeFunction } from './supabaseApi';
import { isExpoGo } from './envService';
import { IAPProduct } from '../types/iap';

interface TokenStore {
  balance: number | null;
  lifetimeUsage: number | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  getTokenBalance: (userId: string) => Promise<void>;
  addDevTokens: (amount: number) => Promise<{ success: boolean; error?: string }>;
  buyTokens: (productId: string) => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useTokenStore = create<TokenStore>((set, get) => ({
  balance: null,
  lifetimeUsage: null,
  loading: false,
  error: null,

  getTokenBalance: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      logger.debug('Fetching token balance', { userId });

      const accessToken = getAccessToken();
      if (!accessToken) {
        const errorMsg = 'Authentication token not available. Please sign in again.';
        logger.error(errorMsg);
        set({
          loading: false,
          error: errorMsg,
        });
        return;
      }

      const { data, error } = await callEdgeFunction('ai-get-balance-function', {
        user_id: userId,
      }, accessToken);

      if (error) {
        // Log detailed error information
        logger.error('Failed to fetch token balance', {
          error,
          errorMessage: error.message,
          errorContext: error.context,
          errorStatus: (error as any).status,
          errorStatusText: (error as any).statusText,
          responseData: data,
        });
        
        // Try to extract more detailed error message
        let errorMsg = error.message || 'Failed to fetch token balance';
        
        // Handle both object and JSON string responses
        let parsedData = data;
        if (data && typeof data === 'string') {
          try {
            parsedData = JSON.parse(data);
          } catch (parseError) {
            logger.warn('Failed to parse error response data', parseError);
          }
        }
        
        if (parsedData && typeof parsedData === 'object') {
          const errorData = parsedData as any;
          if (errorData.error || errorData.message) {
            errorMsg = errorData.error || errorData.message || errorMsg;
          }
        }
        
        set({
          loading: false,
          error: errorMsg,
        });
        return;
      }

      // Handle response - edge function returns { balance: number }
      // Note: Supabase may return the response as a JSON string, so we need to parse it
      let parsedData = data;
      if (data && typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
          logger.debug('Parsed JSON string response', { parsedData });
        } catch (parseError) {
          logger.error('Failed to parse response data', parseError);
          set({
            loading: false,
            error: 'Invalid response format',
          });
          return;
        }
      }

      // Extract balance from parsed data
      const balance = parsedData?.balance ?? null;

      logger.debug('Token balance fetched', { balance, rawData: data });
      set({
        balance: typeof balance === 'number' ? balance : null,
        lifetimeUsage: null, // get-balance-function doesn't return lifetime_usage
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error fetching token balance', {
        error,
        errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  addDevTokens: async (amount: number) => {
    set({ loading: true, error: null });
    try {
      logger.debug('Adding dev tokens', { amount });

      const userId = await getUserId();
      if (!userId) {
        const errorMsg = 'User ID not available';
        logger.error(errorMsg);
        set({ loading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        const errorMsg = 'Authentication token not available. Please sign in again.';
        logger.error(errorMsg);
        set({ loading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      // Edge function expects user_id and quantity (not userId and amount)
      const { data, error } = await callEdgeFunction('ai-credit-tokens-from-expogo', {
        user_id: userId,
        quantity: amount,
      }, accessToken);

      if (error) {
        logger.error('Failed to add dev tokens', error);
        
        // Try to extract error message from response data if available
        let errorMsg = error.message || 'Failed to add dev tokens';
        
        // Handle both object and JSON string responses
        let parsedData = data;
        if (data && typeof data === 'string') {
          try {
            parsedData = JSON.parse(data);
          } catch (parseError) {
            logger.warn('Failed to parse error response data', parseError);
          }
        }
        
        if (parsedData && typeof parsedData === 'object') {
          const errorData = parsedData as any;
          if (errorData.error || errorData.message) {
            errorMsg = errorData.error || errorData.message || errorMsg;
          }
        }
        
        set({ loading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      logger.debug('Dev tokens added successfully', { amount });
      
      // Refresh balance after adding tokens
      await get().getTokenBalance(userId);
      
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error adding dev tokens', error);
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  buyTokens: async (productId: string) => {
    set({ loading: true, error: null });
    try {
      logger.debug('Buying tokens', { productId });

      const userId = await getUserId();
      if (!userId) {
        const errorMsg = 'User ID not available';
        logger.error(errorMsg);
        set({ loading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      // In Expo Go, call ai-credit-tokens-from-expogo directly (mock mode)
      // In native builds, use RevenueCat for purchases
      if (isExpoGo) {
        // For Expo Go mock mode, fetch product to get credit amount
        const products = await fetchAvailableProducts();
        const product = products.find((p) => p.product_id === productId);

        if (!product) {
          const errorMsg = `Invalid product ID: ${productId}`;
          logger.error(errorMsg);
          set({ loading: false, error: errorMsg });
          return { success: false, error: errorMsg };
        }

        const amount = product.credits;

        const accessToken = getAccessToken();
        if (!accessToken) {
          const errorMsg = 'Authentication token not available. Please sign in again.';
          logger.error(errorMsg);
          set({ loading: false, error: errorMsg });
          return { success: false, error: errorMsg };
        }

        // Edge function expects user_id, quantity, and product_id (app_name is added automatically)
        const { data, error } = await callEdgeFunction('ai-credit-tokens-from-expogo', {
          user_id: userId,
          quantity: amount,
          product_id: productId,
        }, accessToken);

        if (error) {
          // Log detailed error information
          const errorContext = error.context as any;
          const status = errorContext?._bodyBlob?.status || errorContext?.status || (error as any).status;
          
          logger.error('Failed to buy tokens', {
            error,
            errorMessage: error.message,
            errorContext,
            errorStatus: status,
            responseData: data,
          });
          
          // Try to extract error message from response data if available
          let errorMsg = error.message || 'Failed to buy tokens';
          
          // Try to read response body from error context
          let responseBody: any = null;
          try {
            if (errorContext?._bodyBlob) {
              // Try to read the response body if it's available
              const bodyBlob = errorContext._bodyBlob;
              
              // Try to read as text if it's a Blob (async operation)
              if (bodyBlob.text && typeof bodyBlob.text === 'function' && !bodyBlob.bodyUsed) {
                try {
                  const text = await bodyBlob.text();
                  if (text) {
                    responseBody = JSON.parse(text);
                  }
                } catch (textError) {
                  logger.warn('Failed to read error body as text', textError);
                }
              }
              
              // Fallback: try _data (synchronous)
              if (!responseBody && bodyBlob._data) {
                const bodyData = bodyBlob._data;
                if (typeof bodyData === 'string') {
                  try {
                    responseBody = JSON.parse(bodyData);
                  } catch {
                    // If parsing fails, use as-is
                  }
                } else if (typeof bodyData === 'object' && bodyData !== null) {
                  // Try to extract error message from object structure
                  if (bodyData.error || bodyData.message) {
                    responseBody = bodyData;
                  } else {
                    // Try to stringify and parse if it's a complex object
                    try {
                      const jsonStr = JSON.stringify(bodyData);
                      responseBody = JSON.parse(jsonStr);
                    } catch {
                      responseBody = bodyData;
                    }
                  }
                }
              }
            }
          } catch (parseError) {
            logger.warn('Failed to parse error body from context', parseError);
          }
          
          // Handle both object and JSON string responses from data or responseBody
          let parsedData = data || responseBody;
          if (parsedData && typeof parsedData === 'string') {
            try {
              parsedData = JSON.parse(parsedData);
              logger.debug('Parsed error response data', { parsedData });
            } catch (parseError) {
              logger.warn('Failed to parse error response data', parseError);
            }
          }
          
          if (parsedData && typeof parsedData === 'object') {
            const errorData = parsedData as any;
            if (errorData.error || errorData.message || errorData.details) {
              errorMsg = errorData.error || errorData.message || errorData.details || errorMsg;
              logger.debug('Extracted error message from response', { errorMsg });
            }
          }
          
          // Provide more specific error message based on status code
          if (status === 403) {
            errorMsg = 'This function is disabled in production. Please enable DEV_MODE=true in Supabase environment variables for the credit-tokens-from-expogo.';
          } else if (status === 400) {
            errorMsg = errorMsg.includes('Missing') 
              ? errorMsg 
              : 'Invalid request. Please check your input.';
          } else if (status === 405) {
            errorMsg = 'Only POST method is allowed for this function.';
          } else if (status === 500) {
            // For 500 errors, try to show the actual error message from the edge function
            if (!errorMsg.includes('Internal') && !errorMsg.includes('server error')) {
              // Keep the extracted error message if we got one
            } else {
              errorMsg = 'Server error occurred. Please check Supabase edge function logs for details.';
            }
          }
          
          set({ loading: false, error: errorMsg });
          return { success: false, error: errorMsg };
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
        
        // Check if response indicates success
        if (parsedData && typeof parsedData === 'object') {
          const responseData = parsedData as any;
          if (responseData.success === false || responseData.error) {
            const errorMsg = responseData.error || responseData.message || 'Failed to buy tokens';
            logger.error('Edge function returned error in success response', { responseData });
            set({ loading: false, error: errorMsg });
            return { success: false, error: errorMsg };
          }
        }

        logger.debug('Tokens purchased successfully', { productId, amount });
        
        // Refresh balance after purchase
        await get().getTokenBalance(userId);
        
        return { success: true };
      } else {
        // For native builds, use RevenueCat for purchases
        // Product validation happens in RevenueCat (product must exist in RevenueCat dashboard)
        logger.debug('Initiating RevenueCat purchase', { productId });
        const result = await purchaseProduct(productId);

        if (!result.success) {
          const errorMsg = result.error || 'Purchase failed';
          
          // Handle cancelled purchases separately from actual errors
          if (result.cancelled) {
            logger.info('Purchase was cancelled by user', { productId });
            set({ loading: false, error: null });
            return { success: false, cancelled: true, error: errorMsg };
          } else {
            // Actual error (network failure, RevenueCat down, etc.)
            logger.error('RevenueCat purchase failed', { productId, error: errorMsg });
            set({ loading: false, error: errorMsg });
            return { success: false, error: errorMsg };
          }
        }

        // Refresh token balance after successful purchase
        await get().getTokenBalance(userId);
        set({ loading: false, error: null });
        return { success: true };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error buying tokens', error);
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  refresh: async () => {
    const userId = await getUserId();
    if (!userId) {
      logger.warn('Cannot refresh token balance: user ID not available');
      set({ error: 'User ID not available' });
      return;
    }
    await get().getTokenBalance(userId);
  },

  reset: () => {
    set({
      balance: null,
      lifetimeUsage: null,
      loading: false,
      error: null,
    });
  },
}));

/**
 * Fetch available IAP products from Supabase
 * Returns products filtered by active=true and sorted by sort_order.
 * Uses the ai-get-iap-products-function edge function.
 */
export async function fetchAvailableProducts(): Promise<IAPProduct[]> {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      logger.warn('Cannot fetch products: authentication token not available');
      return [];
    }

    logger.debug('Fetching available IAP products from Supabase');

    const { data, error } = await callEdgeFunction('ai-get-iap-products-function', {}, accessToken);

    if (error) {
      logger.error('Failed to fetch IAP products', {
        error,
        errorMessage: error.message,
        errorContext: error.context,
      });
      return [];
    }

    // Parse response - edge function returns { products: IAPProduct[] }
    let parsedData = data;
    if (data && typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (parseError) {
        logger.error('Failed to parse products response', parseError);
        return [];
      }
    }

    if (!parsedData || !parsedData.products || !Array.isArray(parsedData.products)) {
      logger.warn('Invalid products response format', { data: parsedData });
      return [];
    }

    // Sort products by sort_order
    const products: IAPProduct[] = parsedData.products
      .sort((a: IAPProduct, b: IAPProduct) => a.sort_order - b.sort_order);

    logger.debug('Fetched IAP products', { count: products.length });
    return products;
  } catch (error) {
    logger.error('Error fetching IAP products', error);
    return [];
  }
}


