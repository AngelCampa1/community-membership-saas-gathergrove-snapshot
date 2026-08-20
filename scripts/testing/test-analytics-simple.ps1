# Simple Analytics Endpoint Test
# Tests if the endpoints exist and return proper responses (even if unauthorized)

$baseUrl = "http://localhost:8050"

Write-Host "`n=== Testing Analytics Endpoints (Structure Only) ===" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl`n" -ForegroundColor Gray

$tests = @(
    @{
        Name = "Event Recommendations"
        Url = "$baseUrl/api/clubs/1/analytics/premium/event-recommendations?memberId=1&maxRecommendations=5"
        Method = "GET"
    },
    @{
        Name = "Event Performance Analysis"
        Url = "$baseUrl/api/clubs/1/analytics/premium/event-performance/1"
        Method = "GET"
    },
    @{
        Name = "Event Success Prediction"
        Url = "$baseUrl/api/clubs/1/analytics/premium/event-success-prediction/1"
        Method = "GET"
    },
    @{
        Name = "Engagement Report"
        Url = "$baseUrl/api/clubs/1/analytics/premium/engagement-report"
        Method = "POST"
        Body = @{
            reportType = "comprehensive"
            startDate = (Get-Date).AddMonths(-1).ToString("yyyy-MM-ddTHH:mm:ssZ")
            endDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        } | ConvertTo-Json
    }
)

$results = @()

foreach ($test in $tests) {
    Write-Host "Testing: $($test.Name)..." -ForegroundColor Yellow

    try {
        $params = @{
            Uri = $test.Url
            Method = $test.Method
            ErrorAction = "Stop"
        }

        if ($test.Body) {
            $params.Body = $test.Body
            $params.ContentType = "application/json"
        }

        try {
            $response = Invoke-WebRequest @params
            $statusCode = $response.StatusCode
            $status = "✅ SUCCESS"
            $color = "Green"
            $details = "Status: $statusCode"
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__

            if ($statusCode -eq 401) {
                # 401 Unauthorized means endpoint exists but requires auth - GOOD!
                $status = "✅ FOUND"
                $color = "Green"
                $details = "Endpoint exists (requires auth)"
            } elseif ($statusCode -eq 403) {
                # 403 Forbidden means endpoint exists but requires specific tier - GOOD!
                $status = "✅ FOUND"
                $color = "Green"
                $details = "Endpoint exists (tier restricted)"
            } elseif ($statusCode -eq 404) {
                # 404 means endpoint doesn't exist - BAD!
                $status = "❌ MISSING"
                $color = "Red"
                $details = "Endpoint not found"
            } else {
                $status = "⚠️  UNKNOWN"
                $color = "Yellow"
                $details = "Status: $statusCode"
            }
        }

        Write-Host "  $status - $details" -ForegroundColor $color

        $results += @{
            Test = $test.Name
            Status = $status
            Details = $details
        }
    } catch {
        Write-Host "  ❌ ERROR - $($_.Exception.Message)" -ForegroundColor Red
        $results += @{
            Test = $test.Name
            Status = "❌ ERROR"
            Details = $_.Exception.Message
        }
    }

    Write-Host ""
}

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
$found = ($results | Where-Object { $_.Status -like "*FOUND*" -or $_.Status -like "*SUCCESS*" }).Count
$missing = ($results | Where-Object { $_.Status -like "*MISSING*" }).Count
$total = $results.Count

Write-Host "`nEndpoints Found: $found / $total" -ForegroundColor $(if ($found -eq $total) { "Green" } else { "Yellow" })
Write-Host "Endpoints Missing: $missing / $total" -ForegroundColor $(if ($missing -eq 0) { "Green" } else { "Red" })

if ($missing -eq 0) {
    Write-Host "`n✅ All analytics endpoints are properly registered!" -ForegroundColor Green
    Write-Host "   (They require authentication/authorization to access)" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "`n❌ Some endpoints are missing!" -ForegroundColor Red
    exit 1
}
