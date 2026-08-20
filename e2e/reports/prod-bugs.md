# GatherGrove Production UI/UX Bug Report

**Date:** 2025-12-10
**Tested URL:** https://gathergrove.club
**Browser:** Chrome (via Playwright MCP)
**Tester:** Claude Code

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 4 |
| Medium | 3 |
| Low | 2 |
| **Total** | **10** |

---

## Critical Bugs

### BUG-001: CORS Error on Marketing Analytics Endpoint
- **Category:** API / Performance
- **Severity:** Critical
- **Page:** All pages (homepage, etc.)
- **Steps to Reproduce:**
  1. Navigate to https://gathergrove.club
  2. Open browser console (F12)
  3. Observe network errors
- **Expected:** API calls should succeed without CORS errors
- **Actual:** `Access to XMLHttpRequest at 'https://api.gathergrove.club/api/v1/marketing/analytics' from origin 'https://gathergrove.club' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`
- **Impact:** Marketing analytics data not being collected; potential loss of user behavior data
- **Screenshot:** Console errors visible in browser dev tools

---

## High Severity Bugs

### BUG-002: Google Sign-In Button Displays in Spanish
- **Category:** Localization / UI
- **Severity:** High
- **Page:** /login
- **Steps to Reproduce:**
  1. Navigate to https://gathergrove.club/login
  2. Observe the Google Sign-In button text
- **Expected:** Button should display "Sign in with Google" (English)
- **Actual:** Button displays "Acceder con Google" (Spanish)
- **Impact:** Inconsistent language experience; confuses English-speaking users
- **Screenshot:** login-page.png
- **Root Cause:** Google Sign-In iframe likely detecting browser/system locale incorrectly or missing locale configuration

### BUG-003: Pricing Navigation Button Scrolls to Wrong Section
- **Category:** Navigation
- **Severity:** High
- **Page:** Homepage (/)
- **Steps to Reproduce:**
  1. Navigate to https://gathergrove.club
  2. Click "Pricing" button in the header navigation
  3. Observe where the page scrolls
- **Expected:** Page should scroll to the Pricing section showing plan options
- **Actual:** Page scrolls to "Beautiful Mobile Experience" section instead of Pricing
- **Impact:** Users cannot easily navigate to pricing information; affects conversion
- **Screenshot:** pricing-section.png

### BUG-004: 404 Page Missing Navigation and Branding
- **Category:** UX / Navigation
- **Severity:** High
- **Page:** Any non-existent URL (e.g., /nonexistent-page)
- **Steps to Reproduce:**
  1. Navigate to https://gathergrove.club/nonexistent-page-12345
  2. Observe the 404 error page
- **Expected:** 404 page should include:
  - GatherGrove branding/logo
  - Navigation menu or at least a "Back to Home" link
  - Helpful suggestions or search functionality
- **Actual:** Page shows only "404 | This page could not be found." with no navigation, no branding, and no way to return to the site
- **Impact:** Users are stranded with no way to navigate back; poor user experience; potential loss of users
- **Screenshot:** 404-page.png

### BUG-005: Login Form Validation Error Persists After Input
- **Category:** Form / Validation
- **Severity:** High
- **Page:** /login
- **Steps to Reproduce:**
  1. Navigate to https://gathergrove.club/login
  2. Click "Sign In" without entering any data (triggers validation)
  3. Enter a password in the password field
  4. Observe the validation error
- **Expected:** "Password is required" error should disappear once password is entered
- **Actual:** "Password is required" error continues to display even after entering a password
- **Impact:** Confusing user experience; users may think their input wasn't registered
- **Screenshot:** login-validation-bug.png

---

## Medium Severity Bugs

### BUG-006: Application Insights Tracking Failing
- **Category:** Monitoring / Analytics
- **Severity:** Medium
- **Page:** All pages
- **Steps to Reproduce:**
  1. Navigate to any page on the site
  2. Open browser console
  3. Observe network requests to Application Insights
- **Expected:** Tracking requests should succeed (200 status)
- **Actual:** Requests to `https://eastus-8.in.applicationinsights.azure.com/v2/track` return 400 status
- **Impact:** Loss of application telemetry and monitoring data
- **Console Message:** `Failed to load resource: the server responded with a status of 400`

### BUG-007: Google Sign-In Button Width Warning
- **Category:** UI / Console Warning
- **Severity:** Medium
- **Page:** /login
- **Steps to Reproduce:**
  1. Navigate to https://gathergrove.club/login
  2. Open browser console
- **Expected:** No console warnings
- **Actual:** Console shows: `[GSI_LOGGER]: Provided button width is invalid: 100%`
- **Impact:** Google Sign-In button may not render at optimal size; indicates configuration issue

### BUG-008: Unauthorized API Call for Anonymous Users
- **Category:** API / Performance
- **Severity:** Medium
- **Page:** All pages
- **Steps to Reproduce:**
  1. Navigate to any page without being logged in
  2. Check network tab for API calls
- **Expected:** No unnecessary API calls that result in 401 errors
- **Actual:** `/api/v1/auth/me` endpoint returns 401 Unauthorized
- **Impact:** Unnecessary API calls; potential performance impact; console noise
- **Note:** This may be expected behavior for authentication checks, but could be optimized to not make the call when no auth token exists

---

## Low Severity Bugs

### BUG-009: Missing Password Visibility Toggle on Login
- **Category:** UX / Accessibility
- **Severity:** Low
- **Page:** /login
- **Steps to Reproduce:**
  1. Navigate to https://gathergrove.club/login
  2. Look at the password field
- **Expected:** Password field should have a show/hide toggle (eye icon) like the registration page
- **Actual:** Login page password field appears to use a textbox instead of password input (visible in DOM as `textbox "Password"`)
- **Impact:** Inconsistent UX between login and registration; potential security concern if password is visible
- **Note:** Registration page has proper password visibility toggle

### BUG-010: Console Script Execution Errors
- **Category:** Performance / JavaScript
- **Severity:** Low
- **Page:** Multiple pages
- **Steps to Reproduce:**
  1. Navigate between pages (e.g., homepage to register)
  2. Check console for script errors
- **Expected:** No script execution errors
- **Actual:** Occasional errors like `Refused to execute script from 'https://gathergrove.club/_next/static/chunks/app/page-...'` and 404 errors for script chunks
- **Impact:** Potential performance issues; may indicate caching or deployment issues

---

## Recommendations

### Immediate Actions (Critical/High)
1. **Fix CORS configuration** on `api.gathergrove.club` to allow requests from `gathergrove.club`
2. **Fix Pricing navigation** - verify the scroll target ID matches the actual Pricing section element
3. **Enhance 404 page** with proper branding, navigation, and helpful links
4. **Fix login form validation** to properly clear errors when fields are populated
5. **Configure Google Sign-In locale** to match the site's language (English)

### Short-term Improvements (Medium)
1. Review Application Insights configuration for proper telemetry
2. Fix Google Sign-In button width configuration
3. Optimize auth/me API call to only run when authentication token exists

### Long-term Improvements (Low)
1. Add password visibility toggle to login page for consistency
2. Review Next.js chunking and caching strategy to prevent script loading errors

---

## Test Coverage Summary

### Completed Tests
- [x] Homepage visual layouts (desktop, tablet, mobile)
- [x] Navigation links and scroll behavior
- [x] Login page and form validation
- [x] Registration page and validation
- [x] Light-Only Mode toggle functionality
- [x] Resources page and content
- [x] Mobile responsiveness (375px viewport)
- [x] Mobile hamburger menu
- [x] Accessibility skip links (present in DOM)
- [x] Keyboard navigation (Tab focus)
- [x] 404 error page

### Screenshots Captured
- `homepage-desktop-1920.png`
- `homepage-light-only.png`
- `homepage-mobile-375.png`
- `mobile-menu-open.png`
- `login-page.png`
- `login-validation-empty.png`
- `login-validation-bug.png`
- `register-page.png`
- `register-password-requirements.png`
- `accessibility-tab-focus.png`
- `404-page.png`
- `pricing-section.png`

---

## Environment Details
- **Production URL:** https://gathergrove.club
- **API URL:** https://api.gathergrove.club
- **Browser:** Chromium (Playwright MCP)
- **Viewports Tested:** 1920x1080, 375x667
- **Date Tested:** December 10, 2025
