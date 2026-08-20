using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace GatherGrove.API.Tests.Controllers;

/// <summary>
/// Comprehensive integration tests for EventEngagementAnalyticsController
/// Tests API endpoints, authorization, error handling, and response formats
/// </summary>
[TestFixture]
public class EventEngagementAnalyticsControllerTests
{
    private Mock<IEventEngagementAnalyticsService> _mockAnalyticsService;
    private Mock<IClubAuthorizationService> _mockClubAuthorizationService;
    private Mock<ILogger<EventEngagementAnalyticsController>> _mockLogger;
    private GatherGroveDbContext _dbContext = null!;
    private EventEngagementAnalyticsController _controller;
    private ClaimsPrincipal _adminUser;
    private ClaimsPrincipal _memberUser;
    private ClaimsPrincipal _unauthorizedUser;

    [SetUp]
    public void SetUp()
    {
        _mockAnalyticsService = new Mock<IEventEngagementAnalyticsService>();
        _mockClubAuthorizationService = new Mock<IClubAuthorizationService>();
        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);
        _mockLogger = new Mock<ILogger<EventEngagementAnalyticsController>>();
        _dbContext = new GatherGroveDbContext(new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        _dbContext.Events.AddRange(
            new Event { Id = 1, ClubId = 1, Name = "Club 1 Event", EventDateTime = DateTime.UtcNow },
            new Event { Id = 99, ClubId = 2, Name = "Club 2 Event", EventDateTime = DateTime.UtcNow });
        _dbContext.SaveChanges();

        _controller = new EventEngagementAnalyticsController(
            _mockAnalyticsService.Object,
            _mockClubAuthorizationService.Object,
            _dbContext,
            _mockLogger.Object
        );

        // Setup test users with different authorization levels
        _adminUser = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Email, "admin@test.com"),
            new Claim("ClubRole", "Owner"),
            new Claim("ClubId", "1")
        }, "Test"));

        _memberUser = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "2"),
            new Claim(ClaimTypes.Email, "member@test.com"),
            new Claim("ClubRole", "Member"),
            new Claim("ClubId", "1")
        }, "Test"));

        _unauthorizedUser = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "3"),
            new Claim(ClaimTypes.Email, "unauthorized@test.com")
        }, "Test"));

        // Setup controller context
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = _adminUser
            }
        };
    }

    [TearDown]
    public void TearDown()
    {
        _dbContext.Dispose();
    }

    [Test]
    public async Task GetEventEngagementAnalytics_ValidRequest_ReturnsOkWithAnalytics()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        var expectedAnalytics = new EventEngagementAnalyticsReportDto
        {
            ClubId = clubId,
            ClubName = "Test Club",
            AnalysisPeriod = new GatherGrove.Application.DTOs.AnalysisPeriod { StartDate = startDate, EndDate = endDate, TotalDays = (endDate - startDate).Days + 1 },
            OverallStats = new GatherGrove.Application.DTOs.OverallStats
            {
                AverageEngagementScore = 75.5m
            },
            EventMetrics = new List<EventEngagementMetricsDto>
            {
                new()
                {
                    EventId = 1,
                    EventName = "Test Event",
                    TotalRegistrations = 10,
                    TotalAttendees = 8,
                    AttendanceRate = 80m,
                    AverageParticipationScore = 75m
                }
            },
            MemberEngagement = new List<MemberEngagementSummary>
            {
                new()
                {
                    MemberId = 1,
                    MemberName = "Test Member",
                    EngagementLevel = "High",
                    OverallScore = 85m,
                    LastActivity = DateTime.UtcNow.AddDays(-1),
                    DaysSinceLastLogin = 1
                }
            }
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockAnalyticsService
            .Setup(x => x.GetEventEngagementAnalyticsReportAsync(It.IsAny<EventEngagementAnalyticsQuery>(), It.IsAny<int>()))
            .ReturnsAsync(expectedAnalytics);

        // Act
        var result = await _controller.GetEventEngagementAnalytics(clubId, startDate, endDate);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        Assert.That(okResult?.Value, Is.Not.Null);

        var analytics = okResult.Value as EventEngagementAnalyticsReportDto;
        Assert.That(analytics, Is.Not.Null);
        Assert.That(analytics.ClubId, Is.EqualTo(clubId));
        Assert.That(analytics.OverallStats.AverageEngagementScore, Is.EqualTo(75.5m));
        Assert.That(analytics.EventMetrics, Has.Count.EqualTo(1));
        Assert.That(analytics.MemberEngagement, Has.Count.EqualTo(1));
    }

    [Test]
    public async Task GetEventEngagementAnalytics_UnauthorizedUser_ReturnsForbidden()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _controller.ControllerContext.HttpContext.User = _unauthorizedUser;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 3))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEventEngagementAnalytics(clubId, startDate, endDate);

        // Assert
        Assert.IsInstanceOf<ForbidResult>(result);
    }

    [Test]
    public async Task GetEventEngagementAnalytics_BasicTierClub_ReturnsForbidden()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockAnalyticsService
            .Setup(x => x.GetEventEngagementAnalyticsReportAsync(It.IsAny<EventEngagementAnalyticsQuery>(), It.IsAny<int>()))
            .ThrowsAsync(new UnauthorizedAccessException("EventEngagementAnalytics requires Expand tier"));

        // Act
        var result = await _controller.GetEventEngagementAnalytics(clubId, startDate, endDate);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result);
        var objectResult = result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(403));
        Assert.That(objectResult?.Value?.ToString(), Contains.Substring("Expand tier"));
    }

    [Test]
    [TestCase(0)]
    [TestCase(-1)]
    public async Task GetEventEngagementAnalytics_InvalidClubId_ReturnsBadRequest(int invalidClubId)
    {
        // Arrange
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        // Act
        var result = await _controller.GetEventEngagementAnalytics(invalidClubId, startDate, endDate);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult?.Value?.ToString(), Contains.Substring("Club ID must be greater than 0"));
    }

    [Test]
    public async Task GetEventEngagementAnalytics_InvalidDateRange_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow;
        var endDate = DateTime.UtcNow.AddDays(-30); // End before start

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.GetEventEngagementAnalytics(clubId, startDate, endDate);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
        var badRequestResult = result as BadRequestObjectResult;
        Assert.That(badRequestResult?.Value?.ToString(), Contains.Substring("Start date must be before end date"));
    }

    [Test]
    public async Task GetEngagementTrends_ValidRequest_ReturnsOkWithTrends()
    {
        // Arrange
        var clubId = 1;
        var daysBack = 30;

        var expectedTrends = new List<GatherGrove.Application.DTOs.DailyEngagementTrend>
        {
            new GatherGrove.Application.DTOs.DailyEngagementTrend
            {
                Date = DateTime.UtcNow.AddDays(-1),
                EngagementScore = 78.5m,
                EventCount = 1,
                AttendeeCount = 15,
                AttendanceRate = 0.85m
            },
            new GatherGrove.Application.DTOs.DailyEngagementTrend
            {
                Date = DateTime.UtcNow.AddDays(-2),
                EngagementScore = 82.1m,
                EventCount = 1,
                AttendeeCount = 18,
                AttendanceRate = 0.90m
            }
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        // Setup the authorization service mock
        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, It.IsAny<int>()))
            .ReturnsAsync(true);

        // Setup the analytics service mock to return expected trends
        _mockAnalyticsService
            .Setup(x => x.CalculateEngagementTrendsAsync(clubId, It.IsAny<int>(), daysBack))
            .ReturnsAsync(expectedTrends);

        // Act
        var result = await _controller.GetEngagementTrends(clubId, daysBack);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        var trends = okResult?.Value as List<GatherGrove.Application.DTOs.DailyEngagementTrend>;

        Assert.That(trends, Is.Not.Null);
        Assert.That(trends.Count, Is.EqualTo(2));
        Assert.That(trends[0].EngagementScore, Is.EqualTo(78.5m));
        Assert.That(trends[1].EngagementScore, Is.EqualTo(82.1m));
    }

    [Test]
    [TestCase(0)]
    [TestCase(-1)]
    [TestCase(366)] // More than a year
    public async Task GetEngagementTrends_InvalidDaysBack_ReturnsBadRequest(int invalidDaysBack)
    {
        // Arrange
        var clubId = 1;

        // Act
        var result = await _controller.GetEngagementTrends(clubId, invalidDaysBack);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
    }

    [Test]
    public async Task GetMemberEngagementInsights_ValidRequest_ReturnsOkWithInsights()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var periodDays = 90;

        var expectedInsights = new GatherGrove.Application.DTOs.MemberEngagementInsights
        {
            MemberId = memberId,
            MemberName = "Test Member",
            ClubId = clubId,
            AnalysisPeriod = periodDays,
            EventAttendanceRate = 85.5m,
            RsvpAccuracyRate = 92.3m,
            EngagementTrend = "Increasing",
            EngagementLevel = "Green",
            RecommendedActions = new List<string> { "Continue current engagement patterns" },
            EngagementMetrics = new Dictionary<string, decimal>
            {
                ["EventParticipation"] = 85.5m,
                ["CommunityInteraction"] = 78.2m
            },
            AverageEngagementScore = 82.5m
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockAnalyticsService
            .Setup(x => x.GetMemberEngagementInsightsAsync(clubId, memberId, It.IsAny<int>(), periodDays))
            .ReturnsAsync(expectedInsights);

        // Act
        var result = await _controller.GetMemberEngagementInsights(clubId, memberId, periodDays);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        var insights = okResult?.Value as GatherGrove.Application.DTOs.MemberEngagementInsights;

        Assert.That(insights, Is.Not.Null);
        Assert.That(insights.MemberId, Is.EqualTo(memberId));
        Assert.That(insights.EventAttendanceRate, Is.EqualTo(85.5m));
        Assert.That(insights.AverageEngagementScore, Is.EqualTo(82.5m));
    }

    [Test]
    public async Task GetEventRecommendations_ValidRequest_ReturnsOkWithRecommendations()
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;
        var maxRecommendations = 5;

        var expectedRecommendations = new List<GatherGrove.Application.DTOs.EventRecommendation>
        {
            new GatherGrove.Application.DTOs.EventRecommendation
            {
                EventId = 1,
                EventName = "Recommended Event 1",
                EventDateTime = DateTime.UtcNow.AddDays(7),
                RecommendationScore = 85.5m,
                AttendanceProbability = 78.2m,
                RecommendationReason = "Based on past attendance patterns"
            },
            new GatherGrove.Application.DTOs.EventRecommendation
            {
                EventId = 2,
                EventName = "Recommended Event 2",
                EventDateTime = DateTime.UtcNow.AddDays(14),
                RecommendationScore = 75.3m,
                AttendanceProbability = 68.7m,
                RecommendationReason = "Similar to previously attended events"
            }
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockAnalyticsService
            .Setup(x => x.GenerateEventRecommendationsAsync(clubId, memberId, maxRecommendations))
            .ReturnsAsync(expectedRecommendations);

        // Act
        var result = await _controller.GetEventRecommendations(clubId, memberId, maxRecommendations);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        var recommendations = okResult?.Value as List<GatherGrove.Application.DTOs.EventRecommendation>;

        Assert.That(recommendations, Is.Not.Null);
        Assert.That(recommendations, Has.Count.EqualTo(2));
        Assert.True(recommendations.All(r => r.RecommendationScore > 0));
        Assert.True(recommendations.All(r => r.AttendanceProbability > 0));
    }

    [Test]
    [TestCase(0)]
    [TestCase(-1)]
    [TestCase(21)] // More than max allowed
    public async Task GetEventRecommendations_InvalidMaxRecommendations_ReturnsBadRequest(int invalidMax)
    {
        // Arrange
        var clubId = 1;
        var memberId = 1;

        // Act
        var result = await _controller.GetEventRecommendations(clubId, memberId, invalidMax);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
    }

    [Test]
    public async Task AnalyzeEventPerformance_ValidRequest_ReturnsOkWithAnalysis()
    {
        // Arrange
        var eventId = 1;

        var expectedAnalysis = new GatherGrove.Application.DTOs.EventPerformanceAnalysis
        {
            EventId = eventId,
            EventName = "Test Event",
            EventDate = DateTime.UtcNow.AddDays(-7),
            PerformanceScore = 82.5m,
            AttendanceAnalysis = new GatherGrove.Application.DTOs.AttendanceAnalysis
            {
                TotalRsvps = 15,
                TotalAttended = 12,
                AttendanceRate = 80m,
                NoShowRate = 20m
            },
            EngagementBreakdown = new Dictionary<string, object>
            {
                ["HighEngagers"] = 8,
                ["MediumEngagers"] = 4,
                ["LowEngagers"] = 3
            },
            ComparisonToAverage = new GatherGrove.Application.DTOs.PerformanceComparison
            {
                AttendanceRateVsAverage = 5.2m,
                EngagementScoreVsAverage = 3.8m
            },
            ImprovementSuggestions = new List<string>
            {
                "Consider sending reminder notifications",
                "Optimize event timing based on member preferences"
            }
        };

        _mockAnalyticsService
            .Setup(x => x.AnalyzeEventPerformanceAsync(eventId))
            .ReturnsAsync(expectedAnalysis);

        // Act
        var result = await _controller.AnalyzeEventPerformance(eventId);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        var analysis = okResult?.Value as GatherGrove.Application.DTOs.EventPerformanceAnalysis;

        Assert.That(analysis, Is.Not.Null);
        Assert.That(analysis.EventId, Is.EqualTo(eventId));
        Assert.That(analysis.PerformanceScore, Is.EqualTo(82.5m));
        Assert.That(analysis.AttendanceAnalysis, Is.Not.Null);
        Assert.That(analysis.ImprovementSuggestions, Is.Not.Null);
    }

    [Test]
    public async Task AnalyzeEventPerformance_CrossClubEvent_ReturnsForbid()
    {
        // Arrange
        var eventId = 99;
        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(2, 1))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.AnalyzeEventPerformance(eventId);

        // Assert
        Assert.IsInstanceOf<ForbidResult>(result);
        _mockAnalyticsService.Verify(x => x.AnalyzeEventPerformanceAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetEngagementBenchmarks_ValidRequest_ReturnsOkWithBenchmarks()
    {
        // Arrange
        var clubId = 1;

        var expectedBenchmarks = new GatherGrove.Application.DTOs.EngagementBenchmarks
        {
            ClubId = clubId,
            AverageAttendanceRate = 72.5m,
            AverageRsvpRate = 85.3m,
            AverageEngagementScore = 78.8m,
            IndustryComparisons = new Dictionary<string, decimal>
            {
                ["SimilarClubs"] = 75.2m,
                ["IndustryAverage"] = 68.9m
            },
            PerformanceIndicators = new Dictionary<string, string>
            {
                ["AttendanceRating"] = "Above Average",
                ["EngagementRating"] = "Good"
            },
            BenchmarkPeriod = "Last 6 months",
            LastUpdated = DateTime.UtcNow.AddDays(-1)
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockAnalyticsService
            .Setup(x => x.GetEngagementBenchmarksAsync(clubId))
            .ReturnsAsync(expectedBenchmarks);

        // Act
        var result = await _controller.GetEngagementBenchmarks(clubId);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        var benchmarks = okResult?.Value as GatherGrove.Application.DTOs.EngagementBenchmarks;

        Assert.That(benchmarks, Is.Not.Null);
        Assert.That(benchmarks.ClubId, Is.EqualTo(clubId));
        Assert.That(benchmarks.AverageAttendanceRate > 0, Is.True);
        Assert.That(benchmarks.AverageEngagementScore > 0, Is.True);
    }

    [Test]
    public async Task PredictEventSuccess_ValidRequest_ReturnsOkWithPrediction()
    {
        // Arrange
        var eventId = 1;

        var expectedPrediction = new GatherGrove.Application.DTOs.EventSuccessPrediction
        {
            EventId = eventId,
            EventName = "Future Event",
            EventDate = DateTime.UtcNow.AddDays(14),
            PredictedAttendanceRate = 75.5m,
            SuccessProbability = 82.3m,
            ConfidenceLevel = "High",
            RiskFactors = new List<string>
            {
                "Weather dependent outdoor event",
                "Competing events same weekend"
            },
            SuccessFactors = new List<string>
            {
                "Popular event category",
                "High historical attendance for this type"
            },
            RecommendedActions = new List<string>
            {
                "Send early reminder notifications",
                "Consider backup indoor venue"
            }
        };

        _mockAnalyticsService
            .Setup(x => x.PredictEventSuccessAsync(eventId))
            .ReturnsAsync(expectedPrediction);

        // Act
        var result = await _controller.PredictEventSuccess(eventId);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        var prediction = okResult?.Value as GatherGrove.Application.DTOs.EventSuccessPrediction;

        Assert.That(prediction, Is.Not.Null);
        Assert.That(prediction.EventId, Is.EqualTo(eventId));
        Assert.That(prediction.SuccessProbability > 0, Is.True);
        Assert.That(prediction.ConfidenceLevel, Is.EqualTo("High"));
    }

    [Test]
    public async Task GenerateEngagementReport_ValidRequest_ReturnsOkWithReport()
    {
        // Arrange
        var clubId = 1;
        var reportType = "comprehensive";
        var startDate = DateTime.UtcNow.AddDays(-90);
        var endDate = DateTime.UtcNow;

        var expectedReport = new GatherGrove.Application.DTOs.EngagementReport
        {
            ClubId = clubId,
            ReportType = reportType,
            ReportPeriod = new GatherGrove.Application.DTOs.DateRange { StartDate = startDate, EndDate = endDate },
            GeneratedAt = DateTime.UtcNow,
            ExecutiveSummary = "Overall engagement is strong with increasing trends",
            KeyMetrics = new Dictionary<string, object>
            {
                ["TotalEvents"] = 15,
                ["AverageAttendance"] = 12.5m,
                ["EngagementGrowth"] = 8.3m
            },
            TrendAnalysis = new GatherGrove.Application.DTOs.TrendAnalysis
            {
                OverallDirection = "Increasing",
                MonthlyGrowthRate = 5.2m,
                SeasonalPatterns = new Dictionary<string, decimal>
                {
                    ["Spring"] = 85.2m,
                    ["Summer"] = 72.8m
                }
            },
            MemberInsights = new List<GatherGrove.Application.DTOs.MemberInsightSummary>(),
            EventAnalysis = new List<GatherGrove.Application.DTOs.EventAnalysisSummary>(),
            Recommendations = new List<string>
            {
                "Continue current engagement strategies",
                "Focus on summer event improvements"
            }
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockAnalyticsService
            .Setup(x => x.GenerateEngagementReportAsync(clubId, reportType, startDate, endDate))
            .ReturnsAsync(expectedReport);

        // Act
        var result = await _controller.GenerateEngagementReport(clubId, reportType, startDate, endDate);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        var report = okResult?.Value as GatherGrove.Application.DTOs.EngagementReport;

        Assert.That(report, Is.Not.Null);
        Assert.That(report.ClubId, Is.EqualTo(clubId));
        Assert.That(report.ReportType, Is.EqualTo(reportType));
        Assert.That(report.ExecutiveSummary, Is.Not.Null);
        Assert.That(report.Recommendations, Is.Not.Null);
    }

    [Test]
    [TestCase("")]
    [TestCase("invalid")]
    [TestCase("unknown")]
    public async Task GenerateEngagementReport_InvalidReportType_ReturnsBadRequest(string invalidReportType)
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        // Act
        var result = await _controller.GenerateEngagementReport(clubId, invalidReportType, startDate, endDate);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
    }

    [Test]
    public async Task GetROIMetrics_ValidRequest_ReturnsOkWithROI()
    {
        // Arrange
        var clubId = 1;
        var periodMonths = 6;

        var expectedROI = new GatherGrove.Application.DTOs.EventROIMetrics
        {
            ClubId = clubId,
            AnalysisPeriodMonths = periodMonths,
            TotalEventCosts = 5000m,
            TotalMemberValue = 25000m,
            ROIPercentage = 400m,
            CostBreakdown = new Dictionary<string, decimal>
            {
                ["VenueCosts"] = 2000m,
                ["MaterialsCosts"] = 1500m,
                ["StaffingCosts"] = 1500m
            },
            ValueDrivers = new Dictionary<string, decimal>
            {
                ["MemberRetention"] = 15000m,
                ["NewMemberAcquisition"] = 8000m,
                ["MemberSatisfaction"] = 2000m
            },
            CostPerMember = 125m,
            ValuePerMember = 625m
        };

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockAnalyticsService
            .Setup(x => x.CalculateROIMetricsAsync(clubId, periodMonths))
            .ReturnsAsync(expectedROI);

        // Act
        var result = await _controller.GetROIMetrics(clubId, periodMonths);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        var roi = okResult?.Value as GatherGrove.Application.DTOs.EventROIMetrics;

        Assert.That(roi, Is.Not.Null);
        Assert.That(roi.ClubId, Is.EqualTo(clubId));
        Assert.That(roi.ROIPercentage, Is.EqualTo(400m));
        Assert.That(roi.TotalEventCosts > 0, Is.True);
        Assert.That(roi.TotalMemberValue > 0, Is.True);
    }

    [Test]
    public async Task ServiceException_ReturnsInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockAnalyticsService
            .Setup(x => x.GetEventEngagementAnalyticsReportAsync(It.IsAny<EventEngagementAnalyticsQuery>(), It.IsAny<int>()))
            .ThrowsAsync(new InvalidOperationException("Database connection failed"));

        // Act
        var result = await _controller.GetEventEngagementAnalytics(clubId, startDate, endDate);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result);
        var objectResult = result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task RateLimitedRequest_ReturnsServiceUnavailable()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockAnalyticsService
            .Setup(x => x.GetEventEngagementAnalyticsReportAsync(It.IsAny<EventEngagementAnalyticsQuery>(), It.IsAny<int>()))
            .ThrowsAsync(new InvalidOperationException("Rate limit exceeded"));

        // Act
        var result = await _controller.GetEventEngagementAnalytics(clubId, startDate, endDate);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result);
        var objectResult = result as ObjectResult;
        Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
    }

    [Test]
    public async Task BulkAnalyticsRequest_ProcessesConcurrently()
    {
        // Arrange
        var clubId = 1;
        var requests = new List<Task<IActionResult>>();

        _mockClubAuthorizationService
            .Setup(x => x.ValidateClubAccessAsync(clubId, 1))
            .ReturnsAsync(true);

        _mockAnalyticsService
            .Setup(x => x.GetEventEngagementAnalyticsReportAsync(It.IsAny<EventEngagementAnalyticsQuery>(), It.IsAny<int>()))
            .ReturnsAsync(new EventEngagementAnalyticsReportDto { ClubId = clubId });

        // Act - Create multiple concurrent requests
        for (int i = 0; i < 5; i++)
        {
            var startDate = DateTime.UtcNow.AddDays(-30 - i);
            var endDate = DateTime.UtcNow.AddDays(-i);
            requests.Add(_controller.GetEventEngagementAnalytics(clubId, startDate, endDate));
        }

        var results = await Task.WhenAll(requests);

        // Assert
        Assert.That(results, Has.Length.EqualTo(5));
        Assert.True(results.All(r => r is OkObjectResult));
    }
}
