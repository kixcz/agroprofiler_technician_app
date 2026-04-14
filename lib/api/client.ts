/**
 * HTTP Client with Retry Logic, Token Injection, and Error Handling
 * Centralized API communication with automatic token refresh
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { apiConfig } from './config';
import { ApiError, ApiResponse, NetworkError } from './types';
import { logger } from '@/lib/logger';

const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'api_access_token',
  REFRESH_TOKEN: 'api_refresh_token',
  TOKEN_EXPIRY: 'api_token_expiry',
};

interface RetryConfig {
  retries: number;
  delay: number;
  maxRetries: number;
  backoffMultiplier: number;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: apiConfig.baseUrl,
      timeout: apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor: inject token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(this.normalizeError(error)),
    );

    // Response interceptor: handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => this.handleResponseError(error),
    );
  }

  /**
   * Get stored access token
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      logger.error('Failed to retrieve access token', { error });
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  private async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      logger.error('Failed to retrieve refresh token', { error });
      return null;
    }
  }

  /**
   * Save tokens to secure storage
   */
  public async saveTokens(
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number,
  ): Promise<void> {
    try {
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      if (expiresIn) {
        const expiry = Date.now() + expiresIn * 1000;
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY, expiry.toString());
      }
    } catch (error) {
      logger.error('Failed to save tokens', { error });
      throw error;
    }
  }

  /**
   * Clear stored tokens
   */
  public async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY);
    } catch (error) {
      logger.error('Failed to clear tokens', { error });
    }
  }

  /**
   * Check if token is expired
   */
  private async isTokenExpired(): Promise<boolean> {
    try {
      const expiry = await SecureStore.getItemAsync(SECURE_STORE_KEYS.TOKEN_EXPIRY);
      if (!expiry) return false;
      return Date.now() > parseInt(expiry);
    } catch {
      return false;
    }
  }

  /**
   * Handle response errors with retry logic and token refresh
   */
  private async handleResponseError(error: AxiosError): Promise<never> {
    const status = error.response?.status;

    // Handle unauthorized (401) - attempt refresh
    if (status === 401) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const refreshToken = await this.getRefreshToken();
          if (refreshToken) {
            const newAccessToken = await this.refreshAccessToken(refreshToken);
            this.isRefreshing = false;
            this.onRefreshed(newAccessToken);

            // Retry original request
            const originalRequest = error.config as AxiosRequestConfig;
            if (originalRequest?.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.client(originalRequest) as Promise<never>;
            }
          }
        } catch (refreshError) {
          this.isRefreshing = false;
          this.refreshSubscribers = [];
          await this.clearTokens();
          throw this.normalizeError(refreshError);
        }
      }

      // Queue request while refreshing
      return new Promise((resolve, reject) => {
        this.subscribeTokenRefresh((token: string) => {
          const originalRequest = error.config as AxiosRequestConfig;
          if (originalRequest?.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            this.client(originalRequest)
              .then((response) => resolve(response as never))
              .catch((err) => reject(this.normalizeError(err)));
          }
        });
      });
    }

    // Handle 429 (rate limit) - retry with backoff
    if (status === 429) {
      const retryAfter = error.response?.headers['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : apiConfig.retryDelay;
      await this.sleep(delay);
      return this.client(error.config as AxiosRequestConfig) as Promise<never>;
    }

    throw this.normalizeError(error);
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const response = await this.client.post<{ accessToken: string; expiresIn?: number }>(
        '/auth/refresh',
        { refreshToken },
        { skipInterceptor: true } as any,
      );

      const newAccessToken = response.data.accessToken;
      await this.saveTokens(newAccessToken, undefined, response.data.expiresIn);
      return newAccessToken;
    } catch (error) {
      logger.error('Failed to refresh token', { error });
      throw error;
    }
  }

  /**
   * Subscribe to token refresh event
   */
  private subscribeTokenRefresh(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notify all subscribers when token is refreshed
   */
  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  /**
   * Generic GET request with retry
   */
  public async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('get', url, undefined, config);
  }

  /**
   * Generic POST request with retry
   */
  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('post', url, data, config);
  }

  /**
   * Generic PUT request with retry
   */
  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('put', url, data, config);
  }

  /**
   * Generic DELETE request with retry
   */
  public async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>('delete', url, undefined, config);
  }

  /**
   * Request with exponential backoff retry logic
   */
  private async requestWithRetry<T = unknown>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const retryConfig: RetryConfig = {
      retries: 0,
      delay: apiConfig.retryDelay,
      maxRetries: apiConfig.retryAttempts,
      backoffMultiplier: 2,
    };

    while (retryConfig.retries <= retryConfig.maxRetries) {
      try {
        const response = await this.executeRequest<T>(method, url, data, config);
        return response;
      } catch (error) {
        const normalizedError = this.normalizeError(error);

        if (
          !normalizedError.isRetryable ||
          retryConfig.retries >= retryConfig.maxRetries
        ) {
          throw normalizedError;
        }

        retryConfig.retries++;
        await this.sleep(retryConfig.delay);
        retryConfig.delay *= retryConfig.backoffMultiplier;

        logger.warn(`Retrying request: ${method.toUpperCase()} ${url}`, {
          attempt: retryConfig.retries,
          maxAttempts: retryConfig.maxRetries,
        });
      }
    }

    throw new Error(`Failed after ${retryConfig.maxRetries} retries`);
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T = unknown>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    let response: AxiosResponse;

    if (method === 'get') {
      response = await this.client.get(url, config);
    } else if (method === 'post') {
      response = await this.client.post(url, data, config);
    } else if (method === 'put') {
      response = await this.client.put(url, data, config);
    } else {
      response = await this.client.delete(url, config);
    }

    return response.data as ApiResponse<T>;
  }

  /**
   * Normalize errors to standard format
   */
  private normalizeError(error: unknown): NetworkError {
    const normalizedError = error as NetworkError;

    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiError | undefined;

      normalizedError.statusCode = error.response?.status;
      normalizedError.code = error.code;
      normalizedError.isNetworkError = !error.response;
      normalizedError.isTimeout = error.code === 'ECONNABORTED';

      // Determine if error is retryable
      normalizedError.isRetryable =
        normalizedError.isNetworkError ||
        normalizedError.isTimeout ||
        [408, 429, 500, 502, 503, 504].includes(normalizedError.statusCode || 0);

      normalizedError.message = apiError?.message || error.message;

      logger.error('API Error', {
        status: normalizedError.statusCode,
        message: normalizedError.message,
        code: normalizedError.code,
        isRetryable: normalizedError.isRetryable,
      });
    }

    return normalizedError;
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update base URL (useful for environment switching)
   */
  public setBaseUrl(url: string): void {
    this.client.defaults.baseURL = url;
  }

  /**
   * Get current axios instance for advanced usage
   */
  public getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
