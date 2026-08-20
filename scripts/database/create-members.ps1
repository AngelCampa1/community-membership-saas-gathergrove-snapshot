$connectionString = "Server=localhost\SQLEXPRESS;Database=GatherGroveDb_Dev;Integrated Security=true;TrustServerCertificate=true"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$connection.Open()

# First, get or create a membership type
$command = $connection.CreateCommand()
$command.CommandText = "
IF NOT EXISTS (SELECT 1 FROM MembershipTypes WHERE ClubId = 4)
BEGIN
    INSERT INTO MembershipTypes (ClubId, Name, Description, Price, IsActive, CreatedAt, UpdatedAt)
    VALUES (4, 'General Member', 'Standard membership', 50.00, 1, GETDATE(), GETDATE())
END
SELECT TOP 1 Id FROM MembershipTypes WHERE ClubId = 4
"
$membershipTypeId = $command.ExecuteScalar()
Write-Host "Membership Type ID: $membershipTypeId"

# Create test members
$members = @(
    @{Email='member1@test.com'; Name='John Doe'; Phone='+15551234567'; SmsConsent=$true},
    @{Email='member2@test.com'; Name='Jane Smith'; Phone='+15551234568'; SmsConsent=$true},
    @{Email='member3@test.com'; Name='Bob Johnson'; Phone='+15551234569'; SmsConsent=$false},
    @{Email='member4@test.com'; Name='Alice Williams'; Phone='+15551234570'; SmsConsent=$true},
    @{Email='member5@test.com'; Name='Charlie Brown'; Phone=''; SmsConsent=$false}
)

foreach ($member in $members) {
    $command.CommandText = "
    INSERT INTO Members (ClubId, FullName, Email, PhoneNumber, Status, SmsConsentGiven, JoinedDate, CreatedAt, UpdatedAt, MembershipTypeId)
    VALUES (4, '$($member.Name)', '$($member.Email)', '$($member.Phone)', 'Active', $($member.SmsConsent -as [int]), GETDATE(), GETDATE(), GETDATE(), $membershipTypeId)
    "
    $command.ExecuteNonQuery() | Out-Null
    Write-Host "Created member: $($member.Name)"
}

# Create some device tokens for push notifications
$command.CommandText = "
SELECT TOP 2 Id FROM Members WHERE ClubId = 4 ORDER BY Id
"
$reader = $command.ExecuteReader()
$memberIds = @()
while ($reader.Read()) {
    $memberIds += $reader['Id']
}
$reader.Close()

foreach ($memberId in $memberIds) {
    $deviceToken = "ExponentPushToken[" + (New-Guid).ToString().Substring(0, 22) + "]"
    $command.CommandText = "
    INSERT INTO MemberDeviceTokens (MemberId, DeviceToken, Platform, CreatedAt, UpdatedAt, IsActive)
    VALUES ($memberId, '$deviceToken', 'ios', GETDATE(), GETDATE(), 1)
    "
    $command.ExecuteNonQuery() | Out-Null
}
Write-Host "Created device tokens for 2 members"

# Show summary
$command.CommandText = "
SELECT COUNT(*) as Total FROM Members WHERE ClubId = 4
"
$totalMembers = $command.ExecuteScalar()

$command.CommandText = "
SELECT COUNT(*) as WithSms FROM Members WHERE ClubId = 4 AND SmsConsentGiven = 1 AND PhoneNumber != ''
"
$withSms = $command.ExecuteScalar()

$command.CommandText = "
SELECT COUNT(DISTINCT MemberId) as WithDevices FROM MemberDeviceTokens mdt 
INNER JOIN Members m ON m.Id = mdt.MemberId WHERE m.ClubId = 4 AND mdt.IsActive = 1
"
$withDevices = $command.ExecuteScalar()

$connection.Close()

Write-Host "`nSummary:"
Write-Host "Total Members: $totalMembers"
Write-Host "Members with SMS consent: $withSms"
Write-Host "Members with device tokens: $withDevices"
