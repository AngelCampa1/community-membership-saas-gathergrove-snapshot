# Complete SSO Setup Walkthrough for GatherGrove

**Total Time: 1-2 hours**

Follow these steps in order. Don't skip any steps!

---

## 🔥 Part 1: Firebase Console Setup (20 minutes)

### Step 1.1: Access Firebase Console

1. Open your browser
2. Go to: **https://console.firebase.google.com/**
3. Sign in with your Google account

### Step 1.2: Create or Select Project

**If you see an existing project** (might be called "GatherGrove" or similar):
- Click on the existing project
- Skip to Step 1.3

**If you need to create a new project**:
1. Click **"Add project"** or **"Create a project"**
2. Enter project name: **GatherGrove**
3. Click **Continue**
4. **Google Analytics**: Toggle OFF (you can add later)
5. Click **Create project**
6. Wait for project creation (~30 seconds)
7. Click **Continue**

### Step 1.3: Add iOS App to Firebase

1. On the Firebase Console home page, click **Project Overview** (top left if not already there)
2. Click the **iOS icon** (Apple logo) to add an iOS app
3. Fill in the form:
   - **Apple bundle ID**: `com.gathergrove.mobile.dev`
   - **App nickname (optional)**: `GatherGrove Mobile iOS Dev`
   - **App Store ID (optional)**: Leave blank
4. Click **Register app**

### Step 1.4: Download iOS Configuration File

1. You'll see **"Download GoogleService-Info.plist"**
2. Click **Download GoogleService-Info.plist**
3. **SAVE THE FILE** to your Downloads folder (remember where it is!)
4. Click **Next**
5. Click **Next** again (skip the SDK setup instructions)
6. Click **Continue to console**

### Step 1.5: Move iOS Configuration File to Project

Open PowerShell and run:

```powershell
# Navigate to your Downloads folder
cd $env:USERPROFILE\Downloads

# Check if the file exists
ls GoogleService-Info.plist

# Copy it to the mobile directory
Copy-Item GoogleService-Info.plist mobile\GoogleService-Info.plist

# Verify it's there
ls mobile\GoogleService-Info.plist
```

✅ You should see the file listed. If you see an error, the file wasn't copied correctly.

### Step 1.6: Add Android App to Firebase

1. Back in Firebase Console, click **Project Overview** (top left, home icon)
2. Click **Add app** button
3. Click the **Android icon** (Android robot)
4. Fill in the form:
   - **Android package name**: `com.gathergrove.mobile.dev`
   - **App nickname (optional)**: `GatherGrove Mobile Android Dev`
   - **Debug signing certificate SHA-1**: Leave blank for now (we'll get this next)
5. Click **Register app**

### Step 1.7: Get Android SHA-1 Certificate (IMPORTANT!)

**Open PowerShell** and run this command:

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**Look for this in the output:**
```
Certificate fingerprints:
     SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
     SHA256: ...
```

**Copy the SHA-1 value** (the part after "SHA1:"). It will look like: `AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD`

**IMPORTANT: If you get an error** "'keytool' is not recognized":
1. You need Java JDK installed
2. Download from: https://adoptium.net/
3. Install it, then try the command again

### Step 1.8: Add SHA-1 to Firebase Android App

1. Go back to Firebase Console
2. Click **Project Settings** (gear icon top left)
3. Scroll down to **"Your apps"** section
4. Find your Android app (`com.gathergrove.mobile.dev`)
5. Click **Add fingerprint** button
6. Paste the SHA-1 you copied
7. Click **Save**

### Step 1.9: Download Android Configuration File

1. Still in Project Settings, find your Android app
2. Click **Download google-services.json**
3. **SAVE THE FILE** to your Downloads folder

### Step 1.10: Move Android Configuration File to Project

Open PowerShell and run:

```powershell
# Navigate to Downloads
cd $env:USERPROFILE\Downloads

# Check if the file exists
ls google-services.json

# Copy it to the mobile directory
Copy-Item google-services.json mobile\google-services.json

# Verify it's there
ls mobile\google-services.json
```

✅ You should see the file listed.

### Step 1.11: Enable Google Sign-In in Firebase Authentication

1. In Firebase Console, click **Authentication** in the left sidebar
2. Click **Get started** (if this is your first time)
3. Click the **Sign-in method** tab
4. Find **Google** in the list of providers
5. Click on **Google**
6. Toggle the **Enable** switch to ON
7. **Project support email**: Select your email from dropdown
8. Click **Save**

🎉 **Firebase setup complete!**

---

## 📱 Part 2: Update Mobile App Configuration (5 minutes)

### Step 2.1: Edit app.config.ts

1. Open the file: `mobile\app.config.ts`

2. Find this section (around line 90-92):

```typescript
// Google Sign-In: Add google-services.json from Firebase Console to project root
// Then uncomment the line below:
// googleServicesFile: './google-services.json',
```

3. **Change it to** (uncomment the line):

```typescript
// Google Sign-In configuration file from Firebase Console
googleServicesFile: './google-services.json',
```

4. **Save the file**

### Step 2.2: Verify Mobile Configuration Files

Open PowerShell and run:

```powershell
cd mobile

# Check both files exist
ls GoogleService-Info.plist
ls google-services.json

# If both files are listed, you're good! ✅
```

---

## 🔵 Part 3: Google Cloud Console Setup (15 minutes)

### Step 3.1: Access Google Cloud Console

1. Open your browser
2. Go to: **https://console.cloud.google.com/**
3. Sign in with your Google account

### Step 3.2: Select or Create Project

**If you see a project selector** at the top:
- Click the project dropdown (top left, next to "Google Cloud")
- Look for a project with ID starting with `REPLACE_WITH_GCP_PROJECT_NUMBER`
- Click to select it

**If you need to create a new project**:
- Click **"Select a project"** → **"NEW PROJECT"**
- Project name: **GatherGrove**
- Click **Create**
- Wait for project creation
- Select the new project from the dropdown

### Step 3.3: Enable Google Sign-In API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. In the search box, type: **"Google Identity Toolkit API"**
3. Click on **"Identity Toolkit API"**
4. Click **"ENABLE"**
5. Wait for it to enable (~10 seconds)

### Step 3.4: Configure OAuth Consent Screen

1. In left sidebar, click **"APIs & Services"** → **"OAuth consent screen"**

2. **If you see "Configure Consent Screen"**:
   - Select **"External"**
   - Click **Create**

3. Fill in **OAuth consent screen** (App information):
   - **App name**: `GatherGrove`
   - **User support email**: Select your email
   - **App logo**: Skip for now
   - **App domain**: Leave blank for now
   - **Authorized domains**: Click **"+ ADD DOMAIN"**
     - Add: `gathergrove.club`
     - Add: `localhost` (if allowed, otherwise skip)
   - **Developer contact information**: Enter your email

4. Click **"SAVE AND CONTINUE"**

5. **Scopes** page:
   - Click **"ADD OR REMOVE SCOPES"**
   - Find and check these scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

6. **Test users** page:
   - Click **"SAVE AND CONTINUE"** (skip adding test users for now)

7. **Summary** page:
   - Click **"BACK TO DASHBOARD"**

### Step 3.5: Create/Update OAuth 2.0 Client IDs

1. In left sidebar, click **"APIs & Services"** → **"Credentials"**

2. **Check if you already have OAuth clients**:
   - Look for OAuth 2.0 Client IDs with IDs like `REPLACE_WITH_GCP_PROJECT_NUMBER-...`
   - If you see three clients (Web, iOS, Android), skip to Step 3.6
   - If not, continue below

3. **Create Web Application OAuth Client**:
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - **Application type**: Select **"Web application"**
   - **Name**: `GatherGrove Web Client`
   - **Authorized JavaScript origins**: Click **"+ ADD URI"**
     - Add: `http://localhost:3050`
     - Add: `https://gathergrove.club`
     - Add: `https://www.gathergrove.club`
   - **Authorized redirect URIs**: Click **"+ ADD URI"**
     - Add: `http://localhost:3050`
     - Add: `https://gathergrove.club`
     - Add: `https://www.gathergrove.club`
   - Click **"CREATE"**
   - **COPY THE CLIENT ID** (looks like: `REPLACE_WITH_GCP_PROJECT_NUMBER-xxxxx.apps.googleusercontent.com`)
   - Click **"OK"**

4. **Create iOS OAuth Client**:
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - **Application type**: Select **"iOS"**
   - **Name**: `GatherGrove iOS Client`
   - **Bundle ID**: `com.gathergrove.mobile.dev`
   - Click **"CREATE"**
   - **COPY THE CLIENT ID**
   - Click **"OK"**

5. **Create Android OAuth Client**:
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - **Application type**: Select **"Android"**
   - **Name**: `GatherGrove Android Client`
   - **Package name**: `com.gathergrove.mobile.dev`
   - **SHA-1 certificate fingerprint**: Paste the SHA-1 you got in Step 1.7
   - Click **"CREATE"**
   - **COPY THE CLIENT ID**
   - Click **"OK"**

### Step 3.6: Update Existing OAuth Clients (If They Already Exist)

**If you already have OAuth clients** (IDs starting with `REPLACE_WITH_GCP_PROJECT_NUMBER-`):

1. Find the **Web application** client in the list
2. Click on it to edit
3. Under **Authorized JavaScript origins**, make sure you have:
   - `http://localhost:3050`
   - `https://gathergrove.club`
   - `https://www.gathergrove.club`
4. Under **Authorized redirect URIs**, make sure you have:
   - `http://localhost:3050`
   - `https://gathergrove.club`
   - `https://www.gathergrove.club`
5. Click **"SAVE"**

6. Find the **Android** client in the list
7. Click on it to edit
8. Under **SHA-1 certificate fingerprints**, make sure your debug SHA-1 is listed
   - If not, click **"+ ADD FINGERPRINT"** and add the SHA-1 from Step 1.7
9. Click **"SAVE"**

---

## 🍎 Part 4: Apple Developer Portal Setup (20 minutes)

**⚠️ REQUIREMENT**: You need an **Apple Developer Account** ($99/year). If you don't have one:
1. Go to: https://developer.apple.com/programs/enroll/
2. Enroll in the Apple Developer Program
3. Wait for approval (can take 24-48 hours)
4. Come back to this step after approval

**If you have an Apple Developer Account**, continue:

### Step 4.1: Access Apple Developer Portal

1. Go to: **https://developer.apple.com/account/resources/identifiers/list**
2. Sign in with your Apple ID (the one enrolled in the developer program)

### Step 4.2: Create App ID for iOS

1. Click the **"+"** button (top left, next to "Identifiers")
2. Select **"App IDs"**
3. Click **"Continue"**
4. Select **"App"**
5. Click **"Continue"**
6. Fill in the form:
   - **Description**: `GatherGrove Mobile`
   - **Bundle ID**: Select **"Explicit"**
     - Enter: `com.gathergrove.mobile.dev`
   - **Capabilities**: Scroll down and check **"Sign In with Apple"**
7. Click **"Continue"**
8. Click **"Register"**

### Step 4.3: Create Services ID for Web

1. Click the **"+"** button again
2. Select **"Services IDs"**
3. Click **"Continue"**
4. Fill in:
   - **Description**: `GatherGrove Service`
   - **Identifier**: `club.gathergrove.service`
5. Click **"Continue"**
6. Click **"Register"**

### Step 4.4: Configure Services ID for Sign In with Apple

1. In the identifiers list, find and click **"club.gathergrove.service"**
2. Check the box next to **"Sign In with Apple"**
3. Click **"Configure"** button (next to "Sign In with Apple")
4. In the popup:
   - **Primary App ID**: Select `GatherGrove Mobile (com.gathergrove.mobile.dev)`
   - **Domains and Subdomains**: Click **"+"**
     - Add: `gathergrove.club`
     - Click **"+"** again
     - Add: `www.gathergrove.club`
     - Click **"+"** again
     - Add: `localhost` (for development)
   - **Return URLs**: Click **"+"**
     - Add: `https://gathergrove.club/api/v1/auth/apple/callback`
     - Click **"+"** again
     - Add: `https://www.gathergrove.club/api/v1/auth/apple/callback`
     - Click **"+"** again
     - Add: `http://localhost:3050/api/v1/auth/apple/callback`
5. Click **"Next"**
6. Click **"Done"**
7. Click **"Continue"** (top right)
8. Click **"Save"**

✅ **Wait 5-10 minutes** for Apple to propagate these changes before testing.

---

## 🧪 Part 5: Test Web SSO (15 minutes)

### Step 5.1: Start the Backend

Open PowerShell Terminal 1:

```powershell
cd backend
dotnet run
```

Wait until you see: `Now listening on: http://localhost:8050`

### Step 5.2: Start the Frontend

Open PowerShell Terminal 2 (new window):

```powershell
cd client
npm run dev
```

Wait until you see: `ready - started server on 0.0.0.0:3050`

### Step 5.3: Test Google Sign-In

1. Open browser: **http://localhost:3050/login**
2. You should see the login page with SSO buttons
3. Click **"Continue with Google"** (or the Google button)
4. **Expected behavior**:
   - Google popup opens
   - Shows account picker
   - Select your Google account
   - Popup closes
   - You're redirected to the dashboard

**If it works**: ✅ Google SSO is working!

**If you get an error**:
- "redirect_uri_mismatch": Go back to Step 3.6, verify redirect URIs
- "invalid_client": Wrong client ID in `.env.local`, verify it matches Google Cloud Console
- Popup blocked: Allow popups for localhost:3050

### Step 5.4: Test Apple Sign-In

1. Still on login page: **http://localhost:3050/login**
2. Click **"Continue with Apple"** (or the Apple button)
3. **Expected behavior**:
   - Apple Sign-In popup opens
   - Enter your Apple ID and password
   - May ask for two-factor authentication
   - Popup closes
   - You're redirected to the dashboard

**If it works**: ✅ Apple SSO is working!

**If you get an error**:
- "invalid_request": Return URLs not configured correctly in Apple Developer Portal
- "invalid_client": Service ID doesn't match or not configured
- Wait 10 minutes and try again (Apple needs time to propagate changes)

---

## 📱 Part 6: Test Mobile SSO (20 minutes)

**Note**: Mobile testing requires either:
- Physical iOS/Android device, OR
- Xcode iOS Simulator (Mac only), OR
- Android Emulator (Android Studio required)

### Step 6.1: Ensure Backend is Running

Make sure your backend is still running from Step 5.1. If not:

```powershell
cd backend
dotnet run
```

### Step 6.2: iOS Testing (if you have a Mac or iOS device)

```powershell
cd mobile

# For iOS Simulator (Mac only)
npx expo run:ios

# For physical iOS device
npx expo run:ios --device
```

**Test Google Sign-In**:
1. Tap **"Sign in with Google"**
2. Native Google account picker appears
3. Select account
4. Should authenticate and navigate to app

**Test Apple Sign-In**:
1. Tap **"Sign in with Apple"**
2. Face ID/Touch ID prompt appears
3. Authenticate
4. Should navigate to app

### Step 6.3: Android Testing

**Option A: Android Emulator**

1. Install Android Studio if you haven't: https://developer.android.com/studio
2. Open Android Studio → Tools → AVD Manager
3. Create a new virtual device (any Pixel device, API 30+)
4. Start the emulator

```powershell
cd mobile
npx expo run:android
```

**Option B: Physical Android Device**

1. Enable Developer Mode on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run:

```powershell
cd mobile
npx expo run:android --device
```

**Test Google Sign-In**:
1. Tap **"Sign in with Google"**
2. Google account picker appears
3. Select account
4. Should authenticate and navigate to app

**If you get "DEVELOPER_ERROR"**:
- Verify `google-services.json` is in the `mobile/` directory
- Verify SHA-1 is added to Google Cloud Console
- Rebuild the app: `npx expo run:android --clean`

---

## 🎉 Part 7: Verification Checklist

Go through this checklist to make sure everything is set up:

### Firebase
- [ ] Firebase project created
- [ ] iOS app added to Firebase
- [ ] Android app added to Firebase
- [ ] `GoogleService-Info.plist` downloaded and in `mobile/` folder
- [ ] `google-services.json` downloaded and in `mobile/` folder
- [ ] Android SHA-1 certificate added to Firebase
- [ ] Google Sign-In enabled in Firebase Authentication

### Mobile App
- [ ] `app.config.ts` updated (googleServicesFile uncommented)
- [ ] Both config files exist in `mobile/` directory

### Google Cloud Console
- [ ] Google Identity Toolkit API enabled
- [ ] OAuth consent screen configured
- [ ] Web OAuth client created with correct redirect URIs
- [ ] iOS OAuth client created
- [ ] Android OAuth client created with SHA-1 fingerprint

### Apple Developer Portal
- [ ] App ID created for iOS app
- [ ] Services ID created (`club.gathergrove.service`)
- [ ] Services ID configured with domains and return URLs
- [ ] Sign In with Apple enabled

### Web Testing
- [ ] Google Sign-In works on web (localhost:3050)
- [ ] Apple Sign-In works on web (localhost:3050)

### Mobile Testing
- [ ] Google Sign-In works on iOS (if tested)
- [ ] Apple Sign-In works on iOS (if tested)
- [ ] Google Sign-In works on Android (if tested)

---

## 🔧 Common Issues & Solutions

### Issue: "keytool is not recognized"
**Solution**: Install Java JDK from https://adoptium.net/, restart PowerShell, try again

### Issue: Google Sign-In shows "redirect_uri_mismatch"
**Solution**:
1. Check the error message for the redirect URI it's trying to use
2. Go to Google Cloud Console → Credentials → Web Client
3. Add that exact URI to Authorized redirect URIs

### Issue: Apple Sign-In shows "invalid_client"
**Solution**:
1. Wait 10 minutes (Apple needs time to propagate changes)
2. Verify Service ID in Apple Developer Portal matches `club.gathergrove.service`
3. Verify return URLs are exactly correct (including https://)

### Issue: Mobile Android "DEVELOPER_ERROR"
**Solution**:
1. Verify `google-services.json` exists in `mobile/` directory:
   ```powershell
   ls mobile\google-services.json
   ```
2. Verify SHA-1 is in Google Cloud Console → Credentials → Android client
3. Rebuild: `npx expo run:android --clean`

### Issue: Mobile iOS "No valid client ID"
**Solution**:
1. Verify `GoogleService-Info.plist` exists in `mobile/` directory
2. Verify bundle ID matches: `com.gathergrove.mobile.dev`
3. Rebuild: `npx expo run:ios --clean`

### Issue: Apple Sign-In works but name is null
**Note**: Apple only provides the user's name on the FIRST sign-in. If you're testing with an account that already signed in before:
1. Go to Apple ID settings on iOS device
2. Settings → Apple ID → Password & Security → Apps Using Apple ID
3. Remove GatherGrove
4. Try signing in again

---

## 🚀 Production Setup (Later)

When you're ready to deploy to production:

### Update Bundle IDs to Production
1. Change bundle IDs from `.dev` to production:
   - iOS: `com.gathergrove.mobile`
   - Android: `com.gathergrove.mobile`

2. Create new App IDs and Services IDs in Apple Developer Portal

3. Create new Firebase apps for production

4. Generate production SHA-1 certificate (from release keystore)

5. Update Google Cloud Console with production domains

6. Update Apple Developer Portal with production return URLs

---

## 📞 Need Help?

If you run into issues:

1. Check the **Common Issues & Solutions** section above
2. Review the detailed guide: `SSO-SETUP-GUIDE.md`
3. Check Firebase Console logs: https://console.firebase.google.com/ → Authentication → Users
4. Check backend API logs (look for token validation errors)
5. Check browser console for frontend errors (F12 → Console)

---

**You're all set! Follow these steps in order and your SSO should be fully functional on both web and mobile.** 🎉

Good luck!
