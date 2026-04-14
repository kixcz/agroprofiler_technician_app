# Quick Reference Guide

Fast lookup guide for common production tasks.

## 📋 Getting Started

### Set Up Environment
```bash
# Development
cp .env.example .env

# Production
cp .env.production.example .env.production
# Edit with your API endpoint
```

### Install & Run
```bash
npm install
npm run dev          # Start development
npm run android      # Android emulator
npm run ios          # iOS simulator
npm run web          # Web browser
```

## 🔗 API Usage

### HTTP Client
```typescript
import { apiClient } from '@/lib/api/client';

// GET
const { data } = await apiClient.get('/users/profile');

// POST
const { data } = await apiClient.post('/auth/login', credentials);

// PUT
const { data } = await apiClient.put('/users/profile', updates);

// DELETE
const { data } = await apiClient.delete('/users/123');
```

### Error Handling
```typescript
try {
  const response = await apiClient.post('/auth/login', credentials);
  // response.data contains API response
} catch (error) {
  // error is NetworkError with:
  // - message: user-friendly message
  // - statusCode: HTTP status
  // - isRetryable: whether to retry
}
```

## 🔑 Authentication

### Login Hook
```typescript
import { useAuth } from '@/lib/auth/useAuth';

const { user, isAuthenticated, login, logout, register, error } = useAuth();

// Login
const { success } = await login({
  email: 'user@example.com',
  password: 'password'
});

// Logout
await logout();

// Register
const { success } = await register(email, password, name);
```

### Protected Routes
```typescript
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';

export function MyScreen() {
  return (
    <ProtectedRoute>
      <YourContent />
    </ProtectedRoute>
  );
}
```

## 📡 Network Status

### Check Connection
```typescript
import { useNetworkStatus, checkNetworkConnectivity } from '@/lib/offline';

// Hook
const { isOnline, isWifi, type } = useNetworkStatus();

// Function
const online = await checkNetworkConnectivity();
```

### Offline Queue
```typescript
import { offlineQueue } from '@/lib/offline';

// Queue operation when offline
await offlineQueue.enqueue(async () => {
  await apiClient.post('/data', payload);
});

// Automatically processes when online
```

## 🛠️ Logging

### Log Levels
```typescript
import { logger } from '@/lib/logger';

logger.debug('Debug message');      // Dev only
logger.info('Info message');        // Always
logger.warn('Warning message');     // Always
logger.error('Error message');      // Always
```

### Configure Log Level
In `.env`:
```
EXPO_PUBLIC_LOG_LEVEL=info
```

## 🏗️ Building

### Build Scripts
```bash
# Development
npm run build:preview -- --platform android
npm run build:preview -- --platform ios

# Production
npm run build:production -- --platform android
npm run build:production -- --platform ios
```

### Submit to Stores
```bash
npm run submit:ios
npm run submit:android
```

## 📦 Environment Variables

### Development (.env)
```
EXPO_PUBLIC_API_BASE_URL=https://localhost:3000/api
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_LOG_LEVEL=debug
```

### Production (.env.production)
```
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_LOG_LEVEL=warn
EXPO_PUBLIC_ANALYTICS_ENABLED=true
```

## 🔐 Token Management

### Automatic (Built-in)
- Tokens stored securely
- Auto-refresh on expiry
- Auto-inject in headers
- Auto-clear on logout

### Manual (If Needed)
```typescript
// Save tokens
await apiClient.saveTokens(accessToken, refreshToken, expiresIn);

// Clear tokens
await apiClient.clearTokens();
```

## ✅ Pre-Release Checklist

Quick items to verify:

- [ ] Environment configured (`EXPO_PUBLIC_API_BASE_URL`)
- [ ] Backend API endpoints working
- [ ] Authentication flow tested
- [ ] Offline functionality verified
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] API validates (`npx ts-node scripts/validate-api.ts`)
- [ ] App icons updated
- [ ] Screenshots prepared
- [ ] Version bumped
- [ ] Release notes written

See `PRODUCTION_CHECKLIST.md` for complete checklist.

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| API 401 Unauthorized | Token expired, will auto-refresh |
| API 429 Rate Limited | Exponential backoff active |
| No CORS headers | Check backend CORS config |
| Offline not working | Use `useNetworkStatus()` hook |
| Token not persisting | Verify `expo-secure-store` available |

## 📚 Documentation

- **README.md** - Overview and getting started
- **PRODUCTION_README.md** - Complete production guide
- **PRODUCTION_MIGRATION_GUIDE.md** - Step-by-step migration
- **PRODUCTION_CHECKLIST.md** - Pre-release validation
- **BACKEND_REQUIREMENTS.md** - API specification
- **APP_STORE_DISTRIBUTION.md** - Store submission
- **IMPLEMENTATION_SUMMARY.md** - Implementation details

## 🚀 Deployment Steps

### 1. Setup
```bash
cp .env.production.example .env.production
# Edit .env.production with your API endpoint
```

### 2. Validate
```bash
npx ts-node scripts/validate-api.ts
```

### 3. Build
```bash
npm run build:production -- --platform all
```

### 4. Submit
```bash
npm run submit:ios
npm run submit:android
```

### 5. Monitor
- Check crash reports
- Monitor user feedback
- Track API usage
- Implement staged rollout

## 📞 Support

For detailed help, see:
- Production issues → `PRODUCTION_MIGRATION_GUIDE.md`
- API issues → `BACKEND_REQUIREMENTS.md`
- Store issues → `APP_STORE_DISTRIBUTION.md`
- Pre-release → `PRODUCTION_CHECKLIST.md`

## 🔗 Useful Commands

```bash
# Start dev server
npm run dev

# Type check
npx tsc --noEmit

# Validate API
npx ts-node scripts/validate-api.ts

# Build preview
npm run build:preview -- --platform all

# Build production
npm run build:production -- --platform all

# Clean cache
npm run clean

# Install deps
npm install
```

## 📊 API Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { /* endpoint data */ },
  "error": null,
  "timestamp": "2024-04-04T12:00:00Z",
  "meta": {
    "version": "1.0.0",
    "requestId": "req-123"
  }
}
```

## 🌐 Required Backend Endpoints

- `POST /auth/login` - Authenticate user
- `POST /auth/register` - Create account
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `GET /auth/profile` - Get user info
- `PUT /auth/profile` - Update profile

See `BACKEND_REQUIREMENTS.md` for full API spec.

---

**Last Updated**: 2024-04-04
