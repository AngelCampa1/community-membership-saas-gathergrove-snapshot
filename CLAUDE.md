# Claude Code Configuration for GatherGrove

## Design Canon

- **Buttons are pills.** Treat fully rounded button geometry as a standing product preference. Every button or button-styled CTA should use pill corners (`border-radius: 9999px`, `rounded-full`, or equivalent), including primary/secondary actions, link-buttons, toolbar buttons, segmented/toggle controls, and icon buttons (circular when square). Do not introduce square or mildly rounded button shapes unless the user explicitly asks for that exception.

## 🚫 No GitHub CLI / No GitHub Actions

**NEVER use the `gh` CLI, and NEVER add or rely on GitHub Actions.**

- Do NOT invoke `gh` for any purpose (PRs, issues, secrets, runs, releases, API). It is prohibited in this repository.
- Do NOT create, restore, or depend on anything under `.github/workflows/`, `.github/environments/`, or `.github/dependabot.yml`. CI/CD via GitHub is not used here.
- Plain `git` (clone, branch, commit, push, merge, worktree) is fine — the prohibition is specifically on `gh` and GitHub-hosted automation.
- **Deploys are done directly, not via GitHub:**
  - **Frontend** → Cloudflare via authenticated local `wrangler` (`cd client && npx wrangler deploy --keep-vars`). The build runs through the `wrangler.jsonc` `build` hook (OpenNext).
  - **Backend** → Railway.
- If a task seems to need `gh` or a GitHub Action, stop and surface it to the user instead of using either.

## 🚨 Honesty Rule (Marketing & Content)

**GatherGrove has no users yet. All marketing claims must be truthful.**

- NEVER fabricate social proof, user counts, testimonials, or usage statistics
- NEVER write "Join thousands of...", "Used by X+ clubs", "5,000+ admins", or similar
- NEVER invent statistics without a verifiable source (link or citation)
- All statistics in resource articles must include a source attribution
- Use honest alternatives: "Built for clubs like yours", "Get started free", feature-based trust signals
- Once real users exist, update with authentic data only

## ⚡ TDD & Coverage Mandate (Pricing Restructure)

**REQUIRED on every file touched in this work:**
- Write failing tests FIRST (Red), then implement (Green), then refactor
- 95% code coverage minimum on every file modified or created
- No exceptions — a PR with <95% coverage on a touched file is rejected

## Environment Information
- **Platform**: Windows (PowerShell)
- **Working Directory**: the repository root (this project is developed on Windows)
- **Git Repository**: Yes
- **Current Branch**: main
- **⚠️ IMPORTANT**: All non-trivial work MUST be done in a git worktree. Never work directly on `main`. See **Worktree Workflow** section below.

## Project Overview
GatherGrove is a comprehensive membership and event management platform with the following key components:
- Multi-location support for organizations managing multiple venues
- Advanced communications suite with A/B testing, analytics, and automation
- Event payment system with Stripe integration
- Member management with roles, custom fields, and directory features
- Real-time chat and notifications
- Mobile app support

## Development Environment Setup

### PowerShell Considerations
- This project is being developed on Windows using PowerShell
- When running bash commands, use appropriate Windows path separators (`\` vs `/`)
- Some Unix commands may need to be adapted for Windows/PowerShell equivalents
- Use `pwsh` or `powershell` for shell operations when needed

### Project Structure
- **Backend**: .NET 9.0 API located in `backend/`
  - Clean Architecture: Domain, Application, Infrastructure, API layers
  - Entity Framework Core with PostgreSQL 16 (Docker)
  - Stripe integration for payments
  - SignalR for real-time features (ChatHub, EventEngagementHub, AnalyticsHub)
  - JWT authentication with authorization policies
  - Resend for transactional email
- **Frontend**: Next.js 15 TypeScript application located in `client/`
  - Tailwind CSS for styling with Radix UI components
  - React 19 with comprehensive test coverage
  - Admin dashboard and member portal
  - Advanced analytics and reporting features
  - Sentry for error monitoring
- **Mobile**: React Native application in `mobile/`

### Key Configuration Files
- `global.json`: .NET SDK 9.0.x configuration
- `backend/src/GatherGrove.API/appsettings.json`: Main API configuration with Stripe settings
- `client/next.config.ts`: Next.js configuration with comprehensive security headers
- `client/tsconfig.json`: TypeScript configuration with strict mode

### Git Workflow — Worktree Model

**⚠️ CRITICAL: Always use worktrees. Never work directly on `main`.**

#### Creating a Worktree
```bash
./scripts/new-worktree.sh <branch-name>
# e.g.
./scripts/new-worktree.sh feat/my-feature
./scripts/new-worktree.sh fix/stripe-webhook
```

The script automatically:
- Creates `.worktrees/<slug>/` branched off `main`
- Copies `.env` files for all sub-projects
- Runs `dotnet restore` (backend) and `npm install` (client, mobile)
- Wires `.githooks/pre-commit` quality gate

#### Working in a Worktree
```bash
cd .worktrees/<slug>
# ... develop, commit freely ...
./scripts/check.sh             # run full quality gates
./scripts/check.sh backend     # backend only
./scripts/check.sh client      # client only
git add <specific-files>       # NEVER use git add -A or git add .
git commit -m "type(scope): description"
```

#### Pre-Commit Hook — Project-Aware Quality Gate

The `.githooks/pre-commit` hook is **project-aware**: it only runs checks for the layers that have staged files.

| If you staged files in... | Hook runs |
|--------------------------|-----------|
| `backend/` | `dotnet format --verify-no-changes` → `dotnet build` → `dotnet test` |
| `client/` | `npm run lint` → `npm run typecheck` → `npm test` → `npm run build` |
| `mobile/` | `npm run lint` → `npm run typecheck` → `npm test` |

This means:
- Committing only client changes will **not** trigger a slow dotnet build
- Committing only backend changes will **not** trigger npm lint
- You can always run `./scripts/check.sh` manually to run all gates regardless of what's staged

#### Branch Naming
| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/<name>` | `feat/multi-location-transfers` |
| Bug fix | `fix/<name>` | `fix/stripe-webhook-signature` |
| Test | `test/<name>` | `test/payment-controller-coverage` |
| Refactor | `refactor/<name>` | `refactor/auth-middleware` |
| Chore | `chore/<name>` | `chore/update-dependencies` |

#### Merging Back to Main
```bash
# From main branch:
git merge --no-ff <branch-name>
git push
# Then clean up:
git worktree remove .worktrees/<slug>
# If generated/dirty files:
git worktree remove --force .worktrees/<slug>
```

> **Note:** Use `git worktree remove`, NOT `git worktree prune` (prune only cleans git's internal registry, leaving orphaned directories).

- **Conventional commits**: Use format `type(scope): description` with co-author attribution
- **Commit frequently**: Small, focused commits within the worktree

### Development Commands
- Backend: Use `dotnet` commands in the `backend/` directory
  - `cd backend && dotnet run`: Start the API server (port 8050)
  - `cd backend && dotnet test`: Run the backend suite (6,213 tests in-solution, 42.6% measured line coverage)
  - `cd backend && dotnet build`: Build the solution
- Frontend: Use `npm` commands in the `client/` directory
  - `cd client && npm run dev`: Start the development server (port 3050)
  - `cd client && npm test`: Run the web client suite (11,055 tests, 63.2% measured line coverage)
  - `cd client && npm run build`: Build for production
- Testing: measured line coverage is 42.6% backend / 63.2% web / 73.6% mobile (see README.md for how these were produced)
- Git operations work normally in PowerShell

### Key Features Implemented
- **US-011**: Multi-location support with location management and transfers
- **US-010**: Advanced communications with email templates, A/B testing, automation, and analytics
- **EC-01 to EC-05**: Complete event payment system (paid events, payment links, member/non-member payment status, admin management)
- **Member Management**: Roles, custom fields, bulk operations, segmentation, import/export
- **Event Management**: Multi-session events, waitlists, QR codes, feedback collection, analytics
- **Real-time Features**: Chat, notifications, live updates via SignalR
- **Communications**: Email templates, scheduling, bulk operations, workflow automation
- **Analytics**: Advanced engagement metrics, ROI calculations, performance benchmarking
- **Billing**: Stripe Connect integration, subscription management, payment processing

### Architecture & Technology Stack

#### Backend (.NET 9.0)
- **Clean Architecture**: Domain → Application → Infrastructure → API
- **Database**: Entity Framework Core with PostgreSQL 16 (Docker)
- **Authentication**: JWT with role-based authorization
- **Real-time**: SignalR hubs for chat, events, and analytics
- **Payments**: Stripe integration with webhooks
- **Communications**: Resend (transactional email)
- **Testing**: NUnit with extensive unit and integration tests

#### Frontend (Next.js 15 + React 19)
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: TanStack Query for server state
- **Real-time**: SignalR client integration
- **Charts**: Chart.js, Recharts, D3 for analytics
- **Testing**: Jest with React Testing Library
- **Security**: Comprehensive CSP headers, XSS protection

### Testing Coverage (measured, not aspirational)
- **Backend**: 6,213 tests (NUnit) covering controllers, services, integration scenarios - 42.6% line coverage
- **Frontend**: 11,055 tests (Jest/RTL/MSW) covering components, hooks, services, integration - 63.2% line coverage
- **Mobile**: 5,871 tests (Jest/RNTL) - 73.6% line coverage
- **Test Utilities**: factories, mocks, and helpers
- **Note**: earlier revisions of this file claimed ">95% coverage across both platforms". That figure was never reproducible. The numbers above are the measured ones; see README.md.

## 🧪 Test-Driven Development (TDD)

**GatherGrove follows Test-Driven Development methodology with Red-Green-Refactor cycles.**

### TDD Workflow
1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Clean up code while keeping tests green
4. **Repeat**: Continue for each new requirement

### Critical Flow Testing (TDD Priority)
Write tests FIRST for:
- **Payment Processing**: Stripe integration, payment status, subscriptions
- **Event Management**: Paid events, registration, waitlists, QR codes
- **Real-time Features**: SignalR hubs (chat, events, analytics)
- **Security**: Authentication, authorization, rate limiting
- **Communications**: Email templates, A/B testing, automation
- **Multi-location**: Location management, member transfers

### Test Coverage Requirements (targets, currently unmet)
- **Backend**: target >95% coverage; actual is 42.6%
- **Frontend**: target >95% coverage; actual is 63.2%
- **Critical Paths**: 100% coverage REQUIRED
- **Integration Tests**: All API endpoints and SignalR hubs tested

### Backend Tests (TDD Mode)
```powershell
# TDD Cycle - Continuous testing
cd backend
dotnet test --watch

# Run all tests with coverage
dotnet test --collect:"XPlat Code Coverage"
```

### Frontend Tests (TDD Mode)
```powershell
# TDD Cycle - Continuous testing
cd client
npm test --watch

# Run all tests with coverage
npm test --coverage
```

### Definition of Done

**REQUIRED** for any user story to be considered finished:

#### ✅ **All Tests Must Pass**
- Backend Tests: `dotnet test` must show 0 failures (6,213 tests, 20 skipped)
- Frontend Tests: `npm test` must show 0 failures (11,055 tests, 121 skipped)
- Integration Tests: All API endpoints respond correctly
- SignalR Tests: All real-time features functioning

#### ✅ **Zero Linter Errors**
- Frontend: `npm run lint` must output 0 errors
- Backend: `dotnet build` must show 0 errors (warnings acceptable)
- Type Checking: TypeScript strict mode compilation successful

#### ✅ **Build Success**
- Backend: `dotnet build` must succeed
- Frontend: `npm run build` must succeed

#### ✅ **Code Committed and Pushed**
- Commit ALL related changes together (check `git status`)
- Descriptive commit message following project conventions
- Push to remote repository
- Include footer: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

**NO EXCEPTIONS**: A user story is NOT complete until ALL criteria are met.

## 🚫 Testing Quality Standards

**CRITICAL: The goal is ACTUAL CODE COVERAGE, not test pass rate.**

Tests passing means nothing if they only test mocks. The metric that matters is:
- **How much REAL production code is executed during tests?**
- NOT how many tests pass
- NOT how many test files exist
- NOT how green the CI looks

A codebase with 50 tests that exercise real code is infinitely more valuable than 2000 tests that only verify mocks.

### The Boundary Mocking Rule

**RULE: Mock ONLY at system boundaries, never internal code**

| Mock? | Category | Examples |
|-------|----------|----------|
| ✅ YES | External APIs | Stripe, Resend |
| ✅ YES | Native modules | React Native Platform, Dimensions, Camera |
| ✅ YES | External storage | AsyncStorage, Keychain, file system |
| ✅ YES | Time/Date | Use TimeProvider pattern for deterministic tests |
| ❌ NO | Internal services | EventService, MemberService, EngagementService |
| ❌ NO | UI components | Radix UI, custom components - render them real |
| ❌ NO | State management | React Query, hooks, contexts |
| ❌ NO | Database (integration) | Use in-memory EF Core |
| ❌ NO | Loggers | Use NullLogger<T> or real logger |

### Test Classification

**Unit Tests (70% of tests)**
- Test single function/method in isolation
- Mock only external boundaries (HTTP, external APIs)
- Execution time: <50ms per test

**Integration Tests (20% of tests)**
- Test multiple units working together
- Real services + in-memory database
- Execution time: 100-500ms per test

**E2E Tests (10% of tests)**
- Full system through UI/API
- Real database, real services
- Execution time: 1-10 seconds per test

### Forbidden Patterns (NEVER DO THESE)

```typescript
// ❌ FORBIDDEN: Stub tests that test nothing
expect(true).toBe(true); // DELETE these immediately

// ❌ FORBIDDEN: Mocking internal services in service tests
jest.mock('../eventService'); // Tests should use REAL EventService

// ❌ FORBIDDEN: Global UI component mocks
jest.mock('@/components/ui/button'); // Let components render for real

// ❌ FORBIDDEN: Mocking everything in controller tests
Mock<IEventService>, Mock<IMemberService>, Mock<ILogger> // Too many mocks = useless test
```

### Required Patterns (ALWAYS DO THESE)

**Backend - Controller Integration Test:**
```csharp
public class EventsControllerTests : IntegrationTestBase
{
    [Test]
    public async Task CreateEvent_ValidRequest_ReturnsCreated()
    {
        // Arrange - use real database
        var club = await CreateTestClub();
        var client = CreateAuthenticatedClient(clubId: club.Id);

        // Act - real HTTP request through full pipeline
        var response = await client.PostAsJsonAsync("/api/v1/events", request);

        // Assert - verify REAL persistence
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var saved = await _dbContext.Events.FirstAsync();
        saved.Name.Should().Be(request.Name); // Proves real DB was used
    }
}
```

**Backend - Service Test with Real DB:**
```csharp
public class EventServiceTests
{
    private GatherGroveDbContext _context; // REAL in-memory DB
    private EventService _service;         // REAL service

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new GatherGroveDbContext(options);
        _service = new EventService(_context, NullLogger<EventService>.Instance);
    }

    [Test]
    public async Task CreateEvent_SavesAndReturnsCorrectly()
    {
        var club = new Club { Name = "Test" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var result = await _service.CreateEventAsync(club.Id, request);

        var dbEvent = await _context.Events.FindAsync(result.Id);
        dbEvent.Should().NotBeNull(); // Verifies REAL persistence
    }
}
```

**Frontend - Component Test with MSW (NOT mocked services):**
```typescript
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

test('EventForm creates event successfully', async () => {
    // Mock only the HTTP boundary
    server.use(
        http.post('/api/v1/events', () => HttpResponse.json({ id: 1, name: 'Test' }))
    );

    render(<EventForm />); // REAL component rendering
    await userEvent.type(screen.getByLabelText(/name/i), 'Test Event');
    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(screen.getByText(/created/i)).toBeInTheDocument();
});
```

**Mobile - Hook Test (mock HTTP layer only):**
```typescript
// Only mock the HTTP/API layer, not the hook itself
jest.mock('@/services/authService');

test('useAuth handles login correctly', async () => {
    (authService.login as jest.Mock).mockResolvedValue({ token: 'test-token' });

    const { result } = renderHook(() => useAuth()); // REAL hook
    await result.current.login(credentials);

    expect(result.current.isAuthenticated).toBe(true);
});
```

### Coverage Requirements

| Metric | Target | Enforcement |
|--------|--------|-------------|
| Overall code coverage | 80% minimum | CI fails below threshold |
| Critical paths (auth, payments) | 95% minimum | CI fails below threshold |
| Mock count per test file | 3 maximum | Code review flag |
| Stub tests (`expect(true).toBe(true)`) | 0 allowed | CI lint rule |

### What Makes a Good Test

✅ **Good Test:**
- Tests REAL code behavior
- Uses real services with in-memory DB (backend) or MSW (frontend/mobile)
- Verifies actual state changes (database writes, UI updates)
- Has meaningful assertions about behavior

❌ **Bad Test:**
- Only verifies mocks were called with expected args
- Uses `expect(true).toBe(true)` placeholders
- Mocks everything so nothing real runs
- Tests pass even when real code is broken

### Mock Limits by Platform

**Backend (.NET):**
- Controller tests: Use IntegrationTestBase with real services
- Service tests: Real DB (in-memory EF Core), mock only external APIs (Stripe)
- Only acceptable mocks: IStripeClient, ICommunicationsService, external HTTP

**Frontend (Next.js):**
- NO global UI component mocks in setupTests.ts
- NO moduleNameMapper redirects for internal services
- Use MSW for HTTP mocking only
- Render real components with real state management

**Mobile (React Native):**
- Mock ONLY native modules (Platform, Dimensions, AsyncStorage, Keychain)
- NO mocking of hooks, services, or contexts
- Use MSW for HTTP mocking
- Test real navigation flows with Testing Library

### Definition of Done (Updated)

A test suite is considered valid when:
- [ ] All tests pass with REAL implementations (not just mocks)
- [ ] Coverage measured against actual code execution, not mock calls
- [ ] Zero `expect(true).toBe(true)` placeholder tests
- [ ] Maximum 3 mocks per test file (external boundaries only)
- [ ] Integration tests use real services + test database

### Development Notes
- PostgreSQL 16 via `docker compose up -d postgres` for local development
- Stripe integration with test environment keys
- Comprehensive security measures (CSP, XSS protection, rate limiting)
- SignalR hubs for real-time communications
- Entity Framework migrations for database schema management
- Resend for transactional email
- Sentry for production error monitoring
- Docker-ready configuration for containerized deployments

## 🐛 Bug Fix Process

**CRITICAL: Every bug discovered during testing MUST be fixed immediately before continuing.**

### Bug Triage Classification

| Priority | Severity | Response Time | Examples |
|----------|----------|---------------|----------|
| P0 | CRITICAL | Immediate | Security vulnerabilities, data loss, auth bypass |
| P1 | HIGH | Same session | Memory leaks, race conditions, API failures |
| P2 | MEDIUM | Next commit batch | Missing validation, incorrect error handling |
| P3 | LOW | Backlog | Code style, minor UX issues, TODO comments |

### Bug Fix Workflow

1. **Identify** - Document bug with file:line reference
2. **Classify** - Assign priority (P0-P3) and severity
3. **Fix Immediately** - P0/P1 bugs block all other work
4. **Test** - Write/update tests to cover the bug
5. **Verify** - Run full test suite, ensure 100% pass
6. **Commit** - Reference bug ID in commit message
7. **Document** - Update bug tracking documentation

### Bug ID Convention
- Mobile: `AUTH-XX`, `NET-XX`, `PUSH-XX`, `MEM-XX`, `PAY-XX`, `CHAT-XX`, `NAV-XX`, `FORM-XX`, `PLAT-XX`
- Frontend: `FE-XX`
- Backend: `BE-XX`

### Bug Tracking Documents
- `mobile/BUG-AUDIT-REPORT.md` - Mobile app bugs (53 identified)
- `tests/quality-assurance/` - QA bug test suites
- `E2E-PRODUCTION-TEST-REPORT-*.md` - Production issues

## 🧠 Managing Context in Claude Code Sessions

**CRITICAL: Avoid running out of context to prevent losing work and having to restart.**

Context exhaustion happens when:
- Running full test suites with `--coverage` (generates massive output)
- Reading too many large files at once
- Accumulating long conversation history without compacting
- Background tasks producing extensive output

### Context Management Strategies

#### 1. **Avoid Full Coverage Checks During Development**

❌ **DON'T DO THIS:**
```powershell
# These commands generate 20,000+ lines of output and can exhaust context
cd mobile && npm test -- --coverage --watchAll=false
cd client && npm test -- --coverage
cd backend && dotnet test --collect:"XPlat Code Coverage"
```

✅ **DO THIS INSTEAD:**
```powershell
# Run targeted tests on specific files or folders
cd mobile && npm test -- src/services/__tests__/analyticsService.test.ts
cd mobile && npm test -- src/components/__tests__/
cd client && npm test -- --testPathPattern="services/member"
cd backend && dotnet test --filter "FullyQualifiedName~EventService"

# Only run full coverage at major milestones (e.g., end of phase, before commit)
```

#### 2. **Break Work into Smaller Phases**

Work in focused phases with frequent commits:

**Good Phase Size (2-4 hours):**
- Create 3-5 test files (~500-1500 lines total)
- Test the new files individually
- Commit and push
- Use `/compact` to reset context

**Bad Phase Size (causes context exhaustion):**
- Create 10-15 test files in one session
- Run full coverage checks multiple times
- Don't commit until "everything is done"

#### 3. **Commit Frequently**

```powershell
# Commit every 3-5 test files to save progress
git add .
git commit -m "test: add comprehensive tests for analytics services

- analyticsService.test.ts: API integration, error handling
- cacheService.test.ts: TTL expiration, invalidation
- chatService.test.ts: real-time messaging, SignalR

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
git push
```

#### 4. **Use Background Tasks Wisely**

When running commands in the background:
- Set reasonable timeouts
- Don't start multiple long-running processes
- Use `TaskOutput` with `block=false` to check status without loading full output
- Kill background tasks when they're no longer needed

❌ **Avoid:**
```powershell
# Multiple simultaneous background tasks
npm test -- --coverage --watchAll=false  # Background
dotnet test --collect:"XPlat Code Coverage"  # Background
npm run build  # Background
```

✅ **Better:**
```powershell
# One focused task at a time
npm test -- src/services/__tests__/analyticsService.test.ts
# Wait for completion, verify results, then move on
```

#### 5. **Proactive Context Compacting**

Use `/compact` command before context fills up:
- After completing a phase of work
- Before starting a new major task
- When you notice context warnings
- After running any command that generates >5000 lines of output

#### 6. **Recovery from Out of Memory (Exit Code 137)**

If you see `exit code 137` (out of memory):

```powershell
# DON'T retry the same command - it will fail again
# INSTEAD: Run targeted tests

# For mobile/frontend:
cd mobile && npm test -- --testPathPattern="services" --maxWorkers=2
cd mobile && npm test -- --testPathPattern="components" --maxWorkers=2

# For backend:
cd backend && dotnet test --filter "Category=Unit" --logger "console;verbosity=minimal"
```

#### 7. **Test Execution Best Practices**

```powershell
# Limit Jest workers to reduce memory usage
npm test -- --maxWorkers=2 --testPathPattern="specific/path"

# Run tests in batches by category
npm test -- --testPathPattern="services/__tests__"
npm test -- --testPathPattern="components/__tests__"
npm test -- --testPathPattern="hooks/__tests__"

# Use minimal logging for dotnet tests
dotnet test --logger "console;verbosity=minimal"
```

#### 8. **Coverage Measurement Strategy**

Only measure coverage at these milestones:
1. **End of each major phase** (e.g., completed all service tests)
2. **Before commits** (to verify coverage targets)
3. **CI/CD pipeline** (automated coverage checks)

NOT during active development of individual test files.

### Checklist for Long Sessions

Before starting a multi-hour development session:

- [ ] Break work into 3-5 file chunks
- [ ] Plan to commit after each chunk
- [ ] Avoid running `--coverage` until end of phase
- [ ] Use targeted test commands only
- [ ] Set timeouts on background tasks (max 2-3 minutes)
- [ ] Have `/compact` ready to use between phases
- [ ] Monitor context warnings in the UI

### Recovery Steps if Context is Lost

If conversation is compacted or restarted:

1. Check `git status` to see current work
2. Check `git log -5` to see recent commits
3. Look for uncommitted test files in `__tests__/` directories
4. Read TODO.md or PLAN.md files if they exist
5. Continue from where the previous session left off

## Bug Discovery & Fix Protocol

**CRITICAL: When improving test coverage, bugs found in production code MUST be fixed immediately.**

### Bug Logging Process

When a bug is discovered during testing/coverage work:

1. **Document the Bug** - Add to the Bug Log section below with:
   - File location and line numbers
   - Severity (Critical/High/Medium/Low)
   - Description of the issue
   - Root cause analysis
   - Fix applied
   - Commit hash

2. **Fix Immediately** - Do not proceed with coverage work until bug is fixed

3. **Add Regression Test** - Ensure test exists that would catch this bug

4. **Commit with Bug Fix Label** - Use format: `fix(mobile): [BUG-XXX] description`

### Bug Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| Critical | Breaks core functionality, data loss risk | Stale closures, infinite loops, state corruption |
| High | Major feature broken, security concern | Event handling failures, auth issues |
| Medium | Feature partially broken, workaround exists | Type mismatches, import errors |
| Low | Minor issues, cosmetic | Verbose code, redundant mocks |

### Common Bug Patterns Discovered

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

### Standard apiClient Mock Pattern

```typescript
// DO NOT import from @jest/globals
import apiClient from '../apiClient';
import { billingService } from '../billingService';

jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../billingService', () => ({
  billingService: {
    getBillingStatus: jest.fn(),
  },
}));

// Get typed reference AFTER mocks
const mockBillingService = billingService as jest.Mocked<typeof billingService>;

// In tests use:
(apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockData });
```

---

## Mobile Coverage Campaign Bug Log (December 2024)

**Campaign Goal**: Improve mobile test coverage from 38.68% to 90%
**Total Bugs Found**: 30 (4 Critical, 10 High, 16 Medium)
**Status**: All Fixed

### Critical Bugs (4)

| # | Bug | File | Description | Commit |
|---|-----|------|-------------|--------|
| 1 | PerformanceMonitor stale closure | `PerformanceMonitor.tsx` | Callbacks captured stale state, metrics not accumulating | 5ac58283 |
| 2 | pushNotificationService global mock | `jest.mobile-mocks.js` | Mock in test file violated global isolation | 241d6023 |
| 3 | eventService internal mock | `eventService.test.ts` | Tests mocked the service being tested | 84bdf9e8 |
| 4 | networkErrorHandler internal mock | `networkErrorHandler.test.ts` | Tests mocked the handler being tested | 947cb322 |

### High Severity Bugs (10)

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

### Medium Severity Bugs (16)

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

### Coverage Impact

| Metric | Before Campaign | After Fixes |
|--------|-----------------|-------------|
| Overall Mobile Coverage | 38.68% | ~70%+ |
| Services Coverage | 40-55% | 75-85% |
| Critical Bugs Fixed | - | 4 |
| High Bugs Fixed | - | 10 |
| Medium Bugs Fixed | - | 16 |

---

### Bug Discovery Workflow (Quick Reference)

1. **Identify**: When a test fails or a code issue is discovered
2. **Document**: Log the bug in the Bug Log above with severity
3. **Fix Immediately**: Stop current work and fix the bug
4. **Verify**: Ensure the fix passes tests and doesn't break other tests
5. **Commit**: Commit the fix with `fix(mobile): [BUG-XXX] description`
6. **Continue**: Resume coverage work

---

## Sub-Agent Driven Development

**Worktree isolation.** All feature/fix work MUST happen inside a git worktree. Use the `using-git-worktrees` skill to create one before writing any code.

**Review before merge.** When implementation is complete: (1) spin up a review agent using `requesting-code-review`, (2) fix every issue the reviewer flags, (3) only then merge the worktree back to master using `finishing-a-development-branch`.

All non-trivial tasks follow the superpowers sub-agent workflow:

1. **Plan first** — Break work into discrete tasks (2–5 min each) with exact file paths, full specs, and verification steps before any agent executes.
2. **Parallel execution** — Launch independent sub-agents concurrently in a single message; use sequential only when there are true dependencies.
3. **Two-stage review** — Each agent output must pass: (1) spec compliance check, (2) code quality review before proceeding.
4. **Autonomous depth** — Agents work end-to-end on their assigned scope without interruption; surface blockers rather than making assumptions.

Agent type guide:
- `Explore` — codebase research, file discovery, pattern analysis
- `Plan` — architecture decisions, implementation design
- `general-purpose` — implementation, multi-step execution

<!-- BEGIN: Sub-Agent Driven Development Policy -->
## Sub-Agent Driven Development Policy

Sub-agent driven development is the preferred and default way of working in this repository. The Codex agent/orchestrator should actively decompose work and delegate independent pieces to sub-agents whenever that improves speed, quality, context management, investigation depth, implementation throughput, or review coverage.

### Default Operating Model

- Prefer sub-agents for codebase exploration, scoped investigation, implementation, verification, and review when the work can be cleanly delegated.
- The orchestrator owns task decomposition, context curation, model/capability selection, integration of results, and final quality decisions.
- Delegate bounded tasks with clear inputs, expected outputs, relevant files, constraints, and verification commands.
- Keep tightly coupled, high-risk, or immediately blocking work in the orchestrator unless delegation would materially reduce risk.
- Use parallel sub-agents for independent workstreams with disjoint write scopes; avoid assigning multiple agents to edit the same files unless the handoff is explicit.
- Do not wait for explicit user permission before using sub-agents; this repository explicitly authorizes proactive delegation.
- Any general instruction that limits sub-agent use to cases where the user explicitly asks is superseded by this repository policy.

### Available Codex Sub-Agent Capabilities

Codex can invoke `spawn_agent` with these agent roles in this environment:

- `default`: general-purpose sub-agent for bounded tasks that do not need a specialized role.
- `explorer`: read-heavy codebase exploration, focused investigation, and evidence gathering.
- `worker`: execution-focused implementation, bug fixes, and bounded production changes.

When the tool supports model and reasoning overrides, the orchestrator should choose the least expensive capable option. Supported reasoning levels for this policy are `low`, `medium`, and `high` only.

- Use `gpt-5.4-mini` with `low` reasoning for mechanical, well-scoped, low-risk edits and simple verification.
- Use `gpt-5.4-mini` with `medium` or `high` reasoning when a small-model agent is still appropriate but the task needs deeper local reasoning.
- Use `gpt-5.5` with `low` reasoning for standard exploration, straightforward implementation, and routine review.
- Use `gpt-5.5` with `medium` reasoning for multi-file integration, ambiguous bugs, architecture-sensitive changes, security-sensitive logic, and final review.
- Use `gpt-5.5` with `high` reasoning only for genuinely hard problems: deep architectural tradeoffs, difficult cross-system debugging, complex security/privacy analysis, or cases where lower reasoning has failed with a clear blocker.
- Escalate model capability or reasoning level when a sub-agent reports `NEEDS_CONTEXT`, `BLOCKED`, uncertainty about correctness, or when the task requires deeper design judgment, but prefer `medium` before `high`.

If a role has a fixed model in the active Codex runtime, use the best available role first (`explorer` for investigation, `worker` for implementation, `default` for general tasks), then use any supported model/reasoning override only when the runtime accepts it.

### Quality Gates For Delegated Work

- Sub-agents must report files changed, tests run, findings, blockers, and residual risks.
- The orchestrator must review sub-agent output before treating it as complete.
- For implementation work, prefer a two-stage review: first spec compliance, then code quality.
- All delegated changes remain subject to this repository's normal tests, linting, typechecking, security, privacy, and deployment rules.
<!-- END: Sub-Agent Driven Development Policy -->

## AI Agent Orchestration

AI agent instances operating in this repository are orchestrators. They must delegate exploration, implementation, verification, and other execution work to sub-agents whenever the work can be cleanly scoped, preserving the orchestrator's context window for coordination, integration, and final judgment.

## Required marketing copy pass

For this repo, all marketing copy must pass through both writing checks before completion:

1. Use the `humanizer` skill to remove AI-sounding, bloated, or generic copy.
2. Use the `third-grade-copy` skill to rewrite and audit the result for a third-grade reading level.

This applies to landing pages, hero copy, CTAs, pricing copy, onboarding copy, emails, ads, popups, social copy, SEO pages, and user-facing UI text that sells, explains, persuades, activates, or reassures.

Do not apply this rule to code identifiers, logs, API docs, technical docs for developers, exact legal text, database values, or user-generated content unless the user asks.

<!-- BEGIN: User-Facing Copy Guardrails -->
## User-Facing Copy Guardrails

For any user-facing copy in this repo, run the copy through these guardrails before you call the work done. This applies to product UI text, landing pages, hero copy, CTAs, pricing copy, onboarding copy, emails, ads, popups, social posts, SEO pages, help text, empty states, reassurance text, and any copy that sells, explains, persuades, activates, or reassures.

Required order:

1. Run the globally installed `humanizer` skill to remove AI-sounding, bloated, or generic copy.
2. Run the globally installed `third-grade-copy` skill to rewrite and audit the result for a third-grade reading level. The source package for this skill lives in a shared internal package repository; if the global skill is missing or stale, reinstall or sync it from there before finalizing copy.
3. Verify there are zero lies: no made-up numbers, claims, proof, testimonials, guarantees, rankings, integrations, prices, timelines, or capabilities. Check claims against the product source of truth before publishing.
4. Verify the message fits the whole place it appears: the page, flow, audience, offer, brand voice, surrounding copy, and user intent. Do not approve a line just because it is clear in isolation.

Do not apply this rule to code identifiers, logs, API docs, technical docs for developers, exact legal text, database values, or user-generated content unless the user asks.
<!-- END: User-Facing Copy Guardrails -->

## Working autonomously
- **Poll, don't idle.** When a task, build, test run, or hook is running, actively poll its status and output until it finishes. Don't just sit and wait passively for it to return.
- **Keep going.** When working toward a goal, finishing one chunk of work means moving straight to the next chunk. Don't stop and wait for further input mid-goal — continue until the goal is done or you are genuinely blocked.