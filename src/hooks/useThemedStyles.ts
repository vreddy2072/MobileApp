import { useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { cn } from "../utils/cn";

// Hook for getting theme-aware class names
export function useThemedStyles() {
  const { theme, isDark } = useTheme();

  return useMemo(() => ({
    // Deprecated class names (kept for backward-compat so existing className references don't crash)
    // NOTE: Tailwind/NativeWind won't apply dynamic arbitrary colors in class strings.
    // Always use the style objects below for reliable theming.
    background: "",
    surface: "",
    card: "",
    text: "",
    textSecondary: "",
    textMuted: "",
    border: "",
    borderLight: "",
    button: "",
    buttonText: "",
    success: "",
    warning: "",
    error: "",

    // Style objects driven by active theme (use these going forward)
    backgroundStyle: { backgroundColor: theme.background } as const,
    surfaceStyle: { backgroundColor: theme.surface } as const,
    cardStyle: { backgroundColor: theme.card } as const,
    textStyle: { color: theme.text } as const,
    textSecondaryStyle: { color: theme.textSecondary } as const,
    borderStyle: { borderColor: theme.border } as const,
    buttonStyle: { backgroundColor: theme.primary } as const,
    buttonTextStyle: { color: theme.background } as const,
    successStyle: { backgroundColor: theme.success } as const,
    warningStyle: { backgroundColor: theme.warning } as const,
    errorStyle: { backgroundColor: theme.error } as const,

    // Utility function to get conditional classes
    conditional: (lightClass: string, darkClass: string) => isDark ? darkClass : lightClass,

    // Raw theme colors for style prop usage
    colors: theme,
  }), [theme, isDark]);
}

// Utility function for conditional theme classes
export function getThemedClassName(lightClass: string, darkClass: string, isDark: boolean): string {
  return isDark ? darkClass : lightClass;
}

// Helper function to merge theme classes with additional classes
export function mergeThemedClasses(baseClasses: string, themeClasses: string, additionalClasses?: string): string {
  return cn(baseClasses, themeClasses, additionalClasses);
}

