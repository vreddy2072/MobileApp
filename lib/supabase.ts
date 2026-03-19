import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../src/utils/logger';

let supabaseClient: SupabaseClient | null = null;

export function initializeSupabase(url: string, anonKey: string) {
  logger.info('Initializing Supabase client with auth persistence');
  supabaseClient = createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return supabaseClient;
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient;
}

/**
 * Refresh the Supabase session and return a fresh access token.
 * Used only in retry paths when the edge returns 401 / "JWT expired".
 * onAuthStateChange will update the auth store when refresh succeeds.
 */
export async function getFreshAccessToken(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data: { session }, error } = await client.auth.refreshSession();
  if (error) {
    logger.debug('Session refresh failed, using cached token if any', { message: error.message });
  }
  return session?.access_token ?? null;
}

export function isSupabaseInitialized(): boolean {
  return supabaseClient !== null;
}

/**
 * Parse OAuth redirect URL for access_token and refresh_token (hash or query), then set session.
 * Used after signInWithOAuth + WebBrowser.openAuthSessionAsync and when app opens via auth-callback deep link.
 */
export async function createSessionFromUrl(url: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized');

  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  const params = new URLSearchParams(hash || query);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (!access_token) return;
  const { error } = await client.auth.setSession({
    access_token,
    refresh_token: refresh_token ?? '',
  });
  if (error) throw error;
}
