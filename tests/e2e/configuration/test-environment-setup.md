# Test Environment Configuration Documentation

## Overview
This document provides comprehensive guidance for setting up and configuring test environments for GatherGrove E2E testing across different platforms and scenarios.

## Environment Architecture

### Test Environment Tiers

#### 1. Local Development Environment
```yaml
name: "local-dev"
purpose: "Individual developer testing and debugging"
infrastructure:
  database: "Local PostgreSQL instance"
  redis: "Local Redis instance"
  email: "MailHog for email testing"
  storage: "Local file system"
  frontend: "Next.js dev server (port 3000)"
  backend: "ASP.NET Core dev server (port 5000)"
```

#### 2. CI/CD Integration Environment
```yaml
name: "ci-pipeline"
purpose: "Automated testing in CI/CD pipeline"
infrastructure:
  database: "Containerized PostgreSQL"
  redis: "Containerized Redis"
  email: "Mock email service"
  storage: "In-memory storage"
  frontend: "Built and served statically"
  backend: "Containerized API service"
```

#### 3. Staging Environment
```yaml
name: "staging"
purpose: "Pre-production testing and validation"
infrastructure:
  database: "Managed PostgreSQL (AWS RDS/Azure SQL)"
  redis: "Managed Redis (AWS ElastiCache/Azure Cache)"
  email: "SendGrid sandbox mode"
  storage: "Cloud storage (S3/Azure Blob)"
  frontend: "CDN-served build"
  backend: "Container orchestration (ECS/AKS)"
```

#### 4. Load Testing Environment
```yaml
name: "load-test"
purpose: "Performance and scalability testing"
infrastructure:
  database: "High-performance managed instance"
  redis: "Clustered Redis"
  email: "Mock service with delivery tracking"
  storage: "High-throughput cloud storage"
  frontend: "Production-like CDN setup"
  backend: "Auto-scaling container groups"
```

## Docker Compose Configuration

### Complete Test Stack
```yaml
version: '3.8'

services:
  # Database Services
  postgres:
    image: postgres:15-alpine
    container_name: gathergrove-test-db
    environment:
      POSTGRES_DB: gathergrove_test
      POSTGRES_USER: gathergrove_user
      POSTGRES_PASSWORD: test_password_123
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5432:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
      - ./test-data/sql-seed:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gathergrove_user -d gathergrove_test"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    container_name: gathergrove-test-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_test_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Email testing service
  mailhog:
    image: mailhog/mailhog:v1.0.1
    container_name: gathergrove-test-mailhog
    ports:
      - "1025:1025"  # SMTP port
      - "8025:8025"  # Web UI port
    environment:
      MH_STORAGE: maildir
      MH_MAILDIR_PATH: /maildir
    volumes:
      - mailhog_data:/maildir

  # MinIO for S3-compatible object storage testing
  minio:
    image: minio/minio:latest
    container_name: gathergrove-test-minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"  # API port
      - "9001:9001"  # Console port
    environment:
      MINIO_ROOT_USER: testuser
      MINIO_ROOT_PASSWORD: testpassword123
    volumes:
      - minio_test_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Backend API service
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.test
    container_name: gathergrove-test-api
    ports:
      - "5000:5000"
    environment:
      - ASPNETCORE_ENVIRONMENT=Testing
      - DATABASE_CONNECTION_STRING=Server=postgres;Port=5432;Database=gathergrove_test;User Id=gathergrove_user;Password=test_password_123;
      - REDIS_CONNECTION_STRING=redis:6379
      - EMAIL_SMTP_HOST=mailhog
      - EMAIL_SMTP_PORT=1025
      - STORAGE_TYPE=minio
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=testuser
      - MINIO_SECRET_KEY=testpassword123
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      mailhog:
        condition: service_started
      minio:
        condition: service_healthy
    volumes:
      - ./backend/test-logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Frontend application
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile.test
    container_name: gathergrove-test-frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
      - NEXT_PUBLIC_API_BASE_URL=http://api:5000
      - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
    depends_on:
      api:
        condition: service_healthy
    volumes:
      - ./client/test-logs:/app/logs

  # Playwright test runner
  playwright:
    build:
      context: ./tests/e2e
      dockerfile: Dockerfile
    container_name: gathergrove-playwright
    environment:
      - BASE_URL=http://frontend:3000
      - API_BASE_URL=http://api:5000
      - MAILHOG_URL=http://mailhog:8025
    depends_on:
      frontend:
        condition: service_started
      api:
        condition: service_healthy
    volumes:
      - ./tests/e2e/test-results:/app/test-results
      - ./tests/e2e/playwright-report:/app/playwright-report
      - ./tests/e2e/screenshots:/app/screenshots
    command: ["npm", "run", "test:e2e"]

volumes:
  postgres_test_data:
  redis_test_data:
  mailhog_data:
  minio_test_data:

networks:
  default:
    name: gathergrove-test-network
```

## Playwright Configuration

### Main Playwright Config
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    },
    
    // Accessibility testing
    {
      name: 'accessibility',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/accessibility/*.spec.ts'
    },
    
    // Performance testing
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-precise-memory-info']
        }
      },
      testMatch: '**/performance/*.spec.ts'
    }
  ],

  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
```

### Environment-Specific Configs
```typescript
// playwright.config.staging.ts
import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: 'https://staging.gathergrove.com'
  },
  webServer: undefined,
  retries: 3,
  workers: 2
});
```

## Database Setup and Seeding

### Database Migration Script
```sql
-- test-data/sql-seed/001-schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test-specific schema
CREATE SCHEMA IF NOT EXISTS test_data;

-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'Sprout',
    member_limit INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    club_id INTEGER REFERENCES clubs(id),
    role VARCHAR(50) NOT NULL DEFAULT 'Member',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    max_attendees INTEGER,
    club_id INTEGER REFERENCES clubs(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Test Data Seeding
```sql
-- test-data/sql-seed/002-test-data.sql
-- Insert test clubs
INSERT INTO clubs (name, tier, member_limit) VALUES 
('Claude Test Club', 'Unlimited', NULL),
('Claude Grow Club', 'Grow', 200),
('Claude Sprout Club', 'Sprout', 50);

-- Insert test admin users
INSERT INTO users (email, password_hash, full_name, club_id, role) VALUES
('claude.test@gathergrove.com', '$2b$10$example_hash', 'Claude Code Test', 1, 'Admin'),
('claude.grow@gathergrove.com', '$2b$10$example_hash', 'Claude Grow Test', 2, 'Admin'),
('claude.sprout@gathergrove.com', '$2b$10$example_hash', 'Claude Sprout Test', 3, 'Admin');

-- Insert test member users
INSERT INTO users (email, password_hash, full_name, club_id, role) VALUES
('member1@gathergrove.test', '$2b$10$example_hash', 'Test Member 1', 1, 'Member'),
('member2@gathergrove.test', '$2b$10$example_hash', 'Test Member 2', 1, 'Member');

-- Insert test events
INSERT INTO events (title, description, event_date, location, max_attendees, club_id, created_by) VALUES
('Monthly Meeting', 'Regular monthly club meeting', NOW() + INTERVAL '7 days', 'Community Center', 50, 1, 1),
('Workshop Session', 'Educational workshop', NOW() + INTERVAL '14 days', 'Online', 100, 1, 1);
```

## CI/CD Pipeline Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: gathergrove_test
          POSTGRES_USER: gathergrove_user
          POSTGRES_PASSWORD: test_password_123
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0'

      - name: Install dependencies
        run: |
          npm ci
          cd client && npm ci
          cd ../backend && dotnet restore

      - name: Build applications
        run: |
          cd client && npm run build
          cd ../backend && dotnet build --configuration Release

      - name: Setup test database
        run: |
          PGPASSWORD=test_password_123 psql -h localhost -U gathergrove_user -d gathergrove_test -f tests/e2e/test-data/sql-seed/001-schema.sql
          PGPASSWORD=test_password_123 psql -h localhost -U gathergrove_user -d gathergrove_test -f tests/e2e/test-data/sql-seed/002-test-data.sql

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_CONNECTION_STRING: "Server=localhost;Port=5432;Database=gathergrove_test;User Id=gathergrove_user;Password=test_password_123;"
          REDIS_CONNECTION_STRING: "localhost:6379"
          BASE_URL: http://localhost:3000

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: |
            tests/e2e/test-results/
            tests/e2e/playwright-report/
          retention-days: 7
```

## Environment Variables Configuration

### Local Development (.env.local)
```env
# Database
DATABASE_CONNECTION_STRING="Server=localhost;Port=5432;Database=gathergrove_test;User Id=gathergrove_user;Password=test_password_123;"

# Redis
REDIS_CONNECTION_STRING="localhost:6379"

# Email Testing
EMAIL_SMTP_HOST="localhost"
EMAIL_SMTP_PORT="1025"
EMAIL_FROM="test@gathergrove.local"

# Storage
STORAGE_TYPE="local"
LOCAL_STORAGE_PATH="./test-uploads"

# External APIs (Test Keys)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
SENDGRID_API_KEY="SG.test..."

# Application URLs
NEXT_PUBLIC_API_BASE_URL="http://localhost:5000"
BASE_URL="http://localhost:3000"

# Test Configuration
NODE_ENV="test"
ASPNETCORE_ENVIRONMENT="Testing"
```

### CI/CD Environment (.env.ci)
```env
# Database
DATABASE_CONNECTION_STRING="Server=postgres;Port=5432;Database=gathergrove_test;User Id=gathergrove_user;Password=test_password_123;"

# Redis
REDIS_CONNECTION_STRING="redis:6379"

# Email Testing
EMAIL_SMTP_HOST="mailhog"
EMAIL_SMTP_PORT="1025"

# Storage
STORAGE_TYPE="minio"
MINIO_ENDPOINT="minio:9000"
MINIO_ACCESS_KEY="testuser"
MINIO_SECRET_KEY="testpassword123"

# Application URLs
NEXT_PUBLIC_API_BASE_URL="http://api:5000"
BASE_URL="http://frontend:3000"
```

## Test Execution Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    "test:setup": "docker-compose -f docker-compose.test.yml up -d",
    "test:teardown": "docker-compose -f docker-compose.test.yml down -v",
    "test:seed": "npm run test:setup && npm run db:seed",
    "test:clean": "npm run test:teardown && docker system prune -f"
  }
}
```

### Helper Scripts
```bash
#!/bin/bash
# scripts/setup-test-env.sh

echo "Setting up GatherGrove test environment..."

# Create test directories
mkdir -p tests/e2e/test-results
mkdir -p tests/e2e/screenshots
mkdir -p tests/e2e/videos
mkdir -p test-uploads

# Start test services
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Run database migrations and seeding
echo "Setting up test database..."
npm run db:migrate:test
npm run db:seed:test

echo "Test environment ready!"
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:5000"
echo "MailHog: http://localhost:8025"
echo "MinIO Console: http://localhost:9001"
```

## Monitoring and Logging

### Test Execution Monitoring
```typescript
// tests/utils/monitoring.ts
export class TestMonitoring {
  static async logTestStart(testName: string) {
    console.log(`🧪 Starting test: ${testName}`);
    // Log to monitoring system
  }

  static async logTestEnd(testName: string, duration: number, status: string) {
    console.log(`✅ Test completed: ${testName} (${duration}ms) - ${status}`);
    // Log to monitoring system
  }

  static async captureScreenshot(page: Page, testName: string) {
    const screenshot = await page.screenshot({
      path: `screenshots/${testName}-${Date.now()}.png`,
      fullPage: true
    });
    return screenshot;
  }

  static async logPerformanceMetrics(page: Page) {
    const metrics = await page.evaluate(() => performance.getEntriesByType('navigation'));
    console.log('Performance metrics:', metrics);
  }
}
```

### Error Reporting
```typescript
// tests/utils/error-reporting.ts
export class ErrorReporting {
  static async reportError(error: Error, context: any) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    // Send to error tracking service (Sentry, etc.)
    console.error('Test Error:', errorReport);
  }
}
```

This comprehensive configuration ensures reliable, maintainable, and scalable E2E testing infrastructure for GatherGrove across all environments and scenarios.