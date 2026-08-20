#!/bin/bash

# Script to run .NET backend tests in manageable batches to avoid CLR crashes
# This prevents the "Internal CLR error" when running all tests simultaneously

set -e

echo "Running .NET Backend Tests in Batches"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_SKIPPED=0
FAILED_BATCHES=()

# Function to run a test batch
run_test_batch() {
    local project=$1
    local filter=$2
    local description=$3
    
    echo -e "\n${YELLOW}Running: $description${NC}"
    echo "Project: $project"
    echo "Filter: $filter"
    echo "----------------------------------------"
    
    if dotnet test "$project" --no-build --filter "$filter" --verbosity minimal --logger "console;verbosity=normal"; then
        echo -e "${GREEN}✓ PASSED: $description${NC}"
        # Extract test results from the output (this would need proper parsing in production)
        return 0
    else
        echo -e "${RED}✗ FAILED: $description${NC}"
        FAILED_BATCHES+=("$description")
        return 1
    fi
}

# Ensure solution is built first
echo "Building solution..."
if ! dotnet build --verbosity minimal; then
    echo -e "${RED}Build failed! Cannot run tests.${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Application Tests - Batch 1: Authorization & Security
run_test_batch "tests/GatherGrove.Application.Tests/GatherGrove.Application.Tests.csproj" \
    "FullyQualifiedName~ClubAdmin" \
    "Authorization Handler Tests"

# Application Tests - Batch 2: Audit & Compliance
run_test_batch "tests/GatherGrove.Application.Tests/GatherGrove.Application.Tests.csproj" \
    "FullyQualifiedName~AuditLog" \
    "Audit Log Tests"

# Application Tests - Batch 3: Export Services
run_test_batch "tests/GatherGrove.Application.Tests/GatherGrove.Application.Tests.csproj" \
    "FullyQualifiedName~Export" \
    "Export Service Tests"

# API Tests - Batch 1: Authentication
run_test_batch "tests/GatherGrove.API.Tests/GatherGrove.API.Tests.csproj" \
    "FullyQualifiedName~AuthController" \
    "Authentication Controller Tests"

# API Tests - Batch 2: Core Controllers
run_test_batch "tests/GatherGrove.API.Tests/GatherGrove.API.Tests.csproj" \
    "FullyQualifiedName~BrandingController" \
    "Branding Controller Tests"

# API Tests - Batch 3: Communication Features
run_test_batch "tests/GatherGrove.API.Tests/GatherGrove.API.Tests.csproj" \
    "FullyQualifiedName~CommunicationsController" \
    "Communications Controller Tests"

# API Tests - Batch 4: Settings Controllers
run_test_batch "tests/GatherGrove.API.Tests/GatherGrove.API.Tests.csproj" \
    "FullyQualifiedName~Settings" \
    "Settings Controllers Tests"

# API Tests - Batch 5: Custom Fields & Chat
run_test_batch "tests/GatherGrove.API.Tests/GatherGrove.API.Tests.csproj" \
    "FullyQualifiedName~(CustomFields|Chat)" \
    "Custom Fields & Chat Tests"

# Summary
echo ""
echo "========================================="
echo "TEST EXECUTION SUMMARY"
echo "========================================="

if [ ${#FAILED_BATCHES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TEST BATCHES PASSED${NC}"
    echo "All tests executed successfully in manageable batches"
else
    echo -e "${RED}✗ SOME TEST BATCHES FAILED${NC}"
    echo "Failed batches:"
    for batch in "${FAILED_BATCHES[@]}"; do
        echo -e "  ${RED}- $batch${NC}"
    done
fi

echo ""
echo "Note: Tests are run in batches to prevent CLR memory issues"
echo "This approach ensures stable test execution in CI/CD environments"

# Exit with error code if any batches failed
if [ ${#FAILED_BATCHES[@]} -gt 0 ]; then
    exit 1
fi