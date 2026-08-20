# SSO Architecture & Flow Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          GatherGrove SSO System                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Web Client     │      │  Mobile Client   │      │  Backend API     │
│   (Next.js 15)   │      │  (React Native)  │      │  (.NET 9.0)      │
│                  │      │                  │      │                  │
│  ┌────────────┐  │      │  ┌────────────┐  │      │  ┌────────────┐  │
│  │ SSO Buttons│  │      │  │ SSO Service│  │      │  │   Auth     │  │
│  │ Component  │  │      │  │            │  │      │  │ Controller │  │
│  └─────┬──────┘  │      │  └─────┬──────┘  │      │  └─────┬──────┘  │
│        │         │      │        │         │      │        │         │
│        ▼         │      │        ▼         │      │        ▼         │
│  ┌────────────┐  │      │  ┌────────────┐  │      │  ┌────────────┐  │
│  │   Auth     │  │      │  │   Auth     │  │      │  │  External  │  │
│  │  Service   │  │      │  │  Service   │  │      │  │   Auth     │  │
│  └────────────┘  │      │  └────────────┘  │      │  │  Service   │  │
└────────┬─────────┘      └────────┬─────────┘      │  └─────┬──────┘  │
         │                         │                │        │         │
         │                         │                │        ▼         │
         │                         │                │  ┌────────────┐  │
         └─────────────────────────┼────────────────┼─▶│   Token    │  │
                                   │                │  │ Validators │  │
                                   │                │  └─────┬──────┘  │
                                   │                │        │         │
                                   │                │        ▼         │
                                   │                │  ┌────────────┐  │
                                   └────────────────┼─▶│ Database   │  │
                                                    │  └────────────┘  │
                                                    └──────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                        External Providers                             │
└──────────────────────────────────────────────────────────────────────┘

      ┌─────────────────┐              ┌─────────────────┐
      │  Google OAuth   │              │  Apple Sign-In  │
      │                 │              │                 │
      │  Client IDs:    │              │  Service ID:    │
      │  - Web          │              │  club.gather    │
      │  - iOS          │              │    grove.service│
      │  - Android      │              │                 │
      └─────────────────┘              └─────────────────┘
```

---

## Google Sign-In Flow (Web)

```
┌─────────┐                ┌──────────┐                ┌────────────┐              ┌──────────┐
│  User   │                │ Frontend │                │  Backend   │              │  Google  │
└────┬────┘                └────┬─────┘                └─────┬──────┘              └────┬─────┘
     │                          │                            │                          │
     │  Click "Sign in          │                            │                          │
     │  with Google"            │                            │                          │
     ├─────────────────────────▶│                            │                          │
     │                          │                            │                          │
     │                          │  Open Google OAuth popup   │                          │
     │                          │  (Implicit Flow)           │                          │
     │                          ├───────────────────────────────────────────────────────▶│
     │                          │                            │                          │
     │                          │       User authorizes      │                          │
     │                          │◀───────────────────────────────────────────────────────┤
     │                          │                            │                          │
     │                          │  Receive ID Token          │                          │
     │                          │                            │                          │
     │                          │  POST /api/v1/auth/google  │                          │
     │                          │  { idToken, platform }     │                          │
     │                          ├───────────────────────────▶│                          │
     │                          │                            │                          │
     │                          │                            │  Validate token          │
     │                          │                            │  with Google API         │
     │                          │                            ├─────────────────────────▶│
     │                          │                            │                          │
     │                          │                            │  Token payload           │
     │                          │                            │  (sub, email, name)      │
     │                          │                            │◀─────────────────────────┤
     │                          │                            │                          │
     │                          │                            │  Check if user exists    │
     │                          │                            │  by provider ID or email │
     │                          │                            ├───┐                      │
     │                          │                            │   │ Database             │
     │                          │                            │◀──┘ lookup               │
     │                          │                            │                          │
     │                          │                            │  Create/update user      │
     │                          │                            │  Link provider           │
     │                          │                            │  Generate JWT token      │
     │                          │                            ├───┐                      │
     │                          │                            │   │                      │
     │                          │                            │◀──┘                      │
     │                          │                            │                          │
     │                          │  User data + JWT token     │                          │
     │                          │◀───────────────────────────┤                          │
     │                          │                            │                          │
     │                          │  Store token, redirect     │                          │
     │                          │  to dashboard              │                          │
     │  Authenticated!          │                            │                          │
     │◀─────────────────────────┤                            │                          │
     │                          │                            │                          │
```

---

## Apple Sign-In Flow (Web)

```
┌─────────┐                ┌──────────┐                ┌────────────┐              ┌──────────┐
│  User   │                │ Frontend │                │  Backend   │              │  Apple   │
└────┬────┘                └────┬─────┘                └─────┬──────┘              └────┬─────┘
     │                          │                            │                          │
     │  Click "Sign in          │                            │                          │
     │  with Apple"             │                            │                          │
     ├─────────────────────────▶│                            │                          │
     │                          │                            │                          │
     │                          │  Generate nonce + state    │                          │
     │                          │  (crypto.randomUUID)       │                          │
     │                          ├───┐                        │                          │
     │                          │   │                        │                          │
     │                          │◀──┘                        │                          │
     │                          │                            │                          │
     │                          │  Open Apple Sign-In popup  │                          │
     │                          │  with nonce                │                          │
     │                          ├───────────────────────────────────────────────────────▶│
     │                          │                            │                          │
     │                          │       User authorizes      │                          │
     │                          │       (Face ID/Touch ID)   │                          │
     │                          │◀───────────────────────────────────────────────────────┤
     │                          │                            │                          │
     │                          │  Receive ID Token + nonce  │                          │
     │                          │                            │                          │
     │                          │  POST /api/v1/auth/apple   │                          │
     │                          │  { idToken, platform,      │                          │
     │                          │    nonce, fullName }       │                          │
     │                          ├───────────────────────────▶│                          │
     │                          │                            │                          │
     │                          │                            │  Fetch Apple's           │
     │                          │                            │  public keys (JWKS)      │
     │                          │                            ├─────────────────────────▶│
     │                          │                            │                          │
     │                          │                            │  Public keys             │
     │                          │                            │◀─────────────────────────┤
     │                          │                            │                          │
     │                          │                            │  Validate token with RSA │
     │                          │                            │  Verify nonce matches    │
     │                          │                            │  (replay protection)     │
     │                          │                            ├───┐                      │
     │                          │                            │   │                      │
     │                          │                            │◀──┘                      │
     │                          │                            │                          │
     │                          │                            │  Check if user exists    │
     │                          │                            │  Create/update user      │
     │                          │                            │  Link provider           │
     │                          │                            │  Generate JWT token      │
     │                          │                            ├───┐                      │
     │                          │                            │   │                      │
     │                          │                            │◀──┘                      │
     │                          │                            │                          │
     │                          │  User data + JWT token     │                          │
     │                          │◀───────────────────────────┤                          │
     │                          │                            │                          │
     │                          │  Store token, redirect     │                          │
     │  Authenticated!          │                            │                          │
     │◀─────────────────────────┤                            │                          │
     │                          │                            │                          │
```

---

## Mobile Google Sign-In Flow (iOS/Android)

```
┌─────────┐            ┌──────────┐            ┌────────────┐            ┌──────────┐
│  User   │            │  Mobile  │            │  Backend   │            │  Google  │
│         │            │   App    │            │    API     │            │  OAuth   │
└────┬────┘            └────┬─────┘            └─────┬──────┘            └────┬─────┘
     │                      │                        │                        │
     │  Tap "Sign in        │                        │                        │
     │  with Google"        │                        │                        │
     ├─────────────────────▶│                        │                        │
     │                      │                        │                        │
     │                      │  Call Google Sign-In   │                        │
     │                      │  SDK (native)          │                        │
     │                      ├───────────────────────────────────────────────▶ │
     │                      │                        │                        │
     │  Google account      │                        │                        │
     │  picker modal        │                        │                        │
     │◀─────────────────────┤                        │                        │
     │                      │                        │                        │
     │  Select account      │                        │                        │
     ├─────────────────────▶│                        │                        │
     │                      │                        │                        │
     │                      │  Receive ID token      │                        │
     │                      │  + user info           │                        │
     │                      │◀───────────────────────────────────────────────┤
     │                      │                        │                        │
     │                      │  POST /api/v1/auth/    │                        │
     │                      │  google                │                        │
     │                      │  { idToken, platform } │                        │
     │                      ├───────────────────────▶│                        │
     │                      │                        │                        │
     │                      │                        │  Validate token        │
     │                      │                        │  Check platform        │
     │                      │                        │  client ID             │
     │                      │                        ├───┐                    │
     │                      │                        │   │                    │
     │                      │                        │◀──┘                    │
     │                      │                        │                        │
     │                      │                        │  Create/update user    │
     │                      │                        │  Link provider         │
     │                      │                        │  Generate JWT          │
     │                      │                        ├───┐                    │
     │                      │                        │   │                    │
     │                      │                        │◀──┘                    │
     │                      │                        │                        │
     │                      │  User data + JWT token │                        │
     │                      │◀───────────────────────┤                        │
     │                      │                        │                        │
     │                      │  Store in Keychain     │                        │
     │                      │  (iOS) or Encrypted    │                        │
     │                      │  Storage (Android)     │                        │
     │                      ├───┐                    │                        │
     │                      │   │                    │                        │
     │                      │◀──┘                    │                        │
     │                      │                        │                        │
     │  Navigate to app     │                        │                        │
     │◀─────────────────────┤                        │                        │
     │                      │                        │                        │
```

**Note**: The mobile flow uses native Google Sign-In SDK which requires Firebase config files:
- **iOS**: `GoogleService-Info.plist`
- **Android**: `google-services.json`

---

## Mobile Apple Sign-In Flow (iOS Only)

```
┌─────────┐            ┌──────────┐            ┌────────────┐            ┌──────────┐
│  User   │            │  Mobile  │            │  Backend   │            │  Apple   │
│  (iOS)  │            │   App    │            │    API     │            │  ID      │
└────┬────┘            └────┬─────┘            └─────┬──────┘            └────┬─────┘
     │                      │                        │                        │
     │  Tap "Sign in        │                        │                        │
     │  with Apple"         │                        │                        │
     ├─────────────────────▶│                        │                        │
     │                      │                        │                        │
     │                      │  Call Apple Sign-In    │                        │
     │                      │  (expo-apple-auth)     │                        │
     │                      ├───────────────────────────────────────────────▶ │
     │                      │                        │                        │
     │  Face ID/Touch ID    │                        │                        │
     │  prompt              │                        │                        │
     │◀─────────────────────┤                        │                        │
     │                      │                        │                        │
     │  Authorize           │                        │                        │
     ├─────────────────────▶│                        │                        │
     │                      │                        │                        │
     │                      │  Receive identity      │                        │
     │                      │  token + user info     │                        │
     │                      │◀───────────────────────────────────────────────┤
     │                      │                        │                        │
     │                      │  POST /api/v1/auth/    │                        │
     │                      │  apple                 │                        │
     │                      │  { idToken, fullName,  │                        │
     │                      │    platform: 'ios' }   │                        │
     │                      ├───────────────────────▶│                        │
     │                      │                        │                        │
     │                      │                        │  Fetch Apple public    │
     │                      │                        │  keys (JWKS)           │
     │                      │                        ├───────────────────────▶│
     │                      │                        │                        │
     │                      │                        │  Public keys           │
     │                      │                        │◀───────────────────────┤
     │                      │                        │                        │
     │                      │                        │  Validate token        │
     │                      │                        │  Verify signature      │
     │                      │                        ├───┐                    │
     │                      │                        │   │                    │
     │                      │                        │◀──┘                    │
     │                      │                        │                        │
     │                      │                        │  Create/update user    │
     │                      │                        │  Link provider         │
     │                      │                        │  Generate JWT          │
     │                      │                        ├───┐                    │
     │                      │                        │   │                    │
     │                      │                        │◀──┘                    │
     │                      │                        │                        │
     │                      │  User data + JWT token │                        │
     │                      │◀───────────────────────┤                        │
     │                      │                        │                        │
     │                      │  Store in Keychain     │                        │
     │                      ├───┐                    │                        │
     │                      │   │                    │                        │
     │                      │◀──┘                    │                        │
     │                      │                        │                        │
     │  Navigate to app     │                        │                        │
     │◀─────────────────────┤                        │                        │
     │                      │                        │                        │
```

---

## Security Features

### Token Validation (Backend)

```
┌─────────────────────────────────────────────────────────────┐
│                   Token Validation Process                   │
└─────────────────────────────────────────────────────────────┘

                  ┌────────────────────┐
                  │   Receive Token    │
                  │   from Frontend    │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
          ┌───────│  Google or Apple?  │───────┐
          │       └────────────────────┘       │
          │                                    │
          ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐
│  Google Validator    │          │   Apple Validator    │
└──────────┬───────────┘          └──────────┬───────────┘
           │                                 │
           ▼                                 ▼
┌──────────────────────┐          ┌──────────────────────┐
│ Call Google API      │          │ Fetch Apple JWKS     │
│ ValidateAsync()      │          │ (cached 24h)         │
└──────────┬───────────┘          └──────────┬───────────┘
           │                                 │
           ▼                                 ▼
┌──────────────────────┐          ┌──────────────────────┐
│ Verify:              │          │ Verify:              │
│ ✓ Signature          │          │ ✓ Signature (RSA)    │
│ ✓ Issuer (Google)    │          │ ✓ Issuer (Apple)     │
│ ✓ Audience (ClientID)│          │ ✓ Audience (ServiceID│
│ ✓ Expiry             │          │ ✓ Expiry             │
│ ✓ Email verified     │          │ ✓ Nonce (if provided)│
└──────────┬───────────┘          └──────────┬───────────┘
           │                                 │
           └──────────┬──────────────────────┘
                      │
                      ▼
           ┌────────────────────┐
           │   Extract Claims   │
           │   - sub (user ID)  │
           │   - email          │
           │   - name           │
           └─────────┬──────────┘
                     │
                     ▼
           ┌────────────────────┐
           │  Database Lookup   │
           │  - Existing user?  │
           │  - Provider linked?│
           └─────────┬──────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   User Action:        │
         │                       │
         │ • New user → Create   │
         │ • Exists → Auto-link  │
         │ • Linked → Update     │
         └───────────┬───────────┘
                     │
                     ▼
           ┌────────────────────┐
           │  Generate JWT Token│
           │  Return to client  │
           └────────────────────┘
```

### Nonce Validation (Apple)

```
Frontend:
1. Generate nonce: crypto.randomUUID()
   Example: "550e8400-e29b-41d4-a716-446655440000"

2. Include nonce in Apple Sign-In request
   AppleAuthProvider.request({ nonce })

3. Send token + nonce to backend
   POST /api/v1/auth/apple { idToken, nonce }

Backend:
4. Extract nonce from token claims
   var nonceInToken = payload.Claims.FirstOrDefault(c => c.Type == "nonce")

5. Compare with provided nonce
   if (nonceInToken != providedNonce) throw InvalidTokenException

6. Accept token only if nonces match
   ✓ Prevents replay attacks
   ✓ Ensures token was issued for this specific request
```

---

## Database Schema

### ExternalAuthProvider Table

```sql
CREATE TABLE ExternalAuthProviders (
    Id INT PRIMARY KEY IDENTITY,
    UserId INT NOT NULL,
    Provider VARCHAR(50) NOT NULL,              -- "Google" or "Apple"
    ProviderUserId VARCHAR(255) NOT NULL,       -- "sub" claim from token
    ProviderEmail VARCHAR(255),                 -- Email from provider
    EmailVerifiedAtLinking BIT NOT NULL,        -- Was email verified by provider?
    LinkedAt DATETIME2 NOT NULL,                -- When was provider linked?
    LastUsedAt DATETIME2 NOT NULL,              -- Last SSO login timestamp

    CONSTRAINT FK_User FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT UQ_Provider UNIQUE (Provider, ProviderUserId)
);

-- Indexes for performance
CREATE INDEX IX_UserId ON ExternalAuthProviders(UserId);
CREATE INDEX IX_ProviderEmail ON ExternalAuthProviders(ProviderEmail);
```

### User Scenarios

**Scenario 1: New User (First SSO Sign-In)**
```
1. User signs in with Google
2. No existing provider link found
3. No existing user with that email
4. Backend creates:
   - New User record
   - New ExternalAuthProvider record
5. Returns: isNewUser: true, wasLinked: false
```

**Scenario 2: Existing User (Auto-Link)**
```
1. User signs in with Google (email: john@example.com)
2. No provider link for Google
3. User exists with email john@example.com (created via password)
4. Email is verified by Google (emailVerifiedAtLinking: true)
5. Backend auto-links:
   - Creates ExternalAuthProvider record
   - Links to existing User
6. Returns: isNewUser: false, wasLinked: true
```

**Scenario 3: Returning SSO User**
```
1. User signs in with Google
2. Provider link exists for this Google account
3. Backend updates:
   - ExternalAuthProvider.LastUsedAt = now
4. Returns: isNewUser: false, wasLinked: false
```

**Scenario 4: Multiple Providers (Same User)**
```
User can have multiple ExternalAuthProvider records:
- Google: linked 2024-01-01
- Apple: linked 2024-06-15

User can sign in with either provider → same account
```

---

## Configuration Reference

### Environment Variables by Platform

| Platform | Variable | Location | Purpose |
|----------|----------|----------|---------|
| **Web** | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `client/.env.local` | Google OAuth Web Client ID |
| **Web** | `NEXT_PUBLIC_APPLE_CLIENT_ID` | `client/.env.local` | Apple Services ID |
| **Backend** | `OAuth:Google:WebClientId` | `appsettings.json` | Validate Google web tokens |
| **Backend** | `OAuth:Google:IosClientId` | `appsettings.json` | Validate Google iOS tokens |
| **Backend** | `OAuth:Google:AndroidClientId` | `appsettings.json` | Validate Google Android tokens |
| **Backend** | `OAuth:Apple:ServiceId` | `appsettings.json` | Validate Apple tokens |
| **Mobile** | `extra.sso.googleWebClientId` | `app.config.ts` | Backend validation |
| **Mobile** | `extra.sso.googleIosClientId` | `app.config.ts` | iOS native SDK |
| **Mobile** | `extra.sso.googleAndroidClientId` | `app.config.ts` | Android native SDK |

### Required Files

| Platform | File | Location | Source |
|----------|------|----------|--------|
| **iOS** | `GoogleService-Info.plist` | `mobile/` | Firebase Console |
| **Android** | `google-services.json` | `mobile/` | Firebase Console |

---

## Common Pitfalls & Solutions

### 1. Token Validation Fails

**Problem**: Backend rejects token even though frontend receives it successfully.

**Causes**:
- Clock skew between client/server/provider
- Token expired (Google: 1 hour, Apple: ~10 minutes)
- Wrong client ID configured in backend
- Platform mismatch (sent iOS token but backend validates for web)

**Solution**:
```csharp
// Backend already handles this correctly:
- Validates against correct platform client ID
- Checks token expiry
- Verifies issuer matches provider
```

### 2. Auto-Linking Security

**Problem**: What if someone creates account with email they don't own, then SSO user tries to sign in?

**Solution**:
```csharp
// Backend checks EmailVerifiedAtLinking:
if (user.PasswordHash != null && !existingUser.EmailVerified)
{
    // Don't auto-link to unverified password accounts
    throw new UnauthorizedAccessException(
        "Email already registered. Please verify your email first.");
}
```

### 3. Apple Private Relay

**Problem**: Apple users can hide their email using Private Relay (relay@privaterelay.appleid.com).

**Handled**:
```csharp
// Backend stores ProviderEmail separately
// Real email may be private relay
// User can still be identified by ProviderUserId (sub claim)
```

### 4. Name Availability (Apple)

**Problem**: Apple only provides `fullName` on FIRST sign-in, not subsequent logins.

**Solution**:
```typescript
// Frontend sends fullName with token
// Backend uses it if provided, otherwise keeps existing name
if (!string.IsNullOrEmpty(request.FullName) && user.FullName != request.FullName)
{
    user.FullName = request.FullName;
}
```

---

## Performance Optimizations

### 1. Apple JWKS Caching

```csharp
// AppleTokenValidator.cs caches Apple's public keys for 24 hours
private static readonly MemoryCache _keysCache = new(new MemoryCacheOptions());
private const int CacheExpirationHours = 24;

// Prevents repeated API calls to Apple for every token validation
```

### 2. Database Indexes

```sql
-- Fast lookups for SSO authentication
CREATE INDEX IX_Provider_ProviderUserId
ON ExternalAuthProviders(Provider, ProviderUserId);

CREATE INDEX IX_ProviderEmail
ON ExternalAuthProviders(ProviderEmail);
```

### 3. Async Token Validation

```csharp
// Both validators use async methods
await GoogleJsonWebSignature.ValidateAsync(idToken);
await httpClient.GetFromJsonAsync<AppleKeysResponse>(AppleKeysUrl);

// Doesn't block request thread while waiting for external API
```

---

**Summary**: Your SSO system is production-ready with enterprise-grade security, proper token validation, auto-linking, and comprehensive error handling. Just add the configuration files and you're set! 🚀
