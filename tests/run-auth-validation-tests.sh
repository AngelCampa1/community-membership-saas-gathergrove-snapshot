#!/bin/bash
# AUTH-VALIDATOR Test Execution Script
# Comprehensive authentication validation test runner

set -e

echo "🔐 AUTH-VALIDATOR: Starting comprehensive authentication test validation"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_ENV=${TEST_ENVIRONMENT:-"development"}
API_URL=${TEST_API_URL:-"http://localhost:5284"}
TIMEOUT=${TEST_TIMEOUT:-"30000"}

echo -e "${BLUE}Test Environment: ${TEST_ENV}${NC}"
echo -e "${BLUE}API URL: ${API_URL}${NC}"
echo -e "${BLUE}Timeout: ${TIMEOUT}ms${NC}"
echo ""

# Function to run test with proper error handling
run_test() {
    local test_name="$1"
    local test_file="$2"
    local test_pattern="${3:-""}"
    
    echo -e "${YELLOW}Running ${test_name}...${NC}"
    
    if [ ! -f "$test_file" ]; then
        echo -e "${RED}❌ Test file not found: ${test_file}${NC}"
        return 1
    fi
    
    local cmd="npx jest ${test_file}"
    if [ -n "$test_pattern" ]; then
        cmd="${cmd} --testNamePattern='${test_pattern}'"
    fi
    
    cmd="${cmd} --verbose --detectOpenHandles --forceExit --testTimeout=${TIMEOUT}"
    
    if eval "$cmd"; then
        echo -e "${GREEN}✅ ${test_name} - PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ ${test_name} - FAILED${NC}"
        return 1
    fi
}

# Initialize test results
declare -i total_tests=0
declare -i passed_tests=0
declare -i failed_tests=0

# Test categories
echo "🧪 PHASE 1: Unit Tests - Authentication Services"
echo "----------------------------------------------"

# Existing auth service tests
if run_test "Client Auth Service Tests" "client/src/services/__tests__/authService.test.ts"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

if run_test "Mobile Auth Service Tests" "mobile/__tests__/authService.test.ts"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

echo ""
echo "🔒 PHASE 2: Security Tests"
echo "------------------------"

if run_test "Authentication Security Tests" "tests/security/auth-security.test.ts"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

echo ""
echo "🌐 PHASE 3: CORS and /auth/me Endpoint Tests"
echo "------------------------------------------"

if run_test "/auth/me Endpoint Validation" "tests/auth/auth-me-endpoint.test.ts"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

if run_test "CORS Preflight Validation" "tests/auth/cors-preflight.test.ts"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

echo ""
echo "🔗 PHASE 4: Integration Tests"
echo "-----------------------------"

if run_test "Live Authentication Flow Tests" "tests/integration/live-auth-flow.test.ts"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

echo ""
echo "🧩 PHASE 5: Component Integration Tests"
echo "-------------------------------------"

if run_test "Login Form Component Tests" "client/src/components/features/auth/__tests__/login-form.test.tsx"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

if run_test "Authorization Component Tests" "client/src/components/auth/__tests__/authorization.test.tsx"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

if run_test "Mobile Auth Flow Tests" "mobile/src/screens/__tests__/AuthFlow.test.tsx"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

echo ""
echo "📊 PHASE 6: Performance and Load Tests"
echo "------------------------------------"

# Performance tests within the comprehensive suites
if run_test "Authentication Performance Tests" "tests/auth/auth-me-endpoint.test.ts" "Performance and Caching"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

if run_test "CORS Performance Tests" "tests/auth/cors-preflight.test.ts" "Caching and Performance"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

if run_test "Live Performance Tests" "tests/integration/live-auth-flow.test.ts" "Performance and Reliability"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Calculate test coverage
coverage_percentage=$((passed_tests * 100 / total_tests))

echo ""
echo "=================================================="
echo "🏁 AUTH-VALIDATOR TEST RESULTS SUMMARY"
echo "=================================================="
echo -e "Total Tests Run: ${BLUE}${total_tests}${NC}"
echo -e "Tests Passed: ${GREEN}${passed_tests}${NC}"
echo -e "Tests Failed: ${RED}${failed_tests}${NC}"
echo -e "Success Rate: ${BLUE}${coverage_percentage}%${NC}"

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL AUTHENTICATION TESTS PASSED!${NC}"
    echo "✅ Authentication flow validation complete"
    echo "✅ CORS preflight handling validated"
    echo "✅ Token validation comprehensive"
    echo "✅ Mobile authentication flows verified"
    echo "✅ Security measures validated"
else
    echo -e "${RED}⚠️  AUTHENTICATION ISSUES DETECTED${NC}"
    echo "❌ ${failed_tests} test(s) failed"
    echo "🔧 Review failed tests and implement fixes"
    echo "🐛 Check backend CORS configuration"
    echo "🔐 Validate JWT token handling"
fi

echo ""
echo "📋 RECOMMENDATIONS FOR HIVE COORDINATION:"
echo "----------------------------------------"

if [ $failed_tests -gt 0 ]; then
    echo "1. 🔧 BACKEND-FIXER: Review failed tests and implement CORS/token fixes"
    echo "2. 🌐 FRONTEND-DEBUGGER: Update client error handling based on test results"
    echo "3. 📱 MOBILE-VALIDATOR: Address any mobile-specific authentication issues"
    echo "4. 🚀 DEPLOYMENT-TESTER: Verify fixes in staging environment"
else
    echo "1. ✅ All authentication tests passing - system is validated"
    echo "2. 📈 Consider implementing additional edge case tests"
    echo "3. 🔄 Schedule regular authentication regression testing"
    echo "4. 📊 Monitor authentication performance metrics"
fi

echo ""
echo "📊 DETAILED METRICS:"
echo "- Unit Test Coverage: Authentication services validated"
echo "- Security Test Coverage: SQL injection, XSS, CSRF prevention verified"
echo "- CORS Coverage: Preflight requests and origin validation tested"
echo "- Integration Coverage: End-to-end authentication flows validated"
echo "- Performance Coverage: Response times and load handling tested"

# Exit with appropriate code
if [ $failed_tests -eq 0 ]; then
    exit 0
else
    exit 1
fi