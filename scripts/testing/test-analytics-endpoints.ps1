# Test Analytics Endpoints
# Tests the 4 new analytics endpoints added to AdvancedAnalyticsController

$baseUrl = "http://localhost:8050"
$testResults = @()

Write-Host "`n=== GatherGrove Analytics Endpoints Test ===" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl`n" -ForegroundColor Gray

# Step 1: Login to get authentication cookie
Write-Host "[1/5] Authenticating..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "testadmin@example.com"
        password = "TestPassword123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -SessionVariable session `
        -ErrorAction Stop

    $loginData = $loginResponse.Content | ConvertFrom-Json
    Write-Host "✅ Login successful - User: $($loginData.fullName)" -ForegroundColor Green
    Write-Host "   Club ID: $($loginData.clubId)" -ForegroundColor Gray
    Write-Host "   Tier: $($loginData.clubTier)`n" -ForegroundColor Gray

    $clubId = $loginData.clubId

    $testResults += @{
        Test = "Authentication"
        Status = "✅ PASS"
        Details = "Logged in as $($loginData.fullName)"
    }
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{
        Test = "Authentication"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
    exit 1
}

# Get a member ID and event ID for testing
Write-Host "[2/5] Finding test data (member & event)..." -ForegroundColor Yellow
try {
    # Get a member
    $membersResponse = Invoke-WebRequest -Uri "$baseUrl/api/clubs/$clubId/members?pageSize=1" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop

    $membersData = $membersResponse.Content | ConvertFrom-Json
    if ($membersData.members.Count -gt 0) {
        $memberId = $membersData.members[0].id
        Write-Host "✅ Found test member - ID: $memberId" -ForegroundColor Green
    } else {
        $memberId = 1 # Fallback
        Write-Host "⚠️  No members found, using ID: $memberId" -ForegroundColor Yellow
    }

    # Get an event
    $eventsResponse = Invoke-WebRequest -Uri "$baseUrl/api/clubs/$clubId/events?pageSize=1" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop

    $eventsData = $eventsResponse.Content | ConvertFrom-Json
    if ($eventsData.events.Count -gt 0) {
        $eventId = $eventsData.events[0].id
        Write-Host "✅ Found test event - ID: $eventId`n" -ForegroundColor Green
    } else {
        $eventId = 1 # Fallback
        Write-Host "⚠️  No events found, using ID: $eventId`n" -ForegroundColor Yellow
    }

    $testResults += @{
        Test = "Test Data Discovery"
        Status = "✅ PASS"
        Details = "Member ID: $memberId, Event ID: $eventId"
    }
} catch {
    Write-Host "⚠️  Could not fetch test data: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Using fallback IDs: Member=1, Event=1`n" -ForegroundColor Gray
    $memberId = 1
    $eventId = 1

    $testResults += @{
        Test = "Test Data Discovery"
        Status = "⚠️  WARN"
        Details = "Using fallback IDs"
    }
}

# Test 1: Event Recommendations
Write-Host "[3/5] Testing Event Recommendations Endpoint..." -ForegroundColor Yellow
try {
    $url = "$baseUrl/api/clubs/$clubId/analytics/premium/event-recommendations?memberId=$memberId&maxRecommendations=5"
    $response = Invoke-WebRequest -Uri $url `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Event Recommendations - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Recommendations returned: $($data.Count)" -ForegroundColor Gray
    if ($data.Count -gt 0) {
        Write-Host "   Sample: $($data[0].eventName) (Score: $($data[0].recommendationScore))`n" -ForegroundColor Gray
    } else {
        Write-Host "   (No recommendations available)`n" -ForegroundColor Gray
    }

    $testResults += @{
        Test = "Event Recommendations"
        Status = "✅ PASS"
        Details = "Returned $($data.Count) recommendations"
    }
} catch {
    Write-Host "❌ Event Recommendations failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode`n" -ForegroundColor Gray
    }

    $testResults += @{
        Test = "Event Recommendations"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
}

# Test 2: Event Performance Analysis
Write-Host "[4/5] Testing Event Performance Analysis Endpoint..." -ForegroundColor Yellow
try {
    $url = "$baseUrl/api/clubs/$clubId/analytics/premium/event-performance/$eventId"
    $response = Invoke-WebRequest -Uri $url `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Event Performance Analysis - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Event: $($data.eventName)" -ForegroundColor Gray
    Write-Host "   Performance Score: $($data.performanceScore)" -ForegroundColor Gray
    Write-Host "   Attendance Rate: $($data.attendanceAnalysis.attendanceRate)%`n" -ForegroundColor Gray

    $testResults += @{
        Test = "Event Performance Analysis"
        Status = "✅ PASS"
        Details = "Event: $($data.eventName), Score: $($data.performanceScore)"
    }
} catch {
    Write-Host "❌ Event Performance Analysis failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode`n" -ForegroundColor Gray
    }

    $testResults += @{
        Test = "Event Performance Analysis"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
}

# Test 3: Event Success Prediction
Write-Host "[5/5] Testing Event Success Prediction Endpoint..." -ForegroundColor Yellow
try {
    $url = "$baseUrl/api/clubs/$clubId/analytics/premium/event-success-prediction/$eventId"
    $response = Invoke-WebRequest -Uri $url `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Event Success Prediction - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Event: $($data.eventName)" -ForegroundColor Gray
    Write-Host "   Success Probability: $($data.successProbability)%" -ForegroundColor Gray
    Write-Host "   Confidence Level: $($data.confidenceLevel)`n" -ForegroundColor Gray

    $testResults += @{
        Test = "Event Success Prediction"
        Status = "✅ PASS"
        Details = "Success: $($data.successProbability)%, Confidence: $($data.confidenceLevel)"
    }
} catch {
    Write-Host "❌ Event Success Prediction failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode`n" -ForegroundColor Gray
    }

    $testResults += @{
        Test = "Event Success Prediction"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
}

# Test 4: Engagement Report
Write-Host "[6/6] Testing Engagement Report Endpoint..." -ForegroundColor Yellow
try {
    $url = "$baseUrl/api/clubs/$clubId/analytics/premium/engagement-report"

    $reportBody = @{
        reportType = "comprehensive"
        startDate = (Get-Date).AddMonths(-1).ToString("yyyy-MM-ddTHH:mm:ssZ")
        endDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri $url `
        -Method POST `
        -Body $reportBody `
        -ContentType "application/json" `
        -WebSession $session `
        -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Engagement Report - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Report Type: $($data.reportType)" -ForegroundColor Gray
    Write-Host "   Events Analyzed: $($data.eventAnalysis.Count)" -ForegroundColor Gray
    Write-Host "   Member Insights: $($data.memberInsights.Count)`n" -ForegroundColor Gray

    $testResults += @{
        Test = "Engagement Report"
        Status = "✅ PASS"
        Details = "Generated $($data.reportType) report with $($data.eventAnalysis.Count) events"
    }
} catch {
    Write-Host "❌ Engagement Report failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode`n" -ForegroundColor Gray
    }

    $testResults += @{
        Test = "Engagement Report"
        Status = "❌ FAIL"
        Details = $_.Exception.Message
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
$passCount = ($testResults | Where-Object { $_.Status -like "*PASS*" }).Count
$failCount = ($testResults | Where-Object { $_.Status -like "*FAIL*" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -like "*WARN*" }).Count
$totalTests = $testResults.Count

foreach ($result in $testResults) {
    Write-Host "$($result.Status) $($result.Test)" -ForegroundColor $(
        if ($result.Status -like "*PASS*") { "Green" }
        elseif ($result.Status -like "*FAIL*") { "Red" }
        else { "Yellow" }
    )
    Write-Host "   $($result.Details)" -ForegroundColor Gray
}

Write-Host "`nResults: $passCount passed, $failCount failed, $warnCount warnings out of $totalTests tests" -ForegroundColor $(
    if ($failCount -eq 0) { "Green" } else { "Yellow" }
)

if ($failCount -eq 0) {
    Write-Host "`n✅ All analytics endpoints working correctly!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  Some tests failed - see details above" -ForegroundColor Yellow
    exit 1
}
