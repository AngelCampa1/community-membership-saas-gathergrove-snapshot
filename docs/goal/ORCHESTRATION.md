# GOAL MODE — Orchestration Playbook

**Goal (verbatim):** Go through the entire codebase and find + fix EVERY frontend bug,
backend bug, missing frontend feature, missing backend feature, and missing/incorrect
backend wiring. Make everything play nice together and flow end-to-end. UI integration
testing, UI system integration testing, and full local E2E testing. Sub-agent driven.
Multiple review/fix cycles until nothing is left. Buttons must be pills (canonized).
Write backend code where needed. This spans many sessions and many agents.

**This is a cold-start contract.** If you are an agent picking this up, READ THIS FILE
FIRST, then `BACKLOG.md`, then `PROGRESS.md`. Do not restart discovery from scratch —
continue the loop.

---

## Operating model

1. **Orchestrator + sub-agents.** The session that owns this goal is an ORCHESTRATOR.
   It delegates discovery, implementation, verification, and review to sub-agents
   (Explore / general-purpose / editor / web). It curates findings into `BACKLOG.md`,
   integrates results, and makes final quality calls. Keep the orchestrator's context
   for coordination — push heavy reading/searching into sub-agents.

2. **Loop (never "done" — runs until backlog is empty AND a full E2E pass is clean):**
   - DISCOVER → catalog issues into `BACKLOG.md` with stable IDs.
   - FIX → take the top open items, implement (TDD where the file is touched).
   - VERIFY → typecheck, lint, build, targeted tests, and E2E for the touched flow.
   - REVIEW → spec-compliance check, then code-quality review (sub-agent).
   - RECORD → update `BACKLOG.md` status + append to `PROGRESS.md`. Commit.
   - Repeat.

3. **Branch strategy (goal-mode exception).** CLAUDE.md mandates worktrees for normal
   work. For goal mode — hundreds of ephemeral successor sessions — we work directly on
   `main` with **frequent, small, conventional commits**. Rationale: worktrees across
   disconnected sessions create orphaned-directory risk and break continuity. Commit
   often so any successor resumes cleanly from git state + these tracking files.
   (If the user later says use worktrees, that overrides this.)

4. **Quality bar (from CLAUDE.md):** tests hit REAL code (mock only at boundaries:
   Stripe, Azure Comms, SendGrid, native modules, storage, time). Frontend uses MSW for
   HTTP. Backend uses in-memory EF Core. Max 3 mocks/file. No `expect(true).toBe(true)`.
   95% coverage on every touched file. Honesty rule: no fabricated social proof/stats.

5. **Buttons = pills.** Canonized in `client/src/components/ui/button.tsx`
   (`rounded-full`). Any new/edited button-like primitive must use pill radius. Audit
   stray `rounded-md`/`rounded-lg` on `<button>`/`Button` usages and normalize.

---

## How to run the app locally (for E2E)

- Backend: `cd backend && dotnet run` (port 8050)
- Frontend: `cd client && npm run dev` (port 3050)
- Frontend tests (targeted!): `cd client && npm test -- --testPathPattern="<path>" --maxWorkers=2`
- Backend tests (targeted!): `cd backend && dotnet test --filter "FullyQualifiedName~<Name>" --logger "console;verbosity=minimal"`
- NEVER run full `--coverage` mid-session (context exhaustion). Save coverage for milestones.
- E2E lives in `e2e/`. Use Playwright MCP or `e2e/` runner against the running dev servers.

## Discovery domains (split across parallel sub-agents)

Catalog into BACKLOG.md. Domains:
- A. Auth & account lifecycle (login, register, activate, password, JWT, refresh)
- B. Admin: members/directory/types/custom-fields/invite-codes/tags/segmentation/import
- C. Admin: events/[eventId]/series/multi-session/waitlist/checkin/feedback/QR
- D. Payments: Stripe Connect, paid events, payment links, member/non-member status, billing
- E. Communications: templates, A/B, scheduled, SMS, workflows, analytics
- F. Real-time: SignalR chat, event engagement, analytics hubs (client wiring)
- G. Member portal (/app/*): dashboard, directory, membership, profile, chat, events
- H. Multi-location: locations, admins, branding, transfers, cross-location reports
- I. Analytics/engagement/dashboard wiring (admin/analytics, engagement, reports)
- J. Public marketing site (blog, resources, tools, alternatives, pricing) — honesty rule
- K. Cross-cutting wiring: apiClient endpoints vs backend routes (mismatches), DTO drift
- L. Design-system consistency: pills, theming, a11y, responsive

## Wiring-audit method (most valuable, do early)

For each frontend service call (search `client/src` for fetch/apiClient/axios paths),
confirm a matching backend controller route + verb + DTO shape exists. Log mismatches as
WIRING bugs. Inverse: backend routes with no frontend consumer = candidate missing
feature. This is where AI-built-component-at-a-time drift lives.

---

## Status legend (BACKLOG.md)

- `OPEN` — found, not started
- `WIP` — being worked (note agent/session)
- `FIXED` — implemented + verified locally
- `REVIEWED` — passed code review
- `WONTFIX` — intentional, with reason
- Priority: P0 (breaks core/security), P1 (major), P2 (medium), P3 (polish)
