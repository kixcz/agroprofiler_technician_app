# Backend Requirements for Agro Mobile App

This document outlines the requirements for the backend API that the Agro Mobile app depends on.

## 1. API Endpoints

### Authentication Endpoints

#### POST /auth/login
Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "rememberMe": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://...",
      "role": "user",
      "permissions": ["read", "write"]
    }
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "statusCode": 401
  }
}
```

#### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "secure_password",
  "name": "Jane Doe"
}
```

**Response:** Similar to login endpoint

#### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

#### POST /auth/logout
Logout user and invalidate tokens.

**Request:** (empty body, requires Authorization header)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {}
}
```

#### GET /auth/profile
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "role": "user",
    "permissions": ["read", "write"]
  }
}
```

#### PUT /auth/profile
Update user profile.

**Request:**
```json
{
  "name": "Jane Doe",
  "avatar": "https://..."
}
```

**Response:** Same as GET /auth/profile

## 2. Security Requirements

### CORS Configuration
The backend must implement proper CORS headers:

```
Access-Control-Allow-Origin: https://yourdomain.com (or mobile app scheme)
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### Authentication

- **Token Type**: Bearer tokens (JWT recommended)
- **Token Format**: `Authorization: Bearer {token}`
- **Token Expiration**: Include `expiresIn` in token response (in seconds)
- **Refresh Token**: Provide refresh tokens for obtaining new access tokens without re-login
- **Token Storage**: Tokens are stored in secure device storage (`expo-secure-store`)

### HTTPS

- All API endpoints must use HTTPS
- Certificate must be valid and trusted
- No self-signed certificates in production

## 3. API Response Format

All API responses must follow this standardized format:

```json
{
  "success": boolean,
  "data": object | array,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "statusCode": 400,
    "path": "/auth/login"
  },
  "timestamp": "2024-04-04T12:00:00Z",
  "meta": {
    "version": "1.0.0",
    "requestId": "req-123abc"
  }
}
```

## 4. HTTP Status Codes

The backend must properly use HTTP status codes:

| Status Code | Meaning | Example |
|------------|---------|---------|
| 200 | OK - Request succeeded | Successful login, data retrieval |
| 201 | Created - Resource created | User registration |
| 400 | Bad Request - Invalid input | Missing required fields |
| 401 | Unauthorized - Authentication required | Missing/invalid token |
| 403 | Forbidden - Insufficient permissions | User lacks required role |
| 404 | Not Found - Resource doesn't exist | User not found |
| 408 | Request Timeout | Server processing took too long |
| 429 | Too Many Requests - Rate limited | Exceeded rate limit |
| 500 | Internal Server Error | Server-side error |
| 502 | Bad Gateway | Service temporarily unavailable |
| 503 | Service Unavailable | Server maintenance |
| 504 | Gateway Timeout | Server took too long to respond |

## 5. Rate Limiting

Implement rate limiting to prevent abuse:

**Headers in Response:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1680700800
Retry-After: 60
```

When rate limited (429):
- Return `Retry-After` header with seconds to wait
- Include rate limit info in response

## 6. Error Handling

Standardized error codes:

```
INVALID_CREDENTIALS - Login failed
USER_NOT_FOUND - User doesn't exist
DUPLICATE_EMAIL - Email already registered
VALIDATION_ERROR - Input validation failed
UNAUTHORIZED - Missing/invalid authentication
FORBIDDEN - Insufficient permissions
NOT_FOUND - Resource not found
INTERNAL_ERROR - Server error
TIMEOUT - Request timeout
SERVICE_UNAVAILABLE - Server unavailable
```

## 7. Timeout Configuration

- **Connect Timeout**: 10 seconds (for establishing connection)
- **Read Timeout**: 30 seconds (for receiving response)
- **Write Timeout**: 30 seconds (for sending request)

Backend should acknowledge requests within 10 seconds to avoid client timeout.

## 8. Pagination

For list endpoints, implement pagination:

**Request:**
```
GET /api/data?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## 9. Data Validation

The backend must validate all inputs:

- Email format validation
- Password strength requirements (minimum 8 characters recommended)
- Required field validation
- Type validation
- Length limits on text fields

## 10. Deployment Platforms

The backend can be deployed on:

- **Vercel** - Recommended for serverless functions
- **Render** - Great for Node.js/Python applications
- **Railway** - Simple deployment platform
- **Heroku** - Traditional platform
- **AWS/GCP/Azure** - Enterprise options
- **Self-hosted** - Any server infrastructure

## 11. Testing the API

Use the following tools to test API compatibility:

```bash
# Test endpoint connectivity
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test CORS
curl -X OPTIONS https://api.example.com/auth/login \
  -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST"
```

## 12. Backend Configuration for Production

Update the following in your `.env` file for production:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_LOG_LEVEL=info
EXPO_PUBLIC_ANALYTICS_ENABLED=true
```

## 13. Common Issues & Solutions

### CORS Errors
**Issue**: "Access to XMLHttpRequest blocked by CORS policy"

**Solution**: Ensure backend includes proper CORS headers and matches allowed origins.

### Token Expiration
**Issue**: "Unauthorized - token expired"

**Solution**: Implement token refresh mechanism. Client will automatically refresh expired tokens.

### Rate Limiting
**Issue**: "429 Too Many Requests"

**Solution**: Implement exponential backoff on client (already done). Ensure backend rate limits are reasonable.

### Timeout Errors
**Issue**: "Request timeout after 30s"

**Solution**: Optimize backend performance, use caching, or increase timeout if necessary.

## Support

For issues or questions about backend integration, please contact the development team.
