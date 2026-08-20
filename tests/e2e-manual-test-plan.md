# GatherGrove Comprehensive E2E Manual Test Plan

## Document Overview

**Purpose**: Comprehensive manual end-to-end testing of the entire GatherGrove platform using Playwright MCP tools
**Scope**: ALL features across ALL tiers (Sprout, Grow, Unlimited)
**Test Types**: Happy paths, error handling, edge cases, security testing
**Execution Method**: Manual testing using Playwright MCP tools
**Total Scenarios**: 120+
**Estimated Time**: 10-15 days (full execution)

## Test Environment Setup

### Local Development Environment
- **Backend API**: http://localhost:8050
- **Frontend App**: http://localhost:3050
- **Database**: SQL Server LocalDB (GatherGroveDb)
- **Stripe**: Test mode with test keys (sk_test_*)
- **JWT Token Expiry**: 60 minutes
- **Browser**: Chrome/Edge (Playwright controlled)

### Prerequisites
- Backend .NET API running on port 8050
- Frontend Next.js app running on port 3050
- SQL Server LocalDB installed and database seeded
- Playwright MCP tools available
- Test data seeded via seeding script

### Test Data Requirements
The database should be seeded with:
- 3 clubs (Sprout, Grow, Unlimited tiers)
- 340+ members across clubs
- 255+ events (past and upcoming)
- Payment history and subscriptions
- Email templates and communications
- Custom fields, tags, and segments

---

## Test Categories Overview

| Category | Scenarios | Priority | Estimated Time |
|----------|-----------|----------|----------------|
| 1. Authentication & Authorization | 15 | P0 | 1-2 days |
| 2. Member Management | 18 | P0 | 2-3 days |
| 3. Event Management | 20 | P0 | 2-3 days |
| 4. Payment Processing | 15 | P1 | 1-2 days |
| 5. Communications | 12 | P1 | 1-2 days |
| 6. Multi-Location Features | 10 | P1 | 1 day |
| 7. Chat & Real-time | 8 | P2 | 1 day |
| 8. Analytics & Reporting | 10 | P2 | 1 day |
| 9. Tier-Specific Features | 12 | P1 | 1 day |
| 10. Security & Access Control | 10 | P0 | 1 day |
| 11. Data Export & Import | 8 | P2 | 1 day |
| 12. Mobile PWA Features | 6 | P2 | 0.5 day |
| 13. Error Handling & Edge Cases | 10 | P1 | 1 day |
| 14. Performance & Concurrency | 6 | P2 | 1 day |
| 15. Integration Workflows | 10 | P1 | 1-2 days |

**Total: 150 scenarios across 15 categories**

---

# Category 1: Authentication & Authorization

## Test Data Setup
```sql
-- Test accounts created by seeding script
SELECT * FROM Users WHERE Email LIKE '%@test.local';
SELECT * FROM Clubs WHERE Name LIKE '%Test%';
```

### AUTH-001: User Registration (Happy Path)

**Preconditions**: None (public access)
**Tier**: N/A
**User Role**: Public
**Priority**: P0

**Test Steps**:
```javascript
// Step 1: Navigate to registration page
await browser_navigate({ url: 'http://localhost:3050/register' });
await browser_snapshot({ filename: 'auth-001-step1-registration-page.png' });

// Step 2: Fill registration form
const timestamp = Date.now();
await browser_type({
  element: 'Full Name input',
  ref: 'input[name="fullName"]',
  text: 'E2E Test Admin'
});

await browser_type({
  element: 'Email input',
  ref: 'input[name="email"]',
  text: `e2e-test-${timestamp}@example.com`
});

await browser_type({
  element: 'Password input',
  ref: 'input[name="password"]',
  text: 'TestPassword123!'
});

await browser_type({
  element: 'Confirm Password input',
  ref: 'input[name="confirmPassword"]',
  text: 'TestPassword123!'
});

await browser_type({
  element: 'Club Name input',
  ref: 'input[name="clubName"]',
  text: `E2E Test Club ${timestamp}`
});

await browser_snapshot({ filename: 'auth-001-step2-form-filled.png' });

// Step 3: Submit form
await browser_click({
  element: 'Submit button',
  ref: 'button[type="submit"]'
});

// Step 4: Verify redirect to dashboard
await browser_wait_for({ text: 'Dashboard' });
await browser_snapshot({ filename: 'auth-001-step4-dashboard.png' });

// Step 5: Verify JWT cookie is set
await browser_evaluate({
  function: '() => document.cookie.includes("token")'
});
```

**Expected Results**:
- ✅ User account created successfully
- ✅ Club created with Sprout tier
- ✅ JWT token stored in HttpOnly cookie
- ✅ User redirected to /admin/dashboard
- ✅ 90-day trial indicator displayed

**Validation Queries**:
```sql
SELECT * FROM Users
WHERE Email = 'e2e-test-{timestamp}@example.com';

SELECT * FROM Clubs
WHERE Name = 'E2E Test Club {timestamp}'
AND Tier = 'Sprout';

SELECT * FROM ClubAdmins
WHERE UserId = {new_user_id} AND ClubId = {new_club_id};
```

---

### AUTH-002: Login with Valid Credentials

**Preconditions**: User account exists (from AUTH-001 or seeding)
**Tier**: N/A
**User Role**: Admin
**Priority**: P0

**Test Steps**:
```javascript
// Step 1: Navigate to login page
await browser_navigate({ url: 'http://localhost:3050/login' });
await browser_snapshot();

// Step 2: Enter credentials
await browser_type({
  element: 'Email input',
  ref: 'input[name="email"]',
  text: 'admin-sunrise-yoga@test.local' // From seeding script
});

await browser_type({
  element: 'Password input',
  ref: 'input[name="password"]',
  text: 'TestPassword123!'
});

// Step 3: Submit login
await browser_click({
  element: 'Sign In button',
  ref: 'button:has-text("Sign In")'
});

// Step 4: Verify redirect to dashboard
await browser_wait_for({ text: 'Sunrise Yoga Club' });
await browser_snapshot({ filename: 'auth-002-logged-in.png' });
```

**Expected Results**:
- ✅ Authentication successful
- ✅ JWT cookie set
- ✅ Redirected to dashboard
- ✅ User name displayed in header
- ✅ Club name visible

---

### AUTH-003: Login with Invalid Credentials (Error Case)

**Preconditions**: None
**Tier**: N/A
**User Role**: Public
**Priority**: P0

**Test Steps**:
```javascript
// Step 1: Navigate to login
await browser_navigate({ url: 'http://localhost:3050/login' });

// Step 2: Enter invalid credentials
await browser_type({
  element: 'Email input',
  ref: 'input[name="email"]',
  text: 'invalid@example.com'
});

await browser_type({
  element: 'Password input',
  ref: 'input[name="password"]',
  text: 'WrongPassword123'
});

// Step 3: Submit
await browser_click({
  element: 'Sign In button',
  ref: 'button[type="submit"]'
});

// Step 4: Verify error message
await browser_wait_for({ text: 'Invalid email or password' });
await browser_snapshot({ filename: 'auth-003-error.png' });
```

**Expected Results**:
- ✅ Error message displayed: "Invalid email or password"
- ✅ User remains on login page
- ✅ No JWT cookie set
- ✅ Form fields remain populated (except password)

---

### AUTH-004: Password Reset Flow (Happy Path)

**Preconditions**: User account exists
**Tier**: N/A
**User Role**: Public
**Priority**: P1

**Test Steps**:
```javascript
// Step 1: Navigate to forgot password
await browser_navigate({ url: 'http://localhost:3050/forgot-password' });

// Step 2: Enter email
await browser_type({
  element: 'Email input',
  ref: 'input[name="email"]',
  text: 'admin-sunrise-yoga@test.local'
});

await browser_click({
  element: 'Submit button',
  ref: 'button[type="submit"]'
});

// Step 3: Verify confirmation message
await browser_wait_for({ text: 'reset link has been sent' });
await browser_snapshot();
```

**Manual Steps** (email verification):
1. Check database for password reset token
2. Navigate to reset URL with token
3. Enter new password (twice)
4. Submit
5. Login with new password
6. Verify old password no longer works

**Expected Results**:
- ✅ Reset email generated (token in database)
- ✅ Token valid for configured time period
- ✅ Password successfully updated
- ✅ Can login with new password
- ✅ Old password no longer works

**Validation Query**:
```sql
SELECT * FROM PasswordResetTokens
WHERE Email = 'admin-sunrise-yoga@test.local'
ORDER BY CreatedAt DESC
LIMIT 1;
```

---

### AUTH-012: Authorization - Multi-Club Isolation (Tenant Isolation)

**Preconditions**: Two clubs exist with different admins
**Tier**: N/A
**User Role**: Admin
**Priority**: P0 (Security Critical)

**Test Steps**:
```javascript
// Step 1: Login as Club A admin
await browser_navigate({ url: 'http://localhost:3050/login' });
await browser_type({
  element: 'Email',
  ref: 'input[name="email"]',
  text: 'admin-sunrise-yoga@test.local' // Club ID: 1
});
await browser_type({
  element: 'Password',
  ref: 'input[name="password"]',
  text: 'TestPassword123!'
});
await browser_click({ element: 'Sign In', ref: 'button[type="submit"]' });

// Step 2: Note Club A's ID (from UI or JWT)
await browser_evaluate({
  function: '() => localStorage.getItem("clubId")'
});

// Step 3: Attempt to access Club B's resources via URL manipulation
await browser_navigate({ url: 'http://localhost:3050/admin/clubs/2/members' }); // Club B

// Step 4: Verify access denied
await browser_snapshot({ filename: 'auth-012-access-denied.png' });
```

**Expected Results**:
- ✅ 403 Forbidden or redirect to own club
- ✅ Cannot access other club's data
- ✅ ClubId claim validation working
- ✅ Appropriate error message shown

**Validation**:
```sql
-- Verify JWT contains ClubId claim
-- Check that API enforces ClubId filtering
```

---

### AUTH-015: SQL Injection Protection

**Preconditions**: None
**Tier**: N/A
**User Role**: Public
**Priority**: P0 (Security Critical)

**Test Steps**:
```javascript
// Test 1: SQL injection in login
await browser_navigate({ url: 'http://localhost:3050/login' });
await browser_type({
  element: 'Email',
  ref: 'input[name="email"]',
  text: "admin@example.com' OR '1'='1"
});
await browser_type({
  element: 'Password',
  ref: 'input[name="password"]',
  text: "password' OR '1'='1"
});
await browser_click({ element: 'Sign In', ref: 'button[type="submit"]' });

// Verify login fails
await browser_wait_for({ text: 'Invalid' });

// Test 2: SQL injection in search
await browser_navigate({ url: 'http://localhost:3050/admin/members' });
await browser_type({
  element: 'Search',
  ref: 'input[name="search"]',
  text: "test' OR 1=1--"
});

// Verify safe handling
await browser_snapshot();
```

**Expected Results**:
- ✅ Login fails
- ✅ No SQL error exposed
- ✅ Parameterized queries prevent injection
- ✅ Appropriate error message shown
- ✅ No data leaked

---

# Category 2: Member Management

### MEMBER-001: Create Member (Admin Happy Path)

**Preconditions**: Admin logged in
**Tier**: All tiers
**User Role**: Admin
**Priority**: P0

**Test Steps**:
```javascript
// Step 1: Navigate to members page
await browser_navigate({ url: 'http://localhost:3050/admin/members' });
await browser_snapshot();

// Step 2: Click Add Member
await browser_click({
  element: 'Add Member button',
  ref: 'button:has-text("Add Member")'
});

// Step 3: Fill member form
await browser_fill_form({
  fields: [
    { name: 'Full Name', ref: 'input[name="fullName"]', type: 'textbox', value: 'John Doe' },
    { name: 'Email', ref: 'input[name="email"]', type: 'textbox', value: 'john.doe@example.com' },
    { name: 'Phone', ref: 'input[name="phone"]', type: 'textbox', value: '555-123-4567' }
  ]
});

// Step 4: Select membership type
await browser_click({ element: 'Membership Type dropdown', ref: 'select[name="membershipTypeId"]' });
await browser_click({ element: 'Regular Member option', ref: 'option:has-text("Regular")' });

// Step 5: Submit form
await browser_click({ element: 'Save button', ref: 'button:has-text("Save")' });

// Step 6: Verify member appears in list
await browser_wait_for({ text: 'John Doe' });
await browser_snapshot({ filename: 'member-001-created.png' });
```

**Expected Results**:
- ✅ Member created successfully
- ✅ Member ID assigned
- ✅ Appears in member list
- ✅ Database record created
- ✅ Confirmation toast shown

**Validation Query**:
```sql
SELECT * FROM Members
WHERE Email = 'john.doe@example.com'
AND ClubId = {current_club_id};
```

---

### MEMBER-004: Bulk Import Members (CSV)

**Preconditions**: Admin logged in, CSV file prepared
**Tier**: Grow+
**User Role**: Admin
**Priority**: P1

**Test CSV Content**:
```csv
Full Name,Email,Phone,Membership Type
Jane Smith,jane@example.com,555-0001,Regular
Bob Johnson,bob@example.com,555-0002,Premium
Alice Williams,alice@example.com,555-0003,Regular
```

**Test Steps**:
```javascript
// Step 1: Navigate to members
await browser_navigate({ url: 'http://localhost:3050/admin/members' });

// Step 2: Click Import Members
await browser_click({
  element: 'Import button',
  ref: 'button:has-text("Import")'
});

// Step 3: Upload CSV file
await browser_file_upload({
  paths: ['tests/test-data/members-import.csv']
});

// Step 4: Map columns
// (UI should auto-detect or allow manual mapping)
await browser_snapshot({ filename: 'member-004-mapping.png' });

// Step 5: Preview import
await browser_click({ element: 'Preview', ref: 'button:has-text("Preview")' });
await browser_wait_for({ text: '3 members' });

// Step 6: Confirm import
await browser_click({ element: 'Import', ref: 'button:has-text("Confirm Import")' });
await browser_wait_for({ text: 'Import complete' });
await browser_snapshot({ filename: 'member-004-complete.png' });
```

**Expected Results**:
- ✅ CSV parsed correctly
- ✅ Field mapping works
- ✅ All valid records imported (3 members)
- ✅ Import summary displayed
- ✅ Email validation applied
- ✅ Duplicate detection works

**Validation Query**:
```sql
SELECT COUNT(*) FROM Members
WHERE Email IN ('jane@example.com', 'bob@example.com', 'alice@example.com');
-- Should return 3
```

---

### MEMBER-009: Member Segmentation - Create Dynamic Segment

**Preconditions**: Admin logged in, members with varied data exist
**Tier**: Unlimited
**User Role**: Admin
**Priority**: P2

**Test Steps**:
```javascript
// Step 1: Navigate to segments
await browser_navigate({ url: 'http://localhost:3050/admin/members/segments' });

// Step 2: Create new segment
await browser_click({ element: 'Create Segment', ref: 'button:has-text("Create Segment")' });

// Step 3: Configure segment
await browser_type({
  element: 'Segment Name',
  ref: 'input[name="name"]',
  text: 'Active Premium Members'
});

// Step 4: Add filter rules
await browser_click({ element: 'Add Rule', ref: 'button:has-text("Add Rule")' });
// Rule 1: Membership Type = Premium
await browser_select_option({
  element: 'Field selector',
  ref: 'select[name="field"]',
  values: ['Membership Type']
});
await browser_select_option({
  element: 'Operator',
  ref: 'select[name="operator"]',
  values: ['equals']
});
await browser_type({ element: 'Value', ref: 'input[name="value"]', text: 'Premium' });

// Rule 2: Join Date > 6 months ago
await browser_click({ element: 'Add Rule', ref: 'button:has-text("Add Rule")' });
// ... additional rule configuration

// Step 5: Save segment
await browser_click({ element: 'Save', ref: 'button:has-text("Save Segment")' });

// Step 6: View segment members
await browser_wait_for({ text: 'members match' });
await browser_snapshot({ filename: 'member-009-segment.png' });
```

**Expected Results**:
- ✅ Segment created with complex rules
- ✅ Members dynamically calculated
- ✅ Segment can be used for communications
- ✅ Segment refreshes when member data changes

**Validation Query**:
```sql
SELECT COUNT(*) FROM Members m
JOIN MembershipTypes mt ON m.MembershipTypeId = mt.Id
WHERE m.ClubId = {club_id}
  AND mt.Name = 'Premium'
  AND m.JoinDate < DATEADD(month, -6, GETDATE())
  AND m.Status = 'Active';
```

---

# Category 3: Event Management

### EVENT-001: Create Basic Event (Happy Path)

**Preconditions**: Admin logged in
**Tier**: All tiers
**User Role**: Admin
**Priority**: P0

**Test Steps**:
```javascript
// Step 1: Navigate to events
await browser_navigate({ url: 'http://localhost:3050/admin/events' });

// Step 2: Create new event
await browser_click({ element: 'Create Event', ref: 'button:has-text("Create Event")' });

// Step 3: Fill event form
await browser_type({
  element: 'Event Name',
  ref: 'input[name="name"]',
  text: 'Monthly Board Meeting'
});

// Date/Time picker
const nextFriday = new Date();
nextFriday.setDate(nextFriday.getDate() + (5 - nextFriday.getDay() + 7) % 7);
await browser_type({
  element: 'Event Date',
  ref: 'input[name="eventDate"]',
  text: nextFriday.toISOString().split('T')[0]
});
await browser_type({
  element: 'Event Time',
  ref: 'input[name="eventTime"]',
  text: '19:00'
});

await browser_type({
  element: 'Location',
  ref: 'input[name="location"]',
  text: 'Community Center'
});

// Rich text description
await browser_type({
  element: 'Description',
  ref: 'textarea[name="description"]',
  text: 'Monthly board meeting to discuss club activities and upcoming events.'
});

await browser_type({
  element: 'Capacity',
  ref: 'input[name="maxCapacity"]',
  text: '30'
});

// Step 4: Save event
await browser_click({ element: 'Save', ref: 'button[type="submit"]' });

// Step 5: Verify event in list
await browser_wait_for({ text: 'Monthly Board Meeting' });
await browser_snapshot({ filename: 'event-001-created.png' });
```

**Expected Results**:
- ✅ Event created successfully
- ✅ Event ID assigned
- ✅ Appears in upcoming events list
- ✅ Correct date/time stored
- ✅ Description HTML sanitized

**Validation Query**:
```sql
SELECT * FROM Events
WHERE ClubId = {club_id}
AND Name = 'Monthly Board Meeting';
```

---

### EVENT-002: Create Paid Event with Pricing Tiers

**Preconditions**: Stripe Connect configured, Admin logged in
**Tier**: Grow+
**User Role**: Admin
**Priority**: P1

**Test Steps**:
```javascript
// Step 1: Create new event
await browser_navigate({ url: 'http://localhost:3050/admin/events' });
await browser_click({ element: 'Create Event', ref: 'button:has-text("Create Event")' });

// Step 2: Basic event info
await browser_type({ element: 'Name', ref: 'input[name="name"]', text: 'Annual Gala Dinner' });
// ... date, location, description

// Step 3: Enable paid event
await browser_click({
  element: 'Paid Event checkbox',
  ref: 'input[type="checkbox"][name="isPaid"]'
});

// Step 4: Set pricing tiers
await browser_type({
  element: 'Member Price',
  ref: 'input[name="memberPrice"]',
  text: '50.00'
});
await browser_type({
  element: 'Non-Member Price',
  ref: 'input[name="nonMemberPrice"]',
  text: '75.00'
});

// Step 5: Enable early bird pricing
await browser_click({ element: 'Early Bird', ref: 'input[name="enableEarlyBird"]' });
await browser_type({ element: 'Early Bird Price', ref: 'input[name="earlyBirdPrice"]', text: '40.00' });
// Set deadline: 2 weeks before event
await browser_type({ element: 'Early Bird Deadline', ref: 'input[name="earlyBirdDeadline"]', text: '2025-02-01' });

// Step 6: Save
await browser_click({ element: 'Save', ref: 'button[type="submit"]' });
await browser_wait_for({ text: 'Event created' });
await browser_snapshot({ filename: 'event-002-paid-event.png' });
```

**Expected Results**:
- ✅ Pricing configuration saved
- ✅ Different prices for members/non-members
- ✅ Early bird pricing calculated
- ✅ Payment link generated
- ✅ Stripe integration configured

**Validation Query**:
```sql
SELECT * FROM Events
WHERE Id = {event_id}
AND MemberPrice = 50.00
AND NonMemberPrice = 75.00
AND EarlyBirdPrice = 40.00;
```

---

### EVENT-004: Event RSVP - Member Response

**Preconditions**: Event exists, member logged in
**Tier**: All tiers
**User Role**: Member
**Priority**: P0

**Test Steps**:
```javascript
// Step 1: Login as member
await browser_navigate({ url: 'http://localhost:3050/login' });
// ... login steps

// Step 2: Navigate to events
await browser_navigate({ url: 'http://localhost:3050/app/events' });
await browser_snapshot({ filename: 'event-004-step2-events-list.png' });

// Step 3: View event details
await browser_click({
  element: 'Monthly Board Meeting card',
  ref: 'div:has-text("Monthly Board Meeting")'
});

// Step 4: RSVP to event
await browser_click({
  element: 'RSVP button',
  ref: 'button:has-text("RSVP")'
});

// Step 5: Select "Attending"
await browser_click({
  element: 'Attending option',
  ref: 'button:has-text("Attending")'
});

// Step 6: Add optional note
await browser_type({
  element: 'RSVP Note',
  ref: 'textarea[name="notes"]',
  text: 'Will bring refreshments'
});

// Step 7: Submit RSVP
await browser_click({ element: 'Confirm', ref: 'button:has-text("Confirm RSVP")' });
await browser_wait_for({ text: 'RSVP confirmed' });
await browser_snapshot({ filename: 'event-004-confirmed.png' });
```

**Expected Results**:
- ✅ RSVP recorded
- ✅ Member added to attendee list
- ✅ Admin can see RSVP
- ✅ Member receives confirmation
- ✅ RSVP can be changed later

**Validation Query**:
```sql
SELECT * FROM EventRsvps
WHERE EventId = {event_id}
AND MemberId = {member_id}
AND Status = 'Confirmed';
```

---

### EVENT-008: Event QR Code Generation & Check-In

**Preconditions**: Event with RSVPs exists, Grow+ tier
**Tier**: Grow+
**User Role**: Admin & Member
**Priority**: P1

**Test Steps (Admin - Generate QR)**:
```javascript
// Step 1: Navigate to event details
await browser_navigate({ url: 'http://localhost:3050/admin/events/{eventId}' });

// Step 2: Generate QR codes
await browser_click({ element: 'Generate QR Codes', ref: 'button:has-text("Generate QR")' });

// Step 3: Download QR code PDF
await browser_click({ element: 'Download PDF', ref: 'a:has-text("Download")' });
// Verify PDF downloaded
await browser_snapshot({ filename: 'event-008-qr-generated.png' });
```

**Test Steps (Admin - Check-In)**:
```javascript
// Step 1: Navigate to check-in page
await browser_navigate({ url: 'http://localhost:3050/admin/events/{eventId}/checkin' });
await browser_snapshot();

// Step 2: Scan QR code (or manual search)
await browser_type({
  element: 'Search member',
  ref: 'input[name="search"]',
  text: 'John Doe'
});

// Step 3: Check in member
await browser_click({
  element: 'Check In button for John Doe',
  ref: 'button[data-member-id="123"]:has-text("Check In")'
});

// Step 4: Verify check-in timestamp recorded
await browser_wait_for({ text: 'Checked in' });
await browser_snapshot({ filename: 'event-008-checked-in.png' });
```

**Expected Results**:
- ✅ Unique QR codes generated
- ✅ QR codes contain encrypted event/member data
- ✅ Scan updates check-in status
- ✅ Real-time attendee count
- ✅ Check-in list exportable

**Validation Query**:
```sql
SELECT * FROM EventCheckins
WHERE EventId = {event_id}
AND MemberId = {member_id}
AND CheckInTime IS NOT NULL;
```

---

# Category 4: Payment Processing

### PAY-002: Process Member Dues Payment

**Preconditions**: Stripe connected, member logged in
**Tier**: Grow+
**User Role**: Member
**Priority**: P1

**Test Steps**:
```javascript
// Step 1: Login as member
await browser_navigate({ url: 'http://localhost:3050/login' });
// ... login

// Step 2: Navigate to membership page
await browser_navigate({ url: 'http://localhost:3050/app/membership' });
await browser_snapshot({ filename: 'pay-002-step2-dues-owed.png' });

// Step 3: Verify dues amount displayed
await browser_wait_for({ text: 'Dues Owed: $50.00' });

// Step 4: Click Pay Dues
await browser_click({ element: 'Pay Dues', ref: 'button:has-text("Pay Dues")' });

// Step 5: Enter Stripe test card
// Note: Stripe iframe handling
await browser_type({
  element: 'Card number (in Stripe iframe)',
  ref: 'iframe[name*="stripe"] input[name="cardnumber"]',
  text: '4242424242424242'
});
await browser_type({
  element: 'Expiry',
  ref: 'iframe[name*="stripe"] input[name="exp-date"]',
  text: '12/25'
});
await browser_type({
  element: 'CVC',
  ref: 'iframe[name*="stripe"] input[name="cvc"]',
  text: '123'
});

// Step 6: Submit payment
await browser_click({ element: 'Submit Payment', ref: 'button[type="submit"]' });

// Step 7: Verify confirmation
await browser_wait_for({ text: 'Payment Successful' });
await browser_snapshot({ filename: 'pay-002-success.png' });
```

**Expected Results**:
- ✅ Payment processed successfully
- ✅ Dues marked as paid
- ✅ Receipt generated
- ✅ Payment record created
- ✅ Member status updated

**Validation Query**:
```sql
SELECT * FROM Payments
WHERE MemberId = {member_id}
AND PaymentType = 'Dues'
AND Status = 'Completed'
ORDER BY CreatedAt DESC LIMIT 1;

SELECT DuesPaidUntil FROM Members
WHERE Id = {member_id};
```

---

### PAY-005: Subscription Tier Upgrade (Sprout to Grow)

**Preconditions**: Club on Sprout tier
**Tier**: Transition test
**User Role**: Admin
**Priority**: P1

**Test Steps**:
```javascript
// Step 1: Login as Sprout tier admin
await browser_navigate({ url: 'http://localhost:3050/login' });
// ... login

// Step 2: Navigate to billing
await browser_navigate({ url: 'http://localhost:3050/admin/billing' });
await browser_snapshot({ filename: 'pay-005-step2-current-plan.png' });

// Step 3: Verify current tier is Sprout
await browser_wait_for({ text: 'Current Plan: Sprout' });

// Step 4: Click Upgrade to Grow
await browser_click({ element: 'Upgrade to Grow', ref: 'button:has-text("Upgrade to Grow")' });

// Step 5: Select billing cycle
await browser_click({ element: 'Monthly option', ref: 'input[value="monthly"]' });

// Step 6: Review pricing
await browser_wait_for({ text: '$12/month' });
await browser_snapshot({ filename: 'pay-005-step6-pricing.png' });

// Step 7: Enter payment method
await browser_type({
  element: 'Card number',
  ref: 'iframe[name*="stripe"] input[name="cardnumber"]',
  text: '4242424242424242'
});
// ... expiry, CVC

// Step 8: Confirm upgrade
await browser_click({ element: 'Confirm Upgrade', ref: 'button:has-text("Confirm")' });
await browser_wait_for({ text: 'Upgrade successful' });

// Step 9: Verify features unlocked
await browser_navigate({ url: 'http://localhost:3050/admin/communications' });
await browser_wait_for({ text: 'Email Templates' }); // Should now be accessible
await browser_snapshot({ filename: 'pay-005-features-unlocked.png' });
```

**Expected Results**:
- ✅ Stripe subscription created
- ✅ Tier updated to "Grow"
- ✅ New features immediately available
- ✅ Pro-rated billing applied
- ✅ Invoice sent

**Validation Query**:
```sql
SELECT Tier, StripeSubscriptionId, SubscriptionStatus
FROM Clubs
WHERE Id = {club_id};
-- Tier should be 'Grow', SubscriptionStatus should be 'Active'
```

---

# Category 5: Communications

### COMM-001: Send Email to All Members

**Preconditions**: Admin logged in, members exist, Grow+ tier
**Tier**: Grow+
**User Role**: Admin
**Priority**: P1

**Test Steps**:
```javascript
// Step 1: Navigate to communications
await browser_navigate({ url: 'http://localhost:3050/admin/communications/new' });

// Step 2: Select Email channel
await browser_click({ element: 'Email tab', ref: 'button:has-text("Email")' });

// Step 3: Select recipients
await browser_click({ element: 'Recipients dropdown', ref: 'select[name="recipients"]' });
await browser_select_option({
  element: 'Recipients',
  ref: 'select[name="recipients"]',
  values: ['All Members']
});

// Step 4: Enter subject
await browser_type({
  element: 'Subject',
  ref: 'input[name="subject"]',
  text: 'Important Club Announcement'
});

// Step 5: Compose message (rich text editor)
await browser_type({
  element: 'Message body',
  ref: 'div[contenteditable="true"]',
  text: 'Hello {{firstName}}, We have an important announcement about upcoming events...'
});

// Step 6: Preview email
await browser_click({ element: 'Preview', ref: 'button:has-text("Preview")' });
await browser_snapshot({ filename: 'comm-001-preview.png' });
// Verify {{firstName}} replaced with actual name

// Step 7: Send email
await browser_click({ element: 'Send', ref: 'button:has-text("Send Now")' });
await browser_wait_for({ text: 'Email sent' });
await browser_snapshot({ filename: 'comm-001-sent.png' });
```

**Expected Results**:
- ✅ Email composed successfully
- ✅ Personalization tokens work ({{firstName}})
- ✅ Preview shows actual member data
- ✅ Sent to all active members
- ✅ Delivery tracked

**Validation Query**:
```sql
SELECT COUNT(*) FROM CommunicationsLog
WHERE MessageType = 'Email'
AND Subject = 'Important Club Announcement'
AND ClubId = {club_id};

-- Should equal the number of active members
SELECT COUNT(*) FROM Members
WHERE ClubId = {club_id}
AND Status = 'Active';
```

---

### COMM-005: A/B Testing Email Campaign

**Preconditions**: Unlimited tier, email composed
**Tier**: Unlimited
**User Role**: Admin
**Priority**: P2

**Test Steps**:
```javascript
// Step 1: Navigate to A/B tests
await browser_navigate({ url: 'http://localhost:3050/admin/communications/ab-tests' });

// Step 2: Create A/B test
await browser_click({ element: 'Create Test', ref: 'button:has-text("Create A/B Test")' });

// Step 3: Configure test
await browser_type({
  element: 'Campaign Name',
  ref: 'input[name="name"]',
  text: 'Event Promotion Subject Line Test'
});

// Step 4: Variant A
await browser_type({
  element: 'Variant A Subject',
  ref: 'input[name="variantASubject"]',
  text: 'Join us for the Summer Gala!'
});

// Step 5: Variant B
await browser_type({
  element: 'Variant B Subject',
  ref: 'input[name="variantBSubject"]',
  text: "Don't miss this year's biggest event!"
});

// Step 6: Set test parameters
await browser_type({ element: 'Test Percentage', ref: 'input[name="testPercentage"]', text: '20' });
await browser_select_option({ element: 'Split', ref: 'select[name="split"]', values: ['50/50'] });
await browser_select_option({ element: 'Metric', ref: 'select[name="metric"]', values: ['Open Rate'] });

// Step 7: Launch test
await browser_click({ element: 'Launch Test', ref: 'button:has-text("Launch")' });
await browser_wait_for({ text: 'Test launched' });
await browser_snapshot({ filename: 'comm-005-launched.png' });

// Step 8: View results (after 24 hours - manual check)
// Navigate back to test, check metrics
await browser_navigate({ url: 'http://localhost:3050/admin/communications/ab-tests/{campaignId}' });
await browser_snapshot({ filename: 'comm-005-results.png' });
```

**Expected Results**:
- ✅ A/B test configured
- ✅ Test emails sent (20% of list, split 50/50)
- ✅ Metrics tracked (opens, clicks)
- ✅ Winner auto-selected after significance reached
- ✅ Remaining 80% sent using winner

**Validation Query**:
```sql
SELECT * FROM ABTestCampaigns
WHERE ClubId = {club_id}
AND CampaignName = 'Event Promotion Subject Line Test';

SELECT COUNT(*), VariantId FROM CommunicationAnalytics
WHERE CampaignId = {campaign_id}
GROUP BY VariantId;
```

---

# Category 10: Security & Access Control

### SEC-001: SQL Injection Prevention

**Preconditions**: Application running
**Tier**: N/A
**User Role**: Security Tester
**Priority**: P0 (Critical)

**Test Steps**:
```javascript
// Test 1: SQL injection in login (covered in AUTH-015)

// Test 2: SQL injection in member search
await browser_navigate({ url: 'http://localhost:3050/admin/members' });
await browser_type({
  element: 'Search',
  ref: 'input[name="search"]',
  text: "'; DROP TABLE Members;--"
});
await browser_click({ element: 'Search', ref: 'button[type="submit"]' });

// Verify no error, no data loss
await browser_snapshot({ filename: 'sec-001-search-safe.png' });

// Test 3: SQL injection in event filter
await browser_navigate({ url: 'http://localhost:3050/admin/events' });
await browser_type({
  element: 'Filter',
  ref: 'input[name="filter"]',
  text: "1' OR '1'='1"
});

// Verify safe handling
await browser_snapshot();
```

**Expected Results**:
- ✅ All inputs sanitized
- ✅ Parameterized queries prevent injection
- ✅ No SQL errors in response
- ✅ Application remains secure
- ✅ Attempts logged

---

### SEC-007: Tenant Isolation (Multi-Tenancy)

**Preconditions**: Two clubs exist
**Tier**: N/A
**User Role**: Admin
**Priority**: P0 (Critical)

**Test Steps**:
```javascript
// Covered in AUTH-012, additional API-level tests:

// Test 1: Direct API call to other club's resource
await browser_evaluate({
  function: `async () => {
    const response = await fetch('http://localhost:8050/api/v1/clubs/2/members', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + document.cookie.match(/token=([^;]+)/)[1]
      }
    });
    return response.status;
  }`
});
// Should return 403
```

**Expected Results**:
- ✅ ClubId claim enforced
- ✅ Cannot access other tenants
- ✅ Database queries filter by ClubId
- ✅ No cross-tenant data leakage
- ✅ Authorization middleware works

---

# Category 15: Integration Workflows

### WORKFLOW-001: New Member Onboarding (Complete Journey)

**Preconditions**: None (start fresh)
**Tier**: All tiers
**User Role**: New Member
**Priority**: P1

**Test Steps**:
```javascript
// Step 1: Admin invites member (covered in previous tests)

// Step 2: Member receives invitation email
// (Manual: Check database for invitation token)

// Step 3: Member clicks activation link
await browser_navigate({ url: 'http://localhost:3050/activate?token={activation_token}' });
await browser_snapshot();

// Step 4: Member sets password
await browser_type({ element: 'Password', ref: 'input[name="password"]', text: 'NewMemberPass123!' });
await browser_type({ element: 'Confirm', ref: 'input[name="confirmPassword"]', text: 'NewMemberPass123!' });
await browser_click({ element: 'Activate', ref: 'button:has-text("Activate Account")' });

// Step 5: Verify redirect to member portal
await browser_wait_for({ text: 'Welcome' });
await browser_snapshot({ filename: 'workflow-001-step5-welcome.png' });

// Step 6: Complete profile
await browser_navigate({ url: 'http://localhost:3050/app/profile' });
await browser_type({ element: 'Phone', ref: 'input[name="phone"]', text: '555-9999' });
await browser_type({ element: 'Address', ref: 'input[name="address"]', text: '123 Main St' });
await browser_click({ element: 'Save', ref: 'button:has-text("Save")' });

// Step 7: Explore events
await browser_navigate({ url: 'http://localhost:3050/app/events' });
await browser_snapshot({ filename: 'workflow-001-step7-events.png' });

// Step 8: RSVP to first event
await browser_click({ element: 'First event', ref: 'div[data-event]:first-child' });
await browser_click({ element: 'RSVP', ref: 'button:has-text("RSVP")' });
await browser_click({ element: 'Attending', ref: 'button:has-text("Attending")' });
await browser_wait_for({ text: 'confirmed' });

// Step 9: Browse directory
await browser_navigate({ url: 'http://localhost:3050/app/directory' });
await browser_snapshot({ filename: 'workflow-001-step9-directory.png' });

// Step 10: Send chat message (if Grow+ tier)
await browser_navigate({ url: 'http://localhost:3050/app/chat' });
await browser_type({ element: 'Message', ref: 'input[name="message"]', text: 'Hello everyone!' });
await browser_click({ element: 'Send', ref: 'button[type="submit"]' });
await browser_wait_for({ text: 'Hello everyone!' });
await browser_snapshot({ filename: 'workflow-001-complete.png' });
```

**Expected Results**:
- ✅ Seamless onboarding experience
- ✅ All steps complete successfully
- ✅ Emails received at each step
- ✅ Profile complete
- ✅ Member engaged immediately

---

### WORKFLOW-002: Event Creation to Post-Event Analysis

**Preconditions**: Admin logged in, Grow+ tier
**Tier**: Grow+
**User Role**: Admin
**Priority**: P1

**Test Steps**:
```javascript
// Step 1: Create paid event (covered in EVENT-002)
// Step 2: Generate QR codes (covered in EVENT-008)

// Step 3: Send invitations
await browser_navigate({ url: 'http://localhost:3050/admin/events/{eventId}' });
await browser_click({ element: 'Send Invitations', ref: 'button:has-text("Send Invitations")' });
await browser_select_option({ element: 'Recipients', ref: 'select', values: ['All Members'] });
await browser_click({ element: 'Send', ref: 'button:has-text("Send")' });
await browser_wait_for({ text: 'Invitations sent' });

// Step 4: Track RSVP responses
await browser_navigate({ url: 'http://localhost:3050/admin/events/{eventId}/rsvps' });
await browser_snapshot({ filename: 'workflow-002-rsvps.png' });

// Step 5: Process payments (for paid event)
// (Automatic as members RSVP and pay)

// Step 6: Event day - check-in attendees
await browser_navigate({ url: 'http://localhost:3050/admin/events/{eventId}/checkin' });
// Use QR scanner or manual check-in (covered in EVENT-008)

// Step 7: After event - collect feedback
await browser_navigate({ url: 'http://localhost:3050/admin/events/{eventId}/feedback' });
await browser_click({ element: 'Send Feedback Request', ref: 'button:has-text("Request Feedback")' });

// Step 8: View event analytics
await browser_navigate({ url: 'http://localhost:3050/admin/events/{eventId}/analytics' });
await browser_snapshot({ filename: 'workflow-002-analytics.png' });
// View: RSVP rate, attendance rate, revenue, satisfaction

// Step 9: Export attendee report
await browser_click({ element: 'Export', ref: 'button:has-text("Export")' });
await browser_select_option({ element: 'Format', ref: 'select', values: ['CSV'] });
await browser_click({ element: 'Download', ref: 'button:has-text("Download")' });

// Step 10: Use insights for next event
await browser_navigate({ url: 'http://localhost:3050/admin/events/new' });
// Create similar event based on learnings
```

**Expected Results**:
- ✅ Complete event lifecycle managed
- ✅ All integrations work (payment, QR, email)
- ✅ Data flows correctly between systems
- ✅ Analytics actionable
- ✅ ROI measurable

---

## Test Execution Guidelines

### Before Starting
1. Ensure backend and frontend are running
2. Database seeded with test data
3. Playwright MCP tools available
4. Browser clean (clear cache, cookies)

### During Testing
1. Take screenshots at each major step
2. Record unexpected behaviors
3. Note performance issues
4. Verify database state after operations
5. Check browser console for errors

### After Each Test
1. Record pass/fail status
2. Document deviations from expected results
3. File bug tickets for failures
4. Update test execution log

### Test Data Management
- Use seeded test data when possible
- Create unique data for concurrent testing
- Clean up test data after destructive tests
- Maintain test data consistency

---

## Test Execution Log Template

### Test Execution Record

**Test ID**: AUTH-001
**Test Name**: User Registration (Happy Path)
**Executed By**: Tester Name
**Date/Time**: 2025-01-15 10:30 AM
**Environment**: Local Dev (backend:8050, frontend:3050)
**Status**: ✅ PASS / ❌ FAIL

**Notes**:
- All steps completed successfully
- Registration took 2.3 seconds
- JWT token set correctly
- Dashboard loaded in 1.8 seconds

**Screenshots**:
- `auth-001-step1-registration-page.png`
- `auth-001-step2-form-filled.png`
- `auth-001-step4-dashboard.png`

**Issues Found**: None

**Database Validation**: ✅ Passed
```sql
SELECT * FROM Users WHERE Email = 'e2e-test-1736937000@example.com';
-- Result: 1 row, all fields correct
```

---

## Bug Report Template

**Bug ID**: BUG-{number}
**Related Test**: {TEST-ID}
**Severity**: Critical / High / Medium / Low
**Priority**: P0 / P1 / P2 / P3

**Summary**: Brief description of the bug

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Result**: What should happen
**Actual Result**: What actually happened

**Screenshots/Videos**: Attached

**Environment**:
- Backend: localhost:8050
- Frontend: localhost:3050
- Database: GatherGroveDb (LocalDB)
- Browser: Chrome 120

**Database State** (if relevant):
```sql
SELECT * FROM ...
```

**Console Errors**:
```
Error message from browser console
```

**Additional Notes**: Any relevant information

---

## Test Summary Report Template

### E2E Test Execution Summary

**Test Cycle**: Comprehensive E2E Testing - Phase 1
**Execution Period**: 2025-01-15 to 2025-01-29
**Tester**: QA Team

**Statistics**:
- Total Tests Executed: 150
- Passed: 142 (94.7%)
- Failed: 8 (5.3%)
- Blocked: 0
- Not Executed: 0

**Test Coverage**:
- Authentication & Authorization: 15/15 (100%)
- Member Management: 18/18 (100%)
- Event Management: 20/20 (100%)
- Payment Processing: 13/15 (86.7%)
- Communications: 12/12 (100%)
- Multi-Location: 10/10 (100%)
- Chat & Real-time: 7/8 (87.5%)
- Analytics: 10/10 (100%)
- Tier Features: 12/12 (100%)
- Security: 10/10 (100%)
- Data Import/Export: 8/8 (100%)
- PWA Features: 5/6 (83.3%)
- Error Handling: 10/10 (100%)
- Performance: 6/6 (100%)
- Workflows: 10/10 (100%)

**Critical Issues Found**: 2
- BUG-001: Payment webhook processing delay (P0)
- BUG-005: Session timeout during long form fills (P0)

**High Priority Issues**: 6
- BUG-002: Chat message ordering in high load
- BUG-004: Event capacity race condition
- (additional issues...)

**Recommendations**:
1. Fix P0 issues before production
2. Increase test coverage for payment flows
3. Add automated monitoring for real-time features
4. Performance optimization for large data sets

---

## Appendix: Playwright MCP Command Reference

### Navigation
```javascript
await browser_navigate({ url: 'http://localhost:3050/page' });
await browser_navigate_back();
```

### Element Interaction
```javascript
await browser_click({ element: 'Button description', ref: 'button[type="submit"]' });
await browser_type({ element: 'Input', ref: 'input[name="email"]', text: 'value' });
await browser_select_option({ element: 'Dropdown', ref: 'select', values: ['option'] });
await browser_fill_form({ fields: [/* array of fields */] });
```

### Waiting & Verification
```javascript
await browser_wait_for({ text: 'Expected text' });
await browser_wait_for({ textGone: 'Loading...' });
await browser_wait_for({ time: 2 }); // seconds
```

### Screenshots & State
```javascript
await browser_snapshot({ filename: 'optional-name.png' });
await browser_take_screenshot({ fullPage: true, filename: 'full-page.png' });
```

### JavaScript Evaluation
```javascript
await browser_evaluate({
  function: '() => { return document.title; }'
});
```

### Browser Management
```javascript
await browser_resize({ width: 1920, height: 1080 });
await browser_close();
```

---

## Conclusion

This comprehensive E2E manual test plan provides detailed test scenarios for the entire GatherGrove platform. Execute tests systematically, document results thoroughly, and file bugs for all failures.

**Success Criteria**:
- ✅ All P0 tests pass (Authentication, Security, Core Features)
- ✅ >95% pass rate overall
- ✅ All critical bugs fixed
- ✅ Performance metrics meet targets
- ✅ Security vulnerabilities addressed

For questions or issues during test execution, refer to:
- Test plan documentation
- Seeding script README
- Playwright MCP documentation
- GatherGrove CLAUDE.md (project instructions)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Maintained By**: QA Team
