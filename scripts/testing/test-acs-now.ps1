# Simple E2E Email Test
$baseUrl = "http://localhost:8050/api/v1"

Write-Host "Login attempt..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@gathergrove.com"
    password = "Admin123\!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session
Write-Host "Login OK" -ForegroundColor Green

Write-Host "Sending email..." -ForegroundColor Yellow
$emailBody = @{
    subject = "ACS Test"
    body = "Test email from ACS"
    membershipTypeIds = @()
    sendToAll = $true
} | ConvertTo-Json

$emailResponse = Invoke-RestMethod -Uri "$baseUrl/clubs/4/communications/email" -Method POST -Body $emailBody -ContentType "application/json" -WebSession $session
Write-Host "Email sent\!" -ForegroundColor Green
