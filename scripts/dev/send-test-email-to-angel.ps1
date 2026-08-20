$connectionString = "Server=localhost\SQLEXPRESS;Database=GatherGroveDb_Dev;Integrated Security=true;TrustServerCertificate=true"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$connection.Open()

# Get the membership type for Club 4
$command = $connection.CreateCommand()
$command.CommandText = "SELECT TOP 1 Id FROM MembershipTypes WHERE ClubId = 4"
$membershipTypeId = $command.ExecuteScalar()
Write-Host "Membership Type ID: $membershipTypeId"

# Check if member already exists
$command.CommandText = "SELECT Id FROM Members WHERE ClubId = 4 AND Email = 'support@gathergrove.club'"
$existingMemberId = $command.ExecuteScalar()

if ($existingMemberId) {
    Write-Host "Member already exists with ID: $existingMemberId"
    # Update to Active status just in case
    $command.CommandText = "UPDATE Members SET Status = 'Active' WHERE Id = $existingMemberId"
    $command.ExecuteNonQuery() | Out-Null
    Write-Host "Updated member to Active status"
} else {
    # Create new member
    $command.CommandText = @"
    INSERT INTO Members (ClubId, FullName, Email, PhoneNumber, Status, HasSmsConsent, JoinDate, CreatedAt, UpdatedAt, MembershipTypeId)
    VALUES (4, 'Angel Campa', 'support@gathergrove.club', '', 'Active', 0, GETDATE(), GETDATE(), GETDATE(), $membershipTypeId)
"@
    $command.ExecuteNonQuery() | Out-Null
    Write-Host "Created new member: Angel Campa"
}

$connection.Close()
Write-Host "`nReady to send test email to support@gathergrove.club"
