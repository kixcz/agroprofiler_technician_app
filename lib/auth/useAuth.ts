/**
 * Authentication Hook
 * Manages login, logout, token refresh, and authentication state
 */

import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { apiClient } from '@/lib/api/client';
import { LoginRequest, LoginResponse, User } from '@/lib/api/types';
import { logger } from '@/lib/logger';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * Restore session on app launch
   */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('api_access_token');
        if (token) {
          // Optionally verify token is still valid by calling /auth/me endpoint
          setState((prev) => ({
            ...prev,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        logger.error('Failed to restore session', { error });
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to restore session',
        }));
      }
    };

    restoreSession();
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.post<LoginResponse>('/login', credentials);

      // Laravel Sanctum returns the response directly, not wrapped in {success, data}
      const responseData = response.data || response;
      
      // Handle both formats: {accessToken, user} or {success: true, data: {accessToken, user}}
      const tokens: any = response.success ? response.data : responseData;
      
      if (!tokens) {
        throw new Error(response.error?.message || 'Login failed');
      }

      // Save tokens securely - handle if accessToken is named 'token' (Laravel Sanctum)
      const tokenToSave = tokens.accessToken || tokens.token;
      if (!tokenToSave) {
        throw new Error('No access token received from server');
      }

      await apiClient.saveTokens(
        tokenToSave,
        tokens.refreshToken,
        tokens.expiresIn || 3600 // Default 1 hour if not provided
      );

      setState({
        user: tokens.user || tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      logger.info('User logged in successfully', { userId: tokens.user?.id || tokens.id });
      console.log('Login successful, returning result:', { success: true, user: tokens.user || tokens });
      return { success: true, user: tokens.user || tokens };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      logger.error('Login error', { error: errorMessage });

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      }));

      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Logout and clear stored tokens
   */
  const logout = useCallback(async () => {
    try {
      // Fire-and-forget: notify backend without blocking logout
      apiClient.post('/logout', {}).catch((error) => {
        logger.warn('Failed to notify backend of logout', { error });
      });

      // Immediately clear stored tokens
      await apiClient.clearTokens();

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      logger.info('User logged out successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      logger.error('Logout error', { error: errorMessage });

      // Even on error, clear state so user is not stuck
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      return { success: true };
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
      const response = await apiClient.post<LoginResponse>('/register', {
          email,
          password,
          name,
        });

        // Handle Laravel Sanctum response format
        const responseData: any = response.data || response;
        const tokens = response.success ? response.data : responseData;

        if (!tokens) {
          throw new Error(response.error?.message || 'Registration failed');
        }

        // Save tokens - handle 'token' field name (Laravel Sanctum)
        const tokenToSave = tokens.accessToken || tokens.token;
        if (tokenToSave) {
          await apiClient.saveTokens(
            tokenToSave,
            tokens.refreshToken,
            tokens.expiresIn || 3600
          );
        }

        setState({
          user: tokens.user || tokens,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        logger.info('User registered successfully', { userId: tokens.user?.id || tokens.id });
        return { success: true, user: tokens.user || tokens };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        logger.error('Registration error', { error: errorMessage });

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          isAuthenticated: false,
        }));

        return { success: false, error: errorMessage };
      }
    },
    [],
  );

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.put<User>('/auth/profile', updates);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Profile update failed');
      }

      setState((prev) => ({
        ...prev,
        user: response.data || null,
        isLoading: false,
        error: null,
      }));

      logger.info('User profile updated successfully');
      return { success: true, user: response.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      logger.error('Profile update error', { error: errorMessage });

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    logout,
    register,
    updateProfile,
    clearError,
  };
}
