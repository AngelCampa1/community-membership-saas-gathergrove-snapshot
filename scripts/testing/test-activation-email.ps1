# Test Member Activation Email via ACS
# This script creates a test club and member to trigger the activation email

$baseUrl = "http://localhost:8050/api/v1"
$testEmail = "test-activation-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Testing Member Activation Email (ACS)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Register a club admin account
Write-Host "Step 1: Creating admin account..." -ForegroundColor Yellow
$adminEmail = "admin-test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$registerPayload = @{
    email = $adminEmail
    password = "TestPassword123!"
    fullName = "Test Admin"
    clubName = "Test Club for Activation"
    tier = "Grow"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerPayload -ContentType "application/json"
    Write-Host "✓ Admin account created" -ForegroundColor Green
    Write-Host "  Email: $adminEmail" -ForegroundColor Gray
    Write-Host "  Club: Test Club for Activation (Grow tier)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to create admin account: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Login as admin
Write-Host ""
Write-Host "Step 2: Logging in as admin..." -ForegroundColor Yellow
$loginPayload = @{
    email = $adminEmail
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json" -SessionVariable session
    $token = $loginResponse.token
    $clubId = $loginResponse.user.clubId
    Write-Host "✓ Logged in successfully" -ForegroundColor Green
    Write-Host "  Club ID: $clubId" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to login: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Add a new member (this should trigger the activation email)
Write-Host ""
Write-Host "Step 3: Adding new member to Grow tier club..." -ForegroundColor Yellow
Write-Host "  This should trigger the activation email via ACS" -ForegroundColor Cyan

$memberPayload = @{
    fullName = "Test Member for Activation"
    email = $testEmail
    membershipTypeId = 1
    status = "Active"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $memberResponse = Invoke-RestMethod -Uri "$baseUrl/clubs/$clubId/members" -Method Post -Body $memberPayload -Headers $headers
    Write-Host "✓ Member created successfully" -ForegroundColor Green
    Write-Host "  Member ID: $($memberResponse.id)" -ForegroundColor Gray
    Write-Host "  Email: $testEmail" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to create member: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Check the API logs
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✓ Test Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What to check:" -ForegroundColor Yellow
Write-Host "1. Look at your API console/logs for:" -ForegroundColor White
Write-Host "   - '✅ Using Azure Communication Services for email'" -ForegroundColor Gray
Write-Host "   - 'Member activation email sent to $testEmail'" -ForegroundColor Gray
Write-Host "   - Look for any ACS-related errors" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check your email inbox for:" -ForegroundColor White
Write-Host "   - Email to: $testEmail" -ForegroundColor Gray
Write-Host "   - From: DoNotReply@ACS_RESOURCE_GUID.azurecomm.net" -ForegroundColor Gray
Write-Host "   - Subject: Activate Your Test Club for Activation Account" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test data created:" -ForegroundColor White
Write-Host "   - Admin Email: $adminEmail" -ForegroundColor Gray
Write-Host "   - Member Email: $testEmail" -ForegroundColor Gray
Write-Host "   - Club ID: $clubId" -ForegroundColor Gray
