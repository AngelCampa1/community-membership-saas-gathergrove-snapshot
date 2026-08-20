using FluentAssertions;
using GatherGrove.API.Controllers;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class SegmentAnalyticsControllerTests
{
    private Mock<ISegmentAnalyticsService> _segmentAnalyticsServiceMock = null!;
    private Mock<IClubAuthorizationService> _authServiceMock = null!;
    private Mock<ILogger<SegmentAnalyticsController>> _loggerMock = null!;
    private SegmentAnalyticsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _segmentAnalyticsServiceMock = new Mock<ISegmentAnalyticsService>();
        _authServiceMock = new Mock<IClubAuthorizationService>();
        _loggerMock = new Mock<ILogger<SegmentAnalyticsController>>();

        _controller = new SegmentAnalyticsController(
            _segmentAnalyticsServiceMock.Object,
            _authServiceMock.Object,
            _loggerMock.Object);

        // Setup default HTTP context with authenticated user
        SetupAuthenticatedUser(userId: 1, clubId: 1);
    }

    private void SetupAuthenticatedUser(int userId, int clubId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, "ClubAdmin"),
            new("ClubId", clubId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Setup authorization service to allow access
        _authServiceMock
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.CanAccessUnlimitedFeaturesAsync(clubId))
            .ReturnsAsync(true);
        _authServiceMock
            .Setup(s => s.GetUserIdFromClaims(It.IsAny<ClaimsPrincipal>()))
            .Returns(userId);
    }

    #region GetSegmentAnalyticsDashboard Tests

    [Test]
    public async Task GetSegmentAnalyticsDashboard_ValidRequest_ReturnsOkWithDashboard()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var daysBack = 30;
        var expectedDashboard = new SegmentAnalyticsDashboard
        {
            TotalSegments = 5,
            ActiveSegments = 4
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentAnalyticsDashboardAsync(clubId, userId, daysBack))
            .ReturnsAsync(expectedDashboard);

        // Act
        var result = await _controller.GetSegmentAnalyticsDashboard(clubId, daysBack);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var dashboard = okResult.Value as SegmentAnalyticsDashboard;
        dashboard.Should().NotBeNull();
        dashboard!.TotalSegments.Should().Be(5);
        dashboard.ActiveSegments.Should().Be(4);
    }

    [Test]
    public async Task GetSegmentAnalyticsDashboard_DefaultDaysBack_Uses30Days()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var expectedDashboard = new SegmentAnalyticsDashboard();

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentAnalyticsDashboardAsync(clubId, userId, 30))
            .ReturnsAsync(expectedDashboard);

        // Act
        var result = await _controller.GetSegmentAnalyticsDashboard(clubId);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        _segmentAnalyticsServiceMock.Verify(
            s => s.GetSegmentAnalyticsDashboardAsync(clubId, userId, 30),
            Times.Once);
    }


    [Test]
    public async Task GetSegmentAnalyticsDashboard_NoUserId_ReturnsUnauthorized()
    {
        // Arrange
        var clubId = 1;

        _authServiceMock.Setup(s => s.GetUserIdFromClaims(It.IsAny<ClaimsPrincipal>()))
            .Returns((int?)null);

        // Act
        var result = await _controller.GetSegmentAnalyticsDashboard(clubId);

        // Assert
        var unauthorizedResult = result as UnauthorizedObjectResult;
        unauthorizedResult.Should().NotBeNull();
        unauthorizedResult!.StatusCode.Should().Be(401);

        _segmentAnalyticsServiceMock.Verify(
            s => s.GetSegmentAnalyticsDashboardAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public async Task GetSegmentAnalyticsDashboard_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentAnalyticsDashboardAsync(clubId, userId, It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSegmentAnalyticsDashboard(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSegmentAnalytics Tests

    [Test]
    public async Task GetSegmentAnalytics_ValidRequest_ReturnsOkWithAnalytics()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var segmentId = 10;
        var daysBack = 30;
        var expectedAnalytics = new DetailedSegmentAnalytics
        {
            SegmentId = segmentId,
            SegmentName = "Active Members",
            MemberCount = 50
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentAnalyticsAsync(clubId, segmentId, userId, daysBack, false))
            .ReturnsAsync(expectedAnalytics);

        // Act
        var result = await _controller.GetSegmentAnalytics(clubId, segmentId, daysBack, false);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var analytics = okResult.Value as DetailedSegmentAnalytics;
        analytics.Should().NotBeNull();
        analytics!.SegmentId.Should().Be(segmentId);
        analytics.MemberCount.Should().Be(50);
    }

    [Test]
    public async Task GetSegmentAnalytics_WithIncludeMembers_PassesToService()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var segmentId = 10;
        var expectedAnalytics = new DetailedSegmentAnalytics();

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentAnalyticsAsync(clubId, segmentId, userId, 30, true))
            .ReturnsAsync(expectedAnalytics);

        // Act
        var result = await _controller.GetSegmentAnalytics(clubId, segmentId, 30, true);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        _segmentAnalyticsServiceMock.Verify(
            s => s.GetSegmentAnalyticsAsync(clubId, segmentId, userId, 30, true),
            Times.Once);
    }

    [Test]
    public async Task GetSegmentAnalytics_SegmentNotFound_ReturnsNotFound()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var segmentId = 999;

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentAnalyticsAsync(clubId, segmentId, userId, It.IsAny<int>(), It.IsAny<bool>()))
            .ReturnsAsync((DetailedSegmentAnalytics?)null);

        // Act
        var result = await _controller.GetSegmentAnalytics(clubId, segmentId);

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }

    [Test]
    public async Task GetSegmentAnalytics_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var segmentId = 10;

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentAnalyticsAsync(clubId, segmentId, userId, It.IsAny<int>(), It.IsAny<bool>()))
            .ThrowsAsync(new ArgumentException("Invalid segment"));

        // Act
        var result = await _controller.GetSegmentAnalytics(clubId, segmentId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task GetSegmentAnalytics_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var segmentId = 10;

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentAnalyticsAsync(clubId, segmentId, userId, It.IsAny<int>(), It.IsAny<bool>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSegmentAnalytics(clubId, segmentId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region CompareSegments Tests

    [Test]
    public async Task CompareSegments_ValidRequest_ReturnsOkWithComparison()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new SegmentComparisonRequest
        {
            SegmentIds = new List<int> { 1, 2, 3 }
        };
        var expectedResult = new SegmentComparisonResult
        {
            ComparisonSegments = new List<SegmentComparisonData>
            {
                new() { SegmentId = 1 },
                new() { SegmentId = 2 },
                new() { SegmentId = 3 }
            }
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.CompareSegmentsAsync(clubId, userId, It.Is<SegmentComparisonRequest>(r => r.ClubId == clubId)))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.CompareSegments(clubId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var comparison = okResult.Value as SegmentComparisonResult;
        comparison.Should().NotBeNull();
        comparison!.ComparisonSegments.Should().HaveCount(3);

        // Verify clubId was set in request
        request.ClubId.Should().Be(clubId);
    }

    [Test]
    public async Task CompareSegments_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new SegmentComparisonRequest
        {
            SegmentIds = new List<int>()
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.CompareSegmentsAsync(clubId, userId, It.IsAny<SegmentComparisonRequest>()))
            .ThrowsAsync(new ArgumentException("At least 2 segments required"));

        // Act
        var result = await _controller.CompareSegments(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task CompareSegments_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new SegmentComparisonRequest
        {
            SegmentIds = new List<int> { 1, 2 }
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.CompareSegmentsAsync(clubId, userId, It.IsAny<SegmentComparisonRequest>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CompareSegments(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetEngagementTrends Tests

    [Test]
    public async Task GetSegmentEngagementTrends_ValidRequest_ReturnsOkWithTrends()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new SegmentEngagementTrendsRequest
        {
            DaysBack = 30,
            SegmentIds = new List<int> { 1, 2 }
        };
        var expectedTrends = new SegmentEngagementTrends
        {
            ClubId = clubId,
            SegmentTrends = new List<SegmentEngagementTrend>
            {
                new() { SegmentId = 1, SegmentName = "Segment 1", CurrentEngagementScore = 75.0m },
                new() { SegmentId = 2, SegmentName = "Segment 2", CurrentEngagementScore = 80.0m }
            }
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentEngagementTrendsAsync(clubId, userId, It.Is<SegmentEngagementTrendsRequest>(r => r.ClubId == clubId)))
            .ReturnsAsync(expectedTrends);

        // Act
        var result = await _controller.GetSegmentEngagementTrends(clubId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var trends = okResult.Value as SegmentEngagementTrends;
        trends.Should().NotBeNull();
        trends!.SegmentTrends.Should().HaveCount(2);
        trends.ClubId.Should().Be(clubId);

        // Verify clubId was set in request
        request.ClubId.Should().Be(clubId);
    }

    [Test]
    public async Task GetSegmentEngagementTrends_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new SegmentEngagementTrendsRequest();

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentEngagementTrendsAsync(clubId, userId, It.IsAny<SegmentEngagementTrendsRequest>()))
            .ThrowsAsync(new ArgumentException("Invalid date range"));

        // Act
        var result = await _controller.GetSegmentEngagementTrends(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task GetSegmentEngagementTrends_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new SegmentEngagementTrendsRequest();

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentEngagementTrendsAsync(clubId, userId, It.IsAny<SegmentEngagementTrendsRequest>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSegmentEngagementTrends(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSegmentGrowthAnalysis Tests

    [Test]
    public async Task GetSegmentGrowthAnalysis_ValidRequest_ReturnsOkWithAnalysis()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new SegmentGrowthAnalysisRequest
        {
            SegmentIds = new List<int> { 1, 2 },
            StartDate = DateTime.UtcNow.AddDays(-90),
            EndDate = DateTime.UtcNow
        };
        var expectedAnalysis = new SegmentGrowthAnalysis
        {
            ClubId = clubId,
            OverallStats = new OverallGrowthStats
            {
                GrowthRate = 15.5m,
                StartingMemberCount = 100,
                EndingMemberCount = 115,
                NetGrowth = 15
            },
            SegmentGrowthStats = new List<SegmentGrowthStats>
            {
                new() { SegmentId = 1, SegmentName = "Segment 1", GrowthRate = 20.0m },
                new() { SegmentId = 2, SegmentName = "Segment 2", GrowthRate = 10.0m }
            }
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentGrowthAnalysisAsync(clubId, userId, It.Is<SegmentGrowthAnalysisRequest>(r => r.ClubId == clubId)))
            .ReturnsAsync(expectedAnalysis);

        // Act
        var result = await _controller.GetSegmentGrowthAnalysis(clubId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var analysis = okResult.Value as SegmentGrowthAnalysis;
        analysis.Should().NotBeNull();
        analysis!.OverallStats.GrowthRate.Should().Be(15.5m);
        analysis.SegmentGrowthStats.Should().HaveCount(2);

        // Verify clubId was set in request
        request.ClubId.Should().Be(clubId);
    }

    [Test]
    public async Task GetSegmentGrowthAnalysis_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new SegmentGrowthAnalysisRequest();

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentGrowthAnalysisAsync(clubId, userId, It.IsAny<SegmentGrowthAnalysisRequest>()))
            .ThrowsAsync(new ArgumentException("Invalid request"));

        // Act
        var result = await _controller.GetSegmentGrowthAnalysis(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task GetSegmentGrowthAnalysis_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new SegmentGrowthAnalysisRequest();

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentGrowthAnalysisAsync(clubId, userId, It.IsAny<SegmentGrowthAnalysisRequest>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSegmentGrowthAnalysis(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSegmentPerformanceMetrics Tests

    [Test]
    public async Task GetSegmentPerformanceMetrics_ValidRequest_ReturnsOkWithMetrics()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var segmentIds = new List<int> { 1, 2, 3 };
        var expectedMetrics = new SegmentPerformanceMetrics
        {
            AverageCalculationTime = 125.5,
            CalculationCount = 10,
            CacheHitRatio = 0.85m
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentPerformanceMetricsAsync(clubId, userId, segmentIds, false))
            .ReturnsAsync(expectedMetrics);

        // Act
        var result = await _controller.GetSegmentPerformanceMetrics(clubId, segmentIds, false);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var metrics = okResult.Value as SegmentPerformanceMetrics;
        metrics.Should().NotBeNull();
        metrics!.AverageCalculationTime.Should().Be(125.5);
        metrics.CalculationCount.Should().Be(10);
        metrics.CacheHitRatio.Should().Be(0.85m);
    }

    [Test]
    public async Task GetSegmentPerformanceMetrics_WithProjections_PassesToService()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var expectedMetrics = new SegmentPerformanceMetrics();

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentPerformanceMetricsAsync(clubId, userId, null, true))
            .ReturnsAsync(expectedMetrics);

        // Act
        var result = await _controller.GetSegmentPerformanceMetrics(clubId, null, true);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        _segmentAnalyticsServiceMock.Verify(
            s => s.GetSegmentPerformanceMetricsAsync(clubId, userId, null, true),
            Times.Once);
    }

    [Test]
    public async Task GetSegmentPerformanceMetrics_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var segmentIds = new List<int> { -1 };

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentPerformanceMetricsAsync(clubId, userId, segmentIds, It.IsAny<bool>()))
            .ThrowsAsync(new ArgumentException("Invalid segment IDs"));

        // Act
        var result = await _controller.GetSegmentPerformanceMetrics(clubId, segmentIds);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task GetSegmentPerformanceMetrics_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var segmentIds = new List<int> { 1, 2 };

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentPerformanceMetricsAsync(clubId, userId, segmentIds, It.IsAny<bool>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSegmentPerformanceMetrics(clubId, segmentIds);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region ExportSegmentAnalytics Tests

    [Test]
    public async Task ExportSegmentAnalytics_ValidRequest_ReturnsOkWithExport()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new AnalyticsExportRequest
        {
            ExportFormat = AnalyticsExportFormat.CSV,
            SegmentIds = new List<int> { 1, 2 }
        };
        var expectedResult = new AnalyticsExportResult
        {
            ExportId = "export-123",
            DownloadUrl = "https://example.com/export-123.csv"
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.ExportSegmentAnalyticsAsync(clubId, userId, It.Is<AnalyticsExportRequest>(r => r.ClubId == clubId)))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _controller.ExportSegmentAnalytics(clubId, request);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var exportResult = okResult.Value as AnalyticsExportResult;
        exportResult.Should().NotBeNull();
        exportResult!.ExportId.Should().Be("export-123");

        // Verify clubId was set in request
        request.ClubId.Should().Be(clubId);
    }

    [Test]
    public async Task ExportSegmentAnalytics_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new AnalyticsExportRequest
        {
            ExportFormat = (AnalyticsExportFormat)999 // Invalid enum value
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.ExportSegmentAnalyticsAsync(clubId, userId, It.IsAny<AnalyticsExportRequest>()))
            .ThrowsAsync(new ArgumentException("Invalid export format"));

        // Act
        var result = await _controller.ExportSegmentAnalytics(clubId, request);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task ExportSegmentAnalytics_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var request = new AnalyticsExportRequest
        {
            ExportFormat = AnalyticsExportFormat.CSV
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.ExportSegmentAnalyticsAsync(clubId, userId, It.IsAny<AnalyticsExportRequest>()))
            .ThrowsAsync(new Exception("Export service error"));

        // Act
        var result = await _controller.ExportSegmentAnalytics(clubId, request);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSegmentInsights Tests

    [Test]
    public async Task GetSegmentInsights_ValidRequest_ReturnsOkWithInsights()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var segmentId = 10;
        var focusArea = "engagement";
        var expectedInsights = new SegmentInsightsResponse
        {
            ClubId = clubId,
            SegmentId = segmentId,
            SegmentName = "Active Members",
            FocusArea = focusArea
        };

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentInsightsAsync(clubId, userId, segmentId, focusArea))
            .ReturnsAsync(expectedInsights);

        // Act
        var result = await _controller.GetSegmentInsights(clubId, segmentId, focusArea);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var insights = okResult.Value as SegmentInsightsResponse;
        insights.Should().NotBeNull();
        insights!.ClubId.Should().Be(clubId);
        insights.SegmentId.Should().Be(segmentId);
        insights.FocusArea.Should().Be(focusArea);
    }

    [Test]
    public async Task GetSegmentInsights_NoSegmentId_GetsAllSegments()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var expectedInsights = new SegmentInsightsResponse();

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentInsightsAsync(clubId, userId, null, null))
            .ReturnsAsync(expectedInsights);

        // Act
        var result = await _controller.GetSegmentInsights(clubId, null, null);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();

        _segmentAnalyticsServiceMock.Verify(
            s => s.GetSegmentInsightsAsync(clubId, userId, null, null),
            Times.Once);
    }

    [Test]
    public async Task GetSegmentInsights_ArgumentException_ReturnsBadRequest()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;
        var segmentId = 10;

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentInsightsAsync(clubId, userId, segmentId, It.IsAny<string?>()))
            .ThrowsAsync(new ArgumentException("Segment not found"));

        // Act
        var result = await _controller.GetSegmentInsights(clubId, segmentId);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Test]
    public async Task GetSegmentInsights_ServiceException_Returns500()
    {
        // Arrange
        var clubId = 1;
        var userId = 1;

        _segmentAnalyticsServiceMock
            .Setup(s => s.GetSegmentInsightsAsync(clubId, userId, It.IsAny<int?>(), It.IsAny<string?>()))
            .ThrowsAsync(new Exception("AI service error"));

        // Act
        var result = await _controller.GetSegmentInsights(clubId);

        // Assert
        var statusCodeResult = result as ObjectResult;
        statusCodeResult.Should().NotBeNull();
        statusCodeResult!.StatusCode.Should().Be(500);
    }

    #endregion
}
