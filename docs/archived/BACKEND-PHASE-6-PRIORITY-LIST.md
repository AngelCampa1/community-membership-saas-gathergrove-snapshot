# Backend Phase 6: Priority Service List
## Coverage Gap Analysis - January 12, 2026

**Overall Coverage**: 10.6% line coverage (17,479 / 164,542 lines)
**Branch Coverage**: 24% (2,782 / 11,553 branches)
**Method Coverage**: 37.2% (3,592 / 9,636 methods)

---

## 🚨 Critical Finding

**Most services have 0% coverage!** Despite having 6,102 passing tests, the tests primarily cover:
- Controllers (API layer) - mostly mocked services
- DTOs (data transfer objects) - pass-through objects
- Some infrastructure repositories

**The core business logic in Application.Services is almost entirely untested.**

---

## 📊 Services with Partial Coverage (To Complete to 95%+)

These services have some tests but need to reach 95%:

| Service | Current | Target | Tests Exist | Priority |
|---------|---------|--------|-------------|----------|
| EventTokenService | 48.3% | 95%+ | Yes | P2 |
| BrandingService | 57.6% | 95%+ | Yes | P4 |
| CacheStatistics | 66.6% | 95%+ | Yes | P5 |
| ContentSanitizationService | 47.4% | 95%+ | Yes | P0 |
| AuthService | 24.8% | 95%+ | Partial | P0 |
| TierGateService | 11.3% | 95%+ | Partial | P2 |
| GoogleTokenValidator | 9.6% | 95%+ | Partial | P0 |
| ClubAuthorizationService | 9% | 95%+ | Partial | P2 |
| AppleTokenValidator | 7.3% | 95%+ | Partial | P0 |
| ExternalAuthService | 5.7% | 95%+ | Partial | P0 |
| MemberActivationService | 4% | 95%+ | Partial | P2 |
| WhatsAppService | 3.6% | 95%+ | Partial | P3 |
| EventService | 2.5% | 95%+ | Partial | P2 |
| CommunicationsService | 1.8% | 95%+ | Partial | P3 |

---

## 🎯 Services with 0% Coverage (To Build from Scratch to 95%+)

### **Batch 1: Critical Security & Auth (P0)** ⚠️ HIGHEST PRIORITY

| Service | Current | Lines to Cover | Critical Reason |
|---------|---------|----------------|-----------------|
| **EncryptionService** | 0% | ~200 | Data security, password hashing |
| **AuthorizationService** | 0% | ~300 | Permission checks, access control |

**Impact**: Security vulnerabilities, unauthorized access

### **Batch 2: Payments & Billing (P1)** 💰 FINANCIAL ACCURACY

| Service | Current | Lines to Cover | Critical Reason |
|---------|---------|----------------|-----------------|
| **BillingService** | 0% | ~500 | Stripe integration, subscriptions |
| **EventPaymentService** | 0% | ~600 | Payment processing, refunds |
| **EventPricingService** | 0% | ~400 | Price calculations, tier pricing |
| **EventPaymentAdminService** | 0% | ~300 | Admin payment operations |
| **FinancialExportService** | 0% | ~200 | Financial reporting |

**Impact**: Financial errors, incorrect charges, revenue loss

### **Batch 3: Core Business Logic (P2)** 🎯 CORE FUNCTIONALITY

| Service | Current | Lines to Cover | Critical Reason |
|---------|---------|----------------|-----------------|
| **ClubService** | 0% | ~800 | Club management, tier changes |
| **MemberService** | 0% | ~1000 | Member CRUD, status management |
| **MembershipService** | 0% | ~400 | Membership types, renewals |
| **RsvpService** | 0% | ~500 | RSVP management, capacity |
| **EventSeriesService** | 0% | ~600 | Recurring events |
| **EventCheckinService** | 0% | ~300 | QR code checkin |
| **CustomFieldService** | 0% | ~400 | Custom fields |

**Impact**: Core features broken, data corruption

### **Batch 4: Communications (P3)** 📧 USER ENGAGEMENT

| Service | Current | Lines to Cover | Critical Reason |
|---------|---------|----------------|-----------------|
| **EmailService** | 0% | ~400 | Email sending |
| **CommunicationTemplateService** | 0% | ~500 | Template rendering |
| **CommunicationWorkflowService** | 0% | ~600 | Automation workflows |
| **CommunicationAnalyticsService** | 0% | ~400 | Communication analytics |
| **CommunicationSchedulerService** | 0% | ~300 | Scheduled communications |
| **NotificationService** | 0% | ~500 | Push notifications |
| **ChatService** | 0% | ~400 | Real-time chat |
| **ChatSettingsService** | 0% | ~200 | Chat settings |

**Impact**: Communication failures, user engagement issues

### **Batch 5: Analytics & Reporting (P4)** 📊 DATA ACCURACY

| Service | Current | Lines to Cover | Critical Reason |
|---------|---------|----------------|-----------------|
| **DashboardService** | 0% | ~600 | Dashboard metrics |
| **AdvancedAnalyticsService** | 0% | ~800 | Advanced analytics |
| **EventReportsService** | 0% | ~400 | Event reporting |
| **DataExportService** | 0% | ~500 | Data exports |
| **CrossLocationReportingService** | 0% | ~400 | Multi-location reporting |
| **EventEngagementAnalyticsService** | 0% | ~600 | Engagement metrics |
| **EngagementScoringService** | 0% | ~300 | Engagement scoring |
| **FeatureUsageAnalyticsService** | 0% | ~400 | Feature analytics |

**Impact**: Incorrect analytics, poor decision-making

### **Batch 6: Supporting Services (P5)** 🛠️ INFRASTRUCTURE

| Service | Current | Lines to Cover | Critical Reason |
|---------|---------|----------------|-----------------|
| **AdminService** | 0% | ~500 | Admin operations |
| **AuditService** | 0% | ~400 | Audit logging |
| **AuditLogService** | 0% | ~300 | Audit log management |
| **ComplianceService** | 0% | ~400 | Compliance reporting |
| **DataSanitizationService** | 0% | ~300 | Data sanitization |
| **DirectorySettingsService** | 0% | ~200 | Directory configuration |
| **ErrorLoggingService** | 0% | ~200 | Error logging |
| **BackgroundJobQueueService** | 0% | ~300 | Background jobs |
| **ExportHistoryService** | 0% | ~200 | Export history |
| **FeedbackService** | 0% | ~400 | Feedback management |
| **HierarchicalPermissionsService** | 0% | ~300 | Permission hierarchy |
| **LoginAttemptService** | 6.6% | ~200 | Login tracking |
| **ABTestingService** | 0% | ~500 | A/B testing |
| **EventFeedbackService** | 0% | ~400 | Event feedback |
| **TierAwareCacheService** | 0% | ~300 | Tier-aware caching |

**Impact**: Supporting features broken

---

## 📈 Estimated Work Per Batch

### Batch 1: Security & Auth (2 services)
- **Services**: 2 services at 0%, 5 services to complete
- **Estimated Lines**: ~1,500 lines to cover
- **Estimated Tests**: ~150-200 tests
- **Time**: 1-2 days
- **Risk**: HIGH - security critical

### Batch 2: Payments (5 services)
- **Services**: 5 services at 0%
- **Estimated Lines**: ~2,000 lines to cover
- **Estimated Tests**: ~200-250 tests
- **Time**: 2-3 days
- **Risk**: HIGH - financial accuracy

### Batch 3: Core Logic (7 services)
- **Services**: 7 services (2 at 0%, 5 to complete)
- **Estimated Lines**: ~4,000 lines to cover
- **Estimated Tests**: ~400-500 tests
- **Time**: 3-4 days
- **Risk**: MEDIUM - core functionality

### Batch 4: Communications (8 services)
- **Services**: 8 services (7 at 0%, 1 to complete)
- **Estimated Lines**: ~3,300 lines to cover
- **Estimated Tests**: ~330-400 tests
- **Time**: 2-3 days
- **Risk**: MEDIUM - user engagement

### Batch 5: Analytics (8 services)
- **Services**: 8 services at 0%
- **Estimated Lines**: ~4,000 lines to cover
- **Estimated Tests**: ~400-500 tests
- **Time**: 2-3 days
- **Risk**: LOW - data quality

### Batch 6: Supporting (15 services)
- **Services**: 15 services (14 at 0%, 1 to complete)
- **Estimated Lines**: ~4,700 lines to cover
- **Estimated Tests**: ~470-600 tests
- **Time**: 3-4 days
- **Risk**: LOW - supporting features

---

## 🎯 Revised Timeline to 95% Coverage

### Aggressive Scenario (12-15 days)
- **Week 1**: Batch 1 + Batch 2 (Security + Payments) - Days 1-5
- **Week 2**: Batch 3 + Batch 4 (Core + Communications) - Days 6-11
- **Week 3**: Batch 5 + Batch 6 (Analytics + Supporting) - Days 12-15

### Realistic Scenario (18-22 days)
- **Week 1**: Batch 1 (Security + Auth complete)
- **Week 2**: Batch 2 (Payments complete)
- **Week 3**: Batch 3 (Core Logic 50% complete)
- **Week 4**: Batch 3 complete + Batch 4 start
- **Week 5**: Batch 4 + Batch 5 + Batch 6

### With Bug Fixes (20-25 days)
- Add 2-3 days per batch for bug discovery and fixing
- Assume ~3-5 bugs per 10 services at 0% coverage
- Critical bugs may block for 1-2 days

---

## 📊 Success Metrics

### Per Batch
- ✅ All services in batch at 95%+ line coverage
- ✅ 90%+ branch coverage
- ✅ All bugs found are fixed
- ✅ All tests passing (100% pass rate)
- ✅ Committed to main

### Overall
- ✅ 95%+ overall backend coverage (from 10.6%)
- ✅ 90%+ branch coverage (from 24%)
- ✅ 80%+ method coverage (from 37.2%)
- ✅ Zero known bugs from coverage work
- ✅ 100% test pass rate maintained

---

## 🚀 Next Steps

1. **Start with Batch 1 (Security & Auth)** - IMMEDIATE
   - EncryptionService: 0% → 95%+
   - AuthorizationService: 0% → 95%+
   - Complete AuthService: 24.8% → 95%+
   - Complete ContentSanitizationService: 47.4% → 95%+
   - Complete GoogleTokenValidator: 9.6% → 95%+
   - Complete AppleTokenValidator: 7.3% → 95%+
   - Complete ExternalAuthService: 5.7% → 95%+

2. **Move to Batch 2 (Payments)** - After Batch 1
   - All 5 payment services from 0% to 95%+

3. **Continue through batches 3-6** in priority order

---

*Created*: January 12, 2026
*Based on*: Coverage analysis of backend (10.6% overall)
*Scope*: ~45 services need comprehensive testing
*Estimated Total Tests to Add*: ~2,000-2,500 tests
*Estimated Time to 95%*: 15-25 days
*Status*: **READY TO START BATCH 1** 🚀
