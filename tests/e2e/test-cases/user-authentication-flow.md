# User Authentication Flow E2E Test Cases

## Test Case: AUTH-001 - User Registration Happy Path

### Objective
Verify that new users can successfully register for GatherGrove and create their first club

### Prerequisites
- Clean test environment
- Email service configured for test environment
- Database is accessible and empty for this test club

### Test Data Requirements
- Valid email address (not previously registered)
- Complex password meeting security requirements
- Unique club name
- Valid full name

### Test Steps

#### 1. Navigate to Registration Page
**Action**: Navigate to `/register`
**Expected Result**: Registration form is displayed with all required fields

#### 2. Fill Registration Form
**Action**: 
- Enter full name: "Claude Test User"
- Enter email: "claude.test+{timestamp}@gathergrove.com"
- Enter password: "SecureTestPass123!"
- Enter club name: "Claude Test Club {timestamp}"
- Accept terms and conditions
**Expected Result**: Form validation passes, submit button becomes enabled

#### 3. Submit Registration
**Action**: Click "Create My Account" button
**Expected Result**: 
- Loading indicator appears
- User is redirected to admin onboarding page
- Success message or redirect indicates successful registration

#### 4. Verify User Session
**Action**: Check authentication state
**Expected Result**: User is logged in with correct role and club information

#### 5. Verify Database State
**Action**: Database verification (automated)
**Expected Result**: 
- User record created with correct information
- Club record created and linked to user
- User has Admin role for the new club

### Validation Points
- [ ] Registration form displays correctly
- [ ] Password requirements validation works
- [ ] Email format validation works
- [ ] Terms acceptance is enforced
- [ ] User can successfully register
- [ ] User is automatically logged in after registration
- [ ] Club is created and linked to user
- [ ] User has appropriate permissions

### Browser/Device Coverage
- Chrome Desktop (latest)
- Firefox Desktop (latest) 
- Safari Desktop (latest)
- Chrome Mobile (Android)
- Safari Mobile (iOS)

### Test Data Cleanup
- Remove test user from database
- Remove test club from database
- Clear any test emails sent

---

## Test Case: AUTH-002 - User Login Happy Path

### Objective
Verify that existing users can successfully log into their GatherGrove account

### Prerequisites
- Test user exists with known credentials
- User has an active club membership

### Test Data Requirements
- Valid test credentials: claude.test@gathergrove.com / ClaudeTest2024!
- Test club: "Claude Test Club"

### Test Steps

#### 1. Navigate to Login Page
**Action**: Navigate to `/login`
**Expected Result**: Login form is displayed with email and password fields

#### 2. Enter Valid Credentials
**Action**: 
- Enter email: "claude.test@gathergrove.com"
- Enter password: "ClaudeTest2024!"
**Expected Result**: Form accepts input, no validation errors

#### 3. Submit Login
**Action**: Click "Sign In" button
**Expected Result**: 
- Loading indicator appears
- User is redirected to admin dashboard
- Dashboard displays user's club information

#### 4. Verify Dashboard Content
**Action**: Check dashboard elements
**Expected Result**: 
- Welcome message displays user's name
- Club statistics are visible
- Navigation menu is accessible
- Quick actions are available

#### 5. Verify Session Persistence
**Action**: Refresh page or navigate away and back
**Expected Result**: User remains logged in

### Validation Points
- [ ] Login form displays correctly
- [ ] Credentials are accepted
- [ ] User successfully logs in
- [ ] Dashboard loads with correct data
- [ ] Session persists across page reloads
- [ ] Navigation works properly

### Error Scenarios to Test
- Invalid email format
- Wrong password
- Non-existent account
- Account locked/disabled

---

## Test Case: AUTH-003 - Password Reset Flow

### Objective
Verify that users can reset their password when forgotten

### Prerequisites
- Test user exists with known email
- Email service is configured for password reset emails

### Test Steps

#### 1. Navigate to Forgot Password
**Action**: 
- Go to login page
- Click "Forgot Password?" link
**Expected Result**: Password reset form is displayed

#### 2. Request Password Reset
**Action**: Enter email address and submit
**Expected Result**: 
- Success message appears
- Reset email is sent (verify in test email service)

#### 3. Follow Reset Link
**Action**: Click reset link from email
**Expected Result**: New password form is displayed

#### 4. Set New Password
**Action**: Enter and confirm new password
**Expected Result**: 
- Password requirements are enforced
- Success confirmation appears

#### 5. Login with New Password
**Action**: Navigate to login and use new password
**Expected Result**: Login succeeds with new credentials

### Validation Points
- [ ] Forgot password link is accessible
- [ ] Email validation works
- [ ] Reset email is sent
- [ ] Reset link works within time limit
- [ ] New password requirements enforced
- [ ] Login works with new password
- [ ] Old password no longer works

---

## Test Case: AUTH-004 - Session Management

### Objective
Verify proper session handling including timeout and logout

### Test Steps

#### 1. Login and Verify Active Session
**Action**: Login and navigate around application
**Expected Result**: All authenticated pages accessible

#### 2. Test Logout
**Action**: Click logout button
**Expected Result**: 
- User is logged out
- Redirect to home/login page
- Protected pages no longer accessible

#### 3. Test Session Timeout (if applicable)
**Action**: Leave application idle for extended period
**Expected Result**: Session expires, user prompted to re-login

#### 4. Test Multiple Tab Behavior
**Action**: Open application in multiple tabs
**Expected Result**: 
- Login in one tab affects all tabs
- Logout in one tab logs out all tabs

### Validation Points
- [ ] Logout works correctly
- [ ] Session timeout handled properly
- [ ] Multi-tab session sync works
- [ ] Protected routes redirect properly when not authenticated

---

## Cross-Platform Test Matrix

### Desktop Browsers
| Test Case | Chrome | Firefox | Safari | Edge |
|-----------|--------|---------|--------|------|
| AUTH-001  | ✓      | ✓       | ✓      | ✓    |
| AUTH-002  | ✓      | ✓       | ✓      | ✓    |
| AUTH-003  | ✓      | ✓       | ✓      | ✓    |
| AUTH-004  | ✓      | ✓       | ✓      | ✓    |

### Mobile Devices
| Test Case | Chrome Mobile | Safari Mobile | Firefox Mobile |
|-----------|---------------|---------------|----------------|
| AUTH-001  | ✓             | ✓             | ✓              |
| AUTH-002  | ✓             | ✓             | ✓              |
| AUTH-003  | ✓             | ✓             | ✓              |
| AUTH-004  | ✓             | ✓             | ✓              |

### Accessibility Requirements
- [ ] Keyboard navigation works for all form elements
- [ ] Screen reader compatibility verified
- [ ] Focus management is correct
- [ ] Color contrast meets WCAG standards
- [ ] Error messages are announced to screen readers