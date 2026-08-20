#!/bin/bash

# MOBILE TEST GUARDIAN - Continuous Protection System
# Ensures 271/271 test success rate is NEVER compromised

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GOLDEN_BASELINE=277

echo "🛡️ MOBILE TEST GUARDIAN: Protecting 277/277 success rate..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to run mobile test monitor
run_monitor() {
    log "Running mobile test monitor..."
    node "$SCRIPT_DIR/mobile-test-monitor.js"
    return $?
}

# Function to create backup of critical files
backup_critical_files() {
    local backup_dir="$PROJECT_DIR/.mobile-backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    log "Creating backup of critical test infrastructure..."
    
    # Backup jest configuration files
    cp "$PROJECT_DIR/jest.config.js" "$backup_dir/" 2>/dev/null || true
    cp "$PROJECT_DIR/jest-rn-window-fix.js" "$backup_dir/" 2>/dev/null || true
    cp "$PROJECT_DIR/jest.mobile-mocks.js" "$backup_dir/" 2>/dev/null || true
    cp "$PROJECT_DIR/jest.testing-library-setup.js" "$backup_dir/" 2>/dev/null || true
    cp "$PROJECT_DIR/package.json" "$backup_dir/" 2>/dev/null || true
    
    # Backup mock files
    cp -r "$PROJECT_DIR/__mocks__" "$backup_dir/" 2>/dev/null || true
    
    success "Backup created: $backup_dir"
    echo "$backup_dir" > "$PROJECT_DIR/.mobile-backups/latest"
}

# Function to restore from backup
restore_from_backup() {
    local backup_path="$1"
    
    if [ -z "$backup_path" ]; then
        if [ -f "$PROJECT_DIR/.mobile-backups/latest" ]; then
            backup_path=$(cat "$PROJECT_DIR/.mobile-backups/latest")
        else
            error "No backup path specified and no latest backup found"
            return 1
        fi
    fi
    
    if [ ! -d "$backup_path" ]; then
        error "Backup directory not found: $backup_path"
        return 1
    fi
    
    warning "Restoring from backup: $backup_path"
    
    # Restore files
    cp "$backup_path/jest.config.js" "$PROJECT_DIR/" 2>/dev/null || true
    cp "$backup_path/jest-rn-window-fix.js" "$PROJECT_DIR/" 2>/dev/null || true
    cp "$backup_path/jest.mobile-mocks.js" "$PROJECT_DIR/" 2>/dev/null || true
    cp "$backup_path/jest.testing-library-setup.js" "$PROJECT_DIR/" 2>/dev/null || true
    cp "$backup_path/package.json" "$PROJECT_DIR/" 2>/dev/null || true
    
    # Restore mocks
    if [ -d "$backup_path/__mocks__" ]; then
        rm -rf "$PROJECT_DIR/__mocks__"
        cp -r "$backup_path/__mocks__" "$PROJECT_DIR/"
    fi
    
    success "Restoration complete"
}

# Function to validate test count
validate_test_count() {
    log "Validating test count..."
    
    local output=$(npm run test 2>&1)
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        error "Tests failed to run!"
        return 1
    fi
    
    # Extract test count
    local test_count=$(echo "$output" | grep -E "Tests:\s+[0-9]+\s+passed,\s+[0-9]+\s+total" | sed -E 's/.*Tests:\s+[0-9]+\s+passed,\s+([0-9]+)\s+total.*/\1/')
    local passed_count=$(echo "$output" | grep -E "Tests:\s+[0-9]+\s+passed,\s+[0-9]+\s+total" | sed -E 's/.*Tests:\s+([0-9]+)\s+passed,\s+[0-9]+\s+total.*/\1/')
    
    if [ "$test_count" = "$GOLDEN_BASELINE" ] && [ "$passed_count" = "$GOLDEN_BASELINE" ]; then
        success "✅ PERFECT: $passed_count/$test_count tests passing (baseline: $GOLDEN_BASELINE)"
        return 0
    else
        error "❌ REGRESSION DETECTED: $passed_count/$test_count tests (expected: $GOLDEN_BASELINE/$GOLDEN_BASELINE)"
        return 1
    fi
}

# Function to run continuous monitoring
continuous_monitor() {
    log "Starting continuous mobile test monitoring..."
    
    local check_interval=${1:-30}
    local failure_count=0
    local max_failures=3
    
    while true; do
        log "Checking test status..."
        
        if run_monitor; then
            success "Mobile tests maintaining 271/271 success rate ✅"
            failure_count=0
        else
            failure_count=$((failure_count + 1))
            error "Mobile test validation failed (attempt $failure_count/$max_failures)"
            
            if [ $failure_count -ge $max_failures ]; then
                error "CRITICAL: Multiple consecutive failures detected!"
                error "Mobile test infrastructure may be compromised"
                
                # Create emergency backup
                backup_critical_files
                
                # Attempt auto-recovery
                warning "Attempting auto-recovery..."
                restore_from_backup
                
                if run_monitor; then
                    success "Auto-recovery successful!"
                    failure_count=0
                else
                    error "Auto-recovery failed. Manual intervention required."
                    exit 1
                fi
            fi
        fi
        
        log "Waiting $check_interval seconds before next check..."
        sleep $check_interval
    done
}

# Function to setup git hooks
setup_git_hooks() {
    local hooks_dir="$PROJECT_DIR/.git/hooks"
    
    if [ ! -d "$hooks_dir" ]; then
        warning "Git hooks directory not found. Skipping git hook setup."
        return 0
    fi
    
    log "Setting up git hooks for mobile test protection..."
    
    # Pre-commit hook
    cat > "$hooks_dir/pre-commit" << 'EOF'
#!/bin/bash
echo "🛡️ MOBILE TEST GUARDIAN: Pre-commit validation..."

# Run mobile test monitor
if ! node scripts/mobile-test-monitor.js; then
    echo "❌ Mobile test validation failed. Commit blocked."
    echo "Please ensure all 271 mobile tests are passing before committing."
    exit 1
fi

echo "✅ Mobile tests validated. Proceeding with commit."
EOF

    chmod +x "$hooks_dir/pre-commit"
    success "Git pre-commit hook installed"
}

# Main script logic
case "${1:-monitor}" in
    "monitor")
        run_monitor
        ;;
    "watch")
        continuous_monitor "${2:-30}"
        ;;
    "backup")
        backup_critical_files
        ;;
    "restore")
        restore_from_backup "$2"
        ;;
    "validate")
        validate_test_count
        ;;
    "setup-hooks")
        setup_git_hooks
        ;;
    "help")
        echo "MOBILE TEST GUARDIAN - Usage:"
        echo "  $0 monitor          - Run single validation check"
        echo "  $0 watch [interval] - Continuous monitoring (default: 30s)"
        echo "  $0 backup           - Create backup of critical files"
        echo "  $0 restore [path]   - Restore from backup"
        echo "  $0 validate         - Quick test count validation"
        echo "  $0 setup-hooks      - Install git hooks for protection"
        echo "  $0 help             - Show this help"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac