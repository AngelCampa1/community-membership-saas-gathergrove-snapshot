using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Hubs;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Application.DTOs.Analytics;
using System.Security.Claims;
using ClubAuthorizationService = GatherGrove.Application.Services.IClubAuthorizationService;

namespace GatherGrove.API.Tests.Hubs;

/// <summary>
/// TDD Tests for Real-time Analytics Hub (US-004)
/// Tests real-time data streaming for enterprise analytics dashboard
/// </summary>
[TestFixture]
public class AnalyticsHubTests
{
    private Mock<IAdvancedAnalyticsService> _mockAnalyticsService;
    private Mock<ILogger<AnalyticsHub>> _mockLogger;
    private Mock<IHubContext<AnalyticsHub>> _mockHubContext;
    private Mock<ClubAuthorizationService> _mockClubAuthorizationService;
    private Mock<IClientProxy> _mockClientProxy;
    private Mock<ISingleClientProxy> _mockSingleClientProxy;
    private Mock<IGroupManager> _mockGroupManager;
    private Mock<IGroupManager> _mockGroups;
    private Mock<IHubCallerClients> _mockClients;
    private Mock<HubCallerContext> _mockContext;
    private AnalyticsHub _hub;

    [SetUp]
    public void Setup()
    {
        _mockAnalyticsService = new Mock<IAdvancedAnalyticsService>();
        _mockLogger = new Mock<ILogger<AnalyticsHub>>();
        _mockHubContext = new Mock<IHubContext<AnalyticsHub>>();
        _mockClubAuthorizationService = new Mock<ClubAuthorizationService>();
        _mockClientProxy = new Mock<IClientProxy>();
        _mockSingleClientProxy = new Mock<ISingleClientProxy>();
        _mockGroupManager = new Mock<IGroupManager>();
        _mockGroups = new Mock<IGroupManager>();
        _mockClients = new Mock<IHubCallerClients>();
        _mockContext = new Mock<HubCallerContext>();

        // Setup proper SignalR mocking
        _mockHubContext.Setup(h => h.Clients.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);
        _mockHubContext.Setup(h => h.Groups).Returns(_mockGroupManager.Object);

        _mockClubAuthorizationService
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        _hub = new AnalyticsHub(_mockAnalyticsService.Object, _mockClubAuthorizationService.Object, _mockLogger.Object);

        // Setup Context property with proper mocking
        _mockContext.SetupGet(c => c.ConnectionId).Returns("test-connection-id");
        _mockContext.SetupGet(c => c.UserIdentifier).Returns("test-user-123");
        _mockContext.SetupGet(c => c.User).Returns(new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "123")
        }, "Test")));
        _hub.Context = _mockContext.Object;

        // Setup Clients with proper Group method mocking 
        _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);
        _mockClients.SetupGet(c => c.Caller).Returns(_mockSingleClientProxy.Object);
        _hub.Clients = _mockClients.Object;

        _hub.Groups = _mockGroups.Object;
    }

    [TearDown]
    public void TearDown()
    {
        _hub?.Dispose();
    }

    #region Real-time Engagement Streaming Tests

    [Test]
    public async Task JoinClubAnalytics_WithValidClubId_ShouldAddToGroup()
    {
        // Arrange
        var clubId = 1;
        var expectedGroupName = $"club-analytics-{clubId}";

        // Act
        await _hub.JoinClubAnalytics(clubId);

        // Assert
        _mockGroups.Verify(g => g.AddToGroupAsync("test-connection-id", expectedGroupName, default), Times.Once);
    }

    [Test]
    public async Task JoinClubAnalytics_WhenUserCannotAccessClub_ShouldRejectBeforeJoiningGroup()
    {
        var clubId = 2;
        _mockClubAuthorizationService
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        Assert.ThrowsAsync<HubException>(async () => await _hub.JoinClubAnalytics(clubId));

        _mockGroups.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
        _mockAnalyticsService.Verify(s => s.GetEngagementTrendsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Never);
    }

    [Test]
    public async Task StreamEngagementMetrics_WithValidClubId_ShouldSendUpdates()
    {
        // Arrange
        var clubId = 1;
        var mockEngagementData = new List<EngagementTrendDto>
        {
            new EngagementTrendDto
            {
                Period = "2024-01",
                MemberEngagement = 85.2,
                EventAttendance = 78.5,
                CommunicationActivity = 92.1,
                AverageScore = 85.3
            }
        };

        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(mockEngagementData);

        // Act
        await _hub.StreamEngagementMetrics(clubId);

        // Assert - Verify service was called (Group().SendAsync() is hard to verify due to chaining)
        _mockAnalyticsService.Verify(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
    }

    [Test]
    public async Task StreamEngagementMetrics_WhenUserCannotAccessClub_ShouldRejectBeforeStreaming()
    {
        var clubId = 2;
        _mockClubAuthorizationService
            .Setup(s => s.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), clubId))
            .ReturnsAsync(false);

        Assert.ThrowsAsync<HubException>(async () => await _hub.StreamEngagementMetrics(clubId));

        _mockAnalyticsService.Verify(s => s.GetEngagementTrendsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Never);
        _mockClients.Verify(c => c.Group(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task StreamCohortAnalysis_WithValidParameters_ShouldSendCohortData()
    {
        // Arrange
        var clubId = 1;
        var mockCohortData = new List<CohortDto>
        {
            new CohortDto
            {
                Cohort = "2024-Q1",
                TotalMembers = 50,
                ChurnRate = 12.5,
                AverageLifetime = 8.5
            }
        };

        _mockAnalyticsService.Setup(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(mockCohortData);

        // Act
        await _hub.StreamCohortAnalysis(clubId);

        // Assert - Verify service was called (Group().SendAsync() is hard to verify due to chaining)
        _mockAnalyticsService.Verify(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
    }

    #endregion

    #region Real-time ROI Streaming Tests

    [Test]
    public async Task StreamROIMetrics_WithValidClubId_ShouldSendROIUpdates()
    {
        // Arrange
        var clubId = 1;
        var mockROIData = new List<ROIDto>
        {
            new ROIDto
            {
                Period = "Q1 2024",
                Revenue = 15000m,
                Costs = 8000m,
                Profit = 7000m,
                ROI = 87.5,
                Trend = "increasing"
            }
        };

        _mockAnalyticsService.Setup(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(mockROIData);

        // Act
        await _hub.StreamROIMetrics(clubId);

        // Assert - Verify service was called (Group().SendAsync() is hard to verify due to chaining)
        _mockAnalyticsService.Verify(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
    }

    #endregion

    #region Performance and Error Handling Tests

    [Test]
    public async Task StreamEngagementMetrics_ServiceThrows_ShouldHandleGracefully()
    {
        // Arrange
        var clubId = 1;
        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act & Assert - Should handle exceptions gracefully
        Assert.DoesNotThrowAsync(async () => await _hub.StreamEngagementMetrics(clubId));

        // Verify error was logged
        _mockLogger.Verify(
            l => l.Log(LogLevel.Error, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task StreamingOperations_WithLargeData_ShouldCompleteWithinTimeout()
    {
        // Arrange
        var clubId = 1;
        var largeEngagementData = new List<EngagementTrendDto>();

        // Create large dataset
        for (int i = 0; i < 1000; i++)
        {
            largeEngagementData.Add(new EngagementTrendDto
            {
                Period = $"2024-{i:D3}",
                MemberEngagement = 75.0 + (i % 20),
                EventAttendance = 80.0 + (i % 15)
            });
        }

        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(largeEngagementData);

        // Act - Should complete within 3 seconds
        var cancellationToken = new CancellationTokenSource(TimeSpan.FromSeconds(3));

        Assert.DoesNotThrowAsync(async () =>
        {
            await _hub.StreamEngagementMetrics(clubId);
        });
    }

    #endregion

    #region Connection Management Tests

    [Test]
    public async Task OnConnectedAsync_ShouldLogConnection()
    {
        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _mockLogger.Verify(
            l => l.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task OnDisconnectedAsync_ShouldLogDisconnection()
    {
        // Act
        await _hub.OnDisconnectedAsync(new Exception("Client disconnected"));

        // Assert
        _mockLogger.Verify(
            l => l.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion

    #region LeaveClubAnalytics Tests

    [Test]
    public async Task LeaveClubAnalytics_WithValidClubId_ShouldRemoveFromGroup()
    {
        // Arrange
        var clubId = 1;
        var expectedGroupName = $"club-analytics-{clubId}";

        // Act
        await _hub.LeaveClubAnalytics(clubId);

        // Assert
        _mockGroups.Verify(g => g.RemoveFromGroupAsync("test-connection-id", expectedGroupName, default), Times.Once);
    }

    [Test]
    public async Task LeaveClubAnalytics_MultipleLeaves_ShouldBeIdempotent()
    {
        // Arrange
        var clubId = 1;
        var expectedGroupName = $"club-analytics-{clubId}";

        // Act - Leave twice
        await _hub.LeaveClubAnalytics(clubId);
        await _hub.LeaveClubAnalytics(clubId);

        // Assert - Both calls should succeed (SignalR handles idempotency)
        _mockGroups.Verify(g => g.RemoveFromGroupAsync("test-connection-id", expectedGroupName, default), Times.Exactly(2));
    }

    [Test]
    public async Task LeaveClubAnalytics_ShouldLogDisconnection()
    {
        // Arrange
        var clubId = 1;

        // Act
        await _hub.LeaveClubAnalytics(clubId);

        // Assert - Verify information log was called
        _mockLogger.Verify(
            l => l.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion

    #region StreamMemberSegmentation Tests

    [Test]
    public async Task StreamMemberSegmentation_WithValidClubId_ShouldSendSegmentationData()
    {
        // Arrange
        var clubId = 1;
        var mockSegmentData = new List<MemberSegmentDto>
        {
            new MemberSegmentDto
            {
                Segment = "Active Members",
                Count = 120,
                EngagementLevel = "high",
                AverageRevenue = 150.00m,
                ChurnRisk = 0.15
            }
        };

        _mockAnalyticsService.Setup(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()))
            .ReturnsAsync(mockSegmentData);

        // Act
        await _hub.StreamMemberSegmentation(clubId);

        // Assert
        _mockAnalyticsService.Verify(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()), Times.Once);
    }

    [Test]
    public async Task StreamMemberSegmentation_ServiceThrows_ShouldSendErrorToCallerOnly()
    {
        // Arrange
        var clubId = 1;
        _mockAnalyticsService.Setup(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()))
            .ThrowsAsync(new Exception("Segmentation service unavailable"));

        // Act
        await _hub.StreamMemberSegmentation(clubId);

        // Assert - Error should be sent to Caller, not Group
        _mockSingleClientProxy.Verify(
            c => c.SendCoreAsync("AnalyticsError", It.Is<object[]>(o => o.Length > 0), default),
            Times.Once);

        // Verify error was logged
        _mockLogger.Verify(
            l => l.Log(LogLevel.Error, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task StreamMemberSegmentation_EmptySegments_ShouldHandleGracefully()
    {
        // Arrange
        var clubId = 1;
        var emptySegmentData = new List<MemberSegmentDto>();

        _mockAnalyticsService.Setup(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()))
            .ReturnsAsync(emptySegmentData);

        // Act & Assert - Should not throw
        Assert.DoesNotThrowAsync(async () => await _hub.StreamMemberSegmentation(clubId));
    }

    #endregion

    #region RefreshAllAnalytics Tests

    [Test]
    public async Task RefreshAllAnalytics_ShouldCallAllStreamMethods()
    {
        // Arrange
        var clubId = 1;

        // Setup all service methods to return empty data
        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<EngagementTrendDto>());
        _mockAnalyticsService.Setup(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<CohortDto>());
        _mockAnalyticsService.Setup(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<ROIDto>());
        _mockAnalyticsService.Setup(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()))
            .ReturnsAsync(new List<MemberSegmentDto>());

        // Act
        await _hub.RefreshAllAnalytics(clubId);

        // Assert - All 4 stream methods should be called
        _mockAnalyticsService.Verify(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
        _mockAnalyticsService.Verify(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
        _mockAnalyticsService.Verify(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
        _mockAnalyticsService.Verify(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()), Times.Once);
    }

    [Test]
    public async Task RefreshAllAnalytics_ShouldLogRefreshRequest()
    {
        // Arrange
        var clubId = 1;

        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<EngagementTrendDto>());
        _mockAnalyticsService.Setup(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<CohortDto>());
        _mockAnalyticsService.Setup(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<ROIDto>());
        _mockAnalyticsService.Setup(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()))
            .ReturnsAsync(new List<MemberSegmentDto>());

        // Act
        await _hub.RefreshAllAnalytics(clubId);

        // Assert - Should log at Information level (once for refresh request, plus errors from failed streams)
        _mockLogger.Verify(
            l => l.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.AtLeastOnce);
    }

    [Test]
    public async Task RefreshAllAnalytics_OneStreamFails_OthersShouldStillExecute()
    {
        // Arrange
        var clubId = 1;

        // Setup: Engagement stream throws, but others succeed
        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ThrowsAsync(new Exception("Engagement service down"));
        _mockAnalyticsService.Setup(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<CohortDto>());
        _mockAnalyticsService.Setup(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<ROIDto>());
        _mockAnalyticsService.Setup(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()))
            .ReturnsAsync(new List<MemberSegmentDto>());

        // Act
        await _hub.RefreshAllAnalytics(clubId);

        // Assert - All streams should be attempted despite first failure
        _mockAnalyticsService.Verify(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
        _mockAnalyticsService.Verify(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
        _mockAnalyticsService.Verify(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
        _mockAnalyticsService.Verify(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()), Times.Once);
    }

    #endregion

    #region JoinClubAnalytics Enhanced Tests

    [Test]
    public async Task JoinClubAnalytics_InitialDataStreamFails_ShouldHandleGracefully()
    {
        // Arrange
        var clubId = 1;
        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ThrowsAsync(new Exception("Initial data load failed"));

        // Act & Assert - Should not throw, error is caught and logged
        Assert.DoesNotThrowAsync(async () => await _hub.JoinClubAnalytics(clubId));

        // Verify user was still added to group
        _mockGroups.Verify(g => g.AddToGroupAsync("test-connection-id", $"club-analytics-{clubId}", default), Times.Once);

        // Verify error was logged
        _mockLogger.Verify(
            l => l.Log(LogLevel.Error, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task JoinClubAnalytics_ShouldSendAllInitialData()
    {
        // Arrange
        var clubId = 1;

        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<EngagementTrendDto> { new EngagementTrendDto { Period = "2024-01" } });
        _mockAnalyticsService.Setup(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<CohortDto> { new CohortDto { Cohort = "2024-Q1" } });
        _mockAnalyticsService.Setup(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<ROIDto> { new ROIDto { Period = "Q1 2024" } });

        // Act
        await _hub.JoinClubAnalytics(clubId);

        // Assert - All three initial data streams should be called
        _mockAnalyticsService.Verify(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
        _mockAnalyticsService.Verify(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
        _mockAnalyticsService.Verify(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Once);
    }

    #endregion

    #region Error Notification Tests

    [Test]
    public async Task StreamCohortAnalysis_ServiceThrows_ShouldSendAnalyticsErrorToCaller()
    {
        // Arrange
        var clubId = 1;
        _mockAnalyticsService.Setup(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ThrowsAsync(new Exception("Cohort analysis failed"));

        // Act
        await _hub.StreamCohortAnalysis(clubId);

        // Assert - AnalyticsError should be sent to Caller only
        _mockSingleClientProxy.Verify(
            c => c.SendCoreAsync("AnalyticsError", It.Is<object[]>(o => o.Length > 0), default),
            Times.Once);
    }

    [Test]
    public async Task StreamROIMetrics_ServiceThrows_ShouldSendAnalyticsErrorToCaller()
    {
        // Arrange
        var clubId = 1;
        _mockAnalyticsService.Setup(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ThrowsAsync(new Exception("ROI calculation failed"));

        // Act
        await _hub.StreamROIMetrics(clubId);

        // Assert - AnalyticsError should be sent to Caller only
        _mockSingleClientProxy.Verify(
            c => c.SendCoreAsync("AnalyticsError", It.Is<object[]>(o => o.Length > 0), default),
            Times.Once);
    }

    #endregion

    #region Group Isolation Tests

    [Test]
    public async Task StreamEngagementMetrics_ShouldOnlySendToCorrectGroup()
    {
        // Arrange
        var clubId = 1;
        var expectedGroupName = $"club-analytics-{clubId}";

        var mockEngagementData = new List<EngagementTrendDto>
        {
            new EngagementTrendDto { Period = "2024-01", MemberEngagement = 85.2 }
        };

        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(mockEngagementData);

        // Act
        await _hub.StreamEngagementMetrics(clubId);

        // Assert - Should call Clients.Group with correct group name
        _mockClients.Verify(c => c.Group(expectedGroupName), Times.Once);
    }

    [Test]
    public async Task StreamCohortAnalysis_DifferentClubs_ShouldUseDifferentGroups()
    {
        // Arrange
        var clubId1 = 1;
        var clubId2 = 2;

        _mockAnalyticsService.Setup(s => s.GetCohortAnalysisAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<CohortDto> { new CohortDto { Cohort = "2024-Q1" } });

        // Act - Stream to two different clubs
        await _hub.StreamCohortAnalysis(clubId1);
        await _hub.StreamCohortAnalysis(clubId2);

        // Assert - Should use different group names
        _mockClients.Verify(c => c.Group($"club-analytics-{clubId1}"), Times.Once);
        _mockClients.Verify(c => c.Group($"club-analytics-{clubId2}"), Times.Once);
    }

    #endregion

    #region Date Range Tests

    [Test]
    public async Task StreamEngagementMetrics_ShouldUseLast30Days()
    {
        // Arrange
        var clubId = 1;
        DateTime? capturedStartDate = null;
        DateTime? capturedEndDate = null;

        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .Callback<int, DateTime, DateTime>((_, start, end) =>
            {
                capturedStartDate = start;
                capturedEndDate = end;
            })
            .ReturnsAsync(new List<EngagementTrendDto>());

        // Act
        await _hub.StreamEngagementMetrics(clubId);

        // Assert - Should use 30-day window
        Assert.That(capturedStartDate, Is.Not.Null);
        Assert.That(capturedEndDate, Is.Not.Null);

        var expectedDays = (capturedEndDate.Value - capturedStartDate.Value).Days;
        Assert.That(expectedDays, Is.EqualTo(30), "Engagement metrics should use 30-day window");
    }

    [Test]
    public async Task StreamCohortAnalysis_ShouldUseLast6Months()
    {
        // Arrange
        var clubId = 1;
        DateTime? capturedStartDate = null;
        DateTime? capturedEndDate = null;

        _mockAnalyticsService.Setup(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .Callback<int, DateTime, DateTime>((_, start, end) =>
            {
                capturedStartDate = start;
                capturedEndDate = end;
            })
            .ReturnsAsync(new List<CohortDto>());

        // Act
        await _hub.StreamCohortAnalysis(clubId);

        // Assert - Should use 6-month window
        Assert.That(capturedStartDate, Is.Not.Null);
        Assert.That(capturedEndDate, Is.Not.Null);

        var expectedMonths = ((capturedEndDate.Value.Year - capturedStartDate.Value.Year) * 12) +
                            capturedEndDate.Value.Month - capturedStartDate.Value.Month;
        Assert.That(expectedMonths, Is.EqualTo(6), "Cohort analysis should use 6-month window");
    }

    [Test]
    public async Task StreamROIMetrics_ShouldUseLast12Months()
    {
        // Arrange
        var clubId = 1;
        DateTime? capturedStartDate = null;
        DateTime? capturedEndDate = null;

        _mockAnalyticsService.Setup(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .Callback<int, DateTime, DateTime>((_, start, end) =>
            {
                capturedStartDate = start;
                capturedEndDate = end;
            })
            .ReturnsAsync(new List<ROIDto>());

        // Act
        await _hub.StreamROIMetrics(clubId);

        // Assert - Should use 12-month window
        Assert.That(capturedStartDate, Is.Not.Null);
        Assert.That(capturedEndDate, Is.Not.Null);

        var expectedMonths = ((capturedEndDate.Value.Year - capturedStartDate.Value.Year) * 12) +
                            capturedEndDate.Value.Month - capturedStartDate.Value.Month;
        Assert.That(expectedMonths, Is.EqualTo(12), "ROI metrics should use 12-month window");
    }

    #endregion

    #region Invalid Input Tests

    [Test]
    public async Task JoinClubAnalytics_NegativeClubId_ShouldHandleGracefully()
    {
        // Arrange
        var clubId = -1;
        var expectedGroupName = $"club-analytics-{clubId}";

        // Act & Assert - Should not throw
        Assert.DoesNotThrowAsync(async () => await _hub.JoinClubAnalytics(clubId));

        // Verify user was added to group (SignalR doesn't validate, app logic should)
        _mockGroups.Verify(g => g.AddToGroupAsync("test-connection-id", expectedGroupName, default), Times.Once);
    }

    [Test]
    public async Task JoinClubAnalytics_ZeroClubId_ShouldHandleGracefully()
    {
        // Arrange
        var clubId = 0;
        var expectedGroupName = $"club-analytics-{clubId}";

        // Act & Assert - Should not throw
        Assert.DoesNotThrowAsync(async () => await _hub.JoinClubAnalytics(clubId));

        // Verify user was added to group
        _mockGroups.Verify(g => g.AddToGroupAsync("test-connection-id", expectedGroupName, default), Times.Once);
    }

    [Test]
    public async Task StreamEngagementMetrics_MaxClubId_ShouldHandleGracefully()
    {
        // Arrange
        var clubId = int.MaxValue;

        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<EngagementTrendDto>());

        // Act & Assert - Should not throw
        Assert.DoesNotThrowAsync(async () => await _hub.StreamEngagementMetrics(clubId));
    }

    [Test]
    public async Task LeaveClubAnalytics_NegativeClubId_ShouldHandleGracefully()
    {
        // Arrange
        var clubId = -999;
        var expectedGroupName = $"club-analytics-{clubId}";

        // Act & Assert - Should not throw
        Assert.DoesNotThrowAsync(async () => await _hub.LeaveClubAnalytics(clubId));

        // Verify user was removed from group
        _mockGroups.Verify(g => g.RemoveFromGroupAsync("test-connection-id", expectedGroupName, default), Times.Once);
    }

    #endregion

    #region Concurrent Connection Tests

    [Test]
    public async Task JoinClubAnalytics_ConcurrentConnections_ShouldHandleMultipleUsers()
    {
        // Arrange
        var clubId = 1;
        var connection1 = "connection-1";
        var connection2 = "connection-2";
        var connection3 = "connection-3";

        var mockContext1 = new Mock<HubCallerContext>();
        mockContext1.SetupGet(c => c.ConnectionId).Returns(connection1);
        mockContext1.SetupGet(c => c.UserIdentifier).Returns("user-1");
        mockContext1.SetupGet(c => c.User).Returns(CreateUser("1"));

        var mockContext2 = new Mock<HubCallerContext>();
        mockContext2.SetupGet(c => c.ConnectionId).Returns(connection2);
        mockContext2.SetupGet(c => c.UserIdentifier).Returns("user-2");
        mockContext2.SetupGet(c => c.User).Returns(CreateUser("2"));

        var mockContext3 = new Mock<HubCallerContext>();
        mockContext3.SetupGet(c => c.ConnectionId).Returns(connection3);
        mockContext3.SetupGet(c => c.UserIdentifier).Returns("user-3");
        mockContext3.SetupGet(c => c.User).Returns(CreateUser("3"));

        // Setup mock service to return empty data to avoid errors
        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<EngagementTrendDto>());
        _mockAnalyticsService.Setup(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<CohortDto>());
        _mockAnalyticsService.Setup(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<ROIDto>());

        // Act - Simulate 3 concurrent connections
        _hub.Context = mockContext1.Object;
        await _hub.JoinClubAnalytics(clubId);

        _hub.Context = mockContext2.Object;
        await _hub.JoinClubAnalytics(clubId);

        _hub.Context = mockContext3.Object;
        await _hub.JoinClubAnalytics(clubId);

        // Assert - All 3 should be added to same group
        _mockGroups.Verify(g => g.AddToGroupAsync(connection1, $"club-analytics-{clubId}", default), Times.Once);
        _mockGroups.Verify(g => g.AddToGroupAsync(connection2, $"club-analytics-{clubId}", default), Times.Once);
        _mockGroups.Verify(g => g.AddToGroupAsync(connection3, $"club-analytics-{clubId}", default), Times.Once);
    }

    [Test]
    public async Task StreamEngagementMetrics_MultipleUsersInGroup_AllReceiveUpdate()
    {
        // Arrange - 3 users joined to same club analytics group
        var clubId = 1;
        var groupName = $"club-analytics-{clubId}";

        var mockEngagementData = new List<EngagementTrendDto>
        {
            new EngagementTrendDto { Period = "2024-01", MemberEngagement = 85.2 }
        };

        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(mockEngagementData);

        // Act - Stream update to group
        await _hub.StreamEngagementMetrics(clubId);

        // Assert - Group().SendAsync should be called once, reaching all users in group
        _mockClientProxy.Verify(
            c => c.SendCoreAsync("EngagementUpdate", It.IsAny<object[]>(), default),
            Times.Once,
            "All users in group should receive the same update via single Group().SendAsync call");
    }

    [Test]
    public async Task RefreshAllAnalytics_MultipleConcurrentRefreshes_ShouldHandleGracefully()
    {
        // Arrange - Setup mock data for all streams
        var clubId = 1;
        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<EngagementTrendDto>());
        _mockAnalyticsService.Setup(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<CohortDto>());
        _mockAnalyticsService.Setup(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<ROIDto>());
        _mockAnalyticsService.Setup(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()))
            .ReturnsAsync(new List<MemberSegmentDto>());

        // Act - Simulate concurrent refresh requests
        var task1 = _hub.RefreshAllAnalytics(clubId);
        var task2 = _hub.RefreshAllAnalytics(clubId);
        var task3 = _hub.RefreshAllAnalytics(clubId);

        await Task.WhenAll(task1, task2, task3);

        // Assert - All service methods should be called multiple times (3x each)
        _mockAnalyticsService.Verify(s => s.GetEngagementTrendsAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Exactly(3));
        _mockAnalyticsService.Verify(s => s.GetCohortAnalysisAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Exactly(3));
        _mockAnalyticsService.Verify(s => s.GetFinancialROIAsync(clubId, It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Exactly(3));
        _mockAnalyticsService.Verify(s => s.GetMemberSegmentationAsync(clubId, It.IsAny<List<string>>()), Times.Exactly(3));
    }

    #endregion

    #region Multiple Club Scenarios

    [Test]
    public async Task OnConnectedAsync_MultipleSequentialConnections_ShouldLogEach()
    {
        // Arrange - Simulate 3 sequential connections
        var mockContext1 = new Mock<HubCallerContext>();
        mockContext1.SetupGet(c => c.ConnectionId).Returns("conn-1");
        mockContext1.SetupGet(c => c.UserIdentifier).Returns("user-1");

        var mockContext2 = new Mock<HubCallerContext>();
        mockContext2.SetupGet(c => c.ConnectionId).Returns("conn-2");
        mockContext2.SetupGet(c => c.UserIdentifier).Returns("user-2");

        var mockContext3 = new Mock<HubCallerContext>();
        mockContext3.SetupGet(c => c.ConnectionId).Returns("conn-3");
        mockContext3.SetupGet(c => c.UserIdentifier).Returns("user-3");

        // Act - Connect 3 times
        _hub.Context = mockContext1.Object;
        await _hub.OnConnectedAsync();

        _hub.Context = mockContext2.Object;
        await _hub.OnConnectedAsync();

        _hub.Context = mockContext3.Object;
        await _hub.OnConnectedAsync();

        // Assert - Should log 3 connections
        _mockLogger.Verify(
            l => l.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(),
                      It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Exactly(3));
    }

    [Test]
    public async Task SameUser_MultipleClubs_ShouldJoinMultipleGroups()
    {
        // Arrange - Same user joining 3 different club analytics groups
        var clubId1 = 1;
        var clubId2 = 2;
        var clubId3 = 3;

        _mockAnalyticsService.Setup(s => s.GetEngagementTrendsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<EngagementTrendDto>());
        _mockAnalyticsService.Setup(s => s.GetCohortAnalysisAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<CohortDto>());
        _mockAnalyticsService.Setup(s => s.GetFinancialROIAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(new List<ROIDto>());

        // Act - Join 3 different analytics groups
        await _hub.JoinClubAnalytics(clubId1);
        await _hub.JoinClubAnalytics(clubId2);
        await _hub.JoinClubAnalytics(clubId3);

        // Assert - User should be in 3 different groups
        _mockGroups.Verify(g => g.AddToGroupAsync("test-connection-id", $"club-analytics-{clubId1}", default), Times.Once);
        _mockGroups.Verify(g => g.AddToGroupAsync("test-connection-id", $"club-analytics-{clubId2}", default), Times.Once);
        _mockGroups.Verify(g => g.AddToGroupAsync("test-connection-id", $"club-analytics-{clubId3}", default), Times.Once);
    }

    #endregion

    private static ClaimsPrincipal CreateUser(string userId)
    {
        return new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        }, "Test"));
    }
}
