# Testing

This document covers how the four test suites are organized, what mocks stop at, and where the
suite structure itself has gaps. For the coverage tooling these suites use, and why no coverage
percentage is published from this snapshot, see
[`portfolio/METRICS.md`](./METRICS.md#coverage-tooling).

---

## The boundary-mocking rule

`CLAUDE.md` states one rule for all three platforms: mock only at system boundaries, never
internal code.

| Mock? | Category | Examples |
|---|---|---|
| Yes | External APIs | Stripe, Resend |
| Yes | Native modules | React Native `Platform`, `Dimensions`, camera |
| Yes | External storage | `AsyncStorage`, Keychain, file system |
| No | Internal services | `EventService`, `MemberService`, `EngagementService` |
| No | UI components | Radix UI and custom components render for real |
| No | Database (integration tests) | In-memory EF Core, not a mocked `DbContext` |

Backend service tests use `DbContextOptionsBuilder.UseInMemoryDatabase` and assert against
persisted rows: a test proves a row exists in the database, not that a mock method was called.
Frontend and mobile component tests intercept HTTP with MSW so the component, hook, and service
layers execute for real; only the network boundary is faked.

**The rule is not perfectly followed, and that gap is on record rather than hidden.** Sixteen Radix
UI packages are globally mocked in the Jest config, which is a direct violation of the "no
component mocks" line above. It is recorded in
[ENGINEERING-LOG.md's Known compromises](./ENGINEERING-LOG.md#known-compromises) rather than
quietly left out, because a written-down rule is one a reviewer can check the code against.

---

## Backend, NUnit

Eight project directories exist under `backend/tests/`, and only four are wired into
`GatherGrove.sln`:

| Project | In `.sln`? | Status |
|---|---|---|
| `GatherGrove.API.Tests` | Yes | Runs under `dotnet test` |
| `GatherGrove.Application.Tests` | Yes | Runs under `dotnet test` |
| `GatherGrove.Infrastructure.Tests` | Yes | Runs under `dotnet test` |
| `GatherGrove.Integration.Tests` | Yes | Runs under `dotnet test` |
| `Domain` (`Domain.Tests.csproj`) | No | Does not compile: nine `CS0117` errors |
| `LoginActivityFunctionalTest` | No | Builds cleanly, but never runs in CI or locally by default |
| `Application` (`tests/Application/Services/*.cs`) | Not in any `.csproj` | Never runs |
| `unit-tests` (`MemberEngagementControllerTests.cs`) | Not in any `.csproj` | Never runs |

6,193 of those in-solution tests pass under `dotnet test`, the count printed in the root README. The
project's own prior documentation puts the four in-solution projects at 6,213 declared `[Test]`
attributes; a direct grep for that pattern, done independently while writing this document, found
6,136, within 1.2% of that claim and consistent with the same suite, not a contradiction (see
[`portfolio/METRICS.md`](./METRICS.md) for the recount methodology). Counting `[Test]` attributes
across the whole `backend/tests/` tree, including the projects that never run, gives roughly 6,880:
the gap between that figure and 6,213 is the size of the untested surface.

```bash
cd backend
dotnet test --collect:"XPlat Code Coverage"       # the four in-solution projects
dotnet build tests/Domain/Domain.Tests.csproj      # reproduces the nine CS0117 errors directly
```

Coverlet is configured via `backend/coverlet.runsettings` to exclude EF migrations, designer files,
and `AssemblyInfo.cs` from the coverage denominator, and to run with 8 parallel NUnit workers.

## Web client, Jest, React Testing Library, MSW

`client/jest.config.js` sets a global coverage threshold of 80% across lines, branches, functions,
and statements. No coverage report is committed in this tree to check that threshold against; see
[`portfolio/METRICS.md`](./METRICS.md#coverage-tooling).

A direct grep for `it(`/`test(` declarations under `client/src` found 10,964 against the project's
own prior claim of 11,055, a 0.8% gap, consistent with `it.each`/`describe.each` table-driven tests
that a single-line pattern under-counts, not with the count being invented.

```bash
cd client
npm test -- --coverage --watchAll=false
```

## Mobile, Jest, React Native Testing Library

Mirrors the client's mock discipline: only native modules (`Platform`, `Dimensions`,
`AsyncStorage`, Keychain) are mocked; hooks, services, and contexts render for real against MSW.
Three alternate config files sit alongside the active one (`jest.final.config.js`,
`jest.nuclear.config.js`, and `jest.working.config.js`), left over from the coverage campaign logged
in `docs/archived/mobile-coverage/`. The one `npm test` actually uses is `mobile/jest.config.js`,
run from `mobile/`.

A direct grep found 5,809 `it(`/`test(` declarations against the project's own prior claim of 5,871
(1.1% gap, same table-driven-test explanation as above).

## End-to-end, Playwright

41 test cases, confirmed by direct count (`grep -rE "^\s*test\(" e2e/tests --include="*.spec.ts"`),
across two spec files and six auth-partitioned projects defined in `e2e/playwright.config.ts`:

| Project | Purpose |
|---|---|
| `setup` | Mints admin and member storage states once, shared by the others |
| `admin-tests` | Authenticated as a club admin |
| `billing-lockout` | Subscription and tier-gating states |
| `member-tests` | Authenticated as a club member |
| `no-auth-tests` | Public/unauthenticated pages |
| `crm-feedback-tests` | The feedback-widget spec |

`e2e/screenshots.mjs` is the same harness that produced the captures in
[`portfolio/screenshots/`](./screenshots/): it scans rendered pages for error and loading text
rather than reporting success on navigation alone, which is why `admin-member-segments.png` and
`admin-analytics.png` were flagged as failures instead of embedded as working screenshots: see
[Screenshots in the README](../README.md#screenshots).

---

## The quality gate

`.githooks/pre-commit` is scope-aware: it diffs the staged file list and only runs the gates for
layers that changed.

| Staged path | Gate |
|---|---|
| `backend/` | `dotnet format --verify-no-changes` → `dotnet build` → `dotnet test` |
| `client/` | `npm run lint` → `npm run typecheck` → `npm test` → `npm run build` |
| `mobile/` | `npm run lint` → `npm run typecheck` → `npm test` |
| `shared/design-tokens/` | Rebuilds all four generated outputs and stages them automatically |

Each gate runs sequentially, not in parallel, and a failure at any step blocks the commit: reading
the hook script directly confirms this. `dotnet format`, `dotnet build`, and `dotnet test` each
`exit 1` on failure inside the backend function. `scripts/check.sh` runs the same gates on demand,
outside of a commit, either for all layers or a single one (`./scripts/check.sh backend`).

There is no hosted CI. Every gate above runs locally only, which is why the README carries no
build-status badge: a badge would imply automation that does not run.
