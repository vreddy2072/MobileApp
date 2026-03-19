import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getSupabaseClient } from '../../lib/supabase';
import { spacing, typography } from '../constants/designSystem';

export function SignOutButton() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handleSignOut = async () => {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.auth.signOut();
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' as never }],
      });
    } catch (err: unknown) {
      console.error('Sign out error:', err);
      Alert.alert(
        'Sign Out Failed',
        err instanceof Error ? err.message : 'An error occurred during sign out. Please try again.'
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      style={[
        localStyles.button,
        {
          backgroundColor: theme.error,
        },
      ]}
    >
      <Text style={[localStyles.buttonText, { color: theme.background }]}>Sign Out</Text>
    </TouchableOpacity>
  );
}

const localStyles = StyleSheet.create({
  button: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
