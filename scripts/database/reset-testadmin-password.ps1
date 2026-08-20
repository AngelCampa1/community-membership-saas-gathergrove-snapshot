# Reset testadmin password to TestPassword123!
# This script uses BCrypt to hash the password

$email = "testadmin@gathergrove-test.com"
$password = "TestPassword123!"

Write-Host "Resetting password for $email..." -ForegroundColor Yellow

# Generate BCrypt hash (using the same approach as the backend)
# BCrypt WorkFactor 11 is the default in BCrypt.Net-Next
Add-Type -Path (Join-Path $env:USERPROFILE ".nuget\packages\bcrypt.net-next\4.0.3\lib\net6.0\BCrypt.Net-Next.dll")
$passwordHash = [BCrypt.Net.BCrypt]::HashPassword($password, 11)

Write-Host "Generated hash: $passwordHash" -ForegroundColor Gray

# Update database
$connectionString = "Server=localhost\SQLEXPRESS;Database=GatherGroveDb_Dev;Integrated Security=true;TrustServerCertificate=true"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$connection.Open()

$command = $connection.CreateCommand()
$command.CommandText = "UPDATE Users SET PasswordHash = @hash WHERE Email = @email"
$command.Parameters.AddWithValue("@hash", $passwordHash) | Out-Null
$command.Parameters.AddWithValue("@email", $email) | Out-Null

$rowsAffected = $command.ExecuteNonQuery()
$connection.Close()

if ($rowsAffected -gt 0) {
    Write-Host "Password reset successful!" -ForegroundColor Green
    Write-Host "  Email: $email" -ForegroundColor Cyan
    Write-Host "  Password: $password" -ForegroundColor Cyan
} else {
    Write-Host "User not found!" -ForegroundColor Red
}
