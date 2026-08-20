# Member Management E2E Test Cases

## Test Case: MEMBER-001 - Add New Member Happy Path

### Objective
Verify that club admins can successfully add new members to their club

### Prerequisites
- Admin user is logged in
- Club exists with available member slots
- Test data for new member available

### Test Data Requirements
- Full name: "Test Member {timestamp}"
- Email: "testmember+{timestamp}@example.com"
- Phone: "+1 555-0123"
- Membership type: "Regular Member"

### Test Steps

#### 1. Navigate to Members Page
**Action**: 
- Login as admin
- Navigate to `/admin/members`
**Expected Result**: Members list is displayed with "Add Member" button

#### 2. Open Add Member Modal
**Action**: Click "Add Member" or "Add a New Member" button
**Expected Result**: Add member modal/form opens with required fields

#### 3. Fill Member Information
**Action**: 
- Enter full name
- Enter email address
- Enter phone number
- Select membership type
- Fill any additional required fields
**Expected Result**: Form validation passes as fields are completed

#### 4. Submit New Member
**Action**: Click "Add Member" or "Save" button
**Expected Result**: 
- Success message appears
- Member is added to the list
- Modal closes
- Member count updates

#### 5. Verify Member in List
**Action**: Check members list
**Expected Result**: 
- New member appears in the list
- All information is correctly displayed
- Member has "Active" status

#### 6. Verify Member Details
**Action**: Click on new member to view details
**Expected Result**: Member details modal shows all entered information

### Validation Points
- [ ] Add member button is accessible
- [ ] Form validation works for required fields
- [ ] Email format validation works
- [ ] Phone format validation works
- [ ] Member is successfully created
- [ ] Member appears in list immediately
- [ ] Member details are accurate
- [ ] Member count updates correctly

### Error Scenarios
- Duplicate email address
- Invalid email format
- Missing required fields
- Membership limit reached (for limited tiers)

---

## Test Case: MEMBER-002 - Edit Existing Member

### Objective
Verify that admins can successfully update member information

### Prerequisites
- Admin user is logged in
- At least one existing member in the system

### Test Steps

#### 1. Navigate to Member Details
**Action**: 
- Go to members list
- Click on an existing member
**Expected Result**: Member details modal opens

#### 2. Open Edit Mode
**Action**: Click "Edit" or similar button
**Expected Result**: Form fields become editable

#### 3. Update Member Information
**Action**: 
- Change full name
- Update phone number
- Modify membership type
**Expected Result**: Changes are reflected in form

#### 4. Save Changes
**Action**: Click "Save" or "Update" button
**Expected Result**: 
- Success message appears
- Changes are saved
- Updated information displays correctly

#### 5. Verify Changes Persist
**Action**: Close modal and reopen member details
**Expected Result**: Updated information is displayed

### Validation Points
- [ ] Edit functionality is accessible
- [ ] All fields can be updated
- [ ] Validation works for updated fields
- [ ] Changes save successfully
- [ ] Updated data persists
- [ ] Audit trail recorded (if applicable)

---

## Test Case: MEMBER-003 - Member Search and Filtering

### Objective
Verify that admins can effectively search and filter the member list

### Prerequisites
- Admin user is logged in
- Multiple members exist with varied information

### Test Steps

#### 1. Navigate to Members List
**Action**: Go to `/admin/members`
**Expected Result**: Full member list is displayed

#### 2. Test Search Functionality
**Action**: 
- Enter partial name in search field
- Enter email address in search
- Search by phone number
**Expected Result**: Results filter as expected for each search

#### 3. Test Filtering Options
**Action**: 
- Filter by membership type
- Filter by status (Active/Inactive)
- Filter by join date range
**Expected Result**: List updates to show only matching members

#### 4. Test Combined Search and Filters
**Action**: Apply both search terms and filters
**Expected Result**: Results show intersection of criteria

#### 5. Clear Filters
**Action**: Clear search and reset filters
**Expected Result**: Full member list returns

### Validation Points
- [ ] Search works for name, email, phone
- [ ] Filters work independently
- [ ] Combined search and filters work
- [ ] Clear/reset functionality works
- [ ] Search is performant with large datasets
- [ ] No results state displays appropriately

---

## Test Case: MEMBER-004 - Bulk Member Operations

### Objective
Verify that admins can perform bulk actions on multiple members

### Prerequisites
- Admin user is logged in
- Multiple members exist in the system
- Unlimited tier for bulk import testing

### Test Steps

#### 1. Select Multiple Members
**Action**: 
- Navigate to members list
- Use checkboxes to select multiple members
**Expected Result**: 
- Selection count updates
- Bulk action menu appears

#### 2. Test Bulk Status Update
**Action**: 
- Select multiple active members
- Choose "Mark as Inactive" bulk action
**Expected Result**: 
- Confirmation dialog appears
- Selected members status updates
- Success message shows count

#### 3. Test Bulk Export
**Action**: 
- Select members for export
- Choose export format (CSV/PDF)
- Trigger export
**Expected Result**: 
- Export file is generated
- File contains selected member data
- Download initiates successfully

#### 4. Test Bulk Email/Communication
**Action**: 
- Select multiple members
- Choose "Send Message" bulk action
- Compose message
**Expected Result**: 
- Message composition interface opens
- Recipients list shows selected members
- Message can be sent to all

### Validation Points
- [ ] Multi-select functionality works
- [ ] Bulk actions are available when appropriate
- [ ] Bulk operations complete successfully
- [ ] Confirmation dialogs prevent accidents
- [ ] Progress indicators for long operations
- [ ] Success/failure notifications are clear

---

## Test Case: MEMBER-005 - Member Import Functionality

### Objective
Verify that admins can import members from CSV files (Unlimited tier feature)

### Prerequisites
- Admin user with Unlimited tier account
- CSV file with member data prepared
- Valid import file format

### Test Data Requirements
```csv
Full Name,Email,Phone,Membership Type
John Smith,john@example.com,+1555001234,Regular
Jane Doe,jane@example.com,+1555005678,Premium
```

### Test Steps

#### 1. Navigate to Import Function
**Action**: 
- Go to members page
- Find "Import Members" option
**Expected Result**: Import interface is accessible for Unlimited tier

#### 2. Upload CSV File
**Action**: 
- Click import button
- Select valid CSV file
- Upload file
**Expected Result**: 
- File uploads successfully
- Preview of import data shows

#### 3. Review Import Preview
**Action**: Review the preview data
**Expected Result**: 
- All rows from CSV are displayed
- Data mapping is correct
- Any issues are highlighted

#### 4. Execute Import
**Action**: Confirm import
**Expected Result**: 
- Progress indicator shows
- Import completes successfully
- Success message shows count imported

#### 5. Verify Imported Members
**Action**: Check members list
**Expected Result**: 
- All imported members appear
- Data is correctly populated
- No duplicates created

### Validation Points
- [ ] Import feature available for Unlimited tier
- [ ] CSV file validation works
- [ ] Preview shows accurate data
- [ ] Import process completes successfully
- [ ] Duplicate handling works correctly
- [ ] Error handling for malformed data

### Error Scenarios
- Invalid CSV format
- Duplicate email addresses
- Missing required fields
- Large file handling
- Network interruption during import

---

## Test Case: MEMBER-006 - Member Profile Management

### Objective
Verify that members can view and update their own profiles

### Prerequisites
- Regular member user is logged in
- Member has existing profile data

### Test Steps

#### 1. Navigate to Profile
**Action**: 
- Login as member (not admin)
- Navigate to profile page
**Expected Result**: Member profile displays current information

#### 2. View Profile Information
**Action**: Review displayed profile data
**Expected Result**: 
- Name, email, phone displayed correctly
- Membership type and status shown
- Profile photo placeholder (if supported)

#### 3. Edit Profile Information
**Action**: 
- Click edit profile
- Update name and phone number
- Upload profile photo (if supported)
**Expected Result**: Changes are reflected in form

#### 4. Save Profile Changes
**Action**: Save profile updates
**Expected Result**: 
- Success message appears
- Updated information displays
- Changes persist after page refresh

### Validation Points
- [ ] Profile displays current member data
- [ ] Edit functionality works for allowed fields
- [ ] Some fields restricted from member editing (email, membership type)
- [ ] Profile photo upload works (if supported)
- [ ] Changes save successfully
- [ ] Validation prevents invalid data

---

## Cross-Platform Testing Matrix

### Desktop Browsers
| Test Case | Chrome | Firefox | Safari | Edge |
|-----------|--------|---------|--------|------|
| MEMBER-001| ✓      | ✓       | ✓      | ✓    |
| MEMBER-002| ✓      | ✓       | ✓      | ✓    |
| MEMBER-003| ✓      | ✓       | ✓      | ✓    |
| MEMBER-004| ✓      | ✓       | ✓      | ✓    |
| MEMBER-005| ✓      | ✓       | ✓      | ✓    |
| MEMBER-006| ✓      | ✓       | ✓      | ✓    |

### Mobile Compatibility
- [ ] Member list responsive on mobile
- [ ] Add/Edit member forms work on touch devices
- [ ] Search and filters accessible on mobile
- [ ] File upload works on mobile devices

### Performance Requirements
- [ ] Member list loads within 3 seconds
- [ ] Search results appear within 1 second
- [ ] Bulk operations provide progress feedback
- [ ] Large imports (1000+ members) complete within reasonable time

### Accessibility Requirements
- [ ] All forms keyboard navigable
- [ ] Screen reader compatible
- [ ] Focus management in modals
- [ ] Error messages announced
- [ ] Color contrast meets WCAG standards