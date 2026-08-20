# Complete Google & Apple SSO Setup Guide for GatherGrove

## Current Status ✅

Your codebase already has **complete SSO implementation** with:
- ✅ Backend token validation (Google & Apple)
- ✅ Frontend integration (Next.js)
- ✅ Mobile integration (React Native + Expo)
- ✅ Client IDs configured in code

## What's Missing 🔧

### Web (Next.js) - Ready to Test ✅
- **Google**: Fully configured, ready to test
- **Apple**: Needs domain verification and redirect URI setup

### Mobile (React Native) - Needs Configuration Files 🚨
- **Google**: Missing Firebase configuration files
- **Apple**: Needs Apple Developer Portal configuration

---

## Part 1: Google Sign-In Setup

### Your Existing Google OAuth Client IDs

You already have these configured (from Google Cloud Console):
```
Web Client ID:     REPLACE_WITH_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com
iOS Client ID:     REPLACE_WITH_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com
Android Client ID: REPLACE_WITH_GOOGLE_ANDROID_CLIENT_ID.apps.googleusercontent.com
```

### Step 1.1: Google Cloud Console Setup (Verify Configuration)

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Select your GatherGrove project (or create one)

2. **Enable Google Sign-In API**
   - Go to: **APIs & Services** > **Library**
   - Search for "Google Sign-In API" or "Google Identity Toolkit API"
   - Click **Enable** if not already enabled

3. **Configure OAuth Consent Screen**
   - Go to: **APIs & Services** > **OAuth consent screen**
   - Settings you need:
     - **User Type**: External (for public app)
     - **App name**: GatherGrove
     - **User support email**: Your email
     - **Developer contact**: Your email
     - **Scopes**: Add `email`, `profile`, `openid`
     - **Authorized domains**:
       - `gathergrove.club`
       - `localhost` (for development)

4. **Verify OAuth 2.0 Client IDs**
   - Go to: **APIs & Services** > **Credentials**
   - You should see three OAuth 2.0 Client IDs:

     **a) Web Application Client**
     - Client ID: `REPLACE_WITH_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com`
     - Authorized JavaScript origins:
       ```
       http://localhost:3050
       https://gathergrove.club
       https://www.gathergrove.club
       ```
     - Authorized redirect URIs:
       ```
       http://localhost:3050
       https://gathergrove.club
       https://www.gathergrove.club
       ```

     **b) iOS Application Client**
     - Client ID: `REPLACE_WITH_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com`
     - Bundle ID: `com.gathergrove.mobile` (production) or `com.gathergrove.mobile.dev` (development)

     **c) Android Application Client**
     - Client ID: `REPLACE_WITH_GOOGLE_ANDROID_CLIENT_ID.apps.googleusercontent.com`
     - Package name: `com.gathergrove.mobile` (production) or `com.gathergrove.mobile.dev` (development)
     - **SHA-1 fingerprint**: You'll need to add your development and production signing certificates

### Step 1.2: Get Android SHA-1 Certificate Fingerprint

**For Development (Debug Keystore):**

1. **Windows PowerShell:**
   ```powershell
   # Development debug keystore location
   $keystorePath = "$env:USERPROFILE\.android\debug.keystore"

   # Generate SHA-1 fingerprint
   keytool -list -v -keystore $keystorePath -alias androiddebugkey -storepass android -keypass android
   ```

2. **Look for the SHA-1 fingerprint** in the output:
   ```
   Certificate fingerprints:
        SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
   ```

3. **Add this SHA-1 to your Android OAuth Client** in Google Cloud Console

**For Production (EAS Build):**

When you build with EAS, get the production SHA-1 from Expo:
```bash
# After running eas build, download the keystore
# Then extract SHA-1 using keytool
```

Or use EAS credentials:
```bash
eas credentials
# Select Android → Keystore → View fingerprints
```

### Step 1.3: Download Firebase Configuration Files for Mobile

**CRITICAL**: Mobile apps using `@react-native-google-signin/google-signin` require Firebase config files.

#### For iOS (GoogleService-Info.plist)

1. **Go to Firebase Console**: https://console.firebase.google.com/
   - Create a new project or select existing "GatherGrove" project
   - Link it to your existing Google Cloud Project (use the same project ID)

2. **Add iOS App**:
   - Click **Add app** > **iOS**
   - **Apple bundle ID**:
     - Production: `com.gathergrove.mobile`
     - Development: `com.gathergrove.mobile.dev`
   - App nickname: `GatherGrove Mobile (iOS)`
   - Click **Register app**

3. **Download `GoogleService-Info.plist`**:
   - Click **Download GoogleService-Info.plist**
   - Save to: `mobile/GoogleService-Info.plist`

4. **Add to Xcode** (if building locally):
   ```bash
   # EAS will automatically include this file when building
   # But if you're building locally with Xcode:
   # 1. Open mobile/ios/gathergrove.xcworkspace in Xcode
   # 2. Right-click on project → Add Files
   # 3. Select GoogleService-Info.plist
   # 4. Check "Copy items if needed"
   ```

#### For Android (google-services.json)

1. **Add Android App in Firebase Console**:
   - Click **Add app** > **Android**
   - **Android package name**:
     - Production: `com.gathergrove.mobile`
     - Development: `com.gathergrove.mobile.dev`
   - **Debug signing certificate SHA-1**: Paste the SHA-1 from Step 1.2
   - App nickname: `GatherGrove Mobile (Android)`
   - Click **Register app**

2. **Download `google-services.json`**:
   - Click **Download google-services.json**
   - Save to: `mobile/google-services.json`

3. **Update `app.config.ts`** to enable it:

   Find this section (around line 90-92):
   ```typescript
   // Google Sign-In: Add google-services.json from Firebase Console to project root
   // Then uncomment the line below:
   // googleServicesFile: './google-services.json',
   ```

   **Change to:**
   ```typescript
   // Google Sign-In configuration file from Firebase Console
   googleServicesFile: './google-services.json',
   ```

4. **Rebuild the app**:
   ```bash
   cd mobile
   npx expo prebuild --clean
   # Or use EAS Build for cloud builds
   ```

### Step 1.4: Enable Google Sign-In in Firebase

1. **Go to Firebase Console** > **Authentication**
2. Click **Get Started** (if not already enabled)
3. Click **Sign-in method** tab
4. Click **Google**
5. Toggle **Enable**
6. **Web SDK configuration**:
   - Select your support email
   - Add authorized domains:
     - `localhost`
     - `gathergrove.club`
7. Click **Save**

---

## Part 2: Apple Sign-In Setup

### Your Existing Apple Configuration

```
Service ID: club.gathergrove.service
Bundle ID:  club.gathergrove.ios
```

### Step 2.1: Apple Developer Portal Setup

1. **Go to Apple Developer Portal**
   - URL: https://developer.apple.com/account/resources/identifiers/list
   - Sign in with your Apple Developer account (requires $99/year membership)

### Step 2.2: Create App ID (iOS)

1. **Navigate to**: **Certificates, Identifiers & Profiles** > **Identifiers**
2. Click **+** to create new identifier
3. Select **App IDs** → Continue
4. Configure:
   - **Description**: GatherGrove Mobile
   - **Bundle ID**:
     - Production: `com.gathergrove.mobile`
     - Development: `com.gathergrove.mobile.dev`
   - **Capabilities**: Check **Sign In with Apple**
5. Click **Continue** → **Register**

### Step 2.3: Create Services ID (for Web)

1. Click **+** to create new identifier
2. Select **Services IDs** → Continue
3. Configure:
   - **Description**: GatherGrove Service
   - **Identifier**: `club.gathergrove.service` (matches your config)
4. Click **Continue** → **Register**
5. **Configure the Services ID**:
   - Click on `club.gathergrove.service` in the list
   - Check **Sign In with Apple**
   - Click **Configure** button next to "Sign In with Apple"

6. **Add Domains and Return URLs**:
   - **Primary App ID**: Select your iOS app ID created above
   - **Domains and Subdomains**:
     ```
     gathergrove.club
     www.gathergrove.club
     localhost
     ```
   - **Return URLs** (CRITICAL - these must match exactly):
     ```
     https://gathergrove.club/api/v1/auth/apple/callback
     https://www.gathergrove.club/api/v1/auth/apple/callback
     http://localhost:3050/api/v1/auth/apple/callback
     ```
   - Click **Save**
7. Click **Continue** → **Save**

### Step 2.4: Verify Bundle ID for iOS App

Your iOS app's `app.config.ts` already has:
```typescript
ios: {
  bundleIdentifier: IS_PRODUCTION
    ? 'com.gathergrove.mobile'
    : 'com.gathergrove.mobile.dev',
  usesAppleSignIn: true,  // ✅ Already configured
}
```

This matches your Apple configuration, so you're good!

### Step 2.5: Backend Configuration (Already Done ✅)

Your backend already has the correct configuration in `appsettings.json`:
```json
"OAuth": {
  "Apple": {
    "ServiceId": "club.gathergrove.service",  // ✅ Matches Services ID
    "BundleId": "club.gathergrove.ios"        // Note: This can be removed, not needed
  }
}
```

**Note**: The `BundleId` in backend config is not actually used by your `AppleTokenValidator.cs`. It validates against the Service ID for web and the actual iOS bundle ID from the token claims. You can safely ignore or remove this field.

---

## Part 3: Testing SSO

### Web (Next.js) Testing

1. **Start the backend**:
   ```powershell
   cd backend
   dotnet run
   ```

2. **Start the frontend**:
   ```powershell
   cd client
   npm run dev
   ```

3. **Navigate to**: http://localhost:3050/login

4. **Test Google Sign-In**:
   - Click the "Continue with Google" button
   - Should open Google OAuth popup
   - Select your account
   - Should redirect back and authenticate

5. **Test Apple Sign-In**:
   - Click the "Continue with Apple" button
   - Should open Apple Sign-In popup
   - Sign in with Apple ID
   - Should redirect back and authenticate
   - **Note**: For web, you MUST use HTTPS in production for Apple Sign-In to work properly

### Mobile Testing

#### iOS Simulator/Device

1. **Ensure you have the `GoogleService-Info.plist`** in `mobile/` directory

2. **Build the iOS app**:
   ```bash
   cd mobile
   npx expo run:ios
   # Or use EAS Build:
   eas build --profile development --platform ios
   ```

3. **Test Google Sign-In**:
   - Tap "Sign in with Google"
   - Should open Google account picker
   - Select account → Should authenticate

4. **Test Apple Sign-In** (iOS only):
   - Tap "Sign in with Apple"
   - Should open Apple Sign-In modal
   - Sign in → Should authenticate
   - **First sign-in**: Apple will ask for name/email
   - **Subsequent sign-ins**: Will use previously authorized credentials

#### Android Emulator/Device

1. **Ensure you have `google-services.json`** in `mobile/` directory

2. **Ensure SHA-1 fingerprint** is added to Google Cloud Console (Step 1.2)

3. **Build the Android app**:
   ```bash
   cd mobile
   npx expo run:android
   # Or use EAS Build:
   eas build --profile development --platform android
   ```

4. **Test Google Sign-In**:
   - Tap "Sign in with Google"
   - Should open Google account picker
   - Select account → Should authenticate

5. **Apple Sign-In**: Not supported on Android (Apple restriction)

---

## Part 4: Common Issues & Troubleshooting

### Google Sign-In Issues

#### Web: "Invalid OAuth Client"
- **Cause**: Redirect URI or JavaScript origin not whitelisted
- **Fix**: Add your domain to Google Cloud Console OAuth client:
  - Authorized JavaScript origins: `http://localhost:3050`, `https://gathergrove.club`
  - Authorized redirect URIs: Same as above

#### Mobile: "DEVELOPER_ERROR" or "API not enabled"
- **Cause**: Missing `google-services.json` or `GoogleService-Info.plist`
- **Fix**:
  1. Download files from Firebase Console (Steps 1.3)
  2. Place in `mobile/` directory
  3. Rebuild: `npx expo prebuild --clean`

#### Mobile Android: "Sign in failed"
- **Cause**: SHA-1 certificate fingerprint not added to Google Cloud Console
- **Fix**:
  1. Get SHA-1 using keytool (Step 1.2)
  2. Add to Google Cloud Console > Credentials > Android OAuth Client
  3. Wait 5-10 minutes for Google to propagate changes

#### Mobile iOS: "No valid client ID found"
- **Cause**: Bundle ID mismatch or missing `GoogleService-Info.plist`
- **Fix**:
  1. Verify bundle ID in `app.config.ts` matches Firebase iOS app
  2. Ensure `GoogleService-Info.plist` is in `mobile/` directory
  3. Rebuild app

### Apple Sign-In Issues

#### Web: "invalid_request" or "invalid_client"
- **Cause**: Service ID not properly configured or return URL mismatch
- **Fix**:
  1. Go to Apple Developer Portal > Services ID
  2. Verify return URLs match exactly (including `https://`)
  3. Wait 5-10 minutes for Apple to propagate changes

#### Web: "Popup blocked" or won't open
- **Cause**: Browser blocking popups or HTTPS required
- **Fix**:
  1. Use HTTPS in production (Apple requires it)
  2. For development, allow popups for localhost

#### Mobile iOS: "Sign in with Apple failed"
- **Cause**: Bundle ID not registered or capability not enabled
- **Fix**:
  1. Verify App ID has "Sign In with Apple" capability in Apple Developer Portal
  2. Ensure `usesAppleSignIn: true` in `app.config.ts` (already set ✅)
  3. Rebuild: `npx expo prebuild --clean`

#### Token validation fails on backend
- **Cause**: Token expired or invalid audience
- **Fix**:
  1. Verify `ServiceId` in backend `appsettings.json` matches Apple Developer Portal
  2. Check token hasn't expired (tokens are short-lived, ~10 minutes)
  3. Verify nonce matches (for replay protection)

---

## Part 5: Production Deployment Checklist

### Before Going Live

- [ ] **Google OAuth**: Update authorized domains to production URLs
- [ ] **Apple Services ID**: Update return URLs to production HTTPS URLs
- [ ] **Environment Variables**: Set production values
  - [ ] Frontend: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - [ ] Frontend: `NEXT_PUBLIC_APPLE_CLIENT_ID`
  - [ ] Backend: Verify `OAuth` section in production config
- [ ] **Firebase**: Set up production Firebase project (optional, can use same)
- [ ] **Test**: Test SSO on production staging environment
- [ ] **HTTPS**: Ensure production site uses HTTPS (required for Apple)
- [ ] **Mobile Builds**: Generate production builds with correct bundle IDs
  - [ ] iOS: `com.gathergrove.mobile`
  - [ ] Android: `com.gathergrove.mobile`
- [ ] **SHA-1 Certificates**: Add production SHA-1 to Google Cloud Console

### Monitoring & Maintenance

- [ ] Monitor Google Cloud Console quota usage
- [ ] Check Firebase Analytics for SSO success/failure rates
- [ ] Review backend logs for SSO errors
- [ ] Update OAuth consent screen if app features change
- [ ] Renew Apple Developer membership yearly ($99/year)

---

## Part 6: Quick Reference

### File Locations

```
Backend Configuration:
└── backend/src/GatherGrove.API/appsettings.json          # OAuth config

Frontend Configuration:
├── client/.env.local                                      # Google/Apple client IDs
└── client/src/components/features/auth/sso-buttons.tsx   # SSO UI component

Mobile Configuration:
├── mobile/app.config.ts                                   # App config
├── mobile/google-services.json                            # Android (ADD THIS)
└── mobile/GoogleService-Info.plist                        # iOS (ADD THIS)
```

### OAuth Client IDs (Current)

```
Google Web:     REPLACE_WITH_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com
Google iOS:     REPLACE_WITH_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com
Google Android: REPLACE_WITH_GOOGLE_ANDROID_CLIENT_ID.apps.googleusercontent.com
Apple Service:  club.gathergrove.service
Apple Bundle:   com.gathergrove.mobile (production)
                com.gathergrove.mobile.dev (development)
```

### Console URLs

- **Google Cloud Console**: https://console.cloud.google.com/
- **Firebase Console**: https://console.firebase.google.com/
- **Apple Developer Portal**: https://developer.apple.com/account/resources/identifiers/list

---

## Summary

### ✅ What You Already Have (Working)
- Complete SSO implementation in code (backend, frontend, mobile)
- Google OAuth client IDs configured
- Apple Service ID configured
- Token validation logic
- Security features (nonce, state validation)

### 🔧 What You Need to Do

#### For Web (30 minutes):
1. Verify Google Cloud Console OAuth consent screen
2. Add authorized domains to Google web client
3. Configure Apple Services ID return URLs in Apple Developer Portal
4. Test both Google and Apple sign-in on localhost

#### For Mobile (1-2 hours):
1. **Android**:
   - Get SHA-1 certificate fingerprint
   - Add SHA-1 to Google Cloud Console
   - Download `google-services.json` from Firebase
   - Place in `mobile/` directory
   - Uncomment `googleServicesFile` in `app.config.ts`
   - Rebuild app

2. **iOS**:
   - Download `GoogleService-Info.plist` from Firebase
   - Place in `mobile/` directory
   - Verify App ID has "Sign In with Apple" capability in Apple Developer Portal
   - Rebuild app

3. **Test**:
   - Test Google Sign-In on both platforms
   - Test Apple Sign-In on iOS

### Total Time Estimate: 2-3 hours for full setup and testing

Good luck! Let me know if you hit any issues. 🚀
