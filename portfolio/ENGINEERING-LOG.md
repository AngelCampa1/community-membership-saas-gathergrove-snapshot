# Engineering notes

[ARCHITECTURE.md](./ARCHITECTURE.md) describes what the system is. This document covers the
decisions behind it, including the ones that turned out to be expensive.

---

## Migrating from SQL Server to PostgreSQL

The project ran on SQL Server for its first nine months. It runs on PostgreSQL now. The cutover
happened on 2026-02-17, and the interesting part is not the migration itself but its tail.

**The cutover**: `c7f2415f`, 55 files, −114,772 lines. Same day, `542bc2ca` moved `docker-compose`
to PostgreSQL 16 and `32e43761` created a fresh baseline EF migration.

**Type mapping broke first**, within hours. SQL Server's string types have no PostgreSQL
equivalents, so the generated migration referenced columns Postgres would not accept: `b004b132`
replaced `ntext` with `text`, `00b01655` replaced `nvarchar(max)`. Both were caught by the migration
failing to apply, which is the cheap way to find them.

**Connection handling broke a month later.** Production moved to Neon, whose serverless Postgres
hands out `postgresql://` URIs while Npgsql expects ADO.NET keyword syntax. `dc893b37` added the
conversion by hand. Serverless also invalidates the usual pooling assumptions, because a warm pool
of connections is wasted against a database that scales to zero, so `MinPoolSize=0` and
`ConnectionIdleLifetime=30` replaced the defaults, alongside `EnableRetryOnFailure(3, 10s)` for cold
starts.

**The expensive one was time.** `899b290a`, five weeks after the cutover: `DateTimeKind.Utc`
threaded through the six services that build dates for analytics and reporting. PostgreSQL's
`timestamptz` rejects a `DateTime` whose `Kind` is `Unspecified`; SQL Server accepts it silently.
Nine months of code had been written against a database that never forced the question. It surfaced
as a dashboard crash, not as a compile error, because the failure only occurs when a value actually
reaches the driver.

**Why there are only four migrations.** The cutover squashed to a fresh baseline, so migration count
says nothing about how much the schema changed. The nine months of SQL Server migration history is
gone by design. The schema is 84 tables.

The lesson worth keeping: the migration was a day's work, and the type mismatches were an afternoon.
The semantic difference, one database being strict about a thing the other ignores, took five weeks
to fully surface and touched far more code.

---

## Multi-tenancy without global query filters

EF Core's `HasQueryFilter` is the usual answer for tenant isolation, and this codebase deliberately
does not use it. Global query filters have two properties that made them a poor fit here:

1. **They are silent.** A filter that fails to apply, because a query used raw SQL or
   `IgnoreQueryFilters()` or a projection that bypassed the entity, leaks data with no signal. There
   is nothing to log and nothing to alert on.
2. **They are invisible at the boundary.** The check happens deep in query translation, far from the
   HTTP request that should have been rejected outright.

The alternative here rejects the request at the edge instead. `ClubIdValidationFilter` is a globally
registered MVC action filter that compares the route's `{clubId}` against the caller's JWT claim
before any handler runs:

```csharp
_logger.LogWarning(
    "IDOR attempt: User {UserId} (club {UserClubId}) tried to access club {RouteClubId} via {Path}",
    userId, userClubId, routeClubId, context.HttpContext.Request.Path);
context.Result = new ForbidResult();
```

A cross-tenant attempt is now a logged security event rather than an empty result set. Exemptions
are explicit and greppable (`[SkipClubIdValidation]`, the `PlatformAdmin` role, anonymous
endpoints), so the set of routes that legitimately cross tenants can be audited by searching for the
attribute.

This is defense in depth rather than a replacement: authorization policies check club membership
independently, and composite unique indexes such as `(ClubId, Email)` mean the database will not
accept cross-tenant collisions even if both application layers were bypassed.

**The tradeoff:** it protects the routes that carry `{clubId}`. It does nothing for a query that
forgets to filter internally. Global query filters would have caught that class, and this design
does not.

---

## Payments

Money movement is the part of the system where retries, duplicates, and partial failures are
guaranteed rather than hypothetical.

**Idempotency keys are derived from the operation, not generated randomly.** A random key makes a
retry look like a new charge, which is exactly backwards:

```csharp
IdempotencyKey = $"event_{request.EventId}_member_{member.Id}_pm_{request.PaymentMethodId}"
```

The same member paying for the same event with the same payment method produces the same key every
time, so a network timeout followed by a client retry collapses into one charge at Stripe. Refunds
use the same pattern keyed on RSVP and payment intent.

The discipline is not applied everywhere, which is worth stating plainly: those two call sites are
the only ones in the codebase that pass `RequestOptions`. Subscription creation in `BillingService`
and guest payment and refund calls in `NonMemberEventPaymentService` send none, so a retry there can
double-charge. Grep for `IdempotencyKey` and you find two hits against four unprotected money-moving
calls. Fixing it is mechanical; it simply has not been done.

**Webhooks are verified cryptographically, not structurally.** `EventUtility.ConstructEvent(json,
signature, webhookSecret)` runs against the raw request body. Parsing before verifying would defeat
the point. Resend's webhooks get equivalent treatment through Svix.

**Connected accounts self-heal.** Stripe Connect account IDs can become invalid, either deleted in
the dashboard or lost when moving between Stripe environments. Rather than failing the request, the
service catches the specific error and re-provisions:

```csharp
catch (StripeException ex) when (ex.StripeError?.Code == "resource_missing" || ex.Message.Contains("does not exist"))
{
    club.StripeAccountId = null;
    club.StripeAccountCountry = null;
    await _context.SaveChangesAsync();
}
```

The exception filter matches one specific failure. Broader catches here would mask real payment
errors, which is the failure mode that actually costs money.

---

## Tier gating by decoration, not by branching

Pricing tiers gate features. The naive implementation puts `if (tier >= Grow)` inside every service,
which spreads pricing logic across the codebase and makes it untestable in isolation.

Instead, tier-aware behavior wraps the real service:

```text
TierAwareExportService  →  ExportService
```

A second decorator, `TierAwareAnalyticsRepository`, exists but never runs: it is registered only
inside `AddInfrastructure()`, and `AddInfrastructure()` is never called from `Program.cs`. The plain
repository wins from two other registrations. The pattern is sound; one of its two instances is dead
code.

`ExportService` knows how to export and nothing about pricing. `TierAwareExportService` knows about
pricing and delegates the actual work. Either can be tested without the other, and removing a tier
restriction means unregistering a decorator rather than hunting conditionals.

Caching follows the same shape. `TierAwareCacheService` layers `IMemoryCache` over
`IDistributedCache` with per-tier TTLs, and the distributed layer is environment-conditional: Redis
in production and staging when a connection string exists, in-memory everywhere else. Development
needs no Redis to run.

---

## Design tokens across three platforms

Three clients need the same colors, spacing, and typography. Web wants HSL in CSS custom properties,
React Native wants hex and numeric pixels, and server-rendered email templates need values in C#.
Keeping those in sync by hand fails quietly. A stale hex in a mobile stylesheet looks fine until
someone compares screens.

`shared/design-tokens/` compiles nine JSON files into four outputs through transforms that handle
each platform's mismatch: hex→HSL for CSS, and an abstract shadow model→React Native's
`elevation`/`shadowOffset` pair, which has no direct CSS equivalent.

The part that makes it hold: the pre-commit hook detects staged changes under
`shared/design-tokens/`, rebuilds, and `git add`s all four generated outputs automatically.
Generated files cannot drift from their sources, because committing a token change without its
outputs is not a state the hook permits.

`build.mjs` also patches `client/src/app/globals.css` in place between `BEGIN/END AUTO-GENERATED`
markers, so generated custom properties and authored CSS live in one file without a build step
to merge them.

---

## Testing: mocks stop at boundaries

The rule is that a test which mocks the thing it is testing proves only that the mock works. So
mocking is allowed at system boundaries (HTTP, external APIs, native modules, the clock) and
disallowed for internal services, UI components, and state management.

In practice this means MSW intercepts at the network layer rather than `jest.mock()` on service
modules. A component test renders the real component, which calls the real hook, which calls the
real service, which issues a real HTTP request that MSW answers. Everything between the user event
and the network boundary executes.

`client/jest.config.js` uses `moduleNameMapper` for libraries that genuinely cannot run in jsdom:
canvas-based charting, PDF generation, spreadsheet writers.

It also globally mocks sixteen Radix UI packages, which breaks the rule this project sets for
itself. Radix runs fine in jsdom, `CLAUDE.md` explicitly forbids global UI component mocks, and the
jest config's own header comment says UI components should use real implementations. Component tests
therefore render stubs rather than real Radix primitives, which weakens exactly the tests that claim
to exercise real components.

The backend applies the same principle with in-memory EF Core: service tests use a real `DbContext`
and assert against actual persisted rows, so a test fails when the query is wrong rather than when
the mock's expectations change.

Playwright's config partitions 41 E2E cases into six projects by required auth state. A setup
project mints admin and member storage states once; the rest consume them. One project mocks session
and billing so lockout behavior can be tested without seeding a subscription. Runs are serial,
because parallel workers sharing a login collide.

---

## Local quality gates

There is no hosted CI, a project constraint rather than an oversight. Enforcement is local and,
importantly, **change-scoped**.

`.githooks/pre-commit` reads `git diff --cached --name-only` and runs only the gates for layers that
were actually touched. Committing a CSS tweak does not trigger a .NET build. When several layers are
staged, the gates still run one after another; the per-track log files were set up for a parallel
version that was never finished. Client linting runs against staged files only; typecheck runs
whole-project, because TypeScript cannot answer a partial question correctly.

The honest tradeoff: a public repo shows no green checkmarks, and a contributor cannot rely on CI
catching what they missed. `scripts/check.sh` exists to run every gate on demand, and it resolves
paths via `git rev-parse --show-toplevel` so it behaves identically from the repo root or inside a
worktree.

**Worktrees are load-bearing.** `scripts/new-worktree.sh` creates an isolated checkout, copies
`.env` files while refusing to overwrite or copy templates, installs dependencies, and wires hooks.
`client/jest.config.js` carries explicit `.worktrees/` handling in `modulePathIgnorePatterns`,
`testPathIgnorePatterns`, and a `testMatch` override that works around next/jest escaping dots in
absolute paths. That is one config, not the sweep across the toolchain the workflow would need to be
fully load-bearing.

---

## Edge rendering constraints

Running Next.js on Cloudflare Workers via OpenNext trades Node APIs for edge distribution, and two
things had to be rebuilt.

**Images.** Next's optimizer needs a Node runtime that Workers does not provide, so
`client/src/lib/cloudflare-image-loader.ts` delegates resizing to Cloudflare's `/cdn-cgi/image/`
endpoint. SVGs are permitted but sandboxed under a per-image CSP of `script-src 'none'; sandbox;`.

**Redirects.** The non-www→www redirect lives in `src/middleware.ts` rather than `next.config.ts`,
because opennextjs-cloudflare mishandles `/:path*` redirect patterns. The middleware also does a
server-side cookie check on `/admin/*` so a protected page title never reaches the initial HTML for
a logged-out visitor.

---

## Known compromises

**Two CSP implementations disagree, and the stricter one silently wins.**

`next.config.ts` defines a Content-Security-Policy with `'unsafe-inline'` in `script-src`, and
comments that nonce-based CSP was judged too complex:

> Using 'unsafe-inline' for production because Next.js App Router generates inline scripts for React
> Server Components that require it. Implementing proper nonce-based CSP with Next.js requires
> middleware and is complex to set up correctly.

But `src/middleware/security.ts`, labelled "BUG FIX #23: Implemented proper nonce-based CSP instead
of unsafe-inline", generates a per-request nonce and sets its own `Content-Security-Policy` header.
The middleware matcher covers page routes in every environment, except `/sitemap.xml` and
`/robots.txt`, which short-circuit before any security header is set. On every other page it
overwrites the config header, so the nonce policy is what ships and there is no `'unsafe-inline'` in
it. The `next.config.ts` policy is effectively dead for pages, and its comment is stale. Someone
reading only that file would conclude the opposite of what ships.

The nonce approach is the more secure design, but it is not fully wired: Next's own inline scripts
do not carry the nonce, so the browser blocks at least one of them and logs a violation. Under CSP
rules a nonce makes `'unsafe-inline'` inert, so there is no fallback. Whatever the nonce misses
simply does not execute.

Worth fixing in one direction or the other. Two policies for the same header, where the losing one
carries the explanatory comment, is the kind of thing that survives precisely because both look
correct in isolation.

**The audit trail does not persist.** `AuditLogService` contains checksums, digital signatures, and
retention-policy methods, but writes to an in-memory `List<T>` on a scoped service, so entries
vanish at the end of the request. `AuditLog` and `SecurityEvent` are domain entities with no
`DbSet`. The design is there; the persistence is not.

**Middleware written but never wired.** `SecurityHeadersMiddleware`, `HoneypotMiddleware`, and
`TierValidationMiddleware` are fully implemented and absent from the pipeline in `Program.cs`.
Security headers are still applied by the separate `SecurityMiddleware`, which *is* registered, but
the richer header set is dead code.

**No refresh tokens.** Access tokens only, with configurable expiry. Long sessions require
re-authentication.

**Unused dependencies.** FluentValidation is referenced with zero `AbstractValidator`
implementations. `react-router-dom` sits in a Next App Router project, and `next-themes` is
installed but never imported.

**Two test projects are outside the solution file** (`Domain.Tests` and
`LoginActivityFunctionalTest`), including `Domain.Tests` with 736 tests. They do not run under
`dotnet test` against the `.sln`. That understates it for `Domain.Tests`: it does not compile.
`dotnet build tests/Domain/Domain.Tests.csproj` fails with nine `CS0117` errors, all the same shape:
`ScheduledReportTests.cs` references `ExportFormat.Csv`, `.Pdf`, and `.Json`, and the enum's real
members are `CSV`, `PDF`, `JSON` (`Domain/Enums/ExportEnums.cs:20-23`). The 736-test count is
accurate; the code that would run those tests is bit-rotted, not merely unreferenced.
`LoginActivityFunctionalTest.csproj` builds cleanly by comparison: the break is specific to
`Domain.Tests`. Two more test locations sit outside any `.csproj` at all rather than outside the
`.sln`: `tests/Application/Services/*.cs` (four files, one of which,
`MemberSegmentationServiceTests.cs`, instantiates `MemberSegmentationService`, a class with no
implementation anywhere in `src/`) and `tests/unit-tests/MemberEngagementControllerTests.cs`.

**The JWT claims bug is broader than one missing-claim redirect.**
`UnlimitedTierRequirementHandler.cs:32` reads `context.User.FindFirst("sub")?.Value ??
context.User.FindFirst("userId")?.Value`. The token minted at `AuthService.cs:435` carries only
`ClaimTypes.NameIdentifier`, never `sub`, never `userId`, so `int.TryParse` always fails, the
handler logs a warning and calls `context.Fail()`, and every request denies. That handler backs the
`"UnlimitedTier"` policy (`Program.cs:664-665`, registered as a handler at `Program.cs:412`), which
gates ten endpoints: `AnalyticsController.cs:69,92,114,138,163` and
`EngagementController.cs:37,83,122,158,210`. All ten hard-403 on every call. A working version of
this check exists two directories over: `Application/Authorization/UnlimitedTierHandler.cs` reads a
`ClubId` claim, which the token does carry, and succeeds. It backs `"UnlimitedTierRequired"`
(`Program.cs:667-668`), a policy name one word away from the broken one's, registered three lines
apart in `Program.cs`, and never confused with each other by the type system, because nothing here
is type-checked against the claim set it depends on. The same `FindFirst("sub") ??
FindFirst("userId")` pattern, against the same token that carries neither, also appears at
`MemberEngagementController.cs:69,272`, and, previously undisclosed, at `AnalyticsController.cs:39`
and `EventEngagementController.cs:231,401`. Five call sites in total, each returning `Unauthorized`
on every call because the identity check can never succeed.

**Eleven domain entities have no `DbSet`** and are therefore unmapped: `AccountDeletionRequest`,
`AuditLog`, `ComplianceResult`, `DataExport`, `EventCancellationTracking`,
`EventSignUpTimingAnalysis`, `EventTemplate`, `ExportAuditInfo`, `ExportRequest`,
`FeatureAccessControl`, `SecurityEvent`. Ninety entity classes, eighty-four `DbSet`s.

**`Application` takes a project reference on `Infrastructure`.** This inverts the clean-architecture
dependency rule and is the first thing a reviewer checks. The correct shape is repository interfaces
in `Application` implemented in `Infrastructure`; services here take `GatherGroveDbContext`
directly, so that abstraction was never built and the reference cannot simply be deleted. Undoing it
means touching most of the 93 services.

**Duplicate and conflicting DI registrations, in two places.** `IAdvancedAnalyticsRepository` is
registered three times across three files with two different implementations, and
last-registration-wins decides silently which one runs. An entire composition root,
`AddInfrastructure()`, is defined in `Infrastructure/DependencyInjection.cs` and never called from
`Program.cs`; its only callers are tests, which means those tests verify wiring that production does
not use. A second, separate composition root, `AddApplicationServices()`
(`Application/Extensions/ServiceCollectionExtensions.cs:23`), registers `ILoginActivityService` and
is never called anywhere in this codebase, including tests: it is the reason
`admin-analytics.png` shows "Failed to load login activity data" (see [Screenshots in the
README](../README.md#screenshots)). `IMemberSegmentationService` has no implementing class anywhere
in `src/`; registering it under either composition root would not fix
`MemberSegmentationController`, because the feature has no backend.

**Sixteen Radix UI packages are globally mocked** in `client/jest.config.js`, against this project's
own stated boundary rule. Component tests render stubs rather than real primitives.

**The database seeder is unreliable.** `scripts/seed-database.ps1` fails on a significant fraction
of event creations with `400 Bad Request`, so a clean run does not reliably produce a fully
populated database. Since the README invites reproduction of the screenshots, this is the first
thing someone trying it will hit.

**`.lighthouserc.js` asserts perfect 100s** across all four categories as hard errors, and targets
the mobile Expo web build rather than the Next.js client. Nothing runs it. It is aspirational
configuration and should either be fixed or deleted.
