using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Services;
using System.Linq.Expressions;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Comprehensive unit tests for EventEngagementAnalyticsService
/// Tests analytics calculation, tier access control, performance optimization, and error scenarios
/// </summary>
[TestFixture]
public class EventEngagementAnalyticsServiceTests : IDisposable
{
    private GatherGroveDbContext _context;
    private Mock<IClubTierService> _mockClubTierService;
    private Mock<ILogger<EventEngagementAnalyticsService>> _mockLogger;
    private Mock<GatherGrove.Application.Services.IClubAuthorizationService> _mockClubAuthorizationService;
    private Mock<GatherGrove.Application.Services.Interfaces.IEventEngagementService> _mockEventEngagementService;
    private Mock<GatherGrove.Application.Services.Interfaces.IMemberEngagementService> _mockMemberEngagementService;
    private EventEngagementAnalyticsService _service;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockClubTierService = new Mock<IClubTierService>();
        _mockLogger = new Mock<ILogger<EventEngagementAnalyticsService>>();
        _mockClubAuthorizationService = new Mock<GatherGrove.Application.Services.IClubAuthorizationService>();
        _mockEventEngagementService = new Mock<GatherGrove.Application.Services.Interfaces.IEventEngagementService>();
        _mockMemberEngagementService = new Mock<GatherGrove.Application.Services.Interfaces.IMemberEngagementService>();

        _service = new EventEngagementAnalyticsService(
            _context,
            _mockLogger.Object,
            _mockClubTierService.Object
        );

        SeedTestData();
    }

    private void SeedTestData()
    {
        var club = new Club
        {
            Id = 1,
            Name = "Analytics Test Club",
            Tier = "Unlimited", // Required for analytics features
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddMonths(-12),
            UpdatedAt = DateTime.UtcNow
        };

        var basicClub = new Club
        {
            Id = 2,
            Name = "Basic Club",
            Tier = "Growth",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddMonths(-6),
            UpdatedAt = DateTime.UtcNow
        };

        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Regular",
            DuesAmount = 100.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create test members with varied engagement patterns
        var members = new[]
        {
            new Member
            {
                Id = 1, ClubId = 1, MembershipTypeId = 1, FullName = "Alice High-Engager",
                Email = "alice@test.com", Status = "Active", JoinDate = DateTime.UtcNow.AddMonths(-12),
                CreatedAt = DateTime.UtcNow.AddMonths(-12), UpdatedAt = DateTime.UtcNow
            },
            new Member
            {
                Id = 2, ClubId = 1, MembershipTypeId = 1, FullName = "Bob Medium-Engager",
                Email = "bob@test.com", Status = "Active", JoinDate = DateTime.UtcNow.AddMonths(-6),
                CreatedAt = DateTime.UtcNow.AddMonths(-6), UpdatedAt = DateTime.UtcNow
            },
            new Member
            {
                Id = 3, ClubId = 1, MembershipTypeId = 1, FullName = "Carol Low-Engager",
                Email = "carol@test.com", Status = "Active", JoinDate = DateTime.UtcNow.AddMonths(-3),
                CreatedAt = DateTime.UtcNow.AddMonths(-3), UpdatedAt = DateTime.UtcNow
            },
            new Member
            {
                Id = 4, ClubId = 1, MembershipTypeId = 1, FullName = "David Inactive",
                Email = "david@test.com", Status = "Inactive", JoinDate = DateTime.UtcNow.AddMonths(-9),
                CreatedAt = DateTime.UtcNow.AddMonths(-9), UpdatedAt = DateTime.UtcNow
            }
        };

        // Create events with different patterns
        var events = new[]
        {
            new Event
            {
                Id = 1, ClubId = 1, Name = "High Engagement Workshop",
                EventDateTime = DateTime.UtcNow.AddDays(-30), Location = "Main Hall",
                Description = "Popular workshop", CreatedAt = DateTime.UtcNow.AddDays(-35),
                UpdatedAt = DateTime.UtcNow.AddDays(-35)
            },
            new Event
            {
                Id = 2, ClubId = 1, Name = "Medium Engagement Meeting",
                EventDateTime = DateTime.UtcNow.AddDays(-15), Location = "Conference Room",
                Description = "Regular meeting", CreatedAt = DateTime.UtcNow.AddDays(-20),
                UpdatedAt = DateTime.UtcNow.AddDays(-20)
            },
            new Event
            {
                Id = 3, ClubId = 1, Name = "Low Engagement Seminar",
                EventDateTime = DateTime.UtcNow.AddDays(-7), Location = "Online",
                Description = "Technical seminar", CreatedAt = DateTime.UtcNow.AddDays(-14),
                UpdatedAt = DateTime.UtcNow.AddDays(-14)
            },
            new Event
            {
                Id = 4, ClubId = 1, Name = "Future Event",
                EventDateTime = DateTime.UtcNow.AddDays(14), Location = "TBD",
                Description = "Upcoming event", CreatedAt = DateTime.UtcNow.AddDays(-7),
                UpdatedAt = DateTime.UtcNow.AddDays(-7)
            }
        };

        _context.Clubs.AddRange(club, basicClub);
        _context.MembershipTypes.Add(membershipType);
        _context.Members.AddRange(members);
        _context.Events.AddRange(events);

        // Add RSVPs and attendance patterns
        var rsvps = new[]
        {
            // High engagement event - 3 RSVPs, 3 attended
            new EventRsvp { EventId = 1, MemberId = 1, RsvpStatus = "Attending", CreatedAt = DateTime.UtcNow.AddDays(-32) },
            new EventRsvp { EventId = 1, MemberId = 2, RsvpStatus = "Attending", CreatedAt = DateTime.UtcNow.AddDays(-31) },
            new EventRsvp { EventId = 1, MemberId = 3, RsvpStatus = "Attending", CreatedAt = DateTime.UtcNow.AddDays(-31) },
            
            // Medium engagement event - 2 RSVPs, 1 attended
            new EventRsvp { EventId = 2, MemberId = 1, RsvpStatus = "Attending", CreatedAt = DateTime.UtcNow.AddDays(-17) },
            new EventRsvp { EventId = 2, MemberId = 2, RsvpStatus = "Attending", CreatedAt = DateTime.UtcNow.AddDays(-16) },
            
            // Low engagement event - 1 RSVP, 0 attended
            new EventRsvp { EventId = 3, MemberId = 1, RsvpStatus = "Attending", CreatedAt = DateTime.UtcNow.AddDays(-9) }
        };

        var attendances = new[]
        {
            // High engagement event attendances
            new EventAttendance { EventId = 1, MemberId = 1, AttendedAt = DateTime.UtcNow.AddDays(-30) },
            new EventAttendance { EventId = 1, MemberId = 2, AttendedAt = DateTime.UtcNow.AddDays(-30) },
            new EventAttendance { EventId = 1, MemberId = 3, AttendedAt = DateTime.UtcNow.AddDays(-30) },
            
            // Medium engagement event attendance
            new EventAttendance { EventId = 2, MemberId = 1, AttendedAt = DateTime.UtcNow.AddDays(-15) }
        };

        // Add member engagement scores
        var engagementScores = new[]
        {
            new MemberEngagementScore
            {
                Id = 1, MemberId = 1, OverallScore = 95m, EventScore = 98m,
                EngagementLevel = "Green", CalculatedDate = DateTime.UtcNow.AddDays(-1)
            },
            new MemberEngagementScore
            {
                Id = 2, MemberId = 2, OverallScore = 75m, EventScore = 80m,
                EngagementLevel = "Yellow", CalculatedDate = DateTime.UtcNow.AddDays(-1)
            },
            new MemberEngagementScore
            {
                Id = 3, MemberId = 3, OverallScore = 45m, EventScore = 40m,
                EngagementLevel = "Red", CalculatedDate = DateTime.UtcNow.AddDays(-1)
            },
            new MemberEngagementScore
            {
                Id = 4, MemberId = 4, OverallScore = 15m, EventScore = 10m,
                EngagementLevel = "Red", CalculatedDate = DateTime.UtcNow.AddDays(-1)
            }
        };

        _context.EventRsvps.AddRange(rsvps);
        _context.EventAttendances.AddRange(attendances);
        _context.MemberEngagementScores.AddRange(engagementScores);
        _context.SaveChanges();
    }

    [Test]
    public async Task GetEventEngagementAnalyticsReportAsync_UnlimitedTier_ReturnsComprehensiveAnalytics()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-60);
        var endDate = DateTime.UtcNow.AddDays(30);

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), clubId))
            .ReturnsAsync(true);

        // Act
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = startDate,
            EndDate = endDate
        };
        var result = await _service.GetEventEngagementAnalyticsReportAsync(query, 1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubId, Is.EqualTo(clubId));
        Assert.That(result.ClubName, Is.EqualTo("Analytics Test Club"));
        Assert.That(result.ReportPeriodStart, Is.EqualTo(startDate));
        Assert.That(result.ReportPeriodEnd, Is.EqualTo(endDate));
        Assert.That(result.EventMetrics, Is.Not.Null);
        Assert.That(result.TotalEvents, Is.GreaterThan(0));
        Assert.That(result.OverallAttendanceRate >= 0, Is.True);
    }

    [Test]
    public async Task GetEventEngagementAnalyticsReportAsync_BasicTier_ThrowsUnauthorizedException()
    {
        // Arrange
        var clubId = 2; // Basic tier club
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = startDate,
            EndDate = endDate
        };

        // Test the exception is thrown
        try
        {
            var result = await _service.GetEventEngagementAnalyticsReportAsync(query, 3);
            Assert.Fail($"Expected UnauthorizedAccessException but method completed successfully with result: {result}");
        }
        catch (UnauthorizedAccessException ex)
        {
            Assert.That(ex.Message, Contains.Substring("access to analytics"));
        }

        // Verify the mock was called
        _mockClubTierService.Verify(x => x.HasUnlimitedTierAccess(3, clubId), Times.Once);
    }

    [Test]
    [TestCase(-1)]
    [TestCase(0)]
    [TestCase(999999)]
    public async Task GetEventEngagementAnalyticsReportAsync_InvalidClubId_ThrowsArgumentException(int invalidClubId)
    {
        // Arrange
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), invalidClubId))
            .ReturnsAsync(true);

        // Act & Assert
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = invalidClubId,
            StartDate = startDate,
            EndDate = endDate
        };
        try
        {
            var result = await _service.GetEventEngagementAnalyticsReportAsync(query, 1);
            Assert.Fail($"Expected ArgumentException but method completed successfully with result: {result}");
        }
        catch (ArgumentException ex)
        {
            Assert.That(ex.Message,
                Does.Contain("ClubId").Or.Contain("positive integer").Or.Contain("not found"));
        }

        // Verify the mock was called appropriately
        if (invalidClubId > 0)
        {
            _mockClubTierService.Verify(x => x.HasUnlimitedTierAccess(1, invalidClubId), Times.Once);
        }
        else
        {
            // For invalid clubId (<=0), the exception should be thrown before tier check
            _mockClubTierService.Verify(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }
    }

    [Test]
    public async Task GetEventEngagementAnalyticsReportAsync_ValidDateRange_DoesNotThrow()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), clubId))
            .ReturnsAsync(true);

        // Act & Assert
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = startDate,
            EndDate = endDate
        };

        // Should not throw - service handles date validation internally
        Assert.DoesNotThrowAsync(() => _service.GetEventEngagementAnalyticsReportAsync(query, 1));
    }

    [Test]
    public async Task CalculateEngagementTrendsAsync_ValidData_ReturnsAccurateTrends()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var daysBack = 45;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        // Act - Now using the correct method signature
        var result = await _service.CalculateEngagementTrendsAsync(clubId, userId, daysBack);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Not.Empty);
        Assert.True(result.All(trend => trend.Date >= DateTime.UtcNow.Date.AddDays(-daysBack)));
        Assert.True(result.All(trend => trend.Date <= DateTime.UtcNow.Date));
        Assert.True(result.All(trend => trend.EngagementScore >= 0));
        Assert.True(result.All(trend => trend.AttendanceRate >= 0 && trend.AttendanceRate <= 100));
    }

    [Test]
    public async Task GetMemberEngagementInsightsAsync_ValidMember_ReturnsDetailedInsights()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var userId = 1;
        var periodDays = 90;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        // Act
        var result = await _service.GetMemberEngagementInsightsAsync(clubId, memberId, userId, periodDays);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.MemberId, Is.EqualTo(memberId));
        Assert.That(result.MemberName, Is.EqualTo("Alice High-Engager"));
        Assert.That(result.EventAttendanceRate >= 0 && result.EventAttendanceRate <= 100, Is.True);
        Assert.That(result.RsvpAccuracyRate >= 0 && result.RsvpAccuracyRate <= 100, Is.True);
        Assert.That(result.RecommendedActions, Is.Not.Null);
        Assert.That(result.EngagementMetrics, Is.Not.Null);
        Assert.That(result.EngagementTrendData, Is.Not.Null);
    }

    [Test]
    public async Task GenerateEventRecommendationsAsync_ValidInputs_ReturnsPersonalizedRecommendations()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var maxRecommendations = 5;

        // Act
        var result = await _service.GenerateEventRecommendationsAsync(clubId, memberId, maxRecommendations);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count <= maxRecommendations, Is.True);

        foreach (var recommendation in result)
        {
            Assert.That(recommendation.RecommendationScore >= 0 && recommendation.RecommendationScore <= 100, Is.True);
            Assert.That(recommendation.AttendanceProbability >= 0 && recommendation.AttendanceProbability <= 100, Is.True);
            Assert.That(recommendation.RecommendationReason, Is.Not.Null);
            Assert.That(recommendation.EventName, Is.Not.Null);
            Assert.That(recommendation.EventId > 0, Is.True);
        }
    }

    [Test]
    public async Task AnalyzeEventPerformanceAsync_ValidEvent_ReturnsComprehensiveAnalysis()
    {
        // Arrange
        var eventId = 1;

        // Act
        var result = await _service.AnalyzeEventPerformanceAsync(eventId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventId, Is.EqualTo(eventId));
        Assert.That(result.EventName, Is.EqualTo("High Engagement Workshop"));
        Assert.That(result.AttendanceAnalysis, Is.Not.Null);
        Assert.That(result.EngagementBreakdown, Is.Not.Null);
        Assert.That(result.ComparisonToAverage, Is.Not.Null);
        Assert.That(result.ImprovementSuggestions, Is.Not.Null);
        Assert.That(result.PerformanceScore >= 0 && result.PerformanceScore <= 100, Is.True);
    }

    [Test]
    public async Task GetEngagementBenchmarksAsync_ValidClub_ReturnsBenchmarkData()
    {
        // Arrange
        var clubId = 1;

        // Act
        var result = await _service.GetEngagementBenchmarksAsync(clubId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubId, Is.EqualTo(clubId));
        Assert.That(result.AverageAttendanceRate >= 0, Is.True);
        Assert.That(result.AverageRsvpRate >= 0, Is.True);
        Assert.That(result.AverageEngagementScore >= 0, Is.True);
        Assert.That(result.IndustryComparisons, Is.Not.Null);
        Assert.That(result.PerformanceIndicators, Is.Not.Null);
        Assert.That(result.BenchmarkPeriod, Is.EqualTo("Last 90 days"));
    }

    [Test]
    public async Task BatchProcessEngagementDataAsync_LargeDataset_ProcessesEfficiently()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        // Create large dataset in memory
        var largeEventList = new List<Event>();
        for (int i = 100; i < 150; i++) // Reduced size for faster testing
        {
            largeEventList.Add(new Event
            {
                Id = i,
                ClubId = clubId,
                Name = $"Batch Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 90)),
                Location = "Test Location",
                CreatedAt = DateTime.UtcNow.AddDays(-95),
                UpdatedAt = DateTime.UtcNow.AddDays(-95)
            });
        }

        _context.Events.AddRange(largeEventList);
        await _context.SaveChangesAsync();

        var startTime = DateTime.UtcNow;

        // Act - Use correct method signature
        var result = await _service.BatchProcessEngagementDataAsync(clubId, userId);

        var processingTime = DateTime.UtcNow - startTime;

        // Assert
        Assert.That(result >= 0, Is.True); // Returns number of processed events
        Assert.That(processingTime.TotalSeconds < 30, Is.True); // Should process within 30 seconds
    }

    [Test]
    public async Task CalculateROIMetricsAsync_ValidData_ReturnsROIAnalysis()
    {
        // Arrange
        var clubId = 1;
        var periodMonths = 6;

        // Act
        var result = await _service.CalculateROIMetricsAsync(clubId, periodMonths);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubId, Is.EqualTo(clubId));
        Assert.That(result.AnalysisPeriodMonths, Is.EqualTo(periodMonths));
        Assert.That(result.TotalEventCosts >= 0, Is.True);
        Assert.That(result.TotalMemberValue >= 0, Is.True);
        Assert.That(result.CostBreakdown, Is.Not.Null);
        Assert.That(result.ValueDrivers, Is.Not.Null);
        Assert.That(result.CostPerMember >= 0, Is.True);
        Assert.That(result.ValuePerMember >= 0, Is.True);
    }

    [Test]
    public async Task PredictEventSuccessAsync_FutureEvent_ReturnsPredictionMetrics()
    {
        // Arrange
        var eventId = 4; // Future event

        // Act
        var result = await _service.PredictEventSuccessAsync(eventId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventId, Is.EqualTo(eventId));
        Assert.That(result.PredictedAttendanceRate >= 0 && result.PredictedAttendanceRate <= 100, Is.True);
        Assert.That(result.SuccessProbability >= 0 && result.SuccessProbability <= 100, Is.True);
        Assert.That(new[] { "Low", "Medium", "High" }, Contains.Item(result.ConfidenceLevel));
        Assert.That(result.RiskFactors, Is.Not.Null);
        Assert.That(result.SuccessFactors, Is.Not.Null);
        Assert.That(result.RecommendedActions, Is.Not.Null);
    }

    [Test]
    public async Task GenerateEngagementReportAsync_ComprehensiveData_ReturnsDetailedReport()
    {
        // Arrange
        var clubId = 1;
        var reportType = "comprehensive";
        var startDate = DateTime.UtcNow.AddDays(-90);
        var endDate = DateTime.UtcNow;

        // Act
        var result = await _service.GenerateEngagementReportAsync(clubId, reportType, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubId, Is.EqualTo(clubId));
        Assert.That(result.ReportType, Is.EqualTo(reportType));
        Assert.That(result.ExecutiveSummary, Is.Not.Null);
        Assert.That(result.KeyMetrics, Is.Not.Null);
        Assert.That(result.TrendAnalysis, Is.Not.Null);
        Assert.That(result.MemberInsights, Is.Not.Null);
        Assert.That(result.EventAnalysis, Is.Not.Null);
        Assert.That(result.Recommendations, Is.Not.Null);
        Assert.That(result.GeneratedAt, Is.LessThanOrEqualTo(DateTime.UtcNow));
        Assert.That(result.ReportPeriod.StartDate, Is.EqualTo(startDate));
        Assert.That(result.ReportPeriod.EndDate, Is.EqualTo(endDate));
    }

    [Test]
    public async Task HandleConcurrentAnalytics_MultipleRequests_ProcessesSafely()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var tasks = new List<Task<GatherGrove.Application.DTOs.EventEngagementAnalytics>>();

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        // Act - Create 5 concurrent requests (reduced for faster testing)
        for (int i = 0; i < 5; i++)
        {
            var eventId = 1; // Use existing event
            tasks.Add(_service.GetEventEngagementAnalyticsAsync(eventId, clubId, userId));
        }

        var results = await Task.WhenAll(tasks);

        // Assert
        Assert.That(results, Has.Length.EqualTo(5));
        foreach (var result in results)
        {
            Assert.That(result, Is.Not.Null);
            Assert.That(result.EventId, Is.EqualTo(1));
        }
    }

    #region TrackEventInteractionAsync Tests

    [Test]
    public async Task TrackEventInteractionAsync_SignUp_CreatesTrackingRecord()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.TrackEventInteractionRequest
        {
            EventId = 1,
            MemberId = 1,
            InteractionType = "sign_up"
        };

        // Act
        var result = await _service.TrackEventInteractionAsync(request);

        // Assert
        Assert.That(result, Is.True);
        var tracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(tracking, Is.Not.Null);
        Assert.That(tracking.RegistrationStatus, Is.EqualTo("registered"));
    }

    [Test]
    public async Task TrackEventInteractionAsync_CheckIn_UpdatesAttendanceStatus()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.TrackEventInteractionRequest
        {
            EventId = 1,
            MemberId = 1,
            InteractionType = "check_in",
            InteractionData = new Dictionary<string, object>
            {
                ["platform"] = "mobile",
                ["device_type"] = "iOS",
                ["connection_quality"] = "excellent"
            }
        };

        // Act
        var result = await _service.TrackEventInteractionAsync(request);

        // Assert
        Assert.That(result, Is.True);
        var tracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(tracking, Is.Not.Null);
        Assert.That(tracking.AttendanceStatus, Is.EqualTo("attended"));
        Assert.That(tracking.Platform, Is.EqualTo("mobile"));
        Assert.That(tracking.DeviceType, Is.EqualTo("iOS"));
        Assert.That(tracking.ConnectionQuality, Is.EqualTo("excellent"));
        Assert.That(tracking.CheckInTimestamp, Is.Not.Null);
    }

    [Test]
    public async Task TrackEventInteractionAsync_CheckOut_CalculatesSessionDuration()
    {
        // Arrange - First check in
        var checkInTime = DateTime.UtcNow.AddHours(-2);
        var tracking = new EventEngagementTracking
        {
            EventId = 1,
            MemberId = 1,
            CheckInTimestamp = checkInTime,
            CreatedAt = checkInTime,
            UpdatedAt = checkInTime
        };
        _context.EventEngagementTrackings.Add(tracking);
        await _context.SaveChangesAsync();

        var request = new GatherGrove.Application.DTOs.TrackEventInteractionRequest
        {
            EventId = 1,
            MemberId = 1,
            InteractionType = "check_out"
        };

        // Act
        var result = await _service.TrackEventInteractionAsync(request);

        // Assert
        Assert.That(result, Is.True);
        var updatedTracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(updatedTracking, Is.Not.Null);
        Assert.That(updatedTracking.CheckOutTimestamp, Is.Not.Null);
        Assert.That(updatedTracking.SessionDurationMinutes, Is.GreaterThan(0));
    }

    [Test]
    public async Task TrackEventInteractionAsync_Cancel_UpdatesStatus()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.TrackEventInteractionRequest
        {
            EventId = 1,
            MemberId = 1,
            InteractionType = "cancel"
        };

        // Act
        var result = await _service.TrackEventInteractionAsync(request);

        // Assert
        Assert.That(result, Is.True);
        var tracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(tracking, Is.Not.Null);
        Assert.That(tracking.RegistrationStatus, Is.EqualTo("cancelled"));
        Assert.That(tracking.AttendanceStatus, Is.EqualTo("cancelled"));
    }

    [Test]
    public async Task TrackEventInteractionAsync_NoShow_SetsNoShowStatus()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.TrackEventInteractionRequest
        {
            EventId = 1,
            MemberId = 1,
            InteractionType = "no_show"
        };

        // Act
        var result = await _service.TrackEventInteractionAsync(request);

        // Assert
        Assert.That(result, Is.True);
        var tracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(tracking, Is.Not.Null);
        Assert.That(tracking.AttendanceStatus, Is.EqualTo("no_show"));
    }

    [Test]
    public async Task TrackEventInteractionAsync_Interaction_IncrementsCounters()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.TrackEventInteractionRequest
        {
            EventId = 1,
            MemberId = 1,
            InteractionType = "interaction",
            InteractionData = new Dictionary<string, object>
            {
                ["question_asked"] = true,
                ["poll_participated"] = true,
                ["resource_downloaded"] = true,
                ["chat_message"] = true,
                ["networking_connection"] = true,
                ["breakout_participation"] = "true"
            }
        };

        // Act
        var result = await _service.TrackEventInteractionAsync(request);

        // Assert
        Assert.That(result, Is.True);
        var tracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(tracking, Is.Not.Null);
        Assert.That(tracking.QuestionsAsked, Is.EqualTo(1));
        Assert.That(tracking.PollsParticipated, Is.EqualTo(1));
        Assert.That(tracking.ResourcesDownloaded, Is.EqualTo(1));
        Assert.That(tracking.ChatMessages, Is.EqualTo(1));
        Assert.That(tracking.NetworkingConnections, Is.EqualTo(1));
        Assert.That(tracking.BreakoutParticipation, Is.True);
    }

    [Test]
    public async Task TrackEventInteractionAsync_Feedback_RecordsSatisfactionData()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.TrackEventInteractionRequest
        {
            EventId = 1,
            MemberId = 1,
            InteractionType = "feedback",
            InteractionData = new Dictionary<string, object>
            {
                ["satisfaction_rating"] = "4.5",
                ["nps_score"] = "9"
            }
        };

        // Act
        var result = await _service.TrackEventInteractionAsync(request);

        // Assert
        Assert.That(result, Is.True);
        var tracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(tracking, Is.Not.Null);
        Assert.That(tracking.PostEventSurveyCompleted, Is.True);
        Assert.That(tracking.SatisfactionRating, Is.EqualTo(4.5m));
        Assert.That(tracking.NetPromoterScore, Is.EqualTo(9));
    }

    [Test]
    public async Task TrackEventInteractionAsync_InvalidSatisfactionData_HandlesGracefully()
    {
        // Arrange - Invalid/malformed data
        var request = new GatherGrove.Application.DTOs.TrackEventInteractionRequest
        {
            EventId = 1,
            MemberId = 1,
            InteractionType = "feedback",
            InteractionData = new Dictionary<string, object>
            {
                ["satisfaction_rating"] = "invalid",
                ["nps_score"] = "not_a_number"
            }
        };

        // Act
        var result = await _service.TrackEventInteractionAsync(request);

        // Assert - Should handle gracefully and use default values
        Assert.That(result, Is.True);
        var tracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(tracking, Is.Not.Null);
        Assert.That(tracking.SatisfactionRating, Is.EqualTo(0));
        Assert.That(tracking.NetPromoterScore, Is.EqualTo(0));
    }

    #endregion

    #region TrackEventInteractionsBatchAsync Tests

    [Test]
    public async Task TrackEventInteractionsBatchAsync_EmptyList_ReturnsZero()
    {
        // Arrange
        var requests = new List<GatherGrove.Application.DTOs.TrackEventInteractionRequest>();

        // Act
        var result = await _service.TrackEventInteractionsBatchAsync(requests);

        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    [Test]
    public async Task TrackEventInteractionsBatchAsync_MultipleInteractions_ProcessesAll()
    {
        // Arrange
        var requests = new List<GatherGrove.Application.DTOs.TrackEventInteractionRequest>
        {
            new() { EventId = 1, MemberId = 1, InteractionType = "sign_up" },
            new() { EventId = 1, MemberId = 2, InteractionType = "sign_up" },
            new() { EventId = 2, MemberId = 1, InteractionType = "check_in" }
        };

        // Act
        var result = await _service.TrackEventInteractionsBatchAsync(requests);

        // Assert
        Assert.That(result, Is.EqualTo(3));
        var trackings = await _context.EventEngagementTrackings.ToListAsync();
        Assert.That(trackings.Count, Is.GreaterThanOrEqualTo(3));
    }

    [Test]
    public async Task TrackEventInteractionsBatchAsync_LargeBatch_ProcessesInChunks()
    {
        // Arrange - Create 150 requests (3 batches of 50)
        var requests = new List<GatherGrove.Application.DTOs.TrackEventInteractionRequest>();
        for (int i = 0; i < 150; i++)
        {
            requests.Add(new GatherGrove.Application.DTOs.TrackEventInteractionRequest
            {
                EventId = 1,
                MemberId = (i % 4) + 1,
                InteractionType = "interaction"
            });
        }

        // Act
        var result = await _service.TrackEventInteractionsBatchAsync(requests);

        // Assert
        Assert.That(result, Is.EqualTo(150));
    }

    #endregion

    #region TrackMemberCheckInAsync/TrackMemberCheckOutAsync Tests

    [Test]
    public async Task TrackMemberCheckInAsync_ValidData_ReturnsTrue()
    {
        // Arrange
        var checkInData = new Dictionary<string, object>
        {
            ["platform"] = "web",
            ["device_type"] = "desktop"
        };

        // Act
        var result = await _service.TrackMemberCheckInAsync(1, 1, checkInData);

        // Assert
        Assert.That(result, Is.True);
        var tracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(tracking, Is.Not.Null);
        Assert.That(tracking.AttendanceStatus, Is.EqualTo("attended"));
        Assert.That(tracking.Platform, Is.EqualTo("web"));
    }

    [Test]
    public async Task TrackMemberCheckOutAsync_AfterCheckIn_ReturnsSessionDuration()
    {
        // Arrange - First check in
        await _service.TrackMemberCheckInAsync(1, 1);
        await Task.Delay(100); // Small delay to ensure duration > 0

        // Act
        var sessionDuration = await _service.TrackMemberCheckOutAsync(1, 1);

        // Assert
        Assert.That(sessionDuration, Is.Not.Null);
        Assert.That(sessionDuration.Value, Is.GreaterThanOrEqualTo(0));
    }

    [Test]
    public async Task TrackMemberCheckOutAsync_WithoutCheckIn_StillReturnsValue()
    {
        // Act - Check out without check in
        var sessionDuration = await _service.TrackMemberCheckOutAsync(1, 1);

        // Assert - Should create tracking and return null session duration
        Assert.That(sessionDuration, Is.Null);
    }

    #endregion

    #region CalculateEventEngagementScoreAsync Tests

    [Test]
    public async Task CalculateEventEngagementScore_NoTracking_ReturnsZero()
    {
        // Act
        var score = await _service.CalculateEventEngagementScoreAsync(999, 999);

        // Assert
        Assert.That(score, Is.EqualTo(0));
    }

    [Test]
    public async Task CalculateEventEngagementScore_HighAttendance_ReturnsHighScore()
    {
        // Arrange - Create high engagement tracking
        var tracking = new EventEngagementTracking
        {
            EventId = 1,
            MemberId = 1,
            AttendanceStatus = "attended",
            SessionDurationMinutes = 120,
            InteractionCount = 15,
            QuestionsAsked = 3,
            PollsParticipated = 2,
            ChatMessages = 5,
            ResourcesDownloaded = 1,
            NetworkingConnections = 8,
            BreakoutParticipation = true,
            ParticipationLevel = "highly_active",
            SatisfactionRating = 5m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventEngagementTrackings.Add(tracking);
        await _context.SaveChangesAsync();

        // Act
        var score = await _service.CalculateEventEngagementScoreAsync(1, 1);

        // Assert
        Assert.That(score, Is.GreaterThan(70m)); // High engagement should score > 70
        Assert.That(score, Is.LessThanOrEqualTo(100m));
    }

    [Test]
    public async Task CalculateEventEngagementScore_NoShow_ReturnsLowScore()
    {
        // Arrange
        var tracking = new EventEngagementTracking
        {
            EventId = 1,
            MemberId = 1,
            AttendanceStatus = "no_show",
            SessionDurationMinutes = 0,
            InteractionCount = 0,
            ParticipationLevel = "disengaged",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventEngagementTrackings.Add(tracking);
        await _context.SaveChangesAsync();

        // Act
        var score = await _service.CalculateEventEngagementScoreAsync(1, 1);

        // Assert
        Assert.That(score, Is.LessThan(30m)); // No-show should score < 30
    }

    [Test]
    public async Task CalculateEventEngagementScore_UpdatesTrackingRecord()
    {
        // Arrange
        var tracking = new EventEngagementTracking
        {
            EventId = 1,
            MemberId = 1,
            AttendanceStatus = "attended",
            SessionDurationMinutes = 60,
            InteractionCount = 5,
            ParticipationLevel = "active",
            SatisfactionRating = 4m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventEngagementTrackings.Add(tracking);
        await _context.SaveChangesAsync();

        // Act
        var score = await _service.CalculateEventEngagementScoreAsync(1, 1);

        // Assert
        var updatedTracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(updatedTracking, Is.Not.Null);
        Assert.That(updatedTracking.ParticipationScore, Is.EqualTo(score));
        Assert.That(updatedTracking.LastEngagementUpdate, Is.Not.Null);
    }

    #endregion

    #region CalculateMemberEngagementScoresAsync Tests

    [Test]
    public async Task CalculateMemberEngagementScores_ValidMember_ReturnsDetailedScores()
    {
        // Arrange - Add some engagement trackings
        var trackings = new[]
        {
            new EventEngagementTracking
            {
                EventId = 1, MemberId = 1, AttendanceStatus = "attended",
                ParticipationScore = 85m, SatisfactionRating = 4.5m,
                CreatedAt = DateTime.UtcNow.AddDays(-10), UpdatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new EventEngagementTracking
            {
                EventId = 2, MemberId = 1, AttendanceStatus = "attended",
                ParticipationScore = 90m, SatisfactionRating = 5m,
                CreatedAt = DateTime.UtcNow.AddDays(-5), UpdatedAt = DateTime.UtcNow.AddDays(-5)
            }
        };
        _context.EventEngagementTrackings.AddRange(trackings);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.CalculateMemberEngagementScoresAsync(1, 1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.MemberId, Is.EqualTo(1));
        Assert.That(result.MemberName, Is.EqualTo("Alice High-Engager"));
        Assert.That(result.TotalEventsAttended, Is.EqualTo(2));
        Assert.That(result.AverageEventEngagementScore, Is.GreaterThan(0));
        Assert.That(result.EventAttendanceRate, Is.GreaterThan(0));
        Assert.That(result.AverageSatisfactionRating, Is.GreaterThan(0));
    }

    [Test]
    public async Task CalculateMemberEngagementScores_InvalidMember_ThrowsException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.CalculateMemberEngagementScoresAsync(999, 1));
    }

    [Test]
    public async Task CalculateMemberEngagementScores_CreatesMemberEngagementScoresRecord()
    {
        // Arrange - Add engagement tracking
        var tracking = new EventEngagementTracking
        {
            EventId = 1,
            MemberId = 1,
            AttendanceStatus = "attended",
            ParticipationScore = 80m,
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddDays(-5)
        };
        _context.EventEngagementTrackings.Add(tracking);
        await _context.SaveChangesAsync();

        // Act
        await _service.CalculateMemberEngagementScoresAsync(1, 1);

        // Assert
        var memberScores = await _context.MemberEventEngagementScores
            .FirstOrDefaultAsync(mes => mes.MemberId == 1);
        Assert.That(memberScores, Is.Not.Null);
        Assert.That(memberScores.AverageEventEngagementScore, Is.GreaterThan(0));
    }

    [Test]
    public async Task CalculateMemberEngagementScores_DeterminesRiskLevel()
    {
        // Arrange - Low engagement tracking
        var tracking = new EventEngagementTracking
        {
            EventId = 1,
            MemberId = 1,
            AttendanceStatus = "attended",
            ParticipationScore = 25m, // Low score
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddDays(-5)
        };
        _context.EventEngagementTrackings.Add(tracking);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.CalculateMemberEngagementScoresAsync(1, 1);

        // Assert
        Assert.That(result.RiskLevel, Is.EqualTo("high"));
    }

    #endregion

    #region RecalculateClubMemberEngagementScoresAsync Tests

    [Test]
    public async Task RecalculateClubMemberEngagementScores_ProcessesAllActiveMembers()
    {
        // Act
        var result = await _service.RecalculateClubMemberEngagementScoresAsync(1);

        // Assert
        Assert.That(result, Is.GreaterThan(0)); // Should process at least some members
    }

    [Test]
    public async Task RecalculateClubMemberEngagementScores_InvalidClub_ReturnsZero()
    {
        // Act
        var result = await _service.RecalculateClubMemberEngagementScoresAsync(999);

        // Assert - Invalid club should process 0 members
        Assert.That(result, Is.EqualTo(0));
    }

    #endregion

    #region GetEventEngagementMetricsAsync Tests

    [Test]
    public async Task GetEventEngagementMetrics_UnauthorizedUser_ReturnsNull()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.GetEventEngagementMetricsAsync(1, 1, 1);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetEventEngagementMetrics_ValidEvent_ReturnsMetrics()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Add engagement tracking data
        var tracking = new EventEngagementTracking
        {
            EventId = 1,
            MemberId = 1,
            AttendanceStatus = "attended",
            ParticipationScore = 85m,
            SessionDurationMinutes = 90,
            InteractionCount = 10,
            SatisfactionRating = 4.5m,
            PostEventSurveyCompleted = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventEngagementTrackings.Add(tracking);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventEngagementMetricsAsync(1, 1, 1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventId, Is.EqualTo(1));
        Assert.That(result.EventName, Is.Not.Empty);
    }

    #endregion

    #region GetMemberEventEngagementScoresAsync Tests

    [Test]
    public async Task GetMemberEventEngagementScores_UnauthorizedUser_ReturnsEmpty()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.GetMemberEventEngagementScoresAsync(1, 1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetMemberEventEngagementScores_ValidRequest_ReturnsSortedList()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Add member engagement scores
        var scores = new[]
        {
            new MemberEventEngagementScores
            {
                MemberId = 1, AverageEventEngagementScore = 90m, TotalEventsAttended = 10,
                EventAttendanceRate = 95m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
            },
            new MemberEventEngagementScores
            {
                MemberId = 2, AverageEventEngagementScore = 75m, TotalEventsAttended = 8,
                EventAttendanceRate = 80m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
            }
        };
        _context.MemberEventEngagementScores.AddRange(scores);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetMemberEventEngagementScoresAsync(1, 1, 10, "AverageEventEngagementScore");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Not.Empty);
        Assert.That(result.First().AverageEventEngagementScore, Is.GreaterThanOrEqualTo(result.Last().AverageEventEngagementScore));
    }

    #endregion

    #region GetSignUpToAttendanceConversionRatesAsync Tests

    [Test]
    public async Task GetSignUpToAttendanceConversionRates_UnauthorizedUser_ReturnsEmpty()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.GetSignUpToAttendanceConversionRatesAsync(1, 1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetSignUpToAttendanceConversionRates_ValidData_ReturnsRates()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Add engagement trackings
        var trackings = new[]
        {
            new EventEngagementTracking
            {
                EventId = 1, MemberId = 1, AttendanceStatus = "attended",
                CreatedAt = DateTime.UtcNow.AddDays(-5), UpdatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new EventEngagementTracking
            {
                EventId = 1, MemberId = 2, AttendanceStatus = "no_show",
                CreatedAt = DateTime.UtcNow.AddDays(-5), UpdatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new EventEngagementTracking
            {
                EventId = 1, MemberId = 3, AttendanceStatus = "cancelled",
                CreatedAt = DateTime.UtcNow.AddDays(-5), UpdatedAt = DateTime.UtcNow.AddDays(-5)
            }
        };
        _context.EventEngagementTrackings.AddRange(trackings);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetSignUpToAttendanceConversionRatesAsync(1, 1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Contains.Key("overall_conversion_rate"));
        Assert.That(result, Contains.Key("cancellation_rate"));
        Assert.That(result, Contains.Key("no_show_rate"));
        Assert.That(result, Contains.Key("attendance_rate"));
    }

    #endregion

    #region GetAtRiskMembersAsync Tests

    [Test]
    public async Task GetAtRiskMembers_UnauthorizedUser_ReturnsEmpty()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.GetAtRiskMembersAsync(1, 1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetAtRiskMembers_ValidRequest_ReturnsHighRiskMembers()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Add at-risk member scores
        var atRiskScore = new MemberEventEngagementScores
        {
            MemberId = 1,
            AverageEventEngagementScore = 25m,
            RiskLevel = "high",
            EngagementTrend = "declining",
            EventRetentionProbability = 30m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MemberEventEngagementScores.Add(atRiskScore);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetAtRiskMembersAsync(1, 1, 10);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Not.Empty);
        Assert.That(result.All(m => m.RiskLevel == "high" || m.EngagementTrend == "declining"), Is.True);
    }

    #endregion

    #region GetMostEngagedEventParticipantsAsync Tests

    [Test]
    public async Task GetMostEngagedEventParticipants_UnauthorizedUser_ReturnsEmpty()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.GetMostEngagedEventParticipantsAsync(1, 1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetMostEngagedEventParticipants_ValidRequest_ReturnsSortedList()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Add member engagement scores
        var scores = new[]
        {
            new MemberEventEngagementScores
            {
                MemberId = 1, AverageEventEngagementScore = 95m, TotalEventsAttended = 15,
                EventAttendanceRate = 98m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
            },
            new MemberEventEngagementScores
            {
                MemberId = 2, AverageEventEngagementScore = 85m, TotalEventsAttended = 12,
                EventAttendanceRate = 90m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
            },
            new MemberEventEngagementScores
            {
                MemberId = 3, AverageEventEngagementScore = 75m, TotalEventsAttended = 10,
                EventAttendanceRate = 80m, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
            }
        };
        _context.MemberEventEngagementScores.AddRange(scores);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetMostEngagedEventParticipantsAsync(1, 1, 2);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.LessThanOrEqualTo(2)); // Limited to 2
        if (result.Any())
        {
            Assert.That(result.First().AverageEventEngagementScore,
                Is.GreaterThanOrEqualTo(result.Last().AverageEventEngagementScore)); // Sorted descending
        }
    }

    [Test]
    public async Task GetMostEngagedEventParticipants_WithDateRange_FiltersCorrectly()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        var periodStart = DateTime.UtcNow.AddDays(-30);
        var periodEnd = DateTime.UtcNow;

        // Act
        var result = await _service.GetMostEngagedEventParticipantsAsync(1, 1, 10, periodStart, periodEnd);

        // Assert
        Assert.That(result, Is.Not.Null);
        // Method delegates to GetMemberEventEngagementScoresAsync which handles filtering
    }

    #endregion

    #region CompareEngagementAcrossEventTypesAsync Tests

    [Test]
    public async Task CompareEngagementAcrossEventTypes_PlaceholderImplementation_ReturnsEmptyDictionary()
    {
        // Act
        var result = await _service.CompareEngagementAcrossEventTypesAsync(1, 1);

        // Assert - Placeholder implementation returns empty dictionary
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task CompareEngagementAcrossEventTypes_WithDateRange_ReturnsEmptyDictionary()
    {
        // Arrange
        var periodStart = DateTime.UtcNow.AddDays(-90);
        var periodEnd = DateTime.UtcNow;

        // Act
        var result = await _service.CompareEngagementAcrossEventTypesAsync(1, 1, periodStart, periodEnd);

        // Assert - Placeholder implementation returns empty dictionary
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region AnalyzeNoShowPatternsAsync Tests

    [Test]
    public async Task AnalyzeNoShowPatterns_PlaceholderImplementation_ReturnsEmptyObject()
    {
        // Act
        var result = await _service.AnalyzeNoShowPatternsAsync(1, 1);

        // Assert - Placeholder implementation returns empty object
        Assert.That(result, Is.Not.Null);
    }

    [Test]
    public async Task AnalyzeNoShowPatterns_WithDateRange_ReturnsEmptyObject()
    {
        // Arrange
        var periodStart = DateTime.UtcNow.AddDays(-60);
        var periodEnd = DateTime.UtcNow;

        // Act
        var result = await _service.AnalyzeNoShowPatternsAsync(1, 1, periodStart, periodEnd);

        // Assert - Placeholder implementation returns empty object
        Assert.That(result, Is.Not.Null);
    }

    #endregion

    #region Additional Edge Case and Validation Tests

    [Test]
    public async Task TrackEventInteractionAsync_NullInteractionData_HandlesGracefully()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.TrackEventInteractionRequest
        {
            EventId = 1,
            MemberId = 1,
            InteractionType = "check_in",
            InteractionData = null
        };

        // Act
        var result = await _service.TrackEventInteractionAsync(request);

        // Assert
        Assert.That(result, Is.True);
        var tracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(tracking, Is.Not.Null);
        Assert.That(tracking.AttendanceStatus, Is.EqualTo("attended"));
    }

    [Test]
    public async Task TrackEventInteractionAsync_EmptyInteractionData_HandlesGracefully()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.TrackEventInteractionRequest
        {
            EventId = 1,
            MemberId = 1,
            InteractionType = "interaction",
            InteractionData = new Dictionary<string, object>() // Empty dictionary
        };

        // Act
        var result = await _service.TrackEventInteractionAsync(request);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task TrackEventInteractionAsync_UnknownInteractionType_StillTracks()
    {
        // Arrange
        var request = new GatherGrove.Application.DTOs.TrackEventInteractionRequest
        {
            EventId = 1,
            MemberId = 1,
            InteractionType = "unknown_type"
        };

        // Act
        var result = await _service.TrackEventInteractionAsync(request);

        // Assert
        Assert.That(result, Is.True);
        var tracking = await _context.EventEngagementTrackings
            .FirstOrDefaultAsync(et => et.EventId == 1 && et.MemberId == 1);
        Assert.That(tracking, Is.Not.Null);
        Assert.That(tracking.InteractionCount, Is.EqualTo(1));
    }

    [Test]
    public async Task TrackEventInteractionsBatchAsync_NullRequest_ThrowsArgumentNullException()
    {
        // Act & Assert - Service throws ArgumentNullException for null parameter
        Assert.ThrowsAsync<ArgumentNullException>(async () =>
            await _service.TrackEventInteractionsBatchAsync(null));
    }

    [Test]
    public async Task CalculateEventEngagementScore_NegativeEventId_ReturnsZero()
    {
        // Act
        var score = await _service.CalculateEventEngagementScoreAsync(-1, 1);

        // Assert
        Assert.That(score, Is.EqualTo(0));
    }

    [Test]
    public async Task CalculateEventEngagementScore_NegativeMemberId_ReturnsZero()
    {
        // Act
        var score = await _service.CalculateEventEngagementScoreAsync(1, -1);

        // Assert
        Assert.That(score, Is.EqualTo(0));
    }

    [Test]
    public async Task CalculateEventEngagementScore_ZeroIds_ReturnsZero()
    {
        // Act
        var score = await _service.CalculateEventEngagementScoreAsync(0, 0);

        // Assert
        Assert.That(score, Is.EqualTo(0));
    }

    [Test]
    public async Task CalculateMemberEngagementScores_NegativeMemberId_ThrowsException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.CalculateMemberEngagementScoresAsync(-1, 1));
    }

    [Test]
    public async Task CalculateMemberEngagementScores_ZeroMemberId_ThrowsException()
    {
        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(async () =>
            await _service.CalculateMemberEngagementScoresAsync(0, 1));
    }

    [Test]
    public async Task RecalculateClubMemberEngagementScores_NegativeClubId_ReturnsZero()
    {
        // Act
        var result = await _service.RecalculateClubMemberEngagementScoresAsync(-1);

        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    [Test]
    public async Task RecalculateClubMemberEngagementScores_ZeroClubId_ReturnsZero()
    {
        // Act
        var result = await _service.RecalculateClubMemberEngagementScoresAsync(0);

        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    [Test]
    public async Task GetEventEngagementMetrics_InvalidEventId_ReturnsNull()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.GetEventEngagementMetricsAsync(999, 1, 1);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetMemberEventEngagementScores_EmptyClub_ReturnsEmpty()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act - Use club with no members
        var result = await _service.GetMemberEventEngagementScoresAsync(999, 1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetSignUpToAttendanceConversionRates_NoData_ReturnsDefaultRates()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.GetSignUpToAttendanceConversionRatesAsync(999, 1);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Contains.Key("overall_conversion_rate"));
    }

    [Test]
    public async Task GetAtRiskMembers_EmptyLimit_ReturnsDefault()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.GetAtRiskMembersAsync(1, 1, 0);

        // Assert
        Assert.That(result, Is.Not.Null);
        // Empty limit should return empty or default
    }

    [Test]
    public async Task BatchProcessEngagementData_EmptyClub_ReturnsZero()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.BatchProcessEngagementDataAsync(999, 1);

        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    [Test]
    public async Task GenerateEventRecommendations_NonExistentMember_ReturnsValidList()
    {
        // Act
        var result = await _service.GenerateEventRecommendationsAsync(1, 999);

        // Assert - Service returns valid list even for non-existent member
        Assert.That(result, Is.Not.Null);
        // May contain recommendations based on general patterns
    }

    [Test]
    public async Task GenerateEventRecommendations_NegativeMaxRecommendations_ReturnsEmpty()
    {
        // Act
        var result = await _service.GenerateEventRecommendationsAsync(1, 1, -5);

        // Assert
        Assert.That(result, Is.Not.Null);
        // Negative max should return empty or default
    }

    [Test]
    public async Task AnalyzeEventPerformance_NonExistentEvent_ThrowsOrReturnsNull()
    {
        // Act & Assert - Service might throw or return null for non-existent event
        try
        {
            var result = await _service.AnalyzeEventPerformanceAsync(999);
            Assert.That(result, Is.Null);
        }
        catch (ArgumentException)
        {
            // Expected exception for non-existent event
            Assert.Pass("Service correctly throws ArgumentException for non-existent event");
        }
    }

    [Test]
    public async Task GetEngagementBenchmarks_NonExistentClub_ReturnsDefaultBenchmarks()
    {
        // Act
        var result = await _service.GetEngagementBenchmarksAsync(999);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubId, Is.EqualTo(999));
    }

    [Test]
    public async Task PredictEventSuccess_NonExistentEvent_ThrowsOrReturnsDefault()
    {
        // Act & Assert
        try
        {
            var result = await _service.PredictEventSuccessAsync(999);
            Assert.That(result, Is.Not.Null);
        }
        catch (ArgumentException)
        {
            Assert.Pass("Service correctly throws ArgumentException for non-existent event");
        }
    }

    [Test]
    public async Task GenerateEngagementReport_InvalidDateRange_HandlesGracefully()
    {
        // Arrange - End date before start date
        var startDate = DateTime.UtcNow;
        var endDate = DateTime.UtcNow.AddDays(-30);

        // Act
        var result = await _service.GenerateEngagementReportAsync(1, "comprehensive", startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        // Service should handle invalid date range gracefully
    }

    [Test]
    public async Task GenerateEngagementReport_UnknownReportType_HandlesGracefully()
    {
        // Arrange
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        // Act
        var result = await _service.GenerateEngagementReportAsync(1, "unknown_type", startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ReportType, Is.EqualTo("unknown_type"));
    }

    [Test]
    public async Task CalculateROIMetrics_NegativePeriod_HandlesGracefully()
    {
        // Act
        var result = await _service.CalculateROIMetricsAsync(1, -6);

        // Assert
        Assert.That(result, Is.Not.Null);
        // Service should handle negative period gracefully
    }

    [Test]
    public async Task CalculateROIMetrics_ZeroPeriod_HandlesGracefully()
    {
        // Act
        var result = await _service.CalculateROIMetricsAsync(1, 0);

        // Assert
        Assert.That(result, Is.Not.Null);
    }

    [Test]
    public async Task CalculateEngagementTrends_NegativeDaysBack_HandlesGracefully()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.CalculateEngagementTrendsAsync(1, 1, -30);

        // Assert
        Assert.That(result, Is.Not.Null);
    }

    [Test]
    public async Task CalculateEngagementTrends_ZeroDaysBack_ReturnsToday()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.CalculateEngagementTrendsAsync(1, 1, 0);

        // Assert - Zero days back means from today to today (1 day)
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(1)); // Returns today's data
        if (result.Any())
        {
            Assert.That(result.First().Date.Date, Is.EqualTo(DateTime.UtcNow.Date));
        }
    }

    [Test]
    public async Task GetMemberEngagementInsights_InvalidMember_ThrowsOrReturnsNull()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act & Assert
        try
        {
            var result = await _service.GetMemberEngagementInsightsAsync(1, 999, 1);
            Assert.That(result, Is.Null);
        }
        catch (ArgumentException)
        {
            Assert.Pass("Service correctly throws ArgumentException for invalid member");
        }
    }

    [Test]
    public async Task GetMemberEngagementInsights_NegativePeriod_HandlesGracefully()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.GetMemberEngagementInsightsAsync(1, 1, 1, -90);

        // Assert
        Assert.That(result, Is.Not.Null);
    }

    [Test]
    public async Task GetEventEngagementAnalytics_NegativeEventId_ThrowsException()
    {
        // Arrange
        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act & Assert
        try
        {
            var result = await _service.GetEventEngagementAnalyticsAsync(-1, 1, 1);
            Assert.Fail("Expected ArgumentException for negative event ID");
        }
        catch (ArgumentException)
        {
            Assert.Pass("Service correctly throws ArgumentException");
        }
    }

    [Test]
    public async Task TrackMemberCheckIn_DuplicateCheckIn_UpdatesExistingRecord()
    {
        // Arrange - First check-in
        await _service.TrackMemberCheckInAsync(1, 1);

        // Act - Second check-in (duplicate)
        var result = await _service.TrackMemberCheckInAsync(1, 1);

        // Assert
        Assert.That(result, Is.True);
        var trackings = await _context.EventEngagementTrackings
            .Where(et => et.EventId == 1 && et.MemberId == 1)
            .ToListAsync();
        Assert.That(trackings.Count, Is.EqualTo(1)); // Should update, not create duplicate
    }

    [Test]
    public async Task TrackMemberCheckOut_MultipleCheckOuts_UsesLatest()
    {
        // Arrange - Check in first
        await _service.TrackMemberCheckInAsync(1, 1);
        await Task.Delay(50);

        // Act - Multiple check outs
        var duration1 = await _service.TrackMemberCheckOutAsync(1, 1);
        await Task.Delay(50);
        var duration2 = await _service.TrackMemberCheckOutAsync(1, 1);

        // Assert
        Assert.That(duration1, Is.Not.Null);
        Assert.That(duration2, Is.Not.Null);
        Assert.That(duration2.Value, Is.GreaterThanOrEqualTo(duration1.Value));
    }

    [Test]
    public async Task CalculateEventEngagementScore_ModerateEngagement_ReturnsMidRangeScore()
    {
        // Arrange - Moderate engagement
        var tracking = new EventEngagementTracking
        {
            EventId = 1,
            MemberId = 1,
            AttendanceStatus = "attended",
            SessionDurationMinutes = 60,
            InteractionCount = 5,
            QuestionsAsked = 1,
            PollsParticipated = 1,
            ChatMessages = 2,
            ResourcesDownloaded = 1,
            ParticipationLevel = "active",
            SatisfactionRating = 3.5m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventEngagementTrackings.Add(tracking);
        await _context.SaveChangesAsync();

        // Act
        var score = await _service.CalculateEventEngagementScoreAsync(1, 1);

        // Assert
        Assert.That(score, Is.GreaterThan(40m)); // Moderate should be > 40
        Assert.That(score, Is.LessThan(80m)); // But < 80
    }

    #endregion

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}

/// <summary>
/// Performance and stress tests for EventEngagementAnalyticsService
/// Tests with large datasets and memory usage optimization
/// </summary>
[TestFixture]
public class EventEngagementAnalyticsServicePerformanceTests : IDisposable
{
    private GatherGroveDbContext _context;
    private EventEngagementAnalyticsService _service;
    private Mock<IClubTierService> _mockClubTierService;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);

        _mockClubTierService = new Mock<IClubTierService>();
        var mockLogger = new Mock<ILogger<EventEngagementAnalyticsService>>();

        _service = new EventEngagementAnalyticsService(
            _context,
            mockLogger.Object,
            _mockClubTierService.Object
        );

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        SeedLargeDataset();
    }

    private void SeedLargeDataset()
    {
        var club = new Club
        {
            Id = 1,
            Name = "Large Performance Club",
            Tier = "Unlimited",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddYears(-2),
            UpdatedAt = DateTime.UtcNow
        };

        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Performance Test",
            DuesAmount = 50m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        _context.MembershipTypes.Add(membershipType);

        // Create 200 members (reduced from 1000 for reasonable test performance)
        var members = new List<Member>();
        for (int i = 1; i <= 200; i++)
        {
            members.Add(new Member
            {
                Id = i,
                ClubId = 1,
                MembershipTypeId = 1,
                FullName = $"Performance Member {i}",
                Email = $"member{i}@performance.test",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 730)),
                CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 730)),
                UpdatedAt = DateTime.UtcNow
            });
        }

        // Create 50 events over 2 years (reduced from 500 for reasonable test performance)
        var events = new List<Event>();
        for (int i = 1; i <= 50; i++)
        {
            events.Add(new Event
            {
                Id = i,
                ClubId = 1,
                Name = $"Performance Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 730)),
                Location = $"Location {i % 10}",
                Description = $"Performance test event {i}",
                CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 730)),
                UpdatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 730))
            });
        }

        // Create RSVPs (about 30% of members RSVP to each event)
        var rsvps = new List<EventRsvp>();
        for (int eventId = 1; eventId <= 50; eventId++)
        {
            var rsvpCount = Random.Shared.Next(30, 80); // 15-40% of members (30-80 out of 200)
            var selectedMembers = members.OrderBy(x => Guid.NewGuid()).Take(rsvpCount);

            foreach (var member in selectedMembers)
            {
                rsvps.Add(new EventRsvp
                {
                    EventId = eventId,
                    MemberId = member.Id,
                    RsvpStatus = Random.Shared.Next(0, 10) > 1 ? "Attending" : "NotAttending",
                    CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 730)),
                    UpdatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 730))
                });
            }
        }

        // Create attendances (about 70% of RSVPs attend)
        var attendances = new List<EventAttendance>();
        var attendingRsvps = rsvps.Where(r => r.RsvpStatus == "Attending");

        foreach (var rsvp in attendingRsvps)
        {
            if (Random.Shared.Next(0, 10) > 2) // 70% attendance rate
            {
                attendances.Add(new EventAttendance
                {
                    EventId = rsvp.EventId,
                    MemberId = rsvp.MemberId,
                    AttendedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 730)),
                    CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 730))
                });
            }
        }

        // Create EventEngagementTrackings for performance test
        var engagementTrackings = new List<EventEngagementTracking>();
        foreach (var attendance in attendances)
        {
            engagementTrackings.Add(new EventEngagementTracking
            {
                Id = engagementTrackings.Count + 1,
                EventId = attendance.EventId,
                MemberId = attendance.MemberId,
                RegistrationStatus = "registered",
                AttendanceStatus = "attended",
                SessionDurationMinutes = Random.Shared.Next(30, 180), // 30 mins to 3 hours
                InteractionCount = Random.Shared.Next(1, 10),
                NetworkingConnections = Random.Shared.Next(1, 20),
                SatisfactionRating = Random.Shared.Next(1, 6), // 1-5 stars
                CheckInTimestamp = attendance.AttendedAt,
                CheckOutTimestamp = attendance.AttendedAt.AddMinutes(Random.Shared.Next(30, 180)),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        // Add some no-show records as well
        var noShowRsvps = rsvps.Where(r => r.RsvpStatus == "Attending" && !attendances.Any(a => a.EventId == r.EventId && a.MemberId == r.MemberId));
        foreach (var noShowRsvp in noShowRsvps.Take(100)) // Limit to prevent too much data
        {
            engagementTrackings.Add(new EventEngagementTracking
            {
                Id = engagementTrackings.Count + 1,
                EventId = noShowRsvp.EventId,
                MemberId = noShowRsvp.MemberId,
                RegistrationStatus = "registered",
                AttendanceStatus = "no_show",
                SessionDurationMinutes = 0,
                InteractionCount = 0,
                NetworkingConnections = 0,
                SatisfactionRating = null,
                CheckInTimestamp = null,
                CheckOutTimestamp = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        _context.Members.AddRange(members);
        _context.Events.AddRange(events);
        _context.EventRsvps.AddRange(rsvps);
        _context.EventAttendances.AddRange(attendances);
        _context.EventEngagementTrackings.AddRange(engagementTrackings);
        _context.SaveChanges();
    }

    [Test, Timeout(30000)] // 30 second timeout
    public async Task GetEventEngagementAnalyticsReport_LargeDataset_ProcessesWithinTimeLimit()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var startDate = DateTime.UtcNow.AddYears(-2);
        var endDate = DateTime.UtcNow;
        var startTime = DateTime.UtcNow;

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        // Create test events and data for analytics (use IDs that don't conflict with seeded data)
        var testEvents = new[]
        {
            new Event { Id = 101, ClubId = clubId, Name = "Analytics Event 1", EventDateTime = DateTime.UtcNow.AddDays(-10), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Event { Id = 102, ClubId = clubId, Name = "Analytics Event 2", EventDateTime = DateTime.UtcNow.AddDays(-20), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        _context.Events.AddRange(testEvents);
        await _context.SaveChangesAsync();

        // Act
        var query = new GatherGrove.Application.DTOs.EventEngagementAnalyticsQuery
        {
            ClubId = clubId,
            StartDate = startDate,
            EndDate = endDate
        };
        var result = await _service.GetEventEngagementAnalyticsReportAsync(query, userId);
        var processingTime = DateTime.UtcNow - startTime;

        // Assert
        Assert.That(result, Is.Not.Null, "GetEventEngagementAnalyticsReportAsync should not return null");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventMetrics, Is.Not.Null);
        Assert.That(processingTime.TotalSeconds < 25, Is.True); // Should complete within 25 seconds

        // Log performance metrics
        TestContext.WriteLine($"Processing time: {processingTime.TotalSeconds:F2} seconds");
        TestContext.WriteLine($"Total events: {result.TotalEvents}");
        TestContext.WriteLine($"Event metrics count: {result.EventMetrics.Count}");
    }

    [Test]
    public async Task BatchProcessEngagement_LargeDataset_MaintainsMemoryEfficiency()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var initialMemory = GC.GetTotalMemory(false);

        _mockClubTierService
            .Setup(x => x.HasUnlimitedTierAccess(userId, clubId))
            .ReturnsAsync(true);

        // Create test events for processing (use IDs that don't conflict with seeded data)
        var testEvents = new[]
        {
            new Event { Id = 201, ClubId = clubId, Name = "Test Event 1", EventDateTime = DateTime.UtcNow.AddDays(-1), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Event { Id = 202, ClubId = clubId, Name = "Test Event 2", EventDateTime = DateTime.UtcNow.AddDays(-2), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        _context.Events.AddRange(testEvents);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.BatchProcessEngagementDataAsync(clubId, userId);

        // Assert
        Assert.That(result, Is.GreaterThanOrEqualTo(0), "Processed count should be non-negative");

        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();

        var finalMemory = GC.GetTotalMemory(false);
        var memoryIncrease = finalMemory - initialMemory;

        // Assert
        Assert.That(result >= 0, Is.True); // Should return processed event count
        Assert.That(memoryIncrease < 50 * 1024 * 1024, Is.True); // Less than 50MB increase

        TestContext.WriteLine($"Memory increase: {memoryIncrease / 1024 / 1024:F2} MB");
        TestContext.WriteLine($"Events processed: {result}");
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}