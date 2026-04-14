# Production Migration Guide

Step-by-step guide to migrate the Agro Mobile app from development to production.

## Overview

This guide covers:
1. Environment configuration setup
2. API integration and testing
3. Security hardening
4. Build configuration
5. Testing and validation
6. Deployment to app stores

## Phase 1: Environment & Configuration

### Step 1.1: Set Up Environment Files

Already completed:
- ✅ `.env.example` - Template for all environment variables
- ✅ `.env` - Development environment
- ✅ `.env.production.example` - Production template
- ✅ `.gitignore` - Configured to exclude secret files

### Step 1.2: Create Production Environment

```bash
# Copy production template
cp .env.production.example .env.production

# Edit with your production values
# Important: NEVER commit .env.production to git
```

**Required Production Values:**
```
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/...
```

### Step 1.3: Update app.config.js

The app.config.js is already configured to load from environment variables:

```javascript
// Automatically loads from .env files and app.json
export default {
  expo: {
    // ... uses environment variables from .env files
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      // ... other config
    }
  }
};
```

No changes needed - it's already production-ready!

## Phase 2: API Integration

### Step 2.1: Set Up Backend API

Ensure your backend API:
- ✅ Deployed to HTTPS endpoint (Vercel, Render, Railway, etc.)
- ✅ Implements all required endpoints (see BACKEND_REQUIREMENTS.md)
- ✅ Configured CORS headers
- ✅ Implements rate limiting
- ✅ Uses JWT tokens with refresh mechanism
- ✅ Validates all inputs

### Step 2.2: Update API Base URL

In `.env.production`:
```
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### Step 2.3: Test API Connectivity

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

### Step 2.4: Test Authentication Flow

Test in development first:
```bash
npm run dev

# In app:
# 1. Try to login with test credentials
# 2. Verify token is stored securely
# 3. Test logout
# 4. Verify token refresh on expiry
```

## Phase 3: Security Hardening

### Step 3.1: Review No Hardcoded Secrets

Already handled:
- ✅ All secrets in environment variables
- ✅ Tokens stored in `expo-secure-store`
- ✅ No API keys in source code
- ✅ `.gitignore` excludes `.env` files

### Step 3.2: Remove Debug Code

The app already has centralized logging with:
- ✅ Environment-aware log levels
- ✅ Debug logs only in development
- ✅ Error tracking ready for Sentry

To enable Sentry in production:
```bash
# 1. Sign up at https://sentry.io
# 2. Create project for React Native
# 3. Add DSN to .env.production
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/123
```

### Step 3.3: Enable HTTPS Certificate Pinning (Optional)

For extra security, implement certificate pinning:

```typescript
// lib/api/client.ts - Already prepared for this
// Uncomment and implement if needed:

const axiosInstance = axios.create({
  // ... existing config
  httpAgent: new HttpAgent({ /* pinning config */ }),
  httpsAgent: new HttpsAgent({ /* pinning config */ }),
});
```

### Step 3.4: CORS & Backend Validation

Ensure backend has:
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Phase 4: Build Configuration

### Step 4.1: Update App Identifiers

Already configured in `app.json`:
- ✅ iOS Bundle ID: `com.agromobile.app`
- ✅ Android Package: `com.agromobile.app`

Update if using different identifiers:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourdomain.app"
    },
    "android": {
      "package": "com.yourdomain.app"
    }
  }
}
```

### Step 4.2: Configure EAS for Production

Already created: `eas.json` with three profiles:
- `development` - Internal testing
- `preview` - Staged rollout testing
- `production` - App Store release

### Step 4.3: Set Up EAS Secrets

For production builds, use EAS Secrets instead of `.env` files:

```bash
# Install EAS CLI if not already
npm install -g eas-cli

# Login to EAS
eas login

# Create secrets for production
eas secret:create --scope project --name KEYSTORE_PASSWORD
eas secret:create --scope project --name KEYSTORE_ALIAS_PASSWORD
```

## Phase 5: Testing & Validation

### Step 5.1: Development Build Testing

```bash
# Build development APK/IPA
npm run build:preview -- --platform all

# This creates builds for testing without store submission
```

### Step 5.2: Test All Critical Flows

Test in development build:

**Authentication:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout clears session
- [ ] Token refresh on expiry
- [ ] App works offline

**API Integration:**
- [ ] Network requests timeout properly
- [ ] Retry logic works (disconnect/reconnect)
- [ ] Errors display user-friendly messages
- [ ] Offline queue processes when online
- [ ] Rate limiting handled

**UI/UX:**
- [ ] All screens responsive
- [ ] Dark/light mode working
- [ ] Navigation smooth
- [ ] No memory leaks
- [ ] Fast app startup

### Step 5.3: Performance Testing

Target metrics:
- **App startup**: < 3 seconds
- **Network timeout**: 30 seconds
- **Memory usage**: < 100MB
- **Crash rate**: < 0.1%

Use Chrome DevTools or React Native Debugger.

### Step 5.4: Network Testing

Test with different conditions:
```bash
# Fast 3G
# Slow 3G
# Offline
# Network switching
```

Use browser DevTools network throttling or app to test.

## Phase 6: Production Build

### Step 6.1: Build Production APK/AAB

```bash
# For Android
npm run build:production -- --platform android

# This creates an Android App Bundle (.aab) for Google Play
```

### Step 6.2: Build Production IPA

```bash
# For iOS
npm run build:production -- --platform ios

# This creates an iOS App (.ipa) for Apple App Store
```

### Step 6.3: Verify Build Integrity

1. Check build doesn't contain:
   - Console logs
   - Test data
   - Development URLs
   - Debug code

2. Verify:
   - Signing certificates valid
   - API endpoints correct
   - Version numbers updated
   - Feature flags set properly

## Phase 7: App Store Submission

### Step 7.1: Create Store Listings

**Google Play Console:**
1. Create app
2. Fill in store listing
3. Add screenshots
4. Set content rating
5. Upload APK/AAB

**Apple App Store Connect:**
1. Create app
2. Fill in app information
3. Create screenshots
4. Set pricing
5. Upload IPA

See `APP_STORE_DISTRIBUTION.md` for detailed instructions.

### Step 7.2: Submit for Review

**Google Play:**
- Typical review time: 1-2 hours
- May require clarification before approval

**Apple App Store:**
- Typical review time: 24-48 hours
- More strict review process

### Step 7.3: Staged Rollout

**Google Play** (recommended):
- Start with 5% of users
- Monitor crash reports for 24 hours
- Gradually increase to 100%
- Keep previous version available for quick rollback

**Apple** (automatic):
- Released to all users at once
- Can revoke old version if critical issue

## Phase 8: Post-Launch Monitoring

### Step 8.1: Set Up Monitoring

1. **Error Tracking**: Sentry
2. **Analytics**: Firebase Analytics
3. **Performance**: Crashlytics
4. **User Feedback**: Review ratings/comments

### Step 8.2: Monitor Key Metrics

- Crash rate: Track daily
- User retention: 1-day, 7-day, 30-day
- Average rating: Target 4.0+ stars
- Active users: Daily/Monthly
- Session duration: Average session length

### Step 8.3: Respond to User Feedback

- Reply to store reviews
- Fix critical bugs immediately
- Plan updates for minor issues
- Communicate with users

## Phase 9: Hotfix Process

If critical bug found:

1. **Assess Severity**:
   - Critical (app crashes): Fix immediately
   - Major (core feature broken): Fix ASAP
   - Minor (cosmetic issue): Include in next release

2. **Fix Process**:
   ```bash
   # Create hotfix branch
   git checkout -b hotfix/critical-fix
   
   # Fix the issue
   # Test thoroughly
   
   # Bump patch version
   # Commit and merge
   
   # Build and submit
   npm run build:production -- --platform all
   ```

3. **Submit & Monitor**:
   - Submit with expedited review request
   - Monitor approval status
   - Deploy once approved
   - Monitor metrics after deployment

## Phase 10: Future Updates

### Version Bump Strategy

```
1.0.0 - Initial release
1.0.1 - Critical bugfix
1.1.0 - New features (minor version)
2.0.0 - Major breaking changes
```

### Update Process

1. Bump version in:
   - `app.json`
   - `.env`
   - `package.json`
   - `eas.json` (build number)

2. Update release notes

3. Build & test

4. Submit to app stores

5. Monitor metrics

## Rollback Plan

If serious issue after release:

1. **Immediate Actions**:
   - Identify issue severity
   - Assess user impact
   - Prepare rollback

2. **Rollback Process**:
   ```bash
   # Revoke problematic version in app store
   # Release previous stable version
   # Notify users
   ```

3. **Post-Incident**:
   - Root cause analysis
   - Fix and test thoroughly
   - Implement additional safeguards
   - Release corrected version

## Checklist Summary

### Before First Release
- [ ] Environment files configured
- [ ] API endpoints tested
- [ ] Security audit passed
- [ ] All tests passing
- [ ] TypeScript compiles
- [ ] No console logs
- [ ] Authentication working
- [ ] Offline handling tested
- [ ] Screenshots ready
- [ ] Release notes prepared

### Before Each Update
- [ ] Version number bumped
- [ ] Changelog updated
- [ ] All tests passing
- [ ] Performance verified
- [ ] User feedback addressed
- [ ] Screenshots updated if needed
- [ ] Build succeeds
- [ ] Store listing updated

## Support & Resources

- Expo Documentation: https://docs.expo.dev
- EAS Documentation: https://docs.expo.dev/eas/
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com
- Sentry Documentation: https://docs.sentry.io/
- Firebase Crashlytics: https://firebase.google.com/docs/crashlytics

---

**Last Updated**: 2024-04-04

For questions or issues, refer to the relevant documentation files:
- `BACKEND_REQUIREMENTS.md` - Backend API requirements
- `APP_STORE_DISTRIBUTION.md` - Store submission details
- `PRODUCTION_CHECKLIST.md` - Pre-release checklist
