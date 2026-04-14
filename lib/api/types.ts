/**
 * API Response Types and Contracts
 * Defines the standardized format for all API responses and errors
 */

/**
 * Generic API response wrapper for all endpoints
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp?: string;
  meta?: {
    version: string;
    requestId?: string;
  };
}

/**
 * Standardized error response format
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
  path?: string;
}

/**
 * Authentication tokens structure
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * User information from API
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response contains tokens and user info
 */
export interface LoginResponse extends AuthTokens {
  user: User;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse extends AuthTokens {}

/**
 * Error response from API (used internally)
 */
export interface NetworkError extends Error {
  statusCode?: number;
  code?: string;
  response?: {
    data?: ApiError;
    status?: number;
  };
  isNetworkError?: boolean;
  isTimeout?: boolean;
  isRetryable?: boolean;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination?: PaginationMeta;
}
