import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { StyledCard } from "../components/styled/StyledCard";
import { StyledIcon } from "../components/styled/StyledIcon";
import { SignOutButton } from "../components/SignOutButton";
import { useAuthContext } from "../contexts/AuthContext";
import { spacing, typography, avatarDimensions, iconSizes } from "../constants/designSystem";
import { useNavigation } from "@react-navigation/native";
import { getSupabaseClient } from "../../lib/supabase";
import { deleteUserAccount } from "../services/userAccountService";
import { useTokenStore } from "../services/tokenService";

export function ProfileScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles();
  const { session } = useAuthContext();
  const navigation = useNavigation();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const user = session?.user;
  const emailAddress = user?.email ?? '';
  const fullName =
    (user?.user_metadata?.full_name as string) ??
    (user?.user_metadata?.name as string) ??
    (emailAddress ? 'User' : '');

  const runDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const result = await deleteUserAccount();
      if (!result.ok) {
        Alert.alert(
          'Could not delete account',
          result.error ?? 'Please try again or contact support.'
        );
        return;
      }
      const client = getSupabaseClient();
      if (client) {
        await client.auth.signOut();
      }
      useTokenStore.getState().reset();
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' as never }],
      });
      Alert.alert('Account deleted', 'Your account and app data have been removed.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account, credits, and server-side data for this app. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Your account will be deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete account',
                  style: 'destructive',
                  onPress: () => void runDeleteAccount(),
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (session?.user) {
    return (
      <ScrollView
        style={[styles.backgroundStyle, localStyles.container]}
        contentContainerStyle={localStyles.content}
      >
        <View style={localStyles.profileHeader}>
          <View style={[localStyles.avatar, { backgroundColor: theme.primary }]}>
            <StyledIcon
              name="person"
              size={iconSizes.avatar}
              color={theme.background}
            />
          </View>
          <Text style={[localStyles.name, { color: theme.text }]}>
            {fullName || 'User'}
          </Text>
          {emailAddress ? (
            <Text style={[localStyles.email, { color: theme.textSecondary }]}>
              {emailAddress}
            </Text>
          ) : null}
        </View>

        <View style={localStyles.section}>
          {emailAddress ? (
            <StyledCard backgroundColor={theme.card}>
              <View style={localStyles.infoRow}>
                <StyledIcon name="mail-outline" size={iconSizes.button} color={theme.primary} />
                <View style={localStyles.infoText}>
                  <Text style={[localStyles.infoLabel, { color: theme.textSecondary }]}>Email</Text>
                  <Text style={[localStyles.infoValue, { color: theme.text }]}>{emailAddress}</Text>
                </View>
              </View>
            </StyledCard>
          ) : null}

          <StyledCard backgroundColor={theme.card} style={{ marginTop: spacing.base }}>
            <View style={localStyles.signOutContainer}>
              <SignOutButton />
            </View>
          </StyledCard>

          <StyledCard backgroundColor={theme.card} style={{ marginTop: spacing.base }}>
            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
              style={[
                localStyles.deleteAccountButton,
                deletingAccount && localStyles.deleteAccountButtonDisabled,
              ]}
            >
              {deletingAccount ? (
                <ActivityIndicator color={theme.error} />
              ) : (
                <Text style={[localStyles.deleteAccountText, { color: theme.error }]}>
                  Delete account
                </Text>
              )}
            </TouchableOpacity>
          </StyledCard>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.backgroundStyle, localStyles.container]}
      contentContainerStyle={[localStyles.content, localStyles.signedOutContent]}
    >
      <Text style={[localStyles.signedOutTitle, { color: theme.text }]}>
        Please sign in to view your profile
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('SignIn' as never)}
        style={[localStyles.signInButton, { backgroundColor: theme.primary }]}
      >
        <Text style={[localStyles.signInButtonText, { color: theme.background }]}>
          Sign In
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingTop: spacing.base,
  },
  avatar: {
    width: avatarDimensions.size,
    height: avatarDimensions.size,
    borderRadius: avatarDimensions.borderRadius,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  name: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs / 2,
  },
  email: {
    fontSize: typography.fontSize.base,
  },
  section: {
    gap: spacing.base,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs / 4,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  signOutContainer: {
    paddingVertical: spacing.xs,
  },
  deleteAccountButton: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(239, 68, 68, 0.06)",
  },
  deleteAccountButtonDisabled: {
    opacity: 0.55,
  },
  deleteAccountText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  signedOutContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  signedOutTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  signInButton: {
    width: '100%',
    paddingVertical: spacing.base,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  signInButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
