Connect app to github
Create app configuration in RevenueCat
Create .env file, update RevenueCat api key
Change to use app.config.js from app.json. delete app.json
Update app.config.js
    - update scheme to app name
    - bundleIdentifier: 'com.broapps.<appname>'
    - remove references to Rork
Supabase - Authentication - URL Configuration
    - add URI '<appname>://auth-callback' based on app scheme name
Supabase - Authentication - Sign in / Providers
    - add 'com.broapps.<appname>' to Apple and Google
Ask AI to create a plan. use below prompt:
    Review@wisflow/wisflow.md . We need Authentication, AI integration and Paywall integration using RevenueCat (including Paywall screen) and Supabase based on template project MobileApp - there is@MobileApp/README.md and @MobileApp/TODO.md you can follow. You can also compare with other project like VocabIQ which follows the same pattern for Authentication and AI. For Paywall integration, for Expo Go based app uses ai call 'ai-credit-tokens-from-expogo' edge function and not RevenueCat edge function. For Native build -> calls RevenueCat purchaseProduct -> ai-credit-tokens-from-revenuecat (handled server-side by RevenueCat webhook).
update eas.json with app id you get from iOS App connect, go to app --> app information --> Apple id