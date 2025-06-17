# MentalCare Mobile App Deployment Guide

## Overview
Your MentalCare app has been configured for native mobile deployment using Capacitor. This allows you to deploy to both Android and iOS app stores while maintaining your existing React web codebase.

## Prerequisites

### For Android Development:
- **Android Studio** (latest version)
- **Java Development Kit (JDK)** 11 or higher
- **Android SDK** with API level 21+ (Android 5.0)

### For iOS Development (macOS only):
- **Xcode** 12.0 or higher
- **macOS** 10.15.4 or higher
- **iOS Deployment Target** 13.0 or higher
- **Apple Developer Account** ($99/year for App Store distribution)

## Build Commands

### 1. Build for Mobile
```bash
# Build the web assets for mobile
vite build --outDir dist
cp dist/public/index.html dist/
cp -r dist/public/assets dist/

# Sync with native platforms
npx cap sync
```

### 2. Android Development

#### Open in Android Studio:
```bash
npx cap open android
```

#### Run on Android Device/Emulator:
```bash
npx cap run android
```

#### Build APK for Testing:
1. Open Android Studio
2. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. APK will be generated in `android/app/build/outputs/apk/`

#### Build AAB for Play Store:
1. Open Android Studio
2. Go to **Build** → **Generate Signed Bundle / APK**
3. Choose **Android App Bundle**
4. Create or use existing keystore
5. Upload AAB to Google Play Console

### 3. iOS Development

#### Open in Xcode:
```bash
npx cap open ios
```

#### Run on iOS Device/Simulator:
```bash
npx cap run ios
```

#### Build for App Store:
1. Open Xcode
2. Select **Product** → **Archive**
3. Upload to App Store Connect
4. Submit for review

## App Store Preparation

### Android (Google Play Store)
1. **Create Developer Account**: $25 one-time fee
2. **Prepare App Listing**:
   - App title: MentalCare
   - Description: Mental health consultation app with expert chat and appointment booking
   - Screenshots (required sizes): 16:9 and 9:16 aspect ratios
   - Feature graphic: 1024 x 500 pixels
   - App icon: 512 x 512 pixels

3. **Required Information**:
   - Privacy Policy URL
   - Content rating questionnaire
   - Target audience: Adults (medical app)
   - App permissions explanation

### iOS (Apple App Store)
1. **Apple Developer Account**: $99/year
2. **App Store Connect Setup**:
   - Bundle ID: com.mentalcare.app
   - App name: MentalCare
   - Privacy Policy URL required
   - App screenshots for all device sizes

3. **App Review Guidelines**:
   - Medical apps require disclaimer about not replacing professional medical advice
   - User data privacy compliance (HIPAA considerations)
   - Clear explanation of health-related features

## App Configuration

### Current Settings (capacitor.config.ts):
- **App ID**: com.mentalcare.app
- **App Name**: MentalCare
- **Web Directory**: dist
- **Splash Screen**: Blue theme (#3b82f6)
- **Android Scheme**: HTTPS

### Performance Optimizations:
- Web assets are cached locally
- Offline functionality via service worker
- Native splash screen configured
- HTTPS scheme for Android security

## Important Notes

### 1. Backend Considerations:
- Your Express server runs separately from the mobile app
- Mobile app connects to your deployed backend URL
- Update API endpoints in production builds
- Ensure CORS is configured for mobile domains

### 2. Database Access:
- PostgreSQL database remains server-side
- Mobile app makes HTTP requests to your API
- SMS notifications work via Twilio from server

### 3. Testing Strategy:
- Test on physical devices before submission
- Verify SMS functionality in production environment
- Test appointment scheduling across timezones
- Validate offline functionality

## Deployment Checklist

### Before Submitting:
- [ ] Update app version in capacitor.config.ts
- [ ] Test on multiple device sizes
- [ ] Verify all API endpoints work in production
- [ ] Test SMS notifications with real phone numbers
- [ ] Prepare app store screenshots
- [ ] Write privacy policy
- [ ] Create app store descriptions
- [ ] Set up analytics (optional)

### App Store Submission:
- [ ] Generate signed builds
- [ ] Upload to respective app stores
- [ ] Fill out app store metadata
- [ ] Submit for review
- [ ] Monitor review status

## Next Steps

1. **Immediate**: Test the current mobile setup by running `npx cap open android` or `npx cap open ios`
2. **Development**: Make any necessary UI adjustments for mobile devices
3. **Production**: Deploy your backend to a production server
4. **Publishing**: Follow the app store submission process

Your MentalCare app is now ready for native mobile deployment with SMS reminders, real-time chat, and appointment scheduling fully functional across platforms.