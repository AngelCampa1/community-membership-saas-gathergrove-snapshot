# Azure DevOps Mobile Build Pipeline Setup

This guide walks you through setting up Azure DevOps to build and deploy the GatherGrove mobile app to the App Store and Google Play Store.

## Overview

The pipeline uses **Microsoft-hosted macOS agents** to build:
- **iOS**: IPA file → App Store Connect (TestFlight)
- **Android**: AAB file → Google Play Store (Internal track)

---

## Prerequisites

- Azure DevOps organization with a project
- Apple Developer Account (Team ID: `REPLACE_WITH_APPLE_TEAM_ID`)
- Google Play Developer Account
- The pipeline YAML file: `azure-pipelines-gathergrove-mobile.yml`

---

## Step 1: Create Variable Group

1. Go to **Azure DevOps** → **Pipelines** → **Library**
2. Click **+ Variable group**
3. Name it: `gathergrove-mobile-secrets`
4. Add these variables (mark passwords as secret):

| Variable Name | Description | Secret? |
|--------------|-------------|---------|
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | Yes |
| `ANDROID_KEY_ALIAS` | Key alias (e.g., `gathergrove-upload`) | No |
| `ANDROID_KEY_PASSWORD` | Key password | Yes |
| `APPLE_CERT_PASSWORD` | P12 certificate password | Yes |
| `APPLE_CERTIFICATE_SIGNING_IDENTITY` | e.g., `Apple Distribution: Ventora Labs (REPLACE_WITH_APPLE_TEAM_ID)` | No |
| `APPLE_PROV_PROFILE_UUID` | Provisioning profile UUID | No |

---

## Step 2: Create Android Signing Key

If you don't already have a keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore gathergrove-upload-key.keystore \
  -alias gathergrove-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

**Save the passwords securely!**

---

## Step 3: Upload Secure Files

Go to **Azure DevOps** → **Pipelines** → **Library** → **Secure files**

Upload these files:

### Android
| File | Description |
|------|-------------|
| `gathergrove-upload-key.keystore` | Android signing keystore |

### iOS
| File | Description |
|------|-------------|
| `apple-distribution-cert.p12` | Apple Distribution Certificate (exported from Keychain) |
| `gathergrove-appstore.mobileprovision` | App Store provisioning profile |

### How to get iOS files:

#### Distribution Certificate (.p12):
1. Open **Keychain Access** on a Mac (or ask someone with a Mac)
2. Find your **Apple Distribution** certificate
3. Right-click → **Export** → Save as `.p12`
4. Set a password (add to variable group)

#### Provisioning Profile (.mobileprovision):
1. Go to https://developer.apple.com/account/resources/profiles/list
2. Create a new **App Store** provisioning profile for `com.gathergrove.mobile`
3. Download the `.mobileprovision` file

---

## Step 4: Create Service Connections

### Google Play Service Connection

1. Go to **Project Settings** → **Service connections**
2. Click **New service connection** → **Google Play**
3. Name: `GooglePlayServiceConnection`
4. Upload the Google service account JSON from your secure local or CI secret store. Do not commit it to this repo.
5. Click **Save**

### App Store Service Connection

1. Go to **Project Settings** → **Service connections**
2. Click **New service connection** → **Apple App Store**
3. Name: `AppStoreServiceConnection`
4. Authentication: **API Key** (recommended) or **Username/Password**

#### For API Key authentication:
1. Go to https://appstoreconnect.apple.com/access/api
2. Generate an **App Store Connect API Key**
3. Download the `.p8` file
4. Note the **Key ID** and **Issuer ID**
5. Enter these in Azure DevOps

---

## Step 5: Create the Pipeline

1. Go to **Pipelines** → **New Pipeline**
2. Select **Azure Repos Git** (or GitHub)
3. Select your repository
4. Choose **Existing Azure Pipelines YAML file**
5. Path: `/infrastructure/azure-pipelines-gathergrove-mobile.yml`
6. Click **Continue** → **Run**

---

## Step 6: First Build Setup

### For iOS (First Time):
Before the first iOS build, you need to create the app in App Store Connect:

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - Platform: iOS
   - Name: GatherGrove
   - Primary Language: English (U.S.)
   - Bundle ID: `com.gathergrove.mobile`
   - SKU: `gathergrove-mobile`

### For Android (First Time):
Before the first Android build, you need to manually upload an AAB:

1. Go to https://play.google.com/console
2. Select your GatherGrove app
3. Go to **Release** → **Production** (or Internal testing)
4. Click **Create new release**
5. Upload your first AAB manually
6. After this, Azure DevOps can upload automatically

---

## Running the Pipeline

### Manual Trigger:
1. Go to **Pipelines** → Select the mobile pipeline
2. Click **Run pipeline**
3. Choose options:
   - **Build Platform**: `ios`, `android`, or `both`
   - **Submit to Store**: Check to auto-upload after build

### Build Times (Approximate):
- Android: ~10-15 minutes
- iOS: ~15-25 minutes

---

## Pipeline Outputs

After a successful build:
- **Android**: `android-release` artifact containing `.aab` file
- **iOS**: `ios-release` artifact containing `.ipa` file

You can download these from the pipeline run summary.

---

## Troubleshooting

### iOS Signing Errors
- Ensure the provisioning profile matches the bundle ID
- Verify the certificate is not expired
- Check that `APPLE_CERTIFICATE_SIGNING_IDENTITY` matches exactly

### Android Build Errors
- Verify keystore file is uploaded correctly
- Check that key alias matches

### CocoaPods Errors
- Usually resolved by clearing cache: add `--repo-update` flag

### Submission Errors
- Verify service connections are configured correctly
- For Google Play: ensure service account has "Release manager" permission
- For App Store: ensure API key has "App Manager" role

---

## Alternative: Keep Using EAS

If Azure DevOps setup seems complex, the EAS queue is usually faster during off-peak hours (nights/weekends US time). You can also upgrade to EAS Pro ($29/mo) for priority queue.

---

## Files Created

| File | Purpose |
|------|---------|
| `infrastructure/azure-pipelines-gathergrove-mobile.yml` | Main pipeline definition |
| `mobile/ios-export/ExportOptions.plist` | iOS export configuration |
| `mobile/google-service-account.example.json` | Safe placeholder showing the expected Google Play API credential shape |

---

## Cost

Azure DevOps provides **1,800 minutes/month free** for Microsoft-hosted agents.
- Each full build (iOS + Android) uses ~30-40 minutes
- ~45 builds/month included free

Sources:
- [Expo Local Production Builds](https://docs.expo.dev/guides/local-app-production/)
- [Azure Pipelines Xcode Build](https://learn.microsoft.com/en-us/azure/devops/pipelines/ecosystems/xcode)
- [Azure Pipelines Android Build](https://learn.microsoft.com/en-us/azure/devops/pipelines/ecosystems/android)
- [React Native iOS with Azure DevOps](https://medium.com/@pramodyahk/building-a-react-native-ios-app-with-azure-devops-pipeline-688f621ab1d3)
