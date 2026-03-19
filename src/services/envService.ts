/**
 * Environment Service
 * 
 * Centralized service for environment detection and configuration.
 * Provides environment flags and app metadata for use throughout the app.
 * 
 * Priority resolution order:
 * 1. process.env.* (EAS Build env or .env.local)
 * 2. Constants.expoConfig.extra (fallback)
 */

import Constants from 'expo-constants';

/**
 * Get the app name
 * Reads directly from app.config.js (expo.name)
 * Defaults to 'BroApps' if not set
 * 
 * TODO: Update app name in app.config.js (expo.name field)
 */
export function getAppName(): string {
  return Constants.expoConfig?.name || 'BroApps';
}

/**
 * Get Supabase URL
 * Priority: process.env.EXPO_PUBLIC_SUPABASE_URL > Constants.expoConfig.extra.SUPABASE_URL
 * Returns empty string if not set
 */
export function getSupabaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    Constants.expoConfig?.extra?.SUPABASE_URL ||
    ''
  );
}

/**
 * Get Supabase Anon Key
 * Priority: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY > Constants.expoConfig.extra.SUPABASE_ANON_KEY
 * Returns empty string if not set
 */
export function getSupabaseAnonKey(): string {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ||
    ''
  );
}

/**
 * Get RevenueCat iOS API Key
 * Priority: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY > Constants.expoConfig.extra.REVENUECAT_IOS_KEY
 * Returns empty string if not set
 * 
 * TODO: Update with your RevenueCat iOS API key from RevenueCat dashboard
 */
export function getRevenueCatIosKey(): string {
  return (
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ||
    Constants.expoConfig?.extra?.REVENUECAT_IOS_KEY ||
    ''
  );
}

/**
 * Get RevenueCat Android API Key
 * Priority: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY > Constants.expoConfig.extra.REVENUECAT_ANDROID_KEY
 * Returns empty string if not set
 * 
 * TODO: Update with your RevenueCat Android API key from RevenueCat dashboard
 */
export function getRevenueCatAndroidKey(): string {
  return (
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ||
    Constants.expoConfig?.extra?.REVENUECAT_ANDROID_KEY ||
    ''
  );
}

/**
 * Check if running in Expo Go
 */
export const isExpoGo = Constants.appOwnership === 'expo';

// Log environment on module load (app startup)
console.info('[env] Running in Expo Go:', isExpoGo);
console.info('[env] Supabase URL configured:', !!getSupabaseUrl());


