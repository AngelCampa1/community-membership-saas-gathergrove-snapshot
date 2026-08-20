# Security

GatherGrove handles member PII (names, emails, custom fields, event attendance) and payments
(Stripe Connect, subscriptions, dues), which is why this document exists as a required part of this
portfolio rather than an optional one. It consolidates what [ARCHITECTURE.md](./ARCHITECTURE.md)
and [ENGINEERING-LOG.md](./ENGINEERING-LOG.md) already establish about tenant isolation, auth, and
payments, adds what the tree shows about data-subject rights, and states plainly what was not
verified in this pass.

---

## Tenant isolation

A club's data is isolated at three independent layers, not by a single EF Core query filter. Full
detail, including the sequence diagram and the IDOR-attempt log line, is in
[ARCHITECTURE.md's Multi-tenancy section](./ARCHITECTURE.md#multi-tenancy); summarized:

1. **Route guard.** `ClubIdValidationFilter`, a globally registered MVC action filter, compares any
   route's `{clubId}` segment against the caller's JWT `ClubId` claim and returns `Forbid` on a
   mismatch, logging it as an IDOR probe.
2. **Authorization policies.** Nine policies (`ClubAdmin`, `ClubMember`, `GrowTierRequired`,
   `UnlimitedTier`, `SelfAccess`, …) resolve membership through `ClubAuthorizationService`.
3. **Schema constraints.** `ClubId` is non-nullable with cascade foreign keys; uniqueness is
   composite (`(ClubId, Email)` on members, `(ClubId, Name)` on membership types), so a
   cross-tenant row cannot exist even if application logic failed to filter by club.

[ENGINEERING-LOG.md](./ENGINEERING-LOG.md#multi-tenancy-without-global-query-filters) explains why
global query filters were rejected: they fail silently on raw SQL or `IgnoreQueryFilters()`, with
nothing to log or alert on, whereas the filter above rejects at the HTTP boundary and leaves a
trail.

## Authentication and authorization

JWT-based, with Google and Apple SSO. Access tokens only: there is no refresh-token flow, so a
compromised or expired token cannot be silently renewed and the client must re-authenticate.
`AUTHN` in the request pipeline (`Program.cs`) runs after rate limiting and before
`BillingAccessMiddleware`, so an unauthenticated request is rejected before it ever reaches a
subscription-state check.

Five call sites in three controllers fail closed on a missing claim rather than failing open: see
[ENGINEERING-LOG.md's Known compromises](./ENGINEERING-LOG.md#known-compromises) for the
`UnlimitedTierRequirementHandler` bug and its five affected endpoints. The security-relevant fact is
that this bug denies access it should grant (a functional bug and a support cost), not that it
grants access it should deny: it is a broken feature, not a leak.

## Payments

Stripe Connect Express: each club is its own connected account, and the platform never takes
custody of funds. Two properties are load-bearing for correctness:

- **Idempotency keys are derived, not random**:
  `event_{eventId}_member_{memberId}_pm_{paymentMethodId}` for charges, so a retried request
  collapses into the same Stripe operation instead of double-charging. This covers event payments
  and their refunds only; subscription creation and guest payments do not carry a derived key.
- **Webhook signatures are verified, never trusted by shape.** `EventUtility.ConstructEvent(json,
  signature, webhookSecret)` runs against the raw request body for Stripe; Resend's webhooks get
  the equivalent Svix verification. Full detail:
  [ARCHITECTURE.md's Payments section](./ARCHITECTURE.md#payments).

## Secrets

Handled outside application code: environment variables or .NET User Secrets in development, Azure
Key Vault in production, documented in
[`backend/SECRETS-MANAGEMENT.md`](../backend/SECRETS-MANAGEMENT.md). `.env`,
`appsettings.Development.json`, and equivalents are gitignored. This portfolio pass did not re-audit
that document's rotation and incident-response procedures; it is cited, not re-verified.

## GDPR: account deletion and data export

The feature is real, not aspirational. `AccountDeletionController.cs`,
`UserAccountDeletionService.cs`, `DataExportService.cs`, and `MemberDataExportService.cs` all exist
in `backend/src/GatherGrove.Application`, alongside a real `EncryptionService`/`IEncryptionService`
pair. The working deletion logic operates directly on `_context.Users`, not on a dedicated entity.

Two domain entities that share this feature's name are not part of that evidence.
`AccountDeletionRequest` and `DataExport` (`backend/src/GatherGrove.Domain/Entities/`) are among
the eleven domain entities with no `DbSet` disclosed in
[ENGINEERING-LOG.md's Known compromises](./ENGINEERING-LOG.md#known-compromises): unmapped and
never persisted. `UserAccountDeletionService.cs` never touches
`Domain.Entities.AccountDeletionRequest`; the identically named class it does use is
`Application.DTOs.AccountDeletionRequest`, a request DTO in a different namespace. The feature's
reality rests on the controller, the two services, and the encryption pair, not on those two
orphaned entities.

**The security and GDPR-specific test suite for this feature does not run.**
`tests/Account.Deletion.TDD/` holds three files (`Security/AccountDeletionSecurityTests.cs`:
self-deletion enforcement, JWT tampering, rate limiting, SQL-injection and input-sanitization
checks, secure data wiping, audit trail creation; `Integration/AccountDeletionIntegrationTests.cs`;
and `Unit/UserAccountDeletionServiceTests.cs`), and there is no `.csproj` anywhere under `tests/`
to compile them. Two more account-deletion test files exist at
`tests/gathergrove-api-tests/Controllers/AccountDeletionControllerTests.cs` and
`tests/gathergrove-application-tests/Services/AccountDeletionServiceTests.cs`, in the same
condition. Across the whole root `tests/` directory, 30 `.cs` files (the account-deletion suite
plus integration, performance, benchmark, and validation tests for tiering, branding, and member
segmentation) sit outside any buildable project and have never executed. This is the same
orphaned-test pattern already documented for `backend/tests/Application/Services/` and
`backend/tests/unit-tests/` in [portfolio/TESTING.md](./TESTING.md); this document names the
additional 30 files because they specifically claim to cover account deletion, GDPR data
portability, and injection resistance: claims worth being explicit about rather than folding into a
general test-hygiene note.

**The 30 C# files are a minority of that directory's dead code, not the whole of it.** The same
root `tests/` tree also holds 96 TypeScript/JavaScript files, 69 of them following a
`.test.`/`.spec.` naming convention, together declaring 1,592 `it(`/`test(` blocks, spread across
`tests/ab-testing`, `tests/security`, `tests/e2e`, `tests/deployment`, `tests/quality-assurance`,
`tests/client`, and more than a dozen further subdirectories (`tests/analytics`,
`tests/Integration`, `tests/Services`, `tests/unit`, `tests/performance`, `tests/auth`, among
others). This sub-tree carries its own `package.json` (`gathergrove-deployment-tests`) with
independent Jest and Playwright scripts, but `node_modules` was never installed for it, and
nothing in the repository invokes it: not `.githooks/pre-commit`, not `scripts/check.sh`, not any
markdown file before this one. Some of it is boundary-mock theater that this project's own
conventions forbid: `tests/security/auth-security.test.ts` mocks the entire app rather than
exercising a real boundary. This is a build-configuration and dead-code problem, not a breach: none
of the 1,592 declarations were ever silently skipped in a passing run, because none of them was
ever wired into a run at all.

**What this means in practice:** the account-deletion and data-export code paths exist and can be
read and reasoned about, but none of the tests written specifically to probe their security
properties (self-deletion-only enforcement, tampered-JWT rejection, SQL-injection resistance, secure
wiping) have ever been confirmed to pass by running them. Treat the feature as implemented and
unverified, not as implemented and tested.

## Logging and headers

**The audit trail does not persist.** `AuditLogService` computes checksums and retention policies
but writes to an in-memory list; `AuditLog` and `SecurityEvent` have no `DbSet`. A security event
logged today is gone on the next process restart. Full detail:
[ENGINEERING-LOG.md's Known compromises](./ENGINEERING-LOG.md#known-compromises).

**Two CSP implementations disagree.** `next.config.ts` ships `'unsafe-inline'` in its
`Content-Security-Policy`; `src/middleware/security.ts` ships a nonce-based policy that overwrites
it on every page route, so the nonce version is what actually ships. The nonce is not wired into
Next's own inline scripts, though, so the browser blocks at least one of them and logs a violation.
Full detail, including which file's comment is stale:
[ENGINEERING-LOG.md's Known compromises](./ENGINEERING-LOG.md#known-compromises).

## What this document does not cover

This pass did not audit PII encryption at rest beyond confirming `EncryptionService.cs` exists, did
not test rate limiting or CORS configuration against a running instance, and did not re-verify the
secrets-rotation procedure in `backend/SECRETS-MANAGEMENT.md`. Those would need a running stack and
were out of scope for a documentation and portfolio-structure pass.
