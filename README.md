# Mobile Template App - Expo Foundation Project

A foundation template for building new Expo-based React Native applications. This mobile template includes a complete setup with theme system, navigation, core components, and design system constants.

**✅ Validated**: This template has been successfully validated through NoteBro app development - both iOS builds and App Store submissions work correctly.

## Features

- **Supabase Authentication**: Sign in with Apple and Google (OAuth); persisted session and JWT-based API auth
- **Theme System**: Light/dark mode support with customizable theme colors
- **Navigation**: Bottom tab navigation with stack navigators
- **Styled Components**: Pre-built styled components (Text, Card, Icon)
- **Design System**: Consistent spacing, typography, shadows, and colors
- **TypeScript**: Full TypeScript support
- **NativeWind**: Tailwind CSS for React Native
- **Mobile Device Wrapper**: Web preview with realistic device frame

## Project Structure

```
MobileTemplate/
├── App.tsx                 # Main app component
├── index.ts                # Entry point
├── package.json            # Dependencies
├── app.json                # Expo configuration
├── eas.json                # EAS Build configuration
├── src/
│   ├── contexts/
│   │   └── ThemeContext.tsx    # Theme provider and context
│   ├── hooks/
│   │   └── useThemedStyles.ts  # Hook for theme-aware styles
│   ├── utils/
│   │   ├── cn.ts               # Class name utility
│   │   └── theme.ts            # Theme utilities
│   ├── constants/
│   │   └── designSystem.ts     # Design system constants
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Navigation setup
│   ├── services/
│   │   └── NavigationService.ts # Navigation service
│   ├── components/
│   │   ├── MobileDeviceWrapper.tsx  # Web device frame
│   │   ├── LargeTitleHeader.tsx     # Header component
│   │   └── styled/
│   │       ├── StyledText.tsx       # Themed text component
│   │       ├── StyledCard.tsx       # Themed card component
│   │       └── StyledIcon.tsx       # Themed icon component
│   └── screens/
│       ├── HomeScreen.tsx       # Sample home screen
│       ├── SettingsScreen.tsx   # Sample settings screen
│       └── ProfileScreen.tsx    # Sample profile screen
└── assets/
    └── icon.png              # App icon (you need to add this)
```

## Getting Started

### 1. Copy the Template

When starting a new project, copy the entire `MobileTemplate` folder and rename it to your project name:

```bash
cp -r MobileTemplate MyNewProject
cd MyNewProject
```

### 2. Update Project Configuration

Update the following files with your project details:

**package.json**:
```json
{
  "name": "my-new-project",
  "version": "1.0.0"
}
```

**app.json**:
```json
{
  "expo": {
    "name": "My New Project",
    "slug": "my-new-project",
    "scheme": "mynewproject",
    "android": {
      "package": "com.yourcompany.mynewproject"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.mynewproject"
    }
  }
}
```

### 3. Install Dependencies

```bash
npm install
```

**Note**: This template uses the same dependency versions as RemindBro (a proven working Expo project) to avoid environment setup issues. The `react-native-worklets@^0.5.1` npm package is required for React Native Reanimated 4.1.0 and includes native iOS headers needed for EAS builds. This template has been validated with NoteBro - both iOS builds and App Store submissions work successfully.

### 4. Configure Supabase and Auth

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (see `TODO.md` for full setup). In your Supabase project, enable **Apple** and **Google** under **Authentication → Providers** so sign-in works.

### 5. Add App Icon

Add your app icon to `assets/icon.png` (1024x1024px recommended).

### 6. Start Development

```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser
- Scan QR code with Expo Go app on your device

## Usage Guide

### Theme System

The theme system supports light and dark modes. Use the `useTheme` hook to access theme colors:

```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>Hello</Text>
      <Button onPress={() => setThemeMode(isDark ? 'light' : 'dark')}>
        Toggle Theme
      </Button>
    </View>
  );
}
```

### Using Themed Styles Hook

The `useThemedStyles` hook provides theme-aware style objects:

```tsx
import { useThemedStyles } from '../hooks/useThemedStyles';

function MyComponent() {
  const styles = useThemedStyles();
  
  return (
    <View style={styles.backgroundStyle}>
      <Text style={styles.textStyle}>Themed Text</Text>
      <View style={styles.cardStyle}>
        <Text>Card Content</Text>
      </View>
    </View>
  );
}
```

### Styled Components

Use the pre-built styled components for consistent styling:

```tsx
import { StyledText } from '../components/styled/StyledText';
import { StyledCard } from '../components/styled/StyledCard';
import { StyledIcon } from '../components/styled/StyledIcon';

function MyComponent() {
  return (
    <StyledCard>
      <StyledText variant="cardTitle">Title</StyledText>
      <StyledText variant="listName">Subtitle</StyledText>
      <StyledIcon name="heart" size={24} color="#FF0000" />
    </StyledCard>
  );
}
```

### Adding New Screens

1. Create a new screen file in `src/screens/`:

```tsx
// src/screens/MyNewScreen.tsx
import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { LargeTitleHeader } from "../components/LargeTitleHeader";

export function MyNewScreen() {
  const { theme } = useTheme();
  
  return (
    <View>
      <LargeTitleHeader title="My New Screen" />
      <Text style={{ color: theme.text }}>Screen Content</Text>
    </View>
  );
}
```

2. Add the screen to navigation in `src/navigation/AppNavigator.tsx`:

```tsx
import { MyNewScreen } from "../screens/MyNewScreen";

// Add to stack navigator
<MyNewStack.Screen
  name="MyNew"
  component={MyNewScreen}
  options={{ 
    header: () => <LargeTitleHeader title="My New Screen" />,
  }}
/>
```

### Adding New Tabs

1. Create a stack navigator for the new tab:

```tsx
const MyNewStack = createNativeStackNavigator<MyNewStackParamList>();

function MyNewStackNavigator() {
  return (
    <MyNewStack.Navigator>
      <MyNewStack.Screen
        name="MyNew"
        component={MyNewScreen}
        options={{ 
          header: () => <LargeTitleHeader title="My New Tab" />,
        }}
      />
    </MyNewStack.Navigator>
  );
}
```

2. Add the tab to `MainTabs`:

```tsx
<Tab.Screen 
  name="MyNewTab" 
  component={MyNewStackNavigator} 
  options={{ title: "My New Tab", headerShown: false }} 
/>
```

3. Update the tab bar icon in `screenOptions`:

```tsx
tabBarIcon: ({ color, size }) => {
  let iconName: string;
  if (route.name === "MyNewTab") {
    iconName = "star-outline";
  }
  // ... other icons
  return <Ionicons name={iconName as any} size={size} color={color} />;
}
```

### Customizing Theme Colors

Edit `src/utils/theme.ts` to customize theme colors:

```tsx
export const lightTheme: ThemeColors = {
  background: "#F9FAFB",
  primary: "#007AFF",  // Change this
  // ... other colors
};
```

### Customizing Design System

Edit `src/constants/designSystem.ts` to customize spacing, typography, shadows, etc.:

```tsx
export const spacing = {
  xs: 8,
  sm: 12,
  // Add or modify spacing values
};
```

## Building and Deployment

### Development Build

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### Production Build with EAS

1. Install EAS CLI:

```bash
npm install -g eas-cli
```

2. Login to Expo:

```bash
eas login
```

3. Configure EAS (if needed):

```bash
eas build:configure
```

4. Build for production:

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Both
eas build --platform all --profile production
```

5. Submit to app stores:

```bash
# iOS (requires ascAppId in eas.json submit.production.ios section)
eas submit --platform ios --profile production

# Android
eas submit --platform android --profile production
```

**Note**: Before submitting iOS apps, update `eas.json` with your App Store Connect App ID:
```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "YOUR_APP_ID_HERE"
    }
  }
}
```

## Troubleshooting

### Metro bundler issues

Clear cache and restart:

```bash
npm start -- --reset-cache
```

### TypeScript errors

Ensure all dependencies are installed:

```bash
npm install
```

### Navigation errors

Make sure all screen components are properly exported and imported.

### Theme not updating

Ensure components are wrapped in `ThemeProvider` and using `useTheme` hook.

### Web build issues

Check that `babel-plugin-transform-import-meta.js` is in the root directory and referenced in `babel.config.js`.

## Code Examples

### Example: Creating a Themed Button Component

```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
}

export function ThemedButton({ title, onPress }: ThemedButtonProps) {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: theme.primary }]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, { color: theme.background }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Example: Using Navigation Service

```tsx
import { navigate } from '../services/NavigationService';

function MyComponent() {
  const handlePress = () => {
    navigate('MainTabs');
  };
  
  return <Button onPress={handlePress} title="Navigate" />;
}
```

## Dependencies

Key dependencies included:

- **expo**: Expo SDK 54
- **react-navigation**: Navigation library
- **nativewind**: Tailwind CSS for React Native
- **react-native-reanimated**: Animations (requires `react-native-worklets@^0.5.1`)
- **react-native-gesture-handler**: Gesture handling
- **react-native-safe-area-context**: Safe area handling
- **react-native-worklets**: Required for react-native-reanimated (uses real npm package)

See `package.json` for the complete list.

**Important**: This template uses the real `react-native-worklets@^0.5.1` npm package (not a local stub). The real package includes native iOS headers required for EAS builds. The `worklets-stub` folder has been removed as it's not needed.

## License

This template is provided as-is for use in your projects.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Expo documentation: https://docs.expo.dev
3. Review React Navigation documentation: https://reactnavigation.org

