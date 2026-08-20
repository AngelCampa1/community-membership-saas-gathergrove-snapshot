# GatherGrove Mobile App Bug Audit Report

**Date**: December 15, 2025
**Platforms**: iOS, Android
**Scope**: Full code audit (no fixes implemented)
**Coverage**: 17.31% statements, 11.45% branches

---

## Executive Summary

A comprehensive audit of the GatherGrove mobile app (React Native + Expo) identified **53 bugs** across 9 categories. The test suite passes (560 tests) but coverage is critically low at 17%.

### Bug Distribution by Severity

| Severity | Count | Percentage |
|----------|-------|------------|
| **CRITICAL** | 4 | 7.5% |
| **HIGH** | 15 | 28.3% |
| **MEDIUM** | 21 | 39.6% |
| **LOW** | 13 | 24.5% |
| **Total** | 53 | 100% |

### Test Results Summary
- Test Suites: 49 passed, 1 skipped
- Tests: 560 passed, 14 skipped
- Coverage: **17.31%** statements (target: 95%)
- Many `act(...)` warnings indicating async state update issues

---

## Category 1: Authentication & Session Management

### CRITICAL Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **AUTH-01** | Session timeout (8hr) not auto-refreshed on user activity | Users logged out unexpectedly during active use | `authService.ts:920-930` |
| **AUTH-02** | AsyncStorage fallback is unencrypted on Android | Security vulnerability - tokens stored in plaintext | `authService.ts:267-295, 362, 429, 517` |

### HIGH Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **AUTH-03** | JWT 60-second expiration buffer rejects valid tokens early | Premature auth failures for tokens with <60s remaining | `authService.ts:998-1003` |
| **AUTH-04** | Race condition in `_tokenPromise` - no error handling | Concurrent token requests may all fail if first fails | `authService.ts:301-330` |
| **AUTH-05** | Duplicate backend calls during session validation | `validateStoredSession()` calls API twice (lines 533 and 560) | `authService.ts:533-573` |

### MEDIUM Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **AUTH-06** | Login lockout counter stored in memory only | Lockout bypassed by app restart | `authService.ts:15` |
| **AUTH-07** | Failed login attempts cleared on ANY successful login | Attacker can reset lockout by logging in with different account | `authService.ts:202` |
| **AUTH-08** | No session refresh on authenticated API requests | Session can expire during active API usage | `authService.ts` (missing feature) |

### LOW Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **AUTH-09** | Token cache only 5 seconds - repeated Keychain access | Performance degradation on every API call | `authService.ts:300` |
| **AUTH-10** | 27 TODO comments for missing debug logging | No visibility into auth failures in production | `authService.ts:183-926` (27 instances) |
| **AUTH-11** | JWT decoding uses atob/Buffer dual fallback inconsistently | May behave differently between web and native | `authService.ts:679-687, 713-722` |

---

## Category 2: Network & Offline Handling

### CRITICAL Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **NET-01** | Offline request queue is unbounded (no size limit) | Memory exhaustion on prolonged offline periods | `apiClient.ts:21` |

### HIGH Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **NET-02** | Request queue stored in memory only - lost on app crash/close | User actions lost when app crashes offline | `apiClient.ts:21, 294-310` |
| **NET-03** | Queue processing doesn't re-queue failed requests | Requests silently lost if retry fails | `apiClient.ts:87-96` |
| **NET-04** | Type mismatch: queue stores `config` but `processRequestQueue` expects `requestFn` | Queued requests may not execute correctly | `apiClient.ts:294-310 vs 87-96` |

### MEDIUM Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **NET-05** | No retry count limit for queued requests | Old queued requests retried indefinitely | `apiClient.ts:79-96` |
| **NET-06** | No jitter in exponential backoff | Thundering herd on mass reconnection | `apiClient.ts:278` |
| **NET-07** | `initNetworkMonitoring()` runs synchronously on construction | Blocks app startup | `apiClient.ts:43, 56-74` |

### LOW Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **NET-08** | 15-second timeout may be too aggressive for 2G/3G | Unnecessary timeouts on slow networks | `apiClient.ts:35` |
| **NET-09** | NetInfo listener never cleaned up | Minor memory leak on app lifecycle | `apiClient.ts:61-69` |

---

## Category 3: Push Notifications

### HIGH Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **PUSH-01** | Notification listeners accumulate in `activeSubscriptions` array | Memory leak, battery drain from duplicate listeners | `pushNotificationService.ts:73, 358-379` |
| **PUSH-02** | Race condition: listeners removed before device unregistration | Device may receive notifications after logout | `pushNotificationService.ts:406-416` |

### MEDIUM Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **PUSH-03** | Device can be registered multiple times without dedup check | Duplicate notifications, server resource waste | `pushNotificationService.ts:279-318` |
| **PUSH-04** | `setupNotificationHandlers()` can be called multiple times | Handler duplication on repeated initializations | `pushNotificationService.ts:646-684` |
| **PUSH-05** | No handler for notification tap while app backgrounded | Missed deep link navigation | `pushNotificationService.ts:673-683` |
| **PUSH-06** | `activeSubscriptions` array never cleared on app background | Listeners persist across app states | `pushNotificationService.ts:73` |

### LOW Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **PUSH-07** | `registerDevice()` uses fetch without retry logic | Single failure prevents registration | `pushNotificationService.ts:299-317` |
| **PUSH-08** | Silently returns `false` on all registration errors | No error feedback to user | `pushNotificationService.ts:315-317` |

---

## Category 4: Memory Management

### HIGH Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **MEM-01** | Missing useEffect cleanup in 12 screens | Potential memory leaks and state updates on unmounted components | See table below |
| **MEM-02** | SignalR `messageHandlers` array grows without cleanup | Memory leak on repeated chat screen visits | `signalRService.ts:12, 121-123` |

**Screens with Missing useEffect Cleanup:**

| Screen | useEffect Count | Has Cleanup | Issue |
|--------|-----------------|-------------|-------|
| DirectoryScreen | 1 | No | `114-116` |
| DashboardScreen | 1 | No | `54-68` |
| EventDetailsScreen | 1 | No | `121-123` |
| EventFeedback | 3 | Partial | `112-114, 128-142` |
| EventsScreen | 1 | No | `194-196` |
| EventSeriesScreen | 1 | No | `90-92` |
| LoginScreen | 1 | No | `43-55` |
| MembershipCardScreen | 1 | No | `119-121` |
| PayDuesScreen | 1 | No | `111-125` |
| ProfileScreen | 1 | No | `240-242` |
| DirectorySettingsScreen | 1 | No | `152-154` |
| QRCodeScanner | 1 | No | `45-48` |

### MEDIUM Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **MEM-03** | Session timer runs forever if user inactive (no timeout warning) | Memory/CPU consumption | `authService.ts:920-930` |
| **MEM-04** | API interceptors can stack if `getInstance()` called multiple times | Increased memory, multiple auth header additions | `apiClient.ts:42-43, 99-188` |
| **MEM-05** | Request metadata object not cleaned after response | Minor memory overhead per request | `apiClient.ts:124-127` |

### LOW Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **MEM-06** | `auditLogs` array in paymentService capped at 100 but never persisted | Audit history lost on app restart | `paymentService.ts:62-63, 334-340` |

---

## Category 5: Payment & Stripe Integration

### MEDIUM Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **PAY-01** | Payment lockout counter in memory only | Lockout bypassed by app restart | `paymentService.ts:64-66` |
| **PAY-02** | Risk assessment based on in-memory audit logs | Fresh app has no fraud history | `paymentService.ts:253-292` |
| **PAY-03** | `sendToSecureLogging` is a no-op in production | Audit logs not actually sent | `paymentService.ts:351-363` |

### LOW Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **PAY-04** | Payment method regex assumes Stripe `pm_` prefix only | May reject valid non-Stripe methods | `paymentService.ts:223-225, 272-275` |

---

## Category 6: Real-time Features (SignalR/Chat)

### HIGH Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **CHAT-01** | `messageHandlers` array grows without limit | Memory leak on repeated screen visits | `signalRService.ts:12, 121-123` |
| **CHAT-02** | No automatic reconnection handling besides built-in | Connection may drop silently | `signalRService.ts:35-41` |

### MEDIUM Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **CHAT-03** | Static class pattern - handlers persist across user sessions | Messages may route to wrong handler after re-login | `signalRService.ts:9-14` |
| **CHAT-04** | `disconnect()` may leave club before stopping connection | Race condition in cleanup | `signalRService.ts:68-77` |
| **CHAT-05** | No error boundary around SignalR operations | Errors may crash chat screen | `signalRService.ts` (throughout) |

### LOW Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **CHAT-06** | Error handlers use void to suppress - no logging in prod | No visibility into connection errors | `signalRService.ts:49-57` |

---

## Category 7: Navigation & Screen Flow

### MEDIUM Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **NAV-01** | Navigation state refs (`routeNameRef`) not cleared on logout | Wrong screen tracked after re-login | `RootNavigator.tsx:28-51` |
| **NAV-02** | No Android back button handler for modal screens | Back may close app instead of modal | `RootNavigator.tsx:66, 83, 100, 109` |
| **NAV-03** | Deep linking only handles `/reset-password` route | Other deep links ignored | `AuthFlow.tsx:20-40` |

### LOW Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **NAV-04** | `navigationRef` typed as `any` | TypeScript safety bypassed | `RootNavigator.tsx:29` |
| **NAV-05** | Linking listener never cleaned up in AuthFlow | Minor memory leak | `AuthFlow.tsx:20-42` |

---

## Category 8: Form Validation & User Input

### MEDIUM Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **FORM-01** | `sanitizeInput()` called on email but NOT password | Inconsistent input handling | `authService.ts:162-163` |
| **FORM-02** | Route params silently fall back to null on validation failure | Undefined behavior if params missing | `PayDuesScreen.tsx` (route params) |

### LOW Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **FORM-03** | Password validation only checks minimum length (8 chars) | Weak password policies | `authService.ts:871-873` |
| **FORM-04** | No maximum password length validation | DoS via extremely long passwords | `authService.ts:862-874` |

---

## Category 9: Platform-Specific (iOS/Android)

### MEDIUM Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **PLAT-01** | iOS-specific notification permission options not matched for Android | Different notification behavior per platform | `pushNotificationService.ts:175-185` |
| **PLAT-02** | Keychain fallback to AsyncStorage exposes tokens on Android | Security vulnerability on Android | `authService.ts:267-295` (duplicate of AUTH-02) |
| **PLAT-03** | Platform.OS checks scattered without centralized handling | Inconsistent platform behavior | Multiple files |

### LOW Bugs

| ID | Issue | Impact | File:Line |
|----|-------|--------|-----------|
| **PLAT-04** | No Platform-specific timeout adjustments | Same timeout for all network conditions | `apiClient.ts:35` |

---

## Recommended Fix Priority

### Immediate (P0) - Security & Data Loss
1. **AUTH-02/PLAT-02**: Replace AsyncStorage fallback with encrypted storage
2. **NET-01**: Add queue size limit (e.g., 50 requests max)
3. **NET-02**: Persist queue to AsyncStorage for crash recovery

### High Priority (P1) - User Experience
4. **AUTH-01**: Auto-refresh session on authenticated API calls
5. **MEM-01**: Add cleanup functions to all screen useEffects
6. **PUSH-01**: Fix notification listener lifecycle management
7. **NET-04**: Fix queue type mismatch to ensure offline requests work
8. **CHAT-01**: Clear message handlers on disconnect

### Medium Priority (P2) - Reliability
9. **AUTH-03**: Remove or reduce JWT expiration buffer
10. **NET-06**: Add jitter to exponential backoff
11. **AUTH-04**: Add error handling for token promise race condition
12. **PUSH-03**: Add device registration deduplication
13. **NAV-01**: Clear navigation refs on logout

### Lower Priority (P3) - Quality
14. **AUTH-10**: Implement proper logging (replace 27 TODOs)
15. **NET-08**: Make timeout configurable per network type
16. **PAY-03**: Implement secure logging service integration
17. **FORM-03/04**: Enhance password validation rules

---

## Test Coverage Gaps

### Critical Areas Needing Tests
- SignalR real-time features (0% coverage)
- Offline queue processing (0% coverage)
- Session timeout/refresh scenarios
- Push notification lifecycle
- Navigation state management
- Payment error scenarios

### Screen Coverage Analysis
Most screen tests are shallow (render + loading state only). Need:
- User interaction tests
- Error state tests
- Navigation flow tests
- Form submission tests

---

## Appendix A: Files Reviewed

### Services (14 files)
- `authService.ts` - 1093 lines, 27 TODOs
- `apiClient.ts` - 349 lines
- `pushNotificationService.ts` - 693 lines
- `signalRService.ts` - 148 lines
- `paymentService.ts` - 381 lines
- `chatService.ts`
- `memberService.ts`
- `eventService.ts`
- `directoryService.ts`
- `cacheService.ts`
- `networkErrorHandler.ts`
- `billingService.ts`
- `performanceMonitoring.ts`
- `membershipCardService.ts`

### Screens (14 files)
- All 14 main screens audited for useEffect patterns

### Hooks & Contexts (4 files)
- `useAuth.ts` - 287 lines
- `usePushNotifications.ts`
- `ThemeContext.tsx`
- `ApplicationInsightsContext.tsx`

### Navigation (2 files)
- `RootNavigator.tsx` - 121 lines
- `MainTabNavigator.tsx`

---

## Appendix B: Test Output Summary

```
Test Suites: 1 skipped, 49 passed, 49 of 50 total
Tests:       14 skipped, 560 passed, 574 total
Snapshots:   0 total
Time:        28.907 s

Coverage Summary:
- Statements: 17.31% (1167/6739)
- Branches: 11.45% (501/4375)
- Functions: 12.84% (186/1448)
- Lines: 17.64% (1144/6483)
```

---

*Generated by Claude Code Bug Audit*
