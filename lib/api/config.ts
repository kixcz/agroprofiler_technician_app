/**
 * API Configuration
 * Loads environment-aware configuration for API client with automatic
 * Android Emulator loopback resolution.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  environment: 'development' | 'production' | 'preview';
  analyticsEnabled: boolean;
  sentryDsn: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Determine dynamic fallback base URL for local development
 */
function resolveDynamicBaseUrl(configuredUrl: string): string {
  // If running on an Android Emulator or device forwarded via adb reverse,
  // ensure localhost/127.0.0.1 or local machine IPs are accessible
  if (__DEV__ && Platform.OS === 'android') {
    // If the configured URL is pointing to localhost or 127.0.0.1, Android cannot reach
    // host unless forwarded or using 10.0.2.2.
    // 10.0.2.2 is the official Android emulator alias for the host machine loopback.
    if (configuredUrl.includes('localhost') || configuredUrl.includes('127.0.0.1')) {
      return configuredUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
    }
  }
  return configuredUrl;
}

/**
 * Get API configuration from app.config.js extra or environment variables
 */
export function getApiConfig(): ApiConfig {
  const appConfig = (Constants.expoConfig?.extra as Record<string, any>) || {};

  const rawBaseUrl =
    appConfig.apiBaseUrl ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    'http://10.0.2.2:8000/api';

  const baseUrl = resolveDynamicBaseUrl(rawBaseUrl);

  return {
    baseUrl,
    timeout: appConfig.apiTimeout || parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
    retryAttempts:
      appConfig.apiRetryAttempts || parseInt(process.env.EXPO_PUBLIC_API_RETRY_ATTEMPTS || '3', 10),
    retryDelay:
      appConfig.apiRetryDelay || parseInt(process.env.EXPO_PUBLIC_API_RETRY_DELAY || '1000', 10),
    environment: (appConfig.environment || process.env.EXPO_PUBLIC_ENVIRONMENT || 'development') as any,
    analyticsEnabled: appConfig.analyticsEnabled || process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'true',
    sentryDsn: appConfig.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    logLevel: (appConfig.logLevel || process.env.EXPO_PUBLIC_LOG_LEVEL || 'info') as any,
  };
}

/**
 * Export singleton instance
 */
export const apiConfig = getApiConfig();
