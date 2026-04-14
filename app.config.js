import 'dotenv/config';

const pkg = require('./package.json');

export default {
  expo: {
    // App Metadata
    name: process.env.EXPO_PUBLIC_APP_NAME || 'agro_new_ver_mobile',
    slug: 'agro_new_ver_mobile',
    version: process.env.EXPO_PUBLIC_APP_VERSION || pkg.version,
    
    // Identifiers (must be unique per platform)
    ios: {
      bundleIdentifier: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || 'com.agromobile.app',
      buildNumber: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
      supportsTablet: true,
      // Signing configuration is handled by EAS
    },
    android: {
      package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'com.agromobile.app',
      versionCode: parseInt(process.env.EXPO_PUBLIC_BUILD_NUMBER || '1'),
      googlePlayServicesVersion: 'float',
      permissions: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    
    // UI/UX Configuration
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    icon: './assets/images/icon.png',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    
    // Asset Configuration
    assetBundlePatterns: ['**/*'],
    
    // Deep Linking
    scheme: 'agromobile',
    plugins: ['expo-router', 'expo-secure-store'],
    experiments: {
      typedRoutes: true,
    },
    
    // Web Configuration
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    
    // Environment-based configuration
    extra: {
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com',
      apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
      apiRetryAttempts: parseInt(process.env.EXPO_PUBLIC_API_RETRY_ATTEMPTS || '3'),
      apiRetryDelay: parseInt(process.env.EXPO_PUBLIC_API_RETRY_DELAY || '1000'),
      analyticsEnabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'true',
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
      logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL || 'info',
    },
    
    // EAS Build Configuration
    runtimeVersion: {
      policy: 'nativeVersion',
    },
    // Updates configuration - only enable when you have an EAS Update project setup
    // updates: {
    //   enabled: process.env.EXPO_PUBLIC_ENVIRONMENT === 'production',
    //   url: process.env.EXPO_PUBLIC_UPDATES_URL,
    // },
  },
};
