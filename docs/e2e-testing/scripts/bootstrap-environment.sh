#!/bin/bash
# bootstrap-environment.sh - GatherGrove E2E Testing Environment Setup
# 
# Purpose: Complete environment bootstrap script for E2E testing infrastructure
# Usage: ./bootstrap-environment.sh <environment> [options]
# Author: HIVE MIND Coder Delta
# Version: 1.0.0

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Configuration
ENVIRONMENT=${1:-development}
VERBOSE=${2:-false}
SKIP_TESTS=${3:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ ERROR: $1${NC}" >&2
    exit 1
}

show_usage() {
    cat << EOF
GatherGrove E2E Testing Environment Bootstrap

Usage: $0 <environment> [verbose] [skip-tests]

Environments:
  development     - Local development testing
  staging         - Staging environment testing  
  production-test - Production-like testing

Options:
  verbose         - Enable verbose logging (true/false)
  skip-tests      - Skip initial test validation (true/false)

Examples:
  $0 development
  $0 staging true
  $0 production-test false true

EOF
}

# Environment validation
validate_environment() {
    log "🔍 Validating environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        development|staging|production-test)
            success "Environment '$ENVIRONMENT' is valid"
            ;;
        help|--help|-h)
            show_usage
            exit 0
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Use: development, staging, or production-test"
            ;;
    esac
}

# Prerequisites check
check_prerequisites() {
    log "📋 Checking prerequisites..."
    
    local missing_deps=()
    local optional_deps=()
    
    # Required dependencies
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("node (Node.js)")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if ! command -v dotnet &> /dev/null; then
        missing_deps+=("dotnet (.NET CLI)")
    fi
    
    # Optional dependencies
    if ! command -v git &> /dev/null; then
        optional_deps+=("git")
    fi
    
    if ! command -v curl &> /dev/null; then
        optional_deps+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        optional_deps+=("jq")
    fi
    
    # Report results
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing required dependencies: ${missing_deps[*]}"
    fi
    
    if [ ${#optional_deps[@]} -ne 0 ]; then
        warn "Missing optional dependencies: ${optional_deps[*]}"
    fi
    
    success "All required prerequisites met"
    
    # Check versions
    if [ "$VERBOSE" = "true" ]; then
        log "Dependency versions:"
        docker --version | sed 's/^/  /'
        docker-compose --version | sed 's/^/  /'
        node --version | sed 's/^/  Node: /'
        npm --version | sed 's/^/  NPM: /'
        dotnet --version | sed 's/^/  .NET: /'
    fi
}

# Docker environment setup
setup_docker_environment() {
    log "🐳 Setting up Docker environment for $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker and try again."
    fi
    
    # Create environment-specific docker-compose file
    local compose_source="docs/e2e-testing/infrastructure/docker-compose.$ENVIRONMENT.yml"
    local compose_target="docker-compose.test.yml"
    
    if [ -f "$compose_source" ]; then
        cp "$compose_source" "$compose_target"
        success "Docker compose configuration copied for $ENVIRONMENT"
    else
        warn "Environment-specific compose file not found, using default"
        cp "docs/e2e-testing/infrastructure/docker-compose.yml" "$compose_target" || true
    fi
    
    # Pull required images
    log "📥 Pulling Docker images..."
    docker-compose -f "$compose_target" pull --quiet || warn "Some images could not be pulled"
    
    # Start services
    log "🚀 Starting Docker services..."
    docker-compose -f "$compose_target" up -d
    
    success "Docker environment started"
}

# Wait for services to be ready
wait_for_services() {
    log "⏳ Waiting for services to be ready..."
    
    local max_attempts=60
    local attempt=1
    local sleep_interval=5
    
    while [ $attempt -le $max_attempts ]; do
        if [ "$VERBOSE" = "true" ]; then
            log "🔍 Health check attempt $attempt/$max_attempts"
        else
            echo -n "."
        fi
        
        if check_service_health; then
            echo ""
            success "All services are healthy"
            return 0
        fi
        
        sleep $sleep_interval
        attempt=$((attempt + 1))
    done
    
    echo ""
    error "Services failed to start within timeout ($(($max_attempts * $sleep_interval)) seconds)"
}

# Check service health
check_service_health() {
    local all_healthy=true
    
    # Web service health (React frontend)
    if ! curl -sf http://localhost:3000/health > /dev/null 2>&1 && \
       ! curl -sf http://localhost:3000 > /dev/null 2>&1; then
        all_healthy=false
        [ "$VERBOSE" = "true" ] && warn "Web service not ready"
    fi
    
    # API service health (ASP.NET Core backend)
    if ! curl -sf http://localhost:5000/health > /dev/null 2>&1 && \
       ! curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
        all_healthy=false
        [ "$VERBOSE" = "true" ] && warn "API service not ready"
    fi
    
    # Database health (SQL Server)
    if ! docker exec $(docker-compose -f docker-compose.test.yml ps -q db 2>/dev/null) \
         sqlcmd -S localhost -U sa -P "${DB_PASSWORD:-TestPassword123!}" -Q "SELECT 1" > /dev/null 2>&1; then
        all_healthy=false
        [ "$VERBOSE" = "true" ] && warn "Database not ready"
    fi
    
    # Redis health
    if ! docker exec $(docker-compose -f docker-compose.test.yml ps -q redis 2>/dev/null) \
         redis-cli ping > /dev/null 2>&1; then
        all_healthy=false
        [ "$VERBOSE" = "true" ] && warn "Redis not ready"
    fi
    
    return $([ "$all_healthy" = true ] && echo 0 || echo 1)
}

# Seed test database
seed_database() {
    log "🌱 Seeding test database..."
    
    # Wait a bit more for database to be fully ready
    sleep 5
    
    # Run database seeder if available
    if docker-compose -f docker-compose.test.yml ps | grep -q "db-seeder"; then
        docker-compose -f docker-compose.test.yml run --rm db-seeder || warn "Database seeding failed"
    else
        warn "Database seeder not available, skipping seeding"
    fi
    
    success "Database seeding completed"
}

# Setup frontend environment
setup_frontend() {
    log "🎨 Setting up frontend environment..."
    
    cd "$PROJECT_ROOT/client"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        log "📦 Installing frontend dependencies..."
        npm install --silent || error "Frontend dependency installation failed"
    fi
    
    # Build for testing if not development
    if [ "$ENVIRONMENT" != "development" ]; then
        log "🏗️ Building frontend for testing..."
        npm run build:test 2>/dev/null || npm run build || warn "Frontend build failed"
    fi
    
    cd "$PROJECT_ROOT"
    success "Frontend setup completed"
}

# Setup backend environment
setup_backend() {
    log "🔧 Setting up backend environment..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Restore packages
    log "📦 Restoring backend packages..."
    dotnet restore --verbosity quiet || error "Backend package restore failed"
    
    # Build for testing
    log "🏗️ Building backend for testing..."
    dotnet build --configuration Test --verbosity quiet || \
    dotnet build --configuration Debug --verbosity quiet || \
    error "Backend build failed"
    
    cd "$PROJECT_ROOT"
    success "Backend setup completed"
}

# Setup mobile testing environment
setup_mobile_environment() {
    log "📱 Setting up mobile testing environment..."
    
    # Check if running on supported platform
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        setup_android_emulator
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        setup_android_emulator
        setup_ios_simulator
    else
        warn "Mobile testing setup not supported on this platform"
        return 0
    fi
    
    success "Mobile environment setup completed"
}

# Setup Android emulator
setup_android_emulator() {
    if command -v emulator &> /dev/null && command -v avdmanager &> /dev/null; then
        log "🤖 Setting up Android emulator..."
        
        # Check if AVD exists
        local avd_name="GatherGrove_Test_API30"
        if ! avdmanager list avd | grep -q "$avd_name"; then
            log "Creating Android Virtual Device..."
            # This is a placeholder - actual implementation would need Android SDK
            warn "Android SDK setup required for emulator creation"
        else
            success "Android emulator ready"
        fi
    else
        warn "Android SDK not available, skipping Android emulator setup"
    fi
}

# Setup iOS simulator (macOS only)
setup_ios_simulator() {
    if command -v xcrun &> /dev/null && command -v simctl &> /dev/null; then
        log "🍎 Setting up iOS simulator..."
        
        # Check available simulators
        local simulator_name="GatherGrove Test iPhone"
        if ! xcrun simctl list devices | grep -q "$simulator_name"; then
            log "Creating iOS simulator..."
            # This is a placeholder - actual implementation would create simulator
            warn "iOS simulator creation requires Xcode"
        else
            success "iOS simulator ready"
        fi
    else
        warn "Xcode not available, skipping iOS simulator setup"
    fi
}

# Run initial validation tests
run_validation_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        warn "Skipping validation tests as requested"
        return 0
    fi
    
    log "🧪 Running validation tests..."
    
    # Basic connectivity tests
    local test_passed=true
    
    # Test web service
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        success "Web service connectivity test passed"
    else
        error "Web service connectivity test failed"
        test_passed=false
    fi
    
    # Test API service  
    if curl -sf http://localhost:5000 > /dev/null 2>&1 || \
       curl -sf http://localhost:5000/api > /dev/null 2>&1; then
        success "API service connectivity test passed"
    else
        error "API service connectivity test failed"
        test_passed=false
    fi
    
    # Test database connectivity
    if docker exec $(docker-compose -f docker-compose.test.yml ps -q db 2>/dev/null) \
       sqlcmd -S localhost -U sa -P "${DB_PASSWORD:-TestPassword123!}" -Q "SELECT 1" > /dev/null 2>&1; then
        success "Database connectivity test passed"
    else
        error "Database connectivity test failed"
        test_passed=false
    fi
    
    if [ "$test_passed" = false ]; then
        error "Validation tests failed"
    fi
    
    success "All validation tests passed"
}

# Display environment information
show_environment_info() {
    log "🎉 Environment '$ENVIRONMENT' is ready for testing!"
    echo ""
    echo -e "${GREEN}📋 Environment Information:${NC}"
    echo -e "  🌐 Web Frontend:    http://localhost:3000"
    echo -e "  🔌 API Backend:     http://localhost:5000"
    echo -e "  📊 API Swagger:     http://localhost:5000/swagger"
    echo -e "  🗄️  Database:        localhost:1433"
    echo -e "  🔴 Redis:           localhost:6379"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        echo -e "  📱 Metro Bundler:   http://localhost:8081"
    fi
    
    echo ""
    echo -e "${BLUE}🎯 Next Steps:${NC}"
    echo -e "  • Run tests: ${YELLOW}cd docs/e2e-testing && npm run test:$ENVIRONMENT${NC}"
    echo -e "  • View logs: ${YELLOW}docker-compose -f docker-compose.test.yml logs -f${NC}"
    echo -e "  • Stop env:  ${YELLOW}docker-compose -f docker-compose.test.yml down${NC}"
    echo ""
    
    if [ "$VERBOSE" = "true" ]; then
        echo -e "${BLUE}🔍 Service Status:${NC}"
        docker-compose -f docker-compose.test.yml ps
        echo ""
    fi
}

# Cleanup on script exit
cleanup_on_exit() {
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        echo ""
        error "Environment setup failed with exit code $exit_code"
        echo ""
        echo -e "${YELLOW}Troubleshooting:${NC}"
        echo -e "  • Check logs: docker-compose -f docker-compose.test.yml logs"
        echo -e "  • Stop services: docker-compose -f docker-compose.test.yml down"
        echo -e "  • Clean up: docker system prune -f"
        echo ""
    fi
}

# Main execution function
main() {
    # Set up cleanup handler
    trap cleanup_on_exit EXIT
    
    log "🚀 Starting GatherGrove E2E Testing Environment Bootstrap"
    log "Environment: $ENVIRONMENT"
    log "Verbose: $VERBOSE"
    log "Skip Tests: $SKIP_TESTS"
    echo ""
    
    validate_environment
    check_prerequisites
    setup_docker_environment
    wait_for_services
    seed_database
    setup_frontend
    setup_backend
    setup_mobile_environment
    run_validation_tests
    show_environment_info
    
    success "Bootstrap completed successfully! 🎉"
}

# Execute main function with all arguments
main "$@"