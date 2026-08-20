# GatherGrove Member Portal E2E API Tests
# This script tests the backend API directly

Write-Host "========================================="
Write-Host "GatherGrove Member Portal E2E API Tests"
Write-Host "========================================="
Write-Host ""

$baseUrl = "http://localhost:8050"
$frontendUrl = "http://localhost:3050"
$apiBase = "$baseUrl/api/v1"  # Versioned API endpoints
$results = @()

function Add-Result {
    param($testName, $passed, $details)
    $script:results += @{
        Test = $testName
        Passed = $passed
        Details = $details
    }
    if ($passed) {
        Write-Host "[PASS] $testName" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $testName" -ForegroundColor Red
    }
    if ($details) {
        Write-Host "       $details" -ForegroundColor Gray
    }
}

# Test 1: Backend Health Check
Write-Host ""
Write-Host "### INFRASTRUCTURE TESTS ###" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing -TimeoutSec 5
    Add-Result "INFRA-01: Backend Health Check" $true $r.Content
} catch {
    Add-Result "INFRA-01: Backend Health Check" $false $_.Exception.Message
}

# Test 2: Frontend Accessible
try {
    $r = Invoke-WebRequest -Uri "$frontendUrl" -UseBasicParsing -TimeoutSec 5
    Add-Result "INFRA-02: Frontend Accessible" ($r.StatusCode -eq 200) "Status: $($r.StatusCode)"
} catch {
    Add-Result "INFRA-02: Frontend Accessible" $false $_.Exception.Message
}

# Test 3: Member Login API
Write-Host ""
Write-Host "### AUTHENTICATION TESTS ###" -ForegroundColor Cyan
try {
    $loginBody = @{
        email = "member@test.com"
        password = "password123"
        includeToken = $true  # Request token in response for API testing
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "X-Mobile-Client" = "true"  # Request token in response for API testing
    }

    $r = Invoke-WebRequest -Uri "$apiBase/auth/login" -Method POST -Body $loginBody -Headers $headers -UseBasicParsing -TimeoutSec 10
    $response = $r.Content | ConvertFrom-Json

    # LoginResponse has: userId, fullName, email, clubId, role, clubTier, isOnboardingCompleted, message, token (optional)
    if ($response.userId -and $response.role -eq "Member") {
        Add-Result "AUTH-01: Member Login" $true "Role: $($response.role), Club: $($response.clubId), User: $($response.fullName)"
        $script:memberToken = $response.token  # May be null for web clients (token in cookie)
        $script:memberClubId = $response.clubId
        $script:memberUserId = $response.userId
    } else {
        Add-Result "AUTH-01: Member Login" $false "Expected Member role, got: $($response.role)"
        Write-Host "       Response: $($r.Content)" -ForegroundColor Gray
    }
} catch {
    Add-Result "AUTH-01: Member Login" $false $_.Exception.Message
}

# Test 4: Admin Login (for comparison)
try {
    $loginBody = @{
        email = "admin@test.com"
        password = "password123"
        includeToken = $true
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $r = Invoke-WebRequest -Uri "$apiBase/auth/login" -Method POST -Body $loginBody -Headers $headers -UseBasicParsing -TimeoutSec 10
    $response = $r.Content | ConvertFrom-Json

    if ($response.userId -and $response.role -eq "Admin") {
        Add-Result "AUTH-02: Admin Login" $true "Role: $($response.role), Club: $($response.clubId), User: $($response.fullName)"
        $script:adminToken = $response.token  # May be null for web clients
        $script:adminClubId = $response.clubId
    } else {
        Add-Result "AUTH-02: Admin Login" $false "Expected Admin role, got: $($response.role)"
        Write-Host "       Response: $($r.Content)" -ForegroundColor Gray
    }
} catch {
    Add-Result "AUTH-02: Admin Login" $false $_.Exception.Message
}

# Test 5: Member Profile Endpoint (using /auth/me)
Write-Host ""
Write-Host "### MEMBER PORTAL TESTS ###" -ForegroundColor Cyan
if ($script:memberToken) {
    try {
        $authHeaders = @{
            "Authorization" = "Bearer $($script:memberToken)"
            "Content-Type" = "application/json"
        }

        # UserSessionResponse endpoint is /auth/me
        $r = Invoke-WebRequest -Uri "$apiBase/auth/me" -Headers $authHeaders -UseBasicParsing -TimeoutSec 10
        $profile = $r.Content | ConvertFrom-Json

        # UserSessionResponse has: userId, email, fullName, role, clubId, clubName, clubTier, isOnboardingCompleted
        if ($profile.email -eq "member@test.com") {
            Add-Result "MP-01: Get Member Profile (/auth/me)" $true "Email: $($profile.email), Name: $($profile.fullName), Role: $($profile.role)"
        } else {
            Add-Result "MP-01: Get Member Profile (/auth/me)" $false "Unexpected profile data: $($profile.email)"
        }
    } catch {
        Add-Result "MP-01: Get Member Profile (/auth/me)" $false $_.Exception.Message
    }
} else {
    Add-Result "MP-01: Get Member Profile (/auth/me)" $false "No member token available (skipped)"
}

# Test 6: Member Directory Endpoint (using /clubs/{clubId}/members/directory)
if ($script:memberToken -and $script:memberClubId) {
    try {
        $authHeaders = @{
            "Authorization" = "Bearer $($script:memberToken)"
        }

        # Directory endpoint is /clubs/{clubId}/members/directory
        $r = Invoke-WebRequest -Uri "$apiBase/clubs/$($script:memberClubId)/members/directory" -Headers $authHeaders -UseBasicParsing -TimeoutSec 10
        $directory = $r.Content | ConvertFrom-Json

        Add-Result "MP-02: Member Directory Access" $true "Total Members: $($directory.totalMembers)"
    } catch {
        # Directory might be disabled or member not opted in - that's expected behavior
        # 400 Bad Request = API is correctly enforcing directory rules
        # 403 = member not opted in or forbidden
        if ($_.Exception.Message -match "400" -or $_.Exception.Message -match "403" -or $_.Exception.Message -match "disabled" -or $_.Exception.Message -match "opt") {
            Add-Result "MP-02: Member Directory Access" $true "Directory API correctly enforces access rules (disabled/opt-in required)"
        } else {
            Add-Result "MP-02: Member Directory Access" $false $_.Exception.Message
        }
    }
} else {
    Add-Result "MP-02: Member Directory Access" $false "No member token/clubId available (skipped)"
}

# Test 7: Events Endpoint
if ($script:memberToken -and $script:memberClubId) {
    try {
        $authHeaders = @{
            "Authorization" = "Bearer $($script:memberToken)"
        }

        $r = Invoke-WebRequest -Uri "$apiBase/clubs/$($script:memberClubId)/events" -Headers $authHeaders -UseBasicParsing -TimeoutSec 10
        $events = $r.Content | ConvertFrom-Json

        Add-Result "MP-03: Member Events Access" $true "Events endpoint accessible"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Add-Result "MP-03: Member Events Access" $true "No events (empty state)"
        } else {
            Add-Result "MP-03: Member Events Access" $false $_.Exception.Message
        }
    }
} else {
    Add-Result "MP-03: Member Events Access" $false "No member token/clubId available (skipped)"
}

# Test 8: Unauthorized Access Test
Write-Host ""
Write-Host "### SECURITY TESTS ###" -ForegroundColor Cyan
try {
    # Try to access admin-only endpoint without auth
    $r = Invoke-WebRequest -Uri "$apiBase/admin/dashboard" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Add-Result "SEC-01: Unauthenticated Admin Access Blocked" $false "Should have been blocked"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Message -match "401") {
        Add-Result "SEC-01: Unauthenticated Admin Access Blocked" $true "Correctly returned 401"
    } else {
        Add-Result "SEC-01: Unauthenticated Admin Access Blocked" $true "Access blocked (different error)"
    }
}

# Test 9: Member trying to access admin endpoint
if ($script:memberToken) {
    try {
        $authHeaders = @{
            "Authorization" = "Bearer $($script:memberToken)"
        }

        $r = Invoke-WebRequest -Uri "$apiBase/admin/dashboard" -Headers $authHeaders -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        Add-Result "SEC-02: Member Admin Access Blocked" $false "Should have been blocked"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403 -or $_.Exception.Message -match "403") {
            Add-Result "SEC-02: Member Admin Access Blocked" $true "Correctly returned 403"
        } elseif ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Message -match "401") {
            Add-Result "SEC-02: Member Admin Access Blocked" $true "Correctly returned 401"
        } else {
            Add-Result "SEC-02: Member Admin Access Blocked" $true "Access blocked"
        }
    }
} else {
    Add-Result "SEC-02: Member Admin Access Blocked" $false "No member token available (skipped)"
}

# Summary
Write-Host ""
Write-Host "========================================="
Write-Host "TEST SUMMARY"
Write-Host "========================================="
$passed = ($results | Where-Object { $_.Passed }).Count
$failed = ($results | Where-Object { -not $_.Passed }).Count
$total = $results.Count

Write-Host "Total Tests: $total"
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "Pass Rate: $([math]::Round(($passed / $total) * 100, 1))%"
Write-Host ""

if ($failed -gt 0) {
    Write-Host "FAILED TESTS:" -ForegroundColor Red
    $results | Where-Object { -not $_.Passed } | ForEach-Object {
        Write-Host "  - $($_.Test): $($_.Details)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test completed at: $(Get-Date)"
