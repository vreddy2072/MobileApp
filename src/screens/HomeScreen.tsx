import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { StyledCard } from "../components/styled/StyledCard";
import { StyledText } from "../components/styled/StyledText";
import { spacing, typography } from "../constants/designSystem";

export function HomeScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles();

  return (
    <ScrollView 
      style={[styles.backgroundStyle, localStyles.container]}
      contentContainerStyle={localStyles.content}
    >
      <View style={localStyles.welcomeSection}>
        <Text style={[localStyles.title, { color: theme.text }]}>
          Welcome to Mobile Template App
        </Text>
        <Text style={[localStyles.subtitle, { color: theme.textSecondary }]}>
          This is a foundation template for building new Expo projects
        </Text>
      </View>

      <View style={localStyles.cardsSection}>
        <StyledCard backgroundColor={theme.card}>
          <StyledText variant="cardTitle">Getting Started</StyledText>
          <Text style={[localStyles.cardText, { color: theme.textSecondary }]}>
            This template includes a theme system, navigation setup, and core components ready to use.
          </Text>
        </StyledCard>

        <StyledCard backgroundColor={theme.card}>
          <StyledText variant="cardTitle">Features</StyledText>
          <Text style={[localStyles.cardText, { color: theme.textSecondary }]}>
            • Theme system with light/dark mode{'\n'}
            • Bottom tab navigation{'\n'}
            • Styled components{'\n'}
            • Design system constants
          </Text>
        </StyledCard>

        <StyledCard backgroundColor={theme.card}>
          <StyledText variant="cardTitle">Next Steps</StyledText>
          <Text style={[localStyles.cardText, { color: theme.textSecondary }]}>
            Start building your app by modifying the screens and adding your own features!
          </Text>
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
  welcomeSection: {
    marginBottom: spacing.xl,
    paddingTop: spacing.base,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
  },
  cardsSection: {
    gap: spacing.base,
  },
  cardText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    marginTop: spacing.sm,
  },
});

