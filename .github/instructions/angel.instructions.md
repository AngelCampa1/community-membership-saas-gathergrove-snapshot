---
applyTo: '**'
---
1. Consistently use the project's defined technology stack:

Backend: .NET 8, ASP.NET Core, EF Core, MS SQL Server
Frontend: Next.js, TypeScript
Mobile (Future): React Native Adhere to established C# and TypeScript coding conventions and architectural patterns.

2. Before asking for clarification, FIRST check the specific user story file in `/docs/user-stories/` for additional context and requirements details. If a user story is unclear about a data type (e.g., in a DTO), a database constraint, API detail, or business rule (e.g., the exact calculation for a member's DuesPaidUntil date), and the information is not available in the story file, you MUST ask for clarification or state a clear, reasonable assumption before proceeding.

3. The individual user story files in `/docs/user-stories/` contain the detailed user stories and are your primary source of truth for all feature requirements. All implementation MUST be derived directly from the user stories defined in these files and MUST encompass all necessary backend and frontend code to make the feature described in the user story fully functional from an end-user perspective, unless the user story explicitly scopes the work to a single tier (e.g., "Backend Only: Refactor X" or "Frontend Only: Redesign Y").

**PREREQUISITE: You MUST have already read `/docs/status/implementation-overview.md` and the specific story's status file (per Rule 0) to understand what already exists before implementing the user story.**

Focus only on the entities, attributes, API endpoints, UI/UX descriptions, and logic explicitly mentioned in the current user story from the backlog file. When creating an entity or UI component for the first time, the current user story's definition is absolute. When modifying existing elements, clearly address how the existing structure needs to change based on the current story.

Don't forget to always create meaningful backend and frontend tests, this is required to consider a user story implemented. Do not come back to me until feature is fully implemented, tests are added and all tests pass.

4. The "User Journey," "API Endpoint," and "Database Interaction" sections of any user story are direct implementation instructions. Follow them precisely. If a story states "The system must...", it is a non-negotiable requirement.

5. **MANDATORY RULE: Before implementing ANY user story, feature, or making code changes, you MUST:**

1. **READ `/docs/status/implementation-overview.md` FIRST** - This document contains the complete current state of the repository
2. **READ the specific user story from `/docs/user-stories/`** - This contains detailed requirements for the feature you're implementing
3. **READ the story's status file from `/docs/status/`** - Check what has already been implemented for this specific story
4. **Review current repository structure** - Understand available components, services, and patterns
5. **Understand existing API endpoints and services** - Build upon established infrastructure
6. **Check test coverage and build status** - Ensure you're working with a stable foundation

**MANDATORY RULE: After completing ANY user story implementation, you MUST:**

1. **UPDATE the story's status file in `/docs/status/`** - Document everything that was implemented for this specific story
2. **UPDATE `/docs/status/implementation-overview.md`** - Update the high-level project status
3. **Mark the user story as completed** - Update the status and completion date in the story's status file
4. **Document new repository structure** - Add any new files, components, or services created
5. **Update database schema section** - Include any new entities or migrations
6. **Document new API endpoints** - Add endpoints to the story's status file
7. **Update testing status** - Include new test counts and coverage
8. **Note any dependencies added** - Document new packages or tools introduced
9. **Add important notes** - Include any caveats, TODOs, or considerations for future development

**This document prevents:**
- Duplicate implementations that waste time
- Breaking existing functionality that already works
- Inconsistent architecture decisions that create technical debt
- Missing dependencies or incomplete setup steps
- Reinventing solutions that already exist

**The `/docs/status/implementation-overview.md` file contains:**
- ✅ Complete status of all user stories (what's done, what's in progress)
- 🏗️ Current repository structure with exact file locations
- 🗄️ Database schema and entity status
- 🔗 Available API endpoints and their functionality
- 🎨 UI/UX features already implemented
- 🧪 Current testing status and coverage
- 🚀 Available building blocks ready for use
- 📝 Important notes for future development

**Individual story files in `/docs/user-stories/` contain:**
- Detailed user story specifications
- User journey descriptions
- API endpoint requirements
- Database interaction specifications
- UI/UX requirements
- Acceptance criteria

**Individual status files in `/docs/status/` contain:**
- Specific implementation details for each story
- What was built (backend, frontend, database)
- Testing status for the story
- Files created/modified
- Implementation notes and challenges

**Examples of what you'll discover:**
- Authentication system is complete (login/register) with JWT cookies
- Appearance is fixed to the light theme; do not add user-selectable theme controls
- Shadcn/ui component library is ready for use
- EF Core database context is configured with User, Club, ClubAdmin entities
- Testing frameworks are set up for both backend (NUnit/Moq) and frontend (Jest)

**VIOLATION OF THIS RULE leads to:**
- Wasted development time on features that already exist
- Breaking changes to working functionality
- Inconsistent code patterns across the project
- Missing critical dependencies or setup steps

6. Encapsulate business logic in dedicated service classes (e.g., MemberService, PaymentService), keeping controllers thin. ALL database and external API operations MUST be async/await. Use constructor injection for dependencies (GatherGroveDbContext, services), registering them with appropriate lifetimes in Program.cs. Use .AsNoTracking() for all read-only queries.
7. Define API endpoints and dedicated C# DTO classes for request/response bodies based on the user story's "API Endpoint" section (e.g., CreateMemberRequest, MemberResponse). Do NOT use EF Core entities directly in API signatures. Adhere to RESTful principles and the established /api/v1/... route structure.
8. When a user story implies data entities, define or update the C# EF Core entity classes (e.g., Club, User, Member, MembershipType, Payment, Event) and ensure DbSet<> entries exist in the GatherGroveDbContext. Configure primary keys as integer identity columns (INT IDENTITY(1,1)), properties (types, nullability), foreign keys (e.g., Member.ClubId), and unique constraints (e.g., for a user's email) using Fluent API in OnModelCreating before generating the related API.
9. Implement server-side validation for ALL incoming DTOs as per user story rules (e.g., using FluentValidation). Implement JWT-based authorization checks for all API endpoints, including checks for club ownership (ClubId). Wrap multiple database operations (like the registration process that creates a User and a Club) in explicit EF Core transactions. Return standard HTTP status codes and structured JSON error payloads as defined in the user stories.
10. Always use yarn for the frontend package management.
11. Development-Time Test ID Integration Pattern - Unified Development & Testing

### Problem Pattern
Test IDs added as retrofit after development causes:
- Tests breaking constantly due to UI changes
- Brittle selectors (CSS classes, text content)
- Significant time spent updating tests instead of developing features
- Disconnect between development and testing workflows

### Solution Pattern
**Add `data-testid` attributes during component development, not after**

This creates stable, reliable test automation that survives UI changes.

12. The application MUST remain light-only. Do not add theme toggles, theme persistence packages, Tailwind theme switching configuration, or user-selectable appearance modes.

Styling: Use the established light-theme semantic color tokens and Tailwind classes consistently. Avoid adding theme-specific variants or APIs for alternate appearance modes.
Shadcn/ui Compatibility: shadcn/ui components should use the existing light-theme CSS variables and composition patterns.

13. For forms (e.g., "Add New Member"), implement client-side validation that mirrors server-side rules. Display user-friendly, field-specific errors. For ALL asynchronous operations (e.g., submitting a form, fetching a list), implement clear UI loading states (e.g., disabled button with a spinner). Ensure all interactive elements are accessible (keyboard navigable, ARIA attributes).
14. Create typed TypeScript functions for all backend API calls (e.g., memberApi.ts), using interfaces derived from C# DTOs for type safety. Handle API errors robustly. Develop React components functionally with Hooks, prioritizing modularity and reusability.
15. UI elements MUST be implemented by installing Shadcn/ui components and styling them with Tailwind CSS utility classes. Prioritize matching the UI/UX descriptions in the user stories.
16. ## Application Bugs First - Testing Philosophy Rule

### Problem Pattern
When tests are failing, developers often assume it's a test configuration issue and spend hours going in circles trying to fix test mocks, expectations, and setup without considering that there might be actual application bugs causing the test failures.

### Root Cause Analysis
**Tests fail for two main reasons:**
1. **Application bugs** - Real issues in the actual code being tested
2. **Test issues** - Problems with mocks, expectations, or test setup

### The Philosophy That Works
**"When tests fail, check for application bugs FIRST, test fixes SECOND"**

17. Write clear code. Add XML documentation (C#) or JSDoc/TSDoc (TypeScript) for public APIs and complex functions. Strictly adhere to C# (PascalCase for public members) and TypeScript (camelCase for variables/functions) naming conventions.
18. ## Never Delete Tests Rule - Preserve Testing Investment

### Problem Pattern
When tests fail, there's a temptation to delete them to "fix" the failing test suite, especially when dealing with complex mocking or configuration issues.

### Critical Rule
**NEVER DELETE TESTS - Tests represent valuable development investment and bug detection**
19. Before creating files/folders, analyze the current project structure and place new items consistently.

**PREREQUISITE: Check `/docs/status/implementation-overview.md` (per Rule 0) for the complete current repository structure and file locations.**

Backend: Place new items consistently with the established layered architecture (e.g., new services in the GatherGrove.Application/Services folder).
Frontend: The frontend MUST use Next.js Route Groups to separate the public-facing marketing site from the private, authenticated application.
Public pages (landing, pricing, etc.) go inside a src/app/(marketing) directory.
Authenticated application pages (dashboard, members, etc.) go inside a src/app/(app) directory.

Each route group will have its own layout.tsx file to manage its specific UI shell.
20. Capture unhandled JavaScript/React errors and log them to a backend endpoint or a service like Sentry. Log all API request/response metadata on the backend. Implement a standard /health check endpoint for monitoring.
21. All backend logs MUST be structured (JSON) via ILogger<T>. Each entry MUST include: Timestamp (UTC), LogLevel, CorrelationID, and relevant event-specific structured data (e.g., ClubId, MemberId, EventId). NEVER log sensitive PII like passwords or full payment details.
22. NEVER use native browser alert(). Use a toast/snackbar library like Sonner for non-blocking feedback. For form validation, display inline error messages below the relevant field.
23. All public API endpoints in the .NET controllers MUST be fully documented using XML comments to generate a rich and accurate Swagger/OpenAPI specification. This documentation is non-negotiable and serves as the primary contract for frontend developers and API consumers.
24. ## Fix Compatibility Issues - Don't Downgrade Versions

### Problem Pattern
When encountering version compatibility errors, syntax errors, or parsing issues, there's a temptation to immediately downgrade to older, "safer" versions instead of fixing the actual compatibility issue.

### Root Cause
**Downgrading wastes modern features and creates technical debt instead of solving the underlying problem**

### Solution Pattern
**MANDATORY: Fix the compatibility issue, never downgrade unless absolutely critical**
25. Windows PowerShell Syntax

### Command Chaining in Windows PowerShell
**Windows PowerShell does NOT support the `&&` operator for command chaining.**
26. ## Iterative Learning & Rule Creation Protocol

### Purpose
Capture development learnings and patterns to accelerate future development and overcome AI context limitations.
27. Never Suppress Linter Warnings - Fix Root Causes
28. Automatic Migration Detection & Execution. **MANDATORY: Check for and run database migrations after any backend entity/schema changes**
29. For all code written, add meaningful unit and integration tests
30. After writing any code, tests must be run and pass successfully
31. If tests fail, investigate and fix the underlying application bugs first, then address test issues
32. For writing tests, check the implementation of the application first to understand the expected behavior
