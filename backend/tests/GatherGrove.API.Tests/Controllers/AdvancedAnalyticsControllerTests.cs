using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Analytics;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using AppClubAuthorizationService = GatherGrove.Application.Services.IClubAuthorizationService;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class AdvancedAnalyticsControllerTests
{
    private Mock<GatherGrove.Application.Services.Interfaces.IAdvancedAnalyticsService> _analyticsServiceMock = null!;
    private Mock<GatherGrove.Application.Services.IEventEngagementAnalyticsService> _eventAnalyticsServiceMock = null!;
    private Mock<AppClubAuthorizationService> _clubAuthorizationServiceMock = null!;
    private GatherGroveDbContext _dbContext = null!;
    private Mock<ILogger<AdvancedAnalyticsController>> _loggerMock = null!;
    private AdvancedAnalyticsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _analyticsServiceMock = new Mock<GatherGrove.Application.Services.Interfaces.IAdvancedAnalyticsService>();
        _eventAnalyticsServiceMock = new Mock<GatherGrove.Application.Services.IEventEngagementAnalyticsService>();
        _clubAuthorizationServiceMock = new Mock<AppClubAuthorizationService>();
        _clubAuthorizationServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<int>()))
            .ReturnsAsync(true);
        _dbContext = new GatherGroveDbContext(new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        _dbContext.Events.AddRange(
            new Event { Id = 1, ClubId = 1, Name = "Club 1 Event", EventDateTime = DateTime.UtcNow },
            new Event { Id = 99, ClubId = 2, Name = "Club 2 Event", EventDateTime = DateTime.UtcNow });
        _dbContext.SaveChanges();
        _loggerMock = new Mock<ILogger<AdvancedAnalyticsController>>();

        _controller = new AdvancedAnalyticsController(
            _analyticsServiceMock.Object,
            _eventAnalyticsServiceMock.Object,
            _clubAuthorizationServiceMock.Object,
            _dbContext,
            _loggerMock.Object);

        // Setup default HTTP context with authenticated user
        SetupAuthenticatedUser(userId: 1);
    }

    [TearDown]
    public void TearDown()
    {
        _dbContext.Dispose();
    }

    private void SetupAuthenticatedUser(int userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, "Admin")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    #region GetEngagementTrends Tests

    [Test]
    public async Task GetEngagementTrends_ValidDates_ReturnsOkWithTrends()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var expectedTrends = new List<EngagementTrendDto>
        {
            new() { Period = "Week 1", AverageScore = 75.5, MemberEngagement = 70.0, EventAttendance = 80.0 },
            new() { Period = "Week 2", AverageScore = 82.3, MemberEngagement = 85.0, EventAttendance = 78.0 }
        };

        _analyticsServiceMock
            .Setup(s => s.GetEngagementTrendsAsync(clubId, startDate, endDate))
            .ReturnsAsync(expectedTrends);

        // Act
        var result = await _controller.GetEngagementTrends(clubId, startDate, endDate);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var trends = okResult.Value as List<EngagementTrendDto>;
        trends.Should().NotBeNull();
        trends!.Count.Should().Be(2);
    }

    [Test]
    public async Task GetEngagementTrends_CrossClubRoute_ReturnsForbid()
    {
        // Arrange
        var clubId = 2;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        _clubAuthorizationServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetEngagementTrends(clubId, startDate, endDate);

        // Assert
        result.Result.Should().BeOfType<ForbidResult>();
        _analyticsServiceMock.Verify(
            s => s.GetEngagementTrendsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()),
            Times.Never);
    }

    [Test]
    public async Task GetEngagementTrends_StartDateAfterEndDate_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow;
        var endDate = DateTime.UtcNow.AddDays(-30);

        // Act
        var result = await _controller.GetEngagementTrends(clubId, startDate, endDate);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Start date must be before end date");

        // Verify service was never called
        _analyticsServiceMock.Verify(
            s => s.GetEngagementTrendsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()),
            Times.Never);
    }

    [Test]
    public async Task GetEngagementTrends_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _analyticsServiceMock
            .Setup(s => s.GetEngagementTrendsAsync(clubId, startDate, endDate))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetEngagementTrends(clubId, startDate, endDate);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetCohortAnalysis Tests

    [Test]
    public async Task GetCohortAnalysis_ValidDates_ReturnsOkWithCohorts()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-90);
        var endDate = DateTime.UtcNow;
        var expectedCohorts = new List<CohortDto>
        {
            new() { Cohort = "Q1 2024", TotalMembers = 50, ChurnRate = 15.0, AverageLifetime = 12.5 }
        };

        _analyticsServiceMock
            .Setup(s => s.GetCohortAnalysisAsync(clubId, startDate, endDate))
            .ReturnsAsync(expectedCohorts);

        // Act
        var result = await _controller.GetCohortAnalysis(clubId, startDate, endDate);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var cohorts = okResult.Value as List<CohortDto>;
        cohorts.Should().NotBeNull();
        cohorts!.Count.Should().Be(1);
    }

    [Test]
    public async Task GetCohortAnalysis_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-90);
        var endDate = DateTime.UtcNow;

        _analyticsServiceMock
            .Setup(s => s.GetCohortAnalysisAsync(clubId, startDate, endDate))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetCohortAnalysis(clubId, startDate, endDate);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region CompareEvents Tests

    [Test]
    public async Task CompareEvents_ValidEventIds_ReturnsOkWithComparison()
    {
        // Arrange
        var clubId = 1;
        var request = new EventComparisonRequestDto
        {
            EventIds = new List<int> { 1, 2, 3 }
        };
        var expectedComparison = new List<EventComparisonDto>
        {
            new() { EventId = 1, EventName = "Event 1", Attendance = 85, EngagementScore = 78.5, ROI = 120.5 },
            new() { EventId = 2, EventName = "Event 2", Attendance = 90, EngagementScore = 85.2, ROI = 135.0 }
        };

        _analyticsServiceMock
            .Setup(s => s.CompareEventsAsync(clubId, request.EventIds))
            .ReturnsAsync(expectedComparison);

        // Act
        var result = await _controller.CompareEvents(clubId, request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task CompareEvents_EmptyEventIdsList_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new EventComparisonRequestDto
        {
            EventIds = new List<int>()
        };

        // Act
        var result = await _controller.CompareEvents(clubId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("At least one event ID must be provided");
    }

    [Test]
    public async Task CompareEvents_MoreThan10Events_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new EventComparisonRequestDto
        {
            EventIds = Enumerable.Range(1, 11).ToList()
        };

        // Act
        var result = await _controller.CompareEvents(clubId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Cannot compare more than 10 events at once");
    }

    [Test]
    public async Task CompareEvents_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new EventComparisonRequestDto
        {
            EventIds = new List<int> { 1, 2 }
        };

        _analyticsServiceMock
            .Setup(s => s.CompareEventsAsync(clubId, request.EventIds))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CompareEvents(clubId, request);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region ExportData Tests

    [Test]
    public async Task ExportData_ValidRequest_ReturnsOkWithExportResponse()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new ExportRequestDto
        {
            DataType = "engagement",
            Format = "pdf",
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow
        };
        var expectedResponse = new ExportResponseDto
        {
            Filename = "engagement-export.pdf",
            DownloadUrl = "/api/clubs/1/analytics/premium/downloads/engagement-export.pdf"
        };

        _analyticsServiceMock
            .Setup(s => s.ExportDataAsync(clubId, userId, request.DataType, request.Format, request.StartDate, request.EndDate))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _controller.ExportData(clubId, request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task ExportData_InvalidDataType_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new ExportRequestDto
        {
            DataType = "invalid",
            Format = "pdf",
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow
        };

        // Act
        var result = await _controller.ExportData(clubId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task ExportData_InvalidFormat_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new ExportRequestDto
        {
            DataType = "engagement",
            Format = "invalid",
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow
        };

        // Act
        var result = await _controller.ExportData(clubId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task ExportData_StartDateAfterEndDate_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new ExportRequestDto
        {
            DataType = "engagement",
            Format = "pdf",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(-30)
        };

        // Act
        var result = await _controller.ExportData(clubId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task ExportData_UnauthorizedAccessException_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new ExportRequestDto
        {
            DataType = "engagement",
            Format = "pdf",
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow
        };

        _analyticsServiceMock
            .Setup(s => s.ExportDataAsync(clubId, userId, request.DataType, request.Format, request.StartDate, request.EndDate))
            .ThrowsAsync(new UnauthorizedAccessException("Not authorized"));

        // Act
        var result = await _controller.ExportData(clubId, request);

        // Assert
        var forbidResult = result.Result as ForbidResult;
        forbidResult.Should().NotBeNull();
    }

    #endregion

    #region DownloadFile Tests

    [Test]
    public void DownloadFile_InvalidFilenameWithPathTraversal_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var filename = "../../../etc/passwd";

        // Act
        var result = _controller.DownloadFile(clubId, filename).Result;

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);

        var value = badRequestResult.Value;
        var messageProperty = value!.GetType().GetProperty("message");
        messageProperty!.GetValue(value).Should().Be("Invalid filename");
    }

    [Test]
    public void DownloadFile_FilenameWithForwardSlash_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var filename = "folder/file.pdf";

        // Act
        var result = _controller.DownloadFile(clubId, filename).Result;

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    #endregion

    #region GetRealTimeSummary Tests

    [Test]
    public async Task GetRealTimeSummary_ValidRequest_ReturnsOkWithSummary()
    {
        // Arrange
        var clubId = 1;
        var engagementTrends = new List<EngagementTrendDto>
        {
            new() { Period = "Week 1", AverageScore = 75.0, MemberEngagement = 70.0, EventAttendance = 80.0 },
            new() { Period = "Week 4", AverageScore = 82.0, MemberEngagement = 85.0, EventAttendance = 78.0 }
        };
        var memberSegmentation = new List<MemberSegmentDto>
        {
            new() { Segment = "Active", Count = 50, EngagementLevel = "high", AverageRevenue = 100.0m, ChurnRisk = 0.1 },
            new() { Segment = "Inactive", Count = 10, EngagementLevel = "low", AverageRevenue = 25.0m, ChurnRisk = 0.7 }
        };

        _analyticsServiceMock
            .Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(engagementTrends);

        _analyticsServiceMock
            .Setup(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()))
            .ReturnsAsync(memberSegmentation);

        // Act
        var result = await _controller.GetRealTimeSummary(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task GetRealTimeSummary_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;

        _analyticsServiceMock
            .Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetRealTimeSummary(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region AnalyzeEventPerformance Tests

    [Test]
    public async Task AnalyzeEventPerformance_ValidEventId_ReturnsOkWithAnalysis()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;
        var expectedAnalysis = new EventPerformanceAnalysis
        {
            EventId = eventId,
            PerformanceScore = 85.5m
        };

        _eventAnalyticsServiceMock
            .Setup(s => s.AnalyzeEventPerformanceAsync(eventId))
            .ReturnsAsync(expectedAnalysis);

        // Act
        var result = await _controller.AnalyzeEventPerformance(clubId, eventId);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task AnalyzeEventPerformance_ArgumentException_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var eventId = 999;

        _eventAnalyticsServiceMock
            .Setup(s => s.AnalyzeEventPerformanceAsync(eventId))
            .ThrowsAsync(new ArgumentException("Event not found"));

        // Act
        var result = await _controller.AnalyzeEventPerformance(clubId, eventId);

        // Assert
        var notFoundResult = result.Result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task AnalyzeEventPerformance_EventFromDifferentClub_ReturnsForbid()
    {
        // Arrange
        var clubId = 1;
        var eventId = 99;

        // Act
        var result = await _controller.AnalyzeEventPerformance(clubId, eventId);

        // Assert
        result.Result.Should().BeOfType<ForbidResult>();
        _eventAnalyticsServiceMock.Verify(s => s.AnalyzeEventPerformanceAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task AnalyzeEventPerformance_GenericException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var eventId = 1;

        _eventAnalyticsServiceMock
            .Setup(s => s.AnalyzeEventPerformanceAsync(eventId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.AnalyzeEventPerformance(clubId, eventId);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GenerateEngagementReport Tests

    [Test]
    public async Task GenerateEngagementReport_ValidRequest_ReturnsOkWithReport()
    {
        // Arrange
        var clubId = 1;
        var request = new EngagementReportRequest
        {
            ReportType = "comprehensive",
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow
        };
        var expectedReport = new EngagementReport
        {
            ReportType = "comprehensive",
            GeneratedAt = DateTime.UtcNow
        };

        _eventAnalyticsServiceMock
            .Setup(s => s.GenerateEngagementReportAsync(clubId, request.ReportType, request.StartDate, request.EndDate))
            .ReturnsAsync(expectedReport);

        // Act
        var result = await _controller.GenerateEngagementReport(clubId, request);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task GenerateEngagementReport_StartDateAfterEndDate_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new EngagementReportRequest
        {
            ReportType = "comprehensive",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(-30)
        };

        // Act
        var result = await _controller.GenerateEngagementReport(clubId, request);

        // Assert
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task GenerateEngagementReport_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var request = new EngagementReportRequest
        {
            ReportType = "comprehensive",
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow
        };

        _eventAnalyticsServiceMock
            .Setup(s => s.GenerateEngagementReportAsync(clubId, request.ReportType, request.StartDate, request.EndDate))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GenerateEngagementReport(clubId, request);

        // Assert
        var statusCodeResult = result.Result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion
}
