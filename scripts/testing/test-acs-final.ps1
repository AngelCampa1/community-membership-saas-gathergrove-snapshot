$baseUrl = "http://localhost:8050/api/v1"

Write-Host "=== ACS Email Test ===" -ForegroundColor Cyan
Write-Host "Logging in..." -ForegroundColor Yellow

$loginBody = @{
    email = "testuser@test.com"
    password = "Test123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session
Write-Host "Login successful!" -ForegroundColor Green

Write-Host "Sending email to support@gathergrove.club..." -ForegroundColor Yellow
$emailBody = @{
    subject = "ACS Test Email - Verification"
    body = "This is a test email from GatherGrove Azure Communication Services integration. If you receive this, ACS is working correctly!"
    membershipTypeIds = @()
    sendToAll = $true
} | ConvertTo-Json

$emailResponse = Invoke-RestMethod -Uri "$baseUrl/clubs/4/communications/email" -Method POST -Body $emailBody -ContentType "application/json" -WebSession $session
Write-Host "Email sent successfully!" -ForegroundColor Green
Write-Host "Check backend logs for ACS details and support@gathergrove.club inbox" -ForegroundColor Cyan
