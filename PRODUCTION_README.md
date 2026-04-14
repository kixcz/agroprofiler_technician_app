# Agro Mobile App - Production Configuration

Complete production setup guide for the Agro Mobile app with environment management, secure API communication, authentication, and app store distribution.

## 📋 Quick Start

### What's Been Configured

This production setup includes:

✅ **Environment Management**
- Dynamic configuration via `app.config.js`
- Environment-specific `.env` files
- Secure secrets management via EAS

✅ **Secure API Communication**
- Token-based authentication with refresh mechanism
- Secure token storage via `expo-secure-store`
- Automatic request retry with exponential backoff
- Timeout and error handling
- CORS and rate limiting support

✅ **Authentication System**
- Login/logout with token management
- Protected routes
- User profile management
- Automatic token refresh

✅ **Network Resilience**
- Offline detection and handling
- Offline operation queue
- Network status monitoring
- Graceful error messages

✅ **Build Infrastructure**
- EAS configuration for development, preview, and production
- App identifiers and versioning
- Signing certificate management
- Build secrets

✅ **Documentation**
- Backend requirements (`BACKEND_REQUIREMENTS.md`)
- Production checklist (`PRODUCTION_CHECKLIST.md`)
- Distribution guide (`APP_STORE_DISTRIBUTION.md`)
- Migration guide (`PRODUCTION_MIGRATION_GUIDE.md`)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Copy and configure environment files:

```bash
# Development
cp .env.example .env
# Update with your development API endpoint

# Production (never commit this)
cp .env.production.example .env.production
# Update with your production API endpoint
```

### 3. Update Backend Configuration

In `.env.production`:
```
EXPO_PUBLIC_API_BASE_URL=https://your-api.example.com
EXPO_PUBLIC_ENVIRONMENT=production
```

Your backend must implement:
- `/auth/login` endpoint
- `/auth/refresh` endpoint
- `/auth/logout` endpoint
- `/auth/profile` endpoint
- Proper CORS headers
- Token-based authentication
- Rate limiting

See `BACKEND_REQUIREMENTS.md` for complete API specification.

### 4. Test API Connectivity

```bash
# Run validation script
npx ts-node scripts/validate-api.ts

# Expected output:
# ✓ HTTPS
# ✓ API Connectivity
# ✓ CORS Headers
# ✓ Auth Endpoint
# ✓ Response Format
# ✓ Rate Limiting
# ✓ Response Time
```

### 5. Build for Production

```bash
# Android
npm run build:production -- --platform android

# iOS
npm run build:production -- --platform ios

# Both
npm run build:production -- --platform all
```

## 📁 Project Structure

```
agro_new_ver_mobile/
├── app/                          # Expo Router app
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Home screen
│   └── +html.tsx                # Web support
├── lib/                         # Utilities & infrastructure
│   ├── api/
│   │   ├── types.ts             # API response types
│   │   ├── config.ts            # API configuration
│   │   └── client.ts            # HTTP client with auth
│   ├── auth/
│   │   ├── useAuth.ts           # Authentication hook
│   │   └── ProtectedRoute.tsx    # Route protection
│   ├── logger.ts                # Centralized logging
│   ├── offline.ts               # Offline detection
│   ├── theme.ts                 # Theme configuration
│   ├── utils.ts                 # Utility functions
│   └── ErrorBoundary.tsx        # Error handling
├── components/ui/               # UI components
│   ├── button.tsx
│   ├── text.tsx
│   └── icon.tsx
├── assets/                      # Images and icons
├── scripts/
│   └── validate-api.ts          # API validation script
├── app.json                     # Static app config
├── app.config.js                # Dynamic app config
├── eas.json                     # EAS build profiles
├── .env                         # Dev environment
├── .env.example                 # Dev template
├── .env.production.example      # Production template
├── .gitignore                   # Git exclusions
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind CSS config
├── global.css                   # Global styles
├── PRODUCTION_README.md         # This file
├── PRODUCTION_MIGRATION_GUIDE.md # Step-by-step migration
├── PRODUCTION_CHECKLIST.md      # Pre-release checklist
├── APP_STORE_DISTRIBUTION.md    # Store submission guide
└── BACKEND_REQUIREMENTS.md      # API specification
```

## 🔐 Security Features

### 1. Secure Token Storage

Tokens are stored securely using `expo-secure-store`:
```typescript
// Automatically handled by apiClient.saveTokens()
// Tokens NOT stored in plain text
// Tokens cleared on logout
```

### 2. Token Refresh

Automatic token refresh on expiry:
```typescript
// If token expires (401), automatically refresh
// New token obtained without re-login
// All pending requests queued and retried
```

### 3. HTTPS Only

All API communication:
```
✓ HTTPS only (production)
✓ Certificate validation
✓ Optional certificate pinning
```

### 4. Request Interceptors

All requests automatically:
```typescript
// ✓ Include Authorization header with token
// ✓ Add Content-Type headers
// ✓ Add request timeout
// ✓ Retry on transient failures
// ✓ Normalize errors to standard format
```

### 5. Environment Variables

All secrets managed via environment variables:
```bash
# ✓ Never commit .env files with secrets
# ✓ Use .env.example as template
# ✓ Production secrets in .env.production
# ✓ EAS secrets for build-time secrets
```

## 🌐 API Integration

### Standard Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "error": null,
  "timestamp": "2024-04-04T12:00:00Z",
  "meta": {
    "version": "1.0.0",
    "requestId": "req-123"
  }
}
```

### Error Handling

Automatic error handling:
```typescript
try {
  const response = await apiClient.post('/auth/login', credentials);
  // Use response.data
} catch (error) {
  // error is normalized NetworkError
  // message: user-friendly error message
  // statusCode: HTTP status
  // isRetryable: whether to retry
}
```

### Retry Logic

Automatic exponential backoff retry:
```typescript
// Configuration in .env
EXPO_PUBLIC_API_RETRY_ATTEMPTS=3
EXPO_PUBLIC_API_RETRY_DELAY=1000

// Automatically retries on:
// ✓ Network errors (no connection)
// ✓ Timeouts (408, 504)
// ✓ Service unavailable (503)
// ✓ Rate limiting (429)
```

## 🔌 Using the API Client

### Basic Usage

```typescript
import { apiClient } from '@/lib/api/client';

// GET request
const response = await apiClient.get('/users/profile');

// POST request
const response = await apiClient.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});

// PUT request
const response = await apiClient.put('/users/profile', {
  name: 'John Doe'
});

// DELETE request
const response = await apiClient.delete('/users/123');
```

### Token Management

```typescript
// Save tokens after login
await apiClient.saveTokens(
  accessToken,
  refreshToken,
  expiresIn  // in seconds
);

// Clear tokens on logout
await apiClient.clearTokens();
```

## 🔑 Authentication

### Using useAuth Hook

```typescript
import { useAuth } from '@/lib/auth/useAuth';

export function MyScreen() {
  const { user, isAuthenticated, login, logout, register } = useAuth();

  // Check if logged in
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <View>
      <Text>Welcome, {user?.name}</Text>
      <Button onPress={() => logout()} title="Logout" />
    </View>
  );
}
```

### Login Flow

```typescript
const { success, error } = await login({
  email: 'user@example.com',
  password: 'password'
});

if (success) {
  // Redirect to home
} else {
  // Show error message
}
```

## 📡 Offline Support

### Network Status

```typescript
import { useNetworkStatus } from '@/lib/offline';

export function MyScreen() {
  const { isOnline, isWifi, type } = useNetworkStatus();

  return (
    <View>
      {!isOnline && <Text>You are offline</Text>}
      {isWifi && <Text>Connected via WiFi</Text>}
    </View>
  );
}
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

## 🔍 Logging

### Centralized Logger

```typescript
import { logger } from '@/lib/logger';

logger.debug('Debug message', { key: 'value' });   // Dev only
logger.info('Info message', { key: 'value' });     // Always
logger.warn('Warning message', { key: 'value' });  // Always
logger.error('Error message', { key: 'value' });   // Always
```

### Log Levels

Production: `warn` (only warnings and errors)
Development: `debug` (all messages)

Configure in `.env`:
```
EXPO_PUBLIC_LOG_LEVEL=info
```

## 🛡️ Error Handling

### Error Boundary

```typescript
import { ErrorBoundary } from '@/lib/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

Automatically catches and displays errors gracefully.

## 📦 Building for Production

### Build Profiles

Three profiles in `eas.json`:

**Development** (testing):
```bash
npm run build:preview -- --platform android
```

**Preview** (staging):
- Tests on real devices
- Uses preview API endpoint

**Production** (release):
- App Store release
- Uses production API endpoint
- Signed with production certificates

### Environment-Specific Configuration

```bash
# Automatically loads from .env.production
EXPO_PUBLIC_ENVIRONMENT=production

# Sets API to production
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com

# Enables analytics
EXPO_PUBLIC_ANALYTICS_ENABLED=true
```

## 📱 App Store Submission

### Pre-Submission Checklist

See `PRODUCTION_CHECKLIST.md` for complete checklist:
- [ ] Security & credentials
- [ ] Authentication & authorization
- [ ] API integration
- [ ] Network resilience
- [ ] Code quality
- [ ] Performance
- [ ] UI/UX
- [ ] App configuration
- [ ] Environment setup
- [ ] EAS configuration

### Submission Steps

1. **Google Play**:
   - See `APP_STORE_DISTRIBUTION.md` > "Google Play Store Distribution"
   - Typical review: 1-2 hours

2. **Apple App Store**:
   - See `APP_STORE_DISTRIBUTION.md` > "Apple App Store Distribution"
   - Typical review: 24-48 hours

### Staged Rollout

Recommended strategy:
- 5% for 24 hours
- 10% for 48 hours
- 50% for 3 days
- 100% if stable

## 🚨 Monitoring & Support

### Post-Launch Monitoring

1. **Crash Reports**: Sentry / Firebase Crashlytics
2. **Analytics**: Firebase Analytics
3. **User Feedback**: Store reviews and ratings
4. **Performance**: Monitor response times and errors

### Common Issues

| Issue | Solution |
|-------|----------|
| API 401 (Unauthorized) | Token expired, auto-refresh will handle |
| API 429 (Rate Limited) | Exponential backoff retry activated |
| No CORS headers | Check backend CORS configuration |
| Token not persisting | Verify `expo-secure-store` available |
| Offline errors | Use offline queue for queueing operations |

## 📚 Documentation

- `PRODUCTION_MIGRATION_GUIDE.md` - Phase-by-phase migration
- `PRODUCTION_CHECKLIST.md` - Pre-release validation
- `BACKEND_REQUIREMENTS.md` - API specification
- `APP_STORE_DISTRIBUTION.md` - Store submission guide

## 🔗 Resources

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/eas/
- **React Native**: https://reactnative.dev
- **Sentry**: https://docs.sentry.io/
- **Firebase**: https://firebase.google.com/docs

## ❓ FAQ

**Q: How do I update the API endpoint?**
A: Update `EXPO_PUBLIC_API_BASE_URL` in `.env.production`

**Q: How do I handle token expiration?**
A: Automatic - the client refreshes tokens transparently

**Q: How do I test offline functionality?**
A: Use `useNetworkStatus()` hook or DevTools network throttling

**Q: How do I add error tracking with Sentry?**
A: Add `EXPO_PUBLIC_SENTRY_DSN` to `.env.production`

**Q: Can I customize the API client?**
A: Yes, extend `lib/api/client.ts` for custom behavior

## 🤝 Support

For issues or questions:
1. Check the relevant documentation file
2. Review backend requirements for API issues
3. Check production checklist for deployment issues
4. Review error messages and logs

---

**Version**: 1.0.0
**Last Updated**: 2024-04-04
**Status**: Production Ready ✅
