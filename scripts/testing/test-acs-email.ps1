# Quick test to verify ACS email is working
# This directly calls the ACS email service

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testEmail = "test-$timestamp@example.com"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Testing Azure Communication Services Email" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration Check:" -ForegroundColor Yellow
Write-Host "- API running on: http://localhost:8050" -ForegroundColor White
Write-Host "- Test email: $testEmail" -ForegroundColor White
Write-Host ""

# Check API health
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8050/health" -Method Get
    Write-Host "✓ API is healthy" -ForegroundColor Green
} catch {
    Write-Host "✗ API is not running on port 8050" -ForegroundColor Red
    Write-Host "  Please start the API first: cd backend && dotnet run --project src/GatherGrove.API" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "What to check in the API console logs:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. On startup, look for:" -ForegroundColor White
Write-Host "   ✅ Using Azure Communication Services for email" -ForegroundColor Green
Write-Host "   (NOT: ⚠️  ACS not configured properly...)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. When a member is added to a Grow tier club, look for:" -ForegroundColor White
Write-Host "   - 'Member activation email sent to [email]'" -ForegroundColor Gray
Write-Host "   - 'Email sent successfully to [email] with message ID: [id]'" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ready to test? Follow these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open your API console logs" -ForegroundColor White
Write-Host "2. Look for the startup message about ACS" -ForegroundColor White
Write-Host "3. If you see the green checkmark, ACS is configured!" -ForegroundColor White
Write-Host ""
Write-Host "To trigger an activation email:" -ForegroundColor Yellow
Write-Host "1. Go to http://localhost:3050/admin" -ForegroundColor White
Write-Host "2. Navigate to Members" -ForegroundColor White
Write-Host "3. Add a new member with email: $testEmail" -ForegroundColor White
Write-Host "4. Watch the API logs for the email confirmation" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check the local config file exists
if (Test-Path "backend/src/GatherGrove.API/appsettings.Development.local.json") {
    Write-Host "✓ Local ACS configuration file exists" -ForegroundColor Green
    $config = Get-Content "backend/src/GatherGrove.API/appsettings.Development.local.json" | ConvertFrom-Json
    $connStr = $config.AzureCommunicationServices.ConnectionString
    if ($connStr -and $connStr.StartsWith("endpoint=https://gathergrove-communication")) {
        Write-Host "✓ ACS connection string is configured" -ForegroundColor Green
        Write-Host "✓ From address: $($config.AzureCommunicationServices.EmailFromAddress)" -ForegroundColor Green
    } else {
        Write-Host "✗ ACS connection string looks invalid" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Local configuration file missing" -ForegroundColor Red
    Write-Host "  Expected: backend/src/GatherGrove.API/appsettings.Development.local.json" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Now check your API startup logs!" -ForegroundColor Cyan
Write-Host ""
