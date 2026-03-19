import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { enableScreens } from "react-native-screens";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { MobileDeviceWrapper } from "./src/components/MobileDeviceWrapper";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { AuthProvider, useAuthContext } from "./src/contexts/AuthContext";
import { navigationRef } from "./src/services/NavigationService";
import { initializeRevenueCat } from "./src/services/revenueCatService";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLoadedResources } from "./src/hooks/useLoadedResources";

// Enable native screens for better performance and iOS features like large titles
enableScreens();

// Suppress Reanimated warnings about accessing shared values during component render
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes?.('Reanimated') &&
        (args[0]?.includes?.('Reading from `value`') ||
         args[0]?.includes?.('Writing to `value`'))) {
      return; // Suppress these specific warnings
    }
    originalWarn.apply(console, args);
  };
}

// Suppress RevenueCat purchase-related errors from being displayed in error banner
// These are handled gracefully with user-friendly alerts in the UI
const originalError = console.error;
console.error = (...args) => {
  // Convert args to string for checking
  const message = args.map(arg =>
    typeof arg === 'string' ? arg : JSON.stringify(arg)
  ).join(' ').toLowerCase();

  // Filter out RevenueCat SDK initialization analytics error (harmless - browser API access in React Native)
  if ((message.includes('[revenuecat]') || message.includes('revenuecat')) &&
      (message.includes('sdk_initialized') ||
       message.includes('cannot read property \'search\'') ||
       message.includes('cannot read property "search"'))) {
    // Suppress this harmless analytics tracking error - doesn't affect functionality
    return;
  }

  // Filter out RevenueCat cancellation messages (user-initiated)
  if (message.includes('[revenuecat]') &&
      (message.includes('purchase was cancelled') ||
       message.includes('purchase cancelled') ||
       message.includes('cancelled'))) {
    // Log as info instead of error since it's a user-initiated cancellation
    console.info(...args);
    return;
  }

  // Filter out RevenueCat purchase failure messages (we show user-friendly alerts)
  // These are expected errors that we handle gracefully in the UI
  if ((message.includes('[revenuecat]') || message.includes('revenuecat')) &&
      (message.includes('purchase') ||
       message.includes('revenuecat purchase failed'))) {
    // Still log to console for debugging, but don't show in error banner
    // The UI already shows a user-friendly error alert
    console.warn('[RevenueCat Purchase Error - Handled in UI]', ...args);
    return;
  }

  // Filter out our own logger errors for purchase failures (handled with user alerts)
  if ((message.includes('revenuecat purchase failed') ||
       message.includes('error purchasing credits')) &&
      message.includes('purchase')) {
    // Still log to console for debugging, but don't show in error banner
    // The UI already shows a user-friendly error alert
    console.warn('[Purchase Error - Handled in UI]', ...args);
    return;
  }

  originalError.apply(console, args);
};

function AppContent() {
  const { statusBarStyle } = useTheme();
  const { isLoaded, userId } = useAuthContext();
  const fontsLoaded = useLoadedResources();

  // Initialize RevenueCat when authentication state changes
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    initializeRevenueCat(userId ?? undefined).catch((error) => {
      console.error('Failed to initialize RevenueCat', error);
    });
  }, [isLoaded, userId]);

  // Wait for Supabase auth to load and fonts before showing navigation
  if (!isLoaded || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style={statusBarStyle} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ActionSheetProvider>
            <ThemeProvider>
              <NavigationThemedContainer>
                <MobileDeviceWrapper>
                  <AppContent />
                </MobileDeviceWrapper>
              </NavigationThemedContainer>
            </ThemeProvider>
          </ActionSheetProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}

function NavigationThemedContainer({ children }: { children: React.ReactNode }) {
  const { theme, isDark } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    },
  };
  return <NavigationContainer ref={navigationRef} theme={navTheme}>{children}</NavigationContainer>;
}
