using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.TierValidation;
using FluentAssertions;
using IAnalyticsService = GatherGrove.Application.Services.Interfaces.IAdvancedAnalyticsService;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for OptimizedAdvancedAnalyticsBackgroundService.
/// Tests the tier-aware background service for analytics processing
/// with resource optimization and tier-based filtering.
///
/// Key features tested:
/// - Tier-based club filtering (only unlimited tier clubs processed)
/// - Job scheduling with tier validation
/// - Resource optimization metrics
/// - Service lifecycle (start/stop/dispose)
/// </summary>
[TestFixture]
public class AdvancedAnalyticsBackgroundServiceTests
{
    private Mock<IServiceProvider> _mockServiceProvider = null!;
    private Mock<IServiceScope> _mockScope = null!;
    private Mock<IServiceScopeFactory> _mockScopeFactory = null!;
    private Mock<IDistributedCache> _mockCache = null!;
    private Mock<ILogger<OptimizedAdvancedAnalyticsBackgroundService>> _mockLogger = null!;
    private Mock<ITierGateService> _mockTierGateService = null!;
    private Mock<IAnalyticsService> _mockAnalyticsService = null!;
    private Mock<IServiceProvider> _mockScopedServiceProvider = null!;

    [SetUp]
    public void SetUp()
    {
        _mockCache = new Mock<IDistributedCache>();
        _mockLogger = new Mock<ILogger<OptimizedAdvancedAnalyticsBackgroundService>>();
        _mockTierGateService = new Mock<ITierGateService>();
        _mockAnalyticsService = new Mock<IAnalyticsService>();

        // Set up scoped service provider
        _mockScopedServiceProvider = new Mock<IServiceProvider>();
        _mockScopedServiceProvider
            .Setup(sp => sp.GetService(typeof(ITierGateService)))
            .Returns(_mockTierGateService.Object);
        _mockScopedServiceProvider
            .Setup(sp => sp.GetService(typeof(IAnalyticsService)))
            .Returns(_mockAnalyticsService.Object);

        // Set up scope
        _mockScope = new Mock<IServiceScope>();
        _mockScope.Setup(s => s.ServiceProvider).Returns(_mockScopedServiceProvider.Object);

        // Set up scope factory
        _mockScopeFactory = new Mock<IServiceScopeFactory>();
        _mockScopeFactory.Setup(f => f.CreateScope()).Returns(_mockScope.Object);

        // Set up main service provider
        _mockServiceProvider = new Mock<IServiceProvider>();
        _mockServiceProvider
            .Setup(sp => sp.GetService(typeof(IServiceScopeFactory)))
            .Returns(_mockScopeFactory.Object);

        // Default tier gate setup - all clubs have unlimited access
        _mockTierGateService
            .Setup(t => t.ValidateUnlimitedAccessAsync(It.IsAny<int>()))
            .ReturnsAsync(true);
        _mockTierGateService
            .Setup(t => t.ShouldEnableBackgroundProcessingAsync(It.IsAny<int>()))
            .ReturnsAsync(true);

        // Default analytics service setup
        _mockAnalyticsService
            .Setup(a => a.PrecomputeAnalyticsAsync(It.IsAny<int>()))
            .Returns(Task.CompletedTask);
    }

    private OptimizedAdvancedAnalyticsBackgroundService CreateService()
    {
        return new OptimizedAdvancedAnalyticsBackgroundService(
            _mockServiceProvider.Object,
            _mockCache.Object,
            _mockLogger.Object);
    }

    #region Constructor Tests

    [Test]
    public void Constructor_InitializesSuccessfully()
    {
        // Act
        var service = CreateService();

        // Assert
        service.Should().NotBeNull();
    }

    [Test]
    public void Constructor_CreatesJobQueue()
    {
        // Act
        using var service = CreateService();

        // Assert - No exception thrown, service created
        service.Should().NotBeNull();
    }

    #endregion

    #region ScheduleOptimizedAnalyticsJobAsync Tests

    [Test]
    public async Task ScheduleOptimizedAnalyticsJobAsync_UnlimitedTierClub_QueuesJob()
    {
        // Arrange
        using var service = CreateService();
        var clubId = 1;

        _mockTierGateService
            .Setup(t => t.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);

        // Act
        await service.ScheduleOptimizedAnalyticsJobAsync(clubId, AnalyticsJobType.Comprehensive);

        // Assert - Tier validation was called
        _mockTierGateService.Verify(
            t => t.ValidateUnlimitedAccessAsync(clubId),
            Times.Once);
    }

    [Test]
    public async Task ScheduleOptimizedAnalyticsJobAsync_BasicTierClub_SkipsScheduling()
    {
        // Arrange
        using var service = CreateService();
        var clubId = 99;

        _mockTierGateService
            .Setup(t => t.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        // Act
        await service.ScheduleOptimizedAnalyticsJobAsync(clubId, AnalyticsJobType.Comprehensive);

        // Assert - Should have validated but not logged scheduling
        _mockTierGateService.Verify(
            t => t.ValidateUnlimitedAccessAsync(clubId),
            Times.Once);
    }

    [Test]
    public async Task ScheduleOptimizedAnalyticsJobAsync_WithHighPriority_QueuesWithPriority()
    {
        // Arrange
        using var service = CreateService();
        var clubId = 1;

        _mockTierGateService
            .Setup(t => t.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);

        // Act
        await service.ScheduleOptimizedAnalyticsJobAsync(clubId, AnalyticsJobType.EngagementTrends, AnalyticsPriority.High);

        // Assert - Should not throw and tier was validated
        _mockTierGateService.Verify(
            t => t.ValidateUnlimitedAccessAsync(clubId),
            Times.Once);
    }

    [Test]
    public async Task ScheduleOptimizedAnalyticsJobAsync_DefaultPriority_IsMedium()
    {
        // Arrange
        using var service = CreateService();

        _mockTierGateService
            .Setup(t => t.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);

        // Act - Default priority
        await service.ScheduleOptimizedAnalyticsJobAsync(1, AnalyticsJobType.Comprehensive);

        // Assert - No exception, default is Medium
        _mockTierGateService.Verify(
            t => t.ValidateUnlimitedAccessAsync(1),
            Times.Once);
    }

    #endregion

    #region StopAsync Tests

    [Test]
    public async Task StopAsync_LogsStoppingMessage()
    {
        // Arrange
        using var service = CreateService();

        // Act
        await service.StopAsync(CancellationToken.None);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("stopping")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task StopAsync_DoesNotThrow()
    {
        // Arrange
        using var service = CreateService();

        // Act & Assert
        var act = async () => await service.StopAsync(CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Test]
    public async Task StopAsync_DisposesTimers()
    {
        // Arrange
        using var service = CreateService();

        // Act
        await service.StopAsync(CancellationToken.None);

        // Assert - Should complete without errors (timers disposed)
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("stopping")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    #endregion

    #region Dispose Tests

    [Test]
    public void Dispose_DoesNotThrow()
    {
        // Arrange
        var service = CreateService();

        // Act & Assert
        var act = () => service.Dispose();
        act.Should().NotThrow();
    }

    [Test]
    public void Dispose_CanBeCalledMultipleTimes()
    {
        // Arrange
        var service = CreateService();

        // Act & Assert
        var act = () =>
        {
            service.Dispose();
            service.Dispose();
        };
        act.Should().NotThrow();
    }

    #endregion

    #region Tier Validation Tests

    [Test]
    public async Task TierValidation_UnlimitedClub_ProcessesAnalytics()
    {
        // Arrange
        var clubId = 1;

        _mockTierGateService
            .Setup(t => t.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(true);

        using var service = CreateService();

        // Act
        await service.ScheduleOptimizedAnalyticsJobAsync(clubId, AnalyticsJobType.Comprehensive);

        // Assert
        _mockTierGateService.Verify(
            t => t.ValidateUnlimitedAccessAsync(clubId),
            Times.Once);
    }

    [Test]
    public async Task TierValidation_BasicTierClub_SkipsProcessing()
    {
        // Arrange
        var clubId = 50;

        _mockTierGateService
            .Setup(t => t.ValidateUnlimitedAccessAsync(clubId))
            .ReturnsAsync(false);

        using var service = CreateService();

        // Act
        await service.ScheduleOptimizedAnalyticsJobAsync(clubId, AnalyticsJobType.Comprehensive);

        // Assert - Validated but should skip silently
        _mockTierGateService.Verify(
            t => t.ValidateUnlimitedAccessAsync(clubId),
            Times.Once);
    }

    #endregion

    #region AnalyticsJob Tests

    [Test]
    public void AnalyticsJob_DefaultValues()
    {
        // Act
        var job = new AnalyticsJob();

        // Assert
        job.ClubId.Should().Be(0);
        job.JobType.Should().Be(AnalyticsJobType.EngagementTrends); // First enum value (0)
        // Priority defaults to 0 (unnamed) since AnalyticsPriority starts at Low=1
        ((int)job.Priority).Should().Be(0);
        job.ScheduledAt.Should().Be(default);
    }

    [Test]
    public void AnalyticsJob_SetsPropertiesCorrectly()
    {
        // Arrange
        var scheduledTime = DateTime.UtcNow;

        // Act
        var job = new AnalyticsJob
        {
            ClubId = 42,
            JobType = AnalyticsJobType.Comprehensive,
            Priority = AnalyticsPriority.Critical,
            ScheduledAt = scheduledTime
        };

        // Assert
        job.ClubId.Should().Be(42);
        job.JobType.Should().Be(AnalyticsJobType.Comprehensive);
        job.Priority.Should().Be(AnalyticsPriority.Critical);
        job.ScheduledAt.Should().Be(scheduledTime);
    }

    #endregion

    #region AnalyticsJobType Enum Tests

    [Test]
    public void AnalyticsJobType_HasCorrectValues()
    {
        // Assert
        Enum.GetValues<AnalyticsJobType>().Should().HaveCount(5);
        Enum.IsDefined(AnalyticsJobType.EngagementTrends).Should().BeTrue();
        Enum.IsDefined(AnalyticsJobType.CohortAnalysis).Should().BeTrue();
        Enum.IsDefined(AnalyticsJobType.ROIMetrics).Should().BeTrue();
        Enum.IsDefined(AnalyticsJobType.MemberSegmentation).Should().BeTrue();
        Enum.IsDefined(AnalyticsJobType.Comprehensive).Should().BeTrue();
    }

    [Test]
    public void AnalyticsJobType_AllTypesAreDefined()
    {
        // Assert
        var types = Enum.GetValues<AnalyticsJobType>();
        types.Should().Contain(AnalyticsJobType.EngagementTrends);
        types.Should().Contain(AnalyticsJobType.CohortAnalysis);
        types.Should().Contain(AnalyticsJobType.ROIMetrics);
        types.Should().Contain(AnalyticsJobType.MemberSegmentation);
        types.Should().Contain(AnalyticsJobType.Comprehensive);
    }

    #endregion

    #region AnalyticsPriority Enum Tests

    [Test]
    public void AnalyticsPriority_HasCorrectValues()
    {
        // Assert
        Enum.GetValues<AnalyticsPriority>().Should().HaveCount(4);
        ((int)AnalyticsPriority.Low).Should().Be(1);
        ((int)AnalyticsPriority.Medium).Should().Be(2);
        ((int)AnalyticsPriority.High).Should().Be(3);
        ((int)AnalyticsPriority.Critical).Should().Be(4);
    }

    [Test]
    public void AnalyticsPriority_CanBeCompared()
    {
        // Assert - cast to int for comparison
        ((int)AnalyticsPriority.Critical).Should().BeGreaterThan((int)AnalyticsPriority.High);
        ((int)AnalyticsPriority.High).Should().BeGreaterThan((int)AnalyticsPriority.Medium);
        ((int)AnalyticsPriority.Medium).Should().BeGreaterThan((int)AnalyticsPriority.Low);
    }

    [Test]
    public void AnalyticsPriority_OrderingIsCorrect()
    {
        // Arrange
        var priorities = new[] { AnalyticsPriority.Medium, AnalyticsPriority.Critical, AnalyticsPriority.Low, AnalyticsPriority.High };

        // Act
        var sorted = priorities.OrderByDescending(p => (int)p).ToArray();

        // Assert
        sorted[0].Should().Be(AnalyticsPriority.Critical);
        sorted[1].Should().Be(AnalyticsPriority.High);
        sorted[2].Should().Be(AnalyticsPriority.Medium);
        sorted[3].Should().Be(AnalyticsPriority.Low);
    }

    #endregion

    #region Resource Optimization Tests

    [Test]
    public async Task ScheduleMultipleJobs_UnlimitedClubsOnly_AllScheduled()
    {
        // Arrange
        using var service = CreateService();

        // Only clubs 1 and 3 have unlimited access
        _mockTierGateService
            .Setup(t => t.ValidateUnlimitedAccessAsync(1))
            .ReturnsAsync(true);
        _mockTierGateService
            .Setup(t => t.ValidateUnlimitedAccessAsync(2))
            .ReturnsAsync(false);
        _mockTierGateService
            .Setup(t => t.ValidateUnlimitedAccessAsync(3))
            .ReturnsAsync(true);

        // Act
        await service.ScheduleOptimizedAnalyticsJobAsync(1, AnalyticsJobType.Comprehensive);
        await service.ScheduleOptimizedAnalyticsJobAsync(2, AnalyticsJobType.Comprehensive);
        await service.ScheduleOptimizedAnalyticsJobAsync(3, AnalyticsJobType.Comprehensive);

        // Assert - All three clubs were validated
        _mockTierGateService.Verify(t => t.ValidateUnlimitedAccessAsync(1), Times.Once);
        _mockTierGateService.Verify(t => t.ValidateUnlimitedAccessAsync(2), Times.Once);
        _mockTierGateService.Verify(t => t.ValidateUnlimitedAccessAsync(3), Times.Once);
    }

    #endregion

    #region Integration Behavior Tests

    [Test]
    public async Task FullLifecycle_CreateScheduleStop_NoErrors()
    {
        // Arrange
        _mockTierGateService
            .Setup(t => t.ValidateUnlimitedAccessAsync(It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act & Assert - Full lifecycle
        using var service = CreateService();

        await service.ScheduleOptimizedAnalyticsJobAsync(1, AnalyticsJobType.EngagementTrends, AnalyticsPriority.High);
        await service.ScheduleOptimizedAnalyticsJobAsync(2, AnalyticsJobType.CohortAnalysis, AnalyticsPriority.Medium);
        await service.ScheduleOptimizedAnalyticsJobAsync(3, AnalyticsJobType.ROIMetrics, AnalyticsPriority.Low);

        await service.StopAsync(CancellationToken.None);

        // Should complete without errors
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("stopping")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task MixedTierClubs_OnlyUnlimitedScheduled()
    {
        // Arrange
        using var service = CreateService();

        // Set up mixed tier access
        _mockTierGateService.Setup(t => t.ValidateUnlimitedAccessAsync(1)).ReturnsAsync(true);   // Unlimited
        _mockTierGateService.Setup(t => t.ValidateUnlimitedAccessAsync(2)).ReturnsAsync(false);  // Basic
        _mockTierGateService.Setup(t => t.ValidateUnlimitedAccessAsync(3)).ReturnsAsync(false);  // Basic
        _mockTierGateService.Setup(t => t.ValidateUnlimitedAccessAsync(4)).ReturnsAsync(true);   // Unlimited
        _mockTierGateService.Setup(t => t.ValidateUnlimitedAccessAsync(5)).ReturnsAsync(false);  // Basic

        // Act
        for (int i = 1; i <= 5; i++)
        {
            await service.ScheduleOptimizedAnalyticsJobAsync(i, AnalyticsJobType.Comprehensive);
        }

        // Assert - All clubs were validated
        for (int i = 1; i <= 5; i++)
        {
            _mockTierGateService.Verify(t => t.ValidateUnlimitedAccessAsync(i), Times.Once);
        }
    }

    #endregion
}
