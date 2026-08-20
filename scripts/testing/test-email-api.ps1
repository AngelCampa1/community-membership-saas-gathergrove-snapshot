# Test email sending via API
$baseUrl = "http://localhost:8050/api/v1"

# First, login to get JWT token
$loginBody = @{
    email = "testadmin@gathergrove-test.com"
    password = "TestPassword123!"
} | ConvertTo-Json

Write-Host "Logging in..."
$loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session

Write-Host "Login successful! Sending test email..."

# Send test email
$emailBody = @{
    subject = "ACS Test - Direct API Call"
    body = "This is a test email sent directly via API to verify Azure Communication Services integration.`n`nIf you receive this, ACS is working correctly!"
    membershipTypeIds = @()
    sendToAll = $true
} | ConvertTo-Json

$emailResponse = Invoke-WebRequest -Uri "$baseUrl/clubs/4/communications/email" -Method POST -Body $emailBody -ContentType "application/json" -WebSession $session

Write-Host "Email API Response:"
Write-Host $emailResponse.StatusCode
Write-Host $emailResponse.Content
