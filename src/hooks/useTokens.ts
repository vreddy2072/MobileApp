/**
 * useTokens Hook
 * 
 * React hook for accessing token balance and operations.
 * Automatically handles user authentication and provides token-related functionality.
 */

import { useEffect } from 'react';
import { useTokenStore } from '../services/tokenService';
import { getUserId } from '../utils/userId';
import { logger } from '../utils/logger';

/**
 * Hook for accessing token balance and operations
 * 
 * @returns Token balance, loading state, error, and operations
 */
export function useTokens() {
  const balance = useTokenStore((state) => state.balance);
  const lifetimeUsage = useTokenStore((state) => state.lifetimeUsage);
  const loading = useTokenStore((state) => state.loading);
  const error = useTokenStore((state) => state.error);
  const getTokenBalance = useTokenStore((state) => state.getTokenBalance);
  const addDevTokens = useTokenStore((state) => state.addDevTokens);
  const buyTokens = useTokenStore((state) => state.buyTokens);
  const refresh = useTokenStore((state) => state.refresh);

  // Load token balance on mount
  useEffect(() => {
    let mounted = true;

    const loadBalance = async () => {
      try {
        const userId = await getUserId();
        if (userId && mounted) {
          await getTokenBalance(userId);
        }
      } catch (error) {
        logger.error('Error loading token balance in useTokens', error);
      }
    };

    loadBalance();

    return () => {
      mounted = false;
    };
  }, [getTokenBalance]);

  return {
    balance,
    lifetimeUsage,
    loading,
    error,
    refresh,
    addDevTokens,
    buyTokens,
  };
}


