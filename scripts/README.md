# GatherGrove Database Seeding Scripts

## Overview

This PowerShell-based seeding system populates the GatherGrove database with comprehensive test data via REST API calls. It creates realistic test scenarios across multiple clubs, tiers, and features.

## What Gets Created

### 3 Clubs Across All Tiers

1. **Sunrise Yoga Club** (Sprout Tier)
   - 10-15 members
   - 20 events (8 past, 12 upcoming)
   - 2 membership types
   - Basic features

2. **Downtown Book Club** (Grow Tier)
   - 50-75 members
   - 55 events (25 past, 30 upcoming)
   - 2 locations
   - 3 membership types
   - Event series and multi-session events
   - Chat enabled

3. **Metro Fitness Network** (Unlimited Tier)
   - 200-250 members
   - 180 events (100 past, 80 upcoming)
   - 5 locations
   - 6 membership types
   - Member segments
   - Email templates and workflows
   - A/B test campaigns
   - All advanced features

### Total Test Data

- **3 clubs** (one per tier)
- **~340 members** total
- **~255 events** total
- **~500 RSVPs**
- **~200 payments**
- **12 email templates** (Unlimited tier)
- **4 A/B test campaigns** (Unlimited tier)
- **6 communication workflows** (Unlimited tier)
- **Custom fields, tags, segments**

## Prerequisites

### System Requirements

- **PowerShell 7+** (recommended) or Windows PowerShell 5.1+
- **.NET 9 SDK** installed
- **SQL Server LocalDB** installed
- **Node.js** (for frontend if testing full stack)

### Running Services

Before running the seeding script, ensure these services are running:

```powershell
# Terminal 1: Start backend API
cd backend
dotnet run
# Should start on http://localhost:8050

# Terminal 2: Start frontend (optional, for full E2E testing)
cd client
npm run dev
# Should start on http://localhost:3050
```

### Clean Database

For best results, start with a clean database:

```powershell
# Option 1: Delete the database file
Remove-Item "$env:USERPROFILE\.localdb\GatherGroveDb.*" -Force

# Option 2: Reset via EF migrations
cd backend
dotnet ef database drop --force
dotnet ef database update
```

## Quick Start

```powershell
# Navigate to scripts directory
cd scripts

# Run the seeding script
.\seed-database.ps1

# With custom configuration
.\seed-database.ps1 -ConfigPath .\config\custom-config.json

# Verbose output
.\seed-database.ps1 -Verbose

# Skip rollback on errors (for debugging)
.\seed-database.ps1 -SkipRollback
```

## Script Parameters

```powershell
.\seed-database.ps1 [options]

Parameters:
  -ConfigPath <string>
    Path to the JSON configuration file
    Default: ./config/seed-config.json

  -SkipRollback
    If set, does not attempt to rollback on errors
    Useful for debugging

  -Verbose
    Enable verbose logging output

Examples:
  .\seed-database.ps1
  .\seed-database.ps1 -ConfigPath .\config\seed-config.json -Verbose
  .\seed-database.ps1 -SkipRollback
```

## Configuration

### Main Configuration File

`config/seed-config.json` contains:

- **Environment settings**: Base URL, timeouts, retry logic
- **Club profiles**: Tier, member count, features
- **Data volumes**: Events, payments, communications
- **Performance options**: Parallel requests, batch sizes

Example structure:

```json
{
  "environment": "Development",
  "baseUrl": "http://localhost:8050",
  "clubs": [
    {
      "name": "Sunrise Yoga Club",
      "tier": "Sprout",
      "memberCount": { "min": 10, "max": 15 },
      "eventMix": {
        "past": 8,
        "upcoming": 12,
        "freePercentage": 80
      }
    }
  ]
}
```

### Sample Data Files

- **`data/sample-names.json`**: First names, last names, streets, cities
- **`data/event-templates.json`**: Event name templates by category

## How It Works

### Seeding Phases

The script executes in sequential phases to handle data dependencies:

```
Phase 1: Foundation
├─ Register club admins (POST /api/v1/auth/register)
└─ Store JWT tokens for subsequent requests

Phase 2: Configuration
├─ Create membership types
├─ Create locations (if multi-location)
├─ Create custom fields
└─ Create member tags

Phase 3: Members
├─ Create members with realistic data
├─ Assign membership types & locations
├─ Set custom field values
└─ Assign tags

Phase 4: Events
├─ Create event series (recurring)
├─ Create individual events (past & upcoming)
├─ Create multi-session events
└─ Mix of free and paid events

Phase 5: Interactions
├─ Create RSVPs (confirmed, declined)
├─ Record attendance (past events)
├─ Add waitlist entries
└─ Collect feedback

Phase 6: Payments
├─ Record membership dues payments
└─ Record event payment transactions

Phase 7: Communications (Unlimited tier only)
├─ Create email templates
├─ Create A/B test campaigns
├─ Create communication workflows
└─ Send sample communications

Phase 8: Advanced Features
├─ Create member segments
├─ Generate invite codes
├─ Configure branding
└─ Add chat messages
```

### Authentication Flow

```powershell
# 1. Register club admin
POST /api/v1/auth/register
Body: {
  "FullName": "Admin User - Sunrise Yoga Club",
  "Email": "admin-sunrise-yoga@test.local",
  "Password": "TestPassword123!",
  "ClubName": "Sunrise Yoga Club"
}

# 2. Extract JWT token from response/cookie
# 3. Store in token cache: $ClubTokens[$clubId] = $token
# 4. Use token for subsequent API requests
```

### Data Generation

The script generates realistic data using:

- **Random names**: From `sample-names.json` (200+ first names, 120+ last names)
- **Random dates**: Join dates, event dates, payment dates
- **Random selections**: Membership types, event attendance, payment methods
- **Realistic patterns**: Past events have attendance, upcoming events have RSVPs

## API Endpoints Used

### Authentication
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Members
- `POST /api/v1/clubs/{clubId}/members`
- `POST /api/v1/clubs/{clubId}/membership-types`
- `POST /api/v1/clubs/{clubId}/custom-fields`
- `POST /api/v1/clubs/{clubId}/tags`

### Events
- `POST /api/v1/clubs/{clubId}/events`
- `POST /api/v1/clubs/{clubId}/event-series`
- `POST /api/v1/clubs/{clubId}/multi-session-events`
- `POST /api/v1/clubs/{clubId}/events/{eventId}/rsvp`

### Locations (Multi-location clubs)
- `POST /api/v1/clubs/{clubId}/locations`

### Communications (Unlimited tier)
- `POST /api/v1/clubs/{clubId}/email-templates`
- `POST /api/v1/clubs/{clubId}/ab-tests`
- `POST /api/v1/clubs/{clubId}/communication-workflows`

### Payments
- `POST /api/v1/clubs/{clubId}/payments/record`

## Output

### Console Output

During execution, the script displays:

```
=== GatherGrove Database Seeding ===
Total Steps: 45

[1/45] Creating club: Sunrise Yoga Club
[2/45] Creating membership types for Sunrise Yoga Club
[3/45] Creating custom fields for Sunrise Yoga Club
...
[45/45] Complete!

=== Seeding Complete ===
Total Time: 05:23
Total Steps: 45
```

### Summary Report

At completion, a detailed summary is displayed and saved:

```
╔═══════════════════════════════════════════════════════════╗
║          GatherGrove Seeding Summary Report               ║
╚═══════════════════════════════════════════════════════════╝

CLUBS CREATED
─────────────────────────────────────────────────────────────

  Sunrise Yoga Club (Tier: Sprout)
  ├─ Club ID: 1
  ├─ Members: 15
  ├─ Locations: 1
  ├─ Events: 20 (Past: 8, Upcoming: 12)
  ├─ Email Templates: 0
  └─ Admin: admin-sunrise-yoga@test.local / TestPassword123!

  Downtown Book Club (Tier: Grow)
  ├─ Club ID: 2
  ├─ Members: 75
  ├─ Locations: 2
  ├─ Events: 55 (Past: 25, Upcoming: 30)
  ├─ Email Templates: 0
  └─ Admin: admin-downtown-book@test.local / TestPassword123!

  Metro Fitness Network (Tier: Unlimited)
  ├─ Club ID: 3
  ├─ Members: 250
  ├─ Locations: 5
  ├─ Events: 180 (Past: 100, Upcoming: 80)
  ├─ Email Templates: 12
  └─ Admin: admin-metro-fitness@test.local / TestPassword123!

SUMMARY STATISTICS
─────────────────────────────────────────────────────────────
  Total Clubs:            3
  Total Members:          340
  Total Events:           255
  Total RSVPs:            520
  Total Payments:         210

EXECUTION DETAILS
─────────────────────────────────────────────────────────────
  Start Time:             2025-01-15 10:00:00
  End Time:               2025-01-15 10:05:23
  Duration:               00:05:23
  API Calls:              1,234
  Errors:                 0
```

### Log Files

Logs are saved to `./seed-logs/`:

- `seed-{timestamp}.log` - Detailed execution log
- `summary-{timestamp}.txt` - Summary report
- `errors-{timestamp}.log` - Error details (if any)

## Test Accounts

After seeding, use these credentials to log in:

### Sprout Tier
- **Email**: admin-sunrise-yoga@test.local
- **Password**: TestPassword123!
- **Club**: Sunrise Yoga Club
- **Features**: Basic member management, events

### Grow Tier
- **Email**: admin-downtown-book@test.local
- **Password**: TestPassword123!
- **Club**: Downtown Book Club
- **Features**: Multi-location, chat, QR check-in, event series

### Unlimited Tier
- **Email**: admin-metro-fitness@test.local
- **Password**: TestPassword123!
- **Club**: Metro Fitness Network
- **Features**: All features including segments, workflows, A/B testing

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```
Error: Unable to connect to http://localhost:8050
```
**Solution**: Ensure backend API is running:
```powershell
cd backend
dotnet run
```

#### 2. JWT Token Not Found
```
Error: Could not extract JWT token from response
```
**Solution**: Check API response format, ensure Set-Cookie header or response body contains token

#### 3. Database Constraint Errors
```
Error: Violation of PRIMARY KEY constraint
```
**Solution**: Start with clean database (see Prerequisites section)

#### 4. Out of Memory
```
Error: Process exited with code 137
```
**Solution**: Reduce `batchSize` in configuration, increase system RAM, or process clubs sequentially

### Debug Mode

Run with `-Verbose` flag for detailed output:

```powershell
.\seed-database.ps1 -Verbose

# Output will show:
#   - All HTTP requests and responses
#   - JWT tokens (masked)
#   - Database IDs for created entities
#   - Timing for each operation
```

### Rollback on Error

By default, the script attempts to rollback (delete) created entities on error. To disable:

```powershell
.\seed-database.ps1 -SkipRollback
```

## Customization

### Adjust Member Counts

Edit `config/seed-config.json`:

```json
{
  "clubs": [
    {
      "name": "Sunrise Yoga Club",
      "memberCount": {
        "min": 20,  // Changed from 10
        "max": 30   // Changed from 15
      }
    }
  ]
}
```

### Add New Club Profile

```json
{
  "clubs": [
    // ... existing clubs ...
    {
      "name": "My Custom Club",
      "tier": "Grow",
      "memberCount": { "min": 30, "max": 50 },
      "locationCount": 1,
      "eventMix": {
        "past": 10,
        "upcoming": 15,
        "freePercentage": 70
      }
    }
  ]
}
```

### Modify Event Categories

Edit `data/event-templates.json`:

```json
{
  "custom_category": [
    "Custom Event 1",
    "Custom Event 2",
    "Custom Event 3"
  ]
}
```

Then reference in config:

```json
{
  "eventMix": {
    "categories": ["custom_category"]
  }
}
```

## Performance

### Execution Time

Typical execution times:
- **Sprout Club**: ~30 seconds
- **Grow Club**: ~1-2 minutes
- **Unlimited Club**: ~3-5 minutes
- **Total (3 clubs)**: ~5-10 minutes

### Optimization

To improve performance:

1. **Enable Parallel Requests**:
```json
{
  "performanceOptions": {
    "parallelRequests": true,
    "batchSize": 20
  }
}
```

2. **Reduce Data Volume**:
```json
{
  "memberCount": { "min": 10, "max": 15 },
  "eventMix": { "past": 5, "upcoming": 10 }
}
```

3. **Skip Advanced Features**:
```json
{
  "emailTemplates": [],
  "abTestCampaigns": [],
  "communicationWorkflows": []
}
```

## Integration with E2E Testing

The seeded data is designed for the E2E manual test plan (`tests/e2e-manual-test-plan.md`).

### Test Data Alignment

- **AUTH tests**: Use seeded admin accounts
- **MEMBER tests**: Use seeded members across all clubs
- **EVENT tests**: Use seeded events (past and upcoming)
- **PAYMENT tests**: Use seeded payment history
- **COMM tests**: Use seeded email templates (Unlimited tier)
- **TIER tests**: Use clubs at different tiers

### Quick Test Setup

```powershell
# 1. Clean database
dotnet ef database drop --force
dotnet ef database update

# 2. Seed test data
cd scripts
.\seed-database.ps1

# 3. Run E2E tests (using Playwright MCP)
# Follow instructions in tests/e2e-manual-test-plan.md
```

## Security Notes

⚠️ **Important Security Considerations**:

1. **Test Credentials Only**: All seeded accounts use `TestPassword123!` - **NEVER** use in production
2. **Test Email Addresses**: All emails use `@test.local` domain - not real email addresses
3. **Stripe Test Mode**: Only use Stripe test keys (sk_test_*) with this script
4. **Local Development**: Designed for localhost only, not for production environments
5. **Data Cleanup**: Remove seeded data before deploying to production

## Support

### Questions or Issues?

1. **Check logs**: `./seed-logs/` directory
2. **Review configuration**: `config/seed-config.json`
3. **Verify prerequisites**: Backend running, database clean
4. **Run in debug mode**: `-Verbose` flag
5. **Check API documentation**: See backend Swagger at http://localhost:8050/swagger

### Common Modifications

- **Change base URL**: Edit `baseUrl` in config
- **Adjust timeouts**: Edit `apiTimeout` and `maxRetries` in config
- **Enable/disable logging**: Edit `logging.enabled` in config
- **Custom club names**: Edit `clubs[].name` in config

## Architecture

### Module Structure

```
scripts/
├─ seed-database.ps1          # Main orchestrator
├─ modules/                   # PowerShell modules (referenced inline)
│  ├─ ApiClient.psm1          # HTTP client with retry
│  ├─ AuthManager.psm1        # JWT token management
│  ├─ DataGenerators.psm1     # Fake data generation
│  ├─ EntitySeeders.psm1      # Entity-specific seeding
│  └─ SeedConfig.psm1         # Configuration management
├─ config/
│  └─ seed-config.json        # Configuration file
├─ data/
│  ├─ sample-names.json       # Name pools
│  └─ event-templates.json    # Event templates
└─ seed-logs/                 # Generated log files
```

### Design Principles

1. **API-Driven**: Uses REST API endpoints (not direct database access)
2. **Idempotent**: Can be run multiple times safely
3. **Dependency-Aware**: Respects foreign key relationships
4. **Realistic Data**: Generates data resembling production usage
5. **Configurable**: JSON-based configuration for flexibility
6. **Error-Resilient**: Retry logic with exponential backoff
7. **Observable**: Comprehensive logging and progress tracking

## Changelog

### Version 1.0 (2025-01-15)
- Initial release
- Support for 3 tier types (Sprout, Grow, Unlimited)
- Seeds 340+ members, 255+ events
- Authentication via JWT
- Comprehensive error handling
- Progress tracking and summary reports

---

**Maintained By**: GatherGrove QA Team
**Last Updated**: 2025-01-15
**Related Documentation**:
- `../tests/e2e-manual-test-plan.md` - E2E test plan
- `../backend/README.md` - Backend API documentation
- `../CLAUDE.md` - Project instructions
