import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { TokenStoreScreen } from "../screens/TokenStoreScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { useTheme } from "../contexts/ThemeContext";
import { LargeTitleHeader } from "../components/LargeTitleHeader";
import { navigationRef } from "../services/NavigationService";
import { getEnabledTabs } from "../config/tabConfig";
import { useTokens } from "../hooks/useTokens";
import { useAuthContext } from "../contexts/AuthContext";
import { Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { iconSizes, typography, spacing } from "../constants/designSystem";

export type HomeStackParamList = {
  Home: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
};

export type ChatStackParamList = {
  Chat: undefined;
};

export type RootStackParamList = {
  SignIn: undefined;
  MainTabs: undefined;
  TokenStore: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const Tab = createBottomTabNavigator();

function HomeStackNavigator() {
  const { theme } = useTheme();
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ 
          header: () => <LargeTitleHeader 
            title="Home" 
            iconName="home-outline"
            iconColor="#007AFF"
            iconSize={28}
          />,
        }}
      />
    </HomeStack.Navigator>
  );
}

function SettingsStackNavigator() {
  const { theme } = useTheme();
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ 
          header: () => <LargeTitleHeader 
            title="Settings" 
            iconName="settings-outline"
            iconColor="#5A8FAF"
            iconSize={28}
          />,
        }}
      />
    </SettingsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const { theme } = useTheme();
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ 
          header: () => <LargeTitleHeader 
            title="Profile" 
            iconName="person-outline"
            iconColor="#34C759"
            iconSize={28}
          />,
        }}
      />
    </ProfileStack.Navigator>
  );
}

function ChatHeader() {
  const { theme } = useTheme();
  const { balance, loading: tokensLoading } = useTokens();

  const balanceText =
    tokensLoading
      ? "Loading..."
      : balance !== null
      ? `${balance} Credits`
      : "—";

  return (
    <LargeTitleHeader
      title="Chat"
      iconName="chatbubble-outline"
      iconColor="#FF9500"
      iconSize={28}
      rightButton={
        <View style={chatHeaderStyles.balanceContainer}>
          <Text
            style={[
              chatHeaderStyles.balanceText,
              { color: theme.textSecondary },
            ]}
          >
            {balanceText}
          </Text>
        </View>
      }
    />
  );
}

function ChatStackNavigator() {
  const { theme } = useTheme();
  return (
    <ChatStack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <ChatStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          header: () => <ChatHeader />,
        }}
      />
    </ChatStack.Navigator>
  );
}

// Tab configuration mapping
const TAB_CONFIG: Record<
  string,
  {
    tabName: string;
    component: React.ComponentType<any>;
    title: string;
    iconName: string;
  }
> = {
  home: {
    tabName: "HomeTab",
    component: HomeStackNavigator,
    title: "Home",
    iconName: "home-outline",
  },
  chat: {
    tabName: "ChatTab",
    component: ChatStackNavigator,
    title: "Chat",
    iconName: "chatbubble-outline",
  },
  settings: {
    tabName: "SettingsTab",
    component: SettingsStackNavigator,
    title: "Settings",
    iconName: "settings-outline",
  },
  profile: {
    tabName: "ProfileTab",
    component: ProfileStackNavigator,
    title: "Profile",
    iconName: "person-outline",
  },
};

function MainTabs() {
  const { theme } = useTheme();
  const enabledTabs = getEnabledTabs();
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          // Find the tab config by matching route name
          const tabEntry = Object.values(TAB_CONFIG).find(
            (config) => config.tabName === route.name
          );
          const iconName = tabEntry?.iconName || "help-outline";
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { 
          height: 56 + (insets.bottom || 0), 
          backgroundColor: theme.background, 
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom || 0,
          paddingTop: 0,
        },
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: false,
      })}
    >
      {enabledTabs.map((tabKey) => {
        const config = TAB_CONFIG[tabKey];
        if (!config) {
          return null;
        }
        return (
          <Tab.Screen
            key={config.tabName}
            name={config.tabName}
            component={config.component}
            options={{ title: config.title, headerShown: false }}
          />
        );
      })}
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { theme } = useTheme();
  const { isSignedIn, isLoaded } = useAuthContext();
  
  // Wait for auth to load before showing navigation
  if (!isLoaded) {
    return null;
  }
  
  // Handle navigation based on auth state changes
  useEffect(() => {
    if (!isLoaded) return;
    
    if (isSignedIn) {
      // If signed in and currently on SignIn screen, navigate to MainTabs
      const currentRoute = navigationRef.current?.getCurrentRoute();
      if (currentRoute?.name === 'SignIn') {
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } else {
      // If signed out and currently on authenticated screens, navigate to SignIn
      const currentRoute = navigationRef.current?.getCurrentRoute();
      if (currentRoute && currentRoute.name !== 'SignIn') {
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
      }
    }
  }, [isSignedIn, isLoaded]);
  
  // Always register all screens - this ensures React Navigation properly initializes
  // the tab navigator on mobile. The initialRouteName controls which screen shows first.
  return (
    <RootStack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={isSignedIn ? "MainTabs" : "SignIn"}
    >
      <RootStack.Screen name="MainTabs" component={MainTabs} />
      <RootStack.Screen
        name="TokenStore"
        component={TokenStoreScreen}
        options={({ navigation }) => ({ 
          headerShown: true, 
          title: "Token Store", 
          presentation: "modal",
          headerStyle: {
            backgroundColor: theme.card,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: theme.text,
          },
        })}
      />
      <RootStack.Screen 
        name="SignIn" 
        component={SignInScreen}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}

const chatHeaderStyles = StyleSheet.create({
  balanceContainer: {
    alignItems: "flex-end",
  },
  balanceText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

