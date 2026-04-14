/**
 * API Configuration
 * Loads environment-aware configuration for API client
 */

import Constants from 'expo-constants';

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
 * Get API configuration from app.config.js extra or environment variables
 */
export function getApiConfig(): ApiConfig {
  const appConfig = Constants.expoConfig?.extra as Record<string, any> || {};

  return {
    baseUrl: appConfig.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com',
    timeout: appConfig.apiTimeout || parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
    retryAttempts: appConfig.apiRetryAttempts || parseInt(process.env.EXPO_PUBLIC_API_RETRY_ATTEMPTS || '3'),
    retryDelay: appConfig.apiRetryDelay || parseInt(process.env.EXPO_PUBLIC_API_RETRY_DELAY || '1000'),
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
