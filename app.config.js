/**
 * Expo App Configuration
 * 
 * Supports both Expo Go (.env.local) and EAS builds (eas.json + EAS Secrets).
 * Environment variables are loaded from process.env and exposed via extra config.
 */

module.exports = {
  expo: {
    name: 'Mobile App',
    slug: 'mobile-app',
    scheme: 'mobile-app',
    version: '1.0.0',
    sdkVersion: '54.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    icon: './assets/icon.png',
    assetBundlePatterns: ['assets/**/*'],
    android: {
      edgeToEdgeEnabled: true,
      package: 'com.broapps.mobileapp',
      icon: './assets/icon.png',
      permissions: [],
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.broapps.mobileapp',
      buildNumber: '1',
      icon: './assets/icon.png',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    plugins: [
      'expo-asset',
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '15.1',
            excludeArchitectures: [],
            flipper: false,
          },
        },
      ],
      'expo-font',
      'expo-web-browser',
    ],
    extra: {
      router: {},
      // TODO: Update with your EAS project ID when creating a new project
      // eas: {
      //   projectId: 'your-eas-project-id-here',
      // },
      // Environment variables for Expo Go (.env.local support)
      // These are populated from process.env during expo start
      // For EAS builds, these come from eas.json env vars and EAS Secrets
      // Note: APP_NAME is read directly from expo.name in app.config.js, not from env vars
      // Note: LOG_DEBUG is read from EXPO_PUBLIC_LOG_DEBUG environment variable (boolean, defaults to false)
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
      // TODO: Update with your RevenueCat API keys from RevenueCat dashboard
      REVENUECAT_IOS_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
      REVENUECAT_ANDROID_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
    },
  },
};


