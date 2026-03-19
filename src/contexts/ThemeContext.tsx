import React, { createContext, useContext, useState, useMemo } from "react";
import { ThemeColors, ThemeMode, resolveTheme, getThemeStatusBarStyle } from "../utils/theme";

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  statusBarStyle: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const resolvedTheme = useMemo(() => {
    return resolveTheme(themeMode);
  }, [themeMode]);

  // Determine if theme is dark based on background color luminance
  const isDark = isDarkTheme(resolvedTheme.background);
  const statusBarStyle = getThemeStatusBarStyle(themeMode);

  const contextValue: ThemeContextType = {
    theme: resolvedTheme,
    themeMode,
    isDark,
    statusBarStyle,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Helper function to determine if a theme is dark based on background color
function isDarkTheme(backgroundColor: string): boolean {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

