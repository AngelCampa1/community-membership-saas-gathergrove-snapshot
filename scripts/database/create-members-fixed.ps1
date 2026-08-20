$connectionString = "Server=localhost\SQLEXPRESS;Database=GatherGroveDb_Dev;Integrated Security=true;TrustServerCertificate=true"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$connection.Open()

# First, get or create a membership type
$command = $connection.CreateCommand()
$command.CommandText = "
IF NOT EXISTS (SELECT 1 FROM MembershipTypes WHERE ClubId = 4)
BEGIN
    INSERT INTO MembershipTypes (ClubId, Name, Description, DuesAmount, DuesFrequency, IsActive, CreatedAt, UpdatedAt)
    VALUES (4, 'General Member', 'Standard membership', 50.00, 'Monthly', 1, GETDATE(), GETDATE())
END
SELECT TOP 1 Id FROM MembershipTypes WHERE ClubId = 4
"
$membershipTypeId = $command.ExecuteScalar()
Write-Host "Membership Type ID: $membershipTypeId"

# Create test members
$members = @(
    @{Email='member1@test.com'; Name='John Doe'; Phone='+15551234567'; SmsConsent=1},
    @{Email='member2@test.com'; Name='Jane Smith'; Phone='+15551234568'; SmsConsent=1},
    @{Email='member3@test.com'; Name='Bob Johnson'; Phone='+15551234569'; SmsConsent=0},
    @{Email='member4@test.com'; Name='Alice Williams'; Phone='+15551234570'; SmsConsent=1},
    @{Email='member5@test.com'; Name='Charlie Brown'; Phone=''; SmsConsent=0}
)

foreach ($member in $members) {
    $command.CommandText = "
    INSERT INTO Members (ClubId, FullName, Email, PhoneNumber, Status, HasSmsConsent, JoinDate, CreatedAt, UpdatedAt, MembershipTypeId)
    VALUES (4, '$($member.Name)', '$($member.Email)', '$($member.Phone)', 'Active', $($member.SmsConsent), GETDATE(), GETDATE(), GETDATE(), $membershipTypeId)
    "
    $command.ExecuteNonQuery() | Out-Null
    Write-Host "Created member: $($member.Name)"
}

# Show summary
$command.CommandText = "SELECT COUNT(*) FROM Members WHERE ClubId = 4"
$totalMembers = $command.ExecuteScalar()

$command.CommandText = "SELECT COUNT(*) FROM Members WHERE ClubId = 4 AND HasSmsConsent = 1 AND PhoneNumber IS NOT NULL AND PhoneNumber != ''"
$withSms = $command.ExecuteScalar()

$connection.Close()

Write-Host "`nSummary:"
Write-Host "Total Members: $totalMembers"
Write-Host "Members with SMS consent: $withSms"
