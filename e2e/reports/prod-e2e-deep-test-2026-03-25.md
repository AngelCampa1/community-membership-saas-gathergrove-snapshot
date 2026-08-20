# GatherGrove Production E2E Deep Test Report

**Date:** 2026-03-25
**Tested URL:** https://www.gathergrove.club
**API URL:** https://api.gathergrove.club
**Browser:** Chrome (via Playwright MCP, headless)
**Test Account:** e2e-deep-test-mar2026@gathergrove.club (User 3003, Club 2002 — created via Neon bypass, cleaned up post-test)
**Methodology:** Fresh account created directly in Neon DB (bypassing Stripe), Tier set to Unlimited/active
**Tester:** Claude Code

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 1 |
| Still Present (prior) | 3 |
| Fixed (prior) | 1 |

---

## 🚨 New Critical Bugs

### CRIT-001: All POST Requests to API Return 503 Service Unavailable

- **Severity:** Critical
- **Affected:** ALL write operations in production
- **Steps to Reproduce:**
  1. Navigate to `https://www.gathergrove.club/register`
  2. Fill in registration form and click "Create My Account"
  3. OR: Log in and attempt to create a membership type, event, or any other write operation
- **Expected:** API call succeeds (201 Created / 200 OK)
- **Actual:** `503 Service Unavailable` returned by Cloudflare — `x-served-by: cache-dfw-kdfw8210140-DFW`
- **Browser Error:**
  ```
  Access to XMLHttpRequest at 'https://api.gathergrove.club/api/v1/auth/register'
  from origin 'https://www.gathergrove.club' has been blocked by CORS policy:
  No 'Access-Control-Allow-Origin' header is present on the requested resource.
  Failed to load resource: net::ERR_FAILED
  ```
- **Root Cause:** The CORS error is misleading — the actual issue is Cloudflare returning a 503 before the request reaches the .NET backend. Since the 503 response comes from Cloudflare (not the app), it contains no CORS headers, causing the browser to report a CORS error. Confirmed by direct `fetch()` test which returned `{ status: 503, body: "Service Unavailable\n" }` from Cloudflare.
- **Impact:** Registration is completely broken. No new users can sign up. All admin data mutations (create event, create membership type, send communications) fail silently with "Unable to connect to the server."
- **Health endpoint:** `GET /health` returns `{"status":"Healthy"}` — only GET requests work; POST is blocked.
- **Hypothesis:** Cloudflare WAF or rate-limiting rule is blocking POST requests to `api.gathergrove.club`. Or the backend's Cloudflare Worker routing is misconfigured for POST methods.

---

### CRIT-002: Registration Blocked by API 503 (consequence of CRIT-001)

- **Severity:** Critical
- **Page:** `/register`
- **Actual:** Form submits → "Error creating your account: Unable to connect to the server"
- **Impact:** No new organizations can sign up. Zero acquisition is possible.

---

## 📋 Prior Bug Regression Status

| Bug ID | Description | Status | Notes |
|--------|-------------|--------|-------|
| NEW-001 | Admin dashboard crashes with DateTime/PostgreSQL error | **STILL PRESENT** | "Cannot write DateTime with Kind=Unspecified to PostgreSQL type 'timestamp with time zone'" on `/admin/dashboard` for every club |
| NEW-002 | CSP blocks Cloudflare Web Analytics | **LIKELY STILL PRESENT** | Not explicitly re-tested this session (no console on API error pages), but nothing indicates it was fixed |
| NEW-003 | `ReferenceError: __name is not defined` | **STILL PRESENT** | Observed on homepage, `/register`, `/login`, `/admin/*` — every page |
| BUG-003 | Pricing nav scrolls to wrong section | **✅ FIXED** | "Pricing" link now navigates to `/pricing` page directly. Page loads with all 3 plans (Seed $9.99, Grow $29, Unlimited $200). |
| BUG-008 | 401 on `/api/v1/auth/me` for anonymous users | **STILL PRESENT** | Still fires on `/register`, `/login`, homepage — every public page load |

---

## 🆕 New High Severity Bug

### HIGH-001: Engagement Member Overview Shows "Upgrade Required" 404 on Unlimited Plan

- **Severity:** High
- **Page:** `/admin/engagement` → "Member Overview" tab
- **Steps to Reproduce:**
  1. Log in as admin with Unlimited tier
  2. Navigate to `/admin/engagement`
  3. Click "Member Overview" tab (default selected)
- **Expected:** Member engagement overview data loads
- **Actual:** "Upgrade Required" error card with message "Request failed with status code 404"
- **API Error:** `GET /api/v1/MemberEngagement/club/{clubId}/overview` → 404
- **Impact:** Unlimited-tier clubs cannot access the Member Overview engagement analytics. The feature appears to be unimplemented or incorrectly routed.
- **Note:** The "At-Risk Members" panel above loads fine with mock/demo data (5 sample members with risk scores — these appear to be static demo data, not real API data).

---

## ✅ Admin Page Status Matrix

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Dashboard | `/admin/dashboard` | ❌ BROKEN | DateTime crash on every load |
| Members | `/admin/members` | ✅ PASS | List, search, tabs all render |
| Membership Types | `/admin/members/types` | ⚠️ READ-ONLY | Page renders; create form opens but POST fails (CRIT-001) |
| Events | `/admin/events` | ✅ PASS | List renders, Upcoming/Past tabs work |
| Communications | `/admin/communications` | ✅ PASS | All 4 channels (Email, SMS, WhatsApp, Push) visible |
| Community Chat | `/admin/chat` | ⚠️ PARTIAL | UI shell loads; shows "Offline — Failed to load chat data" (GET also 503) |
| Dues & Payments | `/admin/dues` | ✅ PASS | Stats cards render ($0 empty state), Stripe & Manual payment sections shown |
| Billing | `/admin/billing` | ✅ PASS | "Unlimited Plan — Active" displayed correctly; member limit shows 9007199254740991 |
| Settings | `/admin/settings` | ✅ PASS | All 7 setting cards render (Profile, Club Admins, Chat, Directory, Integrations, White-Label, Billing) |
| Engagement | `/admin/engagement` | ⚠️ PARTIAL | At-risk panel loads (5 demo members); Member Overview tab → 404 |

---

## 🔍 Neon Bypass Validation

The test confirmed that the Neon DB bypass method works correctly for E2E testing:

1. **Direct user creation** via `INSERT INTO "Users"` with bcrypt hash ✅
2. **Direct club creation** via `INSERT INTO "Clubs"` with `Tier='Unlimited'`, `SubscriptionStatus='active'` ✅
3. **ClubAdmin linking** via `INSERT INTO "ClubAdmins"` ✅
4. **Billing page reflects Neon state immediately** — showed "Unlimited Plan — Active" on login ✅
5. **Sequence reset required** — both `"Users"` and `"Clubs"` sequences were out of sync with actual data (sequences at 8 and low values vs max IDs of 3002 and 2001). This must be fixed in production to avoid future PK conflicts.

**⚠️ Sequence Sync Issue:** The `"Users"` sequence was at 8 while max `"Id"` was 3002. The `"Clubs"` sequence was similarly out of sync. Production inserts through the app will fail with "duplicate key value violates unique constraint" until sequences are corrected. The test corrected them, but this should be investigated — sequences may have been reset during a migration or manual DB operation.

---

## 🐛 Additional Observations

- **Page load time (NEW-004 regression):** The admin pages take 6-8 seconds to show content after navigation. The loading spinner during hydration is still slow. Consistent with the previously reported NEW-004 bug.
- **Logo 404:** Every admin page produces `Failed to load resource: 404 on .../logos/logo-1024x1024.png`. Minor image asset bug.
- **PostHog ingest 403:** `/ingest/e/` and `/ingest/i/v0/e/` return 403 on every page — PostHog event ingestion is blocked. This may be a PostHog configuration issue.
- **Billing UX note:** "0 of 9007199254740991 members" is displayed for Unlimited plan. This leaks an implementation detail (`Number.MAX_SAFE_INTEGER`). Should display "Unlimited members" instead.

---

## 📊 Overall Assessment

**Critical blockers preventing real use:**
1. **CRIT-001: All writes/POSTs return 503** — Users cannot register, admins cannot create content
2. **NEW-001: Dashboard always crashes** — First screen after login is broken

**Working correctly:**
- Login/authentication (GET requests)
- Members, Events, Communications, Dues, Billing, Settings pages (read-only views)
- Billing shows correct tier from DB
- Pricing page and nav (BUG-003 fixed)

**Recommended immediate actions:**
1. Investigate Cloudflare WAF/routing rules blocking POST to `api.gathergrove.club`
2. Fix DateTime UTC issue in the dashboard summary query (add `.SpecifyKind(DateTimeKind.Utc)` or use `DateTimeOffset`)
3. Fix `__name is not defined` JS error (minification/bundling issue)
4. Fix `/api/v1/MemberEngagement/club/{id}/overview` endpoint routing or implement it
5. Fix DB sequences out of sync (run `SELECT setval(...)` for Users, Clubs sequences)
