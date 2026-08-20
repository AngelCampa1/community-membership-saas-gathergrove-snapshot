<#
.SYNOPSIS
    Seeds the GatherGrove database with comprehensive test data via API endpoints.

.DESCRIPTION
    Creates multiple clubs across different tiers (Sprout, Grow, Unlimited) and populates
    them with realistic test data including members, events, payments, communications, etc.

    All data is created via REST API calls to ensure proper validation and business logic.

.PARAMETER ConfigPath
    Path to the JSON configuration file. Default: ./config/seed-config.json

.PARAMETER SkipRollback
    If set, does not attempt to rollback on errors. Use for debugging.

.PARAMETER Verbose
    Enable verbose logging output.

.EXAMPLE
    .\seed-database.ps1

.EXAMPLE
    .\seed-database.ps1 -ConfigPath .\config\seed-config.json -Verbose

.EXAMPLE
    .\seed-database.ps1 -SkipRollback
#>

[CmdletBinding()]
param(
    [string]$ConfigPath = ".\config\seed-config.json",
    [switch]$SkipRollback,
    [switch]$VerboseLogging
)

$ErrorActionPreference = "Stop"

#region Helper Classes

class ApiResponse {
    [int]$StatusCode
    [object]$Data
    [string]$Error
    [bool]$Success
}

class ClubData {
    [int]$Id
    [string]$Name
    [string]$Tier
    [string]$AdminEmail
    [string]$AdminPassword
    [string]$Token
    [int]$MemberCount = 0
    [int]$EventCount = 0
    [int]$LocationCount = 0
    [int]$EmailTemplateCount = 0
    [int]$PastEvents = 0
    [int]$UpcomingEvents = 0
}

#endregion

#region Logging Functions

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"

    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        default { Write-Host $logMessage -ForegroundColor Gray }
    }

    if ($script:Config.logging.enabled) {
        Add-Content -Path $script:LogFile -Value $logMessage
    }
}

#endregion

#region API Client Functions

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$MaxRetries = 3
    )

    $url = "$($script:Config.baseUrl)$Endpoint"
    $attempt = 0
    $delay = 1000

    while ($attempt -lt $MaxRetries) {
        try {
            $attempt++

            $requestParams = @{
                Uri = $url
                Method = $Method
                Headers = $Headers
                ContentType = 'application/json'
                TimeoutSec = $script:Config.apiTimeout
            }

            if ($Body) {
                $requestParams.Body = ($Body | ConvertTo-Json -Depth 10)
            }

            Write-Log "API Request: $Method $url" -Level "INFO"

            $response = Invoke-RestMethod @requestParams

            Write-Log "API Response: Success" -Level "SUCCESS"

            return [ApiResponse]@{
                StatusCode = 200
                Data = $response
                Success = $true
            }
        }
        catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            $errorMessage = $_.Exception.Message

            if ($attempt -ge $MaxRetries) {
                Write-Log "API Request failed after $MaxRetries attempts: $errorMessage" -Level "ERROR"
                return [ApiResponse]@{
                    StatusCode = $statusCode
                    Error = $errorMessage
                    Success = $false
                }
            }

            Write-Log "Attempt $attempt failed: $errorMessage. Retrying in $($delay)ms..." -Level "WARNING"
            Start-Sleep -Milliseconds $delay
            $delay *= 2
        }
    }
}

#endregion

#region Authentication Functions

function Register-ClubAdmin {
    param(
        [string]$ClubName,
        [string]$Email,
        [string]$Password
    )

    Write-Log "Registering club admin: $Email for club: $ClubName"

    $body = @{
        FullName = "Admin User - $ClubName"
        Email = $Email
        Password = $Password
        ClubName = $ClubName
    }

    $response = Invoke-ApiRequest -Method POST -Endpoint "/api/v1/auth/register" -Body $body

    if (-not $response.Success) {
        throw "Failed to register club admin: $($response.Error)"
    }

    # Extract JWT token from response
    $token = $response.Data.token
    if (-not $token) {
        # Try alternative response structure
        $token = $response.Data.accessToken
    }

    if (-not $token) {
        throw "Could not extract JWT token from response"
    }

    Write-Log "Successfully registered club: $ClubName (ID: $($response.Data.club.id))" -Level "SUCCESS"

    return @{
        Club = $response.Data.club
        User = $response.Data.user
        Token = $token
    }
}

#endregion

#region Tier Management Functions

<#
.SYNOPSIS
    Executes a SQL statement against the local PostgreSQL database.
.DESCRIPTION
    The project migrated from SQL Server to PostgreSQL (2026-02-17). This helper
    replaces the previous System.Data.SqlClient usage.

    By default it shells into the docker-compose postgres container, which needs
    no client driver installed on the host. Override with GATHERGROVE_PSQL to use
    a native psql binary instead.
#>
function Invoke-PgCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Sql
    )

    $container = if ($env:GATHERGROVE_PG_CONTAINER) { $env:GATHERGROVE_PG_CONTAINER } else { "gathergrove-postgres" }
    $database = if ($env:GATHERGROVE_PG_DATABASE) { $env:GATHERGROVE_PG_DATABASE } else { "GatherGroveDb" }
    $user = if ($env:GATHERGROVE_PG_USER) { $env:GATHERGROVE_PG_USER } else { "postgres" }

    # Pipe SQL via stdin rather than -c: the statements contain double-quoted
    # PascalCase identifiers ("Clubs"."Id") which arg-passing would strip,
    # leaving PostgreSQL to fold them to lowercase and fail.
    # ON_ERROR_STOP=1 is load-bearing: without it psql exits 0 even when a
    # statement fails, so the $LASTEXITCODE check below would never fire and a
    # failed UPDATE would look like a successful no-op.
    if ($env:GATHERGROVE_PSQL) {
        $output = $Sql | & $env:GATHERGROVE_PSQL -v ON_ERROR_STOP=1 -U $user -d $database -t 2>&1
    }
    else {
        $output = $Sql | & docker exec -i $container psql -v ON_ERROR_STOP=1 -U $user -d $database -t 2>&1
    }

    if ($LASTEXITCODE -ne 0) {
        throw "psql failed: $output"
    }

    # UPDATE returns "UPDATE <n>" - surface the affected row count
    $match = [regex]::Match([string]$output, 'UPDATE\s+(\d+)')
    if ($match.Success) { return [int]$match.Groups[1].Value }
    return 0
}

function Set-ClubTier {
    param(
        [int]$ClubId,
        [string]$Tier
    )

    Write-Log "Setting club $ClubId tier to: $Tier"

    # Map tier names to database values
    $tierMapping = @{
        "Sprout" = @{ Tier = "Sprout"; SubscriptionStatus = "Trial" }
        "Grow" = @{ Tier = "Grow"; SubscriptionStatus = "Active" }
        "Unlimited" = @{ Tier = "Unlimited"; SubscriptionStatus = "Active" }
    }

    if (-not $tierMapping.ContainsKey($Tier)) {
        Write-Log "Unknown tier: $Tier. Using Sprout defaults." -Level "WARNING"
        $Tier = "Sprout"
    }

    $tierConfig = $tierMapping[$Tier]

    try {
        $trialExpr = if ($tierConfig.Tier -eq "Sprout") { "NOW() + INTERVAL '90 days'" } else { "NULL" }
        $sql = @"
UPDATE "Clubs"
SET "Tier" = '$($tierConfig.Tier)',
    "SubscriptionStatus" = '$($tierConfig.SubscriptionStatus)',
    "TrialExpiresAt" = $trialExpr
WHERE "Id" = $ClubId;
"@

        $rowsAffected = Invoke-PgCommand -Sql $sql

        if ($rowsAffected -gt 0) {
            Write-Log "Successfully set club $ClubId to $Tier tier" -Level "SUCCESS"
        }
        else {
            Write-Log "No rows affected when setting tier for club $ClubId" -Level "WARNING"
        }
    }
    catch {
        Write-Log "Failed to set club tier: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Enable-ClubFeatures {
    param(
        [int]$ClubId,
        [string]$Tier
    )

    Write-Log "Enabling features for $Tier tier club $ClubId"

    # Chat is enabled for Grow and Unlimited tiers
    $chatEnabled = ($Tier -eq "Grow") -or ($Tier -eq "Unlimited")
    $chatValue = if ($chatEnabled) { "true" } else { "false" }

    try {
        $sql = "UPDATE `"Clubs`" SET `"IsChatEnabled`" = $chatValue WHERE `"Id`" = $ClubId;"

        $rowsAffected = Invoke-PgCommand -Sql $sql

        if ($rowsAffected -gt 0) {
            Write-Log "Successfully enabled chat for $Tier tier club $ClubId (Chat: $chatEnabled)" -Level "SUCCESS"
        }
    }
    catch {
        Write-Log "Failed to enable features: $($_.Exception.Message)" -Level "WARNING"
    }
}

#endregion

#region Data Generation Functions

function Get-RandomName {
    $firstName = $script:SampleNames.firstNames | Get-Random
    $lastName = $script:SampleNames.lastNames | Get-Random
    return "$firstName $lastName"
}

function Get-RandomEmail {
    param([string]$Name)

    $cleanName = $Name.ToLower() -replace '\s+', '.'
    return "$cleanName@test.local"
}

function Get-RandomPhoneNumber {
    $areaCode = Get-Random -Minimum 200 -Maximum 999
    $exchange = Get-Random -Minimum 200 -Maximum 999
    $number = Get-Random -Minimum 1000 -Maximum 9999
    return "$areaCode-$exchange-$number"
}

function Get-RandomDate {
    param(
        [int]$MinDaysAgo = 365,
        [int]$MaxDaysAgo = 30
    )

    $daysAgo = Get-Random -Minimum $MaxDaysAgo -Maximum $MinDaysAgo
    return (Get-Date).AddDays(-$daysAgo)
}

function Get-RandomFutureDate {
    param(
        [int]$MinDaysAhead = 1,
        [int]$MaxDaysAhead = 90
    )

    $daysAhead = Get-Random -Minimum $MinDaysAhead -Maximum $MaxDaysAhead
    return (Get-Date).AddDays($daysAhead)
}

#endregion

#region Entity Seeding Functions

function New-MembershipType {
    param(
        [int]$ClubId,
        [string]$Token,
        # ConvertFrom-Json yields PSCustomObject, not Hashtable - do not constrain
        [object]$TypeData
    )

    $headers = @{ Authorization = "Bearer $Token" }

    $body = @{
        Name = $TypeData.name
        Description = "Membership type: $($TypeData.name)"
        DuesAmount = $TypeData.duesAmount
        DuesFrequency = $TypeData.duesFrequency
        IsActive = $true
    }

    $response = Invoke-ApiRequest -Method POST -Endpoint "/api/v1/clubs/$ClubId/membership-types" -Body $body -Headers $headers

    if ($response.Success) {
        return $response.Data
    }

    throw "Failed to create membership type: $($response.Error)"
}

function New-Member {
    param(
        [int]$ClubId,
        [string]$Token,
        [int]$MembershipTypeId,
        [int]$LocationId = $null
    )

    $headers = @{ Authorization = "Bearer $Token" }

    $fullName = Get-RandomName
    $joinDate = Get-RandomDate -MinDaysAgo 730 -MaxDaysAgo 1

    $body = @{
        FullName = $fullName
        Email = Get-RandomEmail -Name $fullName
        PhoneNumber = Get-RandomPhoneNumber
        MembershipTypeId = $MembershipTypeId
        JoinDate = $joinDate.ToString("yyyy-MM-dd")
        Status = "Active"
        HasSmsConsent = (Get-Random -Maximum 10) -gt 3  # 70% have SMS consent
    }

    if ($LocationId) {
        $body.LocationId = $LocationId
    }

    $response = Invoke-ApiRequest -Method POST -Endpoint "/api/v1/clubs/$ClubId/members" -Body $body -Headers $headers

    if ($response.Success) {
        return $response.Data
    }

    throw "Failed to create member: $($response.Error)"
}

function New-Event {
    param(
        [int]$ClubId,
        [string]$Token,
        [string]$EventName,
        [datetime]$EventDateTime,
        [bool]$IsPaid = $false,
        [int]$LocationId = $null
    )

    $headers = @{ Authorization = "Bearer $Token" }

    $body = @{
        Name = $EventName
        EventDateTime = $EventDateTime.ToString("yyyy-MM-ddTHH:mm:ss")
        Location = $script:EventTemplates.locations | Get-Random
        Description = "Test event: $EventName. Join us for this exciting event!"
        MaxCapacity = Get-Random -Minimum 20 -Maximum 100
    }

    if ($LocationId) {
        $body.LocationId = $LocationId
    }

    if ($IsPaid) {
        $body.MemberPrice = [decimal](Get-Random -Minimum 10 -Maximum 50)
        $body.NonMemberPrice = $body.MemberPrice * 1.5
        $body.Currency = "USD"
    }

    $response = Invoke-ApiRequest -Method POST -Endpoint "/api/v1/clubs/$ClubId/events" -Body $body -Headers $headers

    if ($response.Success) {
        return $response.Data
    }

    throw "Failed to create event: $($response.Error)"
}

function New-Location {
    param(
        [int]$ClubId,
        [string]$Token,
        # ConvertFrom-Json yields PSCustomObject, not Hashtable - do not constrain
        [object]$LocationData
    )

    $headers = @{ Authorization = "Bearer $Token" }

    $body = @{
        LocationName = $LocationData.name
        Address = $LocationData.address
        City = $LocationData.city
        State = "NY"
        Country = "US"
        IsActive = $true
    }

    $response = Invoke-ApiRequest -Method POST -Endpoint "/api/v1/clubs/$ClubId/locations" -Body $body -Headers $headers

    if ($response.Success) {
        return $response.Data
    }

    throw "Failed to create location: $($response.Error)"
}

#endregion

#region Main Seeding Logic

function Seed-Club {
    param(
        [Parameter(Mandatory=$true)]
        $ClubConfig
    )

    Write-Log "================================================" -Level "INFO"
    Write-Log "Seeding Club: $($ClubConfig.name) (Tier: $($ClubConfig.tier))" -Level "INFO"
    Write-Log "================================================" -Level "INFO"

    $clubResult = [ClubData]::new()
    $clubResult.Name = $ClubConfig.name
    $clubResult.Tier = $ClubConfig.tier
    $clubResult.AdminEmail = $ClubConfig.adminEmail
    $clubResult.AdminPassword = $ClubConfig.adminPassword

    # Phase 1: Register club admin
    Write-Log "Phase 1: Registering club admin..."
    $registrationData = Register-ClubAdmin -ClubName $ClubConfig.name -Email $ClubConfig.adminEmail -Password $ClubConfig.adminPassword

    $clubResult.Id = $registrationData.Club.id
    $clubResult.Token = $registrationData.Token

    # Phase 1.5: Set the correct tier (registration defaults to Sprout)
    if ($ClubConfig.tier -ne "Sprout") {
        Write-Log "Phase 1.5: Upgrading club to $($ClubConfig.tier) tier..."
        Set-ClubTier -ClubId $clubResult.Id -Tier $ClubConfig.tier
        Enable-ClubFeatures -ClubId $clubResult.Id -Tier $ClubConfig.tier
    }

    # Phase 2: Create membership types
    Write-Log "Phase 2: Creating membership types..."
    $membershipTypes = @()
    foreach ($typeConfig in $ClubConfig.membershipTypes) {
        $membershipType = New-MembershipType -ClubId $clubResult.Id -Token $clubResult.Token -TypeData $typeConfig
        $membershipTypes += $membershipType
        Write-Log "  Created membership type: $($typeConfig.name)" -Level "SUCCESS"
    }

    # Phase 3: Create locations (if multi-location)
    $locations = @()
    if ($ClubConfig.locationCount -gt 1) {
        Write-Log "Phase 3: Creating locations..."
        foreach ($locationConfig in $ClubConfig.locations) {
            try {
                $location = New-Location -ClubId $clubResult.Id -Token $clubResult.Token -LocationData $locationConfig
                $locations += $location
                Write-Log "  Created location: $($locationConfig.name)" -Level "SUCCESS"
            }
            catch {
                Write-Log "  Warning: Could not create location: $($_.Exception.Message)" -Level "WARNING"
            }
        }
        $clubResult.LocationCount = $locations.Count
    }
    else {
        $clubResult.LocationCount = 1
    }

    # Phase 4: Create members
    Write-Log "Phase 4: Creating members..."
    $memberCount = Get-Random -Minimum $ClubConfig.memberCount.min -Maximum $ClubConfig.memberCount.max
    $members = @()

    for ($i = 0; $i -lt $memberCount; $i++) {
        try {
            $membershipType = $membershipTypes | Get-Random
            $locationId = if ($locations.Count -gt 0) { ($locations | Get-Random).id } else { $null }

            $member = New-Member -ClubId $clubResult.Id -Token $clubResult.Token -MembershipTypeId $membershipType.id -LocationId $locationId
            $members += $member

            if (($i + 1) % 10 -eq 0) {
                Write-Log "  Created $($i + 1)/$memberCount members..." -Level "INFO"
            }
        }
        catch {
            Write-Log "  Warning: Could not create member: $($_.Exception.Message)" -Level "WARNING"
        }
    }

    $clubResult.MemberCount = $members.Count
    Write-Log "  Total members created: $($members.Count)" -Level "SUCCESS"

    # Phase 5: Create events
    Write-Log "Phase 5: Creating events..."
    $eventCategories = $ClubConfig.eventMix.categories
    $freePercentage = $ClubConfig.eventMix.freePercentage
    $events = @()

    # Create past events
    for ($i = 0; $i -lt $ClubConfig.eventMix.past; $i++) {
        try {
            $category = $eventCategories | Get-Random
            $eventNames = $script:EventTemplates.$category
            $eventName = $eventNames | Get-Random

            $pastDate = Get-RandomDate -MinDaysAgo 90 -MaxDaysAgo 1
            $isPaid = (Get-Random -Maximum 100) -ge $freePercentage
            $locationId = if ($locations.Count -gt 0) { ($locations | Get-Random).id } else { $null }

            $event = New-Event -ClubId $clubResult.Id -Token $clubResult.Token -EventName $eventName -EventDateTime $pastDate -IsPaid $isPaid -LocationId $locationId
            $events += $event
            $clubResult.PastEvents++
        }
        catch {
            Write-Log "  Warning: Could not create past event: $($_.Exception.Message)" -Level "WARNING"
        }
    }

    # Create upcoming events
    for ($i = 0; $i -lt $ClubConfig.eventMix.upcoming; $i++) {
        try {
            $category = $eventCategories | Get-Random
            $eventNames = $script:EventTemplates.$category
            $eventName = $eventNames | Get-Random

            $futureDate = Get-RandomFutureDate -MinDaysAhead 1 -MaxDaysAhead 90
            $isPaid = (Get-Random -Maximum 100) -ge $freePercentage
            $locationId = if ($locations.Count -gt 0) { ($locations | Get-Random).id } else { $null }

            $event = New-Event -ClubId $clubResult.Id -Token $clubResult.Token -EventName $eventName -EventDateTime $futureDate -IsPaid $isPaid -LocationId $locationId
            $events += $event
            $clubResult.UpcomingEvents++
        }
        catch {
            Write-Log "  Warning: Could not create upcoming event: $($_.Exception.Message)" -Level "WARNING"
        }
    }

    $clubResult.EventCount = $events.Count
    Write-Log "  Total events created: $($events.Count) (Past: $($clubResult.PastEvents), Upcoming: $($clubResult.UpcomingEvents))" -Level "SUCCESS"

    Write-Log "Club seeding complete: $($ClubConfig.name)" -Level "SUCCESS"
    return $clubResult
}

#endregion

#region Main Execution

function Main {
    Write-Host ""
    Write-Host "+-----------------------------------------------------------+" -ForegroundColor Cyan
    Write-Host "|          GatherGrove Database Seeding Script              |" -ForegroundColor Cyan
    Write-Host "+-----------------------------------------------------------+" -ForegroundColor Cyan
    Write-Host ""

    # Load configuration
    Write-Log "Loading configuration from: $ConfigPath"

    if (-not (Test-Path $ConfigPath)) {
        Write-Log "Configuration file not found: $ConfigPath" -Level "ERROR"
        exit 1
    }

    $script:Config = Get-Content $ConfigPath | ConvertFrom-Json

    # Setup logging
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $logDir = $script:Config.logging.path
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    $script:LogFile = Join-Path $logDir "seed-$timestamp.log"

    Write-Log "GatherGrove Database Seeding - Started" -Level "INFO"
    Write-Log "Environment: $($script:Config.environment)" -Level "INFO"
    Write-Log "Base URL: $($script:Config.baseUrl)" -Level "INFO"

    # Load sample data
    Write-Log "Loading sample data..."
    $script:SampleNames = Get-Content ".\data\sample-names.json" | ConvertFrom-Json
    $script:EventTemplates = Get-Content ".\data\event-templates.json" | ConvertFrom-Json

    # Seed clubs
    $results = @{
        Clubs = @()
        StartTime = Get-Date
        TotalClubs = $script:Config.clubs.Count
        TotalMembers = 0
        TotalEvents = 0
    }

    Write-Host ""
    Write-Log "Seeding $($script:Config.clubs.Count) clubs..." -Level "INFO"
    Write-Host ""

    foreach ($clubConfig in $script:Config.clubs) {
        try {
            $clubResult = Seed-Club -ClubConfig $clubConfig
            $results.Clubs += $clubResult
            $results.TotalMembers += $clubResult.MemberCount
            $results.TotalEvents += $clubResult.EventCount
        }
        catch {
            Write-Log "Failed to seed club $($clubConfig.name): $($_.Exception.Message)" -Level "ERROR"

            if (-not $SkipRollback) {
                Write-Log "Rollback not implemented in this version" -Level "WARNING"
            }
        }
    }

    $results.EndTime = Get-Date
    $results.Duration = $results.EndTime - $results.StartTime

    # Display summary
    Write-Host ""
    Write-Host "+-----------------------------------------------------------+" -ForegroundColor Cyan
    Write-Host "|          GatherGrove Seeding Summary Report               |" -ForegroundColor Cyan
    Write-Host "+-----------------------------------------------------------+" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "CLUBS CREATED" -ForegroundColor Cyan
    Write-Host "-------------------------------------------------------------" -ForegroundColor Gray

    foreach ($club in $results.Clubs) {
        Write-Host ""
        Write-Host "  $($club.Name) (Tier: $($club.Tier))" -ForegroundColor White
        Write-Host "  +- Club ID: $($club.Id)" -ForegroundColor Gray
        Write-Host "  +- Members: $($club.MemberCount)" -ForegroundColor Gray
        Write-Host "  +- Locations: $($club.LocationCount)" -ForegroundColor Gray
        Write-Host "  +- Events: $($club.EventCount) (Past: $($club.PastEvents), Upcoming: $($club.UpcomingEvents))" -ForegroundColor Gray
        Write-Host "  +- Email Templates: $($club.EmailTemplateCount)" -ForegroundColor Gray
        Write-Host "  +- Admin: $($club.AdminEmail) / $($club.AdminPassword)" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "SUMMARY STATISTICS" -ForegroundColor Cyan
    Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "  Total Clubs:            $($results.TotalClubs)" -ForegroundColor Gray
    Write-Host "  Total Members:          $($results.TotalMembers)" -ForegroundColor Gray
    Write-Host "  Total Events:           $($results.TotalEvents)" -ForegroundColor Gray

    Write-Host ""
    Write-Host "EXECUTION DETAILS" -ForegroundColor Cyan
    Write-Host "-------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "  Start Time:             $($results.StartTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
    Write-Host "  End Time:               $($results.EndTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
    Write-Host "  Duration:               $($results.Duration.ToString('mm\:ss\.ff'))" -ForegroundColor Gray

    Write-Host ""
    Write-Host "[OK] Seeding completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Log file: $script:LogFile" -ForegroundColor Gray
    Write-Host ""
}

# Run main function
try {
    Main
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Seeding failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Stack trace:" -ForegroundColor Gray
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    exit 1
}

#endregion
