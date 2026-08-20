using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services.Wrappers;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.TierValidation;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.DTOs.Analytics;
using GatherGrove.Domain.Models;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace GatherGrove.Application.Tests.Services;

public class TierAwareAnalyticsServiceTests
{
    private Mock<GatherGrove.Application.Services.IAdvancedAnalyticsService> _mockInnerService;
    private Mock<ITierGateService> _mockTierGateService;
    private Mock<ILogger<TierAwareAnalyticsService>> _mockLogger;
    private TierAwareAnalyticsService _service;

    [SetUp]
    public void Setup()
    {
        _mockInnerService = new Mock<GatherGrove.Application.Services.IAdvancedAnalyticsService>();
        _mockTierGateService = new Mock<ITierGateService>();
        _mockLogger = new Mock<ILogger<TierAwareAnalyticsService>>();
        _service = new TierAwareAnalyticsService(_mockInnerService.Object, _mockTierGateService.Object, _mockLogger.Object);
    }

    [Test]
    public async Task GetMemberSegmentationAsync_WithUnlimitedTier_ReturnsCorrectType()
    {
        // Arrange
        var clubId = 1;
        var segmentationType = "engagement";
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var userId = 123;
        var expectedResult = new MemberSegmentationAnalysis
        {
            Segments = new List<MemberEngagementPattern>(),
            SegmentSizes = new Dictionary<string, int>(),
            SegmentCharacteristics = new Dictionary<string, string>(),
            ActionableInsights = new List<string>(),
            RecommendedActions = new Dictionary<string, List<string>>()
        };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetMemberSegmentationAsync(clubId, segmentationType, startDate, endDate, userId))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.GetMemberSegmentationAsync(clubId, segmentationType, startDate, endDate, userId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.InstanceOf<MemberSegmentationAnalysis>());
        Assert.That(result, Is.EqualTo(expectedResult));
        _mockInnerService.Verify(x => x.GetMemberSegmentationAsync(clubId, segmentationType, startDate, endDate, userId), Times.Once);
        _mockTierGateService.Verify(x => x.ValidateUnlimitedAccessAsync(clubId), Times.AtLeast(1));
    }

    [Test]
    public async Task GetMemberSegmentationAsync_WithBasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var clubId = 1;
        var segmentationType = "engagement";
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var userId = 123;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        try
        {
            var result = await _service.GetMemberSegmentationAsync(clubId, segmentationType, startDate, endDate, userId);
            Assert.Fail($"Expected UnauthorizedAccessException but method completed successfully with result: {result}");
        }
        catch (UnauthorizedAccessException ex)
        {
            Assert.That(ex.Message, Does.Contain("requires Expand tier subscription"));
            _mockInnerService.Verify(x => x.GetMemberSegmentationAsync(
                It.IsAny<int>(), It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<int>()),
                Times.Never);
        }
    }

    [Test]
    public async Task GetMemberSegmentationAsync_ValidatesResourceAllocation()
    {
        // Arrange
        var clubId = 1;
        var segmentationType = "engagement";
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var userId = 123;
        var expectedResult = new MemberSegmentationAnalysis
        {
            Segments = new List<MemberEngagementPattern>(),
            SegmentSizes = new Dictionary<string, int>(),
            SegmentCharacteristics = new Dictionary<string, string>(),
            ActionableInsights = new List<string>(),
            RecommendedActions = new Dictionary<string, List<string>>()
        };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetMemberSegmentationAsync(clubId, segmentationType, startDate, endDate, userId))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.GetMemberSegmentationAsync(clubId, segmentationType, startDate, endDate, userId);

        // Assert
        _mockTierGateService.Verify(x => x.ValidateResourceAllocationAsync(It.Is<ResourceAllocationRequest>(r =>
            r.ClubId == clubId &&
            r.AnalyticsQueries > 0 &&
            r.CacheSize > 0 &&
            r.BackgroundProcessing == true
        )), Times.Once);
    }

    #region GetEngagementTrendsAsync Tests

    [Test]
    public async Task GetEngagementTrendsAsync_WithUnlimitedTier_ReturnsData()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var expectedResult = new List<EngagementTrendDto>();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetEngagementTrendsAsync(clubId, startDate, endDate))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.GetEngagementTrendsAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        _mockInnerService.Verify(x => x.GetEngagementTrendsAsync(clubId, startDate, endDate), Times.Once);
    }

    [Test]
    public async Task GetEngagementTrendsAsync_WithBasicTier_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.GetEngagementTrendsAsync(clubId, startDate, endDate));

        Assert.That(ex!.Message, Does.Contain("Expand tier"));
        _mockInnerService.Verify(x => x.GetEngagementTrendsAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()), Times.Never);
    }

    [Test]
    public async Task GetEngagementTrendsAsync_LegacyOverload_WithUnlimitedTier_ReturnsData()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var daysBack = 30;
        var expectedResult = new AdvancedEventEngagementTrends();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetEngagementTrendsAsync(clubId, userId, daysBack))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.GetEngagementTrendsAsync(clubId, userId, daysBack);

        // Assert
        Assert.That(result, Is.Not.Null);
        _mockInnerService.Verify(x => x.GetEngagementTrendsAsync(clubId, userId, daysBack), Times.Once);
    }

    [Test]
    public async Task GetEngagementTrendsAsync_LegacyOverload_WithBasicTier_ThrowsException()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var daysBack = 30;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.GetEngagementTrendsAsync(clubId, userId, daysBack));

        Assert.That(ex!.Message, Does.Contain("Expand tier"));
    }

    #endregion

    #region GetCohortAnalysisAsync Tests

    [Test]
    public async Task GetCohortAnalysisAsync_WithUnlimitedTier_ReturnsData()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var expectedResult = new List<CohortDto>();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetCohortAnalysisAsync(clubId, startDate, endDate))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.GetCohortAnalysisAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        _mockInnerService.Verify(x => x.GetCohortAnalysisAsync(clubId, startDate, endDate), Times.Once);
    }

    [Test]
    public async Task GetCohortAnalysisAsync_WithBasicTier_ThrowsException()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.GetCohortAnalysisAsync(clubId, startDate, endDate));

        Assert.That(ex!.Message, Does.Contain("Expand tier"));
    }

    [Test]
    public async Task GetCohortAnalysisAsync_ValidatesResourceAllocation()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetCohortAnalysisAsync(clubId, startDate, endDate))
            .ReturnsAsync(new List<CohortDto>());

        // Act
        await _service.GetCohortAnalysisAsync(clubId, startDate, endDate);

        // Assert
        _mockTierGateService.Verify(x => x.ValidateResourceAllocationAsync(It.Is<ResourceAllocationRequest>(r =>
            r.ClubId == clubId &&
            r.AnalyticsQueries == 3 &&
            r.BackgroundProcessing == true
        )), Times.Once);
    }

    #endregion

    #region GetFinancialROIAsync Tests

    [Test]
    public async Task GetFinancialROIAsync_WithUnlimitedTier_ReturnsData()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var expectedResult = new List<ROIDto>();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetFinancialROIAsync(clubId, startDate, endDate))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.GetFinancialROIAsync(clubId, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        _mockInnerService.Verify(x => x.GetFinancialROIAsync(clubId, startDate, endDate), Times.Once);
    }

    [Test]
    public async Task GetFinancialROIAsync_WithBasicTier_ThrowsException()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.GetFinancialROIAsync(clubId, startDate, endDate));

        Assert.That(ex!.Message, Does.Contain("Expand tier"));
    }

    [Test]
    public async Task GetFinancialROIAsync_ValidatesResourceAllocation_MostIntensive()
    {
        // Arrange
        var clubId = 1;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetFinancialROIAsync(clubId, startDate, endDate))
            .ReturnsAsync(new List<ROIDto>());

        // Act
        await _service.GetFinancialROIAsync(clubId, startDate, endDate);

        // Assert - Financial ROI has the highest resource requirements
        _mockTierGateService.Verify(x => x.ValidateResourceAllocationAsync(It.Is<ResourceAllocationRequest>(r =>
            r.ClubId == clubId &&
            r.AnalyticsQueries == 5 && // Most intensive
            r.CacheSize == 300 &&
            r.BackgroundProcessing == true
        )), Times.Once);
    }

    [Test]
    public async Task CalculateROIMetricsAsync_WithUnlimitedTier_ReturnsMetrics()
    {
        // Arrange
        var clubId = 1;
        var periodMonths = 6;
        var expectedResult = new EventROIMetrics();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.CalculateROIMetricsAsync(clubId, periodMonths))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.CalculateROIMetricsAsync(clubId, periodMonths);

        // Assert
        Assert.That(result, Is.Not.Null);
        _mockInnerService.Verify(x => x.CalculateROIMetricsAsync(clubId, periodMonths), Times.Once);
    }

    [Test]
    public async Task CalculateROIMetricsAsync_WithBasicTier_ThrowsException()
    {
        // Arrange
        var clubId = 1;
        var periodMonths = 6;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.CalculateROIMetricsAsync(clubId, periodMonths));

        Assert.That(ex!.Message, Does.Contain("Expand tier"));
    }

    #endregion

    #region CompareEventsAsync Tests

    [Test]
    public async Task CompareEventsAsync_WithUnlimitedTier_ReturnsData()
    {
        // Arrange
        var clubId = 1;
        var eventIds = new List<int> { 1, 2, 3 };
        var expectedResult = new List<EventComparisonDto>();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.CompareEventsAsync(clubId, eventIds))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.CompareEventsAsync(clubId, eventIds);

        // Assert
        Assert.That(result, Is.Not.Null);
        _mockInnerService.Verify(x => x.CompareEventsAsync(clubId, eventIds), Times.Once);
    }

    [Test]
    public async Task CompareEventsAsync_WithBasicTier_ThrowsException()
    {
        // Arrange
        var clubId = 1;
        var eventIds = new List<int> { 1, 2, 3 };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.CompareEventsAsync(clubId, eventIds));

        Assert.That(ex!.Message, Does.Contain("Expand tier"));
    }

    [Test]
    public async Task CompareEventsAsync_ResourceAllocation_ScalesWithEventCount()
    {
        // Arrange
        var clubId = 1;
        var eventIds = new List<int> { 1, 2, 3, 4, 5 };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.CompareEventsAsync(clubId, eventIds))
            .ReturnsAsync(new List<EventComparisonDto>());

        // Act
        await _service.CompareEventsAsync(clubId, eventIds);

        // Assert - Resource allocation scales with event count
        _mockTierGateService.Verify(x => x.ValidateResourceAllocationAsync(It.Is<ResourceAllocationRequest>(r =>
            r.ClubId == clubId &&
            r.AnalyticsQueries == eventIds.Count && // One query per event
            r.CacheSize == 50 * eventIds.Count
        )), Times.Once);
    }

    #endregion

    #region ExportDataAsync Tests

    [Test]
    public async Task ExportDataAsync_WithUnlimitedTier_ReturnsExportResponse()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var dataType = "members";
        var format = "csv";
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var expectedResult = new ExportResponseDto();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.ExportDataAsync(clubId, userId, dataType, format, startDate, endDate))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.ExportDataAsync(clubId, userId, dataType, format, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        _mockInnerService.Verify(x => x.ExportDataAsync(clubId, userId, dataType, format, startDate, endDate), Times.Once);
    }

    [Test]
    public async Task ExportDataAsync_WithBasicTier_ThrowsException()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var dataType = "members";
        var format = "csv";
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.ExportDataAsync(clubId, userId, dataType, format, startDate, endDate));

        Assert.That(ex!.Message, Does.Contain("Expand tier"));
    }

    [Test]
    public async Task ExportDataAsync_ValidatesResourceAllocation_HighestRequirements()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var dataType = "members";
        var format = "csv";
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockTierGateService.Setup(x => x.ValidateResourceAllocationAsync(It.IsAny<ResourceAllocationRequest>()))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.ExportDataAsync(clubId, userId, dataType, format, startDate, endDate))
            .ReturnsAsync(new ExportResponseDto());

        // Act
        await _service.ExportDataAsync(clubId, userId, dataType, format, startDate, endDate);

        // Assert - Export has highest resource requirements
        _mockTierGateService.Verify(x => x.ValidateResourceAllocationAsync(It.Is<ResourceAllocationRequest>(r =>
            r.ClubId == clubId &&
            r.AnalyticsQueries == 10 && // Most queries
            r.CacheSize == 500 && // Largest cache
            r.BackgroundProcessing == true
        )), Times.Once);
    }

    #endregion

    #region PrecomputeAnalyticsAsync Tests

    [Test]
    public async Task PrecomputeAnalyticsAsync_WithUnlimitedTier_CallsInnerService()
    {
        // Arrange
        var clubId = 1;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);

        // Act
        await _service.PrecomputeAnalyticsAsync(clubId);

        // Assert
        _mockInnerService.Verify(x => x.PrecomputeAnalyticsAsync(clubId), Times.Once);
    }

    [Test]
    public async Task PrecomputeAnalyticsAsync_WithBasicTier_SkipsSilently()
    {
        // Arrange
        var clubId = 1;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act - Should not throw, just skip
        await _service.PrecomputeAnalyticsAsync(clubId);

        // Assert - Inner service should not be called
        _mockInnerService.Verify(x => x.PrecomputeAnalyticsAsync(It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region GetCachedAnalyticsAsync Tests

    [Test]
    public async Task GetCachedAnalyticsAsync_WithUnlimitedTier_ReturnsCachedData()
    {
        // Arrange
        var clubId = 1;
        var dataType = "engagement";
        var expectedData = new byte[] { 1, 2, 3, 4, 5 };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetCachedAnalyticsAsync(clubId, dataType))
            .ReturnsAsync(expectedData);

        // Act
        var result = await _service.GetCachedAnalyticsAsync(clubId, dataType);

        // Assert
        Assert.That(result, Is.EqualTo(expectedData));
        _mockInnerService.Verify(x => x.GetCachedAnalyticsAsync(clubId, dataType), Times.Once);
    }

    [Test]
    public async Task GetCachedAnalyticsAsync_WithBasicTier_ReturnsEmptyArray()
    {
        // Arrange
        var clubId = 1;
        var dataType = "engagement";

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act
        var result = await _service.GetCachedAnalyticsAsync(clubId, dataType);

        // Assert - Returns empty instead of throwing
        Assert.That(result, Is.Empty);
        _mockInnerService.Verify(x => x.GetCachedAnalyticsAsync(It.IsAny<int>(), It.IsAny<string>()), Times.Never);
    }

    #endregion

    #region GetEngagementTrendsWithUserAsync Tests

    [Test]
    public async Task GetEngagementTrendsWithUserAsync_WithUnlimitedTier_ReturnsData()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var expectedResult = new EventEngagementTrends();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetEngagementTrendsWithUserAsync(clubId, userId, startDate, endDate))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.GetEngagementTrendsWithUserAsync(clubId, userId, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
        _mockInnerService.Verify(x => x.GetEngagementTrendsWithUserAsync(clubId, userId, startDate, endDate), Times.Once);
    }

    [Test]
    public async Task GetEngagementTrendsWithUserAsync_WithBasicTier_ThrowsException()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.GetEngagementTrendsWithUserAsync(clubId, userId, startDate, endDate));

        Assert.That(ex!.Message, Does.Contain("Expand tier"));
    }

    #endregion

    #region GetCohortAnalysisWithUserAsync Tests

    [Test]
    public async Task GetCohortAnalysisWithUserAsync_WithUnlimitedTier_ReturnsData()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var expectedResult = new CohortAnalysisResponse();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetCohortAnalysisWithUserAsync(clubId, userId, startDate, endDate))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.GetCohortAnalysisWithUserAsync(clubId, userId, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
    }

    [Test]
    public async Task GetCohortAnalysisWithUserAsync_WithBasicTier_ThrowsException()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.GetCohortAnalysisWithUserAsync(clubId, userId, startDate, endDate));
    }

    #endregion

    #region GetFinancialROIWithUserAsync Tests

    [Test]
    public async Task GetFinancialROIWithUserAsync_WithUnlimitedTier_ReturnsData()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var expectedResult = new FinancialRoiAnalysis();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.GetFinancialROIWithUserAsync(clubId, userId, startDate, endDate))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.GetFinancialROIWithUserAsync(clubId, userId, startDate, endDate);

        // Assert
        Assert.That(result, Is.Not.Null);
    }

    [Test]
    public async Task GetFinancialROIWithUserAsync_WithBasicTier_ThrowsException()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.GetFinancialROIWithUserAsync(clubId, userId, startDate, endDate));
    }

    #endregion

    #region CompareEventPerformanceAsync Tests

    [Test]
    public async Task CompareEventPerformanceAsync_WithUnlimitedTier_ReturnsData()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var eventIds = new List<int> { 1, 2, 3 };
        var expectedResult = new EventComparisonResponse();

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);
        _mockInnerService.Setup(x => x.CompareEventPerformanceAsync(eventIds, clubId, userId))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _service.CompareEventPerformanceAsync(eventIds, clubId, userId);

        // Assert
        Assert.That(result, Is.Not.Null);
    }

    [Test]
    public async Task CompareEventPerformanceAsync_WithBasicTier_ThrowsException()
    {
        // Arrange
        var clubId = 1;
        var userId = 123;
        var eventIds = new List<int> { 1, 2, 3 };

        _mockTierGateService.Setup(x => x.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act & Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.CompareEventPerformanceAsync(eventIds, clubId, userId));
    }

    #endregion
}
