# GatherGrove Bug Tracker — March 2026

**Last Updated:** 2026-03-25
**Sources:** E2E test session 2026-03-18, deep test 2026-03-25, code review 2026-03-25

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Fixed | 23 |
| 🔴 Critical / Open | 1 |
| 🟠 High / Open | 0 |
| 🟡 Medium / Open | 0 |
| 🔵 Low / Open | 0 |

---

## ✅ Fixed Bugs

| ID | Description | Fixed In |
|----|-------------|----------|
| BUG-001 | CORS on marketing/analytics endpoint | Before Mar 18 |
| BUG-002 | Google Sign-In button in Spanish | Before Mar 18 |
| BUG-003 | Pricing nav scrolled to wrong section (no `#pricing` anchor) | Before Mar 25 — now links to `/pricing` page |
| BUG-004 | 404 page missing branding | Before Mar 18 |
| BUG-005 | Login validation error persists after typing | Before Mar 18 |
| BUG-006 | Application Insights 400 errors | Before Mar 18 |
| BUG-007 | Google Sign-In width warning in console | Before Mar 18 |
| BUG-009 | Missing password visibility toggle on login | Before Mar 18 |
| BUG-010 | Stale JS chunk 404s on page load | Before Mar 18 |
| NEW-001 | Dashboard crashes — `DateTime with Kind=Unspecified` Npgsql error | **2026-03-25** — commit `899b290a` |
| NEW-002 | CSP blocks Cloudflare Web Analytics (`cloudflareinsights.com` missing) | Fixed in `next.config.ts` (present in current build) |
| NEW-005 | Missing `Strict-Transport-Security` header | Fixed in `next.config.ts` (`max-age=63072000; includeSubDomains; preload`) |
| DB-SEQ | `"Users"` and `"Clubs"` sequences out of sync with max IDs in production DB | Fixed during Mar 25 test (ran `setval` manually) |
| HIGH-001 | Engagement Member Overview Returns 404 on Unlimited Plan | Fixed — `MemberEngagementController` and `EngagementController` routes missing `/v1/` prefix |
| NEW-003 | `ReferenceError: __name is not defined` on Every Page | Fixed — added `__name` polyfill inline script in root `layout.tsx` via `next/script` `beforeInteractive` |
| BUG-008 | Unnecessary `auth/me` 401 on Every Public Page | Fixed — `AuthProvider` now skips `getCurrentSession()` call on known public/marketing routes |
| NEW-004 | Admin Pages Show Full-Screen Loading Spinner for 6–8 Seconds | Fixed — server-side middleware redirect for `/admin/*` routes eliminates wait for unauthenticated users |
| NEW-006 | 404 Page Uses Homepage Title | Fixed — root layout `metadata.title` now uses template format; `not-found.tsx` title simplified to `"Page Not Found"` |
| NEW-007 | Admin Auth Guard Leaks Protected Page Title Before Redirect | Fixed — middleware now redirects unauthenticated `/admin/*` requests before HTML is rendered |
| NEW-008 | Payment Error Pages Use Homepage Title | Fixed — `document.title` set via `useEffect` in `/payment/[token]` and `/events/pay/[token]` pages |
| NEW-009 | Duplicate RSC Prefetch Requests | Fixed — added `prefetch={false}` to all `<Link>` components in `Sidebar.tsx` |
| NEW-010 | `auth/me` Call Aborted During Admin Page Navigation | Fixed — `AbortController` added to `loadInitialSession` in `useAuth.tsx`; `authService.getCurrentSession` accepts optional `AbortSignal` |
| BILLING-001 | Billing page shows "0 of 9007199254740991 members" for Unlimited tier | Fixed — replaced incorrect `=== 2147483647` constant check with `getMemberLimitDisplayText()` from `memberUtils.ts` |

---

## 🔴 Critical — Open

### CRIT-001: All POST Requests to API Return 503 Service Unavailable

- **Severity:** Critical
- **Affected:** ALL write operations in production
- **Symptom:** `POST https://api.gathergrove.club/api/v1/*` returns `503 Service Unavailable` from Cloudflare (`x-served-by: cache-dfw-kdfw8210140-DFW`). Browser reports a CORS error, but the 503 comes from Cloudflare before the request reaches the .NET backend.
- **Confirmed working:** `GET /health → {"status":"Healthy"}`. All GET requests function normally.
- **Impact:** Registration is completely broken. No new users can sign up. Admins cannot create events, membership types, or send communications.
- **Root cause:** Cloudflare WAF or routing rule blocking POST method on `api.gathergrove.club`. Not fixable from code — requires Cloudflare dashboard action.
- **Fix:** Review WAF rules in Cloudflare dashboard for `api.gathergrove.club`. Check for any firewall rule targeting POST method or for a broken Workers route.

---

## Production Database Notes

- **Sequence sync:** `"Users"`, `"Clubs"`, and `"ClubAdmins"` sequences were severely out of sync with actual max IDs (sequences at 8 while max IDs were 3000+). Manually corrected during Mar 25 test. Investigate root cause — sequences may have been reset during a migration or manual DB operation. Monitor for recurrence once CRIT-001 (POST 503) is resolved and new registrations resume.
