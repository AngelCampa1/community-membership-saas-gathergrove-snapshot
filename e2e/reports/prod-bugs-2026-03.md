# GatherGrove Production E2E Bug Report

**Date:** 2026-03-18
**Tested URL:** https://gathergrove.club
**API URL:** https://api.gathergrove.club
**Browser:** Chrome 146 (via Playwright CLI, headless)
**Viewport:** 1280x720
**Tester:** Claude Code

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 3 |
| Medium | 4 |
| Low | 3 |
| **Total** | **12** |

---

## Regression Status (10 Previous Bugs from Dec 2025)

| Bug ID | Description | Status | Notes |
|--------|-------------|--------|-------|
| BUG-001 | CORS on marketing/analytics endpoint | **FIXED** | No CORS errors on homepage; marketing analytics endpoint no longer called |
| BUG-002 | Google Sign-In button in Spanish | **FIXED** | Button now shows "Sign in with Google" (English) |
| BUG-003 | Pricing nav scrolls to wrong section | **STILL PRESENT** | Scrolls to Mobile Showcase / ROI area, not pricing plans. No `#pricing` ID exists on the page |
| BUG-004 | 404 page missing branding | **FIXED** | 404 page now has GatherGrove logo, "Go to Homepage", "Go Back", and helpful links |
| BUG-005 | Login validation error persists after input | **FIXED** | "Password is required" clears when password is typed |
| BUG-006 | Application Insights 400 errors | **FIXED** | No Application Insights errors observed (may have been removed) |
| BUG-007 | Google Sign-In width warning | **FIXED** | No GSI_LOGGER warning in console |
| BUG-008 | auth/me 401 for anonymous users | **STILL PRESENT** | Every public page still makes a `GET /api/v1/auth/me` call that returns 401 |
| BUG-009 | Missing password visibility toggle on login | **FIXED** | Password field now has show/hide toggle (eye icon) |
| BUG-010 | Stale JS chunk 404s | **FIXED** | No chunk 404s observed |

**Regression Summary:** 8 of 10 bugs fixed. 2 still present (BUG-003, BUG-008).

---

## Critical Bugs

### NEW-001: Admin Dashboard Crashes with PostgreSQL DateTime Error
- **Severity:** Critical
- **Page:** `/admin/dashboard`
- **Steps to Reproduce:**
  1. Log in as admin (e2e-admin-2026@gathergrove.club)
  2. Observe the dashboard page
- **Expected:** Dashboard loads with stats widgets and summary data
- **Actual:** Shows "Something went wrong" error with message: `Error loading dashboard data: Error loading dashboard summary: Cannot write DateTime with Kind=Unspecified to PostgreSQL type 'timestamp with time zone', only UTC is supported. Note that it's not possible to mix DateTimes with different Kinds in an array, range, or multirange. (Parameter 'value') Please try refreshing the page`
- **Impact:** Admin dashboard is completely broken. First page admins see after login shows an error. This is a Npgsql 6+/EF Core compatibility issue where `DateTime` values without `.Kind = DateTimeKind.Utc` are rejected by the PostgreSQL driver.
- **Root Cause:** Backend code is passing `DateTime` objects with `Kind=Unspecified` to Npgsql, which requires `Kind=Utc` for `timestamp with time zone` columns. This affects the dashboard summary query.
- **Screenshot:** `admin-dashboard.png`

### NEW-002: CSP Blocks Cloudflare Web Analytics on Every Page
- **Severity:** Critical
- **Page:** All pages (every page load)
- **Steps to Reproduce:**
  1. Navigate to any page on gathergrove.club
  2. Open browser console
- **Expected:** No CSP violations
- **Actual:** Every page produces: `Loading the script 'https://static.cloudflareinsights.com/beacon.min.js/...' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://appleid.cdn-apple.com". The action has been blocked.`
- **Impact:** Cloudflare Web Analytics is completely non-functional across the entire site. No Cloudflare analytics data is being collected. The CSP `script-src` directive is missing `https://static.cloudflareinsights.com`.
- **Fix:** Add `https://static.cloudflareinsights.com` to the `script-src` directive in the CSP header configuration (`client/next.config.ts`).

---

## High Severity Bugs

### BUG-003 (Reopened): Pricing Navigation Button Scrolls to Wrong Section
- **Severity:** High
- **Page:** Homepage (`/`)
- **Steps to Reproduce:**
  1. Navigate to https://gathergrove.club
  2. Click "Pricing" button in the header navigation
- **Expected:** Page scrolls to the Pricing plans section
- **Actual:** Page scrolls to the Mobile Showcase / ROI Calculator area instead
- **Root Cause:** There is no element with `id="pricing"` on the page. The available section IDs are: `main-content`, `features`, `roi`, `email`, `payment`, `chat`, `calendar`, `survey`. The Pricing section needs a `#pricing` anchor ID, or the scroll target needs to be updated.
- **Impact:** Users cannot navigate to pricing from the header — a key conversion path.
- **Screenshot:** `pricing-scroll.png`

### NEW-003: `ReferenceError: __name is not defined` on Every Page
- **Severity:** High
- **Page:** All pages
- **Steps to Reproduce:**
  1. Navigate to any page on gathergrove.club
  2. Check browser console
- **Expected:** No JavaScript runtime errors
- **Actual:** Every page produces: `ReferenceError: __name is not defined at https://gathergrove.club/:10:11 at https://gathergrove.club/:17:11`
- **Impact:** A JavaScript error fires on every page load. While it doesn't appear to break visible functionality, it indicates a build/bundling issue. The `__name` variable is typically injected by TypeScript/esbuild decorators but is missing in the production bundle. This could cause subtle issues and degrades error monitoring signal-to-noise.
- **Root Cause:** Likely a Cloudflare Workers or Next.js build configuration issue where a global `__name` helper expected by bundled code is not defined in the production runtime.

### NEW-004: Admin Pages Stuck on Infinite "Loading..." Spinner
- **Severity:** High
- **Page:** `/admin/members` and other admin pages
- **Steps to Reproduce:**
  1. Log in as admin
  2. Navigate to `/admin/members`
  3. Observe the page
- **Expected:** Page shows sidebar navigation and content within 2-3 seconds
- **Actual:** Page shows only a centered "Loading..." spinner with no sidebar navigation for 8+ seconds. The sidebar and content eventually appear, but the initial experience is a blank page with a spinner.
- **Impact:** Very poor first-impression UX for admins. No skeleton/layout is shown during API loading — the entire page is hidden behind a full-screen spinner.
- **Screenshot:** `admin-members.png`

---

## Medium Severity Bugs

### BUG-008 (Reopened): Unnecessary auth/me 401 on Every Public Page
- **Severity:** Medium
- **Page:** All public pages
- **Steps to Reproduce:**
  1. Navigate to any public page without being logged in
  2. Check network tab
- **Expected:** No unnecessary API calls that return errors
- **Actual:** Every page makes `GET https://api.gathergrove.club/api/v1/auth/me` which returns 401 Unauthorized
- **Impact:** Unnecessary API call on every page load. Adds latency, creates console noise, wastes server resources. Should check for auth token existence before making the call.

### NEW-005: Missing HSTS Header
- **Severity:** Medium
- **Page:** All pages
- **Steps to Reproduce:**
  1. Inspect response headers for any page
- **Expected:** `Strict-Transport-Security` header present (e.g., `max-age=31536000; includeSubDomains`)
- **Actual:** `Strict-Transport-Security` header is MISSING
- **Impact:** Without HSTS, users could be vulnerable to SSL stripping attacks on first visit. Browsers won't remember to always use HTTPS. This is a security best practice and affects SEO scores.
- **Present Headers:** CSP, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy are all correctly set.

### NEW-006: 404 Page Uses Homepage Title Instead of 404-Specific Title
- **Severity:** Medium
- **Page:** Any non-existent URL (e.g., `/nonexistent-page-xyz-12345`)
- **Steps to Reproduce:**
  1. Navigate to https://gathergrove.club/nonexistent-page-xyz-12345
  2. Check the page `<title>` tag
- **Expected:** Title like "Page Not Found | GatherGrove" or "404 | GatherGrove"
- **Actual:** Title is "GatherGrove — Club Management Software | Members, Events & Dues in One App" (the homepage title)
- **Impact:** SEO issue — search engines seeing 404 pages with the homepage title can be confusing. Also makes browser tabs indistinguishable from the homepage.

### NEW-007: Admin Auth Guard Leaks Page Title Before Redirect
- **Severity:** Medium
- **Page:** `/admin/dashboard`, `/admin/members`, etc. (all protected routes)
- **Steps to Reproduce:**
  1. While NOT logged in, navigate to https://gathergrove.club/admin/dashboard
  2. Observe the initial page response
- **Expected:** Server-side 302 redirect to `/login`
- **Actual:** Initial HTML response is 200 OK with `<title>Dashboard | GatherGrove</title>`. The page briefly renders before client-side JavaScript redirects to `/login`. During the loading period, the page shows "Loading..." with the admin page title.
- **Impact:** Information leakage (page titles of protected routes), flash of unintended content, and slower redirect than server-side. Client-side auth guards should at minimum not expose the protected page's title/structure until auth is confirmed.

---

## Low Severity Bugs

### NEW-008: Payment Error Pages Use Homepage Title
- **Severity:** Low
- **Page:** `/payment/invalid-token`, `/events/pay/invalid-token`
- **Steps to Reproduce:**
  1. Navigate to https://gathergrove.club/events/pay/invalid-token
- **Expected:** Page title reflects the error state (e.g., "Event Not Found | GatherGrove")
- **Actual:** Title is the generic homepage title. The page content correctly shows "Error: Event not found. The link may be invalid or the event may have been cancelled." but the title doesn't match.
- **Impact:** Minor SEO/UX issue. The error page content is appropriate, but the title is misleading.
- **Screenshot:** `event-pay-invalid.png`

### NEW-009: Duplicate RSC Prefetch Requests
- **Severity:** Low
- **Page:** Admin pages
- **Steps to Reproduce:**
  1. Navigate to any admin page
  2. Check network tab
- **Expected:** Each RSC prefetch request made once
- **Actual:** Several RSC prefetch requests (`?_rsc=...`) are made in duplicate (e.g., `/register?_rsc=asqg6` appears 3 times, `/forgot-password?_rsc=asqg6` appears 3 times, `/?_rsc=asqg6` appears 3 times)
- **Impact:** Unnecessary network traffic. Next.js RSC prefetching appears to be over-aggressive, fetching the same route multiple times.

### NEW-010: `auth/me` Call Aborted During Admin Page Navigation
- **Severity:** Low
- **Page:** Admin pages during navigation
- **Steps to Reproduce:**
  1. Navigate between admin pages rapidly
  2. Check network tab
- **Expected:** `auth/me` calls complete successfully
- **Actual:** `GET https://api.gathergrove.club/api/v1/auth/me` intermittently fails with `net::ERR_ABORTED` during page transitions, then retries and succeeds
- **Impact:** Adds latency to page transitions. Suggests race condition between navigation and auth state checks.

---

## Pages Tested (All Return 200)

### Public Pages (49 pages) -- All OK
- **Homepage:** `/` -- renders correctly with all sections
- **Auth:** `/login`, `/register`, `/forgot-password`, `/activate-account`
- **Static:** `/faq`, `/support`, `/privacy-policy`, `/terms-of-service`
- **Feature hub + 8 detail pages:** `/features`, `/features/membership-management`, etc.
- **Club type hub + 15 detail pages:** `/for`, `/for/book-clubs`, etc.
- **Resource hub + 14 detail pages:** `/resources`, `/resources/complete-guide-club-management`, etc.
- **Error pages:** `/payment/invalid-token`, `/events/pay/invalid-token` -- show graceful error messages

### SEO Files -- All OK
- `/sitemap.xml` (8,868 chars)
- `/robots.txt` (2,495 chars)
- `/llms.txt` (5,559 chars)
- `/llms-full.txt` (15,290 chars)
- `/llms-pricing.txt` (1,858 chars)

### Security Headers -- Mostly OK
| Header | Status |
|--------|--------|
| Content-Security-Policy | Present (but missing Cloudflare Insights domain) |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | Present (geolocation, mic, camera disabled; payment for Stripe) |
| Strict-Transport-Security | **MISSING** |

### Admin Pages (authenticated) -- Mixed
- `/admin/dashboard` -- **CRASHES** (DateTime error)
- `/admin/members` -- Loads after long delay (8+ sec spinner)
- `/admin/events` -- Shows "Loading..." (slow but loads)
- `/admin/communications` -- Shows "Loading..." (slow but loads)
- `/admin/chat` -- Shows "Loading..."
- `/admin/dues` -- Shows "Loading..."
- `/admin/billing` -- Shows "Loading..."
- `/admin/analytics` -- Shows "Loading..."
- `/admin/engagement` -- Loads with sidebar
- `/admin/settings/*` -- All show "Loading..."
- `/admin/onboarding` -- Shows "Loading..."

---

## Recommendations

### Immediate (P0 -- Critical)
1. **Fix DateTime UTC issue** in the dashboard summary query. All `DateTime` values written to PostgreSQL `timestamptz` columns must have `Kind=Utc`. Search for `DateTime.Now` usage and replace with `DateTime.UtcNow`. Consider adding `AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true)` as a temporary workaround.
2. **Add `https://static.cloudflareinsights.com` to CSP `script-src`** in `client/next.config.ts` to unblock Cloudflare Web Analytics.

### Short-term (P1 -- High)
3. **Add `#pricing` anchor ID** to the pricing section on the homepage, or update the nav button's scroll target.
4. **Investigate `__name` ReferenceError** in the production build. Check Cloudflare Workers/Next.js build config for missing polyfills or decorator helpers.
5. **Add skeleton/layout loading states** to admin pages so the sidebar renders immediately while content loads.

### Medium-term (P2)
6. **Skip `auth/me` API call** when no auth token exists in localStorage/cookies.
7. **Add HSTS header** (`Strict-Transport-Security: max-age=31536000; includeSubDomains`).
8. **Set correct page titles** for 404 page and payment error pages.
9. **Add server-side auth redirects** for protected routes (middleware-level, not client-side JS).

### Low Priority (P3)
10. Investigate duplicate RSC prefetch requests.
11. Fix `auth/me` abort race condition during admin navigation.

---

## Environment Details
- **Production URL:** https://gathergrove.club
- **API URL:** https://api.gathergrove.club
- **Browser:** Chromium 146 (Playwright CLI, headless)
- **Viewport:** 1280x720
- **Date Tested:** March 18, 2026
- **Test Accounts Created:**
  - Admin: e2e-admin-2026@gathergrove.club (User ID 3001, Club ID 2001)
  - Member: e2e-member-2026@gathergrove.club (User ID 3002)

## Screenshots
- `homepage-desktop.png` -- Homepage renders correctly
- `pricing-scroll.png` -- Pricing button scrolls to wrong section (BUG-003)
- `login-page.png` -- Login page with Google/Apple SSO (BUG-002/009 fixed)
- `login-validation-empty.png` -- Validation errors shown
- `login-after-typing.png` -- Validation clears on input (BUG-005 fixed)
- `404-page.png` -- Branded 404 page (BUG-004 fixed)
- `admin-dashboard.png` -- Dashboard crash with DateTime error (NEW-001)
- `admin-members.png` -- Infinite loading spinner (NEW-004)
- `event-pay-invalid.png` -- Event pay error page (graceful error)
