using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class MobileAnalyticsControllerTests
{
    private Mock<IEventEngagementAnalyticsService> _analyticsServiceMock = null!;
    private Mock<IClubAuthorizationService> _clubAuthorizationServiceMock = null!;
    private Mock<ILogger<MobileAnalyticsController>> _loggerMock = null!;
    private GatherGroveDbContext _dbContext = null!;
    private MobileAnalyticsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _analyticsServiceMock = new Mock<IEventEngagementAnalyticsService>();
        _clubAuthorizationServiceMock = new Mock<IClubAuthorizationService>();
        _loggerMock = new Mock<ILogger<MobileAnalyticsController>>();
        _dbContext = new GatherGroveDbContext(new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        _dbContext.Events.AddRange(
            new Event { Id = 1, ClubId = 1, Name = "Club 1 Event", EventDateTime = DateTime.UtcNow },
            new Event { Id = 99, ClubId = 2, Name = "Club 2 Event", EventDateTime = DateTime.UtcNow });
        _dbContext.SaveChanges();

        _controller = new MobileAnalyticsController(
            _analyticsServiceMock.Object,
            _clubAuthorizationServiceMock.Object,
            _dbContext,
            _loggerMock.Object);

        // Setup default HTTP context with authenticated user
        SetupAuthenticatedUser(userId: 1, clubId: 1);
    }

    [TearDown]
    public void TearDown()
    {
        _dbContext.Dispose();
    }

    private void SetupAuthenticatedUser(int userId, int clubId = 1)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, "Member"),
            new("ClubId", clubId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private void SetupUnauthenticatedUser()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Role, "Member")
            // No NameIdentifier claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region GetEventEngagementAnalytics Tests

    [Test]
    public async Task GetEventEngagementAnalytics_ValidRequest_ReturnsOkWithAnalytics()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        var expectedAnalytics = new EventEngagementAnalyticsReportDto
        {
            ClubId = clubId,
            TotalEvents = 1,
            TotalRegistrations = 50,
            TotalAttendees = 45
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        _analyticsServiceMock
            .Setup(s => s.GetEventEngagementAnalyticsReportAsync(
                It.Is<EventEngagementAnalyticsQuery>(q =>
                    q.ClubId == clubId),
                userId))
            .ReturnsAsync(expectedAnalytics);

        // Act
        var result = await _controller.GetEventEngagementAnalytics(clubId, eventId, startDate, endDate);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var analytics = okResult.Value as EventEngagementAnalyticsReportDto;
        analytics.Should().NotBeNull();
        analytics!.ClubId.Should().Be(clubId);
    }

    [Test]
    public async Task GetEventEngagementAnalytics_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var eventId = 1;

        // Act
        var result = await _controller.GetEventEngagementAnalytics(clubId, eventId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        // Verify services were never called
        _clubAuthorizationServiceMock.Verify(
            s => s.ValidateClubAccessAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetEventEngagementAnalytics_InvalidClubAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEventEngagementAnalytics(clubId, eventId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetEventEngagementAnalytics_UnauthorizedAccessException_Returns403()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        _analyticsServiceMock
            .Setup(s => s.GetEventEngagementAnalyticsReportAsync(It.IsAny<EventEngagementAnalyticsQuery>(), userId))
            .ThrowsAsync(new UnauthorizedAccessException("User not authorized for this event"));

        // Act
        var result = await _controller.GetEventEngagementAnalytics(clubId, eventId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(403);
    }

    [Test]
    public async Task GetEventEngagementAnalytics_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        _analyticsServiceMock
            .Setup(s => s.GetEventEngagementAnalyticsReportAsync(It.IsAny<EventEngagementAnalyticsQuery>(), userId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEventEngagementAnalytics(clubId, eventId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetMemberEngagementInsights Tests

    [Test]
    public async Task GetMemberEngagementInsights_ValidRequest_ReturnsOkWithInsights()
    {
        // Arrange
        var clubId = 1;
        var memberId = 10;
        var userId = 1;
        var periodDays = 90;

        var expectedInsights = new MemberEngagementInsights
        {
            MemberId = memberId,
            ClubId = clubId,
            TotalEventsAttended = 15,
            AverageEngagementScore = 85.5m
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        _analyticsServiceMock
            .Setup(s => s.GetMemberEngagementInsightsAsync(clubId, memberId, userId, periodDays))
            .ReturnsAsync(expectedInsights);

        // Act
        var result = await _controller.GetMemberEngagementInsights(clubId, memberId, periodDays);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var insights = okResult.Value as MemberEngagementInsights;
        insights.Should().NotBeNull();
        insights!.MemberId.Should().Be(memberId);
        insights.ClubId.Should().Be(clubId);
    }

    [Test]
    public async Task GetMemberEngagementInsights_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;

        // Act
        var result = await _controller.GetMemberEngagementInsights(clubId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task GetMemberEngagementInsights_NonAdminViewingOtherMemberWithoutAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var memberId = 10;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetMemberEngagementInsights(clubId, memberId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetMemberEngagementInsights_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var memberId = 10;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        _analyticsServiceMock
            .Setup(s => s.GetMemberEngagementInsightsAsync(clubId, memberId, userId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetMemberEngagementInsights(clubId, memberId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetEventPerformanceAnalysis Tests

    [Test]
    public async Task GetEventPerformanceAnalysis_ValidRequest_ReturnsOkWithAnalysis()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userId = 1;

        var expectedAnalysis = new EventPerformanceAnalysis
        {
            EventId = eventId,
            PerformanceScore = 85.5m,
            AttendanceAnalysis = new AttendanceAnalysis
            {
                TotalRsvps = 50,
                TotalAttended = 45,
                AttendanceRate = 90.0m
            }
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        _analyticsServiceMock
            .Setup(s => s.AnalyzeEventPerformanceAsync(eventId))
            .ReturnsAsync(expectedAnalysis);

        // Act
        var result = await _controller.GetEventPerformanceAnalysis(clubId, eventId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var analysis = okResult.Value as EventPerformanceAnalysis;
        analysis.Should().NotBeNull();
        analysis!.EventId.Should().Be(eventId);
    }

    [Test]
    public async Task GetEventPerformanceAnalysis_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var eventId = 1;

        // Act
        var result = await _controller.GetEventPerformanceAnalysis(clubId, eventId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task GetEventPerformanceAnalysis_InvalidClubAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEventPerformanceAnalysis(clubId, eventId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetEventPerformanceAnalysis_EventFromDifferentClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 99;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.GetEventPerformanceAnalysis(clubId, eventId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
        _analyticsServiceMock.Verify(s => s.AnalyzeEventPerformanceAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task GetEventPerformanceAnalysis_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        _analyticsServiceMock
            .Setup(s => s.AnalyzeEventPerformanceAsync(eventId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEventPerformanceAnalysis(clubId, eventId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetROIMetrics Tests

    [Test]
    public async Task GetROIMetrics_ValidRequest_ReturnsOkWithMetrics()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var periodMonths = 6;

        var expectedMetrics = new EventROIMetrics
        {
            ClubId = clubId,
            AnalysisPeriodMonths = periodMonths,
            TotalEventCosts = 7000m,
            TotalMemberValue = 10000m,
            ROIPercentage = 42.86m
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        _analyticsServiceMock
            .Setup(s => s.CalculateROIMetricsAsync(clubId, periodMonths))
            .ReturnsAsync(expectedMetrics);

        // Act
        var result = await _controller.GetROIMetrics(clubId, periodMonths);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var metrics = okResult.Value as EventROIMetrics;
        metrics.Should().NotBeNull();
        metrics!.ClubId.Should().Be(clubId);
        metrics.ROIPercentage.Should().Be(42.86m);
    }

    [Test]
    public async Task GetROIMetrics_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;

        // Act
        var result = await _controller.GetROIMetrics(clubId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task GetROIMetrics_InvalidClubAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetROIMetrics(clubId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetROIMetrics_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        _analyticsServiceMock
            .Setup(s => s.CalculateROIMetricsAsync(clubId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetROIMetrics(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetBasicEventAnalytics Tests

    [Test]
    public async Task GetBasicEventAnalytics_ValidRequest_ReturnsOkWithBasicAnalytics()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userId = 1;

        var expectedAnalysis = new EventPerformanceAnalysis
        {
            EventId = eventId,
            PerformanceScore = 85.5m,
            ComparisonToAverage = new PerformanceComparison
            {
                AttendanceRateVsAverage = 10.5m,
                EngagementScoreVsAverage = 12.3m
            },
            AttendanceAnalysis = new AttendanceAnalysis
            {
                TotalRsvps = 50,
                TotalAttended = 45,
                AttendanceRate = 90.0m
            }
        };

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        _analyticsServiceMock
            .Setup(s => s.AnalyzeEventPerformanceAsync(eventId))
            .ReturnsAsync(expectedAnalysis);

        // Act
        var result = await _controller.GetBasicEventAnalytics(clubId, eventId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var value = okResult.Value;
        value.Should().NotBeNull();
    }

    [Test]
    public async Task GetBasicEventAnalytics_NoUserIdClaim_ReturnsUnauthorized()
    {
        // Arrange
        SetupUnauthenticatedUser();
        var clubId = 1;
        var eventId = 1;

        // Act
        var result = await _controller.GetBasicEventAnalytics(clubId, eventId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);
    }

    [Test]
    public async Task GetBasicEventAnalytics_InvalidClubAccess_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetBasicEventAnalytics(clubId, eventId);

        // Assert
        var forbidResult = result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    [Test]
    public async Task GetBasicEventAnalytics_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var userId = 1;

        _clubAuthorizationServiceMock
            .Setup(s => s.ValidateClubAccessAsync(clubId, userId))
            .ReturnsAsync(true);

        _analyticsServiceMock
            .Setup(s => s.AnalyzeEventPerformanceAsync(eventId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetBasicEventAnalytics(clubId, eventId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion
}
