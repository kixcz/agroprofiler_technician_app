# App Store Distribution Guide

Complete guide for distributing the Agro Mobile app on Google Play Store and Apple App Store.

## Prerequisites

- EAS Account: https://expo.dev
- Google Play Console Access: https://play.google.com/console
- Apple Developer Account: https://developer.apple.com
- Signing certificates generated and stored securely

## 1. Google Play Store Distribution (Android)

### 1.1 Create Google Play Developer Account

1. Go to https://play.google.com/console
2. Sign in with your Google account
3. Accept Developer Agreement & Policies
4. Pay one-time registration fee ($25 USD)

### 1.2 Create Application in Play Console

1. Click "Create app"
2. Fill in app details:
   - **Default language**: English
   - **App name**: Agro Mobile
   - **App type**: Application
   - **Category**: Agriculture
3. Accept policies
4. Create app

### 1.3 Set Up App Details

Navigate to **Setup > App Details** and fill in:

- **App name**: Agro Mobile
- **Short description**: Your app in 80 characters
- **Full description**: Detailed app description
- **Screenshots**: 2-8 screenshots (1080x1920 pixels, WebP or PNG)
- **Feature graphic**: 1024x500 pixels (required for Play Store)
- **Icon**: 512x512 pixels PNG
- **Videos**: Optional promotional video URL
- **Privacy policy**: Link to privacy policy (required)

### 1.4 Content Rating

1. Go to **Setup > Content Rating**
2. Complete questionnaire
3. Submit for rating
4. Receive content rating certificate

### 1.5 Target Audience

Go to **Setup > Target Audience** and specify:
- Target age group
- Intended countries
- Restrictions

### 1.6 Content Guidelines

Go to **Setup > Content Guidelines** and confirm compliance:
- [ ] App doesn't contain sensitive content
- [ ] No hate speech or discrimination
- [ ] No sexual content
- [ ] No violence or gore
- [ ] Compliant with local laws

### 1.7 Generate Signed APK/AAB

```bash
# Use EAS to build production APK/AAB
npm run build:production -- --platform android

# Or manually with EAS CLI
eas build --platform android --profile production
```

The output will be an Android App Bundle (.aab) file.

### 1.8 Upload Build to Play Console

1. Go to **Release > Production**
2. Click "Create new release"
3. Click "Upload" under "Android App Bundle"
4. Select the .aab file from EAS build
5. Review and publish

### 1.9 Staged Rollout Strategy

Recommended staged rollout:
- **Phase 1**: 0% (upload only, not live)
- **Phase 2**: 5% (1 day)
- **Phase 3**: 10% (2 days)
- **Phase 4**: 50% (3 days)
- **Phase 5**: 100% (if no issues)

Steps:
1. Upload build to Play Console
2. Click "Staged rollout"
3. Set percentage and duration
4. Monitor crash reports
5. Increase percentage if stable

### 1.10 Review & Publication

1. Check all store listing details
2. Review content rating
3. Verify build (version code, permissions)
4. Submit for review (48 hours typical)
5. Publish when approved

## 2. Apple App Store Distribution (iOS)

### 2.1 Create Apple Developer Account

1. Go to https://developer.apple.com
2. Enroll in Apple Developer Program
3. Pay annual fee ($99 USD)
4. Wait for approval (24-48 hours)

### 2.2 Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps"
3. Click "+"
4. Select "New App"
5. Fill in details:
   - **Platforms**: iOS
   - **Name**: Agro Mobile
   - **Primary Language**: English
   - **Bundle ID**: com.agromobile.app (must match Xcode)
   - **SKU**: Unique identifier (e.g., AGROMOBILE2024)

### 2.3 Set Up App Information

Navigate to **App > App Information** and fill in:

- **Privacy Policy URL**: https://yourdomain.com/privacy
- **Category**: Agriculture
- **Subcategory**: Farming
- **Content Rights**: Select appropriate option
- **Advertising Identifier**: If you use advertising

### 2.4 Create Screenshots

1. Go to **App > Screenshots**
2. Upload for each device type:
   - iPhone 6.7" (iPhone 14 Pro Max)
   - iPhone 6.1" (iPhone 14)
   - iPhone 5.5" (iPhone 8 Plus)
   - iPad Pro 12.9"

Screenshots (PNG or JPEG):
- Minimum 2, maximum 10 per device
- No transparency required
- Include text overlays explaining features

### 2.5 Create Preview Video (Optional)

- 15-30 seconds long
- Format: MP4 or MOV
- Landscape orientation

### 2.6 Set Up Pricing

1. Go to **Pricing and Availability**
2. Select pricing tier ($0.99 to $999.99)
3. Select territories where app will be available
4. Confirm tax and banking information

### 2.7 Generate Signed Build (IPA)

```bash
# Use EAS to build production IPA
npm run build:production -- --platform ios

# Or manually with EAS CLI
eas build --platform ios --profile production
```

The output will be an iOS App file (.ipa).

### 2.8 Upload Build to App Store Connect

#### Using Xcode:
1. Download build from EAS
2. Open Xcode
3. Go to Window > Organizer
4. Select your app
5. Right-click build > Validate App
6. If valid, click "Distribute App"

#### Using Apple Transporter:
1. Download from App Store Connect
2. Login with Apple ID
3. Select .ipa file
4. Upload

#### Using EAS CLI:
```bash
npm run submit:ios
```

### 2.9 Complete App Review Information

1. Go to **App > App Review Information**
2. Fill in:
   - **Contact Information**: Email, phone, URL
   - **Sign in Required**: Yes/No
   - **Demo Account**: Email/password for testing
   - **Notes for Reviewers**: Any special instructions

### 2.10 Manage Build for Submission

1. Go to **App > Builds**
2. Select your build
3. Click "Add for Review"
4. Select version (1.0 if first release)
5. Select build configuration

### 2.11 Submit for Review

1. Go to **App > Version Information**
2. Verify all details
3. Confirm compliance with App Store Review Guidelines
4. Click "Submit for Review"

### 2.12 App Store Review Guidelines

Apple reviews against these guidelines:
- [ ] App functions as described
- [ ] No crashes or errors
- [ ] Matches app icon and description
- [ ] No private APIs used
- [ ] Complies with terms of service
- [ ] No inappropriate content
- [ ] Metadata is accurate

## 3. Build & Release Workflow

### 3.1 Versioning Strategy

Use Semantic Versioning (MAJOR.MINOR.PATCH):

```
1.0.0  - Initial release
1.0.1  - Bugfix release
1.1.0  - New features
2.0.0  - Major changes/breaking changes
```

Update in:
- `app.json` or `.env` files
- `package.json`
- `eas.json`
- App Store Connect
- Google Play Console

### 3.2 Build Checklist Before Release

- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] No console.log or debug code
- [ ] API endpoints tested with production backend
- [ ] Authentication flow working
- [ ] Offline functionality tested
- [ ] App icons updated
- [ ] Splash screen up to date
- [ ] Screenshots captured and optimized
- [ ] Privacy policy and terms linked
- [ ] Version number bumped
- [ ] Release notes prepared

### 3.3 Pre-Release Testing

1. **Functional Testing**:
   - Login/Logout
   - Core features
   - Error scenarios
   - Navigation

2. **Performance Testing**:
   - Load time < 3 seconds
   - Memory usage normal
   - No crashes during extended use

3. **Network Testing**:
   - Offline scenarios
   - Low bandwidth (2G/3G)
   - Network switching

4. **Device Testing**:
   - Multiple screen sizes
   - Different OS versions
   - Different devices

### 3.4 Internal Testing Tracks

#### Google Play (Testers):
1. Internal testing
2. Closed testing (alpha)
3. Open testing (beta)
4. Production

#### Apple (TestFlight):
1. Internal testing
2. External testing (up to 100 testers)
3. Production

### 3.5 Beta Testing

1. Invite 10-50 beta testers
2. Gather feedback for 1-2 weeks
3. Fix critical issues
4. Proceed to production

## 4. Release Notes

Create release notes describing changes:

```
Version 1.0.0 - Initial Release

What's New:
- Mobile app for managing agricultural operations
- Real-time data synchronization
- Offline mode support
- Secure authentication with token refresh
- Dark mode support

Bug Fixes:
- N/A (initial release)

Known Issues:
- None at this time

Requirements:
- iOS 13+ or Android 8+
- Minimum 100MB free storage
```

## 5. Post-Launch Monitoring

### 5.1 Monitor Metrics

- **Crash Rate**: Target < 0.1%
- **ANR Rate**: Target < 0.05% (Android)
- **Ratings**: Target > 4.0 stars
- **Active Users**: Track daily/monthly active users
- **Retention**: Track 1-day, 7-day, 30-day retention

### 5.2 Monitoring Tools

- **Google Play Console**: https://play.google.com/console
- **App Store Connect**: https://appstoreconnect.apple.com
- **Firebase**: https://console.firebase.google.com
- **Sentry**: https://sentry.io (error tracking)
- **Amplitude**: https://amplitude.com (analytics)

### 5.3 User Feedback Channels

- In-app feedback form
- Email support: support@yourdomain.com
- Social media monitoring
- Review responses
- Discord/Slack community (if applicable)

### 5.4 Hotfix Strategy

If critical bug found:
1. Merge fix to main branch
2. Bump patch version
3. Run automated tests
4. Build production APK/IPA
5. Submit for review (expedited)
6. Monitor deployment

## 6. Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build:production
```

### Build Rejected

Check for:
- Invalid API keys or certificates
- Code signing issues
- Incompatible dependencies
- Resource conflicts

### App Crashes After Upload

- Check logcat/console output
- Verify API endpoint connectivity
- Check token refresh mechanism
- Test with actual backend

### App Rejected by Store Review

Common reasons:
- Misleading description
- Inappropriate content
- Broken functionality
- Privacy policy issues
- Using private APIs

## 7. App Store Optimization (ASO)

To improve discoverability:

1. **Keywords**: Use relevant keywords in app name and description
2. **Description**: Clear, concise, benefit-focused
3. **Screenshots**: Show key features, professional design
4. **Ratings**: Encourage happy users to rate
5. **Reviews**: Respond to user feedback
6. **Updates**: Regular updates show active maintenance

## Support & Resources

- Expo Documentation: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- Google Play Console Help: https://support.google.com/googleplay/android-developer
- App Store Connect Help: https://help.apple.com/app-store-connect
- Apple Review Guidelines: https://developer.apple.com/app-store/review/guidelines/

---

Last Updated: 2024-04-04
