# Agro Mobile App - Production Ready

A production-grade React Native mobile application built with Expo, featuring secure API communication, token-based authentication, offline support, and app store distribution infrastructure.

## 🎯 Production Features

✅ **Secure API Communication**
- Token-based authentication with automatic refresh
- Secure token storage via `expo-secure-store`
- Request retry with exponential backoff
- Timeout and error handling
- CORS and rate limiting support

✅ **Authentication System**
- Login/logout with token management
- Protected routes
- User profile management
- Automatic token refresh on expiry

✅ **Environment Management**
- Dynamic configuration via `app.config.js`
- Environment-specific `.env` files
- Secure secrets management via EAS

✅ **Network Resilience**
- Offline detection and handling
- Offline operation queue
- Network status monitoring
- Graceful error messages

✅ **Build Infrastructure**
- EAS configuration for dev/preview/production
- App identifiers and versioning
- Signing certificate management
- Build secrets

✅ **Monitoring & Logging**
- Centralized logging with environment-aware levels
- Error boundary for crash handling
- Sentry integration ready
- Analytics tracking

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Development
cp .env.example .env
# Update with your development API endpoint

# Production (never commit this)
cp .env.production.example .env.production
# Update with your production API endpoint
```

### 3. Set Your API Endpoint

In `.env.production`:
```
EXPO_PUBLIC_API_BASE_URL=https://your-api.example.com
```

Your backend must implement the authentication API. See `BACKEND_REQUIREMENTS.md` for full specification.

### 4. Start Development Server

```bash
npm run dev
# or for Android: npm run android
# or for iOS: npm run ios
# or for Web: npm run web
```

## 📚 Documentation

### For Production Setup
- **[PRODUCTION_README.md](./PRODUCTION_README.md)** - Complete overview and quick reference
- **[PRODUCTION_MIGRATION_GUIDE.md](./PRODUCTION_MIGRATION_GUIDE.md)** - Step-by-step migration process
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Pre-release validation checklist

### For API Integration
- **[BACKEND_REQUIREMENTS.md](./BACKEND_REQUIREMENTS.md)** - Backend API specification and requirements

### For App Store
- **[APP_STORE_DISTRIBUTION.md](./APP_STORE_DISTRIBUTION.md)** - Google Play and App Store submission guide

## 🏗️ Project Structure

```
agro_new_ver_mobile/
├── app/                      # Expo Router app
├── lib/                      # Core infrastructure
│   ├── api/                  # API client & types
│   ├── auth/                 # Authentication system
│   ├── logger.ts             # Centralized logging
│   ├── offline.ts            # Offline handling
│   └── ErrorBoundary.tsx     # Error handling
├── components/ui/            # Reusable UI components
├── assets/                   # Images & icons
├── scripts/                  # Utility scripts
├── app.json                  # Static config
├── app.config.js             # Dynamic config
├── eas.json                  # EAS build profiles
└── .env                      # Environment variables
```

## 🔐 Security

### Secure by Default
- ✅ Tokens stored securely (not in plain text)
- ✅ Automatic token refresh on expiry
- ✅ HTTPS only for API communication
- ✅ Environment variables for all secrets
- ✅ Request interceptors for auth headers
- ✅ Error boundary for crash protection

### Token Management
- Access token: Short-lived (1-24 hours)
- Refresh token: Long-lived (7-30 days)
- Tokens cleared automatically on logout
- Secure storage via `expo-secure-store`

## 🔌 API Client Usage

### Basic Requests

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

### Authentication Hook

```typescript
import { useAuth } from '@/lib/auth/useAuth';

const { user, isAuthenticated, login, logout, register } = useAuth();
```

### Offline Support

```typescript
import { useNetworkStatus, offlineQueue } from '@/lib/offline';

const { isOnline } = useNetworkStatus();

// Queue operations when offline
await offlineQueue.enqueue(async () => {
  await apiClient.post('/data', payload);
});
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run android      # Start with Android emulator
npm run ios          # Start with iOS simulator
npm run web          # Start web version

# Production
npm run build:preview      # Build for preview testing
npm run build:production   # Build for app stores
npm run submit:ios         # Submit to App Store
npm run submit:android     # Submit to Play Store

# Utilities
npm run clean        # Clean cache and node_modules
```

### TypeScript Checking

```bash
# Check for TypeScript errors
npx tsc --noEmit
```

### API Validation

```bash
# Validate backend API connectivity
npx ts-node scripts/validate-api.ts
```

## 📦 Build & Deployment

### Build for Production

```bash
# Android
npm run build:production -- --platform android

# iOS
npm run build:production -- --platform ios

# Both
npm run build:production -- --platform all
```

### Environment-Specific Configuration

Automatically configured based on `EXPO_PUBLIC_ENVIRONMENT`:
- **development**: Debug logs, localhost API
- **preview**: Info logs, preview API endpoint
- **production**: Warnings only, production API endpoint

## 🚀 Deployment Checklist

Before deploying, verify:

- [ ] API endpoint configured correctly
- [ ] Backend implements all required endpoints
- [ ] CORS headers properly configured
- [ ] Authentication flow tested
- [ ] Offline functionality verified
- [ ] TypeScript compiles without errors
- [ ] No console logs in production code
- [ ] All tests passing
- [ ] App icons and screenshots prepared
- [ ] Version numbers bumped
- [ ] Release notes prepared

See `PRODUCTION_CHECKLIST.md` for complete checklist.

## 🔗 Technologies

- **React Native** 0.83.4 - Mobile framework
- **Expo** 55 - React Native platform
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **Tailwind CSS / Nativewind** - Styling
- **Axios** - HTTP client
- **expo-secure-store** - Secure token storage
- **React Navigation** - Navigation system

## 📚 Additional Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [EAS Documentation](https://docs.expo.dev/eas/)
- [Nativewind Docs](https://www.nativewind.dev/)
- [Axios Documentation](https://axios-http.com/)

## 🎓 Project Features

- ⚛️ Built with [Expo Router](https://expo.dev/router)
- 🎨 Styled with [Tailwind CSS](https://tailwindcss.com/) via [Nativewind](https://www.nativewind.dev/)
- 📦 UI powered by [React Native Reusables](https://github.com/founded-labs/react-native-reusables)
- 🚀 New Architecture enabled
- 🔥 Edge to Edge enabled
- 📱 Runs on iOS, Android, and Web
- 🔐 Production-ready security
- 📡 Offline-first architecture

## ❓ FAQ

**Q: How do I change the API endpoint?**
A: Update `EXPO_PUBLIC_API_BASE_URL` in `.env` or `.env.production`

**Q: How do I handle token expiration?**
A: Automatic - the client refreshes tokens transparently

**Q: How do I test offline?**
A: Use DevTools network throttling or simulate with `useNetworkStatus()`

**Q: Where are tokens stored?**
A: Securely in device storage via `expo-secure-store`, not in plain text

**Q: Can I customize the API client?**
A: Yes, extend `lib/api/client.ts` for custom behavior

## 🤝 Support

For help:
1. Check the relevant documentation file
2. Review `BACKEND_REQUIREMENTS.md` for API issues
3. Check `PRODUCTION_CHECKLIST.md` for deployment help
4. Review error messages and logs

---

**Status**: Production Ready ✅
**Version**: 1.0.0
**Last Updated**: 2024-04-04
