# Project Configuration TODO

This file lists all configuration items that need to be updated when creating a new project from **MobileApp** (or when cloning this repo as a template). First, complete the Prerequisites and use the keys/values to fill in this file; you can use an AI IDE (e.g. Cursor) to apply the values across config files.

## Components Setup (Prerequisites)

Before you start developing your app, set up the following external components and gather the required IDs/keys. You will plug these values into the sections below (API Keys & Environment Variables, EAS Configuration, Supabase, etc.).

- **App Store Connect (ASC)** (`https://appstoreconnect.apple.com/`)
  - Create your iOS app in App Store Connect.
  - Configure In-App Purchases for your app with these product identifiers:
    - **Starter Pack** — `credits.v1.pack1`
    - **Value Pack** — `credits.v1.pack2`
    - **Mega Pack** — `credits.v1.pack3`

- **RevenueCat (RC)** (`https://app.revenuecat.com/`)
  - In **Apps & Providers**, create an app config for your store using **Add App Config**.
  - Import the In-App Purchases for your app from App Store Connect.
  - From your app config, copy the **Public API key** and use it as:
    - `EXPO_PUBLIC_REVENUECAT_IOS_KEY`

- **Supabase** (`https://supabase.com/`)
  - Create a new Supabase project for your app.
  - From **Project Settings → API**, copy the project URL as:
    - `EXPO_PUBLIC_SUPABASE_URL`
  - From **Project Settings → API Keys**, copy the **anon** (public) key as:
    - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - In **Authentication → Providers**, enable **Apple** and **Google** (and any other OAuth providers you need).
  - Use the scripts under the `Supabase` folder in this repo to:
    - Create the required tables and reference data.
    - Create database functions (RPCs) and edge functions.
  - In the Supabase dashboard, configure **environment variables** for edge functions:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `JWT_SECRET` (from Project Settings → API → JWT Secret; used to verify Supabase Auth tokens)
    - `OPENAI_API_KEY`
    - `REVENUECAT_WEBHOOK_SECRET` (required for `ai-credit-tokens-from-revenuecat` webhook verification)
    - **`DEV_MODE`**: set to `true` **only** for dev/preview so `ai-credit-tokens-from-expogo` accepts mock purchases (e.g. Expo Go). Use **`false` or omit in production** so that function rejects all requests.
  - Optional: `SB_JWT_ISSUER` (defaults to `{SUPABASE_URL}/auth/v1` if not set)
  - Optional: `DEBUG_LOG` — set to `true` on Edge Functions for extra server logs

- **Expo.dev / EAS** (`https://expo.dev/`)
  - Create a new Expo project for your app and copy the **EAS Project ID** (used in `app.config.js`).
  - In the Expo dashboard (or via EAS Secrets), set the following environment variables for your app:
    - `EXPO_PUBLIC_REVENUECAT_IOS_KEY` — RevenueCat iOS Public API key.
    - `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL.
    - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase project anon key.
    - `EXPO_PUBLIC_LOG_DEBUG` — set to `true` for Dev/Preview; omit or set to `false` for Production (controls debug logging).

Use the keys/values from above to fill below as applicable.

## Project Information

- [ ] **Project Name**: `[PROJECT_NAME]` (used in package.json)
- [ ] **Package Name**: `[package-name]` (lowercase, no spaces, used in package.json)
- [ ] **App Display Name**: `[App Display Name]` (shown to users, used in app.config.js)
- Project Icon: add icon to the source code here --> ./assets/icon.png

## App Store / Play Store Configuration

- [ ] **iOS App Name**: `[iOS App Name]` (display name in App Store Connect)
- [ ] **iOS Bundle ID**: `[com.example.app]` (must be unique, e.g., `com.yourcompany.appname`)
- [ ] **Android Package Name**: `[com.example.app]` (must match iOS Bundle ID)
- [ ] **App Slug**: `[app-slug]` (lowercase, no spaces, used in Expo URLs)
- [ ] **URL Scheme**: `[appscheme]` (lowercase, no spaces, used for deep linking)

**Files to update:**
- `app.config.js` (lines: name, slug, scheme, android.package, ios.bundleIdentifier)

## EAS Configuration

- [ ] **EAS Project ID**: `[new-eas-project-id]` ⚠️ **MUST be new for each project** (create via `eas init` or Expo dashboard)

**Files to update:**
- `app.config.js` (line: extra.eas.projectId)

## API Keys & Environment Variables

These values can typically be **shared across projects** if using the same backend infrastructure:

- [ ] **RevenueCat iOS API Key**: `[rc_ios_...]` (from RevenueCat dashboard)
- [ ] **RevenueCat Android API Key**: `[rc_android_...]` (from RevenueCat dashboard)
- [ ] **Supabase URL**: `[https://xxxxx.supabase.co]` (from Supabase project settings)
- [ ] **Supabase Anon Key**: `[eyJ...]` (from Supabase project settings)
- [ ] **Debug Logging**: `EXPO_PUBLIC_LOG_DEBUG=true` (optional, for development - set to `true` to enable debug logs, defaults to `false`)

**Files to update:**
- `app.config.js` (lines: extra.REVENUECAT_IOS_KEY, extra.REVENUECAT_ANDROID_KEY, extra.SUPABASE_URL, extra.SUPABASE_ANON_KEY)
- `.env.local` (for Expo Go development)

**Note:** These are typically set via environment variables (`.env.local` for Expo Go, EAS Secrets for builds), but defaults can be set in `app.config.js`.

**Note:** 
- `EXPO_PUBLIC_LOG_DEBUG` controls debug logging (set to `'true'` for development, omit or set to `'false'` for production). This replaced the old `EXPO_PUBLIC_APP_ENV` variable.
- `EXPO_PUBLIC_SUPABASE_AI_FUNCTION` has been removed - the AI function name is now hard-coded as `'ai-call-function'` in `src/services/aiService.ts`.

## App-Specific Settings

- [ ] **App Name**: `[AppName]` (set in `app.config.js` as `expo.name` - automatically used by `getAppName()`)

**Files to update:**
- `app.config.js` (line: expo.name - this is the source of truth for app name)

**Note:** App name is read directly from `app.config.js` (`expo.name`), not from environment variables. No need to set `EXPO_PUBLIC_APP_NAME`.

**Note:** RevenueCat Entitlements are not needed for consumable products (token packs). Entitlements are only used for subscriptions or non-consumable products. The codebase has been cleaned up to remove entitlement checking for consumables.

## Supabase Edge Functions

These are the default edge function names. Usually **unchanged** unless you have custom function names. Deploy sources from `Supabase/edge-functions/`.

**Called from the mobile app (authenticated JWT):**

- [ ] **ai-get-balance-function**: wallet balance via RPC `get_user_balance` (default name)
- [ ] **ai-user-login-function**: upserts `public.users` after sign-in via RPC `upsert_user_login` (used by `src/services/userLoginService.ts`)
- [ ] **ai-get-iap-products-function**: paywall catalog via RPC `get_iap_products`
- [ ] **ai-credit-tokens-from-expogo**: mock / Expo Go token credit via RPC `add_tokens` — **only when `DEV_MODE=true`** on the Edge Function environment
- [ ] **ai-call-function**: OpenAI completion + `deduct_tokens` + `ai_usage_log` (hard-coded in `src/services/aiService.ts`)

**Server / integrations (not invoked directly from purchase UI as primary path):**

- [ ] **ai-credit-tokens-from-revenuecat**: RevenueCat **webhook**; verifies `REVENUECAT_WEBHOOK_SECRET`, calls RPC `add_tokens_rc`. Configure webhook URL in RevenueCat to this function’s deployed URL.

**Files to update (if different from defaults):**

- `src/services/tokenService.ts` — search for `callEdgeFunction(` (defaults: **~56** `ai-get-balance-function`, **~162 / ~247** `ai-credit-tokens-from-expogo`, **~457** `ai-get-iap-products-function`; line numbers may drift)
- `src/services/userLoginService.ts` — **`ai-user-login-function`** (~line 33)
- `src/services/aiService.ts` — **`getDefaultFunctionName()`** returns `'ai-call-function'` (currently **~lines 38–39**)

**Note:** The AI function name is hard-coded. No `EXPO_PUBLIC_*` variable is used. To rename it, update `aiService.ts` (and deploy the matching Edge Function name in Supabase).

## Supabase Database

If this is a new app that needs its own database registration:

- [ ] **App Name**: `[AppName]` (must match `app.config.js` name, used in database)
- [ ] **App ID (RevenueCat)**: `[app_id_from_revenuecat]` (from RevenueCat dashboard, e.g., `app6d23f53079`)
- [ ] **Bundle ID**: `[com.example.app]` (must match `app.config.js` iOS bundle identifier)

**Files to update:**

- `Supabase/tables/Tables.sql` — uncomment and edit the **sample** `insert into public.apps (...)` block (currently commented near the top of the file, e.g. **~lines 24–28**). Set `app_name`, `app_id` (RevenueCat), and `bundle_id` to match `app.config.js` and your stores.

**Also for new apps:** ensure a row exists in **`ai_app_configs`** for your `app_name` (and `mode` if you use multiple modes per app), so `ai-call-function` can load `system_prompt`, model, and limits.

**Note:** If sharing the same Supabase backend and app registration, you can skip this section.

## Optional Configuration

### OAuth Providers (Supabase Dashboard)
- [ ] Enable Apple and Google (and any other providers) in Supabase: **Authentication → Providers**.
- [ ] Update `src/screens/SignInScreen.tsx` if you need a custom OAuth or email flow.

### Custom Edge Function Names
- [ ] If using custom Supabase edge function names, update all references in:
  - `src/services/tokenService.ts`
  - `src/services/aiService.ts`
  - `src/services/userLoginService.ts`

## Quick Reference: Files That Need Updates

Based on the values above, these files will need to be updated:

1. **app.config.js**
   - App name, slug, scheme
   - Bundle IDs (iOS/Android)
   - EAS project ID
   - Environment variable defaults

2. **package.json**
   - Package name

3. **src/services/envService.ts**
   - Default app name fallback if `expo.name` is missing (`getAppName()` — search for the fallback string)

4. **Supabase/tables/Tables.sql** (if new app registration needed)
   - Uncomment and edit `insert into public.apps ...`; add **`ai_app_configs`** data for your app if needed

5. **.env.local** (for Expo Go development)
   - All environment variables

6. **src/services/** (only if renaming Edge Functions)
   - `tokenService.ts`, `aiService.ts`, `userLoginService.ts`

## Notes

- **Shared vs. Unique Values:**
  - **Must be unique per project:** Package name, bundle IDs, EAS project ID, app slug, URL scheme
  - **Can be shared:** API keys (RevenueCat, Supabase), edge function names

- **Environment Variables:**
  - For Expo Go: Set in `.env.local` file
  - For EAS builds: Set in `eas.json` or via EAS Secrets in Expo dashboard

- **Testing:**
  - After configuration, test with Expo Go first (ensure **`DEV_MODE=true`** on `ai-credit-tokens-from-expogo` if you rely on mock credits)
  - Then test with EAS dev build
  - Verify all API integrations (Supabase Auth sign-in, `ai-user-login-function`, AI calls via `ai-call-function`, RevenueCat purchases / webhook token credit, other Edge Function calls)

