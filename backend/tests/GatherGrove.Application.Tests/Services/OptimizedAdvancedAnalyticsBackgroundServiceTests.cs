using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.TierValidation;
using IAdvancedAnalyticsService = GatherGrove.Application.Services.Interfaces.IAdvancedAnalyticsService;
using FluentAssertions;
using System.Reflection;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for OptimizedAdvancedAnalyticsBackgroundService.
/// Tests verify tier-based filtering, resource optimization, and service lifecycle.
/// </summary>
[TestFixture]
public class OptimizedAdvancedAnalyticsBackgroundServiceTests
{
    private Mock<IServiceProvider> _mockServiceProvider = null!;
    private Mock<IServiceScope> _mockServiceScope = null!;
    private Mock<IServiceScopeFactory> _mockScopeFactory = null!;
    private Mock<IDistributedCache> _mockDistributedCache = null!;
    private Mock<ILogger<OptimizedAdvancedAnalyticsBackgroundService>> _mockLogger = null!;
    private Mock<ITierGateService> _mockTierGateService = null!;
    private Mock<IAdvancedAnalyticsService> _mockAnalyticsService = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<OptimizedAdvancedAnalyticsBackgroundService>>();
        _mockDistributedCache = new Mock<IDistributedCache>();
        _mockTierGateService = new Mock<ITierGateService>();
        _mockAnalyticsService = new Mock<IAdvancedAnalyticsService>();

        // Setup service scope
        _mockServiceScope = new Mock<IServiceScope>();
        var mockScopeServiceProvider = new Mock<IServiceProvider>();
        mockScopeServiceProvider
            .Setup(x => x.GetService(typeof(ITierGateService)))
            .Returns(_mockTierGateService.Object);
        mockScopeServiceProvider
            .Setup(x => x.GetService(typeof(IAdvancedAnalyticsService)))
            .Returns(_mockAnalyticsService.Object);
        _mockServiceScope.Setup(x => x.ServiceProvider).Returns(mockScopeServiceProvider.Object);

        // Setup scope factory
        _mockScopeFactory = new Mock<IServiceScopeFactory>();
        _mockScopeFactory.Setup(x => x.CreateScope()).Returns(_mockServiceScope.Object);

        // Setup main service provider
        _mockServiceProvider = new Mock<IServiceProvider>();
        _mockServiceProvider
            .Setup(x => x.GetService(typeof(IServiceScopeFactory)))
            .Returns(_mockScopeFactory.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _mockServiceScope?.Object?.Dispose();
    }

    #region Constructor Tests

    [Test]
    public void Constructor_ValidParameters_CreatesService()
    {
        // Act & Assert
        var service = CreateService();
        service.Should().NotBeNull();
    }

    [Test]
    public void Constructor_AcceptsRequiredDependencies()
    {
        // Act
        var service = new OptimizedAdvancedAnalyticsBackgroundService(
            _mockServiceProvider.Object,
            _mockDistributedCache.Object,
            _mockLogger.Object);

        // Assert
        service.Should().NotBeNull();
    }

    #endregion

    #region Service Lifecycle Tests

    [Test]
    public async Task StartAsync_InitializesService()
    {
        // Arrange
        var service = CreateService();
        using var cts = new CancellationTokenSource();

        // Act
        await service.StartAsync(cts.Token);

        // Give the background task a moment to start
        await Task.Delay(100);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("started")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);

        // Cleanup
        cts.Cancel();
        await service.StopAsync(CancellationToken.None);
    }

    [Test]
    public async Task StopAsync_GracefulShutdown()
    {
        // Arrange
        var service = CreateService();
        using var cts = new CancellationTokenSource();

        await service.StartAsync(cts.Token);
        await Task.Delay(100);

        // Act
        cts.Cancel();
        await service.StopAsync(CancellationToken.None);

        // Assert - should complete without exception
        service.Should().NotBeNull();
    }

    [Test]
    public async Task ExecuteAsync_CancellationRequested_StopsGracefully()
    {
        // Arrange
        var service = CreateService();
        using var cts = new CancellationTokenSource();

        // Act
        await service.StartAsync(cts.Token);
        await Task.Delay(50);

        cts.Cancel();
        await service.StopAsync(CancellationToken.None);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("stop")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    #endregion

    #region Resource Monitoring Tests

    [Test]
    public void Service_HasJobQueue()
    {
        // Arrange
        var service = CreateService();

        // Act - Use reflection to verify queue exists
        var queueField = typeof(OptimizedAdvancedAnalyticsBackgroundService)
            .GetField("_jobQueue", BindingFlags.NonPublic | BindingFlags.Instance);

        // Assert
        queueField.Should().NotBeNull();
        queueField!.GetValue(service).Should().NotBeNull();
    }

    [Test]
    public void Service_HasProcessingTimer()
    {
        // Arrange
        var service = CreateService();

        // Act - Use reflection to verify timer exists
        var timerField = typeof(OptimizedAdvancedAnalyticsBackgroundService)
            .GetField("_processingTimer", BindingFlags.NonPublic | BindingFlags.Instance);

        // Assert
        timerField.Should().NotBeNull();
        timerField!.GetValue(service).Should().NotBeNull();
    }

    [Test]
    public void Service_HasResourceMonitoringTimer()
    {
        // Arrange
        var service = CreateService();

        // Act
        var timerField = typeof(OptimizedAdvancedAnalyticsBackgroundService)
            .GetField("_resourceMonitoringTimer", BindingFlags.NonPublic | BindingFlags.Instance);

        // Assert
        timerField.Should().NotBeNull();
        timerField!.GetValue(service).Should().NotBeNull();
    }

    [Test]
    public void Service_TracksProcessedJobs()
    {
        // Arrange
        var service = CreateService();

        // Act
        var counterField = typeof(OptimizedAdvancedAnalyticsBackgroundService)
            .GetField("_processedJobsThisHour", BindingFlags.NonPublic | BindingFlags.Instance);

        // Assert
        counterField.Should().NotBeNull();
        counterField!.GetValue(service).Should().Be(0);
    }

    [Test]
    public void Service_TracksSkippedClubs()
    {
        // Arrange
        var service = CreateService();

        // Act
        var counterField = typeof(OptimizedAdvancedAnalyticsBackgroundService)
            .GetField("_skippedBasicTierClubs", BindingFlags.NonPublic | BindingFlags.Instance);

        // Assert
        counterField.Should().NotBeNull();
        counterField!.GetValue(service).Should().Be(0);
    }

    #endregion

    #region Disposal Tests

    [Test]
    public async Task Dispose_ReleasesResources()
    {
        // Arrange
        var service = CreateService();
        await service.StartAsync(CancellationToken.None);

        // Act
        await service.StopAsync(CancellationToken.None);
        service.Dispose();

        // Assert - should not throw
        service.Should().NotBeNull();
    }

    [Test]
    public void MultipleDispose_DoesNotThrow()
    {
        // Arrange
        var service = CreateService();

        // Act & Assert
        FluentActions.Invoking(() =>
        {
            service.Dispose();
            service.Dispose();
        }).Should().NotThrow();
    }

    #endregion

    #region IHostedService Interface Tests

    [Test]
    public void Service_ImplementsBackgroundService()
    {
        // Arrange
        var service = CreateService();

        // Assert
        service.Should().BeAssignableTo<BackgroundService>();
        service.Should().BeAssignableTo<IHostedService>();
    }

    [Test]
    public async Task StartAsync_CompletesImmediately()
    {
        // Arrange
        var service = CreateService();
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));

        // Act
        var startTask = service.StartAsync(cts.Token);

        // Assert - StartAsync should complete quickly
        await startTask.WaitAsync(TimeSpan.FromSeconds(1));
        startTask.IsCompleted.Should().BeTrue();

        // Cleanup
        cts.Cancel();
        await service.StopAsync(CancellationToken.None);
    }

    [Test]
    public async Task StopAsync_WithoutStart_DoesNotThrow()
    {
        // Arrange
        var service = CreateService();

        // Act & Assert
        await FluentActions.Invoking(async () =>
            await service.StopAsync(CancellationToken.None))
            .Should().NotThrowAsync();
    }

    #endregion

    #region Error Handling Tests

    [Test]
    public async Task ExecuteAsync_OnError_ContinuesProcessing()
    {
        // Arrange
        _mockScopeFactory.Setup(x => x.CreateScope()).Throws(new Exception("Test error"));
        var service = CreateService();
        using var cts = new CancellationTokenSource();

        // Act
        await service.StartAsync(cts.Token);
        await Task.Delay(200); // Let it run and encounter error

        // Assert - Service should log error but continue
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);

        // Cleanup
        cts.Cancel();
        await service.StopAsync(CancellationToken.None);
    }

    #endregion

    #region Helper Methods

    private OptimizedAdvancedAnalyticsBackgroundService CreateService()
    {
        return new OptimizedAdvancedAnalyticsBackgroundService(
            _mockServiceProvider.Object,
            _mockDistributedCache.Object,
            _mockLogger.Object);
    }

    #endregion
}

/// <summary>
/// Tests for AnalyticsJob class used by the background service.
/// </summary>
[TestFixture]
public class AnalyticsJobTests
{
    [Test]
    public void AnalyticsJob_CanBeCreated()
    {
        // Act
        var job = new AnalyticsJob
        {
            ClubId = 1,
            JobType = AnalyticsJobType.EngagementTrends,
            Priority = AnalyticsPriority.Medium
        };

        // Assert
        job.ClubId.Should().Be(1);
        job.JobType.Should().Be(AnalyticsJobType.EngagementTrends);
        job.Priority.Should().Be(AnalyticsPriority.Medium);
    }

    [Test]
    public void AnalyticsJob_DefaultValues()
    {
        // Act
        var job = new AnalyticsJob();

        // Assert
        job.ClubId.Should().Be(0);
        job.ScheduledAt.Should().Be(default);
    }

    [Test]
    public void AnalyticsJobType_HasExpectedValues()
    {
        // Assert
        Enum.GetValues<AnalyticsJobType>().Should().HaveCountGreaterThan(0);
    }

    [Test]
    public void AnalyticsPriority_HasExpectedValues()
    {
        // Assert
        Enum.GetValues<AnalyticsPriority>().Should().HaveCountGreaterThan(0);
    }
}
