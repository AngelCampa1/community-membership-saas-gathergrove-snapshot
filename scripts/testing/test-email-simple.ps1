# Simple test for member activation email
$baseUrl = "http://localhost:8050/api/v1"
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'

Write-Host "Testing Member Activation Email..." -ForegroundColor Cyan

# 1. Register admin
$adminEmail = "admin-$timestamp@example.com"
$register = @{
    email = $adminEmail
    password = "TestPass123!"
    fullName = "Test Admin"
    clubName = "Email Test Club"
    tier = "Grow"
} | ConvertTo-Json

Write-Host "Creating admin account..." -ForegroundColor Yellow
$regResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $register -ContentType "application/json"
Write-Host "Admin created: $adminEmail" -ForegroundColor Green

# 2. Login
$login = @{
    email = $adminEmail
    password = "TestPass123!"
} | ConvertTo-Json

Write-Host "Logging in..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $login -ContentType "application/json"
$token = $loginResponse.token
$clubId = $loginResponse.user.clubId
Write-Host "Logged in. Club ID: $clubId" -ForegroundColor Green

# 3. Add member (triggers activation email)
$memberEmail = "member-$timestamp@example.com"
$member = @{
    fullName = "Test Member"
    email = $memberEmail
    membershipTypeId = 1
    status = "Active"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host ""
Write-Host "Adding member to trigger activation email..." -ForegroundColor Yellow
Write-Host "Member email: $memberEmail" -ForegroundColor Cyan

$memberResponse = Invoke-RestMethod -Uri "$baseUrl/clubs/$clubId/members" -Method Post -Body $member -Headers $headers

Write-Host ""
Write-Host "SUCCESS! Member created." -ForegroundColor Green
Write-Host "Check API logs for email sending confirmation!" -ForegroundColor Cyan
Write-Host "Member Email: $memberEmail" -ForegroundColor White
