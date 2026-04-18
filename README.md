# Mobile Template App - Expo Foundation Project

A foundation template for building new Expo-based React Native applications. This mobile template includes a complete setup with theme system, navigation, core components, and design system constants. The template supports Authentication, AI integration and Custom Paywall using Supabase and RevenueCat.

## Features

- **Supabase Authentication (iOS + Google)**: Sign in with **Apple** (native on iOS via `expo-apple-authentication` + Supabase `signInWithIdToken`) and **Google** (OAuth in browser + return via `auth-callback` deep link). Session is persisted; **JWT access tokens** authenticate calls to Supabase Edge Functions.
- **AI via Supabase Edge Functions**: Per-app prompts and OpenAI completion from **`ai-call-function`**; credit wallet, usage logging, and balance/product endpoints wired to PostgreSQL (see [AI integration](#ai-integration-supabase-edge-functions--database) below).
- **Custom paywall (RevenueCat + Supabase)**: **`TokenStore`** screen, StoreKit / RevenueCat purchases, optional **RevenueCat webhook** to credit tokens in Postgres, catalog and ledger in **`iap_products`** / **`iap_transactions`**.
- **Theme System**: Light/dark mode support with customizable theme colors
- **Navigation**: Bottom tab navigation with stack navigators
- **Styled Components**: Pre-built styled components (Text, Card, Icon)
- **Design System**: Consistent spacing, typography, shadows, and colors
- **TypeScript**: Full TypeScript support
- **NativeWind**: Tailwind CSS for React Native
- **Mobile Device Wrapper**: Web preview with realistic device frame

## Authentication (Supabase: iOS + Google)

The app uses **Supabase Auth** as the identity provider. Implementations live primarily in `src/screens/SignInScreen.tsx` and `lib/supabase.ts`.

| Provider | Platform | How it works |
|----------|----------|----------------|
| **Apple** | iOS | `expo-apple-authentication` obtains an Apple **identity token**; the app calls `supabase.auth.signInWithIdToken({ provider: 'apple', token })`. **Sign in with Apple typically requires an EAS/dev build**—Expo Go uses a different bundle ID and may fail audience checks (the screen surfaces this). |
| **Google** | iOS / Android / Web | OAuth flow via `expo-web-browser` and a **`auth-callback`** redirect URL; `Linking` handles the return URL and `createSessionFromUrl` exchanges it for a Supabase session. |

**Dashboard setup**: In the Supabase project, enable **Apple** and **Google** under **Authentication → Providers**, and configure redirect URLs to match your app scheme (see `TODO.md` / `app.config.js`).

**Downstream**: After sign-in, the app can record the user for the current **`app_name`** via `ai-user-login-function` (see [Edge functions](#supabase-edge-functions-mobileappsupabaseedge-functions)), which upserts `public.users` (and related RPC as defined in SQL under `Supabase/functions`).

## AI integration (Supabase Edge Functions + database)

### Supabase Edge Functions (`MobileApp/Supabase/edge-functions`)

| Function | Purpose |
|----------|---------|
| **`ai-call-function`** | **Main AI call.** Verifies **Supabase JWT** (`requireSupabaseUser`). Requires JSON body: **`prompt`** (string) and **`app_name`** (string). Loads **`ai_app_configs`** for that app: **`system_prompt`**, **`model`**, **`temperature`**, **`max_tokens`**, **`max_input_chars`**, **`is_active`**. Calls OpenAI **chat completions** with **system + user** messages. Enforces max input length and a basic profanity filter. After success, computes usage-based **credit cost**, runs **`deduct_tokens`** RPC, and inserts a row into **`ai_usage_log`**. Returns JSON with `text`, `model`, `tokens_charged`, `usage`. |
| **`ai-get-balance-function`** | Authenticated POST; reads **`app_name`** from body; RPC **`get_user_balance`** → `{ balance }`. |
| **`ai-user-login-function`** | Authenticated POST; RPC **`upsert_user_login`** with `user_id` from JWT and **`app_name`** from body. |
| **`ai-delete-user-account-function`** | Authenticated POST; deletes **`public.users`** row for JWT `sub` + **`app_name`** (CASCADE to wallet/IAP/usage); calls **`auth.admin.deleteUser`** when the user has no remaining rows in **`public.users`**. |
| **`ai-get-iap-products-function`** | Authenticated POST; RPC **`get_iap_products`** for **`app_name`** → `{ products }` for the paywall catalog. |
| **`ai-credit-tokens-from-expogo`** | **Development only:** gated by **`DEV_MODE=true`** in Edge env. Authenticated; credits wallet via **`add_tokens`** RPC (Expo Go / mock purchases). **Disabled when `DEV_MODE` is not set (e.g. production).** |
| **`ai-credit-tokens-from-revenuecat`** | **RevenueCat webhook:** validates **`REVENUECAT_WEBHOOK_SECRET`**; parses event; RPC **`add_tokens_rc`** with `p_app_id`, `product_id`, etc. |
| **`_shared/auth.ts`** | JWT verification for user-scoped functions (HS256 with project **`JWT_SECRET`**, issuer optional **`SB_JWT_ISSUER`**). |

**Client:** `src/services/supabaseApi.ts` attaches **`app_name`** (from `expo.name` via `envService.getAppName()`) and **`x-app-name`** on every Edge Function POST. AI usage from the app goes through `src/services/aiService.ts` (e.g. **`ai-call-function`**).

### Database tables (`MobileApp/Supabase/tables/Tables.sql`)

| Table | Role for AI / app |
|-------|---------------------|
| **`apps`** | Registers **`app_name`**, optional **`app_id`** (RevenueCat), **`bundle_id`**. |
| **`users`** | Per-app user row **`(user_id, app_name)`** (tied to Supabase Auth user id). |
| **`ai_tokens`** | Credit **wallet**: **`balance`**, **`lifetime_usage`** per **`(user_id, app_name)`**. |
| **`ai_usage_log`** | One row per AI call: **`model`**, **`input_tokens`**, **`output_tokens`**, **`cost_tokens`**, timestamps. |
| **`ai_app_configs`** | **Per-app AI behavior**: **`system_prompt`**, **`model`**, **`temperature`**, **`max_tokens`**, **`max_input_chars`**, **`is_active`**, plus **`mode`** (see schema—primary key is **`(app_name, mode)`**; ensure your deployed config and Edge Function query match how you store rows). |

### PostgreSQL functions (`MobileApp/Supabase/functions/*.sql`)

These RPCs are invoked from Edge Functions or (where allowed) the service role client:

- **`get_user_balance`** – Ensures wallet row exists, returns balance.
- **`deduct_tokens`** – Deducts **`p_cost`** from **`ai_tokens`** (returns boolean / used by **`ai-call-function`** billing).
- **`upsert_user_login`** – Upserts **`public.users`** (and any schema extensions in the same file, e.g. vocab app tables if present).
- **`get_iap_products`** – Returns active products for **`p_app_name`** (paywall catalog).
- **`add_tokens`** – Adds credits from a known **`product_id`**; logs **`iap_transactions`**.
- **`add_tokens_rc`** – Resolves RevenueCat **`app_id`** → **`app_name`**, then calls **`add_tokens`**.
- **`check_app_exists`** – Helper to verify an app is registered.

## Paywall and credits (RevenueCat + Supabase)

### App UI

- **`TokenStoreScreen`** (`src/screens/TokenStoreScreen.tsx`): Custom paywall UI (featured pack + other options). Loads products via **`fetchAvailableProducts()`** → **`ai-get-iap-products-function`**. Purchases: **native builds** use **`react-native-purchases`** (RevenueCat); **Expo Go** uses **`ai-credit-tokens-from-expogo`** when **`DEV_MODE=true`** on the Edge Function.

### Database (`Tables.sql` + `Supabase/functions`)

| Table / object | Role |
|----------------|------|
| **`iap_products`** | Catalog per **`app_name`**: **`product_id`**, **`display_name`**, **`credits`**, **`price_label`**, **`sort_order`**, **`is_active`**. |
| **`iap_transactions`** | Ledger: **`user_id`**, **`app_name`**, **`product_id`**, **`quantity`**, **`purchase_source`** (e.g. `ios`, `revenuecat`, mock), **`transaction_id`**, optional receipt/payload. |
| **`add_tokens` / `add_tokens_rc`** | Server-side credit grant + transaction row (used by webhook and dev mock). |

### RevenueCat webhook

Configure RevenueCat to POST to your deployed **`ai-credit-tokens-from-revenuecat`** URL. Set **`REVENUECAT_WEBHOOK_SECRET`** in Supabase Edge secrets; the function validates the secret and calls **`add_tokens_rc`** with **`event.app_user_id`**, **`event.app_id`**, **`event.product_id`**, etc.

**Also set** `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / Android key (see `TODO.md` and `app.config.js`).

## Project Structure

```
MobileApp/
├── App.tsx                 # Main app component
├── index.ts                # Entry point
├── package.json            # Dependencies
├── app.config.js           # Expo configuration (name, extras, env)
├── eas.json                # EAS Build configuration
├── Supabase/
│   ├── edge-functions/     # Deno Edge Function sources (deploy to Supabase)
│   ├── functions/         # PostgreSQL function definitions (.sql)
│   └── tables/
│       └── Tables.sql       # Core schema: apps, users, ai_tokens, ai_usage_log,
│                            # iap_*, ai_app_configs
├── src/
│   ├── contexts/
│   │   ├── ThemeContext.tsx
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useThemedStyles.ts
│   │   └── useTokens.ts
│   ├── lib/
│   │   └── supabase.ts     # Supabase client + session helpers
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── services/
│   │   ├── aiService.ts
│   │   ├── supabaseApi.ts  # Edge Function HTTP client + app_name header
│   │   ├── tokenService.ts
│   │   ├── revenueCatService.ts
│   │   └── userLoginService.ts
│   ├── components/
│   └── screens/
│       ├── SignInScreen.tsx
│       ├── TokenStoreScreen.tsx
│       ├── ChatScreen.tsx
│       └── ...
└── assets/
    └── icon.png
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

