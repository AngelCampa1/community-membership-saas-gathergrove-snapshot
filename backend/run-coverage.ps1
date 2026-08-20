# GatherGrove Backend - Test Coverage Script
# This script runs all tests with code coverage and generates an HTML report

Write-Host "Running Backend Test Coverage..." -ForegroundColor Cyan

# Clean up previous coverage results
Write-Host "Cleaning up previous coverage results..." -ForegroundColor Yellow
if (Test-Path "TestResults") {
    Remove-Item "TestResults" -Recurse -Force
}

# Run tests with coverage collection using coverlet exclusions
Write-Host "Running tests with code coverage collection (excluding migrations)..." -ForegroundColor Green
dotnet test --collect:"XPlat Code Coverage" --results-directory:"TestResults" -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Exclude="[*]*Migrations*,[*]*Migration*,[*]*ModelSnapshot*"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failed! Coverage report not generated." -ForegroundColor Red
    exit $LASTEXITCODE
}

# Check if coverage files were generated
$coverageFiles = Get-ChildItem -Path "TestResults" -Filter "*.cobertura.xml" -Recurse
if ($coverageFiles.Count -eq 0) {
    Write-Host "No coverage files found in TestResults directory." -ForegroundColor Red
    Write-Host "Directory contents:" -ForegroundColor Yellow
    Get-ChildItem -Path "TestResults" -Recurse | ForEach-Object { Write-Host "  $($_.FullName)" }
    exit 1
}

Write-Host "Found $($coverageFiles.Count) coverage file(s):" -ForegroundColor Yellow
$coverageFiles | ForEach-Object { Write-Host "  $($_.FullName)" -ForegroundColor Gray }

# Generate HTML coverage report with exclusions in ReportGenerator
Write-Host "Generating HTML coverage report..." -ForegroundColor Green

reportgenerator -reports:"TestResults\*\*.cobertura.xml" -targetdir:"TestResults\Coverage" -reporttypes:"Html;Cobertura" -title:"GatherGrove Backend Coverage Report (Excluding Migrations)" -classfilters:"-*Migrations*;-*Migration*;-*ModelSnapshot*"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Coverage report generated successfully!" -ForegroundColor Green
    Write-Host "Open the report: TestResults\Coverage\index.html" -ForegroundColor Cyan
    
    # Display summary
    $indexPath = "TestResults\Coverage\index.html"
    if (Test-Path $indexPath) {
        Write-Host "Coverage report is ready! You can:" -ForegroundColor Green
        Write-Host "  - Open in browser: start $indexPath" -ForegroundColor Cyan
        Write-Host "  - View in VS Code: code $indexPath" -ForegroundColor Cyan
        Write-Host "" -ForegroundColor Gray
        Write-Host "Note: Database migrations and generated files are excluded from coverage." -ForegroundColor Gray
    }
} else {
    Write-Host "Failed to generate coverage report." -ForegroundColor Red
    exit $LASTEXITCODE
} 