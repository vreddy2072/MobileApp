Connect app to github
iOS Connect
    - create app
    - create 3 subscription products
Create app configuration in RevenueCat
    - setup app, copy appid to insert the product into iap_products supabase table
    - setup products, entitlements and offerings
    - copy 
Create .env file, update RevenueCat api key
Change to use app.config.js from app.json. delete app.json
Update app.config.js
    - update scheme to app name
    - bundleIdentifier: 'com.broapps.<appname>'
    - remove references to Rork
Supabase
    - Authentication - URL Configuration
        - add URI '<appname>://auth-callback' based on app scheme name
    - Authentication - Sign in / Providers
        - add 'com.broapps.<appname>' to Apple and Google
    - add product into apps supabase table
    - add offerings to iap_products
    - add ai_app_configs
Ask AI to create a plan. use below prompt:
    Review@wisflow/wisflow.md . We need Authentication, AI integration and Paywall integration using RevenueCat (including Paywall screen) and Supabase based on template project MobileApp - there is@MobileApp/README.md and @MobileApp/TODO.md you can follow. You can also compare with other project like VocabIQ which follows the same pattern for Authentication and AI. For Paywall integration, for Expo Go based app uses ai call 'ai-credit-tokens-from-expogo' edge function and not RevenueCat edge function. For Native build -> calls RevenueCat purchaseProduct -> ai-credit-tokens-from-revenuecat (handled server-side by RevenueCat webhook).
eas dev updates
    - register the app
    - update eas.json with app id you get from iOS App connect, go to app --> app information --> Apple id
    - add environment variables
Github
    - Create repository for the app under broapps
    - create private.md
    - create index.md
iOS Connect
    - Fill in all the infomation including private etc
    - create app images
Builds
    - start with Expo Go build
    - create test flight
    - publish app
App Publishing Prompt
    - ChatGPT prompt
i am submitting app in appstore connect. I need the following information, make sure you don't use icons etc that appstore connect doesn't accept. there is also restriction on side:

Promotional Text - Promotional text lets you inform your App Store visitors of any current app features without requiring an updated submission. This text will appear above your description on the App Store for customers with devices running iOS 11 or later, and macOS 10.13 or later.Promotional text lets you inform your App Store visitors of any current app features without requiring an updated submission. This text will appear above your description on the App Store for customers with devices running iOS 11 or later, and macOS 10.13 or later.

Description - A description of your app, detailing features and functionality.

Keywords - Include one or more keywords that describe your app. Keywords make App Store search results more accurate. Separate keywords with an English comma, Chinese comma, or a mix of both.

Notes - Additional information about your app that can help during the review process. Include information that may be needed to test your app, such as app-specific settings.

Subtitle - A summary of your app that will appear under your app’s name on your App Store product page. This can’t be longer than 30 characters.

GitHub Index.md Prompt
    - Prompt
i am creating promotional index.md file. Give me the description but with colors and icons. I will place this index.md file in Github.