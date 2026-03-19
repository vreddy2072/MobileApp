/**
 * Supabase Client Configuration
 * 
 * Creates and exports a Supabase client instance for use throughout the app.
 * Uses envService for centralized environment variable management.
 */

import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '../services/envService';
import { logger } from '../utils/logger';

// Get Supabase configuration from envService
const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn(
    'Supabase configuration missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local or app.config.js'
  );
} else {
  logger.debug('Supabase configuration loaded successfully');
}

// Create and export Supabase client
// Use placeholder values if configuration is missing to allow the client to be created
// (useful for integration tests that may skip Supabase calls)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

