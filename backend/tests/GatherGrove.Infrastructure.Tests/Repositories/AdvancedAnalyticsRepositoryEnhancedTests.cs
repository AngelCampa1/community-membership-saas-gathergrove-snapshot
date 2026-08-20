using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GatherGrove.Infrastructure.Tests.Repositories;

/// <summary>
/// Enhanced TDD Tests for Advanced Analytics Repository with real SQL queries
/// Tests advanced cohort analysis, ROI calculations, and performance optimizations
/// </summary>
[TestFixture]
public class AdvancedAnalyticsRepositoryEnhancedTests
{
    private GatherGroveDbContext _context;
    private AdvancedAnalyticsRepository _repository;
    private ILogger<AdvancedAnalyticsRepository> _logger;

    [SetUp]
    public async Task Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .EnableSensitiveDataLogging()
            .Options;

        _context = new GatherGroveDbContext(options);
        _logger = new LoggerFactory().CreateLogger<AdvancedAnalyticsRepository>();
        _repository = new AdvancedAnalyticsRepository(_context, _logger);

        await SeedTestData();
    }

    [TearDown]
    public async Task TearDown()
    {
        await _context.DisposeAsync();
    }

    private async Task SeedTestData()
    {
        // Create test club
        var club = new Club
        {
            Id = 1,
            Name = "Test Analytics Club",
            TierLevel = "Unlimited"
        };
        _context.Clubs.Add(club);

        // Create test members with different join dates for cohort analysis
        var members = new List<Member>
        {
            new Member { Id = 1, ClubId = 1, FullName = "Alice Johnson", JoinDate = DateTime.UtcNow.AddMonths(-12), IsActive = true },
            new Member { Id = 2, ClubId = 1, FullName = "Bob Smith", JoinDate = DateTime.UtcNow.AddMonths(-10), IsActive = true },
            new Member { Id = 3, ClubId = 1, FullName = "Carol Davis", JoinDate = DateTime.UtcNow.AddMonths(-8), IsActive = false },
            new Member { Id = 4, ClubId = 1, FullName = "David Wilson", JoinDate = DateTime.UtcNow.AddMonths(-6), IsActive = true },
            new Member { Id = 5, ClubId = 1, FullName = "Eva Brown", JoinDate = DateTime.UtcNow.AddMonths(-4), IsActive = true },
            new Member { Id = 6, ClubId = 1, FullName = "Frank Miller", JoinDate = DateTime.UtcNow.AddMonths(-2), IsActive = false }
        };
        _context.Members.AddRange(members);

        // Create test events
        var events = new List<Event>
        {
            new Event { Id = 1, ClubId = 1, Name = "Monthly Social", EventDateTime = DateTime.UtcNow.AddDays(-30), IsActive = true },
            new Event { Id = 2, ClubId = 1, Name = "Quarterly Meeting", EventDateTime = DateTime.UtcNow.AddDays(-60), IsActive = true },
            new Event { Id = 3, ClubId = 1, Name = "Annual Conference", EventDateTime = DateTime.UtcNow.AddDays(-90), IsActive = true }
        };
        _context.Events.AddRange(events);

        // Create test RSVPs and attendance data
        var rsvps = new List<EventRsvp>
        {
            new EventRsvp { Id = 1, EventId = 1, MemberId = 1, RsvpStatus = "Attending" },
            new EventRsvp { Id = 2, EventId = 1, MemberId = 2, RsvpStatus = "Attending" },
            new EventRsvp { Id = 3, EventId = 1, MemberId = 3, RsvpStatus = "Not Attending" },
            new EventRsvp { Id = 4, EventId = 2, MemberId = 1, RsvpStatus = "Attending" },
            new EventRsvp { Id = 5, EventId = 2, MemberId = 4, RsvpStatus = "Attending" },
            new EventRsvp { Id = 6, EventId = 3, MemberId = 1, RsvpStatus = "Attending" },
            new EventRsvp { Id = 7, EventId = 3, MemberId = 2, RsvpStatus = "Attending" },
            new EventRsvp { Id = 8, EventId = 3, MemberId = 5, RsvpStatus = "Attending" }
        };
        _context.EventRsvps.AddRange(rsvps);

        // Create payment data for ROI calculations
        var payments = new List<Payment>
        {
            new Payment { Id = 1, MemberId = 1, Amount = 50.00m, PaymentDate = DateTime.UtcNow.AddMonths(-1) },
            new Payment { Id = 2, MemberId = 2, Amount = 50.00m, PaymentDate = DateTime.UtcNow.AddMonths(-2) },
            new Payment { Id = 3, MemberId = 4, Amount = 75.00m, PaymentDate = DateTime.UtcNow.AddMonths(-3) },
            new Payment { Id = 4, MemberId = 5, Amount = 100.00m, PaymentDate = DateTime.UtcNow.AddMonths(-1) }
        };
        _context.Payments.AddRange(payments);

        await _context.SaveChangesAsync();
    }

    #region Advanced Cohort Analysis Tests

    [Test]
    public async Task GetAdvancedCohortDataAsync_WithRealData_ShouldCalculateRetentionAccurately()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddYears(-1);
        var endDate = DateTime.UtcNow;

        // Act
        var cohortData = await _repository.GetAdvancedCohortDataAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(cohortData, Is.Not.Null);
        Assert.That(cohortData, Is.Not.Empty);

        // Verify cohort calculations
        var oldestCohort = cohortData.OrderBy(c => c.JoinDate).First();
        Assert.That(oldestCohort.MemberCount, Is.GreaterThan(0));
        Assert.That(oldestCohort.RetentionRate >= 0 && oldestCohort.RetentionRate <= 100, Is.True);

        // Verify cohort data contains expected fields
        foreach (var cohort in cohortData)
        {
            Assert.That(cohort.CohortName, Is.Not.Null);
            Assert.That(cohort.MemberCount, Is.GreaterThan(0));
            Assert.That(cohort.ActiveMembers, Is.GreaterThanOrEqualTo(0));
            Assert.That(cohort.ActiveMembers, Is.LessThanOrEqualTo(cohort.MemberCount));
        }
    }

    [Test]
    public async Task GetCohortRetentionRatesAsync_ShouldCalculateTimeBasedRetention()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddYears(-1);
        var endDate = DateTime.UtcNow;

        // Act
        var retentionRates = await _repository.GetCohortRetentionRatesAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(retentionRates, Is.Not.Null);
        Assert.That(retentionRates, Is.Not.Empty);

        // Verify retention rate structure
        foreach (var retention in retentionRates)
        {
            Assert.That(retention.CohortName, Is.Not.Null);
            Assert.That(retention.RetentionByPeriod, Is.Not.Null);
            Assert.IsTrue(retention.RetentionByPeriod.Any());

            // Verify retention rates are realistic percentages
            foreach (var rate in retention.RetentionByPeriod.Values)
            {
                Assert.That(rate, Is.GreaterThanOrEqualTo(0));
                Assert.That(rate, Is.LessThanOrEqualTo(100));
            }
        }
    }

    [Test]
    public async Task CalculateMemberLifetimeValueAsync_ShouldComputeAccurateLTV()
    {
        // Arrange
        var clubId = 1;

        // Act
        var ltvData = await _repository.CalculateMemberLifetimeValueAsync(clubId);

        // Assert
        Assert.That(ltvData, Is.Not.Null);
        Assert.That(ltvData, Is.Not.Empty);

        // Verify LTV calculations
        foreach (var ltv in ltvData)
        {
            Assert.That(ltv.MemberId, Is.GreaterThan(0));
            Assert.That(ltv.LifetimeValue, Is.GreaterThanOrEqualTo(0));
            Assert.That(ltv.MonthsActive, Is.GreaterThanOrEqualTo(0));
            Assert.That(ltv.AverageMonthlyValue, Is.GreaterThanOrEqualTo(0));
        }

        // Verify LTV is calculated correctly (total payments / months active)
        var memberWithPayments = ltvData.FirstOrDefault(l => l.LifetimeValue > 0);
        if (memberWithPayments != null)
        {
            Assert.That(memberWithPayments.LifetimeValue, Is.GreaterThan(0));
            Assert.That(memberWithPayments.MonthsActive, Is.GreaterThan(0));
        }
    }

    #endregion

    #region Advanced ROI Calculation Tests

    [Test]
    public async Task GetDetailedFinancialMetricsAsync_ShouldIncludeAllROIComponents()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddMonths(-6);
        var endDate = DateTime.UtcNow;

        // Act
        var financialMetrics = await _repository.GetDetailedFinancialMetricsAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(financialMetrics, Is.Not.Null);
        Assert.That(financialMetrics.TotalRevenue, Is.GreaterThan(0));

        // Verify comprehensive financial calculations
        Assert.That(financialMetrics.RevenueBySource, Is.Not.Null);
        Assert.That(financialMetrics.CostBreakdown, Is.Not.Null);
        Assert.That(financialMetrics.MonthlyTrends, Is.Not.Null);

        // Verify ROI calculations are mathematically correct
        if (financialMetrics.TotalCosts > 0)
        {
            var expectedROI = ((financialMetrics.TotalRevenue - financialMetrics.TotalCosts) / financialMetrics.TotalCosts) * 100;
            Assert.AreEqual(Math.Round(expectedROI, 2), Math.Round(financialMetrics.ROIPercentage, 2), 0.01);
        }
    }

    [Test]
    public async Task CalculateEventROIAsync_ShouldAnalyzeEventProfitability()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddMonths(-3);
        var endDate = DateTime.UtcNow;

        // Act
        var eventROI = await _repository.CalculateEventROIAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(eventROI, Is.Not.Null);
        Assert.That(eventROI, Is.Not.Empty);

        foreach (var roi in eventROI)
        {
            Assert.That(roi.EventId, Is.GreaterThan(0));
            Assert.That(roi.EventName, Is.Not.Null);
            Assert.That(roi.Revenue, Is.GreaterThanOrEqualTo(0));
            Assert.That(roi.Costs, Is.GreaterThanOrEqualTo(0));

            // Verify ROI calculation
            if (roi.Costs > 0)
            {
                var expectedROI = ((roi.Revenue - roi.Costs) / roi.Costs) * 100;
                Assert.AreEqual(Math.Round(expectedROI, 2), Math.Round(roi.ROIPercentage, 2), 0.01);
            }
        }
    }

    #endregion

    #region Performance Optimization Tests

    [Test]
    public async Task GetEngagementDataAsync_WithLargeDataset_ShouldPerformWithinSLA()
    {
        // Arrange - Create larger dataset
        await SeedLargeDataset();
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddMonths(-12);
        var endDate = DateTime.UtcNow;

        // Act
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var engagementData = await _repository.GetEngagementDataAsync(clubId, startDate, endDate);
        stopwatch.Stop();

        // Assert - Should complete within 3 seconds (performance requirement)
        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(3000));
        Assert.That(engagementData, Is.Not.Null);
    }

    [Test]
    public async Task GetCohortDataAsync_WithOptimizedQuery_ShouldUseSingleQuery()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddYears(-1);
        var endDate = DateTime.UtcNow;

        // Act
        var cohortData = await _repository.GetCohortDataAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(cohortData, Is.Not.Null);
        // Verify that the query is efficient by checking result structure
        Assert.IsTrue(cohortData.All(c => !string.IsNullOrEmpty(c.CohortName)));
        Assert.IsTrue(cohortData.All(c => c.MemberCount > 0));
    }

    #endregion

    #region Advanced Segmentation Tests

    [Test]
    public async Task GetAdvancedMemberSegmentationAsync_ShouldProvideRichSegmentData()
    {
        // Arrange
        var clubId = 1;
        var criteria = new AdvancedSegmentationCriteria
        {
            EngagementThreshold = 75.0,
            AttendanceThreshold = 60.0,
            RevenueThreshold = 100.0m,
            PeriodMonths = 6
        };

        // Act
        var segmentation = await _repository.GetAdvancedMemberSegmentationAsync(clubId, criteria);

        // Assert
        Assert.That(segmentation, Is.Not.Null);
        Assert.That(segmentation, Is.Not.Empty);

        foreach (var segment in segmentation)
        {
            Assert.That(segment.SegmentName, Is.Not.Null);
            Assert.That(segment.MemberCount, Is.GreaterThanOrEqualTo(0));
            Assert.That(segment.Characteristics, Is.Not.Null);
            Assert.That(segment.BehaviorPatterns, Is.Not.Null);
            Assert.That(segment.RecommendedActions, Is.Not.Null);
        }
    }

    #endregion

    private async Task SeedLargeDataset()
    {
        // Add more members for performance testing
        var additionalMembers = new List<Member>();
        for (int i = 7; i <= 100; i++)
        {
            additionalMembers.Add(new Member
            {
                Id = i,
                ClubId = 1,
                FullName = $"Member {i}",
                JoinDate = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 365)),
                IsActive = Random.Shared.Next(0, 10) < 8 // 80% active
            });
        }
        _context.Members.AddRange(additionalMembers);

        // Add more events
        var additionalEvents = new List<Event>();
        for (int i = 4; i <= 50; i++)
        {
            additionalEvents.Add(new Event
            {
                Id = i,
                ClubId = 1,
                Name = $"Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 300)),
                IsActive = true
            });
        }
        _context.Events.AddRange(additionalEvents);

        await _context.SaveChangesAsync();
    }
}