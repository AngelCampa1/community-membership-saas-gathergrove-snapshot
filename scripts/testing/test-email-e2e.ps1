# E2E Test: Send email via API to test ACS integration
$baseUrl = "http://localhost:8050/api/v1"

Write-Host "=== GatherGrove ACS Email E2E Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login - Try multiple admin accounts
Write-Host "Step 1: Logging in as admin..." -ForegroundColor Yellow

$accounts = @(
    @{ email = "admin@gathergrove.com"; password = "Admin123!" },
    @{ email = "admin@gathergrove.com"; password = "TestPassword123!" },
    @{ email = "test@email.com"; password = "Test123!" },
    @{ email = "test@email.com"; password = "TestPassword123!" }
)

$loginSuccess = $false
foreach ($account in $accounts) {
    $loginBody = $account | ConvertTo-Json
    try {
        Write-Host "  Trying $($account.email)..." -ForegroundColor Gray
        $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session -ErrorAction Stop
        Write-Host "✓ Login successful with $($account.email)!" -ForegroundColor Green
        $loginSuccess = $true
        break
    } catch {
        Write-Host "    Failed: $($_.Exception.Message)" -ForegroundColor DarkGray
    }
}

if (-not $loginSuccess) {
    Write-Host "✗ All login attempts failed" -ForegroundColor Red
    exit 1
}

Write-Host "  Token received: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""

# Step 2: Send test email to support@gathergrove.club
Write-Host "Step 2: Sending test email via Communications API..." -ForegroundColor Yellow
$emailBody = @{
    subject = "ACS Test Email - E2E Verification $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    body = "This is a test email sent through the Azure Communication Services integration to verify the fixes are working correctly.`n`nTimestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`nIf you receive this email, the ACS integration is working!"
    membershipTypeIds = @()
    sendToAll = $true
} | ConvertTo-Json

try {
    $emailResponse = Invoke-RestMethod -Uri "$baseUrl/clubs/4/communications/email" -Method POST -Body $emailBody -ContentType "application/json" -WebSession $session
    Write-Host "✓ Email API call successful!" -ForegroundColor Green
    Write-Host "  Response: $($emailResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Email send failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response body: $responseBody" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check the backend logs for ACS activity (look for blue circles and checkmarks)"
Write-Host "2. Check support@gathergrove.club inbox for the email"
Write-Host "3. Check spam folder if not in inbox"
