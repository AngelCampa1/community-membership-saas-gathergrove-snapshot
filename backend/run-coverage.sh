#!/bin/bash

# GatherGrove Backend - Test Coverage Script
# This script runs all tests with code coverage and generates an HTML report

echo "Running Backend Test Coverage..."

# Clean up previous coverage results
echo "Cleaning up previous coverage results..."
rm -rf TestResults

# Run tests with coverage collection using runsettings to exclude migrations
echo "Running tests with code coverage collection (excluding migrations)..."
dotnet test --collect:"XPlat Code Coverage" --results-directory:"TestResults" --settings:"coverlet.runsettings"

if [ $? -ne 0 ]; then
    echo "Tests failed! Coverage report not generated."
    exit 1
fi

# Generate HTML coverage report
echo "Generating HTML coverage report..."
reportgenerator \
    -reports:"TestResults/*/coverage.cobertura.xml" \
    -targetdir:"TestResults/Coverage" \
    -reporttypes:"Html;Cobertura" \
    -title:"GatherGrove Backend Coverage Report (Excluding Migrations)"

if [ $? -eq 0 ]; then
    echo "Coverage report generated successfully!"
    echo "Open the report: TestResults/Coverage/index.html"
    echo ""
    echo "Note: Database migrations and generated files are excluded from coverage."
else
    echo "Failed to generate coverage report."
    exit 1
fi 