# Backend Test Coverage - Phase 5 Plan
## Infrastructure Layer Enhancement

**Created**: January 12, 2026
**Status**: Planning
**Current Infrastructure Tests**: 482 passing (0 failing, 3 skipped)

---

## 📊 Current Infrastructure Coverage Analysis

### ✅ Well-Tested Components (482 tests)

#### Repositories (Excellent Coverage)
- ✅ AdvancedAnalyticsRepository - 50+ tests
- ✅ TierAwareAnalyticsRepository - 20+ tests
- ✅ AttendanceRepository - 30+ tests
- ✅ BrandingRepository - 25+ tests
- ✅ ClubRepository - 40+ tests
- ✅ EventFeedbackRepository - 35+ tests
- ✅ EventSeriesRepository - 30+ tests
- ✅ EventSessionRepository - 30+ tests
- ✅ FinancialRepository - 40+ tests
- ✅ MemberRepository - 50+ tests
- ✅ MultiSessionEventRepository - 30+ tests
- ✅ ScheduledReportRepository - 25+ tests
- ✅ WaitlistRepository - 30+ tests

#### Services (Good Coverage)
- ✅ ClubTierService - 20+ tests
- ✅ ClubAuthorizationService - 15+ tests
- ✅ FileStorageService - 25+ tests (Azure Blob mock integration)
- ✅ LegacyNotificationService - 10+ tests
- ✅ TierGateService - 15+ tests

#### Authorization (Good Coverage)
- ✅ UnlimitedTierRequirementHandler - 10+ tests

#### Extensions & Utilities
- ✅ TierQueryExtensions - 15+ tests

#### Migrations
- ✅ AddEventPricingMigration - Tests exist
- ✅ AddPaymentTokenMigration - Tests exist

---

## 🎯 Phase 5 Priorities - Infrastructure Gaps

### Priority 1: DbContext & Entity Configuration Tests (HIGH IMPACT)

**Gap**: No comprehensive tests for GatherGroveDbContext
**Impact**: Critical - DbContext is the foundation of data access
**Estimated Tests**: 40-50 tests

**Test Areas**:
1. **Entity Configuration** (15 tests)
   - Entity relationships (one-to-many, many-to-many)
   - Foreign key constraints
   - Index definitions
   - Default values and computed columns
   - Cascade delete behavior

2. **Transaction Management** (10 tests)
   - Successful transaction commit
   - Rollback on error
   - Nested transactions
   - Concurrent transaction handling
   - Deadlock detection

3. **Change Tracking** (10 tests)
   - Entity state changes (Added, Modified, Deleted)
   - Optimistic concurrency (RowVersion)
   - Detached entity handling
   - Audit fields (CreatedAt, UpdatedAt)

4. **Query Performance** (10 tests)
   - Include/ThenInclude eager loading
   - Select projections for performance
   - AsNoTracking for read-only queries
   - Compiled queries for frequently-used patterns

5. **Seeding & Initialization** (5 tests)
   - Database initialization
   - Seed data creation
   - Migration application

**File to Create**: `backend/tests/GatherGrove.Infrastructure.Tests/Data/GatherGroveDbContextTests.cs`

---

### Priority 2: Integration Tests for Complex Scenarios (MEDIUM IMPACT)

**Gap**: Some repositories tested in isolation, need end-to-end scenarios
**Impact**: Medium - Validates real-world usage patterns
**Estimated Tests**: 30 tests

**Test Areas**:
1. **Cross-Repository Operations** (10 tests)
   - Event creation → RSVP → Payment → Attendance (full flow)
   - Member creation → Membership type assignment → Dues tracking
   - Waitlist promotion → Notification → RSVP confirmation
   - Event feedback → Survey response → Analytics aggregation

2. **Performance & Bulk Operations** (10 tests)
   - Bulk member import (100+ members)
   - Bulk event creation (50+ events)
   - Large dataset queries (pagination, filtering)
   - N+1 query prevention validation

3. **Data Integrity & Constraints** (10 tests)
   - Unique constraint violations
   - Required field validation
   - Foreign key constraint enforcement
   - Check constraint validation

**File to Create**: `backend/tests/GatherGrove.Infrastructure.Tests/Integration/RepositoryIntegrationTests.cs`

---

### Priority 3: Dependency Injection & Service Registration (LOW IMPACT)

**Gap**: No tests for DependencyInjection.cs
**Impact**: Low - But important for configuration validation
**Estimated Tests**: 15 tests

**Test Areas**:
1. **Service Registration** (8 tests)
   - All repositories registered
   - All services registered
   - Scoped vs Singleton vs Transient lifetimes correct
   - Interface→Implementation mappings correct

2. **Configuration Validation** (7 tests)
   - Database connection string required
   - Azure Storage configuration optional
   - Stripe configuration validation
   - Application Insights setup

**File to Create**: `backend/tests/GatherGrove.Infrastructure.Tests/DependencyInjectionTests.cs`

---

### Priority 4: Middleware & Background Services (OPTIONAL)

**Gap**: Limited middleware testing in infrastructure
**Impact**: Low - Most middleware tested in API layer
**Estimated Tests**: 10 tests

**Test Areas**:
1. **Background Services** (if any in Infrastructure layer)
2. **Custom Middleware Components**
3. **Health Checks**

---

## 📈 Phase 5 Success Metrics

| Metric | Current | Target | Impact |
|--------|---------|--------|--------|
| **Infrastructure Tests** | 482 | 577+ | +95 tests (+20%) |
| **DbContext Coverage** | 0% | 90%+ | NEW critical area |
| **Integration Tests** | Limited | 30+ | NEW end-to-end scenarios |
| **Overall Pass Rate** | 100% | 100% | Maintain excellence |

---

## 🗓️ Phase 5 Implementation Plan

### Week 1: DbContext Tests (Priority 1)
- **Day 1-2**: Entity Configuration tests (15 tests)
- **Day 3**: Transaction Management tests (10 tests)
- **Day 4**: Change Tracking tests (10 tests)
- **Day 5**: Query Performance tests (10 tests)
- **Day 6**: Seeding & Initialization tests (5 tests)
- **Day 7**: Review, fix issues, commit

**Deliverable**: 50 new DbContext tests, 100% passing

### Week 2: Integration Tests (Priority 2)
- **Day 1-2**: Cross-Repository Operations (10 tests)
- **Day 3-4**: Performance & Bulk Operations (10 tests)
- **Day 5**: Data Integrity & Constraints (10 tests)
- **Day 6-7**: Review, optimize, commit

**Deliverable**: 30 new integration tests, 100% passing

### Week 3: DependencyInjection Tests (Priority 3) - OPTIONAL
- **Day 1-2**: Service Registration tests (8 tests)
- **Day 3**: Configuration Validation tests (7 tests)
- **Day 4-5**: Buffer for any issues, documentation
- **Day 6-7**: Final review, campaign wrap-up

**Deliverable**: 15 new DI tests, comprehensive documentation

---

## 🎯 Testing Patterns for Phase 5

### DbContext Testing Pattern
```csharp
[TestFixture]
public class GatherGroveDbContextTests
{
    private DbContextOptions<GatherGroveDbContext> _options;
    private GatherGroveDbContext _context;

    [SetUp]
    public void SetUp()
    {
        _options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new GatherGroveDbContext(_options);
    }

    [Test]
    public void EntityConfiguration_ClubToMembers_OneToManyRelationship()
    {
        // Arrange
        var club = new Club { Name = "Test Club" };
        var member1 = new Member { Club = club, FullName = "Member 1" };
        var member2 = new Member { Club = club, FullName = "Member 2" };

        // Act
        _context.Clubs.Add(club);
        _context.SaveChanges();

        // Assert
        var loadedClub = _context.Clubs
            .Include(c => c.Members)
            .First(c => c.Id == club.Id);

        loadedClub.Members.Should().HaveCount(2);
    }
}
```

### Integration Testing Pattern
```csharp
[TestFixture]
public class RepositoryIntegrationTests : IntegrationTestBase
{
    [Test]
    public async Task EventRegistrationFlow_FromCreationToAttendance_WorksEndToEnd()
    {
        // Arrange - Create event
        var eventRepo = new EventRepository(_context);
        var rsvpRepo = new RsvpRepository(_context);
        var attendanceRepo = new AttendanceRepository(_context);

        // Act - Full flow
        var eventEntity = await eventRepo.CreateAsync(/* ... */);
        var rsvp = await rsvpRepo.CreateAsync(/* ... */);
        await attendanceRepo.CheckInAsync(/* ... */);

        // Assert - Verify complete flow
        var attendanceRecord = await attendanceRepo.GetByMemberAndEventAsync(/* ... */);
        attendanceRecord.Should().NotBeNull();
        attendanceRecord.CheckedInAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }
}
```

---

## ✅ Definition of Done - Phase 5

Phase 5 is complete when:
- [ ] 50+ DbContext tests added and passing (100%)
- [ ] 30+ Integration tests added and passing (100%)
- [ ] 15+ DependencyInjection tests added (optional, if time permits)
- [ ] All new tests follow TDD principles
- [ ] Test documentation updated in BACKEND-COVERAGE-STATUS.md
- [ ] All tests committed with proper commit messages
- [ ] Pushed to main branch
- [ ] Infrastructure test count: 577+ (from 482)
- [ ] Overall backend pass rate: 100% maintained

---

## 📝 Notes

### Why Focus on DbContext?
- **Foundation**: All data access goes through DbContext
- **Bug Prevention**: Relationship configuration bugs cause production issues
- **Performance**: Query optimization prevents N+1 queries
- **Currently Untested**: 0 tests for this critical component

### Why Integration Tests?
- **Real-World Validation**: Unit tests don't catch integration issues
- **End-to-End Confidence**: Validates complete user flows
- **Cross-Repository**: Tests services working together

### Why DependencyInjection Tests?
- **Configuration Bugs**: Wrong lifetime = production issues
- **Startup Failures**: Missing registrations fail at runtime
- **Documentation**: Tests serve as registration documentation

---

*Created*: January 12, 2026
*Author*: Backend Coverage Campaign - Phase 5 Planning
*Status*: Ready for Implementation
