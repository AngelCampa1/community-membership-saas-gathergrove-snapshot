# SSO Quick Start Checklist 🚀

## 🎯 Immediate Actions Required

Your code is **100% ready**. You just need platform configuration files.

---

## Step 1: Get Firebase Configuration Files (Mobile)

### 1.1 Go to Firebase Console
📍 **URL**: https://console.firebase.google.com/

### 1.2 Create/Select Project
- Create new project: "GatherGrove"
- OR link to existing Google Cloud project (ID: `REPLACE_WITH_GCP_PROJECT_NUMBER`)

### 1.3 Add iOS App
1. Click **Project Settings** (gear icon) → **Add app** → **iOS**
2. Fill in:
   - **Apple bundle ID**: `com.gathergrove.mobile.dev` (for testing)
   - **App nickname**: "GatherGrove Mobile iOS"
3. Click **Register app**
4. **Download `GoogleService-Info.plist`**
5. Save to: `mobile\GoogleService-Info.plist`

### 1.4 Add Android App
1. Click **Add app** → **Android**
2. Fill in:
   - **Package name**: `com.gathergrove.mobile.dev` (for testing)
   - **App nickname**: "GatherGrove Mobile Android"
   - **SHA-1**: Get it with this command:
     ```powershell
     keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
     ```
     Copy the SHA-1 value (looks like: `AA:BB:CC:...`)
3. Click **Register app**
4. **Download `google-services.json`**
5. Save to: `mobile\google-services.json`

### 1.5 Enable Google Sign-In
1. In Firebase Console → **Authentication**
2. Click **Get Started**
3. Click **Sign-in method** tab
4. Click **Google** → Toggle **Enable**
5. Select support email → Click **Save**

---

## Step 2: Update Mobile App Config

### 2.1 Edit `app.config.ts`

Open: `mobile\app.config.ts`

Find line ~92:
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

Save the file.

### 2.2 Verify Files Exist
```powershell
cd mobile
ls GoogleService-Info.plist  # Should show iOS config file
ls google-services.json      # Should show Android config file
```

---

## Step 3: Configure Apple Sign-In (Web)

### 3.1 Go to Apple Developer Portal
📍 **URL**: https://developer.apple.com/account/resources/identifiers/list

### 3.2 Create/Update Services ID

1. Click on existing Services ID: `club.gathergrove.service`
   - OR create new one if it doesn't exist
2. Check **Sign In with Apple**
3. Click **Configure** next to "Sign In with Apple"
4. Add these **Return URLs**:
   ```
   https://gathergrove.club/api/v1/auth/apple/callback
   https://www.gathergrove.club/api/v1/auth/apple/callback
   http://localhost:3050/api/v1/auth/apple/callback
   ```
5. Add these **Domains**:
   ```
   gathergrove.club
   www.gathergrove.club
   localhost
   ```
6. Click **Save** → **Continue** → **Save**

---

## Step 4: Configure Google OAuth (Web)

### 4.1 Go to Google Cloud Console
📍 **URL**: https://console.cloud.google.com/apis/credentials

### 4.2 Find Web OAuth Client
- Find client ID: `REPLACE_WITH_GOOGLE_WEB_CLIENT_ID`
- Click to edit it

### 4.3 Add Authorized JavaScript Origins
```
http://localhost:3050
https://gathergrove.club
https://www.gathergrove.club
```

### 4.4 Add Authorized Redirect URIs
```
http://localhost:3050
https://gathergrove.club
https://www.gathergrove.club
```

### 4.5 Save Changes

---

## Step 5: Test Everything

### 5.1 Test Web (5 minutes)

```powershell
# Terminal 1 - Start backend
cd backend
dotnet run

# Terminal 2 - Start frontend
cd client
npm run dev
```

Navigate to: http://localhost:3050/login

**Test**:
- ✅ Click "Continue with Google" → Should open Google popup → Sign in
- ✅ Click "Continue with Apple" → Should open Apple popup → Sign in

### 5.2 Test Mobile (10 minutes)

```powershell
cd mobile

# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

**Test**:
- ✅ Tap "Sign in with Google" on both platforms
- ✅ Tap "Sign in with Apple" on iOS (not available on Android)

---

## Troubleshooting Quick Fixes

### Google Sign-In Errors

**"DEVELOPER_ERROR"** (Mobile)
```powershell
# Missing config files - verify they exist:
cd mobile
ls google-services.json
ls GoogleService-Info.plist

# If missing, go back to Step 1
```

**"Invalid OAuth Client"** (Web)
- Go to Step 4.3 and verify authorized origins are added
- Wait 5 minutes for Google to propagate changes

**"API not enabled"**
- Go to: https://console.cloud.google.com/apis/library
- Search "Google Sign-In API"
- Click **Enable**

### Apple Sign-In Errors

**"invalid_client"** (Web)
- Go to Step 3.2 and verify return URLs match exactly
- Wait 5 minutes for Apple to propagate changes

**"Sign in with Apple failed"** (iOS)
- Verify App ID has "Sign In with Apple" capability enabled
- Go to: https://developer.apple.com/account/resources/identifiers/list
- Click on your App ID → Verify "Sign In with Apple" is checked

### Android SHA-1 Issues

**"Sign in failed"** (Android)
```powershell
# Re-run to get SHA-1
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

# Copy SHA-1 and add to Google Cloud Console:
# https://console.cloud.google.com/apis/credentials
# Click Android OAuth Client → Add SHA-1
```

---

## ✅ Success Checklist

- [ ] Firebase project created
- [ ] `GoogleService-Info.plist` downloaded and saved to `mobile/`
- [ ] `google-services.json` downloaded and saved to `mobile/`
- [ ] SHA-1 added to Google Cloud Console
- [ ] `app.config.ts` updated (uncommented `googleServicesFile`)
- [ ] Apple Services ID configured with return URLs
- [ ] Google Web OAuth client configured with authorized origins
- [ ] Web SSO tested (Google + Apple)
- [ ] Mobile SSO tested (Google on both, Apple on iOS)

---

## 📚 For More Details

See: `SSO-SETUP-GUIDE.md` for comprehensive documentation including:
- Detailed explanations of each step
- Production deployment checklist
- Advanced troubleshooting
- Security best practices

---

**Total Time**: 30-45 minutes to complete all steps

**Need Help?** Check the main guide (`SSO-SETUP-GUIDE.md`) or the troubleshooting section above.
