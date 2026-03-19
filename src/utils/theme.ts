export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  card: string;
}

export const lightTheme: ThemeColors = {
  background: "#F9FAFB",
  surface: "#FFFFFF",
  primary: "#007AFF",
  secondary: "#6B7280",
  text: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  card: "#FFFFFF",
};

export const darkTheme: ThemeColors = {
  background: "#111827",
  surface: "#1F2937",
  primary: "#3B82F6",
  secondary: "#9CA3AF",
  text: "#F9FAFB",
  textSecondary: "#D1D5DB",
  border: "#374151",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  card: "#1F2937",
};

export function resolveTheme(themeMode: ThemeMode): ThemeColors {
  return themeMode === "dark" ? darkTheme : lightTheme;
}

export function getThemeStatusBarStyle(themeMode: ThemeMode): "light" | "dark" {
  return themeMode === "dark" ? "light" : "dark";
}

// Utility function to create theme-aware styles
export function createThemedStyles<T>(
  styleCreator: (theme: ThemeColors) => T
): (themeMode: ThemeMode) => T {
  return (themeMode: ThemeMode) => {
    const theme = resolveTheme(themeMode);
    return styleCreator(theme);
  };
}

// Predefined theme-aware color classes for common use cases
export const themeClasses = {
  light: {
    background: "bg-gray-50",
    surface: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    border: "border-gray-200",
  },
  dark: {
    background: "bg-gray-900",
    surface: "bg-gray-800",
    text: "text-gray-100",
    textSecondary: "text-gray-300",
    border: "border-gray-700",
  },
};

export function getThemeClasses(themeMode: ThemeMode) {
  return themeMode === "dark" ? themeClasses.dark : themeClasses.light;
}

