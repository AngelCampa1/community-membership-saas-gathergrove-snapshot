#!/bin/bash
# manage-services.sh - GatherGrove E2E Testing Service Management
# 
# Purpose: Manage E2E testing services (start, stop, restart, monitor)
# Usage: ./manage-services.sh <command> [service] [options]
# Author: HIVE MIND Coder Delta
# Version: 1.0.0

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Configuration
COMMAND=${1:-status}
SERVICE=${2:-all}
ENVIRONMENT=${3:-development}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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
}

show_usage() {
    cat << EOF
GatherGrove E2E Testing Service Manager

Usage: $0 <command> [service] [environment]

Commands:
  start         - Start services
  stop          - Stop services
  restart       - Restart services
  status        - Show service status
  logs          - Show service logs
  health        - Check service health
  monitor       - Real-time service monitoring
  scale         - Scale services up/down
  backup        - Backup service data
  restore       - Restore service data

Services:
  all           - All services (default)
  web           - Frontend React service
  api           - Backend ASP.NET Core service
  db            - SQL Server database service
  redis         - Redis cache service
  mobile        - Mobile development server (Metro)
  nginx         - Load balancer/proxy (production-test only)

Environments:
  development   - Local development (default)
  staging       - Staging environment
  production-test - Production-like testing

Examples:
  $0 start all development
  $0 stop web
  $0 restart api staging
  $0 health db
  $0 logs all | grep ERROR
  $0 monitor web
  $0 scale api 3

EOF
}

# Get Docker Compose file based on environment
get_compose_file() {
    local env=$1
    local compose_file="docker-compose.test.yml"
    
    # Check for environment-specific compose file
    local env_compose="docs/e2e-testing/infrastructure/docker-compose.$env.yml"
    if [ -f "$env_compose" ]; then
        echo "$env_compose"
    else
        echo "$compose_file"
    fi
}

# Get service names for Docker Compose
get_service_name() {
    case $1 in
        web)
            echo "gathergrove-web"
            ;;
        api)
            echo "gathergrove-api"
            ;;
        db)
            echo "db"
            ;;
        redis)
            echo "redis"
            ;;
        nginx)
            echo "nginx"
            ;;
        all)
            echo ""  # Empty means all services
            ;;
        *)
            echo "$1"  # Pass through unknown services
            ;;
    esac
}

# Start services
start_services() {
    log "🚀 Starting services: $SERVICE in $ENVIRONMENT environment"
    
    cd "$PROJECT_ROOT"
    local compose_file=$(get_compose_file "$ENVIRONMENT")
    local service_name=$(get_service_name "$SERVICE")
    
    case $SERVICE in
        all)
            docker-compose -f "$compose_file" up -d
            ;;
        web)
            docker-compose -f "$compose_file" up -d "$service_name"
            ;;
        api)
            docker-compose -f "$compose_file" up -d "$service_name" db redis
            ;;
        db)
            docker-compose -f "$compose_file" up -d db redis
            ;;
        redis)
            docker-compose -f "$compose_file" up -d redis
            ;;
        mobile)
            start_mobile_server
            ;;
        nginx)
            if [ "$ENVIRONMENT" = "production-test" ]; then
                docker-compose -f "$compose_file" up -d nginx
            else
                warn "Nginx only available in production-test environment"
            fi
            ;;
        *)
            docker-compose -f "$compose_file" up -d "$service_name"
            ;;
    esac
    
    success "Services started: $SERVICE"
    
    # Wait for services to be ready
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "api" ] || [ "$SERVICE" = "web" ]; then
        log "⏳ Waiting for services to be ready..."
        sleep 10
        check_service_health silent
    fi
}

# Stop services
stop_services() {
    log "🛑 Stopping services: $SERVICE"
    
    cd "$PROJECT_ROOT"
    local compose_file=$(get_compose_file "$ENVIRONMENT")
    local service_name=$(get_service_name "$SERVICE")
    
    case $SERVICE in
        all)
            docker-compose -f "$compose_file" down
            stop_mobile_server
            ;;
        web)
            docker-compose -f "$compose_file" stop "$service_name"
            ;;
        api)
            docker-compose -f "$compose_file" stop "$service_name"
            ;;
        db)
            docker-compose -f "$compose_file" stop db redis
            ;;
        redis)
            docker-compose -f "$compose_file" stop redis
            ;;
        mobile)
            stop_mobile_server
            ;;
        nginx)
            docker-compose -f "$compose_file" stop nginx
            ;;
        *)
            docker-compose -f "$compose_file" stop "$service_name"
            ;;
    esac
    
    success "Services stopped: $SERVICE"
}

# Restart services
restart_services() {
    log "🔄 Restarting services: $SERVICE"
    stop_services
    sleep 3
    start_services
}

# Show service status
show_status() {
    log "📊 Service status for environment: $ENVIRONMENT"
    echo ""
    
    cd "$PROJECT_ROOT"
    local compose_file=$(get_compose_file "$ENVIRONMENT")
    
    # Docker services status
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "web" ]; then
        echo -e "${CYAN}Web Service (Frontend):${NC}"
        docker-compose -f "$compose_file" ps gathergrove-web 2>/dev/null || echo "  ❌ Not running"
        echo ""
    fi
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "api" ]; then
        echo -e "${CYAN}API Service (Backend):${NC}"
        docker-compose -f "$compose_file" ps gathergrove-api 2>/dev/null || echo "  ❌ Not running"
        echo ""
    fi
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "db" ]; then
        echo -e "${CYAN}Database (SQL Server):${NC}"
        docker-compose -f "$compose_file" ps db 2>/dev/null || echo "  ❌ Not running"
        echo ""
    fi
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "redis" ]; then
        echo -e "${CYAN}Redis Cache:${NC}"
        docker-compose -f "$compose_file" ps redis 2>/dev/null || echo "  ❌ Not running"
        echo ""
    fi
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "mobile" ]; then
        echo -e "${CYAN}Mobile (Metro Bundler):${NC}"
        if pgrep -f "react-native start" > /dev/null || pgrep -f "expo start" > /dev/null; then
            echo "  ✅ Running (PID: $(pgrep -f 'react-native start\|expo start' | head -1))"
        else
            echo "  ❌ Not running"
        fi
        echo ""
    fi
    
    if [ "$ENVIRONMENT" = "production-test" ] && ([ "$SERVICE" = "all" ] || [ "$SERVICE" = "nginx" ]); then
        echo -e "${CYAN}Nginx Load Balancer:${NC}"
        docker-compose -f "$compose_file" ps nginx 2>/dev/null || echo "  ❌ Not running"
        echo ""
    fi
    
    # Show resource usage
    show_resource_usage
}

# Show resource usage
show_resource_usage() {
    echo -e "${CYAN}Resource Usage:${NC}"
    
    local compose_file=$(get_compose_file "$ENVIRONMENT")
    if docker-compose -f "$compose_file" ps -q | wc -l | grep -q "^[1-9]"; then
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    else
        echo "  No running containers"
    fi
    echo ""
}

# Show service logs
show_logs() {
    log "📜 Showing logs for: $SERVICE"
    
    cd "$PROJECT_ROOT"
    local compose_file=$(get_compose_file "$ENVIRONMENT")
    local service_name=$(get_service_name "$SERVICE")
    
    case $SERVICE in
        all)
            docker-compose -f "$compose_file" logs -f --tail=100
            ;;
        web)
            docker-compose -f "$compose_file" logs -f --tail=100 "$service_name"
            ;;
        api)
            docker-compose -f "$compose_file" logs -f --tail=100 "$service_name"
            ;;
        db)
            docker-compose -f "$compose_file" logs -f --tail=100 db
            ;;
        redis)
            docker-compose -f "$compose_file" logs -f --tail=100 redis
            ;;
        mobile)
            echo "Mobile logs are shown in the terminal where Metro/Expo was started"
            echo "To see React Native logs, use: npx react-native log-android or npx react-native log-ios"
            ;;
        *)
            docker-compose -f "$compose_file" logs -f --tail=100 "$service_name"
            ;;
    esac
}

# Check service health
check_service_health() {
    local silent_mode=$1
    [ "$silent_mode" != "silent" ] && log "🏥 Health check for: $SERVICE"
    
    local all_healthy=true
    local health_results=()
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "web" ]; then
        if curl -sf http://localhost:3000/health > /dev/null 2>&1 || \
           curl -sf http://localhost:3000 > /dev/null 2>&1; then
            health_results+=("✅ Web service: Healthy")
        else
            health_results+=("❌ Web service: Unhealthy")
            all_healthy=false
        fi
    fi
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "api" ]; then
        if curl -sf http://localhost:5000/health > /dev/null 2>&1 || \
           curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
            health_results+=("✅ API service: Healthy")
        else
            health_results+=("❌ API service: Unhealthy")
            all_healthy=false
        fi
    fi
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "db" ]; then
        local compose_file=$(get_compose_file "$ENVIRONMENT")
        if docker exec $(docker-compose -f "$compose_file" ps -q db 2>/dev/null) \
           sqlcmd -S localhost -U sa -P "${DB_PASSWORD:-TestPassword123!}" -Q "SELECT 1" > /dev/null 2>&1; then
            health_results+=("✅ Database: Healthy")
        else
            health_results+=("❌ Database: Unhealthy")
            all_healthy=false
        fi
    fi
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "redis" ]; then
        local compose_file=$(get_compose_file "$ENVIRONMENT")
        if docker exec $(docker-compose -f "$compose_file" ps -q redis 2>/dev/null) \
           redis-cli ping > /dev/null 2>&1; then
            health_results+=("✅ Redis: Healthy")
        else
            health_results+=("❌ Redis: Unhealthy")
            all_healthy=false
        fi
    fi
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "mobile" ]; then
        if pgrep -f "react-native start\|expo start" > /dev/null; then
            health_results+=("✅ Mobile server: Running")
        else
            health_results+=("❌ Mobile server: Not running")
            # Mobile is optional, don't mark as unhealthy
        fi
    fi
    
    # Display results
    if [ "$silent_mode" != "silent" ]; then
        for result in "${health_results[@]}"; do
            echo -e "  $result"
        done
        echo ""
        
        if [ "$all_healthy" = true ]; then
            success "All checked services are healthy"
        else
            error "Some services are unhealthy"
        fi
    fi
    
    return $([ "$all_healthy" = true ] && echo 0 || echo 1)
}

# Real-time monitoring
monitor_services() {
    log "🔍 Starting real-time monitoring for: $SERVICE"
    echo "Press Ctrl+C to stop monitoring"
    echo ""
    
    while true; do
        clear
        echo -e "${BLUE}GatherGrove E2E Services Monitor - $(date)${NC}"
        echo -e "${BLUE}Environment: $ENVIRONMENT | Service: $SERVICE${NC}"
        echo "=============================================="
        echo ""
        
        check_service_health silent
        echo ""
        show_resource_usage
        
        # Show recent logs
        if [ "$SERVICE" != "all" ]; then
            echo -e "${CYAN}Recent logs (last 5 lines):${NC}"
            cd "$PROJECT_ROOT"
            local compose_file=$(get_compose_file "$ENVIRONMENT")
            local service_name=$(get_service_name "$SERVICE")
            
            if [ "$SERVICE" = "mobile" ]; then
                echo "  Mobile logs shown in Metro/Expo terminal"
            else
                docker-compose -f "$compose_file" logs --tail=5 "$service_name" 2>/dev/null | tail -5 || echo "  No logs available"
            fi
        fi
        
        sleep 5
    done
}

# Scale services
scale_services() {
    local replicas=${3:-2}
    log "📈 Scaling $SERVICE to $replicas replicas"
    
    cd "$PROJECT_ROOT"
    local compose_file=$(get_compose_file "$ENVIRONMENT")
    local service_name=$(get_service_name "$SERVICE")
    
    if [ "$SERVICE" = "all" ]; then
        warn "Cannot scale all services. Please specify a specific service."
        return 1
    fi
    
    case $SERVICE in
        web|api)
            docker-compose -f "$compose_file" up -d --scale "$service_name=$replicas"
            success "Scaled $SERVICE to $replicas replicas"
            ;;
        db|redis)
            warn "Cannot scale $SERVICE - stateful services don't support scaling"
            ;;
        mobile)
            warn "Cannot scale mobile server - not containerized"
            ;;
        *)
            docker-compose -f "$compose_file" up -d --scale "$service_name=$replicas"
            success "Scaled $SERVICE to $replicas replicas"
            ;;
    esac
}

# Start mobile development server
start_mobile_server() {
    log "📱 Starting mobile development server..."
    
    cd "$PROJECT_ROOT/mobile"
    
    if [ -f "package.json" ]; then
        # Check if Expo or React Native CLI
        if grep -q '"expo"' package.json; then
            nohup npx expo start --web > /tmp/expo.log 2>&1 &
            echo $! > /tmp/expo.pid
            success "Expo development server started"
        else
            nohup npx react-native start > /tmp/metro.log 2>&1 &
            echo $! > /tmp/metro.pid
            success "Metro bundler started"
        fi
    else
        warn "No mobile project found in $PROJECT_ROOT/mobile"
    fi
    
    cd "$PROJECT_ROOT"
}

# Stop mobile development server
stop_mobile_server() {
    log "📱 Stopping mobile development server..."
    
    # Kill by process name
    pkill -f "react-native start" || true
    pkill -f "expo start" || true
    
    # Kill by PID files
    [ -f /tmp/metro.pid ] && kill $(cat /tmp/metro.pid) 2>/dev/null && rm /tmp/metro.pid
    [ -f /tmp/expo.pid ] && kill $(cat /tmp/expo.pid) 2>/dev/null && rm /tmp/expo.pid
    
    success "Mobile development server stopped"
}

# Backup service data
backup_services() {
    log "💾 Creating backup for: $SERVICE"
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    cd "$PROJECT_ROOT"
    local compose_file=$(get_compose_file "$ENVIRONMENT")
    
    case $SERVICE in
        all|db)
            log "Backing up database..."
            docker exec $(docker-compose -f "$compose_file" ps -q db) \
                sqlcmd -S localhost -U sa -P "${DB_PASSWORD:-TestPassword123!}" \
                -Q "BACKUP DATABASE GatherGroveTest TO DISK = '/tmp/backup.bak'" > /dev/null 2>&1 || true
            
            docker cp $(docker-compose -f "$compose_file" ps -q db):/tmp/backup.bak \
                "$backup_dir/database_backup.bak" 2>/dev/null || warn "Database backup failed"
            ;;
    esac
    
    if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "redis" ]; then
        log "Backing up Redis data..."
        docker exec $(docker-compose -f "$compose_file" ps -q redis) \
            redis-cli --rdb /tmp/redis_backup.rdb > /dev/null 2>&1 || true
        
        docker cp $(docker-compose -f "$compose_file" ps -q redis):/tmp/redis_backup.rdb \
            "$backup_dir/redis_backup.rdb" 2>/dev/null || warn "Redis backup failed"
    fi
    
    success "Backup created in $backup_dir"
}

# Restore service data
restore_services() {
    local backup_path=${3:-latest}
    log "🔄 Restoring services from backup: $backup_path"
    
    if [ "$backup_path" = "latest" ]; then
        backup_path=$(find backups -maxdepth 1 -type d | sort | tail -1)
    fi
    
    if [ ! -d "$backup_path" ]; then
        error "Backup directory not found: $backup_path"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    local compose_file=$(get_compose_file "$ENVIRONMENT")
    
    # Restore database
    if [ -f "$backup_path/database_backup.bak" ]; then
        log "Restoring database..."
        docker cp "$backup_path/database_backup.bak" \
            $(docker-compose -f "$compose_file" ps -q db):/tmp/backup.bak
        
        docker exec $(docker-compose -f "$compose_file" ps -q db) \
            sqlcmd -S localhost -U sa -P "${DB_PASSWORD:-TestPassword123!}" \
            -Q "RESTORE DATABASE GatherGroveTest FROM DISK = '/tmp/backup.bak' WITH REPLACE" > /dev/null 2>&1 || \
            warn "Database restore failed"
    fi
    
    # Restore Redis
    if [ -f "$backup_path/redis_backup.rdb" ]; then
        log "Restoring Redis data..."
        docker cp "$backup_path/redis_backup.rdb" \
            $(docker-compose -f "$compose_file" ps -q redis):/tmp/redis_backup.rdb
        
        docker exec $(docker-compose -f "$compose_file" ps -q redis) \
            redis-cli --rdb /tmp/redis_backup.rdb > /dev/null 2>&1 || \
            warn "Redis restore failed"
    fi
    
    success "Service data restored from $backup_path"
}

# Main execution function
main() {
    cd "$PROJECT_ROOT"
    
    case $COMMAND in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        health)
            check_service_health
            ;;
        monitor)
            monitor_services
            ;;
        scale)
            scale_services
            ;;
        backup)
            backup_services
            ;;
        restore)
            restore_services
            ;;
        help|--help|-h)
            show_usage
            exit 0
            ;;
        *)
            error "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
}

# Handle interrupt signal for monitoring
trap 'echo -e "\n${YELLOW}Monitoring stopped${NC}"; exit 0' SIGINT

# Execute main function with all arguments
main "$@"