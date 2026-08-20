# Mobile Coverage Campaign Bug Log (December 2024)

> Archived from CLAUDE.md on January 2026

**Campaign Goal**: Improve mobile test coverage from 38.68% to 90%
**Total Bugs Found**: 30 (4 Critical, 10 High, 16 Medium)
**Status**: All Fixed

---

## Critical Bugs (4)

| # | Bug | File | Description | Commit |
|---|-----|------|-------------|--------|
| 1 | PerformanceMonitor stale closure | `PerformanceMonitor.tsx` | Callbacks captured stale state, metrics not accumulating | 5ac58283 |
| 2 | pushNotificationService global mock | `jest.mobile-mocks.js` | Mock in test file violated global isolation | 241d6023 |
| 3 | eventService internal mock | `eventService.test.ts` | Tests mocked the service being tested | 84bdf9e8 |
| 4 | networkErrorHandler internal mock | `networkErrorHandler.test.ts` | Tests mocked the handler being tested | 947cb322 |

---

## High Severity Bugs (10)

| # | Bug | File | Description | Commit |
|---|-----|------|-------------|--------|
| 5 | PerformanceMonitor infinite loop | `PerformanceMonitor.tsx` | useEffect dependencies caused re-render loop | 5ac58283 |
| 6 | PerformanceMonitor window access | `PerformanceMonitor.test.tsx` | Direct window access in RN environment | 5ac58283 |
| 7 | pushNotificationService AppState mock | `jest.mobile-mocks.js` | AppState mock missing in global setup | fdf4bd79 |
| 8 | QRCodeScanner internal mocks | `QRCodeScanner.test.tsx` | Internal dependencies mocked | 47e06fc6 |
| 9 | fireEvent.press compatibility | `EventDetailsScreen.test.tsx` | Event handler not triggering | 6af5e1b1 |
| 10 | NotificationPreferences duplicate mock | `NotificationPreferences.test.tsx` | Conflicting mock definitions | 85312614 |
| 11 | useAuth hook override bug | `jest.mobile-mocks.js` | Hook mock not properly resetting | 2c58f73b |
| 12 | useAuth mock reset bug | `jest.testing-library-setup.js` | State persisting between tests | 2c58f73b |
| 13 | FinancialExportDialog export bug | `FinancialExportDialog.test.tsx` | Named export not matching | 4ede3969 |
| 14 | __DEV__ deletion bug | `PerformanceMonitor.test.tsx` | Global deleted in afterEach | 5ac58283 |

---

## Medium Severity Bugs (16)

| # | Bug | File | Description | Commit |
|---|-----|------|-------------|--------|
| 15 | PerformanceMonitor document mocking | `PerformanceMonitor.test.tsx` | Missing JSDOM setup | 5ac58283 |
| 16 | JWT token format | `pushNotificationService.test.ts` | Invalid token structure | 219800d0 |
| 17 | AccessibilityProvider matchMedia | `AccessibilityProvider.test.tsx` | Missing window.matchMedia | f4889596 |
| 18 | AccessibilityProvider platform detection | `AccessibilityProvider.test.tsx` | Platform.OS not mocked | f4889596 |
| 19 | fireEvent.press NotificationPreferences | `NotificationPreferences.test.tsx` | Press events not propagating | 85312614 |
| 20 | LoginScreen fireEvent issues | `LoginScreen.test.tsx` | Button press not triggering | 1b886c10 |
| 21 | EventDetailsScreen testID query | `EventDetailsScreen.test.tsx` | testID selector not finding element | 5215d0ba |
| 22 | Missing Google Sign-In mock | `jest.config.js` | Package not mocked | 2c58f73b |
| 23 | Missing Apple auth mock | `jest.config.js` | Package not mocked | 2c58f73b |
| 24 | Share API missing | `react-native.js` mock | Share not in RN mock | 2c58f73b |
| 25 | Linking API ternary check | `react-native.js` mock | canOpenURL returning wrong type | 2c58f73b |
| 26 | Firebase analytics type bug | `testData.ts` | Type mismatch in mock | 2c58f73b |
| 27 | EventsScreen mock setup | `EventsScreen.test.tsx` | Incorrect mock structure | 1b886c10 |
| 28 | WaitlistStatus mock | `WaitlistStatus.test.tsx` | Props not matching component | 1b886c10 |
| 29 | EditProfileScreen mock data | `EditProfileScreen.test.tsx` | Missing required fields | 1b886c10 |
| 30 | Duplicate expo-notifications mock | `NotificationPreferences.test.tsx` | Conflicting module mocks | 85312614 |

---

## Coverage Impact

| Metric | Before Campaign | After Fixes |
|--------|-----------------|-------------|
| Overall Mobile Coverage | 38.68% | ~70%+ |
| Services Coverage | 40-55% | 75-85% |
| Critical Bugs Fixed | - | 4 |
| High Bugs Fixed | - | 10 |
| Medium Bugs Fixed | - | 16 |

---

## Common Bug Patterns Discovered

| Pattern | Issue | Fix |
|---------|-------|-----|
| `@jest/globals` import | Hoisting conflicts with jest.mock | Remove import, use global jest |
| MSW `server.use()` | Axios integration issues | Convert to `jest.mock('../apiClient')` |
| `mockGetBillingStatus` before init | Variable hoisting | Define mock inside jest.mock factory |
| `expect(true).toBe(true)` | Placeholder tests with no coverage | Replace with actual assertions |
| `logger.api is not a function` | Missing logger mock method | Add complete logger mock |
| Internal service mocks | Tests only test mocks, not real code | Use `jest.isolateModules()` pattern |
| Stale closures in React | Callbacks capture old state | Use refs or functional updates |
| Global mock violations | Mocks affect other test files | Move to global setup or isolate |
