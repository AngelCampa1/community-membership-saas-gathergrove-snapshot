# GOAL PROGRESS LOG

Append-only. Newest at top. Each session: what you discovered, fixed, verified.

---

## Session 1 — 2026-05-28 (Opus orchestrator)
- Established goal-mode infrastructure: ORCHESTRATION.md (playbook), BACKLOG.md, this log.
- Canonized buttons as pills: `button.tsx` base + sm + lg → `rounded-full` (L-001 FIXED).
- Surveyed repo: client ~1305 ts/tsx files, backend ~758 cs files, 70+ controllers,
  large admin + /app + public marketing surface.
- Ran parallel `lite` discovery sub-agents across domains A,B,C(QR),D,E,F,G,H,I,J,K.
  Populated BACKLOG with ~70 stable-ID issues. (Tip: `lite` tier works for sub-agents;
  default Explore/general-purpose blew the prompt-length limit due to inherited MCP tools.)
- FIXED + committed: member-portal nav routes G-001..G-004, G-008 (commit after this).
  Had to update member-dashboard test that asserted the old buggy "/events" route.
- KEY P0/P1 confirmed for successors:
  * D-002: StripeService is a stub; EventPricingService.RegisterForPaidEventAsync is a
    LIVE payment path on it → paid-event registration is broken. Needs real Stripe SDK
    impl (mirror PaymentService) AND the flow expects synchronous "succeeded" from intent
    creation which is wrong for Stripe (needs client confirm + webhook). Design fix.
  * D-001 / I-007: duesService.ts is entirely mock; no /users/me/dues/pay backend route.
  * F-001: AnalyticsHub not mapped in Program.cs. F-002: chat/engagement hub URL mismatch.
  * E-001: workflow builder setter bug (_setWorkflowSteps). B-001: engagementLevel filter no-op.
  * H-001/H-002: missing /admin/locations/[id] route + stale-closure branding bug.
  * J: multiple unsourced marketing stats (honesty rule) — resources/page.tsx + blog posts.

### Next session — recommended order
1. Quick safe frontend batch (TDD): B-001 filter, E-005 SMS count, H-005 router,
   H-007 email validation, E-009 toggle body, G-006 type, G-007 member-since.
2. SignalR wiring (verify each side first): F-001, F-002, F-004, F-006.
3. Honesty-rule marketing cleanup: J-001..J-007 (remove/cite stats).
4. Then the hard P0/P1 backend: D-002 design (plan first), D-001 dues endpoint, C-001/C-002.
5. Continue discovery for any domain marked "pending" (K full sweep of all ~60 services).
6. After each batch: typecheck/lint/targeted tests; commit; update BACKLOG status + this log.
