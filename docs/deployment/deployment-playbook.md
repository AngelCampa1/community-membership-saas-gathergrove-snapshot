# GatherGrove Production Deployment Playbook

> **Stale. Kept as a record, not as instructions.** This playbook is dated 2024-10-26, which is before
> the first commit in this project's history (2025-05-28), and it does not describe what GatherGrove
> actually ran on:
>
> - It deploys the backend to **IIS** and the frontend by **rsync to nginx**. The real targets were
>   **Railway** (backend) and **Cloudflare Workers via OpenNext** (frontend).
> - Its database steps are **SQL Server** (`USE GatherGroveProduction`, `BACKUP DATABASE`, `.bak`
>   restores). The project moved to PostgreSQL on 2026-02-17 — see
>   [ENGINEERING.md](../../portfolio/ENGINEERING-LOG.md#migrating-from-sql-server-to-postgresql).
> - The mobile section submits builds to the App Store and Play Store. **That never happened.** The
>   mobile app was never published to either store.
> - The "Emergency Contacts" addresses (`devops@`, `backend-dev@`, `frontend-dev@`, `mobile-dev@`,
>   `infra@`) are role placeholders. GatherGrove was built by one person; none of those inboxes
>   existed.
>
> Nothing below was corrected, because rewriting it would invent a deployment history that did not
> happen. It sits here as an artifact of early planning.

## Overview
This document provides step-by-step procedures for deploying the GatherGrove platform to production environments, ensuring consistent, reliable deployments with proper rollback procedures.

## Deployment Trigger

GatherGrove deployments are triggered by pushing the target branch to `origin`. Do not use the GitHub CLI (`gh`) to start deployments for this repository.

```bash
git push origin <branch>
```

## Pre-deployment Checklist

### ✅ Environment Verification
- [ ] Azure Key Vault access verified
- [ ] All services running in production configuration
- [ ] Database migrations applied and validated
- [ ] Production secrets configured
- [ ] SSL certificates valid and installed
- [ ] Domain DNS records pointing correctly

### ✅ Build Validation
- [ ] Backend builds successfully with 0 errors
- [ ] Frontend builds optimized production assets
- [ ] Mobile production builds created for iOS/Android
- [ ] All unit and integration tests passing
- [ ] E2E test results validated

### ✅ Security Configuration
- [ ] Content Security Policy (CSP) headers configured
- [ ] Cross-Origin Resource Sharing (CORS) settings
- [ ] JWT secret keys rotated and secure
- [ ] Rate limiting policies active
- [ ] Cloudflare Turnstile site key and secret configured for public marketing forms
- [ ] SSL/TLS encryption verified
- [ ] Security headers properly configured

## Deployment Process

### Step 1: Backend Deployment (.NET API)
```bash
# 1. Stop running processes
pkill -f "dotnet"

# 2. Update connection string
export ASPNETCORE_ENVIRONMENT=Production
export ASPNETCORE_ConnectionStrings__DefaultConnection="Server=tcp:sql-server.example.com,1433;Database=GatherGroveProduction;"

# 3. Deploy to IIS/Production
dotnet publish -c Release -o ./publish /p:PublishSingleFile=false

# 4. Health check
curl -f https://api.gathergrove.club/health
```

### Step 2: Frontend Deployment (Next.js)
```bash
# 1. Build production assets
npm run build:production

# 2. Deploy to production server
rsync -avz --delete ./build/ user@server.example.com:/var/www/gathergrove/

# 3. Restart web server
sudo systemctl restart nginx
sudo systemctl restart gathergrove-frontend

# 4. Health check
curl -f https://gathergrove.club/health
```

### Step 3: Mobile App Deployment (React Native)
```bash
# 1. Build production app
expo build --type apk --release-channel production

# 2. Submit to app stores
# Google Play Store
eas build -p android \
  --bundle-id com.gathergrove.app \
  --upload

# Apple App Store
expo build --type archive \
  --release-channel production

# 3. Update over-the-air (OTA)
expo publish --release-channel production
```

### Step 4: Database Updates
```sql
-- Execute final production migrations
USE GatherGroveProduction;
GO
-- Verify all indexes and constraints
EXEC sp_updateindex 'N'', 'ALL', 'dbo', 'tblEvent', 'tblMember', 'tblPayment';

-- Backup production database
BACKUP DATABASE GatherGroveProduction
TO DISK = 'BACKUP_GatherGrove_2024_10_26.bak'
WITH FORMAT, INIT;
```

## Post-deployment Verification

### ✅ Health Checks
```bash
# API Health
curl -f https://api.gathergrove.club/api/v1/health
Expected: {"status":"healthy","timestamp":"2024-10-26T14:00:00Z"}

# Frontend Health
curl -f https://gathergrove.club/health
Expected: 200 OK with proper CSP headers

# Mobile App Health
curl -f https://play.google.com/store/apps/details?id=com.gathergrove.app
Expected: Active and available
```

### ✅ Functional Testing
```bash
# Test authentication flow
curl -X POST "https://api.gathergrove.club/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gathergrove.club","password":"Test123!"}'

# Test payment processing (Stripe test mode)
curl -X POST "https://api.stripe.com/v1/charges" \
  -u sk_test_...:sk_test_... \
  -d "amount=500&currency=usd&source=tok_visa"

# Test SignalR real-time connection
wscat -n localhost:5284 -e "https://gathergrove.club/chatHub"

# Test mobile app deep linking
expo build:web --webhook-url https://api.gathergrove.club/api/v1/mobile/webhooks
```

## Monitoring and Alerting

### ✅ Application Insights
```javascript
// Key metrics to monitor
const productionMetrics = {
  responseTime: '<200ms',
  errorRate: '<1%',
  throughput: '>1000 req/min',
  cpuUsage: '<70%',
  memoryUsage: '<80%'
};

// Alert thresholds
const alertThresholds = {
  errorRate: '>5%',
  responseTime: '>1s',
  cpuUsage: '>90%',
  memoryUsage: '>90%'
};
```

### ✅ Log Analysis
```bash
# Monitor error logs
tail -f /var/log/gathergrove/api.error.log | grep ERROR

# Monitor access logs
tail -f /var/log/nginx/access.log | grep -E "(4|5\d\d)"

# Database performance
docker stats --no-stream | grep GatherGrove
```

## Rollback Procedures

### Emergency Rollback
```bash
# 1. Frontend rollback (previous version)
git checkout previous-production-tag
npm run build:production
rsync -avz --delete ./build/ user@server.example.com:/var/www/gathergrove/

# 2. Backend rollback (previous migration)
dotnet ef database update 0.0.0
-- Revert last migration

# 3. Mobile rollback (previous build)
expo build --type apk --release-channel production
expo publish --release-channel production --non-interactive
```

### Database Rollback
```sql
-- Emergency database restore
USE master;
GO
RESTORE DATABASE GatherGroveProduction FROM DISK = 'BACKUP_GatherGrove_2024_10_25.bak'
WITH REPLACE;
GO
```

## Security Considerations

### 🔒 Production Security Checklist
- [ ] SSL/TLS 1.3+ enforced
- [ ] API rate limiting active and tested
- [ ] Public marketing forms reject submissions without valid Turnstile tokens
- [ ] Public marketing forms include honeypot fields and per-email throttling
- [ ] Input validation and sanitization enabled
- [ ] SQL injection protection active
- [ ] XSS and CSRF protection verified
- [ ] Authentication tokens properly secured with expiration
- [ ] Environment variables properly externalized

## Contact Information

### 🚨 Emergency Contacts
- **DevOps Lead**: devops@gathergrove.club
- **Backend Lead**: backend-dev@gathergrove.club
- **Frontend Lead**: frontend-dev@gathergrove.club
- **Mobile Lead**: mobile-dev@gathergrove.club
- **Infrastructure**: infra@gathergrove.club

## Appendix: Environment Variables

### Required Production Variables
```bash
# Backend
ASPNETCORE_ENVIRONMENT=Production
AzureAdTenant__Id=your-tenant-id
AzureAdClientSecret__Id=your-client-secret
TURNSTILE_SITE_KEY=0x4AAAA...
TURNSTILE_SECRET_KEY=0x4AAAA...

# Frontend
NEXT_PUBLIC_API_BASE_URL=https://api.gathergrove.club/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APPLICATION_INSIGHTS_CONNECTION_STRING=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAA... # Optional; frontend can fetch from the API runtime config

# Mobile
EXPO_PUBLIC_API_URL=https://api.gathergrove.club
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

**Version**: 1.0
**Last Updated**: 2024-10-26
**Next Review**: 2025-01-26 or as needed

**Note**: This document should be reviewed and updated after each deployment to ensure procedures remain current and effective.
