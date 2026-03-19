import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { getSupabaseClient, createSessionFromUrl } from '../../lib/supabase';
import { isExpoGo } from '../services/envService';
import { logger } from '../utils/logger';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { spacing, typography, iconSizes } from '../constants/designSystem';
import { Ionicons } from '@expo/vector-icons';

export function SignInScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles();
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  // Handle OAuth callback (auth-callback deep link)
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      if (url.includes('access_token') || url.includes('auth-callback')) {
        try {
          await createSessionFromUrl(url);
          WebBrowser.maybeCompleteAuthSession();
        } catch (e) {
          logger.error('createSessionFromUrl failed', e);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') return;
    setLoading('apple');
    try {
      const AppleAuth = await import('expo-apple-authentication');
      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });
      const idToken = credential.identityToken;
      if (!idToken) {
        Alert.alert('Error', 'No identity token from Apple.');
        return;
      }
      const client = getSupabaseClient();
      if (!client) {
        Alert.alert('Error', 'App not configured.');
        return;
      }
      const { error } = await client.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
      });
      if (error) {
        const isExpoGoAudienceError =
          isExpoGo &&
          (error.message.includes('audience') ||
            error.message.includes('id_token') ||
            error.message.includes('host.exp.Exponent'));
        Alert.alert(
          'Sign in failed',
          isExpoGoAudienceError
            ? "Apple Sign In doesn't work in Expo Go (the app runs under a different ID). Build the app with EAS Build to test Sign in with Apple."
            : error.message
        );
        return;
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        return;
      }
      logger.error('Apple sign in error', err);
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Apple sign in failed.'
      );
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    const client = getSupabaseClient();
    if (!client) {
      Alert.alert('Error', 'App not configured. Please set Supabase URL and anon key.');
      return;
    }
    setLoading('google');
    try {
      const redirectUrl = Linking.createURL('auth-callback');
      logger.debug('Google sign-in redirect URL', { redirectUrl });
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        Alert.alert('Sign in failed', error.message);
        return;
      }
      if (!data?.url) {
        Alert.alert('Error', 'No auth URL returned.');
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      logger.debug('Google sign-in auth session result', {
        type: result.type,
        url: result.url ?? null,
      });
      if (result.type === 'success' && result.url) {
        await createSessionFromUrl(result.url);
        WebBrowser.maybeCompleteAuthSession();
      }
    } catch (err) {
      logger.error('Google sign in error', err);
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Google sign in failed.'
      );
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  return (
    <ScrollView
      style={[styles.backgroundStyle, localStyles.container]}
      contentContainerStyle={localStyles.content}
    >
      <View style={localStyles.header}>
        <Text style={[localStyles.title, { color: theme.text }]}>Welcome</Text>
        <Text style={[localStyles.subtitle, { color: theme.textSecondary }]}>
          Sign in to continue
        </Text>
      </View>

      <View style={localStyles.ssoContainer}>
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            onPress={handleAppleSignIn}
            disabled={isLoading}
            style={[
              localStyles.ssoButton,
              {
                backgroundColor: theme.text,
                opacity: isLoading ? 0.5 : 1,
              },
            ]}
          >
            {loading === 'apple' ? (
              <ActivityIndicator size="small" color={theme.background} />
            ) : (
              <>
                <Ionicons name="logo-apple" size={iconSizes.button} color={theme.background} />
                <Text style={[localStyles.ssoButtonText, { color: theme.background }]}>
                  Continue with Apple
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          style={[
            localStyles.ssoButton,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: 1,
              opacity: isLoading ? 0.5 : 1,
            },
          ]}
        >
          {loading === 'google' ? (
            <ActivityIndicator size="small" color={theme.text} />
          ) : (
            <>
              <Ionicons name="logo-google" size={iconSizes.button} color={theme.text} />
              <Text style={[localStyles.ssoButtonText, { color: theme.text }]}>
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.base,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  ssoContainer: {
    width: '100%',
    gap: spacing.base,
  },
  ssoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    borderRadius: 12,
    gap: spacing.sm,
  },
  ssoButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
