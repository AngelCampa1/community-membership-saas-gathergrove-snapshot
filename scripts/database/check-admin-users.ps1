$connectionString = "Server=localhost\SQLEXPRESS;Database=GatherGroveDb_Dev;Integrated Security=true;TrustServerCertificate=true"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$connection.Open()

# Find users who are club admins
$command = $connection.CreateCommand()
$command.CommandText = @"
SELECT DISTINCT u.Id, u.Email, u.FullName, u.IsActive, c.Name as ClubName
FROM Users u
INNER JOIN ClubAdmins ca ON u.Id = ca.UserId
INNER JOIN Clubs c ON ca.ClubId = c.Id
WHERE u.IsActive = 1
ORDER BY u.Email
"@
$reader = $command.ExecuteReader()

Write-Host "Active Club Admin Users:" -ForegroundColor Cyan
$found = $false
while ($reader.Read()) {
    $found = $true
    Write-Host "  Email: $($reader[1])" -ForegroundColor Yellow
    Write-Host "    Name: $($reader[2]), Active: $($reader[3]), Club: $($reader[4])" -ForegroundColor Gray
}

if (-not $found) {
    Write-Host "  No active admin users found!" -ForegroundColor Red
}

$connection.Close()
