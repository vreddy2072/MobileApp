import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { StyledCard } from "../components/styled/StyledCard";
import { StyledText } from "../components/styled/StyledText";
import { StyledIcon } from "../components/styled/StyledIcon";
import { spacing, typography, borderRadius, iconSizes, interaction } from "../constants/designSystem";
import { logger } from "../utils/logger";
import { LogLevel } from "../config/loggerConfig";
import * as Clipboard from 'expo-clipboard';
import { useTokens } from "../hooks/useTokens";
import { navigate } from "../services/NavigationService";

export function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const styles = useThemedStyles();
  const [isExporting, setIsExporting] = useState(false);
  const [logCount, setLogCount] = useState(0);
  const { balance, loading: tokensLoading } = useTokens();

  // Hidden debug menu state
  const [versionTapCount, setVersionTapCount] = useState(0);
  const [debugMenuEnabled, setDebugMenuEnabled] = useState(false);
  const tapTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Check if Debug Card should be shown
  // Show when: logging level = DEBUG OR debug menu manually enabled
  const shouldShowDebugCard = logger.getConfig().minLevel === LogLevel.DEBUG || debugMenuEnabled;

  useEffect(() => {
    if (shouldShowDebugCard) {
      loadLogCount();
    }
  }, [shouldShowDebugCard]);

  const loadLogCount = async () => {
    try {
      const logs = await logger.getLogs();
      setLogCount(logs.length);
    } catch (error) {
      console.error('Failed to load log count:', error);
    }
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === "light" ? "dark" : "light");
  };

  const handleExportLogs = async () => {
    try {
      setIsExporting(true);
      
      const logText = await logger.exportLogsAsText();
      
      if (!logText || logText === 'No logs found.') {
        Alert.alert('No Log', 'There is no log to export.');
        setIsExporting(false);
        return;
      }

      // Copy log to clipboard
      await Clipboard.setStringAsync(logText);
      
      Alert.alert(
        'Log Copied',
        'Log has been copied to clipboard. You can now paste it into Messages, Email, or any other app.',
        [{ text: 'OK' }]
      );
      
      logger.debug('Log copied to clipboard', { length: logText.length });
    } catch (error) {
      logger.error('Failed to copy log to clipboard', error);
      Alert.alert('Error', 'Failed to copy log. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all stored logs? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await logger.clearLogs();
              setLogCount(0);
              Alert.alert('Success', 'Log has been cleared.');
            } catch (error) {
              logger.error('Failed to clear log', error);
              Alert.alert('Error', 'Failed to clear log.');
            }
          },
        },
      ]
    );
  };

  const handleOpenTokenStore = () => {
    navigate('TokenStore');
  };

  const handleVersionTap = () => {
    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    const newCount = versionTapCount + 1;
    setVersionTapCount(newCount);

    if (newCount >= 3) {
      // Toggle debug menu
      const newState = !debugMenuEnabled;
      setDebugMenuEnabled(newState);
      setVersionTapCount(0);

      // Load log count if enabling
      if (newState) {
        loadLogCount();
      }

      Alert.alert(
        newState ? 'Debug Menu Enabled' : 'Debug Menu Disabled',
        newState
          ? 'Debug section is now visible. Tap 3 times again to hide it.'
          : 'Debug section has been hidden.',
        [{ text: 'OK' }]
      );
    } else {
      // Reset counter after 2 seconds of inactivity
      tapTimeoutRef.current = setTimeout(() => {
        setVersionTapCount(0);
      }, 2000);
    }
  };

  return (
    <ScrollView 
      style={[styles.backgroundStyle, localStyles.container]}
      contentContainerStyle={localStyles.content}
    >
      <View style={localStyles.section}>
        <Text style={[localStyles.sectionTitle, { color: theme.text }]}>
          Appearance
        </Text>
        
        <StyledCard backgroundColor={theme.card}>
          <View style={localStyles.settingRow}>
            <View style={localStyles.settingInfo}>
              <StyledText variant="cardTitle">Theme</StyledText>
              <Text style={[localStyles.settingDescription, { color: theme.textSecondary }]}>
                Current: {themeMode === "light" ? "Light" : "Dark"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[localStyles.toggleButton, styles.buttonStyle]}
            >
              <Text style={[localStyles.toggleButtonText, { color: theme.background }]}>
                Switch to {themeMode === "light" ? "Dark" : "Light"}
              </Text>
            </TouchableOpacity>
          </View>
        </StyledCard>
      </View>

      {/* Tokens Section */}
      <View style={localStyles.section}>
        <Text style={[localStyles.sectionTitle, { color: theme.text }]}>
          Credits
        </Text>

        <StyledCard backgroundColor={theme.card}>
          <View style={localStyles.settingRow}>
            <View style={localStyles.settingInfo}>
              <StyledText variant="cardTitle">Balance</StyledText>
              <Text style={[localStyles.settingDescription, { color: theme.textSecondary }]}>
                {tokensLoading ? 'Loading...' : balance !== null ? `${balance} Credits` : 'Not available'}
              </Text>
            </View>
            <StyledIcon
              name="wallet-outline"
              size={iconSizes.button}
              color={theme.primary}
            />
          </View>
        </StyledCard>

        <StyledCard backgroundColor={theme.card} style={{ marginTop: spacing.base }}>
          <TouchableOpacity
            onPress={handleOpenTokenStore}
            style={[localStyles.settingRow, { paddingVertical: spacing.xs }]}
          >
            <View style={localStyles.settingInfo}>
              <StyledText variant="cardTitle">Buy Credits</StyledText>
              <Text style={[localStyles.settingDescription, { color: theme.textSecondary }]}>
                Purchase token packs
              </Text>
            </View>
            <StyledIcon
              name="arrow-forward-outline"
              size={iconSizes.button}
              color={theme.primary}
            />
          </TouchableOpacity>
        </StyledCard>
      </View>

      {/* Debug Card - Only shown in production with DEBUG logging enabled */}
      {shouldShowDebugCard && (
        <View style={localStyles.section}>
          <Text style={[localStyles.sectionTitle, { color: theme.text }]}>
            Debug
          </Text>
          
          <StyledCard backgroundColor={theme.card}>
            <View style={localStyles.debugSection}>
              <View style={localStyles.debugHeader}>
                <StyledIcon name="bug-outline" size={iconSizes.debug} color={theme.primary} />
                <View style={localStyles.debugHeaderText}>
                  <StyledText variant="cardTitle">Latest Logs</StyledText>
                  <Text style={[localStyles.debugDescription, { color: theme.textSecondary }]}>
                    {logCount > 0 ? `${logCount} log${logCount > 1 ? 's' : ''} stored` : 'No logs stored'}
                  </Text>
                </View>
              </View>

              <View style={localStyles.debugActions}>
                <TouchableOpacity
                  onPress={handleExportLogs}
                  disabled={isExporting || logCount === 0}
                  style={[
                    localStyles.debugButton,
                    styles.buttonStyle,
                    (isExporting || logCount === 0) && localStyles.debugButtonDisabled
                  ]}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color={theme.background} />
                  ) : (
                    <>
                      <StyledIcon name="copy-outline" size={iconSizes.action} color={theme.background} />
                      <Text style={[localStyles.debugButtonText, { color: theme.background }]}>
                        Copy Logs
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {logCount > 0 && (
                  <TouchableOpacity
                    onPress={handleClearLogs}
                    style={[localStyles.debugButton, localStyles.debugButtonSecondary]}
                  >
                    <StyledIcon name="trash-outline" size={iconSizes.action} color={theme.error} />
                    <Text style={[localStyles.debugButtonText, { color: theme.error }]}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </StyledCard>
        </View>
      )}

      <View style={localStyles.section}>
        <Text style={[localStyles.sectionTitle, { color: theme.text }]}>
          About
        </Text>
        
        <StyledCard backgroundColor={theme.card}>
          <View style={localStyles.aboutSection}>
            <StyledText variant="cardTitle">Mobile Template App</StyledText>
            <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.7}>
              <Text style={[localStyles.aboutText, { color: theme.textSecondary }]}>
                Version 1.0.0{'\n'}
                Built with Expo and React Native
              </Text>
            </TouchableOpacity>
          </View>
        </StyledCard>
      </View>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.base,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.base,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs / 2,
  },
  toggleButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  toggleButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  debugSection: {
    gap: spacing.base,
  },
  debugHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  debugHeaderText: {
    flex: 1,
  },
  debugDescription: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs / 2,
  },
  debugActions: {
    flexDirection: "row",
    gap: spacing.base,
  },
  debugButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.sm,
  },
  debugButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  debugButtonDisabled: {
    opacity: interaction.disabledOpacity,
  },
  debugButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  aboutSection: {
    gap: spacing.sm,
  },
  aboutText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
});
