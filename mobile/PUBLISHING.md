# GatherGrove Mobile App Publishing Guide

Complete guide for publishing the GatherGrove mobile app to Apple App Store and Google Play Store.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [One-Time Setup](#one-time-setup)
3. [Apple App Store Setup](#apple-app-store-setup)
4. [Google Play Store Setup](#google-play-store-setup)
5. [Build and Submit](#build-and-submit)
6. [Store Listing Assets](#store-listing-assets)
7. [Post-Submission Checklist](#post-submission-checklist)

---

## Prerequisites

### Developer Accounts (Required)
- [ ] **Apple Developer Program**: https://developer.apple.com/programs/ ($99/year)
- [ ] **Google Play Developer**: https://play.google.com/console/ ($25 one-time)

### Tools
```powershell
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Verify login
eas whoami
```

### Azure Resources (Already Configured)
- **Resource Group**: `rg-shared-projects`
- **Key Vault**: `kv-ventora-shared`
- **Application Insights**: `appi-gathergrove`
  - Instrumentation Key: `00000000-0000-0000-0000-000000000000`

---

## One-Time Setup

### 1. Create Expo Project
```powershell
cd mobile

# Initialize EAS project (links to Expo account)
eas init

# This will create/update the project ID in app.config.ts
```

### 2. Configure Environment
```powershell
# Copy environment template
copy .env.example .env.local

# Edit with your values
notepad .env.local
```

### 3. Create Azure Notification Hub (for push notifications)
```bash
# SSH to Azure or use Azure Portal
az notification-hub namespace create \
  --resource-group rg-shared-projects \
  --name gathergrove-notifications-ns \
  --location eastus \
  --sku Free

az notification-hub create \
  --resource-group rg-shared-projects \
  --namespace-name gathergrove-notifications-ns \
  --name gathergrove-notifications
```

---

## Apple App Store Setup

### 1. Apple Developer Portal Configuration

1. **Go to**: https://developer.apple.com/account/resources/identifiers/list

2. **Create App ID**:
   - Click "+" to add new identifier
   - Select "App IDs" → "App"
   - Description: `GatherGrove Mobile`
   - Bundle ID: `com.gathergrove.mobile` (Explicit)
   - Capabilities:
     - [x] Sign In with Apple
     - [x] Push Notifications
     - [x] Associated Domains

3. **Create Provisioning Profiles** (EAS handles this automatically, but manual setup available):
   - Development profile for testing
   - App Store Distribution profile for release

### 2. App Store Connect Setup

1. **Go to**: https://appstoreconnect.apple.com/apps

2. **Create New App**:
   - Platform: iOS
   - Name: `GatherGrove`
   - Primary Language: English (U.S.)
   - Bundle ID: `com.gathergrove.mobile`
   - SKU: `gathergrove-mobile-001`

3. **App Information**:
   - Category: Business or Productivity
   - Content Rights: Does not contain third-party content
   - Age Rating: Complete questionnaire (likely 4+)

4. **Pricing and Availability**:
   - Price: Free
   - Availability: All territories (or select specific)

### 3. Configure Push Notifications (APNs)

1. **Create APNs Key**:
   - Go to: https://developer.apple.com/account/resources/authkeys/list
   - Click "+" → "Apple Push Notifications service (APNs)"
   - Download the `.p8` key file
   - Note the **Key ID**

2. **Add to Azure Notification Hub**:
   - Azure Portal → Notification Hub → Apple (APNS)
   - Authentication Mode: Token
   - Key ID: (from step above)
   - Bundle ID: `com.gathergrove.mobile`
   - Team ID: (from Apple Developer account)
   - Token: (contents of .p8 file)

### 4. Update eas.json

Edit `mobile/eas.json` with your Apple credentials:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234EF"
      }
    }
  }
}
```

- **appleId**: Your Apple ID email
- **ascAppId**: App Store Connect App ID (from App Store Connect → App Information → Apple ID)
- **appleTeamId**: Team ID from https://developer.apple.com/account/#/membership

---

## Google Play Store Setup

### 1. Google Play Console Setup

1. **Go to**: https://play.google.com/console

2. **Create App**:
   - App name: `GatherGrove`
   - Default language: English (United States)
   - App type: App
   - Free or paid: Free

3. **Complete App Content**:
   - Privacy policy URL: `https://gathergrove.club/privacy-policy`
   - App access: All functionality available without restrictions
   - Ads: Does not contain ads
   - Content rating: Complete IARC questionnaire
   - Target audience: 18 and over
   - News app: No
   - COVID-19 contact tracing: No
   - Data safety: Complete questionnaire

### 2. Create Service Account for Automated Submission

1. **Google Cloud Console**:
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
   - Create service account: `gathergrove-play-publisher`
   - Create JSON key and download

2. **Google Play Console**:
   - Go to: Settings → API access
   - Link to Google Cloud project
   - Grant access to service account:
     - Role: Release manager

3. **Save Service Account Key**:
   ```powershell
   # For local EAS submit only. This path is gitignored; do not commit it.
   mobile/google-service-account.json
   ```
   In CI, store the JSON as a protected secret or secure file instead of writing it into the repository.

### 3. Configure Firebase (for FCM Push Notifications)

1. **Create Firebase Project**:
   - Go to: https://console.firebase.google.com
   - Add project: `GatherGrove`
   - Link to Google Analytics if desired

2. **Add Android App**:
   - Package name: `com.gathergrove.mobile`
   - Download `google-services.json`
   - Save to `mobile/google-services.json`

3. **Get FCM Server Key**:
   - Project Settings → Cloud Messaging
   - Copy Server Key

4. **Add to Azure Notification Hub**:
   - Azure Portal → Notification Hub → Google (GCM/FCM)
   - API Key: (FCM Server Key)

### 4. Configure Google Sign-In

1. **Google Cloud Console**:
   - Go to: https://console.cloud.google.com/apis/credentials

2. **Create OAuth Client IDs**:
   - **iOS**:
     - Application type: iOS
     - Bundle ID: `com.gathergrove.mobile`
   - **Android**:
     - Application type: Android
     - Package name: `com.gathergrove.mobile`
     - SHA-1: (get from `eas credentials`)
   - **Web** (for backend verification):
     - Application type: Web application

3. **Update Environment**:
   ```
   GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_ANDROID_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
   ```

---

## Build and Submit

### Development Build (Testing)
```powershell
cd mobile

# Build for internal testing
eas build --profile development --platform all
```

### Preview Build (Internal Distribution)
```powershell
# Build for internal testers (APK for Android, Ad Hoc for iOS)
eas build --profile preview --platform all
```

### Production Build
```powershell
# Build for store submission
eas build --profile production --platform all

# Or build separately
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Submit to Stores
```powershell
# Submit iOS build to App Store Connect
eas submit --platform ios

# Submit Android build to Google Play (internal track)
eas submit --platform android

# Submit both
eas submit --platform all
```

### One Command Build + Submit
```powershell
# Build and submit in one step
eas build --profile production --platform all --auto-submit
```

---

## Store Listing Assets

### Required Screenshots

#### iOS (Required Sizes)
| Device | Size | Required |
|--------|------|----------|
| iPhone 6.7" | 1290 × 2796 | Yes |
| iPhone 6.5" | 1242 × 2688 | Yes |
| iPhone 5.5" | 1242 × 2208 | Yes |
| iPad Pro 12.9" | 2048 × 2732 | If supporting tablets |

#### Android (Required Sizes)
| Type | Size | Required |
|------|------|----------|
| Phone | 1080 × 1920 (min) | Yes |
| 7" Tablet | 1200 × 1920 | Recommended |
| 10" Tablet | 1920 × 1200 | Recommended |

### Feature Graphic (Android Only)
- Size: 1024 × 500 pixels
- Format: PNG or JPEG

### App Icon
- Already configured in `assets/images/`:
  - iOS: `AppIcon-ios-1024x1024.png`
  - Android: `AppIcon-android-512x512.png`

### Store Listing Content

#### Short Description (80 chars max)
```
Manage your club members, events, and communications in one powerful app.
```

#### Full Description
```
GatherGrove is the all-in-one club management platform designed for community organizations, nonprofits, and membership groups.

KEY FEATURES:
• Member Management - Track members, roles, and membership status
• Event Planning - Create and manage events with registration and check-in
• Communications - Send emails, SMS, and push notifications to members
• Directory - Searchable member directory with privacy controls
• Payments - Collect dues and event fees securely via Stripe
• Real-time Chat - Connect with club members instantly
• Analytics - Track engagement and membership metrics

PERFECT FOR:
• Civic clubs and community organizations
• Professional associations
• Sports leagues and recreational clubs
• Alumni associations
• Nonprofit organizations
• Social clubs and hobby groups

GatherGrove simplifies club administration so you can focus on what matters most - building your community.

Download now and transform how you manage your organization!
```

#### Keywords (iOS - 100 chars max)
```
club,membership,events,organization,nonprofit,community,management,members,dues,association
```

#### Category
- Primary: Business or Productivity
- Secondary: Social Networking

---

## Post-Submission Checklist

### After App Store Review
- [ ] Monitor App Store Connect for review status
- [ ] Respond to any reviewer questions within 24 hours
- [ ] If rejected, address issues and resubmit

### After Google Play Review
- [ ] Monitor Google Play Console for review status
- [ ] Check for policy violations
- [ ] Promote from Internal → Closed Testing → Production

### Post-Launch
- [ ] Monitor crash reports in Application Insights
- [ ] Monitor user reviews and respond promptly
- [ ] Set up release notes for future updates
- [ ] Configure Over-The-Air (OTA) updates via EAS Update

---

## Useful Commands

```powershell
# Check build status
eas build:list

# View credentials
eas credentials

# Configure credentials
eas credentials --platform ios
eas credentials --platform android

# Send OTA update (without new build)
eas update --branch production --message "Bug fixes"

# View submission status
eas submit:list
```

---

## Troubleshooting

### Build Fails
```powershell
# Clear cache and rebuild
eas build --profile production --platform ios --clear-cache
```

### Credentials Issues
```powershell
# Reset credentials
eas credentials --platform ios
# Select "Remove" and then set up again
```

### Submission Rejected
- Check rejection reason in App Store Connect / Google Play Console
- Common issues:
  - Missing privacy policy
  - Incomplete metadata
  - App crashes during review
  - Login/authentication issues (provide test account)

---

## Contact & Resources

- **Privacy Policy**: https://gathergrove.club/privacy-policy
- **Terms of Service**: https://gathergrove.club/terms-of-service
- **Support**: https://gathergrove.club/support
- **Expo Documentation**: https://docs.expo.dev/
- **EAS Documentation**: https://docs.expo.dev/eas/
