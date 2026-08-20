using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace GatherGrove.Tests.Application.Services;

/// <summary>
/// Comprehensive test suite for SegmentAnalyticsService
/// Tests segment performance metrics, analytics, and reporting
/// </summary>
public class SegmentAnalyticsServiceTests : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly Mock<ILogger<SegmentAnalyticsService>> _loggerMock;
    private readonly SegmentAnalyticsService _service;

    public SegmentAnalyticsServiceTests()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _loggerMock = new Mock<ILogger<SegmentAnalyticsService>>();
        _service = new SegmentAnalyticsService(_context, _loggerMock.Object);

        SeedTestData();
    }

    [Fact]
    public async Task GetSegmentAnalyticsAsync_ValidSegmentId_ShouldReturnAnalytics()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetSegmentAnalyticsAsync(clubId, segmentId, userId);

        // Assert
        result.Should().NotBeNull();
        result.SegmentId.Should().Be(segmentId);
        result.MemberCount.Should().BeGreaterThan(0);
        result.EngagementScore.Should().BeInRange(0, 100);
    }

    [Fact]
    public async Task GetAllSegmentAnalyticsAsync_ValidClubId_ShouldReturnAllAnalytics()
    {
        // Arrange
        const int clubId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetAllSegmentAnalyticsAsync(clubId, userId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThan(0);
        result.All(a => a.SegmentId > 0).Should().BeTrue();
    }

    [Fact]
    public async Task CalculateSegmentEngagementAsync_ValidSegmentId_ShouldCalculateEngagement()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;

        // Act
        var result = await _service.CalculateSegmentEngagementAsync(clubId, segmentId, userId);

        // Assert
        result.Should().BeInRange(0, 100);
    }

    [Fact]
    public async Task CalculateEventAttendanceRateAsync_ValidSegmentId_ShouldCalculateAttendance()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;
        const int days = 30;

        // Act
        var result = await _service.CalculateEventAttendanceRateAsync(clubId, segmentId, userId, days);

        // Assert
        result.Should().BeInRange(0, 100);
    }

    [Fact]
    public async Task CalculatePaymentComplianceRateAsync_ValidSegmentId_ShouldCalculateCompliance()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;
        const int days = 30;

        // Act
        var result = await _service.CalculatePaymentComplianceRateAsync(clubId, segmentId, userId, days);

        // Assert
        result.Should().BeInRange(0, 100);
    }

    [Fact]
    public async Task GetSegmentPerformanceMetricsAsync_ValidSegmentId_ShouldReturnMetrics()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetSegmentPerformanceMetricsAsync(clubId, segmentId, userId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThan(0);
        result.All(m => m.SegmentId == segmentId).Should().BeTrue();
    }

    [Fact]
    public async Task CreatePerformanceMetricAsync_ValidRequest_ShouldCreateMetric()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;
        var request = new CreateSegmentPerformanceMetricRequest
        {
            MetricName = "Custom Engagement Score",
            MetricValue = 85.5,
            MetricType = "PERCENTAGE",
            Description = "Custom calculated engagement score"
        };

        // Act
        var result = await _service.CreatePerformanceMetricAsync(clubId, segmentId, userId, request);

        // Assert
        result.Should().NotBeNull();
        result.MetricName.Should().Be(request.MetricName);
        result.MetricValue.Should().Be(request.MetricValue);
        result.MetricType.Should().Be(request.MetricType);
        result.SegmentId.Should().Be(segmentId);
    }

    [Fact]
    public async Task UpdatePerformanceMetricAsync_ValidRequest_ShouldUpdateMetric()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int metricId = 1;
        const int userId = 1;
        var request = new UpdateSegmentPerformanceMetricRequest
        {
            MetricName = "Updated Engagement Score",
            MetricValue = 90.0,
            Description = "Updated engagement score"
        };

        // Act
        var result = await _service.UpdatePerformanceMetricAsync(clubId, segmentId, metricId, userId, request);

        // Assert
        result.Should().NotBeNull();
        result.MetricName.Should().Be(request.MetricName);
        result.MetricValue.Should().Be(request.MetricValue);
        result.Description.Should().Be(request.Description);
    }

    [Fact]
    public async Task DeletePerformanceMetricAsync_ValidMetricId_ShouldDeleteSuccessfully()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int metricId = 2; // Metric without dependencies
        const int userId = 1;

        // Act
        var result = await _service.DeletePerformanceMetricAsync(clubId, segmentId, metricId, userId);

        // Assert
        result.Should().BeTrue();

        // Verify metric is actually deleted
        var metric = await _context.SegmentPerformanceMetrics.FindAsync(metricId);
        metric.Should().BeNull();
    }

    [Fact]
    public async Task GetSegmentComparisonAsync_ValidSegmentIds_ShouldReturnComparison()
    {
        // Arrange
        const int clubId = 1;
        const int userId = 1;
        var segmentIds = new List<int> { 1, 2 };

        // Act
        var result = await _service.GetSegmentComparisonAsync(clubId, segmentIds, userId);

        // Assert
        result.Should().NotBeNull();
        result.SegmentComparisons.Should().HaveCount(segmentIds.Count);
        result.ComparisonMetrics.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetSegmentTrendsAsync_ValidSegmentId_ShouldReturnTrends()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;
        const int days = 30;

        // Act
        var result = await _service.GetSegmentTrendsAsync(clubId, segmentId, userId, days);

        // Assert
        result.Should().NotBeNull();
        result.SegmentId.Should().Be(segmentId);
        result.TrendData.Should().NotBeEmpty();
        result.GrowthRate.Should().BeOfType<double>();
    }

    [Fact]
    public async Task GenerateSegmentReportAsync_ValidRequest_ShouldGenerateReport()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;
        var request = new GenerateSegmentReportRequest
        {
            ReportType = "COMPREHENSIVE",
            DateRange = 30,
            IncludeMetrics = true,
            IncludeTrends = true,
            IncludeComparisons = false,
            Format = "PDF"
        };

        // Act
        var result = await _service.GenerateSegmentReportAsync(clubId, segmentId, userId, request);

        // Assert
        result.Should().NotBeNull();
        result.ReportId.Should().NotBeEmpty();
        result.Status.Should().Be("COMPLETED");
        result.ReportData.Should().NotBeNull();
    }

    [Fact]
    public async Task RefreshSegmentAnalyticsAsync_ValidSegmentId_ShouldRefreshAnalytics()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;

        // Act
        var result = await _service.RefreshSegmentAnalyticsAsync(clubId, segmentId, userId);

        // Assert
        result.Should().BeTrue();

        // Verify analytics were updated
        var analytics = await _context.SegmentAnalytics
            .FirstOrDefaultAsync(a => a.SegmentId == segmentId);
        analytics.Should().NotBeNull();
        analytics.LastCalculated.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(10));
    }

    [Fact]
    public async Task GetSegmentInsightsAsync_ValidSegmentId_ShouldReturnInsights()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetSegmentInsightsAsync(clubId, segmentId, userId);

        // Assert
        result.Should().NotBeNull();
        result.SegmentId.Should().Be(segmentId);
        result.Insights.Should().NotBeEmpty();
        result.Recommendations.Should().NotBeEmpty();
    }

    [Theory]
    [InlineData("COUNT")]
    [InlineData("PERCENTAGE")]
    [InlineData("AVERAGE")]
    [InlineData("SUM")]
    [InlineData("RATIO")]
    public async Task CalculateMetricByTypeAsync_DifferentMetricTypes_ShouldCalculateCorrectly(string metricType)
    {
        // Arrange
        const int segmentId = 1;
        const string metricName = "Test Metric";

        // Act
        var result = await _service.CalculateMetricByTypeAsync(segmentId, metricName, metricType);

        // Assert
        result.Should().BeOfType<double>();
        result.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task GetSegmentHealthScoreAsync_ValidSegmentId_ShouldReturnHealthScore()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetSegmentHealthScoreAsync(clubId, segmentId, userId);

        // Assert
        result.Should().NotBeNull();
        result.SegmentId.Should().Be(segmentId);
        result.OverallHealthScore.Should().BeInRange(0, 100);
        result.HealthIndicators.Should().NotBeEmpty();
    }

    [Fact]
    public async Task ScheduleAnalyticsRefreshAsync_ValidSegmentId_ShouldScheduleRefresh()
    {
        // Arrange
        const int clubId = 1;
        const int segmentId = 1;
        const int userId = 1;
        var schedule = new AnalyticsRefreshSchedule
        {
            FrequencyType = "DAILY",
            FrequencyValue = 1,
            NextRefreshTime = DateTime.UtcNow.AddDays(1)
        };

        // Act
        var result = await _service.ScheduleAnalyticsRefreshAsync(clubId, segmentId, userId, schedule);

        // Assert
        result.Should().BeTrue();
    }

    private void SeedTestData()
    {
        // Create test club
        var club = new Club
        {
            Id = 1,
            ClubName = "Test Club",
            CreatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);

        // Create test user
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            FullName = "Test User"
        };
        _context.Users.Add(user);

        // Create test membership type
        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            TypeName = "Standard",
            MembershipFee = 50.0m
        };
        _context.MembershipTypes.Add(membershipType);

        // Create test members
        var member1 = new Member
        {
            Id = 1,
            ClubId = 1,
            MembershipTypeId = 1,
            FullName = "Test Member 1",
            Email = "member1@example.com",
            IsActive = true
        };
        var member2 = new Member
        {
            Id = 2,
            ClubId = 1,
            MembershipTypeId = 1,
            FullName = "Test Member 2",
            Email = "member2@example.com",
            IsActive = true
        };
        _context.Members.AddRange(member1, member2);

        // Create test segments
        var segment1 = new MemberSegment
        {
            Id = 1,
            ClubId = 1,
            Name = "Active Members",
            Description = "Members who are currently active",
            FilterCriteria = "{\"rules\":[{\"fieldName\":\"IsActive\",\"operator\":\"EQUALS\",\"value\":\"true\"}]}",
            CreatedByUserId = 1,
            MemberCount = 2
        };
        var segment2 = new MemberSegment
        {
            Id = 2,
            ClubId = 1,
            Name = "Premium Members",
            Description = "Members with premium membership",
            FilterCriteria = "{\"rules\":[{\"fieldName\":\"MembershipTypeId\",\"operator\":\"EQUALS\",\"value\":\"1\"}]}",
            CreatedByUserId = 1,
            MemberCount = 1
        };
        _context.MemberSegments.AddRange(segment1, segment2);

        // Create test segment analytics
        var analytics1 = new SegmentAnalytics
        {
            Id = 1,
            SegmentId = 1,
            MemberCount = 2,
            EngagementScore = 85.5,
            EventAttendanceRate = 75.0,
            PaymentComplianceRate = 95.0,
            LastCalculated = DateTime.UtcNow.AddDays(-1)
        };
        var analytics2 = new SegmentAnalytics
        {
            Id = 2,
            SegmentId = 2,
            MemberCount = 1,
            EngagementScore = 90.0,
            EventAttendanceRate = 80.0,
            PaymentComplianceRate = 100.0,
            LastCalculated = DateTime.UtcNow.AddDays(-1)
        };
        _context.SegmentAnalytics.AddRange(analytics1, analytics2);

        // Create test performance metrics
        var metric1 = new SegmentPerformanceMetric
        {
            Id = 1,
            SegmentId = 1,
            MetricName = "Average Event Attendance",
            MetricValue = 75.0,
            MetricType = "PERCENTAGE",
            CalculatedAt = DateTime.UtcNow.AddDays(-1)
        };
        var metric2 = new SegmentPerformanceMetric
        {
            Id = 2,
            SegmentId = 1,
            MetricName = "Member Retention Rate",
            MetricValue = 92.0,
            MetricType = "PERCENTAGE",
            CalculatedAt = DateTime.UtcNow.AddDays(-1)
        };
        _context.SegmentPerformanceMetrics.AddRange(metric1, metric2);

        // Create test events for analytics calculations
        var event1 = new Event
        {
            Id = 1,
            ClubId = 1,
            EventTitle = "Test Event 1",
            EventDateTime = DateTime.UtcNow.AddDays(-7),
            IsActive = true
        };
        _context.Events.Add(event1);

        // Create test event RSVPs
        var rsvp1 = new EventRsvp
        {
            Id = 1,
            EventId = 1,
            MemberId = 1,
            RsvpStatus = "Attending",
            CheckedIn = true
        };
        var rsvp2 = new EventRsvp
        {
            Id = 2,
            EventId = 1,
            MemberId = 2,
            RsvpStatus = "Attending",
            CheckedIn = false
        };
        _context.EventRsvps.AddRange(rsvp1, rsvp2);

        // Create test payments for compliance calculations
        var payment1 = new Payment
        {
            Id = 1,
            MemberId = 1,
            PaymentAmount = 50.0m,
            PaymentDate = DateTime.UtcNow.AddDays(-15),
            PaymentStatus = "Completed"
        };
        _context.Payments.Add(payment1);

        // Create club admin relationship
        var clubAdmin = new ClubAdmin
        {
            ClubId = 1,
            UserId = 1
        };
        _context.ClubAdmins.Add(clubAdmin);

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}